import { useDebtStore } from '@/modules/debts/infrastructure/store/debt.store';
import { useExchangeRate } from '@/modules/shared-services/exchange-rate/presentation/use-exchange-rate';
import { useShoppingListStore } from '@/modules/supermarket/infrastructure/store/shopping-list.store';
import { useAuthStore } from '@/shared/infrastructure/auth/auth.store';
import {
  formatLocalDateDisplay,
  localDateToMs,
} from '@/shared/domain/date/local-date';
import { useCountry } from '@/shared/presentation/hooks/use-country';
import { useCallback, useMemo } from 'react';
import type { AppNotification } from '../../domain/entities/notification.entity';
import { useNotificationStore } from '../../infrastructure/store/notification.store';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LIST_IDLE_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48h

/** Redondea a medianoche local para deduplicar recordatorios por día */
function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function formatShortDate(dueDate: string, locale: string): string {
  return formatLocalDateDisplay(dueDate, locale, {
    day: '2-digit',
    month: 'short',
  });
}

export interface UseNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  isAuthenticated: boolean;
}

/**
 * Deriva las notificaciones in-memory desde los stores de deudas, listas y tasa.
 * Solo aplica para usuarios autenticados — los guests reciben una lista vacía
 * (cumpliendo regla §10.5 de ARCHITECTURE_MASTER).
 */
export function useNotifications(): UseNotificationsResult {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const summaryDebts = useDebtStore((s) => s.summaryDebts);
  const lists = useShoppingListStore((s) => s.lists);
  const { rate } = useExchangeRate();
  const { country } = useCountry();

  const readIds = useNotificationStore((s) => s.readIds);
  const markAsReadStore = useNotificationStore((s) => s.markAsRead);
  const markAllAsReadStore = useNotificationStore((s) => s.markAllAsRead);

  const notifications = useMemo<AppNotification[]>(() => {
    if (!isAuthenticated) return [];

    const now = Date.now();
    const today = todayKey();
    const result: AppNotification[] = [];

    // 1. Deudas / cobros — vencidas o por vencer en ≤ 24h
    for (const debt of summaryDebts) {
      if (debt.isPaid || !debt.dueDate) continue;

      const dueMs = localDateToMs(debt.dueDate);
      const diffMs = dueMs - now;
      const isCollection = debt.isCollection;

      if (diffMs < 0) {
        // Vencida
        const daysOverdue = Math.ceil(Math.abs(diffMs) / MS_PER_DAY);
        result.push({
          id: `debt-overdue-${debt.id}-${today}`,
          type: 'debt_overdue',
          severity: 'danger',
          title: isCollection
            ? `Cobro vencido: ${debt.title}`
            : `Deuda vencida: ${debt.title}`,
          message: isCollection
            ? `Venció hace ${daysOverdue} día${daysOverdue > 1 ? 's' : ''}. Considera contactar al deudor.`
            : `Venció hace ${daysOverdue} día${daysOverdue > 1 ? 's' : ''}. Paga cuanto antes.`,
          createdAt: debt.dueDate,
          relatedId: debt.id,
        });
      } else if (diffMs <= MS_PER_DAY) {
        // Vence en ≤ 24h
        result.push({
          id: `debt-due-${debt.id}-${today}`,
          type: isCollection ? 'collection_due_reminder' : 'debt_due_reminder',
          severity: 'warning',
          title: isCollection
            ? `Cobro por vencer: ${debt.title}`
            : `Deuda por vencer: ${debt.title}`,
          message: `Vence ${formatShortDate(debt.dueDate, country.locale)}. Prepárate con anticipación.`,
          createdAt: new Date(now).toISOString(),
          relatedId: debt.id,
        });
      }
    }

    // 2. Listas de compra activas sin actividad en 48h
    for (const list of lists) {
      if (list.status !== 'active') continue;
      if (list.items.length === 0) continue;
      if (list.id.startsWith('local-')) continue;

      const createdMs = new Date(list.createdAt).getTime();
      if (now - createdMs < LIST_IDLE_THRESHOLD_MS) continue;

      const pending = list.items.filter((i) => !i.isPurchased).length;
      if (pending === 0) continue;

      result.push({
        id: `list-reminder-${list.id}-${today}`,
        type: 'list_reminder',
        severity: 'info',
        title: `Tu lista "${list.name}" sigue pendiente`,
        message: `Tienes ${pending} producto${pending > 1 ? 's' : ''} sin marcar como comprado${pending > 1 ? 's' : ''}.`,
        createdAt: new Date(now).toISOString(),
        relatedId: list.id,
      });
    }

    // 3. Alerta de tasa — si la fuente marca volatilidad reciente
    // (placeholder básico: solo avisa si hay tasa cargada hoy)
    if (rate?.fetchedAt) {
      const fetchedMs = new Date(rate.fetchedAt).getTime();
      const hoursAgo = (now - fetchedMs) / (60 * 60 * 1000);
      if (hoursAgo <= 6) {
        result.push({
          id: `price-alert-${rate.source}-${today}`,
          type: 'price_alert',
          severity: 'info',
          title: 'Tasa actualizada',
          message: `Nueva tasa ${rate.source}: ${rate.rateLocalPerUsd.toFixed(2)}. Revisa tus listas activas.`,
          createdAt: rate.fetchedAt,
        });
      }
    }

    // Ordenar: más recientes primero, severity danger antes
    const severityRank: Record<AppNotification['severity'], number> = {
      danger: 0,
      warning: 1,
      info: 2,
      success: 3,
    };
    result.sort((a, b) => {
      const sev = severityRank[a.severity] - severityRank[b.severity];
      if (sev !== 0) return sev;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
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
