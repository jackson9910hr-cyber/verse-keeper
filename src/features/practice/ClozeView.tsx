import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { generateCloze, isCorrectAnswer, type ClozeLevel } from '@/domain/cloze/cloze';
import { wordTokens } from '@/domain/text/tokenize';
import { Button } from '@/ui/Button';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/ThemeContext';
import { MIN_TOUCH, radius, spacing } from '@/ui/theme';

import { WordFlow } from './WordFlow';

export interface ClozeViewProps {
  text: string;
  lang: 'ko' | 'en';
  level: ClozeLevel;
  seed: string;
  contentFirst: boolean;
  revealAll: boolean;
  typeMode: boolean;
}

export function ClozeView({
  text,
  lang,
  level,
  seed,
  contentFirst,
  revealAll,
  typeMode,
}: ClozeViewProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const cloze = useMemo(
    () => generateCloze(text, { level, seed, contentFirst, lang }),
    [text, level, seed, contentFirst, lang],
  );
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; word: string } | null>(null);

  const words = useMemo(() => wordTokens(cloze.tokens), [cloze]);
  const nextHidden = words.find((w) => cloze.hidden.has(w.index) && !revealed.has(w.index));
  const reveal = (index: number) => setRevealed((r) => new Set(r).add(index));

  const check = () => {
    if (!nextHidden) return;
    const ok = isCorrectAnswer(answer, nextHidden.text);
    setFeedback({ ok, word: nextHidden.text });
    reveal(nextHidden.index);
    setAnswer('');
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <WordFlow
        text={text}
        renderWord={({ word }) => {
          const hidden = cloze.hidden.has(word.index) && !revealed.has(word.index) && !revealAll;
          if (!hidden) {
            const wasHidden = cloze.hidden.has(word.index);
            return (
              <Text
                variant="verse"
                style={wasHidden ? { color: colors.primary, fontWeight: '600' } : undefined}
              >
                {word.text}
              </Text>
            );
          }
          const isNext = typeMode && nextHidden?.index === word.index;
          return (
            <Pressable
              onPress={() => reveal(word.index)}
              accessibilityRole="button"
              accessibilityLabel={t('practice.hiddenWord')}
              style={[
                styles.blank,
                {
                  backgroundColor: colors.blank,
                  borderColor: isNext ? colors.primary : 'transparent',
                  minWidth: Math.min(
                    160,
                    Math.max(MIN_TOUCH, [...word.text].length * (lang === 'ko' ? 20 : 11)),
                  ),
                },
              ]}
            />
          );
        }}
      />
      {typeMode && nextHidden && !revealAll ? (
        <View style={styles.typeRow}>
          <TextInput
            value={answer}
            onChangeText={setAnswer}
            onSubmitEditing={check}
            placeholder={t('practice.typePlaceholder')}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            accessibilityLabel={t('practice.typePlaceholder')}
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          />
          <Button label={t('practice.check')} onPress={check} compact />
        </View>
      ) : null}
      {feedback ? (
        <Text
          tone={feedback.ok ? 'success' : 'danger'}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {feedback.ok ? t('practice.correct') : t('practice.wrong', { answer: feedback.word })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  blank: { height: 30, borderRadius: radius.sm, borderWidth: 2, marginBottom: 2 },
  typeRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: {
    flex: 1,
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 17,
  },
});
