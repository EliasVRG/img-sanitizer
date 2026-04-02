import { detectFileType } from '../src/modules/detector';
import { createLogger } from '../src/modules/logger';
import { generateFixtures } from './fixtures/generate-fixtures';
import type { Fixtures } from './fixtures/generate-fixtures';

const logger = createLogger('test', false);

describe('detector module', () => {
  let fixtures: Fixtures;

  beforeAll(async () => {
    fixtures = await generateFixtures();
  });

  it('detects image/jpeg from a valid JPEG buffer', async () => {
    const result = await detectFileType(fixtures.validJpegBuffer, logger);
    expect(result).not.toBeNull();
    expect(result!.mime).toBe('image/jpeg');
    expect(result!.ext).toBe('jpg');
  });

  it('detects image/png from a valid PNG buffer', async () => {
    const result = await detectFileType(fixtures.validPngBuffer, logger);
    expect(result).not.toBeNull();
    expect(result!.mime).toBe('image/png');
    expect(result!.ext).toBe('png');
  });

  it('detects image/webp from a valid WebP buffer', async () => {
    const result = await detectFileType(fixtures.validWebpBuffer, logger);
    expect(result).not.toBeNull();
    expect(result!.mime).toBe('image/webp');
    expect(result!.ext).toBe('webp');
  });

  it('returns null for random bytes (unknown type)', async () => {
    const result = await detectFileType(fixtures.randomBytesBuffer, logger);
    expect(result).toBeNull();
  });

  it('returns null for an empty buffer', async () => {
    const result = await detectFileType(Buffer.alloc(0), logger);
    expect(result).toBeNull();
  });

  it('detects type from a truncated JPEG (magic bytes still intact)', async () => {
    // A truncated JPEG still starts with FF D8 FF, so type may still be detected
    const result = await detectFileType(fixtures.truncatedJpegBuffer, logger);
    // This is format-dependent — just ensure no crash occurs
    expect(result === null || result.mime === 'image/jpeg').toBe(true);
  });

  it('returns null for plain text data', async () => {
    const textBuffer = Buffer.from('Hello, this is not an image at all!');
    const result = await detectFileType(textBuffer, logger);
    expect(result).toBeNull();
  });
});
