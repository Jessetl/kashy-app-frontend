import type { NotificationsPort } from '../domain/ports/notifications.port';

/** Caso de uso: elimina una notificación. No afecta el registro financiero asociado. */
export async function deleteNotification(
  port: NotificationsPort,
  id: string,
): Promise<void> {
  await port.delete(id);
}
