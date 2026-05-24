import type {
  AuthSession,
  AuthTokens,
  AuthUser,
  ChangePasswordInput,
  GoogleAuthCredentials,
  LoginCredentials,
  RecoverPasswordInput,
  RegisterCredentials,
  UpdateProfileInput,
} from './auth.entity';

/** Puerto (contrato) que define las operaciones de autenticación. */
export interface AuthPort {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  register(credentials: RegisterCredentials): Promise<void>;
  googleAuth(credentials: GoogleAuthCredentials): Promise<AuthSession>;
  /** Renueva el accessToken usando el JWT actual/expirado como
   *  proof-of-possession (manejado por `apiClient`). */
  refreshToken(): Promise<AuthTokens>;
  /** Obtiene el perfil del usuario autenticado. */
  getProfile(): Promise<AuthUser>;
  /** Actualiza parcialmente el perfil del usuario. Devuelve el usuario completo. */
  updateProfile(input: UpdateProfileInput): Promise<AuthUser>;
  /** Cambia la contraseña del usuario autenticado.
   *  Backend revoca refresh tokens de otros dispositivos. */
  changePassword(input: ChangePasswordInput): Promise<void>;
  /** Cierra sesión en backend (revoca refresh token del dispositivo actual). */
  logout(): Promise<void>;
  /** Solicita email de recuperación de contraseña.
   *  Siempre responde 204 (anti-enumeración). */
  recoverPassword(input: RecoverPasswordInput): Promise<void>;
}
