import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface SaveListFormProps {
  onSave: (name: string, storeName: string) => void;
  initialName?: string;
  initialStoreName?: string;
}

export const SaveListForm = React.memo(function SaveListForm({
  onSave,
  initialName,
  initialStoreName,
}: SaveListFormProps) {
  const colors = useThemeColors();
  const [listName, setListName] = useState(initialName ?? '');
  const [storeName, setStoreName] = useState(initialStoreName ?? '');

  const handleSave = useCallback(() => {
    const trimmedName = listName.trim();
    const trimmedStore = storeName.trim();
    if (!trimmedName) return;
    onSave(trimmedName, trimmedStore);
  }, [listName, storeName, onSave]);

  const isValid = listName.trim().length > 0;

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.backgroundTertiary,
            color: colors.textOnSurface,
          },
        ]}
        placeholder='Nombre de la lista'
        placeholderTextColor={colors.textTertiary}
        value={listName}
        onChangeText={setListName}
        autoCorrect={false}
        autoCapitalize='sentences'
        returnKeyType='next'
        autoFocus
      />
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.backgroundTertiary,
            color: colors.textOnSurface,
          },
        ]}
        placeholder='Establecimiento (opcional)'
        placeholderTextColor={colors.textTertiary}
        value={storeName}
        onChangeText={setStoreName}
        autoCorrect={false}
        autoCapitalize='sentences'
        returnKeyType='done'
        onSubmitEditing={handleSave}
      />
      <AppPressable
        onPress={handleSave}
        disabled={!isValid}
        style={[
          styles.saveButton,
          {
            backgroundColor: isValid
              ? colors.primary
              : colors.backgroundTertiary,
          },
        ]}
      >
        <Text
          style={[
            styles.saveButtonText,
            {
              color: isValid ? colors.textInverse : colors.textTertiary,
            },
          ]}
        >
          Guardar
        </Text>
      </AppPressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  input: {
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '500',
  },
  saveButton: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
