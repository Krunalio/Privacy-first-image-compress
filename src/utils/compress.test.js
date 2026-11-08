import { compressImage, outputFileName } from './compress';

test('output names get the extension of the real output format', () => {
  expect(outputFileName('photo.png', 'image/jpeg', true)).toBe('photo.jpg');
  expect(outputFileName('logo.png', 'image/webp', false)).toBe('compressed_logo.webp');
  expect(outputFileName('my.trip.jpeg', 'image/jpeg', true)).toBe('my.trip.jpg');
});

test('animated formats are passed through untouched', async () => {
  const gif = new File(['GIF89a'], 'cat.gif', { type: 'image/gif' });
  const result = await compressImage(gif, { level: 'medium' });
  expect(result.keptOriginal).toBe(true);
  expect(result.file).toBe(gif);
});
