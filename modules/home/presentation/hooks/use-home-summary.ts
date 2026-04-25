import {
  calculateTotalWithInterest,
  isOverdue,
  useSummaryDebts,
  type Debt,
} from '@/modules/debts';
import { useExchangeRate } from '@/modules/shared-services/exchange-rate';
import { useShoppingListsSummary } from '@/modules/supermarket';
import { localDateToMs } from '@/shared/domain/date/local-date';
import { useAuth } from '@/shared/presentation/hooks/auth/use-auth';
import { useCallback, useMemo } from 'react';

export interface HomeSummary {
  // Auth
  isAuthenticated: boolean;
  displayName: string;
  initial: string;

  // Exchange rate
  exchangeRate: number | null;
  exchangeSource: string | null;
  isRateLoading: boolean;

  // Debts summary
  totalDebts: number;
  totalCollections: number;
  balance: number;
  upcomingDebts: Debt[];
  overdueCount: number;

  // Shopping
  activeListName: string | null;
  activeListItemCount: number;
  activeListPurchasedCount: number;
  activeListTotalLocal: number;

  // Actions
  reload: () => void;
}

export function useHomeSummary(): HomeSummary {
  const { isAuthenticated, user } = useAuth();
  const {
    rate,
    isLoading: isRateLoading,
    reload: reloadRate,
  } = useExchangeRate();

  // API pública del módulo debts (carga automática al montar si hay sesión).
  const allDebts = useSummaryDebts();

  // API pública del módulo supermarket.
  const { activeList } = useShoppingListsSummary();

  // User info
  const displayName = (isAuthenticated && user?.firstName) || 'Invitado';
  const initial = displayName.charAt(0).toUpperCase();

  // Debts calculations
  const debtsSummary = useMemo(() => {
    const unpaidDebts = allDebts.filter((d) => !d.isPaid && !d.isCollection);
    const unpaidCollections = allDebts.filter(
      (d) => !d.isPaid && d.isCollection,
    );

    const totalDebts = unpaidDebts.reduce(
      (sum, d) =>
        sum + calculateTotalWithInterest(d.amountUsd, d.interestRatePct),
      0,
    );
    const totalCollections = unpaidCollections.reduce(
      (sum, d) =>
        sum + calculateTotalWithInterest(d.amountUsd, d.interestRatePct),
      0,
    );

    // Upcoming: unpaid debts/collections sorted by due date, max 3
    const upcoming = allDebts
      .filter((d) => !d.isPaid && d.dueDate)
      .sort((a, b) => localDateToMs(a.dueDate!) - localDateToMs(b.dueDate!))
      .slice(0, 3);

    const overdueCount = allDebts.filter(
      (d) => !d.isPaid && isOverdue(d.dueDate),
    ).length;

    return {
      totalDebts,
      totalCollections,
      balance: totalCollections - totalDebts,
      upcoming,
      overdueCount,
    };
  }, [allDebts]);

  // Shopping summary
  const items = activeList?.items ?? [];
  const activeListItemCount = items.length;
  const activeListPurchasedCount = useMemo(
    () => items.filter((i) => i.isPurchased).length,
    [items],
  );

  const reload = useCallback(() => {
    void reloadRate();
    // La recarga de debts la gestiona internamente `useSummaryDebts`
    // cuando cambia la sesión; aquí sólo refrescamos la tasa.
  }, [reloadRate]);

  return {
    isAuthenticated,
    displayName,
    initial,

    exchangeRate: rate?.rateLocalPerUsd ?? null,
    exchangeSource: rate?.source ?? null,
    isRateLoading,

    totalDebts: debtsSummary.totalDebts,
    totalCollections: debtsSummary.totalCollections,
    balance: debtsSummary.balance,
    upcomingDebts: debtsSummary.upcoming,
    overdueCount: debtsSummary.overdueCount,

    activeListName: activeList?.name ?? null,
    activeListItemCount,
    activeListPurchasedCount,
    activeListTotalLocal: activeList?.totalLocal ?? 0,

    reload,
  };
}
