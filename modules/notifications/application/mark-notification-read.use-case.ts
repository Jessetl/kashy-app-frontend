import type { AppNotification } from '../domain/entities/notification.entity';
import type { NotificationsPort } from '../domain/ports/notifications.port';

/** Caso de uso: marca una notificación puntual como leída. */
export async function markNotificationRead(
  port: NotificationsPort,
  id: string,
): Promise<AppNotification> {
  return port.markAsRead(id);
}
