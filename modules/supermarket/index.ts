/**
 * API pública del módulo supermarket.
 *
 * Todo consumo cross-módulo DEBE importar desde aquí. Los stores y
 * datasources de `infrastructure/` son privados al módulo.
 */

// Domain
export type {
  ShoppingItem,
  ShoppingList,
  CreateShoppingItemInput,
  CreateShoppingListInput,
} from './domain/entities/shopping-list.entity';

// Presentation — API pública
export {
  useShoppingListsSummary,
  type ShoppingListsSummary,
} from './presentation/hooks/use-shopping-lists-summary';

// Reset programático (consumido por el flujo de logout)
export { resetSupermarketModule } from './presentation/hooks/use-reset-supermarket';
