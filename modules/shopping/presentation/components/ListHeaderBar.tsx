import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import {
  ArrowLeft,
  Bookmark,
  ReceiptText,
  Share2,
  Trash2,
} from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ListHeaderBarProps {
  onBack?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onConvertToReceipt?: () => void;
  onDelete?: () => void;
}

export const ListHeaderBar = React.memo(function ListHeaderBar({
  onBack,
  onShare,
  onSave,
  onConvertToReceipt,
  onDelete,
}: ListHeaderBarProps) {
  const colors = useThemeColors();
  const iconColor = colors.text;

  return (
    <View style={styles.container}>
      {onBack ? (
        <AppPressable onPress={onBack} style={styles.iconButton}>
          <ArrowLeft pointerEvents='none' size={22} color={iconColor} />
        </AppPressable>
      ) : (
        <View style={styles.iconButton} />
      )}
      <View style={styles.rightActions}>
        {onConvertToReceipt && (
          <AppPressable onPress={onConvertToReceipt} style={styles.iconButton}>
            <ReceiptText
              pointerEvents='none'
              size={20}
              color={colors.primary}
            />
          </AppPressable>
        )}
        {onShare && (
          <AppPressable onPress={onShare} style={styles.iconButton}>
            <Share2 pointerEvents='none' size={20} color={iconColor} />
          </AppPressable>
        )}
        {onSave && (
          <AppPressable onPress={onSave} style={styles.iconButton}>
            <Bookmark pointerEvents='none' size={20} color={iconColor} />
          </AppPressable>
        )}
        {onDelete && (
          <AppPressable onPress={onDelete} style={styles.iconButton}>
            <Trash2 pointerEvents='none' size={20} color={iconColor} />
          </AppPressable>
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
    paddingHorizontal: 16,
    height: 48,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
});
