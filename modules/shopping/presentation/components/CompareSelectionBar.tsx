import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { ArrowLeftRight, CloudOff, X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CompareSelectionBarProps {
  /** Cantidad seleccionada. CTA solo se habilita con exactamente 2. */
  count: number;
  /** Cap configurado (default 2). */
  max: number;
  /** Si !online → CTA disabled + mensaje. */
  isOnline: boolean;
  onCancel: () => void;
  onCompare: () => void;
}

export const CompareSelectionBar = React.memo(function CompareSelectionBar({
  count,
  max,
  isOnline,
  onCancel,
  onCompare,
}: CompareSelectionBarProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const canCompare = count === max && isOnline;
  const hint = !isOnline
    ? 'Comparar requiere conexión'
    : count < max
      ? `Selecciona ${max - count} más`
      : 'Listo para comparar';

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 12),
          backgroundColor: colors.backgroundSecondary,
          borderTopColor: colors.border,
        },
      ]}
    >
      <AppPressable
        onPress={onCancel}
        accessibilityLabel='Cancelar selección'
        style={[styles.cancelButton, { backgroundColor: colors.backgroundTertiary }]}
      >
        <X size={18} color={colors.textOnSurface} strokeWidth={2.2} />
      </AppPressable>

      <View style={styles.info}>
        <Text style={[styles.count, { color: colors.textOnSurface }]}>
          {count}/{max} seleccionadas
        </Text>
        <View style={styles.hintRow}>
          {!isOnline ? (
            <CloudOff size={11} color={colors.warning} strokeWidth={2.2} />
          ) : null}
          <Text
            style={[
              styles.hint,
              { color: !isOnline ? colors.warning : colors.textTertiary },
            ]}
          >
            {hint}
          </Text>
        </View>
      </View>

      <AppPressable
        onPress={onCompare}
        disabled={!canCompare}
        accessibilityRole='button'
        accessibilityLabel='Comparar listas seleccionadas'
        style={[
          styles.compareButton,
          {
            backgroundColor: canCompare ? colors.primary : colors.backgroundTertiary,
            opacity: canCompare ? 1 : 0.6,
          },
        ]}
      >
        <ArrowLeftRight
          size={16}
          color={canCompare ? colors.textInverse : colors.textTertiary}
          strokeWidth={2.4}
        />
        <Text
          style={[
            styles.compareText,
            {
              color: canCompare ? colors.textInverse : colors.textTertiary,
            },
          ]}
        >
          Comparar
        </Text>
      </AppPressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  count: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hint: {
    fontSize: 12,
    fontWeight: '500',
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
  },
  compareText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
