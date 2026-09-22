// ==========================================
// promoHelpers.ts — Formateo COP y Helpers de Promociones
// ==========================================

/**
 * Convierte un string de precio con formato COP ("$189.900" o "$ 189.900 COP") a número entero (189900)
 */
export function parseCOP(priceStr: string | undefined | null): number {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[^0-9]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formatea un número numérico a formato estándar de moneda colombiana COP
 * Ejemplo: 189900 -> "$189.900"
 */
export function formatCOP(amount: number): string {
  if (isNaN(amount) || amount === 0) return '$0';
  return '$' + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Calcula el porcentaje de descuento entre el precio base y el precio promocional
 * Ejemplo: base "$200.000", promo "$150.000" -> 25
 */
export function calculateDiscountPercent(originalPrice: string, promoPrice?: string): number {
  if (!promoPrice) return 0;
  const original = parseCOP(originalPrice);
  const promo = parseCOP(promoPrice);
  if (original <= 0 || promo <= 0 || promo >= original) return 0;
  return Math.round(((original - promo) / original) * 100);
}

/**
 * Calcula el tiempo restante respecto a una fecha límite ISO 8601
 */
export function calculateTimeRemaining(endDateIso?: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalSeconds: number;
} {
  if (!endDateIso) {
    // Si no hay fecha fijada, usamos un temporizador dinámico predeterminado de 2 días
    return { days: 1, hours: 14, minutes: 35, seconds: 20, isExpired: false, totalSeconds: 138920 };
  }

  const target = new Date(endDateIso).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, totalSeconds: 0 };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, isExpired: false, totalSeconds };
}
