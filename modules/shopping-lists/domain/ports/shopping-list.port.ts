import type { ShoppingListsComparison } from '../entities/shopping-list-compare.entity';
import type {
  ShoppingListSearchInput,
  ShoppingListSummariesPage,
} from '../entities/shopping-list-summary.entity';
import type {
  CreateShoppingItemInput,
  CreateShoppingListInput,
  ShoppingList,
  UpdateShoppingListInput,
} from '../entities/shopping-list.entity';

/**
 * Contrato cara al backend según el router `/shopping-lists`.
 *
 * Modelo de items: `patchList` recibe el array completo y el backend hace
 * upsert por `id`. No existen endpoints per-item.
 */
export interface ShoppingListPort {
  /** POST /shopping-lists — crea la lista con todos sus items en un único request. */
  createList(input: CreateShoppingListInput): Promise<ShoppingList>;

  /** POST /shopping-lists/search — listado paginado con filtros. Devuelve summaries. */
  searchLists(input: ShoppingListSearchInput): Promise<ShoppingListSummariesPage>;

  /** GET /shopping-lists/:id — detalle completo con items y totales. */
  getListById(id: string): Promise<ShoppingList>;

  /**
   * PATCH /shopping-lists/:id — actualiza metadata y/o reemplaza items mediante upsert.
   * - Item con `id` conocido → actualiza.
   * - Item sin `id` → crea.
   * - Item existente cuyo `id` no aparece → elimina.
   * - Si `items` se omite, los items existentes se conservan.
   */
  patchList(id: string, data: UpdateShoppingListInput): Promise<ShoppingList>;

  /** DELETE /shopping-lists/:id — 204 No Content. */
  deleteList(id: string): Promise<void>;

  /** POST /shopping-lists/compare — cruza productos entre dos listas. */
  compareLists(listAId: string, listBId: string): Promise<ShoppingListsComparison>;
}

/** Convenience type re-export — algunos consumidores antiguos esperan estos en el port. */
export type {
  CreateShoppingItemInput,
  CreateShoppingListInput,
  UpdateShoppingListInput,
};
