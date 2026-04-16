import { useCountry } from '@/shared/presentation/hooks/use-country';
import {
  formatLocalAmount,
  formatUsdAmount,
} from '@/shared/presentation/utils/format-currency';
import { useCallback, useMemo } from 'react';
import { Share } from 'react-native';
import type { ShoppingList } from '../../domain/entities/shopping-list.entity';

type UseShareShoppingListParams = {
  activeList: ShoppingList | null;
};

export function useShareShoppingList({
  activeList,
}: UseShareShoppingListParams) {
  const { country } = useCountry();

  const canShare = useMemo(
    () =>
      Boolean(
        activeList &&
        !activeList.id.startsWith('local-') &&
        activeList.items.length > 0,
      ),
    [activeList],
  );

  const handleShare = useCallback(async () => {
    if (!activeList || activeList.items.length === 0) {
      return;
    }

    const CATEGORY_LABELS: Record<string, string> = {
      COMIDA: '🍽 Comida',
      VIVERES: '🧺 Víveres',
      FRUTAS: '🍎 Frutas',
      CARNES: '🥩 Carnes',
      BEBIDAS: '🥤 Bebidas',
      LIMPIEZA: '🧹 Limpieza',
      HIGIENE: '🚿 Higiene',
      OTROS: '📦 Otros',
    };

    const fmtBs = (n: number) => formatLocalAmount(n, country);
    const fmtUsd = (n: number) => formatUsdAmount(n);

    const lines: string[] = [];

    lines.push(`🛒 ${activeList.name}`);
    if (activeList.storeName) lines.push(`📍 ${activeList.storeName}`);
    lines.push('');

    const groups: Record<string, typeof activeList.items> = {};
    for (const item of activeList.items) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }

    lines.push('PRODUCTOS:');
    for (const [cat, items] of Object.entries(groups)) {
      lines.push('');
      lines.push(CATEGORY_LABELS[cat] ?? cat);
      for (const item of items) {
        const check = item.isPurchased ? '✅' : '▪';
        const usd = item.totalUsd != null ? ` (${fmtUsd(item.totalUsd)})` : '';
        lines.push(
          `  ${check} ${item.productName} x${item.quantity} — ${fmtBs(item.totalLocal)}${usd}`,
        );
      }
    }

    lines.push('');
    lines.push('─────────────────────');
    lines.push(
      `💵 Total: ${fmtBs(activeList.totalLocal)} | ${fmtUsd(activeList.totalUsd)}`,
    );
    if (activeList.ivaEnabled) lines.push('   (IVA incluido)');
    lines.push('');
    lines.push('Compartido desde Kashy 💚');

    try {
      await Share.share({ message: lines.join('\n'), title: activeList.name });
    } catch {
      // usuario canceló
    }
  }, [activeList, country]);

  return {
    canShare,
    handleShare,
  };
}
