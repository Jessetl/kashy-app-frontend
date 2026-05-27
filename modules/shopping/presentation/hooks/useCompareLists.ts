import { useCallback, useEffect, useState } from 'react';
import type { ShoppingListsComparison } from '../../domain/entities/shopping-list-compare.entity';
import { useShoppingStore } from '../store/useShoppingStore';

export interface UseCompareListsResult {
  comparison: ShoppingListsComparison | null;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  /** Re-ejecuta la comparación con los mismos IDs. Útil tras error/red caída. */
  retry: () => Promise<void>;
}

/**
 * Hook de presentación para `/shopping/compare`. La selección de listas se
 * hace en `SavedListsScreen` vía multi-select (Flow 13); este hook solo
 * orquesta el `POST /shopping-lists/compare` y expone el resultado.
 *
 * Si `aId === bId` o falta alguno, no dispara la request (resultado queda null).
 */
export function useCompareLists(
  aId: string | null,
  bId: string | null,
): UseCompareListsResult {
  const compareAction = useShoppingStore((s) => s.compareLists);

  const [comparison, setComparison] = useState<ShoppingListsComparison | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compare = useCallback(async () => {
    if (!aId || !bId || aId === bId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await compareAction(aId, bId);
      setComparison(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo comparar las listas';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [aId, bId, compareAction]);

  useEffect(() => {
    void compare();
  }, [compare]);

  const clearError = useCallback(() => setError(null), []);

  return {
    comparison,
    isLoading,
    error,
    clearError,
    retry: compare,
  };
}
