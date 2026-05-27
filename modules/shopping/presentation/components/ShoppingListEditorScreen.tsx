import { useExchangeRate } from '@/modules/shared-services/exchange-rate/presentation/use-exchange-rate';
import { FadeHeaderScrollView } from '@/shared/presentation/components/fade-header-scroll-view';
import { AlertDialog } from '@/shared/presentation/components/ui/alert-dialog';
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
  const { isAuthenticated } = useAuth();
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
  const deleteList = useShoppingStore((s) => s.deleteList);
  const completeList = useShoppingStore((s) => s.completeList);
  const createList = useShoppingStore((s) => s.createList);
  const commitDraft = useShoppingStore((s) => s.commitDraft);
  const discardActiveDraftIfEmpty = useShoppingStore(
    (s) => s.discardActiveDraftIfEmpty,
  );
  const discardActiveDraft = useShoppingStore((s) => s.discardActiveDraft);
  const storeLists = useShoppingStore((s) => s.lists);
  const error = useShoppingStore((s) => s.error);
  const clearError = useShoppingStore((s) => s.clearError);

  const [category, setCategory] = useState<ProductCategory>('COMIDA');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const [showConvertAlert, setShowConvertAlert] = useState(false);
  const [showCompleteAlert, setShowCompleteAlert] = useState(false);
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
  const isReceipt = activeList?.listType === 'RECEIPT';
  const isCompleted = activeList?.listType === 'COMPLETED';
  const isLocalList = Boolean(activeList?.id?.startsWith('local-'));
  const isDraft = useMemo(
    () =>
      Boolean(activeList) &&
      !storeLists.some((l) => l.id === activeList?.id),
    [activeList, storeLists],
  );
  // 100% items checked y al menos uno → habilitable.
  const allItemsPurchased = totalItems > 0 && purchasedCount === totalItems;
  const canCompleteList = isReceipt && allItemsPurchased && !isDraft;
  // Lista finalizada: bloquea cualquier interacción.
  const effectiveCanInteract = canInteractWithList && !isCompleted;

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
    if (!activeList || !isDraft || activeList.items.length === 0) {
      router.back();
      return;
    }
    setShowUnsavedAlert(true);
  }, [activeList, isDraft, router]);

  const handleDiscardAndExit = useCallback(() => {
    discardActiveDraft();
    router.back();
  }, [discardActiveDraft, router]);

  const handleSaveFromAlert = useCallback(() => {
    setShowSaveModal(true);
  }, []);

  const handleConfirmConvert = useCallback(() => {
    void updateListSettings({ listType: 'RECEIPT' });
  }, [updateListSettings]);

  const handleRequestComplete = useCallback(() => {
    setShowCompleteAlert(true);
  }, []);

  const handleConfirmComplete = useCallback(() => {
    if (!activeList) return;
    void completeList(activeList.id);
  }, [activeList, completeList]);

  useEffect(() => {
    // Cleanup en unmount: descarta drafts vacíos sin tocar activeList
    // mientras la pantalla está activa (evita race con useActiveListInitialization
    // que re-crearía un draft al ver activeList=null).
    return () => {
      discardActiveDraftIfEmpty();
    };
  }, [discardActiveDraftIfEmpty]);

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
    editingItem,
    category,
    setEditingItem,
    setPriceInLocal,
    setShowSaveModal,
    setShowConvertAlert,
    addItem,
    updateItem,
    removeItem,
    toggleItemPurchased,
    updateItemQuantity,
    updateListSettings,
    deleteList,
    createList,
    commitDraft,
    navigateAfterDelete,
  });

  const listViewportMinHeight = useMemo(
    () => Math.max(0, windowHeight - insets.top - LIST_HEADER_BAR_HEIGHT),
    [windowHeight, insets.top],
  );

  const { headerBarProps, headerContentProps } = useShoppingListsHeaderVm({
    canInteractWithList: effectiveCanInteract,
    canShare,
    handleShare,
    handleSave,
    handleDeleteList,
    handleBack,
    handleConvertToReceipt,
    handleCompleteList: handleRequestComplete,
    isTemplate,
    isReceipt,
    isCompleted,
    canComplete: canCompleteList,
    isLocal: isLocalList,
    isDraft,
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
    canInteractWithList: effectiveCanInteract,
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
    canInteractWithList: effectiveCanInteract,
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
        <AlertDialog
          visible={showUnsavedAlert}
          onClose={() => setShowUnsavedAlert(false)}
          tone='danger'
          title='Lista sin guardar'
          message='Tienes productos en esta lista. ¿Quieres guardarla antes de salir?'
          actions={[
            { label: 'Cancelar', variant: 'cancel' },
            {
              label: 'Salir sin guardar',
              variant: 'destructive',
              onPress: handleDiscardAndExit,
            },
            { label: 'Guardar', onPress: handleSaveFromAlert },
          ]}
        />
        <AlertDialog
          visible={showConvertAlert}
          onClose={() => setShowConvertAlert(false)}
          tone='success'
          title='Convertir en compra'
          message='El borrador pasará a modo compra. Podrás registrar precios reales y marcar productos a medida que los recoges.'
          actions={[
            { label: 'Cancelar', variant: 'cancel' },
            { label: 'Continuar', onPress: handleConfirmConvert },
          ]}
        />
        <AlertDialog
          visible={showCompleteAlert}
          onClose={() => setShowCompleteAlert(false)}
          tone='success'
          title='Completar compra'
          message='La lista pasará a Recibos en modo solo lectura. Podrás consultarla y compararla con otras compras finalizadas.'
          actions={[
            { label: 'Cancelar', variant: 'cancel' },
            { label: 'Completar', onPress: handleConfirmComplete },
          ]}
        />
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
