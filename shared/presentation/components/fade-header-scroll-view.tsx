import React, { type PropsWithChildren, type ReactNode } from 'react';
import type { ScrollViewProps, StyleProp, ViewStyle } from 'react-native';
import { RefreshControl, StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

/**
 * Configuration for the fade-and-parallax animation applied to the header
 * as the user scrolls the content.
 */
export interface FadeHeaderConfig {
  /** How much the header drifts down relative to scroll (0 = sticky, 1 = follow). Default 0.3. */
  parallaxFactor?: number;
  /** Scroll distance (px) over which the header fades from full opacity to `minOpacity`. Default 200. */
  fadeDistance?: number;
  /** Minimum opacity the header reaches once fully scrolled. Default 0.15. */
  minOpacity?: number;
}

const DEFAULTS: Required<FadeHeaderConfig> = {
  parallaxFactor: 0.3,
  fadeDistance: 200,
  minOpacity: 0.15,
};

/**
 * Hook that produces a scroll handler plus an animated style implementing a
 * clean "parallax + fade" effect on a header as the user scrolls.
 *
 * Use this directly when you need custom layout (e.g. orbs that don't fade
 * alongside the animated hero content). For the standard case, prefer the
 * {@link FadeHeaderScrollView} component.
 */
export function useFadeHeaderScroll(config: FadeHeaderConfig = {}) {
  const parallaxFactor = config.parallaxFactor ?? DEFAULTS.parallaxFactor;
  const fadeDistance = config.fadeDistance ?? DEFAULTS.fadeDistance;
  const minOpacity = config.minOpacity ?? DEFAULTS.minOpacity;

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY.value * parallaxFactor }],
    opacity: interpolate(
      scrollY.value,
      [0, fadeDistance],
      [1, minOpacity],
      Extrapolation.CLAMP,
    ),
  }));

  return { scrollY, scrollHandler, headerStyle };
}

type FadeHeaderScrollViewProps = PropsWithChildren<{
  /** Content rendered as the animated header (receives the parallax + fade). */
  header: ReactNode;
  /** Tuning for the animation. */
  config?: FadeHeaderConfig;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Static wrapper style applied around the animated header. */
  headerStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
  scrollEventThrottle?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  refreshTintColor?: string;
}>;

/**
 * ScrollView with a header that applies a smooth parallax + fade animation
 * as the user scrolls. Matches the style used in the About screen.
 */
export function FadeHeaderScrollView({
  header,
  children,
  config,
  style,
  contentContainerStyle,
  headerStyle,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  scrollEventThrottle = 16,
  refreshing,
  onRefresh,
  refreshTintColor,
}: FadeHeaderScrollViewProps) {
  const { scrollHandler, headerStyle: animatedHeaderStyle } =
    useFadeHeaderScroll(config);

  const refreshControl =
    onRefresh != null ? (
      <RefreshControl
        refreshing={refreshing ?? false}
        onRefresh={onRefresh}
        tintColor={refreshTintColor}
      />
    ) : undefined;

  return (
    <Animated.ScrollView
      style={[styles.flex, style]}
      contentContainerStyle={contentContainerStyle}
      onScroll={scrollHandler}
      scrollEventThrottle={scrollEventThrottle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      refreshControl={refreshControl}
    >
      <Animated.View style={[headerStyle, animatedHeaderStyle]}>
        {header}
      </Animated.View>
      {children}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
