import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

interface AppTextInputProps extends Omit<TextInputProps, 'style'> {
  /** Label encima del input */
  label?: string;
  /** Mostrar borde rojo de error */
  hasError?: boolean;
  /** Elemento renderizado dentro del input, a la derecha */
  rightElement?: React.ReactNode;
}

export const AppTextInput = React.memo(function AppTextInput({
  label,
  hasError = false,
  rightElement,
  ...inputProps
}: AppTextInputProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textOnSurface }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.backgroundTertiary,
            borderColor: hasError ? colors.danger : colors.border,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.textOnSurface }]}
          placeholderTextColor={colors.textTertiary}
          autoCorrect={false}
          {...inputProps}
        />
        {rightElement}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrapper: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
});
