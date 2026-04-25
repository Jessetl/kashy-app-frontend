/**
 * API pública del servicio compartido exchange-rate.
 */

// Domain
export type { ExchangeRate } from './domain/exchange-rate.entity';

// Presentation — API pública
export { useExchangeRate } from './presentation/use-exchange-rate';

// Datasource — excepcionalmente expuesto para consumidores que necesitan
// la tasa fuera del ciclo de render (ej. domain-layer util inexistente;
// hoy no hay consumidores así, pero se deja documentado).
export {
  fetchCurrentRate,
  getCachedRate,
} from './infrastructure/exchange-rate.datasource';
