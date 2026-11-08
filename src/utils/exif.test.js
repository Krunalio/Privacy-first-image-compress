import { extractExifSegment } from './exif';

// SOI + APP1(Exif, little-endian TIFF, IFD0 with Orientation=6) + SOS
const buildJpeg = () => {
  const tiff = [
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, // header, IFD0 at 8
    0x01, 0x00, // one entry
    0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, // Orientation = 6
    0x00, 0x00, 0x00, 0x00, // no next IFD
  ];
  const payload = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00, ...tiff];
  const length = payload.length + 2;
  return new Uint8Array([
    0xff, 0xd8,
    0xff, 0xe1, length >> 8, length & 0xff, ...payload,
    0xff, 0xda, 0x00, 0x02,
  ]).buffer;
};

test('extracts the EXIF segment and resets orientation to 1', () => {
  const segment = extractExifSegment(buildJpeg());
  expect(segment).not.toBeNull();
  expect(segment[0]).toBe(0xff);
  expect(segment[1]).toBe(0xe1);
  // Orientation value lives 8 bytes into the entry: 10 (APP1+Exif) + 8 (TIFF hdr) + 2 (count) + 8
  expect(segment[28]).toBe(1);
});

test('returns null for non-JPEG data', () => {
  expect(extractExifSegment(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer)).toBeNull();
});
