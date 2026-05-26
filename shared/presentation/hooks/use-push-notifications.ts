import { useAuthStore } from '@/shared/infrastructure/auth/auth.store';
import { setFcmToken } from '@/shared/infrastructure/device/device';
import { usePushNotificationStore } from '@/shared/infrastructure/notifications/push-notification.store';
import notifee, {
  AndroidImportance,
  EventType,
} from '@/shared/infrastructure/notifications/notifee-shim';
import {
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

const ANDROID_CHANNEL_ID = 'default';

type NotificationData = Record<string, string | number | object | undefined>;

export function usePushNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const bootstrap = usePushNotificationStore((s) => s.bootstrap);
  const clearToken = usePushNotificationStore((s) => s.clearToken);
  const refreshPermissionStatus = usePushNotificationStore(
    (s) => s.refreshPermissionStatus,
  );

  const router = useRouter();

  const handleNotificationTap = useCallback(
    (data: NotificationData | undefined) => {
      if (!data) {
        return;
      }
      if (data.type === 'debt_due_reminder' && data.debtId) {
        router.push(`/(tabs)/debts/${String(data.debtId)}`);
      }
    },
    [router],
  );

  // Bootstrap del FCM token al iniciar la app (no pide permiso, solo lo cachea
  // si ya estaba aprobado). Esto asegura que `X-Fcm-Token` esté presente en el
  // primer request — incluido el login.
  useEffect(() => {
    if (!hasHydrated) return;
    void bootstrap();
  }, [hasHydrated, bootstrap]);

  // Limpiar FCM local al desloguearse
  const prevAuth = useRef(isAuthenticated);
  useEffect(() => {
    if (prevAuth.current && !isAuthenticated) {
      clearToken();
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated, clearToken]);

  // Re-cachear token si FCM lo rota
  useEffect(() => {
    const unsubscribe = onTokenRefresh(getMessaging(), (newToken) => {
      if (newToken) {
        setFcmToken(newToken);
        usePushNotificationStore.setState({ pushToken: newToken });
      }
    });

    return unsubscribe;
  }, []);

  // Mensaje recibido en foreground → mostrarlo con notifee
  useEffect(() => {
    const unsubscribe = onMessage(getMessaging(), async (remoteMessage) => {
      if (Platform.OS === 'android') {
        await notifee.createChannel({
          id: ANDROID_CHANNEL_ID,
          name: 'Kashy',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
        });
      }

      const data = remoteMessage.data ?? {};
      await notifee.displayNotification({
        title: String(data.title ?? remoteMessage.notification?.title ?? 'Kashy'),
        body: String(data.body ?? remoteMessage.notification?.body ?? ''),
        data,
        android: {
          channelId: ANDROID_CHANNEL_ID,
          smallIcon: 'ic_notification',
          color: '#63E696',
          pressAction: { id: 'default' },
        },
        ios: { sound: 'default' },
      });
    });

    return unsubscribe;
  }, []);

  // Tap en notificación mientras la app está en foreground
  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        handleNotificationTap(detail.notification?.data as NotificationData);
      }
    });
  }, [handleNotificationTap]);

  // Tap cuando la app estaba en background y se abre
  useEffect(() => {
    const unsubscribe = onNotificationOpenedApp(
      getMessaging(),
      (remoteMessage) => {
        handleNotificationTap(remoteMessage.data as NotificationData);
      },
    );
    return unsubscribe;
  }, [handleNotificationTap]);

  // Tap cuando la app estaba cerrada (killed) y se abrió desde la notificación
  useEffect(() => {
    void getInitialNotification(getMessaging()).then((remoteMessage) => {
      if (remoteMessage) {
        handleNotificationTap(remoteMessage.data as NotificationData);
      }
    });
  }, [handleNotificationTap]);

  // Refrescar estado del permiso cuando la app vuelve al foreground
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
