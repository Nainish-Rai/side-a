import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export function useHaptics() {
  const isIOS = Platform.OS === "ios";

  return {
    light: () => isIOS && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    medium: () => isIOS && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    heavy: () => isIOS && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
    selection: () => isIOS && Haptics.selectionAsync(),
    success: () => isIOS && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    error: () => isIOS && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  };
}
