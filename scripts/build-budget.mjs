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

for (const file of jsFiles) {
  const data = await readFile(new URL(file, assetsDir));
  const gzipSize = gzipSync(data).length;
  totalJs += data.length;
  totalGzip += gzipSize;
  if (file.startsWith('index-')) entry = { file, raw:data.length, gzip:gzipSize };
}

assert.ok(entry, 'Bundle principal index-*.js nao encontrado.');

const ENTRY_RAW_LIMIT = 500 * 1024;
const ENTRY_GZIP_LIMIT = 220 * 1024;
const TOTAL_GZIP_LIMIT = 430 * 1024;

assert.ok(
  entry.raw <= ENTRY_RAW_LIMIT,
  `Bundle principal passou do budget raw: ${fmt(entry.raw)} > ${fmt(ENTRY_RAW_LIMIT)}`
);
assert.ok(
  entry.gzip <= ENTRY_GZIP_LIMIT,
  `Bundle principal passou do budget: ${fmt(entry.gzip)} > ${fmt(ENTRY_GZIP_LIMIT)}`
);
assert.ok(
  totalGzip <= TOTAL_GZIP_LIMIT,
  `JS total passou do budget: ${fmt(totalGzip)} > ${fmt(TOTAL_GZIP_LIMIT)}`
);

console.log(`build-budget ok: ${entry.file} ${fmt(entry.gzip)} gzip; JS total ${fmt(totalGzip)} gzip (${fmt(totalJs)} raw)`);
