import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const EXPORT_DIR = 'backups';

/** Writes the JSON to the cache and opens the iOS share sheet. Resolves false if sharing is unavailable. */
export async function shareBackupFile(fileName: string, json: string): Promise<boolean> {
  const dir = new Directory(Paths.cache, EXPORT_DIR);
  if (!dir.exists) dir.create();
  const file = new File(dir, fileName);
  if (file.exists) file.delete();
  file.write(json);
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: fileName,
  });
  return true;
}

/** Deletes exported files left in the cache (docs/spec.md US-BK-1 AC6). */
export function cleanupExportedBackups(): void {
  try {
    const dir = new Directory(Paths.cache, EXPORT_DIR);
    if (dir.exists) dir.delete();
  } catch {
    // best effort
  }
}

export type PickResult = { kind: 'canceled' } | { kind: 'picked'; text: string; size: number };

export async function pickBackupFile(): Promise<PickResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'public.json', 'text/plain'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return { kind: 'canceled' };
  const asset = result.assets[0]!;
  const file = new File(asset.uri);
  const text = await file.text();
  try {
    file.delete();
  } catch {
    // the picker copy may already be gone
  }
  return { kind: 'picked', text, size: asset.size ?? text.length };
}
