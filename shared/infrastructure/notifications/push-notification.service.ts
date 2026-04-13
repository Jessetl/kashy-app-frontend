import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiClient } from '../api/api-client';

/* ─── Configuración del canal Android ─── */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

/* ─── Tipos ─── */

export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface PushNotificationState {
  /** Token de Expo para enviar push al dispositivo */
  expoPushToken: string | null;
  /** Estado del permiso de notificaciones del SO */
  permissionStatus: PushPermissionStatus;
}

/* ─── Servicio ─── */

/**
 * Solicita permisos de notificación al usuario.
 * En Android 13+ muestra el diálogo nativo de POST_NOTIFICATIONS.
 */
export async function requestNotificationPermissions(): Promise<PushPermissionStatus> {
  if (!Device.isDevice) {
    console.warn('[Push] Las notificaciones push no funcionan en emulador');
    return 'denied';
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') return 'granted';

  const { status: newStatus } =
    await Notifications.requestPermissionsAsync();

  return newStatus === 'granted' ? 'granted' : 'denied';
}

/**
 * Obtiene el estado actual del permiso sin solicitarlo.
 */
export async function getNotificationPermissionStatus(): Promise<PushPermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

/**
 * Obtiene el Expo Push Token del dispositivo.
 * Requiere que el permiso ya haya sido otorgado.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  try {
    // Crear canal de Android si no existe
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Kashy',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#63E696',
        sound: 'default',
      });
    }

    const projectId =
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
      'c4126c67-98bc-4f2c-81dc-4b869624548a';

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return tokenData.data;
  } catch (err) {
    console.error('[Push] Error obteniendo push token:', err);
    return null;
  }
}

/**
 * Registra el push token en el backend para que pueda enviar notificaciones
 * a este dispositivo.
 */
export async function registerPushTokenOnServer(
  expoPushToken: string,
): Promise<void> {
  try {
    await apiClient('/users/me/push-token', {
      method: 'PUT',
      body: { pushToken: expoPushToken },
    });
  } catch (err) {
    console.error('[Push] Error registrando push token en servidor:', err);
  }
}

/**
 * Elimina el push token del servidor (al desactivar notificaciones o logout).
 */
export async function removePushTokenFromServer(): Promise<void> {
  try {
    await apiClient('/users/me/push-token', {
      method: 'DELETE',
    });
  } catch {
    // Silenciar — no es crítico si falla
  }
}

/**
 * Flujo completo: pide permiso → obtiene token → lo registra en el backend.
 * Retorna el estado resultante.
 */
export async function initializePushNotifications(): Promise<PushNotificationState> {
  const permissionStatus = await requestNotificationPermissions();

  if (permissionStatus !== 'granted') {
    return { expoPushToken: null, permissionStatus };
  }

  const expoPushToken = await getExpoPushToken();

  if (expoPushToken) {
    await registerPushTokenOnServer(expoPushToken);
  }

  return { expoPushToken, permissionStatus };
}
