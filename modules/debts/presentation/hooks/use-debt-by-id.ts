import { useCallback, useEffect, useState } from 'react';
import type { Debt } from '../../domain/entities/debt.entity';
import { useDebtStore } from '../../infrastructure/store/debt.store';

export interface UseDebtByIdResult {
  debt: Debt | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  /** Actualiza en memoria la deuda cargada (sin pegarle al backend). */
  patch: (partial: Partial<Debt>) => void;
}

/**
 * Obtiene una deuda puntual por id. Primero intenta leer de la cache del store;
 * si no está, delega al datasource a través del store. La pantalla de detalle
 * no necesita conocer `DebtDatasource` ni instanciarlo.
 */
export function useDebtById(id: string | undefined): UseDebtByIdResult {
  const getDebtById = useDebtStore((s) => s.getDebtById);

  const [debt, setDebt] = useState<Debt | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setDebt(null);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const data = await getDebtById(id);
      setDebt(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo cargar la deuda';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [id, getDebtById]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = useCallback((partial: Partial<Debt>) => {
    setDebt((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  return { debt, isLoading, error, reload: load, patch };
}
