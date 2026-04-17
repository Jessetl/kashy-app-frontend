import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import { X } from 'lucide-react-native';
import React, { useCallback, useEffect } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 150;

interface BottomSheetModalProps {
  /** Si el modal está visible */
  visible: boolean;
  /** Callback al cerrar (por gesto, backdrop, o botón X) */
  onClose: () => void;
  /** Callback adicional al cerrar (ej: resetForm). Se ejecuta DESPUÉS de la animación */
  onDismiss?: () => void;
  /** Altura como porcentaje de pantalla (0-1). Default: 0.75 */
  heightRatio?: number;
  /** Mostrar botón X. Default: true */
  showCloseButton?: boolean;
  /** Contenido del modal */
  children: React.ReactNode;
}

export const BottomSheetModal = React.memo(function BottomSheetModal({
  visible,
  onClose,
  onDismiss,
  heightRatio = 0.75,
  showCloseButton = true,
  children,
}: BottomSheetModalProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const modalHeight = SCREEN_HEIGHT * heightRatio;

  const translateY = useSharedValue(modalHeight);
  const backdropOpacity = useSharedValue(0);

  const dismiss = useCallback(() => {
    Keyboard.dismiss();
    translateY.value = withTiming(modalHeight, { duration: 300 });
    backdropOpacity.value = withTiming(0, { duration: 300 });
    setTimeout(() => {
      onDismiss?.();
      onClose();
    }, 300);
  }, [translateY, backdropOpacity, modalHeight, onClose, onDismiss]);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 150,
        mass: 0.8,
      });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [visible, translateY, backdropOpacity]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_THRESHOLD) {
        translateY.value = withTiming(modalHeight, { duration: 300 });
        backdropOpacity.value = withTiming(0, { duration: 300 });
        runOnJS(onClose)();
        if (onDismiss) {
          runOnJS(onDismiss)();
        }
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 150 });
      }
    });

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      backdropOpacity.value,
      [0, 1],
      [0, 0.6],
      Extrapolation.CLAMP,
    ),
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents='box-none'>
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, animatedBackdropStyle]}
        pointerEvents='auto'
      >
        <AppPressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.backgroundSecondary,
            paddingBottom: insets.bottom + 20,
            height: modalHeight,
          },
          animatedModalStyle,
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <View style={styles.content}>
            {/* Drag Handle — only this area listens to the dismiss-by-drag
                gesture, so any ScrollView/FlatList rendered as children can
                scroll freely without competing with the sheet's pan. */}
            <GestureDetector gesture={panGesture}>
              <View style={styles.handleContainer}>
                <View
                  style={[styles.handle, { backgroundColor: colors.border }]}
                />
              </View>
            </GestureDetector>

            {/* Close Button */}
            {showCloseButton && (
              <AppPressable
                onPress={dismiss}
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.backgroundTertiary },
                ]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X
                  pointerEvents='none'
                  size={20}
                  color={colors.textOnSurface}
                  strokeWidth={2.5}
                />
              </AppPressable>
            )}

            {children}
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  handleContainer: {
    alignItems: 'center',
    // Taller touch target so users can grab the handle without needing to
    // hit the tiny 40x4 pill exactly.
    paddingTop: 12,
    paddingBottom: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
