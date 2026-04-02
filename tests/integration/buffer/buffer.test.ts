import { cleanImage } from '../../../src/cleanImage';
import { generateBaseFixtures, expectValidResult } from '../../helpers';
import type { TestFixtures } from '../../helpers';

describe('Integration: Buffer Domain', () => {
  let f: TestFixtures;

  beforeAll(async () => {
    f = await generateBaseFixtures();
  });

  it('processes a valid JPEG Buffer confidently', async () => {
    const result = await cleanImage(f.jpeg, { inputType: 'buffer', outputType: 'buffer' });
    expectValidResult(result, 'image/jpeg');
    expect(result.wasRepaired).toBe(false);
  });

  it('processes a valid PNG Buffer', async () => {
    const result = await cleanImage(f.png, { inputType: 'buffer', outputType: 'buffer' });
    expectValidResult(result, 'image/png');
    expect(result.wasRepaired).toBe(false);
  });

  it('processes a valid WebP Buffer', async () => {
    const result = await cleanImage(f.webp, { inputType: 'buffer', outputType: 'buffer' });
    expectValidResult(result, 'image/webp');
    expect(result.wasRepaired).toBe(false);
  });

  it('outputs Base64 without applying data URI prefix when includeDataPrefix=false', async () => {
    const result = await cleanImage(f.jpeg, {
      inputType: 'buffer',
      outputType: 'base64',
      includeDataPrefix: false,
    });
    expect(typeof result.data).toBe('string');
    expect((result.data as string).startsWith('data:')).toBe(false);
  });

  it('outputs Base64 with strict URI prefix when includeDataPrefix=true', async () => {
    const result = await cleanImage(f.jpeg, {
      inputType: 'buffer',
      outputType: 'base64',
      includeDataPrefix: true,
    });
    expect(typeof result.data).toBe('string');
    expect((result.data as string).startsWith('data:image/jpeg;base64,')).toBe(true);
  });
});
