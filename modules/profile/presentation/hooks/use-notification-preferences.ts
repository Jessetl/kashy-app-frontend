import { usePushNotificationStore } from '@/shared/infrastructure/notifications/push-notification.store';
import {
  initializePushNotifications,
  removePushTokenFromServer,
} from '@/shared/infrastructure/notifications/push-notification.service';
import { useCallback, useEffect, useRef } from 'react';
import type { NotificationPreferences } from '../../domain/entities/notification-preferences.entity';
import { useNotificationPreferencesStore } from '../../infrastructure/store/notification-preferences.store';

const FEEDBACK_TIMEOUT = 3000;

export function useNotificationPreferences() {
  const preferences = useNotificationPreferencesStore((s) => s.preferences);
  const isLoading = useNotificationPreferencesStore((s) => s.isLoading);
  const isSaving = useNotificationPreferencesStore((s) => s.isSaving);
  const error = useNotificationPreferencesStore((s) => s.error);
  const successMessage = useNotificationPreferencesStore(
    (s) => s.successMessage,
  );
  const loadPreferences = useNotificationPreferencesStore(
    (s) => s.loadPreferences,
  );
  const updatePreferences = useNotificationPreferencesStore(
    (s) => s.updatePreferences,
  );
  const clearFeedback = useNotificationPreferencesStore(
    (s) => s.clearFeedback,
  );

  const permissionStatus = usePushNotificationStore(
    (s) => s.permissionStatus,
  );

  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cargar preferencias al montar
  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  // Auto-limpiar mensajes de feedback después de N segundos
  useEffect(() => {
    if (error || successMessage) {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(clearFeedback, FEEDBACK_TIMEOUT);
    }
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, [error, successMessage, clearFeedback]);

  const togglePush = useCallback(
    async (value: boolean) => {
      if (value) {
        // Al activar: solicitar permiso del SO + obtener token + registrar
        const result = await initializePushNotifications();

        if (result.permissionStatus !== 'granted') {
          // El SO denegó el permiso — no activar en backend
          useNotificationPreferencesStore.setState({
            error:
              'Permiso de notificaciones denegado. Actívalas en los ajustes de tu dispositivo.',
          });
          return;
        }

        // Permiso OK — actualizar push token en el push store
        usePushNotificationStore.setState({
          expoPushToken: result.expoPushToken,
          permissionStatus: result.permissionStatus,
        });

        void updatePreferences({ pushEnabled: true });
      } else {
        // Desactivar: limpiar token del servidor + desactivar todo
        void removePushTokenFromServer();
        void updatePreferences({
          pushEnabled: false,
          debtReminders: false,
          priceAlerts: false,
          listReminders: false,
        });
      }
    },
    [updatePreferences],
  );

  const toggleCategory = useCallback(
    (
      key: keyof Omit<NotificationPreferences, 'pushEnabled'>,
      value: boolean,
    ) => {
      void updatePreferences({ [key]: value });
    },
    [updatePreferences],
  );

  return {
    preferences,
    isLoading,
    isSaving,
    error,
    successMessage,
    permissionStatus,
    togglePush,
    toggleCategory,
    clearFeedback,
  };
}
