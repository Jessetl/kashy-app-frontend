import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import { useCountry } from '@/shared/presentation/hooks/use-country';
import { Check, DollarSign, Percent } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ListSettingsRowProps {
  ivaEnabled: boolean;
  onToggleIva: () => void;
  priceInLocal: boolean;
  onTogglePriceInLocal: () => void;
}

export const ListSettingsRow = React.memo(function ListSettingsRow({
  ivaEnabled,
  onToggleIva,
  priceInLocal,
  onTogglePriceInLocal,
}: ListSettingsRowProps) {
  const { country } = useCountry();

  return (
    <View style={styles.container}>
      <ToggleChip
        Icon={Percent}
        label='IVA 16%'
        active={ivaEnabled}
        onPress={onToggleIva}
      />
      <ToggleChip
        Icon={DollarSign}
        label={`Precio en ${country.currency}`}
        active={priceInLocal}
        onPress={onTogglePriceInLocal}
      />
    </View>
  );
});

interface ToggleChipProps {
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string;
  active: boolean;
  onPress: () => void;
}

function ToggleChip({ Icon, label, active, onPress }: ToggleChipProps) {
  const colors = useThemeColors();

  return (
    <AppPressable
      onPress={onPress}
      accessibilityRole='switch'
      accessibilityState={{ checked: active }}
      accessibilityLabel={label}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primary : 'rgba(255,255,255,0.10)',
          borderColor: active ? colors.primary : 'rgba(255,255,255,0.18)',
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: active
              ? 'rgba(255,255,255,0.22)'
              : 'rgba(255,255,255,0.12)',
          },
        ]}
      >
        {active ? (
          <Check size={11} color={colors.textInverse} strokeWidth={3} />
        ) : (
          <Icon size={11} color={colors.text} strokeWidth={2.4} />
        )}
      </View>
      <Text
        style={[
          styles.label,
          { color: active ? colors.textInverse : colors.text },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </AppPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  iconWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
