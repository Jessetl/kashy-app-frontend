import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Triggers a light impact haptic only when it is safe to do so.
 * In iOS simulators this is skipped to avoid native haptic warnings.
 */
export async function triggerLightImpactHaptic(): Promise<void> {
  if (Platform.OS !== 'ios' || !Device.isDevice) {
    return;
  }

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Ignore haptics failures to keep UI interactions resilient.
  }
}