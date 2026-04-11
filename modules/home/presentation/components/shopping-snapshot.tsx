import { AppPressable } from '@/shared/presentation/components/ui';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useRouter } from 'expo-router';
import { ArrowRight, ShoppingBag } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ShoppingSnapshotProps {
  listName: string | null;
  totalItems: number;
  purchasedItems: number;
  totalLocal: number;
  exchangeRate: number | null;
}

const formatter = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const ShoppingSnapshot = React.memo(function ShoppingSnapshot({
  listName,
  totalItems,
  purchasedItems,
  totalLocal,
  exchangeRate,
}: ShoppingSnapshotProps) {
  const { colors } = useAppTheme();
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push('/(tabs)/supermarket');
  }, [router]);

  const progress = totalItems > 0 ? purchasedItems / totalItems : 0;
  const totalUsd = exchangeRate && exchangeRate > 0 ? totalLocal / exchangeRate : 0;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textOnSurface }]}>
          Supermercado
        </Text>
        <AppPressable onPress={handlePress} style={styles.seeAll}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>
            Ir a lista
          </Text>
          <ArrowRight size={14} color={colors.primary} pointerEvents="none" />
        </AppPressable>
      </View>

      <AppPressable
        onPress={handlePress}
        style={[styles.card, { backgroundColor: colors.backgroundTertiary }]}
      >
        <View style={styles.cardTop}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
            <ShoppingBag size={22} color={colors.primary} pointerEvents="none" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.listName, { color: colors.textOnSurface }]} numberOfLines={1}>
              {listName ?? 'Nueva lista'}
            </Text>
            <Text style={[styles.itemCount, { color: colors.textSecondary }]}>
              {totalItems === 0
                ? 'Sin productos aun'
                : `${purchasedItems}/${totalItems} comprados`}
            </Text>
          </View>
          {totalItems > 0 && (
            <View style={styles.totalsColumn}>
              <Text style={[styles.totalAmount, { color: colors.textOnSurface }]}>
                Bs. {formatter.format(totalLocal)}
              </Text>
              {totalUsd > 0 && (
                <Text style={[styles.totalUsd, { color: colors.textSecondary }]}>
                  ${formatter.format(totalUsd)}
                </Text>
              )}
            </View>
          )}
        </View>

        {totalItems > 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.round(progress * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        )}
      </AppPressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  listName: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemCount: {
    fontSize: 12,
    fontWeight: '400',
  },
  totalsColumn: {
    alignItems: 'flex-end',
    gap: 2,
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  totalUsd: {
    fontSize: 11,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'right',
  },
});
