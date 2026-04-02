import sharp from 'sharp';
import { CorruptImageError } from '../errors/CorruptImageError';
import type { SupportedFormat } from '../types';
import type { Logger } from './logger';

/** Fallback formats to try when repairing, in order of preference. */
const REPAIR_FORMATS: SupportedFormat[] = ['jpeg', 'png', 'webp'];

/**
 * Attempts to repair a corrupt image by re-encoding it with sharp.
 * Tries the target format first, then falls back through other supported formats.
 *
 * @throws CorruptImageError if all repair attempts fail.
 */
export async function repairImage(
  buffer: Buffer,
  targetFormat: SupportedFormat,
  logger: Logger,
): Promise<{ buffer: Buffer; mime: string; width?: number; height?: number }> {
  logger.debug('repairImage: attempting repair, target format =', targetFormat);

  // Build the list of formats to try: preferred first, then others
  const formatsToTry = [
    targetFormat,
    ...REPAIR_FORMATS.filter((f) => f !== targetFormat),
  ] as SupportedFormat[];

  for (const format of formatsToTry) {
    logger.debug('repairImage: trying format =', format);
    try {
      const sharpInstance = sharp(buffer, { failOn: 'none' });
      const repaired = await sharpInstance.toFormat(format).toBuffer({ resolveWithObject: true });

      logger.debug(
        'repairImage: success with format =',
        format,
        'output size =',
        repaired.data.length,
      );

      return {
        buffer: repaired.data,
        mime: `image/${format === 'jpeg' ? 'jpeg' : format}`,
        width: repaired.info.width,
        height: repaired.info.height,
      };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      logger.debug('repairImage: format', format, 'failed —', reason);
    }
  }

  throw new CorruptImageError(
    'Image is corrupt and all repair attempts failed. ' + 'The data may be too damaged to recover.',
  );
}
