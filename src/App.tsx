import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { PromoSection } from './components/PromoSection';
import { Catalog } from './components/Catalog';
import { Cart } from './components/Cart';
import { Footer } from './components/Footer';
import { AdminPanel } from './components/admin/AdminPanel';
import { Product, ProductVariant, OrderCartItem, Category, Order } from './types';
import { StoreManager } from './lib/supabase';
import { Check, ShoppingBag } from 'lucide-react';

// Lightweight SPA Route Hook
function useRoute() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (path: string) => {
    if (path !== window.location.pathname) {
      window.history.pushState(null, '', path);
      setPathname(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return { pathname, navigate };
}

export function App() {
  const { pathname, navigate } = useRoute();

  // Master State from StoreManager (loads instantly from cache)
  const [products, setProducts] = useState<Product[]>(() => StoreManager.getProducts());
  const [categories, setCategories] = useState<Category[]>(() => StoreManager.getCategories());
  const [orders, setOrders] = useState<Order[]>(() => StoreManager.getOrders());

  // Function to refresh state across components (Local + Remote sync)
  const refreshMasterData = useCallback(() => {
    // Immediate local cache update
    setProducts(StoreManager.getProducts());
    setCategories(StoreManager.getCategories());
    setOrders(StoreManager.getOrders());

    // Async sync with Supabase remote PostgreSQL database
    Promise.all([
      StoreManager.fetchRemoteProducts(),
      StoreManager.fetchRemoteCategories(),
      StoreManager.fetchRemoteOrders()
    ]).then(([remProds, remCats, remOrders]) => {
      setProducts(remProds);
      setCategories(remCats);
      setOrders(remOrders);
    }).catch(err => {
      console.warn('Background Supabase refresh notice:', err);
    });
  }, []);

  // Al cargar solo se pide el catálogo público. Los pedidos los pide el panel
  // admin (refreshMasterData) una vez confirmada la sesión de administrador.
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      StoreManager.fetchRemoteProducts(),
      StoreManager.fetchRemoteCategories()
    ]).then(([remProds, remCats]) => {
      if (isMounted) {
        setProducts(remProds);
        setCategories(remCats);
      }
    }).catch(err => {
      console.warn('Initial Supabase fetch notice:', err);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Public Store Navigation & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activePromoFilter, setActivePromoFilter] = useState(false);

  // Cart State (Persisted in LocalStorage)
  const [cartItems, setCartItems] = useState<OrderCartItem[]>(() => {
    try {
      const saved = localStorage.getItem('morrales_cart_items_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Sync Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('morrales_cart_items_v1', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Error persisting cart:', e);
    }
  }, [cartItems]);

  // Cart Handlers
  const handleAddToCart = (product: Product, selectedVariant?: ProductVariant, quantity: number = 1) => {
    const variantId = selectedVariant ? `-${selectedVariant.name.replace(/\s+/g, '')}` : '';
    const cartItemId = `${product.id}${variantId}`;
    const effectivePrice = product.promo_price || product.price;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = Math.min(product.stock, updated[existingIndex].quantity + quantity);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty
        };
        return updated;
      } else {
        const newItem: OrderCartItem = {
          id: cartItemId,
          productId: product.id,
          name: product.name,
          price: effectivePrice,
          quantity: Math.min(product.stock, quantity),
          image: product.images[0],
          selectedVariant,
          maxStock: product.stock
        };
        return [...prevItems, newItem];
      }
    });

    showToast(`¡"${product.name}" agregado al carrito!`);
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Smooth scroll handler
  const handleScrollToSection = (sectionId: string) => {
    if (pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Promo Filter Trigger from PromoSection
  const handleFilterPromos = () => {
    setActivePromoFilter(true);
    setSelectedCategory('all');
    handleScrollToSection('catalogo');
  };

  // ==========================================
  // RENDER ADMIN VIEW
  // ==========================================
  if (pathname === '/admin') {
    return (
      <AdminPanel
        products={products}
        orders={orders}
        categories={categories}
        onRefreshData={refreshMasterData}
        onNavigateHome={() => navigate('/')}
      />
    );
  }

  // ==========================================
  // RENDER PUBLIC STORE VIEW
  // ==========================================
  return (
    <div className="min-h-screen bg-brand-cream text-cuero-espresso flex flex-col justify-between selection:bg-brand-teal/30 selection:text-cuero-espresso">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-cuero-espresso text-white text-xs font-bold rounded-2xl shadow-2xl border border-accent-gold/40 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <div className="p-1 rounded-full bg-brand-teal text-cuero-espresso">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartItemCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onNavigateAdmin={() => navigate('/admin')}
        onScrollToSection={handleScrollToSection}
      />

      <main className="flex-1">
        {/* Hero & Countdown Section */}
        <PromoSection
          products={products}
          onSelectProduct={(p) => handleAddToCart(p)}
          onAddToCart={(p, e) => {
            if (e) e.stopPropagation();
            handleAddToCart(p);
          }}
          onFilterPromos={handleFilterPromos}
        />

        {/* Catalog & Filter Section */}
        <Catalog
          products={products}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            if (activePromoFilter) setActivePromoFilter(false);
          }}
          searchQuery={searchQuery}
          onAddToCart={handleAddToCart}
          activePromoFilter={activePromoFilter}
          onTogglePromoFilter={() => setActivePromoFilter(!activePromoFilter)}
        />
      </main>

      {/* Slide-over Cart Drawer */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
      />

      {/* Footer */}
      <Footer onNavigateAdmin={() => navigate('/admin')} />

    </div>
  );
}

export default App;
