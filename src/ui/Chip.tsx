import { Pressable, StyleSheet } from 'react-native';

import { Text } from './Text';
import { useTheme } from './ThemeContext';
import { MIN_TOUCH, radius, spacing } from './theme';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  accessibilityLabel?: string;
  role?: 'button' | 'checkbox' | 'radio' | 'tab';
}

export function Chip({
  label,
  selected = false,
  onPress,
  color,
  accessibilityLabel,
  role = 'button',
}: ChipProps) {
  const { colors } = useTheme();
  const accent = color ?? colors.primary;
  const checkedState =
    role === 'checkbox' || role === 'radio' ? { checked: selected } : { selected };
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={checkedState}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: accent,
          backgroundColor: selected ? accent : colors.surface,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text
        variant="callout"
        style={{
          color: selected ? colors.background : colors.text,
          fontWeight: selected ? '600' : '400',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MIN_TOUCH - 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
});
