// ==========================================
// mockProducts.ts — Dataset Maestro de Marroquinería
// ==========================================

import { Product, Category, Order, PromoBanner } from '../types';

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Morrales', slug: 'morrales' },
  { id: 'cat-2', name: 'Bolsos', slug: 'bolsos' },
  { id: 'cat-3', name: 'Billeteras', slug: 'billeteras' },
  { id: 'cat-4', name: 'Cinturones', slug: 'cinturones' },
  { id: 'cat-5', name: 'Maletines', slug: 'maletines' },
  { id: 'cat-6', name: 'Accesorios', slug: 'accesorios' },
  { id: 'cat-7', name: 'Edición Limitada', slug: 'edicion-limitada' },
];

export const MOCK_BANNERS: PromoBanner[] = [
  {
    id: 'banner-1',
    title: 'Colección Artesanal 2026',
    subtitle: 'Cuero 100% seleccionado a mano con acabados de alta gama y costura reforzada.',
    discountBadge: 'HASTA 35% DCTO',
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=80',
    ctaText: 'Explorar Ofertas Especiales',
    categoryFilter: 'Morrales',
    accentColor: '#C41E3A'
  },
  {
    id: 'banner-2',
    title: 'Bolsos Tote & Maletines Ejecutivos',
    subtitle: 'Elegancia intemporal para tu día a día, reuniones y viajes.',
    discountBadge: 'ENVÍO GRATIS NACIONAL',
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=80',
    ctaText: 'Ver Colección Ejecutiva',
    categoryFilter: 'Bolsos',
    accentColor: '#5CB8B2'
  },
  {
    id: 'banner-3',
    title: 'Billeteras & Portapaspasaportes Slim',
    subtitle: 'Diseño minimalista con bloqueo RFID y textura de cuero genuino.',
    discountBadge: '2x1 EN SEGUNDA UNIDAD',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=80',
    ctaText: 'Comprar Accesorios',
    categoryFilter: 'Billeteras',
    accentColor: '#8B4513'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Morral Urbano Explorer en Cuero Graso',
    price: '$269.900',
    promo_price: '$189.900',
    promo_end_date: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(), // 36 horas
    category: 'Morrales',
    stock: 12,
    description: 'Morral ergonómico fabricado en cuero graso genuino con compartimento acolchado para laptop de hasta 15.6 pulgadas. Herrajes en bronce envejecido anticorrosión y correas reforzadas con almohadilla transpirable.',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { name: 'Café Cognac', colorHex: '#8B4513' },
      { name: 'Negro Azabache', colorHex: '#1C1917' },
      { name: 'Miel Caramelo', colorHex: '#C68E5B' }
    ],
    material_type: 'Cuero Vacuno Graso 100%',
    dimensions: '42cm × 31cm × 15cm',
    weight: '980g',
    sku: 'MOR-EXP-001',
    care_instructions: 'Hidratar con cera natural incolora cada 4 meses. Evitar contacto prolongado con agua directa.',
    handmade: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-002',
    name: 'Bolso Tote Toscana Artesanal',
    price: '$220.000',
    promo_price: '$165.000',
    promo_end_date: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    category: 'Bolsos',
    stock: 8,
    description: 'Bolso amplio de silueta estructurada, confeccionado en cuero grabado con grano fino. Cierre central de cremallera YKK, forro interno en satín impermeable y bolsillo organizador para celular y llaves.',
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { name: 'Caramelo Natural', colorHex: '#C68E5B' },
      { name: 'Rojo Borgoña', colorHex: '#800020' },
      { name: 'Café Espresso', colorHex: '#3C1A0B' }
    ],
    material_type: 'Cuero Grano Plena Flor',
    dimensions: '36cm × 30cm × 13cm',
    weight: '620g',
    sku: 'BOL-TOS-002',
    care_instructions: 'Limpiar con un paño de microfibra ligeramente húmedo y guardar en su funda de tela protectora.',
    handmade: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-003',
    name: 'Billetera Bifold Classic con Protección RFID',
    price: '$89.900',
    promo_price: '$64.900',
    promo_end_date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    category: 'Billeteras',
    stock: 25,
    description: 'Billetera de perfil ultradelgado con 8 ranuras para tarjetas, doble división para billetes y lámina de bloqueo electromagnético RFID para protección contra clonación de tarjetas.',
    images: [
      'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { name: 'Marrón Oscuro', colorHex: '#4A2C11' },
      { name: 'Negro Clásico', colorHex: '#1A1A1A' }
    ],
    material_type: 'Cuero Napa Suave',
    dimensions: '11cm × 8.5cm × 1.2cm',
    weight: '85g',
    sku: 'BIL-BIF-003',
    care_instructions: 'No mojar. En caso de suciedad, aplicar crema limpiadora para calzado o cuero fino.',
    handmade: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-004',
    name: 'Maletín Ejecutivo Oxford Vintage',
    price: '$340.000',
    promo_price: '$279.000',
    promo_end_date: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
    category: 'Maletines',
    stock: 6,
    description: 'Maletín de negocios premium en cuero envejecido estilo pull-up. Posee asa de mano reforzada y correa de hombro ajustable desmontable. Múltiples separadores internos para documentos tamaño carta y tablet.',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { name: 'Cuero Habana', colorHex: '#6F4E37' },
      { name: 'Negro Ejecutivo', colorHex: '#18181B' }
    ],
    material_type: 'Cuero Envejecido Pull-Up',
    dimensions: '40cm × 29cm × 10cm',
    weight: '1.25kg',
    sku: 'MAL-OXF-004',
    care_instructions: 'El cuero pull-up adquiere carácter con el uso. Para disimular marcas, frotar suavemente con la yema del dedo.',
    handmade: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-005',
    name: 'Cinturón Reversible de Cuero Genuino',
    price: '$79.900',
    category: 'Cinturones',
    stock: 18,
    description: 'Cinturón versátil 2 en 1 con hebilla giratoria metálica satinada. Permite alternar entre cara Café Chocolate y cara Negra en un solo giro.',
    images: [
      'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { name: 'Talla 32 (85cm)' },
      { name: 'Talla 34 (90cm)' },
      { name: 'Talla 36 (95cm)' },
      { name: 'Talla 38 (100cm)' }
    ],
    material_type: 'Cuero Crupón Macizo 3.5mm',
    dimensions: 'Ancho 3.5cm',
    weight: '190g',
    sku: 'CIN-REV-005',
    care_instructions: 'Mantener colgado para evitar dobleces permanentes en la curvatura.',
    handmade: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-006',
    name: 'Morral Roll-Top Viking en Cuero & Lona Impermeable',
    price: '$219.900',
    category: 'Morrales',
    stock: 10,
    description: 'Híbrido de alta resistencia que combina lona encerada de 16oz con apliques de cuero graso rústico. Capacidad expandible de 18 a 24 litros mediante sistema roll-top con ganchos de aluminio.',
    images: [
      'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { name: 'Verde Oliva Militar', colorHex: '#4A5320' },
      { name: 'Gris Carbón', colorHex: '#374151' },
      { name: 'Marrón Tierra', colorHex: '#5C4033' }
    ],
    material_type: 'Lona Encerada 16oz + Cuero Rústico',
    dimensions: '45cm (+15cm expandido) × 30cm × 14cm',
    weight: '890g',
    sku: 'MOR-VIK-006',
    care_instructions: 'Limpieza puntual con agua fría y jabón neutro. No meter a lavadora.',
    handmade: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-007',
    name: 'Portapasaporte & Tarjetero de Viaje Nomad',
    price: '$65.000',
    promo_price: '$48.000',
    promo_end_date: new Date(Date.now() + 1000 * 60 * 60 * 50).toISOString(),
    category: 'Accesorios',
    stock: 30,
    description: 'Organizador indispensable para viajes internacionales. Espacio para pasaporte, 4 tarjetas de crédito, pase de abordar y mini bolígrafo metálico incluido.',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { name: 'Cuero Miel', colorHex: '#C68E5B' },
      { name: 'Azul Marino', colorHex: '#1E3A8A' }
    ],
    material_type: 'Cuero Flor Natural',
    dimensions: '14.5cm × 10cm × 1cm',
    weight: '70g',
    sku: 'ACC-PAS-007',
    care_instructions: 'Conservar en lugar seco lejos de la humedad directa.',
    handmade: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-008',
    name: 'Morral Edición Especial "Cacao Colombiano" [Limitada]',
    price: '$389.000',
    category: 'Edición Limitada',
    stock: 3,
    description: 'Serie numerada de solo 20 piezas a nivel nacional. Curtido artesanal con extractos vegetales de corteza de acacia y tintura orgánica inspirada en los granos de cacao de Santander. Incluye certificado de autenticidad y número de serie troquelado en placa de bronce.',
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { name: 'Tono Cacao Profundo #07', colorHex: '#3D2314' }
    ],
    material_type: 'Cuero Vegetal Premium Edición Numerada',
    dimensions: '44cm × 32cm × 16cm',
    weight: '1.1kg',
    sku: 'LTD-CAC-008',
    care_instructions: 'Aplicar bálsamo de cera de abejas una vez al año para nutrir las fibras vegetales.',
    handmade: true,
    created_at: new Date().toISOString()
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-9021',
    customer_name: 'Camila Montoya Gómez',
    customer_phone: '3128459021',
    delivery_address: 'Calle 10 # 43D-25, Poblado, Medellín',
    payment_method: 'Nequi',
    items: [
      {
        id: 'cart-1',
        productId: 'prod-001',
        name: 'Morral Urbano Explorer en Cuero Graso',
        price: '$189.900',
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80',
        selectedVariant: { name: 'Café Cognac', colorHex: '#8B4513' },
        maxStock: 12
      },
      {
        id: 'cart-2',
        productId: 'prod-003',
        name: 'Billetera Bifold Classic',
        price: '$64.900',
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=400&q=80',
        selectedVariant: { name: 'Marrón Oscuro', colorHex: '#4A2C11' },
        maxStock: 25
      }
    ],
    total_amount: 254800,
    status: 'confirmed',
    notes: 'Entregar en portería del edificio.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
  },
  {
    id: 'ORD-9022',
    customer_name: 'Andrés Felipe Restrepo',
    customer_phone: '3007654321',
    delivery_address: 'Carrera 7 # 127-10 Apto 402, Bogotá',
    payment_method: 'Bancolombia',
    items: [
      {
        id: 'cart-3',
        productId: 'prod-004',
        name: 'Maletín Ejecutivo Oxford Vintage',
        price: '$279.000',
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80',
        selectedVariant: { name: 'Cuero Habana', colorHex: '#6F4E37' },
        maxStock: 6
      }
    ],
    total_amount: 279000,
    status: 'shipped',
    notes: 'Guía Servientrega #982341203',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString()
  },
  {
    id: 'ORD-9023',
    customer_name: 'Valentina Duque Serna',
    customer_phone: '3156789012',
    delivery_address: 'Av. Circunvalar # 14-80, Pereira',
    payment_method: 'Daviplata',
    items: [
      {
        id: 'cart-4',
        productId: 'prod-002',
        name: 'Bolso Tote Toscana Artesanal',
        price: '$165.000',
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80',
        selectedVariant: { name: 'Caramelo Natural', colorHex: '#C68E5B' },
        maxStock: 8
      }
    ],
    total_amount: 165000,
    status: 'pending',
    notes: 'Por favor confirmar recepción de comprobante por WhatsApp.',
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString()
  }
];
