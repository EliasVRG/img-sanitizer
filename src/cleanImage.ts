import sharp from 'sharp';
import { decodeInput } from './modules/decoder';
import { detectFileType } from './modules/detector';
import { validateImageType } from './modules/validator';

import { repairImage } from './modules/repairer';
import { normalizeImage } from './modules/normalizer';
import { encodeOutput } from './modules/encoder';
import { createLogger } from './modules/logger';
import { CorruptImageError } from './errors/CorruptImageError';
import type { CleanImageOptions, CleanImageResult, SupportedFormat } from './types';

/**
 * Sanitizes, validates, optionally repairs and normalizes an image.
 *
 * This is the main entry point of img-sanitizer. It accepts an untrusted
 * image in Buffer or base64 format and returns a clean, validated, normalized
 * image along with metadata about the process.
 *
 * @param input - Raw image data: a Node.js Buffer or a base64-encoded string
 *                (with or without `data:image/...;base64,` prefix).
 * @param options - Processing options (see CleanImageOptions).
 * @returns A CleanImageResult with the sanitized image and metadata.
 *
 * @throws InvalidInputError    - Input is null, empty, or cannot be decoded.
 * @throws UnsupportedTypeError - Input is not a recognized image format.
 * @throws CorruptImageError    - Image is corrupt and repair is disabled or failed.
 */
export async function cleanImage(
  input: Buffer | string,
  options: CleanImageOptions,
): Promise<CleanImageResult> {
  const {
    inputType,
    outputType,
    includeDataPrefix = false,
    repair = false,
    normalizeFormat,
    debug = false,
  } = options;

  const logger = createLogger('cleanImage', debug);
  logger.debug('--- cleanImage start ---');
  logger.debug('options:', JSON.stringify({ inputType, outputType, includeDataPrefix, repair, normalizeFormat }));

  // ── Step 1: Decode input into a raw Buffer ────────────────────────────────
  const rawBuffer = decodeInput(input, inputType, logger);
  const originalSize = rawBuffer.length;
  logger.debug('Step 1 done: originalSize =', originalSize);

  // ── Step 2: Detect real MIME type from magic bytes ────────────────────────
  const detected = await detectFileType(rawBuffer, logger);
  logger.debug('Step 2 done: detected =', detected?.mime ?? 'null');

  // ── Step 3: Validate that the type is an image ────────────────────────────
  const fileTypeInfo = validateImageType(detected, logger);
  logger.debug('Step 3 done: validated mime =', fileTypeInfo.mime);

  // ── Step 4: Metadata Probe (Fast) ─────────────────────────────────────────
  // We use .metadata() because it is fast and doesn't decode pixels (header only).
  // If this fails, the image header is corrupt.
  let width: number | undefined;
  let height: number | undefined;
  let currentMime = fileTypeInfo.mime;

  try {
    const metadata = await sharp(rawBuffer).metadata();
    width = metadata.width;
    height = metadata.height;
  } catch (err) {
    logger.debug('Step 4: fast metadata probe failed, header might be corrupt');
    // We don't throw here yet, because some corruptions only manifest during decoding.
  }

  // ── Step 5 & 6: Optimistic Normalization ──────────────────────────────────
  let processedBuffer = rawBuffer;
  let wasRepaired = false;

  try {
    logger.debug('Step 5/6: attempting optimistic normalization...');
    const normalized = await normalizeImage(rawBuffer, normalizeFormat, currentMime, logger);
    processedBuffer = normalized.buffer;
    currentMime = normalized.mime;
    width = normalized.width;
    height = normalized.height;
    logger.debug('Step 5/6 done: normalization success');
  } catch (err) {
    logger.debug('Step 5/6 failed:', err instanceof Error ? err.message : String(err));

    // If normalization fails, we treat it as a corruption event.
    if (!repair) {
      throw new CorruptImageError(
        `Image is corrupt or unreadable. Reason: ${err instanceof Error ? err.message : 'unknown'}. ` +
          `Enable the 'repair' option to attempt recovery.`,
      );
    }

    logger.debug('Step 5/6: attempting repair...');
    const repairFormat: SupportedFormat = normalizeFormat ?? 'jpeg';
    const repaired = await repairImage(rawBuffer, repairFormat, logger);

    processedBuffer = repaired.buffer;
    wasRepaired = true;
    width = repaired.width;
    height = repaired.height;
    currentMime = repaired.mime;
    logger.debug('Step 5/6 done: repair success');
  }

  // ── Step 7: Encode output ─────────────────────────────────────────────────
  const outputData = encodeOutput(processedBuffer, outputType, includeDataPrefix, currentMime, logger);
  const finalSize = processedBuffer.length;

  logger.debug('Step 7 done: finalSize =', finalSize, 'wasRepaired =', wasRepaired);
  logger.debug('--- cleanImage end ---');

  return {
    data: outputData,
    mime: currentMime,
    width,
    height,
    wasRepaired,
    originalSize,
    finalSize,
  };
}
