import sharp from 'sharp';
import type { CleanImageResult } from '../src/types';

// ============================================================================
// 1. DETERMINISTIC IMAGE GENERATORS
// ============================================================================

export async function createValidImageBuffer(
  format: 'jpeg' | 'png' | 'webp',
  options: { width?: number; height?: number } = {},
): Promise<Buffer> {
  const width = options.width ?? 100;
  const height = options.height ?? 100;

  // Use fixed predictable colors to guarantee determinism
  const background =
    format === 'jpeg'
      ? { r: 255, g: 0, b: 0 }
      : format === 'png'
        ? { r: 0, g: 255, b: 0, alpha: 1 }
        : { r: 0, g: 0, b: 255 };

  const builder = sharp({
    create: { width, height, channels: format === 'png' ? 4 : 3, background },
  });

  if (format === 'jpeg') return builder.jpeg({ quality: 80 }).toBuffer();
  if (format === 'png') return builder.png().toBuffer();
  return builder.webp({ quality: 80 }).toBuffer();
}

/**
 * Creates an image that is predictably valid but has odd sizes for performance testing.
 */
export async function createLargeImageBuffer(): Promise<Buffer> {
  return sharp({
    create: { width: 2500, height: 2500, channels: 3, background: { r: 128, g: 128, b: 128 } },
  })
    .jpeg({ quality: 80 })
    .toBuffer();
}

// ============================================================================
// 2. DETERMINISTIC CORRUPTION (NO Math.random())
// ============================================================================

export function truncateBuffer(buffer: Buffer, percentage: number = 0.5): Buffer {
  const length = Math.floor(buffer.length * percentage);
  return buffer.subarray(0, length);
}

/**
 * Bit-flips bytes in a completely predictable sequence.
 */
export function corruptBytes(buffer: Buffer, offsetPercent: number, lengthPercent: number): Buffer {
  const corrupted = Buffer.from(buffer);
  const start = Math.floor(corrupted.length * offsetPercent);
  const length = Math.floor(corrupted.length * lengthPercent);

  for (let i = start; i < start + length; i++) {
    // Deterministic mutation (XOR with a fixed sequence)
    corrupted[i] = corrupted[i] ^ (i % 256);
  }
  return corrupted;
}

export function breakHeader(buffer: Buffer): Buffer {
  const broken = Buffer.from(buffer);
  // Zero out the first 16 bytes (destroys magic bytes completely)
  broken.fill(0x00, 0, 16);
  return broken;
}

// ============================================================================
// 3. BASE64 DIRTYING
// ============================================================================

export function toDirtyBase64(buffer: Buffer, prefix: string = 'data:image/jpeg;base64,'): string {
  const rawBase64 = buffer.toString('base64');
  // Spread whitespace identically every 50 chars
  const wrapped = rawBase64.match(/.{1,50}/g)?.join('\n\t  ') || rawBase64;
  // Deterministically inject invalid chars
  const dirty = wrapped
    .split('')
    .map((c, i) => (i % 30 === 0 ? `${c}!@#` : c))
    .join('');

  return `${prefix}${dirty}`;
}

export function toTruncatedBase64(buffer: Buffer): string {
  const base64 = buffer.toString('base64');
  return base64.substring(0, Math.floor(base64.length * 0.85)); // breaks padding and structural completeness
}

// ============================================================================
// 4. MALICIOUS PAYLOADS (SECURITY)
// ============================================================================

export function createAppendedPayload(buffer: Buffer, payload: string): Buffer {
  return Buffer.concat([buffer, Buffer.from(payload, 'utf8')]);
}

/**
 * Creates what looks like an SVG but contains malicious scripts (polyglot)
 */
export function createMaliciousSvg(): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg">
    <script>alert("XSS")</script>
    <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
  </svg>`;
  return Buffer.from(svg, 'utf8');
}

export function createRandomMemoryBuffer(): Buffer {
  const b = Buffer.alloc(1024);
  for (let i = 0; i < b.length; i++) {
    b[i] = i % 256;
  }
  return b;
}

// ============================================================================
// 5. CUSTOM FIXTURE GENERATORS
// ============================================================================

export interface TestFixtures {
  jpeg: Buffer;
  png: Buffer;
  webp: Buffer;
}

export async function generateBaseFixtures(): Promise<TestFixtures> {
  return {
    jpeg: await createValidImageBuffer('jpeg'),
    png: await createValidImageBuffer('png'),
    webp: await createValidImageBuffer('webp'),
  };
}

// ============================================================================
// 6. ASSERTIONS
// ============================================================================

/**
 * Validates the full integrity of an image processing result.
 */
export function expectValidResult(result: CleanImageResult, expectedMime: string) {
  expect(result).toBeDefined();

  // Dimensions extraction works
  expect(typeof result.width).toBe('number');
  expect(typeof result.height).toBe('number');
  expect(result.width).toBeGreaterThan(0);
  expect(result.height).toBeGreaterThan(0);

  // Correct MIME detected
  expect(result.mime).toBe(expectedMime);

  // Size verification
  expect(typeof result.originalSize).toBe('number');
  expect(typeof result.finalSize).toBe('number');
  expect(result.originalSize).toBeGreaterThan(0);
  expect(result.finalSize).toBeGreaterThan(0);

  // Output format sanity checks
  if (typeof result.data === 'string') {
    expect(result.data.length).toBeGreaterThan(0);
  } else {
    expect(Buffer.isBuffer(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
  }
}
