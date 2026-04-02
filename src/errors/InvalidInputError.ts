import { ImageSanitizerError } from './ImageSanitizerError';

/**
 * Thrown when the input data is invalid, empty, or cannot be decoded into a Buffer.
 * Examples: null input, empty buffer, malformed base64 string.
 */
export class InvalidInputError extends ImageSanitizerError {
  constructor(message: string) {
    super(message, 'INVALID_INPUT');
    this.name = 'InvalidInputError';
  }
}
