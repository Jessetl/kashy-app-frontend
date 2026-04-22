/**
 * Utilidades para manejar fechas "solo-día" (YYYY-MM-DD) sin sufrir
 * desfases por zona horaria.
 *
 * Problema que resuelven:
 *   new Date('2026-04-22') parsea el string como UTC midnight → al
 *   formatear con toLocaleDateString('es-VE') (UTC-4) se ve como
 *   "21 abril" — un día menos.
 *
 * Estas funciones tratan los strings YYYY-MM-DD como fechas LOCALES,
 * que es lo que espera el usuario cuando pica en un calendario.
 */

/** Convierte 'YYYY-MM-DD' en un Date local (00:00 hora local). */
export function parseLocalDate(dateStr: string): Date {
  // Acepta también ISO con tiempo por si el backend devuelve
  // "2026-04-22T00:00:00.000Z" — tomamos solo la parte de fecha.
  const datePart = dateStr.slice(0, 10);
  const [y, m, d] = datePart.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Serializa un Date local como 'YYYY-MM-DD'. */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formatea un string 'YYYY-MM-DD' para mostrar al usuario.
 * El `locale` es obligatorio: debe venir del country activo
 * (`useCountry().country.locale`).
 */
export function formatLocalDateDisplay(
  dateStr: string,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  },
): string {
  return parseLocalDate(dateStr).toLocaleDateString(locale, options);
}

/** Milisegundos del 00:00 local correspondientes a 'YYYY-MM-DD'. */
export function localDateToMs(dateStr: string): number {
  return parseLocalDate(dateStr).getTime();
}

/** `true` si 'YYYY-MM-DD' es anterior a hoy (comparando solo la fecha). */
export function isPastLocalDate(dateStr: string): boolean {
  const due = parseLocalDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}
