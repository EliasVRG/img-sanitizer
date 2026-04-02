<div align="center">

# 🧹 img-sanitizer

**A robust Node.js/TypeScript library for image sanitization, validation, repair and normalization in backend pipelines.**

[![CI](https://github.com/EliasVRG/img-sanitizer/actions/workflows/ci.yml/badge.svg)](https://github.com/EliasVRG/img-sanitizer/actions)
[![npm version](https://img.shields.io/npm/v/img-sanitizer.svg)](https://npmjs.com/package/img-sanitizer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

</div>

---

## 🚨 The Problem

In real backend applications, images sourced from external APIs or user uploads are often **untrusted and malformed**:

- Buffers that don't represent valid images
- Base64 strings with embedded whitespace, invalid characters or missing padding
- Partially corrupted or truncated files
- Files with incorrect declared MIME types
- Data URIs accidentally embedded in the raw string (`data:image/jpeg;base64,...`)
- Images that fail silently on the frontend

Building robust image handling means writing the same fragile, repetitive helpers over and over. **img-sanitizer solves this once, cleanly.**

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Real type detection** | Uses magic bytes (not file extensions) via `file-type` |
| 🧼 **Base64 sanitization** | Strips prefixes, removes invalid chars, repairs padding |
| ✅ **Corruption detection** | Uses `sharp` to probe image metadata |
| 🔧 **Auto-repair** | Re-encodes corrupt images with multi-format fallback |
| 🔄 **Normalization** | Fixes EXIF orientation, converts to `jpeg`, `png`, or `webp` |
| 📦 **Flexible I/O** | Accepts `Buffer` or `base64`, returns either format |
| 🏷️ **Rich metadata** | Returns MIME, dimensions, repair flag, and size info |
| 🚨 **Typed errors** | All errors have machine-readable `code` fields |
| 🖥️ **CLI included** | `img-sanitizer` command for terminal usage |
| 🐛 **Debug logging** | Optional verbose logging to stderr |

---

## 📦 Installation

```bash
npm install img-sanitizer
# or
yarn add img-sanitizer
# or
pnpm add img-sanitizer
```

> **Requirements:** Node.js ≥ 18.0.0

---

## 🚀 Quick Start

```typescript
import { cleanImage } from 'img-sanitizer';

// From a Buffer (e.g., from a multer upload or axios response)
const result = await cleanImage(imageBuffer, {
  inputType: 'buffer',
  outputType: 'buffer',
});

console.log(result.mime);       // 'image/jpeg'
console.log(result.width);      // 1920
console.log(result.height);     // 1080
console.log(result.wasRepaired); // false
```

---

## 📖 API Reference

### `cleanImage(input, options)`

The single entry point of the library.

```typescript
import { cleanImage } from 'img-sanitizer';

const result = await cleanImage(input, options);
```

#### Parameters

| Param | Type | Description |
|---|---|---|
| `input` | `Buffer \| string` | Image data — raw Buffer or base64 string |
| `options` | `CleanImageOptions` | Processing options (see below) |

#### `CleanImageOptions`

```typescript
interface CleanImageOptions {
  /** Input format: 'buffer' or 'base64' */
  inputType: 'buffer' | 'base64';

  /** Output format: 'buffer' or 'base64' */
  outputType: 'buffer' | 'base64';

  /**
   * When outputType is 'base64', prepend the data:image/...;base64, prefix.
   * @default false
   */
  includeDataPrefix?: boolean;

  /**
   * Attempt to repair corrupt images by re-encoding via sharp.
   * If false and image is corrupt, throws CorruptImageError.
   * @default false
   */
  repair?: boolean;

  /**
   * Normalize to a target format. Also fixes EXIF orientation.
   * If omitted, the original detected format is preserved.
   */
  normalizeFormat?: 'jpeg' | 'png' | 'webp';

  /**
   * Enable verbose debug logging to stderr.
   * Also enabled with: DEBUG=img-sanitizer
   * @default false
   */
  debug?: boolean;
}
```

#### `CleanImageResult`

```typescript
interface CleanImageResult {
  /** Sanitized image data */
  data: Buffer | string;

  /** Detected MIME type, e.g. 'image/jpeg' */
  mime: string;

  /** Width in pixels */
  width?: number;

  /** Height in pixels */
  height?: number;

  /** Whether the image required repair */
  wasRepaired: boolean;

  /** Original input size in bytes */
  originalSize: number;

  /** Final output size in bytes */
  finalSize: number;
}
```

---

## 💡 Usage Examples

### Handle a dirty base64 string from an external API

```typescript
import { cleanImage } from 'img-sanitizer';

// Data URI prefix? Whitespace? Invalid chars? No problem.
const dirtyBase64 = `data:image/jpeg;base64,/9j/4AAQ SkZJRgABA
QAAAQABAAd...   `;

const result = await cleanImage(dirtyBase64, {
  inputType: 'base64',
  outputType: 'buffer',
});

// result.data is a clean, valid Node.js Buffer
await fs.writeFile('clean.jpg', result.data as Buffer);
```

---

### Repair a corrupt image from a user upload

```typescript
import { cleanImage } from 'img-sanitizer';

const result = await cleanImage(uploadedBuffer, {
  inputType: 'buffer',
  outputType: 'buffer',
  repair: true,           // attempt repair if corrupt
  normalizeFormat: 'webp', // convert to WebP while we're at it
});

if (result.wasRepaired) {
  console.warn('Image was corrupt and had to be repaired.');
}

// result.data is a valid WebP buffer
```

---

### Normalize EXIF orientation and convert format

```typescript
import { cleanImage } from 'img-sanitizer';

const result = await cleanImage(rawJpegBuffer, {
  inputType: 'buffer',
  outputType: 'base64',
  includeDataPrefix: true,  // returns 'data:image/png;base64,...'
  normalizeFormat: 'png',
});

// Safe to embed directly in an <img src="..."> tag
res.json({ image: result.data });
```

---

### Handle errors gracefully

```typescript
import {
  cleanImage,
  InvalidInputError,
  CorruptImageError,
  UnsupportedTypeError,
  ImageSanitizerError,
} from 'img-sanitizer';

try {
  const result = await cleanImage(unknownData, {
    inputType: 'buffer',
    outputType: 'buffer',
    repair: false,
  });
} catch (err) {
  if (err instanceof InvalidInputError) {
    // Empty, null, or completely unparseable input
    console.error(`[${err.code}] Bad input: ${err.message}`);
  } else if (err instanceof UnsupportedTypeError) {
    // Not an image (PDF, ZIP, text, etc.)
    console.error(`[${err.code}] Not an image. Detected: ${err.detectedMime}`);
  } else if (err instanceof CorruptImageError) {
    // Image bytes are damaged beyond repair
    console.error(`[${err.code}] Corrupt image: ${err.message}`);
  } else if (err instanceof ImageSanitizerError) {
    // Any other library error
    console.error(`[${err.code}] ${err.message}`);
  }
}
```

---

### Use debug logging

```typescript
// Via option
const result = await cleanImage(buffer, {
  inputType: 'buffer',
  outputType: 'buffer',
  debug: true, // logs all pipeline steps to stderr
});

// Or via environment variable (no code change needed)
// DEBUG=img-sanitizer node your-script.js
```

---

## 🖥️ CLI Usage

```bash
# Basic sanitization
img-sanitizer --input photo.jpg --output clean.jpg

# Convert to WebP and repair if corrupt
img-sanitizer --input upload.jpg --output result.webp --format webp --repair

# Convert to PNG with debug output
img-sanitizer --input photo.jpg --output clean.png --format png --debug

# Process a base64 text file
img-sanitizer --input encoded.txt --inputType base64 --output clean.jpg

# Output as base64 with data URI prefix
img-sanitizer --input photo.jpg --outputType base64 --prefix --output out.txt
```

### CLI Options

| Option | Description | Default |
|---|---|---|
| `-i, --input <path>` | Input file path (or pipe via stdin) | stdin |
| `-o, --output <path>` | Output file path | `output.jpg` |
| `--inputType <type>` | `buffer` or `base64` | `buffer` |
| `--outputType <type>` | `buffer` or `base64` | `buffer` |
| `-f, --format <fmt>` | Normalize to `jpeg`, `png`, or `webp` | auto |
| `-r, --repair` | Attempt to repair corrupt images | `false` |
| `-p, --prefix` | Include `data:image;base64,` prefix | `false` |
| `-d, --debug` | Enable verbose debug logging | `false` |

---

## 🚨 Error Reference

All errors extend `ImageSanitizerError` and expose a `code` field for programmatic handling.

| Class | Code | When thrown |
|---|---|---|
| `InvalidInputError` | `INVALID_INPUT` | Input is null, empty, or cannot be decoded |
| `UnsupportedTypeError` | `UNSUPPORTED_TYPE` | Not a recognized image format |
| `CorruptImageError` | `CORRUPT_IMAGE` | Image is corrupt and repair failed/disabled |

---

## 🏗️ Architecture

The library is structured as a modular pipeline where each step has a single responsibility:

```
Input (Buffer | base64)
  │
  ▼
decoder.ts      → Parse input into a raw Buffer
  │
  ▼
sanitizer.ts    → Clean base64 (prefix, padding, invalid chars)
  │
  ▼
detector.ts     → Detect real MIME type from magic bytes
  │
  ▼
validator.ts    → Ensure it is actually an image
  │
  ▼
corruption.ts   → Probe with sharp, detect damage
  │
  ├─ corrupt + repair=true  → repairer.ts → re-encode via sharp
  ├─ corrupt + repair=false → throw CorruptImageError
  │
  ▼
normalizer.ts   → Fix EXIF orientation + convert format
  │
  ▼
encoder.ts      → Convert to Buffer or base64 (+ optional prefix)
  │
  ▼
CleanImageResult
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Run with coverage report
npm test -- --coverage
```

Tests cover:
- ✅ Valid JPEG/PNG/WebP buffers
- ✅ Base64 with/without data URI prefix
- ✅ Base64 with whitespace, invalid characters, missing padding
- ✅ Corrupted images (truncated, byte-altered)
- ✅ Repair flow with `wasRepaired: true`
- ✅ Format conversion (JPEG → WebP, PNG, etc.)
- ✅ All error types and their codes
- ✅ Non-image data (random bytes, plain text)

---

## 🔨 Development

```bash
# Clone the repo
git clone https://github.com/EliasVRG/img-sanitizer.git
cd img-sanitizer

# Install dependencies
npm install

# Build TypeScript
npm run build

# Lint
npm run lint

# Format
npm run format
```

---

## 📄 License

MIT © [Elias Victor Rocha Garcia](https://github.com/EliasVRG)
