/**
 * API pública del módulo profile.
 */

// Domain
export type { NotificationPreferences } from './domain/entities/notification-preferences.entity';

// Re-export de tipos de auth — convivencia para consumidores históricos.
export type {
  ChangePasswordInput,
  UpdateProfileInput,
} from '@/modules/auth';

// Presentation — API pública
export { useAccount } from './presentation/hooks/use-account';
export { useNotificationPreferences } from './presentation/hooks/use-notification-preferences';
