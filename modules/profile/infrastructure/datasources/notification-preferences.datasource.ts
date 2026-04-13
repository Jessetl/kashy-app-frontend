import { apiClient } from '@/shared/infrastructure/api/api-client';
import { secureStorage } from '@/shared/infrastructure/storage/app-storage';
import type { NotificationPreferences } from '../../domain/entities/notification-preferences.entity';
import { DEFAULT_PREFERENCES } from '../../domain/entities/notification-preferences.entity';
import type { NotificationPreferencesPort } from '../../domain/ports/notification-preferences.port';

const PREFS_CACHE_KEY = 'notification-prefs-cache';
const ENDPOINT = '/users/me/notification-preferences';

/** Respuesta del endpoint de preferencias de notificación */
interface PreferencesResponse {
  pushEnabled?: boolean;
  push_enabled?: boolean;
  debtReminders?: boolean;
  debt_reminders?: boolean;
  priceAlerts?: boolean;
  price_alerts?: boolean;
  listReminders?: boolean;
  list_reminders?: boolean;
  updatedAt?: string;
}

function parsePreferences(data: PreferencesResponse): NotificationPreferences {
  return {
    pushEnabled:
      data.pushEnabled ?? data.push_enabled ?? DEFAULT_PREFERENCES.pushEnabled,
    debtReminders:
      data.debtReminders ?? data.debt_reminders ?? DEFAULT_PREFERENCES.debtReminders,
    priceAlerts:
      data.priceAlerts ?? data.price_alerts ?? DEFAULT_PREFERENCES.priceAlerts,
    listReminders:
      data.listReminders ?? data.list_reminders ?? DEFAULT_PREFERENCES.listReminders,
  };
}

export class NotificationPreferencesDatasource
  implements NotificationPreferencesPort
{
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await apiClient<PreferencesResponse>(ENDPOINT);
      const prefs = parsePreferences(response.data);
      await this.cachePreferences(prefs);
      return prefs;
    } catch {
      // Fallback a cache local si la API falla
      const cached = await this.readCache();
      if (cached) return cached;
      return DEFAULT_PREFERENCES;
    }
  }

  async updatePreferences(
    update: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const response = await apiClient<PreferencesResponse>(ENDPOINT, {
      method: 'PUT',
      body: {
        pushEnabled: update.pushEnabled,
        debtReminders: update.debtReminders,
        priceAlerts: update.priceAlerts,
        listReminders: update.listReminders,
      },
    });

    const prefs = parsePreferences(response.data);
    await this.cachePreferences(prefs);
    return prefs;
  }

  private async cachePreferences(prefs: NotificationPreferences): Promise<void> {
    await secureStorage.setItem(PREFS_CACHE_KEY, JSON.stringify(prefs));
  }

  private async readCache(): Promise<NotificationPreferences | null> {
    try {
      const raw = await secureStorage.getItem(PREFS_CACHE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as NotificationPreferences;
    } catch {
      return null;
    }
  }
}
