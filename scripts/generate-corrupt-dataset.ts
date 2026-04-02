/**
 * Stress test dataset generator for QA manual testing and ML systems.
 * Usage: npx ts-node scripts/generate-corrupt-dataset.ts
 * Options: --input <path>
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function run() {
  const inputIndex = process.argv.indexOf('--input');
  const file = inputIndex > -1 ? process.argv[inputIndex + 1] : null;

  let buffer: Buffer;
  if (file && fs.existsSync(file)) {
    buffer = fs.readFileSync(file);
  } else {
    // Generate a default valid buffer directly
    buffer = await sharp({ create: { width: 500, height: 500, channels: 3, background: { r: 100, g: 100, b: 100 } } })
      .jpeg()
      .toBuffer();
  }

  const outDir = path.resolve(__dirname, '../data/corrupted');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Generate variants deterministically
  // 1. Truncated
  const truncated = buffer.subarray(0, Math.floor(buffer.length * 0.5));
  fs.writeFileSync(path.join(outDir, '01_truncated.jpg'), truncated);

  // 2. Magic bit wiped
  const brokenHeader = Buffer.from(buffer);
  brokenHeader.fill(0x00, 0, 16);
  fs.writeFileSync(path.join(outDir, '02_broken_header.jpg'), brokenHeader);

  // 3. Polyglot (trailing script)
  const appended = Buffer.concat([buffer, Buffer.from('<script>alert("run")</script>', 'utf8')]);
  fs.writeFileSync(path.join(outDir, '03_polyglot.jpg'), appended);

  // 4. Bit flips inside matrix data (Deterministic)
  const flips = Buffer.from(buffer);
  const start = Math.floor(flips.length * 0.4);
  const end = Math.floor(flips.length * 0.6);
  for (let i = start; i < end; i++) {
    flips[i] = flips[i] ^ (i % 256); // Deterministic mutation sequence
  }
  fs.writeFileSync(path.join(outDir, '04_bitflips.jpg'), flips);

  console.log('✅ Generated stress test dataset deterministically at:', outDir);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
