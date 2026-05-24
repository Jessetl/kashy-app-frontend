import notifee, {
  AndroidImportance,
  AuthorizationStatus,
} from '@notifee/react-native';
import {
  getMessaging,
  getToken,
  registerDeviceForRemoteMessages,
} from '@react-native-firebase/messaging';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { setFcmToken } from '@/shared/infrastructure/device/device';

export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined';

export type PushPlatform = 'android' | 'ios';

export interface PushNotificationState {
  pushToken: string | null;
  permissionStatus: PushPermissionStatus;
}

const ANDROID_CHANNEL_ID = 'default';

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await notifee.createChannel({
    id: ANDROID_CHANNEL_ID,
    name: 'Kashy',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
}

function mapAuthorizationStatus(
  status: AuthorizationStatus,
): PushPermissionStatus {
  if (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  ) {
    return 'granted';
  }
  if (status === AuthorizationStatus.DENIED) return 'denied';
  return 'undetermined';
}

export async function requestNotificationPermissions(): Promise<PushPermissionStatus> {
  if (!Device.isDevice) return 'denied';

  const settings = await notifee.requestPermission();
  return mapAuthorizationStatus(settings.authorizationStatus);
}

export async function getNotificationPermissionStatus(): Promise<PushPermissionStatus> {
  const settings = await notifee.getNotificationSettings();
  return mapAuthorizationStatus(settings.authorizationStatus);
}

export async function getDevicePushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  try {
    await ensureAndroidChannel();

    const messaging = getMessaging();

    if (Platform.OS === 'ios') {
      // En iOS necesitamos que APNs esté registrado antes de pedir el FCM token.
      await registerDeviceForRemoteMessages(messaging);
    }

    const token = await getToken(messaging);
    return token || null;
  } catch (err) {
    console.error('[Push] Error obteniendo push token:', err);
    return null;
  }
}

/** Pide permiso, obtiene token y lo cachea como header `X-Fcm-Token`.
 *  Usar cuando el usuario activa push desde el toggle. */
export async function initializePushNotifications(): Promise<PushNotificationState> {
  const permissionStatus = await requestNotificationPermissions();

  if (permissionStatus !== 'granted') {
    setFcmToken(null);
    return { pushToken: null, permissionStatus };
  }

  const pushToken = await getDevicePushToken();
  setFcmToken(pushToken);

  return { pushToken, permissionStatus };
}

/** Si el permiso ya estaba concedido (sesión previa), obtiene el token y
 *  lo cachea. NO solicita permiso al usuario. Pensado para el boot de la app
 *  — así `X-Fcm-Token` ya está presente en el primer request (incluido login). */
export async function bootstrapPushIfGranted(): Promise<PushNotificationState> {
  const permissionStatus = await getNotificationPermissionStatus();

  if (permissionStatus !== 'granted') {
    setFcmToken(null);
    return { pushToken: null, permissionStatus };
  }

  const pushToken = await getDevicePushToken();
  setFcmToken(pushToken);

  return { pushToken, permissionStatus };
}

/** Limpia el FCM token cacheado (al desactivar push o al logout). */
export function clearLocalPushToken(): void {
  setFcmToken(null);
}
