import type { CountryCode } from '@/shared/domain/country/country.constants';

export type {
  AuthSession,
  AuthTokens,
  AuthUser,
} from '@/shared/domain/auth/auth.types';
export type { CountryCode } from '@/shared/domain/country/country.constants';

/** Credenciales para login con email + contraseña. */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Datos para registrar un nuevo usuario.
 *  Las coordenadas son opcionales (el guideline acepta `null`). */
export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  countryCode: CountryCode;
  latitude: number | null;
  longitude: number | null;
}

/** Datos para autenticación con Google.
 *  El backend valida el `googleIdToken` directamente
 *  y aplica `countryCode = 'VE'` por defecto cuando el usuario es nuevo. */
export interface GoogleAuthCredentials {
  googleIdToken: string;
}

/** Payload parcial para `PATCH /auth/profile`. Solo enviar campos modificados. */
export interface UpdateProfileInput {
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  countryCode?: CountryCode | null;
  latitude?: number | null;
  longitude?: number | null;
}

/** Payload para `POST /auth/change-password`. */
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/** Payload para `POST /auth/recover-password`. */
export interface RecoverPasswordInput {
  email: string;
}
