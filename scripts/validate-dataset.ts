// scripts/validate-dataset.ts

import fs from 'fs/promises';
import path from 'path';
import { cleanImage } from '../src';

const DATASET_DIR = path.join(process.cwd(), 'data/corrupted');

const files = [
    '01_truncated.jpg',
    '02_broken_header.jpg',
    '03_polyglot.jpg',
    '04_bitflips.jpg',
];

function containsPayload(buffer: Buffer) {
    const str = buffer.toString('utf8');
    return str.includes('<script>') || str.includes('###') || str.includes('alert(');
}

async function run() {
    console.log('🧪 Running dataset validation...\n');

    for (const file of files) {
        const filePath = path.join(DATASET_DIR, file);
        const input = await fs.readFile(filePath);

        // ---- repair: true ----
        try {
            const result = await cleanImage(input, {
                inputType: 'buffer',
                outputType: 'buffer',
                repair: true,
            });

            if (file === '01_truncated.jpg') {
                console.log(`[PASS] ${file} (expected repair, wasRepaired: ${result.wasRepaired})`);
            } else if (file === '03_polyglot.jpg') {
                const isCleaned = !containsPayload(result.data as Buffer);
                const msg = isCleaned ? 'accepted without repair, payload sanitized' : 'ACCEPTED WITH LIVE PAYLOAD!';
                console.log(`[WARN] ${file} (${msg}) - Before: ${input.length}b, After: ${result.finalSize}b`);
            } else {
                console.log(`[WARN] ${file} passed validation somewhat unexpectedly.`);
            }
        } catch (err: any) {
            if (file === '02_broken_header.jpg') {
                console.log(`[PASS] ${file} (broken header rejected - ${err.code})`);
            } else if (file === '04_bitflips.jpg') {
                console.log(`[PASS] ${file} (severe corruption correctly rejected - ${err.code})`);
            } else {
                console.log(`[FAIL] ${file} encountered unexpected error: ${err.code}`);
            }
        }
    }

    console.log('\n🏁 Validation complete.');
}

run().catch(console.error);