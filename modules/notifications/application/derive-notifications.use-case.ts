import type { Debt } from '@/modules/debts';
import { calculateTotalWithInterest as _calc } from '@/modules/debts';
import type { ExchangeRate } from '@/modules/shared-services/exchange-rate';
import type { ShoppingList } from '@/modules/supermarket';
import {
  formatLocalDateDisplay,
  localDateToMs,
} from '@/shared/domain/date/local-date';
import type { AppNotification } from '../domain/entities/notification.entity';

// (_calc se importa para mantener posible ampliación futura; no se usa
// en la derivación actual pero documenta que el use case tiene a su
// disposición las utilidades del domain de debts.)
void _calc;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LIST_IDLE_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48h
const PRICE_ALERT_WINDOW_HOURS = 6;

export interface DeriveNotificationsInput {
  summaryDebts: Debt[];
  lists: ShoppingList[];
  rate: ExchangeRate | null;
  locale: string;
  /** Momento de referencia para los cálculos (inyectable para tests). */
  now?: number;
}

/**
 * Caso de uso puro: dado el snapshot de deudas, listas y tasa, deriva la
 * lista de notificaciones in-app para el usuario autenticado.
 *
 * Esta función es deterministica y libre de dependencias de React, infra o
 * red, por lo que puede ser probada con inputs/outputs directos.
 */
export function deriveNotifications(
  input: DeriveNotificationsInput,
): AppNotification[] {
  const { summaryDebts, lists, rate, locale } = input;
  const now = input.now ?? Date.now();
  const today = todayKey(now);

  const result: AppNotification[] = [];

  // 1. Deudas / cobros — vencidas o por vencer en ≤ 24h
  for (const debt of summaryDebts) {
    if (debt.isPaid || !debt.dueDate) continue;

    const dueMs = localDateToMs(debt.dueDate);
    const diffMs = dueMs - now;
    const isCollection = debt.isCollection;

    if (diffMs < 0) {
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
      result.push({
        id: `debt-due-${debt.id}-${today}`,
        type: isCollection ? 'collection_due_reminder' : 'debt_due_reminder',
        severity: 'warning',
        title: isCollection
          ? `Cobro por vencer: ${debt.title}`
          : `Deuda por vencer: ${debt.title}`,
        message: `Vence ${formatShortDate(debt.dueDate, locale)}. Prepárate con anticipación.`,
        createdAt: new Date(now).toISOString(),
        relatedId: debt.id,
      });
    }
  }

  // 2. Listas activas sin actividad en 48h
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

  // 3. Alerta de tasa reciente
  if (rate?.fetchedAt) {
    const fetchedMs = new Date(rate.fetchedAt).getTime();
    const hoursAgo = (now - fetchedMs) / (60 * 60 * 1000);
    if (hoursAgo <= PRICE_ALERT_WINDOW_HOURS) {
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

  return sortBySeverityAndDate(result);
}

function todayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function formatShortDate(dueDate: string, locale: string): string {
  return formatLocalDateDisplay(dueDate, locale, {
    day: '2-digit',
    month: 'short',
  });
}

const SEVERITY_RANK: Record<AppNotification['severity'], number> = {
  danger: 0,
  warning: 1,
  info: 2,
  success: 3,
};

function sortBySeverityAndDate(items: AppNotification[]): AppNotification[] {
  return [...items].sort((a, b) => {
    const sev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (sev !== 0) return sev;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
