import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Text } from './Text';
import { useTheme } from './ThemeContext';
import { MIN_TOUCH, radius, spacing } from './theme';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  compact?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
  compact,
}: ButtonProps) {
  const { colors } = useTheme();
  const bg = {
    primary: colors.primary,
    secondary: colors.surfaceAlt,
    ghost: 'transparent',
    danger: colors.danger,
  }[variant];
  const fg = {
    primary: colors.onPrimary,
    secondary: colors.text,
    ghost: colors.primary,
    danger: colors.onDanger,
  }[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        { backgroundColor: bg, opacity: inactive ? 0.5 : pressed ? 0.8 : 1 },
        variant === 'ghost' && { borderWidth: 0 },
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? <ActivityIndicator color={fg} /> : null}
        <Text variant="headline" style={{ color: fg, textAlign: 'center' }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  compact: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minWidth: MIN_TOUCH },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
