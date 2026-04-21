import { useExchangeRate } from '@/modules/shared-services/exchange-rate/presentation/use-exchange-rate';
import { FadeHeaderScrollView } from '@/shared/presentation/components/fade-header-scroll-view';
import { BottomSheetModal } from '@/shared/presentation/components/ui/bottom-sheet-modal';
import { DialogModal } from '@/shared/presentation/components/ui/dialog-modal';
import { ErrorBanner } from '@/shared/presentation/components/ui/error-banner';
import { useAuth } from '@/shared/presentation/hooks/auth/use-auth';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
  ShoppingList,
} from '../../domain/entities/shopping-list.entity';
import { useShoppingListStore } from '../../infrastructure/store/shopping-list.store';
import { AddProductForm } from '../components/add-product-form';
import { CategoryGroup } from '../components/category-group';
import { CategoryTabs } from '../components/category-tabs';
import { EmptyList } from '../components/empty-list';
import { ListHeaderBar } from '../components/list-header-bar';
import { ListSettingsRow } from '../components/list-settings-row';
import { ProductCounter } from '../components/product-counter';
import { SaveListForm } from '../components/save-list-form';
import { SavedListsSheet } from '../components/saved-lists-sheet';
import { SummaryCards } from '../components/summary-cards';
import { ViewToggle, type ViewMode } from '../components/view-toggle';
import { useShareShoppingList } from '../hooks/use-share-shopping-list';

const LIST_HEADER_BAR_HEIGHT = 48;

export default function SupermarketScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { isAuthenticated, openLoginModal } = useAuth();
  const { rate, localToUsd } = useExchangeRate();

  const activeList = useShoppingListStore((s) => s.activeList);
  const addItem = useShoppingListStore((s) => s.addItem);
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
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSavedListsModal, setShowSavedListsModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [priceInLocal, setPriceInLocal] = useState(false);

  useEffect(() => {
    if (activeList) return;
    void (async () => {
      await loadLists();
      const state = useShoppingListStore.getState();
      if (state.activeList) return;
      if (state.lists.length > 0) {
        state.setActiveList(state.lists[0]);
      } else {
        await createList('Nueva lista');
      }
    })();
  }, [isAuthenticated, activeList, loadLists, createList]);

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

  const handleCancelEdit = useCallback(() => {
    setEditingItem(null);
  }, []);

  const handleAddProduct = useCallback(
    (name: string, price: number) => {
      if (editingItem) {
        void useShoppingListStore.getState().updateItem(editingItem.id, {
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
    [addItem, category, editingItem],
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

  const handleEditItem = useCallback((item: ShoppingItem) => {
    setEditingItem(item);
  }, []);

  const handleToggleIva = useCallback(() => {
    void updateListSettings({ ivaEnabled: !activeList?.ivaEnabled });
  }, [updateListSettings, activeList?.ivaEnabled]);

  const handleTogglePriceInLocal = useCallback(() => {
    setPriceInLocal((prev) => !prev);
  }, []);

  // When editing, the initial price must match the checkbox: stored as local,
  // converted to USD on demand when the toggle is in USD mode.
  const editingInitialPrice = useMemo(() => {
    if (!editingItem) return undefined;
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

  const handleSave = useCallback(() => {
    if (!isAuthenticated) {
      openLoginModal(() => setShowSaveModal(true));
      return;
    }
    setShowSaveModal(true);
  }, [isAuthenticated, openLoginModal]);

  const handleSaveList = useCallback(
    (name: string, storeName: string) => {
      void saveList(name, storeName);
      setShowSaveModal(false);
    },
    [saveList],
  );

  const handleOpenSavedLists = useCallback(() => {
    if (!isAuthenticated) {
      openLoginModal(() => {
        void loadLists();
        setShowSavedListsModal(true);
      });
      return;
    }
    void loadLists();
    setShowSavedListsModal(true);
  }, [isAuthenticated, openLoginModal, loadLists]);

  // Only show server-persisted lists in the Folder modal (never local working lists)
  const savedLists = useMemo(
    () => lists.filter((l) => !l.id.startsWith('local-')),
    [lists],
  );

  const handleSelectSavedList = useCallback(
    (list: ShoppingList) => {
      setActiveList(list);
      setShowSavedListsModal(false);
    },
    [setActiveList],
  );

  const handleDeleteList = useCallback(() => {
    if (!activeList) return;

    const isLocal = activeList.id.startsWith('local-');
    const listName = activeList.name || 'esta lista';

    // Local lists with no items — just reset silently
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
  }, [activeList, deleteList, createList]);

  const { canShare, handleShare } = useShareShoppingList({ activeList });

  const handleNewList = useCallback(() => {
    if (activeList && activeList.items.length > 0) {
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
    } else {
      void createList('Nueva lista');
    }
  }, [activeList, createList]);

  const listViewportMinHeight = useMemo(
    () => Math.max(0, windowHeight - insets.top - LIST_HEADER_BAR_HEIGHT),
    [windowHeight, insets.top],
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <ListHeaderBar
          onShare={canShare ? () => void handleShare() : undefined}
          onSave={handleSave}
          onOpenSavedLists={handleOpenSavedLists}
          onDelete={handleDeleteList}
        />
        <FadeHeaderScrollView
          contentContainerStyle={styles.scrollContent}
          headerStyle={styles.headerContainer}
          header={
            <View style={styles.headerContent}>
              <View style={styles.titleRow}>
                <ProductCounter purchased={purchasedCount} total={totalItems} />
                <View style={styles.titleTextContainer}>
                  <Text style={[styles.title, { color: colors.text }]}>
                    Supermercado
                  </Text>
                  <Text
                    style={[styles.listName, { color: colors.textSecondary }]}
                  >
                    {activeList?.name ?? 'Nueva lista'}
                  </Text>
                </View>
              </View>
              <ListSettingsRow
                ivaEnabled={activeList?.ivaEnabled ?? false}
                onToggleIva={handleToggleIva}
                priceInLocal={priceInLocal}
                onTogglePriceInLocal={handleTogglePriceInLocal}
              />
              <SummaryCards
                totalLocal={totalLocal}
                totalUsd={totalUsd}
                spentLocal={spentLocal}
                ivaEnabled={activeList?.ivaEnabled ?? false}
              />
            </View>
          }
        >
          <View
            style={[
              styles.listSection,
              {
                backgroundColor: colors.backgroundSecondary,
                minHeight: listViewportMinHeight,
              },
            ]}
          >
            <ViewToggle
              mode={viewMode}
              onToggle={setViewMode}
              itemCount={totalItems}
              onNewList={handleNewList}
            />
            <View style={styles.productListContent}>
              {totalItems === 0 ? (
                <EmptyList />
              ) : (
                groupedItems.map(([cat, catItems]) => (
                  <CategoryGroup
                    key={cat}
                    category={cat}
                    items={catItems}
                    exchangeRate={exchangeRateValue}
                    viewMode={viewMode}
                    onToggle={handleToggleItem}
                    onDelete={handleDeleteItem}
                    onEdit={handleEditItem}
                    onQuantityChange={handleQuantityChange}
                  />
                ))
              )}
            </View>
          </View>
        </FadeHeaderScrollView>
        {/* Inline add/edit product section */}
        <View
          style={[
            styles.addSection,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <ErrorBanner message={error} />
          {!editingItem && (
            <CategoryTabs selected={category} onSelect={setCategory} />
          )}
          <AddProductForm
            onAdd={handleAddProduct}
            onCancelEdit={handleCancelEdit}
            initialName={editingItem?.productName}
            initialPrice={editingInitialPrice}
            priceInLocal={priceInLocal}
          />
        </View>
        {/* Save list modal */}
        <DialogModal
          visible={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          title='Guardar lista'
        >
          <SaveListForm
            onSave={handleSaveList}
            initialName={activeList?.name}
            initialStoreName={activeList?.storeName ?? undefined}
          />
        </DialogModal>
        {/* Saved lists modal */}
        <BottomSheetModal
          visible={showSavedListsModal}
          onClose={() => setShowSavedListsModal(false)}
          heightRatio={0.75}
        >
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              Mis listas
            </Text>
          </View>
          <SavedListsSheet
            lists={savedLists}
            activeListId={activeList?.id ?? null}
            isLoading={isLoading}
            onSelect={handleSelectSavedList}
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
  headerContent: {
    paddingHorizontal: 16,
    gap: 14,
    paddingTop: 8,
    paddingBottom: 32,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  titleTextContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  listName: {
    fontSize: 14,
    fontWeight: '400',
  },
  listSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
    zIndex: 2,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 0,
  },
  listHeaderBarWrap: {
    marginHorizontal: -16,
    marginBottom: 2,
  },
  productListContent: {
    paddingTop: 8,
    gap: 12,
  },
  addSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  editingLabel: {
    fontSize: 13,
    fontWeight: '600',
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
