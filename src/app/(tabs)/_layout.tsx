import { Tabs } from 'expo-router/js-tabs';
import type { SFSymbol } from 'expo-symbols';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/ui/Icon';
import { useTheme } from '@/ui/ThemeContext';

const ICONS: Record<string, [SFSymbol, string]> = {
  index: ['house.fill', '⌂'],
  verses: ['book.fill', '▤'],
  family: ['person.3.fill', '☺'],
  settings: ['gearshape.fill', '⚙'],
};

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        tabBarIcon: ({ color }) => {
          const [name, fallback] = ICONS[route.name] ?? ICONS.index!;
          return <Icon name={name} color={color} size={22} fallback={fallback} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="verses" options={{ title: t('tabs.verses') }} />
      <Tabs.Screen name="family" options={{ title: t('tabs.family') }} />
      <Tabs.Screen name="settings" options={{ title: t('tabs.settings') }} />
    </Tabs>
  );
}
