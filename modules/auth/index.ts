/**
 * API pública del módulo auth.
 */

// Domain
export type {
  AuthSession,
  AuthTokens,
  AuthUser,
  CountryCode,
  GoogleAuthCredentials,
  LoginCredentials,
  RegisterCredentials,
} from './domain/auth.entity';

// Presentation — API pública
export { useGoogleAuth } from './presentation/hooks/use-google-auth';
export { useLogin } from './presentation/hooks/use-login';
export { useRegister } from './presentation/hooks/use-register';
export { useSessionRestore } from './presentation/hooks/use-session-restore';
