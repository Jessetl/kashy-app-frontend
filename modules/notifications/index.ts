/**
 * API pública del módulo notifications.
 */

// Domain
export type {
  AppNotification,
  NotificationSeverity,
  NotificationType,
} from './domain/entities/notification.entity';
export { getNotificationIconKey } from './domain/entities/notification.entity';

// Presentation — API pública
export {
  useNotifications,
  type UseNotificationsResult,
} from './presentation/hooks/use-notifications';
