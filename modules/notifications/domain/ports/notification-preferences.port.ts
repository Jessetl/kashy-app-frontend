import type { NotificationPreferences } from '../entities/notification-preferences.entity';

export interface NotificationPreferencesPort {
  /** Obtiene las preferencias actuales del usuario autenticado */
  getPreferences(): Promise<NotificationPreferences>;
  /** Actualiza las preferencias (parcial) */
  updatePreferences(
    prefs: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences>;
}
