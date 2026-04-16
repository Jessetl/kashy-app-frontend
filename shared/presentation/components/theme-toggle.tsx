import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { markThemeToggleStart } from '@/shared/presentation/devtools/theme-profiler';
import {
  useIsDarkMode,
  useThemeActions,
  useThemeColor,
} from '@/shared/presentation/hooks/use-app-theme';
import { triggerLightImpactHaptic } from '@/shared/presentation/utils/haptics';
import { Moon, Sun } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const ICON_SIZE = 22;
const BUTTON_SIZE = 40;
const MIN_TOGGLE_INTERVAL_MS = 100;

const AnimatedPressable = Animated.createAnimatedComponent(AppPressable);

export const ThemeToggle = React.memo(function ThemeToggle() {
  const lastToggleAtRef = useRef(0);
  const isDark = useIsDarkMode();
  const { toggleTheme } = useThemeActions();
  const text = useThemeColor('text');
  const rotation = useSharedValue(isDark ? 1 : 0);

  useEffect(() => {
    rotation.value = withSpring(isDark ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isDark, rotation]);

  const handleToggle = useCallback(() => {
    const now = Date.now();

    if (now - lastToggleAtRef.current < MIN_TOGGLE_INTERVAL_MS) {
      return;
    }

    lastToggleAtRef.current = now;

    markThemeToggleStart();

    rotation.value = withSpring(isDark ? 0 : 1, {
      damping: 15,
      stiffness: 150,
    });

    toggleTheme();

    // Haptic feedback sutil al cambiar tema
    requestAnimationFrame(() => {
      void triggerLightImpactHaptic();
    });
  }, [isDark, toggleTheme, rotation]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(
          rotation.value,
          [0, 1],
          [0, 180],
          Extrapolation.CLAMP,
        )}deg`,
      },
    ],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    backgroundColor: 'rgba(255,255,255,0.15)',
  }));

  return (
    <AnimatedPressable
      onPress={handleToggle}
      style={[styles.button, animatedButtonStyle]}
      accessibilityRole='switch'
      accessibilityState={{ checked: isDark }}
      accessibilityLabel={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
    >
      <Animated.View pointerEvents='none' style={animatedIconStyle}>
        {isDark ? (
          <Moon size={ICON_SIZE} color={text} strokeWidth={2} />
        ) : (
          <Sun size={ICON_SIZE} color={text} strokeWidth={2} />
        )}
      </Animated.View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
