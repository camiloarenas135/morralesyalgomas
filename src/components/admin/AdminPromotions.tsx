import React, { useState } from 'react';
import { Sparkles, Timer, TimerOff, Flame, Check, X, Calendar, Percent, Tag, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { StoreManager } from '../../lib/supabase';
import { ErrorBanner, errorMessage } from './ErrorBanner';
import { calculateDiscountPercent, formatCOP, parseCOP, isPromoActive } from '../../utils/promoHelpers';

interface AdminPromotionsProps {
  products: Product[];
  onRefresh: () => void;
}

export const AdminPromotions: React.FC<AdminPromotionsProps> = ({
  products,
  onRefresh
}) => {
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [promoPriceInput, setPromoPriceInput] = useState('');
  const [promoEndDateInput, setPromoEndDateInput] = useState('');

  const handleStartEdit = (prod: Product) => {
    setEditingProdId(prod.id);
    setPromoPriceInput(prod.promo_price || '');
    setPromoEndDateInput(
      prod.promo_end_date 
        ? new Date(prod.promo_end_date).toISOString().slice(0, 16)
        : new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString().slice(0, 16)
    );
  };

  const [actionError, setActionError] = useState('');

  const handleSavePromo = async (prod: Product) => {
    const cleanPrice = promoPriceInput.trim();
    try {
      if (cleanPrice) {
        const promoNum = parseCOP(cleanPrice);
        const baseNum = parseCOP(prod.price);
        if (promoNum <= 0) {
          throw new Error('El precio promocional debe ser mayor a $0.');
        }
        if (promoNum >= baseNum) {
          throw new Error('El precio promocional debe ser menor al precio base para que sea una oferta real.');
        }
        const endDate = new Date(promoEndDateInput);
        if (Number.isNaN(endDate.getTime())) {
          throw new Error('Selecciona una fecha y hora de fin válidas para la promoción.');
        }
        if (endDate.getTime() <= Date.now()) {
          throw new Error('La fecha de fin debe ser posterior al momento actual.');
        }
      }
      await StoreManager.updateProduct(prod.id, {
        promo_price: cleanPrice ? (cleanPrice.startsWith('$') ? cleanPrice : `$${cleanPrice}`) : undefined,
        promo_end_date: cleanPrice ? new Date(promoEndDateInput).toISOString() : undefined
      });
      setActionError('');
      setEditingProdId(null);
      onRefresh();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const handleRemovePromo = async (prodId: string) => {
    try {
      await StoreManager.updateProduct(prodId, {
        promo_price: undefined,
        promo_end_date: undefined
      });
      setActionError('');
      onRefresh();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <ErrorBanner message={actionError} onDismiss={() => setActionError('')} />

      {/* 1. Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-red/10 text-brand-red text-xs font-bold">
          <Flame className="w-3.5 h-3.5 fill-current" />
          <span>Control del Temporizador & Ofertas de la Landing</span>
        </div>
        <h2 className="font-heading font-extrabold text-2xl text-cuero-espresso">
          Programador de Precios Promocionales
        </h2>
        <p className="text-xs text-cuero-cognac">
          Los precios promocionales y fechas de vencimiento configurados aquí alimentan directamente el <strong>Countdown Timer</strong> y la sección <strong>Hero Promos</strong> de la tienda pública.
        </p>
      </div>

      {/* 2a. Promotions Cards — solo móvil/tablet (< md) */}
      <div className="md:hidden space-y-3">
        {products.map((prod) => {
          const isEditing = editingProdId === prod.id;
          const promoIsActive = isPromoActive(prod);
          const isExpired = Boolean(prod.promo_price) && !promoIsActive;
          const discountPct = promoIsActive ? calculateDiscountPercent(prod.price, prod.promo_price) : 0;

          return (
            <div
              key={prod.id}
              className="p-4 bg-cuero-marfil rounded-2xl border border-cuero-arena/70 shadow-xs space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-cuero-arena/30 border border-cuero-arena/50 shrink-0">
                  <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-cuero-espresso block text-xs truncate">{prod.name}</span>
                  <span className="text-[10px] text-cuero-caramelo font-semibold">{prod.category}</span>
                  <span className="font-bold text-cuero-espresso text-xs block">{prod.price}</span>
                </div>
                {!isEditing && discountPct > 0 && (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-brand-red/15 text-brand-red font-black text-[11px]">
                    -{discountPct}%
                  </span>
                )}
                {!isEditing && isExpired && (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 font-bold text-[10px] flex items-center gap-1">
                    <TimerOff className="w-3 h-3" /> Expirada
                  </span>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2 pt-2 border-t border-cuero-arena/40">
                  <div>
                    <label className="text-cuero-cognac font-bold block text-[10px] uppercase mb-1">Precio Promocional</label>
                    <input
                      type="text"
                      value={promoPriceInput}
                      onChange={(e) => setPromoPriceInput(e.target.value)}
                      placeholder="Ej: $149.900"
                      className="w-full p-2 rounded-lg bg-brand-cream border border-brand-red/60 text-xs font-bold text-brand-red"
                    />
                  </div>
                  <div>
                    <label className="text-cuero-cognac font-bold block text-[10px] uppercase mb-1">Fecha Fin Oferta</label>
                    <input
                      type="datetime-local"
                      value={promoEndDateInput}
                      onChange={(e) => setPromoEndDateInput(e.target.value)}
                      className="w-full p-2 rounded-lg bg-brand-cream border border-cuero-arena text-xs"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleSavePromo(prod)}
                      className="flex-1 py-2 rounded-lg bg-brand-teal text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-teal-700 transition-colors"
                    >
                      <Check className="w-4 h-4" /> Guardar
                    </button>
                    <button
                      onClick={() => setEditingProdId(null)}
                      className="flex-1 py-2 rounded-lg bg-cuero-arena/40 text-cuero-espresso font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-cuero-arena/60 transition-colors"
                    >
                      <X className="w-4 h-4" /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-cuero-arena/40 space-y-2">
                  {prod.promo_price ? (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-black text-sm ${promoIsActive ? 'text-brand-red' : 'text-gray-400 line-through'}`}>
                        {prod.promo_price}
                      </span>
                      {prod.promo_end_date && (
                        <span className={`font-mono flex items-center gap-1 ${promoIsActive ? 'text-cuero-cognac' : 'text-gray-400'}`}>
                          <Timer className="w-3.5 h-3.5 text-accent-gold" />
                          {new Date(prod.promo_end_date).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 font-medium text-[11px]">Sin promoción activa</span>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartEdit(prod)}
                      className="flex-1 px-3 py-2 rounded-lg bg-cuero-espresso hover:bg-cuero-cognac text-white font-bold text-[11px] transition-colors"
                    >
                      {prod.promo_price ? 'Editar Promo' : 'Asignar Promo'}
                    </button>
                    {prod.promo_price && (
                      <button
                        onClick={() => handleRemovePromo(prod.id)}
                        className="px-3 py-2 rounded-lg text-brand-red bg-brand-red/10 hover:bg-brand-red/20 transition-colors"
                        title="Remover precio promocional"
                        aria-label="Remover precio promocional"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {products.length === 0 && (
          <div className="p-10 text-center text-cuero-cognac text-xs space-y-2 bg-cuero-marfil rounded-2xl border border-cuero-arena/70">
            <Tag className="w-8 h-8 mx-auto text-cuero-arena" />
            <p>Aún no hay productos en el catálogo.</p>
          </div>
        )}
      </div>

      {/* 2b. Promotions Table — solo escritorio (md+) */}
      <div className="hidden md:block bg-cuero-marfil rounded-2xl border border-cuero-arena/70 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-cuero-espresso">
            <thead className="bg-cuero-espresso text-cuero-marfil uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="p-3.5">Foto</th>
                <th className="p-3.5">Artículo</th>
                <th className="p-3.5">Precio Base</th>
                <th className="p-3.5">Precio Promocional</th>
                <th className="p-3.5">Descuento %</th>
                <th className="p-3.5">Fecha Fin Oferta</th>
                <th className="p-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cuero-arena/40">
              {products.map((prod) => {
                const isEditing = editingProdId === prod.id;
                const promoIsActive = isPromoActive(prod);
                const isExpired = Boolean(prod.promo_price) && !promoIsActive;
                const discountPct = promoIsActive ? calculateDiscountPercent(prod.price, prod.promo_price) : 0;

                return (
                  <tr key={prod.id} className="hover:bg-brand-cream/60 transition-colors">
                    <td className="p-3.5">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-cuero-arena/30 border border-cuero-arena/50 shrink-0">
                        <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-cuero-espresso block text-xs">{prod.name}</span>
                      <span className="text-[10px] text-cuero-caramelo font-semibold">{prod.category}</span>
                    </td>
                    <td className="p-3.5 font-bold text-cuero-espresso">
                      {prod.price}
                    </td>

                    {/* Promo Price Column */}
                    <td className="p-3.5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={promoPriceInput}
                          onChange={(e) => setPromoPriceInput(e.target.value)}
                          placeholder="Ej: $149.900"
                          className="w-28 p-1.5 rounded-lg bg-brand-cream border border-brand-red/60 text-xs font-bold text-brand-red"
                        />
                      ) : prod.promo_price ? (
                        <span className={`font-black ${promoIsActive ? 'text-brand-red' : 'text-gray-400 line-through'}`}>
                          {prod.promo_price}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-medium">Sin promo</span>
                      )}
                    </td>

                    {/* Discount % / Estado */}
                    <td className="p-3.5">
                      {discountPct > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-brand-red/15 text-brand-red font-black text-[11px]">
                          -{discountPct}%
                        </span>
                      ) : isExpired ? (
                        <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 font-bold text-[10px] flex items-center gap-1 w-fit">
                          <TimerOff className="w-3 h-3" /> Expirada
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Promo End Date */}
                    <td className="p-3.5">
                      {isEditing ? (
                        <input
                          type="datetime-local"
                          value={promoEndDateInput}
                          onChange={(e) => setPromoEndDateInput(e.target.value)}
                          className="p-1.5 rounded-lg bg-brand-cream border border-cuero-arena text-xs"
                        />
                      ) : prod.promo_end_date ? (
                        <span className={`font-mono text-[11px] flex items-center gap-1 ${promoIsActive ? 'text-cuero-cognac' : 'text-gray-400'}`}>
                          <Timer className="w-3.5 h-3.5 text-accent-gold" />
                          {new Date(prod.promo_end_date).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="p-3.5 text-right space-x-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSavePromo(prod)}
                            className="p-1.5 rounded-lg bg-brand-teal text-white hover:bg-teal-700 transition-colors"
                            title="Guardar promoción"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingProdId(null)}
                            className="p-1.5 rounded-lg bg-cuero-arena/40 text-cuero-espresso hover:bg-cuero-arena/60 transition-colors"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(prod)}
                            className="px-3 py-1.5 rounded-lg bg-cuero-espresso hover:bg-cuero-cognac text-white font-bold text-[11px] transition-colors"
                          >
                            {prod.promo_price ? 'Editar Promo' : 'Asignar Promo'}
                          </button>
                          {prod.promo_price && (
                            <button
                              onClick={() => handleRemovePromo(prod.id)}
                              className="p-1.5 rounded-lg text-brand-red hover:bg-brand-red/10 transition-colors"
                              title="Remover precio promocional"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
