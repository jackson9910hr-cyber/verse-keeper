import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { AppProvider, useApp } from '@/providers/AppProvider';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { ErrorState } from '@/ui/States';
import { useTheme } from '@/ui/ThemeContext';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return (
    <AppProvider>
      <RootNavigator />
    </AppProvider>
  );
}

function DbErrorScreen() {
  const { t } = useTranslation();
  const { phase, retry } = useApp();
  const newer = phase.kind === 'error' && phase.reason === 'newer';
  return (
    <Screen>
      <ErrorState
        title={t('errors.dbTitle')}
        body={newer ? t('errors.dbNewer') : t('errors.dbBody')}
      />
      {!newer ? <Button label={t('common.retry')} onPress={retry} variant="secondary" /> : null}
    </Screen>
  );
}

function RootNavigator() {
  const { t } = useTranslation();
  const { phase, settings } = useApp();
  const { colors, scheme, reduceMotion } = useTheme();

  useEffect(() => {
    if (phase.kind !== 'loading') void SplashScreen.hideAsync().catch(() => undefined);
  }, [phase.kind]);

  const navTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [scheme, colors]);

  if (phase.kind === 'loading') return null;
  if (phase.kind === 'error') return <DbErrorScreen />;

  const onboarded = settings['onboarding.done'];
  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerBackButtonDisplayMode: 'minimal',
          animation: reduceMotion ? 'fade' : 'default',
        }}
      >
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: t('tabs.home') }} />
          <Stack.Screen name="verse/[id]" options={{ title: '' }} />
          <Stack.Screen
            name="verse/edit"
            options={{ presentation: 'modal', title: t('edit.titleNew') }}
          />
          <Stack.Screen name="practice/[cardId]" options={{ title: t('practice.title') }} />
          <Stack.Screen name="review" options={{ title: t('review.title') }} />
          <Stack.Screen
            name="family-pick"
            options={{ presentation: 'modal', title: t('family.pickTitle') }}
          />
          <Stack.Screen name="settings/profiles" options={{ title: t('profiles.title') }} />
          <Stack.Screen name="settings/study" options={{ title: t('study.title') }} />
          <Stack.Screen name="settings/appearance" options={{ title: t('appearance.title') }} />
          <Stack.Screen name="settings/notifications" options={{ title: t('notify.title') }} />
          <Stack.Screen name="settings/backup" options={{ title: t('backup.title') }} />
          <Stack.Screen name="settings/about" options={{ title: t('about.title') }} />
        </Stack.Protected>
      </Stack>
    </NavThemeProvider>
  );
}
