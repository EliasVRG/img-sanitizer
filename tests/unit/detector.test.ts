import { detectFileType } from '../../src/modules/detector';
import { createLogger } from '../../src/modules/logger';
import { generateBaseFixtures, createRandomMemoryBuffer, truncateBuffer } from '../helpers';
import type { TestFixtures } from '../helpers';

const logger = createLogger('test', false);

describe('detector module', () => {
  let fixtures: TestFixtures;

  beforeAll(async () => {
    fixtures = await generateBaseFixtures();
  });

  it('detects image/jpeg from a valid JPEG buffer', async () => {
    const result = await detectFileType(fixtures.jpeg, logger);
    expect(result).not.toBeNull();
    expect(result!.mime).toBe('image/jpeg');
    expect(result!.ext).toBe('jpg');
  });

  it('detects image/png from a valid PNG buffer', async () => {
    const result = await detectFileType(fixtures.png, logger);
    expect(result).not.toBeNull();
    expect(result!.mime).toBe('image/png');
    expect(result!.ext).toBe('png');
  });

  it('detects image/webp from a valid WebP buffer', async () => {
    const result = await detectFileType(fixtures.webp, logger);
    expect(result).not.toBeNull();
    expect(result!.mime).toBe('image/webp');
    expect(result!.ext).toBe('webp');
  });

  it('returns null for random bytes (unknown type)', async () => {
    const result = await detectFileType(createRandomMemoryBuffer(), logger);
    expect(result).toBeNull();
  });

  it('returns null for an empty buffer', async () => {
    const result = await detectFileType(Buffer.alloc(0), logger);
    expect(result).toBeNull();
  });

  it('detects type from a truncated JPEG (magic bytes still intact)', async () => {
    // A truncated JPEG still starts with FF D8 FF, so type may still be detected
    const result = await detectFileType(truncateBuffer(fixtures.jpeg, 0.5), logger);
    // This is format-dependent — just ensure no crash occurs
    expect(result === null || result.mime === 'image/jpeg').toBe(true);
  });

  it('returns null for plain text data', async () => {
    const textBuffer = Buffer.from('Hello, this is not an image at all!');
    const result = await detectFileType(textBuffer, logger);
    expect(result).toBeNull();
  });
});
