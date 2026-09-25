/** Design tokens. Hex values live only here (CLAUDE.md). Text/background pairs meet WCAG AA (≥ 4.5:1). */
import type { ProfileColor } from '@/domain/model';

export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  danger: string;
  onDanger: string;
  success: string;
  warning: string;
  blank: string;
  highlight: string;
  profile: Record<ProfileColor, string>;
}

export const light: Palette = {
  background: '#F6F4EF',
  surface: '#FFFFFF',
  surfaceAlt: '#EFEBE3',
  text: '#1C1B1A',
  textMuted: '#57534D',
  border: '#D5D0C7',
  primary: '#2A5AA6',
  onPrimary: '#FFFFFF',
  danger: '#B3261E',
  onDanger: '#FFFFFF',
  success: '#1B6E3E',
  warning: '#7A4F00',
  blank: '#E4DDCF',
  highlight: '#FFE08A',
  profile: {
    blue: '#2A5AA6',
    green: '#1B6E3E',
    orange: '#A34A00',
    purple: '#6B3FA0',
    pink: '#A3265F',
    teal: '#0F6B6B',
    red: '#B3261E',
    brown: '#6D4C2F',
  },
};

export const dark: Palette = {
  background: '#121212',
  surface: '#1E1D1B',
  surfaceAlt: '#2A2825',
  text: '#F2EFEA',
  textMuted: '#BDB7AE',
  border: '#45423D',
  primary: '#8FB6F5',
  onPrimary: '#0B1A33',
  danger: '#F2B8B5',
  onDanger: '#3A0A07',
  success: '#86D9A6',
  warning: '#F5C877',
  blank: '#3A362F',
  highlight: '#6B5413',
  profile: {
    blue: '#8FB6F5',
    green: '#86D9A6',
    orange: '#F5B27A',
    purple: '#C8A8F0',
    pink: '#F2A6C8',
    teal: '#7ED6D6',
    red: '#F2B8B5',
    brown: '#D6B896',
  },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
/** Minimum touch target (Apple HIG). */
export const MIN_TOUCH = 44;

export const typography = {
  largeTitle: { fontSize: 30, fontWeight: '700' as const, lineHeight: 36 },
  title: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  headline: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 17, fontWeight: '400' as const, lineHeight: 24 },
  verse: { fontSize: 21, fontWeight: '400' as const, lineHeight: 32 },
  callout: { fontSize: 15, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  number: { fontSize: 44, fontWeight: '700' as const, lineHeight: 52 },
};
export type TextVariant = keyof typeof typography;
