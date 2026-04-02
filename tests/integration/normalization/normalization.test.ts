import { cleanImage } from '../../../src/cleanImage';
import { generateBaseFixtures, expectValidResult } from '../../helpers';
import type { TestFixtures } from '../../helpers';

describe('Integration: Normalization Domain', () => {
  let f: TestFixtures;

  beforeAll(async () => {
    f = await generateBaseFixtures();
  });

  it('converts standard JPEG natively to WebP without data loss signatures', async () => {
    const result = await cleanImage(f.jpeg, {
      inputType: 'buffer',
      outputType: 'buffer',
      normalizeFormat: 'webp',
    });
    expectValidResult(result, 'image/webp');
  });

  it('converts standard PNG correctly to JPEG maintaining bounding limits', async () => {
    const result = await cleanImage(f.png, {
      inputType: 'buffer',
      outputType: 'buffer',
      normalizeFormat: 'jpeg',
    });
    expectValidResult(result, 'image/jpeg');
  });
});
