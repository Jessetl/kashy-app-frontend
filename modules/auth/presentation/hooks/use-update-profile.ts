import { ApiHttpError } from '@/shared/infrastructure/api';
import { useAuthStore } from '@/shared/infrastructure/auth/auth.store';
import { useCallback, useState } from 'react';

import { updateProfileUseCase } from '../../composition';
import type { UpdateProfileInput } from '../../domain/auth.entity';

interface UseUpdateProfileReturn {
  isLoading: boolean;
  error: string | null;
  /** Errores por campo del backend (422). */
  fieldErrors: Record<string, string> | null;
  updateProfile: (input: UpdateProfileInput) => Promise<boolean>;
  clearError: () => void;
  clearFieldErrors: () => void;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiHttpError) {
    return err.message;
  }
  return err instanceof Error ? err.message : 'No se pudo actualizar el perfil';
}

export function useUpdateProfile(): UseUpdateProfileReturn {
  const updateUser = useAuthStore((s) => s.updateUser);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(
    null,
  );

  const clearError = useCallback(() => setError(null), []);
  const clearFieldErrors = useCallback(() => setFieldErrors(null), []);

  const updateProfile = useCallback(
    async (input: UpdateProfileInput): Promise<boolean> => {
      setError(null);
      setFieldErrors(null);
      setIsLoading(true);
      try {
        const user = await updateProfileUseCase.execute(input);
        updateUser(user);
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
    [updateUser],
  );

  return {
    isLoading,
    error,
    fieldErrors,
    updateProfile,
    clearError,
    clearFieldErrors,
  };
}
