import type { ColorValue } from 'react-native';
import { SymbolView, type SFSymbol } from 'expo-symbols';

import { Text } from './Text';

/** SF Symbol with a text fallback (Android / tests). Decorative: hidden from VoiceOver. */
export function Icon({
  name,
  color,
  size = 22,
  fallback = '•',
}: {
  name: SFSymbol;
  color: ColorValue;
  size?: number;
  fallback?: string;
}) {
  return (
    <SymbolView
      name={name}
      tintColor={color}
      size={size}
      accessibilityElementsHidden
      importantForAccessibility="no"
      fallback={
        <Text style={{ color, fontSize: size * 0.8 }} accessible={false}>
          {fallback}
        </Text>
      }
    />
  );
}
