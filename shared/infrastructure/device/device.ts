import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { secureStorage } from '../storage/app-storage';

// Versión declarada en app.json (estática al bundle time).
const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

const DEVICE_ID_KEY = 'device-id';

let cachedDeviceId: string | null = null;
let cachedDeviceName: string | null = null;
let cachedFcmToken: string | null = null;
let initPromise: Promise<void> | null = null;

function buildDeviceName(): string {
  const os = Device.osName ?? Platform.OS;
  const version = Device.osVersion ?? String(Platform.Version);
  const brand = Device.brand ?? 'Unknown';
  const model = Device.modelName ?? 'Unknown';
  return `${os} ${version} ${brand} ${model}`;
}

async function loadDeviceId(): Promise<string> {
  const stored = await secureStorage.getItem(DEVICE_ID_KEY);
  if (stored) {
    return stored;
  }

  const generated = Crypto.randomUUID();
  await secureStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}

/** Inicializa y cachea el identificador y el nombre del dispositivo.
 *  Idempotente: las llamadas posteriores reutilizan el resultado. */
export function initDeviceHeaders(): Promise<void> {
  if (cachedDeviceId && cachedDeviceName) {
    return Promise.resolve();
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    cachedDeviceId = await loadDeviceId();
    cachedDeviceName = buildDeviceName();
  })();

  return initPromise;
}

/** Cachea el FCM token para que `getDeviceHeaders` lo inyecte como
 *  `X-Fcm-Token` en cada request. Pasar `null` lo limpia (al rechazar push
 *  o al desloguear). */
export function setFcmToken(token: string | null): void {
  cachedFcmToken = token;
}

/** Token FCM actualmente cacheado. */
export function getFcmToken(): string | null {
  return cachedFcmToken;
}

/** Devuelve los headers `X-Device-Id` / `X-Device-Name` ya inicializados.
 *  Incluye `X-Fcm-Token` cuando el usuario aprobó notificaciones push. */
export async function getDeviceHeaders(): Promise<Record<string, string>> {
  await initDeviceHeaders();

  const headers: Record<string, string> = {
    'X-Platform': Platform.OS,
    'X-App-Version': APP_VERSION,
  };

  if (cachedDeviceId) {
    headers['X-Device-Id'] = cachedDeviceId;
  }
  if (cachedDeviceName) {
    headers['X-Device-Name'] = cachedDeviceName;
  }
  if (cachedFcmToken) {
    headers['X-Fcm-Token'] = cachedFcmToken;
  }
  return headers;
}
