import { formatLocalDateDisplay } from '@/shared/domain/date/local-date';
import { AppPressable } from '@/shared/presentation/components/ui';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useCountry } from '@/shared/presentation/hooks/use-country';
import { formatUsdAmount } from '@/shared/presentation/utils/format-currency';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowDownCircle,
  Calendar,
  MinusCircle,
} from 'lucide-react-native';

import type {
  Debt,
  DebtPriority,
} from '@/modules/debts/domain/entities/debt.entity';
import {
  calculateTotalWithInterest,
  isOverdue,
} from '@/modules/debts/domain/entities/debt.entity';
import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface UpcomingDebtsProps {
  debts: Debt[];
}

const PRIORITY_COLORS: Record<DebtPriority, string> = {
  HIGH: '#FF8C66',
  MEDIUM: '#FFB84D',
  LOW: '#63E696',
};

const PRIORITY_ICONS: Record<DebtPriority, typeof AlertCircle> = {
  HIGH: AlertCircle,
  MEDIUM: MinusCircle,
  LOW: ArrowDownCircle,
};

export const UpcomingDebts = React.memo(function UpcomingDebts({
  debts,
}: UpcomingDebtsProps) {
  const { colors } = useAppTheme();
  const { country } = useCountry();
  const router = useRouter();

  const handlePress = useCallback(
    (debt: Debt) => {
      router.push(`/(tabs)/debts/${debt.id}`);
    },
    [router],
  );

  if (debts.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textOnSurface }]}>
        Proximos vencimientos
      </Text>
      <View style={styles.list}>
        {debts.map((debt) => {
          const overdue = isOverdue(debt.dueDate);
          const total = calculateTotalWithInterest(
            debt.amountUsd,
            debt.interestRatePct,
          );
          const priorityColor = PRIORITY_COLORS[debt.priority];
          const PriorityIcon = PRIORITY_ICONS[debt.priority];

          const dueDateFormatted = debt.dueDate
            ? formatLocalDateDisplay(debt.dueDate, country.locale, {
                day: '2-digit',
                month: 'short',
              })
            : '';

          return (
            <AppPressable
              key={debt.id}
              onPress={() => handlePress(debt)}
              style={[
                styles.item,
                {
                  backgroundColor: colors.backgroundTertiary,
                  borderLeftColor: overdue ? colors.danger : priorityColor,
                },
              ]}
            >
              <PriorityIcon
                size={16}
                color={overdue ? colors.danger : priorityColor}
                pointerEvents='none'
              />
              <View style={styles.itemContent}>
                <Text
                  style={[styles.itemTitle, { color: colors.textOnSurface }]}
                  numberOfLines={1}
                >
                  {debt.title}
                </Text>
                <View style={styles.itemDateRow}>
                  <Calendar
                    size={11}
                    color={overdue ? colors.danger : colors.textSecondary}
                    pointerEvents='none'
                  />
                  <Text
                    style={[
                      styles.itemDate,
                      { color: overdue ? colors.danger : colors.textSecondary },
                    ]}
                  >
                    {overdue ? 'Vencida' : dueDateFormatted}
                  </Text>
                </View>
              </View>
              <View style={styles.itemRight}>
                <Text
                  style={[styles.itemAmount, { color: colors.textOnSurface }]}
                >
                  {formatUsdAmount(total)}
                </Text>
                <Text
                  style={[
                    styles.itemType,
                    {
                      color: debt.isCollection ? colors.success : colors.danger,
                    },
                  ]}
                >
                  {debt.isCollection ? 'Cobro' : 'Deuda'}
                </Text>
              </View>
            </AppPressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  list: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderLeftWidth: 3,
  },
  itemContent: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  itemType: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
