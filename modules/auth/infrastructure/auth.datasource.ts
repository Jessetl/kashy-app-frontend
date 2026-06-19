import {
  ApiHttpError,
  apiClient,
  refreshTokenOnce,
} from '@/shared/infrastructure/api';

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
} from '../domain/auth.entity';
import type { AuthPort } from '../domain/auth.port';

interface LoginResponsePayload {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: AuthUser;
}

function toAuthTokens(payload: LoginResponsePayload): AuthTokens {
  const accessToken = payload.accessToken;
  const refreshToken = payload.refreshToken;
  const expiresIn = payload.expiresIn ?? 900;

  if (!accessToken || !refreshToken) {
    throw new Error('Respuesta de autenticación inválida: faltan tokens');
  }

  return { accessToken, refreshToken, expiresIn };
}

function toAuthSession(payload: LoginResponsePayload): AuthSession {
  if (!payload.user) {
    throw new Error('Respuesta de autenticación inválida: falta user');
  }

  return {
    tokens: toAuthTokens(payload),
    user: payload.user,
  };
}

function toAuthUser(payload: unknown): AuthUser {
  const user = payload as Partial<AuthUser> | null;
  if (!user || typeof user.id !== 'string' || typeof user.email !== 'string') {
    throw new Error('Respuesta de perfil inválida');
  }
  return user as AuthUser;
}

/** Implementación del puerto de autenticación contra el backend `/auth/*`. */
export class AuthDatasource implements AuthPort {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const response = await apiClient<LoginResponsePayload>('/auth/login', {
      method: 'POST',
      body: credentials,
      skipAuth: true,
    });
    return toAuthSession(response.data);
  }

  async register(credentials: RegisterCredentials): Promise<void> {
    await apiClient('/auth/register', {
      method: 'POST',
      body: credentials,
      skipAuth: true,
      // El guideline indica que `/auth/register` no requiere headers de device.
      skipDeviceHeaders: true,
    });
  }

  async googleAuth(credentials: GoogleAuthCredentials): Promise<AuthSession> {
    const response = await apiClient<LoginResponsePayload>(
      '/auth/login/google',
      {
        method: 'POST',
        body: credentials,
        skipAuth: true,
      },
    );
    return toAuthSession(response.data);
  }

  async refreshToken(): Promise<AuthTokens> {
    // Reusa el refresh único compartido con el interceptor 401 (mismo mutex,
    // misma escritura en SecureStore). Devuelve null si falla → 401 al caller.
    const tokens = await refreshTokenOnce();

    if (!tokens) {
      throw new ApiHttpError({
        message: 'No se pudo renovar la sesión',
        status: 401,
      });
    }

    return tokens;
  }

  async getProfile(): Promise<AuthUser> {
    const response = await apiClient<AuthUser>('/auth/profile');
    return toAuthUser(response.data);
  }

  async updateProfile(input: UpdateProfileInput): Promise<AuthUser> {
    const response = await apiClient<AuthUser>('/auth/profile', {
      method: 'PATCH',
      body: input,
    });
    return toAuthUser(response.data);
  }

  async changePassword(input: ChangePasswordInput): Promise<void> {
    await apiClient('/auth/change-password', {
      method: 'POST',
      body: input,
    });
  }

  async logout(): Promise<void> {
    await apiClient('/auth/logout', { method: 'POST' });
  }

  async recoverPassword(input: RecoverPasswordInput): Promise<void> {
    await apiClient('/auth/recover-password', {
      method: 'POST',
      body: input,
      skipAuth: true,
      skipDeviceHeaders: true,
    });
  }
}
