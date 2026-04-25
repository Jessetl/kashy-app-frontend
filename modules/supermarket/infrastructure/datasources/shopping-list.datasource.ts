import { apiClient } from '@/shared/infrastructure/api/api-client';
import type {
  CreateShoppingItemInput,
  CreateShoppingListInput,
  ShoppingItem,
  ShoppingList,
} from '../../domain/entities/shopping-list.entity';
import type { ShoppingListPort } from '../../domain/ports/shopping-list.port';

// Regla irrompible #4: los montos no se redondean antes de mostrarlos.
// Enviamos los valores con precisión completa; el redondeo ocurre solo
// en utilidades de formato en la capa de presentación.
function mapItemToApi(
  input: CreateShoppingItemInput & { isPurchased?: boolean },
) {
  return {
    productName: input.productName,
    quantity: input.quantity,
    category: input.category,
    unitPriceLocal: input.unitPriceLocal,
    unitPriceUsd: input.unitPriceUsd ?? 0,
    ...(input.isPurchased !== undefined && { isPurchased: input.isPurchased }),
  };
}

export class ShoppingListDatasource implements ShoppingListPort {
  async createList(input: CreateShoppingListInput): Promise<ShoppingList> {
    const response = await apiClient<ShoppingList>('/shopping-lists', {
      method: 'POST',
      body: { name: input.name, storeName: input.storeName },
    });
    return response.data;
  }

  async getActiveLists(): Promise<ShoppingList[]> {
    const response = await apiClient<ShoppingList[]>('/shopping-lists');
    return response.data;
  }

  async getListById(id: string): Promise<ShoppingList> {
    const response = await apiClient<ShoppingList>(`/shopping-lists/${id}`);
    return response.data;
  }

  async updateList(
    id: string,
    data: Partial<Pick<ShoppingList, 'name' | 'storeName' | 'ivaEnabled'>>,
  ): Promise<ShoppingList> {
    const response = await apiClient<ShoppingList>(`/shopping-lists/${id}`, {
      method: 'PUT',
      body: {
        name: data.name,
        storeName: data.storeName,
        ivaEnabled: data.ivaEnabled,
      },
    });
    return response.data;
  }

  async deleteList(id: string): Promise<void> {
    await apiClient(`/shopping-lists/${id}`, { method: 'DELETE' });
  }

  async completeList(id: string): Promise<ShoppingList> {
    const response = await apiClient<ShoppingList>(
      `/shopping-lists/${id}/complete`,
      { method: 'PUT' },
    );
    return response.data;
  }

  async addItem(
    listId: string,
    input: CreateShoppingItemInput,
  ): Promise<ShoppingItem[]> {
    const response = await apiClient<ShoppingItem[]>(
      `/shopping-lists/${listId}/items`,
      {
        method: 'POST',
        body: { items: [mapItemToApi(input)] },
      },
    );
    return response.data;
  }

  async addItems(
    listId: string,
    inputs: CreateShoppingItemInput[],
  ): Promise<ShoppingItem[]> {
    const response = await apiClient<ShoppingItem[]>(
      `/shopping-lists/${listId}/items`,
      {
        method: 'POST',
        body: { items: inputs.map(mapItemToApi) },
      },
    );
    return response.data;
  }

  async updateItem(
    listId: string,
    itemId: string,
    data: Partial<CreateShoppingItemInput>,
  ): Promise<ShoppingItem> {
    const response = await apiClient<ShoppingItem>(
      `/shopping-lists/${listId}/items/${itemId}`,
      {
        method: 'PUT',
        body: {
          productName: data.productName,
          category: data.category,
          quantity: data.quantity,
          unitPriceLocal: data.unitPriceLocal,
          unitPriceUsd: data.unitPriceUsd,
        },
      },
    );
    return response.data;
  }

  async deleteItem(listId: string, itemId: string): Promise<void> {
    await apiClient(`/shopping-lists/${listId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async toggleItemPurchased(
    listId: string,
    itemId: string,
  ): Promise<ShoppingItem> {
    const response = await apiClient<ShoppingItem>(
      `/shopping-lists/${listId}/items/${itemId}/toggle`,
      { method: 'PUT' },
    );
    return response.data;
  }
}
