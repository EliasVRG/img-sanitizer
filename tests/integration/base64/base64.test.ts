import { cleanImage } from '../../../src/cleanImage';
import { generateBaseFixtures, toDirtyBase64, expectValidResult } from '../../helpers';
import type { TestFixtures } from '../../helpers';
import { InvalidInputError } from '../../../src/errors/InvalidInputError';

describe('Integration: Base64 Domain', () => {
  let f: TestFixtures;

  beforeAll(async () => {
    f = await generateBaseFixtures();
  });

  it('cleans base64 embedded with whitespaces, metadata wrappers, and padding errors', async () => {
    const dirty = toDirtyBase64(f.jpeg, 'data:image/jpeg;charset=utf-8;base64,');
    const result = await cleanImage(dirty, { inputType: 'base64', outputType: 'buffer' });
    expectValidResult(result, 'image/jpeg');
    expect(result.wasRepaired).toBe(false);
  });

  it('handles perfectly clean raw base64 strings transparently', async () => {
    const base64 = f.png.toString('base64');
    const result = await cleanImage(base64, { inputType: 'base64', outputType: 'buffer' });
    expectValidResult(result, 'image/png');
  });

  it('safely throws InvalidInputError when raw base64 is forcefully passed as buffer type', async () => {
    const base64 = f.jpeg.toString('base64');
    await expect(cleanImage(base64, { inputType: 'buffer', outputType: 'buffer' })).rejects.toThrow(
      InvalidInputError,
    );
  });
});
