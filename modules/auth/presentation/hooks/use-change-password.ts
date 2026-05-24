import { ApiHttpError } from '@/shared/infrastructure/api';
import { useCallback, useState } from 'react';

import { changePasswordUseCase } from '../../composition';
import type { ChangePasswordInput } from '../../domain/auth.entity';

interface UseChangePasswordReturn {
  isLoading: boolean;
  error: string | null;
  /** Errores por campo del backend (422). */
  fieldErrors: Record<string, string> | null;
  changePassword: (input: ChangePasswordInput) => Promise<boolean>;
  clearError: () => void;
  clearFieldErrors: () => void;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiHttpError) {
    return err.message;
  }
  return err instanceof Error
    ? err.message
    : 'No se pudo cambiar la contraseña';
}

export function useChangePassword(): UseChangePasswordReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(
    null,
  );

  const clearError = useCallback(() => setError(null), []);
  const clearFieldErrors = useCallback(() => setFieldErrors(null), []);

  const changePassword = useCallback(
    async (input: ChangePasswordInput): Promise<boolean> => {
      setError(null);
      setFieldErrors(null);
      setIsLoading(true);
      try {
        await changePasswordUseCase.execute(input);
        return true;
      } catch (err) {
        if (err instanceof ApiHttpError && err.status === 422 && err.fields?.length) {
          setFieldErrors(err.toFieldErrorMap());
        }
        setError(getErrorMessage(err));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    isLoading,
    error,
    fieldErrors,
    changePassword,
    clearError,
    clearFieldErrors,
  };
}
