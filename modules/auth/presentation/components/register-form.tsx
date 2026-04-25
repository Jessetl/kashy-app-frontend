import {
  COUNTRIES,
  DEFAULT_COUNTRY_CODE,
  type CountryCode,
} from '@/shared/domain/country/country.constants';
import { useCountryStore } from '@/shared/infrastructure/country/country.store';
import {
  AppButton,
  AppTextInput,
  DividerWithText,
  ErrorBanner,
  SocialButton,
} from '@/shared/presentation/components/ui';
import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import { ChevronDown } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { useGoogleAuth } from '../hooks/use-google-auth';
import { useRegister, type RegisterFormValues } from '../hooks/use-register';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onResetRef: (reset: () => void) => void;
  onSuccess?: () => void;
}

export const RegisterForm = React.memo(function RegisterForm({
  onSwitchToLogin,
  onResetRef,
  onSuccess,
}: RegisterFormProps) {
  const colors = useThemeColors();
  const initialCountry = useCountryStore((s) => s.countryCode);
  const [pickerVisible, setPickerVisible] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      country: initialCountry ?? DEFAULT_COUNTRY_CODE,
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const { isLoading, error, successMessage, submitRegister, clearError } =
    useRegister();

  const handleFormSubmit = handleSubmit(async (values) => {
    await submitRegister(values);
  });

  // Exponer reset al padre
  React.useEffect(() => {
    onResetRef(() => {
      reset();
      clearError();
      clearGoogleError();
    });
  }, [clearError, clearGoogleError, onResetRef, reset]);

  // Obtener el país seleccionado en el formulario para pasarlo al hook de Google
  const watchedCountry = useCountryStore((s) => s.countryCode);

  const {
    promptAsync: googlePrompt,
    isLoading: googleLoading,
    error: googleError,
    clearError: clearGoogleError,
  } = useGoogleAuth({ country: watchedCountry, onSuccess });

  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textOnSurface }]}>
          Crear Cuenta
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Completa tus datos para registrarte
        </Text>
      </View>

      <ErrorBanner message={error} />

      {successMessage && (
        <View
          style={[
            styles.successBanner,
            { backgroundColor: colors.primary + '15' },
          ]}
        >
          <Text style={[styles.successText, { color: colors.primary }]}>
            {successMessage}
          </Text>
        </View>
      )}

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <Controller
              control={control}
              name='firstName'
              rules={{ required: 'El nombre es requerido' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.fieldWrapper}>
                  <AppTextInput
                    label='Nombre'
                    placeholder='Juan'
                    value={value}
                    onBlur={onBlur}
                    onChangeText={(text) => {
                      clearError();
                      onChange(text);
                    }}
                    autoCapitalize='words'
                    editable={!isLoading}
                    hasError={!!errors.firstName}
                  />
                  {errors.firstName && (
                    <Text style={[styles.fieldError, { color: colors.danger }]}>
                      {errors.firstName.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>
          <View style={styles.nameField}>
            <Controller
              control={control}
              name='lastName'
              rules={{ required: 'El apellido es requerido' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.fieldWrapper}>
                  <AppTextInput
                    label='Apellido'
                    placeholder='Pérez'
                    value={value}
                    onBlur={onBlur}
                    onChangeText={(text) => {
                      clearError();
                      onChange(text);
                    }}
                    autoCapitalize='words'
                    editable={!isLoading}
                    hasError={!!errors.lastName}
                  />
                  {errors.lastName && (
                    <Text style={[styles.fieldError, { color: colors.danger }]}>
                      {errors.lastName.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>
        </View>

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
          rules={{
            required: 'La contraseña es requerida',
            minLength: {
              value: MIN_PASSWORD_LENGTH,
              message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.fieldWrapper}>
              <AppTextInput
                label='Contraseña'
                placeholder='Mínimo 6 caracteres'
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

        <Controller
          control={control}
          name='country'
          rules={{ required: 'El país es requerido' }}
          render={({ field: { onChange, value } }) => {
            const selected =
              COUNTRIES.find((c) => c.code === value) ?? COUNTRIES[0];
            return (
              <View style={styles.fieldWrapper}>
                <Text
                  style={[styles.countryLabel, { color: colors.textSecondary }]}
                >
                  País
                </Text>
                <AppPressable
                  onPress={() => setPickerVisible(true)}
                  style={[
                    styles.countrySelector,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: errors.country
                        ? colors.danger
                        : colors.borderLight,
                    },
                  ]}
                  disabled={isLoading}
                >
                  <Text style={styles.countryFlag}>{selected.flag}</Text>
                  <Text
                    style={[
                      styles.countryName,
                      { color: colors.textOnSurface },
                    ]}
                  >
                    {selected.name}
                  </Text>
                  <ChevronDown
                    size={16}
                    color={colors.textSecondary}
                    pointerEvents='none'
                  />
                </AppPressable>
                {errors.country && (
                  <Text style={[styles.fieldError, { color: colors.danger }]}>
                    {errors.country.message}
                  </Text>
                )}

                <Modal
                  visible={pickerVisible}
                  transparent
                  animationType='fade'
                  onRequestClose={() => setPickerVisible(false)}
                >
                  <TouchableWithoutFeedback
                    onPress={() => setPickerVisible(false)}
                  >
                    <View style={styles.overlay}>
                      <TouchableWithoutFeedback>
                        <View
                          style={[
                            styles.sheet,
                            { backgroundColor: colors.backgroundSecondary },
                          ]}
                        >
                          <Text
                            style={[
                              styles.sheetTitle,
                              { color: colors.textOnSurface },
                            ]}
                          >
                            Selecciona tu país
                          </Text>
                          <View
                            style={[
                              styles.sheetDivider,
                              { backgroundColor: colors.borderLight },
                            ]}
                          />
                          {COUNTRIES.map((c) => {
                            const isSelected = c.code === value;
                            return (
                              <AppPressable
                                key={c.code}
                                onPress={() => {
                                  onChange(c.code as CountryCode);
                                  setPickerVisible(false);
                                }}
                                style={[
                                  styles.countryRow,
                                  isSelected && {
                                    backgroundColor: colors.primaryLight,
                                  },
                                ]}
                              >
                                <Text style={styles.rowFlag}>{c.flag}</Text>
                                <View style={styles.rowInfo}>
                                  <Text
                                    style={[
                                      styles.rowName,
                                      { color: colors.textOnSurface },
                                    ]}
                                  >
                                    {c.name}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.rowCurrency,
                                      { color: colors.textSecondary },
                                    ]}
                                  >
                                    {c.currency}
                                  </Text>
                                </View>
                                {isSelected && (
                                  <View
                                    style={[
                                      styles.checkDot,
                                      { backgroundColor: colors.primary },
                                    ]}
                                  />
                                )}
                              </AppPressable>
                            );
                          })}
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>
              </View>
            );
          }}
        />

        <AppButton
          title='Crear Cuenta'
          onPress={() => {
            void handleFormSubmit();
          }}
          loading={isLoading}
          style={styles.submitButton}
        />
      </View>

      <DividerWithText text='o continúa con' />

      <ErrorBanner message={googleError} />

      {/* Social Login */}
      <View style={styles.socialRow}>
        <SocialButton
          provider='Google'
          icon='G'
          onPress={googlePrompt}
          loading={googleLoading}
        />
      </View>

      {/* Switch to Login */}
      <View style={styles.switchRow}>
        <Text style={[styles.switchText, { color: colors.textSecondary }]}>
          ¿Ya tienes cuenta?
        </Text>
        <AppPressable onPress={onSwitchToLogin}>
          <Text style={[styles.switchLink, { color: colors.primary }]}>
            Inicia Sesión
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
  form: {
    gap: 14,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
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
  countryLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
    marginLeft: 2,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  countryFlag: {
    fontSize: 20,
  },
  countryName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    borderRadius: 16,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sheetDivider: {
    height: 1,
    marginBottom: 4,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 8,
    marginBottom: 2,
  },
  rowFlag: {
    fontSize: 22,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowCurrency: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 1,
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
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
  successBanner: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  successText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
