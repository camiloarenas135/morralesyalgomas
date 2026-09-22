import React from 'react';
import { X } from 'lucide-react';

/** Convierte cualquier valor lanzado en un mensaje legible para el administrador. */
export const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : 'Ocurrió un error inesperado. Inténtalo de nuevo.';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onDismiss }) => {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="p-3 rounded-xl bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-bold flex items-start justify-between gap-3"
    >
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Cerrar aviso" className="shrink-0 hover:opacity-70">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
