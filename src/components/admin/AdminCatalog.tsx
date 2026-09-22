import React, { useState } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, Image as ImageIcon,
  Layers, Check, AlertCircle, Sparkles, HandMetal, Package,
  Upload, Loader2, Star, Link as LinkIcon
} from 'lucide-react';
import { Product, ProductVariant, Category } from '../../types';
import { StoreManager } from '../../lib/supabase';
import { formatCOP, parseCOP, isPromoActive } from '../../utils/promoHelpers';
import { sanitizeInput } from '../../utils/sanitize';
import { ErrorBanner, errorMessage } from './ErrorBanner';
import { ImageCropModal } from './ImageCropModal';

interface AdminCatalogProps {
  products: Product[];
  categories: Category[];
  onRefresh: () => void;
}

export const AdminCatalog: React.FC<AdminCatalogProps> = ({
  products,
  categories,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Morrales');
  const [stock, setStock] = useState(10);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [materialType, setMaterialType] = useState('Cuero Vacuno Genuino');
  const [dimensions, setDimensions] = useState('40cm × 30cm × 12cm');
  const [weight, setWeight] = useState('850g');
  const [sku, setSku] = useState('');
  const [careInstructions, setCareInstructions] = useState('Limpiar con paño húmedo y aplicar cera incolora.');
  const [handmade, setHandmade] = useState(true);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Producto en edición, solo para mostrar su estado de promo (se gestiona en la pestaña Promociones)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Variant input
  const [variantName, setVariantName] = useState('');
  const [variantColorHex, setVariantColorHex] = useState('#8B4513');
  const [uploadingVariantIdx, setUploadingVariantIdx] = useState<number | null>(null);

  // Supabase Storage image upload
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Cola de recorte: se llena al elegir archivo(s) y se procesa uno a la vez
  // con ImageCropModal antes de subir cada foto (producto o variante).
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [cropBatchTotal, setCropBatchTotal] = useState(0);
  const [cropTarget, setCropTarget] = useState<'gallery' | 'variant' | null>(null);
  const [cropVariantIdx, setCropVariantIdx] = useState<number | null>(null);

  // Errores de guardado / borrado
  const [actionError, setActionError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const uploadFile = async (file: File): Promise<string | null> => {
    return StoreManager.uploadProductImage(file);
  };

  // El input de archivo solo encola: la subida real ocurre tras recortar cada foto.
  const handleAddImagesFromDevice = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // permite volver a elegir el mismo archivo más tarde
    if (files.length === 0) return;
    setUploadError(null);
    setCropTarget('gallery');
    setCropVariantIdx(null);
    setCropBatchTotal(files.length);
    setCropQueue(files);
  };

  /** Avanza la cola de recorte (éxito u "omitir"); si era la última, la cierra. */
  const advanceCropQueue = () => {
    const wasLast = cropQueue.length <= 1;
    setCropQueue((prev) => prev.slice(1));
    if (wasLast) {
      setCropTarget(null);
      setCropVariantIdx(null);
      setCropBatchTotal(0);
    }
  };

  const handleCropConfirm = async (croppedFile: File) => {
    if (cropTarget === 'gallery') {
      setIsUploadingImages(true);
      try {
        const url = await uploadFile(croppedFile);
        if (!url) throw new Error('No se pudo subir la foto al almacenamiento.');
        setImages((prev) => [...prev, url]);
      } finally {
        setIsUploadingImages(false);
      }
    } else if (cropTarget === 'variant' && cropVariantIdx !== null) {
      setUploadingVariantIdx(cropVariantIdx);
      try {
        const url = await uploadFile(croppedFile);
        if (!url) throw new Error('No se pudo subir la foto de la variante.');
        setVariants((prev) => prev.map((v, i) => (i === cropVariantIdx ? { ...v, image: url } : v)));
      } finally {
        setUploadingVariantIdx(null);
      }
    }
    advanceCropQueue();
  };

  const handleAddImageUrl = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    setImages((prev) => [...prev, url]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSetPrimaryImage = (idx: number) => {
    setImages((prev) => {
      if (idx <= 0 || idx >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.unshift(item);
      return copy;
    });
  };

  // Foto propia de una variante (ej: el mismo bolso en otro color). Si no tiene,
  // la tienda usa la foto principal del producto. También pasa por el recorte.
  const handleVariantFileSelected = (idx: number, file: File) => {
    setUploadError(null);
    setCropTarget('variant');
    setCropVariantIdx(idx);
    setCropBatchTotal(1);
    setCropQueue([file]);
  };

  const handleRemoveVariantImage = (idx: number) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, image: undefined } : v)));
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setActionError('');
    setEditingProductId(null);
    setEditingProduct(null);
    setName('');
    setPrice('$189.900');
    setCategory(categories[0]?.name || 'Morrales');
    setStock(10);
    setDescription('');
    setImages(['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80']);
    setNewImageUrl('');
    setMaterialType('Cuero Vacuno 100%');
    setDimensions('38cm × 28cm × 12cm');
    setWeight('750g');
    setSku(`MOR-${Math.floor(100 + Math.random() * 900)}`);
    setCareInstructions('Limpiar con paño seco y proteger de la lluvia excesiva.');
    setHandmade(true);
    setVariants([
      { name: 'Café Caramelo', colorHex: '#C68E5B' },
      { name: 'Negro Azabache', colorHex: '#1C1917' }
    ]);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (prod: Product) => {
    setActionError('');
    setEditingProductId(prod.id);
    setEditingProduct(prod);
    setName(prod.name);
    setPrice(prod.price);
    setCategory(prod.category);
    setStock(prod.stock);
    setDescription(prod.description);
    setImages(prod.images && prod.images.length > 0 ? prod.images : []);
    setNewImageUrl('');
    setMaterialType(prod.material_type || '');
    setDimensions(prod.dimensions || '');
    setWeight(prod.weight || '');
    setSku(prod.sku || '');
    setCareInstructions(prod.care_instructions || '');
    setHandmade(Boolean(prod.handmade));
    setVariants(prod.variants || []);
    setIsModalOpen(true);
  };

  // Save product (Create / Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeInput(name);
    if (!cleanName) return;
    if (images.length === 0) {
      setActionError('Agrega al menos una fotografía del producto.');
      return;
    }

    // promo_price / promo_end_date NO se tocan desde aquí: la pestaña
    // Promociones es la única fuente de verdad para no pisar el countdown
    // ya configurado con un guardado suelto de la ficha del producto.
    const payload = {
      name: cleanName,
      price: price.startsWith('$') ? price : `$${price}`,
      category,
      stock: Number(stock),
      description: sanitizeInput(description),
      images,
      material_type: sanitizeInput(materialType),
      dimensions: sanitizeInput(dimensions),
      weight: sanitizeInput(weight),
      sku: sanitizeInput(sku),
      care_instructions: sanitizeInput(careInstructions),
      handmade,
      variants
    };

    setActionError('');
    setIsSaving(true);
    try {
      if (editingProductId) {
        await StoreManager.updateProduct(editingProductId, payload);
      } else {
        await StoreManager.addProduct(payload);
      }
    } catch (err) {
      // El modal sigue abierto para no perder lo que el administrador escribió.
      setActionError(errorMessage(err));
      return;
    } finally {
      setIsSaving(false);
    }

    setIsModalOpen(false);
    onRefresh();
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto del inventario?')) return;
    try {
      await StoreManager.deleteProduct(id);
    } catch (err) {
      setActionError(errorMessage(err));
      return;
    }
    setActionError('');
    onRefresh();
  };

  // Add Variant
  const handleAddVariant = () => {
    if (!variantName.trim()) return;
    setVariants([...variants, { name: variantName.trim(), colorHex: variantColorHex }]);
    setVariantName('');
  };

  const handleRemoveVariant = (idx: number) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  // Filtered list
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCatFilter === 'all' || p.category === selectedCatFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {!isModalOpen && <ErrorBanner message={actionError} onDismiss={() => setActionError('')} />}

      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-cuero-espresso">
            Gestión de Catálogo e Inventario
          </h2>
          <p className="text-xs text-cuero-cognac">
            Administra piezas de marroquinería, fotos, variantes y fichas técnicas
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-cuero-espresso hover:bg-cuero-cognac text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 text-brand-teal" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* 2. Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-cuero-marfil rounded-2xl border border-cuero-arena/70">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-brand-cream border border-cuero-arena rounded-xl text-xs text-cuero-espresso focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
          />
          <Search className="w-4 h-4 text-cuero-cognac absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <span className="text-xs text-cuero-cognac font-bold hidden sm:inline">Categoría:</span>
          <select
            value={selectedCatFilter}
            onChange={(e) => setSelectedCatFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-brand-cream border border-cuero-arena rounded-xl text-xs font-semibold text-cuero-espresso"
          >
            <option value="all">Todas las Categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3a. Products Cards — solo móvil/tablet (< md) */}
      <div className="md:hidden space-y-3">
        {filteredProducts.map((prod) => (
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
                <span className="font-mono text-[10px] text-cuero-cognac block">{prod.sku || 'SIN-SKU'}</span>
                <span className="text-[10px] text-cuero-caramelo font-semibold">{prod.category}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleOpenEdit(prod)}
                  className="p-2 rounded-lg bg-cuero-arena/30 hover:bg-cuero-cognac hover:text-white transition-colors"
                  title="Editar producto"
                  aria-label="Editar producto"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteProduct(prod.id)}
                  className="p-2 rounded-lg bg-brand-red/10 text-brand-red hover:bg-brand-red hover:text-white transition-colors"
                  title="Eliminar producto"
                  aria-label="Eliminar producto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-cuero-arena/40">
              <div>
                <span className="text-cuero-cognac font-bold block text-[10px] uppercase">Precio</span>
                <span className="font-bold text-cuero-espresso">{prod.price}</span>
                {prod.promo_price && (
                  <span className={`font-black block ${isPromoActive(prod) ? 'text-brand-red' : 'text-gray-400 line-through'}`}>
                    {prod.promo_price}
                  </span>
                )}
              </div>
              <div>
                <span className="text-cuero-cognac font-bold block text-[10px] uppercase">Stock</span>
                <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  prod.stock > 5 ? 'bg-accent-olive/20 text-accent-olive' :
                  prod.stock > 0 ? 'bg-accent-gold/20 text-cuero-espresso' :
                  'bg-brand-red/20 text-brand-red'
                }`}>
                  {prod.stock} un.
                </span>
              </div>
            </div>

            {prod.handmade && (
              <span className="text-accent-gold font-bold text-[10px] flex items-center gap-1">
                <Check className="w-3 h-3" /> Hecho a Mano
              </span>
            )}
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="p-10 text-center text-cuero-cognac text-xs space-y-2 bg-cuero-marfil rounded-2xl border border-cuero-arena/70">
            <Package className="w-8 h-8 mx-auto text-cuero-arena" />
            <p>Ningún producto coincide con la búsqueda o el filtro.</p>
          </div>
        )}
      </div>

      {/* 3b. Products Table — solo escritorio (md+) */}
      <div className="hidden md:block bg-cuero-marfil rounded-2xl border border-cuero-arena/70 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-cuero-espresso">
            <thead className="bg-cuero-espresso text-cuero-marfil uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="p-3.5">Foto</th>
                <th className="p-3.5">Artículo & SKU</th>
                <th className="p-3.5">Categoría</th>
                <th className="p-3.5">Precio Base</th>
                <th className="p-3.5">Oferta</th>
                <th className="p-3.5">Stock</th>
                <th className="p-3.5">Artesanal</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cuero-arena/40">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-brand-cream/60 transition-colors">
                  <td className="p-3.5">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-cuero-arena/30 border border-cuero-arena/50 shrink-0">
                      <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-cuero-espresso block text-xs">{prod.name}</span>
                    <span className="font-mono text-[10px] text-cuero-cognac">{prod.sku || 'SIN-SKU'}</span>
                  </td>
                  <td className="p-3.5 font-semibold text-cuero-cognac">
                    {prod.category}
                  </td>
                  <td className="p-3.5 font-bold text-cuero-espresso">
                    {prod.price}
                  </td>
                  <td className="p-3.5">
                    {prod.promo_price ? (
                      <span className={`font-black ${isPromoActive(prod) ? 'text-brand-red' : 'text-gray-400 line-through'}`}>
                        {prod.promo_price}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      prod.stock > 5 ? 'bg-accent-olive/20 text-accent-olive' :
                      prod.stock > 0 ? 'bg-accent-gold/20 text-cuero-espresso' :
                      'bg-brand-red/20 text-brand-red'
                    }`}>
                      {prod.stock} un.
                    </span>
                  </td>
                  <td className="p-3.5">
                    {prod.handmade ? (
                      <span className="text-accent-gold font-bold text-[10px] flex items-center gap-1">
                        <Check className="w-3 h-3" /> Hecho a Mano
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[10px]">Estándar</span>
                    )}
                  </td>
                  <td className="p-3.5 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(prod)}
                      className="p-1.5 rounded-lg bg-cuero-arena/30 hover:bg-cuero-cognac hover:text-white transition-colors"
                      title="Editar producto"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="p-1.5 rounded-lg bg-brand-red/10 text-brand-red hover:bg-brand-red hover:text-white transition-colors"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cuero-espresso/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-brand-cream rounded-3xl p-6 sm:p-8 shadow-2xl border border-cuero-arena space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-cuero-arena/50 pb-4">
              <h3 className="font-heading font-extrabold text-xl text-cuero-espresso">
                {editingProductId ? 'Editar Artículo de Marroquinería' : 'Nuevo Artículo de Marroquinería'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-cuero-cognac hover:text-cuero-espresso rounded-full hover:bg-cuero-arena/30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-cuero-espresso block mb-1">Nombre del Producto *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-cuero-marfil border border-cuero-arena font-medium"
                    placeholder="Ej: Morral Urbano Explorer"
                  />
                </div>

                <div>
                  <label className="font-bold text-cuero-espresso block mb-1">Categoría *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-cuero-marfil border border-cuero-arena font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-cuero-espresso block mb-1">Precio Base (COP) *</label>
                  <input
                    type="text"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-cuero-marfil border border-cuero-arena font-bold text-cuero-espresso"
                    placeholder="Ej: $189.900"
                  />
                </div>

                <div>
                  <label className="font-bold text-cuero-espresso block mb-1">Precio Promocional</label>
                  <div className="w-full p-2.5 rounded-xl bg-cuero-marfil border border-cuero-arena flex items-center justify-between gap-2">
                    {editingProduct && isPromoActive(editingProduct) ? (
                      <span className="font-black text-brand-red">{editingProduct.promo_price}</span>
                    ) : (
                      <span className="text-cuero-cognac/70 font-medium">Sin promoción activa</span>
                    )}
                    <span className="text-[10px] text-cuero-cognac font-bold flex items-center gap-1 shrink-0">
                      <Sparkles className="w-3 h-3 text-brand-red" />
                      Gestionar en Promociones
                    </span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-cuero-espresso block mb-1">Stock Disponible *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-cuero-marfil border border-cuero-arena font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-cuero-espresso block mb-1">SKU / Código</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-cuero-marfil border border-cuero-arena font-mono"
                    placeholder="Ej: MOR-001-CUERO"
                  />
                </div>
              </div>

              {/* Marroquinería specs */}
              <div className="p-4 bg-cuero-marfil rounded-2xl border border-cuero-arena/60 space-y-3">
                <span className="font-bold text-cuero-caramelo uppercase tracking-wider block text-[11px]">
                  Atributos de Marroquinería & Artesanía
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-cuero-espresso block mb-1">Tipo de Material</label>
                    <input
                      type="text"
                      value={materialType}
                      onChange={(e) => setMaterialType(e.target.value)}
                      className="w-full p-2 rounded-lg bg-brand-cream border border-cuero-arena"
                      placeholder="Ej: Cuero Vacuno Graso"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-cuero-espresso block mb-1">Dimensiones</label>
                    <input
                      type="text"
                      value={dimensions}
                      onChange={(e) => setDimensions(e.target.value)}
                      className="w-full p-2 rounded-lg bg-brand-cream border border-cuero-arena"
                      placeholder="Ej: 42cm × 30cm × 14cm"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-cuero-espresso block mb-1">Peso</label>
                    <input
                      type="text"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full p-2 rounded-lg bg-brand-cream border border-cuero-arena"
                      placeholder="Ej: 850g"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="handmadeToggle"
                    checked={handmade}
                    onChange={(e) => setHandmade(e.target.checked)}
                    className="w-4 h-4 accent-cuero-cognac rounded"
                  />
                  <label htmlFor="handmadeToggle" className="font-bold text-cuero-espresso cursor-pointer">
                    Destacar como "Hecho a Mano" (Artesanal)
                  </label>
                </div>
              </div>

              {/* Photo Gallery — varias fotos, la primera es la principal */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-cuero-espresso">
                    Fotografías del Producto * <span className="font-normal text-cuero-cognac">({images.length})</span>
                  </label>
                  <label className={`cursor-pointer text-[11px] font-bold text-cuero-cognac hover:text-cuero-espresso flex items-center gap-1 ${isUploadingImages ? 'opacity-60 pointer-events-none' : ''}`}>
                    {isUploadingImages ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Optimizando y subiendo...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir desde dispositivo</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleAddImagesFromDevice}
                      disabled={isUploadingImages}
                    />
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`relative group aspect-square rounded-xl overflow-hidden border-2 bg-cuero-arena/20 ${
                          idx === 0 ? 'border-accent-gold' : 'border-cuero-arena'
                        }`}
                      >
                        <img src={img} alt={`Foto ${idx + 1} de ${name || 'producto'}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-accent-gold text-cuero-espresso text-[9px] font-black">
                            PRINCIPAL
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              title="Marcar como principal"
                              aria-label="Marcar como principal"
                              className="p-1.5 rounded-lg bg-white/90 text-cuero-espresso hover:bg-white"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            title="Quitar foto"
                            aria-label="Quitar foto"
                            className="p-1.5 rounded-lg bg-white/90 text-brand-red hover:bg-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                    className="flex-1 p-2.5 rounded-xl bg-cuero-marfil border border-cuero-arena text-xs"
                    placeholder="O pega una URL de imagen..."
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    disabled={!newImageUrl.trim()}
                    className="px-3 py-2 rounded-xl bg-cuero-arena/40 hover:bg-cuero-arena/60 disabled:opacity-50 text-cuero-espresso font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>

                {images.length === 0 && (
                  <p className="text-[11px] text-brand-red font-semibold mt-1">Agrega al menos una fotografía.</p>
                )}
                {uploadError && (
                  <p className="text-[11px] text-brand-red font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{uploadError}</span>
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-cuero-espresso block mb-1">Descripción Detallada *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-cuero-marfil border border-cuero-arena"
                  placeholder="Describe compartimentos, resistencia, costuras..."
                />
              </div>

              {/* Variants Matrix */}
              <div className="p-4 bg-cuero-marfil rounded-2xl border border-cuero-arena/60 space-y-3">
                <div>
                  <label className="font-bold text-cuero-espresso block">Variantes de Color y Tono</label>
                  <p className="text-[11px] text-cuero-cognac">
                    Cada variante puede tener su propia foto; si no le asignas una, la tienda usa la foto principal del producto.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nombre variante (ej: Miel Natural)"
                    value={variantName}
                    onChange={(e) => setVariantName(e.target.value)}
                    className="flex-1 p-2 rounded-lg bg-brand-cream border border-cuero-arena"
                  />
                  <input
                    type="color"
                    value={variantColorHex}
                    onChange={(e) => setVariantColorHex(e.target.value)}
                    className="w-10 h-9 p-1 rounded-lg border border-cuero-arena cursor-pointer bg-brand-cream"
                    title="Seleccionar color"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-3 py-2 bg-cuero-espresso text-white font-bold rounded-lg hover:bg-cuero-cognac"
                  >
                    Agregar
                  </button>
                </div>

                {variants.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {variants.map((v, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-brand-cream border border-cuero-arena/60"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-cuero-arena/30 border border-cuero-arena/50 shrink-0">
                          {v.image ? (
                            <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="block w-full h-full" style={{ backgroundColor: v.colorHex || '#8B4513' }} />
                          )}
                        </div>

                        <span className="flex-1 min-w-0 font-bold text-cuero-espresso truncate">{v.name}</span>

                        <label
                          className={`cursor-pointer p-1.5 rounded-lg bg-cuero-arena/30 hover:bg-cuero-cognac hover:text-white transition-colors ${
                            uploadingVariantIdx !== null ? 'opacity-60 pointer-events-none' : ''
                          }`}
                          title={v.image ? 'Cambiar foto de la variante' : 'Subir foto de la variante'}
                        >
                          {uploadingVariantIdx === idx ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingVariantIdx !== null}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = '';
                              if (file) handleVariantFileSelected(idx, file);
                            }}
                          />
                        </label>

                        {v.image && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantImage(idx)}
                            title="Quitar foto de la variante"
                            aria-label="Quitar foto de la variante"
                            className="p-1.5 rounded-lg text-cuero-cognac hover:text-brand-red hover:bg-brand-red/10 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          title="Eliminar variante"
                          aria-label="Eliminar variante"
                          className="p-1.5 rounded-lg text-brand-red hover:bg-brand-red/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <ErrorBanner message={actionError} onDismiss={() => setActionError('')} />
              <div className="flex justify-end gap-3 pt-4 border-t border-cuero-arena/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-cuero-arena/30 hover:bg-cuero-arena/50 font-bold text-cuero-espresso"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-cuero-espresso hover:bg-cuero-cognac disabled:opacity-60 text-white font-bold shadow-md transition-colors"
                >
                  {isSaving ? 'Guardando…' : 'Guardar Producto'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 5. Recorte de foto antes de subir — cuadrado (1:1), igual a como se ve en toda la tienda */}
      {cropQueue.length > 0 && cropQueue[0] && (
        <ImageCropModal
          key={`${cropQueue[0].name}-${cropQueue[0].lastModified}-${cropBatchTotal - cropQueue.length}`}
          file={cropQueue[0]}
          aspect={1}
          hint={
            cropTarget === 'variant'
              ? 'Foto de la variante — se recorta cuadrada (1:1), igual que la foto principal.'
              : 'Foto de producto — se recorta cuadrada (1:1), igual a como se ve en la tienda.'
          }
          progressLabel={cropBatchTotal > 1 ? `Foto ${cropBatchTotal - cropQueue.length + 1} de ${cropBatchTotal}` : undefined}
          onCancel={advanceCropQueue}
          onConfirm={handleCropConfirm}
        />
      )}

    </div>
  );
};
