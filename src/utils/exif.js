// Minimal JPEG EXIF helpers. Re-encoding through <canvas> drops all photo
// metadata (date taken, camera, location). These helpers copy the original
// EXIF block into the compressed JPEG so galleries keep sorting photos correctly.

const SOI = 0xffd8;
const APP0 = 0xffe0;
const APP1 = 0xffe1;
const SOS = 0xffda;

const isExifHeader = (bytes, offset) =>
  bytes[offset] === 0x45 && // E
  bytes[offset + 1] === 0x78 && // x
  bytes[offset + 2] === 0x69 && // i
  bytes[offset + 3] === 0x66 && // f
  bytes[offset + 4] === 0 &&
  bytes[offset + 5] === 0;

// Browsers already apply the EXIF orientation when drawing to canvas, so the
// pixels in the new file are upright. Reset the tag to 1 or viewers would
// rotate the photo a second time.
const resetOrientation = (segment) => {
  const view = new DataView(segment.buffer, segment.byteOffset, segment.byteLength);
  const tiff = 10; // marker(2) + length(2) + "Exif\0\0"(6)
  if (segment.byteLength < tiff + 8) return;

  const byteOrder = view.getUint16(tiff);
  if (byteOrder !== 0x4949 && byteOrder !== 0x4d4d) return;
  const little = byteOrder === 0x4949;

  const ifd0 = tiff + view.getUint32(tiff + 4, little);
  if (ifd0 + 2 > segment.byteLength) return;
  const entries = view.getUint16(ifd0, little);

  for (let i = 0; i < entries; i++) {
    const entry = ifd0 + 2 + i * 12;
    if (entry + 12 > segment.byteLength) return;
    if (view.getUint16(entry, little) === 0x0112) {
      view.setUint16(entry + 8, 1, little);
      return;
    }
  }
};

/** Returns the APP1/EXIF segment (marker included) of a JPEG, or null. */
export const extractExifSegment = (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  if (bytes.length < 4 || view.getUint16(0) !== SOI) return null;

  let offset = 2;
  while (offset + 4 <= bytes.length) {
    const marker = view.getUint16(offset);
    if ((marker & 0xff00) !== 0xff00 || marker === SOS) break;
    const length = view.getUint16(offset + 2);
    if (marker === APP1 && isExifHeader(bytes, offset + 4)) {
      const segment = bytes.slice(offset, offset + 2 + length);
      resetOrientation(segment);
      return segment;
    }
    offset += 2 + length;
  }
  return null;
};

/** Inserts an EXIF segment right after SOI, replacing the canvas JFIF header. */
export const insertExifSegment = async (jpegBlob, segment) => {
  const buffer = await jpegBlob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  if (bytes.length < 4 || view.getUint16(0) !== SOI) return jpegBlob;

  let rest = 2;
  if (view.getUint16(2) === APP0) {
    rest = 4 + view.getUint16(4);
  }

  return new Blob([bytes.subarray(0, 2), segment, bytes.subarray(rest)], {
    type: 'image/jpeg',
  });
};
