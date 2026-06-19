import * as SecureStore from 'expo-secure-store';

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: 'kashy-secure-storage',
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key, SECURE_STORE_OPTIONS);
    } catch {
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value, SECURE_STORE_OPTIONS);
    } catch {
      // Ignorar errores para no romper el flujo de UI.
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key, SECURE_STORE_OPTIONS);
    } catch {
      // Ignorar errores para no romper el flujo de UI.
    }
  },
} as const;
