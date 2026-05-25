import type {
  NotificationSearchInput,
  NotificationSearchResult,
} from '../domain/entities/notification.entity';
import type { NotificationsPort } from '../domain/ports/notifications.port';

/**
 * Caso de uso puro: lista notificaciones paginadas y filtradas.
 *
 * Defaults: page=1, limit=20 si no se especifican. La validación de rango
 * la hace el backend; esta capa solo asegura valores positivos para
 * evitar requests con `page: 0`.
 */
export async function searchNotifications(
  port: NotificationsPort,
  input: Partial<NotificationSearchInput> = {},
): Promise<NotificationSearchResult> {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.max(1, input.limit ?? 20);
  return port.search({ page, limit, filters: input.filters });
}
