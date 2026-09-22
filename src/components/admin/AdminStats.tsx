import React from 'react';
import { 
  TrendingUp, ShoppingBag, Package, Users, 
  Sparkles, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Clock 
} from 'lucide-react';
import { Product, Order } from '../../types';
import { formatCOP } from '../../utils/promoHelpers';
import { summarizeCustomers } from '../../utils/customers';

interface AdminStatsProps {
  products: Product[];
  orders: Order[];
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Ingresos (pedidos no cancelados) de los últimos 7 días, de más antiguo a hoy. */
function last7DaysRevenue(orders: Order[]) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return { date: d, label: DAY_LABELS[d.getDay()], amount: 0 };
  });

  for (const order of orders) {
    if (order.status === 'cancelled' || !order.created_at) continue;
    const created = new Date(order.created_at);
    created.setHours(0, 0, 0, 0);
    const day = days.find((d) => d.date.getTime() === created.getTime());
    if (day) day.amount += order.total_amount;
  }

  const max = Math.max(...days.map((d) => d.amount), 1);
  return days.map((d) => ({
    day: d.label,
    amount: d.amount,
    height: d.amount > 0 ? `${Math.max(6, Math.round((d.amount / max) * 100))}%` : '2%'
  }));
}

export const AdminStats: React.FC<AdminStatsProps> = ({
  products,
  orders
}) => {
  // Cálculos de KPIs
  const validOrders = orders.filter((o) => o.status !== 'cancelled');
  const totalRevenue = validOrders.reduce((acc, order) => acc + order.total_amount, 0);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const activePromos = products.filter(p => p.promo_price && p.stock > 0).length;
  const customersCount = summarizeCustomers(orders).length;
  const weekBars = last7DaysRevenue(orders);

  return (
    <div className="space-y-6">
      
      {/* 1. Header with date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-cuero-espresso">
            Panel de Control y Rendimiento
          </h2>
          <p className="text-xs text-cuero-cognac">
            Métricas comerciales y estado de inventario en tiempo real
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cuero-marfil border border-cuero-arena text-xs font-semibold text-cuero-espresso">
          <Calendar className="w-3.5 h-3.5 text-cuero-cognac" />
          <span>{new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}</span>
        </div>
      </div>

      {/* 2. Key Performance Indicators (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* KPI: Ventas Totales */}
        <div className="p-5 rounded-2xl bg-cuero-marfil border border-cuero-arena/70 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cuero-caramelo uppercase tracking-wider">
              Ingresos Totales
            </span>
            <div className="p-2 rounded-xl bg-accent-olive/15 text-accent-olive">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="font-heading font-extrabold text-2xl text-cuero-espresso tracking-tight">
              {formatCOP(totalRevenue)}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-accent-olive font-bold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{validOrders.length} pedidos no cancelados</span>
            </div>
          </div>
        </div>

        {/* KPI: Pedidos Activos */}
        <div className="p-5 rounded-2xl bg-cuero-marfil border border-cuero-arena/70 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cuero-caramelo uppercase tracking-wider">
              Pedidos Recibidos
            </span>
            <div className="p-2 rounded-xl bg-brand-teal/15 text-brand-teal">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="font-heading font-extrabold text-2xl text-cuero-espresso tracking-tight">
              {orders.length}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-cuero-cognac font-semibold mt-1">
              <Clock className="w-3.5 h-3.5 text-accent-gold" />
              <span>{pendingOrders} pendientes por confirmar</span>
            </div>
          </div>
        </div>

        {/* KPI: Stock en Inventario */}
        <div className="p-5 rounded-2xl bg-cuero-marfil border border-cuero-arena/70 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cuero-caramelo uppercase tracking-wider">
              Unidades en Stock
            </span>
            <div className="p-2 rounded-xl bg-cuero-cognac/15 text-cuero-cognac">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="font-heading font-extrabold text-2xl text-cuero-espresso tracking-tight">
              {totalStock}
            </span>
            <div className="text-[11px] text-cuero-cognac font-semibold mt-1">
              En {products.length} referencias de marroquinería
            </div>
          </div>
        </div>

        {/* KPI: Promociones y Clientes */}
        <div className="p-5 rounded-2xl bg-cuero-marfil border border-cuero-arena/70 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cuero-caramelo uppercase tracking-wider">
              Ofertas & Clientes
            </span>
            <div className="p-2 rounded-xl bg-brand-red/15 text-brand-red">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="font-heading font-extrabold text-2xl text-brand-red tracking-tight">
              {activePromos} Promos
            </span>
            <div className="flex items-center gap-1 text-[11px] text-accent-gold font-bold mt-1">
              <Users className="w-3.5 h-3.5" />
              <span>{customersCount} {customersCount === 1 ? 'cliente' : 'clientes'} con compras</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Visual Performance Chart & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Trend Bar Chart Simulation */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-cuero-marfil border border-cuero-arena/70 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-cuero-espresso">
                Tendencia de Ventas (Últimos 7 Días)
              </h3>
              <p className="text-xs text-cuero-cognac">Ingresos acumulados en COP</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-cuero-arena/30 text-xs font-bold text-cuero-espresso">
              {formatCOP(weekBars.reduce((acc, b) => acc + b.amount, 0))} en 7 días
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-cuero-arena/50">
            {weekBars.map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="relative w-full flex items-end justify-center h-36">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-cuero-espresso text-white text-[10px] font-bold py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-10">
                    {formatCOP(bar.amount)}
                  </div>
                  {/* Bar */}
                  <div
                    style={{ height: bar.height }}
                    className="w-full max-w-8 rounded-t-lg bg-linear-to-t from-cuero-cognac to-brand-teal group-hover:to-brand-red transition-all duration-300 shadow-sm"
                  />
                </div>
                <span className="text-[11px] font-bold text-cuero-cognac group-hover:text-cuero-espresso">
                  {bar.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="p-6 rounded-2xl bg-cuero-marfil border border-cuero-arena/70 shadow-xs space-y-4">
          <h3 className="font-heading font-bold text-base text-cuero-espresso">
            Actividad Reciente
          </h3>

          <div className="space-y-3 text-xs">
            {orders.slice(0, 4).map((order) => (
              <div key={order.id} className="p-2.5 rounded-xl bg-brand-cream/80 border border-cuero-arena/40 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-cuero-espresso block">
                    {order.customer_name}
                  </span>
                  <span className="text-[10px] text-cuero-cognac">
                    {order.id} • {order.items.length} ítems
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-cuero-espresso block">
                    {formatCOP(order.total_amount)}
                  </span>
                  <span className={`text-[10px] font-bold uppercase ${
                    order.status === 'confirmed' ? 'text-brand-teal' :
                    order.status === 'shipped' ? 'text-accent-olive' :
                    order.status === 'cancelled' ? 'text-brand-red' : 'text-accent-gold'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
