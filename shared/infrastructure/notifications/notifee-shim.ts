import Constants from 'expo-constants';

type NotifeeModule = typeof import('@notifee/react-native');

type NotifeeLike = {
  createChannel: (...args: any[]) => Promise<string>;
  displayNotification: (...args: any[]) => Promise<void>;
  onForegroundEvent: (observer: (event: any) => void) => () => void;
  requestPermission: (...args: any[]) => Promise<{ authorizationStatus: number }>;
  getNotificationSettings: (
    ...args: any[]
  ) => Promise<{ authorizationStatus: number }>;
};

const fallbackAuthorizationStatus = {
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
} as const;

const fallbackAndroidImportance = {
  HIGH: 4,
} as const;

const fallbackEventType = {
  PRESS: 1,
} as const;

const fallbackNotifee: NotifeeLike = {
  async createChannel() {
    return 'default';
  },
  async displayNotification() {
    return;
  },
  onForegroundEvent() {
    return () => {
      return;
    };
  },
  async requestPermission() {
    return { authorizationStatus: fallbackAuthorizationStatus.DENIED };
  },
  async getNotificationSettings() {
    return { authorizationStatus: fallbackAuthorizationStatus.DENIED };
  },
};

function resolveNotifeeModule(): NotifeeModule | null {
  const isExpoGo = Constants.appOwnership === 'expo';
  if (isExpoGo) {
    console.warn(
      '[Push] Notifee no esta disponible en Expo Go. Usa un development build (expo run:android o EAS).',
    );
    return null;
  }

  try {
    return require('@notifee/react-native') as NotifeeModule;
  } catch (error) {
    console.warn(
      '[Push] Notifee native module no encontrado. Recompila la app nativa despues de instalar dependencias.',
      error,
    );
    return null;
  }
}

const runtimeNotifee = resolveNotifeeModule();

const notifee: NotifeeLike = runtimeNotifee?.default
  ? (runtimeNotifee.default as unknown as NotifeeLike)
  : fallbackNotifee;

export const AndroidImportance: Readonly<{ HIGH: number }> =
  runtimeNotifee?.AndroidImportance ?? fallbackAndroidImportance;

export const AuthorizationStatus: Readonly<{
  DENIED: number;
  AUTHORIZED: number;
  PROVISIONAL: number;
}> = runtimeNotifee?.AuthorizationStatus ?? fallbackAuthorizationStatus;

export const EventType: Readonly<{ PRESS: number }> =
  runtimeNotifee?.EventType ?? fallbackEventType;

export default notifee;