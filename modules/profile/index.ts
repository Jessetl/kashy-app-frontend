/**
 * API pública del módulo profile.
 */

// Re-export de tipos de auth — convivencia para consumidores históricos.
export type {
  ChangePasswordInput,
  UpdateProfileInput,
} from '@/modules/auth';

// Presentation — API pública
export { useAccount } from './presentation/hooks/use-account';
