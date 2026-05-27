import { AlertDialog } from '@/shared/presentation/components/ui/alert-dialog';
import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useAuth } from '@/shared/presentation/hooks/auth/use-auth';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useRouter } from 'expo-router';
import {
  CloudOff,
  FolderOpen,
  Plus,
  ReceiptText,
  ShoppingBasket,
  Sparkles,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  ShoppingListSearchFilters,
  ShoppingListSummary,
} from '../../domain/entities/shopping-list-summary.entity';
import type { ShoppingListType } from '../../domain/entities/shopping-list.entity';
import { CompareSelectionBar } from '../components/CompareSelectionBar';
import { SavedListSummaryCard } from '../components/SavedListSummaryCard';
import { useSavedLists } from '../hooks/useSavedLists';
import { useShoppingStore } from '../store/useShoppingStore';

type ShoppingTab = ShoppingListType;

const TAB_ORDER: ShoppingTab[] = ['TEMPLATE', 'RECEIPT', 'COMPLETED'];

/** Flow 3 — cap de listas locales en modo invitado. */
const GUEST_MAX_LISTS = 2;

interface TabConfig {
  key: ShoppingTab;
  label: string;
  /** Color clave del tab activo. */
  accent: 'primary' | 'success';
}

const TAB_CONFIG: Record<ShoppingTab, TabConfig> = {
  TEMPLATE: { key: 'TEMPLATE', label: 'Borradores', accent: 'primary' },
  RECEIPT: { key: 'RECEIPT', label: 'Activas', accent: 'success' },
  COMPLETED: { key: 'COMPLETED', label: 'Completadas', accent: 'primary' },
};

export function SavedListsScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated: isAuth, openLoginModal } = useAuth();

  const {
    summaries,
    isLoading,
    isLoadingMore,
    isAuthenticated,
    reload,
    loadMore,
  } = useSavedLists();

  const setActiveList = useShoppingStore((s) => s.setActiveList);
  const storeLists = useShoppingStore((s) => s.lists);
  const createDraft = useShoppingStore((s) => s.createDraft);
  const deleteList = useShoppingStore((s) => s.deleteList);

  // Multi-select state (Flow 13).
  const selectionMode = useShoppingStore((s) => s.selectionMode);
  const selectedIds = useShoppingStore((s) => s.selectedIds);
  const enterSelectionMode = useShoppingStore((s) => s.enterSelectionMode);
  const toggleSelected = useShoppingStore((s) => s.toggleSelected);
  const exitSelectionMode = useShoppingStore((s) => s.exitSelectionMode);

  const isOnline = useShoppingStore((s) => s.isOnline);

  const [activeTab, setActiveTab] = useState<ShoppingTab>('TEMPLATE');

  // Delete confirm (Flow 14).
  const [pendingDelete, setPendingDelete] =
    useState<ShoppingListSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Flow 3 — guest cap alert.
  const [showGuestLimitAlert, setShowGuestLimitAlert] = useState(false);

  const guestListsCount = useMemo(
    () => storeLists.filter((l) => l.id.startsWith('local-')).length,
    [storeLists],
  );

  const handleRequestDelete = useCallback(
    (summary: ShoppingListSummary) => {
      // Evita doble apertura mientras un delete está en curso (Flow 14 edge case).
      if (isDeleting) return;
      setPendingDelete(summary);
    },
    [isDeleting],
  );

  const handleCancelDelete = useCallback(() => {
    setPendingDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteList(pendingDelete.id);
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  }, [pendingDelete, deleteList]);

  const handleTabChange = useCallback(
    (tab: ShoppingTab) => {
      // Cambio de tab → salir de modo selección si estaba activo.
      if (selectionMode) exitSelectionMode();
      setActiveTab(tab);
      const filters: ShoppingListSearchFilters = { listType: tab };
      void reload(filters);
    },
    [reload, selectionMode, exitSelectionMode],
  );

  const goToEditor = useCallback(
    (listId: string) => {
      router.push(`/shopping/${listId}`);
    },
    [router],
  );

  const handleCreateTemplate = useCallback(() => {
    if (!isAuthenticated && guestListsCount >= GUEST_MAX_LISTS) {
      setShowGuestLimitAlert(true);
      return;
    }
    createDraft();
    const newId = useShoppingStore.getState().activeList?.id;
    if (newId) goToEditor(newId);
  }, [createDraft, goToEditor, isAuthenticated, guestListsCount]);

  const handleGuestLimitLogin = useCallback(() => {
    setShowGuestLimitAlert(false);
    openLoginModal();
  }, [openLoginModal]);

  const handleSelect = useCallback(
    (summary: ShoppingListSummary) => {
      // En modo selección: tap toggles en lugar de navegar.
      if (selectionMode) {
        // Solo cards COMPLETED son seleccionables.
        if (summary.listType !== 'COMPLETED') return;
        toggleSelected(summary.id);
        return;
      }
      const existing =
        storeLists.find((l) => l.id === summary.id) ?? summaryStub(summary);
      setActiveList(existing);
      goToEditor(summary.id);
    },
    [selectionMode, toggleSelected, setActiveList, storeLists, goToEditor],
  );

  const handleLongPress = useCallback(
    (summary: ShoppingListSummary) => {
      // Solo en tab Recibos y solo auth (Flow 13).
      if (!isAuthenticated) return;
      if (summary.listType !== 'COMPLETED') return;
      if (!selectionMode) {
        enterSelectionMode(summary.id);
      } else {
        toggleSelected(summary.id);
      }
    },
    [isAuthenticated, selectionMode, enterSelectionMode, toggleSelected],
  );

  const handleCompare = useCallback(() => {
    if (selectedIds.length !== 2) return;
    const [aId, bId] = selectedIds;
    exitSelectionMode();
    router.push(`/shopping/compare?aId=${aId}&bId=${bId}`);
  }, [selectedIds, router, exitSelectionMode]);

  const filteredSummaries = useMemo(
    () => summaries.filter((s) => s.listType === activeTab),
    [summaries, activeTab],
  );

  const handleRefresh = useCallback(() => {
    if (selectionMode) exitSelectionMode();
    void reload({ listType: activeTab });
  }, [reload, activeTab, selectionMode, exitSelectionMode]);

  const handleEndReached = useCallback(() => {
    if (!isAuthenticated) return;
    if (isLoading || isLoadingMore) return;
    void loadMore();
  }, [isAuthenticated, isLoading, isLoadingMore, loadMore]);

  // Cleanup: salir de modo selección al desmontar.
  useEffect(() => {
    return () => {
      if (useShoppingStore.getState().selectionMode) {
        useShoppingStore.getState().exitSelectionMode();
      }
    };
  }, []);

  const showOfflineBanner = isAuthenticated && !isOnline;

  const listHeader = (
    <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
      <View>
        <Text style={[styles.title, { color: colors.text }]}>Compras</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Planifica tus borradores y guarda tus recibos de compra
        </Text>
      </View>

      {!isAuth ? (
        <View style={styles.guestBadge}>
          <CloudOff
            size={12}
            color='rgba(255,255,255,0.85)'
            strokeWidth={2.2}
          />
          <Text style={styles.guestBadgeText}>Modo invitado</Text>
        </View>
      ) : null}

      {showOfflineBanner ? (
        <View
          style={[
            styles.offlineBanner,
            { backgroundColor: colors.warningLight },
          ]}
        >
          <CloudOff size={14} color={colors.warning} strokeWidth={2.2} />
          <Text style={[styles.offlineBannerText, { color: colors.warning }]}>
            Sin conexión — mostrando datos sincronizados localmente
          </Text>
        </View>
      ) : null}

      <ShoppingTabSelector
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredSummaries}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => (
          <SavedListSummaryCard
            summary={item}
            onPress={handleSelect}
            onLongPress={
              isAuthenticated && item.listType === 'COMPLETED'
                ? handleLongPress
                : undefined
            }
            selectionMode={selectionMode && item.listType === 'COMPLETED'}
            isSelected={selectedIds.includes(item.id)}
            onDelete={selectionMode ? undefined : handleRequestDelete}
          />
        )}
        ListHeaderComponent={listHeader}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: insets.bottom + (selectionMode ? 90 : 100),
            backgroundColor: colors.backgroundSecondary,
          },
        ]}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          isLoading && filteredSummaries.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size='large' color={colors.primary} />
            </View>
          ) : (
            <EmptyState
              activeTab={activeTab}
              isAuthenticated={isAuthenticated}
            />
          )
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size='small' color={colors.primary} />
            </View>
          ) : null
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && filteredSummaries.length > 0}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {selectionMode ? (
        <CompareSelectionBar
          count={selectedIds.length}
          max={2}
          isOnline={isOnline}
          onCancel={exitSelectionMode}
          onCompare={handleCompare}
        />
      ) : (
        <AppPressable
          onPress={handleCreateTemplate}
          accessibilityRole='button'
          accessibilityLabel='Crear nueva lista'
          style={[
            styles.fab,
            {
              backgroundColor: colors.primary,
              bottom: insets.bottom + 20,
            },
          ]}
        >
          <Plus size={24} color={colors.textInverse} pointerEvents='none' />
        </AppPressable>
      )}

      <AlertDialog
        visible={pendingDelete !== null}
        onClose={handleCancelDelete}
        tone='danger'
        title={
          pendingDelete
            ? `Eliminar lista "${pendingDelete.name}"`
            : 'Eliminar lista'
        }
        message='Esta acción no se puede deshacer. La lista y sus productos se eliminarán de forma permanente.'
        actions={[
          { label: 'Cancelar', variant: 'cancel', onPress: handleCancelDelete },
          {
            label: 'Eliminar',
            variant: 'destructive',
            onPress: () => void handleConfirmDelete(),
          },
        ]}
      />

      <AlertDialog
        visible={showGuestLimitAlert}
        onClose={() => setShowGuestLimitAlert(false)}
        tone='info'
        title={`Máximo ${GUEST_MAX_LISTS} listas en modo invitado`}
        message='Inicia sesión para crear listas ilimitadas y sincronizarlas en todos tus dispositivos.'
        actions={[
          { label: 'Cancelar', variant: 'cancel' },
          { label: 'Iniciar sesión', onPress: handleGuestLimitLogin },
        ]}
      />
    </View>
  );
}

function keyExtractor(item: ShoppingListSummary): string {
  return item.id;
}

function Separator() {
  return <View style={styles.separator} />;
}

function ShoppingTabSelector({
  activeTab,
  onTabChange,
}: {
  activeTab: ShoppingTab;
  onTabChange: (tab: ShoppingTab) => void;
}) {
  const { colors } = useAppTheme();

  const colorFor = (accent: TabConfig['accent']): string => colors[accent];

  return (
    <View
      style={[
        tabStyles.container,
        { backgroundColor: colors.backgroundSecondary },
      ]}
    >
      {TAB_ORDER.map((tabKey) => {
        const cfg = TAB_CONFIG[tabKey];
        const isActive = activeTab === tabKey;
        return (
          <AppPressable
            key={cfg.key}
            onPress={() => onTabChange(cfg.key)}
            style={[
              tabStyles.tab,
              isActive && { backgroundColor: colorFor(cfg.accent) },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                tabStyles.tabText,
                {
                  color: isActive ? colors.textInverse : colors.textSecondary,
                },
              ]}
            >
              {cfg.label}
            </Text>
          </AppPressable>
        );
      })}
    </View>
  );
}

function summaryStub(s: ShoppingListSummary) {
  return {
    id: s.id,
    userId: null,
    name: s.name,
    storeName: s.storeName,
    status: (s.isActive ? 'active' : 'completed') as 'active' | 'completed',
    listType: s.listType,
    countryCode: '',
    currencyCode: s.currencyCode,
    ivaEnabled: false,
    exchangeRateSnapshot: null,
    scheduledDate: s.scheduledDate,
    latitude: null,
    longitude: null,
    subtotalLocal: s.totalLocal,
    subtotalUsd: s.totalUsd,
    ivaLocal: 0,
    ivaUsd: null,
    totalLocal: s.totalLocal,
    totalUsd: s.totalUsd,
    items: [],
    createdAt: new Date().toISOString(),
    completedAt: s.isActive ? null : new Date().toISOString(),
  };
}

function EmptyState({
  activeTab,
  isAuthenticated,
}: {
  activeTab: ShoppingTab;
  isAuthenticated: boolean;
}) {
  const { colors } = useAppTheme();

  const Icon =
    activeTab === 'TEMPLATE'
      ? Sparkles
      : activeTab === 'RECEIPT'
        ? ShoppingBasket
        : activeTab === 'COMPLETED'
          ? ReceiptText
          : FolderOpen;

  const title =
    activeTab === 'TEMPLATE'
      ? isAuthenticated
        ? 'Sin borradores guardados'
        : 'Crea tu primera lista'
      : activeTab === 'RECEIPT'
        ? 'No hay compras activas'
        : 'Aún no hay recibos';

  const message =
    activeTab === 'TEMPLATE'
      ? isAuthenticated
        ? 'Crea un borrador para planificar tu compra. Cuando vayas al supermercado, conviértelo en compra activa para registrar precios.'
        : 'Empieza una lista local — sin cuenta. Cuando inicies sesión sincronizaremos tus borradores automáticamente.'
      : activeTab === 'RECEIPT'
        ? 'Convierte un borrador en compra activa desde su pantalla de detalle para registrar precios y marcar productos.'
        : 'Finaliza una compra activa para guardarla como recibo y poder compararla con otras.';

  return (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIcon,
          {
            backgroundColor: colors.primaryLight,
            borderColor: colors.primary,
          },
        ]}
      >
        <Icon size={40} color={colors.primary} pointerEvents='none' />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textOnSurface }]}>
        {title}
      </Text>
      <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
        {message}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  headerContent: {
    paddingHorizontal: 4,
    gap: 14,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    marginTop: 2,
  },
  guestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  guestBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.92)',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  offlineBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  separator: {
    height: 12,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
