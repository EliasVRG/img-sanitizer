import sharp from 'sharp';
import type { SupportedFormat } from '../types';
import type { Logger } from './logger';

export interface NormalizeResult {
  buffer: Buffer;
  mime: string;
  width?: number;
  height?: number;
}

/**
 * Normalizes an image buffer:
 * 1. Fixes EXIF orientation via `.rotate()` (lossless auto-rotation)
 * 2. Optionally converts to the specified output format
 *
 * Always returns a new Buffer — the original is never mutated.
 */
export async function normalizeImage(
  buffer: Buffer,
  targetFormat: SupportedFormat | undefined,
  currentMime: string,
  logger: Logger,
): Promise<NormalizeResult> {
  logger.debug(
    'normalizeImage: currentMime =',
    currentMime,
    'targetFormat =',
    targetFormat ?? 'none',
  );

  let sharpInstance = sharp(buffer).rotate(); // rotate() auto-fixes EXIF orientation

  if (targetFormat) {
    logger.debug('normalizeImage: converting to', targetFormat);
    sharpInstance = sharpInstance.toFormat(targetFormat);
  }

  const { data, info } = await sharpInstance.toBuffer({ resolveWithObject: true });

  const outputMime = targetFormat
    ? `image/${targetFormat === 'jpeg' ? 'jpeg' : targetFormat}`
    : currentMime;

  logger.debug(
    'normalizeImage: done — mime =',
    outputMime,
    'size =',
    data.length,
    'width =',
    info.width,
    'height =',
    info.height,
  );

  return {
    buffer: data,
    mime: outputMime,
    width: info.width,
    height: info.height,
  };
}
