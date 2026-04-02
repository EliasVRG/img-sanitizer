import { InvalidInputError } from '../errors/InvalidInputError';
import type { Logger } from './logger';

/** Regex to match and capture the base64 payload from a data URI. */
const DATA_URI_REGEX =
  /^data:[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*(?:;[^;,]+)*;base64,/i;

/** Characters not valid in base64 (excluding padding '='). */
const INVALID_BASE64_CHARS = /[^A-Za-z0-9+/=]/g;

/**
 * Strips the `data:image/...;base64,` prefix from a base64 string.
 * Works for any MIME type prefix variant.
 */
export function stripDataUriPrefix(input: string): string {
  return input.replace(DATA_URI_REGEX, '');
}

/**
 * Removes all whitespace (spaces, newlines, tabs) embedded in a base64 string.
 * These are common when base64 is line-wrapped or copy-pasted.
 */
export function removeWhitespace(input: string): string {
  return input.replace(/\s/g, '');
}

/**
 * Removes characters that are not valid base64 characters.
 * Preserves '=' padding characters.
 */
export function removeInvalidChars(input: string): string {
  // Remove padding first, strip invalids, then re-pad
  const withoutPadding = input.replace(/=+$/, '');
  const cleaned = withoutPadding.replace(INVALID_BASE64_CHARS, '');
  return repairPadding(cleaned);
}

/**
 * Repairs base64 padding to ensure the string length is a multiple of 4.
 * Adds '=' characters as necessary.
 */
export function repairPadding(input: string): string {
  const withoutPadding = input.replace(/=+$/, '');
  const remainder = withoutPadding.length % 4;
  if (remainder === 0) return withoutPadding;
  return withoutPadding + '='.repeat(4 - remainder);
}

/**
 * Full base64 sanitization pipeline:
 * 1. Strip data URI prefix
 * 2. Remove whitespace
 * 3. Remove invalid characters
 * 4. Repair padding
 *
 * Returns the clean base64 string ready for Buffer decoding.
 * Throws InvalidInputError if the result is empty.
 */
export function sanitizeBase64(raw: string, logger: Logger): string {
  logger.debug('sanitizeBase64: input length', raw.length);

  let cleaned = stripDataUriPrefix(raw);
  logger.debug('sanitizeBase64: after prefix strip, length', cleaned.length);

  cleaned = removeWhitespace(cleaned);
  logger.debug('sanitizeBase64: after whitespace removal, length', cleaned.length);

  cleaned = removeInvalidChars(cleaned);
  logger.debug('sanitizeBase64: after invalid char removal, length', cleaned.length);

  if (cleaned.length === 0) {
    throw new InvalidInputError(
      'Base64 string is empty after sanitization. Input may be entirely invalid.',
    );
  }

  return cleaned;
}
