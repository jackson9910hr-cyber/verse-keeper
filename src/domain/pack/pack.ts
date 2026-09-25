/** Bundled verse pack format — docs/data-model.md §6. Only public-domain translations are allowed. */
import { GuardError, arrayOf, int, nullable, object, oneOf, str } from '../backup/guards';
import { validateReference } from '../bible/books';

export const ALLOWED_TRANSLATIONS = ['WEB'] as const;

export interface PackVerse {
  id: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
  textEn: string;
  tags: string[];
}

export interface VersePack {
  packId: string;
  version: number;
  translation: {
    code: (typeof ALLOWED_TRANSLATIONS)[number];
    name: string;
    license: 'Public Domain';
    licenseNote: string;
    source: string;
    retrievedAt: string;
    sourceSha256: string;
  };
  verses: PackVerse[];
}

const packGuard = object<VersePack>({
  packId: str(64, 1),
  version: int(1),
  translation: object<VersePack['translation']>({
    code: oneOf(ALLOWED_TRANSLATIONS),
    name: str(100, 1),
    license: oneOf(['Public Domain'] as const),
    licenseNote: str(500, 1),
    source: str(200, 1),
    retrievedAt: str(10, 10),
    sourceSha256: str(64, 64),
  }),
  verses: arrayOf(
    object<PackVerse>({
      id: str(64, 1),
      book: str(3, 3),
      chapter: int(1),
      verseStart: int(1),
      verseEnd: nullable(int(1)),
      textEn: str(2000, 1),
      tags: arrayOf(str(20, 1), 10),
    }),
    1000,
  ),
});

export type PackResult = { ok: true; value: VersePack } | { ok: false; path: string };

export function validatePack(raw: unknown): PackResult {
  try {
    const pack = packGuard(raw, 'pack');
    const ids = new Set<string>();
    for (const [i, v] of pack.verses.entries()) {
      if (ids.has(v.id) || !v.id.startsWith(`${pack.packId}:`))
        return { ok: false, path: `pack.verses[${i}].id` };
      ids.add(v.id);
      const bad = validateReference(v);
      if (bad.length > 0) return { ok: false, path: `pack.verses[${i}].${bad[0]}` };
    }
    return { ok: true, value: pack };
  } catch (e) {
    if (e instanceof GuardError) return { ok: false, path: e.path };
    throw e;
  }
}
