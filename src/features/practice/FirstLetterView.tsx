import { useMemo } from 'react';

import { hintWord, type KoHintRule } from '@/domain/hint/firstLetter';
import { Text } from '@/ui/Text';

import { WordFlow } from './WordFlow';

export function FirstLetterView({
  text,
  koRule,
  showLength,
  revealAll,
}: {
  text: string;
  koRule: KoHintRule;
  showLength: boolean;
  revealAll: boolean;
}) {
  const opts = useMemo(() => ({ koRule, showLength }), [koRule, showLength]);
  return (
    <WordFlow
      text={text}
      renderWord={({ word }) => (
        <Text variant="verse" accessibilityLabel={revealAll ? word.text : undefined}>
          {revealAll ? word.text : hintWord(word, opts)}
        </Text>
      )}
    />
  );
}
