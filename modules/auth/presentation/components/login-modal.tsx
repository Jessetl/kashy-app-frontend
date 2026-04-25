import {
  AppButton,
  AppTextInput,
  BottomSheetModal,
  DividerWithText,
  ErrorBanner,
  SocialButton,
} from '@/shared/presentation/components/ui';
import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import React, { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { useLogin } from '../hooks/use-login';

interface LoginFormValues {
  email: string;
  password: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LoginModal = React.memo(function LoginModal({
  visible,
  onClose,
}: LoginModalProps) {
  const colors = useThemeColors();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const { isLoading, error, submitLogin, clearError } = useLogin(onClose);

  const handleFormSubmit = handleSubmit(async (values) => {
    await submitLogin(values);
  });

  const handleDismiss = useCallback(() => {
    reset();
    clearError();
  }, [clearError, reset]);

  const handleSocialLogin = useCallback((provider: string) => {
    // Placeholder — el flujo real de social login se dispara desde los
    // botones de Google/Apple. Este callback queda reservado por compat.
    if (__DEV__) {
      console.log(`[Auth] Inicio de sesión con ${provider}`);
    }
  }, []);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      onDismiss={handleDismiss}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textOnSurface }]}>
          Iniciar Sesión
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Ingresa tus credenciales para continuar
        </Text>
      </View>

      <ErrorBanner message={error} />

      {/* Form */}
      <View style={styles.form}>
        <Controller
          control={control}
          name='email'
          rules={{
            required: 'El email es requerido',
            pattern: {
              value: EMAIL_REGEX,
              message: 'El formato del email no es válido',
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.fieldWrapper}>
              <AppTextInput
                label='Email'
                placeholder='tu@email.com'
                value={value}
                onBlur={onBlur}
                onChangeText={(text) => {
                  clearError();
                  onChange(text);
                }}
                keyboardType='email-address'
                autoCapitalize='none'
                editable={!isLoading}
                hasError={!!errors.email}
              />
              {errors.email && (
                <Text style={[styles.fieldError, { color: colors.danger }]}>
                  {errors.email.message}
                </Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name='password'
          rules={{ required: 'La contraseña es requerida' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.fieldWrapper}>
              <AppTextInput
                label='Contraseña'
                placeholder='••••••••'
                value={value}
                onBlur={onBlur}
                onChangeText={(text) => {
                  clearError();
                  onChange(text);
                }}
                secureTextEntry
                editable={!isLoading}
                hasError={!!errors.password}
              />
              {errors.password && (
                <Text style={[styles.fieldError, { color: colors.danger }]}>
                  {errors.password.message}
                </Text>
              )}
            </View>
          )}
        />

        <AppButton
          title='Iniciar Sesión'
          onPress={() => {
            void handleFormSubmit();
          }}
          loading={isLoading}
          style={styles.loginButton}
        />
      </View>

      <DividerWithText text='o continúa con' />

      {/* Social Login */}
      <View style={styles.socialRow}>
        <SocialButton provider='Google' icon='G' onPress={handleSocialLogin} />
        <SocialButton
          provider='Facebook'
          icon='f'
          iconColor='#1877F2'
          onPress={handleSocialLogin}
        />
      </View>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  fieldWrapper: {
    gap: 4,
  },
  fieldError: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  loginButton: {
    marginTop: 4,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
