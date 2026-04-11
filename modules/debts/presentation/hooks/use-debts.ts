import { useAuth } from '@/shared/presentation/hooks/auth/use-auth';
import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import type { Debt, DebtPriority } from '../../domain/entities/debt.entity';
import { useDebtStore, type DebtTab } from '../../infrastructure/store/debt.store';

export function useDebts() {
  const { isAuthenticated, openLoginModal } = useAuth();
  const didInit = useRef(false);

  const debts = useDebtStore((s) => s.debts);
  const isLoading = useDebtStore((s) => s.isLoading);
  const error = useDebtStore((s) => s.error);
  const activeTab = useDebtStore((s) => s.activeTab);
  const priorityFilter = useDebtStore((s) => s.priorityFilter);
  const showPaid = useDebtStore((s) => s.showPaid);

  const setActiveTab = useDebtStore((s) => s.setActiveTab);
  const setPriorityFilter = useDebtStore((s) => s.setPriorityFilter);
  const setShowPaid = useDebtStore((s) => s.setShowPaid);
  const loadDebts = useDebtStore((s) => s.loadDebts);
  const markAsPaid = useDebtStore((s) => s.markAsPaid);
  const deleteDebt = useDebtStore((s) => s.deleteDebt);
  const clearError = useDebtStore((s) => s.clearError);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    if (isAuthenticated) {
      void loadDebts();
    }
  }, [isAuthenticated, loadDebts]);

  useEffect(() => {
    if (didInit.current && isAuthenticated) {
      void loadDebts();
    }
  }, [isAuthenticated, loadDebts]);

  const requireAuth = useCallback(
    (action: () => void) => {
      if (!isAuthenticated) {
        openLoginModal(action);
        return;
      }
      action();
    },
    [isAuthenticated, openLoginModal],
  );

  const handleMarkAsPaid = useCallback(
    (id: string) => {
      requireAuth(() => {
        const isCollection = activeTab === 'collections';
        Alert.alert(
          isCollection ? 'Confirmar cobro' : 'Confirmar pago',
          isCollection
            ? '¿Seguro que deseas marcar este cobro como recibido?'
            : '¿Seguro que deseas marcar esta deuda como pagada?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: isCollection ? 'Cobrado' : 'Pagada',
              onPress: () => {
                void markAsPaid(id).catch((err: unknown) => {
                  const message =
                    err instanceof Error
                      ? err.message
                      : 'No se pudo completar la acción';
                  Alert.alert('Error', message);
                });
              },
            },
          ],
        );
      });
    },
    [requireAuth, markAsPaid, activeTab],
  );

  const handleDelete = useCallback(
    (id: string) => {
      requireAuth(() => {
        void deleteDebt(id).catch((err: unknown) => {
          const message =
            err instanceof Error ? err.message : 'No se pudo eliminar la deuda';
          Alert.alert('Error', message);
        });
      });
    },
    [requireAuth, deleteDebt],
  );

  const handleTabChange = useCallback(
    (tab: DebtTab) => {
      setActiveTab(tab);
    },
    [setActiveTab],
  );

  const handlePriorityChange = useCallback(
    (priority: DebtPriority | null) => {
      setPriorityFilter(priority);
    },
    [setPriorityFilter],
  );

  // Calcular resúmenes
  const totalDebts = debts
    .filter((d) => !d.isCollection && !d.isPaid)
    .reduce((sum, d) => sum + d.amountUsd + d.interestAmountUsd, 0);

  const totalCollections = debts
    .filter((d) => d.isCollection && !d.isPaid)
    .reduce((sum, d) => sum + d.amountUsd + d.interestAmountUsd, 0);

  // Resúmenes globales (no filtrados por tab)
  const summary = { totalDebts, totalCollections };

  return {
    debts,
    isLoading,
    error,
    activeTab,
    priorityFilter,
    showPaid,
    summary,
    isAuthenticated,

    setActiveTab: handleTabChange,
    setPriorityFilter: handlePriorityChange,
    setShowPaid,
    markAsPaid: handleMarkAsPaid,
    deleteDebt: handleDelete,
    reload: loadDebts,
    clearError,
    requireAuth,
  };
}

export type { Debt, DebtPriority, DebtTab };
