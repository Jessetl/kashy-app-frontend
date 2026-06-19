import type {
  AuthSession,
  AuthTokens,
  AuthUser,
} from '@/shared/domain/auth/auth.types';
import { create } from 'zustand';
import { secureStorage } from '../storage/app-storage';

const AUTH_SESSION_KEY = 'auth-session';
/** Key separada para el refresh token (el crítico). Nunca en el mismo blob
 *  que se loguea/serializa por error. */
const REFRESH_TOKEN_KEY = 'auth-refresh-token';

type PersistedAuthSession = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
};

interface AuthState {
  /** Si el store ya terminó de hidratarse desde persistencia */
  hasHydrated: boolean;
  /** Si el usuario está autenticado */
  isAuthenticated: boolean;
  /** Datos del usuario autenticado */
  user: AuthUser | null;
  /** Access token actual (JWT custom del backend, ~15 min de vida) */
  accessToken: string | null;
  /** Refresh token de Firebase (larga vida). Copia en memoria; la fuente de
   *  verdad persistente es SecureStore bajo `REFRESH_TOKEN_KEY`. */
  refreshToken: string | null;
  /** Si la sesión se está restaurando al abrir la app */
  isRestoringSession: boolean;
  /** Si el modal de login está visible */
  isLoginModalVisible: boolean;
  /** Acción pendiente a ejecutar tras login exitoso */
  pendingAction: (() => void) | null;

  /** Guarda la sesión completa tras login exitoso.
   *  Escribe SecureStore (fuente de verdad) ANTES que Zustand. */
  setSession: (session: AuthSession) => Promise<void>;
  /** Actualiza solo los tokens (tras refresh). SecureStore antes que Zustand. */
  updateTokens: (tokens: AuthTokens) => Promise<void>;
  /** Actualiza los datos del usuario en store y persistencia */
  updateUser: (user: Partial<AuthUser>) => Promise<void>;
  /** Limpia toda la sesión (logout). Borra ambos tokens de SecureStore. */
  clearSession: () => Promise<void>;
  /** Marca que la restauración terminó */
  setRestoringSession: (value: boolean) => void;
  /** Marca que la hidratación del store terminó */
  setHasHydrated: (value: boolean) => void;
  /** Hidrata la sesión persistida en SecureStore */
  hydrateSession: () => Promise<void>;
  /** Abre el modal de login, opcionalmente con una acción pendiente post-login */
  openLoginModal: (pendingAction?: () => void) => void;
  /** Cierra el modal de login y limpia la acción pendiente */
  closeLoginModal: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  hasHydrated: false,
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  isRestoringSession: true,
  isLoginModalVisible: false,
  pendingAction: null,

  setSession: async (session: AuthSession) => {
    const persistedSession: PersistedAuthSession = {
      isAuthenticated: true,
      user: session.user,
      accessToken: session.tokens.accessToken,
    };

    const { pendingAction } = get();

    // SecureStore primero (fuente de verdad), Zustand después.
    await secureStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify(persistedSession),
    );
    await secureStorage.setItem(REFRESH_TOKEN_KEY, session.tokens.refreshToken);

    set({
      ...persistedSession,
      refreshToken: session.tokens.refreshToken,
      isLoginModalVisible: false,
      pendingAction: null,
    });

    if (pendingAction) {
      queueMicrotask(pendingAction);
    }
  },

  updateUser: async (updates: Partial<AuthUser>) => {
    const state = get();
    const updatedUser = state.user ? { ...state.user, ...updates } : null;

    const persistedSession: PersistedAuthSession = {
      isAuthenticated: state.isAuthenticated,
      user: updatedUser,
      accessToken: state.accessToken,
    };

    await secureStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify(persistedSession),
    );

    set({ user: updatedUser });
  },

  updateTokens: async (tokens: AuthTokens) => {
    const state = get();
    const persistedSession: PersistedAuthSession = {
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      accessToken: tokens.accessToken,
    };

    // Sobrescribir SIEMPRE ambos tokens (Firebase puede rotar el refresh).
    await secureStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify(persistedSession),
    );
    await secureStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);

    set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  },

  clearSession: async () => {
    await secureStorage.removeItem(AUTH_SESSION_KEY);
    await secureStorage.removeItem(REFRESH_TOKEN_KEY);

    set({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
    });
  },

  setRestoringSession: (value: boolean) => set({ isRestoringSession: value }),

  setHasHydrated: (value: boolean) => set({ hasHydrated: value }),

  hydrateSession: async () => {
    if (get().hasHydrated) {
      return;
    }

    const [raw, refreshToken] = await Promise.all([
      secureStorage.getItem(AUTH_SESSION_KEY),
      secureStorage.getItem(REFRESH_TOKEN_KEY),
    ]);

    if (!raw) {
      set({ hasHydrated: true });
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PersistedAuthSession;

      set({
        isAuthenticated: parsed.isAuthenticated,
        user: parsed.user,
        accessToken: parsed.accessToken,
        refreshToken,
        hasHydrated: true,
      });
    } catch {
      await secureStorage.removeItem(AUTH_SESSION_KEY);
      await secureStorage.removeItem(REFRESH_TOKEN_KEY);
      set({ hasHydrated: true });
    }
  },

  openLoginModal: (pendingAction?: () => void) =>
    set({ isLoginModalVisible: true, pendingAction: pendingAction ?? null }),
  closeLoginModal: () =>
    set({ isLoginModalVisible: false, pendingAction: null }),
}));

// --- Selectores para uso fuera de React (api-client, interceptors) ---

/** Obtiene el access token actual de forma síncrona. */
export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

/** Obtiene el refresh token actual de forma síncrona (para el interceptor). */
export function getRefreshToken(): string | null {
  return useAuthStore.getState().refreshToken;
}

/** Actualiza tokens desde el interceptor de refresh.
 *  Devuelve la promesa de escritura en SecureStore; el caller puede ignorarla
 *  porque el reintento usa el accessToken devuelto directamente. */
export function updateTokensSync(tokens: AuthTokens): Promise<void> {
  return useAuthStore.getState().updateTokens(tokens);
}

/** Limpia sesión desde el interceptor cuando el refresh falla. */
export function clearSessionSync(): Promise<void> {
  return useAuthStore.getState().clearSession();
}
