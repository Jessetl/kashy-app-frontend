/**
 * Resultado del endpoint POST /shopping-lists/compare.
 * Se cruzan productos por `productName` (case-insensitive, trim).
 */
export type CompareWinner = 'list_a' | 'list_b' | 'equal';

export interface CompareListRef {
  id: string;
  name: string;
  storeName: string | null;
}

export interface CompareMatchedItem {
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
}

export interface CompareUnmatchedItem {
  productName: string;
  category: string;
  quantity: number;
  unitPriceLocal: number;
  unitPriceUsd: number | null;
}

export interface CompareSummary {
  totalMatched: number;
  totalUnmatchedA: number;
  totalUnmatchedB: number;
  listATotalLocal: number;
  listBTotalLocal: number;
  savingsLocal: number;
  savingsUsd: number | null;
  recommended: CompareWinner;
}

export interface ShoppingListsComparison {
  listA: CompareListRef;
  listB: CompareListRef;
  matchedItems: CompareMatchedItem[];
  unmatchedItems: {
    onlyInListA: CompareUnmatchedItem[];
    onlyInListB: CompareUnmatchedItem[];
  };
  summary: CompareSummary;
}
