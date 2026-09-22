// ==========================================
// rateLimiter.ts — Control de frecuencia por LocalStorage
// ==========================================

export function checkRateLimit(key: string, limitMs: number = 3000): boolean {
  try {
    const storageKey = `rate_limit_${key}`;
    const now = Date.now();
    const lastTime = localStorage.getItem(storageKey);

    if (lastTime) {
      const elapsed = now - parseInt(lastTime, 10);
      if (elapsed < limitMs) {
        return false; // Bloqueado por rate limit
      }
    }

    localStorage.setItem(storageKey, now.toString());
    return true; // Permitido
  } catch {
    return true; // Fallback tolerante si LocalStorage falla
  }
}
