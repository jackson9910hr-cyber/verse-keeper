import { StyleSheet, View } from 'react-native';

import { Button } from './Button';
import { Text } from './Text';
import { useTheme } from './ThemeContext';
import { radius, spacing } from './theme';

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.box} accessibilityRole="summary">
      <Text variant="headline" style={styles.center}>
        {title}
      </Text>
      {body ? (
        <Text tone="muted" style={styles.center}>
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

export function ErrorState({
  title,
  body,
  retryLabel,
  onRetry,
}: {
  title: string;
  body?: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.box} accessibilityRole="alert">
      <Text variant="headline" tone="danger" style={styles.center}>
        {title}
      </Text>
      {body ? (
        <Text tone="muted" style={styles.center}>
          {body}
        </Text>
      ) : null}
      {retryLabel && onRetry ? (
        <Button label={retryLabel} onPress={onRetry} variant="secondary" />
      ) : null}
    </View>
  );
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{ gap: spacing.sm }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: lines }, (_, i) => (
        <View
          key={i}
          style={{
            height: 18,
            width: `${90 - i * 15}%`,
            borderRadius: radius.sm,
            backgroundColor: colors.surfaceAlt,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'stretch', gap: spacing.md, paddingVertical: spacing.xl },
  center: { textAlign: 'center' },
});
