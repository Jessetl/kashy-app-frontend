import { useCallback } from 'react';
import { Alert } from 'react-native';
import type {
  ProductCategory,
  ShoppingItem,
  ShoppingList,
} from '../../domain/entities/shopping-list.entity';

type AddItemInput = {
  productName: string;
  category: ProductCategory;
  unitPriceLocal: number;
  quantity: number;
};

type UpdateItemInput = {
  productName: string;
  category: string;
  unitPriceLocal: number;
  quantity: number;
};

type UseSupermarketScreenHandlersParams = {
  activeList: ShoppingList | null;
  isInitializingList: boolean;
  isAuthenticated: boolean;
  openLoginModal: (onSuccess?: () => void) => void;
  editingItem: ShoppingItem | null;
  category: ProductCategory;
  setEditingItem: React.Dispatch<React.SetStateAction<ShoppingItem | null>>;
  setPriceInLocal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSaveModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSavedListsModal: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveList: (list: ShoppingList) => void;
  addItem: (input: AddItemInput) => Promise<void> | void;
  updateItem: (id: string, input: UpdateItemInput) => Promise<void> | void;
  removeItem: (id: string) => Promise<void> | void;
  toggleItemPurchased: (id: string) => Promise<void> | void;
  updateItemQuantity: (id: string, quantity: number) => Promise<void> | void;
  updateListSettings: (
    settings: Partial<Pick<ShoppingList, 'ivaEnabled'>>,
  ) => Promise<void> | void;
  saveList: (name: string, storeName: string) => Promise<void> | void;
  deleteList: (id: string) => Promise<void> | void;
  createList: (name: string) => Promise<void> | void;
  loadLists: () => Promise<void> | void;
};

export function useSupermarketScreenHandlers({
  activeList,
  isInitializingList,
  isAuthenticated,
  openLoginModal,
  editingItem,
  category,
  setEditingItem,
  setPriceInLocal,
  setShowSaveModal,
  setShowSavedListsModal,
  setActiveList,
  addItem,
  updateItem,
  removeItem,
  toggleItemPurchased,
  updateItemQuantity,
  updateListSettings,
  saveList,
  deleteList,
  createList,
  loadLists,
}: UseSupermarketScreenHandlersParams) {
  const handleCancelEdit = useCallback(() => {
    setEditingItem(null);
  }, [setEditingItem]);

  const handleAddProduct = useCallback(
    (name: string, price: number) => {
      if (!activeList || isInitializingList) {
        return;
      }

      if (editingItem) {
        void updateItem(editingItem.id, {
          productName: name,
          category: editingItem.category,
          unitPriceLocal: price,
          quantity: editingItem.quantity,
        });
      } else {
        void addItem({
          productName: name,
          category,
          unitPriceLocal: price,
          quantity: 1,
        });
      }

      setEditingItem(null);
    },
    [
      activeList,
      isInitializingList,
      editingItem,
      updateItem,
      addItem,
      category,
      setEditingItem,
    ],
  );

  const handleToggleItem = useCallback(
    (id: string) => void toggleItemPurchased(id),
    [toggleItemPurchased],
  );

  const handleDeleteItem = useCallback(
    (id: string) => void removeItem(id),
    [removeItem],
  );

  const handleQuantityChange = useCallback(
    (id: string, quantity: number) => void updateItemQuantity(id, quantity),
    [updateItemQuantity],
  );

  const handleEditItem = useCallback(
    (item: ShoppingItem) => {
      setEditingItem(item);
    },
    [setEditingItem],
  );

  const handleToggleIva = useCallback(() => {
    if (!activeList || isInitializingList) {
      return;
    }
    void updateListSettings({ ivaEnabled: !activeList.ivaEnabled });
  }, [activeList, isInitializingList, updateListSettings]);

  const handleTogglePriceInLocal = useCallback(() => {
    setPriceInLocal((prev) => !prev);
  }, [setPriceInLocal]);

  const handleSave = useCallback(() => {
    if (!activeList || isInitializingList) {
      return;
    }
    if (!isAuthenticated) {
      openLoginModal(() => setShowSaveModal(true));
      return;
    }
    setShowSaveModal(true);
  }, [
    activeList,
    isInitializingList,
    isAuthenticated,
    openLoginModal,
    setShowSaveModal,
  ]);

  const handleSaveList = useCallback(
    (name: string, storeName: string) => {
      void saveList(name, storeName);
      setShowSaveModal(false);
    },
    [saveList, setShowSaveModal],
  );

  const handleOpenSavedLists = useCallback(() => {
    if (!activeList || isInitializingList) {
      return;
    }
    if (!isAuthenticated) {
      openLoginModal(() => {
        void loadLists();
        setShowSavedListsModal(true);
      });
      return;
    }
    void loadLists();
    setShowSavedListsModal(true);
  }, [
    activeList,
    isInitializingList,
    isAuthenticated,
    openLoginModal,
    loadLists,
    setShowSavedListsModal,
  ]);

  const handleSelectSavedList = useCallback(
    (list: ShoppingList) => {
      setActiveList(list);
      setShowSavedListsModal(false);
    },
    [setActiveList, setShowSavedListsModal],
  );

  const handleDeleteList = useCallback(() => {
    if (!activeList || isInitializingList) {
      return;
    }

    const isLocal = activeList.id.startsWith('local-');
    const listName = activeList.name || 'esta lista';

    if (isLocal && activeList.items.length === 0) {
      void createList('Nueva lista');
      return;
    }

    Alert.alert(
      'Eliminar lista',
      isLocal
        ? `Se eliminara "${listName}" y todos sus productos.`
        : `Se eliminara "${listName}" de tus listas guardadas. Esta accion no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await deleteList(activeList.id);
              await createList('Nueva lista');
            })();
          },
        },
      ],
    );
  }, [activeList, isInitializingList, deleteList, createList]);

  const handleNewList = useCallback(() => {
    if (!activeList || isInitializingList) {
      return;
    }

    if (activeList.items.length > 0) {
      Alert.alert(
        'Nueva lista',
        'Se creara una nueva lista vacia. La lista actual no guardada se perdera.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Crear nueva',
            onPress: () => void createList('Nueva lista'),
          },
        ],
      );
      return;
    }

    void createList('Nueva lista');
  }, [activeList, isInitializingList, createList]);

  return {
    handleCancelEdit,
    handleAddProduct,
    handleToggleItem,
    handleDeleteItem,
    handleQuantityChange,
    handleEditItem,
    handleToggleIva,
    handleTogglePriceInLocal,
    handleSave,
    handleSaveList,
    handleOpenSavedLists,
    handleSelectSavedList,
    handleDeleteList,
    handleNewList,
  };
}
