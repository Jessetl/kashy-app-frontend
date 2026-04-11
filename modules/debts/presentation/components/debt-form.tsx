import { AppPressable } from '@/shared/presentation/components/ui';
import { ErrorBanner } from '@/shared/presentation/components/ui/error-banner';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { DollarSign, Percent } from 'lucide-react-native';
import React, { useCallback, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Debt, DebtPriority } from '../../domain/entities/debt.entity';
import { useDebtForm } from '../hooks/use-debt-form';

interface DebtFormProps {
  editingDebt?: Debt | null;
  isCollection: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

const PRIORITIES: { key: DebtPriority; label: string; color: string }[] = [
  { key: 'HIGH', label: 'Alta', color: '#FF8C66' },
  { key: 'MEDIUM', label: 'Media', color: '#FFB84D' },
  { key: 'LOW', label: 'Baja', color: '#63E696' },
];

const formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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

  // Sincronizar isCollection con el tab activo al crear
  React.useEffect(() => {
    if (!editingDebt) {
      setField('isCollection', isCollection);
    }
  }, [isCollection, editingDebt, setField]);

  const handleSubmit = useCallback(async () => {
    const success = await submit();
    if (success) {
      onSuccess();
    }
  }, [submit, onSuccess]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        <Text style={[styles.formTitle, { color: colors.textOnSurface }]}>
          {isEditing ? 'Editar' : isCollection ? 'Nuevo Cobro' : 'Nueva Deuda'}
        </Text>

        {/* Título */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {isCollection ? '¿Quién te debe?' : '¿A quién le debes?'}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundTertiary,
                color: colors.textOnSurface,
                borderColor: colors.border,
              },
            ]}
            value={form.title}
            onChangeText={(v) => setField('title', v)}
            placeholder='Ej: Juan Pérez'
            placeholderTextColor={colors.textTertiary}
            returnKeyType='next'
            onSubmitEditing={() => amountRef.current?.focus()}
          />
        </View>

        {/* Monto */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Monto (USD)
          </Text>
          <View
            style={[
              styles.inputWithIcon,
              {
                backgroundColor: colors.backgroundTertiary,
                borderColor: colors.border,
              },
            ]}
          >
            <DollarSign
              size={18}
              color={colors.textSecondary}
              pointerEvents='none'
            />
            <TextInput
              ref={amountRef}
              style={[styles.inputInner, { color: colors.textOnSurface }]}
              value={form.amountUsd}
              onChangeText={(v) => setField('amountUsd', v)}
              placeholder='0.00'
              placeholderTextColor={colors.textTertiary}
              keyboardType='decimal-pad'
              returnKeyType='next'
              onSubmitEditing={() => descriptionRef.current?.focus()}
            />
          </View>
        </View>

        {/* Descripción */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Descripción (opcional)
          </Text>
          <TextInput
            ref={descriptionRef}
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: colors.backgroundTertiary,
                color: colors.textOnSurface,
                borderColor: colors.border,
              },
            ]}
            value={form.description}
            onChangeText={(v) => setField('description', v)}
            placeholder='Detalle de la deuda...'
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical='top'
          />
        </View>

        {/* Prioridad */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Prioridad
          </Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map(({ key, label, color }) => {
              const isActive = form.priority === key;
              return (
                <AppPressable
                  key={key}
                  onPress={() => setField('priority', key)}
                  style={[
                    styles.priorityChip,
                    {
                      backgroundColor: isActive
                        ? color
                        : colors.backgroundTertiary,
                      borderColor: isActive ? color : colors.border,
                    },
                  ]}
                >
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

        {/* Interés */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Tasa de interés (opcional)
          </Text>
          <View
            style={[
              styles.inputWithIcon,
              {
                backgroundColor: colors.backgroundTertiary,
                borderColor: colors.border,
              },
            ]}
          >
            <Percent
              size={18}
              color={colors.textSecondary}
              pointerEvents='none'
            />
            <TextInput
              style={[styles.inputInner, { color: colors.textOnSurface }]}
              value={form.interestRatePct}
              onChangeText={(v) => setField('interestRatePct', v)}
              placeholder='0'
              placeholderTextColor={colors.textTertiary}
              keyboardType='decimal-pad'
            />
          </View>
          {interestAmount > 0 && (
            <Text style={[styles.interestPreview, { color: colors.warning }]}>
              Interés: ${formatter.format(interestAmount)} — Total: $
              {formatter.format(totalWithInterest)}
            </Text>
          )}
        </View>

        {/* Fecha de vencimiento */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Fecha de vencimiento (opcional)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundTertiary,
                color: colors.textOnSurface,
                borderColor: colors.border,
              },
            ]}
            value={form.dueDate}
            onChangeText={(v) => setField('dueDate', v)}
            placeholder='YYYY-MM-DD'
            placeholderTextColor={colors.textTertiary}
            keyboardType='numbers-and-punctuation'
          />
        </View>

        {/* Error */}
        <ErrorBanner message={submitError} />

        {/* Botones */}
        <View style={styles.buttonRow}>
          <AppPressable
            onPress={onCancel}
            style={[
              styles.button,
              styles.cancelButton,
              { borderColor: colors.border },
            ]}
          >
            <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
              Cancelar
            </Text>
          </AppPressable>

          <AppPressable
            onPress={handleSubmit}
            disabled={!isValid || isSubmitting}
            style={[
              styles.button,
              styles.submitButton,
              {
                backgroundColor: isValid ? colors.primary : colors.border,
                opacity: isSubmitting ? 0.6 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color: isValid ? colors.textInverse : colors.textSecondary,
                  fontWeight: '700',
                },
              ]}
            >
              {isSubmitting
                ? 'Guardando...'
                : isEditing
                  ? 'Actualizar'
                  : 'Crear'}
            </Text>
          </AppPressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 8,
    borderWidth: 1,
  },
  inputInner: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  interestPreview: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  submitButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
