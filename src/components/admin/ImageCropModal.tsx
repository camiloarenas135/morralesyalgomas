import React, { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Check, X, ZoomIn } from 'lucide-react';

interface ImageCropModalProps {
  file: File;
  /** Proporción ancho/alto del recorte final: 1 = cuadrado (fotos de producto y variante). */
  aspect: number;
  /** Texto de ayuda bajo el título (ej. especifica para qué se usa esta foto). */
  hint?: string;
  /** Ej. "Foto 2 de 4" cuando se están procesando varias en fila. */
  progressLabel?: string;
  onCancel: () => void;
  /** Debe subir/guardar el archivo recortado; si falla, lánzalo para que el modal muestre el error y no avance. */
  onConfirm: (croppedFile: File) => Promise<void>;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    img.src = src;
  });
}

async function cropToFile(imageSrc: string, area: Area, fileName: string): Promise<File> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(area.width));
  canvas.height = Math.max(1, Math.round(area.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo preparar el lienzo de recorte.');

  ctx.drawImage(
    image,
    area.x, area.y, area.width, area.height,
    0, 0, canvas.width, canvas.height
  );

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo generar el recorte.'))), 'image/png')
  );

  const baseName = fileName.replace(/\.[^./]+$/, '') || 'foto';
  return new File([blob], `${baseName}-recorte.png`, { type: 'image/png' });
}

/** Recorte interactivo (arrastrar + zoom) antes de subir, tipo redes sociales. */
export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  file,
  aspect,
  hint,
  progressLabel,
  onCancel,
  onConfirm
}) => {
  const [imageSrc] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => URL.revokeObjectURL(imageSrc), [imageSrc]);

  const handleCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels || isProcessing) return;
    setIsProcessing(true);
    setError(null);
    try {
      const cropped = await cropToFile(imageSrc, croppedAreaPixels, file.name);
      await onConfirm(cropped);
      // Si onConfirm no lanzó error, el padre se encarga de cerrar/avanzar este modal.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo procesar la foto. Intenta de nuevo.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-cuero-espresso/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-brand-cream rounded-3xl shadow-2xl border border-cuero-arena overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-cuero-arena/50 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-heading font-extrabold text-lg text-cuero-espresso">
              Ajustar Foto {progressLabel && <span className="font-mono text-xs text-cuero-cognac font-normal">({progressLabel})</span>}
            </h3>
            <p className="text-[11px] text-cuero-cognac">
              {hint || 'Arrastra para encuadrar y usa el control de abajo para acercar o alejar.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="shrink-0 p-2 text-cuero-cognac hover:text-cuero-espresso rounded-full hover:bg-cuero-arena/30 disabled:opacity-50"
            aria-label="Cancelar recorte"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop area */}
        <div className="relative w-full bg-cuero-espresso" style={{ minHeight: 280, height: 'min(56vh, 420px)' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape="rect"
            showGrid
            zoomWithScroll
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        {/* Controls */}
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-3">
            <ZoomIn className="w-4 h-4 text-cuero-cognac shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-cuero-cognac"
              aria-label="Zoom"
            />
          </div>

          {error && (
            <p className="text-[11px] text-brand-red font-semibold">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl bg-cuero-arena/30 hover:bg-cuero-arena/50 disabled:opacity-50 font-bold text-xs text-cuero-espresso transition-colors"
            >
              {progressLabel ? 'Omitir esta foto' : 'Cancelar'}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing || !croppedAreaPixels}
              className="px-5 py-2.5 rounded-xl bg-cuero-espresso hover:bg-cuero-cognac disabled:opacity-60 text-white font-bold text-xs flex items-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{isProcessing ? 'Subiendo...' : 'Usar esta foto'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
