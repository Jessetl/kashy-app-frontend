import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_ICON_SIZE = 44;
const TAB_BAR_HEIGHT = 64;

interface TabItemProps {
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  icon: React.ReactNode;
  label: string;
  activeBackground: string;
}

const TabItem = React.memo(function TabItem({
  isFocused,
  onPress,
  onLongPress,
  icon,
  label,
  activeBackground,
}: TabItemProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 200 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [scale]);

  return (
    <AppPressable
      onPress={() => {
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
      accessibilityRole='tab'
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      <Animated.View
        pointerEvents='none'
        style={[
          styles.tabIconContainer,
          isFocused && { backgroundColor: activeBackground },
          animatedStyle,
        ]}
      >
        {icon}
      </Animated.View>
    </AppPressable>
  );
});

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  console.log('Safe area insets:', insets);
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.tabBarBackground,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 7,
        },
        Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
          },
          android: {
            elevation: 8,
          },
        }),
      ]}
    >
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : (options.title ?? route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const iconColor = isFocused
            ? colors.tabActiveIcon
            : colors.tabIconDefault;

          const icon = options.tabBarIcon?.({
            focused: isFocused,
            color: iconColor,
            size: 24,
          });

          return (
            <TabItem
              key={route.key}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              icon={icon}
              label={label}
              activeBackground={colors.tabActiveBackground}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tabBar: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabIconContainer: {
    width: TAB_ICON_SIZE,
    height: TAB_ICON_SIZE,
    borderRadius: TAB_ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
