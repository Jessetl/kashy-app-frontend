/**
 * API pública del módulo auth.
 */

// Domain
export type {
  AuthSession,
  AuthTokens,
  AuthUser,
  ChangePasswordInput,
  CountryCode,
  GoogleAuthCredentials,
  LoginCredentials,
  RecoverPasswordInput,
  RegisterCredentials,
  UpdateProfileInput,
} from './domain/auth.entity';

// Presentation — API pública
export { useChangePassword } from './presentation/hooks/use-change-password';
export { useGoogleAuth } from './presentation/hooks/use-google-auth';
export { useLogin } from './presentation/hooks/use-login';
export { useRecoverPassword } from './presentation/hooks/use-recover-password';
export { useRegister } from './presentation/hooks/use-register';
export { useSessionRestore } from './presentation/hooks/use-session-restore';
export { useUpdateProfile } from './presentation/hooks/use-update-profile';
