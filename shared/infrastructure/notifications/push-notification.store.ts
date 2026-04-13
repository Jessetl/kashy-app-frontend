import { create } from 'zustand';
import type {
  PushNotificationState,
  PushPermissionStatus,
} from './push-notification.service';
import {
  getNotificationPermissionStatus,
  initializePushNotifications,
  removePushTokenFromServer,
} from './push-notification.service';

interface PushNotificationStoreState extends PushNotificationState {
  /** Si la inicialización está en curso */
  isInitializing: boolean;
  /** Si ya se intentó inicializar al menos una vez */
  hasInitialized: boolean;

  /** Inicializa push: pide permiso, obtiene token, registra en backend */
  initialize: () => Promise<void>;
  /** Verifica el estado del permiso sin solicitar (para refrescar en foreground) */
  refreshPermissionStatus: () => Promise<void>;
  /** Limpia el token (logout o desactivar push) */
  clearToken: () => Promise<void>;
  /** Actualiza el estado del permiso manualmente */
  setPermissionStatus: (status: PushPermissionStatus) => void;
}

export const usePushNotificationStore = create<PushNotificationStoreState>()(
  (set, get) => ({
    expoPushToken: null,
    permissionStatus: 'undetermined',
    isInitializing: false,
    hasInitialized: false,

    initialize: async () => {
      if (get().isInitializing) return;

      set({ isInitializing: true });
      try {
        const result = await initializePushNotifications();
        set({
          expoPushToken: result.expoPushToken,
          permissionStatus: result.permissionStatus,
          hasInitialized: true,
        });
      } catch (err) {
        console.error('[PushStore] Error inicializando push:', err);
        set({ hasInitialized: true });
      } finally {
        set({ isInitializing: false });
      }
    },

    refreshPermissionStatus: async () => {
      const status = await getNotificationPermissionStatus();
      set({ permissionStatus: status });
    },

    clearToken: async () => {
      await removePushTokenFromServer();
      set({ expoPushToken: null });
    },

    setPermissionStatus: (status) => set({ permissionStatus: status }),
  }),
);
