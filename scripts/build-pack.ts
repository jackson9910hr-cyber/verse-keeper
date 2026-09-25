/**
 * Dev-only: builds assets/packs/web-core-50.json from the World English Bible (public domain).
 * Input: a directory of per-book JSON files as published in the `world-english-bible` npm package
 * (TehShrike, parsed from ebible.org's WEB HTML). Only the verse text is taken; it is not modified
 * except for whitespace normalization.
 *
 *   npm pack world-english-bible@1.0.1 && tar xzf world-english-bible-1.0.1.tgz
 *   npx tsx scripts/build-pack.ts ./package/json
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { validatePack, type PackVerse, type VersePack } from '../src/domain/pack/pack';
import { BOOK_NAMES } from '../src/i18n/books';

export const PACK_ID = 'web-core-50';
export const PACK_VERSION = 1;

/** [reference, tags] — docs/spec.md §4. */
export const CORE_50: [string, string[]][] = [
  ['GEN 1:1', ['creation']],
  ['JOS 1:9', ['courage']],
  ['PSA 1:1-2', ['word', 'blessing']],
  ['PSA 23:1', ['comfort', 'trust']],
  ['PSA 46:1', ['strength', 'comfort']],
  ['PSA 119:11', ['word']],
  ['PSA 119:105', ['word', 'guidance']],
  ['PSA 139:14', ['identity', 'praise']],
  ['PRO 1:7', ['wisdom']],
  ['PRO 22:6', ['family']],
  ['PRO 3:5-6', ['trust', 'guidance']],
  ['ISA 26:3', ['peace', 'trust']],
  ['ISA 40:31', ['strength', 'hope']],
  ['ISA 41:10', ['courage', 'comfort']],
  ['ISA 53:5', ['salvation']],
  ['JER 29:11', ['hope']],
  ['LAM 3:22-23', ['faithfulness', 'hope']],
  ['MIC 6:8', ['obedience']],
  ['MAT 5:16', ['witness']],
  ['MAT 6:33', ['priorities']],
  ['MAT 11:28', ['rest', 'comfort']],
  ['MAT 28:19-20', ['mission']],
  ['MRK 10:45', ['service']],
  ['LUK 9:23', ['discipleship']],
  ['JHN 1:1', ['word']],
  ['JHN 3:16', ['love', 'salvation']],
  ['JHN 14:6', ['salvation']],
  ['JHN 15:5', ['discipleship']],
  ['ACT 1:8', ['mission']],
  ['ROM 3:23', ['salvation']],
  ['ROM 8:1', ['grace']],
  ['ROM 8:28', ['trust', 'hope']],
  ['ROM 10:9', ['salvation']],
  ['ROM 12:1', ['worship']],
  ['ROM 12:2', ['renewal']],
  ['1CO 10:13', ['strength']],
  ['1CO 13:4', ['love']],
  ['2CO 5:17', ['renewal', 'identity']],
  ['GAL 2:20', ['identity', 'faith']],
  ['GAL 5:22-23', ['fruit']],
  ['EPH 2:8-9', ['grace', 'faith']],
  ['PHP 4:6-7', ['prayer', 'peace']],
  ['PHP 4:13', ['strength']],
  ['COL 3:23', ['work']],
  ['2TI 3:16', ['word']],
  ['HEB 11:1', ['faith']],
  ['HEB 12:1', ['perseverance']],
  ['JAS 1:5', ['wisdom', 'prayer']],
  ['1PE 5:7', ['comfort', 'prayer']],
  ['1JN 1:9', ['forgiveness']],
];

interface WebEntry {
  type: string;
  chapterNumber?: number;
  verseNumber?: number;
  value?: string;
}

export function parseRef(ref: string) {
  const m = /^(\w{3}) (\d+):(\d+)(?:-(\d+))?$/.exec(ref);
  if (!m) throw new Error(`Bad reference ${ref}`);
  return {
    book: m[1]!,
    chapter: Number(m[2]),
    verseStart: Number(m[3]),
    verseEnd: m[4] ? Number(m[4]) : null,
  };
}

export function extractVerse(entries: readonly WebEntry[], chapter: number, verse: number): string {
  const parts = entries
    .filter(
      (e) =>
        e.type.endsWith(' text') &&
        e.chapterNumber === chapter &&
        e.verseNumber === verse &&
        typeof e.value === 'string',
    )
    .map((e) => e.value!);
  if (parts.length === 0) throw new Error(`Verse not found ${chapter}:${verse}`);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function buildPack(sourceDir: string, retrievedAt: string): VersePack {
  const hash = createHash('sha256');
  const cache = new Map<string, WebEntry[]>();
  const load = (code: string) => {
    const file = BOOK_NAMES.en[code]!.toLowerCase().replace(/\s+/g, '');
    if (!cache.has(file))
      cache.set(
        file,
        JSON.parse(readFileSync(join(sourceDir, `${file}.json`), 'utf8')) as WebEntry[],
      );
    return cache.get(file)!;
  };
  const verses: PackVerse[] = CORE_50.map(([ref, tags]) => {
    const r = parseRef(ref);
    const entries = load(r.book);
    const texts: string[] = [];
    for (let v = r.verseStart; v <= (r.verseEnd ?? r.verseStart); v++)
      texts.push(extractVerse(entries, r.chapter, v));
    const textEn = texts.join(' ');
    hash.update(`${ref}\n${textEn}\n`);
    return {
      id: `${PACK_ID}:${r.book}.${r.chapter}.${r.verseStart}${r.verseEnd ? `-${r.verseEnd}` : ''}`,
      ...r,
      textEn,
      tags,
    };
  });
  const pack: VersePack = {
    packId: PACK_ID,
    version: PACK_VERSION,
    translation: {
      code: 'WEB',
      name: 'World English Bible',
      license: 'Public Domain',
      licenseNote:
        'The World English Bible is in the public domain. "World English Bible" is a trademark of eBible.org; this text is reproduced unmodified (whitespace normalized only).',
      source: 'https://ebible.org/web/',
      retrievedAt,
      sourceSha256: hash.digest('hex'),
    },
    verses,
  };
  const check = validatePack(pack);
  if (!check.ok) throw new Error(`Invalid pack at ${check.path}`);
  return pack;
}

if (require.main === module) {
  const [dir, date = '2026-09-25'] = process.argv.slice(2);
  if (!dir)
    throw new Error('Usage: tsx scripts/build-pack.ts <world-english-bible json dir> [YYYY-MM-DD]');
  const pack = buildPack(dir, date);
  writeFileSync(
    join(__dirname, '..', 'assets', 'packs', `${PACK_ID}.json`),
    `${JSON.stringify(pack, null, 2)}\n`,
  );
  console.log(`Wrote ${pack.verses.length} verses`);
}
