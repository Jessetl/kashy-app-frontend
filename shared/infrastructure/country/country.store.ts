import {
  DEFAULT_COUNTRY_CODE,
  getCountryConfig,
  type CountryCode,
  type CountryConfig,
} from '@/shared/domain/country/country.constants';
import { create } from 'zustand';
import { secureStorage } from '../storage/app-storage';

const COUNTRY_STORAGE_KEY = 'selected-country';

interface CountryState {
  countryCode: CountryCode;
  country: CountryConfig;
  setCountry: (code: CountryCode) => void;
  hydrateCountry: () => Promise<void>;
}

export const useCountryStore = create<CountryState>()((set) => ({
  countryCode: DEFAULT_COUNTRY_CODE,
  country: getCountryConfig(DEFAULT_COUNTRY_CODE),

  setCountry: (code: CountryCode) => {
    const country = getCountryConfig(code);
    set({ countryCode: code, country });
    void secureStorage.setItem(COUNTRY_STORAGE_KEY, code);
  },

  hydrateCountry: async () => {
    const stored = await secureStorage.getItem(COUNTRY_STORAGE_KEY);
    if (stored) {
      const code = stored as CountryCode;
      set({ countryCode: code, country: getCountryConfig(code) });
    }
  },
}));
