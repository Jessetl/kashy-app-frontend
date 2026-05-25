import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useCountry } from '@/shared/presentation/hooks/use-country';
import {
  ArrowDownLeft,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { FinancialRecordType } from '../../domain/entities/financial-record-summary.entity';
import type {
  AppNotification,
  NotificationStatus,
} from '../../domain/entities/notification.entity';

const ICON_BY_RECORD_TYPE: Record<FinancialRecordType, LucideIcon> = {
  EXPENSE: ArrowUpRight,
  INCOME: ArrowDownLeft,
};

interface NotificationItemProps {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
}

function formatRelativeTime(iso: string | null, locale: string): string {
  if (!iso) return 'Pendiente';
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

function formatAmount(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function statusLabel(status: NotificationStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pendiente';
    case 'FAILED':
      return 'Fallida';
    case 'SENT':
      return '';
  }
}

export const NotificationItem = React.memo(function NotificationItem({
  notification,
  onPress,
}: NotificationItemProps) {
  const { colors } = useAppTheme();
  const { country } = useCountry();
  const { financialRecord, isRead, sentAt, scheduledAt, status } = notification;
  const Icon = ICON_BY_RECORD_TYPE[financialRecord.type];

  const accentColor = useMemo(() => {
    if (status === 'FAILED') return colors.danger;
    return financialRecord.type === 'EXPENSE' ? colors.danger : colors.success;
  }, [status, financialRecord.type, colors]);

  const timestamp = sentAt ?? scheduledAt;
  const subtitle = statusLabel(status);

  return (
    <AppPressable
      onPress={() => onPress(notification)}
      style={[
        styles.container,
        {
          backgroundColor: isRead
            ? colors.backgroundSecondary
            : colors.backgroundTertiary,
          borderLeftColor: accentColor,
        },
      ]}
    >
      <View
        style={[styles.iconCircle, { backgroundColor: `${accentColor}22` }]}
      >
        <Icon size={20} color={accentColor} strokeWidth={2} />
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
            {financialRecord.title}
          </Text>
          {!isRead && (
            <View
              style={[styles.unreadDot, { backgroundColor: accentColor }]}
            />
          )}
        </View>
        <Text
          style={[styles.message, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {formatAmount(financialRecord.amountUsd, country.locale)} ·{' '}
          {financialRecord.type === 'EXPENSE' ? 'Gasto' : 'Ingreso'}
        </Text>
        <Text style={[styles.timeText, { color: colors.textTertiary }]}>
          {subtitle
            ? `${subtitle} · ${formatRelativeTime(timestamp, country.locale)}`
            : formatRelativeTime(timestamp, country.locale)}
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
