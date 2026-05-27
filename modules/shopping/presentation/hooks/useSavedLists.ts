import { useAuth } from '@/shared/presentation/hooks/auth/use-auth';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ShoppingListSearchFilters,
  ShoppingListSummariesMeta,
  ShoppingListSummary,
} from '../../domain/entities/shopping-list-summary.entity';
import type { ShoppingList } from '../../domain/entities/shopping-list.entity';
import { useShoppingStore } from '../store/useShoppingStore';

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
 * Hook de presentación: orquesta el listado de listas guardadas.
 * Auth: pagina contra `POST /shopping-lists/search`.
 * Guest: deriva summaries del store local (listas creadas sin login persistidas
 * en secureStorage). Permite que un invitado vea/edite sus plantillas sin
 * cuenta y al loguearse se sincronizan via `syncGuestData`.
 */
export function useSavedLists(): UseSavedListsResult {
  const { isAuthenticated } = useAuth();

  const summaries = useShoppingStore((s) => s.summaries);
  const meta = useShoppingStore((s) => s.summariesMeta);
  const storeFilters = useShoppingStore((s) => s.summariesFilters);
  const isLoading = useShoppingStore((s) => s.isLoadingSummaries);
  const isLoadingMore = useShoppingStore((s) => s.isLoadingMoreSummaries);
  const error = useShoppingStore((s) => s.error);

  const allLists = useShoppingStore((s) => s.lists);
  const guestLists = useMemo(
    () => allLists.filter((l) => l.id.startsWith('local-')),
    [allLists],
  );
  const hydrateGuestData = useShoppingStore((s) => s.hydrateGuestData);
  const hydrateAuthCache = useShoppingStore((s) => s.hydrateAuthCache);
  const isOnline = useShoppingStore((s) => s.isOnline);

  const searchSummaries = useShoppingStore((s) => s.searchSummaries);
  const loadMoreSummaries = useShoppingStore((s) => s.loadMoreSummaries);
  const setSummariesFilters = useShoppingStore((s) => s.setSummariesFilters);

  const didInitAuth = useRef(false);
  const didHydrateGuest = useRef(false);
  const [guestFilters, setGuestFilters] = useState<ShoppingListSearchFilters>(
    {},
  );
  const [isHydratingGuest, setIsHydratingGuest] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      didHydrateGuest.current = false;
      if (didInitAuth.current) return;
      didInitAuth.current = true;
      if (isOnline) {
        void searchSummaries();
      } else {
        // Flow 1 — auth offline: hidratar último snapshot persistido.
        void hydrateAuthCache();
      }
      return;
    }

    didInitAuth.current = false;
    if (didHydrateGuest.current) return;
    didHydrateGuest.current = true;
    setIsHydratingGuest(true);
    void hydrateGuestData().finally(() => setIsHydratingGuest(false));
  }, [
    isAuthenticated,
    isOnline,
    searchSummaries,
    hydrateGuestData,
    hydrateAuthCache,
  ]);

  const guestSummaries = useMemo<ShoppingListSummary[]>(() => {
    return guestLists
      .filter((l) => matchFilters(l, guestFilters))
      .map(toSummary);
  }, [guestLists, guestFilters]);

  const guestMeta = useMemo<ShoppingListSummariesMeta>(
    () => ({
      page: 1,
      limit: guestSummaries.length,
      total: guestSummaries.length,
      totalPages: 1,
    }),
    [guestSummaries.length],
  );

  const reload = useCallback(
    async (next?: ShoppingListSearchFilters) => {
      if (isAuthenticated) {
        if (!isOnline) {
          await hydrateAuthCache();
          return;
        }
        await searchSummaries(next, 1);
        return;
      }
      if (next) setGuestFilters(next);
      await hydrateGuestData();
    },
    [isAuthenticated, isOnline, searchSummaries, hydrateAuthCache, hydrateGuestData],
  );

  const setFilters = useCallback(
    (next: ShoppingListSearchFilters) => {
      if (isAuthenticated) {
        setSummariesFilters(next);
        return;
      }
      setGuestFilters(next);
    },
    [isAuthenticated, setSummariesFilters],
  );

  const loadMore = useCallback(async () => {
    if (!isAuthenticated) return;
    await loadMoreSummaries();
  }, [isAuthenticated, loadMoreSummaries]);

  return {
    summaries: isAuthenticated ? summaries : guestSummaries,
    meta: isAuthenticated ? meta : guestMeta,
    filters: isAuthenticated ? storeFilters : guestFilters,
    isLoading: isAuthenticated ? isLoading : isHydratingGuest,
    isLoadingMore: isAuthenticated ? isLoadingMore : false,
    error,
    isAuthenticated,
    reload,
    loadMore,
    setFilters,
  };
}

function toSummary(list: ShoppingList): ShoppingListSummary {
  const itemsCount = list.items.length;
  const checkedCount = list.items.filter((i) => i.isPurchased).length;
  return {
    id: list.id,
    name: list.name,
    storeName: list.storeName,
    listType: list.listType,
    currencyCode: list.currencyCode,
    isActive: list.status === 'active',
    scheduledDate: list.scheduledDate,
    itemsCount,
    checkedCount,
    totalLocal: list.totalLocal,
    totalUsd: list.totalUsd,
  };
}

function matchFilters(
  list: ShoppingList,
  filters: ShoppingListSearchFilters,
): boolean {
  if (filters.listType && list.listType !== filters.listType) return false;
  if (
    filters.storeName &&
    !(list.storeName ?? '')
      .toLowerCase()
      .includes(filters.storeName.toLowerCase())
  ) {
    return false;
  }
  return true;
}
