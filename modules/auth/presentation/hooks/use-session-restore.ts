import { ApiHttpError } from '@/shared/infrastructure/api';
import { useAuthStore } from '@/shared/infrastructure/auth/auth.store';
import { useEffect, useRef } from 'react';

import { refreshTokenUseCase } from '../../composition';

/**
 * Hook que restaura la sesión al montar la app.
 *
 * Si hay un refreshToken guardado en storage persistente, intenta renovar los tokens
 * silenciosamente. Solo limpia la sesión cuando el refresh es inválido (4xx).
 * Ante errores transitorios de red/servidor, mantiene la sesión local.
 * En cualquier caso, marca `isRestoringSession = false` al terminar.
 */
export function useSessionRestore(): void {
  const hydrateSession = useAuthStore((s) => s.hydrateSession);
  const updateTokens = useAuthStore((s) => s.updateTokens);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setRestoringSession = useAuthStore((s) => s.setRestoringSession);
  const restoreAttemptedRef = useRef(false);

  useEffect(() => {
    if (restoreAttemptedRef.current) {
      return;
    }

    restoreAttemptedRef.current = true;

    async function restore() {
      await hydrateSession();

      const { isAuthenticated, refreshToken } = useAuthStore.getState();

      // Si no hay sesión previa, no hay nada que restaurar
      if (!isAuthenticated || !refreshToken) {
        setRestoringSession(false);
        return;
      }

      try {
        const newTokens = await refreshTokenUseCase.execute(refreshToken);
        updateTokens(newTokens);
      } catch (err) {
        if (__DEV__) {
          console.warn('[SessionRestore] Error al restaurar sesión', err);
        }
        if (!(err instanceof ApiHttpError)) {
          // Error de red/parseo: mantener sesión local y reintentar en próximas requests.
          return;
        }

        if (err.status >= 500) {
          // Backend temporalmente caído: no degradar a guest por un fallo transitorio.
          return;
        }

        // Refresh inválido (4xx) — sesión expirada, volver a guest
        clearSession();
      } finally {
        setRestoringSession(false);
      }
    }

    restore();
  }, [clearSession, hydrateSession, setRestoringSession, updateTokens]);
}
