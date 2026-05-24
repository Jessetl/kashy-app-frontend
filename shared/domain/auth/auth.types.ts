/** Tokens de autenticación devueltos por el backend.
 *  El refresh token vive solo en el servidor; el frontend solo guarda el accessToken. */
export interface AuthTokens {
  accessToken: string;
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
