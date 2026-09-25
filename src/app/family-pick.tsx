import { router } from 'expo-router';
import { useCallback, useDeferredValue, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';

import { assignWeeklyVerse } from '@/data/repositories/family';
import type { Verse } from '@/domain/model';
import { VerseListItem } from '@/features/verses/VerseListItem';
import { useVerseList } from '@/features/verses/useVerseList';
import { haptic } from '@/platform/haptics';
import { useApp } from '@/providers/AppProvider';
import { EmptyState } from '@/ui/States';
import { useTheme } from '@/ui/ThemeContext';
import { MIN_TOUCH, radius, spacing } from '@/ui/theme';

export default function FamilyPick() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { ctx, lang, settings } = useApp();
  const weekStartsOn = settings['family.weekStartsOn'];
  const hapticsOn = settings['ui.haptics'];
  const [search, setSearch] = useState('');
  const deferred = useDeferredValue(search);
  const { data } = useVerseList({ search: deferred, sort: 'canon' });

  const pick = useCallback(
    (id: string) => {
      void assignWeeklyVerse(ctx, id, weekStartsOn).then(() => {
        haptic('success', hapticsOn);
        router.back();
      });
    },
    [ctx, weekStartsOn, hapticsOn],
  );
  const renderItem = useCallback(
    ({ item }: { item: Verse }) => (
      <VerseListItem
        verse={item}
        lang={lang}
        learning={data?.learning.has(item.id) ?? false}
        onPress={pick}
      />
    ),
    [lang, data?.learning, pick],
  );

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <FlatList
        data={data?.verses ?? []}
        keyExtractor={(v) => v.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={Separator}
        initialNumToRender={12}
        windowSize={7}
        ListEmptyComponent={
          deferred ? <EmptyState title={t('verses.emptySearch', { query: deferred })} /> : null
        }
        ListHeaderComponent={
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('verses.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={t('verses.searchPlaceholder')}
            style={[
              styles.search,
              {
                color: colors.text,
                borderColor: colors.inputBorder,
                backgroundColor: colors.surface,
              },
            ]}
          />
        }
      />
    </View>
  );
}

function Separator() {
  return <View style={{ height: spacing.sm }} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  search: {
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 17,
    marginBottom: spacing.md,
  },
});
