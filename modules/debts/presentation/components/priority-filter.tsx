import { AppPressable } from '@/shared/presentation/components/ui';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import type { DebtPriority } from '../../domain/entities/debt.entity';

interface PriorityFilterProps {
  activeFilter: DebtPriority | null;
  onFilterChange: (priority: DebtPriority | null) => void;
}

const FILTERS: { key: DebtPriority | null; label: string }[] = [
  { key: null, label: 'Todas' },
  { key: 'HIGH', label: 'Alta' },
  { key: 'MEDIUM', label: 'Media' },
  { key: 'LOW', label: 'Baja' },
];

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#FF8C66',
  MEDIUM: '#FFB84D',
  LOW: '#63E696',
};

export const PriorityFilter = React.memo(function PriorityFilter({
  activeFilter,
  onFilterChange,
}: PriorityFilterProps) {
  const { colors } = useAppTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTERS.map(({ key, label }) => {
        const isActive = activeFilter === key;
        const chipColor = key ? PRIORITY_COLORS[key] : colors.primary;

        return (
          <AppPressable
            key={key ?? 'all'}
            onPress={() => onFilterChange(key)}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? chipColor : colors.backgroundSecondary,
                borderColor: isActive ? chipColor : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: isActive ? '#FFFFFF' : colors.textSecondary,
                },
              ]}
            >
              {label}
            </Text>
          </AppPressable>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
