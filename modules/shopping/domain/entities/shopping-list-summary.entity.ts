/**
 * Resumen ligero de una lista — el formato que devuelve
 * `POST /shopping-lists/search`. No incluye items.
 */
import type { ShoppingListType } from './shopping-list.entity';

export interface ShoppingListSummary {
  id: string;
  name: string;
  storeName: string | null;
  /** Tipo lógico del frontend: incluye `COMPLETED` cuando backend devuelve RECEIPT+!isActive. */
  listType: ShoppingListType;
  currencyCode: string;
  isActive: boolean;
  /** ISO timestamp; null si la lista no tiene fecha programada */
  scheduledDate: string | null;
  itemsCount: number;
  checkedCount: number;
  totalLocal: number;
  totalUsd: number | null;
}

export interface ShoppingListSummariesMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ShoppingListSummariesPage {
  data: ShoppingListSummary[];
  meta: ShoppingListSummariesMeta;
}

export interface ShoppingListSearchFilters {
  /**
   * `COMPLETED` se mapea en infra a `{listType: 'RECEIPT', isActive: false}` antes
   * de enviar al backend. El frontend sigue razonando en términos del enum lógico.
   */
  listType?: ShoppingListType | null;
  storeName?: string | null;
  isActive?: boolean | null;
  /** ISO timestamp */
  scheduledDateFrom?: string | null;
  /** ISO timestamp */
  scheduledDateTo?: string | null;
}

export interface ShoppingListSearchInput {
  page: number;
  limit: number;
  filters?: ShoppingListSearchFilters;
}
