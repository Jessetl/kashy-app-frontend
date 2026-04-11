import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import { FileText } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface EmptyDebtsProps {
  isCollection: boolean;
}

export const EmptyDebts = React.memo(function EmptyDebts({
  isCollection,
}: EmptyDebtsProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          { borderColor: colors.primary, backgroundColor: colors.primaryLight },
        ]}
      >
        <FileText size={40} color={colors.primary} pointerEvents='none' />
      </View>
      <Text style={[styles.title, { color: colors.textOnSurface }]}>
        {isCollection
          ? 'No tienes cobros pendientes'
          : 'No tienes deudas pendientes'}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {isCollection
          ? 'Registra cobros para llevar un\ncontrol de lo que te deben'
          : 'Registra tus deudas para no\nolvidar a quién le debes'}
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
});
