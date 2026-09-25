import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';

import { completeOnboarding } from '@/data/services/app';
import { useApp } from '@/providers/AppProvider';
import { announce } from '@/ui/announce';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/ThemeContext';
import { MIN_TOUCH, radius, spacing } from '@/ui/theme';

export default function Onboarding() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { ctx } = useApp();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const start = async () => {
    setBusy(true);
    setError(false);
    try {
      await completeOnboarding(ctx, name.trim() || t('onboarding.defaultName'));
    } catch (e) {
      if (__DEV__) console.error(e);
      setError(true);
      announce(t('onboarding.error'));
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Text variant="largeTitle" accessibilityRole="header">
          {t('onboarding.title')}
        </Text>
        <Text tone="muted">{t('onboarding.subtitle')}</Text>
      </View>
      <View style={{ gap: spacing.xs }}>
        <Text variant="headline">{t('onboarding.nameLabel')}</Text>
        <TextInput
          value={name}
          onChangeText={(s) => setName(s.slice(0, 20))}
          placeholder={t('onboarding.namePlaceholder')}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t('onboarding.nameLabel')}
          returnKeyType="done"
          onSubmitEditing={start}
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.inputBorder,
              backgroundColor: colors.surface,
            },
          ]}
        />
      </View>
      {error ? (
        <Text tone="danger" accessibilityRole="alert">
          {t('onboarding.error')}
        </Text>
      ) : null}
      <Button
        label={t('onboarding.start')}
        onPress={start}
        loading={busy}
        testID="onboarding-start"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.md, paddingTop: spacing.xxl * 2 },
  input: {
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 17,
  },
});
