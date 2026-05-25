/**
 * API pública del módulo shopping-lists.
 *
 * Todo consumo cross-módulo DEBE importar desde aquí. Los stores y
 * datasources de `infrastructure/` son privados al módulo.
 */

// Domain — listas e items
export type {
  ShoppingItem,
  ShoppingList,
  ShoppingListStatus,
  ShoppingListType,
  CreateShoppingItemInput,
  CreateShoppingListInput,
  UpdateShoppingListInput,
  ProductCategory,
} from './domain/entities/shopping-list.entity';
export { PRODUCT_CATEGORIES } from './domain/entities/shopping-list.entity';

// Domain — summaries (search endpoint)
export type {
  ShoppingListSummary,
  ShoppingListSummariesMeta,
  ShoppingListSummariesPage,
  ShoppingListSearchFilters,
  ShoppingListSearchInput,
} from './domain/entities/shopping-list-summary.entity';

// Domain — compare
export type {
  ShoppingListsComparison,
  CompareWinner,
  CompareListRef,
  CompareMatchedItem,
  CompareUnmatchedItem,
  CompareSummary,
} from './domain/entities/shopping-list-compare.entity';

// Presentation — API pública
export {
  useShoppingListsSummary,
  type ShoppingListsSummary,
} from './presentation/hooks/use-shopping-lists-summary';
export {
  useSavedLists,
  type UseSavedListsResult,
} from './presentation/hooks/use-saved-lists';
export {
  useCompareLists,
  type UseCompareListsResult,
} from './presentation/hooks/use-compare-lists';

// Reset programático (consumido por el flujo de logout)
export { resetShoppingListsModule } from './presentation/hooks/use-reset-shopping-lists';
