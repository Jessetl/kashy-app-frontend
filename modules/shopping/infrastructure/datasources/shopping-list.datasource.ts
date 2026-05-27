import { apiClient } from '@/shared/infrastructure/api/api-client';
import { useCountryStore } from '@/shared/infrastructure/country/country.store';
import type {
  CompareMatchedItem,
  CompareSummary,
  CompareUnmatchedItem,
  CompareWinner,
  ShoppingListsComparison,
} from '../../domain/entities/shopping-list-compare.entity';
import type {
  ShoppingListSearchInput,
  ShoppingListSummariesPage,
  ShoppingListSummary,
} from '../../domain/entities/shopping-list-summary.entity';
import type {
  BackendShoppingListType,
  CreateShoppingItemInput,
  CreateShoppingListInput,
  ShoppingItem,
  ShoppingList,
  ShoppingListType,
  UpdateShoppingListInput,
} from '../../domain/entities/shopping-list.entity';
import type { ShoppingListPort } from '../../domain/ports/shopping-list.port';

const BASE = '/shopping-lists';

// ─── DTO shapes (cara backend) ────────────────────────────────────────────

interface ItemDto {
  id: string;
  listId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPriceLocal: number;
  unitPriceUsd: number | null;
  isChecked: boolean;
}

interface ShoppingListDto {
  id: string;
  userId: string | null;
  name: string;
  storeName: string | null;
  listType: BackendShoppingListType;
  countryCode: string;
  currencyCode: string;
  exchangeRateSnapshot: number | null;
  ivaEnabled: boolean;
  scheduledDate: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  subtotalLocal: number;
  subtotalUsd: number | null;
  ivaLocal: number;
  ivaUsd: number | null;
  totalLocal: number;
  totalUsd: number | null;
  items: ItemDto[];
  /** El spec no documenta estos timestamps, pero algunas implementaciones los devuelven. */
  createdAt?: string;
  completedAt?: string | null;
}

interface SummaryDto {
  id: string;
  name: string;
  storeName: string | null;
  listType: BackendShoppingListType;
  currencyCode: string;
  isActive: boolean;
  scheduledDate: string | null;
  itemsCount: number;
  checkedCount: number;
  totalLocal: number;
  totalUsd: number | null;
}

interface SearchResponseDto {
  data: SummaryDto[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface CompareDto {
  listA: { id: string; name: string; storeName: string | null };
  listB: { id: string; name: string; storeName: string | null };
  matchedItems: {
    productName: string;
    category: string;
    listAPriceLocal: number;
    listAPriceUsd: number | null;
    listAQuantity: number;
    listBPriceLocal: number;
    listBPriceUsd: number | null;
    listBQuantity: number;
    priceDiffLocal: number;
    priceDiffUsd: number | null;
    cheaperIn: CompareWinner;
  }[];
  unmatchedItems: {
    onlyInListA: {
      productName: string;
      category: string;
      quantity: number;
      unitPriceLocal: number;
      unitPriceUsd: number | null;
    }[];
    onlyInListB: {
      productName: string;
      category: string;
      quantity: number;
      unitPriceLocal: number;
      unitPriceUsd: number | null;
    }[];
  };
  summary: {
    totalMatched: number;
    totalUnmatchedA: number;
    totalUnmatchedB: number;
    listATotalLocal: number;
    listBTotalLocal: number;
    savingsLocal: number;
    savingsUsd: number | null;
    recommended: CompareWinner;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Identifica IDs generados localmente por el store (formato `local-...`). */
function isLocalId(id: string | undefined): boolean {
  return !!id && id.startsWith('local-');
}

/**
 * Deriva el tipo lógico del frontend a partir de la combinación backend.
 * `RECEIPT` con `isActive=false` se mapea a `COMPLETED`.
 */
function deriveListType(
  backendType: BackendShoppingListType,
  isActive: boolean,
): ShoppingListType {
  if (backendType === 'RECEIPT' && !isActive) return 'COMPLETED';
  return backendType;
}

/**
 * Convierte un `listType` del dominio en el par `{listType, isActive}` que
 * acepta el backend. `COMPLETED` produce `{listType: 'RECEIPT', isActive: false}`.
 * Devuelve `undefined` en `isActive` cuando el caller debe controlarlo.
 */
function serializeListType(type: ShoppingListType): {
  listType: BackendShoppingListType;
  isActive?: boolean;
} {
  if (type === 'COMPLETED') {
    return { listType: 'RECEIPT', isActive: false };
  }
  return { listType: type };
}

function defaultCountryMeta(): { countryCode: string; currencyCode: string } {
  const country = useCountryStore.getState().country;
  return {
    countryCode: country.code,
    currencyCode: country.currency,
  };
}

function mapItemDtoToEntity(dto: ItemDto): ShoppingItem {
  const totalLocal = dto.unitPriceLocal * dto.quantity;
  const totalUsd =
    dto.unitPriceUsd !== null ? dto.unitPriceUsd * dto.quantity : null;
  return {
    id: dto.id,
    listId: dto.listId,
    productName: dto.productName,
    category: dto.category,
    quantity: dto.quantity,
    unitPriceLocal: dto.unitPriceLocal,
    totalLocal,
    unitPriceUsd: dto.unitPriceUsd,
    totalUsd,
    isPurchased: dto.isChecked,
    // Backend no devuelve createdAt en items — sintetizar para preservar el shape.
    createdAt: new Date().toISOString(),
  };
}

function mapListDtoToEntity(dto: ShoppingListDto): ShoppingList {
  return {
    id: dto.id,
    userId: dto.userId,
    name: dto.name,
    storeName: dto.storeName,
    status: dto.isActive ? 'active' : 'completed',
    listType: deriveListType(dto.listType, dto.isActive),
    countryCode: dto.countryCode,
    currencyCode: dto.currencyCode,
    ivaEnabled: dto.ivaEnabled,
    exchangeRateSnapshot: dto.exchangeRateSnapshot,
    scheduledDate: dto.scheduledDate,
    latitude: dto.latitude,
    longitude: dto.longitude,
    subtotalLocal: dto.subtotalLocal,
    subtotalUsd: dto.subtotalUsd,
    ivaLocal: dto.ivaLocal,
    ivaUsd: dto.ivaUsd,
    totalLocal: dto.totalLocal,
    totalUsd: dto.totalUsd,
    items: (dto.items ?? []).map(mapItemDtoToEntity),
    createdAt: dto.createdAt ?? new Date().toISOString(),
    completedAt: dto.completedAt ?? (dto.isActive ? null : new Date().toISOString()),
  };
}

function mapSummaryDtoToEntity(dto: SummaryDto): ShoppingListSummary {
  return {
    id: dto.id,
    name: dto.name,
    storeName: dto.storeName,
    listType: deriveListType(dto.listType, dto.isActive),
    currencyCode: dto.currencyCode,
    isActive: dto.isActive,
    scheduledDate: dto.scheduledDate,
    itemsCount: dto.itemsCount,
    checkedCount: dto.checkedCount,
    totalLocal: dto.totalLocal,
    totalUsd: dto.totalUsd,
  };
}

function mapCompareDtoToEntity(dto: CompareDto): ShoppingListsComparison {
  return {
    listA: dto.listA,
    listB: dto.listB,
    matchedItems: dto.matchedItems.map(
      (m): CompareMatchedItem => ({
        productName: m.productName,
        category: m.category,
        listAPriceLocal: m.listAPriceLocal,
        listAPriceUsd: m.listAPriceUsd,
        listAQuantity: m.listAQuantity,
        listBPriceLocal: m.listBPriceLocal,
        listBPriceUsd: m.listBPriceUsd,
        listBQuantity: m.listBQuantity,
        priceDiffLocal: m.priceDiffLocal,
        priceDiffUsd: m.priceDiffUsd,
        cheaperIn: m.cheaperIn,
      }),
    ),
    unmatchedItems: {
      onlyInListA: dto.unmatchedItems.onlyInListA.map(toUnmatched),
      onlyInListB: dto.unmatchedItems.onlyInListB.map(toUnmatched),
    },
    summary: dto.summary as CompareSummary,
  };
}

function toUnmatched(raw: {
  productName: string;
  category: string;
  quantity: number;
  unitPriceLocal: number;
  unitPriceUsd: number | null;
}): CompareUnmatchedItem {
  return {
    productName: raw.productName,
    category: raw.category,
    quantity: raw.quantity,
    unitPriceLocal: raw.unitPriceLocal,
    unitPriceUsd: raw.unitPriceUsd,
  };
}

/**
 * Mapea un item del dominio al payload spec.
 * - IDs locales (`local-...`) se omiten → el backend crea uno nuevo.
 * - `isPurchased` → `isChecked`.
 * - `unitPriceUsd` null → 0 (el backend requiere number; los totales se conservan
 *   porque el ratio sigue siendo nulo del lado del frontend hasta el primer fetch).
 */
function mapItemInputToDto(input: CreateShoppingItemInput) {
  const includeId = !!input.id && !isLocalId(input.id);
  return {
    ...(includeId && { id: input.id }),
    productName: input.productName,
    category: input.category,
    quantity: input.quantity,
    unitPriceLocal: input.unitPriceLocal,
    unitPriceUsd: input.unitPriceUsd ?? 0,
    isChecked: input.isPurchased ?? false,
  };
}

function buildCreateBody(input: CreateShoppingListInput) {
  const meta = defaultCountryMeta();
  // POST no acepta `isActive` per spec — si llega COMPLETED degradamos a RECEIPT.
  const serialized = serializeListType(input.listType ?? 'TEMPLATE');
  return {
    name: input.name,
    storeName: input.storeName ?? null,
    listType: serialized.listType,
    countryCode: input.countryCode ?? meta.countryCode,
    currencyCode: input.currencyCode ?? meta.currencyCode,
    exchangeRateSnapshot: input.exchangeRateSnapshot ?? 0,
    ivaEnabled: input.ivaEnabled ?? false,
    scheduledDate: input.scheduledDate ?? null,
    latitude: input.latitude ?? 0,
    longitude: input.longitude ?? 0,
    items: (input.items ?? []).map(mapItemInputToDto),
  };
}

function buildPatchBody(data: UpdateShoppingListInput) {
  const body: Record<string, unknown> = {};
  if (data.name !== undefined) body.name = data.name;
  if (data.storeName !== undefined) body.storeName = data.storeName;
  if (data.listType !== undefined) {
    const serialized = serializeListType(data.listType);
    body.listType = serialized.listType;
    // COMPLETED requiere apagar isActive en el backend (a menos que el caller ya
    // haya fijado uno explícitamente — el caller manda en ese caso).
    if (serialized.isActive !== undefined && data.isActive === undefined) {
      body.isActive = serialized.isActive;
    }
  }
  if (data.currencyCode !== undefined) body.currencyCode = data.currencyCode;
  if (data.exchangeRateSnapshot !== undefined)
    body.exchangeRateSnapshot = data.exchangeRateSnapshot;
  if (data.ivaEnabled !== undefined) body.ivaEnabled = data.ivaEnabled;
  if (data.scheduledDate !== undefined) body.scheduledDate = data.scheduledDate;
  if (data.latitude !== undefined) body.latitude = data.latitude;
  if (data.longitude !== undefined) body.longitude = data.longitude;
  if (data.isActive !== undefined) body.isActive = data.isActive;
  if (data.items !== undefined) body.items = data.items.map(mapItemInputToDto);
  return body;
}

function buildSearchBody(input: ShoppingListSearchInput) {
  const body: Record<string, unknown> = {
    page: input.page,
    limit: input.limit,
  };
  if (input.filters) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input.filters)) {
      if (value !== undefined) cleaned[key] = value;
    }

    // Mapeo del enum lógico al backend:
    // COMPLETED → {listType: RECEIPT, isActive: false} (override siempre).
    // RECEIPT   → si caller no fijó isActive, default a true (compras activas).
    if (cleaned.listType === 'COMPLETED') {
      cleaned.listType = 'RECEIPT';
      cleaned.isActive = false;
    } else if (cleaned.listType === 'RECEIPT' && cleaned.isActive === undefined) {
      cleaned.isActive = true;
    }

    if (Object.keys(cleaned).length > 0) body.filters = cleaned;
  }
  return body;
}

// ─── Datasource ───────────────────────────────────────────────────────────

export class ShoppingListDatasource implements ShoppingListPort {
  async createList(input: CreateShoppingListInput): Promise<ShoppingList> {
    const response = await apiClient<ShoppingListDto>(BASE, {
      method: 'POST',
      body: buildCreateBody(input),
    });
    return mapListDtoToEntity(response.data);
  }

  async searchLists(
    input: ShoppingListSearchInput,
  ): Promise<ShoppingListSummariesPage> {
    const response = await apiClient<SearchResponseDto>(`${BASE}/search`, {
      method: 'POST',
      body: buildSearchBody(input),
    });
    return {
      data: response.data.data.map(mapSummaryDtoToEntity),
      meta: response.data.meta,
    };
  }

  async getListById(id: string): Promise<ShoppingList> {
    const response = await apiClient<ShoppingListDto>(`${BASE}/${id}`);
    return mapListDtoToEntity(response.data);
  }

  async patchList(
    id: string,
    data: UpdateShoppingListInput,
  ): Promise<ShoppingList> {
    const response = await apiClient<ShoppingListDto>(`${BASE}/${id}`, {
      method: 'PATCH',
      body: buildPatchBody(data),
    });
    return mapListDtoToEntity(response.data);
  }

  async deleteList(id: string): Promise<void> {
    await apiClient(`${BASE}/${id}`, { method: 'DELETE' });
  }

  async compareLists(
    listAId: string,
    listBId: string,
  ): Promise<ShoppingListsComparison> {
    const response = await apiClient<CompareDto>(`${BASE}/compare`, {
      method: 'POST',
      body: { listAId, listBId },
    });
    return mapCompareDtoToEntity(response.data);
  }
}
