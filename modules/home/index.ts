/**
 * API pública del módulo home.
 *
 * Home es un agregador de presentación — no tiene domain ni infrastructure
 * propios porque su único trabajo es componer datos de otros módulos
 * (debts, supermarket, notifications, exchange-rate) en una vista única.
 */

// Presentation — API pública
export {
  useHomeSummary,
  type HomeSummary,
} from './presentation/hooks/use-home-summary';
