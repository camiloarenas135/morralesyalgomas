import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, Sparkles,
  Users, LogOut, ArrowLeft, Shield, Lock, CheckCircle2, RotateCcw
} from 'lucide-react';
import { Product, Order, Category } from '../../types';
import { AdminStats } from './AdminStats';
import { AdminCatalog } from './AdminCatalog';
import { AdminOrders } from './AdminOrders';
import { AdminPromotions } from './AdminPromotions';
import { AdminCustomers } from './AdminCustomers';
import { summarizeCustomers } from '../../utils/customers';
import { StoreManager, AdminAuth, isSupabaseConfigured } from '../../lib/supabase';

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  categories: Category[];
  onRefreshData: () => void;
  onNavigateHome: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  orders,
  categories,
  onRefreshData,
  onNavigateHome
}) => {
  // Autenticación administrativa: Supabase Auth + allowlist (is_admin) en el servidor
  const [authStatus, setAuthStatus] = useState<'checking' | 'out' | 'in'>('checking');
  const [authError, setAuthError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Active Tab: stats | catalog | orders | promotions | customers
  const [activeTab, setActiveTab] = useState<'stats' | 'catalog' | 'orders' | 'promotions' | 'customers'>('stats');

  // Restaurar sesión (incluye el regreso de Google) y reaccionar a cierres de sesión
  useEffect(() => {
    let isMounted = true;
    AdminAuth.checkSession().then((session) => {
      if (!isMounted) return;
      if (session.status === 'admin') {
        setAuthStatus('in');
        onRefreshData();
      } else {
        setAuthStatus('out');
        if (session.status === 'denied') {
          setAuthError(`La cuenta ${session.email} no tiene permisos de administrador.`);
        }
      }
    });
    const unsubscribe = AdminAuth.onSignedOut(() => setAuthStatus('out'));
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [onRefreshData]);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setAuthError('');
    const { error } = await AdminAuth.signInWithGoogle();
    // Si no hubo error el navegador ya está viajando a Google.
    if (error) {
      setAuthError(error);
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await AdminAuth.signOut();
    setAuthStatus('out');
  };

  // Reset Demo Data
  const handleResetData = () => {
    if (confirm('¿Deseas restaurar los datos de ejemplo iniciales?')) {
      StoreManager.resetToDefaults();
      onRefreshData();
    }
  };

  // VERIFICANDO SESIÓN
  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center text-xs font-bold text-cuero-cognac">
        Verificando sesión…
      </div>
    );
  }

  // LOGIN SCREEN
  if (authStatus === 'out') {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-cuero-marfil rounded-3xl p-8 border border-cuero-arena shadow-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <img
              src="/logo.png"
              alt="Logo Morrales y Algo Más"
              width={64}
              height={64}
              className="w-16 h-16 rounded-full shadow mx-auto"
            />
            <h2 className="font-heading font-extrabold text-2xl text-cuero-espresso">
              Panel Administrativo
            </h2>
            <p className="text-xs text-cuero-cognac">
              Morrales y Algo Más — Marroquinería
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-bold text-center">
              {authError}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
            className="w-full py-3.5 bg-white hover:bg-cuero-marfil disabled:opacity-60 text-cuero-espresso text-sm font-bold rounded-xl border border-cuero-arena shadow-md transition-colors active:scale-95 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>{isSigningIn ? 'Redirigiendo a Google…' : 'Continuar con Google'}</span>
          </button>

          <p className="text-[11px] text-center text-cuero-cognac">
            Solo las cuentas autorizadas por la tienda pueden entrar.
          </p>

          <div className="pt-2 border-t border-cuero-arena/50 space-y-3 text-center">

            <button
              onClick={onNavigateHome}
              className="text-xs text-cuero-cognac hover:text-cuero-espresso font-bold flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la Tienda Pública</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // MAIN ADMIN SHELL
  return (
    <div className="min-h-screen bg-brand-cream flex flex-col lg:flex-row">
      
      {/* 1. Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-cuero-espresso text-cuero-marfil shrink-0 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-cuero-cognac/40 shadow-xl">
        
        {/* Top Logo & Brand */}
        <div>
          <div className="p-6 border-b border-cuero-cognac/30 space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Logo Morrales y Algo Más"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full shadow"
              />
              <div>
                <h1 className="font-heading font-bold text-sm text-cuero-marfil leading-tight">
                  Morrales Admin
                </h1>
                <span className="text-[10px] text-accent-gold font-mono uppercase tracking-wider">
                  Panel de Control
                </span>
              </div>
            </div>

            {/* Supabase PostgreSQL Badge */}
            <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] font-mono ${
              isSupabaseConfigured 
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
            }`}>
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{isSupabaseConfigured ? 'Supabase Live' : 'Modo Offline/Cache'}</span>
              </span>
              <span className="text-[10px] opacity-75">{products.length} ítems</span>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="p-4 space-y-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                activeTab === 'stats' 
                  ? 'bg-cuero-cognac text-white shadow-md' 
                  : 'text-cuero-arena hover:bg-cuero-marfil/10 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-brand-teal" />
              <span>Dashboard & KPIs</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                activeTab === 'catalog' 
                  ? 'bg-cuero-cognac text-white shadow-md' 
                  : 'text-cuero-arena hover:bg-cuero-marfil/10 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4 text-brand-teal" />
              <span>Catálogo & Stock ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                activeTab === 'orders' 
                  ? 'bg-cuero-cognac text-white shadow-md' 
                  : 'text-cuero-arena hover:bg-cuero-marfil/10 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-brand-teal" />
              <span>Pedidos ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('promotions')}
              className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                activeTab === 'promotions' 
                  ? 'bg-cuero-cognac text-white shadow-md' 
                  : 'text-cuero-arena hover:bg-cuero-marfil/10 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-brand-red" />
              <span>Promos & Countdown</span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                activeTab === 'customers' 
                  ? 'bg-cuero-cognac text-white shadow-md' 
                  : 'text-cuero-arena hover:bg-cuero-marfil/10 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-accent-gold" />
              <span>Clientes ({summarizeCustomers(orders).length})</span>
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-cuero-cognac/30 space-y-2 text-xs font-semibold">
          <button
            onClick={onNavigateHome}
            className="w-full p-2.5 rounded-xl bg-cuero-marfil/10 hover:bg-cuero-marfil/20 text-cuero-marfil flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ir a Tienda Pública</span>
          </button>

          {!isSupabaseConfigured && (
            <button
              onClick={handleResetData}
              title="Restaurar datos iniciales"
              className="w-full p-2 rounded-xl text-cuero-arena/70 hover:text-white hover:bg-cuero-marfil/5 flex items-center justify-center gap-1.5 transition-colors text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Resetear Datos Demo</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full p-2 rounded-xl text-brand-red/80 hover:text-brand-red hover:bg-brand-red/10 flex items-center justify-center gap-1.5 transition-colors text-[11px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'stats' && (
            <AdminStats products={products} orders={orders} />
          )}

          {activeTab === 'catalog' && (
            <AdminCatalog products={products} categories={categories} onRefresh={onRefreshData} />
          )}

          {activeTab === 'orders' && (
            <AdminOrders orders={orders} onRefresh={onRefreshData} />
          )}

          {activeTab === 'promotions' && (
            <AdminPromotions products={products} onRefresh={onRefreshData} />
          )}

          {activeTab === 'customers' && (
            <AdminCustomers orders={orders} />
          )}
        </div>
      </main>

    </div>
  );
};
