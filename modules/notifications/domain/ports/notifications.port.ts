import type {
  AppNotification,
  NotificationSearchInput,
  NotificationSearchResult,
} from '../entities/notification.entity';

export interface NotificationsPort {
  search(input: NotificationSearchInput): Promise<NotificationSearchResult>;
  getUnreadCount(): Promise<number>;
  markAsRead(id: string): Promise<AppNotification>;
  /** Devuelve cuántas se marcaron como leídas. */
  markAllAsRead(): Promise<number>;
  delete(id: string): Promise<void>;
}
