import type { FinancialRecordSummary } from './financial-record-summary.entity';

/** Estado de envío administrado por el backend. */
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

/**
 * Notificación tal como la entrega el router `/notifications/*`.
 * `type` es un string libre (categoría de negocio); el discriminador
 * útil para navegación es `financialRecord.type` (EXPENSE | INCOME).
 */
export interface AppNotification {
  id: string;
  type: string;
  /** ISO date — cuándo fue programada para envío */
  scheduledAt: string;
  /** ISO date — cuándo se envió efectivamente; null si aún PENDING/FAILED */
  sentAt: string | null;
  status: NotificationStatus;
  isRead: boolean;
  financialRecord: FinancialRecordSummary;
}

/** Filtros aceptados por POST /notifications/search */
export interface NotificationFilters {
  isRead?: boolean | null;
  status?: NotificationStatus | null;
  type?: string | null;
  /** ISO date */
  scheduledDateFrom?: string | null;
  /** ISO date */
  scheduledDateTo?: string | null;
}

export interface NotificationSearchInput {
  page: number;
  limit: number;
  filters?: NotificationFilters;
}

export interface NotificationListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NotificationSearchResult {
  data: AppNotification[];
  meta: NotificationListMeta;
}
