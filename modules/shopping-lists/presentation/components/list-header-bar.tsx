import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import { Bookmark, Folder, Share2, Trash2 } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ListHeaderBarProps {
  onShare?: () => void;
  onSave?: () => void;
  onOpenSavedLists?: () => void;
  onDelete?: () => void;
}

export const ListHeaderBar = React.memo(function ListHeaderBar({
  onShare,
  onSave,
  onOpenSavedLists,
  onDelete,
}: ListHeaderBarProps) {
  const colors = useThemeColors();
  const iconColor = colors.text;

  return (
    <View style={styles.container}>
      <View style={styles.rightActions}>
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
        {onOpenSavedLists && (
          <AppPressable onPress={onOpenSavedLists} style={styles.iconButton}>
            <Folder pointerEvents='none' size={20} color={iconColor} />
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
    justifyContent: 'flex-end',
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
