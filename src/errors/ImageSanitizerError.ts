/**
 * Base error class for all img-sanitizer errors.
 * All errors include a machine-readable `code` field for programmatic handling.
 */
export class ImageSanitizerError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'ImageSanitizerError';
    this.code = code;

    // Maintain proper prototype chain in transpiled environments
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
