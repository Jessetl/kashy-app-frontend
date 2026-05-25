import { useAuth } from '@/shared/presentation/hooks/auth/use-auth';
import { useCallback, useEffect, useRef } from 'react';
import type {
  ShoppingListSearchFilters,
  ShoppingListSummariesMeta,
  ShoppingListSummary,
} from '../../domain/entities/shopping-list-summary.entity';
import { useShoppingListStore } from '../../infrastructure/store/shopping-list.store';

export interface UseSavedListsResult {
  summaries: ShoppingListSummary[];
  meta: ShoppingListSummariesMeta;
  filters: ShoppingListSearchFilters;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  isAuthenticated: boolean;
  reload: (filters?: ShoppingListSearchFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (filters: ShoppingListSearchFilters) => void;
}

/**
 * Hook de presentación: orquesta el search paginado de listas guardadas
 * contra `POST /shopping-lists/search`. Los guests reciben listas vacías
 * (regla irrompible: solo KASHY consume el endpoint).
 */
export function useSavedLists(): UseSavedListsResult {
  const { isAuthenticated } = useAuth();

  const summaries = useShoppingListStore((s) => s.summaries);
  const meta = useShoppingListStore((s) => s.summariesMeta);
  const filters = useShoppingListStore((s) => s.summariesFilters);
  const isLoading = useShoppingListStore((s) => s.isLoadingSummaries);
  const isLoadingMore = useShoppingListStore((s) => s.isLoadingMoreSummaries);
  const error = useShoppingListStore((s) => s.error);

  const searchSummaries = useShoppingListStore((s) => s.searchSummaries);
  const loadMoreSummaries = useShoppingListStore((s) => s.loadMoreSummaries);
  const setSummariesFilters = useShoppingListStore(
    (s) => s.setSummariesFilters,
  );

  const didInit = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      didInit.current = false;
      return;
    }
    if (didInit.current) return;
    didInit.current = true;
    void searchSummaries();
  }, [isAuthenticated, searchSummaries]);

  const reload = useCallback(
    async (next?: ShoppingListSearchFilters) => {
      await searchSummaries(next, 1);
    },
    [searchSummaries],
  );

  return {
    summaries,
    meta,
    filters,
    isLoading,
    isLoadingMore,
    error,
    isAuthenticated,
    reload,
    loadMore: loadMoreSummaries,
    setFilters: setSummariesFilters,
  };
}
