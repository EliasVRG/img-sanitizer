import { cleanImage } from '../src/cleanImage';
import { InvalidInputError } from '../src/errors/InvalidInputError';
import { CorruptImageError } from '../src/errors/CorruptImageError';
import { UnsupportedTypeError } from '../src/errors/UnsupportedTypeError';
import { generateFixtures } from './fixtures/generate-fixtures';
import type { Fixtures } from './fixtures/generate-fixtures';

describe('cleanImage — integration tests', () => {
  let f: Fixtures;

  beforeAll(async () => {
    f = await generateFixtures();
  }, 30_000); // allow time for sharp to generate fixtures

  // ── 1. Valid Buffer input ─────────────────────────────────────────────────
  describe('valid inputs', () => {
    it('accepts a valid JPEG Buffer and returns a Buffer', async () => {
      const result = await cleanImage(f.validJpegBuffer, {
        inputType: 'buffer',
        outputType: 'buffer',
      });

      expect(Buffer.isBuffer(result.data)).toBe(true);
      expect(result.mime).toBe('image/jpeg');
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
      expect(result.wasRepaired).toBe(false);
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.finalSize).toBeGreaterThan(0);
    });

    it('accepts a valid PNG Buffer and returns a Buffer', async () => {
      const result = await cleanImage(f.validPngBuffer, {
        inputType: 'buffer',
        outputType: 'buffer',
      });

      expect(result.mime).toBe('image/png');
      expect(result.wasRepaired).toBe(false);
    });

    it('accepts a valid JPEG as a raw base64 string', async () => {
      const result = await cleanImage(f.validJpegBase64, {
        inputType: 'base64',
        outputType: 'buffer',
      });

      expect(Buffer.isBuffer(result.data)).toBe(true);
      expect(result.mime).toBe('image/jpeg');
      expect(result.wasRepaired).toBe(false);
    });

    it('accepts a base64 string with data:image prefix', async () => {
      const result = await cleanImage(f.validJpegBase64WithPrefix, {
        inputType: 'base64',
        outputType: 'buffer',
      });

      expect(Buffer.isBuffer(result.data)).toBe(true);
      expect(result.mime).toBe('image/jpeg');
    });

    it('outputs base64 without prefix', async () => {
      const result = await cleanImage(f.validJpegBuffer, {
        inputType: 'buffer',
        outputType: 'base64',
        includeDataPrefix: false,
      });

      expect(typeof result.data).toBe('string');
      expect(result.data as string).not.toContain('data:');
    });

    it('outputs base64 with data URI prefix', async () => {
      const result = await cleanImage(f.validJpegBuffer, {
        inputType: 'buffer',
        outputType: 'base64',
        includeDataPrefix: true,
      });

      expect(typeof result.data).toBe('string');
      expect(result.data as string).toMatch(/^data:image\/jpeg;base64,/);
    });
  });

  // ── 2. base64 with extra/invalid characters ───────────────────────────────
  describe('dirty base64 inputs', () => {
    it('cleans base64 with embedded whitespace/newlines', async () => {
      const result = await cleanImage(f.base64WithWhitespace, {
        inputType: 'base64',
        outputType: 'buffer',
      });

      expect(Buffer.isBuffer(result.data)).toBe(true);
      expect(result.mime).toBe('image/jpeg');
    });

    it('cleans base64 with interspersed invalid characters', async () => {
      const result = await cleanImage(f.base64WithInvalidChars, {
        inputType: 'base64',
        outputType: 'buffer',
      });

      expect(Buffer.isBuffer(result.data)).toBe(true);
      expect(result.mime).toBe('image/jpeg');
    });
  });

  // ── 3. Format normalization ───────────────────────────────────────────────
  describe('format normalization', () => {
    it('converts JPEG to WebP when normalizeFormat is webp', async () => {
      const result = await cleanImage(f.validJpegBuffer, {
        inputType: 'buffer',
        outputType: 'buffer',
        normalizeFormat: 'webp',
      });

      expect(result.mime).toBe('image/webp');
      expect(result.wasRepaired).toBe(false);
    });

    it('converts JPEG to PNG when normalizeFormat is png', async () => {
      const result = await cleanImage(f.validJpegBuffer, {
        inputType: 'buffer',
        outputType: 'buffer',
        normalizeFormat: 'png',
      });

      expect(result.mime).toBe('image/png');
    });

    it('keeps format unchanged when normalizeFormat is not set', async () => {
      const result = await cleanImage(f.validJpegBuffer, {
        inputType: 'buffer',
        outputType: 'buffer',
      });

      expect(result.mime).toBe('image/jpeg');
    });
  });

  // ── 4. Corrupt image handling ─────────────────────────────────────────────
  describe('corrupt image handling', () => {
    it('throws CorruptImageError for a truncated JPEG when repair is false', async () => {
      await expect(
        cleanImage(f.truncatedJpegBuffer, {
          inputType: 'buffer',
          outputType: 'buffer',
          repair: false,
        }),
      ).rejects.toThrow(CorruptImageError);
    });

    it('repairs a truncated JPEG when repair is true', async () => {
      // Corrupt the last 15% of bytes (tail corruption — preserves JPEG headers
      // and most scan data, giving sharp failOn:none enough to reconstruct)
      const corruptTail = Buffer.from(f.validJpegBuffer);
      const cutPoint = Math.floor(corruptTail.length * 0.85);
      corruptTail.fill(0xff, cutPoint); // fill tail with 0xFF (invalid scan data)

      const result = await cleanImage(corruptTail, {
        inputType: 'buffer',
        outputType: 'buffer',
        repair: true,
        normalizeFormat: 'jpeg',
      });

      expect(Buffer.isBuffer(result.data)).toBe(true);
      expect(result.wasRepaired).toBe(true);
    });

    it('throws UnsupportedTypeError for byte-altered JPEG (magic bytes destroyed)', async () => {
      // Zeroing the first 8 bytes destroys the JPEG magic bytes (FF D8 FF),
      // so file-type cannot detect any image format → UnsupportedTypeError
      const altered = Buffer.from(f.validJpegBuffer);
      altered.fill(0x00, 0, 8);

      await expect(
        cleanImage(altered, {
          inputType: 'buffer',
          outputType: 'buffer',
          repair: false,
        }),
      ).rejects.toThrow(UnsupportedTypeError);
    });
  });

  // ── 5. Invalid / non-image inputs ─────────────────────────────────────────
  describe('invalid inputs', () => {
    it('throws InvalidInputError for an empty Buffer', async () => {
      await expect(
        cleanImage(Buffer.alloc(0), {
          inputType: 'buffer',
          outputType: 'buffer',
        }),
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws InvalidInputError for an empty base64 string', async () => {
      await expect(
        cleanImage('', {
          inputType: 'base64',
          outputType: 'buffer',
        }),
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws UnsupportedTypeError for a Buffer of random bytes', async () => {
      await expect(
        cleanImage(f.randomBytesBuffer, {
          inputType: 'buffer',
          outputType: 'buffer',
        }),
      ).rejects.toThrow(UnsupportedTypeError);
    });

    it('throws UnsupportedTypeError for plain text base64', async () => {
      const textBase64 = Buffer.from('This is not an image').toString('base64');
      await expect(
        cleanImage(textBase64, {
          inputType: 'base64',
          outputType: 'buffer',
        }),
      ).rejects.toThrow(UnsupportedTypeError);
    });

    it('throws InvalidInputError for wrong inputType (passing Buffer as base64)', async () => {
      await expect(
        cleanImage(f.validJpegBuffer, {
          inputType: 'base64', // wrong: buffer passed as base64
          outputType: 'buffer',
        }),
      ).rejects.toThrow(InvalidInputError);
    });
  });

  // ── 6. Error code assertions ──────────────────────────────────────────────
  describe('error codes', () => {
    it('InvalidInputError has code INVALID_INPUT', async () => {
      try {
        await cleanImage(Buffer.alloc(0), { inputType: 'buffer', outputType: 'buffer' });
      } catch (err) {
        expect((err as InvalidInputError).code).toBe('INVALID_INPUT');
      }
    });

    it('UnsupportedTypeError has code UNSUPPORTED_TYPE', async () => {
      try {
        await cleanImage(f.randomBytesBuffer, { inputType: 'buffer', outputType: 'buffer' });
      } catch (err) {
        expect((err as UnsupportedTypeError).code).toBe('UNSUPPORTED_TYPE');
      }
    });

    it('CorruptImageError has code CORRUPT_IMAGE', async () => {
      try {
        await cleanImage(f.truncatedJpegBuffer, { inputType: 'buffer', outputType: 'buffer' });
      } catch (err) {
        expect((err as CorruptImageError).code).toBe('CORRUPT_IMAGE');
      }
    });
  });

  // ── 7. Metadata assertions ────────────────────────────────────────────────
  describe('result metadata', () => {
    it('returns correct originalSize and finalSize', async () => {
      const result = await cleanImage(f.validJpegBuffer, {
        inputType: 'buffer',
        outputType: 'buffer',
      });

      expect(result.originalSize).toBe(f.validJpegBuffer.length);
      expect(result.finalSize).toBeGreaterThan(0);
    });

    it('returns wasRepaired=false for healthy images', async () => {
      const result = await cleanImage(f.validPngBuffer, {
        inputType: 'buffer',
        outputType: 'buffer',
      });
      expect(result.wasRepaired).toBe(false);
    });
  });
});
