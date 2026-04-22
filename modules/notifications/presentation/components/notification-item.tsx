import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useCountry } from '@/shared/presentation/hooks/use-country';
import {
  AlertTriangle,
  Clock,
  HandCoins,
  ShoppingCart,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type {
  AppNotification,
  NotificationSeverity,
  NotificationType,
} from '../../domain/entities/notification.entity';

const ICON_MAP: Record<NotificationType, LucideIcon> = {
  debt_due_reminder: Clock,
  debt_overdue: AlertTriangle,
  collection_due_reminder: HandCoins,
  list_reminder: ShoppingCart,
  price_alert: TrendingUp,
};

interface NotificationItemProps {
  notification: AppNotification;
  isRead: boolean;
  onPress: (notification: AppNotification) => void;
}

function formatRelativeTime(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `Hace ${days} d`;
  return new Date(iso).toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
  });
}

export const NotificationItem = React.memo(function NotificationItem({
  notification,
  isRead,
  onPress,
}: NotificationItemProps) {
  const { colors } = useAppTheme();
  const { country } = useCountry();
  const Icon = ICON_MAP[notification.type];

  const severityColor = useMemo(() => {
    const map: Record<NotificationSeverity, string> = {
      danger: colors.danger,
      warning: colors.warning ?? colors.danger,
      info: colors.primary,
      success: colors.success,
    };
    return map[notification.severity];
  }, [notification.severity, colors]);

  return (
    <AppPressable
      onPress={() => onPress(notification)}
      style={[
        styles.container,
        {
          backgroundColor: isRead
            ? colors.backgroundSecondary
            : colors.backgroundTertiary,
          borderLeftColor: severityColor,
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: `${severityColor}22` },
        ]}
      >
        <Icon size={20} color={severityColor} strokeWidth={2} />
      </View>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.title,
              {
                color: colors.textOnSurface,
                fontWeight: isRead ? '500' : '700',
              },
            ]}
            numberOfLines={2}
          >
            {notification.title}
          </Text>
          {!isRead && (
            <View
              style={[styles.unreadDot, { backgroundColor: severityColor }]}
            />
          )}
        </View>
        <Text
          style={[styles.message, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {notification.message}
        </Text>
        <Text style={[styles.timeText, { color: colors.textTertiary }]}>
          {formatRelativeTime(notification.createdAt, country.locale)}
        </Text>
      </View>
    </AppPressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 3,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
