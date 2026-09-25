import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { CardWithVerse } from '@/data/repositories/cards';
import { setClozeLevel } from '@/data/repositories/cards';
import { MAX_LEVEL, type ClozeLevel } from '@/domain/cloze/cloze';
import type { PracticeMode } from '@/domain/model';
import type { Grade } from '@/domain/srs/schedule';
import { formatReference } from '@/i18n/books';
import { useApp } from '@/providers/AppProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { StepperRow, SwitchRow } from '@/ui/Rows';
import { Segmented } from '@/ui/Segmented';
import { Text } from '@/ui/Text';
import { spacing } from '@/ui/theme';

import { textFor } from '../verses/text';
import { ClozeView } from './ClozeView';
import { FirstLetterView } from './FirstLetterView';
import { GradeBar } from './GradeBar';
import { ListenView } from './ListenView';

export interface PracticePanelProps {
  item: CardWithVerse;
  seed: string;
  onGrade: (grade: Grade, mode: PracticeMode) => void;
  busy?: boolean;
  notice?: string;
}

const clampLevel = (n: number): ClozeLevel => Math.min(MAX_LEVEL, Math.max(1, n)) as ClozeLevel;

export function PracticePanel({ item, seed, onGrade, busy, notice }: PracticePanelProps) {
  const { t } = useTranslation();
  const { ctx, settings, setSetting, lang: uiLang } = useApp();
  const [mode, setMode] = useState<PracticeMode>('cloze');
  const [revealed, setRevealed] = useState(false);
  const [typeMode, setTypeMode] = useState(false);
  const [level, setLevel] = useState<ClozeLevel>(clampLevel(item.card.clozeLevel));
  const { card, verse } = item;
  const text = textFor(verse, card.lang);

  const changeLevel = (next: number) => {
    const l = clampLevel(next);
    setLevel(l);
    void setClozeLevel(ctx, card.id, l);
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.xs }}>
        <Text variant="title" accessibilityRole="header">
          {formatReference(verse, uiLang)}
        </Text>
        <Text variant="caption" tone="muted">
          {t(`lang.${card.lang}`)}
        </Text>
      </View>

      <Segmented<PracticeMode>
        accessibilityLabel={t('practice.title')}
        value={mode}
        onChange={(m) => {
          setMode(m);
          setRevealed(false);
        }}
        options={(['cloze', 'first_letter', 'listen'] as const).map((m) => ({
          value: m,
          label: t(`practice.modes.${m}`),
        }))}
      />

      {notice ? (
        <Text variant="callout" tone="muted">
          {notice}
        </Text>
      ) : null}

      <Card>
        {!text ? (
          <Text tone="muted">{t('practice.noText')}</Text>
        ) : mode === 'cloze' ? (
          <ClozeView
            key={`${card.id}-${level}-${seed}`}
            text={text}
            lang={card.lang}
            level={level}
            seed={`${card.id}|${seed}`}
            contentFirst={settings['cloze.contentFirst']}
            revealAll={revealed}
            typeMode={typeMode}
          />
        ) : mode === 'first_letter' ? (
          <FirstLetterView
            text={text}
            koRule={settings['hint.koRule']}
            showLength={settings['cloze.showLength']}
            revealAll={revealed}
          />
        ) : (
          <ListenView
            text={text}
            lang={card.lang}
            rate={settings['listen.rate']}
            repeat={settings['listen.repeat']}
            onRateChange={(r) => void setSetting('listen.rate', r)}
            onRepeatChange={(r) => void setSetting('listen.repeat', r)}
          />
        )}
      </Card>

      {mode === 'cloze' ? (
        <View>
          <StepperRow
            label={t('practice.level', { level })}
            onDecrease={() => changeLevel(level - 1)}
            onIncrease={() => changeLevel(level + 1)}
            canDecrease={level > 1}
            canIncrease={level < MAX_LEVEL}
            decreaseLabel={t('practice.levelDown')}
            increaseLabel={t('practice.levelUp')}
          />
          <SwitchRow label={t('practice.typeMode')} value={typeMode} onValueChange={setTypeMode} />
        </View>
      ) : null}

      {revealed || mode === 'listen' ? (
        <GradeBar state={card} onGrade={(g) => onGrade(g, mode)} disabled={busy} />
      ) : (
        <Button
          label={mode === 'cloze' ? t('practice.revealAll') : t('practice.reveal')}
          onPress={() => setRevealed(true)}
          testID="reveal"
        />
      )}
    </View>
  );
}
