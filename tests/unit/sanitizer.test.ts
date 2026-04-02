import {
  sanitizeBase64,
  stripDataUriPrefix,
  removeWhitespace,
  removeInvalidChars,
  repairPadding,
} from '../../src/modules/sanitizer';
import { createLogger } from '../../src/modules/logger';
import { InvalidInputError } from '../../src/errors/InvalidInputError';

const logger = createLogger('test', false);

describe('sanitizer module', () => {
  // ── stripDataUriPrefix ────────────────────────────────────────────────────
  describe('stripDataUriPrefix', () => {
    it('removes a standard JPEG data URI prefix', () => {
      const input = 'data:image/jpeg;base64,/9j/abc123';
      expect(stripDataUriPrefix(input)).toBe('/9j/abc123');
    });

    it('removes a PNG data URI prefix', () => {
      const input = 'data:image/png;base64,iVBORw0KGgo=';
      expect(stripDataUriPrefix(input)).toBe('iVBORw0KGgo=');
    });

    it('removes a WebP data URI prefix', () => {
      const input = 'data:image/webp;base64,UklGRg==';
      expect(stripDataUriPrefix(input)).toBe('UklGRg==');
    });

    it('handles prefix with extra parameters', () => {
      const input = 'data:image/jpeg;charset=utf-8;base64,/9j/abc123';
      expect(stripDataUriPrefix(input)).toBe('/9j/abc123');
    });

    it('returns input unchanged when no prefix is present', () => {
      const input = '/9j/abc123==';
      expect(stripDataUriPrefix(input)).toBe('/9j/abc123==');
    });

    it('returns empty string unchanged', () => {
      expect(stripDataUriPrefix('')).toBe('');
    });
  });

  // ── removeWhitespace ──────────────────────────────────────────────────────
  describe('removeWhitespace', () => {
    it('removes newlines from line-wrapped base64', () => {
      const input = 'abc\ndef\nghi';
      expect(removeWhitespace(input)).toBe('abcdefghi');
    });

    it('removes spaces and tabs', () => {
      const input = 'abc def\tghi';
      expect(removeWhitespace(input)).toBe('abcdefghi');
    });

    it('returns clean string unchanged', () => {
      expect(removeWhitespace('abcdef==')).toBe('abcdef==');
    });
  });

  // ── repairPadding ─────────────────────────────────────────────────────────
  describe('repairPadding', () => {
    it('adds no padding when length is already multiple of 4', () => {
      expect(repairPadding('abcd')).toBe('abcd');
    });

    it('adds one = when remainder is 3', () => {
      expect(repairPadding('abc')).toBe('abc=');
    });

    it('adds two == when remainder is 2', () => {
      expect(repairPadding('ab')).toBe('ab==');
    });

    it('removes and re-adds padding correctly', () => {
      expect(repairPadding('abcd==')).toBe('abcd');
    });
  });

  // ── removeInvalidChars ────────────────────────────────────────────────────
  describe('removeInvalidChars', () => {
    it('removes non-base64 characters and re-pads', () => {
      // Insert invalid chars at known positions
      const dirty = 'abc!def@ghi';
      const clean = removeInvalidChars(dirty);
      // Should only contain valid base64 chars
      expect(clean).toMatch(/^[A-Za-z0-9+/=]*$/);
    });

    it('preserves valid base64 strings', () => {
      const valid = 'aGVsbG8=';
      expect(removeInvalidChars(valid)).toBe('aGVsbG8=');
    });
  });

  // ── sanitizeBase64 (full pipeline) ───────────────────────────────────────
  describe('sanitizeBase64', () => {
    it('handles a clean base64 string with no changes needed', () => {
      const input = 'aGVsbG8=';
      const result = sanitizeBase64(input, logger);
      expect(result).toBe('aGVsbG8=');
    });

    it('strips data URI prefix and cleans whitespace', () => {
      const raw = 'data:image/png;base64,iVBOR\nw0KGgo=';
      const result = sanitizeBase64(raw, logger);
      expect(result).not.toContain('data:image');
      expect(result).not.toContain('\n');
    });

    it('throws InvalidInputError when result after sanitization is empty', () => {
      // A string of only invalid base64 chars (everything stripped)
      const input = '!@#$%^&*()';
      expect(() => sanitizeBase64(input, logger)).toThrow(InvalidInputError);
    });

    it('repairs missing padding', () => {
      // 'hello' in base64 is 'aGVsbG8=' — strip padding
      const noPadding = 'aGVsbG8';
      const result = sanitizeBase64(noPadding, logger);
      expect(result).toBe('aGVsbG8=');
    });
  });
});
