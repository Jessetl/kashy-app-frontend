import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import {
  Apple,
  Beef,
  CupSoda,
  Ellipsis,
  ShoppingBasket,
  ShowerHead,
  SprayCan,
  Utensils,
} from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import {
  PRODUCT_CATEGORIES,
  type ShoppingItem,
} from '../../domain/entities/shopping-list.entity';
import { ProductItem } from './product-item';

const ITEMS_LAYOUT = LinearTransition.duration(300);

const ICON_MAP: Record<
  string,
  React.ComponentType<{ size: number; color: string }>
> = {
  utensils: Utensils,
  'shopping-basket': ShoppingBasket,
  apple: Apple,
  beef: Beef,
  'cup-soda': CupSoda,
  'spray-can': SprayCan,
  'shower-head': ShowerHead,
  ellipsis: Ellipsis,
};

type ViewMode = 'grid' | 'list';

interface CategoryGroupProps {
  category: string;
  items: ShoppingItem[];
  exchangeRate: number | null;
  viewMode: ViewMode;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: ShoppingItem) => void;
  onQuantityChange: (id: string, quantity: number) => void;
}

function areCategoryItemsEqual(
  prevItems: ShoppingItem[],
  nextItems: ShoppingItem[],
): boolean {
  if (prevItems.length !== nextItems.length) {
    return false;
  }

  for (let index = 0; index < prevItems.length; index += 1) {
    const prevItem = prevItems[index];
    const nextItem = nextItems[index];

    if (prevItem === nextItem) {
      continue;
    }

    if (
      prevItem.id !== nextItem.id ||
      prevItem.listId !== nextItem.listId ||
      prevItem.productName !== nextItem.productName ||
      prevItem.unitPriceLocal !== nextItem.unitPriceLocal ||
      prevItem.quantity !== nextItem.quantity ||
      prevItem.totalLocal !== nextItem.totalLocal ||
      prevItem.unitPriceUsd !== nextItem.unitPriceUsd ||
      prevItem.totalUsd !== nextItem.totalUsd ||
      prevItem.isPurchased !== nextItem.isPurchased ||
      prevItem.category !== nextItem.category ||
      prevItem.createdAt !== nextItem.createdAt
    ) {
      return false;
    }
  }

  return true;
}

function areCategoryGroupPropsEqual(
  prevProps: CategoryGroupProps,
  nextProps: CategoryGroupProps,
): boolean {
  return (
    prevProps.category === nextProps.category &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.exchangeRate === nextProps.exchangeRate &&
    prevProps.onToggle === nextProps.onToggle &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onQuantityChange === nextProps.onQuantityChange &&
    areCategoryItemsEqual(prevProps.items, nextProps.items)
  );
}

export const CategoryGroup = React.memo(function CategoryGroup({
  category,
  items,
  exchangeRate,
  viewMode,
  onToggle,
  onDelete,
  onEdit,
  onQuantityChange,
}: CategoryGroupProps) {
  const colors = useThemeColors();

  const catInfo = React.useMemo(
    () => PRODUCT_CATEGORIES.find((c) => c.key === category),
    [category],
  );

  const label = catInfo?.label ?? category;
  const Icon = catInfo ? ICON_MAP[catInfo.icon] : null;

  return (
    <View style={styles.container}>
      {/* Category header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {Icon && (
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Icon size={14} color={colors.primary} />
            </View>
          )}
          <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>
            {label}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.countLabel, { color: colors.textTertiary }]}>
          {items.length}
        </Text>
      </View>

      {/* Items */}
      <Animated.View
        layout={ITEMS_LAYOUT}
        style={[
          styles.itemsContainer,
          viewMode === 'list' && styles.itemsContainerList,
        ]}
      >
        {items.map((item) => (
          <ProductItem
            key={item.id}
            item={item}
            exchangeRate={exchangeRate}
            viewMode={viewMode}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
            onQuantityChange={onQuantityChange}
          />
        ))}
      </Animated.View>
    </View>
  );
}, areCategoryGroupPropsEqual);

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  countLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemsContainer: {
    gap: 8,
  },
  itemsContainerList: {
    gap: 4,
  },
});
