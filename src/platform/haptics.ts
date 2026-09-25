import * as Haptics from 'expo-haptics';

export type HapticKind = 'tap' | 'success' | 'warning';

export function haptic(kind: HapticKind, enabled: boolean): void {
  if (!enabled) return;
  const run =
    kind === 'tap'
      ? Haptics.selectionAsync()
      : Haptics.notificationAsync(
          kind === 'success'
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning,
        );
  run.catch(() => undefined);
}
