import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import { LayoutGrid, List } from 'lucide-react-native';
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
}: ViewToggleProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={styles.counterGroup}>
        <Text style={[styles.count, { color: colors.textOnSurface }]}>
          {itemCount}
        </Text>
        <Text style={[styles.countLabel, { color: colors.textSecondary }]}>
          producto{itemCount !== 1 ? 's' : ''}
        </Text>
      </View>
      <View style={styles.actions}>
        <View
          style={[
            styles.segmented,
            { backgroundColor: colors.backgroundTertiary },
          ]}
        >
          <SegmentedItem
            active={mode === 'grid'}
            onPress={() => onToggle('grid')}
            label='Cuadrícula'
          >
            <LayoutGrid
              pointerEvents='none'
              size={15}
              color={mode === 'grid' ? colors.textInverse : colors.textSecondary}
              strokeWidth={2.2}
            />
          </SegmentedItem>
          <SegmentedItem
            active={mode === 'list'}
            onPress={() => onToggle('list')}
            label='Lista'
          >
            <List
              pointerEvents='none'
              size={15}
              color={mode === 'list' ? colors.textInverse : colors.textSecondary}
              strokeWidth={2.2}
            />
          </SegmentedItem>
        </View>
      </View>
    </View>
  );
});

function SegmentedItem({
  active,
  onPress,
  label,
  children,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
  children: React.ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <AppPressable
      onPress={onPress}
      accessibilityRole='button'
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={[
        styles.segmentedItem,
        active && { backgroundColor: colors.primary },
      ]}
    >
      {children}
    </AppPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  counterGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  count: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 2,
  },
  segmentedItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
  },
});
