import { useCallback, useState } from 'react';
import type { ShoppingListsComparison } from '../../domain/entities/shopping-list-compare.entity';
import { useShoppingStore } from '../store/useShoppingStore';

export interface UseCompareListsResult {
  listAId: string | null;
  listBId: string | null;
  comparison: ShoppingListsComparison | null;
  isLoading: boolean;
  error: string | null;
  canCompare: boolean;

  setListA: (id: string | null) => void;
  setListB: (id: string | null) => void;
  swap: () => void;
  compare: () => Promise<void>;
  reset: () => void;
  clearError: () => void;
}

/**
 * Hook de presentación para la pantalla de comparación de listas.
 *
 * Mantiene la selección de ambas listas en estado local + ejecuta
 * `compareLists` del store contra `POST /shopping-lists/compare`. Restringe
 * comparaciones inválidas (IDs vacíos o iguales).
 */
export function useCompareLists(): UseCompareListsResult {
  const compareAction = useShoppingStore((s) => s.compareLists);

  const [listAId, setListAId] = useState<string | null>(null);
  const [listBId, setListBId] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ShoppingListsComparison | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCompare =
    !!listAId && !!listBId && listAId !== listBId && !isLoading;

  const setListA = useCallback((id: string | null) => {
    setListAId(id);
    setComparison(null);
    setError(null);
  }, []);

  const setListB = useCallback((id: string | null) => {
    setListBId(id);
    setComparison(null);
    setError(null);
  }, []);

  const swap = useCallback(() => {
    setListAId(listBId);
    setListBId(listAId);
    setComparison(null);
  }, [listAId, listBId]);

  const compare = useCallback(async () => {
    if (!listAId || !listBId || listAId === listBId) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await compareAction(listAId, listBId);
      setComparison(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo comparar las listas';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [listAId, listBId, compareAction]);

  const reset = useCallback(() => {
    setListAId(null);
    setListBId(null);
    setComparison(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    listAId,
    listBId,
    comparison,
    isLoading,
    error,
    canCompare,
    setListA,
    setListB,
    swap,
    compare,
    reset,
    clearError,
  };
}
