/**
 * API pública del módulo debts.
 *
 * Todo consumo cross-módulo DEBE importar desde aquí, nunca desde
 * `infrastructure/` o `application/`. La regla está reforzada por ESLint
 * (`no-restricted-imports` en `eslint.config.js`).
 */

// Domain
export type {
  Debt,
  DebtFilters,
  DebtPriority,
  CreateDebtInput,
  UpdateDebtInput,
} from './domain/entities/debt.entity';
export {
  DEBT_PRIORITIES,
  calculateInterest,
  calculateTotalWithInterest,
  isOverdue,
} from './domain/entities/debt.entity';

// Presentation — API pública
export type { DebtTab } from './infrastructure/store/debt.store';
export { useDebts } from './presentation/hooks/use-debts';
export { useDebtForm } from './presentation/hooks/use-debt-form';
export { useDebtById } from './presentation/hooks/use-debt-by-id';
export { useSummaryDebts } from './presentation/hooks/use-summary-debts';

// Reset programático (consumido por el flujo de logout)
export { resetDebtsModule } from './presentation/hooks/use-reset-debts';
