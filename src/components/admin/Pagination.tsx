import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getPageNumbers } from '../../utils/pagination';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Datos para el contador "Mostrando X–Y de Z". Se omite si no se pasa. */
  counter?: { totalItems: number; pageStart: number; pageEnd: number; itemLabel: string; itemLabelPlural: string };
}

/** Paginado con números + elipsis, compartido entre las listas del admin (Catálogo, Pedidos, ...). */
export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, counter }) => {
  if (totalPages <= 1 && !counter) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      {counter && (
        <p className="text-[11px] text-cuero-cognac">
          Mostrando <strong className="text-cuero-espresso">{counter.pageStart}–{counter.pageEnd}</strong> de{' '}
          <strong className="text-cuero-espresso">{counter.totalItems}</strong>{' '}
          {counter.totalItems === 1 ? counter.itemLabel : counter.itemLabelPlural}
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl bg-cuero-marfil border border-cuero-arena text-cuero-espresso disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cuero-arena/30 transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPageNumbers(currentPage, totalPages).map((p, idx) =>
            p === 'ellipsis' ? (
              <span key={`ellipsis-${idx}`} className="px-1.5 text-cuero-cognac text-xs select-none">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                aria-current={currentPage === p ? 'page' : undefined}
                className={`min-w-9 px-2.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                  currentPage === p
                    ? 'bg-cuero-espresso text-white shadow-sm'
                    : 'bg-cuero-marfil border border-cuero-arena text-cuero-espresso hover:bg-cuero-arena/30'
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl bg-cuero-marfil border border-cuero-arena text-cuero-espresso disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cuero-arena/30 transition-colors"
            aria-label="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
