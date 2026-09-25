import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { useApp } from '@/providers/AppProvider';
import { Chip } from '@/ui/Chip';
import { useTheme } from '@/ui/ThemeContext';
import { spacing } from '@/ui/theme';

export function ProfileSwitcher() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { profiles, activeProfile, setSetting } = useApp();
  if (profiles.length < 2) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={t('home.profiles')}
      contentContainerStyle={styles.row}
    >
      {profiles.map((p) => (
        <Chip
          key={p.id}
          role="radio"
          label={p.name}
          color={colors.profile[p.color]}
          selected={p.id === activeProfile?.id}
          accessibilityLabel={t('profiles.use', { name: p.name })}
          onPress={() => void setSetting('profile.activeId', p.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ row: { gap: spacing.sm, paddingVertical: spacing.xs } });
