import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from './ThemeContext';
import { spacing } from './theme';

/** Scrollable page container with readable max width on iPad. */
export function Screen({
  children,
  scroll = true,
  testID,
}: {
  children: ReactNode;
  scroll?: boolean;
  testID?: string;
}) {
  const { colors } = useTheme();
  const content = <View style={styles.inner}>{children}</View>;
  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.flex, { backgroundColor: colors.background }]}
      testID={testID}
    >
      {scroll ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.content]}>{content}</View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  inner: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: spacing.lg },
});
