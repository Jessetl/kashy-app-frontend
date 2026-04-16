import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import { triggerLightImpactHaptic } from '@/shared/presentation/utils/haptics';
import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

interface SocialButtonProps {
  /** Nombre del provider (Google, Apple…) */
  provider: string;
  /** Icono o letra a mostrar */
  icon: string;
  /** Color del icono. Si no se pasa, usa textOnSurface */
  iconColor?: string;
  /** Muestra un spinner y deshabilita el botón */
  loading?: boolean;
  /** Callback al presionar */
  onPress: () => void;
}

export const SocialButton = React.memo(function SocialButton({
  provider,
  icon,
  iconColor,
  loading = false,
  onPress,
}: SocialButtonProps) {
  const colors = useThemeColors();

  const handlePress = useCallback(() => {
    void triggerLightImpactHaptic();
    onPress();
  }, [onPress]);

  return (
    <AppPressable
      onPress={handlePress}
      disabled={loading}
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundTertiary,
          borderColor: colors.border,
          opacity: loading ? 0.6 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator size='small' color={colors.textOnSurface} />
      ) : (
        <Text
          style={[styles.icon, { color: iconColor ?? colors.textOnSurface }]}
        >
          {icon}
        </Text>
      )}
      <Text style={[styles.label, { color: colors.textOnSurface }]}>
        {provider}
      </Text>
    </AppPressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  icon: {
    fontSize: 18,
    fontWeight: '800',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});
