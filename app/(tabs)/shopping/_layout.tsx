import { useGuestSyncOnLogin } from '@/modules/shopping/presentation/hooks/useGuestSyncOnLogin';
import { useNetInfoSyncFlusher } from '@/modules/shopping/presentation/hooks/useNetInfoSyncFlusher';
import { Stack } from 'expo-router';
import React from 'react';

export default function ShoppingLayout() {
  // Conecta NetInfo → store.setOnline + hidrata syncQueue persistida (Flow 12).
  useNetInfoSyncFlusher();
  // Detecta transición guest → auth y promueve listas locales (Flow 11).
  useGuestSyncOnLogin();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='index' />
      <Stack.Screen
        name='[listId]'
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name='compare'
        options={{ animation: 'slide_from_right' }}
      />
    </Stack>
  );
}
