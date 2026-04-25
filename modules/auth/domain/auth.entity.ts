import type { CountryCode } from '@/shared/domain/country/country.constants';

export type {
  AuthSession,
  AuthTokens,
  AuthUser,
} from '@/shared/domain/auth/auth.types';
export type { CountryCode } from '@/shared/domain/country/country.constants';

/** Datos para autenticación con Google (register o login unificado) */
export interface GoogleAuthCredentials {
  idToken: string | null;
  accessToken: string | null;
  country: CountryCode;
  locationLatitude: number;
  locationLongitude: number;
}

/**
 * Tipo propio del módulo auth — solo usado por el flujo de login.
 * No pertenece a shared/ porque solo lo consume este módulo.
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Datos necesarios para registrar un nuevo usuario */
export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country: CountryCode;
  locationLatitude: number;
  locationLongitude: number;
}
