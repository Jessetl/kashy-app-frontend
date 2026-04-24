import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import type {
  ProductCategory,
  ShoppingItem,
} from '../../domain/entities/shopping-list.entity';
import { AddProductForm } from './add-product-form';
import { CategoryTabs } from './category-tabs';
import { ListInitializationBanner } from './list-initialization-banner';

type SupermarketAddPanelProps = {
  canInteractWithList: boolean;
  isInitializingList: boolean;
  listInitError: string | null;
  onRetryListInitialization: () => void;
  editingItem: ShoppingItem | null;
  category: ProductCategory;
  onSelectCategory: (category: ProductCategory) => void;
  onAddProduct: (name: string, price: number) => void;
  onCancelEdit: () => void;
  editingInitialPrice?: string;
  priceInLocal: boolean;
  usdToLocal: (usd: number) => number;
  localToUsd: (local: number) => number;
  isExchangeRateAvailable: boolean;
  topContent?: React.ReactNode;
};

export const SupermarketAddPanel = React.memo(function SupermarketAddPanel({
  canInteractWithList,
  isInitializingList,
  listInitError,
  onRetryListInitialization,
  editingItem,
  category,
  onSelectCategory,
  onAddProduct,
  onCancelEdit,
  editingInitialPrice,
  priceInLocal,
  usdToLocal,
  localToUsd,
  isExchangeRateAvailable,
  topContent,
}: SupermarketAddPanelProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.addSection,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      ]}
      pointerEvents={canInteractWithList ? 'auto' : 'none'}
    >
      {!canInteractWithList && (
        <ListInitializationBanner
          isInitializing={isInitializingList}
          errorMessage={listInitError}
          onRetry={onRetryListInitialization}
        />
      )}
      {topContent}
      {!editingItem && (
        <CategoryTabs selected={category} onSelect={onSelectCategory} />
      )}
      <AddProductForm
        onAdd={onAddProduct}
        onCancelEdit={onCancelEdit}
        initialName={editingItem?.productName}
        initialPrice={editingInitialPrice}
        priceInLocal={priceInLocal}
        usdToLocal={usdToLocal}
        localToUsd={localToUsd}
        isExchangeRateAvailable={isExchangeRateAvailable}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  addSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
