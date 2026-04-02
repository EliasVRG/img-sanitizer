import fileType from 'file-type';
import type { DetectedFileType } from '../types';
import type { Logger } from './logger';

/**
 * Detects the real MIME type and extension of a buffer by inspecting its magic bytes.
 * This does NOT rely on file extensions or declared content-types.
 *
 * Returns null if the type cannot be determined (e.g., plain text, random bytes).
 */
export async function detectFileType(
  buffer: Buffer,
  logger: Logger,
): Promise<DetectedFileType | null> {
  logger.debug('detectFileType: probing buffer of length', buffer.length);

  const result = await fileType.fromBuffer(buffer);

  if (!result) {
    logger.debug('detectFileType: no magic bytes matched — type is unknown');
    return null;
  }

  logger.debug('detectFileType: detected mime =', result.mime, 'ext =', result.ext);
  return { mime: result.mime, ext: result.ext };
}
