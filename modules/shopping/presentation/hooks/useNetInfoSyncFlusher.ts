import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { useShoppingStore } from '../store/useShoppingStore';

/**
 * Conecta `NetInfo` con el `shoppingStore`:
 * - Hidrata el `syncQueue` persistido al montar (sobrevive a app restart).
 * - Suscribe a cambios de conectividad y propaga a `setOnline`.
 *
 * El flush automático de la queue al reconectar es responsabilidad de
 * `setOnline` (Flow 12): si la transición es offline → online y el usuario
 * está autenticado con queue no vacía, dispara `flushPendingSyncQueue`.
 */
export function useNetInfoSyncFlusher(): void {
  const setOnline = useShoppingStore((s) => s.setOnline);
  const hydrateSyncQueue = useShoppingStore((s) => s.hydrateSyncQueue);

  useEffect(() => {
    void hydrateSyncQueue();

    const unsubscribe = NetInfo.addEventListener((state) => {
      // `isConnected` puede ser null al arranque — lo tratamos como online
      // (optimismo) para no bloquear al usuario antes del primer ping.
      const online = state.isConnected !== false;
      setOnline(online);
    });

    return unsubscribe;
  }, [hydrateSyncQueue, setOnline]);
}
