/**
 * Generates test fixture files for the img-sanitizer test suite.
 *
 * Run with: npx ts-node tests/fixtures/generate-fixtures.ts
 *
 * This script creates real image buffers programmatically using sharp,
 * then exports helper functions that return in-memory fixtures for use in tests.
 */

import sharp from 'sharp';

export interface Fixtures {
  validJpegBuffer: Buffer;
  validPngBuffer: Buffer;
  validWebpBuffer: Buffer;
  truncatedJpegBuffer: Buffer;
  randomBytesBuffer: Buffer;
  validJpegBase64: string;
  validJpegBase64WithPrefix: string;
  base64WithWhitespace: string;
  base64WithInvalidChars: string;
  base64Truncated: string;
}

/**
 * Generates all test fixtures in-memory.
 * Calling this is slightly expensive (involves sharp), so call once per test suite.
 */
export async function generateFixtures(): Promise<Fixtures> {
  // Generate a real 100x100 red JPEG buffer using sharp
  const validJpegBuffer = await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } },
  })
    .jpeg({ quality: 80 })
    .toBuffer();

  // Generate a real 100x100 blue PNG buffer
  const validPngBuffer = await sharp({
    create: { width: 100, height: 100, channels: 4, background: { r: 0, g: 0, b: 255, alpha: 1 } },
  })
    .png()
    .toBuffer();

  // Generate a real 100x100 green WebP buffer
  const validWebpBuffer = await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 255, b: 0 } },
  })
    .webp()
    .toBuffer();

  // Simulate a truncated JPEG: take the first 50% of bytes
  const truncatedJpegBuffer = validJpegBuffer.subarray(0, Math.floor(validJpegBuffer.length / 2));

  // Random bytes that are definitely not an image
  const randomBytesBuffer = Buffer.from(
    Array.from({ length: 256 }, (_, i) => i % 256),
  );

  // Valid base64 representations
  const validJpegBase64 = validJpegBuffer.toString('base64');
  const validJpegBase64WithPrefix = `data:image/jpeg;base64,${validJpegBase64}`;

  // base64 with embedded whitespace (line-wrapped style)
  const base64WithWhitespace = validJpegBase64
    .match(/.{1,76}/g)!
    .join('\n');

  // base64 with invalid characters interspersed
  const base64WithInvalidChars = validJpegBase64
    .split('')
    .map((c, i) => (i % 20 === 0 ? `${c}!@#` : c))
    .join('');

  // Truncated base64 (cut mid-string — incomplete padding)
  const base64Truncated = validJpegBase64.substring(0, Math.floor(validJpegBase64.length * 0.6));

  return {
    validJpegBuffer,
    validPngBuffer,
    validWebpBuffer,
    truncatedJpegBuffer,
    randomBytesBuffer,
    validJpegBase64,
    validJpegBase64WithPrefix,
    base64WithWhitespace,
    base64WithInvalidChars,
    base64Truncated,
  };
}
