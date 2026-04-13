import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import {
  ArrowLeft,
  Bell,
  CalendarClock,
  CheckCircle,
  ExternalLink,
  Info,
  ShieldAlert,
  ShoppingBag,
  TrendingUp,
  XCircle,
} from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationPreferences } from '../hooks/use-notification-preferences';

/* ─── sub-componentes ─── */

interface NotifToggleProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
}

const NotifToggle = React.memo(function NotifToggle({
  icon,
  label,
  description,
  value,
  onToggle,
  disabled = false,
  colors,
}: NotifToggleProps) {
  return (
    <View style={[nStyles.row, disabled && { opacity: 0.45 }]}>
      <View
        style={[nStyles.iconWrap, { backgroundColor: colors.primaryLight }]}
      >
        {icon}
      </View>
      <View style={nStyles.textCol}>
        <Text style={[nStyles.label, { color: colors.textOnSurface }]}>
          {label}
        </Text>
        <Text style={[nStyles.desc, { color: colors.textTertiary }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{
          false: colors.backgroundTertiary,
          true: colors.primary,
        }}
        thumbColor='#FFFFFF'
      />
    </View>
  );
});

/* ─── pantalla ─── */

export default function NotificationsScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    preferences,
    isLoading,
    isSaving,
    error,
    successMessage,
    permissionStatus,
    togglePush,
    toggleCategory,
  } = useNotificationPreferences();

  const categoriesDisabled = !preferences.pushEnabled;
  const osPermissionDenied = permissionStatus === 'denied';

  const openSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      void Linking.openURL('app-settings:');
    } else {
      void Linking.openSettings();
    }
  }, []);

  return (
    <ScrollView
      style={nStyles.container}
      contentContainerStyle={[
        nStyles.content,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={nStyles.header}>
        <AppPressable onPress={() => router.back()} style={nStyles.backBtn}>
          <ArrowLeft pointerEvents='none' size={22} color={colors.text} />
        </AppPressable>
        <Text style={[nStyles.headerTitle, { color: colors.text }]}>
          Notificaciones
        </Text>
        <View style={nStyles.backBtn}>
          {isSaving && (
            <ActivityIndicator size='small' color={colors.primary} />
          )}
        </View>
      </View>

      {/* Feedback messages */}
      {error && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[
            nStyles.feedbackBanner,
            { backgroundColor: colors.dangerLight },
          ]}
        >
          <XCircle size={18} color={colors.danger} />
          <Text style={[nStyles.feedbackText, { color: colors.danger }]}>
            {error}
          </Text>
        </Animated.View>
      )}

      {successMessage && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[
            nStyles.feedbackBanner,
            { backgroundColor: colors.successLight },
          ]}
        >
          <CheckCircle size={18} color={colors.success} />
          <Text style={[nStyles.feedbackText, { color: colors.success }]}>
            {successMessage}
          </Text>
        </Animated.View>
      )}

      {/* Loading state */}
      {isLoading ? (
        <View style={nStyles.loadingContainer}>
          <ActivityIndicator size='large' color={colors.primary} />
          <Text style={[nStyles.loadingText, { color: colors.textSecondary }]}>
            Cargando preferencias...
          </Text>
        </View>
      ) : (
        <>
          {/* OS permission denied banner */}
          {osPermissionDenied && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={[
                nStyles.permissionBanner,
                { backgroundColor: colors.dangerLight },
              ]}
            >
              <ShieldAlert size={20} color={colors.danger} />
              <View style={nStyles.permissionTextCol}>
                <Text
                  style={[
                    nStyles.permissionTitle,
                    { color: colors.danger },
                  ]}
                >
                  Notificaciones bloqueadas
                </Text>
                <Text
                  style={[
                    nStyles.permissionDesc,
                    { color: colors.textSecondary },
                  ]}
                >
                  El sistema ha denegado el permiso de notificaciones. Actívalas
                  en los ajustes de tu dispositivo.
                </Text>
              </View>
              <AppPressable onPress={openSettings} style={nStyles.settingsBtn}>
                <ExternalLink size={16} color={colors.danger} />
              </AppPressable>
            </Animated.View>
          )}

          {/* Push master toggle */}
          <View style={nStyles.section}>
            <Text
              style={[nStyles.sectionTitle, { color: colors.textTertiary }]}
            >
              GENERAL
            </Text>
            <View
              style={[
                nStyles.card,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <NotifToggle
                icon={<Bell size={18} color={colors.primary} />}
                label='Notificaciones push'
                description='Recibe alertas en tu dispositivo'
                value={preferences.pushEnabled}
                onToggle={togglePush}
                colors={colors}
              />
            </View>
          </View>

          {/* Disabled notice */}
          {categoriesDisabled && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={[
                nStyles.disabledNotice,
                { backgroundColor: colors.warningLight },
              ]}
            >
              <Info size={16} color={colors.warning} />
              <Text
                style={[
                  nStyles.disabledNoticeText,
                  { color: colors.warning },
                ]}
              >
                Activa las notificaciones push para configurar las categorías
              </Text>
            </Animated.View>
          )}

          {/* Category toggles */}
          <View style={nStyles.section}>
            <Text
              style={[nStyles.sectionTitle, { color: colors.textTertiary }]}
            >
              CATEGORÍAS
            </Text>
            <View
              style={[
                nStyles.card,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <NotifToggle
                icon={<CalendarClock size={18} color={colors.primary} />}
                label='Recordatorios de deudas'
                description='Aviso antes del vencimiento de pagos'
                value={preferences.debtReminders}
                onToggle={(v) => toggleCategory('debtReminders', v)}
                disabled={categoriesDisabled}
                colors={colors}
              />
              <View
                style={[
                  nStyles.separator,
                  { backgroundColor: colors.border },
                ]}
              />
              <NotifToggle
                icon={<TrendingUp size={18} color={colors.primary} />}
                label='Alertas de precios'
                description='Cambios en la tasa de cambio'
                value={preferences.priceAlerts}
                onToggle={(v) => toggleCategory('priceAlerts', v)}
                disabled={categoriesDisabled}
                colors={colors}
              />
              <View
                style={[
                  nStyles.separator,
                  { backgroundColor: colors.border },
                ]}
              />
              <NotifToggle
                icon={<ShoppingBag size={18} color={colors.primary} />}
                label='Listas de compras'
                description='Recordatorios de listas pendientes'
                value={preferences.listReminders}
                onToggle={(v) => toggleCategory('listReminders', v)}
                disabled={categoriesDisabled}
                colors={colors}
              />
            </View>
          </View>

          {/* Info note */}
          <Text style={[nStyles.infoNote, { color: colors.textTertiary }]}>
            Las notificaciones push requieren permisos del sistema. Si no
            recibes alertas, revisa los ajustes de tu dispositivo.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

/* ─── estilos ─── */

const nStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  /* ─── feedback ─── */
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },

  /* ─── loading ─── */
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },

  /* ─── OS permission banner ─── */
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  permissionTextCol: {
    flex: 1,
    gap: 2,
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  permissionDesc: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ─── disabled notice ─── */
  disabledNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  disabledNoticeText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },

  /* ─── sections ─── */
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  desc: {
    fontSize: 12,
    fontWeight: '400',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 48,
  },
  infoNote: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
