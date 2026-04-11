import { useExchangeRate } from '@/modules/shared-services/exchange-rate/presentation/use-exchange-rate';
import { ParallaxScrollView } from '@/shared/presentation/components/parallax-scroll-view';
import {
  AppPressable,
  BottomSheetModal,
} from '@/shared/presentation/components/ui';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Debt } from '../../domain/entities/debt.entity';
import { DebtCard } from '../components/debt-card';
import { DebtForm } from '../components/debt-form';
import { DebtSummaryCards } from '../components/debt-summary-cards';
import { DebtTabSelector } from '../components/debt-tab-selector';
import { EmptyDebts } from '../components/empty-debts';
import { PriorityFilter } from '../components/priority-filter';
import { useDebts } from '../hooks/use-debts';

export default function DebtsScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { rate } = useExchangeRate();

  const {
    debts,
    isLoading,
    activeTab,
    priorityFilter,
    summary,
    setActiveTab,
    setPriorityFilter,
    markAsPaid,
    deleteDebt,
    reload,
    requireAuth,
  } = useDebts();

  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const handleAddPress = useCallback(() => {
    requireAuth(() => {
      setEditingDebt(null);
      setShowForm(true);
    });
  }, [requireAuth]);

  const handleDebtPress = useCallback(
    (debt: Debt) => {
      router.push(`/(tabs)/debts/${debt.id}`);
    },
    [router],
  );

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    setEditingDebt(null);
    void reload();
  }, [reload]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingDebt(null);
  }, []);

  const exchangeRate = rate?.rateLocalPerUsd ?? null;

  const parallaxIntensity = useMemo(
    () => ({
      stickyDistance: Math.max(104, Math.min(196, windowHeight * 0.24)),
      followAfterSticky: 0.86,
      liftMax: 72,
      liftRange: 220,
      pullDownScale: 1.035,
    }),
    [windowHeight],
  );

  const listViewportMinHeight = useMemo(
    () => Math.max(0, windowHeight - insets.top - 48),
    [windowHeight, insets.top],
  );

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <ParallaxScrollView
          intensity={parallaxIntensity}
          contentContainerStyle={styles.scrollContent}
          headerStyle={styles.headerContainer}
          contentStyle={[
            styles.listSection,
            {
              backgroundColor: colors.backgroundSecondary,
              minHeight: listViewportMinHeight,
            },
          ]}
          refreshing={isLoading}
          onRefresh={reload}
          refreshTintColor={colors.primary}
          header={
            <View style={styles.headerContent}>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>
                  Finanzas
                </Text>
                <Text style={[styles.subtitle, { color: colors.gradientEnd }]}>
                  Organiza lo que debes y lo que te deben
                </Text>
              </View>

              <DebtSummaryCards
                totalDebts={summary.totalDebts}
                totalCollections={summary.totalCollections}
              />

              {/* Tab Selector */}
              <DebtTabSelector
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />

              {/* Priority Filter */}
              <PriorityFilter
                activeFilter={priorityFilter}
                onFilterChange={setPriorityFilter}
              />
            </View>
          }
        >
          {/* Debt List */}
          <View style={styles.debtListContent}>
            {isLoading && debts.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size='large' color={colors.primary} />
              </View>
            ) : debts.length === 0 ? (
              <EmptyDebts isCollection={activeTab === 'collections'} />
            ) : (
              <View style={styles.listContainer}>
                {debts.map((debt) => (
                  <DebtCard
                    key={debt.id}
                    debt={debt}
                    exchangeRate={exchangeRate}
                    onPress={handleDebtPress}
                    onMarkAsPaid={markAsPaid}
                    onDelete={deleteDebt}
                  />
                ))}
              </View>
            )}
          </View>
        </ParallaxScrollView>
      </View>

      {/* FAB */}
      <AppPressable
        onPress={handleAddPress}
        style={[
          styles.fab,
          {
            backgroundColor:
              activeTab === 'collections' ? colors.success : colors.danger,
            bottom: insets.bottom,
          },
        ]}
      >
        <Plus size={24} color='#FFFFFF' pointerEvents='none' />
      </AppPressable>

      {/* Form Modal */}
      <BottomSheetModal
        visible={showForm}
        onClose={handleFormCancel}
        heightRatio={0.85}
        showCloseButton
      >
        <DebtForm
          editingDebt={editingDebt}
          isCollection={activeTab === 'collections'}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 0,
  },
  headerContainer: {
    marginBottom: 8,
    zIndex: 1,
  },
  headerContent: {
    paddingHorizontal: 20,
    gap: 14,
    paddingTop: 16,
    paddingBottom: 32,
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
  listSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
    zIndex: 2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  debtListContent: {
    paddingTop: 8,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  listContainer: {
    gap: 12,
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
