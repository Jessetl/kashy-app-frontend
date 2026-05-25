import { AppButton } from '@/shared/presentation/components/ui/app-button';
import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowLeftRight,
  ScaleIcon,
  XCircle,
} from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompareListPicker } from '../components/compare-list-picker';
import { CompareMatchedRow } from '../components/compare-matched-row';
import { CompareSummaryCard } from '../components/compare-summary-card';
import { CompareUnmatchedRow } from '../components/compare-unmatched-row';
import { useCompareLists } from '../hooks/use-compare-lists';
import { useSavedLists } from '../hooks/use-saved-lists';

export default function CompareListsScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ listA?: string; listB?: string }>();

  const headerForegroundColor = isDark ? colors.textOnSurface : '#FFFFFF';

  // Acentos por lista — alineados con el resto de la app (primary + success).
  const colorA = colors.primary;
  const colorB = colors.success;

  const { summaries, isLoading: summariesLoading, isAuthenticated } =
    useSavedLists();
  const {
    listAId,
    listBId,
    comparison,
    isLoading,
    error,
    canCompare,
    setListA,
    setListB,
    swap,
    compare,
    reset,
    clearError,
  } = useCompareLists();

  // Pre-seleccionar listas vía query params (?listA=...&listB=...)
  useEffect(() => {
    if (params.listA && !listAId) setListA(params.listA);
    if (params.listB && !listBId) setListB(params.listB);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lanzar comparación automáticamente al tener ambas seleccionadas.
  useEffect(() => {
    if (canCompare && !comparison && !isLoading) {
      void compare();
    }
  }, [canCompare, comparison, isLoading, compare]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/shopping-lists');
  };

  const disabledForA = useMemo(() => (listBId ? [listBId] : []), [listBId]);
  const disabledForB = useMemo(() => (listAId ? [listAId] : []), [listAId]);

  return (
    <View
      style={[
        styles.flex,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <AppPressable onPress={handleBack} style={styles.backButton}>
          <ArrowLeft
            pointerEvents='none'
            size={22}
            color={headerForegroundColor}
            strokeWidth={2}
          />
        </AppPressable>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: headerForegroundColor }]}>
            Comparar listas
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Elige dos listas para ver dónde te conviene comprar
          </Text>
        </View>
        {comparison ? (
          <AppPressable onPress={reset} style={styles.resetButton}>
            <Text style={[styles.resetText, { color: colors.primary }]}>
              Reiniciar
            </Text>
          </AppPressable>
        ) : null}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Selectores */}
        <View style={styles.pickersRow}>
          <CompareListPicker
            label='Lista A'
            accentColor={colorA}
            selectedId={listAId}
            summaries={summaries}
            disabledIds={disabledForA}
            onSelect={setListA}
          />
          <AppPressable
            onPress={swap}
            disabled={!listAId && !listBId}
            style={[
              styles.swapButton,
              {
                backgroundColor: colors.backgroundSecondary,
                opacity: !listAId && !listBId ? 0.4 : 1,
              },
            ]}
          >
            <ArrowLeftRight
              size={18}
              color={colors.textSecondary}
              strokeWidth={2}
            />
          </AppPressable>
          <CompareListPicker
            label='Lista B'
            accentColor={colorB}
            selectedId={listBId}
            summaries={summaries}
            disabledIds={disabledForB}
            onSelect={setListB}
          />
        </View>

        {/* Botón Compare */}
        {!comparison ? (
          <AppButton
            title={isLoading ? 'Comparando...' : 'Comparar'}
            onPress={() => void compare()}
            loading={isLoading}
            disabled={!canCompare}
          />
        ) : null}

        {/* Estados informativos */}
        {!isAuthenticated ? (
          <View
            style={[
              styles.notice,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
              Inicia sesión para sincronizar listas y poder compararlas.
            </Text>
          </View>
        ) : null}

        {isAuthenticated && summariesLoading && summaries.length === 0 ? (
          <View style={styles.centeredBlock}>
            <ActivityIndicator size='small' color={colors.primary} />
            <Text style={[styles.centeredText, { color: colors.textSecondary }]}>
              Cargando listas disponibles...
            </Text>
          </View>
        ) : null}

        {isAuthenticated &&
        !summariesLoading &&
        summaries.length < 2 &&
        !comparison ? (
          <View
            style={[
              styles.notice,
              { backgroundColor: colors.warningLight },
            ]}
          >
            <Text style={[styles.noticeText, { color: colors.warning }]}>
              Necesitas al menos dos listas guardadas para comparar.
            </Text>
          </View>
        ) : null}

        {/* Error */}
        {error ? (
          <AppPressable
            onPress={clearError}
            style={[
              styles.errorBanner,
              { backgroundColor: colors.dangerLight },
            ]}
          >
            <XCircle size={18} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {error}
            </Text>
          </AppPressable>
        ) : null}

        {/* Resultado */}
        {comparison ? (
          <>
            <CompareSummaryCard
              listA={comparison.listA}
              listB={comparison.listB}
              summary={comparison.summary}
              colorA={colorA}
              colorB={colorB}
            />

            {/* Productos en común */}
            <Section
              title='Productos en común'
              subtitle={`${comparison.matchedItems.length} ${
                comparison.matchedItems.length === 1
                  ? 'coincidencia'
                  : 'coincidencias'
              }`}
              accentColor={colors.primary}
            >
              {comparison.matchedItems.length === 0 ? (
                <EmptySectionText text='No hay productos coincidentes entre estas listas.' />
              ) : (
                comparison.matchedItems.map((item) => (
                  <CompareMatchedRow
                    key={`${item.productName}-${item.category}`}
                    item={item}
                    colorA={colorA}
                    colorB={colorB}
                  />
                ))
              )}
            </Section>

            {/* Solo en A */}
            <Section
              title={`Solo en ${comparison.listA.name}`}
              subtitle={`${comparison.unmatchedItems.onlyInListA.length} ${
                comparison.unmatchedItems.onlyInListA.length === 1
                  ? 'producto'
                  : 'productos'
              }`}
              accentColor={colorA}
            >
              {comparison.unmatchedItems.onlyInListA.length === 0 ? (
                <EmptySectionText text='Esta lista no tiene productos exclusivos.' />
              ) : (
                comparison.unmatchedItems.onlyInListA.map((item) => (
                  <CompareUnmatchedRow
                    key={`${item.productName}-${item.category}`}
                    item={item}
                    accentColor={colorA}
                  />
                ))
              )}
            </Section>

            {/* Solo en B */}
            <Section
              title={`Solo en ${comparison.listB.name}`}
              subtitle={`${comparison.unmatchedItems.onlyInListB.length} ${
                comparison.unmatchedItems.onlyInListB.length === 1
                  ? 'producto'
                  : 'productos'
              }`}
              accentColor={colorB}
            >
              {comparison.unmatchedItems.onlyInListB.length === 0 ? (
                <EmptySectionText text='Esta lista no tiene productos exclusivos.' />
              ) : (
                comparison.unmatchedItems.onlyInListB.map((item) => (
                  <CompareUnmatchedRow
                    key={`${item.productName}-${item.category}`}
                    item={item}
                    accentColor={colorB}
                  />
                ))
              )}
            </Section>
          </>
        ) : null}

        {/* Estado vacío inicial */}
        {!comparison && !isLoading && (!listAId || !listBId) ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.backgroundTertiary },
              ]}
            >
              <ScaleIcon
                size={32}
                color={colors.textTertiary}
                strokeWidth={1.5}
              />
            </View>
            <Text
              style={[styles.emptyTitle, { color: colors.textOnSurface }]}
            >
              Selecciona dos listas
            </Text>
            <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
              Comparamos productos por nombre y te decimos en cuál lista te
              conviene comprar.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

interface SectionProps {
  title: string;
  subtitle: string;
  accentColor: string;
  children: React.ReactNode;
}

function Section({ title, subtitle, accentColor, children }: SectionProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionAccent, { backgroundColor: accentColor }]} />
        <View style={styles.sectionTitles}>
          <Text style={[styles.sectionTitle, { color: colors.textOnSurface }]}>
            {title}
          </Text>
          <Text
            style={[styles.sectionSubtitle, { color: colors.textTertiary }]}
          >
            {subtitle}
          </Text>
        </View>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function EmptySectionText({ text }: { text: string }) {
  const { colors } = useAppTheme();
  return (
    <Text
      style={[styles.sectionEmpty, { color: colors.textTertiary }]}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  resetButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  resetText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  pickersRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  notice: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  noticeText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  centeredBlock: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  centeredText: {
    fontSize: 13,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionAccent: {
    width: 4,
    height: 28,
    borderRadius: 2,
  },
  sectionTitles: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sectionBody: {
    gap: 8,
  },
  sectionEmpty: {
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 32,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
