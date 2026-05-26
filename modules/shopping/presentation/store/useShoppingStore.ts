import { useAuthStore } from '@/shared/infrastructure/auth/auth.store';
import { useCountryStore } from '@/shared/infrastructure/country/country.store';
import { secureStorage } from '@/shared/infrastructure/storage/app-storage';
import { create } from 'zustand';
import type { ShoppingListsComparison } from '../../domain/entities/shopping-list-compare.entity';
import type {
  ShoppingListSearchFilters,
  ShoppingListSummariesMeta,
  ShoppingListSummary,
} from '../../domain/entities/shopping-list-summary.entity';
import type {
  CreateShoppingItemInput,
  ShoppingItem,
  ShoppingList,
  ShoppingListType,
  UpdateShoppingListInput,
} from '../../domain/entities/shopping-list.entity';
import { ShoppingListDatasource } from '../../infrastructure/datasources/shopping-list.datasource';

const GUEST_LISTS_KEY = 'guest-shopping-lists';
const AUTH_LISTS_CACHE_KEY = 'auth-shopping-lists-cache';
const datasource = new ShoppingListDatasource();

const PATCH_DEBOUNCE_MS = 600;
const SEARCH_DEFAULT_LIMIT = 100;
const SUMMARIES_INITIAL_META: ShoppingListSummariesMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

// ─── PATCH coalescing ─────────────────────────────────────────────────────

/**
 * El spec usa upsert: el PATCH /:id recibe el array completo de `items` y
 * el backend deduce qué crear/actualizar/eliminar comparando IDs. Por eso
 * coalescemos cualquier mutación (add/update/toggle/remove/quantity) en una
 * única request por lista — usamos siempre el snapshot más reciente del
 * activeList al disparar.
 */
const pendingListPatches = new Map<
  string,
  { timeout: ReturnType<typeof setTimeout> }
>();

const cancelPendingPatch = (listId: string): void => {
  const pending = pendingListPatches.get(listId);
  if (pending) {
    clearTimeout(pending.timeout);
    pendingListPatches.delete(listId);
  }
};

const scheduleListPatch = (
  listId: string,
  onError: (msg: string) => void,
  buildPayload: () => UpdateShoppingListInput | null,
  applyResponse: (list: ShoppingList) => void,
): void => {
  cancelPendingPatch(listId);

  const timeout = setTimeout(() => {
    pendingListPatches.delete(listId);
    const payload = buildPayload();
    if (!payload) return;
    void datasource
      .patchList(listId, payload)
      .then(applyResponse)
      .catch((err) => {
        const message =
          err instanceof Error
            ? err.message
            : 'No se pudo sincronizar la lista';
        onError(message);
      });
  }, PATCH_DEBOUNCE_MS);

  pendingListPatches.set(listId, { timeout });
};

const flushAllPendingPatches = async (
  buildPayload: (listId: string) => UpdateShoppingListInput | null,
  applyResponse: (list: ShoppingList) => void,
  onError: (msg: string) => void,
): Promise<void> => {
  const entries = Array.from(pendingListPatches.entries());
  entries.forEach(([, p]) => clearTimeout(p.timeout));
  pendingListPatches.clear();

  await Promise.all(
    entries.map(async ([listId]) => {
      const payload = buildPayload(listId);
      if (!payload) return;
      try {
        const updated = await datasource.patchList(listId, payload);
        applyResponse(updated);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'No se pudo sincronizar la lista';
        onError(message);
      }
    }),
  );
};

const generateId = (): string => {
  return `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const isServerList = (listId: string): boolean => !listId.startsWith('local-');

const shouldSyncToApi = (listId: string): boolean => {
  const { isAuthenticated } = useAuthStore.getState();
  return isAuthenticated && isServerList(listId);
};

const shouldPersistToStorage = (): boolean => {
  return !useAuthStore.getState().isAuthenticated;
};

// ─── Local recompute (solo guest mode / pre-sync) ─────────────────────────

const recalculateTotals = (
  items: ShoppingItem[],
  ivaEnabled: boolean,
  rate: number | null,
): {
  subtotalLocal: number;
  totalLocal: number;
  totalUsd: number | null;
  ivaLocal: number;
} => {
  const subtotalLocal = items.reduce((sum, item) => sum + item.totalLocal, 0);
  const ivaLocal = ivaEnabled ? subtotalLocal * 0.16 : 0;
  const totalLocal = subtotalLocal + ivaLocal;
  const totalUsd = rate && rate > 0 ? totalLocal / rate : null;
  return { subtotalLocal, ivaLocal, totalLocal, totalUsd };
};

const createDefaultList = (): ShoppingList => {
  const country = useCountryStore.getState().country;
  return {
    id: generateId(),
    userId: null,
    name: 'Nueva Lista',
    storeName: null,
    status: 'active',
    listType: 'TEMPLATE',
    countryCode: country.code,
    currencyCode: country.currency,
    ivaEnabled: false,
    exchangeRateSnapshot: null,
    scheduledDate: null,
    latitude: null,
    longitude: null,
    subtotalLocal: 0,
    subtotalUsd: null,
    ivaLocal: 0,
    ivaUsd: null,
    totalLocal: 0,
    totalUsd: null,
    items: [],
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
};

const toCreateItemInput = (item: ShoppingItem): CreateShoppingItemInput => ({
  id: item.id,
  productName: item.productName,
  category: item.category,
  quantity: item.quantity,
  unitPriceLocal: item.unitPriceLocal,
  unitPriceUsd: item.unitPriceUsd ?? 0,
  isPurchased: item.isPurchased,
});

// ─── Store ────────────────────────────────────────────────────────────────

interface ShoppingListState {
  /** Listas en memoria. Para listas del servidor solo se hidratan items al activar. */
  lists: ShoppingList[];
  activeList: ShoppingList | null;
  isLoading: boolean;
  error: string | null;

  // Search / summaries (POST /search)
  summaries: ShoppingListSummary[];
  summariesMeta: ShoppingListSummariesMeta;
  summariesFilters: ShoppingListSearchFilters;
  isLoadingSummaries: boolean;
  isLoadingMoreSummaries: boolean;

  // Actions — list-level
  setActiveList: (list: ShoppingList | null) => void;
  createList: (name: string, storeName?: string) => Promise<void>;
  loadLists: () => Promise<void>;
  saveList: (name: string, storeName: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  completeList: (listId: string) => Promise<void>;
  updateListSettings: (data: {
    ivaEnabled?: boolean;
    name?: string;
    storeName?: string;
    listType?: ShoppingListType;
  }) => Promise<void>;
  setExchangeRate: (rate: number) => void;

  // Actions — item-level (todas coalescen en PATCH /:id)
  addItem: (input: CreateShoppingItemInput) => Promise<void>;
  updateItem: (
    itemId: string,
    data: Partial<CreateShoppingItemInput>,
  ) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  toggleItemPurchased: (itemId: string) => Promise<void>;

  // Actions — search + compare (spec)
  searchSummaries: (
    filters?: ShoppingListSearchFilters,
    page?: number,
  ) => Promise<void>;
  loadMoreSummaries: () => Promise<void>;
  setSummariesFilters: (filters: ShoppingListSearchFilters) => void;
  compareLists: (
    listAId: string,
    listBId: string,
  ) => Promise<ShoppingListsComparison>;

  // Guest sync
  syncGuestData: () => Promise<void>;
  persistGuestData: () => void;
  persistListsCache: () => void;
  hydrateGuestData: () => Promise<void>;
  flushPendingItemSyncs: () => Promise<void>;
  clearError: () => void;
  resetStore: () => void;
}

export const useShoppingStore = create<ShoppingListState>()((set, get) => ({
  lists: [],
  activeList: null,
  isLoading: false,
  error: null,

  summaries: [],
  summariesMeta: SUMMARIES_INITIAL_META,
  summariesFilters: {},
  isLoadingSummaries: false,
  isLoadingMoreSummaries: false,

  clearError: () => set({ error: null }),

  setActiveList: (list) => {
    set({ activeList: list });

    // Si la lista viene de un summary del search (items vacíos) y es del
    // servidor, hidratar el detalle para que la pantalla muestre los items.
    if (list && isServerList(list.id) && list.items.length === 0) {
      const { isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated) return;

      void datasource
        .getListById(list.id)
        .then((hydrated) => {
          set((state) => ({
            activeList:
              state.activeList?.id === hydrated.id ? hydrated : state.activeList,
            lists: state.lists.map((l) => (l.id === hydrated.id ? hydrated : l)),
          }));
        })
        .catch((err) => {
          const message =
            err instanceof Error ? err.message : 'No se pudo cargar la lista';
          set({ error: message });
        });
    }
  },

  createList: async (name, storeName) => {
    // Las listas se crean siempre localmente; solo van al servidor cuando
    // el usuario guarda explícitamente (saveList).
    const newList: ShoppingList = {
      ...createDefaultList(),
      name,
      storeName: storeName ?? null,
    };

    set((state) => ({
      lists: [newList, ...state.lists],
      activeList: newList,
      isLoading: false,
    }));

    if (shouldPersistToStorage()) {
      get().persistGuestData();
    }
  },

  loadLists: async () => {
    const { isAuthenticated } = useAuthStore.getState();

    try {
      set({ isLoading: true, error: null });

      if (isAuthenticated) {
        // POST /search con limit alto para preservar el comportamiento previo
        // de "carga todas las listas activas". Items vacíos hasta que se
        // active alguna (entonces se hidrata via GET /:id).
        const page = await datasource.searchLists({
          page: 1,
          limit: SEARCH_DEFAULT_LIMIT,
          filters: { isActive: true },
        });
        const stubLists = page.data.map(summaryToStubList);

        set((state) => {
          const localLists = state.lists.filter((l) => !isServerList(l.id));
          return {
            lists: [...localLists, ...stubLists],
            summaries: page.data,
            summariesMeta: page.meta,
            isLoading: false,
          };
        });
      } else {
        await get().hydrateGuestData();
        set({ isLoading: false });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudieron cargar las listas';
      set({ error: message, isLoading: false });
    }
  },

  addItem: async (input) => {
    const { activeList } = get();
    if (!activeList) return;

    const newItem: ShoppingItem = {
      id: input.id ?? generateId(),
      listId: activeList.id,
      productName: input.productName,
      category: input.category,
      quantity: input.quantity,
      unitPriceLocal: input.unitPriceLocal,
      totalLocal: input.unitPriceLocal * input.quantity,
      unitPriceUsd: input.unitPriceUsd ?? null,
      totalUsd:
        input.unitPriceUsd != null
          ? input.unitPriceUsd * input.quantity
          : null,
      isPurchased: input.isPurchased ?? false,
      createdAt: new Date().toISOString(),
    };

    set({ error: null });

    set((state) => {
      if (!state.activeList) return state;
      const updatedItems = [...state.activeList.items, newItem];
      const totals = recalculateTotals(
        updatedItems,
        state.activeList.ivaEnabled,
        state.activeList.exchangeRateSnapshot,
      );
      const updatedList: ShoppingList = {
        ...state.activeList,
        items: updatedItems,
        subtotalLocal: totals.subtotalLocal,
        ivaLocal: totals.ivaLocal,
        totalLocal: totals.totalLocal,
        totalUsd: totals.totalUsd,
      };
      return {
        activeList: updatedList,
        lists: state.lists.map((l) =>
          l.id === updatedList.id ? updatedList : l,
        ),
      };
    });

    get().persistListsCache();

    if (shouldSyncToApi(activeList.id)) {
      schedulePatchFromState(activeList.id, set, get);
    }
  },

  updateItem: async (itemId, data) => {
    const { activeList } = get();
    if (!activeList) return;

    set({ error: null });

    set((state) => {
      if (!state.activeList) return state;
      const rate = state.activeList.exchangeRateSnapshot;

      const updatedItems = state.activeList.items.map((item) => {
        if (item.id !== itemId) return item;
        const updated: ShoppingItem = {
          ...item,
          productName: data.productName ?? item.productName,
          unitPriceLocal: data.unitPriceLocal ?? item.unitPriceLocal,
          quantity: data.quantity ?? item.quantity,
          category: data.category ?? item.category,
        };
        updated.totalLocal = updated.unitPriceLocal * updated.quantity;
        if (rate && rate > 0) {
          updated.unitPriceUsd = updated.unitPriceLocal / rate;
          updated.totalUsd = updated.totalLocal / rate;
        }
        return updated;
      });

      const totals = recalculateTotals(
        updatedItems,
        state.activeList.ivaEnabled,
        rate,
      );
      const updatedList: ShoppingList = {
        ...state.activeList,
        items: updatedItems,
        subtotalLocal: totals.subtotalLocal,
        ivaLocal: totals.ivaLocal,
        totalLocal: totals.totalLocal,
        totalUsd: totals.totalUsd,
      };
      return {
        activeList: updatedList,
        lists: state.lists.map((l) =>
          l.id === updatedList.id ? updatedList : l,
        ),
      };
    });

    get().persistListsCache();

    if (shouldSyncToApi(activeList.id)) {
      schedulePatchFromState(activeList.id, set, get);
    }
  },

  updateItemQuantity: async (itemId, quantity) => {
    const { activeList } = get();
    if (!activeList || quantity < 1) return;

    set({ error: null });

    set((state) => {
      if (!state.activeList) return state;
      const rate = state.activeList.exchangeRateSnapshot;

      const updatedItems = state.activeList.items.map((item) => {
        if (item.id !== itemId) return item;
        const totalLocal = item.unitPriceLocal * quantity;
        const unitPriceUsd =
          rate && rate > 0 ? item.unitPriceLocal / rate : item.unitPriceUsd;
        const totalUsd = rate && rate > 0 ? totalLocal / rate : item.totalUsd;
        return { ...item, quantity, totalLocal, unitPriceUsd, totalUsd };
      });

      const totals = recalculateTotals(
        updatedItems,
        state.activeList.ivaEnabled,
        rate,
      );
      const updatedList: ShoppingList = {
        ...state.activeList,
        items: updatedItems,
        subtotalLocal: totals.subtotalLocal,
        ivaLocal: totals.ivaLocal,
        totalLocal: totals.totalLocal,
        totalUsd: totals.totalUsd,
      };
      return {
        activeList: updatedList,
        lists: state.lists.map((l) =>
          l.id === updatedList.id ? updatedList : l,
        ),
      };
    });

    get().persistListsCache();

    if (shouldSyncToApi(activeList.id)) {
      schedulePatchFromState(activeList.id, set, get);
    }
  },

  removeItem: async (itemId) => {
    const { activeList } = get();
    if (!activeList) return;

    set({ error: null });

    set((state) => {
      if (!state.activeList) return state;
      const updatedItems = state.activeList.items.filter(
        (i) => i.id !== itemId,
      );
      const totals = recalculateTotals(
        updatedItems,
        state.activeList.ivaEnabled,
        state.activeList.exchangeRateSnapshot,
      );
      const updatedList: ShoppingList = {
        ...state.activeList,
        items: updatedItems,
        subtotalLocal: totals.subtotalLocal,
        ivaLocal: totals.ivaLocal,
        totalLocal: totals.totalLocal,
        totalUsd: totals.totalUsd,
      };
      return {
        activeList: updatedList,
        lists: state.lists.map((l) =>
          l.id === updatedList.id ? updatedList : l,
        ),
      };
    });

    get().persistListsCache();

    if (shouldSyncToApi(activeList.id)) {
      schedulePatchFromState(activeList.id, set, get);
    } else if (shouldPersistToStorage()) {
      get().persistGuestData();
    }
  },

  toggleItemPurchased: async (itemId) => {
    const { activeList } = get();
    if (!activeList) return;

    set({ error: null });

    set((state) => {
      if (!state.activeList) return state;
      const updatedItems = state.activeList.items.map((item) =>
        item.id === itemId ? { ...item, isPurchased: !item.isPurchased } : item,
      );
      const updatedList = { ...state.activeList, items: updatedItems };
      return {
        activeList: updatedList,
        lists: state.lists.map((l) =>
          l.id === updatedList.id ? updatedList : l,
        ),
      };
    });

    get().persistListsCache();

    if (shouldSyncToApi(activeList.id)) {
      schedulePatchFromState(activeList.id, set, get);
    }
  },

  setExchangeRate: (rate) => {
    set((state) => {
      if (!state.activeList) return state;
      const totals = recalculateTotals(
        state.activeList.items,
        state.activeList.ivaEnabled,
        rate,
      );
      const updatedList: ShoppingList = {
        ...state.activeList,
        exchangeRateSnapshot: rate,
        subtotalLocal: totals.subtotalLocal,
        ivaLocal: totals.ivaLocal,
        totalLocal: totals.totalLocal,
        totalUsd: totals.totalUsd,
      };
      return {
        activeList: updatedList,
        lists: state.lists.map((l) =>
          l.id === updatedList.id ? updatedList : l,
        ),
      };
    });
  },

  updateListSettings: async (data) => {
    const { activeList } = get();
    if (!activeList) return;

    set({ error: null });

    set((state) => {
      if (!state.activeList) return state;
      const ivaEnabled = data.ivaEnabled ?? state.activeList.ivaEnabled;
      const totals = recalculateTotals(
        state.activeList.items,
        ivaEnabled,
        state.activeList.exchangeRateSnapshot,
      );
      const updatedList: ShoppingList = {
        ...state.activeList,
        ...data,
        ivaEnabled,
        subtotalLocal: totals.subtotalLocal,
        ivaLocal: totals.ivaLocal,
        totalLocal: totals.totalLocal,
        totalUsd: totals.totalUsd,
      };
      return {
        activeList: updatedList,
        lists: state.lists.map((l) =>
          l.id === updatedList.id ? updatedList : l,
        ),
      };
    });

    if (shouldSyncToApi(activeList.id)) {
      try {
        const updated = await datasource.patchList(activeList.id, {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.storeName !== undefined && { storeName: data.storeName }),
          ...(data.ivaEnabled !== undefined && { ivaEnabled: data.ivaEnabled }),
          ...(data.listType !== undefined && { listType: data.listType }),
        });
        set((state) => ({
          activeList:
            state.activeList?.id === updated.id ? updated : state.activeList,
          lists: state.lists.map((l) => (l.id === updated.id ? updated : l)),
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'No se pudo actualizar la lista';
        set({ error: message });
      }
    } else if (shouldPersistToStorage()) {
      get().persistGuestData();
    }
  },

  saveList: async (name, storeName) => {
    const { activeList } = get();
    if (!activeList) return;

    try {
      set({ isLoading: true, error: null });

      // Un único POST con la lista + items embebidos (spec).
      const created = await datasource.createList({
        name,
        storeName: storeName || null,
        listType: activeList.listType,
        ivaEnabled: activeList.ivaEnabled,
        exchangeRateSnapshot: activeList.exchangeRateSnapshot,
        items: activeList.items.map(toCreateItemInput),
      });

      set((state) => {
        const withoutOldLocal = !isServerList(activeList.id)
          ? state.lists.filter((l) => l.id !== activeList.id)
          : state.lists;
        return {
          lists: [created, ...withoutOldLocal],
          activeList: created,
          isLoading: false,
        };
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo guardar la lista';
      set({ error: message, isLoading: false });
    }
  },

  deleteList: async (listId) => {
    const syncToApi = shouldSyncToApi(listId);
    cancelPendingPatch(listId);

    try {
      set({ error: null });

      if (syncToApi) {
        await datasource.deleteList(listId);
      }

      set((state) => ({
        lists: state.lists.filter((l) => l.id !== listId),
        activeList: state.activeList?.id === listId ? null : state.activeList,
        summaries: state.summaries.filter((s) => s.id !== listId),
      }));

      if (shouldPersistToStorage()) {
        get().persistGuestData();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo eliminar la lista';
      set({ error: message });
    }
  },

  completeList: async (listId) => {
    const syncToApi = shouldSyncToApi(listId);
    cancelPendingPatch(listId);

    try {
      set({ isLoading: true, error: null });

      if (syncToApi) {
        await datasource.patchList(listId, { isActive: false });
      }

      set((state) => ({
        lists: state.lists.filter((l) => l.id !== listId),
        activeList: state.activeList?.id === listId ? null : state.activeList,
        summaries: state.summaries.filter((s) => s.id !== listId),
        isLoading: false,
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo completar la lista';
      set({ error: message, isLoading: false });
    }
  },

  searchSummaries: async (filters, page = 1) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      set({
        summaries: [],
        summariesMeta: SUMMARIES_INITIAL_META,
        isLoadingSummaries: false,
      });
      return;
    }

    const activeFilters = filters ?? get().summariesFilters;

    try {
      set({
        isLoadingSummaries: true,
        error: null,
        summariesFilters: activeFilters,
      });
      const result = await datasource.searchLists({
        page,
        limit: get().summariesMeta.limit,
        filters: activeFilters,
      });
      set({
        summaries: result.data,
        summariesMeta: result.meta,
        isLoadingSummaries: false,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudieron cargar las listas';
      set({ error: message, isLoadingSummaries: false });
    }
  },

  loadMoreSummaries: async () => {
    const state = get();
    if (state.isLoadingMoreSummaries || state.isLoadingSummaries) return;
    if (state.summariesMeta.page >= state.summariesMeta.totalPages) return;

    set({ isLoadingMoreSummaries: true, error: null });
    try {
      const result = await datasource.searchLists({
        page: state.summariesMeta.page + 1,
        limit: state.summariesMeta.limit,
        filters: state.summariesFilters,
      });
      set((s) => ({
        summaries: [...s.summaries, ...result.data],
        summariesMeta: result.meta,
        isLoadingMoreSummaries: false,
      }));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar más listas';
      set({ error: message, isLoadingMoreSummaries: false });
    }
  },

  setSummariesFilters: (filters) => set({ summariesFilters: filters }),

  compareLists: async (listAId, listBId) => {
    return datasource.compareLists(listAId, listBId);
  },

  persistGuestData: () => {
    const { lists } = get();
    const localLists = lists.filter((l) => !isServerList(l.id));
    void secureStorage.setItem(GUEST_LISTS_KEY, JSON.stringify(localLists));
  },

  persistListsCache: () => {
    const { lists } = get();
    const { isAuthenticated } = useAuthStore.getState();

    const localLists = lists.filter((l) => !isServerList(l.id));
    void secureStorage.setItem(GUEST_LISTS_KEY, JSON.stringify(localLists));

    if (isAuthenticated) {
      const serverLists = lists.filter((l) => isServerList(l.id));
      void secureStorage.setItem(
        AUTH_LISTS_CACHE_KEY,
        JSON.stringify(serverLists),
      );
    }
  },

  flushPendingItemSyncs: async () => {
    await flushAllPendingPatches(
      (listId) => buildPatchPayloadFromActive(listId, get),
      (updated) =>
        set((state) => ({
          activeList:
            state.activeList?.id === updated.id ? updated : state.activeList,
          lists: state.lists.map((l) => (l.id === updated.id ? updated : l)),
        })),
      (msg) => set({ error: msg }),
    );
  },

  hydrateGuestData: async () => {
    try {
      const raw = await secureStorage.getItem(GUEST_LISTS_KEY);
      if (!raw) return;

      const storedLists = JSON.parse(raw) as ShoppingList[];
      if (storedLists.length === 0) return;

      set((state) => {
        const storedIds = new Set(storedLists.map((l) => l.id));
        const existing = state.lists.filter((l) => !storedIds.has(l.id));
        return { lists: [...storedLists, ...existing] };
      });
    } catch {
      await secureStorage.removeItem(GUEST_LISTS_KEY);
    }
  },

  syncGuestData: async () => {
    const { lists } = get();
    const guestLists = lists.filter(
      (l) => l.id.startsWith('local-') && l.items.length > 0,
    );

    if (guestLists.length === 0) return;

    try {
      set({ isLoading: true, error: null });

      const syncedLocalIds = new Set<string>();

      for (const guestList of guestLists) {
        // Spec: un único POST con items embebidos.
        await datasource.createList({
          name: guestList.name,
          storeName: guestList.storeName,
          listType: guestList.listType,
          ivaEnabled: guestList.ivaEnabled,
          exchangeRateSnapshot: guestList.exchangeRateSnapshot,
          items: guestList.items.map(toCreateItemInput),
        });
        syncedLocalIds.add(guestList.id);
      }

      await secureStorage.removeItem(GUEST_LISTS_KEY);
      const page = await datasource.searchLists({
        page: 1,
        limit: SEARCH_DEFAULT_LIMIT,
        filters: { isActive: true },
      });
      const serverLists = page.data.map(summaryToStubList);

      set((state) => {
        const remainingLocal = state.lists.filter(
          (l) => l.id.startsWith('local-') && !syncedLocalIds.has(l.id),
        );
        const mergedLists = [...remainingLocal, ...serverLists];

        let newActiveList = state.activeList;
        if (state.activeList && syncedLocalIds.has(state.activeList.id)) {
          newActiveList = serverLists[0] ?? remainingLocal[0] ?? null;
        } else if (state.activeList) {
          newActiveList =
            mergedLists.find((l) => l.id === state.activeList!.id) ??
            mergedLists[0] ??
            null;
        }

        return {
          lists: mergedLists,
          summaries: page.data,
          summariesMeta: page.meta,
          activeList: newActiveList,
          isLoading: false,
        };
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudieron sincronizar las listas';
      set({ error: message, isLoading: false });
    }
  },

  resetStore: () => {
    pendingListPatches.forEach((p) => clearTimeout(p.timeout));
    pendingListPatches.clear();
    set({
      lists: [],
      activeList: createDefaultList(),
      isLoading: false,
      error: null,
      summaries: [],
      summariesMeta: SUMMARIES_INITIAL_META,
      summariesFilters: {},
      isLoadingSummaries: false,
      isLoadingMoreSummaries: false,
    });
  },
}));

// ─── Helpers fuera del closure (acceden via getState) ─────────────────────

function summaryToStubList(s: ShoppingListSummary): ShoppingList {
  const country = useCountryStore.getState().country;
  return {
    id: s.id,
    userId: null,
    name: s.name,
    storeName: s.storeName,
    status: s.isActive ? 'active' : 'completed',
    listType: s.listType,
    countryCode: country.code,
    currencyCode: s.currencyCode,
    ivaEnabled: false,
    exchangeRateSnapshot: null,
    scheduledDate: s.scheduledDate,
    latitude: null,
    longitude: null,
    subtotalLocal: s.totalLocal,
    subtotalUsd: s.totalUsd,
    ivaLocal: 0,
    ivaUsd: null,
    totalLocal: s.totalLocal,
    totalUsd: s.totalUsd,
    items: [],
    createdAt: new Date().toISOString(),
    completedAt: s.isActive ? null : new Date().toISOString(),
  };
}

function buildPatchPayloadFromActive(
  listId: string,
  getState: () => ShoppingListState,
): UpdateShoppingListInput | null {
  const state = getState();
  const list = state.activeList?.id === listId
    ? state.activeList
    : state.lists.find((l) => l.id === listId);
  if (!list) return null;
  return {
    items: list.items.map(toCreateItemInput),
  };
}

function schedulePatchFromState(
  listId: string,
  setState: (
    partial:
      | Partial<ShoppingListState>
      | ((s: ShoppingListState) => Partial<ShoppingListState>),
  ) => void,
  getState: () => ShoppingListState,
): void {
  scheduleListPatch(
    listId,
    (msg) => setState({ error: msg }),
    () => buildPatchPayloadFromActive(listId, getState),
    (updated) =>
      setState((state) => ({
        activeList:
          state.activeList?.id === updated.id ? updated : state.activeList,
        lists: state.lists.map((l) => (l.id === updated.id ? updated : l)),
      })),
  );
}
