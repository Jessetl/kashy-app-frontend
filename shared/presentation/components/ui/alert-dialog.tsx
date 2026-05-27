import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export type AlertActionVariant = 'default' | 'destructive' | 'cancel';
export type AlertTone = 'default' | 'danger' | 'success' | 'info';

export interface AlertAction {
  label: string;
  onPress?: () => void;
  variant?: AlertActionVariant;
}

interface AlertDialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  /** Acciones. Cancel siempre se renderiza al fondo. */
  actions: AlertAction[];
  /** Tono visual del icono header. Omitir = sin icono. */
  tone?: AlertTone;
}

const TONE_ICONS = {
  default: Info,
  danger: AlertTriangle,
  success: CheckCircle2,
  info: Info,
} as const;

export const AlertDialog = React.memo(function AlertDialog({
  visible,
  onClose,
  title,
  message,
  actions,
  tone,
}: AlertDialogProps) {
  const colors = useThemeColors();

  const cardScale = useSharedValue(0.92);
  const cardOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 180 });
      cardOpacity.value = withTiming(1, { duration: 180 });
      cardScale.value = withSpring(1, {
        damping: 22,
        stiffness: 280,
        mass: 0.6,
      });
    } else {
      backdropOpacity.value = 0;
      cardOpacity.value = 0;
      cardScale.value = 0.92;
    }
  }, [visible, backdropOpacity, cardOpacity, cardScale]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const orderedActions = useMemo(() => {
    const cancel = actions.find((a) => a.variant === 'cancel');
    const others = actions.filter((a) => a.variant !== 'cancel');
    return cancel ? [...others, cancel] : actions;
  }, [actions]);

  const toneColors = useMemo(() => {
    if (!tone || tone === 'default') return null;
    if (tone === 'danger') {
      return { fg: colors.danger, bg: colors.dangerLight };
    }
    if (tone === 'success') {
      return { fg: colors.success, bg: colors.successLight };
    }
    return { fg: colors.primary, bg: colors.primaryLight };
  }, [tone, colors]);

  const ToneIcon = tone ? TONE_ICONS[tone] : null;

  const handleActionPress = (action: AlertAction) => {
    action.onPress?.();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType='none'
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
          />
        </Pressable>

        <View style={styles.centeredContainer} pointerEvents='box-none'>
          <Animated.View
            style={[
              styles.dialog,
              { backgroundColor: colors.backgroundSecondary },
              cardStyle,
            ]}
          >
            <View style={styles.body}>
              {ToneIcon && toneColors ? (
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: toneColors.bg },
                  ]}
                >
                  <ToneIcon
                    size={26}
                    color={toneColors.fg}
                    strokeWidth={2.2}
                  />
                </View>
              ) : null}
              <Text
                style={[
                  styles.title,
                  { color: colors.textOnSurface },
                  ToneIcon && styles.titleCentered,
                ]}
              >
                {title}
              </Text>
              {message ? (
                <Text
                  style={[
                    styles.message,
                    { color: colors.textSecondary },
                    ToneIcon && styles.messageCentered,
                  ]}
                >
                  {message}
                </Text>
              ) : null}
            </View>

            <View
              style={[
                styles.actionsContainer,
                { borderTopColor: colors.borderLight },
              ]}
            >
              {orderedActions.map((action, idx) => {
                const isCancel = action.variant === 'cancel';
                const isDestructive = action.variant === 'destructive';
                const labelColor = isDestructive
                  ? colors.danger
                  : isCancel
                  ? colors.textSecondary
                  : colors.primary;
                const labelWeight = isCancel ? '500' : '700';

                return (
                  <React.Fragment key={`${action.label}-${idx}`}>
                    {idx > 0 ? (
                      <View
                        style={[
                          styles.actionDivider,
                          { backgroundColor: colors.borderLight },
                        ]}
                      />
                    ) : null}
                    <AppPressable
                      onPress={() => handleActionPress(action)}
                      accessibilityRole='button'
                      style={styles.actionButton}
                    >
                      <Text
                        style={[
                          styles.actionText,
                          { color: labelColor, fontWeight: labelWeight },
                        ]}
                      >
                        {action.label}
                      </Text>
                    </AppPressable>
                  </React.Fragment>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  body: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    alignSelf: 'stretch',
    textAlign: 'left',
  },
  titleCentered: {
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    alignSelf: 'stretch',
    textAlign: 'left',
  },
  messageCentered: {
    textAlign: 'center',
  },
  actionsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionDivider: {
    height: StyleSheet.hairlineWidth,
  },
  actionButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 15,
    letterSpacing: 0.1,
  },
});
