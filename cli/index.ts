#!/usr/bin/env node

/**
 * img-sanitizer CLI
 *
 * Usage examples:
 *   img-sanitizer --input photo.jpg --output clean.jpg
 *   img-sanitizer --input photo.jpg --output clean.webp --format webp --repair
 *   img-sanitizer --input encoded.txt --inputType base64 --output clean.jpg
 *   cat photo.jpg | img-sanitizer --output clean.jpg
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, extname } from 'path';
import { cleanImage } from '../src/cleanImage';
import { ImageSanitizerError } from '../src/errors/ImageSanitizerError';
import type { SupportedFormat, InputType, OutputType } from '../src/types';

const program = new Command();

program
  .name('img-sanitizer')
  .description('Sanitize, validate, repair and normalize images in your backend pipeline.')
  .version('0.1.0')
  .option('-i, --input <path>', 'Path to input image file')
  .option('-o, --output <path>', 'Path to write the sanitized output image', 'output.jpg')
  .option(
    '--inputType <type>',
    'Input format: buffer (binary file) or base64 (text file)',
    'buffer',
  )
  .option(
    '--outputType <type>',
    'Output format: buffer (binary file) or base64 (text file)',
    'buffer',
  )
  .option('-f, --format <format>', 'Normalize output to: jpeg, png, or webp')
  .option('-r, --repair', 'Attempt to repair corrupt images', false)
  .option('-p, --prefix', 'Include data:image;base64 prefix in base64 output', false)
  .option('-d, --debug', 'Enable verbose debug logging', false)
  .addHelpText(
    'after',
    `
Examples:
  $ img-sanitizer -i photo.jpg -o clean.jpg
  $ img-sanitizer -i photo.jpg -o clean.webp --format webp --repair
  $ img-sanitizer -i encoded.txt --inputType base64 --outputType base64 -o out.txt
  $ img-sanitizer -i corrupt.jpg -o fixed.jpg --repair --debug
`,
  );

program.parse(process.argv);

const opts = program.opts<{
  input?: string;
  output: string;
  inputType: string;
  outputType: string;
  format?: string;
  repair: boolean;
  prefix: boolean;
  debug: boolean;
}>();

async function run(): Promise<void> {
  let inputData: Buffer | string;

  if (opts.input) {
    const inputPath = resolve(opts.input);
    const rawFile = readFileSync(inputPath);

    if (opts.inputType === 'base64') {
      inputData = rawFile.toString('utf8').trim();
    } else {
      inputData = rawFile;
    }
  } else {
    // Read from stdin if no --input provided
    process.stderr.write('[img-sanitizer] Reading from stdin...\n');
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk as Buffer);
    }
    inputData = Buffer.concat(chunks);
    if (inputData.length === 0) {
      process.stderr.write(
        '[img-sanitizer] Error: No input provided. Use --input or pipe data via stdin.\n',
      );
      process.exit(1);
    }
  }

  // Validate options
  const inputType = opts.inputType as InputType;
  const outputType = opts.outputType as OutputType;

  if (!['buffer', 'base64'].includes(inputType)) {
    process.stderr.write(
      `[img-sanitizer] Error: --inputType must be 'buffer' or 'base64', got '${inputType}'\n`,
    );
    process.exit(1);
  }

  if (!['buffer', 'base64'].includes(outputType)) {
    process.stderr.write(
      `[img-sanitizer] Error: --outputType must be 'buffer' or 'base64', got '${outputType}'\n`,
    );
    process.exit(1);
  }

  const validFormats: SupportedFormat[] = ['jpeg', 'png', 'webp'];
  if (opts.format && !validFormats.includes(opts.format as SupportedFormat)) {
    process.stderr.write(
      `[img-sanitizer] Error: --format must be one of: jpeg, png, webp. Got '${opts.format}'\n`,
    );
    process.exit(1);
  }

  // Auto-detect output format from file extension if not specified
  const outputExt = extname(opts.output).replace('.', '').toLowerCase();
  const inferredFormat = (
    ['jpeg', 'jpg', 'png', 'webp'].includes(outputExt)
      ? outputExt === 'jpg'
        ? 'jpeg'
        : outputExt
      : undefined
  ) as SupportedFormat | undefined;

  const normalizeFormat = (opts.format as SupportedFormat | undefined) ?? inferredFormat;

  try {
    const result = await cleanImage(inputData, {
      inputType,
      outputType,
      includeDataPrefix: opts.prefix,
      repair: opts.repair,
      normalizeFormat,
      debug: opts.debug,
    });

    // Write output
    const outputPath = resolve(opts.output);
    if (outputType === 'buffer') {
      writeFileSync(outputPath, result.data as Buffer);
    } else {
      writeFileSync(outputPath, result.data as string, 'utf8');
    }

    process.stderr.write(
      `[img-sanitizer] ✅ Done\n` +
        `  MIME:       ${result.mime}\n` +
        `  Dimensions: ${result.width ?? '?'}×${result.height ?? '?'}\n` +
        `  Repaired:   ${result.wasRepaired ? 'yes' : 'no'}\n` +
        `  Size:       ${result.originalSize} → ${result.finalSize} bytes\n` +
        `  Output:     ${outputPath}\n`,
    );
  } catch (err) {
    if (err instanceof ImageSanitizerError) {
      process.stderr.write(`[img-sanitizer] ❌ ${err.name} [${err.code}]: ${err.message}\n`);
      process.exit(2);
    }
    process.stderr.write(`[img-sanitizer] ❌ Unexpected error: ${String(err)}\n`);
    process.exit(1);
  }
}

run().catch((err: unknown) => {
  process.stderr.write(`[img-sanitizer] Fatal: ${String(err)}\n`);
  process.exit(1);
});
