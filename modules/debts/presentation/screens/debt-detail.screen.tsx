import { useExchangeRate } from '@/modules/shared-services/exchange-rate/presentation/use-exchange-rate';
import { formatLocalDateDisplay } from '@/shared/domain/date/local-date';
import {
  AppPressable,
  BottomSheetModal,
} from '@/shared/presentation/components/ui';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useCountry } from '@/shared/presentation/hooks/use-country';
import {
  formatLocalAmount,
  formatUsdAmount,
} from '@/shared/presentation/utils/format-currency';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowLeft,
  Calendar,
  Check,
  Edit3,
  MinusCircle,
  Trash2,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DebtPriority } from '../../domain/entities/debt.entity';
import {
  calculateTotalWithInterest,
  isOverdue,
} from '../../domain/entities/debt.entity';
import { useDebtStore } from '../../infrastructure/store/debt.store';
import { DebtForm } from '../components/debt-form';
import { useDebtById } from '../hooks/use-debt-by-id';

const PRIORITY_CONFIG: Record<
  DebtPriority,
  { label: string; color: string; Icon: typeof AlertCircle }
> = {
  HIGH: { label: 'Alta', color: '#FF8C66', Icon: AlertCircle },
  MEDIUM: { label: 'Media', color: '#FFB84D', Icon: MinusCircle },
  LOW: { label: 'Baja', color: '#63E696', Icon: ArrowDownCircle },
};

export default function DebtDetailScreen() {
  const { colors } = useAppTheme();
  const { country } = useCountry();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rate } = useExchangeRate();

  const {
    debt,
    isLoading,
    error: loadError,
    reload: loadDebt,
    patch: patchDebt,
  } = useDebtById(id);
  const [showEditForm, setShowEditForm] = useState(false);

  const markAsPaid = useDebtStore((s) => s.markAsPaid);
  const deleteDebt = useDebtStore((s) => s.deleteDebt);

  // Si la carga falla de forma permanente, muestra el error y vuelve atrás.
  if (loadError && !debt && !isLoading) {
    Alert.alert('Error', 'No se pudo cargar la deuda');
    router.back();
  }

  const handleMarkAsPaid = useCallback(() => {
    if (!debt) return;
    const isCollection = debt.isCollection;
    Alert.alert(
      isCollection ? 'Confirmar cobro' : 'Confirmar pago',
      isCollection
        ? '¿Seguro que deseas marcar este cobro como recibido?'
        : '¿Seguro que deseas marcar esta deuda como pagada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: isCollection ? 'Cobrado' : 'Pagada',
          onPress: async () => {
            try {
              await markAsPaid(debt.id);
              patchDebt({ isPaid: true });
            } catch (err) {
              const message =
                err instanceof Error
                  ? err.message
                  : 'No se pudo completar la acción';
              Alert.alert('Error', message);
            }
          },
        },
      ],
    );
  }, [debt, markAsPaid, patchDebt]);

  const handleDelete = useCallback(() => {
    if (!debt) return;
    Alert.alert('Eliminar', `¿Seguro que deseas eliminar "${debt.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDebt(debt.id);
            router.back();
          } catch (err) {
            const message =
              err instanceof Error
                ? err.message
                : 'No se pudo eliminar la deuda';
            Alert.alert('Error', message);
          }
        },
      },
    ]);
  }, [debt, deleteDebt, router]);

  const handleEditSuccess = useCallback(() => {
    setShowEditForm(false);
    void loadDebt();
  }, [loadDebt]);

  if (isLoading || !debt) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Cargando...
        </Text>
      </View>
    );
  }

  const priority = PRIORITY_CONFIG[debt.priority];
  const total = calculateTotalWithInterest(
    debt.amountUsd,
    debt.interestRatePct,
  );
  const exchangeRate = rate?.rateLocalPerUsd ?? null;
  const localAmount = exchangeRate ? total * exchangeRate : null;
  const overdue = isOverdue(debt.dueDate);

  const dueDateFormatted = debt.dueDate
    ? formatLocalDateDisplay(debt.dueDate, country.locale, {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back + Actions */}
        <View style={styles.topBar}>
          <AppPressable
            onPress={() => router.navigate('/(tabs)/debts')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={24} color={colors.text} pointerEvents='none' />
          </AppPressable>
          <View style={styles.topActions}>
            <AppPressable
              onPress={() => setShowEditForm(true)}
              style={[
                styles.iconBtn,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <Edit3 size={18} color={colors.primary} pointerEvents='none' />
            </AppPressable>
            <AppPressable
              onPress={handleDelete}
              style={[styles.iconBtn, { backgroundColor: colors.dangerLight }]}
            >
              <Trash2 size={18} color={colors.danger} pointerEvents='none' />
            </AppPressable>
          </View>
        </View>

        {/* Type Badge */}
        <View
          style={[
            styles.typeBadge,
            {
              backgroundColor: debt.isCollection
                ? colors.successLight
                : colors.dangerLight,
            },
          ]}
        >
          <Text
            style={[
              styles.typeBadgeText,
              { color: debt.isCollection ? colors.success : colors.danger },
            ]}
          >
            {debt.isCollection ? 'Cobro' : 'Deuda'}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.debtTitle, { color: colors.text }]}>
          {debt.title}
        </Text>

        {debt.description && (
          <Text style={[styles.description, { color: colors.gradientEnd }]}>
            {debt.description}
          </Text>
        )}

        {/* Amount Card */}
        <View
          style={[
            styles.amountCard,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
            Monto total
          </Text>
          <Text style={[styles.amountValue, { color: colors.textOnSurface }]}>
            {formatUsdAmount(total)}
          </Text>

          {debt.interestRatePct > 0 && (
            <View style={styles.interestRow}>
              <Text
                style={[styles.interestDetail, { color: colors.textSecondary }]}
              >
                Capital: {formatUsdAmount(debt.amountUsd)}
              </Text>
              <Text style={[styles.interestDetail, { color: colors.warning }]}>
                Interés ({debt.interestRatePct}%): $
                {formatUsdAmount(debt.interestAmountUsd)}
              </Text>
            </View>
          )}

          {localAmount !== null && (
            <View
              style={[styles.localRow, { borderTopColor: colors.borderLight }]}
            >
              <Text
                style={[styles.localLabel, { color: colors.textSecondary }]}
              >
                Equivalente VES
              </Text>
              <Text
                style={[styles.localValue, { color: colors.textOnSurface }]}
              >
                {formatLocalAmount(localAmount, country)}
              </Text>
            </View>
          )}
        </View>

        {/* Info Cards */}
        <View style={styles.infoRow}>
          {/* Priority */}
          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <priority.Icon
              size={20}
              color={priority.color}
              pointerEvents='none'
            />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Prioridad
            </Text>
            <Text style={[styles.infoValue, { color: priority.color }]}>
              {priority.label}
            </Text>
          </View>

          {/* Status */}
          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <Check
              size={20}
              color={debt.isPaid ? colors.success : colors.textSecondary}
              pointerEvents='none'
            />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Estado
            </Text>
            <Text
              style={[
                styles.infoValue,
                { color: debt.isPaid ? colors.success : colors.warning },
              ]}
            >
              {debt.isPaid ? 'Pagada' : 'Pendiente'}
            </Text>
          </View>
        </View>

        {/* Due Date */}
        {dueDateFormatted && (
          <View
            style={[
              styles.dateCard,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: overdue ? colors.danger : colors.border,
              },
            ]}
          >
            <Calendar
              size={20}
              color={overdue ? colors.danger : colors.textSecondary}
              pointerEvents='none'
            />
            <View style={styles.dateContent}>
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
                Vencimiento
              </Text>
              <Text
                style={[
                  styles.dateValue,
                  { color: overdue ? colors.danger : colors.textOnSurface },
                ]}
              >
                {dueDateFormatted}
              </Text>
              {overdue && !debt.isPaid && (
                <Text style={[styles.overdueText, { color: colors.danger }]}>
                  Vencida
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Pay Button */}
        {!debt.isPaid && (
          <AppPressable
            onPress={handleMarkAsPaid}
            style={[styles.payButton, { backgroundColor: colors.primary }]}
          >
            <Check size={20} color={colors.textInverse} pointerEvents='none' />
            <Text style={[styles.payButtonText, { color: colors.textInverse }]}>
              Marcar como pagada
            </Text>
          </AppPressable>
        )}
      </ScrollView>

      {/* Edit Form Modal */}
      <BottomSheetModal
        visible={showEditForm}
        onClose={() => setShowEditForm(false)}
        heightRatio={0.85}
        showCloseButton
      >
        <DebtForm
          editingDebt={debt}
          isCollection={debt.isCollection}
          onSuccess={handleEditSuccess}
          onCancel={() => setShowEditForm(false)}
        />
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  debtTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: -8,
  },
  amountCard: {
    borderRadius: 16,
    padding: 20,
    gap: 6,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
  },
  interestRow: {
    gap: 2,
    marginTop: 4,
  },
  interestDetail: {
    fontSize: 13,
    fontWeight: '500',
  },
  localRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  localLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  localValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  dateContent: {
    flex: 1,
    gap: 2,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  overdueText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
