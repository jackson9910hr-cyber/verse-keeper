import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Verse } from '@/domain/model';
import { formatReference, type UiLang } from '@/i18n/books';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/ThemeContext';
import { MIN_TOUCH, radius, spacing } from '@/ui/theme';

import { previewText } from './text';

export interface VerseListItemProps {
  verse: Verse;
  lang: UiLang;
  learning: boolean;
  onPress: (id: string) => void;
}

export const VerseListItem = memo(function VerseListItem({
  verse,
  lang,
  learning,
  onPress,
}: VerseListItemProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const reference = formatReference(verse, lang);
  const preview = previewText(verse, lang);
  return (
    <Pressable
      onPress={() => onPress(verse.id)}
      accessibilityRole="button"
      accessibilityLabel={[reference, learning ? t('verses.learning') : null, preview]
        .filter(Boolean)
        .join(', ')}
      style={({ pressed }) => [
        styles.item,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={styles.header}>
        <Text variant="headline" style={styles.flex}>
          {reference}
        </Text>
        {learning ? (
          <View style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}>
            <Text variant="caption" tone="primary">
              {t('verses.learning')}
            </Text>
          </View>
        ) : null}
      </View>
      <Text variant="callout" tone="muted" numberOfLines={2}>
        {preview}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  item: {
    minHeight: MIN_TOUCH,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  flex: { flexShrink: 1, flexGrow: 1 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
});
