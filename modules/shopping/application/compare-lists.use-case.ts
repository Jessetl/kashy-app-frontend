import type { ShoppingListsComparison } from '../domain/entities/shopping-list-compare.entity';
import type { ShoppingListPort } from '../domain/ports/shopping-list.port';

/**
 * Caso de uso puro: compara dos listas y retorna el cruce de productos.
 * El backend es authoritative — solo validamos que los IDs no estén vacíos.
 */
export async function compareLists(
  port: ShoppingListPort,
  listAId: string,
  listBId: string,
): Promise<ShoppingListsComparison> {
  if (!listAId || !listBId) {
    throw new Error('Se requieren dos IDs de lista para comparar');
  }
  if (listAId === listBId) {
    throw new Error('No se puede comparar una lista contra sí misma');
  }
  return port.compareLists(listAId, listBId);
}
