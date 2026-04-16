import type { CountryConfig } from '@/shared/infrastructure/country/country.constants';

const cache = new Map<string, Intl.NumberFormat>();

function getCachedFormatter(
  locale: string,
  decimals: number,
): Intl.NumberFormat {
  const key = `${locale}:${decimals}`;
  let fmt = cache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    cache.set(key, fmt);
  }
  return fmt;
}

/** "Bs. 1.234,56"  —  local currency with country locale */
export function formatLocalAmount(
  amount: number,
  country: CountryConfig,
): string {
  return `${country.currency} ${getCachedFormatter(country.locale, 2).format(amount)}`;
}

/** "$ 1,234.56"  —  USD always en-US */
export function formatUsdAmount(amount: number): string {
  return `$ ${getCachedFormatter('en-US', 2).format(amount)}`;
}
