import { InvalidInputError } from '../errors/InvalidInputError';
import { sanitizeBase64 } from './sanitizer';
import type { InputType } from '../types';
import type { Logger } from './logger';

/**
 * Decodes the raw input (Buffer or base64 string) into a Node.js Buffer.
 * For base64 inputs, runs the full sanitization pipeline first.
 *
 * @throws InvalidInputError if the input is null, empty, or decoding fails.
 */
export function decodeInput(input: Buffer | string, inputType: InputType, logger: Logger): Buffer {
  logger.debug('decodeInput: inputType =', inputType);

  if (input === null || input === undefined) {
    throw new InvalidInputError('Input is null or undefined.');
  }

  if (inputType === 'buffer') {
    if (!Buffer.isBuffer(input)) {
      throw new InvalidInputError(
        `inputType is 'buffer' but received a ${typeof input}. Pass a Node.js Buffer.`,
      );
    }
    if (input.length === 0) {
      throw new InvalidInputError('Input Buffer is empty.');
    }
    logger.debug('decodeInput: buffer accepted, length =', input.length);
    return input;
  }

  // inputType === 'base64'
  if (typeof input !== 'string') {
    throw new InvalidInputError(
      `inputType is 'base64' but received a ${typeof input}. Pass a base64 string.`,
    );
  }

  if (input.trim().length === 0) {
    throw new InvalidInputError('Input base64 string is empty.');
  }

  const sanitized = sanitizeBase64(input, logger);
  logger.debug('decodeInput: sanitized base64 length =', sanitized.length);

  let buffer: Buffer;
  try {
    buffer = Buffer.from(sanitized, 'base64');
  } catch (err) {
    throw new InvalidInputError(
      `Failed to decode base64 string into a Buffer: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (buffer.length === 0) {
    throw new InvalidInputError('Decoded Buffer from base64 is empty. Input may be malformed.');
  }

  logger.debug('decodeInput: decoded buffer length =', buffer.length);
  return buffer;
}
