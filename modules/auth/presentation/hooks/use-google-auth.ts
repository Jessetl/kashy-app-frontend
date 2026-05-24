import { ApiHttpError } from '@/shared/infrastructure/api';
import { useAuthStore } from '@/shared/infrastructure/auth/auth.store';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { googleAuthUseCase } from '../../composition';

WebBrowser.maybeCompleteAuthSession();

// IDs de cliente de Google — configurables vía EXPO_PUBLIC_GOOGLE_*.
const GOOGLE_CONFIG = {
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
} as const;

interface UseGoogleAuthOptions {
  onSuccess?: () => void;
}

interface UseGoogleAuthReturn {
  promptAsync: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const getGoogleNativeScheme = (clientId?: string): string | undefined => {
  if (!clientId) {
    return undefined;
  }

  return `com.googleusercontent.apps.${clientId.replace(
    '.apps.googleusercontent.com',
    '',
  )}`;
};

const getGoogleAuthErrorMessage = (err: unknown): string => {
  if (err instanceof ApiHttpError) {
    return err.message;
  }
  return err instanceof Error
    ? err.message
    : 'Error al autenticarse con Google';
};

export function useGoogleAuth({
  onSuccess,
}: UseGoogleAuthOptions = {}): UseGoogleAuthReturn {
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

  const [, response, promptAsyncInternal] = Google.useAuthRequest(
    {
      ...GOOGLE_CONFIG,
      redirectUri,
    },
    {
      scheme: 'kashy',
    },
  );

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (response?.type !== 'success') {
      return;
    }

    const googleIdToken = response.authentication?.idToken;
    if (!googleIdToken) {
      setError('No se recibió token de Google');
      return;
    }

    setIsLoading(true);
    setError(null);

    void googleAuthUseCase
      .execute({ googleIdToken })
      .then((session) => {
        setSession(session);
        onSuccess?.();
      })
      .catch((err: unknown) => {
        setError(getGoogleAuthErrorMessage(err));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [response, setSession, onSuccess]);

  const promptAsync = useCallback(() => {
    if (
      !GOOGLE_CONFIG.androidClientId ||
      !GOOGLE_CONFIG.iosClientId ||
      !GOOGLE_CONFIG.webClientId
    ) {
      setError('Configuración de Google incompleta.');
      return;
    }

    setError(null);
    void promptAsyncInternal();
  }, [promptAsyncInternal]);

  return { promptAsync, isLoading, error, clearError };
}
