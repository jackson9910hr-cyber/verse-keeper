import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { generateCloze, isCorrectAnswer, type ClozeLevel } from '@/domain/cloze/cloze';
import { wordTokens } from '@/domain/text/tokenize';
import { announce } from '@/ui/announce';
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
  const [feedback, setFeedback] = useState<{ ok: boolean; word: string } | null>(null);

  const words = useMemo(() => wordTokens(cloze.tokens), [cloze]);
  const nextHidden = words.find((w) => cloze.hidden.has(w.index) && !revealed.has(w.index));
  const reveal = (index: number) => setRevealed((r) => new Set(r).add(index));

  const onResult = (ok: boolean, word: string) => {
    if (!nextHidden) return;
    setFeedback({ ok, word });
    reveal(nextHidden.index);
    announce(ok ? t('practice.correct') : t('practice.wrong', { answer: word }));
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
              hitSlop={{ top: 8, bottom: 8, left: 2, right: 2 }}
              style={[
                styles.blank,
                {
                  backgroundColor: colors.blank,
                  borderColor: isNext ? colors.primary : colors.textMuted,
                  borderWidth: isNext ? 2.5 : 1.5,
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
        <TypeAnswer key={nextHidden.index} expected={nextHidden.text} onResult={onResult} />
      ) : null}
      {feedback ? (
        <Text tone={feedback.ok ? 'success' : 'danger'} accessibilityLiveRegion="polite">
          {feedback.ok ? t('practice.correct') : t('practice.wrong', { answer: feedback.word })}
        </Text>
      ) : null}
    </View>
  );
}

/** Owns the typed answer so keystrokes don't re-render the whole verse. */
function TypeAnswer({
  expected,
  onResult,
}: {
  expected: string;
  onResult: (ok: boolean, word: string) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [answer, setAnswer] = useState('');
  const check = () => onResult(isCorrectAnswer(answer, expected), expected);
  return (
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
          { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.surface },
        ]}
      />
      <Button label={t('practice.check')} onPress={check} compact />
    </View>
  );
}

const styles = StyleSheet.create({
  blank: { height: 30, borderRadius: radius.sm, marginBottom: 2 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  input: {
    flexGrow: 1,
    flexBasis: 180,
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 17,
  },
});
