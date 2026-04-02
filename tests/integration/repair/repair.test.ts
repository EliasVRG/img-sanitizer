import { cleanImage } from '../../../src/cleanImage';
import { generateBaseFixtures, corruptBytes, breakHeader } from '../../helpers';
import { UnsupportedTypeError } from '../../../src/errors/UnsupportedTypeError';
import type { TestFixtures } from '../../helpers';

describe('Integration: Repair Domain', () => {
  let f: TestFixtures;

  beforeAll(async () => {
    f = await generateBaseFixtures();
  });

  it('safely repairs mild tail-end corruptions allowing successful data recovery', async () => {
    // Corrupting the last 15% preserves the magic bytes and main structural markers
    const corruptedTail = corruptBytes(f.jpeg, 0.85, 0.15);
    const result = await cleanImage(corruptedTail, {
      inputType: 'buffer',
      outputType: 'buffer',
      repair: true,
      normalizeFormat: 'jpeg',
    });

    expect(result.wasRepaired).toBe(true);
    expect(result.mime).toBe('image/jpeg');
    expect(Buffer.isBuffer(result.data)).toBe(true);
  });

  it('respects complete magic byte destruction even when repair=true', async () => {
    const completelyBroken = breakHeader(f.jpeg);

    await expect(
      cleanImage(completelyBroken, { inputType: 'buffer', outputType: 'buffer', repair: true }),
    ).rejects.toThrow(UnsupportedTypeError);
  });
});
