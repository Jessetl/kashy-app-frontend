import { useCallback, useMemo } from 'react';

type UseShoppingListsHeaderVmParams = {
  canInteractWithList: boolean;
  canShare: boolean;
  handleShare: () => Promise<void>;
  handleSave: () => void;
  handleDeleteList: () => void;
  handleBack: () => void;
  handleConvertToReceipt?: () => void;
  /** Flow 10 — solo visible si RECEIPT con 100% items checked. */
  handleCompleteList?: () => void;
  isTemplate: boolean;
  isReceipt?: boolean;
  isCompleted?: boolean;
  canComplete?: boolean;
  isLocal?: boolean;
  isDraft?: boolean;
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
  handleCompleteList,
  isTemplate,
  isReceipt = false,
  isCompleted = false,
  canComplete = false,
  isLocal = false,
  isDraft = false,
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
      // Bookmark solo en draft (TEMPLATE no guardado). En COMPLETED se oculta.
      onSave: canInteractWithList && !isCompleted ? handleSave : undefined,
      onConvertToReceipt:
        canInteractWithList && isTemplate && !isDraft && !isCompleted
          ? handleConvertToReceipt
          : undefined,
      onComplete:
        canInteractWithList && isReceipt && canComplete && handleCompleteList
          ? handleCompleteList
          : undefined,
      onDelete:
        canInteractWithList && !isCompleted ? handleDeleteList : undefined,
    }),
    [
      canInteractWithList,
      canShare,
      onShare,
      handleSave,
      handleDeleteList,
      handleBack,
      handleConvertToReceipt,
      handleCompleteList,
      isTemplate,
      isReceipt,
      isCompleted,
      canComplete,
      isDraft,
    ],
  );

  const headerContentProps = useMemo(
    () => ({
      purchasedCount,
      totalItems,
      listName: activeListName,
      isTemplate,
      isLocal,
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
      isLocal,
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
