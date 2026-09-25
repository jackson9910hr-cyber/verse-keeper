import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { GRADES, previewIntervals, type Grade, type ReviewState } from '@/domain/srs/schedule';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/ThemeContext';
import { MIN_TOUCH, radius, spacing } from '@/ui/theme';

export function GradeBar({
  state,
  onGrade,
  disabled,
}: {
  state: ReviewState;
  onGrade: (g: Grade) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const preview = previewIntervals(state);
  const tint: Record<Grade, string> = {
    again: colors.danger,
    hard: colors.warning,
    good: colors.primary,
    easy: colors.success,
  };
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="callout" tone="muted" style={{ textAlign: 'center' }}>
        {t('practice.gradePrompt')}
      </Text>
      <View style={styles.row}>
        {GRADES.map((g) => {
          const interval = t('common.days', { count: preview[g] });
          const label = t(`practice.grade.${g}`);
          return (
            <Pressable
              key={g}
              testID={`grade-${g}`}
              onPress={() => onGrade(g)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={t('practice.gradeA11y', { grade: label, interval })}
              accessibilityState={{ disabled: !!disabled }}
              style={({ pressed }) => [
                styles.btn,
                {
                  borderColor: tint[g],
                  backgroundColor: colors.surface,
                  opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text variant="headline" style={{ color: tint[g], textAlign: 'center' }}>
                {label}
              </Text>
              <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
                {interval}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  btn: {
    flexGrow: 1,
    flexBasis: 70,
    minHeight: MIN_TOUCH + 12,
    borderWidth: 2,
    borderRadius: radius.md,
    padding: spacing.sm,
    justifyContent: 'center',
  },
});
