import { apiClient } from '@/shared/infrastructure/api/api-client';
import type { CountryCode } from '@/shared/domain/country/country.constants';
import { secureStorage } from '@/shared/infrastructure/storage/app-storage';
import type { ExchangeRate } from '../domain/exchange-rate.entity';

const CACHE_KEY_PREFIX = 'exchange-rate:';

function cacheKey(countryCode: CountryCode): string {
  return `${CACHE_KEY_PREFIX}${countryCode}`;
}

function isValidRate(value: unknown): value is ExchangeRate {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<ExchangeRate>;
  return (
    typeof r.rateLocalPerUsd === 'number' &&
    Number.isFinite(r.rateLocalPerUsd) &&
    r.rateLocalPerUsd > 0 &&
    typeof r.source === 'string' &&
    typeof r.fetchedAt === 'string'
  );
}

async function readCachedRate(
  countryCode: CountryCode,
): Promise<ExchangeRate | null> {
  try {
    const raw = await secureStorage.getItem(cacheKey(countryCode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isValidRate(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function writeCachedRate(
  countryCode: CountryCode,
  rate: ExchangeRate,
): Promise<void> {
  if (!isValidRate(rate)) return;
  await secureStorage.setItem(cacheKey(countryCode), JSON.stringify(rate));
}

/**
 * Obtiene la tasa de cambio vigente.
 *
 * Regla irrompible #3 (ARCHITECTURE_MASTER §10): la tasa siempre debe tener
 * un valor. Si la API falla, se devuelve la última tasa válida cacheada.
 * Solo se propaga el error si no existe ningún valor en cache.
 */
export async function fetchCurrentRate(
  countryCode: CountryCode = 'VE',
): Promise<ExchangeRate> {
  try {
    const response = await apiClient<ExchangeRate>('/exchange-rates/current', {
      skipAuth: true,
      headers: { 'X-Currency': countryCode },
    });
    void writeCachedRate(countryCode, response.data);
    return response.data;
  } catch (err) {
    const cached = await readCachedRate(countryCode);
    if (cached) {
      return cached;
    }
    throw err;
  }
}

/**
 * Lee la última tasa válida en cache sin tocar la red.
 * Útil para hidratar la UI antes de que termine la petición HTTP.
 */
export async function getCachedRate(
  countryCode: CountryCode = 'VE',
): Promise<ExchangeRate | null> {
  return readCachedRate(countryCode);
}
