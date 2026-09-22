// ==========================================
// supabase.ts — Cliente Supabase & StoreManager Híbrido
// Conexión en Tiempo Real a PostgreSQL + Fallback LocalStorage
// ==========================================

import { createClient } from '@supabase/supabase-js';
import { Product, Order, Category } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, MOCK_CATEGORIES } from '../data/mockProducts';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your_supabase_anon')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// ==========================================
// AdminAuth: sesión real de Supabase Auth + allowlist server-side
// La verificación definitiva es RLS (is_admin()); esto solo decide qué UI mostrar.
// ==========================================

export type AdminSessionState =
  | { status: 'admin' }
  | { status: 'none' }
  | { status: 'denied'; email: string };

export const AdminAuth = {
  /** Sin Supabase configurado solo se permite el modo demo local en desarrollo. */
  isDemoMode: !isSupabaseConfigured && import.meta.env.DEV,

  /**
   * Evalúa la sesión actual. También procesa el regreso de Google (el código
   * llega en la URL y supabase-js lo canjea antes de resolver getSession).
   * Una cuenta de Google que no está en admin_emails se cierra de inmediato.
   */
  async checkSession(): Promise<AdminSessionState> {
    if (!supabase) return { status: this.isDemoMode ? 'admin' : 'none' };

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { status: 'none' };

    const { data, error } = await supabase.rpc('is_admin');
    if (!error && data === true) return { status: 'admin' };

    await supabase.auth.signOut();
    return { status: 'denied', email: session.user.email ?? '' };
  },

  /** Redirige a Google; al volver, checkSession() completa el ingreso. */
  async signInWithGoogle(): Promise<{ error: string | null }> {
    if (!supabase) {
      return { error: 'La base de datos no está configurada.' };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin`,
        queryParams: { prompt: 'select_account' }
      }
    });
    return { error: error ? 'No se pudo iniciar sesión con Google. Intenta de nuevo.' : null };
  },

  async signOut(): Promise<void> {
    if (supabase) await supabase.auth.signOut();
  },

  /** Avisa cuando la sesión termina (logout, token vencido, otra pestaña). */
  onSignedOut(callback: () => void): () => void {
    if (!supabase) return () => {};
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') callback();
    });
    return () => data.subscription.unsubscribe();
  }
};


// ==========================================
// Utilidades internas
// ==========================================

// Datos de ejemplo únicamente en desarrollo y sin Supabase; un build de producción
// sin configurar mostraría la tienda vacía en lugar de productos falsos.
const DEMO_DATA = !isSupabaseConfigured && import.meta.env.DEV;

// Caché local: solo el catálogo público. Los pedidos (datos personales)
// nunca se guardan en el navegador cuando hay Supabase.
const STORAGE_KEYS = {
  PRODUCTS: 'morrales_products_v2',
  ORDERS: 'morrales_orders_v2',
  CATEGORIES: 'morrales_categories_v2'
};

// Limpia cachés de versiones anteriores (incluían datos de demostración).
try {
  ['products', 'orders', 'vip', 'categories'].forEach((k) => localStorage.removeItem(`morrales_${k}_v1`));
  localStorage.removeItem('morrales_vip_v2'); // el Club VIP ya no existe
} catch {
  /* localStorage no disponible */
}

function readCache<T>(key: string): T[] | null {
  try {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T[]) : null;
  } catch (e) {
    console.warn(`Error reading cache ${key}:`, e);
    return null;
  }
}

function writeCache<T>(key: string, value: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error writing cache ${key}:`, e);
  }
}

/** Identificador corto y prácticamente sin colisiones (ej. "ORD-3F9A1C2B"). */
function newId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 8)
      : Math.random().toString(16).slice(2, 10).padEnd(8, '0');
  return `${prefix}-${random.toUpperCase()}`;
}

/** Convierte un error de Supabase en uno legible para mostrar en la interfaz. */
function toFriendlyError(action: string, error: { message: string; code?: string }): Error {
  console.error(`[Supabase] ${action}:`, error);
  const denied = error.code === '42501' || /row-level security|permission denied|jwt/i.test(error.message);
  return new Error(
    denied
      ? 'Tu sesión expiró o no tiene permisos. Vuelve a iniciar sesión.'
      : `${action}: ${error.message}`
  );
}

const NO_ROWS_MESSAGE = 'No se guardó el cambio: el registro no existe o tu sesión no tiene permisos.';

function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

// ==========================================
// StoreManager
//  - Con Supabase: la base de datos es la fuente de verdad. Toda escritura espera
//    la confirmación del servidor y lanza un Error si falla (RLS, red, etc.).
//  - Sin Supabase (solo desarrollo): modo demo con datos de ejemplo en localStorage.
// ==========================================

export class StoreManager {
  // ------------------------------------------
  // PRODUCTOS
  // ------------------------------------------

  static getProducts(): Product[] {
    const cached = readCache<Product>(STORAGE_KEYS.PRODUCTS);
    if (cached) return cached;
    if (!DEMO_DATA) return [];
    writeCache(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    return INITIAL_PRODUCTS;
  }

  static saveProducts(products: Product[]): void {
    writeCache(STORAGE_KEYS.PRODUCTS, products);
  }

  /** Carga los productos desde Supabase; si falla la red, usa la última copia local. */
  static async fetchRemoteProducts(): Promise<Product[]> {
    if (!supabase) return this.getProducts();

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch products error:', error.message);
      return this.getProducts();
    }

    const products: Product[] = (data ?? []).map((item) => ({
      ...item,
      images: parseJsonArray<string>(item.images),
      variants: parseJsonArray(item.variants)
    }));
    this.saveProducts(products);
    return products;
  }

  static async addProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: newId('prod'),
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { error } = await supabase.from('products').insert({
        id: newProduct.id,
        name: newProduct.name,
        price: newProduct.price,
        promo_price: newProduct.promo_price || null,
        promo_end_date: newProduct.promo_end_date || null,
        category: newProduct.category,
        stock: newProduct.stock,
        description: newProduct.description,
        images: newProduct.images || [],
        variants: newProduct.variants || [],
        material_type: newProduct.material_type || null,
        dimensions: newProduct.dimensions || null,
        weight: newProduct.weight || null,
        sku: newProduct.sku || null,
        care_instructions: newProduct.care_instructions || null,
        handmade: Boolean(newProduct.handmade)
      });
      if (error) throw toFriendlyError('No se pudo crear el producto', error);
    }

    this.saveProducts([newProduct, ...this.getProducts()]);
    return newProduct;
  }

  /**
   * Actualiza campos de un producto. Una clave presente con valor `undefined`
   * significa "borrar el valor" (p. ej. quitar una promoción).
   */
  static async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    if (supabase) {
      const nullable = ['promo_price', 'promo_end_date', 'material_type', 'dimensions', 'weight', 'sku', 'care_instructions'] as const;
      const direct = ['name', 'price', 'category', 'stock', 'description', 'images', 'variants', 'handmade'] as const;

      const payload: Record<string, unknown> = {};
      for (const key of direct) {
        if (key in updates && updates[key] !== undefined) payload[key] = updates[key];
      }
      for (const key of nullable) {
        if (key in updates) payload[key] = updates[key] || null;
      }

      if (Object.keys(payload).length > 0) {
        const { data, error } = await supabase.from('products').update(payload).eq('id', id).select('id');
        if (error) throw toFriendlyError('No se pudo actualizar el producto', error);
        if (!data || data.length === 0) throw new Error(NO_ROWS_MESSAGE);
      }
    }

    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    products[index] = { ...products[index], ...updates };
    this.saveProducts(products);
    return products[index];
  }

  static async deleteProduct(id: string): Promise<void> {
    if (supabase) {
      const { data, error } = await supabase.from('products').delete().eq('id', id).select('id');
      if (error) throw toFriendlyError('No se pudo eliminar el producto', error);
      if (!data || data.length === 0) throw new Error(NO_ROWS_MESSAGE);
    }
    this.saveProducts(this.getProducts().filter((p) => p.id !== id));
  }

  // ------------------------------------------
  // PEDIDOS (ORDERS)  — solo visibles para el administrador
  // ------------------------------------------

  static getOrders(): Order[] {
    if (!DEMO_DATA) return [];
    const cached = readCache<Order>(STORAGE_KEYS.ORDERS);
    if (cached) return cached;
    writeCache(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    return INITIAL_ORDERS;
  }

  static async fetchRemoteOrders(): Promise<Order[]> {
    if (!supabase) return this.getOrders();

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch orders error:', error.message);
      return [];
    }

    return (data ?? []).map((o) => ({
      ...o,
      total_amount: Number(o.total_amount),
      items: parseJsonArray(o.items)
    }));
  }

  /** Genera el identificador antes de guardar para poder incluirlo en el mensaje de WhatsApp. */
  static generateOrderId(): string {
    return newId('ORD');
  }

  static async addOrder(order: Omit<Order, 'created_at'>): Promise<Order> {
    const newOrder: Order = { ...order, created_at: new Date().toISOString() };

    if (supabase) {
      const { error } = await supabase.from('orders').insert({
        id: newOrder.id,
        customer_name: newOrder.customer_name,
        customer_phone: newOrder.customer_phone,
        delivery_address: newOrder.delivery_address,
        payment_method: newOrder.payment_method,
        items: newOrder.items || [],
        total_amount: newOrder.total_amount,
        status: newOrder.status,
        notes: newOrder.notes || null
      });
      if (error) throw toFriendlyError('No se pudo registrar el pedido', error);
    } else {
      writeCache(STORAGE_KEYS.ORDERS, [newOrder, ...this.getOrders()]);
    }

    return newOrder;
  }

  static async updateOrderStatus(id: string, status: Order['status']): Promise<void> {
    if (supabase) {
      const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select('id');
      if (error) throw toFriendlyError('No se pudo actualizar el pedido', error);
      if (!data || data.length === 0) throw new Error(NO_ROWS_MESSAGE);
      return;
    }
    writeCache(
      STORAGE_KEYS.ORDERS,
      this.getOrders().map((o) => (o.id === id ? { ...o, status } : o))
    );
  }

  // ------------------------------------------
  // CATEGORÍAS
  // ------------------------------------------

  static getCategories(): Category[] {
    const cached = readCache<Category>(STORAGE_KEYS.CATEGORIES);
    if (cached) return cached;
    return DEMO_DATA ? MOCK_CATEGORIES : [];
  }

  static saveCategories(categories: Category[]): void {
    writeCache(STORAGE_KEYS.CATEGORIES, categories);
  }

  static async fetchRemoteCategories(): Promise<Category[]> {
    if (!supabase) return this.getCategories();

    const { data, error } = await supabase.from('categories').select('*').order('name');

    if (error) {
      console.warn('Supabase fetch categories error:', error.message);
      return this.getCategories();
    }

    const categories = data ?? [];
    this.saveCategories(categories);
    return categories;
  }

  // ------------------------------------------
  // SUBIDA DE ARCHIVOS A SUPABASE STORAGE (solo administrador)
  // ------------------------------------------

  static async uploadProductImage(file: File): Promise<string | null> {
    if (!supabase) {
      console.warn('Supabase no está configurado para subir imágenes.');
      return null;
    }

    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const filePath = `products/product-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.error('Error uploading image to Supabase Storage:', uploadError);
        return null;
      }

      return supabase.storage.from('product-images').getPublicUrl(filePath).data.publicUrl;
    } catch (e) {
      console.error('Unexpected error uploading image:', e);
      return null;
    }
  }

  /** Restaura los datos de ejemplo (solo modo demo sin Supabase). */
  static resetToDefaults(): void {
    if (!DEMO_DATA) return;
    writeCache(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    writeCache(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  }
}
