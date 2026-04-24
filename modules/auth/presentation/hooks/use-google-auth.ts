import { ApiHttpError } from '@/shared/infrastructure/api';
import { useAuthStore } from '@/shared/infrastructure/auth/auth.store';
import {
  DEFAULT_COUNTRY_CODE,
  type CountryCode,
} from '@/shared/infrastructure/country/country.constants';
import { useCountryStore } from '@/shared/infrastructure/country/country.store';
import { useLocationStore } from '@/shared/infrastructure/location/location.store';
import auth from '@react-native-firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GoogleAuthUseCase } from '../../application/google-auth.use-case';
import { AuthDatasource } from '../../infrastructure/auth.datasource';

WebBrowser.maybeCompleteAuthSession();

// IDs de cliente de Google — puedes sobreescribirlos con EXPO_PUBLIC_GOOGLE_*.
const GOOGLE_CONFIG = {
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
} as const;

function getGoogleNativeScheme(clientId?: string): string | undefined {
  if (!clientId) {
    return undefined;
  }

  return `com.googleusercontent.apps.${clientId.replace(
    '.apps.googleusercontent.com',
    '',
  )}`;
}

const googleAuthUseCase = new GoogleAuthUseCase(new AuthDatasource());

function getGoogleAuthErrorMessage(err: unknown): string {
  if (err instanceof ApiHttpError) {
    return err.message;
  }
  return err instanceof Error
    ? err.message
    : 'Error al autenticarse con Google';
}

interface UseGoogleAuthOptions {
  country?: CountryCode;
  onSuccess?: () => void;
}

interface UseGoogleAuthReturn {
  promptAsync: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useGoogleAuth({
  country,
  onSuccess,
}: UseGoogleAuthOptions = {}): UseGoogleAuthReturn {
  const coords = useLocationStore((s) => s.coords);
  const storedCountry = useCountryStore((s) => s.countryCode);
  const setCountry = useCountryStore((s) => s.setCountry);
  const setSession = useAuthStore((s) => s.setSession);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const androidRedirectScheme = getGoogleNativeScheme(
    GOOGLE_CONFIG.androidClientId,
  );

  const iosRedirectScheme = getGoogleNativeScheme(GOOGLE_CONFIG.iosClientId);

  const redirectUri =
    Platform.OS === 'android' && androidRedirectScheme
      ? `${androidRedirectScheme}:/oauthredirect`
      : Platform.OS === 'ios' && iosRedirectScheme
        ? `${iosRedirectScheme}:/oauthredirect`
        : undefined;

  const authRequestConfig = {
    ...GOOGLE_CONFIG,
    redirectUri,
  };

  const [, response, promptAsyncInternal] = Google.useAuthRequest(
    authRequestConfig,
    {
      scheme: 'kashy',
    },
  );

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (response?.type !== 'success') {
      return;
    }

    const { authentication } = response;
    if (!authentication) {
      return;
    }

    const resolvedCountry = country ?? storedCountry ?? DEFAULT_COUNTRY_CODE;
    const { idToken, accessToken } = authentication;

    setIsLoading(true);
    setError(null);

    if (!idToken || !accessToken) {
      setError('No se recibieron tokens de Google');
      setIsLoading(false);
      return;
    }

    void auth()
      .signInWithCredential(
        auth.GoogleAuthProvider.credential(idToken, accessToken),
      )
      .then((credential) => credential.user.getIdToken(true))
      .then((firebaseIdToken) =>
        googleAuthUseCase.execute({
          idToken: firebaseIdToken,
          accessToken,
          country: resolvedCountry,
          locationLatitude: coords?.latitude ?? 0,
          locationLongitude: coords?.longitude ?? 0,
        }),
      )
      .then((session) => {
        setCountry(resolvedCountry);
        setSession(session);
        onSuccess?.();
      })
      .catch((err: unknown) => {
        setError(getGoogleAuthErrorMessage(err));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [
    response,
    country,
    storedCountry,
    setCountry,
    setSession,
    onSuccess,
    coords,
  ]);

  const promptAsync = useCallback(() => {
    if (
      !GOOGLE_CONFIG.androidClientId ||
      !GOOGLE_CONFIG.iosClientId ||
      !GOOGLE_CONFIG.webClientId
    ) {
      setError('Configuracion de Google incompleta.');
      return;
    }

    setError(null);
    void promptAsyncInternal();
  }, [promptAsyncInternal]);

  return { promptAsync, isLoading, error, clearError };
}
