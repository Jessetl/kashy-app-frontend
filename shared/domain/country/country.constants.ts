export const COUNTRIES = [
  {
    code: 'VE',
    name: 'Venezuela',
    flag: '🇻🇪',
    currency: 'Bs.',
    currencyLabel: 'En Bs.',
    locale: 'es-VE',
  },
  {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    currency: 'ARS',
    currencyLabel: 'En ARS',
    locale: 'es-AR',
  },
  {
    code: 'CL',
    name: 'Chile',
    flag: '🇨🇱',
    currency: 'CLP',
    currencyLabel: 'En CLP',
    locale: 'es-CL',
  },
  {
    code: 'CO',
    name: 'Colombia',
    flag: '🇨🇴',
    currency: 'COP',
    currencyLabel: 'En COP',
    locale: 'es-CO',
  },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]['code'];
export type CountryConfig = (typeof COUNTRIES)[number];

export const DEFAULT_COUNTRY_CODE: CountryCode = 'VE';

export function getCountryConfig(code: CountryCode): CountryConfig {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}
