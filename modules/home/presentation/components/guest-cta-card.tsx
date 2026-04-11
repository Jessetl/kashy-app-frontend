import { AppPressable } from '@/shared/presentation/components/ui';
import { useAuth } from '@/shared/presentation/hooks/auth/use-auth';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { LogIn, Shield } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const GuestCtaCard = React.memo(function GuestCtaCard() {
  const { colors } = useAppTheme();
  const { openLoginModal } = useAuth();

  const handlePress = useCallback(() => {
    openLoginModal();
  }, [openLoginModal]);

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundTertiary }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
        <Shield size={24} color={colors.primary} pointerEvents="none" />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.textOnSurface }]}>
          Crea tu cuenta gratis
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Guarda tus listas, registra deudas y recibe recordatorios
        </Text>
      </View>
      <AppPressable
        onPress={handlePress}
        style={[styles.button, { backgroundColor: colors.primary }]}
      >
        <LogIn size={16} color={colors.textInverse} pointerEvents="none" />
        <Text style={[styles.buttonText, { color: colors.textInverse }]}>
          Entrar
        </Text>
      </AppPressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 16,
    gap: 14,
    alignItems: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
