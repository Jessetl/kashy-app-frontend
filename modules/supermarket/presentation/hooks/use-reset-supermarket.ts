import { useShoppingListStore } from '../../infrastructure/store/shopping-list.store';

/**
 * Limpia el estado del módulo supermarket sin necesidad de un React hook.
 * Consumido por el flujo de logout del módulo auth.
 */
export function resetSupermarketModule(): void {
  useShoppingListStore.getState().resetStore();
}
