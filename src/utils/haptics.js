import * as Haptics from 'expo-haptics';

let _enabled = true;
export function setHapticsEnabled(v) { _enabled = v; }

export function lightTap() {
  if (!_enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function successBurst() {
  if (!_enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function mediumTap() {
  if (!_enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}
