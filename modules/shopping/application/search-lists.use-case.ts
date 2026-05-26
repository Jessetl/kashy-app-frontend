import type {
  ShoppingListSearchInput,
  ShoppingListSummariesPage,
} from '../domain/entities/shopping-list-summary.entity';
import type { ShoppingListPort } from '../domain/ports/shopping-list.port';

/** Caso de uso puro: lista paginada de summaries con filtros. */
export async function searchShoppingLists(
  port: ShoppingListPort,
  input: Partial<ShoppingListSearchInput> = {},
): Promise<ShoppingListSummariesPage> {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.max(1, input.limit ?? 20);
  return port.searchLists({ page, limit, filters: input.filters });
}
