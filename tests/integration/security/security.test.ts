import { cleanImage } from '../../../src/cleanImage';
import {
  generateBaseFixtures,
  createRandomMemoryBuffer,
  createMaliciousSvg,
  createAppendedPayload,
} from '../../helpers';
import { UnsupportedTypeError } from '../../../src/errors/UnsupportedTypeError';
import { CorruptImageError } from '../../../src/errors/CorruptImageError';
import type { TestFixtures } from '../../helpers';

describe('Integration: Security Domain', () => {
  let f: TestFixtures;

  beforeAll(async () => {
    f = await generateBaseFixtures();
  });

  it('blocks pure random memory blocks (denial of service/binary junk) immediately', async () => {
    const memory = createRandomMemoryBuffer();
    await expect(cleanImage(memory, { inputType: 'buffer', outputType: 'buffer' })).rejects.toThrow(
      UnsupportedTypeError,
    );
  });

  it('blocks clear text payloads disguised as SVG masks with HTML scripts', async () => {
    const svg = createMaliciousSvg();
    await expect(cleanImage(svg, { inputType: 'buffer', outputType: 'buffer' })).rejects.toThrow(
      UnsupportedTypeError,
    );
  });

  it('sanitizes polyglot payloads (valid image with trailing executable text data) by destroying trailing scripts', async () => {
    const polyglot = createAppendedPayload(f.jpeg, '<script>alert("hacked")</script>');

    // Some formats parse trailing data fine but it persists. Our library should normalize and strip it.
    // If it fails sharply normally, we expect either a clean image back or a CorruptImageError based on the implementation config.
    // Let's force repair=true and normalization to guarantee a fresh scrub.
    const result = await cleanImage(polyglot, {
      inputType: 'buffer',
      outputType: 'buffer',
      repair: true,
      normalizeFormat: 'jpeg',
    });

    expect(result.mime).toBe('image/jpeg');
    const outStr = (result.data as Buffer).toString('utf8');
    expect(outStr).not.toContain('<script>');
  });
});
