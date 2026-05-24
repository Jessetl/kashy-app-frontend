import { ApiHttpError } from '@/shared/infrastructure/api';
import { useCallback, useState } from 'react';

import { recoverPasswordUseCase } from '../../composition';

interface UseRecoverPasswordReturn {
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  submitRecover: (email: string) => Promise<void>;
  clearError: () => void;
  clearSuccess: () => void;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiHttpError) {
    return err.message;
  }
  return err instanceof Error
    ? err.message
    : 'No se pudo enviar el correo de recuperación';
}

export function useRecoverPassword(): UseRecoverPasswordReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccessMessage(null), []);

  const submitRecover = useCallback(async (email: string) => {
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      await recoverPasswordUseCase.execute({ email });
      setSuccessMessage('Revisa tu correo para recuperar tu contraseña.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    successMessage,
    submitRecover,
    clearError,
    clearSuccess,
  };
}
