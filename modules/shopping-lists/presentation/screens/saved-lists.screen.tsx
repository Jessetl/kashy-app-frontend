import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, FolderOpen, ShoppingBag } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  ShoppingListSearchFilters,
  ShoppingListSummary,
} from '../../domain/entities/shopping-list-summary.entity';
import type { ShoppingListType } from '../../domain/entities/shopping-list.entity';
import { useShoppingListStore } from '../../infrastructure/store/shopping-list.store';
import { SavedListSummaryCard } from '../components/saved-list-summary-card';
import { useSavedLists } from '../hooks/use-saved-lists';

type TypeChip = 'ALL' | ShoppingListType;
type ActiveChip = 'ALL' | 'ACTIVE' | 'ARCHIVED';

const TYPE_CHIPS: { key: TypeChip; label: string }[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'TEMPLATE', label: 'Plantillas' },
  { key: 'RECEIPT', label: 'Recibos' },
];

const STATUS_CHIPS: { key: ActiveChip; label: string }[] = [
  { key: 'ALL', label: 'Cualquier estado' },
  { key: 'ACTIVE', label: 'Activas' },
  { key: 'ARCHIVED', label: 'Archivadas' },
];

export default function SavedListsScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    summaries,
    meta,
    isLoading,
    isLoadingMore,
    isAuthenticated,
    reload,
    loadMore,
  } = useSavedLists();

  // Hidratar la lista activa cuando el usuario toca una tarjeta — el store
  // hace fetch del detalle automáticamente vía setActiveList.
  const setActiveList = useShoppingListStore((s) => s.setActiveList);
  const storeLists = useShoppingListStore((s) => s.lists);

  const headerForegroundColor = isDark ? colors.textOnSurface : '#FFFFFF';

  const [typeFilter, setTypeFilter] = useState<TypeChip>('ALL');
  const [statusFilter, setStatusFilter] = useState<ActiveChip>('ACTIVE');

  const applyFilters = useCallback(
    (nextType: TypeChip, nextStatus: ActiveChip) => {
      const filters: ShoppingListSearchFilters = {};
      if (nextType !== 'ALL') filters.listType = nextType;
      if (nextStatus !== 'ALL') filters.isActive = nextStatus === 'ACTIVE';
      void reload(filters);
    },
    [reload],
  );

  const handleTypeSelect = useCallback(
    (key: TypeChip) => {
      setTypeFilter(key);
      applyFilters(key, statusFilter);
    },
    [applyFilters, statusFilter],
  );

  const handleStatusSelect = useCallback(
    (key: ActiveChip) => {
      setStatusFilter(key);
      applyFilters(typeFilter, key);
    },
    [applyFilters, typeFilter],
  );

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/shopping-lists');
  }, [router]);

  const handleSelect = useCallback(
    (summary: ShoppingListSummary) => {
      const existing =
        storeLists.find((l) => l.id === summary.id) ??
        summaryStub(summary);
      setActiveList(existing);
      router.replace('/(tabs)/shopping-lists');
    },
    [setActiveList, storeLists, router],
  );

  const renderItem = useCallback<ListRenderItem<ShoppingListSummary>>(
    ({ item }) => (
      <SavedListSummaryCard summary={item} onPress={handleSelect} />
    ),
    [handleSelect],
  );

  const keyExtractor = useCallback(
    (item: ShoppingListSummary) => item.id,
    [],
  );

  const handleEndReached = useCallback(() => void loadMore(), [loadMore]);
  const handleRefresh = useCallback(() => void reload(), [reload]);

  const totalLabel = useMemo(() => {
    if (meta.total === 0) return null;
    return `${meta.total} ${meta.total === 1 ? 'lista' : 'listas'}`;
  }, [meta.total]);

  return (
    <View
      style={[
        styles.flex,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <AppPressable onPress={handleBack} style={styles.backButton}>
          <ArrowLeft
            pointerEvents='none'
            size={22}
            color={headerForegroundColor}
            strokeWidth={2}
          />
        </AppPressable>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: headerForegroundColor }]}>
            Listas guardadas
          </Text>
          {totalLabel ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {totalLabel}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.filtersSection}>
        <FilterRow
          chips={TYPE_CHIPS}
          activeKey={typeFilter}
          onSelect={handleTypeSelect}
        />
        <FilterRow
          chips={STATUS_CHIPS}
          activeKey={statusFilter}
          onSelect={handleStatusSelect}
        />
      </View>

      <FlatList
        data={summaries}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          summaries.length === 0 && styles.emptyContent,
        ]}
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={
          isLoading ? null : <EmptyState isAuthenticated={isAuthenticated} />
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
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
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

function ItemSeparator() {
  return <View style={styles.separator} />;
}

function EmptyState({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIcon,
          { backgroundColor: colors.backgroundTertiary },
        ]}
      >
        {isAuthenticated ? (
          <FolderOpen size={32} color={colors.textTertiary} strokeWidth={1.5} />
        ) : (
          <ShoppingBag
            size={32}
            color={colors.textTertiary}
            strokeWidth={1.5}
          />
        )}
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textOnSurface }]}>
        {isAuthenticated ? 'Sin listas guardadas' : 'Inicia sesión'}
      </Text>
      <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
        {isAuthenticated
          ? 'Guarda tu primera lista desde la pantalla del supermercado para verla aquí.'
          : 'Para guardar y sincronizar listas necesitas una cuenta.'}
      </Text>
    </View>
  );
}

interface FilterRowProps<T extends string> {
  chips: { key: T; label: string }[];
  activeKey: T;
  onSelect: (key: T) => void;
}

function FilterRow<T extends string>({
  chips,
  activeKey,
  onSelect,
}: FilterRowProps<T>) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.filterRow}>
      {chips.map((chip) => {
        const active = chip.key === activeKey;
        return (
          <AppPressable
            key={chip.key}
            onPress={() => onSelect(chip.key)}
            style={[
              styles.filterChip,
              {
                backgroundColor: active
                  ? colors.primary
                  : colors.backgroundSecondary,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color: active ? colors.textInverse : colors.textOnSurface,
                },
              ]}
            >
              {chip.label}
            </Text>
          </AppPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  filtersSection: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 10,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: 10,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
