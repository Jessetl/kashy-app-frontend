/**
 * Logger de auth solo para desarrollo. No-op en producción (`__DEV__` false).
 * Visible desde la dev console (Metro / Flipper / Reactotron).
 *
 * Seguridad: NUNCA imprime tokens completos. `mask()` deja solo una huella
 * (largo + primeros/últimos chars) suficiente para verificar el flujo sin
 * filtrar el credencial a los logs.
 */

const TAG = '[Auth]';

/** Enmascara un token: `eyJhbG…(312)…a9Qk` o `null`. */
export function mask(token: string | null | undefined): string {
  if (!token) {
    return String(token); // 'null' | 'undefined'
  }
  if (token.length <= 12) {
    return `…(${token.length})…`;
  }
  return `${token.slice(0, 6)}…(${token.length})…${token.slice(-4)}`;
}

export function authLog(event: string, data?: Record<string, unknown>): void {
  if (!__DEV__) {
    return;
  }
  if (data) {
    console.log(`${TAG} ${event}`, data);
  } else {
    console.log(`${TAG} ${event}`);
  }
}
