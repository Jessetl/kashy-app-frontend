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
  CreateShoppingListInput,
  ShoppingItem,
  ShoppingList,
  ShoppingListType,
  UpdateShoppingListInput,
} from '../../domain/entities/shopping-list.entity';
import { ShoppingListDatasource } from '../../infrastructure/datasources/shopping-list.datasource';

const GUEST_LISTS_KEY = 'guest-shopping-lists';
const AUTH_LISTS_CACHE_KEY = 'auth-shopping-lists-cache';
const AUTH_OFFLINE_QUEUE_KEY = 'auth-shopping-offline-queue';
const DEFAULT_DRAFT_NAME = 'Nueva plantilla';
const SELECTION_MAX = 2;
const datasource = new ShoppingListDatasource();

// ─── Sync queue (auth offline) ────────────────────────────────────────────

/**
 * Acciones encoladas cuando `isAuthenticated && !isOnline`. Se ejecutan en
 * orden al reconectar (Flow 12). CREATE necesita `payload` con el shape de
 * `CreateShoppingListInput`; PATCH lo necesita con `UpdateShoppingListInput`;
 * DELETE solo precisa `listId`.
 */
export type SyncActionType = 'CREATE' | 'PATCH' | 'DELETE';

export interface SyncAction {
  actionId: string;
  type: SyncActionType;
  /** Para CREATE puede ser `local-*` y se reemplaza por el UUID resultante. */
  listId: string;
  payload?: CreateShoppingListInput | UpdateShoppingListInput;
  createdAt: string;
  /** Mensaje del último intento fallido. */
  error?: string;
}

const generateActionId = (): string =>
  `sync-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

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

    // Solo se llega aquí para listas con id server (auth + isServerList).
    // Si el store está offline al disparar el timer → encolar PATCH (dedupe).
    const store = useShoppingStore.getState();
    if (!store.isOnline) {
      const filtered = store.syncQueue.filter(
        (a) => !(a.listId === listId && a.type === 'PATCH'),
      );
      useShoppingStore.setState({ syncQueue: filtered });
      store.enqueueSync({
        actionId: generateActionId(),
        type: 'PATCH',
        listId,
        payload,
        createdAt: new Date().toISOString(),
      });
      return;
    }

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

  // Multi-select para comparar (Flow 13) — solo cards COMPLETED.
  selectionMode: boolean;
  selectedIds: string[];

  // Conectividad y queue offline (Flow 12).
  isOnline: boolean;
  syncQueue: SyncAction[];

  // Actions — list-level
  setActiveList: (list: ShoppingList | null) => void;
  createList: (name: string, storeName?: string) => Promise<void>;
  /** Crea una lista en memoria solamente (activeList). NO la agrega a lists ni persiste. */
  createDraft: (name?: string) => void;
  /** Promueve el draft activo: guest → push lists + persist; auth → POST server. */
  commitDraft: (input: { name: string; storeName?: string }) => Promise<void>;
  /** Descarta el draft activo si está vacío (sin items y con nombre default). */
  discardActiveDraftIfEmpty: () => void;
  /** Descarta el draft activo sin importar si tiene items o nombre custom. */
  discardActiveDraft: () => void;
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
  hydrateAuthCache: () => Promise<void>;
  flushPendingItemSyncs: () => Promise<void>;
  clearError: () => void;
  resetStore: () => void;

  // Selection mode (multi-select compare)
  enterSelectionMode: (id: string) => void;
  toggleSelected: (id: string) => void;
  exitSelectionMode: () => void;

  // Conectividad + offline queue
  setOnline: (online: boolean) => void;
  enqueueSync: (action: SyncAction) => void;
  cancelSyncForList: (listId: string) => void;
  flushPendingSyncQueue: () => Promise<void>;
  hydrateSyncQueue: () => Promise<void>;
  persistSyncQueue: () => void;
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

  selectionMode: false,
  selectedIds: [],

  isOnline: true,
  syncQueue: [],

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

  createDraft: (name = DEFAULT_DRAFT_NAME) => {
    // Draft: solo en activeList. NO se agrega a lists, NO se persiste.
    // Se promueve via commitDraft o se descarta via discardActiveDraftIfEmpty.
    const newList: ShoppingList = {
      ...createDefaultList(),
      name,
    };
    set({ activeList: newList, error: null });
  },

  commitDraft: async ({ name, storeName }) => {
    const { activeList, lists } = get();
    if (!activeList) return;

    const isDraft = !lists.some((l) => l.id === activeList.id);

    if (!isDraft) {
      // Ya está en lists — solo renombrar/actualizar.
      await get().updateListSettings({
        name,
        storeName: storeName ?? '',
      });
      return;
    }

    const { isAuthenticated } = useAuthStore.getState();

    if (isAuthenticated) {
      // Promover a server: reusa saveList que hace POST con items embebidos.
      await get().saveList(name, storeName ?? '');
      return;
    }

    // Guest: push a lists + persist.
    const namedList: ShoppingList = {
      ...activeList,
      name,
      storeName: storeName ?? null,
    };
    set((state) => ({
      lists: [namedList, ...state.lists],
      activeList: namedList,
    }));
    get().persistGuestData();
  },

  discardActiveDraftIfEmpty: () => {
    const { activeList, lists } = get();
    if (!activeList) return;
    const isDraft = !lists.some((l) => l.id === activeList.id);
    if (!isDraft) return;
    if (activeList.items.length > 0) return;
    if (activeList.name !== DEFAULT_DRAFT_NAME) return;
    cancelPendingPatch(activeList.id);
    set({ activeList: null });
  },

  discardActiveDraft: () => {
    const { activeList, lists } = get();
    if (!activeList) return;
    const isDraft = !lists.some((l) => l.id === activeList.id);
    if (!isDraft) return;
    cancelPendingPatch(activeList.id);
    set({ activeList: null });
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

    const { isAuthenticated } = useAuthStore.getState();
    const { isOnline } = get();

    try {
      set({ isLoading: true, error: null });

      // Auth offline: optimistic local + encolar CREATE para el primer flush.
      // Conservamos el `local-*` id; al flush, datasource devuelve UUID y
      // `flushPendingSyncQueue` reemplaza el id en lists/activeList.
      if (isAuthenticated && !isOnline) {
        const namedList: ShoppingList = {
          ...activeList,
          name,
          storeName: storeName || null,
        };

        set((state) => {
          const withoutOld = state.lists.filter((l) => l.id !== activeList.id);
          return {
            lists: [namedList, ...withoutOld],
            activeList: namedList,
            isLoading: false,
          };
        });

        get().enqueueSync({
          actionId: generateActionId(),
          type: 'CREATE',
          listId: namedList.id,
          payload: {
            name,
            storeName: storeName || null,
            listType: namedList.listType,
            ivaEnabled: namedList.ivaEnabled,
            exchangeRateSnapshot: namedList.exchangeRateSnapshot,
            items: namedList.items.map(toCreateItemInput),
          },
          createdAt: new Date().toISOString(),
        });
        get().persistListsCache();
        return;
      }

      // Online: un único POST con la lista + items embebidos (spec).
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
    cancelPendingPatch(listId);

    const { isAuthenticated } = useAuthStore.getState();
    const { isOnline } = get();
    const isServer = isServerList(listId);

    const optimisticRemove = () => {
      set((state) => ({
        lists: state.lists.filter((l) => l.id !== listId),
        activeList: state.activeList?.id === listId ? null : state.activeList,
        summaries: state.summaries.filter((s) => s.id !== listId),
      }));
    };

    try {
      set({ error: null });

      // Guest / `local-*` no sincronizado: solo local.
      if (!isAuthenticated || !isServer) {
        if (isAuthenticated && !isServer) {
          // Auth con `local-*`: cancelar CREATE pendiente para que no se materialice.
          get().cancelSyncForList(listId);
        }
        optimisticRemove();
        if (shouldPersistToStorage()) {
          get().persistGuestData();
        } else if (isAuthenticated) {
          get().persistListsCache();
        }
        return;
      }

      // Auth + lista del server.
      if (!isOnline) {
        // Offline: optimistic + encolar DELETE; descartar PATCH pendiente del queue
        // para esa lista (la borraremos, los PATCH no aplican).
        optimisticRemove();
        set((state) => ({
          syncQueue: state.syncQueue.filter(
            (a) => !(a.listId === listId && a.type === 'PATCH'),
          ),
        }));
        get().enqueueSync({
          actionId: generateActionId(),
          type: 'DELETE',
          listId,
          createdAt: new Date().toISOString(),
        });
        get().persistListsCache();
        return;
      }

      await datasource.deleteList(listId);
      optimisticRemove();
      get().persistListsCache();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo eliminar la lista';
      set({ error: message });
    }
  },

  completeList: async (listId) => {
    const { isAuthenticated } = useAuthStore.getState();
    const { isOnline } = get();
    const isServer = isServerList(listId);
    cancelPendingPatch(listId);

    const applyLocal = (l: ShoppingList): ShoppingList => ({
      ...l,
      listType: 'COMPLETED',
      status: 'completed',
      completedAt: new Date().toISOString(),
    });

    try {
      set({ isLoading: true, error: null });

      // Auth online: PATCH (infra serializa COMPLETED → RECEIPT + isActive=false).
      if (isAuthenticated && isServer && isOnline) {
        const updated = await datasource.patchList(listId, {
          listType: 'COMPLETED',
        });
        set((state) => ({
          lists: state.lists.map((l) => (l.id === updated.id ? updated : l)),
          activeList:
            state.activeList?.id === updated.id ? updated : state.activeList,
          isLoading: false,
        }));
        get().persistListsCache();
        return;
      }

      // Auth offline: optimistic local + encolar PATCH.
      if (isAuthenticated && isServer && !isOnline) {
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId ? applyLocal(l) : l,
          ),
          activeList:
            state.activeList && state.activeList.id === listId
              ? applyLocal(state.activeList)
              : state.activeList,
          isLoading: false,
        }));
        get().enqueueSync({
          actionId: generateActionId(),
          type: 'PATCH',
          listId,
          payload: { listType: 'COMPLETED' },
          createdAt: new Date().toISOString(),
        });
        get().persistListsCache();
        return;
      }

      // Guest o `local-*`: solo local.
      set((state) => ({
        lists: state.lists.map((l) => (l.id === listId ? applyLocal(l) : l)),
        activeList:
          state.activeList && state.activeList.id === listId
            ? applyLocal(state.activeList)
            : state.activeList,
        isLoading: false,
      }));
      if (shouldPersistToStorage()) {
        get().persistGuestData();
      }
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

  /**
   * Flow 1 (auth offline): restaura el snapshot persistido en
   * `AUTH_LISTS_CACHE_KEY` para mostrar el último estado conocido sin red.
   * Merge no destructivo: las listas en memoria no presentes en cache se
   * conservan (drafts locales, mutaciones optimistas).
   */
  hydrateAuthCache: async () => {
    try {
      const raw = await secureStorage.getItem(AUTH_LISTS_CACHE_KEY);
      if (!raw) return;

      const cached = JSON.parse(raw) as ShoppingList[];
      if (cached.length === 0) return;

      set((state) => {
        const cachedIds = new Set(cached.map((l) => l.id));
        const existing = state.lists.filter((l) => !cachedIds.has(l.id));
        const merged = [...cached, ...existing];
        const summaries = merged.map((l) => ({
          id: l.id,
          name: l.name,
          storeName: l.storeName,
          listType: l.listType,
          currencyCode: l.currencyCode,
          isActive: l.status === 'active',
          scheduledDate: l.scheduledDate,
          itemsCount: l.items.length,
          checkedCount: l.items.filter((i) => i.isPurchased).length,
          totalLocal: l.totalLocal,
          totalUsd: l.totalUsd,
        }));
        return { lists: merged, summaries };
      });
    } catch {
      await secureStorage.removeItem(AUTH_LISTS_CACHE_KEY);
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

  // ─── Multi-select para comparar (Flow 13) ────────────────────────────────

  enterSelectionMode: (id) => {
    set({ selectionMode: true, selectedIds: [id] });
  },

  toggleSelected: (id) => {
    set((state) => {
      const isSelected = state.selectedIds.includes(id);
      if (isSelected) {
        const next = state.selectedIds.filter((s) => s !== id);
        // Si queda vacío, salir del modo selección.
        if (next.length === 0) return { selectionMode: false, selectedIds: [] };
        return { selectedIds: next };
      }
      // Cap a SELECTION_MAX (2). 3ra selección se rechaza silenciosamente.
      if (state.selectedIds.length >= SELECTION_MAX) return state;
      return { selectedIds: [...state.selectedIds, id] };
    });
  },

  exitSelectionMode: () => {
    set({ selectionMode: false, selectedIds: [] });
  },

  // ─── Conectividad + queue offline (Flow 12) ──────────────────────────────

  setOnline: (online) => {
    const prev = get().isOnline;
    set({ isOnline: online });
    // Reconexión: dispara flush si hay queue y estamos auth.
    const { isAuthenticated } = useAuthStore.getState();
    if (!prev && online && isAuthenticated && get().syncQueue.length > 0) {
      void get().flushPendingSyncQueue();
    }
  },

  enqueueSync: (action) => {
    set((state) => ({ syncQueue: [...state.syncQueue, action] }));
    get().persistSyncQueue();
  },

  cancelSyncForList: (listId) => {
    set((state) => ({
      syncQueue: state.syncQueue.filter((a) => a.listId !== listId),
    }));
    get().persistSyncQueue();
  },

  flushPendingSyncQueue: async () => {
    const { syncQueue } = get();
    if (syncQueue.length === 0) return;

    const remaining: SyncAction[] = [];
    for (const action of syncQueue) {
      try {
        if (action.type === 'DELETE') {
          await datasource.deleteList(action.listId);
        } else if (action.type === 'PATCH' && action.payload) {
          const updated = await datasource.patchList(
            action.listId,
            action.payload as UpdateShoppingListInput,
          );
          set((state) => ({
            lists: state.lists.map((l) =>
              l.id === updated.id ? updated : l,
            ),
            activeList:
              state.activeList?.id === updated.id ? updated : state.activeList,
          }));
        } else if (action.type === 'CREATE') {
          // Rebuild del payload desde el estado actual: ediciones offline
          // post-saveList (items agregados/borrados) deben incluirse.
          // Fallback al payload guardado si la lista local ya no existe (raro).
          const currentList = get().lists.find((l) => l.id === action.listId);
          const payload: CreateShoppingListInput | undefined = currentList
            ? {
                name: currentList.name,
                storeName: currentList.storeName,
                listType: currentList.listType,
                ivaEnabled: currentList.ivaEnabled,
                exchangeRateSnapshot: currentList.exchangeRateSnapshot,
                items: currentList.items.map(toCreateItemInput),
              }
            : (action.payload as CreateShoppingListInput | undefined);

          if (!payload) {
            // Sin estado ni payload → descartar silenciosamente.
            continue;
          }

          const created = await datasource.createList(payload);
          // Reemplaza el `local-*` por el UUID del server en state.
          set((state) => ({
            lists: state.lists.map((l) =>
              l.id === action.listId ? created : l,
            ),
            activeList:
              state.activeList?.id === action.listId
                ? created
                : state.activeList,
          }));
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'No se pudo sincronizar una acción';
        remaining.push({ ...action, error: message });
      }
    }

    set({ syncQueue: remaining });
    void secureStorage.setItem(
      AUTH_OFFLINE_QUEUE_KEY,
      JSON.stringify(remaining),
    );
  },

  hydrateSyncQueue: async () => {
    try {
      const raw = await secureStorage.getItem(AUTH_OFFLINE_QUEUE_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw) as SyncAction[];
      if (!Array.isArray(stored) || stored.length === 0) return;
      set({ syncQueue: stored });
    } catch {
      await secureStorage.removeItem(AUTH_OFFLINE_QUEUE_KEY);
    }
  },

  persistSyncQueue: () => {
    const { syncQueue } = get();
    void secureStorage.setItem(
      AUTH_OFFLINE_QUEUE_KEY,
      JSON.stringify(syncQueue),
    );
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
      selectionMode: false,
      selectedIds: [],
      syncQueue: [],
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
