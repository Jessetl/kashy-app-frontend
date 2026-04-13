import { apiClient } from '@/shared/infrastructure/api';
import { ApiHttpError } from '@/shared/infrastructure/api/api-http-error';
import { useAuthStore } from '@/shared/infrastructure/auth/auth.store';
import { CardShadow } from '@/shared/infrastructure/theme/theme.constants';
import { AppButton } from '@/shared/presentation/components/ui/app-button';
import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { AppTextInput } from '@/shared/presentation/components/ui/app-text-input';
import { useAuth } from '@/shared/presentation/hooks/auth/use-auth';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Info,
  Lock,
  Mail,
  User,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AccountScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const updateUser = useAuthStore((s) => s.updateUser);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [nameLoading, setNameLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const nameChanged =
    firstName.trim() !== (user?.firstName ?? '') ||
    lastName.trim() !== (user?.lastName ?? '');

  const passwordValid =
    currentPassword.length >= 6 &&
    newPassword.length >= 6 &&
    newPassword === confirmPassword;

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Usuario';

  const handleSaveName = useCallback(async () => {
    if (!nameChanged) return;
    setNameLoading(true);
    try {
      await apiClient('/users/me', {
        method: 'PUT',
        body: { firstName: firstName.trim(), lastName: lastName.trim() },
      });
      updateUser({ firstName: firstName.trim(), lastName: lastName.trim() });
      Alert.alert('Listo', 'Tu nombre se ha actualizado.');
    } catch (error) {
      const message =
        error instanceof ApiHttpError
          ? error.message
          : 'No se pudo actualizar el nombre.';
      Alert.alert('Error', message);
    } finally {
      setNameLoading(false);
    }
  }, [nameChanged, firstName, lastName, updateUser]);

  const handleChangePassword = useCallback(async () => {
    if (!passwordValid) {
      Alert.alert('Error', 'La contraseña no cumple con los requisitos.');
      return;
    }
    setPasswordLoading(true);
    try {
      await apiClient('/users/me/password', {
        method: 'PUT',
        body: { currentPassword, newPassword },
      });
      Alert.alert(
        'Contraseña actualizada',
        'Tu contraseña se cambió exitosamente. Debes iniciar sesión nuevamente.',
        [{ text: 'Entendido', onPress: () => { logout(); router.dismissAll(); } }],
        { cancelable: false },
      );
    } catch (error) {
      const message =
        error instanceof ApiHttpError
          ? error.message
          : 'No se pudo cambiar la contraseña.';
      Alert.alert('Error', message);
    } finally {
      setPasswordLoading(false);
    }
  }, [passwordValid, currentPassword, newPassword, logout, router]);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        {/* Header */}
        <View style={styles.header}>
          <AppPressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
          >
            <ArrowLeft pointerEvents='none' size={20} color={colors.text} />
          </AppPressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Mi cuenta</Text>
          <View style={styles.backBtn} />
        </View>

        {/* Avatar hero */}
        <View style={styles.hero}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.textInverse }]}>
              {initials}
            </Text>
          </View>
          <Text style={[styles.heroName, { color: colors.text }]}>{fullName}</Text>
          <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
            <Mail size={12} color={colors.text} pointerEvents='none' />
            <Text style={[styles.heroBadgeText, { color: colors.text }]}>
              {user?.email ?? '—'}
            </Text>
          </View>
        </View>

        {/* Información personal */}
        <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }, CardShadow]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primaryLight }]}>
              <User size={14} color={colors.primary} pointerEvents='none' />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textOnSurface }]}>
              Información personal
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <AppTextInput
                  label='Nombre'
                  placeholder='Tu nombre'
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize='words'
                />
              </View>
              <View style={styles.nameField}>
                <AppTextInput
                  label='Apellido'
                  placeholder='Tu apellido'
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize='words'
                />
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

            <View style={[styles.emailRow, { backgroundColor: colors.backgroundTertiary }]}>
              <Mail size={15} color={colors.textTertiary} pointerEvents='none' />
              <View style={styles.emailContent}>
                <Text style={[styles.emailLabel, { color: colors.textTertiary }]}>
                  Correo electrónico
                </Text>
                <Text style={[styles.emailValue, { color: colors.textOnSurface }]} numberOfLines={1}>
                  {user?.email ?? '—'}
                </Text>
              </View>
              <View style={[styles.readOnlyBadge, { backgroundColor: colors.borderLight }]}>
                <Text style={[styles.readOnlyText, { color: colors.textTertiary }]}>
                  Solo lectura
                </Text>
              </View>
            </View>

            <AppButton
              title='Guardar cambios'
              onPress={handleSaveName}
              loading={nameLoading}
              disabled={!nameChanged}
            />
        </View>

        {/* Cambiar contraseña */}
        <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }, CardShadow]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.dangerLight }]}>
              <Lock size={14} color={colors.danger} pointerEvents='none' />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textOnSurface }]}>
              Cambiar contraseña
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
            {/* Aviso sesión */}
            <View style={[styles.infoBanner, { backgroundColor: colors.warningLight }]}>
              <Info size={14} color={colors.warning} pointerEvents='none' />
              <Text style={[styles.infoBannerText, { color: colors.warning }]}>
                Al cambiar tu contraseña deberás iniciar sesión nuevamente.
              </Text>
            </View>

            <AppTextInput
              label='Contraseña actual'
              placeholder='Ingresa tu contraseña actual'
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrent}
              autoCapitalize='none'
              rightElement={
                <AppPressable onPress={() => setShowCurrent((v) => !v)} style={styles.eyeBtn}>
                  {showCurrent
                    ? <EyeOff size={18} color={colors.textTertiary} pointerEvents='none' />
                    : <Eye size={18} color={colors.textTertiary} pointerEvents='none' />}
                </AppPressable>
              }
            />

            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

            <AppTextInput
              label='Nueva contraseña'
              placeholder='Mínimo 6 caracteres'
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              autoCapitalize='none'
              rightElement={
                <AppPressable onPress={() => setShowNew((v) => !v)} style={styles.eyeBtn}>
                  {showNew
                    ? <EyeOff size={18} color={colors.textTertiary} pointerEvents='none' />
                    : <Eye size={18} color={colors.textTertiary} pointerEvents='none' />}
                </AppPressable>
              }
            />
            <AppTextInput
              label='Confirmar contraseña'
              placeholder='Repite la nueva contraseña'
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              autoCapitalize='none'
              hasError={confirmPassword.length > 0 && newPassword !== confirmPassword}
              rightElement={
                <AppPressable onPress={() => setShowConfirm((v) => !v)} style={styles.eyeBtn}>
                  {showConfirm
                    ? <EyeOff size={18} color={colors.textTertiary} pointerEvents='none' />
                    : <Eye size={18} color={colors.textTertiary} pointerEvents='none' />}
                </AppPressable>
              }
            />

            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text style={[styles.errorHint, { color: colors.danger }]}>
                Las contraseñas no coinciden
              </Text>
            )}

            <AppButton
              title='Actualizar contraseña'
              onPress={handleChangePassword}
              loading={passwordLoading}
              disabled={!passwordValid}
            />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    gap: 24,
  },

  // Header
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

  // Hero
  hero: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.85,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // Card
  card: {
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  divider: {
    height: 1,
    marginHorizontal: -4,
  },

  // Name row
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  nameField: { flex: 1 },

  // Email
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 12,
  },
  emailContent: { flex: 1, gap: 2 },
  emailLabel: { fontSize: 11, fontWeight: '500' },
  emailValue: { fontSize: 14, fontWeight: '600' },
  readOnlyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  readOnlyText: { fontSize: 10, fontWeight: '600' },

  // Info banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 10,
    padding: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },

  // Inputs
  eyeBtn: {
    width: 44,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorHint: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: -8,
    paddingHorizontal: 4,
  },
});
