import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import { CloudOff } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ListSettingsRow } from './ListSettingsRow';
import { ProductCounter } from './ProductCounter';
import { SummaryCards } from './SummaryCards';

type ShoppingListsHeaderContentProps = {
  purchasedCount: number;
  totalItems: number;
  listName: string;
  isTemplate: boolean;
  isLocal?: boolean;
  ivaEnabled: boolean;
  priceInLocal: boolean;
  onToggleIva: () => void;
  onTogglePriceInLocal: () => void;
  totalLocal: number;
  totalUsd: number;
  spentLocal: number;
};

export const ShoppingListsHeaderContent = React.memo(
  function ShoppingListsHeaderContent({
    purchasedCount,
    totalItems,
    listName,
    isTemplate,
    isLocal = false,
    ivaEnabled,
    priceInLocal,
    onToggleIva,
    onTogglePriceInLocal,
    totalLocal,
    totalUsd,
    spentLocal,
  }: ShoppingListsHeaderContentProps) {
    const colors = useThemeColors();

    const typeLabel = isTemplate ? 'Plantilla' : 'Recibo';

    return (
      <View style={styles.headerContent}>
        <View style={styles.titleRow}>
          <ProductCounter purchased={purchasedCount} total={totalItems} />
          <View style={styles.titleTextContainer}>
            <View style={styles.kickerRow}>
              <View
                style={[
                  styles.typePill,
                  {
                    backgroundColor: 'rgba(255,255,255,0.16)',
                  },
                ]}
              >
                <Text style={[styles.typePillText, { color: colors.text }]}>
                  {typeLabel}
                </Text>
              </View>
              {isLocal ? (
                <View
                  style={[
                    styles.localPill,
                    { backgroundColor: `${colors.warning}28` },
                  ]}
                >
                  <CloudOff
                    size={10}
                    color={colors.warning}
                    strokeWidth={2.5}
                  />
                  <Text style={[styles.localPillText, { color: colors.warning }]}>
                    Local
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              style={[styles.listName, { color: colors.text }]}
              numberOfLines={2}
            >
              {listName}
            </Text>
          </View>
        </View>
        {!isTemplate && (
          <>
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
          </>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  headerContent: {
    paddingHorizontal: 16,
    gap: 14,
    paddingTop: 8,
    paddingBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  titleTextContainer: {
    flex: 1,
    gap: 6,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  localPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  localPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  listName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 26,
  },
});
