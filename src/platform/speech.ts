import * as Speech from 'expo-speech';

import type { Lang } from '@/domain/model';

export const SPEECH_LANG: Record<Lang, string> = { ko: 'ko-KR', en: 'en-US' };

export interface SpeakOptions {
  lang: Lang;
  rate: number;
  onBoundary?: (charIndex: number) => void;
  onDone?: () => void;
  onError?: () => void;
}

export function speak(text: string, o: SpeakOptions): void {
  Speech.speak(text, {
    language: SPEECH_LANG[o.lang],
    rate: o.rate,
    onBoundary: (ev: unknown) => {
      const index = (ev as { charIndex?: unknown } | null)?.charIndex;
      if (typeof index === 'number') o.onBoundary?.(index);
    },
    onDone: o.onDone,
    onStopped: undefined,
    onError: () => o.onError?.(),
  });
}

export function stopSpeaking(): void {
  void Speech.stop();
}

/** True when the device has at least one voice for the language (iOS may lack the Korean voice). */
export async function hasVoice(lang: Lang): Promise<boolean> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const prefix = lang === 'ko' ? 'ko' : 'en';
    return voices.length === 0 || voices.some((v) => v.language.toLowerCase().startsWith(prefix));
  } catch {
    return true;
  }
}
