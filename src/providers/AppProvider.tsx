import { getLocales } from 'expo-localization';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';

import type { DataContext } from '@/data/context';
import { DbNewerThanAppError, migrate } from '@/data/db/migrate';
import { subscribe } from '@/data/events';
import { listProfiles } from '@/data/repositories/profiles';
import { resolveActiveProfile } from '@/data/services/app';
import { installPack } from '@/data/services/packs';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSetting,
  type SettingKey,
  type Settings,
} from '@/data/settings';
import type { Profile } from '@/domain/model';
import { validatePack } from '@/domain/pack/pack';
import type { UiLang } from '@/i18n/books';
import { initI18n, resolveLanguage, setLanguage } from '@/i18n';
import { cleanupExportedBackups } from '@/platform/backupFiles';
import { systemClock } from '@/platform/clock';
import { openAppDatabase } from '@/platform/db';
import {
  cancelReminder,
  configureNotifications,
  scheduleDailyReminder,
} from '@/platform/notifications';
import { newId } from '@/platform/uuid';
import { ThemeProvider } from '@/ui/ThemeContext';
import { dark, light } from '@/ui/theme';

import corePack from '../../assets/packs/web-core-50.json';

export type AppPhase =
  { kind: 'loading' } | { kind: 'error'; reason: 'newer' | 'generic' } | { kind: 'ready' };

export interface AppValue {
  phase: AppPhase;
  ctx: DataContext;
  settings: Settings;
  lang: UiLang;
  profiles: Profile[];
  activeProfile: Profile | null;
  setSetting: <K extends SettingKey>(key: K, value: Settings[K]) => Promise<void>;
  reload: () => Promise<void>;
  retry: () => void;
}

const AppContext = createContext<AppValue | null>(null);

export function useApp(): AppValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}

/** Ready-state convenience: the active profile id (always set once onboarding is done). */
export function useActiveProfileId(): string {
  return useApp().activeProfile?.id ?? '';
}

export async function bootstrap(ctx: DataContext): Promise<void> {
  await migrate(ctx.db);
  const pack = validatePack(corePack);
  if (!pack.ok) throw new Error(`Bundled pack is invalid at ${pack.path}`);
  await installPack(ctx, pack.value);
}

export function AppProvider({
  children,
  testContext,
}: {
  children: ReactNode;
  testContext?: DataContext;
}) {
  const [phase, setPhase] = useState<AppPhase>({ kind: 'loading' });
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const ctxRef = useRef<DataContext | null>(testContext ?? null);
  const [ctx, setCtx] = useState<DataContext | null>(testContext ?? null);
  const systemScheme = useColorScheme();

  const reload = useCallback(async () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const [s, p, active] = [
      await loadSettings(ctx.db),
      await listProfiles(ctx),
      await resolveActiveProfile(ctx),
    ];
    setSettings(active ? { ...s, 'profile.activeId': active } : s);
    setProfiles(p);
    setActiveId(active);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!ctxRef.current)
          ctxRef.current = { db: await openAppDatabase(), clock: systemClock, newId };
        await bootstrap(ctxRef.current);
        setCtx(ctxRef.current);
        await reload();
        cleanupExportedBackups();
        configureNotifications();
        if (!cancelled) setPhase({ kind: 'ready' });
      } catch (error) {
        if (__DEV__) console.error(error);
        if (!cancelled)
          setPhase({
            kind: 'error',
            reason: error instanceof DbNewerThanAppError ? 'newer' : 'generic',
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt, reload]);

  useEffect(
    () =>
      subscribe((topic) => {
        if (topic === 'profiles' || topic === 'settings' || topic === 'all') void reload();
      }),
    [reload],
  );

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const lang = resolveLanguage(settings['ui.language'], getLocales()[0]?.languageCode);
  const i18n = initI18n(lang);

  useEffect(() => {
    void setLanguage(lang);
  }, [lang]);

  // Reminder text is localized when scheduled: reschedule it when the UI language changes.
  const scheduledLang = useRef<UiLang | null>(null);
  useEffect(() => {
    const ctx = ctxRef.current;
    if (phase.kind !== 'ready' || !ctx) return;
    const previous = scheduledLang.current;
    scheduledLang.current = lang;
    if (previous === null || previous === lang || !settings['notify.enabled']) return;
    void (async () => {
      await setLanguage(lang);
      await cancelReminder(settings['notify.scheduledId']);
      const [h = 20, m = 0] = settings['notify.time'].split(':').map(Number);
      const id = await scheduleDailyReminder(
        h,
        m,
        i18n.t('notify.contentTitle'),
        i18n.t('notify.contentBody'),
      );
      await saveSetting(ctx.db, 'notify.scheduledId', id);
    })().catch((e: unknown) => {
      if (__DEV__) console.error(e);
    });
  }, [lang, phase.kind, settings, i18n]);

  const setSetting = useCallback(async <K extends SettingKey>(key: K, value: Settings[K]) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    setSettings((s) => ({ ...s, [key]: value }));
    await saveSetting(ctx.db, key, value);
  }, []);

  const scheme =
    settings['ui.theme'] === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : settings['ui.theme'];
  const theme = useMemo(
    () => ({ colors: scheme === 'dark' ? dark : light, scheme, reduceMotion }),
    [scheme, reduceMotion],
  );

  const value = useMemo<AppValue>(
    () => ({
      phase,
      ctx: ctx as DataContext,
      settings,
      lang,
      profiles,
      activeProfile: profiles.find((p) => p.id === activeId) ?? null,
      setSetting,
      reload,
      retry: () => {
        setPhase({ kind: 'loading' });
        setAttempt((a) => a + 1);
      },
    }),
    [phase, ctx, settings, lang, profiles, activeId, setSetting, reload],
  );

  return (
    <AppContext.Provider value={value}>
      <ThemeProvider value={theme}>{children}</ThemeProvider>
    </AppContext.Provider>
  );
}
