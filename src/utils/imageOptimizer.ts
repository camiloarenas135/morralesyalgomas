// ==========================================
// imageOptimizer.ts — Compresión a WebP antes de subir
// ==========================================

const MAX_DIMENSION = 1600; // px — de sobra para una foto de producto a pantalla completa
const WEBP_QUALITY = 0.82;  // buen balance peso/calidad para fotografía de producto

/**
 * Convierte una imagen a WebP (reduciéndola si excede MAX_DIMENSION) antes de
 * subirla a Supabase Storage. Si el navegador no puede codificar WebP, o el
 * resultado termina pesando más que el original, se sube el archivo tal cual
 * — nunca bloquea la subida por esto.
 */
export async function toWebP(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file; // SVG no se rasteriza; ya es liviano de por sí
  }
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    return file; // entorno sin soporte (SSR, navegador muy antiguo)
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY)
    );

    // Algunos navegadores viejos ignoran 'image/webp' y devuelven PNG igual;
    // si no convirtió de verdad, o el resultado pesa más, nos quedamos con
    // el original en vez de arriesgar una foto más pesada.
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) {
      return file;
    }

    const newName = file.name.replace(/\.[^./]+$/, '') + '.webp';
    return new File([blob], newName, { type: 'image/webp' });
  } catch {
    return file; // cualquier falla de decodificación: seguimos con el original
  }
}
