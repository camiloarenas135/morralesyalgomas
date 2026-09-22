// ==========================================
// config.ts — Datos de contacto del negocio (variables de entorno)
// Sin valores de respaldo: un número inventado enviaría pedidos reales a un
// tercero, así que si falta la variable las funciones de WhatsApp se desactivan.
// ==========================================

/** Número de WhatsApp del negocio solo con dígitos y con indicativo (ej: 573001234567). */
export const WHATSAPP_NUMBER: string = String(import.meta.env.VITE_WHATSAPP_NUMBER ?? '').replace(/\D/g, '');

/** Correo de contacto opcional; si no está definido no se muestra en el sitio. */
export const CONTACT_EMAIL: string = String(import.meta.env.VITE_CONTACT_EMAIL ?? '').trim();

/** "573001234567" -> "+57 300 123 4567" (si no tiene el formato colombiano, devuelve "+número"). */
export function formatWhatsappDisplay(number: string): string {
  if (number.length === 12 && number.startsWith('57')) {
    return `+57 ${number.slice(2, 5)} ${number.slice(5, 8)} ${number.slice(8)}`;
  }
  return `+${number}`;
}
