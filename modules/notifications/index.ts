/**
 * API pública del módulo notifications.
 *
 * Todo consumo cross-módulo DEBE importar desde aquí. Los stores,
 * datasources y use cases de `infrastructure/`/`application/` son
 * privados al módulo (regla `no-restricted-imports`).
 */

// Domain — notificaciones
export type {
  AppNotification,
  NotificationFilters,
  NotificationListMeta,
  NotificationSearchInput,
  NotificationSearchResult,
  NotificationStatus,
} from './domain/entities/notification.entity';
export type {
  FinancialRecordSummary,
  FinancialRecordType,
} from './domain/entities/financial-record-summary.entity';

// Domain — preferencias
export type { NotificationPreferences } from './domain/entities/notification-preferences.entity';
export { DEFAULT_PREFERENCES } from './domain/entities/notification-preferences.entity';

// Presentation — API pública
export {
  useNotifications,
  type UseNotificationsResult,
} from './presentation/hooks/use-notifications';
export { useNotificationPreferences } from './presentation/hooks/use-notification-preferences';
