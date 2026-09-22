import React, { useMemo, useState } from 'react';
import { MessageCircle, Search, Users } from 'lucide-react';
import { Order } from '../../types';
import { formatCOP } from '../../utils/promoHelpers';
import { summarizeCustomers } from '../../utils/customers';

interface AdminCustomersProps {
  orders: Order[];
}

export const AdminCustomers: React.FC<AdminCustomersProps> = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const customers = useMemo(() => summarizeCustomers(orders), [orders]);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">

      {/* 1. Header */}
      <div>
        <h2 className="font-heading font-extrabold text-2xl text-cuero-espresso">
          Clientes
        </h2>
        <p className="text-xs text-cuero-cognac">
          Se registran automáticamente cuando hacen un pedido (no incluye pedidos cancelados).
        </p>
      </div>

      {/* 2. Search Bar */}
      <div className="relative w-full sm:w-80">
        <input
          type="text"
          placeholder="Buscar cliente por nombre o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-cuero-marfil border border-cuero-arena rounded-xl text-xs text-cuero-espresso focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
        />
        <Search className="w-4 h-4 text-cuero-cognac absolute left-3 top-1/2 -translate-y-1/2" />
      </div>

      {/* 3a. Customers Cards — solo móvil/tablet (< md) */}
      <div className="md:hidden space-y-3">
        {filteredCustomers.map((c) => (
          <div
            key={c.phone}
            className="p-4 bg-cuero-marfil rounded-2xl border border-cuero-arena/70 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="font-bold text-cuero-espresso block text-sm truncate">{c.name}</span>
                <span className="font-mono text-[11px] text-cuero-cognac">{c.phone}</span>
              </div>
              <span className="font-black text-sm text-cuero-espresso shrink-0">{formatCOP(c.totalSpent)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-cuero-cognac font-bold block text-[10px] uppercase">Pedidos</span>
                <span className="font-semibold text-cuero-espresso">
                  {c.ordersCount} {c.ordersCount === 1 ? 'pedido' : 'pedidos'}
                </span>
              </div>
              <div>
                <span className="text-cuero-cognac font-bold block text-[10px] uppercase">Último pedido</span>
                <span className="text-cuero-espresso">
                  {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString('es-CO', { dateStyle: 'medium' }) : '—'}
                </span>
              </div>
            </div>

            <a
              href={`https://wa.me/${c.phone}?text=${encodeURIComponent(`¡Hola ${c.name}! Te escribimos de Morrales y Algo Más.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-whatsapp hover:bg-whatsapp-dark text-white font-bold text-xs shadow-sm transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Escribir por WhatsApp</span>
            </a>
          </div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="p-10 text-center text-cuero-cognac text-xs space-y-2 bg-cuero-marfil rounded-2xl border border-cuero-arena/70">
            <Users className="w-8 h-8 mx-auto text-cuero-arena" />
            <p>{customers.length === 0 ? 'Aún no hay clientes: aparecerán con el primer pedido.' : 'Ningún cliente coincide con la búsqueda.'}</p>
          </div>
        )}
      </div>

      {/* 3b. Customers Table — solo escritorio (md+) */}
      <div className="hidden md:block bg-cuero-marfil rounded-2xl border border-cuero-arena/70 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-cuero-espresso">
            <thead className="bg-cuero-espresso text-cuero-marfil uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">WhatsApp</th>
                <th className="p-3.5">Pedidos</th>
                <th className="p-3.5">Total comprado COP</th>
                <th className="p-3.5">Último pedido</th>
                <th className="p-3.5 text-right">Contacto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cuero-arena/40">
              {filteredCustomers.map((c) => (
                <tr key={c.phone} className="hover:bg-brand-cream/60 transition-colors">
                  <td className="p-3.5 font-bold text-cuero-espresso">{c.name}</td>
                  <td className="p-3.5 font-mono text-cuero-cognac">{c.phone}</td>
                  <td className="p-3.5 font-semibold text-cuero-espresso">
                    {c.ordersCount} {c.ordersCount === 1 ? 'pedido' : 'pedidos'}
                  </td>
                  <td className="p-3.5 font-black text-cuero-espresso">{formatCOP(c.totalSpent)}</td>
                  <td className="p-3.5 text-cuero-cognac">
                    {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString('es-CO', { dateStyle: 'medium' }) : '—'}
                  </td>
                  <td className="p-3.5 text-right">
                    <a
                      href={`https://wa.me/${c.phone}?text=${encodeURIComponent(`¡Hola ${c.name}! Te escribimos de Morrales y Algo Más.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-whatsapp hover:bg-whatsapp-dark text-white font-bold text-[11px] shadow-sm transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-current" />
                      <span>Escribir por WhatsApp</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCustomers.length === 0 && (
            <div className="p-10 text-center text-cuero-cognac text-xs space-y-2">
              <Users className="w-8 h-8 mx-auto text-cuero-arena" />
              <p>{customers.length === 0 ? 'Aún no hay clientes: aparecerán con el primer pedido.' : 'Ningún cliente coincide con la búsqueda.'}</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
