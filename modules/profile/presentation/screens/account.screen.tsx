import { AppButton } from '@/shared/presentation/components/ui/app-button';
import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { AppTextInput } from '@/shared/presentation/components/ui/app-text-input';
import { useAuth } from '@/shared/presentation/hooks/auth/use-auth';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
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
  const { user } = useAuth();

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

  const handleSaveName = useCallback(async () => {
    if (!nameChanged) return;
    setNameLoading(true);
    // TODO: call API to update name
    await new Promise((r) => setTimeout(r, 600));
    setNameLoading(false);
    Alert.alert('Listo', 'Tu nombre se ha actualizado.');
  }, [nameChanged]);

  const handleChangePassword = useCallback(async () => {
    if (!passwordValid) {
      Alert.alert('Error', 'La contraseña no cumple con los requisitos.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    setPasswordLoading(true);
    // TODO: call API to change password
    await new Promise((r) => setTimeout(r, 600));
    setPasswordLoading(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    Alert.alert('Listo', 'Tu contraseña se ha actualizado.');
  }, [passwordValid, newPassword, confirmPassword]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
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
          <AppPressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft pointerEvents='none' size={22} color={colors.text} />
          </AppPressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Cuenta
          </Text>
          <View style={styles.backBtn} />
        </View>

        {/* Name section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            INFORMACION PERSONAL
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <AppTextInput
              label='Nombre'
              placeholder='Tu nombre'
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize='words'
            />
            <AppTextInput
              label='Apellido'
              placeholder='Tu apellido'
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize='words'
            />
            <View style={styles.emailRow}>
              <Text style={[styles.emailLabel, { color: colors.textTertiary }]}>
                Correo
              </Text>
              <Text
                style={[styles.emailValue, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {user?.email ?? '—'}
              </Text>
            </View>
            <AppButton
              title='Guardar cambios'
              onPress={handleSaveName}
              loading={nameLoading}
              disabled={!nameChanged}
            />
          </View>
        </View>

        {/* Password section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            CAMBIAR CONTRASEÑA
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <AppTextInput
              label='Contraseña actual'
              placeholder='********'
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrent}
              autoCapitalize='none'
              rightElement={
                <AppPressable onPress={() => setShowCurrent((v) => !v)} style={styles.eyeBtn}>
                  {showCurrent ? (
                    <EyeOff size={18} color={colors.textTertiary} pointerEvents='none' />
                  ) : (
                    <Eye size={18} color={colors.textTertiary} pointerEvents='none' />
                  )}
                </AppPressable>
              }
            />
            <AppTextInput
              label='Nueva contraseña'
              placeholder='Min. 6 caracteres'
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              autoCapitalize='none'
              rightElement={
                <AppPressable onPress={() => setShowNew((v) => !v)} style={styles.eyeBtn}>
                  {showNew ? (
                    <EyeOff size={18} color={colors.textTertiary} pointerEvents='none' />
                  ) : (
                    <Eye size={18} color={colors.textTertiary} pointerEvents='none' />
                  )}
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
              hasError={
                confirmPassword.length > 0 && newPassword !== confirmPassword
              }
              rightElement={
                <AppPressable onPress={() => setShowConfirm((v) => !v)} style={styles.eyeBtn}>
                  {showConfirm ? (
                    <EyeOff size={18} color={colors.textTertiary} pointerEvents='none' />
                  ) : (
                    <Eye size={18} color={colors.textTertiary} pointerEvents='none' />
                  )}
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
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
  emailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  emailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  emailValue: {
    fontSize: 14,
    fontWeight: '400',
    flexShrink: 1,
  },
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
