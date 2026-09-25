import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useDeferredValue, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';

import type { VerseFilter, VerseSort } from '@/data/repositories/verses';
import type { Verse } from '@/domain/model';
import { VerseListItem } from '@/features/verses/VerseListItem';
import { useVerseList } from '@/features/verses/useVerseList';
import { useApp } from '@/providers/AppProvider';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Segmented } from '@/ui/Segmented';
import { EmptyState, ErrorState, Skeleton } from '@/ui/States';
import { useTheme } from '@/ui/ThemeContext';
import { MIN_TOUCH, radius, spacing } from '@/ui/theme';

export default function Verses() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { lang } = useApp();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [filter, setFilter] = useState<VerseFilter>('all');
  const [sort, setSort] = useState<VerseSort>('canon');
  const params = useLocalSearchParams<{ tag?: string }>();
  const tag = params.tag || undefined;
  const { data, error, loading, reload } = useVerseList({
    search: deferredSearch,
    filter,
    sort,
    tag,
  });

  const open = useCallback((id: string) => router.push(`/verse/${id}`), []);
  const renderItem = useCallback(
    ({ item }: { item: Verse }) => (
      <VerseListItem
        verse={item}
        lang={lang}
        learning={data?.learning.has(item.id) ?? false}
        onPress={open}
      />
    ),
    [lang, data?.learning, open],
  );

  const empty = () => {
    if (loading) return <Skeleton lines={3} />;
    if (error)
      return (
        <ErrorState title={t('errors.generic')} retryLabel={t('common.retry')} onRetry={reload} />
      );
    if (deferredSearch.trim())
      return <EmptyState title={t('verses.emptySearch', { query: deferredSearch.trim() })} />;
    if (filter === 'user')
      return (
        <EmptyState
          title={t('verses.emptyMine')}
          actionLabel={t('verses.add')}
          onAction={() => router.push('/verse/edit')}
        />
      );
    return <EmptyState title={t('verses.emptyAll')} />;
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: t('verses.title') }} />
      <FlatList
        data={data?.verses ?? []}
        keyExtractor={(v) => v.id}
        renderItem={renderItem}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={12}
        windowSize={7}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={empty}
        ListHeaderComponent={
          <View style={styles.header}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('verses.searchPlaceholder')}
              placeholderTextColor={colors.textMuted}
              accessibilityLabel={t('verses.searchPlaceholder')}
              clearButtonMode="while-editing"
              autoCorrect={false}
              style={[
                styles.search,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            />
            <Segmented<VerseFilter>
              accessibilityLabel={t('verses.title')}
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: t('verses.filterAll') },
                { value: 'user', label: t('verses.filterMine') },
                { value: 'pack', label: t('verses.filterPack') },
              ]}
            />
            <View style={styles.row}>
              <Chip
                label={t('verses.sortCanon')}
                role="radio"
                selected={sort === 'canon'}
                onPress={() => setSort('canon')}
              />
              <Chip
                label={t('verses.sortRecent')}
                role="radio"
                selected={sort === 'recent'}
                onPress={() => setSort('recent')}
              />
              {tag ? (
                <Chip
                  label={`${t('verses.tag', { tag: t(`tagNames.${tag}`, { defaultValue: tag }) })} ✕`}
                  accessibilityLabel={t('verses.clearTag')}
                  selected
                  onPress={() => router.setParams({ tag: '' })}
                />
              ) : null}
            </View>
            <Button
              label={t('verses.add')}
              onPress={() => router.push('/verse/edit')}
              testID="add-verse"
            />
          </View>
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
  header: { gap: spacing.md, marginBottom: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  search: {
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 17,
  },
});
