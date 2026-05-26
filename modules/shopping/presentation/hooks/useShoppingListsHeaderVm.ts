import { useCallback, useMemo } from 'react';

type UseShoppingListsHeaderVmParams = {
  canInteractWithList: boolean;
  canShare: boolean;
  handleShare: () => Promise<void>;
  handleSave: () => void;
  handleDeleteList: () => void;
  handleBack: () => void;
  handleConvertToReceipt?: () => void;
  isTemplate: boolean;
  purchasedCount: number;
  totalItems: number;
  activeListName: string;
  ivaEnabled: boolean;
  priceInLocal: boolean;
  handleToggleIva: () => void;
  handleTogglePriceInLocal: () => void;
  totalLocal: number;
  totalUsd: number;
  spentLocal: number;
};

export function useShoppingListsHeaderVm({
  canInteractWithList,
  canShare,
  handleShare,
  handleSave,
  handleDeleteList,
  handleBack,
  handleConvertToReceipt,
  isTemplate,
  purchasedCount,
  totalItems,
  activeListName,
  ivaEnabled,
  priceInLocal,
  handleToggleIva,
  handleTogglePriceInLocal,
  totalLocal,
  totalUsd,
  spentLocal,
}: UseShoppingListsHeaderVmParams) {
  const onShare = useCallback(
    () => void handleShare(),
    [handleShare],
  );

  const disabledNoop = useCallback(() => {}, []);

  const headerBarProps = useMemo(
    () => ({
      onBack: handleBack,
      onShare: canInteractWithList && canShare ? onShare : undefined,
      onSave: canInteractWithList ? handleSave : undefined,
      onConvertToReceipt:
        canInteractWithList && isTemplate ? handleConvertToReceipt : undefined,
      onDelete: canInteractWithList ? handleDeleteList : undefined,
    }),
    [
      canInteractWithList,
      canShare,
      onShare,
      handleSave,
      handleDeleteList,
      handleBack,
      handleConvertToReceipt,
      isTemplate,
    ],
  );

  const headerContentProps = useMemo(
    () => ({
      purchasedCount,
      totalItems,
      listName: activeListName,
      isTemplate,
      ivaEnabled,
      priceInLocal,
      onToggleIva: canInteractWithList ? handleToggleIva : disabledNoop,
      onTogglePriceInLocal: canInteractWithList
        ? handleTogglePriceInLocal
        : disabledNoop,
      totalLocal,
      totalUsd,
      spentLocal,
    }),
    [
      purchasedCount,
      totalItems,
      activeListName,
      isTemplate,
      ivaEnabled,
      priceInLocal,
      canInteractWithList,
      handleToggleIva,
      handleTogglePriceInLocal,
      totalLocal,
      totalUsd,
      spentLocal,
      disabledNoop,
    ],
  );

  return {
    headerBarProps,
    headerContentProps,
  };
}
