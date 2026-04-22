import { formatLocalDateDisplay } from '@/shared/domain/date/local-date';
import { AppPressable } from '@/shared/presentation/components/ui';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useCountry } from '@/shared/presentation/hooks/use-country';
import {
  AlertCircle,
  ArrowDownCircle,
  Calendar,
  Check,
  MinusCircle,
  Trash2,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import type { Debt, DebtPriority } from '../../domain/entities/debt.entity';
import { calculateTotalWithInterest, isOverdue } from '../../domain/entities/debt.entity';

interface DebtCardProps {
  debt: Debt;
  exchangeRate: number | null;
  onPress: (debt: Debt) => void;
  onMarkAsPaid: (id: string) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_CONFIG: Record<
  DebtPriority,
  { color: string; Icon: typeof AlertCircle }
> = {
  HIGH: { color: '#FF8C66', Icon: AlertCircle },
  MEDIUM: { color: '#FFB84D', Icon: MinusCircle },
  LOW: { color: '#63E696', Icon: ArrowDownCircle },
};

import { formatLocalAmount, formatUsdAmount } from '@/shared/presentation/utils/format-currency';

const LAYOUT_TRANSITION = LinearTransition.duration(300);

export const DebtCard = React.memo(
  function DebtCard({
    debt,
    exchangeRate,
    onPress,
    onMarkAsPaid,
    onDelete,
  }: DebtCardProps) {
    const { colors } = useAppTheme();
    const { country } = useCountry();
    const priority = PRIORITY_CONFIG[debt.priority];
    const overdue = isOverdue(debt.dueDate);

    const displayData = useMemo(() => {
      const total = calculateTotalWithInterest(
        debt.amountUsd,
        debt.interestRatePct,
      );
      const localAmount =
        exchangeRate && exchangeRate > 0 ? total * exchangeRate : null;

      const dueDateFormatted = debt.dueDate
        ? formatLocalDateDisplay(debt.dueDate, country.locale, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : null;

      return { total, localAmount, dueDateFormatted };
    }, [debt.amountUsd, debt.interestRatePct, debt.dueDate, exchangeRate, country.locale]);

    const handleDelete = () => {
      Alert.alert(
        'Eliminar',
        `¿Seguro que deseas eliminar "${debt.title}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => onDelete(debt.id),
          },
        ],
      );
    };

    return (
      <Animated.View
        layout={LAYOUT_TRANSITION}
        entering={FadeIn.duration(250)}
        exiting={FadeOut.duration(150)}
      >
        <AppPressable
          onPress={() => onPress(debt)}
          style={[
            styles.card,
            {
              backgroundColor: colors.backgroundSecondary,
              borderLeftColor: debt.isPaid ? colors.border : priority.color,
              opacity: debt.isPaid ? 0.6 : 1,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <priority.Icon
                size={16}
                color={debt.isPaid ? colors.textSecondary : priority.color}
                pointerEvents="none"
              />
              <Text
                style={[
                  styles.title,
                  {
                    color: colors.textOnSurface,
                    textDecorationLine: debt.isPaid ? 'line-through' : 'none',
                  },
                ]}
                numberOfLines={1}
              >
                {debt.title}
              </Text>
            </View>

            <View style={styles.actions}>
              {!debt.isPaid && (
                <AppPressable
                  onPress={() => onMarkAsPaid(debt.id)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Check size={16} color={colors.success} pointerEvents="none" />
                </AppPressable>
              )}
              <AppPressable
                onPress={handleDelete}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[
                  styles.actionBtn,
                  { backgroundColor: colors.dangerLight },
                ]}
              >
                <Trash2 size={16} color={colors.danger} pointerEvents="none" />
              </AppPressable>
            </View>
          </View>

          {debt.description && (
            <Text
              style={[styles.description, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {debt.description}
            </Text>
          )}

          <View style={styles.footer}>
            <View style={styles.amountContainer}>
              <Text style={[styles.amount, { color: colors.textOnSurface }]}>
                {formatUsdAmount(displayData.total)}
              </Text>
              {debt.interestRatePct > 0 && (
                <Text
                  style={[styles.interestBadge, { color: colors.warning }]}
                >
                  +{debt.interestRatePct}%
                </Text>
              )}
              {displayData.localAmount !== null && (
                <Text
                  style={[styles.localAmount, { color: colors.textSecondary }]}
                >
                  {formatLocalAmount(displayData.localAmount, country)}
                </Text>
              )}
            </View>

            {displayData.dueDateFormatted && (
              <View style={styles.dateContainer}>
                <Calendar
                  size={12}
                  color={overdue ? colors.danger : colors.textSecondary}
                  pointerEvents="none"
                />
                <Text
                  style={[
                    styles.dateText,
                    { color: overdue ? colors.danger : colors.textSecondary },
                  ]}
                >
                  {displayData.dueDateFormatted}
                </Text>
              </View>
            )}
          </View>

          {debt.isPaid && (
            <View
              style={[styles.paidBadge, { backgroundColor: colors.successLight }]}
            >
              <Text style={[styles.paidText, { color: colors.success }]}>
                Pagada
              </Text>
            </View>
          )}
        </AppPressable>
      </Animated.View>
    );
  },
  (prev, next) =>
    prev.debt.id === next.debt.id &&
    prev.debt.isPaid === next.debt.isPaid &&
    prev.debt.title === next.debt.title &&
    prev.debt.amountUsd === next.debt.amountUsd &&
    prev.debt.interestRatePct === next.debt.interestRatePct &&
    prev.debt.dueDate === next.debt.dueDate &&
    prev.debt.priority === next.debt.priority &&
    prev.exchangeRate === next.exchangeRate,
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderLeftWidth: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  amountContainer: {
    gap: 2,
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  interestBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  localAmount: {
    fontSize: 12,
    fontWeight: '400',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  paidBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paidText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
