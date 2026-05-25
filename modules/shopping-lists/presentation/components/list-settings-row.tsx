import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import { useCountry } from '@/shared/presentation/hooks/use-country';
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
  const colors = useThemeColors();
  const { country } = useCountry();

  return (
    <View style={styles.container}>
      <AppPressable
        onPress={onToggleIva}
        style={[
          styles.toggle,
          {
            backgroundColor: ivaEnabled
              ? colors.primaryLight
              : colors.backgroundTertiary,
            borderColor: ivaEnabled ? colors.primary : colors.textSecondary,
          },
        ]}
      >
        <View
          style={[
            styles.radio,
            {
              borderColor: ivaEnabled ? colors.primary : colors.textSecondary,
              backgroundColor: ivaEnabled ? colors.primary : 'transparent',
            },
          ]}
        >
          {ivaEnabled && (
            <View
              style={[
                styles.radioInner,
                { backgroundColor: colors.textInverse },
              ]}
            />
          )}
        </View>
        <Text
          style={[
            styles.toggleLabel,
            {
              color: ivaEnabled ? colors.primary : colors.textSecondary,
            },
          ]}
        >
          IVA 16%
        </Text>
      </AppPressable>

      <AppPressable
        onPress={onTogglePriceInLocal}
        style={[
          styles.toggle,
          {
            backgroundColor: priceInLocal
              ? colors.primaryLight
              : colors.backgroundTertiary,
            borderColor: priceInLocal ? colors.primary : colors.textSecondary,
          },
        ]}
      >
        <View
          style={[
            styles.radio,
            {
              borderColor: priceInLocal ? colors.primary : colors.textSecondary,
              backgroundColor: priceInLocal ? colors.primary : 'transparent',
            },
          ]}
        >
          {priceInLocal && (
            <View
              style={[
                styles.radioInner,
                { backgroundColor: colors.textInverse },
              ]}
            />
          )}
        </View>
        <Text
          style={[
            styles.toggleLabel,
            {
              color: priceInLocal ? colors.primary : colors.textSecondary,
            },
          ]}
        >
          Precio en {country.currency}
        </Text>
      </AppPressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
