import type { NotificationsPort } from '../domain/ports/notifications.port';

/** Caso de uso: obtiene el contador de notificaciones no leídas. */
export async function getUnreadCount(
  port: NotificationsPort,
): Promise<number> {
  return port.getUnreadCount();
}
