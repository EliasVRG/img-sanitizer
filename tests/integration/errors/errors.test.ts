import { cleanImage } from '../../../src/cleanImage';
import { InvalidInputError } from '../../../src/errors/InvalidInputError';

describe('Integration: Errors Domain', () => {
  it('throws InvalidInputError on completely empty buffers natively', async () => {
    await expect(
      cleanImage(Buffer.alloc(0), { inputType: 'buffer', outputType: 'buffer' }),
    ).rejects.toThrow(InvalidInputError);
  });

  it('throws InvalidInputError on empty string base64 payloads', async () => {
    await expect(cleanImage('', { inputType: 'base64', outputType: 'buffer' })).rejects.toThrow(
      InvalidInputError,
    );
  });
});
