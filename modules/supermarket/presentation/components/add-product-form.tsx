import { useExchangeRate } from '@/modules/shared-services/exchange-rate/presentation/use-exchange-rate';
import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import { useCountry } from '@/shared/presentation/hooks/use-country';
import { Check, Plus, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

interface AddProductFormProps {
  onAdd: (name: string, price: number) => void;
  onCancelEdit?: () => void;
  initialName?: string;
  initialPrice?: string;
  priceInLocal?: boolean;
}

export const AddProductForm = React.memo(function AddProductForm({
  onAdd,
  onCancelEdit,
  initialName,
  initialPrice,
  priceInLocal = false,
}: AddProductFormProps) {
  const colors = useThemeColors();
  const { country } = useCountry();
  const { usdToLocal, localToUsd } = useExchangeRate();
  const [productName, setProductName] = useState(initialName ?? '');
  const [price, setPrice] = useState(initialPrice ?? '');
  const priceRef = useRef<TextInput>(null);

  const isEditing = initialName != null;
  const prevPriceInLocalRef = useRef(priceInLocal);

  useEffect(() => {
    setProductName(initialName ?? '');
    setPrice(initialPrice ?? '');
  }, [initialName, initialPrice]);

  // When the currency toggle changes:
  // - If editing: convert the currently-entered value to the new currency so
  //   the user sees the equivalent price and doesn't lose their edit.
  // - If adding: clear the field (empty entry means nothing to convert).
  useEffect(() => {
    if (prevPriceInLocalRef.current === priceInLocal) {
      return;
    }

    const wasLocal = prevPriceInLocalRef.current;
    prevPriceInLocalRef.current = priceInLocal;

    if (!isEditing) {
      setPrice('');
      return;
    }

    setPrice((current) => {
      const numeric = parseFloat(current.replace(',', '.'));
      if (!Number.isFinite(numeric) || numeric <= 0) {
        return '';
      }
      // wasLocal=true & now USD → convert local→USD
      // wasLocal=false & now local → convert USD→local
      const converted = wasLocal ? localToUsd(numeric) : usdToLocal(numeric);
      if (!Number.isFinite(converted) || converted <= 0) {
        return current;
      }
      return converted.toFixed(2);
    });
  }, [priceInLocal, isEditing, localToUsd, usdToLocal]);

  const handleAdd = useCallback(() => {
    const trimmedName = productName.trim();
    const numPrice = parseFloat(price.replace(',', '.'));

    if (!trimmedName || isNaN(numPrice) || numPrice <= 0) {
      return;
    }

    const localPrice = priceInLocal ? numPrice : usdToLocal(numPrice);

    if (localPrice <= 0) {
      return;
    }

    onAdd(trimmedName, parseFloat(localPrice.toFixed(2)));
    setProductName('');
    setPrice('');
  }, [productName, price, priceInLocal, usdToLocal, onAdd]);

  const handlePriceChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9.,]/g, '');
    setPrice(cleaned);
  }, []);

  const isValid =
    productName.trim().length > 0 &&
    price.length > 0 &&
    parseFloat(price.replace(',', '.')) > 0;

  const pricePlaceholder = priceInLocal ? country.currency : 'USD';

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          styles.nameInput,
          {
            backgroundColor: colors.backgroundTertiary,
            color: colors.textOnSurface,
          },
        ]}
        placeholder='Producto'
        placeholderTextColor={colors.textTertiary}
        value={productName}
        onChangeText={setProductName}
        autoCorrect={false}
        autoCapitalize='sentences'
        returnKeyType='next'
        onSubmitEditing={() => priceRef.current?.focus()}
      />
      <TextInput
        ref={priceRef}
        style={[
          styles.input,
          styles.priceInput,
          {
            backgroundColor: colors.backgroundTertiary,
            color: colors.textOnSurface,
          },
        ]}
        placeholder={pricePlaceholder}
        placeholderTextColor={colors.textTertiary}
        value={price}
        onChangeText={handlePriceChange}
        keyboardType='numeric'
        returnKeyType='done'
        onSubmitEditing={handleAdd}
      />
      {isEditing && onCancelEdit && (
        <AppPressable
          onPress={onCancelEdit}
          style={[
            styles.cancelButton,
            { backgroundColor: colors.backgroundTertiary },
          ]}
        >
          <X size={20} color={colors.textSecondary} pointerEvents='none' />
        </AppPressable>
      )}
      <AppPressable
        onPress={handleAdd}
        disabled={!isValid}
        style={[
          styles.addButton,
          {
            backgroundColor: isValid
              ? colors.primary
              : colors.backgroundTertiary,
          },
        ]}
      >
        {isEditing ? (
          <Check
            pointerEvents='none'
            size={22}
            color={isValid ? colors.textInverse : colors.textTertiary}
          />
        ) : (
          <Plus
            pointerEvents='none'
            size={22}
            color={isValid ? colors.textInverse : colors.textTertiary}
          />
        )}
      </AppPressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  nameInput: {
    flex: 2,
  },
  priceInput: {
    flex: 1,
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
