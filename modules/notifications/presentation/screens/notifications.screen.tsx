import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, BellOff, CheckCheck } from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppNotification } from '../../domain/entities/notification.entity';
import { useNotificationStore } from '../../infrastructure/store/notification.store';
import { NotificationItem } from '../components/notification-item';
import { useNotifications } from '../hooks/use-notifications';

export default function NotificationsScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // In light mode the header sits over a colored/gradient backdrop that makes
  // the default dark text unreadable — force white for title and back arrow.
  const headerForegroundColor = isDark ? colors.textOnSurface : '#FFFFFF';

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isAuthenticated,
  } = useNotifications();
  const readIds = useNotificationStore((s) => s.readIds);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  const handleItemPress = useCallback(
    (notification: AppNotification) => {
      markAsRead(notification.id);

      // Deep-link según tipo
      switch (notification.type) {
        case 'debt_due_reminder':
        case 'debt_overdue':
        case 'collection_due_reminder':
          if (notification.relatedId) {
            router.push(`/(tabs)/debts/${notification.relatedId}`);
          } else {
            router.push('/(tabs)/debts');
          }
          break;
        case 'list_reminder':
          router.push('/(tabs)/supermarket');
          break;
        case 'price_alert':
          router.push('/(tabs)');
          break;
      }
    },
    [markAsRead, router],
  );

  const renderItem = useCallback<ListRenderItem<AppNotification>>(
    ({ item }) => (
      <NotificationItem
        notification={item}
        isRead={readIds.has(item.id)}
        onPress={handleItemPress}
      />
    ),
    [readIds, handleItemPress],
  );

  const keyExtractor = useCallback((item: AppNotification) => item.id, []);

  return (
    <View
      style={[
        styles.flex,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
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
            Notificaciones
          </Text>
          {unreadCount > 0 && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {unreadCount} sin leer
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <AppPressable onPress={markAllAsRead} style={styles.markAllButton}>
            <CheckCheck size={18} color={colors.primary} strokeWidth={2} />
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              Marcar todas
            </Text>
          </AppPressable>
        )}
      </View>

      {/* Lista */}
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyContentContainer,
        ]}
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={<EmptyState isAuthenticated={isAuthenticated} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
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
        <BellOff size={32} color={colors.textTertiary} strokeWidth={1.5} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textOnSurface }]}>
        {isAuthenticated ? 'Sin notificaciones' : 'Inicia sesión'}
      </Text>
      <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
        {isAuthenticated
          ? 'Te avisaremos cuando tengas deudas por vencer, listas pendientes o cambios en la tasa.'
          : 'Para recibir recordatorios de deudas y alertas necesitas una cuenta.'}
      </Text>
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
    paddingBottom: 16,
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
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: 10,
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
