import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import { useCountry } from '@/shared/presentation/hooks/use-country';
import {
  formatLocalAmount,
  formatUsdAmount,
} from '@/shared/presentation/utils/format-currency';
import { Check, Minus, Pencil, Plus, Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { ShoppingItem } from '../../domain/entities/shopping-list.entity';

const LAYOUT_TRANSITION = LinearTransition.duration(300);
const FADE_IN = FadeIn.duration(220).delay(60);
const FADE_OUT = FadeOut.duration(140);
const PRESS_SPRING = { mass: 0.3, damping: 14, stiffness: 240 };

type ViewMode = 'grid' | 'list';

interface ProductItemProps {
  item: ShoppingItem;
  exchangeRate: number | null;
  viewMode: ViewMode;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: ShoppingItem) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  hidePrices?: boolean;
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
    prevProps.hidePrices === nextProps.hidePrices &&
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
  hidePrices = false,
}: ProductItemProps) {
  const colors = useThemeColors();
  const { country } = useCountry();

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, PRESS_SPRING);
  }, [scale]);
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, PRESS_SPRING);
  }, [scale]);

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
  const purchased = item.isPurchased;
  const itemOpacity = purchased ? 0.62 : 1;

  return (
    <Animated.View layout={LAYOUT_TRANSITION} style={animatedStyle}>
      {isList ? (
        <Animated.View key='list' entering={FADE_IN} exiting={FADE_OUT}>
          <AppPressable
            onPress={handleToggle}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            accessibilityRole='checkbox'
            accessibilityState={{ checked: purchased }}
            accessibilityLabel={item.productName}
            style={[
              listStyles.row,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: purchased
                  ? `${colors.primary}55`
                  : colors.borderLight,
                opacity: itemOpacity,
              },
            ]}
          >
            <Checkbox checked={purchased} size={18} />
            <Text
              style={[
                listStyles.name,
                {
                  color: purchased
                    ? colors.textTertiary
                    : colors.textOnSurface,
                  textDecorationLine: purchased ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={1}
            >
              {item.productName}
            </Text>

            <QuantityControl
              quantity={safeQuantity}
              onDecrement={handleDecrement}
              onIncrement={handleIncrement}
              compact
            />

            {!hidePrices && (
              <View style={listStyles.priceCol}>
                <Text
                  style={[
                    listStyles.pricePrimary,
                    {
                      color: purchased
                        ? colors.textTertiary
                        : colors.primary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {displayData.primaryTotalLabel}
                </Text>
                {displayData.secondaryTotalLabel ? (
                  <Text
                    style={[
                      listStyles.priceSecondary,
                      { color: colors.textTertiary },
                    ]}
                    numberOfLines={1}
                  >
                    {displayData.secondaryTotalLabel}
                  </Text>
                ) : null}
              </View>
            )}

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
        <Animated.View key='grid' entering={FADE_IN} exiting={FADE_OUT}>
          <AppPressable
            onPress={handleToggle}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            accessibilityRole='checkbox'
            accessibilityState={{ checked: purchased }}
            accessibilityLabel={item.productName}
            style={[
              gridStyles.container,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: purchased
                  ? `${colors.primary}55`
                  : colors.borderLight,
                opacity: itemOpacity,
              },
            ]}
          >
            <View style={gridStyles.mainRow}>
              <Checkbox checked={purchased} size={22} />
              <View style={gridStyles.info}>
                <Text
                  style={[
                    gridStyles.name,
                    {
                      color: purchased
                        ? colors.textSecondary
                        : colors.textOnSurface,
                      textDecorationLine: purchased ? 'line-through' : 'none',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.productName}
                </Text>
                {!hidePrices && (
                  <Text
                    style={[
                      gridStyles.unitPrice,
                      { color: colors.textTertiary },
                    ]}
                    numberOfLines={1}
                  >
                    {displayData.unitPriceLabel}
                    {displayData.unitPriceBsLabel
                      ? `  ·  ${displayData.unitPriceBsLabel}`
                      : ''}
                  </Text>
                )}
              </View>

              {!hidePrices && (
                <View style={gridStyles.totals}>
                  <Text
                    style={[
                      gridStyles.totalPrimary,
                      {
                        color: purchased
                          ? colors.textSecondary
                          : colors.primary,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {displayData.primaryTotalLabel}
                  </Text>
                  {displayData.secondaryTotalLabel ? (
                    <Text
                      style={[
                        gridStyles.totalSecondary,
                        { color: colors.textTertiary },
                      ]}
                      numberOfLines={1}
                    >
                      {displayData.secondaryTotalLabel}
                    </Text>
                  ) : null}
                </View>
              )}
            </View>

            <View style={gridStyles.actionsRow}>
              <QuantityControl
                quantity={safeQuantity}
                onDecrement={handleDecrement}
                onIncrement={handleIncrement}
              />
              <View style={gridStyles.actionButtons}>
                <AppPressable
                  onPress={handleEdit}
                  accessibilityRole='button'
                  accessibilityLabel='Editar producto'
                  style={[
                    gridStyles.actionBtn,
                    { backgroundColor: colors.backgroundTertiary },
                  ]}
                >
                  <Pencil
                    size={14}
                    pointerEvents='none'
                    color={colors.textSecondary}
                    strokeWidth={2.2}
                  />
                </AppPressable>
                <AppPressable
                  onPress={handleDelete}
                  accessibilityRole='button'
                  accessibilityLabel='Eliminar producto'
                  style={[
                    gridStyles.actionBtn,
                    { backgroundColor: colors.dangerLight },
                  ]}
                >
                  <Trash2
                    size={14}
                    pointerEvents='none'
                    color={colors.danger}
                    strokeWidth={2.2}
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

function Checkbox({ checked, size }: { checked: boolean; size: number }) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        checkboxStyles.box,
        {
          width: size,
          height: size,
          borderRadius: 7,
          backgroundColor: checked ? colors.primary : 'transparent',
          borderColor: checked ? colors.primary : colors.border,
        },
      ]}
    >
      {checked && (
        <Check
          size={size * 0.6}
          color={colors.textInverse}
          strokeWidth={3}
          pointerEvents='none'
        />
      )}
    </View>
  );
}

function QuantityControl({
  quantity,
  onDecrement,
  onIncrement,
  compact = false,
}: {
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
  compact?: boolean;
}) {
  const colors = useThemeColors();
  const disabledDec = quantity <= 1;

  return (
    <View
      style={[
        qtyStyles.container,
        { backgroundColor: colors.backgroundTertiary },
        compact && qtyStyles.containerCompact,
      ]}
    >
      <AppPressable
        onPress={onDecrement}
        disabled={disabledDec}
        accessibilityRole='button'
        accessibilityLabel='Restar uno'
        style={[qtyStyles.btn, compact && qtyStyles.btnCompact]}
      >
        <Minus
          size={compact ? 12 : 14}
          pointerEvents='none'
          color={disabledDec ? colors.textTertiary : colors.textOnSurface}
          strokeWidth={2.4}
        />
      </AppPressable>
      <Text
        style={[
          qtyStyles.value,
          { color: colors.textOnSurface },
          compact && qtyStyles.valueCompact,
        ]}
      >
        {quantity}
      </Text>
      <AppPressable
        onPress={onIncrement}
        accessibilityRole='button'
        accessibilityLabel='Sumar uno'
        style={[qtyStyles.btn, compact && qtyStyles.btnCompact]}
      >
        <Plus
          size={compact ? 12 : 14}
          pointerEvents='none'
          color={colors.textOnSurface}
          strokeWidth={2.4}
        />
      </AppPressable>
    </View>
  );
}

const checkboxStyles = StyleSheet.create({
  box: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const qtyStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 2,
  },
  containerCompact: {
    borderRadius: 8,
    padding: 1,
  },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnCompact: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 22,
    textAlign: 'center',
  },
  valueCompact: {
    fontSize: 13,
    minWidth: 16,
  },
});

const listStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  priceCol: {
    alignItems: 'flex-end',
    minWidth: 64,
  },
  pricePrimary: {
    fontSize: 13,
    fontWeight: '800',
  },
  priceSecondary: {
    fontSize: 10,
    fontWeight: '500',
  },
  iconBtn: {
    padding: 4,
  },
});

const gridStyles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  unitPrice: {
    fontSize: 12,
    fontWeight: '500',
  },
  totals: {
    alignItems: 'flex-end',
    gap: 1,
  },
  totalPrimary: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  totalSecondary: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 34,
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
