import {
  AppCalendarInput,
  AppPressable,
} from '@/shared/presentation/components/ui';
import { formatUsdAmount } from '@/shared/presentation/utils/format-currency';
import { ErrorBanner } from '@/shared/presentation/components/ui/error-banner';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import {
  AlertCircle,
  ArrowDownCircle,
  ChevronDown,
  ChevronRight,
  DollarSign,
  FileText,
  MinusCircle,
  Percent,
  User,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import type { Debt, DebtPriority } from '../../domain/entities/debt.entity';
import { useDebtForm } from '../hooks/use-debt-form';

interface DebtFormProps {
  editingDebt?: Debt | null;
  isCollection: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

const PRIORITIES: {
  key: DebtPriority;
  label: string;
  color: string;
  Icon: typeof AlertCircle;
}[] = [
  { key: 'HIGH', label: 'Alta', color: '#FF8C66', Icon: AlertCircle },
  { key: 'MEDIUM', label: 'Media', color: '#FFB84D', Icon: MinusCircle },
  { key: 'LOW', label: 'Baja', color: '#63E696', Icon: ArrowDownCircle },
];

export const DebtForm = React.memo(function DebtForm({
  editingDebt,
  isCollection,
  onSuccess,
  onCancel,
}: DebtFormProps) {
  const { colors } = useAppTheme();
  const {
    form,
    setField,
    isValid,
    isSubmitting,
    submitError,
    interestAmount,
    totalWithInterest,
    submit,
    isEditing,
  } = useDebtForm(editingDebt);

  const amountRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const interestRef = useRef<TextInput>(null);

  const [showOptional, setShowOptional] = useState(
    // Si editamos y hay datos opcionales, mostrar la sección
    !!(editingDebt && (editingDebt.description || editingDebt.interestRatePct > 0 || editingDebt.dueDate)),
  );

  // Fecha mínima = hoy (bloquea fechas pasadas)
  const minDate = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const amount = parseFloat(form.amountUsd) || 0;

  // Sincronizar isCollection con el tab activo al crear
  React.useEffect(() => {
    if (!editingDebt) {
      setField('isCollection', isCollection);
    }
  }, [isCollection, editingDebt, setField]);

  const handleSubmit = useCallback(async () => {
    const success = await submit();
    if (success) onSuccess();
  }, [submit, onSuccess]);

  const accentColor = isCollection ? colors.success : colors.danger;
  const accentLight = isCollection ? colors.successLight : colors.dangerLight;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
        keyboardDismissMode='on-drag'
        nestedScrollEnabled
      >
        {/* ─── Header ─── */}
        <View style={styles.headerSection}>
          <View style={[styles.headerBadge, { backgroundColor: accentLight }]}>
            <Text style={[styles.headerBadgeText, { color: accentColor }]}>
              {isCollection ? 'Cobro' : 'Deuda'}
            </Text>
          </View>
          <Text style={[styles.formTitle, { color: colors.textOnSurface }]}>
            {isEditing
              ? `Editar ${isCollection ? 'cobro' : 'deuda'}`
              : isCollection
                ? 'Nuevo cobro'
                : 'Nueva deuda'}
          </Text>
          <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>
            {isCollection
              ? 'Registra quién te debe dinero'
              : 'Registra a quién le debes dinero'}
          </Text>
        </View>

        {/* ─── Persona ─── */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Persona
          </Text>
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: colors.backgroundTertiary,
                borderColor: form.title.trim().length > 0 ? colors.borderFocus : colors.border,
              },
            ]}
          >
            <View style={[styles.inputIcon, { backgroundColor: accentLight }]}>
              <User size={16} color={accentColor} />
            </View>
            <TextInput
              style={[styles.inputField, { color: colors.textOnSurface }]}
              value={form.title}
              onChangeText={(v) => setField('title', v)}
              placeholder={isCollection ? '¿Quién te debe?' : '¿A quién le debes?'}
              placeholderTextColor={colors.textTertiary}
              returnKeyType='next'
              onSubmitEditing={() => amountRef.current?.focus()}
            />
          </View>
        </View>

        {/* ─── Monto + Prioridad ─── */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Monto y prioridad
          </Text>

          {/* Monto */}
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: colors.backgroundTertiary,
                borderColor: amount > 0 ? colors.borderFocus : colors.border,
              },
            ]}
          >
            <View style={[styles.inputIcon, { backgroundColor: colors.warningLight }]}>
              <DollarSign size={16} color={colors.warning} />
            </View>
            <TextInput
              ref={amountRef}
              style={[styles.inputField, { color: colors.textOnSurface }]}
              value={form.amountUsd}
              onChangeText={(v) => setField('amountUsd', v)}
              placeholder='0.00'
              placeholderTextColor={colors.textTertiary}
              keyboardType='decimal-pad'
              returnKeyType='next'
              onSubmitEditing={() => descriptionRef.current?.focus()}
            />
            {amount > 0 && (
              <View style={[styles.currencyTag, { backgroundColor: colors.warningLight }]}>
                <Text style={[styles.currencyTagText, { color: colors.warning }]}>
                  USD
                </Text>
              </View>
            )}
          </View>

          {/* Prioridad */}
          <View style={styles.priorityRow}>
            {PRIORITIES.map(({ key, label, color, Icon }) => {
              const isActive = form.priority === key;
              return (
                <AppPressable
                  key={key}
                  onPress={() => setField('priority', key)}
                  style={[
                    styles.priorityChip,
                    {
                      backgroundColor: isActive ? color : colors.backgroundTertiary,
                      borderColor: isActive ? color : colors.border,
                    },
                  ]}
                >
                  <Icon
                    size={14}
                    color={isActive ? '#FFFFFF' : color}
                  />
                  <Text
                    style={[
                      styles.priorityText,
                      { color: isActive ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {label}
                  </Text>
                </AppPressable>
              );
            })}
          </View>
        </View>

        {/* ─── Toggle campos opcionales ─── */}
        {!showOptional && (
          <AppPressable
            onPress={() => setShowOptional(true)}
            style={[styles.optionalToggle, { borderColor: colors.border }]}
          >
            <Text style={[styles.optionalToggleText, { color: colors.primary }]}>
              Agregar más detalles
            </Text>
            <ChevronRight size={16} color={colors.primary} />
          </AppPressable>
        )}

        {/* ─── Campos opcionales ─── */}
        {showOptional && (
          <Animated.View
            entering={FadeIn.duration(250)}
            exiting={FadeOut.duration(150)}
            style={styles.optionalSection}
          >
            <View style={[styles.optionalDivider, { backgroundColor: colors.borderLight }]} />

            <View style={styles.optionalHeader}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                Detalles adicionales
              </Text>
              <AppPressable
                onPress={() => setShowOptional(false)}
                style={[styles.collapseButton, { backgroundColor: colors.backgroundTertiary }]}
              >
                <ChevronDown size={14} color={colors.textSecondary} />
                <Text style={[styles.collapseButtonText, { color: colors.textSecondary }]}>
                  Ocultar
                </Text>
              </AppPressable>
            </View>

            {/* Descripción */}
            <View style={styles.fieldGroup}>
              <View
                style={[
                  styles.inputRow,
                  styles.textAreaRow,
                  {
                    backgroundColor: colors.backgroundTertiary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.inputIcon,
                    styles.textAreaIcon,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <FileText size={16} color={colors.primary} />
                </View>
                <TextInput
                  ref={descriptionRef}
                  style={[styles.inputField, styles.textAreaField, { color: colors.textOnSurface }]}
                  value={form.description}
                  onChangeText={(v) => setField('description', v)}
                  placeholder='Descripción o notas...'
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical='top'
                  returnKeyType='next'
                  blurOnSubmit
                  onSubmitEditing={() => interestRef.current?.focus()}
                />
              </View>
            </View>

            {/* Interés */}
            <View style={styles.fieldGroup}>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: colors.backgroundTertiary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={[styles.inputIcon, { backgroundColor: colors.warningLight }]}>
                  <Percent size={16} color={colors.warning} />
                </View>
                <TextInput
                  ref={interestRef}
                  style={[styles.inputField, { color: colors.textOnSurface }]}
                  value={form.interestRatePct}
                  onChangeText={(v) => setField('interestRatePct', v)}
                  placeholder='Tasa de interés'
                  placeholderTextColor={colors.textTertiary}
                  keyboardType='decimal-pad'
                />
                {form.interestRatePct !== '' && (
                  <View style={[styles.currencyTag, { backgroundColor: colors.warningLight }]}>
                    <Text style={[styles.currencyTagText, { color: colors.warning }]}>%</Text>
                  </View>
                )}
              </View>

              {interestAmount > 0 && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  style={[styles.interestCard, { backgroundColor: colors.warningLight }]}
                >
                  <View style={styles.interestRow}>
                    <Text style={[styles.interestLabel, { color: colors.textSecondary }]}>
                      Interés
                    </Text>
                    <Text style={[styles.interestValue, { color: colors.warning }]}>
                      +{formatUsdAmount(interestAmount)}
                    </Text>
                  </View>
                  <View style={[styles.interestSeparator, { backgroundColor: colors.warning, opacity: 0.2 }]} />
                  <View style={styles.interestRow}>
                    <Text style={[styles.interestLabel, { color: colors.textSecondary }]}>
                      Total
                    </Text>
                    <Text style={[styles.interestTotal, { color: colors.textOnSurface }]}>
                      {formatUsdAmount(totalWithInterest)}
                    </Text>
                  </View>
                </Animated.View>
              )}
            </View>

            {/* Fecha de vencimiento */}
            <AppCalendarInput
              label='Fecha de vencimiento'
              value={form.dueDate}
              onChange={(v) => setField('dueDate', v)}
              minDate={minDate}
              placeholder='Seleccionar fecha'
            />
          </Animated.View>
        )}

        {/* ─── Error ─── */}
        <ErrorBanner message={submitError} />

        {/* ─── Botones ─── */}
        <View style={styles.buttonSection}>
          <AppPressable
            onPress={handleSubmit}
            disabled={!isValid || isSubmitting}
            style={[
              styles.submitButton,
              {
                backgroundColor: isValid ? accentColor : colors.border,
                opacity: isSubmitting ? 0.6 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.submitText,
                { color: isValid ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {isSubmitting
                ? 'Guardando...'
                : isEditing
                  ? 'Actualizar'
                  : isCollection
                    ? 'Registrar cobro'
                    : 'Registrar deuda'}
            </Text>
          </AppPressable>

          <AppPressable onPress={onCancel} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
              Cancelar
            </Text>
          </AppPressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 20,
  },

  /* ─── header ─── */
  headerSection: {
    gap: 4,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  formSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },

  /* ─── fields ─── */
  fieldGroup: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: -2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    gap: 10,
    borderWidth: 1.5,
    minHeight: 52,
  },
  inputIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  currencyTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currencyTagText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* ─── text area ─── */
  textAreaRow: {
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  textAreaIcon: {
    marginTop: 4,
  },
  textAreaField: {
    minHeight: 64,
    paddingTop: 4,
    paddingBottom: 4,
    textAlignVertical: 'top',
  },

  /* ─── priority ─── */
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* ─── optional toggle ─── */
  optionalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  optionalToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },

  /* ─── optional section ─── */
  optionalSection: {
    gap: 16,
  },
  optionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  collapseButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  optionalDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },

  /* ─── interest preview ─── */
  interestCard: {
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  interestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  interestLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  interestValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  interestSeparator: {
    height: StyleSheet.hairlineWidth,
  },
  interestTotal: {
    fontSize: 16,
    fontWeight: '700',
  },

  /* ─── buttons ─── */
  buttonSection: {
    gap: 10,
    marginTop: 4,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
