import { ApiHttpError } from '@/shared/infrastructure/api';
import { useAuthStore } from '@/shared/infrastructure/auth/auth.store';
import { useEffect, useRef } from 'react';

import { refreshTokenUseCase } from '../../composition';

/**
 * Hook que restaura la sesión al montar la app.
 *
 * Si hay un accessToken guardado en storage persistente, intenta renovar el
 * token silenciosamente vía `/auth/refresh`. El refresh token vive solo en el
 * backend; el frontend solo envía el JWT actual/expirado como
 * proof-of-possession (lo maneja el datasource a partir del store).
 *
 * - 4xx en refresh → sesión inválida o revocada → limpiar y volver a guest.
 * - 5xx o error de red → mantener sesión local; los próximos requests podrán
 *   reintentar.
 *
 * En cualquier caso marca `isRestoringSession = false` al terminar.
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

      const { isAuthenticated, accessToken } = useAuthStore.getState();

      if (!isAuthenticated || !accessToken) {
        setRestoringSession(false);
        return;
      }

      try {
        const newTokens = await refreshTokenUseCase.execute();
        updateTokens(newTokens);
      } catch (err) {
        if (__DEV__) {
          console.warn('[SessionRestore] Error al restaurar sesión', err);
        }
        if (!(err instanceof ApiHttpError)) {
          return;
        }

        if (err.status >= 500) {
          return;
        }

        clearSession();
      } finally {
        setRestoringSession(false);
      }
    }

    void restore();
  }, [clearSession, hydrateSession, setRestoringSession, updateTokens]);
}
