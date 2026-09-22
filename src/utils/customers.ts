// ==========================================
// customers.ts — Clientes derivados de los pedidos
// No existe una tabla de clientes: un cliente "se registra" al comprar y se
// identifica por su número de WhatsApp.
// ==========================================

import { Order } from '../types';

export interface CustomerSummary {
  phone: string;
  name: string;            // nombre usado en el pedido más reciente
  ordersCount: number;
  totalSpent: number;
  lastOrderAt?: string;
}

/** Agrupa por teléfono los pedidos no cancelados; ordena por última compra. */
export function summarizeCustomers(orders: Order[]): CustomerSummary[] {
  const byPhone = new Map<string, CustomerSummary>();

  for (const order of orders) {
    if (order.status === 'cancelled') continue;

    const existing = byPhone.get(order.customer_phone);
    const isNewer = !existing?.lastOrderAt || (order.created_at ?? '') >= existing.lastOrderAt;

    byPhone.set(order.customer_phone, {
      phone: order.customer_phone,
      name: !existing || isNewer ? order.customer_name : existing.name,
      ordersCount: (existing?.ordersCount ?? 0) + 1,
      totalSpent: (existing?.totalSpent ?? 0) + order.total_amount,
      lastOrderAt: isNewer ? order.created_at : existing?.lastOrderAt
    });
  }

  return [...byPhone.values()].sort((a, b) => (b.lastOrderAt ?? '').localeCompare(a.lastOrderAt ?? ''));
}
