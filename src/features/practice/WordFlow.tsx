import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { tokenize } from '@/domain/text/tokenize';
import { groupUnits, type WordUnit } from '@/domain/text/units';
import { Text } from '@/ui/Text';
import { spacing } from '@/ui/theme';

/** Renders verse text as wrapping word units so each word can be its own accessible element. */
export function WordFlow({
  text,
  renderWord,
}: {
  text: string;
  renderWord: (unit: WordUnit & { word: NonNullable<WordUnit['word']> }) => ReactNode;
}) {
  const units = useMemo(() => groupUnits(tokenize(text)), [text]);
  return (
    <View style={styles.flow}>
      {units.map((u) => (
        <View key={u.key} style={styles.unit}>
          {u.before ? <Text variant="verse">{u.before}</Text> : null}
          {u.word ? renderWord({ ...u, word: u.word }) : null}
          {u.after ? <Text variant="verse">{u.after}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.sm,
    rowGap: spacing.xs,
    alignItems: 'flex-end',
  },
  unit: { flexDirection: 'row', alignItems: 'flex-end', flexShrink: 1, flexWrap: 'wrap' },
});
