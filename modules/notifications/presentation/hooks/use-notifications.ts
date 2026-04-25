import { useSummaryDebts } from '@/modules/debts';
import { useExchangeRate } from '@/modules/shared-services/exchange-rate';
import { useShoppingListsSummary } from '@/modules/supermarket';
import { useAuth } from '@/shared/presentation/hooks/auth/use-auth';
import { useCountry } from '@/shared/presentation/hooks/use-country';
import { useCallback, useMemo } from 'react';
import { deriveNotifications } from '../../application/derive-notifications.use-case';
import type { AppNotification } from '../../domain/entities/notification.entity';
import { useNotificationStore } from '../../infrastructure/store/notification.store';

export interface UseNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  isAuthenticated: boolean;
}

/**
 * Hook de presentación: orquesta el caso de uso `deriveNotifications` con
 * los datos reactivos de los módulos consumidos (debts, supermarket,
 * exchange-rate). Los guests reciben un arreglo vacío — cumpliendo la
 * regla irrompible #5 ("notificaciones solo para usuarios autenticados").
 */
export function useNotifications(): UseNotificationsResult {
  const { isAuthenticated } = useAuth();
  const summaryDebts = useSummaryDebts();
  const { lists } = useShoppingListsSummary();
  const { rate } = useExchangeRate();
  const { country } = useCountry();

  const readIds = useNotificationStore((s) => s.readIds);
  const markAsReadStore = useNotificationStore((s) => s.markAsRead);
  const markAllAsReadStore = useNotificationStore((s) => s.markAllAsRead);

  const notifications = useMemo<AppNotification[]>(() => {
    if (!isAuthenticated) return [];
    return deriveNotifications({
      summaryDebts,
      lists,
      rate,
      locale: country.locale,
    });
  }, [isAuthenticated, summaryDebts, lists, rate, country.locale]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIds.has(n.id)).length,
    [notifications, readIds],
  );

  const markAllAsRead = useCallback(() => {
    markAllAsReadStore(notifications.map((n) => n.id));
  }, [notifications, markAllAsReadStore]);

  return {
    notifications,
    unreadCount,
    markAsRead: markAsReadStore,
    markAllAsRead,
    isAuthenticated,
  };
}
