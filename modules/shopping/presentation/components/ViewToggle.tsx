import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import { Eraser, LayoutGrid, List } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  mode: ViewMode;
  onToggle: (mode: ViewMode) => void;
  itemCount: number;
  onNewList?: () => void;
}

export const ViewToggle = React.memo(function ViewToggle({
  mode,
  onToggle,
  itemCount,
  onNewList,
}: ViewToggleProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.count, { color: colors.textOnSurface }]}>
        {itemCount} producto{itemCount !== 1 ? 's' : ''}
      </Text>
      <View style={styles.toggleGroup}>
        {onNewList && (
          <AppPressable
            onPress={onNewList}
            style={[
              styles.toggleButton,
              {
                backgroundColor: colors.backgroundTertiary,
                borderColor: colors.border,
              },
            ]}
          >
            <Eraser
              pointerEvents='none'
              size={16}
              color={colors.textSecondary}
            />
          </AppPressable>
        )}
        <AppPressable
          onPress={() => onToggle('grid')}
          style={[
            styles.toggleButton,
            {
              backgroundColor:
                mode === 'grid'
                  ? colors.primaryLight
                  : colors.backgroundTertiary,
              borderColor: mode === 'grid' ? colors.primary : colors.border,
            },
          ]}
        >
          <LayoutGrid
            pointerEvents='none'
            size={16}
            color={mode === 'grid' ? colors.primary : colors.textSecondary}
          />
        </AppPressable>
        <AppPressable
          onPress={() => onToggle('list')}
          style={[
            styles.toggleButton,
            {
              backgroundColor:
                mode === 'list'
                  ? colors.primaryLight
                  : colors.backgroundTertiary,
              borderColor: mode === 'list' ? colors.primary : colors.border,
            },
          ]}
        >
          <List
            pointerEvents='none'
            size={16}
            color={mode === 'list' ? colors.primary : colors.textSecondary}
          />
        </AppPressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  count: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  toggleButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
