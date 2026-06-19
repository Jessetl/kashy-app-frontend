/** Tokens de autenticación devueltos por el backend.
 *  Ambos se guardan cifrados en Keychain/Keystore (SecureStore). El
 *  `refreshToken` es el crítico: canjea por nuevos `accessToken` vía
 *  `/auth/refresh`. Firebase puede rotarlo, por eso siempre se sobrescribe. */
export interface AuthTokens {
  accessToken: string;
  /** Refresh token de Firebase (larga vida, rotable). Es per-device. */
  refreshToken: string;
  /** Segundos de vida del accessToken (ej. 900 = 15 min). */
  expiresIn: number;
}

/** Usuario autenticado, según contrato `/auth/profile` y `/auth/login`. */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  subscriptionPlan: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
}

/** Respuesta completa de login (tokens + usuario). */
export interface AuthSession {
  tokens: AuthTokens;
  user: AuthUser;
}
