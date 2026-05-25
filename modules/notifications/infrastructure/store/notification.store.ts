import { ApiHttpError } from '@/shared/infrastructure/api/api-http-error';
import { useAuthStore } from '@/shared/infrastructure/auth/auth.store';
import { create } from 'zustand';
import type {
  AppNotification,
  NotificationFilters,
  NotificationListMeta,
} from '../../domain/entities/notification.entity';
import { NotificationsDatasource } from '../datasources/notifications.datasource';

const datasource = new NotificationsDatasource();

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const INITIAL_META: NotificationListMeta = {
  page: DEFAULT_PAGE,
  limit: DEFAULT_LIMIT,
  total: 0,
  totalPages: 0,
};

interface NotificationState {
  notifications: AppNotification[];
  meta: NotificationListMeta;
  unreadCount: number;
  filters: NotificationFilters;
  isLoading: boolean;
  isLoadingMore: boolean;
  isMutating: boolean;
  error: string | null;

  loadFirstPage: (filters?: NotificationFilters) => Promise<void>;
  loadNextPage: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  setFilters: (filters: NotificationFilters) => void;
  clearError: () => void;
  resetStore: () => void;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function isNotFound(err: unknown): boolean {
  return err instanceof ApiHttpError && err.status === 404;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  meta: INITIAL_META,
  unreadCount: 0,
  filters: {},
  isLoading: false,
  isLoadingMore: false,
  isMutating: false,
  error: null,

  clearError: () => set({ error: null }),

  setFilters: (filters) => set({ filters }),

  loadFirstPage: async (filters) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      set({
        notifications: [],
        meta: INITIAL_META,
        unreadCount: 0,
        isLoading: false,
      });
      return;
    }

    const activeFilters = filters ?? get().filters;
    set({ isLoading: true, error: null, filters: activeFilters });
    try {
      const result = await datasource.search({
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
        filters: activeFilters,
      });
      set({
        notifications: result.data,
        meta: result.meta,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: errorMessage(err, 'No se pudieron cargar las notificaciones'),
        isLoading: false,
      });
    }
  },

  loadNextPage: async () => {
    const state = get();
    if (state.isLoadingMore || state.isLoading) return;
    if (state.meta.page >= state.meta.totalPages) return;

    set({ isLoadingMore: true, error: null });
    try {
      const result = await datasource.search({
        page: state.meta.page + 1,
        limit: state.meta.limit,
        filters: state.filters,
      });
      set((s) => ({
        notifications: [...s.notifications, ...result.data],
        meta: result.meta,
        isLoadingMore: false,
      }));
    } catch (err) {
      set({
        error: errorMessage(err, 'No se pudieron cargar más notificaciones'),
        isLoadingMore: false,
      });
    }
  },

  refreshUnreadCount: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      set({ unreadCount: 0 });
      return;
    }
    try {
      const unreadCount = await datasource.getUnreadCount();
      set({ unreadCount });
    } catch {
      // silencioso — el badge degrada sin romper la UI
    }
  },

  markAsRead: async (id) => {
    const state = get();
    const target = state.notifications.find((n) => n.id === id);
    if (!target || target.isRead) return;

    // Optimistic update — UI y badge instantáneos.
    set({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
      isMutating: true,
      error: null,
    });

    try {
      const updated = await datasource.markAsRead(id);
      set((s) => ({
        notifications: s.notifications.map((n) =>
          n.id === id ? updated : n,
        ),
        isMutating: false,
      }));
    } catch (err) {
      if (isNotFound(err)) {
        // Backend borró la notificación entre devices → quitarla del store
        // en vez de revertir. Cumple spec: "404 → Remover del store y actualizar UI".
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
          meta: { ...s.meta, total: Math.max(0, s.meta.total - 1) },
          isMutating: false,
        }));
        return;
      }
      // Revert optimistic update
      set((s) => ({
        notifications: s.notifications.map((n) =>
          n.id === id ? target : n,
        ),
        unreadCount: s.unreadCount + 1,
        isMutating: false,
        error: errorMessage(err, 'No se pudo marcar como leída'),
      }));
    }
  },

  markAllAsRead: async () => {
    const state = get();
    const previous = state.notifications;
    const previousUnread = state.unreadCount;

    set({
      notifications: previous.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
      isMutating: true,
      error: null,
    });

    try {
      await datasource.markAllAsRead();
      set({ isMutating: false });
    } catch (err) {
      set({
        notifications: previous,
        unreadCount: previousUnread,
        isMutating: false,
        error: errorMessage(err, 'No se pudieron marcar todas como leídas'),
      });
    }
  },

  deleteNotification: async (id) => {
    const state = get();
    const target = state.notifications.find((n) => n.id === id);
    if (!target) return;

    const wasUnread = !target.isRead;

    set({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount: wasUnread
        ? Math.max(0, state.unreadCount - 1)
        : state.unreadCount,
      meta: { ...state.meta, total: Math.max(0, state.meta.total - 1) },
      isMutating: true,
      error: null,
    });

    try {
      await datasource.delete(id);
      set({ isMutating: false });
    } catch (err) {
      if (isNotFound(err)) {
        // Spec: "404 → Remover del store y actualizar UI". Ya está removida
        // localmente por el optimistic update, no hay que revertir.
        set({ isMutating: false });
        return;
      }
      set((s) => ({
        notifications: [target, ...s.notifications],
        unreadCount: wasUnread ? s.unreadCount + 1 : s.unreadCount,
        meta: { ...s.meta, total: s.meta.total + 1 },
        isMutating: false,
        error: errorMessage(err, 'No se pudo eliminar la notificación'),
      }));
    }
  },

  resetStore: () =>
    set({
      notifications: [],
      meta: INITIAL_META,
      unreadCount: 0,
      filters: {},
      isLoading: false,
      isLoadingMore: false,
      isMutating: false,
      error: null,
    }),
}));
