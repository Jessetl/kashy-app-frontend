import { useShoppingStore } from '../store/useShoppingStore';

/**
 * Limpia el estado del módulo shopping-lists sin necesidad de un React hook.
 * Consumido por el flujo de logout del módulo auth.
 */
export function resetShoppingListsModule(): void {
  useShoppingStore.getState().resetStore();
}
