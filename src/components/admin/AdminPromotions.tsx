import React, { useState } from 'react';
import { Sparkles, Timer, Flame, Check, X, Calendar, Percent, Tag, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { StoreManager } from '../../lib/supabase';
import { ErrorBanner, errorMessage } from './ErrorBanner';
import { calculateDiscountPercent, formatCOP, parseCOP } from '../../utils/promoHelpers';

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

  const handleSavePromo = async (prodId: string) => {
    const cleanPrice = promoPriceInput.trim();
    try {
      if (cleanPrice && Number.isNaN(new Date(promoEndDateInput).getTime())) {
        throw new Error('Selecciona una fecha y hora de fin válidas para la promoción.');
      }
      await StoreManager.updateProduct(prodId, {
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

      {/* 2. Promotions Table */}
      <div className="bg-cuero-marfil rounded-2xl border border-cuero-arena/70 shadow-xs overflow-hidden">
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
                const discountPct = calculateDiscountPercent(prod.price, prod.promo_price);

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
                        <span className="font-black text-brand-red">
                          {prod.promo_price}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-medium">Sin promo</span>
                      )}
                    </td>

                    {/* Discount % */}
                    <td className="p-3.5">
                      {discountPct > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-brand-red/15 text-brand-red font-black text-[11px]">
                          -{discountPct}%
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
                        <span className="font-mono text-[11px] text-cuero-cognac flex items-center gap-1">
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
                            onClick={() => handleSavePromo(prod.id)}
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
