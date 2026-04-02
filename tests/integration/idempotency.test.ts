import { cleanImage } from '../../src/cleanImage';
import { generateBaseFixtures, expectValidResult } from '../helpers';
import type { TestFixtures } from '../helpers';

describe('Integration: Idempotency', () => {
  let f: TestFixtures;

  beforeAll(async () => {
    f = await generateBaseFixtures();
  });

  it('guarantees output determinism when running cleanImage recursively multiple times on the same payload', async () => {
    const result1 = await cleanImage(f.jpeg, { inputType: 'buffer', outputType: 'buffer' });
    const result2 = await cleanImage(result1.data as Buffer, {
      inputType: 'buffer',
      outputType: 'buffer',
    });

    expectValidResult(result1, 'image/jpeg');
    expectValidResult(result2, 'image/jpeg');

    // Idempotency: the second pass shouldn't change the already scrubbed image
    // Note: Due to JPEG lossy recompression differences, we might only match up to dimensions
    // For pure buffer match, we must use a lossless format like PNG
    const resultPng1 = await cleanImage(f.png, { inputType: 'buffer', outputType: 'buffer' });
    const resultPng2 = await cleanImage(resultPng1.data as Buffer, {
      inputType: 'buffer',
      outputType: 'buffer',
    });
    expect((resultPng1.data as Buffer).equals(resultPng2.data as Buffer)).toBe(true);
  });
});
