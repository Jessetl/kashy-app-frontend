import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { ArrowUpDown } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface ExchangeRateBannerProps {
  rate: number | null;
  source: string | null;
  isLoading: boolean;
}

const formatter = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const ExchangeRateBanner = React.memo(function ExchangeRateBanner({
  rate,
  source,
  isLoading,
}: ExchangeRateBannerProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
      <View style={[styles.iconWrap, { backgroundColor: 'rgba(99,230,150,0.2)' }]}>
        <ArrowUpDown size={16} color={colors.primary} pointerEvents="none" />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: 'rgba(255,255,255,0.7)' }]}>
          Tasa del dia
        </Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={[styles.rate, { color: colors.text }]}>
            Bs. {rate ? formatter.format(rate) : '--'}{' '}
            <Text style={[styles.perUsd, { color: 'rgba(255,255,255,0.6)' }]}>
              / USD
            </Text>
          </Text>
        )}
      </View>
      {source && !isLoading && (
        <View style={[styles.sourceBadge, { backgroundColor: 'rgba(99,230,150,0.15)' }]}>
          <Text style={[styles.sourceText, { color: colors.primary }]}>
            {source}
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rate: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  perUsd: {
    fontSize: 13,
    fontWeight: '400',
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
