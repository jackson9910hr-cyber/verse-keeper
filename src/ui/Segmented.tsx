import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { useTheme } from './ThemeContext';
import { MIN_TOUCH, radius, spacing } from './theme';

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  accessibilityLabel: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[styles.wrap, { backgroundColor: colors.surfaceAlt }]}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            style={[
              styles.item,
              selected && { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              variant="callout"
              style={{ fontWeight: selected ? '700' : '400', textAlign: 'center' }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: radius.md, padding: 3, gap: 3 },
  item: {
    flexGrow: 1,
    minHeight: MIN_TOUCH - 4,
    borderRadius: radius.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
});
