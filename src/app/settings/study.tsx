import { useTranslation } from 'react-i18next';

import { changeWeekStart } from '@/data/repositories/family';
import { useApp } from '@/providers/AppProvider';
import { ChoiceRow, Section, StepperRow, SwitchRow } from '@/ui/Rows';
import { Screen } from '@/ui/Screen';

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function Study() {
  const { t } = useTranslation();
  const { ctx, settings, setSetting } = useApp();
  const size = settings['review.sessionSize'];
  return (
    <Screen>
      <Section>
        <StepperRow
          label={t('study.sessionSize', { count: size })}
          onDecrease={() => void setSetting('review.sessionSize', Math.max(5, size - 5))}
          onIncrease={() => void setSetting('review.sessionSize', Math.min(100, size + 5))}
          canDecrease={size > 5}
          canIncrease={size < 100}
          decreaseLabel={t('study.decrease')}
          increaseLabel={t('study.increase')}
        />
        <SwitchRow
          label={t('study.contentFirst')}
          value={settings['cloze.contentFirst']}
          onValueChange={(v) => void setSetting('cloze.contentFirst', v)}
        />
        <SwitchRow
          label={t('study.showLength')}
          value={settings['cloze.showLength']}
          onValueChange={(v) => void setSetting('cloze.showLength', v)}
        />
        <SwitchRow
          label={t('study.haptics')}
          value={settings['ui.haptics']}
          onValueChange={(v) => void setSetting('ui.haptics', v)}
        />
      </Section>
      <Section title={t('study.koRule')}>
        <ChoiceRow
          label={t('study.koSyllable')}
          selected={settings['hint.koRule'] === 'syllable'}
          onPress={() => void setSetting('hint.koRule', 'syllable')}
        />
        <ChoiceRow
          label={t('study.koChoseong')}
          selected={settings['hint.koRule'] === 'choseong'}
          onPress={() => void setSetting('hint.koRule', 'choseong')}
        />
      </Section>
      <Section title={t('study.weekStart')}>
        {WEEK_ORDER.map((d) => (
          <ChoiceRow
            key={d}
            label={t(`days.${d}`)}
            selected={settings['family.weekStartsOn'] === d}
            onPress={() => void changeWeekStart(ctx, settings['family.weekStartsOn'], d)}
          />
        ))}
      </Section>
    </Screen>
  );
}
