// Builds the static web app for GitHub Pages (https://<user>.github.io/verse-keeper/).
//   WEB_BASE_URL=/verse-keeper node scripts/build-web.mjs
// - expo export (single-page app) into dist-web/
// - coi-serviceworker adds COOP/COEP (needed by expo-sqlite's SharedArrayBuffer) because Pages can't set headers
// - 404.html = index.html so deep links (e.g. /verse-keeper/verses) load the SPA
import { execSync } from 'node:child_process';
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = 'dist-web';
const base = process.env.WEB_BASE_URL ?? '/verse-keeper';
execSync(`npx expo export --platform web --output-dir ${out} --clear`, {
  stdio: 'inherit',
  env: { ...process.env, WEB_BASE_URL: base, EXPO_NO_TELEMETRY: '1' },
});

copyFileSync(
  'node_modules/coi-serviceworker/coi-serviceworker.min.js',
  join(out, 'coi-serviceworker.min.js'),
);
const indexPath = join(out, 'index.html');
const html = readFileSync(indexPath, 'utf8');
if (!html.includes('coi-serviceworker')) {
  const tag = `<script src="${base}/coi-serviceworker.min.js"></script>`;
  writeFileSync(indexPath, html.replace('<head>', `<head>${tag}`));
}
copyFileSync(indexPath, join(out, '404.html'));
writeFileSync(join(out, '.nojekyll'), '');
console.log(`Web build ready in ${out}/ (base ${base})`);
