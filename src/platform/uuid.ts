import { randomUUID } from 'expo-crypto';

/** Random v4 UUID (not used for encryption). */
export const newId = (): string => randomUUID();
