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
  countryCode: CountryCode;
}

interface UseRegisterReturn {
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  /** Errores por campo del backend (422). El form los aplica vía `setError`. */
  fieldErrors: Record<string, string> | null;
  submitRegister: (values: RegisterFormValues) => Promise<void>;
  clearError: () => void;
  clearFieldErrors: () => void;
}

function getRegisterErrorMessage(err: unknown): string {
  if (err instanceof ApiHttpError) {
    if (err.status === 409) {
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(
    null,
  );

  const clearError = useCallback(() => setError(null), []);
  const clearFieldErrors = useCallback(() => setFieldErrors(null), []);

  const submitRegister = useCallback(
    async (values: RegisterFormValues) => {
      setError(null);
      setFieldErrors(null);
      setSuccessMessage(null);
      setIsLoading(true);

      try {
        const credentials: RegisterCredentials = {
          email: values.email.trim(),
          password: values.password,
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          countryCode: values.countryCode ?? DEFAULT_COUNTRY_CODE,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
        };

        setCountry(credentials.countryCode);

        await registerUseCase.execute(credentials);

        setSuccessMessage(
          'Cuenta creada exitosamente. Revisa tu correo electrónico para verificar tu cuenta antes de iniciar sesión.',
        );
      } catch (err) {
        if (err instanceof ApiHttpError && err.status === 422 && err.fields?.length) {
          setFieldErrors(err.toFieldErrorMap());
        }
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
    fieldErrors,
    submitRegister,
    clearError,
    clearFieldErrors,
  };
}
