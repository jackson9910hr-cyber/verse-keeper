import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { createProfile, deleteProfile, updateProfile } from '@/data/repositories/profiles';
import { MAX_PROFILES, PROFILE_COLORS, type Profile } from '@/domain/model';
import { useApp } from '@/providers/AppProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/ThemeContext';
import { MIN_TOUCH, radius, spacing } from '@/ui/theme';

function ProfileEditor({
  profile,
  active,
  canDelete,
}: {
  profile: Profile;
  active: boolean;
  canDelete: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { ctx, setSetting } = useApp();
  const [name, setName] = useState(profile.name);

  const confirmDelete = () =>
    Alert.alert(
      t('profiles.deleteTitle', { name: profile.name }),
      t('profiles.deleteBody', { name: profile.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => void deleteProfile(ctx, profile.id),
        },
      ],
    );

  return (
    <Card>
      <View style={styles.row}>
        <TextInput
          value={name}
          onChangeText={(s) => setName(s.slice(0, 20))}
          onEndEditing={() =>
            name.trim() ? void updateProfile(ctx, profile.id, { name }) : setName(profile.name)
          }
          accessibilityLabel={t('profiles.namePlaceholder')}
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        />
        {active ? (
          <Text tone="primary" variant="callout">
            {t('profiles.active')}
          </Text>
        ) : (
          <Button
            label={t('profiles.use', { name: profile.name })}
            compact
            variant="secondary"
            onPress={() => void setSetting('profile.activeId', profile.id)}
          />
        )}
      </View>
      <View style={styles.colors}>
        {PROFILE_COLORS.map((c) => (
          <Chip
            key={c}
            role="radio"
            label={t(`profiles.colors.${c}`)}
            color={colors.profile[c]}
            selected={profile.color === c}
            accessibilityLabel={t('profiles.color', { color: t(`profiles.colors.${c}`) })}
            onPress={() => void updateProfile(ctx, profile.id, { color: c })}
          />
        ))}
      </View>
      <Button
        label={t('common.delete')}
        variant="ghost"
        disabled={!canDelete}
        accessibilityHint={canDelete ? undefined : t('profiles.lastOne')}
        onPress={confirmDelete}
      />
    </Card>
  );
}

export default function Profiles() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { ctx, profiles, activeProfile } = useApp();
  const [name, setName] = useState('');
  const full = profiles.length >= MAX_PROFILES;

  const add = async () => {
    if (!name.trim()) return;
    await createProfile(ctx, name);
    setName('');
  };

  return (
    <Screen>
      {profiles.map((p) => (
        <ProfileEditor
          key={p.id}
          profile={p}
          active={p.id === activeProfile?.id}
          canDelete={profiles.length > 1}
        />
      ))}
      {profiles.length === 1 ? <Text tone="muted">{t('profiles.lastOne')}</Text> : null}
      {full ? (
        <Text tone="muted">{t('profiles.limit', { count: MAX_PROFILES })}</Text>
      ) : (
        <Card>
          <Text variant="headline">{t('profiles.add')}</Text>
          <TextInput
            value={name}
            onChangeText={(s) => setName(s.slice(0, 20))}
            onSubmitEditing={add}
            placeholder={t('profiles.namePlaceholder')}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={t('profiles.namePlaceholder')}
            returnKeyType="done"
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          />
          <Button
            label={t('common.add')}
            onPress={add}
            disabled={!name.trim()}
            testID="add-profile"
          />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  input: {
    flexGrow: 1,
    flexBasis: 160,
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 17,
  },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
