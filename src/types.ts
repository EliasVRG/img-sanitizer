/**
 * All shared TypeScript types and interfaces for img-sanitizer.
 */

/** Supported output image formats for normalization. */
export type SupportedFormat = 'jpeg' | 'png' | 'webp';

/** Input data type accepted by cleanImage. */
export type InputType = 'buffer' | 'base64';

/** Output data type returned by cleanImage. */
export type OutputType = 'buffer' | 'base64';

/** Options for the cleanImage function. */
export interface CleanImageOptions {
  /**
   * Format of the input data.
   * - 'buffer': Node.js Buffer
   * - 'base64': base64 string, with or without the `data:image/...;base64,` prefix
   */
  inputType: InputType;

  /**
   * Format of the output data.
   * - 'buffer': returns a Node.js Buffer
   * - 'base64': returns a base64 string
   */
  outputType: OutputType;

  /**
   * When outputType is 'base64', include the `data:<mime>;base64,` prefix.
   * @default false
   */
  includeDataPrefix?: boolean;

  /**
   * Attempt to repair corrupt images by re-encoding them via sharp.
   * If false and the image is corrupt, a CorruptImageError will be thrown.
   * @default false
   */
  repair?: boolean;

  /**
   * Normalize image to a specific output format.
   * Also fixes EXIF orientation automatically.
   * If not set, the original detected format is preserved (after EXIF fix).
   */
  normalizeFormat?: SupportedFormat;

  /**
   * Enable verbose debug logging to stderr.
   * Can also be enabled via the DEBUG=img-sanitizer environment variable.
   * @default false
   */
  debug?: boolean;
}

/** The result returned by cleanImage. */
export interface CleanImageResult {
  /** The sanitized image data, as a Buffer or base64 string depending on outputType. */
  data: Buffer | string;

  /** The real detected MIME type of the output image (e.g., 'image/jpeg'). */
  mime: string;

  /** Image width in pixels (if available). */
  width?: number;

  /** Image height in pixels (if available). */
  height?: number;

  /**
   * Whether the image was repaired (re-encoded) during processing.
   * Only true when the image was corrupt and the `repair` option was enabled.
   */
  wasRepaired: boolean;

  /** Original input size in bytes. */
  originalSize: number;

  /** Final output size in bytes. */
  finalSize: number;
}

/** Internal metadata detected from the image. */
export interface DetectedFileType {
  /** MIME type, e.g. 'image/jpeg' */
  mime: string;
  /** File extension, e.g. 'jpg' */
  ext: string;
}
