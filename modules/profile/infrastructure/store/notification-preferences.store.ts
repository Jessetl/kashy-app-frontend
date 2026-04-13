import { create } from 'zustand';
import type { NotificationPreferences } from '../../domain/entities/notification-preferences.entity';
import { DEFAULT_PREFERENCES } from '../../domain/entities/notification-preferences.entity';
import { NotificationPreferencesDatasource } from '../datasources/notification-preferences.datasource';

interface NotificationPreferencesState {
  preferences: NotificationPreferences;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  successMessage: string | null;

  /** Carga las preferencias desde el API */
  loadPreferences: () => Promise<void>;
  /** Actualiza una o más preferencias (toggle) */
  updatePreferences: (update: Partial<NotificationPreferences>) => Promise<void>;
  /** Limpia los mensajes de feedback */
  clearFeedback: () => void;
}

const datasource = new NotificationPreferencesDatasource();

export const useNotificationPreferencesStore =
  create<NotificationPreferencesState>()((set, get) => ({
    preferences: DEFAULT_PREFERENCES,
    isLoading: false,
    isSaving: false,
    error: null,
    successMessage: null,

    loadPreferences: async () => {
      set({ isLoading: true, error: null });
      try {
        const prefs = await datasource.getPreferences();
        set({ preferences: prefs, isLoading: false });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar las preferencias';
        set({ error: message, isLoading: false });
      }
    },

    updatePreferences: async (update: Partial<NotificationPreferences>) => {
      const previous = get().preferences;

      // Optimistic update
      set({
        preferences: { ...previous, ...update },
        isSaving: true,
        error: null,
        successMessage: null,
      });

      try {
        const saved = await datasource.updatePreferences({
          ...previous,
          ...update,
        });
        set({
          preferences: saved,
          isSaving: false,
          successMessage: 'Preferencias actualizadas',
        });
      } catch (err) {
        // Revert optimistic update
        set({
          preferences: previous,
          isSaving: false,
          error:
            err instanceof Error
              ? err.message
              : 'No se pudieron guardar las preferencias',
        });
      }
    },

    clearFeedback: () => set({ error: null, successMessage: null }),
  }));
