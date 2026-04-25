import { ApiHttpError } from '@/shared/infrastructure/api/api-http-error';
import { useAuthStore } from '@/shared/infrastructure/auth/auth.store';
import { useCallback, useState } from 'react';

import {
  changePasswordUseCase,
  updateProfileUseCase,
} from '../../composition';
import type {
  ChangePasswordInput,
  UpdateProfileInput,
} from '../../domain/entities/user-profile.entity';

interface UseAccountReturn {
  isUpdatingProfile: boolean;
  isChangingPassword: boolean;
  updateProfile: (input: UpdateProfileInput) => Promise<boolean>;
  changePassword: (input: ChangePasswordInput) => Promise<boolean>;
  profileError: string | null;
  passwordError: string | null;
  clearProfileError: () => void;
  clearPasswordError: () => void;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiHttpError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

export function useAccount(): UseAccountReturn {
  const updateUser = useAuthStore((s) => s.updateUser);

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const updateProfile = useCallback(
    async (input: UpdateProfileInput): Promise<boolean> => {
      setProfileError(null);
      setIsUpdatingProfile(true);
      try {
        const normalized = await updateProfileUseCase.execute(input);
        updateUser({
          firstName: normalized.firstName,
          lastName: normalized.lastName,
        });
        return true;
      } catch (err) {
        setProfileError(getErrorMessage(err, 'No se pudo actualizar el nombre.'));
        return false;
      } finally {
        setIsUpdatingProfile(false);
      }
    },
    [updateUser],
  );

  const changePassword = useCallback(
    async (input: ChangePasswordInput): Promise<boolean> => {
      setPasswordError(null);
      setIsChangingPassword(true);
      try {
        await changePasswordUseCase.execute(input);
        return true;
      } catch (err) {
        setPasswordError(
          getErrorMessage(err, 'No se pudo cambiar la contraseña.'),
        );
        return false;
      } finally {
        setIsChangingPassword(false);
      }
    },
    [],
  );

  return {
    isUpdatingProfile,
    isChangingPassword,
    updateProfile,
    changePassword,
    profileError,
    passwordError,
    clearProfileError: useCallback(() => setProfileError(null), []),
    clearPasswordError: useCallback(() => setPasswordError(null), []),
  };
}
