import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * iOS VoiceOver ignores `accessibilityLiveRegion` (Android-only) and `accessibilityRole="alert"`
 * does not trigger speech, so dynamic results must be announced explicitly.
 */
export function announce(message: string | null | undefined): void {
  if (message) AccessibilityInfo.announceForAccessibility(message);
}

/** Announces `message` whenever it becomes non-empty or changes. */
export function useAnnounce(message: string | null | undefined): void {
  useEffect(() => {
    announce(message);
  }, [message]);
}
