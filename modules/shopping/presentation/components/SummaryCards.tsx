import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import { useCountry } from '@/shared/presentation/hooks/use-country';
import {
  formatLocalAmount,
  formatUsdAmount,
} from '@/shared/presentation/utils/format-currency';
import { Coins, TrendingUp, Wallet } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SummaryCardsProps {
  totalLocal: number;
  totalUsd: number;
  spentLocal: number;
  ivaEnabled: boolean;
}

export const SummaryCards = React.memo(function SummaryCards({
  totalLocal,
  totalUsd,
  spentLocal,
}: SummaryCardsProps) {
  const colors = useThemeColors();
  const { country } = useCountry();

  const values = useMemo(
    () => ({
      totalUsd: formatUsdAmount(totalUsd),
      spentUsd: formatUsdAmount(spentLocal),
      totalLocal: formatLocalAmount(totalLocal, country),
    }),
    [totalUsd, spentLocal, totalLocal, country],
  );

  return (
    <View style={styles.container}>
      <SummaryCard
        Icon={TrendingUp}
        label='Total'
        value={values.totalUsd}
        accent={colors.primary}
        accentBg={colors.primaryLight}
      />
      <SummaryCard
        Icon={Wallet}
        label='Gastado'
        value={values.spentUsd}
        accent={colors.danger}
        accentBg={colors.dangerLight}
      />
      <SummaryCard
        Icon={Coins}
        label={country.currencyLabel}
        value={values.totalLocal}
        accent={colors.textOnSurface}
        accentBg={colors.backgroundTertiary}
      />
    </View>
  );
});

interface SummaryCardProps {
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string;
  value: string;
  accent: string;
  accentBg: string;
}

function SummaryCard({
  Icon,
  label,
  value,
  accent,
  accentBg,
}: SummaryCardProps) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: `${accent}1F`,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: accentBg }]}>
          <Icon size={11} color={accent} strokeWidth={2.4} />
        </View>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      </View>
      <Text
        style={[styles.value, { color: accent }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.55}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 8,
    justifyContent: 'space-between',
    minHeight: 78,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconWrap: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
