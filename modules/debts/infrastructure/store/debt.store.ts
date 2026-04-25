import { useAuthStore } from '@/shared/infrastructure/auth/auth.store';
import { create } from 'zustand';
import type {
  CreateDebtInput,
  Debt,
  DebtFilters,
  DebtPriority,
  UpdateDebtInput,
} from '../../domain/entities/debt.entity';
import { calculateInterest } from '../../domain/entities/debt.entity';
import { DebtDatasource } from '../datasources/debt.datasource';

const datasource = new DebtDatasource();

/** Tipo de vista: deudas que debo vs cobros que me deben */
export type DebtTab = 'debts' | 'collections';

interface DebtState {
  debts: Debt[];
  /** Todas las deudas sin filtro de tipo — usadas para el resumen del home */
  summaryDebts: Debt[];
  isLoading: boolean;
  error: string | null;

  // Filtros activos
  activeTab: DebtTab;
  priorityFilter: DebtPriority | null;
  showPaid: boolean;

  // Actions
  setActiveTab: (tab: DebtTab) => void;
  setPriorityFilter: (priority: DebtPriority | null) => void;
  setShowPaid: (show: boolean) => void;
  loadDebts: () => Promise<void>;
  /** Carga todas las deudas no pagadas sin filtro de tipo para calcular totales globales */
  loadSummaryDebts: () => Promise<void>;
  createDebt: (input: CreateDebtInput) => Promise<void>;
  updateDebt: (id: string, data: UpdateDebtInput) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  markAsPaid: (id: string) => Promise<void>;
  /**
   * Obtiene una deuda puntual. Primero consulta la cache in-memory del store
   * (debts + summaryDebts); si no está, pide al datasource. Evita que las
   * pantallas de detalle tengan que instanciar datasources directamente.
   */
  getDebtById: (id: string) => Promise<Debt>;
  clearError: () => void;
  resetStore: () => void;
}

function buildFilters(state: DebtState): DebtFilters {
  return {
    isCollection: state.activeTab === 'collections',
    priority: state.priorityFilter ?? undefined,
    isPaid: state.showPaid ? undefined : false,
  };
}

export const useDebtStore = create<DebtState>()((set, get) => ({
  debts: [],
  summaryDebts: [],
  isLoading: false,
  error: null,
  activeTab: 'debts',
  priorityFilter: null,
  showPaid: false,

  clearError: () => set({ error: null }),

  setActiveTab: (tab) => {
    set({ activeTab: tab });
    void get().loadDebts();
  },

  setPriorityFilter: (priority) => {
    set({ priorityFilter: priority });
    void get().loadDebts();
  },

  setShowPaid: (show) => {
    set({ showPaid: show });
    void get().loadDebts();
  },

  loadDebts: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      set({ debts: [], isLoading: false });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const filters = buildFilters(get());
      const debts = await datasource.getDebts(filters);
      set({ debts, isLoading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudieron cargar las deudas';
      set({ error: message, isLoading: false });
    }
  },

  loadSummaryDebts: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      set({ summaryDebts: [] });
      return;
    }

    try {
      // Sin filtro isCollection para obtener deudas Y cobros juntos
      const summaryDebts = await datasource.getDebts({ isPaid: false });
      set({ summaryDebts });
    } catch (err) {
      // Silencioso — no bloquea la UI principal
    }
  },

  createDebt: async (input) => {
    try {
      set({ isLoading: true, error: null });

      const interestAmountUsd = calculateInterest(
        input.amountUsd,
        input.interestRatePct ?? 0,
      );

      const created = await datasource.createDebt({
        ...input,
        interestRatePct: input.interestRatePct ?? 0,
      });

      const debtWithInterest = { ...created, interestAmountUsd };

      set((state) => ({
        debts: [debtWithInterest, ...state.debts],
        summaryDebts: [debtWithInterest, ...state.summaryDebts],
        isLoading: false,
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo crear la deuda';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  updateDebt: async (id, data) => {
    try {
      set({ error: null });
      const updated = await datasource.updateDebt(id, data);

      set((state) => ({
        debts: state.debts.map((d) => (d.id === id ? updated : d)),
        summaryDebts: state.summaryDebts.map((d) => (d.id === id ? updated : d)),
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo actualizar la deuda';
      set({ error: message });
      throw err;
    }
  },

  deleteDebt: async (id) => {
    try {
      set({ error: null });
      await datasource.deleteDebt(id);

      set((state) => ({
        debts: state.debts.filter((d) => d.id !== id),
        summaryDebts: state.summaryDebts.filter((d) => d.id !== id),
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo eliminar la deuda';
      set({ error: message });
      throw err;
    }
  },

  getDebtById: async (id) => {
    const state = get();
    const cached =
      state.debts.find((d) => d.id === id) ??
      state.summaryDebts.find((d) => d.id === id);
    if (cached) return cached;
    return datasource.getDebtById(id);
  },

  markAsPaid: async (id) => {
    try {
      set({ error: null });
      const updated = await datasource.markAsPaid(id);

      set((state) => ({
        debts: state.debts.map((d) => (d.id === id ? updated : d)),
        summaryDebts: state.summaryDebts.map((d) => (d.id === id ? updated : d)),
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo marcar como pagada';
      set({ error: message });
      throw err;
    }
  },

  resetStore: () => {
    set({
      debts: [],
      summaryDebts: [],
      isLoading: false,
      error: null,
      activeTab: 'debts',
      priorityFilter: null,
      showPaid: false,
    });
  },
}));
