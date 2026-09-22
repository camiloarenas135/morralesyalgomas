import React, { useState, useEffect } from 'react';
import { Sparkles, Timer, ArrowRight, ChevronLeft, ChevronRight, ShoppingBag, Flame, Star, Shield, Award } from 'lucide-react';
import { Product, PromoBanner } from '../types';
import { MOCK_BANNERS } from '../data/mockProducts';
import { calculateDiscountPercent, calculateTimeRemaining, formatCOP, parseCOP, isPromoActive } from '../utils/promoHelpers';

interface PromoSectionProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e?: React.MouseEvent) => void;
  onFilterPromos: () => void;
}

export const PromoSection: React.FC<PromoSectionProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  onFilterPromos
}) => {
  // Filtramos los productos con promoción vigente (promo_price + no vencida)
  const promoProducts = products.filter(p => isPromoActive(p) && p.stock > 0);

  // Seleccionamos la fecha límite de promoción más próxima o la primera con promo_end_date
  const activePromoDate = promoProducts.find(p => p.promo_end_date)?.promo_end_date || new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString();

  // Estado del Carousel de Banners
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const banners: PromoBanner[] = MOCK_BANNERS;

  // Estado del Countdown Timer
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeRemaining(activePromoDate));

  // Rotación automática del Hero Banner
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // Actualización por segundo del Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeRemaining(activePromoDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [activePromoDate]);

  if (promoProducts.length === 0) {
    return null; // Si no hay ofertas activas, se oculta limpiamente
  }

  const currentBanner = banners[currentBannerIndex];

  return (
    <section id="promos" className="w-full bg-linear-to-b from-brand-cream via-cuero-marfil/60 to-brand-cream pt-6 pb-12 border-b border-cuero-arena/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* ==========================================
            1. HERO PROMO BANNER CAROUSEL
           ========================================== */}
        <div className="relative rounded-3xl overflow-hidden shadow-xl border border-cuero-arena/60 bg-cuero-espresso">
          <div className="relative h-105 sm:h-115 md:h-125 w-full flex items-center">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
              <img
                src={currentBanner.imageUrl}
                alt={currentBanner.title}
                className="w-full h-full object-cover object-center transform transition-transform duration-1000 scale-105"
              />
              {/* Gradient Overlay for high readability */}
              <div className="absolute inset-0 bg-linear-to-r from-cuero-espresso/95 via-cuero-espresso/80 to-transparent sm:w-3/4" />
              <div className="absolute inset-0 bg-radial from-transparent to-cuero-espresso/50" />
            </div>

            {/* Banner Content */}
            <div className="relative z-10 max-w-2xl px-6 sm:px-12 py-8 text-white space-y-4">
              {/* Discount Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-red text-white text-xs font-black tracking-wider uppercase shadow-lg animate-pulse">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{currentBanner.discountBadge}</span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-cuero-marfil leading-tight tracking-tight drop-shadow-sm">
                {currentBanner.title}
              </h1>

              <p className="text-sm sm:text-base text-cuero-arena max-w-lg font-light leading-relaxed">
                {currentBanner.subtitle}
              </p>

              {/* CTA & Features */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={onFilterPromos}
                  className="px-6 py-3.5 bg-cuero-cognac hover:bg-brand-red text-white font-bold text-sm rounded-xl transition-all duration-300 shadow-lg hover:shadow-brand-red/30 flex items-center gap-2 group active:scale-95"
                >
                  <span>{currentBanner.ctaText}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center gap-4 text-xs text-cuero-arena font-medium pl-2">
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4 text-accent-gold" />
                    Edición Limitada
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-brand-teal" />
                    100% Cuero Genuino
                  </span>
                </div>
              </div>
            </div>

            {/* Carousel Navigation Buttons */}
            <button
              onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-cuero-espresso/70 hover:bg-cuero-espresso text-cuero-marfil border border-cuero-arena/30 flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105"
              aria-label="Banner anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-cuero-espresso/70 hover:bg-cuero-espresso text-cuero-marfil border border-cuero-arena/30 flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105"
              aria-label="Siguiente banner"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Carousel Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBannerIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentBannerIndex === idx 
                      ? 'w-7 bg-brand-red shadow-sm' 
                      : 'w-2 bg-cuero-arena/60 hover:bg-cuero-arena'
                  }`}
                  aria-label={`Ir al slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ==========================================
            2. COUNTDOWN TIMER & SECTION HEADER
           ========================================== */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 sm:p-8 bg-cuero-marfil rounded-2xl border border-cuero-arena/60 shadow-md">
          
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-brand-red uppercase tracking-wider">
              <Timer className="w-4 h-4" />
              <span>Ofertas Por Tiempo Limitado</span>
            </div>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-cuero-espresso">
              Descuentos Especiales de Temporada
            </h2>
            <p className="text-xs sm:text-sm text-cuero-cognac">
              Aprovecha precios exclusivos en piezas de marroquinería seleccionadas antes de que expire el cronómetro.
            </p>
          </div>

          {/* Styled Countdown Timer Boxes */}
          <div className="flex items-center gap-2 sm:gap-3 bg-cuero-espresso p-3 sm:p-4 rounded-xl text-white shadow-inner border border-cuero-cognac/40">
            <div className="flex flex-col items-center min-w-12.5 sm:min-w-15">
              <span className="font-mono font-black text-xl sm:text-2xl text-accent-gold">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-bold text-cuero-arena tracking-widest mt-0.5">Días</span>
            </div>
            <span className="text-xl font-mono text-cuero-arena/60 font-bold">:</span>
            <div className="flex flex-col items-center min-w-12.5 sm:min-w-15">
              <span className="font-mono font-black text-xl sm:text-2xl text-accent-gold">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-bold text-cuero-arena tracking-widest mt-0.5">Horas</span>
            </div>
            <span className="text-xl font-mono text-cuero-arena/60 font-bold">:</span>
            <div className="flex flex-col items-center min-w-12.5 sm:min-w-15">
              <span className="font-mono font-black text-xl sm:text-2xl text-accent-gold">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-bold text-cuero-arena tracking-widest mt-0.5">Min</span>
            </div>
            <span className="text-xl font-mono text-cuero-arena/60 font-bold">:</span>
            <div className="flex flex-col items-center min-w-12.5 sm:min-w-15">
              <span className="font-mono font-black text-xl sm:text-2xl text-brand-red animate-pulse">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-bold text-cuero-arena tracking-widest mt-0.5">Seg</span>
            </div>
          </div>
        </div>

        {/* ==========================================
            3. GRID DE PRODUCTOS EN PROMOCIÓN
           ========================================== */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {promoProducts.map((product) => {
            const discountPct = calculateDiscountPercent(product.price, product.promo_price);

            return (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="group relative bg-cuero-marfil rounded-2xl overflow-hidden border border-cuero-arena/50 hover:border-cuero-cognac shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
              >
                {/* Photo & Badges */}
                <div className="relative aspect-square w-full bg-cuero-arena/20 overflow-hidden">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Discount Badge */}
                  {discountPct > 0 && (
                    <div className="absolute top-2.5 right-2.5 bg-brand-red text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-current" />
                      <span>-{discountPct}%</span>
                    </div>
                  )}

                  {/* Handmade badge */}
                  {product.handmade && (
                    <div className="absolute top-2.5 left-2.5 bg-cuero-espresso/90 text-accent-gold text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm shadow">
                      Hecho a Mano
                    </div>
                  )}

                  {/* Quick Add Button on Hover (Desktop) */}
                  <div className="absolute inset-x-2 bottom-2 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(product, e);
                      }}
                      className="w-full py-2 bg-cuero-espresso/95 hover:bg-cuero-cognac text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-1.5 backdrop-blur-sm transition-colors active:scale-95"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-brand-teal" />
                      <span>Agregar Rápido</span>
                    </button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-[11px] font-bold text-cuero-caramelo tracking-wide uppercase">
                      {product.category}
                    </span>
                    <h3 className="font-heading font-bold text-sm sm:text-base text-cuero-espresso group-hover:text-cuero-cognac transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                  </div>

                  {/* Pricing with Highlight */}
                  <div className="pt-1 flex items-baseline justify-between gap-2 border-t border-cuero-arena/30">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 line-through font-medium">
                        {product.price}
                      </span>
                      <span className="text-base sm:text-lg font-black text-brand-red tracking-tight">
                        {product.promo_price}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(product, e);
                      }}
                      className="sm:hidden min-h-11 min-w-11 flex items-center justify-center rounded-xl bg-cuero-espresso text-white hover:bg-cuero-cognac active:scale-95 transition-all"
                      aria-label={`Agregar ${product.name} al carrito`}
                    >
                      <ShoppingBag className="w-5 h-5 text-brand-teal" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Promos CTA */}
        <div className="text-center pt-2">
          <button
            onClick={onFilterPromos}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cuero-marfil hover:bg-cuero-espresso hover:text-white text-cuero-espresso font-bold text-sm border border-cuero-arena transition-all duration-200 shadow-sm hover:shadow-md group"
          >
            <span>Ver todo el catálogo con ofertas aplicadas</span>
            <ArrowRight className="w-4 h-4 text-cuero-cognac group-hover:text-brand-teal group-hover:translate-x-1 transition-all" />
          </button>
        </div>

      </div>
    </section>
  );
};
