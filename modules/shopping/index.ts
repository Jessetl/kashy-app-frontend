/**
 * API pública del módulo shopping.
 *
 * Todo consumo cross-módulo DEBE importar desde aquí. Los datasources de
 * `infrastructure/` son privados al módulo.
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
} from './presentation/hooks/useShoppingListsSummary';
export {
  useSavedLists,
  type UseSavedListsResult,
} from './presentation/hooks/useSavedLists';
export {
  useCompareLists,
  type UseCompareListsResult,
} from './presentation/hooks/useCompareLists';

// Reset programático (consumido por el flujo de logout)
export { resetShoppingListsModule } from './presentation/hooks/useResetShoppingLists';
