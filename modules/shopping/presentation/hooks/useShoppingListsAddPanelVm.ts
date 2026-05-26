import { useMemo } from 'react';
import type {
  ProductCategory,
  ShoppingItem,
} from '../../domain/entities/shopping-list.entity';

type UseShoppingListsAddPanelVmParams = {
  canInteractWithList: boolean;
  isInitializingList: boolean;
  listInitError: string | null;
  handleRetryListInitialization: () => void;
  editingItem: ShoppingItem | null;
  category: ProductCategory;
  setCategory: (category: ProductCategory) => void;
  handleAddProduct: (name: string, price: number) => void;
  handleCancelEdit: () => void;
  editingInitialPrice?: string;
  priceInLocal: boolean;
  usdToLocal: (usd: number) => number;
  localToUsd: (local: number) => number;
  isExchangeRateAvailable: boolean;
  errorMessage: string | null;
  hidePrice: boolean;
};

export function useShoppingListsAddPanelVm({
  canInteractWithList,
  isInitializingList,
  listInitError,
  handleRetryListInitialization,
  editingItem,
  category,
  setCategory,
  handleAddProduct,
  handleCancelEdit,
  editingInitialPrice,
  priceInLocal,
  usdToLocal,
  localToUsd,
  isExchangeRateAvailable,
  errorMessage,
  hidePrice,
}: UseShoppingListsAddPanelVmParams) {
  const addPanelProps = useMemo(
    () => ({
      canInteractWithList,
      isInitializingList,
      listInitError,
      onRetryListInitialization: handleRetryListInitialization,
      editingItem,
      category,
      onSelectCategory: setCategory,
      onAddProduct: handleAddProduct,
      onCancelEdit: handleCancelEdit,
      editingInitialPrice,
      priceInLocal,
      usdToLocal,
      localToUsd,
      isExchangeRateAvailable,
      topErrorMessage: errorMessage,
      hidePrice,
    }),
    [
      canInteractWithList,
      isInitializingList,
      listInitError,
      handleRetryListInitialization,
      editingItem,
      category,
      setCategory,
      handleAddProduct,
      handleCancelEdit,
      editingInitialPrice,
      priceInLocal,
      usdToLocal,
      localToUsd,
      isExchangeRateAvailable,
      errorMessage,
      hidePrice,
    ],
  );

  return {
    addPanelProps,
  };
}
