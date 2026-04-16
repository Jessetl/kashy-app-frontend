import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useThemeColor } from '@/shared/presentation/hooks/use-app-theme';
import { triggerLightImpactHaptic } from '@/shared/presentation/utils/haptics';
import { Bell } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

const ICON_SIZE = 22;
const BUTTON_SIZE = 40;

interface NotificationButtonProps {
  /** Número de notificaciones sin leer */
  badgeCount?: number;
  onPress?: () => void;
}

export const NotificationButton = React.memo(function NotificationButton({
  badgeCount = 0,
  onPress,
}: NotificationButtonProps) {
  const text = useThemeColor('text');
  const danger = useThemeColor('danger');

  const handlePress = useCallback(() => {
    void triggerLightImpactHaptic();
    onPress?.();
  }, [onPress]);

  return (
    <AppPressable
      onPress={handlePress}
      style={[styles.button, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
      accessibilityRole='button'
      accessibilityLabel={
        badgeCount > 0
          ? `Notificaciones, ${badgeCount} sin leer`
          : 'Notificaciones'
      }
    >
      <Bell size={ICON_SIZE} color={text} strokeWidth={2} />
      {badgeCount > 0 && (
        <View style={[styles.badge, { backgroundColor: danger }]} />
      )}
    </AppPressable>
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
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
