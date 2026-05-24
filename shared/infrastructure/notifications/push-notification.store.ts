import { create } from 'zustand';
import type {
  PushNotificationState,
  PushPermissionStatus,
} from './push-notification.service';
import {
  bootstrapPushIfGranted,
  clearLocalPushToken,
  getNotificationPermissionStatus,
  initializePushNotifications,
} from './push-notification.service';

interface PushNotificationStoreState extends PushNotificationState {
  isInitializing: boolean;
  hasInitialized: boolean;

  /** Pide permiso + obtiene token. Llamar desde el toggle de activación. */
  initialize: () => Promise<void>;
  /** Sin pedir permiso: si ya estaba granted, cachea el token para que
   *  `X-Fcm-Token` esté en headers desde el boot (incluido login). */
  bootstrap: () => Promise<void>;
  refreshPermissionStatus: () => Promise<void>;
  /** Limpia FCM cacheado localmente. No llama al backend. */
  clearToken: () => void;
  setPermissionStatus: (status: PushPermissionStatus) => void;
}

export const usePushNotificationStore = create<PushNotificationStoreState>()(
  (set, get) => ({
    pushToken: null,
    permissionStatus: 'undetermined',
    isInitializing: false,
    hasInitialized: false,

    initialize: async () => {
      if (get().isInitializing) {
        return;
      }

      set({ isInitializing: true });
      try {
        const result = await initializePushNotifications();
        set({
          pushToken: result.pushToken,
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

    bootstrap: async () => {
      try {
        const result = await bootstrapPushIfGranted();
        set({
          pushToken: result.pushToken,
          permissionStatus: result.permissionStatus,
        });
      } catch (err) {
        console.error('[PushStore] Error en bootstrap de push:', err);
      }
    },

    refreshPermissionStatus: async () => {
      const status = await getNotificationPermissionStatus();
      set({ permissionStatus: status });
    },

    clearToken: () => {
      clearLocalPushToken();
      set({ pushToken: null });
    },

    setPermissionStatus: (status) => set({ permissionStatus: status }),
  }),
);
