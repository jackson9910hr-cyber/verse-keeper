import { Text as RNText, type TextProps } from 'react-native';

import { useTheme } from './ThemeContext';
import { typography, type TextVariant } from './theme';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: 'default' | 'muted' | 'primary' | 'danger' | 'success' | 'onPrimary';
}

/** Scales with Dynamic Type (allowFontScaling defaults to true). */
export function Text({ variant = 'body', tone = 'default', style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  const color = {
    default: colors.text,
    muted: colors.textMuted,
    primary: colors.primary,
    danger: colors.danger,
    success: colors.success,
    onPrimary: colors.onPrimary,
  }[tone];
  return <RNText {...rest} style={[typography[variant], { color }, style]} />;
}
