import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ListSettingsRow } from './list-settings-row';
import { ProductCounter } from './product-counter';
import { SummaryCards } from './summary-cards';

type SupermarketHeaderContentProps = {
  purchasedCount: number;
  totalItems: number;
  listName: string;
  ivaEnabled: boolean;
  priceInLocal: boolean;
  onToggleIva: () => void;
  onTogglePriceInLocal: () => void;
  totalLocal: number;
  totalUsd: number;
  spentLocal: number;
};

export const SupermarketHeaderContent = React.memo(
  function SupermarketHeaderContent({
    purchasedCount,
    totalItems,
    listName,
    ivaEnabled,
    priceInLocal,
    onToggleIva,
    onTogglePriceInLocal,
    totalLocal,
    totalUsd,
    spentLocal,
  }: SupermarketHeaderContentProps) {
    const colors = useThemeColors();

    return (
      <View style={styles.headerContent}>
        <View style={styles.titleRow}>
          <ProductCounter purchased={purchasedCount} total={totalItems} />
          <View style={styles.titleTextContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              Supermercado
            </Text>
            <Text style={[styles.listName, { color: colors.textSecondary }]}>
              {listName}
            </Text>
          </View>
        </View>
        <ListSettingsRow
          ivaEnabled={ivaEnabled}
          onToggleIva={onToggleIva}
          priceInLocal={priceInLocal}
          onTogglePriceInLocal={onTogglePriceInLocal}
        />
        <SummaryCards
          totalLocal={totalLocal}
          totalUsd={totalUsd}
          spentLocal={spentLocal}
          ivaEnabled={ivaEnabled}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  headerContent: {
    paddingHorizontal: 16,
    gap: 14,
    paddingTop: 8,
    paddingBottom: 32,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  titleTextContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  listName: {
    fontSize: 14,
    fontWeight: '400',
  },
});
