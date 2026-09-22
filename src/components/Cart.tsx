import React, { useState } from 'react';
import { 
  X, Trash2, ShoppingBag, ArrowRight, MessageCircle, 
  ShieldCheck, Truck, MapPin, User, Phone, CreditCard, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { OrderCartItem, Order } from '../types';
import { formatCOP, parseCOP } from '../utils/promoHelpers';
import { sanitizeInput, sanitizePhone } from '../utils/sanitize';
import { checkRateLimit } from '../utils/rateLimiter';
import { StoreManager } from '../lib/supabase';
import { WHATSAPP_NUMBER } from '../config';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderCartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const Cart: React.FC<CartProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}) => {
  // Estado del Formulario de Envío
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Nequi');
  const [orderNotes, setOrderNotes] = useState('');
  const [acceptedDataPolicy, setAcceptedDataPolicy] = useState(false);

  // Estado de Checkout UI
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastOrderDetails, setLastOrderDetails] = useState<Order | null>(null);

  if (!isOpen) return null;

  // Cálculos financieros
  const subtotal = items.reduce((acc, item) => {
    return acc + (parseCOP(item.price) * item.quantity);
  }, 0);

  const freeShippingThreshold = 150000;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const shippingCost = isFreeShipping || subtotal === 0 ? 0 : 12000;
  const total = subtotal + shippingCost;
  const progressToFreeShipping = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  // Generador de Mensaje WhatsApp
  const handleGenerateWhatsAppCheckout = () => {
    // Validaciones
    const cleanName = sanitizeInput(customerName);
    const cleanPhone = sanitizePhone(customerPhone);
    const cleanAddress = sanitizeInput(deliveryAddress);

    if (!cleanName || cleanName.length < 3) {
      setErrorMessage('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Por favor ingresa un número de WhatsApp válido (10 dígitos).');
      return;
    }
    if (!cleanAddress || cleanAddress.length < 8) {
      setErrorMessage('Por favor ingresa tu dirección de entrega completa y ciudad.');
      return;
    }

    if (!WHATSAPP_NUMBER) {
      setErrorMessage('El WhatsApp de la tienda aún no está configurado. Inténtalo más tarde.');
      return;
    }
    if (!acceptedDataPolicy) {
      setErrorMessage('Debes autorizar el tratamiento de tus datos personales para continuar.');
      return;
    }

    if (!checkRateLimit('checkout_whatsapp', 2000)) {
      setErrorMessage('Por favor espera un momento antes de enviar nuevamente.');
      return;
    }

    setErrorMessage('');

    // Construcción del mensaje estructurado para WhatsApp
    let itemsText = '';
    items.forEach((item, index) => {
      const variantText = item.selectedVariant ? `   ↳ Variante: ${item.selectedVariant.name}\n` : '';
      itemsText += `${index + 1}️⃣ *${item.name}*\n${variantText}   ↳ Cantidad: ${item.quantity}\n   ↳ Precio c/u: ${item.price}\n\n`;
    });

    const shippingText = isFreeShipping ? 'GRATIS' : formatCOP(shippingCost);

    // El ID se genera antes para incluirlo en el mensaje: si el registro en la base
    // de datos fallara, el negocio igual puede conciliar el pedido por WhatsApp.
    const orderId = StoreManager.generateOrderId();

    const message =
`🎒 *NUEVO PEDIDO — Morrales y Algo Más*
🧾 *Pedido:* ${orderId}
━━━━━━━━━━━━━━━━━━━━━━━
📦 *Artículos Seleccionados:*

${itemsText}━━━━━━━━━━━━━━━━━━━━━━━
💰 *Subtotal:* ${formatCOP(subtotal)} COP
🚚 *Envío:* ${shippingText}
💳 *TOTAL A PAGAR: ${formatCOP(total)} COP*

👤 *Cliente:* ${cleanName}
📞 *Teléfono:* ${cleanPhone}
📍 *Dirección de Entrega:* ${cleanAddress}
💳 *Método de Pago Preferido:* ${paymentMethod}
${orderNotes ? `📝 *Notas:* ${sanitizeInput(orderNotes)}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━
_Pedido generado desde la tienda digital Morrales y Algo Más_`;

    const orderData: Omit<Order, 'created_at'> = {
      id: orderId,
      customer_name: cleanName,
      customer_phone: cleanPhone,
      delivery_address: cleanAddress,
      payment_method: paymentMethod,
      items: [...items],
      total_amount: total,
      status: 'pending',
      notes: sanitizeInput(orderNotes)
    };

    const encodedUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    // Abrir WhatsApp de forma síncrona (dentro del clic) para que el navegador no
    // bloquee la ventana; el registro en /admin se guarda en segundo plano.
    window.open(encodedUrl, '_blank');

    StoreManager.addOrder(orderData).catch((err) => {
      console.error('El pedido no se registró en la base de datos (sí se envió por WhatsApp):', err);
    });

    setLastOrderDetails({ ...orderData, created_at: new Date().toISOString() });

    // Cambiar a paso de éxito y limpiar carrito
    setStep('success');
    onClearCart();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-cuero-espresso/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-brand-cream border-l border-cuero-arena shadow-2xl flex flex-col justify-between overflow-hidden">
          
          {/* Header */}
          <div className="p-4 sm:p-5 bg-cuero-marfil border-b border-cuero-arena/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cuero-espresso text-brand-teal">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-lg text-cuero-espresso">
                  {step === 'cart' && 'Tu Carrito de Cuero'}
                  {step === 'checkout' && 'Datos de Despacho'}
                  {step === 'success' && '¡Pedido Procesado!'}
                </h3>
                <span className="text-[11px] text-cuero-caramelo font-semibold">
                  {items.length} {items.length === 1 ? 'artículo seleccionado' : 'artículos seleccionados'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-cuero-cognac hover:text-cuero-espresso hover:bg-cuero-arena/30 rounded-xl transition-colors"
              aria-label="Cerrar carrito"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          {items.length > 0 && step !== 'success' && (
            <div className="bg-cuero-espresso/95 text-cuero-marfil px-5 py-2.5 text-xs space-y-1.5 border-b border-cuero-cognac/30">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 font-bold">
                  <Truck className="w-3.5 h-3.5 text-brand-teal" />
                  {isFreeShipping ? (
                    <span className="text-accent-olive font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>¡Calificas para Envío GRATIS nacional!</span>
                    </span>
                  ) : (
                    <span>Faltan <strong>{formatCOP(freeShippingThreshold - subtotal)}</strong> para Envío Gratis</span>
                  )}
                </span>
                <span className="font-mono text-accent-gold font-bold">{Math.round(progressToFreeShipping)}%</span>
              </div>
              <div className="w-full h-1.5 bg-cuero-marfil/20 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${isFreeShipping ? 'bg-accent-olive' : 'bg-brand-teal'}`}
                  style={{ width: `${progressToFreeShipping}%` }}
                />
              </div>
            </div>
          )}

          {/* Body Content according to Step */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {/* STEP 1: CART ITEMS */}
            {step === 'cart' && (
              <>
                {items.length === 0 ? (
                  <div className="py-16 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-cuero-arena/30 flex items-center justify-center mx-auto text-cuero-cognac">
                      <ShoppingBag className="w-8 h-8 opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-heading font-bold text-base text-cuero-espresso">
                        Tu carrito está vacío
                      </h4>
                      <p className="text-xs text-cuero-cognac max-w-xs mx-auto">
                        Explora nuestros morrales, bolsos y accesorios artesanales para agregar tus favoritos.
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 bg-cuero-espresso text-white font-bold text-xs rounded-xl hover:bg-cuero-cognac transition-colors"
                    >
                      Ver Catálogo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-cuero-marfil rounded-2xl border border-cuero-arena/60 shadow-xs flex gap-3 items-center group"
                      >
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-xl bg-cuero-arena/30 overflow-hidden shrink-0 border border-cuero-arena/40">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="font-heading font-bold text-xs text-cuero-espresso truncate">
                            {item.name}
                          </h4>
                          {item.selectedVariant && (
                            <p className="text-[10px] font-semibold text-cuero-caramelo">
                              {item.selectedVariant.name}
                            </p>
                          )}
                          <p className="text-xs font-black text-cuero-espresso">
                            {item.price}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="text-cuero-arena hover:text-brand-red p-1 transition-colors"
                            aria-label="Eliminar ítem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center border border-cuero-arena bg-brand-cream rounded-lg overflow-hidden text-xs">
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-0.5 font-bold text-cuero-espresso hover:bg-cuero-arena/30"
                            >
                              −
                            </button>
                            <span className="px-2 font-bold text-[11px] text-cuero-espresso">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-0.5 font-bold text-cuero-espresso hover:bg-cuero-arena/30"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* STEP 2: CHECKOUT FORM */}
            {step === 'checkout' && (
              <div className="space-y-4 text-xs animate-in slide-in-from-right-4 duration-200">
                <div className="p-3 bg-brand-teal/10 border border-brand-teal/30 rounded-xl text-cuero-espresso">
                  <p className="font-bold flex items-center gap-1.5 text-xs text-brand-teal">
                    <ShieldCheck className="w-4 h-4 text-brand-teal" />
                    Pasarela Segura vía WhatsApp Business
                  </p>
                  <p className="text-[11px] text-cuero-cognac mt-0.5">
                    Al confirmar, se abrirá tu WhatsApp con el desglose exacto para coordinar el pago y despacho.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-brand-red/10 border border-brand-red/30 rounded-xl text-brand-red text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-cuero-espresso flex items-center gap-1.5 mb-1">
                      <User className="w-3.5 h-3.5 text-cuero-cognac" />
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Laura Gómez"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-cuero-marfil border border-cuero-arena text-cuero-espresso font-medium focus:ring-2 focus:ring-brand-teal/50"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-cuero-espresso flex items-center gap-1.5 mb-1">
                      <Phone className="w-3.5 h-3.5 text-cuero-cognac" />
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej: 312 456 7890"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-cuero-marfil border border-cuero-arena text-cuero-espresso font-medium focus:ring-2 focus:ring-brand-teal/50"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-cuero-espresso flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-cuero-cognac" />
                      Dirección de Entrega y Ciudad *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Cra 43A # 18 Sur - 20, Envigado"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-cuero-marfil border border-cuero-arena text-cuero-espresso font-medium focus:ring-2 focus:ring-brand-teal/50"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-cuero-espresso flex items-center gap-1.5 mb-1">
                      <CreditCard className="w-3.5 h-3.5 text-cuero-cognac" />
                      Método de Pago Preferido
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-cuero-marfil border border-cuero-arena text-cuero-espresso font-semibold"
                    >
                      <option value="Nequi">Nequi</option>
                      <option value="Daviplata">Daviplata</option>
                      <option value="Bancolombia (Transferencia / QR)">Bancolombia (Transferencia / QR)</option>
                      <option value="Contra Entrega (Efectivo)">Contra Entrega (Efectivo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-cuero-espresso block mb-1">
                      Notas Adicionales (Opcional)
                    </label>
                    <textarea
                      placeholder="Ej: Dejar en recepción, timbre 301..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      rows={2}
                      className="w-full p-2.5 rounded-xl bg-cuero-marfil border border-cuero-arena text-cuero-espresso text-xs"
                    />
                  </div>

                  {/* Habeas Data — Ley 1581 de 2012: autorización previa para tratar datos personales */}
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-cuero-marfil border border-cuero-arena text-[11px] leading-relaxed text-cuero-espresso cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedDataPolicy}
                      onChange={(e) => setAcceptedDataPolicy(e.target.checked)}
                      className="mt-0.5 w-4 h-4 shrink-0 accent-cuero-cognac"
                    />
                    <span>
                      Autorizo a <strong>Morrales y Algo Más</strong> a tratar mis datos personales (nombre, teléfono y
                      dirección) para gestionar este pedido y contactarme por WhatsApp, conforme a la Ley 1581 de 2012.
                      Puedo solicitar su consulta o eliminación cuando quiera.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS CONFIRMATION */}
            {step === 'success' && (
              <div className="py-10 text-center space-y-4 animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-full bg-whatsapp/20 text-whatsapp flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-cuero-caramelo uppercase tracking-widest">
                    Orden Registrada con Éxito
                  </span>
                  <h4 className="font-heading font-extrabold text-xl text-cuero-espresso">
                    {lastOrderDetails?.id || '¡Muchas Gracias por tu Pedido!'}
                  </h4>
                  <p className="text-xs text-cuero-cognac max-w-xs mx-auto">
                    Se ha abierto una conversación en WhatsApp para completar los detalles de pago y envío.
                  </p>
                </div>

                <div className="p-4 bg-cuero-marfil rounded-2xl border border-cuero-arena/60 text-xs text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-cuero-cognac">Total de la Orden:</span>
                    <span className="font-bold text-cuero-espresso">{formatCOP(lastOrderDetails?.total_amount || 0)} COP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cuero-cognac">Estado:</span>
                    <span className="px-2 py-0.5 rounded bg-accent-gold/20 text-cuero-espresso font-bold text-[10px]">
                      Pendiente de Verificación
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStep('cart');
                    onClose();
                  }}
                  className="w-full py-3 bg-cuero-espresso text-white font-bold text-xs rounded-xl hover:bg-cuero-cognac transition-colors"
                >
                  Seguir Comprando
                </button>
              </div>
            )}

          </div>

          {/* Footer Calculations & Primary Action */}
          {items.length > 0 && step !== 'success' && (
            <div className="p-4 sm:p-5 bg-cuero-marfil border-t border-cuero-arena/60 space-y-3">
              
              {/* Financial summary */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-cuero-cognac">
                  <span>Subtotal:</span>
                  <span className="font-bold text-cuero-espresso">{formatCOP(subtotal)}</span>
                </div>
                <div className="flex justify-between text-cuero-cognac">
                  <span>Costo de Envío:</span>
                  <span>
                    {isFreeShipping ? (
                      <span className="font-bold text-accent-olive uppercase text-[10px]">Gratis</span>
                    ) : (
                      <span className="font-bold text-cuero-espresso">{formatCOP(shippingCost)}</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-cuero-espresso pt-2 border-t border-cuero-arena/40">
                  <span>Total a Pagar:</span>
                  <span className="text-brand-red">{formatCOP(total)} COP</span>
                </div>
              </div>

              {/* Action Buttons */}
              {step === 'cart' ? (
                <button
                  onClick={() => setStep('checkout')}
                  className="w-full min-h-11 py-3.5 px-4 rounded-xl bg-cuero-espresso hover:bg-cuero-cognac text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Continuar al Despacho</span>
                  <ArrowRight className="w-4 h-4 text-brand-teal" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep('cart')}
                    className="min-h-11 py-3 px-4 rounded-xl bg-cuero-arena/40 hover:bg-cuero-arena/60 text-cuero-espresso font-bold text-xs transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleGenerateWhatsAppCheckout}
                    className="flex-1 min-h-11 py-3.5 px-4 rounded-xl bg-whatsapp hover:bg-whatsapp-dark text-white font-bold text-sm shadow-md hover:shadow-whatsapp/30 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <MessageCircle className="w-5 h-5 fill-current" />
                    <span>Pedir por WhatsApp</span>
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
