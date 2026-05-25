/**
 * Resumen del registro financiero embebido en cada notificación.
 * Permite navegación directa al detalle sin un round-trip adicional.
 *
 * Forma definida por el router `/notifications/*` (POST /search).
 */
export type FinancialRecordType = 'EXPENSE' | 'INCOME';

export interface FinancialRecordSummary {
  id: string;
  title: string;
  type: FinancialRecordType;
  amountLocal: number;
  amountUsd: number;
  /** Fecha del registro (ISO local date, ej. "2026-06-15") */
  date: string;
}
