import { Stack } from 'expo-router';
import React from 'react';

export default function ShoppingLayout() {
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
