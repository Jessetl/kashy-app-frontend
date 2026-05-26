import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useCountry } from '@/shared/presentation/hooks/use-country';
import {
  CalendarClock,
  Check,
  ChevronRight,
  ShoppingBag,
  Store,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ShoppingListSummary } from '../../domain/entities/shopping-list-summary.entity';

interface SavedListSummaryCardProps {
  summary: ShoppingListSummary;
  onPress: (summary: ShoppingListSummary) => void;
}

function formatCurrencyLocal(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatScheduled(iso: string, locale: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const SavedListSummaryCard = React.memo(function SavedListSummaryCard({
  summary,
  onPress,
}: SavedListSummaryCardProps) {
  const { colors } = useAppTheme();
  const { country } = useCountry();

  const progressRatio =
    summary.itemsCount > 0 ? summary.checkedCount / summary.itemsCount : 0;
  const progressPercent = Math.round(progressRatio * 100);

  const accentColor = useMemo(() => {
    if (!summary.isActive) return colors.textTertiary;
    if (summary.listType === 'RECEIPT') return colors.success;
    return colors.primary;
  }, [summary.isActive, summary.listType, colors]);

  const typeLabel = summary.listType === 'RECEIPT' ? 'Recibo' : 'Plantilla';
  const statusLabel = summary.isActive ? 'Activa' : 'Archivada';

  return (
    <AppPressable
      onPress={() => onPress(summary)}
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: `${accentColor}33`,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View
          style={[styles.iconCircle, { backgroundColor: `${accentColor}22` }]}
        >
          <ShoppingBag size={18} color={accentColor} strokeWidth={2} />
        </View>
        <View style={styles.titleCol}>
          <Text
            style={[styles.title, { color: colors.textOnSurface }]}
            numberOfLines={1}
          >
            {summary.name}
          </Text>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.chip,
                { backgroundColor: `${accentColor}22` },
              ]}
            >
              <Text style={[styles.chipText, { color: accentColor }]}>
                {typeLabel}
              </Text>
            </View>
            <View
              style={[
                styles.chip,
                { backgroundColor: colors.backgroundTertiary },
              ]}
            >
              <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>
        <ChevronRight size={18} color={colors.textTertiary} />
      </View>

      <View style={styles.body}>
        {summary.storeName ? (
          <View style={styles.metaInline}>
            <Store size={13} color={colors.textTertiary} />
            <Text
              style={[styles.metaText, { color: colors.textTertiary }]}
              numberOfLines={1}
            >
              {summary.storeName}
            </Text>
          </View>
        ) : null}

        {summary.scheduledDate ? (
          <View style={styles.metaInline}>
            <CalendarClock size={13} color={colors.textTertiary} />
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>
              {formatScheduled(summary.scheduledDate, country.locale)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.progressRow}>
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: colors.backgroundTertiary },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>
        <View style={styles.progressInfo}>
          <Check size={12} color={colors.textTertiary} strokeWidth={2.5} />
          <Text style={[styles.progressText, { color: colors.textTertiary }]}>
            {summary.checkedCount}/{summary.itemsCount}
          </Text>
        </View>
      </View>

      <View style={styles.totalsRow}>
        <Text style={[styles.totalLocal, { color: colors.textOnSurface }]}>
          {formatCurrencyLocal(summary.totalLocal, country.locale)}{' '}
          <Text style={[styles.currencyTag, { color: colors.textTertiary }]}>
            {summary.currencyCode}
          </Text>
        </Text>
        {summary.totalUsd != null ? (
          <Text style={[styles.totalUsd, { color: colors.textTertiary }]}>
            ≈ ${summary.totalUsd.toFixed(2)} USD
          </Text>
        ) : null}
      </View>
    </AppPressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  body: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  totalLocal: {
    fontSize: 16,
    fontWeight: '700',
  },
  currencyTag: {
    fontSize: 11,
    fontWeight: '500',
  },
  totalUsd: {
    fontSize: 12,
    fontWeight: '500',
  },
});
