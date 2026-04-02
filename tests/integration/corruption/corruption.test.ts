import { cleanImage } from '../../../src/cleanImage';
import { generateBaseFixtures, truncateBuffer, breakHeader } from '../../helpers';
import { CorruptImageError } from '../../../src/errors/CorruptImageError';
import { UnsupportedTypeError } from '../../../src/errors/UnsupportedTypeError';
import type { TestFixtures } from '../../helpers';

describe('Integration: Corruption Domain', () => {
  let f: TestFixtures;

  beforeAll(async () => {
    f = await generateBaseFixtures();
  });

  it('detects truncated jpeg buffers and throws CorruptImageError proactively', async () => {
    const truncated = truncateBuffer(f.jpeg, 0.5);
    await expect(
      cleanImage(truncated, { inputType: 'buffer', outputType: 'buffer', repair: false }),
    ).rejects.toThrow(CorruptImageError);
  });

  it('detects completely broken headers and throws UnsupportedTypeError', async () => {
    const broken = breakHeader(f.jpeg);
    await expect(
      cleanImage(broken, { inputType: 'buffer', outputType: 'buffer', repair: false }),
    ).rejects.toThrow(UnsupportedTypeError);
  });
});
