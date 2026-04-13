import { AuthModal } from '@/modules/auth/presentation/components/auth-modal';
import { useSessionRestore } from '@/modules/auth/presentation/hooks/use-session-restore';
import { useAuthStore } from '@/shared/infrastructure/auth/auth.store';
import { useLocationStore } from '@/shared/infrastructure/location/location.store';
import { AppThemeProvider } from '@/shared/infrastructure/theme';
import { usePushNotifications } from '@/shared/presentation/hooks/use-push-notifications';
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

function AuthModalGlobal() {
  const isVisible = useAuthStore((s) => s.isLoginModalVisible);
  const close = useAuthStore((s) => s.closeLoginModal);

  return <AuthModal visible={isVisible} onClose={close} />;
}

function AppContent() {
  // Restaurar sesión silenciosamente al abrir la app
  useSessionRestore();

  // Inicializar push notifications (permisos, token, listeners)
  usePushNotifications();

  // Solicitar permisos de localización al iniciar la app
  const requestLocation = useLocationStore((s) => s.requestLocation);
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name='(tabs)' />
      </Stack>
      <AuthModalGlobal />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AppThemeProvider>
        <AppContent />
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
