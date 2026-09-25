import * as Notifications from 'expo-notifications';

/** Local notifications only — no push token is ever requested. */
export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export type PermissionResult = 'granted' | 'denied';

export async function ensureNotificationPermission(): Promise<PermissionResult> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return 'granted';
  if (!current.canAskAgain) return 'denied';
  const asked = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return asked.granted ? 'granted' : 'denied';
}

export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  title: string,
  body: string,
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

export async function cancelReminder(id: string | null): Promise<void> {
  if (id) await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
}
