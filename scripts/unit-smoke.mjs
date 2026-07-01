import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cleanFirestoreData } from '../src/lib/firestoreData.js';
import { deferInteractionWork } from '../src/lib/interaction.js';

const input = {
  keep:'value',
  remove:undefined,
  nested:{
    keep:1,
    remove:undefined,
  },
  list:[
    { keep:true, remove:undefined },
    undefined,
    null,
  ],
};

assert.deepEqual(cleanFirestoreData(input), {
  keep:'value',
  nested:{ keep:1 },
  list:[
    { keep:true },
    null,
    null,
  ],
});

const firebaseConfig = JSON.parse(await readFile(new URL('../firebase.json', import.meta.url), 'utf8'));
assert.equal(firebaseConfig.firestore?.rules, 'firestore.rules');

const firestoreRules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
assert.match(firestoreRules, /function isOwner\(/);
assert.match(firestoreRules, /function isAdmin\(/);
assert.match(firestoreRules, /match \/\{document=\*\*\}/);
assert.match(firestoreRules, /allow read, write: if false;/);

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
assert.equal(packageJson.scripts?.check, 'npm run test:unit && npm run build && npm run budget');
assert.equal(packageJson.scripts?.['audit:moderate'], 'npm audit --audit-level=moderate');
assert.equal(packageJson.scripts?.budget, 'node --no-warnings scripts/build-budget.mjs');
for (const removedDependency of ['@heroicons/react', 'framer-motion', 'lucide-react']) {
  assert.equal(packageJson.dependencies?.[removedDependency], undefined);
  assert.equal(packageJson.devDependencies?.[removedDependency], undefined);
}
const viteVersion = String(packageJson.devDependencies?.vite || '').replace(/^[^\d]*/, '');
assert.ok(Number(viteVersion.split('.')[0]) >= 8, 'Vite precisa permanecer em major moderno para manter o audit limpo');

const workflowSource = await readFile(new URL('../.github/workflows/main.yml', import.meta.url), 'utf8');
assert.match(workflowSource, /npm ci/);
assert.match(workflowSource, /npm run audit:moderate/);

const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
assert.doesNotMatch(appSource, /from ['"]\.\/agora_prompts\.js['"]/);
assert.match(appSource, /import\(['"]\.\/agora_prompts\.js['"]\)/);
assert.match(appSource, /React\.lazy\(\(\) => import\(['"]\.\/features\/bizuario\/BizuarioModal\.jsx['"]\)\)/);
assert.match(appSource, /React\.lazy\(\(\) => import\(['"]\.\/features\/study-map\/StudyMapPreview\.jsx['"]\)\)/);
assert.doesNotMatch(appSource, /const BizuarioModal = \(\{/);
assert.doesNotMatch(appSource, /const StudyMapPreview = \(\{/);
assert.match(appSource, /const homeCanSeeSharedLibrary = isAdmin && adminHomeMode !== 'site';/);
assert.match(appSource, /view==='shared-library'&&homeCanSeeSharedLibrary/);
assert.match(appSource, /!user \|\| user\.isAnonymous \|\| !homeCanSeeSharedLibrary/);
assert.match(appSource, /showSharedLibraryAdminTools = isAdmin && sharedLibraryAudienceMode === 'admin'/);
assert.match(appSource, /saveSharedLibraryAnswerPatch/);
assert.doesNotMatch(appSource, /setDoc\(doc\(db, ['"]users['"], user\.uid, SHARED_LIBRARY_PROGRESS_COLLECTION/);
assert.match(appSource, /persistReviewQueueChanges/);
assert.doesNotMatch(appSource, /setDoc\(doc\(db, ['"]users['"], user\.uid, ['"]vq_review['"]/);
assert.match(appSource, /saveWatchedAulas/);
assert.match(appSource, /saveDailyStats/);
assert.doesNotMatch(appSource, /setDoc\(doc\(db, ?['"]users['"], ?user\.uid, ?['"]videoaulas_progress['"], ?['"]watched['"]/);
assert.doesNotMatch(appSource, /setDoc\(doc\(db, ?['"]users['"], ?user\.uid, ?['"]daily_stats['"]/);

const sharedLibraryProgressSource = await readFile(new URL('../src/services/sharedLibraryProgress.js', import.meta.url), 'utf8');
assert.match(sharedLibraryProgressSource, /saveSharedLibraryProgressPatch/);
assert.match(sharedLibraryProgressSource, /answers:\{ \[questionId\]:letter \}/);
assert.match(sharedLibraryProgressSource, /resetSharedLibraryAnswersPatch/);
assert.match(sharedLibraryProgressSource, /answers:\{\}/);

const reviewQueueSource = await readFile(new URL('../src/services/reviewQueue.js', import.meta.url), 'utf8');
assert.match(reviewQueueSource, /persistReviewQueueChanges/);
assert.match(reviewQueueSource, /Promise\.all/);

const courseProgressSource = await readFile(new URL('../src/services/courseProgress.js', import.meta.url), 'utf8');
assert.match(courseProgressSource, /saveWatchedAulas/);
assert.match(courseProgressSource, /saveDailyStats/);

const bizuarioSource = await readFile(new URL('../src/features/bizuario/BizuarioModal.jsx', import.meta.url), 'utf8');
assert.match(bizuarioSource, /export default function BizuarioModal/);

const studyMapPreviewSource = await readFile(new URL('../src/features/study-map/StudyMapPreview.jsx', import.meta.url), 'utf8');
assert.match(studyMapPreviewSource, /export default function StudyMapPreview/);

let deferredRan = false;
const deferred = deferInteractionWork(() => {
  deferredRan = true;
  return 'done';
});
assert.equal(deferredRan, false);
assert.equal(await deferred, 'done');
assert.equal(deferredRan, true);

console.log('unit-smoke ok');
