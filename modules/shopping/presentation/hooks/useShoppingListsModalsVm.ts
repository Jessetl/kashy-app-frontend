import { useMemo } from 'react';

type UseShoppingListsModalsVmParams = {
  showSaveModal: boolean;
  setShowSaveModal: (visible: boolean) => void;
  handleSaveList: (name: string, storeName: string) => void;
  activeListInitialName?: string;
  activeListStoreName?: string;
};

export function useShoppingListsModalsVm({
  showSaveModal,
  setShowSaveModal,
  handleSaveList,
  activeListInitialName,
  activeListStoreName,
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

  return {
    saveModalProps,
  };
}
