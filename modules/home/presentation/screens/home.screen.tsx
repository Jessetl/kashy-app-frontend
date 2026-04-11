import { NotificationButton } from '@/shared/presentation/components/notification-button';
import { ThemeToggle } from '@/shared/presentation/components/theme-toggle';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExchangeRateBanner } from '../components/exchange-rate-banner';
import { FinanceOverview } from '../components/finance-overview';
import { GuestCtaCard } from '../components/guest-cta-card';
import { QuickActions } from '../components/quick-actions';
import { ShoppingSnapshot } from '../components/shopping-snapshot';
import { UpcomingDebts } from '../components/upcoming-debts';
import { useHomeSummary } from '../hooks/use-home-summary';

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const summary = useHomeSummary();

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Header — sobre el degradado */}
      <View style={styles.headerContent}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: 'rgba(99,230,150,0.2)' },
              ]}
            >
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {summary.initial}
              </Text>
            </View>
            <View>
              <Text style={[styles.greeting, { color: colors.text }]}>
                Hola, {summary.displayName}
              </Text>
              <Text
                style={[
                  styles.subGreeting,
                  { color: 'rgba(255,255,255,0.65)' },
                ]}
              >
                {summary.isAuthenticated
                  ? 'Bienvenido de vuelta'
                  : 'Modo invitado'}
              </Text>
            </View>
          </View>
          <View style={styles.topBarRight}>
            <NotificationButton
              badgeCount={
                summary.isAuthenticated ? summary.overdueCount : 0
              }
            />
            <ThemeToggle />
          </View>
        </View>

        {/* Exchange rate */}
        <ExchangeRateBanner
          rate={summary.exchangeRate}
          source={summary.exchangeSource}
          isLoading={summary.isRateLoading}
        />
      </View>

      {/* Content — fondo blanco, sube sobre el header */}
      <View
        style={[
          styles.contentSection,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        {/* Quick Actions */}
        <QuickActions />

        {/* Shopping Snapshot */}
        <ShoppingSnapshot
          listName={summary.activeListName}
          totalItems={summary.activeListItemCount}
          purchasedItems={summary.activeListPurchasedCount}
          totalLocal={summary.activeListTotalLocal}
          exchangeRate={summary.exchangeRate}
        />

        {/* Finance Overview (auth only) */}
        {summary.isAuthenticated && (
          <FinanceOverview
            totalDebts={summary.totalDebts}
            totalCollections={summary.totalCollections}
            balance={summary.balance}
            overdueCount={summary.overdueCount}
          />
        )}

        {/* Upcoming Debts (auth only) */}
        {summary.isAuthenticated && (
          <UpcomingDebts debts={summary.upcomingDebts} />
        )}

        {/* Guest CTA */}
        {!summary.isAuthenticated && <GuestCtaCard />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  headerContent: {
    paddingHorizontal: 20,
    gap: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 19,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subGreeting: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 1,
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});
