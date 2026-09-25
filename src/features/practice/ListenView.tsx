import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { AppState, StyleSheet, View } from 'react-native';

import { playbackPlan, splitPhrases, tokenAtOffset } from '@/domain/listen/phrases';
import type { Lang } from '@/domain/model';
import { normalizeText, tokenize } from '@/domain/text/tokenize';
import { hasVoice, speak, stopSpeaking } from '@/platform/speech';
import { Button } from '@/ui/Button';
import { StepperRow } from '@/ui/Rows';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/ThemeContext';
import { radius, spacing } from '@/ui/theme';

import { WordFlow } from './WordFlow';

export interface ListenViewProps {
  text: string;
  lang: Lang;
  rate: number;
  repeat: number;
  onRateChange: (rate: number) => void;
  onRepeatChange: (repeat: number) => void;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function ListenView({
  text,
  lang,
  rate,
  repeat,
  onRateChange,
  onRepeatChange,
}: ListenViewProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const normalized = useMemo(() => normalizeText(text), [text]);
  const tokens = useMemo(() => tokenize(normalized), [normalized]);
  const phrases = useMemo(() => splitPhrases(normalized), [normalized]);
  const [playing, setPlaying] = useState(false);
  const [wordIndex, setWordIndex] = useState(-1);
  const [phraseIndex, setPhraseIndex] = useState(-1);
  const [voiceMissing, setVoiceMissing] = useState(false);
  const [error, setError] = useState(false);
  const runId = useRef(0);

  useEffect(() => {
    hasVoice(lang)
      .then((ok) => setVoiceMissing(!ok))
      .catch(() => undefined);
  }, [lang]);

  const stop = useCallback(() => {
    runId.current++;
    stopSpeaking();
    setPlaying(false);
    setWordIndex(-1);
    setPhraseIndex(-1);
  }, []);

  // Stop when leaving the screen, unmounting or going to the background (docs/spec.md US-MM-3 AC6).
  useEffect(() => stop, [stop]);
  useFocusEffect(useCallback(() => stop, [stop]));
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') stop();
    });
    return () => sub.remove();
  }, [stop]);

  const play = () => {
    stop();
    const id = runId.current;
    const plan = playbackPlan(phrases.length, repeat);
    setError(false);
    setPlaying(true);
    const step = (i: number) => {
      if (id !== runId.current) return;
      const item = plan[i];
      if (!item) {
        setPlaying(false);
        setWordIndex(-1);
        setPhraseIndex(-1);
        return;
      }
      const phrase = phrases[item.phraseIndex]!;
      setPhraseIndex(item.phraseIndex);
      setWordIndex(-1);
      speak(phrase.text, {
        lang,
        rate,
        onBoundary: (charIndex) => {
          if (id === runId.current) setWordIndex(tokenAtOffset(tokens, phrase.start + charIndex));
        },
        onDone: () => step(i + 1),
        onError: () => {
          if (id !== runId.current) return;
          setError(true);
          setPlaying(false);
        },
      });
    };
    step(0);
  };

  const phrase = phraseIndex >= 0 ? phrases[phraseIndex] : undefined;

  return (
    <View style={{ gap: spacing.lg }}>
      <WordFlow
        text={normalized}
        renderWord={({ word }) => {
          const inPhrase =
            phrase !== undefined && word.index >= phrase.wordStart && word.index < phrase.wordEnd;
          const active = wordIndex >= 0 ? word.index === wordIndex : inPhrase;
          return (
            <Text
              variant="verse"
              style={active ? [styles.hl, { backgroundColor: colors.highlight }] : undefined}
            >
              {word.text}
            </Text>
          );
        }}
      />
      {voiceMissing ? (
        <Text tone="danger">{t('practice.listen.noVoice', { lang: t(`lang.${lang}`) })}</Text>
      ) : null}
      {error ? (
        <Text tone="danger" accessibilityRole="alert">
          {t('practice.listen.error')}
        </Text>
      ) : null}
      <Button
        label={playing ? t('practice.listen.stop') : t('practice.listen.play')}
        onPress={playing ? stop : play}
        variant={playing ? 'secondary' : 'primary'}
      />
      <View>
        <StepperRow
          label={t('practice.listen.rate', { rate: rate.toFixed(1) })}
          onDecrease={() => onRateChange(round1(rate - 0.1))}
          onIncrease={() => onRateChange(round1(rate + 0.1))}
          canDecrease={rate > 0.5}
          canIncrease={rate < 1.5}
          decreaseLabel={t('practice.listen.slower')}
          increaseLabel={t('practice.listen.faster')}
        />
        <StepperRow
          label={t('practice.listen.repeat', { count: repeat })}
          onDecrease={() => onRepeatChange(repeat - 1)}
          onIncrease={() => onRepeatChange(repeat + 1)}
          canDecrease={repeat > 1}
          canIncrease={repeat < 5}
          decreaseLabel={t('practice.listen.fewer')}
          increaseLabel={t('practice.listen.more')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ hl: { borderRadius: radius.sm, overflow: 'hidden' } });
