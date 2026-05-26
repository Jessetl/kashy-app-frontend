import { useExchangeRate } from '@/modules/shared-services/exchange-rate/presentation/use-exchange-rate';
import { FadeHeaderScrollView } from '@/shared/presentation/components/fade-header-scroll-view';
import { DialogModal } from '@/shared/presentation/components/ui/dialog-modal';
import { ErrorBanner } from '@/shared/presentation/components/ui/error-banner';
import { useAuth } from '@/shared/presentation/hooks/auth/use-auth';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  ProductCategory,
  ShoppingItem,
} from '../../domain/entities/shopping-list.entity';
import { useShoppingStore } from '../store/useShoppingStore';
import { ListHeaderBar } from '../components/ListHeaderBar';
import { SaveListForm } from '../components/SaveListForm';
import { ShoppingListsAddPanel } from '../components/ShoppingListsAddPanel';
import { ShoppingListsHeaderContent } from '../components/ShoppingListsHeaderContent';
import { ShoppingListsItemsSection } from '../components/ShoppingListsItemsSection';
import { type ViewMode } from '../components/ViewToggle';
import { useActiveListInitialization } from '../hooks/useActiveListInitialization';
import { useShareShoppingList } from '../hooks/useShareShoppingList';
import { useShoppingListsAddPanelVm } from '../hooks/useShoppingListsAddPanelVm';
import { useShoppingListsHeaderVm } from '../hooks/useShoppingListsHeaderVm';
import { useShoppingListsItemsVm } from '../hooks/useShoppingListsItemsVm';
import { useShoppingListsModalsVm } from '../hooks/useShoppingListsModalsVm';
import { useShoppingListsScreenHandlers } from '../hooks/useShoppingListsScreenHandlers';

const LIST_HEADER_BAR_HEIGHT = 48;

export function ShoppingListEditorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const { isAuthenticated, openLoginModal } = useAuth();
  const { rate, localToUsd, usdToLocal } = useExchangeRate();

  const activeList = useShoppingStore((s) => s.activeList);
  const addItem = useShoppingStore((s) => s.addItem);
  const updateItem = useShoppingStore((s) => s.updateItem);
  const removeItem = useShoppingStore((s) => s.removeItem);
  const toggleItemPurchased = useShoppingStore(
    (s) => s.toggleItemPurchased,
  );
  const updateItemQuantity = useShoppingStore((s) => s.updateItemQuantity);
  const updateListSettings = useShoppingStore((s) => s.updateListSettings);
  const setExchangeRate = useShoppingStore((s) => s.setExchangeRate);
  const saveList = useShoppingStore((s) => s.saveList);
  const deleteList = useShoppingStore((s) => s.deleteList);
  const createList = useShoppingStore((s) => s.createList);
  const error = useShoppingStore((s) => s.error);
  const clearError = useShoppingStore((s) => s.clearError);

  const [category, setCategory] = useState<ProductCategory>('COMIDA');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [priceInLocal, setPriceInLocal] = useState(false);
  const {
    isInitializingList,
    listInitError,
    canInteractWithList,
    handleRetryListInitialization,
  } = useActiveListInitialization({
    activeList,
    isAuthenticated,
  });

  useEffect(() => {
    if (!error) {
      return;
    }
    const timeout = setTimeout(clearError, 4000);
    return () => clearTimeout(timeout);
  }, [error, clearError]);

  useEffect(() => {
    if (
      rate &&
      activeList &&
      activeList.exchangeRateSnapshot !== rate.rateLocalPerUsd
    ) {
      setExchangeRate(rate.rateLocalPerUsd);
    }
  }, [rate, activeList, setExchangeRate]);

  const items = useMemo(() => activeList?.items ?? [], [activeList?.items]);

  const purchasedCount = useMemo(
    () => items.filter((i) => i.isPurchased).length,
    [items],
  );

  const totalItems = items.length;
  const totalLocal = activeList?.totalLocal ?? 0;
  const totalUsd = rate ? localToUsd(totalLocal) : 0;

  const spentLocal = useMemo(
    () =>
      items
        .filter((i) => i.isPurchased)
        .reduce((sum, i) => sum + i.totalLocal, 0),
    [items],
  );

  const exchangeRateValue = rate?.rateLocalPerUsd ?? null;

  const isTemplate = activeList?.listType === 'TEMPLATE';

  const groupedItems = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {};
    for (const item of items) {
      const cat = item.category || 'otros';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(item);
    }
    return Object.entries(groups);
  }, [items]);

  const editingInitialPrice = useMemo(() => {
    if (!editingItem) {
      return undefined;
    }
    const localPrice = editingItem.unitPriceLocal;
    if (priceInLocal) {
      return localPrice.toString();
    }
    const usdPrice = localToUsd(localPrice);
    if (!usdPrice || !Number.isFinite(usdPrice) || usdPrice <= 0) {
      return localPrice.toString();
    }
    return usdPrice.toFixed(2);
  }, [editingItem, priceInLocal, localToUsd]);

  const { canShare, handleShare } = useShareShoppingList({ activeList });

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const navigateAfterDelete = useCallback(() => {
    router.back();
  }, [router]);

  const {
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
    handleConvertToReceipt,
    handleDeleteList,
    handleNewList,
  } = useShoppingListsScreenHandlers({
    activeList,
    isInitializingList,
    isAuthenticated,
    openLoginModal,
    editingItem,
    category,
    setEditingItem,
    setPriceInLocal,
    setShowSaveModal,
    addItem,
    updateItem,
    removeItem,
    toggleItemPurchased,
    updateItemQuantity,
    updateListSettings,
    saveList,
    deleteList,
    createList,
    navigateAfterDelete,
  });

  const listViewportMinHeight = useMemo(
    () => Math.max(0, windowHeight - insets.top - LIST_HEADER_BAR_HEIGHT),
    [windowHeight, insets.top],
  );

  const { headerBarProps, headerContentProps } = useShoppingListsHeaderVm({
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
    activeListName: activeList?.name ?? 'Nueva lista',
    ivaEnabled: activeList?.ivaEnabled ?? false,
    priceInLocal,
    handleToggleIva,
    handleTogglePriceInLocal,
    totalLocal,
    totalUsd,
    spentLocal,
  });

  const { itemsSectionProps } = useShoppingListsItemsVm({
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
    hidePrices: isTemplate,
  });

  const { addPanelProps } = useShoppingListsAddPanelVm({
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
    isExchangeRateAvailable: Boolean(rate),
    errorMessage: error,
    hidePrice: isTemplate,
  });

  const { saveModalProps } = useShoppingListsModalsVm({
    showSaveModal,
    setShowSaveModal,
    handleSaveList,
    activeListInitialName: activeList?.name,
    activeListStoreName: activeList?.storeName ?? undefined,
  });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <ListHeaderBar {...headerBarProps} />
        <FadeHeaderScrollView
          contentContainerStyle={styles.scrollContent}
          headerStyle={styles.headerContainer}
          header={<ShoppingListsHeaderContent {...headerContentProps} />}
        >
          <ShoppingListsItemsSection {...itemsSectionProps} />
        </FadeHeaderScrollView>
        <ShoppingListsAddPanel
          canInteractWithList={addPanelProps.canInteractWithList}
          isInitializingList={addPanelProps.isInitializingList}
          listInitError={addPanelProps.listInitError}
          onRetryListInitialization={addPanelProps.onRetryListInitialization}
          editingItem={addPanelProps.editingItem}
          category={addPanelProps.category}
          onSelectCategory={addPanelProps.onSelectCategory}
          onAddProduct={addPanelProps.onAddProduct}
          onCancelEdit={addPanelProps.onCancelEdit}
          editingInitialPrice={addPanelProps.editingInitialPrice}
          priceInLocal={addPanelProps.priceInLocal}
          usdToLocal={addPanelProps.usdToLocal}
          localToUsd={addPanelProps.localToUsd}
          isExchangeRateAvailable={addPanelProps.isExchangeRateAvailable}
          topContent={<ErrorBanner message={addPanelProps.topErrorMessage} />}
          hidePrice={addPanelProps.hidePrice}
        />
        <DialogModal
          visible={saveModalProps.visible}
          onClose={saveModalProps.onClose}
          title='Guardar lista'
        >
          <SaveListForm
            onSave={saveModalProps.onSave}
            initialName={saveModalProps.initialName}
            initialStoreName={saveModalProps.initialStoreName}
          />
        </DialogModal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: 8,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 0,
  },
});
