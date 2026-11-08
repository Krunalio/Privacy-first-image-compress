import { extractExifSegment, insertExifSegment } from './exif';

const QUALITY = { low: 0.78, medium: 0.58, high: 0.4 };
const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/webp': 'webp' };

// Animated GIFs would lose their animation and SVGs are already vector,
// so these are passed through untouched.
const PASS_THROUGH = ['image/gif', 'image/svg+xml'];

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This browser cannot decode the image'));
    };
    img.src = url;
  });

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

const hasTransparency = (ctx, width, height) => {
  const { data } = ctx.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
};

const baseName = (name) => name.replace(/\.[^./\\]+$/, '');

export const outputFileName = (originalName, mimeType, keepOriginalName) => {
  const name = `${baseName(originalName)}.${EXTENSIONS[mimeType]}`;
  return keepOriginalName ? name : `compressed_${name}`;
};

const keepOriginal = (file, reason) => ({ file, keptOriginal: true, reason });

/**
 * Compresses one image locally. Never returns a file larger than the original:
 * if compression does not help, the original file is returned unchanged.
 */
export const compressImage = async (file, options) => {
  const { level, preserveQuality, keepMetadata, keepOriginalName } = options;

  if (!file.type.startsWith('image/') || PASS_THROUGH.includes(file.type)) {
    return keepOriginal(file, 'Format kept as-is');
  }

  let img;
  try {
    img = await loadImage(file);
  } catch (error) {
    return keepOriginal(file, 'Format not supported by this browser');
  }

  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, width, height);

  // JPEG stays JPEG, WebP stays WebP. PNG with transparency becomes WebP
  // (which keeps the alpha channel); opaque PNG and other formats become JPEG.
  let targetType = 'image/jpeg';
  if (file.type === 'image/webp') {
    targetType = 'image/webp';
  } else if (file.type === 'image/png' && hasTransparency(ctx, width, height)) {
    targetType = 'image/webp';
  }

  const base = QUALITY[level] ?? QUALITY.medium;
  const quality = preserveQuality ? Math.min(base + 0.12, 0.92) : base;

  let blob = await canvasToBlob(canvas, targetType, quality);
  canvas.width = 0;
  canvas.height = 0;

  // Some browsers silently fall back to PNG when they cannot encode WebP.
  if (!blob || blob.type !== targetType) {
    return keepOriginal(file, 'Browser cannot encode this format');
  }

  if (keepMetadata && file.type === 'image/jpeg' && targetType === 'image/jpeg') {
    const exif = extractExifSegment(await file.arrayBuffer());
    if (exif) {
      blob = await insertExifSegment(blob, exif);
    }
  }

  if (blob.size >= file.size) {
    return keepOriginal(file, 'Already optimized');
  }

  return {
    file: new File([blob], outputFileName(file.name, targetType, keepOriginalName), {
      type: targetType,
      lastModified: file.lastModified,
    }),
    keptOriginal: false,
  };
};
