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
  isInitializing: boolean;
  hasInitialized: boolean;

  initialize: () => Promise<void>;
  refreshPermissionStatus: () => Promise<void>;
  clearToken: () => Promise<void>;
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

    refreshPermissionStatus: async () => {
      const status = await getNotificationPermissionStatus();
      set({ permissionStatus: status });
    },

    clearToken: async () => {
      await removePushTokenFromServer();
      set({ pushToken: null });
    },

    setPermissionStatus: (status) => set({ permissionStatus: status }),
  }),
);
