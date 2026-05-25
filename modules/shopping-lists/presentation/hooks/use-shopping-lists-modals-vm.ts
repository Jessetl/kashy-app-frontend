import { useMemo } from 'react';
import type { ShoppingList } from '../../domain/entities/shopping-list.entity';

type UseShoppingListsModalsVmParams = {
  showSaveModal: boolean;
  setShowSaveModal: (visible: boolean) => void;
  handleSaveList: (name: string, storeName: string) => void;
  activeListInitialName?: string;
  activeListStoreName?: string;
  showSavedListsModal: boolean;
  setShowSavedListsModal: (visible: boolean) => void;
  savedLists: ShoppingList[];
  activeListId: string | null;
  isLoading: boolean;
  handleSelectSavedList: (list: ShoppingList) => void;
};

export function useShoppingListsModalsVm({
  showSaveModal,
  setShowSaveModal,
  handleSaveList,
  activeListInitialName,
  activeListStoreName,
  showSavedListsModal,
  setShowSavedListsModal,
  savedLists,
  activeListId,
  isLoading,
  handleSelectSavedList,
}: UseShoppingListsModalsVmParams) {
  const saveModalProps = useMemo(
    () => ({
      visible: showSaveModal,
      onClose: () => setShowSaveModal(false),
      onSave: handleSaveList,
      initialName: activeListInitialName,
      initialStoreName: activeListStoreName,
    }),
    [
      showSaveModal,
      setShowSaveModal,
      handleSaveList,
      activeListInitialName,
      activeListStoreName,
    ],
  );

  const savedListsModalProps = useMemo(
    () => ({
      visible: showSavedListsModal,
      onClose: () => setShowSavedListsModal(false),
      lists: savedLists,
      activeListId,
      isLoading,
      onSelect: handleSelectSavedList,
    }),
    [
      showSavedListsModal,
      setShowSavedListsModal,
      savedLists,
      activeListId,
      isLoading,
      handleSelectSavedList,
    ],
  );

  return {
    saveModalProps,
    savedListsModalProps,
  };
}
