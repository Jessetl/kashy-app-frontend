import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { Home, ShoppingBag, User, Wallet } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { CustomTabBar } from '@/shared/presentation/components/custom-tab-bar';

export default function TabsLayout() {
  const colors = useThemeColors();

  return (
    <View style={styles.root}>
      {/* Gradient como fondo absoluto — no interfiere con el layout de Tabs */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          sceneStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Tabs.Screen
          name='index'
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Home size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name='supermarket'
          options={{
            title: 'Supermercado',
            tabBarIcon: ({ color, size }) => (
              <ShoppingBag size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name='debts'
          options={{
            title: 'Deudas',
            tabBarIcon: ({ color, size }) => (
              <Wallet size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name='profile'
          options={{
            title: 'Perfil',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <User size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
