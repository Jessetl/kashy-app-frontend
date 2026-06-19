import {
  AppButton,
  AppTextInput,
  ErrorBanner,
} from '@/shared/presentation/components/ui';
import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { useRecoverPassword } from '../hooks/use-recover-password';

interface RecoverFormValues {
  email: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RecoverPasswordFormProps {
  onSwitchToLogin: () => void;
  onResetRef: (reset: () => void) => void;
}

export const RecoverPasswordForm = React.memo(function RecoverPasswordForm({
  onSwitchToLogin,
  onResetRef,
}: RecoverPasswordFormProps) {
  const colors = useThemeColors();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecoverFormValues>({
    defaultValues: { email: '' },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const { isLoading, error, successMessage, submitRecover, clearError, clearSuccess } =
    useRecoverPassword();

  const handleFormSubmit = handleSubmit(async (values) => {
    await submitRecover(values.email);
  });

  // Exponer reset al padre
  React.useEffect(() => {
    onResetRef(() => {
      reset();
      clearError();
      clearSuccess();
    });
  }, [clearError, clearSuccess, onResetRef, reset]);

  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textOnSurface }]}>
          Recuperar Contraseña
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Ingresa tu email y te enviaremos un enlace para restablecerla
        </Text>
      </View>

      <ErrorBanner message={error} />

      {successMessage && (
        <View
          style={[styles.successBanner, { backgroundColor: colors.successLight }]}
        >
          <Text style={[styles.successText, { color: colors.success }]}>
            {successMessage}
          </Text>
        </View>
      )}

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

        <AppButton
          title='Enviar enlace'
          onPress={() => {
            void handleFormSubmit();
          }}
          loading={isLoading}
          style={styles.submitButton}
        />
      </View>

      {/* Switch to Login */}
      <View style={styles.switchRow}>
        <Text style={[styles.switchText, { color: colors.textSecondary }]}>
          ¿Ya la recordaste?
        </Text>
        <AppPressable onPress={onSwitchToLogin}>
          <Text style={[styles.switchLink, { color: colors.primary }]}>
            Iniciar sesión
          </Text>
        </AppPressable>
      </View>
    </>
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
  successBanner: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    fontWeight: '500',
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
  submitButton: {
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  switchText: {
    fontSize: 14,
    fontWeight: '400',
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
