import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Share2,
  ShoppingBag,
} from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ListHeaderBarProps {
  onBack?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onConvertToReceipt?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
}

export const ListHeaderBar = React.memo(function ListHeaderBar({
  onBack,
  onShare,
  onSave,
  onConvertToReceipt,
  onComplete,
}: ListHeaderBarProps) {
  const colors = useThemeColors();
  const iconColor = colors.text;
  const buttonBg = 'rgba(255,255,255,0.10)';

  const IconButton = ({
    onPress,
    children,
    label,
    bg,
  }: {
    onPress: () => void;
    children: React.ReactNode;
    label: string;
    bg?: string;
  }) => (
    <AppPressable
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={label}
      style={[styles.iconButton, { backgroundColor: bg ?? buttonBg }]}
    >
      {children}
    </AppPressable>
  );

  return (
    <View style={styles.container}>
      {onBack ? (
        <IconButton onPress={onBack} label='Volver' bg={buttonBg}>
          <ArrowLeft pointerEvents='none' size={20} color={iconColor} />
        </IconButton>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}
      <View style={styles.rightActions}>
        {onShare && (
          <IconButton onPress={onShare} label='Compartir'>
            <Share2
              pointerEvents='none'
              size={18}
              color={iconColor}
              strokeWidth={2.2}
            />
          </IconButton>
        )}
        {onConvertToReceipt && (
          <IconButton
            onPress={onConvertToReceipt}
            label='Convertir en compra'
            bg={`${colors.success}33`}
          >
            <ShoppingBag
              pointerEvents='none'
              size={18}
              color={colors.success}
              strokeWidth={2.2}
            />
          </IconButton>
        )}
        {onComplete && (
          <IconButton
            onPress={onComplete}
            label='Completar compra'
            bg={`${colors.success}33`}
          >
            <CheckCircle2
              pointerEvents='none'
              size={18}
              color={colors.success}
              strokeWidth={2.4}
            />
          </IconButton>
        )}
        {onSave && (
          <IconButton onPress={onSave} label='Guardar'>
            <Bookmark
              pointerEvents='none'
              size={18}
              color={iconColor}
              strokeWidth={2.2}
            />
          </IconButton>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 48,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholder: {
    width: 36,
    height: 36,
  },
});
