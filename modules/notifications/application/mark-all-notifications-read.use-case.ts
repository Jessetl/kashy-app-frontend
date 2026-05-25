import type { NotificationsPort } from '../domain/ports/notifications.port';

/** Caso de uso: marca todas las notificaciones del usuario como leídas. */
export async function markAllNotificationsRead(
  port: NotificationsPort,
): Promise<number> {
  return port.markAllAsRead();
}
