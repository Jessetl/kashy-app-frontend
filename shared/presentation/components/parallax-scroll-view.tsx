import type { PropsWithChildren, ReactNode } from 'react';
import React from 'react';
import type { ScrollViewProps, StyleProp, ViewStyle } from 'react-native';
import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';

export type ParallaxIntensity = {
  stickyDistance: number;
  followAfterSticky?: number;
  liftMax?: number;
  liftRange?: number;
  pullDownScale?: number;
};

type ParallaxScrollViewProps = PropsWithChildren<{
  header: ReactNode;
  intensity: ParallaxIntensity;
  headerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  bottomPadding?: number;
  showsVerticalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
  refreshing?: boolean;
  onRefresh?: () => void;
  refreshTintColor?: string;
}>;

const DEFAULT_CONFIG = {
  followAfterSticky: 0.9,
  liftMax: 14,
  liftRange: 120,
  pullDownScale: 1.03,
};

export function ParallaxScrollView({
  children,
  header,
  intensity,
  headerStyle,
  contentStyle,
  contentContainerStyle,
  bottomPadding = 0,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  refreshing,
  onRefresh,
  refreshTintColor,
}: ParallaxScrollViewProps) {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);

  const followAfterSticky =
    intensity.followAfterSticky ?? DEFAULT_CONFIG.followAfterSticky;
  const pullDownScale = intensity.pullDownScale ?? DEFAULT_CONFIG.pullDownScale;

  const headerAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    const y = scrollOffset.value;
    const positiveY = Math.max(0, y);
    const sd = intensity.stickyDistance;

    // Piecewise-linear with a cubic-hermite blend around the breakpoint
    // so the velocity transition from 1.0 → followAfterSticky is smooth.
    const blend = sd > 0 ? Math.min(positiveY / sd, 1) : 1;
    // smoothstep: maps [0,1] → [0,1] with zero derivative at both ends
    const smooth = blend * blend * (3 - 2 * blend);
    // rate goes from 1 (fully sticky) to followAfterSticky (parallax)
    const rate = 1 - smooth * (1 - followAfterSticky);
    const compensatedScroll = positiveY * rate;

    const stretchScale = interpolate(
      y,
      [-sd, 0],
      [pullDownScale, 1],
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        { translateY: compensatedScroll },
        { scale: stretchScale },
      ],
    };
  }, [
    intensity.stickyDistance,
    followAfterSticky,
    pullDownScale,
  ]);

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
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={[
        styles.contentContainer,
        contentContainerStyle,
        { paddingBottom: bottomPadding },
      ]}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      refreshControl={refreshControl}
    >
      <Animated.View style={[styles.header, headerStyle, headerAnimatedStyle]}>
        {header}
      </Animated.View>
      <View style={contentStyle}>{children}</View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  header: {
    zIndex: 1,
    overflow: 'hidden',
  },
});
