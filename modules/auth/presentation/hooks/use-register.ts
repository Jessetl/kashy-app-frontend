import { ApiHttpError } from '@/shared/infrastructure/api';
import {
  DEFAULT_COUNTRY_CODE,
  type CountryCode,
} from '@/shared/domain/country/country.constants';
import { useCountryStore } from '@/shared/infrastructure/country/country.store';
import { useLocationStore } from '@/shared/infrastructure/location/location.store';
import { useCallback, useState } from 'react';

import { registerUseCase } from '../../composition';
import type { RegisterCredentials } from '../../domain/auth.entity';

export interface RegisterFormValues {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country: CountryCode;
}

interface UseRegisterReturn {
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  submitRegister: (values: RegisterFormValues) => Promise<void>;
  clearError: () => void;
}

function getRegisterErrorMessage(err: unknown): string {
  if (err instanceof ApiHttpError) {
    if (err.code === 'AUTH_EMAIL_ALREADY_EXISTS') {
      return 'Este correo ya está registrado';
    }
    return err.message;
  }
  return err instanceof Error ? err.message : 'Error al crear la cuenta';
}

export function useRegister(): UseRegisterReturn {
  const coords = useLocationStore((s) => s.coords);
  const setCountry = useCountryStore((s) => s.setCountry);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const submitRegister = useCallback(
    async (values: RegisterFormValues) => {
      setError(null);
      setSuccessMessage(null);
      setIsLoading(true);

      try {
        const credentials: RegisterCredentials = {
          ...values,
          country: values.country ?? DEFAULT_COUNTRY_CODE,
          locationLatitude: coords?.latitude ?? 0,
          locationLongitude: coords?.longitude ?? 0,
        };

        setCountry(credentials.country);

        await registerUseCase.execute(credentials);

        setSuccessMessage(
          'Cuenta creada exitosamente. Revisa tu correo electrónico para verificar tu cuenta antes de iniciar sesión.',
        );
      } catch (err) {
        setError(getRegisterErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [coords, setCountry],
  );

  return {
    isLoading,
    error,
    successMessage,
    submitRegister,
    clearError,
  };
}
