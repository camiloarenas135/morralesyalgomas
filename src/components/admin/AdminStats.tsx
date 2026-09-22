import React, { useMemo, useState } from 'react';
import {
  TrendingUp, ShoppingBag, Package, Users,
  Sparkles, DollarSign, Calendar, CalendarRange, ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';
import { Product, Order } from '../../types';
import { formatCOP, isPromoActive } from '../../utils/promoHelpers';
import { summarizeCustomers } from '../../utils/customers';

interface AdminStatsProps {
  products: Product[];
  orders: Order[];
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

type RangePreset = 'today' | 'week' | 'month' | 'custom';

const RANGE_PRESETS: { id: RangePreset; label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Últimos 7 días' },
  { id: 'month', label: 'Últimos 30 días' },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Calcula el rango [inicio, fin] según el filtro elegido por el admin. */
function resolveRange(preset: RangePreset, customFrom: string, customTo: string): { start: Date; end: Date; label: string } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  if (preset === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return { start, end, label: 'Hoy' };
  }
  if (preset === 'week') {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end, label: 'Últimos 7 días' };
  }
  if (preset === 'month') {
    const start = new Date();
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return { start, end, label: 'Últimos 30 días' };
  }

  // Rango personalizado: si falta un extremo, se completa con una ventana de
  // 30 días en vez de dejarlo abierto hasta 1970 (eso desbordaba el gráfico
  // con miles de barras vacías apenas se entraba a este modo).
  const customEnd = customTo ? new Date(`${customTo}T23:59:59`) : end;
  const defaultStart = new Date(customEnd);
  defaultStart.setDate(defaultStart.getDate() - 29);
  defaultStart.setHours(0, 0, 0, 0);
  const start = customFrom ? new Date(`${customFrom}T00:00:00`) : defaultStart;
  return { start, end: customEnd, label: 'Rango personalizado' };
}

/** Ingresos (pedidos no cancelados) por día dentro de [start, end], ambos incluidos. */
function revenueByDay(orders: Order[], start: Date, end: Date) {
  const lastDay = new Date(end);
  lastDay.setHours(0, 0, 0, 0);
  let cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  // Tope de 92 barras (~3 meses): si el rango es más largo, se recorta al
  // tramo más reciente (terminando siempre en "end") para que el gráfico siga
  // siendo legible y no deje "hoy" fuera de vista. El total y los demás KPIs
  // sí suman el rango completo, esto solo limita las barras del gráfico.
  const spanDays = Math.round((lastDay.getTime() - cursor.getTime()) / 86400000) + 1;
  if (spanDays > 92) {
    cursor = new Date(lastDay);
    cursor.setDate(cursor.getDate() - 91);
  }

  const days: { date: Date; amount: number }[] = [];
  const iter = new Date(cursor);
  while (iter.getTime() <= lastDay.getTime()) {
    days.push({ date: new Date(iter), amount: 0 });
    iter.setDate(iter.getDate() + 1);
  }

  for (const order of orders) {
    if (order.status === 'cancelled' || !order.created_at) continue;
    const created = new Date(order.created_at);
    created.setHours(0, 0, 0, 0);
    const day = days.find((d) => d.date.getTime() === created.getTime());
    if (day) day.amount += order.total_amount;
  }

  const useWeekdayLabel = days.length <= 7;
  const max = Math.max(...days.map((d) => d.amount), 1);
  return days.map((d) => ({
    day: useWeekdayLabel
      ? DAY_LABELS[d.date.getDay()]
      : `${String(d.date.getDate()).padStart(2, '0')}/${String(d.date.getMonth() + 1).padStart(2, '0')}`,
    amount: d.amount,
    height: d.amount > 0 ? `${Math.max(6, Math.round((d.amount / max) * 100))}%` : '2%'
  }));
}

export const AdminStats: React.FC<AdminStatsProps> = ({
  products,
  orders
}) => {
  // Filtro de periodo para los KPIs comerciales (no afecta stock/promos: son estado actual)
  const [rangePreset, setRangePreset] = useState<RangePreset>('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const { start: rangeStart, end: rangeEnd, label: rangeLabel } = useMemo(
    () => resolveRange(rangePreset, customFrom, customTo),
    [rangePreset, customFrom, customTo]
  );

  const ordersInRange = useMemo(() => orders.filter((o) => {
    if (!o.created_at) return false;
    const t = new Date(o.created_at).getTime();
    return t >= rangeStart.getTime() && t <= rangeEnd.getTime();
  }), [orders, rangeStart, rangeEnd]);

  // Cálculos de KPIs (acotados al periodo elegido)
  const validOrders = ordersInRange.filter((o) => o.status !== 'cancelled');
  const totalRevenue = validOrders.reduce((acc, order) => acc + order.total_amount, 0);

  const pendingOrders = ordersInRange.filter(o => o.status === 'pending').length;
  const customersCount = summarizeCustomers(ordersInRange).length;
  const periodBars = useMemo(() => revenueByDay(validOrders, rangeStart, rangeEnd), [validOrders, rangeStart, rangeEnd]);

  // Estado actual del catálogo: no depende del periodo seleccionado.
  const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const activePromos = products.filter(p => isPromoActive(p) && p.stock > 0).length;

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

      {/* 1b. Filtro de periodo para las métricas comerciales */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 bg-cuero-marfil rounded-2xl border border-cuero-arena/70">
        <span className="text-xs font-bold text-cuero-cognac shrink-0">Periodo:</span>

        <div className="flex flex-wrap items-center gap-2">
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setRangePreset(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                rangePreset === p.id
                  ? 'bg-cuero-espresso text-white shadow-sm'
                  : 'bg-brand-cream text-cuero-espresso border border-cuero-arena hover:bg-cuero-arena/30'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setRangePreset('custom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              rangePreset === 'custom'
                ? 'bg-cuero-espresso text-white shadow-sm'
                : 'bg-brand-cream text-cuero-espresso border border-cuero-arena hover:bg-cuero-arena/30'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Fecha personalizada</span>
          </button>
        </div>

        {rangePreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              max={customTo || todayISO()}
              className="px-2.5 py-1.5 rounded-lg bg-brand-cream border border-cuero-arena text-xs text-cuero-espresso"
              aria-label="Desde"
            />
            <span className="text-cuero-cognac text-xs">a</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              min={customFrom || undefined}
              max={todayISO()}
              className="px-2.5 py-1.5 rounded-lg bg-brand-cream border border-cuero-arena text-xs text-cuero-espresso"
              aria-label="Hasta"
            />
          </div>
        )}
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
              {ordersInRange.length}
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
                Tendencia de Ventas ({rangeLabel})
              </h3>
              <p className="text-xs text-cuero-cognac">Ingresos acumulados en COP</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-cuero-arena/30 text-xs font-bold text-cuero-espresso">
              {formatCOP(totalRevenue)} en el periodo
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-cuero-arena/50">
            {periodBars.map((bar, idx) => (
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
