import { useCountryStore } from '@/shared/infrastructure/country/country.store';
import { useCallback, useEffect, useState } from 'react';
import type { ExchangeRate } from '../domain/exchange-rate.entity';
import { fetchCurrentRate } from '../infrastructure/exchange-rate.datasource';

export function useExchangeRate() {
  const countryCode = useCountryStore((s) => s.countryCode);

  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchCurrentRate(countryCode);
      setRate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener la tasa');
    } finally {
      setIsLoading(false);
    }
  }, [countryCode]); // re-crea cuando cambia el país → dispara el useEffect

  useEffect(() => {
    void load();
  }, [load]);

  const localToUsd = useCallback(
    (local: number): number => {
      if (!rate || rate.rateLocalPerUsd <= 0) {
        return 0;
      }
      return local / rate.rateLocalPerUsd;
    },
    [rate],
  );

  const usdToLocal = useCallback(
    (usd: number): number => {
      if (!rate) {
        return 0;
      }
      return usd * rate.rateLocalPerUsd;
    },
    [rate],
  );

  return { rate, isLoading, error, reload: load, localToUsd, usdToLocal };
}
