import { isPastLocalDate } from '@/shared/domain/date/local-date';

/** Prioridad de una deuda */
export type DebtPriority = 'HIGH' | 'MEDIUM' | 'LOW';

/** Deuda o cobro */
export interface Debt {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  amountUsd: number;
  priority: DebtPriority;
  interestRatePct: number;
  interestAmountUsd: number;
  dueDate: string | null;
  isPaid: boolean;
  isCollection: boolean;
  createdAt: string;
}

/** Datos para crear una deuda/cobro */
export interface CreateDebtInput {
  title: string;
  description?: string;
  amountUsd: number;
  priority: DebtPriority;
  interestRatePct?: number;
  dueDate?: string;
  isCollection: boolean;
}

/** Datos para editar una deuda/cobro */
export interface UpdateDebtInput {
  title?: string;
  description?: string;
  amountUsd?: number;
  priority?: DebtPriority;
  interestRatePct?: number;
  dueDate?: string | null;
  isCollection?: boolean;
}

/** Filtros para listar deudas */
export interface DebtFilters {
  priority?: DebtPriority;
  isCollection?: boolean;
  isPaid?: boolean;
}

/** Etiquetas de prioridad */
export const DEBT_PRIORITIES: {
  key: DebtPriority;
  label: string;
  icon: string;
}[] = [
  { key: 'HIGH', label: 'Alta', icon: 'alert-circle' },
  { key: 'MEDIUM', label: 'Media', icon: 'minus-circle' },
  { key: 'LOW', label: 'Baja', icon: 'arrow-down-circle' },
];

/** Calcula el monto de interés */
export function calculateInterest(
  amountUsd: number,
  interestRatePct: number,
): number {
  return amountUsd * (interestRatePct / 100);
}

/** Calcula el monto total con interés */
export function calculateTotalWithInterest(
  amountUsd: number,
  interestRatePct: number,
): number {
  return amountUsd + calculateInterest(amountUsd, interestRatePct);
}

/** Verifica si una deuda está vencida */
export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return isPastLocalDate(dueDate);
}
