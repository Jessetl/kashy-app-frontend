import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ShoppingItem } from '../../domain/entities/shopping-list.entity';
import { CategoryGroup } from './category-group';
import { EmptyList } from './empty-list';
import { ViewToggle, type ViewMode } from './view-toggle';

type SupermarketItemsSectionProps = {
  canInteractWithList: boolean;
  listViewportMinHeight: number;
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  totalItems: number;
  onNewList?: () => void;
  groupedItems: Array<[string, ShoppingItem[]]>;
  exchangeRateValue: number | null;
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onEditItem: (item: ShoppingItem) => void;
  onQuantityChange: (id: string, quantity: number) => void;
};

export const SupermarketItemsSection = React.memo(
  function SupermarketItemsSection({
    canInteractWithList,
    listViewportMinHeight,
    viewMode,
    onToggleViewMode,
    totalItems,
    onNewList,
    groupedItems,
    exchangeRateValue,
    onToggleItem,
    onDeleteItem,
    onEditItem,
    onQuantityChange,
  }: SupermarketItemsSectionProps) {
    const colors = useThemeColors();

    return (
      <View
        style={[
          styles.listSection,
          {
            backgroundColor: colors.backgroundSecondary,
            minHeight: listViewportMinHeight,
          },
        ]}
        pointerEvents={canInteractWithList ? 'auto' : 'none'}
      >
        <ViewToggle
          mode={viewMode}
          onToggle={canInteractWithList ? onToggleViewMode : () => {}}
          itemCount={totalItems}
          onNewList={canInteractWithList ? onNewList : undefined}
        />
        <View style={styles.productListContent}>
          {totalItems === 0 ? (
            <EmptyList />
          ) : (
            groupedItems.map(([cat, catItems]) => (
              <CategoryGroup
                key={cat}
                category={cat}
                items={catItems}
                exchangeRate={exchangeRateValue}
                viewMode={viewMode}
                onToggle={onToggleItem}
                onDelete={onDeleteItem}
                onEdit={onEditItem}
                onQuantityChange={onQuantityChange}
              />
            ))
          )}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  listSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
    zIndex: 2,
  },
  productListContent: {
    paddingTop: 8,
    gap: 12,
  },
});
