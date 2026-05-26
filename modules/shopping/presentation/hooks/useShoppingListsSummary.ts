import type { ShoppingList } from '../../domain/entities/shopping-list.entity';
import { useShoppingStore } from '../store/useShoppingStore';

export interface ShoppingListsSummary {
  lists: ShoppingList[];
  activeList: ShoppingList | null;
}

/**
 * API pública del módulo shopping-lists para consumidores externos que sólo
 * necesitan leer listas y lista activa. Evita que otros módulos importen
 * el store de infrastructure directamente.
 */
export function useShoppingListsSummary(): ShoppingListsSummary {
  const lists = useShoppingStore((s) => s.lists);
  const activeList = useShoppingStore((s) => s.activeList);
  return { lists, activeList };
}
