import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import { ShoppingBag } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const EmptyList = React.memo(function EmptyList() {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          { borderColor: colors.primary, backgroundColor: colors.primaryLight },
        ]}
      >
        <ShoppingBag size={40} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.textOnSurface }]}>
        Tu lista esta vacia!
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Comienza agregando productos{'\n'}para tu proxima compra
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
});
