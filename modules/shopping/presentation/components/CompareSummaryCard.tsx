import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useCountry } from '@/shared/presentation/hooks/use-country';
import { Equal, Sparkles, Trophy } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type {
  CompareListRef,
  CompareSummary,
  CompareWinner,
} from '../../domain/entities/shopping-list-compare.entity';

interface CompareSummaryCardProps {
  listA: CompareListRef;
  listB: CompareListRef;
  summary: CompareSummary;
  /** Color del slot A (debe matchear el del picker). */
  colorA: string;
  /** Color del slot B (debe matchear el del picker). */
  colorB: string;
}

function formatLocal(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function winnerLabel(
  winner: CompareWinner,
  listA: CompareListRef,
  listB: CompareListRef,
): string {
  if (winner === 'list_a') return listA.name;
  if (winner === 'list_b') return listB.name;
  return 'Empate';
}

export const CompareSummaryCard = React.memo(function CompareSummaryCard({
  listA,
  listB,
  summary,
  colorA,
  colorB,
}: CompareSummaryCardProps) {
  const { colors } = useAppTheme();
  const { country } = useCountry();

  const winnerName = winnerLabel(summary.recommended, listA, listB);
  const accentColor =
    summary.recommended === 'list_a'
      ? colorA
      : summary.recommended === 'list_b'
        ? colorB
        : colors.textSecondary;

  const HeaderIcon = summary.recommended === 'equal' ? Equal : Trophy;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: `${accentColor}55`,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View
          style={[styles.iconCircle, { backgroundColor: `${accentColor}22` }]}
        >
          <HeaderIcon size={20} color={accentColor} strokeWidth={2} />
        </View>
        <View style={styles.headerCol}>
          <Text style={[styles.headerLabel, { color: colors.textTertiary }]}>
            {summary.recommended === 'equal'
              ? 'Sin diferencia significativa'
              : 'Lista recomendada'}
          </Text>
          <Text
            style={[styles.headerTitle, { color: accentColor }]}
            numberOfLines={1}
          >
            {winnerName}
          </Text>
        </View>
      </View>

      {summary.recommended !== 'equal' ? (
        <View
          style={[
            styles.savingsRow,
            { backgroundColor: `${accentColor}12` },
          ]}
        >
          <Sparkles size={14} color={accentColor} strokeWidth={2} />
          <Text style={[styles.savingsText, { color: accentColor }]}>
            Ahorras {formatLocal(summary.savingsLocal, country.locale)}{' '}
            {summary.savingsUsd != null
              ? `· $${summary.savingsUsd.toFixed(2)} USD`
              : ''}
          </Text>
        </View>
      ) : null}

      <View style={styles.totalsRow}>
        <View style={styles.totalCol}>
          <Text style={[styles.totalLabel, { color: colors.textTertiary }]}>
            {listA.name}
          </Text>
          <Text style={[styles.totalValue, { color: colors.textOnSurface }]}>
            {formatLocal(summary.listATotalLocal, country.locale)}
          </Text>
        </View>
        <View
          style={[styles.divider, { backgroundColor: colors.border }]}
        />
        <View style={styles.totalCol}>
          <Text style={[styles.totalLabel, { color: colors.textTertiary }]}>
            {listB.name}
          </Text>
          <Text style={[styles.totalValue, { color: colors.textOnSurface }]}>
            {formatLocal(summary.listBTotalLocal, country.locale)}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatPill
          value={summary.totalMatched}
          label='en común'
          color={colors.primary}
        />
        <StatPill
          value={summary.totalUnmatchedA}
          label={`solo en ${listA.name}`}
          color={colorA}
        />
        <StatPill
          value={summary.totalUnmatchedB}
          label={`solo en ${listB.name}`}
          color={colorB}
        />
      </View>
    </View>
  );
});

interface StatPillProps {
  value: number;
  label: string;
  color: string;
}

function StatPill({ value, label, color }: StatPillProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text
        style={[styles.statLabel, { color: colors.textTertiary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCol: {
    flex: 1,
    gap: 2,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  savingsText: {
    fontSize: 13,
    fontWeight: '700',
  },
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalCol: {
    flex: 1,
    gap: 2,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
