import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const kib = bytes => bytes / 1024;
const fmt = bytes => `${kib(bytes).toFixed(1)} KiB`;

const assetsDir = new URL('../dist/assets/', import.meta.url);
const files = await readdir(assetsDir);
const jsFiles = files.filter(file => file.endsWith('.js'));

assert.ok(jsFiles.length > 0, 'Nenhum JS encontrado em dist/assets. Rode o build antes do budget.');

let totalJs = 0;
let totalGzip = 0;
let entry = null;
let quickContent = null;

for (const file of jsFiles) {
  const data = await readFile(new URL(file, assetsDir));
  const gzipSize = gzipSync(data).length;
  totalJs += data.length;
  totalGzip += gzipSize;
  if (file.startsWith('index-')) entry = { file, raw:data.length, gzip:gzipSize };
  if (file.startsWith('quickContent-')) quickContent = { file, raw:data.length, gzip:gzipSize };
}

assert.ok(entry, 'Bundle principal index-*.js nao encontrado.');

const ENTRY_RAW_LIMIT = 500 * 1024;
const ENTRY_GZIP_LIMIT = 220 * 1024;
const CORE_TOTAL_GZIP_LIMIT = 436 * 1024;
const QUICK_CONTENT_GZIP_LIMIT = 6 * 1024;
const TOTAL_GZIP_LIMIT = CORE_TOTAL_GZIP_LIMIT + QUICK_CONTENT_GZIP_LIMIT;
const coreGzip = totalGzip - (quickContent?.gzip || 0);

assert.ok(
  entry.raw <= ENTRY_RAW_LIMIT,
  `Bundle principal passou do budget raw: ${fmt(entry.raw)} > ${fmt(ENTRY_RAW_LIMIT)}`
);
assert.ok(
  entry.gzip <= ENTRY_GZIP_LIMIT,
  `Bundle principal passou do budget: ${fmt(entry.gzip)} > ${fmt(ENTRY_GZIP_LIMIT)}`
);
assert.ok(
  coreGzip <= CORE_TOTAL_GZIP_LIMIT,
  `JS principal passou do budget total: ${fmt(coreGzip)} > ${fmt(CORE_TOTAL_GZIP_LIMIT)}`
);
assert.ok(quickContent, 'Modulo lazy quickContent-*.js nao encontrado. O prompt nao deve voltar ao App.jsx.');
assert.ok(
  quickContent.gzip <= QUICK_CONTENT_GZIP_LIMIT,
  `Modulo quickContent passou do budget: ${fmt(quickContent.gzip)} > ${fmt(QUICK_CONTENT_GZIP_LIMIT)}`
);
assert.ok(totalGzip <= TOTAL_GZIP_LIMIT, `JS total passou do budget: ${fmt(totalGzip)} > ${fmt(TOTAL_GZIP_LIMIT)}`);

console.log(`build-budget ok: ${entry.file} ${fmt(entry.gzip)} gzip; core ${fmt(coreGzip)} gzip; ${quickContent.file} ${fmt(quickContent.gzip)} gzip; JS total ${fmt(totalGzip)} gzip (${fmt(totalJs)} raw)`);
