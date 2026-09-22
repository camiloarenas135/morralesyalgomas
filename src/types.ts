// ==========================================
// types.ts — Morrales y Algo Más
// ==========================================

export interface Category {
  id: string;
  name: string;
  slug?: string;
  created_at?: string;
}

export interface ProductVariant {
  name: string;        // ej: "Café Caramelo", "Negro Mate", "Talla Mediana (M)"
  price?: string;      // "$189.900" (si difiere del base)
  image?: string;      // URL opcional de la variante específica
  colorHex?: string;   // ej: "#8B4513"
}

export interface Product {
  id: string;
  name: string;
  price: string;               // ej: "$189.900"
  category: string;            // "Bolsos", "Morrales", "Billeteras", "Cinturones", etc.
  stock: number;
  description: string;
  images: string[];
  variants: ProductVariant[];
  promo_price?: string;        // ej: "$149.900"
  promo_end_date?: string;     // ISO 8601 string para el countdown
  // Campos específicos de marroquinería y artesanía:
  material_type?: string;      // "Cuero 100% Vacuno", "Cuero Graso Envejecido", "Cuero Vegano Premium"
  dimensions?: string;         // "38cm × 30cm × 14cm"
  weight?: string;             // "650g"
  sku?: string;                // "MOR-001-CUERO"
  care_instructions?: string;  // "Limpiar con paño ligeramente húmedo..."
  handmade?: boolean;          // true para destacar "Hecho a Mano"
  created_at?: string;
}

export interface OrderCartItem {
  id: string;
  productId: string;
  name: string;
  price: string;
  quantity: number;
  image?: string;
  selectedVariant?: ProductVariant;
  maxStock: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  payment_method: string;       // "Nequi", "Daviplata", "Bancolombia", "Efectivo contra entrega"
  items: OrderCartItem[];
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'cancelled';
  notes?: string;
  created_at?: string;
}

export interface FilterState {
  category: string;
  searchQuery: string;
  minPrice: number;
  maxPrice: number;
  selectedMaterial: string;
  selectedColor: string;
  onlyPromos: boolean;
  onlyHandmade: boolean;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  discountBadge: string;
  imageUrl: string;
  ctaText: string;
  categoryFilter?: string;
  accentColor?: string;
}
