import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { BOOKS, type Book } from '@/domain/bible/books';
import { BOOK_NAMES, bookName, type UiLang } from '@/i18n/books';
import { Button } from '@/ui/Button';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/ThemeContext';
import { MIN_TOUCH, radius, spacing } from '@/ui/theme';

export function BookPicker({
  value,
  lang,
  onChange,
  disabled,
}: {
  value: string;
  lang: UiLang;
  onChange: (code: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const books = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return BOOKS;
    return BOOKS.filter((b) =>
      [BOOK_NAMES.ko[b.code], BOOK_NAMES.en[b.code], b.code].some((n) =>
        n?.toLowerCase().includes(needle),
      ),
    );
  }, [q]);

  const renderItem = ({ item }: { item: Book }) => (
    <Pressable
      onPress={() => {
        onChange(item.code);
        setOpen(false);
        setQ('');
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: item.code === value }}
      style={[styles.row, { borderColor: colors.border }]}
    >
      <Text style={{ flex: 1, fontWeight: item.code === value ? '700' : '400' }}>
        {bookName(item.code, lang)}
      </Text>
      <Text variant="caption" tone="muted">
        {item.testament === 'OT' ? t('edit.oldTestament') : t('edit.newTestament')}
      </Text>
    </Pressable>
  );

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${t('edit.book')}, ${bookName(value, lang)}`}
        accessibilityState={{ disabled: !!disabled }}
        style={[
          styles.field,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <Text>{bookName(value, lang)}</Text>
      </Pressable>
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.sheetHeader}>
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder={t('edit.bookSearch')}
              placeholderTextColor={colors.textMuted}
              accessibilityLabel={t('edit.bookSearch')}
              autoFocus
              style={[
                styles.search,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            />
            <Button
              label={t('common.close')}
              variant="ghost"
              compact
              onPress={() => setOpen(false)}
            />
          </View>
          <FlatList
            data={books}
            keyExtractor={(b) => b.code}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={20}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  sheet: { flex: 1, paddingTop: spacing.lg },
  sheetHeader: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  search: {
    flex: 1,
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 17,
  },
  row: {
    minHeight: MIN_TOUCH + 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
