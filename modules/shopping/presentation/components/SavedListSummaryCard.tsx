import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useCountry } from '@/shared/presentation/hooks/use-country';
import {
  CalendarClock,
  Check,
  ChevronRight,
  CloudOff,
  ShoppingBag,
  Store,
  Trash2,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { ShoppingListSummary } from '../../domain/entities/shopping-list-summary.entity';

interface SavedListSummaryCardProps {
  summary: ShoppingListSummary;
  onPress: (summary: ShoppingListSummary) => void;
  /** Long-press habilita selectionMode (Flow 13). Pasar `undefined` para deshabilitar. */
  onLongPress?: (summary: ShoppingListSummary) => void;
  /** Si true, muestra checkbox y bloquea navegación. Tap dispara toggle vía onPress. */
  selectionMode?: boolean;
  /** Solo aplica si `selectionMode` está activo. */
  isSelected?: boolean;
  /**
   * Si se provee y `!selectionMode`, envuelve el card en Swipeable con
   * acción Eliminar (Flow 14). Confirmación corre a cuenta del caller.
   */
  onDelete?: (summary: ShoppingListSummary) => void;
}

function formatCurrencyLocal(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatScheduled(iso: string, locale: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isLocalList(id: string): boolean {
  return id.startsWith('local-');
}

export const SavedListSummaryCard = React.memo(function SavedListSummaryCard({
  summary,
  onPress,
  onLongPress,
  selectionMode = false,
  isSelected = false,
  onDelete,
}: SavedListSummaryCardProps) {
  const { colors } = useAppTheme();
  const { country } = useCountry();
  const swipeableRef = useRef<Swipeable>(null);

  const isLocal = isLocalList(summary.id);
  const progressRatio =
    summary.itemsCount > 0 ? summary.checkedCount / summary.itemsCount : 0;
  const progressPercent = Math.round(progressRatio * 100);

  const accentColor = useMemo(() => {
    if (summary.listType === 'COMPLETED') return colors.textTertiary;
    if (summary.listType === 'RECEIPT') return colors.success;
    return colors.primary;
  }, [summary.listType, colors]);

  const typeLabel =
    summary.listType === 'COMPLETED'
      ? 'Recibo'
      : summary.listType === 'RECEIPT'
        ? 'Compra activa'
        : 'Borrador';

  const scale = useSharedValue(1);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(progressRatio, {
      duration: 360,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, progressRatio]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { mass: 0.3, damping: 14, stiffness: 220 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { mass: 0.3, damping: 14, stiffness: 220 });
  };

  const handlePress = () => onPress(summary);
  const handleLongPress = onLongPress ? () => onLongPress(summary) : undefined;

  const selectionBorderColor = isSelected ? accentColor : `${accentColor}33`;
  const selectionBorderWidth = isSelected ? 2 : 1;

  const swipeEnabled = !selectionMode && !!onDelete;

  const handleDeleteAction = () => {
    swipeableRef.current?.close();
    onDelete?.(summary);
  };

  const renderRightActions = () => (
    <View style={styles.swipeActionWrap}>
      <Pressable
        onPress={handleDeleteAction}
        accessibilityRole='button'
        accessibilityLabel={`Eliminar ${summary.name}`}
        style={({ pressed }) => [
          styles.deleteAction,
          {
            backgroundColor: colors.danger,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Trash2 size={20} color={colors.textInverse} strokeWidth={2.4} />
        <Text style={[styles.deleteActionText, { color: colors.textInverse }]}>
          Eliminar
        </Text>
      </Pressable>
    </View>
  );

  const cardContent = (
    <Animated.View style={animatedStyle}>
      <AppPressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole='button'
        accessibilityLabel={
          selectionMode
            ? `${isSelected ? 'Deseleccionar' : 'Seleccionar'} ${typeLabel.toLowerCase()} ${summary.name}`
            : `Abrir ${typeLabel.toLowerCase()} ${summary.name}`
        }
        accessibilityState={selectionMode ? { selected: isSelected } : undefined}
        style={[
          styles.card,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: selectionBorderColor,
            borderWidth: selectionBorderWidth,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${accentColor}1F` },
            ]}
          >
            {selectionMode ? (
              <View
                style={[
                  styles.selectionCheckbox,
                  {
                    borderColor: accentColor,
                    backgroundColor: isSelected ? accentColor : 'transparent',
                  },
                ]}
              >
                {isSelected ? (
                  <Check size={14} color={colors.textInverse} strokeWidth={3} />
                ) : null}
              </View>
            ) : (
              <ShoppingBag size={20} color={accentColor} strokeWidth={2.2} />
            )}
          </View>
          <View style={styles.titleCol}>
            <Text
              style={[styles.title, { color: colors.textOnSurface }]}
              numberOfLines={1}
            >
              {summary.name}
            </Text>
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.chip,
                  { backgroundColor: `${accentColor}22` },
                ]}
              >
                <Text style={[styles.chipText, { color: accentColor }]}>
                  {typeLabel}
                </Text>
              </View>
              {isLocal ? (
                <View
                  style={[
                    styles.chip,
                    styles.chipLocal,
                    { backgroundColor: colors.warningLight },
                  ]}
                  accessibilityLabel='Lista local, no sincronizada'
                >
                  <CloudOff size={10} color={colors.warning} strokeWidth={2.5} />
                  <Text style={[styles.chipText, { color: colors.warning }]}>
                    Local
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          {selectionMode ? null : (
            <ChevronRight size={18} color={colors.textTertiary} />
          )}
        </View>

        {summary.storeName || summary.scheduledDate ? (
          <View style={styles.body}>
            {summary.storeName ? (
              <View style={styles.metaInline}>
                <Store size={13} color={colors.textTertiary} />
                <Text
                  style={[styles.metaText, { color: colors.textTertiary }]}
                  numberOfLines={1}
                >
                  {summary.storeName}
                </Text>
              </View>
            ) : null}

            {summary.scheduledDate ? (
              <View style={styles.metaInline}>
                <CalendarClock size={13} color={colors.textTertiary} />
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                  {formatScheduled(summary.scheduledDate, country.locale)}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.progressRow}>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: colors.backgroundTertiary },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                progressStyle,
                { backgroundColor: accentColor },
              ]}
            />
          </View>
          <View style={styles.progressInfo}>
            <Check size={12} color={accentColor} strokeWidth={3} />
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {summary.checkedCount}/{summary.itemsCount}
            </Text>
            <Text style={[styles.progressPercent, { color: accentColor }]}>
              {progressPercent}%
            </Text>
          </View>
        </View>

        <View style={styles.totalsRow}>
          <View style={styles.totalLocalGroup}>
            <Text style={[styles.totalLocal, { color: colors.textOnSurface }]}>
              {formatCurrencyLocal(summary.totalLocal, country.locale)}
            </Text>
            <Text style={[styles.currencyTag, { color: colors.textTertiary }]}>
              {summary.currencyCode}
            </Text>
          </View>
          {summary.totalUsd != null ? (
            <Text style={[styles.totalUsd, { color: colors.textTertiary }]}>
              ≈ ${summary.totalUsd.toFixed(2)} USD
            </Text>
          ) : null}
        </View>
      </AppPressable>
    </Animated.View>
  );

  if (!swipeEnabled) return cardContent;

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
    >
      {cardContent}
    </Swipeable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  chipLocal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  body: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'right',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  totalLocalGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  totalLocal: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  currencyTag: {
    fontSize: 11,
    fontWeight: '600',
  },
  totalUsd: {
    fontSize: 12,
    fontWeight: '500',
  },
  swipeActionWrap: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  deleteAction: {
    width: 84,
    height: '88%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteActionText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
