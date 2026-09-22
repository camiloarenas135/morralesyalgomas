import React, { useState } from 'react';
import { 
  ShoppingBag, Search, CheckCircle2, Clock, Truck, 
  XCircle, Eye, MessageCircle, Phone, MapPin, CreditCard, Calendar, X 
} from 'lucide-react';
import { Order } from '../../types';
import { StoreManager } from '../../lib/supabase';
import { ErrorBanner, errorMessage } from './ErrorBanner';
import { formatCOP } from '../../utils/promoHelpers';

interface AdminOrdersProps {
  orders: Order[];
  onRefresh: () => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  orders,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [actionError, setActionError] = useState('');

  // Status changer handler
  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await StoreManager.updateOrderStatus(orderId, newStatus);
    } catch (err) {
      setActionError(errorMessage(err));
      return;
    }
    setActionError('');
    onRefresh();
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        o.customer_phone.includes(searchTerm);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <ErrorBanner message={actionError} onDismiss={() => setActionError('')} />

      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-cuero-espresso">
            Gestión de Pedidos & Despachos
          </h2>
          <p className="text-xs text-cuero-cognac">
            Control de órdenes recibidas por WhatsApp y actualización de estados
          </p>
        </div>
      </div>

      {/* 2. Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-cuero-marfil rounded-2xl border border-cuero-arena/70">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Buscar por ID, cliente o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-brand-cream border border-cuero-arena rounded-xl text-xs text-cuero-espresso focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
          />
          <Search className="w-4 h-4 text-cuero-cognac absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="w-full sm:w-auto flex flex-wrap items-center gap-2">
          {['all', 'pending', 'confirmed', 'shipped', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-cuero-espresso text-cuero-marfil shadow-sm'
                  : 'bg-brand-cream text-cuero-espresso border border-cuero-arena hover:bg-cuero-arena/30'
              }`}
            >
              {st === 'all' ? 'Todos' :
               st === 'pending' ? 'Pendiente' :
               st === 'confirmed' ? 'Confirmado' :
               st === 'shipped' ? 'Despachado' : 'Cancelado'}
            </button>
          ))}
        </div>
      </div>

      {/* 3a. Orders Cards — solo móvil/tablet (< md) */}
      <div className="md:hidden space-y-3">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="p-4 bg-cuero-marfil rounded-2xl border border-cuero-arena/70 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="font-mono font-bold text-xs text-cuero-espresso block truncate">{order.id}</span>
                <span className="font-bold text-sm text-cuero-espresso block truncate">{order.customer_name}</span>
              </div>
              <span className="font-black text-sm text-cuero-espresso shrink-0">{formatCOP(order.total_amount)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-cuero-cognac font-bold block text-[10px] uppercase">Teléfono</span>
                <span className="font-mono text-cuero-espresso">{order.customer_phone}</span>
              </div>
              <div>
                <span className="text-cuero-cognac font-bold block text-[10px] uppercase">Pago</span>
                <span className="font-semibold text-cuero-espresso truncate block">{order.payment_method}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                className={`flex-1 min-w-0 px-2.5 py-2 rounded-lg text-[11px] font-bold border cursor-pointer ${
                  order.status === 'confirmed' ? 'bg-brand-teal/20 text-teal-800 border-brand-teal' :
                  order.status === 'shipped' ? 'bg-accent-olive/20 text-olive-800 border-accent-olive' :
                  order.status === 'cancelled' ? 'bg-brand-red/20 text-brand-red border-brand-red' :
                  'bg-accent-gold/20 text-amber-900 border-accent-gold'
                }`}
              >
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmado</option>
                <option value="shipped">Despachado</option>
                <option value="cancelled">Cancelado</option>
              </select>
              <button
                onClick={() => setSelectedOrder(order)}
                className="shrink-0 p-2.5 rounded-lg bg-cuero-arena/30 hover:bg-cuero-cognac hover:text-white transition-colors"
                title="Ver detalle del pedido"
                aria-label="Ver detalle del pedido"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="p-10 text-center text-cuero-cognac text-xs space-y-2 bg-cuero-marfil rounded-2xl border border-cuero-arena/70">
            <ShoppingBag className="w-8 h-8 mx-auto text-cuero-arena" />
            <p>Ningún pedido coincide con la búsqueda o el filtro.</p>
          </div>
        )}
      </div>

      {/* 3b. Orders Table — solo escritorio (md+) */}
      <div className="hidden md:block bg-cuero-marfil rounded-2xl border border-cuero-arena/70 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-cuero-espresso">
            <thead className="bg-cuero-espresso text-cuero-marfil uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="p-3.5">ID Orden</th>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Teléfono / WhatsApp</th>
                <th className="p-3.5">Total COP</th>
                <th className="p-3.5">Método de Pago</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cuero-arena/40">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-brand-cream/60 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-cuero-espresso">
                    {order.id}
                  </td>
                  <td className="p-3.5 font-semibold">
                    {order.customer_name}
                  </td>
                  <td className="p-3.5 font-mono text-cuero-cognac">
                    {order.customer_phone}
                  </td>
                  <td className="p-3.5 font-black text-cuero-espresso">
                    {formatCOP(order.total_amount)}
                  </td>
                  <td className="p-3.5 font-semibold text-cuero-cognac">
                    {order.payment_method}
                  </td>
                  <td className="p-3.5">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                        order.status === 'confirmed' ? 'bg-brand-teal/20 text-teal-800 border-brand-teal' :
                        order.status === 'shipped' ? 'bg-accent-olive/20 text-olive-800 border-accent-olive' :
                        order.status === 'cancelled' ? 'bg-brand-red/20 text-brand-red border-brand-red' :
                        'bg-accent-gold/20 text-amber-900 border-accent-gold'
                      }`}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="shipped">Despachado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-1.5 rounded-lg bg-cuero-arena/30 hover:bg-cuero-cognac hover:text-white transition-colors"
                      title="Ver detalle del pedido"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cuero-espresso/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-brand-cream rounded-3xl p-6 sm:p-8 shadow-2xl border border-cuero-arena space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cuero-arena/50 pb-4">
              <div>
                <span className="font-mono font-bold text-xs text-cuero-caramelo">PEDIDO #{selectedOrder.id}</span>
                <h3 className="font-heading font-extrabold text-xl text-cuero-espresso">
                  Detalle del Pedido
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-cuero-cognac hover:text-cuero-espresso rounded-full hover:bg-cuero-arena/30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Info Card */}
            <div className="p-4 bg-cuero-marfil rounded-2xl border border-cuero-arena/60 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-cuero-cognac font-bold block text-[10px] uppercase">Cliente</span>
                  <span className="font-bold text-cuero-espresso text-sm">{selectedOrder.customer_name}</span>
                </div>
                <div>
                  <span className="text-cuero-cognac font-bold block text-[10px] uppercase">Teléfono / WhatsApp</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cuero-espresso">{selectedOrder.customer_phone}</span>
                    <a
                      href={`https://wa.me/${selectedOrder.customer_phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded bg-whatsapp text-white"
                      title="Abrir chat en WhatsApp"
                    >
                      <MessageCircle className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div>
                  <span className="text-cuero-cognac font-bold block text-[10px] uppercase">Dirección de Despacho</span>
                  <span className="font-medium text-cuero-espresso">{selectedOrder.delivery_address}</span>
                </div>
                <div>
                  <span className="text-cuero-cognac font-bold block text-[10px] uppercase">Método de Pago</span>
                  <span className="font-bold text-cuero-espresso">{selectedOrder.payment_method}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="pt-2 border-t border-cuero-arena/40">
                  <span className="text-cuero-cognac font-bold text-[10px] uppercase block">Notas del Cliente:</span>
                  <p className="text-cuero-espresso italic">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Items Breakdown */}
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-sm text-cuero-espresso">
                Artículos Comprados ({selectedOrder.items.length})
              </h4>

              <div className="space-y-2 text-xs">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-cuero-marfil rounded-xl border border-cuero-arena/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-cuero-arena/30 shrink-0">
                        {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <span className="font-bold text-cuero-espresso block">{item.name}</span>
                        {item.selectedVariant && (
                          <span className="text-[10px] text-cuero-caramelo font-semibold">{item.selectedVariant.name}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-cuero-espresso block">{item.quantity} × {item.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Summary & Status Controller */}
            <div className="pt-4 border-t border-cuero-arena/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-cuero-espresso">Cambiar Estado:</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl bg-cuero-marfil border border-cuero-arena text-xs font-bold"
                >
                  <option value="pending">🟡 Pendiente</option>
                  <option value="confirmed">🔵 Confirmado</option>
                  <option value="shipped">🟢 Despachado</option>
                  <option value="cancelled">🔴 Cancelado</option>
                </select>
              </div>

              <div className="text-right">
                <span className="text-xs text-cuero-cognac">Total de la Orden:</span>
                <span className="font-black text-xl text-cuero-espresso block">
                  {formatCOP(selectedOrder.total_amount)} COP
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
