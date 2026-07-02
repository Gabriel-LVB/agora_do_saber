import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
const compact = rules.replace(/\s+/g, ' ').trim();

const ruleBlock = (path) => {
  const start = compact.indexOf(`match ${path}`);
  assert.notEqual(start, -1, `missing rule block: ${path}`);
  const next = compact.indexOf(' match /', start + `match ${path}`.length);
  return compact.slice(start, next === -1 ? compact.length : next);
};

assert.match(compact, /function signedIn\(\) \{ return request\.auth != null; \}/);
assert.match(compact, /function isOwner\(userId\) \{ return signedIn\(\) && request\.auth\.uid == userId; \}/);
assert.match(compact, /function isAdmin\(\)/);
assert.match(compact, /request\.auth\.token\.keys\(\)\.hasAny\(\['admin'\]\) && request\.auth\.token\.admin == true/);
assert.match(compact, /request\.auth\.token\.email == 'gabrielvieiraxc12@gmail\.com'/);

const userBlock = ruleBlock('/users/{userId}');
assert.match(userBlock, /allow read, write: if isOwner\(userId\) \|\| isAdmin\(\);/);
assert.match(compact, /match \/{document=\*\*} \{ allow read, write: if isOwner\(userId\) \|\| isAdmin\(\); \}/);

const configBlock = ruleBlock('/config/{docId}');
assert.match(configBlock, /allow read: if signedIn\(\);/);
assert.match(configBlock, /allow write: if isAdmin\(\);/);

const sharedLibraryBlock = ruleBlock('/shared_library/{itemId}');
assert.match(sharedLibraryBlock, /allow read: if isAdmin\(\) \|\| \(signedIn\(\) && resource\.data\.published == true\);/);
assert.match(sharedLibraryBlock, /allow write: if isAdmin\(\);/);

assert.match(compact, /match \/{document=\*\*} \{ allow read, write: if false; \} \} \}$/);

console.log('firestore-rules-smoke ok');
