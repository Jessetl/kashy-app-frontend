import { useAuth } from '@/shared/presentation/hooks/auth/use-auth';
import { useEffect, useRef } from 'react';
import type { Debt } from '../../domain/entities/debt.entity';
import { useDebtStore } from '../../infrastructure/store/debt.store';

/**
 * API pública del módulo debts: expone el arreglo `summaryDebts` (deudas + cobros
 * sin filtro de tipo) para que otros módulos calculen resúmenes globales sin
 * tener que importar el store de infrastructure.
 *
 * Se encarga de disparar la carga inicial en usuarios autenticados; los guests
 * reciben un arreglo vacío (regla #1: ningún dato de guest toca el backend).
 */
export function useSummaryDebts(): Debt[] {
  const { isAuthenticated } = useAuth();
  const summaryDebts = useDebtStore((s) => s.summaryDebts);
  const loadSummaryDebts = useDebtStore((s) => s.loadSummaryDebts);
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    if (isAuthenticated) {
      void loadSummaryDebts();
    }
  }, [isAuthenticated, loadSummaryDebts]);

  return summaryDebts;
}
