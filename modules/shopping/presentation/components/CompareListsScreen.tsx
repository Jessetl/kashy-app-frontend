import { AppButton } from '@/shared/presentation/components/ui/app-button';
import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ScaleIcon, XCircle } from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompareMatchedRow } from '../components/CompareMatchedRow';
import { CompareSummaryCard } from '../components/CompareSummaryCard';
import { CompareUnmatchedRow } from '../components/CompareUnmatchedRow';
import { useCompareLists } from '../hooks/useCompareLists';

export function CompareListsScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ aId?: string; bId?: string }>();

  const headerForegroundColor = isDark ? colors.textOnSurface : '#FFFFFF';

  // Acentos por lista — alineados con el resto de la app (primary + success).
  const colorA = colors.primary;
  const colorB = colors.success;

  const aId = params.aId ?? null;
  const bId = params.bId ?? null;

  const hasValidParams = !!aId && !!bId && aId !== bId;

  // Sin params válidos: volver al listado. La selección vive en SavedListsScreen.
  useEffect(() => {
    if (hasValidParams) return;
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/shopping');
  }, [hasValidParams, router]);

  const { comparison, isLoading, error, clearError, retry } = useCompareLists(
    hasValidParams ? aId : null,
    hasValidParams ? bId : null,
  );

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/shopping');
  };

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
            Diferencias de precio entre dos recibos
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading inicial */}
        {isLoading && !comparison ? (
          <View style={styles.centeredBlock}>
            <ActivityIndicator size='large' color={colors.primary} />
            <Text style={[styles.centeredText, { color: colors.textSecondary }]}>
              Calculando comparación...
            </Text>
          </View>
        ) : null}

        {/* Error con retry */}
        {error ? (
          <View style={styles.errorSection}>
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
            <AppButton
              title='Reintentar'
              onPress={() => void retry()}
              loading={isLoading}
            />
          </View>
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

        {/* Sin resultado y sin error y sin loading → params inválidos (mientras redirige) */}
        {!isLoading && !comparison && !error && !hasValidParams ? (
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
              Selecciona dos listas primero
            </Text>
            <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
              Mantén presionada una compra en la pestaña Recibos para
              seleccionarla, escoge otra y pulsa Comparar.
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  centeredBlock: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  centeredText: {
    fontSize: 13,
    fontWeight: '500',
  },
  errorSection: {
    gap: 12,
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
