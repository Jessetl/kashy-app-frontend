import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { BottomSheetModal } from '@/shared/presentation/components/ui/bottom-sheet-modal';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useCountry } from '@/shared/presentation/hooks/use-country';
import { ChevronDown, Plus, ShoppingBag, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ShoppingListSummary } from '../../domain/entities/shopping-list-summary.entity';

interface CompareListPickerProps {
  label: string;
  /** Color de acento (típicamente list_a vs list_b). */
  accentColor: string;
  selectedId: string | null;
  summaries: ShoppingListSummary[];
  /** IDs deshabilitados (ej. la lista seleccionada en el otro slot). */
  disabledIds?: string[];
  onSelect: (id: string | null) => void;
}

function formatTotal(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const CompareListPicker = React.memo(function CompareListPicker({
  label,
  accentColor,
  selectedId,
  summaries,
  disabledIds = [],
  onSelect,
}: CompareListPickerProps) {
  const { colors } = useAppTheme();
  const { country } = useCountry();
  const [sheetOpen, setSheetOpen] = useState(false);

  const selected = selectedId
    ? summaries.find((s) => s.id === selectedId) ?? null
    : null;

  const openSheet = useCallback(() => setSheetOpen(true), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const handlePick = useCallback(
    (id: string) => {
      onSelect(id);
      setSheetOpen(false);
    },
    [onSelect],
  );

  const handleClear = useCallback(() => onSelect(null), [onSelect]);

  return (
    <>
      <View style={styles.slot}>
        <View style={styles.slotHeader}>
          <View style={[styles.slotChip, { backgroundColor: `${accentColor}22` }]}>
            <Text style={[styles.slotChipText, { color: accentColor }]}>
              {label}
            </Text>
          </View>
          {selected ? (
            <AppPressable onPress={handleClear} style={styles.clearButton}>
              <X size={14} color={colors.textTertiary} strokeWidth={2.5} />
            </AppPressable>
          ) : null}
        </View>

        <AppPressable
          onPress={openSheet}
          style={[
            styles.slotBody,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: selected ? accentColor : colors.border,
            },
          ]}
        >
          {selected ? (
            <View style={styles.slotContent}>
              <View
                style={[
                  styles.slotIcon,
                  { backgroundColor: `${accentColor}22` },
                ]}
              >
                <ShoppingBag size={16} color={accentColor} strokeWidth={2} />
              </View>
              <View style={styles.slotInfo}>
                <Text
                  style={[styles.slotTitle, { color: colors.textOnSurface }]}
                  numberOfLines={1}
                >
                  {selected.name}
                </Text>
                <Text
                  style={[styles.slotMeta, { color: colors.textTertiary }]}
                  numberOfLines={1}
                >
                  {selected.itemsCount}{' '}
                  {selected.itemsCount === 1 ? 'producto' : 'productos'} ·{' '}
                  {formatTotal(selected.totalLocal, country.locale)}{' '}
                  {selected.currencyCode}
                </Text>
              </View>
              <ChevronDown size={18} color={colors.textTertiary} />
            </View>
          ) : (
            <View style={styles.slotEmpty}>
              <View
                style={[
                  styles.slotIcon,
                  { backgroundColor: colors.backgroundTertiary },
                ]}
              >
                <Plus size={16} color={colors.textTertiary} strokeWidth={2} />
              </View>
              <Text
                style={[
                  styles.slotPlaceholder,
                  { color: colors.textSecondary },
                ]}
              >
                Elegir lista
              </Text>
              <ChevronDown size={18} color={colors.textTertiary} />
            </View>
          )}
        </AppPressable>
      </View>

      <BottomSheetModal
        visible={sheetOpen}
        onClose={closeSheet}
        heightRatio={0.7}
      >
        <View style={styles.sheetHeader}>
          <Text
            style={[styles.sheetTitle, { color: colors.textOnSurface }]}
          >
            Selecciona una lista
          </Text>
          <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
            {label}
          </Text>
        </View>

        {summaries.length === 0 ? (
          <View style={styles.sheetEmpty}>
            <Text
              style={[styles.sheetEmptyText, { color: colors.textSecondary }]}
            >
              No hay listas disponibles para comparar.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
          >
            {summaries.map((s) => {
              const disabled = disabledIds.includes(s.id);
              const isPicked = s.id === selectedId;
              return (
                <AppPressable
                  key={s.id}
                  onPress={() => handlePick(s.id)}
                  disabled={disabled}
                  style={[
                    styles.sheetRow,
                    {
                      backgroundColor: isPicked
                        ? `${accentColor}18`
                        : colors.backgroundTertiary,
                      borderColor: isPicked ? accentColor : 'transparent',
                      opacity: disabled ? 0.4 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.sheetRowIcon,
                      {
                        backgroundColor: isPicked
                          ? accentColor
                          : colors.backgroundSecondary,
                      },
                    ]}
                  >
                    <ShoppingBag
                      size={16}
                      color={
                        isPicked ? colors.textInverse : colors.textSecondary
                      }
                    />
                  </View>
                  <View style={styles.sheetRowInfo}>
                    <Text
                      style={[
                        styles.sheetRowTitle,
                        {
                          color: isPicked
                            ? accentColor
                            : colors.textOnSurface,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {s.name}
                    </Text>
                    <Text
                      style={[
                        styles.sheetRowMeta,
                        { color: colors.textTertiary },
                      ]}
                      numberOfLines={1}
                    >
                      {s.storeName ? `${s.storeName} · ` : ''}
                      {s.itemsCount}{' '}
                      {s.itemsCount === 1 ? 'producto' : 'productos'} ·{' '}
                      {formatTotal(s.totalLocal, country.locale)}{' '}
                      {s.currencyCode}
                    </Text>
                  </View>
                </AppPressable>
              );
            })}
          </ScrollView>
        )}
      </BottomSheetModal>
    </>
  );
});

const styles = StyleSheet.create({
  slot: {
    flex: 1,
    gap: 8,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slotChipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBody: {
    minHeight: 70,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    justifyContent: 'center',
  },
  slotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slotEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slotIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotInfo: {
    flex: 1,
    gap: 2,
  },
  slotTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  slotMeta: {
    fontSize: 11,
    fontWeight: '500',
  },
  slotPlaceholder: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  sheetHeader: {
    paddingHorizontal: 4,
    paddingBottom: 12,
    gap: 4,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  sheetScroll: {
    flex: 1,
  },
  sheetContent: {
    gap: 8,
    paddingBottom: 24,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  sheetRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetRowInfo: {
    flex: 1,
    gap: 3,
  },
  sheetRowTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  sheetRowMeta: {
    fontSize: 12,
    fontWeight: '400',
  },
  sheetEmpty: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  sheetEmptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
