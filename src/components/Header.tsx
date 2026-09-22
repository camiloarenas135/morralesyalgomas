import React, { useState } from 'react';
import { Search, ShoppingBag, ShieldCheck, Truck, Shield, Lock, Menu, X, Sparkles, Phone } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartItemCount: number;
  onOpenCart: () => void;
  onNavigateAdmin: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  cartItemCount,
  onOpenCart,
  onNavigateAdmin,
  onScrollToSection
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full shadow-sm">
      {/* Top Value Banner */}
      <div className="bg-cuero-espresso text-cuero-marfil text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-red text-white uppercase tracking-wider animate-pulse">
              Promo Activa
            </span>
            <span className="font-medium text-cuero-arena flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-accent-gold shrink-0" />
              <span>Envío <strong>GRATIS</strong> nacional por compras superiores a $150.000 COP</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-5 text-xs text-cuero-arena/90 font-medium">
            <span className="flex items-center gap-1.5 hover:text-white transition-colors">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-gold" />
              Garantía de 6 Meses en Cuero
            </span>
            <span className="text-cuero-arena/40">|</span>
            <span className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5 text-brand-teal" />
              Asesoría WhatsApp Directa
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="bg-brand-cream/95 backdrop-blur-md border-b border-cuero-arena/40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Name */}
          <div 
            onClick={() => onScrollToSection('hero')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <img
              src="/logo.png"
              alt="Logo Morrales y Algo Más"
              width={48}
              height={48}
              className="w-12 h-12 shrink-0 rounded-full shadow-md transition-transform duration-300 group-hover:scale-105"
            />

            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-xl sm:text-2xl text-cuero-espresso tracking-tight leading-none group-hover:text-cuero-cognac transition-colors">
                Morrales y Algo Más
              </span>
              <span className="text-[11px] font-medium text-cuero-caramelo tracking-widest uppercase mt-0.5">
                Marroquinería & Accesorios
              </span>
            </div>
          </div>

          {/* Center: Live Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className={`relative w-full transition-all duration-200 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
              <input
                type="text"
                placeholder="Buscar morrales, bolsos, billeteras..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full pl-10 pr-10 py-2.5 bg-cuero-marfil/90 border border-cuero-arena/60 rounded-full text-sm text-cuero-espresso placeholder:text-cuero-cognac/60 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-cuero-cognac/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cuero-cognac hover:text-cuero-espresso text-xs font-bold p-1 rounded-full hover:bg-cuero-arena/30"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons & Navigation */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-cuero-espresso mr-2">
              <button 
                onClick={() => onScrollToSection('promos')}
                className="hover:text-brand-red flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-red" />
                Ofertas
              </button>
              <button 
                onClick={() => onScrollToSection('catalogo')}
                className="hover:text-cuero-cognac transition-colors"
              >
                Catálogo
              </button>
              <button 
                onClick={() => onScrollToSection('garantia')}
                className="hover:text-cuero-cognac transition-colors"
              >
                Garantía 6M
              </button>
            </nav>

            {/* Admin Access Button */}
            <button
              onClick={onNavigateAdmin}
              title="Acceso Administrativo"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-cuero-espresso bg-cuero-marfil hover:bg-cuero-arena/40 border border-cuero-arena rounded-lg transition-all hover:shadow-sm active:scale-95"
            >
              <Lock className="w-3.5 h-3.5 text-cuero-cognac" />
              <span>Admin</span>
            </button>

            {/* Cart Trigger Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center justify-center p-2.5 sm:px-4 sm:py-2.5 rounded-full bg-cuero-espresso hover:bg-cuero-cognac text-white font-medium text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 gap-2 group"
              aria-label="Abrir carrito de compras"
            >
              <ShoppingBag className="w-5 h-5 text-brand-teal group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline font-sans text-xs tracking-wider uppercase font-bold text-cuero-marfil">
                Carrito
              </span>
              {cartItemCount > 0 ? (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-brand-red text-white text-[11px] font-extrabold flex items-center justify-center shadow-sm -ml-0.5 animate-bounce">
                  {cartItemCount}
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-cuero-arena/40 hidden sm:inline-block" />
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-cuero-espresso hover:bg-cuero-marfil rounded-lg border border-cuero-arena/40 transition-colors"
              aria-label="Menú móvil"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search & Navigation Collapsible */}
        {isMobileMenuOpen && (
          <div className="lg:hidden px-4 pt-2 pb-5 bg-cuero-marfil border-t border-cuero-arena/40 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* Mobile Search */}
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Buscar morrales, bolsos, billeteras..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-brand-cream border border-cuero-arena rounded-full text-sm text-cuero-espresso placeholder:text-cuero-cognac/60 focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
              />
              <Search className="w-4 h-4 text-cuero-cognac absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cuero-cognac p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mobile Links */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-sm font-semibold text-cuero-espresso">
              <button
                onClick={() => { onScrollToSection('promos'); setIsMobileMenuOpen(false); }}
                className="flex items-center justify-center gap-2 p-3 bg-brand-cream rounded-xl border border-cuero-arena/60 hover:bg-brand-red/10 text-brand-red transition-colors"
              >
                <Sparkles className="w-4 h-4 text-brand-red" />
                Ofertas Activas
              </button>
              <button
                onClick={() => { onScrollToSection('catalogo'); setIsMobileMenuOpen(false); }}
                className="flex items-center justify-center gap-2 p-3 bg-brand-cream rounded-xl border border-cuero-arena/60 hover:bg-cuero-arena/20 transition-colors"
              >
                Ver Catálogo
              </button>
              <button
                onClick={() => { onScrollToSection('garantia'); setIsMobileMenuOpen(false); }}
                className="flex items-center justify-center gap-2 p-3 bg-brand-cream rounded-xl border border-cuero-arena/60 hover:bg-cuero-arena/20 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-accent-gold" />
                Garantía 6 Meses
              </button>
              <button
                onClick={() => { onNavigateAdmin(); setIsMobileMenuOpen(false); }}
                className="flex items-center justify-center gap-2 p-3 bg-cuero-espresso text-cuero-marfil rounded-xl hover:bg-cuero-cognac transition-colors"
              >
                <Lock className="w-4 h-4 text-brand-teal" />
                Panel Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
