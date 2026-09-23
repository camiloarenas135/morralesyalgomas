// ==========================================
// imageOptimizer.ts — Recorte y compresión de fotos antes de subir
// ==========================================

const MAX_DIMENSION = 1600; // px — de sobra para una foto de producto a pantalla completa
const WEBP_QUALITY = 0.82;  // buen balance peso/calidad para fotografía de producto
const JPEG_QUALITY = 0.85;

/** Límite del bucket product-images en Supabase (file_size_limit = 5 MB). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    img.src = src;
  });
}

/**
 * Decodifica el archivo. createImageBitmap es lo más rápido, pero en algunos
 * Safari falla con ciertos formatos (p. ej. HEIC del iPhone); en ese caso se
 * usa un <img>, que Safari sí decodifica.
 */
async function decodeImage(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close?.() };
    } catch {
      // cae al <img> de abajo
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(url);
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

/**
 * Codifica el canvas en el formato más liviano que el navegador soporte:
 * WebP (Chrome, Edge, Firefox) o, si no, JPEG. Safari —el navegador del
 * iPhone— NO codifica WebP: pide 'image/webp' y devuelve PNG sin avisar.
 * Antes, ese PNG (o el original sin reducir) se subía tal cual y superaba
 * el límite de 5 MB del bucket; por eso la foto nunca subía desde el iPhone.
 */
async function encodeCompressed(canvas: HTMLCanvasElement): Promise<{ blob: Blob; ext: string } | null> {
  const webp = await canvasToBlob(canvas, 'image/webp', WEBP_QUALITY);
  if (webp && webp.type === 'image/webp') return { blob: webp, ext: 'webp' };

  // JPEG no tiene transparencia: se pinta sobre blanco para que un PNG con
  // fondo transparente no quede con fondo negro.
  const flat = document.createElement('canvas');
  flat.width = canvas.width;
  flat.height = canvas.height;
  const ctx = flat.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, flat.width, flat.height);
  ctx.drawImage(canvas, 0, 0);

  const jpeg = await canvasToBlob(flat, 'image/jpeg', JPEG_QUALITY);
  if (jpeg && jpeg.type === 'image/jpeg') return { blob: jpeg, ext: 'jpg' };
  return null;
}

function baseName(fileName: string): string {
  return fileName.replace(/\.[^./]+$/, '') || 'foto';
}

/**
 * Reduce la foto a MAX_DIMENSION y la comprime (WebP o JPEG según el
 * navegador) antes de subirla. Si algo falla en el camino devuelve el archivo
 * original; la subida valida después el tamaño final contra MAX_UPLOAD_BYTES.
 */
export async function optimizeImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file; // SVG no se rasteriza; ya es liviano de por sí
  }
  if (typeof document === 'undefined') return file;

  try {
    const decoded = await decodeImage(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(decoded.width, decoded.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(decoded.width * scale));
    canvas.height = Math.max(1, Math.round(decoded.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      decoded.release();
      return file;
    }
    ctx.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
    decoded.release();

    const encoded = await encodeCompressed(canvas);
    if (!encoded) return file;

    // Solo se conserva el original si ya era un formato web liviano y pesa menos.
    const originalIsWebFriendly = file.type === 'image/jpeg' || file.type === 'image/webp';
    if (originalIsWebFriendly && scale === 1 && encoded.blob.size >= file.size) return file;

    return new File([encoded.blob], `${baseName(file.name)}.${encoded.ext}`, { type: encoded.blob.type });
  } catch {
    return file;
  }
}

/**
 * Recorta la foto al área elegida en el editor, ya reducida a MAX_DIMENSION.
 * Recortar a resolución completa de la cámara (4000 px o más en un iPhone)
 * generaba archivos enormes e incluso puede exceder la memoria de canvas de
 * Safari; aquí el recorte sale del tamaño final desde el principio.
 */
export async function cropImageToFile(imageSrc: string, area: CropArea, fileName: string): Promise<File> {
  const image = await loadImageElement(imageSrc);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(area.width, area.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(area.width * scale));
  canvas.height = Math.max(1, Math.round(area.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo preparar el lienzo de recorte.');

  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);

  const encoded = await encodeCompressed(canvas);
  if (!encoded) throw new Error('No se pudo generar el recorte.');
  return new File([encoded.blob], `${baseName(fileName)}-recorte.${encoded.ext}`, { type: encoded.blob.type });
}
