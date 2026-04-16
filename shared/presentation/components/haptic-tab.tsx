import { triggerLightImpactHaptic } from '@/shared/presentation/utils/haptics';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        void triggerLightImpactHaptic();
        props.onPressIn?.(ev);
      }}
    />
  );
}
