import * as DocumentPicker from 'expo-document-picker';

/** Web: download the backup as a file (no share sheet in browsers). */
export async function shareBackupFile(fileName: string, json: string): Promise<boolean> {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return true;
}

/** Nothing is written to a cache directory on web. */
export function cleanupExportedBackups(): void {}

export type PickResult = { kind: 'canceled' } | { kind: 'picked'; text: string; size: number };

export async function pickBackupFile(): Promise<PickResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain'],
  });
  if (result.canceled) return { kind: 'canceled' };
  const asset = result.assets[0]!;
  const text = asset.file ? await asset.file.text() : '';
  return { kind: 'picked', text, size: asset.size ?? text.length };
}
