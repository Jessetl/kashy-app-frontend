import { useCallback, useState } from 'react';
import type {
  CreateDebtInput,
  Debt,
  DebtPriority,
  UpdateDebtInput,
} from '../../domain/entities/debt.entity';
import { calculateInterest } from '../../domain/entities/debt.entity';
import { useDebtStore } from '../../infrastructure/store/debt.store';

interface DebtFormState {
  title: string;
  description: string;
  amountUsd: string;
  priority: DebtPriority;
  interestRatePct: string;
  dueDate: string;
  isCollection: boolean;
}

const INITIAL_STATE: DebtFormState = {
  title: '',
  description: '',
  amountUsd: '',
  priority: 'MEDIUM',
  interestRatePct: '',
  dueDate: '',
  isCollection: false,
};

function debtToFormState(debt: Debt): DebtFormState {
  return {
    title: debt.title,
    description: debt.description ?? '',
    amountUsd: debt.amountUsd.toString(),
    priority: debt.priority,
    interestRatePct:
      debt.interestRatePct > 0 ? debt.interestRatePct.toString() : '',
    dueDate: debt.dueDate ?? '',
    isCollection: debt.isCollection,
  };
}

export function useDebtForm(editingDebt?: Debt | null) {
  const [form, setForm] = useState<DebtFormState>(
    editingDebt ? debtToFormState(editingDebt) : INITIAL_STATE,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createDebt = useDebtStore((s) => s.createDebt);
  const updateDebt = useDebtStore((s) => s.updateDebt);

  const amount = parseFloat(form.amountUsd) || 0;
  const interestRate = parseFloat(form.interestRatePct) || 0;
  const interestAmount = calculateInterest(amount, interestRate);
  const totalWithInterest = amount + interestAmount;

  const hasPastDueDate = (() => {
    if (!form.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = form.dueDate.split('-').map(Number);
    const due = new Date(y, m - 1, d);
    return due < today;
  })();

  const isValid =
    form.title.trim().length > 0 && amount > 0 && !hasPastDueDate;

  const setField = useCallback(
    <K extends keyof DebtFormState>(key: K, value: DebtFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const reset = useCallback(() => {
    setForm(editingDebt ? debtToFormState(editingDebt) : INITIAL_STATE);
  }, [editingDebt]);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!isValid) return false;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (editingDebt) {
        const data: UpdateDebtInput = {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          amountUsd: amount,
          priority: form.priority,
          interestRatePct: interestRate,
          dueDate: form.dueDate || null,
          isCollection: form.isCollection,
        };
        await updateDebt(editingDebt.id, data);
      } else {
        const input: CreateDebtInput = {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          amountUsd: amount,
          priority: form.priority,
          interestRatePct: interestRate > 0 ? interestRate : undefined,
          dueDate: form.dueDate || undefined,
          isCollection: form.isCollection,
        };
        await createDebt(input);
      }
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ocurrió un error inesperado';
      setSubmitError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isValid,
    editingDebt,
    form,
    amount,
    interestRate,
    createDebt,
    updateDebt,
  ]);

  return {
    form,
    setField,
    isValid,
    isSubmitting,
    submitError,
    interestAmount,
    totalWithInterest,
    reset,
    submit,
    isEditing: !!editingDebt,
  };
}
