/**
 * img-sanitizer
 *
 * A robust Node.js/TypeScript library for image sanitization, validation,
 * repair and normalization in backend pipelines.
 *
 * @example
 * ```typescript
 * import { cleanImage } from 'img-sanitizer';
 *
 * const result = await cleanImage(rawBase64, {
 *   inputType: 'base64',
 *   outputType: 'buffer',
 *   repair: true,
 *   normalizeFormat: 'webp',
 * });
 * console.log(result.mime, result.width, result.height, result.wasRepaired);
 * ```
 */

// ── Main function ─────────────────────────────────────────────────────────────
export { cleanImage } from './cleanImage';

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  CleanImageOptions,
  CleanImageResult,
  DetectedFileType,
  SupportedFormat,
  InputType,
  OutputType,
} from './types';

// ── Errors ────────────────────────────────────────────────────────────────────
export { ImageSanitizerError } from './errors/ImageSanitizerError';
export { InvalidInputError } from './errors/InvalidInputError';
export { CorruptImageError } from './errors/CorruptImageError';
export { UnsupportedTypeError } from './errors/UnsupportedTypeError';
