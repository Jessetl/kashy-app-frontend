import { AppPressable } from '@/shared/presentation/components/ui';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useRouter } from 'expo-router';
import { ListPlus, PlusCircle, Receipt, TrendingUp } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface QuickAction {
  label: string;
  Icon: typeof ListPlus;
  color: string;
  bgColor: string;
  route: string;
}

export const QuickActions = React.memo(function QuickActions() {
  const { colors } = useAppTheme();
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      label: 'Nueva lista',
      Icon: ListPlus,
      color: colors.primary,
      bgColor: colors.primaryLight,
      route: '/(tabs)/supermarket',
    },
    {
      label: 'Agregar deuda',
      Icon: PlusCircle,
      color: colors.danger,
      bgColor: colors.dangerLight,
      route: '/(tabs)/debts',
    },
    {
      label: 'Cobros',
      Icon: Receipt,
      color: colors.success,
      bgColor: colors.successLight,
      route: '/(tabs)/debts',
    },
    {
      label: 'Tasa',
      Icon: TrendingUp,
      color: colors.warning,
      bgColor: colors.warningLight,
      route: '/(tabs)/supermarket',
    },
  ];

  const handlePress = useCallback(
    (route: string) => {
      router.push(route as any);
    },
    [router],
  );

  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <AppPressable
          key={action.label}
          onPress={() => handlePress(action.route)}
          style={[
            styles.action,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: action.bgColor }]}>
            <action.Icon size={20} color={action.color} pointerEvents='none' />
          </View>
          <Text
            style={[styles.label, { color: colors.textOnSurface }]}
            numberOfLines={1}
          >
            {action.label}
          </Text>
        </AppPressable>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
