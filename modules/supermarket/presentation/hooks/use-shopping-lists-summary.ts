import type { ShoppingList } from '../../domain/entities/shopping-list.entity';
import { useShoppingListStore } from '../../infrastructure/store/shopping-list.store';

export interface ShoppingListsSummary {
  lists: ShoppingList[];
  activeList: ShoppingList | null;
}

/**
 * API pública del módulo supermarket para consumidores externos que sólo
 * necesitan leer listas y lista activa. Evita que otros módulos importen
 * el store de infrastructure directamente.
 */
export function useShoppingListsSummary(): ShoppingListsSummary {
  const lists = useShoppingListStore((s) => s.lists);
  const activeList = useShoppingListStore((s) => s.activeList);
  return { lists, activeList };
}
