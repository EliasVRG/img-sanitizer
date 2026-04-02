import { ImageSanitizerError } from './ImageSanitizerError';

/**
 * Thrown when the input buffer represents an image that is corrupt or unreadable,
 * and either repair was not requested or the repair attempt also failed.
 */
export class CorruptImageError extends ImageSanitizerError {
  constructor(message: string) {
    super(message, 'CORRUPT_IMAGE');
    this.name = 'CorruptImageError';
  }
}
