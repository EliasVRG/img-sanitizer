import type { OutputType } from '../types';
import type { Logger } from './logger';

/**
 * Encodes the output buffer into the requested format.
 *
 * @param buffer - The processed image buffer.
 * @param outputType - 'buffer' returns the raw Buffer; 'base64' encodes to string.
 * @param includeDataPrefix - When outputType is 'base64', prepend `data:<mime>;base64,`.
 * @param mime - The MIME type of the image, used for the data URI prefix.
 */
export function encodeOutput(
  buffer: Buffer,
  outputType: OutputType,
  includeDataPrefix: boolean,
  mime: string,
  logger: Logger,
): Buffer | string {
  logger.debug('encodeOutput: outputType =', outputType, 'includeDataPrefix =', includeDataPrefix);

  if (outputType === 'buffer') {
    logger.debug('encodeOutput: returning Buffer of length', buffer.length);
    return buffer;
  }

  const base64 = buffer.toString('base64');

  if (includeDataPrefix) {
    const withPrefix = `data:${mime};base64,${base64}`;
    logger.debug('encodeOutput: returning base64 with prefix, total length =', withPrefix.length);
    return withPrefix;
  }

  logger.debug('encodeOutput: returning raw base64 of length', base64.length);
  return base64;
}
