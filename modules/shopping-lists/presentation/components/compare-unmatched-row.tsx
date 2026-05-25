import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useCountry } from '@/shared/presentation/hooks/use-country';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CompareUnmatchedItem } from '../../domain/entities/shopping-list-compare.entity';

interface CompareUnmatchedRowProps {
  item: CompareUnmatchedItem;
  accentColor: string;
}

function fmt(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export const CompareUnmatchedRow = React.memo(function CompareUnmatchedRow({
  item,
  accentColor,
}: CompareUnmatchedRowProps) {
  const { colors } = useAppTheme();
  const { country } = useCountry();

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.backgroundSecondary,
          borderLeftColor: accentColor,
        },
      ]}
    >
      <View style={styles.info}>
        <Text
          style={[styles.productName, { color: colors.textOnSurface }]}
          numberOfLines={1}
        >
          {item.productName}
        </Text>
        <Text
          style={[styles.meta, { color: colors.textTertiary }]}
          numberOfLines={1}
        >
          {item.category} · x{item.quantity}
        </Text>
      </View>
      <View style={styles.priceCol}>
        <Text style={[styles.priceValue, { color: colors.textOnSurface }]}>
          {fmt(item.unitPriceLocal * item.quantity, country.locale)}
        </Text>
        {item.unitPriceUsd != null ? (
          <Text style={[styles.priceUsd, { color: colors.textTertiary }]}>
            ${(item.unitPriceUsd * item.quantity).toFixed(2)}
          </Text>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    fontSize: 11,
    fontWeight: '500',
  },
  priceCol: {
    alignItems: 'flex-end',
    gap: 1,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  priceUsd: {
    fontSize: 11,
    fontWeight: '500',
  },
});
