import { useMemo } from 'react';
import type { ShoppingItem } from '../../domain/entities/shopping-list.entity';
import type { ViewMode } from '../components/view-toggle';

type UseSupermarketItemsVmParams = {
  canInteractWithList: boolean;
  listViewportMinHeight: number;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  totalItems: number;
  handleNewList: () => void;
  groupedItems: [string, ShoppingItem[]][];
  exchangeRateValue: number | null;
  handleToggleItem: (id: string) => void;
  handleDeleteItem: (id: string) => void;
  handleEditItem: (item: ShoppingItem) => void;
  handleQuantityChange: (id: string, quantity: number) => void;
};

export function useSupermarketItemsVm({
  canInteractWithList,
  listViewportMinHeight,
  viewMode,
  setViewMode,
  totalItems,
  handleNewList,
  groupedItems,
  exchangeRateValue,
  handleToggleItem,
  handleDeleteItem,
  handleEditItem,
  handleQuantityChange,
}: UseSupermarketItemsVmParams) {
  const itemsSectionProps = useMemo(
    () => ({
      canInteractWithList,
      listViewportMinHeight,
      viewMode,
      onToggleViewMode: setViewMode,
      totalItems,
      onNewList: handleNewList,
      groupedItems,
      exchangeRateValue,
      onToggleItem: handleToggleItem,
      onDeleteItem: handleDeleteItem,
      onEditItem: handleEditItem,
      onQuantityChange: handleQuantityChange,
    }),
    [
      canInteractWithList,
      listViewportMinHeight,
      viewMode,
      setViewMode,
      totalItems,
      handleNewList,
      groupedItems,
      exchangeRateValue,
      handleToggleItem,
      handleDeleteItem,
      handleEditItem,
      handleQuantityChange,
    ],
  );

  return {
    itemsSectionProps,
  };
}
