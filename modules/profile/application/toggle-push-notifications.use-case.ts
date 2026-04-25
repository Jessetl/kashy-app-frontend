import type { NotificationPreferences } from '../domain/entities/notification-preferences.entity';
import type { NotificationPreferencesPort } from '../domain/ports/notification-preferences.port';

/**
 * Contrato de servicio de push que esta capa necesita del runtime nativo.
 * Se inyecta desde presentation para mantener la regla: application no
 * depende de infrastructure ni de expo/firebase.
 */
export interface PushPlatformPort {
  /** Solicita permisos y obtiene el push token; puede devolver null */
  initialize(): Promise<{
    permissionStatus: 'granted' | 'denied' | 'undetermined';
    pushToken: string | null;
  }>;
  /** Elimina el token del servidor al desactivar push */
  removeToken(): Promise<void>;
}

export interface TogglePushResult {
  status: 'enabled' | 'disabled' | 'permission_denied';
  preferences: NotificationPreferences | null;
  pushToken: string | null;
}

/**
 * Caso de uso: activa o desactiva push notifications.
 *
 * Al activar: pide permiso al SO → obtiene token → si el SO lo concedió,
 * actualiza preferencias `pushEnabled=true`. Si el SO lo deniega, retorna
 * `permission_denied` sin tocar el backend.
 *
 * Al desactivar: limpia el token del servidor → apaga todas las
 * sub-preferencias (debtReminders, priceAlerts, listReminders) además del
 * master pushEnabled. Cumple regla §6.1: si el master está off, el backend
 * ignora los sub-toggles individuales.
 */
export async function togglePushNotifications(params: {
  enabled: boolean;
  preferencesPort: NotificationPreferencesPort;
  pushPort: PushPlatformPort;
}): Promise<TogglePushResult> {
  const { enabled, preferencesPort, pushPort } = params;

  if (enabled) {
    const result = await pushPort.initialize();
    if (result.permissionStatus !== 'granted') {
      return {
        status: 'permission_denied',
        preferences: null,
        pushToken: null,
      };
    }
    const preferences = await preferencesPort.updatePreferences({
      pushEnabled: true,
    });
    return {
      status: 'enabled',
      preferences,
      pushToken: result.pushToken,
    };
  }

  await pushPort.removeToken();
  const preferences = await preferencesPort.updatePreferences({
    pushEnabled: false,
    debtReminders: false,
    priceAlerts: false,
    listReminders: false,
  });
  return {
    status: 'disabled',
    preferences,
    pushToken: null,
  };
}
