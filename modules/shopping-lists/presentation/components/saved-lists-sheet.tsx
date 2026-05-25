import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import { useCountry } from '@/shared/presentation/hooks/use-country';
import {
  ChevronRight,
  FolderOpen,
  ShoppingBag,
  Store,
} from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ShoppingList } from '../../domain/entities/shopping-list.entity';

interface SavedListsSheetProps {
  lists: ShoppingList[];
  activeListId: string | null;
  isLoading: boolean;
  onSelect: (list: ShoppingList) => void;
}

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const SavedListsSheet = React.memo(function SavedListsSheet({
  lists,
  activeListId,
  isLoading,
  onSelect,
}: SavedListsSheetProps) {
  const colors = useThemeColors();
  const { country } = useCountry();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size='large' color={colors.primary} />
      </View>
    );
  }

  if (lists.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View
          style={[
            styles.emptyIconCircle,
            {
              borderColor: colors.primary,
              backgroundColor: colors.primaryLight,
            },
          ]}
        >
          <FolderOpen size={40} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.textOnSurface }]}>
          Sin listas guardadas
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Guarda tu primera lista con el boton{'\n'}de marcador para verla aqui
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {lists.map((list) => {
        const isActive = list.id === activeListId;
        return (
          <AppPressable
            key={list.id}
            onPress={() => onSelect(list)}
            style={[
              styles.listItem,
              {
                backgroundColor: isActive
                  ? `${colors.primary}18`
                  : colors.backgroundTertiary,
                borderColor: isActive ? colors.primary : 'transparent',
              },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isActive
                    ? colors.primary
                    : colors.backgroundSecondary,
                },
              ]}
            >
              <ShoppingBag
                size={18}
                color={isActive ? colors.textInverse : colors.textSecondary}
              />
            </View>
            <View style={styles.listInfo}>
              <Text
                style={[
                  styles.listName,
                  {
                    color: isActive ? colors.primary : colors.textOnSurface,
                  },
                ]}
                numberOfLines={1}
              >
                {list.name}
              </Text>
              <View style={styles.metaRow}>
                {list.storeName ? (
                  <View style={styles.storeTag}>
                    <Store size={11} color={colors.textTertiary} />
                    <Text
                      style={[styles.metaText, { color: colors.textTertiary }]}
                      numberOfLines={1}
                    >
                      {list.storeName}
                    </Text>
                  </View>
                ) : null}
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                  {list.items.length}{' '}
                  {list.items.length === 1 ? 'producto' : 'productos'}
                </Text>
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                  {formatDate(list.createdAt, country.locale)}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textTertiary} />
          </AppPressable>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 8,
    paddingBottom: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1.5,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listInfo: {
    flex: 1,
    gap: 3,
  },
  listName: {
    fontSize: 15,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  storeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '400',
  },
});
