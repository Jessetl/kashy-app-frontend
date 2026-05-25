import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import { useCountry } from '@/shared/presentation/hooks/use-country';
import { formatLocalAmount, formatUsdAmount } from '@/shared/presentation/utils/format-currency';
import { Check, Minus, Pencil, Plus, Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import type { ShoppingItem } from '../../domain/entities/shopping-list.entity';

const LAYOUT_TRANSITION = LinearTransition.duration(300);
const FADE_IN = FadeIn.duration(250).delay(80);
const FADE_OUT = FadeOut.duration(150);

type ViewMode = 'grid' | 'list';

interface ProductItemProps {
  item: ShoppingItem;
  exchangeRate: number | null;
  viewMode: ViewMode;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: ShoppingItem) => void;
  onQuantityChange: (id: string, quantity: number) => void;
}

function asFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function hasValidExchangeRate(
  exchangeRate: number | null,
): exchangeRate is number {
  return typeof exchangeRate === 'number' && exchangeRate > 0;
}

function areShoppingItemsEqual(
  prevItem: ShoppingItem,
  nextItem: ShoppingItem,
): boolean {
  return (
    prevItem.id === nextItem.id &&
    prevItem.listId === nextItem.listId &&
    prevItem.productName === nextItem.productName &&
    prevItem.unitPriceLocal === nextItem.unitPriceLocal &&
    prevItem.quantity === nextItem.quantity &&
    prevItem.totalLocal === nextItem.totalLocal &&
    prevItem.unitPriceUsd === nextItem.unitPriceUsd &&
    prevItem.totalUsd === nextItem.totalUsd &&
    prevItem.isPurchased === nextItem.isPurchased &&
    prevItem.category === nextItem.category &&
    prevItem.createdAt === nextItem.createdAt
  );
}

function areProductItemPropsEqual(
  prevProps: ProductItemProps,
  nextProps: ProductItemProps,
): boolean {
  const sameItemReference = prevProps.item === nextProps.item;

  return (
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.exchangeRate === nextProps.exchangeRate &&
    prevProps.onToggle === nextProps.onToggle &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onQuantityChange === nextProps.onQuantityChange &&
    (sameItemReference || areShoppingItemsEqual(prevProps.item, nextProps.item))
  );
}

export const ProductItem = React.memo(function ProductItem({
  item,
  exchangeRate,
  viewMode,
  onToggle,
  onDelete,
  onEdit,
  onQuantityChange,
}: ProductItemProps) {
  const colors = useThemeColors();
  const { country } = useCountry();

  const safeQuantity = useMemo(
    () => Math.max(1, Math.trunc(asFiniteNumber(item.quantity, 1))),
    [item.quantity],
  );

  const safeUnitPriceLocal = useMemo(
    () => asFiniteNumber(item.unitPriceLocal, 0),
    [item.unitPriceLocal],
  );

  const safeTotalLocal = useMemo(() => {
    const totalLocal = asFiniteNumber(item.totalLocal, Number.NaN);
    if (Number.isFinite(totalLocal)) {
      return totalLocal;
    }

    return safeUnitPriceLocal * safeQuantity;
  }, [item.totalLocal, safeQuantity, safeUnitPriceLocal]);

  const handleToggle = useCallback(
    () => onToggle(item.id),
    [item.id, onToggle],
  );

  const handleDelete = useCallback(
    () => onDelete(item.id),
    [item.id, onDelete],
  );

  const handleEdit = useCallback(() => onEdit(item), [item, onEdit]);

  const handleIncrement = useCallback(
    () => onQuantityChange(item.id, safeQuantity + 1),
    [item.id, onQuantityChange, safeQuantity],
  );

  const handleDecrement = useCallback(() => {
    if (safeQuantity > 1) onQuantityChange(item.id, safeQuantity - 1);
  }, [item.id, onQuantityChange, safeQuantity]);

  const displayData = useMemo(() => {
    if (hasValidExchangeRate(exchangeRate)) {
      const unitUsd = safeUnitPriceLocal / exchangeRate;
      const totalUsd = safeTotalLocal / exchangeRate;

      return {
        unitPriceLabel: `${formatUsdAmount(unitUsd)} c/u`,
        unitPriceBsLabel: `${formatLocalAmount(safeUnitPriceLocal, country)} c/u`,
        primaryTotalLabel: formatUsdAmount(totalUsd),
        secondaryTotalLabel: formatLocalAmount(safeTotalLocal, country),
      };
    }

    return {
      unitPriceLabel: `${formatLocalAmount(safeUnitPriceLocal, country)} c/u`,
      unitPriceBsLabel: '',
      primaryTotalLabel: formatLocalAmount(safeTotalLocal, country),
      secondaryTotalLabel: '',
    };
  }, [exchangeRate, safeTotalLocal, safeUnitPriceLocal, country]);

  const isList = viewMode === 'list';

  return (
    <Animated.View layout={LAYOUT_TRANSITION}>
      {isList ? (
        <Animated.View
          key='list'
          entering={FADE_IN}
          exiting={FADE_OUT}
        >
          <AppPressable
            onPress={handleToggle}
            style={[
              listStyles.row,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: item.isPurchased
                  ? colors.primary
                  : colors.borderLight,
              },
            ]}
          >
            <View
              style={[
                listStyles.checkbox,
                {
                  backgroundColor: item.isPurchased
                    ? colors.primary
                    : 'transparent',
                  borderColor: item.isPurchased
                    ? colors.primary
                    : colors.border,
                },
              ]}
            >
              {item.isPurchased && (
                <Check
                  size={11}
                  color={colors.textInverse}
                  pointerEvents='none'
                />
              )}
            </View>

            <Text
              style={[
                listStyles.name,
                {
                  color: item.isPurchased
                    ? colors.textTertiary
                    : colors.textOnSurface,
                  textDecorationLine: item.isPurchased
                    ? 'line-through'
                    : 'none',
                },
              ]}
              numberOfLines={1}
            >
              {item.productName}
            </Text>

            <View style={listStyles.qtyWrap}>
              <AppPressable
                onPress={handleDecrement}
                disabled={safeQuantity <= 1}
              >
                <Minus
                  size={12}
                  pointerEvents='none'
                  color={
                    safeQuantity <= 1
                      ? colors.textTertiary
                      : colors.textSecondary
                  }
                />
              </AppPressable>
              <Text
                style={[listStyles.qty, { color: colors.textOnSurface }]}
              >
                {safeQuantity}
              </Text>
              <AppPressable onPress={handleIncrement}>
                <Plus
                  size={12}
                  pointerEvents='none'
                  color={colors.textSecondary}
                />
              </AppPressable>
            </View>

            <View style={listStyles.priceCol}>
              <Text
                style={[
                  listStyles.pricePrimary,
                  {
                    color: item.isPurchased
                      ? colors.textTertiary
                      : colors.primary,
                  },
                ]}
              >
                {displayData.primaryTotalLabel}
              </Text>
              <Text
                style={[
                  listStyles.priceSecondary,
                  { color: colors.textTertiary },
                ]}
              >
                {displayData.secondaryTotalLabel}
              </Text>
            </View>

            <AppPressable onPress={handleEdit} style={listStyles.iconBtn}>
              <Pencil
                size={13}
                pointerEvents='none'
                color={colors.textTertiary}
              />
            </AppPressable>
            <AppPressable onPress={handleDelete} style={listStyles.iconBtn}>
              <Trash2
                size={13}
                pointerEvents='none'
                color={colors.danger}
              />
            </AppPressable>
          </AppPressable>
        </Animated.View>
      ) : (
        <Animated.View
          key='grid'
          entering={FADE_IN}
          exiting={FADE_OUT}
        >
          <AppPressable
            onPress={handleToggle}
            style={[
              gridStyles.container,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: item.isPurchased
                  ? colors.primary
                  : colors.borderLight,
              },
            ]}
          >
            <View style={gridStyles.mainRow}>
              <View
                style={[
                  gridStyles.checkbox,
                  {
                    backgroundColor: item.isPurchased
                      ? colors.primary
                      : 'transparent',
                    borderColor: item.isPurchased
                      ? colors.primary
                      : colors.border,
                  },
                ]}
              >
                {item.isPurchased && (
                  <Check
                    size={13}
                    color={colors.textInverse}
                    pointerEvents='none'
                  />
                )}
              </View>

              <View style={gridStyles.info}>
                <Text
                  style={[
                    gridStyles.name,
                    {
                      color: item.isPurchased
                        ? colors.textSecondary
                        : colors.textOnSurface,
                      textDecorationLine: item.isPurchased
                        ? 'line-through'
                        : 'none',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.productName}
                </Text>
                <Text
                  style={[
                    gridStyles.unitPrice,
                    { color: colors.textTertiary },
                  ]}
                >
                  {displayData.unitPriceLabel}
                  {displayData.unitPriceBsLabel
                    ? `  ${displayData.unitPriceBsLabel}`
                    : ''}
                </Text>
              </View>

              <View style={gridStyles.totals}>
                <Text
                  style={[
                    gridStyles.totalPrimary,
                    {
                      color: item.isPurchased
                        ? colors.textSecondary
                        : colors.primary,
                    },
                  ]}
                >
                  {displayData.primaryTotalLabel}
                </Text>
                <Text
                  style={[
                    gridStyles.totalSecondary,
                    { color: colors.textTertiary },
                  ]}
                >
                  {displayData.secondaryTotalLabel}
                </Text>
              </View>
            </View>

            <View style={gridStyles.actionsRow}>
              <View
                style={[
                  gridStyles.quantityGroup,
                  { backgroundColor: colors.backgroundTertiary },
                ]}
              >
                <AppPressable
                  onPress={handleDecrement}
                  style={({ pressed }) => [
                    gridStyles.qtyBtn,
                    pressed && gridStyles.qtyBtnPressed,
                  ]}
                  disabled={safeQuantity <= 1}
                >
                  <Minus
                    size={14}
                    pointerEvents='none'
                    color={
                      safeQuantity <= 1
                        ? colors.textTertiary
                        : colors.textOnSurface
                    }
                  />
                </AppPressable>
                <Text
                  style={[
                    gridStyles.qtyText,
                    { color: colors.textOnSurface },
                  ]}
                >
                  {safeQuantity}
                </Text>
                <AppPressable
                  onPress={handleIncrement}
                  style={({ pressed }) => [
                    gridStyles.qtyBtn,
                    pressed && gridStyles.qtyBtnPressed,
                  ]}
                >
                  <Plus
                    size={14}
                    pointerEvents='none'
                    color={colors.textOnSurface}
                  />
                </AppPressable>
              </View>

              <View style={gridStyles.actionButtons}>
                <AppPressable
                  onPress={handleEdit}
                  style={[
                    gridStyles.actionBtn,
                    { backgroundColor: colors.backgroundTertiary },
                  ]}
                >
                  <Pencil
                    size={14}
                    pointerEvents='none'
                    color={colors.textSecondary}
                  />
                </AppPressable>
                <AppPressable
                  onPress={handleDelete}
                  style={[
                    gridStyles.actionBtn,
                    { backgroundColor: colors.dangerLight },
                  ]}
                >
                  <Trash2
                    size={14}
                    pointerEvents='none'
                    color={colors.danger}
                  />
                </AppPressable>
              </View>
            </View>
          </AppPressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}, areProductItemPropsEqual);

/* ── List view styles ─────────────────────────────────── */
const listStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qty: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'center',
  },
  priceCol: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  pricePrimary: {
    fontSize: 13,
    fontWeight: '700',
  },
  priceSecondary: {
    fontSize: 10,
    fontWeight: '400',
  },
  iconBtn: {
    padding: 4,
  },
});

/* ── Grid (card) view styles ──────────────────────────── */
const gridStyles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  unitPrice: {
    fontSize: 12,
    fontWeight: '400',
  },
  totals: {
    alignItems: 'flex-end',
    gap: 1,
  },
  totalPrimary: {
    fontSize: 15,
    fontWeight: '700',
  },
  totalSecondary: {
    fontSize: 11,
    fontWeight: '400',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 34,
  },
  quantityGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
  },
  qtyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  qtyBtnPressed: {
    opacity: 0.6,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
