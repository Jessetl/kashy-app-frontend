import { COUNTRIES } from '@/shared/domain/country/country.constants';
import { useCountryStore } from '@/shared/infrastructure/country/country.store';
import { AppPressable } from '@/shared/presentation/components/ui';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { formatLocalAmount } from '@/shared/presentation/utils/format-currency';
import { ArrowUpDown, ChevronDown } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface ExchangeRateBannerProps {
  rate: number | null;
  source: string | null;
  isLoading: boolean;
}

export const ExchangeRateBanner = React.memo(function ExchangeRateBanner({
  rate,
  source,
  isLoading,
}: ExchangeRateBannerProps) {
  const { colors } = useAppTheme();
  const countryCode = useCountryStore((s) => s.countryCode);
  const country = useCountryStore((s) => s.country);
  const setCountry = useCountryStore((s) => s.setCountry);
  const [pickerVisible, setPickerVisible] = useState(false);

  return (
    <>
      <View
        style={[
          styles.container,
          { backgroundColor: 'rgba(255,255,255,0.12)' },
        ]}
      >
        {/* Ícono de tasa */}
        <View
          style={[styles.iconWrap, { backgroundColor: 'rgba(99,230,150,0.2)' }]}
        >
          <ArrowUpDown size={16} color={colors.primary} pointerEvents='none' />
        </View>

        {/* Tasa */}
        <View style={styles.textWrap}>
          <Text style={[styles.label, { color: 'rgba(255,255,255,0.7)' }]}>
            Tasa del día
          </Text>
          {isLoading ? (
            <ActivityIndicator size='small' color={colors.primary} />
          ) : (
            <Text style={[styles.rate, { color: colors.text }]}>
              {rate ? formatLocalAmount(rate, country) : '--'}{' '}
              <Text style={[styles.perUsd, { color: 'rgba(255,255,255,0.6)' }]}>
                / USD
              </Text>
            </Text>
          )}
        </View>

        {/* Selector de país */}
        <AppPressable
          onPress={() => setPickerVisible(true)}
          style={[
            styles.countryBtn,
            { backgroundColor: 'rgba(255,255,255,0.14)' },
          ]}
        >
          <Text style={styles.flag}>{country.flag}</Text>
          <Text style={[styles.countryCode, { color: colors.text }]}>
            {countryCode}
          </Text>
          <ChevronDown size={12} color={colors.text} pointerEvents='none' />
        </AppPressable>
      </View>

      {/* Picker de país */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPickerVisible(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.sheet,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <Text
                  style={[styles.sheetTitle, { color: colors.textOnSurface }]}
                >
                  Selecciona tu región
                </Text>
                <View
                  style={[
                    styles.sheetDivider,
                    { backgroundColor: colors.borderLight },
                  ]}
                />
                {COUNTRIES.map((c) => {
                  const isSelected = c.code === countryCode;
                  return (
                    <AppPressable
                      key={c.code}
                      onPress={() => {
                        setCountry(c.code);
                        setPickerVisible(false);
                      }}
                      style={[
                        styles.countryRow,
                        isSelected && { backgroundColor: colors.primaryLight },
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
                            styles.selectedDot,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                      )}
                    </AppPressable>
                  );
                })}
                <View
                  style={[
                    styles.sheetDivider,
                    { backgroundColor: colors.borderLight },
                  ]}
                />
                <AppPressable
                  onPress={() => setPickerVisible(false)}
                  style={styles.cancelBtn}
                >
                  <Text
                    style={[styles.cancelText, { color: colors.textSecondary }]}
                  >
                    Cancelar
                  </Text>
                </AppPressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, gap: 2 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rate: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  perUsd: { fontSize: 13, fontWeight: '400' },

  // Botón país
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  flag: { fontSize: 18 },
  countryCode: { fontSize: 12, fontWeight: '700' },

  // Modal overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  sheetDivider: { height: 1, marginHorizontal: 0 },

  // Filas de país
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  rowFlag: { fontSize: 26 },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { fontSize: 15, fontWeight: '600' },
  rowCurrency: { fontSize: 12, fontWeight: '400' },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Cancelar
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  cancelText: { fontSize: 15, fontWeight: '500' },
});
