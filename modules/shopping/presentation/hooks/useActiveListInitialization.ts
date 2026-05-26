import { useCallback, useEffect, useState } from 'react';
import type { ShoppingList } from '../../domain/entities/shopping-list.entity';
import { useShoppingStore } from '../store/useShoppingStore';

const LIST_INIT_MAX_RETRIES = 3;
const LIST_INIT_RETRY_DELAY_MS = 800;

type UseActiveListInitializationParams = {
  activeList: ShoppingList | null;
  isAuthenticated: boolean;
};

export function useActiveListInitialization({
  activeList,
  isAuthenticated,
}: UseActiveListInitializationParams) {
  const loadLists = useShoppingStore((s) => s.loadLists);
  const createList = useShoppingStore((s) => s.createList);

  const [isInitializingList, setIsInitializingList] = useState(false);
  const [listInitError, setListInitError] = useState<string | null>(null);
  const [listInitRetryTick, setListInitRetryTick] = useState(0);

  useEffect(() => {
    if (activeList) {
      setIsInitializingList(false);
      setListInitError(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      setIsInitializingList(true);
      setListInitError(null);

      for (let attempt = 1; attempt <= LIST_INIT_MAX_RETRIES; attempt += 1) {
        if (cancelled) {
          return;
        }

        try {
          await loadLists();

          const stateAfterLoad = useShoppingStore.getState();
          if (stateAfterLoad.activeList) {
            if (!cancelled) {
              setIsInitializingList(false);
              setListInitError(null);
            }
            return;
          }

          if (stateAfterLoad.lists.length > 0) {
            stateAfterLoad.setActiveList(stateAfterLoad.lists[0]);
            const stateAfterSetActive = useShoppingStore.getState();
            if (stateAfterSetActive.activeList) {
              if (!cancelled) {
                setIsInitializingList(false);
                setListInitError(null);
              }
              return;
            }
          } else {
            await createList('Nueva lista');
            const stateAfterCreate = useShoppingStore.getState();
            if (stateAfterCreate.activeList) {
              if (!cancelled) {
                setIsInitializingList(false);
                setListInitError(null);
              }
              return;
            }
          }
        } catch {
          // Keep retrying below.
        }

        if (attempt < LIST_INIT_MAX_RETRIES) {
          await new Promise((resolve) =>
            setTimeout(resolve, LIST_INIT_RETRY_DELAY_MS),
          );
        }
      }

      if (!cancelled) {
        setIsInitializingList(false);
        setListInitError(
          'No pudimos inicializar tu lista. Reintenta para continuar.',
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, activeList, loadLists, createList, listInitRetryTick]);

  const canInteractWithList = Boolean(activeList) && !isInitializingList;

  const handleRetryListInitialization = useCallback(() => {
    if (isInitializingList) {
      return;
    }
    setListInitRetryTick((prev) => prev + 1);
  }, [isInitializingList]);

  return {
    isInitializingList,
    listInitError,
    canInteractWithList,
    handleRetryListInitialization,
  };
}
