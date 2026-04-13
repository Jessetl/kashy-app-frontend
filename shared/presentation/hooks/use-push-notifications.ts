import { useAuthStore } from '@/shared/infrastructure/auth/auth.store';
import { usePushNotificationStore } from '@/shared/infrastructure/notifications/push-notification.store';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Hook que inicializa y gestiona push notifications en toda la app.
 * Debe montarse UNA sola vez en el root layout.
 *
 * - Inicializa push cuando el usuario está autenticado.
 * - Escucha notificaciones recibidas y tocadas.
 * - Refresca el estado del permiso al volver al foreground.
 * - Limpia el token al cerrar sesión.
 */
export function usePushNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const initialize = usePushNotificationStore((s) => s.initialize);
  const hasInitialized = usePushNotificationStore((s) => s.hasInitialized);
  const refreshPermissionStatus = usePushNotificationStore(
    (s) => s.refreshPermissionStatus,
  );
  const clearToken = usePushNotificationStore((s) => s.clearToken);

  const router = useRouter();
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const receivedListener = useRef<Notifications.EventSubscription | null>(null);

  // Inicializar cuando el usuario se autentica
  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) return;
    if (hasInitialized) return;

    void initialize();
  }, [isAuthenticated, hasHydrated, hasInitialized, initialize]);

  // Limpiar token al desloguearse
  const prevAuth = useRef(isAuthenticated);
  useEffect(() => {
    if (prevAuth.current && !isAuthenticated) {
      void clearToken();
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated, clearToken]);

  // Listener: notificación recibida en foreground
  useEffect(() => {
    receivedListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('[Push] Notificación recibida:', notification.request.content.title);
      });

    return () => {
      receivedListener.current?.remove();
    };
  }, []);

  // Listener: usuario toca la notificación
  useEffect(() => {
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;

        // Navegar según el tipo de notificación
        if (data?.type === 'debt_due_reminder' && data?.debtId) {
          router.push(`/(tabs)/debts/${data.debtId as string}`);
        }
      });

    return () => {
      responseListener.current?.remove();
    };
  }, [router]);

  // Refrescar estado del permiso cuando la app vuelve al foreground
  // (el usuario puede haber cambiado permisos en Ajustes del SO)
  const handleAppStateChange = useCallback(
    (nextAppState: string) => {
      if (nextAppState === 'active' && isAuthenticated) {
        void refreshPermissionStatus();
      }
    },
    [isAuthenticated, refreshPermissionStatus],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, [handleAppStateChange]);
}
