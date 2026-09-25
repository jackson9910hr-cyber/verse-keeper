/** Browsers cannot schedule reliable daily local reminders without a server/service worker push. */
export const CAPABILITIES = { localNotifications: false, haptics: false } as const;
