export type HapticKind = 'tap' | 'success' | 'warning';

/** No haptics in browsers. */
export function haptic(_kind: HapticKind, _enabled: boolean): void {}
