import { useAuthStore } from '@/shared/infrastructure/auth/auth.store';
import { secureStorage } from '@/shared/infrastructure/storage/app-storage';
import { create } from 'zustand';
import type {
  CreateShoppingItemInput,
  ShoppingItem,
  ShoppingList,
} from '../../domain/entities/shopping-list.entity';
import { ShoppingListDatasource } from '../datasources/shopping-list.datasource';

const GUEST_LISTS_KEY = 'guest-shopping-lists';
const AUTH_LISTS_CACHE_KEY = 'auth-shopping-lists-cache';
const datasource = new ShoppingListDatasource();

const ITEM_SYNC_DEBOUNCE_MS = 600;
const TOGGLE_SYNC_DEBOUNCE_MS = 400;

type PendingItemSync = {
  timeout: ReturnType<typeof setTimeout>;
  listId: string;
  data: Partial<CreateShoppingItemInput>;
};

const pendingItemSyncs = new Map<string, PendingItemSync>();
const pendingToggleSyncs = new Map<
  string,
  { timeout: ReturnType<typeof setTimeout>; listId: string }
>();

const scheduleItemApiSync = (
  listId: string,
  itemId: string,
  data: Partial<CreateShoppingItemInput>,
  onError: (msg: string) => void,
): void => {
  const existing = pendingItemSyncs.get(itemId);
  const mergedData: Partial<CreateShoppingItemInput> = existing
    ? { ...existing.data, ...data }
    : { ...data };

  if (existing) {
    clearTimeout(existing.timeout);
  }

  const timeout = setTimeout(() => {
    const pending = pendingItemSyncs.get(itemId);
    pendingItemSyncs.delete(itemId);
    const payload = pending?.data ?? mergedData;
    void datasource.updateItem(listId, itemId, payload).catch((err) => {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudo sincronizar el producto';
      onError(message);
    });
  }, ITEM_SYNC_DEBOUNCE_MS);

  pendingItemSyncs.set(itemId, { timeout, listId, data: mergedData });
};

/**
 * Schedules a toggle sync. If there's already a pending toggle for this item,
 * we cancel it (user toggled back — net effect is no change on the server).
 */
const scheduleToggleApiSync = (
  listId: string,
  itemId: string,
  onError: (msg: string) => void,
): void => {
  const existing = pendingToggleSyncs.get(itemId);
  if (existing) {
    clearTimeout(existing.timeout);
    pendingToggleSyncs.delete(itemId);
    return;
  }

  const timeout = setTimeout(() => {
    pendingToggleSyncs.delete(itemId);
    void datasource.toggleItemPurchased(listId, itemId).catch((err) => {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudo actualizar el producto';
      onError(message);
    });
  }, TOGGLE_SYNC_DEBOUNCE_MS);

  pendingToggleSyncs.set(itemId, { timeout, listId });
};

const flushPendingSyncs = async (
  onError: (msg: string) => void,
): Promise<void> => {
  const itemEntries = Array.from(pendingItemSyncs.entries());
  const toggleEntries = Array.from(pendingToggleSyncs.entries());

  itemEntries.forEach(([, pending]) => clearTimeout(pending.timeout));
  toggleEntries.forEach(([, pending]) => clearTimeout(pending.timeout));
  pendingItemSyncs.clear();
  pendingToggleSyncs.clear();

  const tasks: Promise<unknown>[] = [];

  for (const [itemId, pending] of itemEntries) {
    tasks.push(
      datasource
        .updateItem(pending.listId, itemId, pending.data)
        .catch((err) => {
          const message =
            err instanceof Error
              ? err.message
              : 'No se pudo sincronizar el producto';
          onError(message);
        }),
    );
  }

  for (const [itemId, pending] of toggleEntries) {
    tasks.push(
      datasource.toggleItemPurchased(pending.listId, itemId).catch((err) => {
        const message =
          err instanceof Error
            ? err.message
            : 'No se pudo actualizar el producto';
        onError(message);
      }),
    );
  }

  await Promise.all(tasks);
};

const generateId = (): string => {
  return `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/** True when the list lives on the server (not a local working list) */
const isServerList = (listId: string): boolean => {
  return !listId.startsWith('local-');
};

/** True when changes to this list should be synced to the backend */
const shouldSyncToApi = (listId: string): boolean => {
  const { isAuthenticated } = useAuthStore.getState();
  return isAuthenticated && isServerList(listId);
};

/** True when changes should be persisted to guest storage */
const shouldPersistToStorage = (): boolean => {
  return !useAuthStore.getState().isAuthenticated;
};

interface ShoppingListState {
  lists: ShoppingList[];
  activeList: ShoppingList | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setActiveList: (list: ShoppingList | null) => void;
  createList: (name: string, storeName?: string) => Promise<void>;
  loadLists: () => Promise<void>;
  addItem: (input: CreateShoppingItemInput) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  updateItem: (
    itemId: string,
    data: Partial<CreateShoppingItemInput>,
  ) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  toggleItemPurchased: (itemId: string) => Promise<void>;
  setExchangeRate: (rate: number) => void;
  updateListSettings: (data: {
    ivaEnabled?: boolean;
    name?: string;
    storeName?: string;
  }) => Promise<void>;
  saveList: (name: string, storeName: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  completeList: (listId: string) => Promise<void>;
  syncGuestData: () => Promise<void>;
  persistGuestData: () => void;
  persistListsCache: () => void;
  hydrateGuestData: () => Promise<void>;
  flushPendingItemSyncs: () => Promise<void>;
  clearError: () => void;
  resetStore: () => void;
}

const recalculateTotals = (
  items: ShoppingItem[],
  ivaEnabled: boolean,
  rate: number | null,
): { totalLocal: number; totalUsd: number } => {
  const subtotalLocal = items.reduce((sum, item) => sum + item.totalLocal, 0);
  const totalLocal = ivaEnabled ? subtotalLocal * 1.16 : subtotalLocal;
  const totalUsd = rate && rate > 0 ? totalLocal / rate : 0;
  return { totalLocal, totalUsd };
};

const createDefaultList = (): ShoppingList => ({
  id: generateId(),
  userId: null,
  name: 'Nueva Lista',
  storeName: null,
  status: 'active',
  ivaEnabled: false,
  totalLocal: 0,
  totalUsd: 0,
  exchangeRateSnapshot: null,
  items: [],
  createdAt: new Date().toISOString(),
  completedAt: null,
});

export const useShoppingListStore = create<ShoppingListState>()((set, get) => ({
  lists: [],
  activeList: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  setActiveList: (list) => set({ activeList: list }),

  createList: async (name, storeName) => {
    // Always create locally — the list only goes to BD when the user
    // explicitly saves via Bookmark (saveList action).
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
        const serverLists = await datasource.getActiveLists();
        // Preserve local working lists — they haven't been saved yet
        set((state) => {
          const localLists = state.lists.filter((l) => !isServerList(l.id));
          return {
            lists: [...localLists, ...serverLists],
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
    if (!activeList) {
      return;
    }

    const syncToApi = shouldSyncToApi(activeList.id);

    try {
      set({ error: null });

      if (syncToApi) {
        // Server list — sync item to BD
        const item = await datasource.addItem(activeList.id, input);

        set((state) => {
          if (!state.activeList) {
            return state;
          }

          const updatedItems = [...state.activeList.items, ...item];

          const totals = recalculateTotals(
            updatedItems,
            state.activeList.ivaEnabled,
            state.activeList.exchangeRateSnapshot,
          );

          const updatedList = {
            ...state.activeList,
            items: updatedItems,
            ...totals,
          };

          return {
            activeList: updatedList,
            lists: state.lists.map((l) =>
              l.id === updatedList.id ? updatedList : l,
            ),
          };
        });

        get().persistListsCache();
      } else {
        // Local list (guest or auth working list) — state only
        const newItem: ShoppingItem = {
          id: generateId(),
          listId: activeList.id,
          productName: input.productName,
          unitPriceLocal: input.unitPriceLocal,
          quantity: input.quantity,
          totalLocal: input.unitPriceLocal * input.quantity,
          unitPriceUsd: null,
          totalUsd: null,
          isPurchased: false,
          category: input.category,
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          if (!state.activeList) {
            return state;
          }
          const updatedItems = [...state.activeList.items, newItem];
          const totals = recalculateTotals(
            updatedItems,
            state.activeList.ivaEnabled,
            state.activeList.exchangeRateSnapshot,
          );
          const updatedList = {
            ...state.activeList,
            items: updatedItems,
            ...totals,
          };
          return {
            activeList: updatedList,
            lists: state.lists.map((l) =>
              l.id === updatedList.id ? updatedList : l,
            ),
          };
        });

        if (shouldPersistToStorage()) {
          get().persistGuestData();
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo agregar el producto';
      set({ error: message });
    }
  },

  updateItemQuantity: async (itemId, quantity) => {
    const { activeList } = get();
    if (!activeList || quantity < 1) {
      return;
    }

    set({ error: null });

    // 1. Optimistic UI update — state first so the component re-renders instantly.
    set((state) => {
      if (!state.activeList) {
        return state;
      }

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
        state.activeList.exchangeRateSnapshot,
      );

      const updatedList = {
        ...state.activeList,
        items: updatedItems,
        ...totals,
      };

      return {
        activeList: updatedList,
        lists: state.lists.map((l) =>
          l.id === updatedList.id ? updatedList : l,
        ),
      };
    });

    // 2. Persist to storage (guest lists + authenticated cache).
    get().persistListsCache();

    // 3. Debounce the API sync so rapid +/- clicks batch into one request
    //    with the final quantity.
    if (shouldSyncToApi(activeList.id)) {
      scheduleItemApiSync(activeList.id, itemId, { quantity }, (msg) =>
        set({ error: msg }),
      );
    }
  },

  updateItem: async (itemId, data) => {
    const { activeList } = get();
    if (!activeList) {
      return;
    }

    set({ error: null });

    // 1. Optimistic UI update first.
    set((state) => {
      if (!state.activeList) {
        return state;
      }

      const rate = state.activeList.exchangeRateSnapshot;

      const updatedItems = state.activeList.items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const updated = {
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
        state.activeList.exchangeRateSnapshot,
      );

      const updatedList = {
        ...state.activeList,
        items: updatedItems,
        ...totals,
      };

      return {
        activeList: updatedList,
        lists: state.lists.map((l) =>
          l.id === updatedList.id ? updatedList : l,
        ),
      };
    });

    // 2. Persist to storage.
    get().persistListsCache();

    // 3. Debounce the API sync so rapid edits to price/name/qty coalesce.
    if (shouldSyncToApi(activeList.id)) {
      scheduleItemApiSync(activeList.id, itemId, data, (msg) =>
        set({ error: msg }),
      );
    }
  },

  removeItem: async (itemId) => {
    const { activeList } = get();
    if (!activeList) {
      return;
    }

    const syncToApi = shouldSyncToApi(activeList.id);

    // Cancel any pending debounced syncs for this item — no point trying to
    // update an item that's about to be deleted on the server.
    const pendingItem = pendingItemSyncs.get(itemId);
    if (pendingItem) {
      clearTimeout(pendingItem.timeout);
      pendingItemSyncs.delete(itemId);
    }
    const pendingToggle = pendingToggleSyncs.get(itemId);
    if (pendingToggle) {
      clearTimeout(pendingToggle.timeout);
      pendingToggleSyncs.delete(itemId);
    }

    try {
      set({ error: null });

      if (syncToApi) {
        await datasource.deleteItem(activeList.id, itemId);
      }

      set((state) => {
        if (!state.activeList) {
          return state;
        }

        const updatedItems = state.activeList.items.filter(
          (i) => i.id !== itemId,
        );

        const totals = recalculateTotals(
          updatedItems,
          state.activeList.ivaEnabled,
          state.activeList.exchangeRateSnapshot,
        );

        const updatedList = {
          ...state.activeList,
          items: updatedItems,
          ...totals,
        };

        return {
          activeList: updatedList,
          lists: state.lists.map((l) =>
            l.id === updatedList.id ? updatedList : l,
          ),
        };
      });

      if (shouldPersistToStorage()) {
        get().persistGuestData();
      }
    } catch (err) {
      let message = 'No se pudo eliminar el producto';
      if (err instanceof Error) {
        message = err.message;
      }
      set({ error: message });
    }
  },

  toggleItemPurchased: async (itemId) => {
    const { activeList } = get();
    if (!activeList) return;

    set({ error: null });

    // 1. Optimistic UI update first.
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

    // 2. Persist to storage.
    get().persistListsCache();

    // 3. Debounced toggle sync — rapid toggles cancel each other.
    if (shouldSyncToApi(activeList.id)) {
      scheduleToggleApiSync(activeList.id, itemId, (msg) =>
        set({ error: msg }),
      );
    }
  },

  setExchangeRate: (rate) => {
    set((state) => {
      if (!state.activeList) {
        return state;
      }

      const totals = recalculateTotals(
        state.activeList.items,
        state.activeList.ivaEnabled,
        rate,
      );

      const updatedList = {
        ...state.activeList,
        exchangeRateSnapshot: rate,
        ...totals,
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
    if (!activeList) {
      return;
    }

    const syncToApi = shouldSyncToApi(activeList.id);

    try {
      set({ error: null });

      if (syncToApi) {
        await datasource.updateList(activeList.id, data);
      }

      set((state) => {
        if (!state.activeList) {
          return state;
        }

        const ivaEnabled = data.ivaEnabled ?? state.activeList.ivaEnabled;
        const totals = recalculateTotals(
          state.activeList.items,
          ivaEnabled,
          state.activeList.exchangeRateSnapshot,
        );

        const updatedList = {
          ...state.activeList,
          ...data,
          ivaEnabled,
          ...totals,
        };

        return {
          activeList: updatedList,
          lists: state.lists.map((l) =>
            l.id === updatedList.id ? updatedList : l,
          ),
        };
      });

      if (shouldPersistToStorage()) {
        get().persistGuestData();
      }
    } catch (err) {
      let message = 'No se pudo actualizar la lista';
      if (err instanceof Error) {
        message = err.message;
      }
      set({ error: message });
    }
  },

  saveList: async (name, storeName) => {
    // This action is only called when authenticated (screen validates auth).
    // It always creates a NEW list on the server regardless of the active
    // list type, then resets the workspace with a fresh local working list.
    const { activeList } = get();
    if (!activeList) {
      return;
    }

    try {
      set({ isLoading: true, error: null });

      const created = await datasource.createList({
        name,
        storeName: storeName || undefined,
      });

      // Copy current items to the new server list in a single batch
      if (activeList.items.length > 0) {
        await datasource.addItems(
          created.id,
          activeList.items.map((item) => ({
            productName: item.productName,
            category: item.category,
            unitPriceLocal: item.unitPriceLocal,
            quantity: item.quantity,
            unitPriceUsd: item.unitPriceUsd ?? undefined,
            isPurchased: item.isPurchased,
          })),
        );
      }

      if (activeList.ivaEnabled) {
        await datasource.updateList(created.id, { ivaEnabled: true });
      }

      const savedList = await datasource.getListById(created.id);

      set((state) => {
        // Remove the old local working list if it existed, keep server lists
        const withoutOldLocal = !isServerList(activeList.id)
          ? state.lists.filter((l) => l.id !== activeList.id)
          : state.lists;
        return {
          lists: [savedList, ...withoutOldLocal],
          activeList: savedList,
          isLoading: false,
        };
      });
    } catch (err) {
      let message = 'No se pudo guardar la lista';
      if (err instanceof Error) {
        message = err.message;
      }
      set({ error: message, isLoading: false });
    }
  },

  deleteList: async (listId) => {
    const syncToApi = shouldSyncToApi(listId);

    try {
      set({ error: null });

      if (syncToApi) {
        await datasource.deleteList(listId);
      }

      set((state) => ({
        lists: state.lists.filter((l) => l.id !== listId),
        activeList: state.activeList?.id === listId ? null : state.activeList,
      }));

      if (shouldPersistToStorage()) {
        get().persistGuestData();
      }
    } catch (err) {
      let message = 'No se pudo eliminar la lista';
      if (err instanceof Error) {
        message = err.message;
      }
      set({ error: message });
    }
  },

  persistGuestData: () => {
    const { lists } = get();
    // Only persist local lists — server lists belong to the BD
    const localLists = lists.filter((l) => !isServerList(l.id));
    void secureStorage.setItem(GUEST_LISTS_KEY, JSON.stringify(localLists));
  },

  /**
   * Persists everything relevant: guest lists + (when authenticated) a cache
   * of server lists so the UI can hydrate instantly on next launch while the
   * real data is refetched in the background.
   */
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
    await flushPendingSyncs((msg) => set({ error: msg }));
  },

  hydrateGuestData: async () => {
    try {
      const raw = await secureStorage.getItem(GUEST_LISTS_KEY);
      if (!raw) {
        return;
      }

      const storedLists = JSON.parse(raw) as ShoppingList[];
      if (storedLists.length === 0) {
        return;
      }

      set((state) => {
        // Merge: keep any existing lists that aren't duplicated by stored ones
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

    if (guestLists.length === 0) {
      return;
    }

    try {
      set({ isLoading: true, error: null });

      // Track which local IDs were synced so we can remove them from state
      const syncedLocalIds = new Set<string>();

      for (const guestList of guestLists) {
        const created = await datasource.createList({
          name: guestList.name,
          storeName: guestList.storeName ?? undefined,
        });

        if (guestList.ivaEnabled) {
          await datasource.updateList(created.id, { ivaEnabled: true });
        }

        if (guestList.items.length > 0) {
          await datasource.addItems(
            created.id,
            guestList.items.map((item) => ({
              productName: item.productName,
              unitPriceLocal: item.unitPriceLocal,
              quantity: item.quantity,
              category: item.category,
              unitPriceUsd: item.unitPriceUsd ?? undefined,
              isPurchased: item.isPurchased,
            })),
          );
        }

        syncedLocalIds.add(guestList.id);
      }

      await secureStorage.removeItem(GUEST_LISTS_KEY);
      const serverLists = await datasource.getActiveLists();

      set((state) => {
        // Keep local working lists that were NOT synced (e.g. empty ones)
        const remainingLocal = state.lists.filter(
          (l) => l.id.startsWith('local-') && !syncedLocalIds.has(l.id),
        );
        const mergedLists = [...remainingLocal, ...serverLists];

        // Update activeList: if it was synced, point to the first server list;
        // otherwise keep the current reference updated from the merged array
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
          activeList: newActiveList,
          isLoading: false,
        };
      });
    } catch (err) {
      let message = 'No se pudieron sincronizar las listas';
      if (err instanceof Error) {
        message = err.message;
      }
      set({ error: message, isLoading: false });
    }
  },

  resetStore: () => {
    set({
      lists: [],
      activeList: createDefaultList(),
      isLoading: false,
      error: null,
    });
  },

  completeList: async (listId) => {
    const syncToApi = shouldSyncToApi(listId);

    try {
      set({ isLoading: true, error: null });

      if (syncToApi) {
        // const completed = await datasource.completeList(listId);
        set((state) => ({
          lists: state.lists.filter((l) => l.id !== listId),
          activeList: state.activeList?.id === listId ? null : state.activeList,
          isLoading: false,
        }));
      } else {
        // Local list — just remove it (guests can't complete lists per architecture)
        set((state) => ({
          lists: state.lists.filter((l) => l.id !== listId),
          activeList: state.activeList?.id === listId ? null : state.activeList,
          isLoading: false,
        }));
      }
    } catch (err) {
      let message = 'No se pudo completar la lista';
      if (err instanceof Error) {
        message = err.message;
      }
      set({ error: message, isLoading: false });
    }
  },
}));
