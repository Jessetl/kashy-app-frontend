// Imports directos al composition / hooks de reset (no al barrel) para evitar
// ciclos. El composition de auth no toca presentation, así que es seguro.
import { logoutUseCase } from '@/modules/auth/composition';
import { resetDebtsModule } from '@/modules/debts/presentation/hooks/use-reset-debts';
import { resetShoppingListsModule } from '@/modules/shopping/presentation/hooks/useResetShoppingLists';
import type { AuthUser } from '@/shared/domain/auth/auth.types';
import { useAuthStore } from '@/shared/infrastructure/auth/auth.store';
import { useCallback } from 'react';

interface UseAuthReturn {
  /** Si el usuario está autenticado */
  isAuthenticated: boolean;
  /** Datos del usuario o null si es guest */
  user: AuthUser | null;
  /** Si se está restaurando la sesión al abrir la app */
  isRestoringSession: boolean;
  /** Cierra sesión: notifica backend (`POST /auth/logout`) y limpia local. */
  logout: () => void;
  /** Abre el modal de login, opcionalmente con acción pendiente post-login */
  openLoginModal: (pendingAction?: () => void) => void;
}

export function useAuth(): UseAuthReturn {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const isRestoringSession = useAuthStore((s) => s.isRestoringSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const openLoginModal = useAuthStore((s) => s.openLoginModal);

  const logout = useCallback(() => {
    // Fire-and-forget: el backend revoca el refresh token del dispositivo,
    // pero la limpieza local debe ocurrir siempre (incluso si el request falla
    // por red caída o 401). No bloqueamos UI.
    void logoutUseCase.execute().catch(() => {
      // no-op intencional
    });

    clearSession();
    resetShoppingListsModule();
    resetDebtsModule();
  }, [clearSession]);

  return {
    isAuthenticated,
    user,
    isRestoringSession,
    logout,
    openLoginModal,
  };
}
