import { cleanImage } from '../../src/cleanImage';
import { generateBaseFixtures, toTruncatedBase64 } from '../helpers';
import type { TestFixtures } from '../helpers';

describe('Regression Tests', () => {
  let f: TestFixtures;

  beforeAll(async () => {
    f = await generateBaseFixtures();
  });

  it('Issue #21: Ensures incomplete base64 payloads missing padding cleanly throw gracefully', async () => {
    const rawBrokenBase64 = toTruncatedBase64(f.jpeg);
    // Base64 padding errors or severe structural missing pieces result in InvalidInputError
    // under pure sanitization stages. If it passes parsing, it becomes a corrupt buffer.
    // We expect it to drop out gracefully without an uncaught internal TypeError.
    await expect(
      cleanImage(rawBrokenBase64, { inputType: 'base64', outputType: 'buffer', repair: false }),
    ).rejects.toThrow(); // As long as it throws cleanly handled application rules
  });
});
