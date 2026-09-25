import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';

import type { Verse } from '@/domain/model';
import {
  MAX_TAGS,
  MAX_TEXT_LENGTH,
  normalizeTags,
  validateVerseInput,
  type ValidVerse,
  type VerseErrors,
} from '@/domain/verse/verseInput';
import type { UiLang } from '@/i18n/books';
import { announce } from '@/ui/announce';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/ThemeContext';
import { MIN_TOUCH, radius, spacing } from '@/ui/theme';

import { BookPicker } from './BookPicker';

export interface VerseFormValues {
  book: string;
  chapter: string;
  verseStart: string;
  verseEnd: string;
  textKo: string;
  textEn: string;
  tags: string[];
}

export const emptyForm: VerseFormValues = {
  book: 'JHN',
  chapter: '',
  verseStart: '',
  verseEnd: '',
  textKo: '',
  textEn: '',
  tags: [],
};

export const formFromVerse = (v: Verse): VerseFormValues => ({
  book: v.book,
  chapter: String(v.chapter),
  verseStart: String(v.verseStart),
  verseEnd: v.verseEnd === null ? '' : String(v.verseEnd),
  textKo: v.textKo ?? '',
  textEn: v.textEn ?? '',
  tags: v.tags,
});

const toInt = (s: string) => (/^\d+$/.test(s.trim()) ? Number(s.trim()) : Number.NaN);

export function validateForm(v: VerseFormValues) {
  return validateVerseInput({
    book: v.book,
    chapter: toInt(v.chapter),
    verseStart: toInt(v.verseStart),
    verseEnd: v.verseEnd.trim() === '' ? null : toInt(v.verseEnd),
    textKo: v.textKo,
    textEn: v.textEn,
    tags: v.tags,
  });
}

export interface VerseFormProps {
  values: VerseFormValues;
  onChange: (next: VerseFormValues) => void;
  onSubmit: (valid: ValidVerse) => void;
  lang: UiLang;
  lockReference?: boolean;
  lockEnglish?: boolean;
  saving?: boolean;
}

export function VerseForm({
  values,
  onChange,
  onSubmit,
  lang,
  lockReference,
  lockEnglish,
  saving,
}: VerseFormProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [errors, setErrors] = useState<VerseErrors>({});
  const [tagDraft, setTagDraft] = useState('');
  const set = (patch: Partial<VerseFormValues>) => onChange({ ...values, ...patch });

  const commitTag = (raw: string) => {
    const parts = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) set({ tags: normalizeTags([...values.tags, ...parts]) });
    setTagDraft('');
  };

  const submit = () => {
    const withDraft = tagDraft.trim()
      ? { ...values, tags: normalizeTags([...values.tags, tagDraft]) }
      : values;
    const r = validateForm(withDraft);
    if (!r.ok) {
      setErrors(r.errors);
      // VoiceOver: announce the first problem so the user knows why nothing was saved.
      const first = Object.values(r.errors)[0];
      if (first) announce(t(`edit.errors.${first}`));
      return;
    }
    setErrors({});
    onSubmit(r.value);
  };

  const inputStyle = [
    styles.input,
    { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.surface },
  ];
  const err = (key: keyof VerseErrors) =>
    errors[key] ? (
      <Text variant="caption" tone="danger" accessibilityRole="alert">
        {t(`edit.errors.${errors[key]}`)}
      </Text>
    ) : null;
  const numberField = (key: 'chapter' | 'verseStart' | 'verseEnd', label: string) => (
    <View style={styles.numField}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <TextInput
        value={values[key]}
        onChangeText={(s) => set({ [key]: s.replace(/\D/g, '').slice(0, 3) })}
        keyboardType="number-pad"
        editable={!lockReference}
        accessibilityLabel={label}
        style={[inputStyle, lockReference && { opacity: 0.6 }]}
      />
      {err(key)}
    </View>
  );
  const textArea = (key: 'textKo' | 'textEn', label: string, locked?: boolean) => (
    <View style={{ gap: spacing.xs }}>
      <Text variant="headline" accessibilityRole="header">
        {label}
      </Text>
      <TextInput
        value={values[key]}
        onChangeText={(s) => set({ [key]: s.slice(0, MAX_TEXT_LENGTH) })}
        multiline
        editable={!locked}
        accessibilityLabel={label}
        accessibilityHint={locked ? t('verse.readOnlyWeb') : undefined}
        style={[inputStyle, styles.area, locked && { opacity: 0.7 }]}
        textAlignVertical="top"
      />
      {locked ? (
        <Text variant="caption" tone="muted">
          {t('verse.readOnlyWeb')}
        </Text>
      ) : (
        <Text variant="caption" tone="muted">
          {t('edit.charsLeft', { count: MAX_TEXT_LENGTH - values[key].length })}
        </Text>
      )}
      {err(key)}
    </View>
  );

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <Text variant="headline" accessibilityRole="header">
          {t('edit.reference')}
        </Text>
        <BookPicker
          value={values.book}
          lang={lang}
          onChange={(book) => set({ book })}
          disabled={lockReference}
        />
        {err('book')}
        <View style={styles.numRow}>
          {numberField('chapter', t('edit.chapter'))}
          {numberField('verseStart', t('edit.verseStart'))}
          {numberField('verseEnd', t('edit.verseEnd'))}
        </View>
      </View>
      {textArea('textKo', t('edit.textKo'))}
      {textArea('textEn', t('edit.textEn'), lockEnglish)}
      {err('text')}
      <Text variant="caption" tone="muted">
        {t('edit.textHint')}
      </Text>
      <View style={{ gap: spacing.sm }}>
        <Text variant="headline" accessibilityRole="header">
          {t('edit.tags')}
        </Text>
        <View style={styles.tags}>
          {values.tags.map((tag) => (
            <Chip
              key={tag}
              label={`${t(`tagNames.${tag}`, { defaultValue: tag })} ✕`}
              accessibilityLabel={t('edit.removeTag', {
                tag: t(`tagNames.${tag}`, { defaultValue: tag }),
              })}
              onPress={() => set({ tags: values.tags.filter((x) => x !== tag) })}
            />
          ))}
        </View>
        {values.tags.length < MAX_TAGS ? (
          <TextInput
            value={tagDraft}
            onChangeText={(s) => (s.endsWith(',') ? commitTag(s) : setTagDraft(s))}
            onSubmitEditing={() => commitTag(tagDraft)}
            placeholder={t('edit.tagsPlaceholder')}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={t('edit.tags')}
            returnKeyType="done"
            blurOnSubmit={false}
            style={inputStyle}
          />
        ) : null}
      </View>
      <Button label={t('common.save')} onPress={submit} loading={saving} testID="save-verse" />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 17,
  },
  area: { minHeight: 120 },
  numRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  numField: { flexGrow: 1, flexBasis: 90, gap: spacing.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
