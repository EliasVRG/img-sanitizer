import { ImageSanitizerError } from './ImageSanitizerError';

/**
 * Thrown when the detected file type is not a supported image format.
 * Examples: PDF, ZIP, or plain text data passed as an image.
 */
export class UnsupportedTypeError extends ImageSanitizerError {
  public readonly detectedMime: string | null;

  constructor(message: string, detectedMime: string | null = null) {
    super(message, 'UNSUPPORTED_TYPE');
    this.name = 'UnsupportedTypeError';
    this.detectedMime = detectedMime;
  }
}
