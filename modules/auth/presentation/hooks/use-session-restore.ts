import { ApiHttpError } from '@/shared/infrastructure/api';
import { useAuthStore } from '@/shared/infrastructure/auth/auth.store';
import { useEffect, useRef } from 'react';

import { refreshTokenUseCase } from '../../composition';

/**
 * Hook que restaura la sesión al montar la app.
 *
 * Si hay sesión persistida en SecureStore, intenta renovar los tokens
 * silenciosamente vía `/auth/refresh`, enviando el `refreshToken` guardado
 * (lo maneja el datasource a partir del store).
 *
 * - 4xx en refresh → sesión inválida o revocada → limpiar y volver a guest.
 * - 5xx o error de red → mantener sesión local; los próximos requests podrán
 *   reintentar.
 *
 * En cualquier caso marca `isRestoringSession = false` al terminar.
 */
export const useSessionRestore = (): void => {
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
        await updateTokens(newTokens);
      } catch (err) {
        if (!(err instanceof ApiHttpError)) {
          return;
        }

        if (err.status >= 500) {
          return;
        }

        await clearSession();
      } finally {
        setRestoringSession(false);
      }
    }

    void restore();
  }, [clearSession, hydrateSession, setRestoringSession, updateTokens]);
};
