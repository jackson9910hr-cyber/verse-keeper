/** Web build: reminders are not supported (see capabilities.web.ts). Same API as notifications.ts. */
export function configureNotifications(): void {}

export type PermissionResult = 'granted' | 'denied';

export async function ensureNotificationPermission(): Promise<PermissionResult> {
  return 'denied';
}

export async function scheduleDailyReminder(): Promise<string> {
  throw new Error('Local reminders are not supported on web');
}

export async function cancelAllReminders(): Promise<void> {}

export async function cancelReminder(): Promise<void> {}
