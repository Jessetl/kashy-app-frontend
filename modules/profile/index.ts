/**
 * API pública del módulo profile.
 */

// Domain
export type { NotificationPreferences } from './domain/entities/notification-preferences.entity';
export type {
  ChangePasswordInput,
  UpdateProfileInput,
} from './domain/entities/user-profile.entity';

// Presentation — API pública
export { useAccount } from './presentation/hooks/use-account';
export { useNotificationPreferences } from './presentation/hooks/use-notification-preferences';
