// ==========================================
// sanitize.ts — Sanitización de texto de entrada
// ==========================================

/**
 * Deja solo texto plano: elimina etiquetas HTML y scripts.
 *
 * No escapa entidades (&, ', "): el texto se guarda tal cual y React lo escapa
 * al renderizar; escaparlo aquí lo duplicaría y "O'Neil" llegaría a WhatsApp
 * como "O&#x27;Neil".
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Limpia y valida números telefónicos para Colombia (ej: 312 456 7890 -> 573124567890)
 */
export function sanitizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('57') && digits.length >= 12) {
    return digits;
  }
  if (digits.length === 10) {
    return `57${digits}`;
  }
  return digits;
}
