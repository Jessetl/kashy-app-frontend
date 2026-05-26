import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type ListInitializationBannerProps = {
  isInitializing: boolean;
  errorMessage: string | null;
  onRetry: () => void;
};

export const ListInitializationBanner = React.memo(
  function ListInitializationBanner({
    isInitializing,
    errorMessage,
    onRetry,
  }: ListInitializationBannerProps) {
    const colors = useThemeColors();

    return (
      <View
        style={[
          styles.banner,
          {
            borderColor: colors.border,
            backgroundColor: colors.backgroundSecondary,
          },
        ]}
      >
        {isInitializing ? (
          <View style={styles.row}>
            <ActivityIndicator color={colors.primary} size='small' />
            <Text style={[styles.text, { color: colors.text }]}>
              Inicializando lista...
            </Text>
          </View>
        ) : (
          <View style={styles.row}>
            <Text style={[styles.text, { color: colors.text }]}> 
              {errorMessage ?? 'No hay lista activa.'}
            </Text>
            <AppPressable
              onPress={onRetry}
              style={[
                styles.retryButton,
                { backgroundColor: colors.backgroundTertiary },
              ]}
            >
              <Text style={[styles.retryButtonText, { color: colors.primary }]}>
                Reintentar
              </Text>
            </AppPressable>
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
