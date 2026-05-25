import { useAuth } from '@/shared/presentation/hooks/auth/use-auth';
import { useCallback, useEffect, useRef } from 'react';
import type {
  AppNotification,
  NotificationFilters,
  NotificationListMeta,
} from '../../domain/entities/notification.entity';
import { useNotificationStore } from '../../infrastructure/store/notification.store';

export interface UseNotificationsResult {
  notifications: AppNotification[];
  meta: NotificationListMeta;
  unreadCount: number;
  filters: NotificationFilters;
  isLoading: boolean;
  isLoadingMore: boolean;
  isMutating: boolean;
  error: string | null;
  isAuthenticated: boolean;

  reload: (filters?: NotificationFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (filters: NotificationFilters) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook de presentación: orquesta el store de notificaciones contra el
 * router `/notifications/*`. Los guests reciben listas vacías y badge 0
 * (regla irrompible: notificaciones solo para usuarios autenticados).
 *
 * Dispara una carga inicial + refresh del badge la primera vez que se
 * monta para un usuario autenticado.
 */
export function useNotifications(): UseNotificationsResult {
  const { isAuthenticated } = useAuth();

  const notifications = useNotificationStore((s) => s.notifications);
  const meta = useNotificationStore((s) => s.meta);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const filters = useNotificationStore((s) => s.filters);
  const isLoading = useNotificationStore((s) => s.isLoading);
  const isLoadingMore = useNotificationStore((s) => s.isLoadingMore);
  const isMutating = useNotificationStore((s) => s.isMutating);
  const error = useNotificationStore((s) => s.error);

  const loadFirstPage = useNotificationStore((s) => s.loadFirstPage);
  const loadNextPage = useNotificationStore((s) => s.loadNextPage);
  const refreshUnreadCount = useNotificationStore((s) => s.refreshUnreadCount);
  const markAsReadStore = useNotificationStore((s) => s.markAsRead);
  const markAllAsReadStore = useNotificationStore((s) => s.markAllAsRead);
  const deleteNotificationStore = useNotificationStore(
    (s) => s.deleteNotification,
  );
  const setFiltersStore = useNotificationStore((s) => s.setFilters);
  const clearError = useNotificationStore((s) => s.clearError);

  const didInit = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      didInit.current = false;
      return;
    }
    if (didInit.current) return;
    didInit.current = true;
    void loadFirstPage();
    void refreshUnreadCount();
  }, [isAuthenticated, loadFirstPage, refreshUnreadCount]);

  const reload = useCallback(
    async (next?: NotificationFilters) => {
      await loadFirstPage(next);
      await refreshUnreadCount();
    },
    [loadFirstPage, refreshUnreadCount],
  );

  return {
    notifications,
    meta,
    unreadCount,
    filters,
    isLoading,
    isLoadingMore,
    isMutating,
    error,
    isAuthenticated,
    reload,
    loadMore: loadNextPage,
    setFilters: setFiltersStore,
    markAsRead: markAsReadStore,
    markAllAsRead: markAllAsReadStore,
    deleteNotification: deleteNotificationStore,
    refreshUnreadCount,
    clearError,
  };
}
