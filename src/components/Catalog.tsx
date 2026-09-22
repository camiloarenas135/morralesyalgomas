import React, { useState, useMemo } from 'react';
import { 
  Filter, SlidersHorizontal, ArrowUpDown, Sparkles, Check,
  ShoppingBag, Shield, HandMetal, X, ChevronRight,
  Layers, Ruler, Weight, ShieldAlert, Heart, Share2, Info, Flame, MessageCircle
} from 'lucide-react';
import { Product, ProductVariant, Category } from '../types';
import { calculateDiscountPercent, parseCOP, formatCOP, isPromoActive, getEffectivePrice } from '../utils/promoHelpers';
import { WHATSAPP_NUMBER } from '../config';

interface CatalogProps {
  products: Product[];
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
  searchQuery: string;
  onAddToCart: (product: Product, selectedVariant?: ProductVariant, quantity?: number) => void;
  activePromoFilter: boolean;
  onTogglePromoFilter: () => void;
}

export const Catalog: React.FC<CatalogProps> = ({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onAddToCart,
  activePromoFilter,
  onTogglePromoFilter
}) => {
  // Modal de Detalle
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [showCareGuide, setShowCareGuide] = useState(false);

  // Si la variante elegida tiene foto propia, se muestra primero; el resto de
  // fotos del producto queda disponible en las miniaturas igual.
  const galleryImages = selectedProduct
    ? selectedVariant?.image
      ? [selectedVariant.image, ...selectedProduct.images.filter((img) => img !== selectedVariant.image)]
      : selectedProduct.images
    : [];

  // Estados de Filtros Avanzados
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name-asc'>('featured');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [onlyHandmade, setOnlyHandmade] = useState<boolean>(false);
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(450000);

  // Materiales únicos disponibles
  const availableMaterials = useMemo(() => {
    const materials = new Set<string>();
    products.forEach(p => {
      if (p.material_type) materials.add(p.material_type);
    });
    return Array.from(materials);
  }, [products]);

  // Filtrado y ordenamiento computado
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Filtro de búsqueda
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesDesc = p.description.toLowerCase().includes(query);
        const matchesCat = p.category.toLowerCase().includes(query);
        const matchesSku = p.sku?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCat && !matchesSku) return false;
      }

      // Filtro de categoría
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // Filtro solo promos vigentes
      if (activePromoFilter && !isPromoActive(p)) {
        return false;
      }

      // Filtro solo hecho a mano
      if (onlyHandmade && !p.handmade) {
        return false;
      }

      // Filtro por material
      if (selectedMaterial !== 'all' && p.material_type !== selectedMaterial) {
        return false;
      }

      // Filtro por precio máximo
      const effectivePrice = parseCOP(getEffectivePrice(p));
      if (effectivePrice > maxPriceFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const priceA = parseCOP(getEffectivePrice(a));
      const priceB = parseCOP(getEffectivePrice(b));

      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0; // featured
    });
  }, [products, searchQuery, selectedCategory, activePromoFilter, onlyHandmade, selectedMaterial, maxPriceFilter, sortBy]);

  // Manejo de apertura de modal
  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    setActiveImageIndex(0);
    setSelectedVariant(product.variants.length > 0 ? product.variants[0] : undefined);
    setModalQuantity(1);
    setShowCareGuide(false);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  return (
    <section id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* ==========================================
          1. HEADER & CATEGORY PILLS
         ========================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-cuero-caramelo uppercase tracking-widest">
              Catálogo Exclusivo
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-cuero-espresso">
              Nuestra Colección de Marroquinería
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-cuero-cognac font-medium">
            Mostrando <span className="font-bold text-cuero-espresso">{filteredProducts.length}</span> piezas artesanales
          </p>
        </div>

        {/* Scrollable Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none select-none">
          {/* Todas las categorías */}
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer shadow-sm ${
              selectedCategory === 'all' && !activePromoFilter
                ? 'bg-cuero-espresso text-cuero-marfil shadow-md'
                : 'bg-cuero-marfil text-cuero-espresso border border-cuero-arena/70 hover:bg-cuero-arena/30'
            }`}
          >
            Todas las Piezas
          </button>

          {/* Botón Especial de Solo Ofertas */}
          <button
            onClick={onTogglePromoFilter}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-sm ${
              activePromoFilter
                ? 'bg-brand-red text-white shadow-md ring-2 ring-brand-red/30'
                : 'bg-cuero-marfil text-brand-red border border-brand-red/40 hover:bg-brand-red/10'
            }`}
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>Solo Ofertas</span>
          </button>

          {/* Categorías dinámicas */}
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat.name);
                if (activePromoFilter) onTogglePromoFilter();
              }}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer shadow-sm ${
                selectedCategory === cat.name && !activePromoFilter
                  ? 'bg-cuero-espresso text-cuero-marfil shadow-md'
                  : 'bg-cuero-marfil text-cuero-espresso border border-cuero-arena/70 hover:bg-cuero-arena/30'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ==========================================
          2. FILTERS & SORTING TOOLBAR
         ========================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 bg-cuero-marfil rounded-2xl border border-cuero-arena/60 shadow-sm text-xs sm:text-sm">
        
        {/* Left: Filter triggers */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-cream border border-cuero-arena font-bold text-cuero-espresso hover:bg-cuero-arena/30 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-cuero-cognac" />
            <span>Filtros Avanzados</span>
            {(onlyHandmade || selectedMaterial !== 'all' || maxPriceFilter < 450000) && (
              <span className="w-2 h-2 rounded-full bg-brand-red" />
            )}
          </button>

          {/* Quick toggle Handmade */}
          <button
            onClick={() => setOnlyHandmade(!onlyHandmade)}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border font-bold transition-colors ${
              onlyHandmade
                ? 'bg-cuero-cognac text-white border-cuero-cognac'
                : 'bg-brand-cream text-cuero-espresso border-cuero-arena hover:bg-cuero-arena/20'
            }`}
          >
            <HandMetal className="w-3.5 h-3.5" />
            <span>Hecho a Mano</span>
          </button>
        </div>

        {/* Right: Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-cuero-cognac hidden md:inline font-medium">Ordenar por:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-brand-cream border border-cuero-arena text-cuero-espresso font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
          >
            <option value="featured">Destacados</option>
            <option value="price-asc">Menor Precio</option>
            <option value="price-desc">Mayor Precio</option>
            <option value="name-asc">Nombre A-Z</option>
          </select>
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        {isFilterDrawerOpen && (
          <div className="w-full pt-4 mt-2 border-t border-cuero-arena/40 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
            {/* Filter by Material */}
            <div className="space-y-1.5">
              <label className="font-bold text-cuero-espresso block text-xs">Tipo de Material</label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full p-2 rounded-xl bg-brand-cream border border-cuero-arena text-xs text-cuero-espresso"
              >
                <option value="all">Todos los materiales</option>
                {availableMaterials.map((mat, i) => (
                  <option key={i} value={mat}>{mat}</option>
                ))}
              </select>
            </div>

            {/* Price Max Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-cuero-espresso">Precio Máximo</label>
                <span className="font-extrabold text-cuero-cognac">{formatCOP(maxPriceFilter)}</span>
              </div>
              <input
                type="range"
                min="50000"
                max="450000"
                step="10000"
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                className="w-full accent-cuero-cognac cursor-pointer"
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedMaterial('all');
                  setOnlyHandmade(false);
                  setMaxPriceFilter(450000);
                  setSortBy('featured');
                }}
                className="w-full py-2 px-3 rounded-xl bg-cuero-arena/30 hover:bg-cuero-arena/50 text-cuero-espresso font-bold text-xs transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          3. PRODUCT GRID
         ========================================== */}
      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-cuero-marfil rounded-3xl border border-cuero-arena/40 p-8">
          <ShieldAlert className="w-12 h-12 text-cuero-caramelo mx-auto opacity-70" />
          <h3 className="font-heading font-bold text-xl text-cuero-espresso">
            No encontramos productos con estos filtros
          </h3>
          <p className="text-sm text-cuero-cognac max-w-md mx-auto">
            Prueba ajustando el término de búsqueda, ampliando el rango de precio o seleccionando otra categoría.
          </p>
          <button
            onClick={() => {
              onSelectCategory('all');
              setSelectedMaterial('all');
              setOnlyHandmade(false);
              setMaxPriceFilter(450000);
            }}
            className="px-6 py-2.5 bg-cuero-espresso text-white font-bold text-xs rounded-xl hover:bg-cuero-cognac transition-colors"
          >
            Ver Todo el Catálogo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => {
            const hasActivePromo = isPromoActive(product);
            const discountPct = hasActivePromo ? calculateDiscountPercent(product.price, product.promo_price) : 0;

            return (
              <div
                key={product.id}
                onClick={() => handleOpenProduct(product)}
                className="group relative bg-cuero-marfil rounded-2xl overflow-hidden border border-cuero-arena/60 hover:border-cuero-cognac shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
              >
                {/* Photo & Badges */}
                <div className="relative aspect-square w-full bg-cuero-arena/20 overflow-hidden">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                    {product.handmade && (
                      <span className="bg-cuero-espresso/90 text-accent-gold text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded shadow backdrop-blur-sm">
                        Hecho a Mano
                      </span>
                    )}
                  </div>

                  {/* Discount Badge */}
                  {discountPct > 0 && (
                    <div className="absolute top-2.5 right-2.5 bg-brand-red text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                      -{discountPct}%
                    </div>
                  )}

                  {/* Quick Add Overlay on Desktop */}
                  <div className="absolute inset-x-2 bottom-2 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(product);
                      }}
                      className="w-full py-2.5 bg-cuero-espresso/95 hover:bg-cuero-cognac text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 backdrop-blur-sm transition-colors active:scale-95"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-brand-teal" />
                      <span>Agregar al Carrito</span>
                    </button>
                  </div>
                </div>

                {/* Info Container */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-cuero-caramelo tracking-wider uppercase">
                        {product.category}
                      </span>
                      {product.stock <= 5 && product.stock > 0 && (
                        <span className="text-brand-red font-semibold text-[10px]">
                          ¡Últimas {product.stock} un.!
                        </span>
                      )}
                    </div>

                    <h3 className="font-heading font-bold text-sm sm:text-base text-cuero-espresso group-hover:text-cuero-cognac transition-colors line-clamp-2 mt-1">
                      {product.name}
                    </h3>
                  </div>

                  {/* Material attribute tag */}
                  {product.material_type && (
                    <p className="text-[11px] text-cuero-cognac/80 truncate">
                      {product.material_type}
                    </p>
                  )}

                  {/* Interactive Variant Color Swatches (UI/UX Pro Max) */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {product.variants.slice(0, 4).map((v, idx) => (
                        <span
                          key={idx}
                          title={v.name}
                          className="w-3.5 h-3.5 rounded-full border border-cuero-arena/70 shadow-2xs inline-block"
                          style={{ backgroundColor: v.colorHex || '#8B4513' }}
                        />
                      ))}
                      {product.variants.length > 4 && (
                        <span className="text-[10px] text-cuero-caramelo font-bold">
                          +{product.variants.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Pricing and Action */}
                  <div className="pt-2 flex items-baseline justify-between gap-2 border-t border-cuero-arena/40">
                    <div className="flex flex-col">
                      {hasActivePromo ? (
                        <>
                          <span className="text-[11px] text-gray-400 line-through">
                            {product.price}
                          </span>
                          <span className="text-base sm:text-lg font-black text-brand-red tracking-tight">
                            {product.promo_price}
                          </span>
                        </>
                      ) : (
                        <span className="text-base sm:text-lg font-black text-cuero-espresso tracking-tight">
                          {product.price}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(product);
                      }}
                      className="sm:hidden min-h-11 min-w-11 flex items-center justify-center rounded-xl bg-cuero-espresso text-white hover:bg-cuero-cognac transition-all active:scale-90 shadow-sm"
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
      )}

      {/* ==========================================
          4. PRODUCT DETAIL MODAL
         ========================================== */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-cuero-espresso/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-brand-cream rounded-3xl shadow-2xl border border-cuero-arena flex flex-col md:flex-row overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-cuero-marfil/90 hover:bg-cuero-espresso hover:text-white text-cuero-espresso border border-cuero-arena/60 flex items-center justify-center transition-colors shadow-md"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left: Gallery Column */}
            <div className="md:w-1/2 p-6 bg-cuero-marfil flex flex-col justify-between border-b md:border-b-0 md:border-r border-cuero-arena/50 space-y-4">
              {/* Main Photo with Badges */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-cuero-arena/20 border border-cuero-arena/40 shadow-inner">
                <img
                  src={galleryImages[activeImageIndex] || galleryImages[0]}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover object-center"
                />

                {selectedProduct.handmade && (
                  <span className="absolute top-3 left-3 bg-cuero-espresso text-accent-gold text-xs font-bold px-3 py-1 rounded-lg shadow">
                    Artisanal & Hecho a Mano
                  </span>
                )}
              </div>

              {/* Thumbnails row */}
              {galleryImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        activeImageIndex === idx 
                          ? 'border-cuero-cognac ring-2 ring-cuero-cognac/30 scale-105' 
                          : 'border-cuero-arena/60 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info & Purchase Column */}
            <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              
              <div className="space-y-4">
                {/* Category & SKU */}
                <div className="flex items-center justify-between text-xs text-cuero-caramelo font-bold uppercase tracking-wider">
                  <span>{selectedProduct.category}</span>
                  {selectedProduct.sku && <span className="font-mono text-cuero-cognac/70">{selectedProduct.sku}</span>}
                </div>

                {/* Title */}
                <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-cuero-espresso leading-snug">
                  {selectedProduct.name}
                </h2>

                {/* Pricing */}
                <div className="flex items-baseline gap-3">
                  {isPromoActive(selectedProduct) ? (
                    <>
                      <span className="text-2xl sm:text-3xl font-black text-brand-red">
                        {selectedProduct.promo_price}
                      </span>
                      <span className="text-base text-gray-400 line-through font-medium">
                        {selectedProduct.price}
                      </span>
                      <span className="bg-brand-red/10 text-brand-red text-xs font-bold px-2.5 py-1 rounded-full">
                        Ahorro {calculateDiscountPercent(selectedProduct.price, selectedProduct.promo_price)}%
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl sm:text-3xl font-black text-cuero-espresso">
                      {selectedProduct.price}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-cuero-cognac leading-relaxed">
                  {selectedProduct.description}
                </p>

                {/* Variant Matrix (Color / Talla) */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-cuero-espresso uppercase tracking-wider block">
                      Seleccionar Variante / Tono:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.variants.map((variant, idx) => {
                        const isSelected = selectedVariant?.name === variant.name;
                        return (
                          <button
                            key={idx}
                            onClick={() => { setSelectedVariant(variant); setActiveImageIndex(0); }}
                            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-cuero-espresso text-white border-cuero-espresso shadow-md ring-2 ring-cuero-cognac/30'
                                : 'bg-cuero-marfil text-cuero-espresso border-cuero-arena hover:bg-cuero-arena/30'
                            }`}
                          >
                            {variant.colorHex && (
                              <span 
                                className="w-3.5 h-3.5 rounded-full border border-white shadow-xs" 
                                style={{ backgroundColor: variant.colorHex }}
                              />
                            )}
                            <span>{variant.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Technical Leather Spec Sheet */}
                <div className="p-3.5 bg-cuero-marfil rounded-2xl border border-cuero-arena/50 space-y-2 text-xs text-cuero-espresso">
                  <span className="font-bold text-cuero-caramelo uppercase tracking-wider block text-[10px]">
                    Ficha Técnica de Marroquinería
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {selectedProduct.material_type && (
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-cuero-cognac" />
                        <span><strong>Material:</strong> {selectedProduct.material_type}</span>
                      </div>
                    )}
                    {selectedProduct.dimensions && (
                      <div className="flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5 text-cuero-cognac" />
                        <span><strong>Medidas:</strong> {selectedProduct.dimensions}</span>
                      </div>
                    )}
                    {selectedProduct.weight && (
                      <div className="flex items-center gap-1.5">
                        <Weight className="w-3.5 h-3.5 text-cuero-cognac" />
                        <span><strong>Peso:</strong> {selectedProduct.weight}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-accent-gold" />
                      <span><strong>Garantía:</strong> 6 Meses Oficial</span>
                    </div>
                  </div>
                </div>

                {/* Care instructions collapsible */}
                {selectedProduct.care_instructions && (
                  <div className="border border-cuero-arena/50 rounded-xl overflow-hidden text-xs">
                    <button
                      onClick={() => setShowCareGuide(!showCareGuide)}
                      className="w-full px-3.5 py-2.5 bg-cuero-marfil flex items-center justify-between font-bold text-cuero-espresso hover:bg-cuero-arena/20 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-cuero-cognac" />
                        Guía de Cuidado del Cuero
                      </span>
                      <span>{showCareGuide ? '−' : '+'}</span>
                    </button>
                    {showCareGuide && (
                      <div className="p-3 bg-brand-cream/80 text-[11px] text-cuero-cognac leading-relaxed border-t border-cuero-arena/40">
                        {selectedProduct.care_instructions}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity & Add to Cart Action */}
              <div className="pt-4 border-t border-cuero-arena/50 space-y-3">
                <div className="flex items-center gap-3">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-cuero-arena bg-cuero-marfil rounded-xl overflow-hidden min-h-11">
                    <button
                      onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                      className="px-3.5 py-2 font-bold text-cuero-espresso hover:bg-cuero-arena/30 transition-colors"
                      aria-label="Disminuir cantidad"
                    >
                      −
                    </button>
                    <span className="px-3 font-bold text-sm text-cuero-espresso">
                      {modalQuantity}
                    </span>
                    <button
                      onClick={() => setModalQuantity(Math.min(selectedProduct.stock, modalQuantity + 1))}
                      className="px-3.5 py-2 font-bold text-cuero-espresso hover:bg-cuero-arena/30 transition-colors"
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={() => {
                      onAddToCart(selectedProduct, selectedVariant, modalQuantity);
                      handleCloseModal();
                    }}
                    className="flex-1 min-h-11 py-3 px-5 rounded-xl bg-cuero-espresso hover:bg-cuero-cognac text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4 text-brand-teal" />
                    <span>Agregar al Carrito • {getEffectivePrice(selectedProduct)}</span>
                  </button>
                </div>

                {/* Direct 1-Click WhatsApp Button (UI/UX Pro Max) */}
                <button
                  onClick={() => {
                    const variantText = selectedVariant ? ` (Variante: ${selectedVariant.name})` : '';
                    const message = `Hola, me interesa comprar directamente: *${selectedProduct.name}*${variantText} x ${modalQuantity} unidad(es) por valor de *${getEffectivePrice(selectedProduct)}*. ¿Tienen disponibilidad inmediata para despacho?`;
                    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  disabled={!WHATSAPP_NUMBER}
                  className="w-full min-h-11 py-2.5 px-4 rounded-xl bg-whatsapp hover:bg-whatsapp-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Pedir directamente por WhatsApp</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </section>
  );
};
