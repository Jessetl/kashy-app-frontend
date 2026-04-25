import { useDebtStore } from '../../infrastructure/store/debt.store';

/**
 * Limpia el estado del módulo debts sin necesidad de un React hook.
 * Útil para el flujo de logout, que necesita borrar cache cross-módulo.
 */
export function resetDebtsModule(): void {
  useDebtStore.getState().resetStore();
}
