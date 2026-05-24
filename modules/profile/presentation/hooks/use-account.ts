import {
  useChangePassword,
  useUpdateProfile,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from '@/modules/auth';

interface UseAccountReturn {
  isUpdatingProfile: boolean;
  isChangingPassword: boolean;
  updateProfile: (input: UpdateProfileInput) => Promise<boolean>;
  changePassword: (input: ChangePasswordInput) => Promise<boolean>;
  profileError: string | null;
  passwordError: string | null;
  profileFieldErrors: Record<string, string> | null;
  passwordFieldErrors: Record<string, string> | null;
  clearProfileError: () => void;
  clearPasswordError: () => void;
}

/** Facade del módulo profile sobre las primitivas de auth.
 *  Mantiene la firma usada por `account.screen.tsx`. */
export function useAccount(): UseAccountReturn {
  const {
    isLoading: isUpdatingProfile,
    error: profileError,
    fieldErrors: profileFieldErrors,
    updateProfile,
    clearError: clearProfileError,
  } = useUpdateProfile();

  const {
    isLoading: isChangingPassword,
    error: passwordError,
    fieldErrors: passwordFieldErrors,
    changePassword,
    clearError: clearPasswordError,
  } = useChangePassword();

  return {
    isUpdatingProfile,
    isChangingPassword,
    updateProfile,
    changePassword,
    profileError,
    passwordError,
    profileFieldErrors,
    passwordFieldErrors,
    clearProfileError,
    clearPasswordError,
  };
}
