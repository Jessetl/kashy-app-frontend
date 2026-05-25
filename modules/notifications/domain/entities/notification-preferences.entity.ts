/** Preferencias de notificación del usuario (mapeadas desde users.notification_enabled + granular) */
export interface NotificationPreferences {
  /** Master toggle — corresponde a users.notification_enabled en BD */
  pushEnabled: boolean;
  /** Recordatorios de vencimiento de deudas */
  debtReminders: boolean;
  /** Alertas de cambios en la tasa de cambio */
  priceAlerts: boolean;
  /** Recordatorios de listas de compras pendientes */
  listReminders: boolean;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  debtReminders: true,
  priceAlerts: false,
  listReminders: true,
};
