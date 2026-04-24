import { useCallback, useMemo } from 'react';

type UseSupermarketHeaderVmParams = {
  canInteractWithList: boolean;
  canShare: boolean;
  handleShare: () => Promise<void>;
  handleSave: () => void;
  handleOpenSavedLists: () => void;
  handleDeleteList: () => void;
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

export function useSupermarketHeaderVm({
  canInteractWithList,
  canShare,
  handleShare,
  handleSave,
  handleOpenSavedLists,
  handleDeleteList,
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
}: UseSupermarketHeaderVmParams) {
  const onShare = useCallback(
    () => void handleShare(),
    [handleShare],
  );

  const disabledNoop = useCallback(() => {}, []);

  const headerBarProps = useMemo(
    () => ({
      onShare: canInteractWithList && canShare ? onShare : undefined,
      onSave: canInteractWithList ? handleSave : undefined,
      onOpenSavedLists: canInteractWithList ? handleOpenSavedLists : undefined,
      onDelete: canInteractWithList ? handleDeleteList : undefined,
    }),
    [
      canInteractWithList,
      canShare,
      onShare,
      handleSave,
      handleOpenSavedLists,
      handleDeleteList,
    ],
  );

  const headerContentProps = useMemo(
    () => ({
      purchasedCount,
      totalItems,
      listName: activeListName,
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
