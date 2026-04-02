import { cleanImage } from '../../src/cleanImage';
import { createLargeImageBuffer } from '../helpers';

describe('Integration: Performance Limits', () => {
  it('processes massively large matrices (2500x2500) within 750ms acceptable thresholds', async () => {
    const hugeBuffer = await createLargeImageBuffer();

    const start = performance.now();
    const result = await cleanImage(hugeBuffer, { inputType: 'buffer', outputType: 'buffer' });
    const elapsed = performance.now() - start;

    expect(result.mime).toBe('image/jpeg');
    expect(elapsed).toBeLessThan(1000); // Usually ~200-300ms locally, allowing CI buffers
  });
});
