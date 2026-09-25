import { createContext, useContext, type ReactNode } from 'react';

import { light, type Palette } from './theme';

export interface ThemeValue {
  colors: Palette;
  scheme: 'light' | 'dark';
  reduceMotion: boolean;
}

const ThemeContext = createContext<ThemeValue>({
  colors: light,
  scheme: 'light',
  reduceMotion: false,
});

export function ThemeProvider({ value, children }: { value: ThemeValue; children: ReactNode }) {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = (): ThemeValue => useContext(ThemeContext);
