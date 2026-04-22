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
import { apiClient } from '../api/api-client';

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

export async function registerPushTokenOnServer(
  token: string,
  platform: PushPlatform,
): Promise<void> {
  try {
    await apiClient('/users/me/push-token', {
      method: 'PUT',
      body: { token, platform },
    });
  } catch (err) {
    console.error('[Push] Error registrando push token en servidor:', err);
  }
}

export async function removePushTokenFromServer(): Promise<void> {
  try {
    await apiClient('/users/me/push-token', { method: 'DELETE' });
  } catch {
    // no-op — no es crítico si falla
  }
}

export async function initializePushNotifications(): Promise<PushNotificationState> {
  const permissionStatus = await requestNotificationPermissions();

  if (permissionStatus !== 'granted') {
    return { pushToken: null, permissionStatus };
  }

  const pushToken = await getDevicePushToken();

  if (pushToken) {
    await registerPushTokenOnServer(pushToken, Platform.OS as PushPlatform);
  }

  return { pushToken, permissionStatus };
}
