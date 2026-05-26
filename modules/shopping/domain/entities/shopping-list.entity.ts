/** Estado lógico de la lista — derivado de `isActive` del backend. */
export type ShoppingListStatus = 'active' | 'completed';

/** Tipo de lista per spec. Para nuevas listas el frontend usa `TEMPLATE` por defecto. */
export type ShoppingListType = 'TEMPLATE' | 'RECEIPT';

/** Producto dentro de una lista de compras */
export interface ShoppingItem {
  id: string;
  listId: string;
  productName: string;
  category: string;
  unitPriceLocal: number;
  quantity: number;
  /** Derivado: unitPriceLocal * quantity. Calculado en el mapper para preservar la UI actual. */
  totalLocal: number;
  unitPriceUsd: number | null;
  /** Derivado: unitPriceUsd * quantity, o null si no hay precio en USD. */
  totalUsd: number | null;
  /** Mapeado desde `isChecked` del backend. */
  isPurchased: boolean;
  /** Sintetizado en el mapper — el backend no devuelve `createdAt` en cada item. */
  createdAt: string;
}

/** Lista de compras */
export interface ShoppingList {
  id: string;
  userId: string | null;
  name: string;
  storeName: string | null;
  /** Derivado de `isActive`: `active` cuando true, `completed` cuando false. */
  status: ShoppingListStatus;
  listType: ShoppingListType;
  countryCode: string;
  currencyCode: string;
  ivaEnabled: boolean;
  exchangeRateSnapshot: number | null;
  scheduledDate: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Subtotal sin IVA — backend authoritative. */
  subtotalLocal: number;
  subtotalUsd: number | null;
  ivaLocal: number;
  ivaUsd: number | null;
  /** Total con IVA — backend authoritative. */
  totalLocal: number;
  /** Mapeado: backend puede devolver null; se preserva ese valor. */
  totalUsd: number | null;
  items: ShoppingItem[];
  createdAt: string;
  completedAt: string | null;
}

/** Datos para crear un producto. `id` opcional permite que el caller mantenga el id local. */
export interface CreateShoppingItemInput {
  id?: string;
  productName: string;
  unitPriceLocal: number;
  quantity: number;
  category: string;
  unitPriceUsd?: number;
  isPurchased?: boolean;
}

/**
 * Payload para POST /shopping-lists. Los campos opcionales toman defaults
 * en la capa de datasource cuando el frontend no los provee.
 */
export interface CreateShoppingListInput {
  name: string;
  storeName?: string | null;
  listType?: ShoppingListType;
  countryCode?: string;
  currencyCode?: string;
  exchangeRateSnapshot?: number | null;
  ivaEnabled?: boolean;
  scheduledDate?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  items?: CreateShoppingItemInput[];
}

/**
 * Payload para PATCH /shopping-lists/:id. Solo los campos presentes se actualizan.
 * Si se incluye `items`, el backend hace upsert por `id`.
 */
export interface UpdateShoppingListInput {
  name?: string;
  storeName?: string | null;
  listType?: ShoppingListType;
  currencyCode?: string;
  exchangeRateSnapshot?: number | null;
  ivaEnabled?: boolean;
  scheduledDate?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive?: boolean;
  items?: CreateShoppingItemInput[];
}

/** Categorias predefinidas de productos */
export const PRODUCT_CATEGORIES = [
  { key: 'COMIDA', label: 'Comida', icon: 'utensils' },
  { key: 'FRUTAS', label: 'Frutas', icon: 'apple' },
  { key: 'CARNES', label: 'Carnes', icon: 'beef' },
  { key: 'BEBIDAS', label: 'Bebidas', icon: 'cup-soda' },
  { key: 'LIMPIEZA', label: 'Limpieza', icon: 'spray-can' },
  { key: 'HIGIENE', label: 'Higiene', icon: 'shower-head' },
  { key: 'VIVERES', label: 'Víveres', icon: 'shopping-basket' },
  { key: 'OTROS', label: 'Otros', icon: 'ellipsis' },
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]['key'];
