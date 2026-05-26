import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useCountry } from '@/shared/presentation/hooks/use-country';
import { Equal, TrendingDown, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type {
  CompareMatchedItem,
  CompareWinner,
} from '../../domain/entities/shopping-list-compare.entity';

interface CompareMatchedRowProps {
  item: CompareMatchedItem;
  colorA: string;
  colorB: string;
}

function fmt(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function iconForWinner(winner: CompareWinner) {
  if (winner === 'list_a') return TrendingDown;
  if (winner === 'list_b') return TrendingUp;
  return Equal;
}

export const CompareMatchedRow = React.memo(function CompareMatchedRow({
  item,
  colorA,
  colorB,
}: CompareMatchedRowProps) {
  const { colors } = useAppTheme();
  const { country } = useCountry();

  const accentColor =
    item.cheaperIn === 'list_a'
      ? colorA
      : item.cheaperIn === 'list_b'
        ? colorB
        : colors.textTertiary;

  const WinnerIcon = iconForWinner(item.cheaperIn);
  const cheaperLabel =
    item.cheaperIn === 'list_a'
      ? 'Más barata en A'
      : item.cheaperIn === 'list_b'
        ? 'Más barata en B'
        : 'Mismo precio';

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
      <View style={styles.headerRow}>
        <Text
          style={[styles.productName, { color: colors.textOnSurface }]}
          numberOfLines={1}
        >
          {item.productName}
        </Text>
        <View
          style={[styles.diffBadge, { backgroundColor: `${accentColor}22` }]}
        >
          <WinnerIcon size={12} color={accentColor} strokeWidth={2.5} />
          <Text style={[styles.diffBadgeText, { color: accentColor }]}>
            {cheaperLabel}
          </Text>
        </View>
      </View>

      <View style={styles.pricesRow}>
        <View style={styles.priceCol}>
          <Text style={[styles.priceLabel, { color: colorA }]}>A</Text>
          <Text style={[styles.priceValue, { color: colors.textOnSurface }]}>
            {fmt(item.listAPriceLocal, country.locale)}
          </Text>
          <Text style={[styles.priceMeta, { color: colors.textTertiary }]}>
            x{item.listAQuantity}
            {item.listAPriceUsd != null
              ? ` · $${item.listAPriceUsd.toFixed(2)}`
              : ''}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.priceCol}>
          <Text style={[styles.priceLabel, { color: colorB }]}>B</Text>
          <Text style={[styles.priceValue, { color: colors.textOnSurface }]}>
            {fmt(item.listBPriceLocal, country.locale)}
          </Text>
          <Text style={[styles.priceMeta, { color: colors.textTertiary }]}>
            x{item.listBQuantity}
            {item.listBPriceUsd != null
              ? ` · $${item.listBPriceUsd.toFixed(2)}`
              : ''}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.priceCol}>
          <Text style={[styles.priceLabel, { color: colors.textTertiary }]}>
            DIF
          </Text>
          <Text style={[styles.priceValue, { color: accentColor }]}>
            {fmt(Math.abs(item.priceDiffLocal), country.locale)}
          </Text>
          <Text style={[styles.priceMeta, { color: colors.textTertiary }]}>
            {item.priceDiffUsd != null
              ? `$${Math.abs(item.priceDiffUsd).toFixed(2)}`
              : '—'}
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    borderRadius: 12,
    borderLeftWidth: 3,
    padding: 12,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diffBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  pricesRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  priceCol: {
    flex: 1,
    gap: 2,
    alignItems: 'flex-start',
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  priceMeta: {
    fontSize: 11,
    fontWeight: '500',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
});
