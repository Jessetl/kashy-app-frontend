import { useExchangeRate } from '@/modules/shared-services/exchange-rate/presentation/use-exchange-rate';
import { FadeHeaderScrollView } from '@/shared/presentation/components/fade-header-scroll-view';
import { BottomSheetModal } from '@/shared/presentation/components/ui/bottom-sheet-modal';
import { DialogModal } from '@/shared/presentation/components/ui/dialog-modal';
import { ErrorBanner } from '@/shared/presentation/components/ui/error-banner';
import { useAuth } from '@/shared/presentation/hooks/auth/use-auth';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  ProductCategory,
  ShoppingItem,
} from '../../domain/entities/shopping-list.entity';
import { useShoppingListStore } from '../../infrastructure/store/shopping-list.store';
import { ListHeaderBar } from '../components/list-header-bar';
import { SaveListForm } from '../components/save-list-form';
import { SavedListsSheet } from '../components/saved-lists-sheet';
import { SupermarketAddPanel } from '../components/supermarket-add-panel';
import { SupermarketHeaderContent } from '../components/supermarket-header-content';
import { SupermarketItemsSection } from '../components/supermarket-items-section';
import { type ViewMode } from '../components/view-toggle';
import { useActiveListInitialization } from '../hooks/use-active-list-initialization';
import { useShareShoppingList } from '../hooks/use-share-shopping-list';
import { useSupermarketAddPanelVm } from '../hooks/use-supermarket-add-panel-vm';
import { useSupermarketHeaderVm } from '../hooks/use-supermarket-header-vm';
import { useSupermarketItemsVm } from '../hooks/use-supermarket-items-vm';
import { useSupermarketModalsVm } from '../hooks/use-supermarket-modals-vm';
import { useSupermarketScreenHandlers } from '../hooks/use-supermarket-screen-handlers';

const LIST_HEADER_BAR_HEIGHT = 48;

export default function SupermarketScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { isAuthenticated, openLoginModal } = useAuth();
  const { rate, localToUsd, usdToLocal } = useExchangeRate();

  const activeList = useShoppingListStore((s) => s.activeList);
  const addItem = useShoppingListStore((s) => s.addItem);
  const updateItem = useShoppingListStore((s) => s.updateItem);
  const removeItem = useShoppingListStore((s) => s.removeItem);
  const toggleItemPurchased = useShoppingListStore(
    (s) => s.toggleItemPurchased,
  );
  const updateItemQuantity = useShoppingListStore((s) => s.updateItemQuantity);
  const updateListSettings = useShoppingListStore((s) => s.updateListSettings);
  const setExchangeRate = useShoppingListStore((s) => s.setExchangeRate);
  const lists = useShoppingListStore((s) => s.lists);
  const isLoading = useShoppingListStore((s) => s.isLoading);
  const setActiveList = useShoppingListStore((s) => s.setActiveList);
  const saveList = useShoppingListStore((s) => s.saveList);
  const deleteList = useShoppingListStore((s) => s.deleteList);
  const createList = useShoppingListStore((s) => s.createList);
  const loadLists = useShoppingListStore((s) => s.loadLists);
  const error = useShoppingListStore((s) => s.error);
  const clearError = useShoppingListStore((s) => s.clearError);

  const [category, setCategory] = useState<ProductCategory>('COMIDA');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSavedListsModal, setShowSavedListsModal] = useState(false);
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

  // Auto-dismiss transient error messages after a few seconds.
  useEffect(() => {
    if (!error) {
      return;
    }
    const timeout = setTimeout(clearError, 4000);
    return () => clearTimeout(timeout);
  }, [error, clearError]);

  // Set exchange rate in the store so totals recalculate properly
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

  // Group items by category
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

  // When editing, the initial price must match the checkbox: stored as local,
  // converted to USD on demand when the toggle is in USD mode.
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

  // Only show server-persisted lists in the Folder modal (never local working lists)
  const savedLists = useMemo(
    () => lists.filter((l) => !l.id.startsWith('local-')),
    [lists],
  );

  const { canShare, handleShare } = useShareShoppingList({ activeList });

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
    handleOpenSavedLists,
    handleSelectSavedList,
    handleDeleteList,
    handleNewList,
  } = useSupermarketScreenHandlers({
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
  });

  const listViewportMinHeight = useMemo(
    () => Math.max(0, windowHeight - insets.top - LIST_HEADER_BAR_HEIGHT),
    [windowHeight, insets.top],
  );

  const { headerBarProps, headerContentProps } = useSupermarketHeaderVm({
    canInteractWithList,
    canShare,
    handleShare,
    handleSave,
    handleOpenSavedLists,
    handleDeleteList,
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

  const { itemsSectionProps } = useSupermarketItemsVm({
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
  });

  const { addPanelProps } = useSupermarketAddPanelVm({
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
  });

  const { saveModalProps, savedListsModalProps } = useSupermarketModalsVm({
    showSaveModal,
    setShowSaveModal,
    handleSaveList,
    activeListInitialName: activeList?.name,
    activeListStoreName: activeList?.storeName ?? undefined,
    showSavedListsModal,
    setShowSavedListsModal,
    savedLists,
    activeListId: activeList?.id ?? null,
    isLoading,
    handleSelectSavedList,
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
          header={<SupermarketHeaderContent {...headerContentProps} />}
        >
          <SupermarketItemsSection {...itemsSectionProps} />
        </FadeHeaderScrollView>
        {/* Inline add/edit product section */}
        <SupermarketAddPanel
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
        />
        {/* Save list modal */}
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
        {/* Saved lists modal */}
        <BottomSheetModal
          visible={savedListsModalProps.visible}
          onClose={savedListsModalProps.onClose}
          heightRatio={0.75}
        >
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              Mis listas
            </Text>
          </View>
          <SavedListsSheet
            lists={savedListsModalProps.lists}
            activeListId={savedListsModalProps.activeListId}
            isLoading={savedListsModalProps.isLoading}
            onSelect={savedListsModalProps.onSelect}
          />
        </BottomSheetModal>
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
  sheetHeader: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
