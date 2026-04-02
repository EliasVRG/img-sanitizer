import { UnsupportedTypeError } from '../errors/UnsupportedTypeError';
import type { DetectedFileType } from '../types';
import type { Logger } from './logger';

/** MIME type prefix for all image types */
const IMAGE_MIME_PREFIX = 'image/';

/**
 * Validates that the detected file type is an image.
 *
 * @throws UnsupportedTypeError if:
 *   - The type could not be detected (unknown magic bytes)
 *   - The detected type is not an image (e.g., PDF, ZIP)
 */
export function validateImageType(
  detected: DetectedFileType | null,
  logger: Logger,
): DetectedFileType {
  logger.debug('validateImageType: detected =', detected ? detected.mime : 'null');

  if (!detected) {
    throw new UnsupportedTypeError(
      'Could not detect file type from buffer content. ' +
        'The data may be random bytes, plain text, or a completely unknown format.',
      null,
    );
  }

  if (!detected.mime.startsWith(IMAGE_MIME_PREFIX)) {
    throw new UnsupportedTypeError(
      `Detected file type '${detected.mime}' is not an image. ` +
        `Only image/* MIME types are supported.`,
      detected.mime,
    );
  }

  logger.debug('validateImageType: type is valid image —', detected.mime);
  return detected;
}
