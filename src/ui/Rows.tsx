import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Icon } from './Icon';
import { Text } from './Text';
import { useTheme } from './ThemeContext';
import { MIN_TOUCH, radius, spacing } from './theme';

export function Section({
  title,
  children,
  footer,
}: {
  title?: string;
  children: ReactNode;
  footer?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      {title ? (
        <Text variant="caption" tone="muted" accessibilityRole="header" style={styles.sectionTitle}>
          {title}
        </Text>
      ) : null}
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {children}
      </View>
      {footer ? (
        <Text variant="caption" tone="muted" style={styles.sectionTitle}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

export function LinkRow({
  label,
  value,
  onPress,
  destructive,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={({ pressed }) => [
        styles.row,
        { opacity: pressed ? 0.7 : 1, borderColor: colors.border },
      ]}
    >
      <Text tone={destructive ? 'danger' : 'default'} style={styles.flex}>
        {label}
      </Text>
      {value ? <Text tone="muted">{value}</Text> : null}
      {!destructive ? (
        <Icon name="chevron.right" color={colors.textMuted} size={14} fallback="›" />
      ) : null}
    </Pressable>
  );
}

export function SwitchRow({
  label,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <Text style={styles.flex}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={label}
        trackColor={{ true: colors.primary, false: colors.border }}
      />
    </View>
  );
}

export function StepperRow({
  label,
  onDecrease,
  onIncrease,
  canDecrease,
  canIncrease,
  decreaseLabel,
  increaseLabel,
}: {
  label: string;
  onDecrease: () => void;
  onIncrease: () => void;
  canDecrease: boolean;
  canIncrease: boolean;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  const { colors } = useTheme();
  const btn = (text: string, a11y: string, onPress: () => void, enabled: boolean) => (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled: !enabled }}
      style={[styles.stepBtn, { backgroundColor: colors.surfaceAlt, opacity: enabled ? 1 : 0.4 }]}
    >
      <Text variant="headline">{text}</Text>
    </Pressable>
  );
  return (
    <View style={[styles.row, { borderColor: colors.border }]} accessibilityLabel={label}>
      <Text style={styles.flex} accessibilityLiveRegion="polite">
        {label}
      </Text>
      {btn('−', decreaseLabel, onDecrease, canDecrease)}
      {btn('+', increaseLabel, onIncrease, canIncrease)}
    </View>
  );
}

export function ChoiceRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={styles.flex}>{label}</Text>
      {selected ? <Icon name="checkmark" color={colors.primary} size={18} fallback="✓" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  sectionTitle: { paddingHorizontal: spacing.sm, textTransform: 'uppercase' },
  row: {
    minHeight: MIN_TOUCH + 6,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  flex: { flexGrow: 1, flexShrink: 1, flexBasis: 160 },
  stepBtn: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
