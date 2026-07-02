import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import { cleanFirestoreData } from '../src/lib/firestoreData.js';
import { deferInteractionWork } from '../src/lib/interaction.js';

const traverse = traverseModule.default;
const assertNoFreeIdentifiers = (source, label) => {
  const globals = new Set(['React','Blob','URL','document','Object','Array','String','Number','Math','Date','console','Promise','Set','Map','parseInt']);
  const ast = parse(source, { sourceType:'module', plugins:['jsx'] });
  const free = new Map();
  const add = (name, line) => {
    if (globals.has(name)) return;
    if (!free.has(name)) free.set(name, new Set());
    free.get(name).add(line || 0);
  };
  traverse(ast, {
    Identifier(path) {
      if (path.isReferencedIdentifier() && !path.scope.hasBinding(path.node.name)) add(path.node.name, path.node.loc?.start?.line);
    },
    JSXIdentifier(path) {
      const name = path.node.name;
      if (!/^[A-Z]/.test(name) || path.parent?.type === 'JSXMemberExpression') return;
      if (!path.scope.hasBinding(name)) add(name, path.node.loc?.start?.line);
    },
  });
  assert.equal(
    [...free.entries()].map(([name, lines]) => `${name}:${[...lines].join(',')}`).join('; '),
    '',
    `${label} tem identificadores livres`,
  );
};

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
assert.equal(packageJson.scripts?.check, 'npm run test:unit && npm run test:rules && npm run build && npm run budget');
assert.equal(packageJson.scripts?.['audit:moderate'], 'npm audit --audit-level=moderate');
assert.equal(packageJson.scripts?.budget, 'node --no-warnings scripts/build-budget.mjs');
assert.equal(packageJson.scripts?.['test:rules'], 'node --no-warnings scripts/firestore-rules-smoke.mjs');
assert.equal(packageJson.scripts?.['test:rules:emulator'], 'npx firebase-tools@13.35.1 emulators:exec --only firestore "node --no-warnings scripts/firestore-emulator-rules-test.mjs"');
for (const removedDependency of ['@heroicons/react', 'framer-motion', 'lucide-react']) {
  assert.equal(packageJson.dependencies?.[removedDependency], undefined);
  assert.equal(packageJson.devDependencies?.[removedDependency], undefined);
}
const viteVersion = String(packageJson.devDependencies?.vite || '').replace(/^[^\d]*/, '');
assert.ok(Number(viteVersion.split('.')[0]) >= 8, 'Vite precisa permanecer em major moderno para manter o audit limpo');

const workflowSource = await readFile(new URL('../.github/workflows/main.yml', import.meta.url), 'utf8');
assert.match(workflowSource, /npm ci/);
assert.match(workflowSource, /npm run audit:moderate/);

const envExampleSource = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
assert.match(envExampleSource, /VITE_GEMINI_BACKEND_URL=/);

const geminiBackendDocSource = await readFile(new URL('../docs/GEMINI_BACKEND.md', import.meta.url), 'utf8');
assert.match(geminiBackendDocSource, /POST \/generate/);

const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
assert.doesNotMatch(appSource, /from ['"]\.\/agora_prompts\.js['"]/);
assert.match(appSource, /import\(['"]\.\/agora_prompts\.js['"]\)/);
assert.match(appSource, /import \{ FeatureProvider \} from ['"]\.\/features\/FeatureContext\.jsx['"]/);
assert.match(appSource, /import \{ useCourseDerivedState \} from ['"]\.\/hooks\/useCourseDerivedState\.js['"]/);
assert.match(appSource, /import \{ useGeminiRuntime \} from ['"]\.\/hooks\/useGeminiRuntime\.js['"]/);
assert.match(appSource, /import \{ useSharedLibrarySync \} from ['"]\.\/hooks\/useSharedLibrarySync\.js['"]/);
assert.match(appSource, /<FeatureProvider value=\{featureContextValue\}>/);
assert.match(appSource, /useCourseDerivedState\(\{/);
assert.match(appSource, /useGeminiRuntime\(\{/);
assert.match(appSource, /useSharedLibrarySync\(\{/);
assert.doesNotMatch(appSource, /const getKey = \(\) => \{/);
assert.doesNotMatch(appSource, /const callWithRotation = async/);
assert.doesNotMatch(appSource, /const refreshSharedLibrary = useCallback/);
assert.match(appSource, /React\.lazy\(\(\) => import\(['"]\.\/features\/bizuario\/BizuarioModal\.jsx['"]\)\)/);
assert.match(appSource, /React\.lazy\(\(\) => import\(['"]\.\/features\/study-map\/StudyMapPreview\.jsx['"]\)\)/);
assert.match(appSource, /import\(['"]\.\/features\/questions\/QuestionFeature\.jsx['"]\)/);
assert.match(appSource, /import\(['"]\.\/features\/exporting\/ExportModals\.jsx['"]\)/);
assert.match(appSource, /import\(['"]\.\/features\/modals\/WorkflowModals\.jsx['"]\)/);
assert.match(appSource, /import\(['"]\.\/features\/video-questions\/VqGenModal\.jsx['"]\)/);
assert.match(appSource, /import\(['"]\.\/features\/academia\/AcademiaTopicView\.jsx['"]\)/);
assert.match(appSource, /import\(['"]\.\/features\/bulk\/BulkGenerateModal\.jsx['"]\)/);
assert.match(appSource, /import\(['"]\.\/features\/shared-library\/SharedLibraryView\.jsx['"]\)/);
assert.match(appSource, /import\(['"]\.\/features\/course\/VideoaulasView\.jsx['"]\)/);
assert.match(appSource, /import\(['"]\.\/features\/course\/CoursePortalView\.jsx['"]\)/);
assert.match(appSource, /import\(['"]\.\/features\/course\/VideoQuestionsView\.jsx['"]\)/);
assert.match(appSource, /import\(['"]\.\/features\/home\/HomeView\.jsx['"]\)/);
assert.match(appSource, /import\(['"]\.\/features\/settings\/SettingsView\.jsx['"]\)/);
assert.match(appSource, /import\(['"]\.\/features\/favorites\/FavoritesView\.jsx['"]\)/);
assert.match(appSource, /import\(['"]\.\/features\/review\/SpacedReviewView\.jsx['"]\)/);
assert.match(appSource, /import\(['"]\.\/features\/quick\/QuickView\.jsx['"]\)/);
assert.match(appSource, /import\(['"]\.\/features\/quick\/QuickTopicView\.jsx['"]\)/);
assert.match(appSource, /import\(['"]\.\/features\/library\/SubLibraryView\.jsx['"]\)/);
assert.match(appSource, /import\(['"]\.\/features\/admin\/AdminStudyMapTopicList\.jsx['"]\)/);
assert.doesNotMatch(appSource, /const BizuarioModal = \(\{/);
assert.doesNotMatch(appSource, /const StudyMapPreview = \(\{/);
assert.doesNotMatch(appSource, /const QuestionView = \(\{/);
assert.doesNotMatch(appSource, /const QuestionCard = \(\{/);
assert.doesNotMatch(appSource, /const OpenAnswerModal = \(\{/);
assert.doesNotMatch(appSource, /const ExportModal = \(\{ topic/);
assert.doesNotMatch(appSource, /const AcademiaExportModal = \(\{ topic/);
assert.doesNotMatch(appSource, /const ExternalPromptModal = \(\{/);
assert.doesNotMatch(appSource, /const SRModal = \(\{/);
assert.doesNotMatch(appSource, /const VqGenModal = \(\{/);
assert.doesNotMatch(appSource, /function AcademiaTopicView\(\{/);
assert.doesNotMatch(appSource, /bulkGenerateModal&&\(\(\)=>/);
assert.doesNotMatch(appSource, /view==='shared-library'&&homeCanSeeSharedLibrary&&\(\(\)=>/);
assert.doesNotMatch(appSource, /view==='videoaulas'&&\(\(\)=>/);
assert.doesNotMatch(appSource, /view==='curso'&&canSeeVideoaulas&&\(\(\)=>/);
assert.doesNotMatch(appSource, /view==='videoquestions'&&canSeeVideoaulas&&\(\(\)=>/);
assert.doesNotMatch(appSource, /view==='library'&&\(\s*\(\(\)=>/);
assert.doesNotMatch(appSource, /view==='settings'&&\(/);
assert.doesNotMatch(appSource, /view==='favorites'&&\(\(\)=>/);
assert.doesNotMatch(appSource, /view==='spaced-review'&&canUseAdvancedFeatures&&\(\(\)=>/);
assert.doesNotMatch(appSource, /view==='quick'&&canUseAdvancedFeatures&&\(\(\)=>/);
assert.doesNotMatch(appSource, /view==='quick-topic'&&canUseAdvancedFeatures&&activeSubject\?\.source===QUICK_SOURCE&&activeTopic&&\(\(\)=>/);
assert.doesNotMatch(appSource, /view==='sub-library'&&\(\s*\(\(\)=>/);
assert.match(appSource, /const homeCanSeeSharedLibrary = isAdmin && adminHomeMode !== 'site';/);
assert.match(appSource, /view==='shared-library'&&homeCanSeeSharedLibrary/);
assert.match(appSource, /const needsCourseSharedLibraryData = canSeeVideoaulas;/);
assert.match(appSource, /const needsSharedLibraryData = \(homeCanSeeSharedLibrary && view === 'shared-library'\) \|\| needsCourseSharedLibraryData;/);
assert.match(appSource, /const needsSharedLibraryUiData = homeCanSeeSharedLibrary && view === 'shared-library';/);
assert.match(appSource, /canReadSharedLibrary:needsSharedLibraryData/);
assert.match(appSource, /loadProgress:needsSharedLibraryUiData/);
assert.match(appSource, /showLoadErrors:needsSharedLibraryUiData/);
assert.match(appSource, /backgroundPrefetchStage/);
assert.match(appSource, /setTimeout\(\(\) => setBackgroundPrefetchStage\(stage => Math\.max\(stage, 1\)\), 900\)/);
assert.match(appSource, /const foregroundVideoaulasData = canSeeVideoaulas && courseDataViews\.includes\(view\);/);
assert.match(appSource, /const needsVideoaulasData = foregroundVideoaulasData \|\| \(canSeeVideoaulas && backgroundPrefetchStage >= 2\);/);
assert.match(appSource, /const needsVqBlocksData = foregroundVqBlocksData \|\| \(canSeeVideoaulas && backgroundPrefetchStage >= 3\);/);
assert.match(appSource, /const needsReviewQueueData = foregroundReviewQueueData \|\| \(canUseAdvancedFeatures && backgroundPrefetchStage >= 2\);/);
assert.match(appSource, /const foregroundPersonalLibraryData = \[/);
assert.match(appSource, /const needsPersonalLibraryData = foregroundPersonalLibraryData \|\| backgroundPrefetchStage >= 1;/);
assert.match(appSource, /cached\.fresh \|\| !needsPersonalLibraryData/);
assert.match(appSource, /saveSharedLibraryAnswerPatch/);
assert.doesNotMatch(appSource, /setDoc\(doc\(db, ['"]users['"], user\.uid, SHARED_LIBRARY_PROGRESS_COLLECTION/);
assert.match(appSource, /persistReviewQueueChanges/);
assert.doesNotMatch(appSource, /setDoc\(doc\(db, ['"]users['"], user\.uid, ['"]vq_review['"]/);
assert.match(appSource, /saveWatchedAulas/);
assert.match(appSource, /saveDailyStats/);
assert.match(appSource, /persistLibraryTopicProgressPatches/);
assert.match(appSource, /saveLibraryTopicProgressPatch/);
assert.match(appSource, /LIBRARY_PROGRESS_COLLECTION/);
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

const libraryProgressSource = await readFile(new URL('../src/services/libraryProgress.js', import.meta.url), 'utf8');
assert.match(libraryProgressSource, /LIBRARY_PROGRESS_COLLECTION = 'library_progress'/);
assert.match(libraryProgressSource, /saveLibraryTopicProgressPatch/);
assert.match(libraryProgressSource, /applyLibraryProgressEntries/);
assert.match(libraryProgressSource, /libraryProgressDocId/);
assert.match(libraryProgressSource, /answers:hasOwn\(progress, 'answers'\) \? \(progress\.answers \|\| \{\}\) : \(topic\.answers \|\| \{\}\)/);
assert.match(libraryProgressSource, /spacedReview:hasOwn\(progress, 'spacedReview'\) \? \(progress\.spacedReview \|\| \{\}\) : \(topic\.spacedReview \|\| \{\}\)/);

const featureContextSource = await readFile(new URL('../src/features/FeatureContext.jsx', import.meta.url), 'utf8');
assert.match(featureContextSource, /export const FeatureProvider/);
assert.match(featureContextSource, /export const useFeatureContext/);

const courseDerivedStateSource = await readFile(new URL('../src/hooks/useCourseDerivedState.js', import.meta.url), 'utf8');
assert.match(courseDerivedStateSource, /export const useCourseDerivedState/);
assert.match(courseDerivedStateSource, /sortCourseSubjectsForDisplay/);

const geminiRuntimeSource = await readFile(new URL('../src/hooks/useGeminiRuntime.js', import.meta.url), 'utf8');
assert.match(geminiRuntimeSource, /export const useGeminiRuntime/);
assert.match(geminiRuntimeSource, /callWithRotation/);
assert.match(geminiRuntimeSource, /rotateKey/);

const geminiServiceSource = await readFile(new URL('../src/services/gemini.js', import.meta.url), 'utf8');
assert.match(geminiServiceSource, /VITE_GEMINI_BACKEND_URL/);
assert.match(geminiServiceSource, /callGeminiBackend/);
assert.match(geminiServiceSource, /\/generate/);

const sharedLibrarySyncSource = await readFile(new URL('../src/hooks/useSharedLibrarySync.js', import.meta.url), 'utf8');
assert.match(sharedLibrarySyncSource, /export const useSharedLibrarySync/);
assert.match(sharedLibrarySyncSource, /canReadSharedLibrary/);
assert.match(sharedLibrarySyncSource, /loadProgress = true/);
assert.match(sharedLibrarySyncSource, /showLoadErrors = true/);
assert.match(sharedLibrarySyncSource, /onSnapshot/);
assert.match(sharedLibrarySyncSource, /where\('published', '==', true\)/);
assert.match(sharedLibrarySyncSource, /!user \|\| user\.isAnonymous \|\| !canReadSharedLibrary/);
assert.match(sharedLibrarySyncSource, /loadProgress \? withFirestoreTimeout\(getDocs\(collection\(db, 'users', user\.uid, progressCollection\)\)\) : Promise\.resolve\(null\)/);
assert.match(sharedLibrarySyncSource, /if \(showLoadErrors\) addToastRef\.current\?\.\('Não consegui carregar a Biblioteca compartilhada\.', 'error', 4500\);/);

const bizuarioSource = await readFile(new URL('../src/features/bizuario/BizuarioModal.jsx', import.meta.url), 'utf8');
assert.match(bizuarioSource, /export default function BizuarioModal/);

const studyMapPreviewSource = await readFile(new URL('../src/features/study-map/StudyMapPreview.jsx', import.meta.url), 'utf8');
assert.match(studyMapPreviewSource, /export default function StudyMapPreview/);

const questionFeatureSource = await readFile(new URL('../src/features/questions/QuestionFeature.jsx', import.meta.url), 'utf8');
assert.match(questionFeatureSource, /export \{ QuestionView, QuestionCard, OpenAnswerModal \}/);
assert.match(questionFeatureSource, /const isAnswerCorrect = \(question, answer\) =>/);
assert.match(questionFeatureSource, /const isFinalObjectiveAnswer = \(question, answer\) =>/);
assert.match(questionFeatureSource, /normalizeDisplayedAlternativeReferences\(opt\.explanation, opt\.letter\)/);

const exportModalsSource = await readFile(new URL('../src/features/exporting/ExportModals.jsx', import.meta.url), 'utf8');
assert.match(exportModalsSource, /export \{ ExportModal, AcademiaExportModal \}/);

const workflowModalsSource = await readFile(new URL('../src/features/modals/WorkflowModals.jsx', import.meta.url), 'utf8');
assert.match(workflowModalsSource, /export \{ SRModal, ExternalPromptModal \}/);

const vqGenModalSource = await readFile(new URL('../src/features/video-questions/VqGenModal.jsx', import.meta.url), 'utf8');
assert.match(vqGenModalSource, /export default VqGenModal/);
assert.match(vqGenModalSource, /const GraduationCap = /);
assertNoFreeIdentifiers(vqGenModalSource, 'VqGenModal');

const academiaTopicViewSource = await readFile(new URL('../src/features/academia/AcademiaTopicView.jsx', import.meta.url), 'utf8');
assert.match(academiaTopicViewSource, /export default AcademiaTopicView/);

const bulkGenerateModalSource = await readFile(new URL('../src/features/bulk/BulkGenerateModal.jsx', import.meta.url), 'utf8');
assert.match(bulkGenerateModalSource, /export default function BulkGenerateModal/);
assert.match(bulkGenerateModalSource, /useFeatureContext/);

const sharedLibraryViewSource = await readFile(new URL('../src/features/shared-library/SharedLibraryView.jsx', import.meta.url), 'utf8');
assert.match(sharedLibraryViewSource, /export default function SharedLibraryView/);
assert.match(sharedLibraryViewSource, /useFeatureContext/);
assert.match(sharedLibraryViewSource, /showSharedLibraryAdminTools = isAdmin && sharedLibraryAudienceMode === 'admin'/);

const videoaulasViewSource = await readFile(new URL('../src/features/course/VideoaulasView.jsx', import.meta.url), 'utf8');
assert.match(videoaulasViewSource, /export default function VideoaulasView/);
assert.match(videoaulasViewSource, /useFeatureContext/);
assertNoFreeIdentifiers(videoaulasViewSource, 'VideoaulasView');
assert.match(videoaulasViewSource, /\bClock,\s*[\s\S]*\} = useFeatureContext\(\)/);
assert.match(videoaulasViewSource, /\bvideoMainScrollRef,\s*[\s\S]*\} = useFeatureContext\(\)/);
assert.match(appSource, /\bClock,/);

const coursePortalViewSource = await readFile(new URL('../src/features/course/CoursePortalView.jsx', import.meta.url), 'utf8');
assert.match(coursePortalViewSource, /export default function CoursePortalView/);
assert.match(coursePortalViewSource, /useFeatureContext/);
assert.match(coursePortalViewSource, /useCourseHeroJourney/);
assert.match(coursePortalViewSource, /useCourseHeroJourney\(\{ enabled:true \}\)/);
assert.doesNotMatch(coursePortalViewSource, /id:'questoes'/);
assert.doesNotMatch(coursePortalViewSource, /cursoTab==='plano'&&isAdmin/);
assert.match(coursePortalViewSource, /Ciclo de Estudos/);
assertNoFreeIdentifiers(coursePortalViewSource, 'CoursePortalView');
assert.doesNotMatch(coursePortalViewSource, /const journeyInfoForLesson =/);
assert.doesNotMatch(coursePortalViewSource, /const firstQuestionBlockForLesson =/);
assert.match(coursePortalViewSource, /role="button"[\s\S]{0,260}setVqExpandedSubj\(p=>\(\{\.\.\.p,\[subj\]:!isExp\}\)\)/);

const videoQuestionsViewSource = await readFile(new URL('../src/features/course/VideoQuestionsView.jsx', import.meta.url), 'utf8');
assert.match(videoQuestionsViewSource, /export default function VideoQuestionsView/);
assert.match(videoQuestionsViewSource, /useFeatureContext/);

const homeViewSource = await readFile(new URL('../src/features/home/HomeView.jsx', import.meta.url), 'utf8');
assert.match(homeViewSource, /export default function HomeView/);
assert.match(homeViewSource, /useFeatureContext/);
assert.match(homeViewSource, /useCourseHeroJourney/);
assert.match(homeViewSource, /useCourseHeroJourney\(\{ enabled:homeCanSeeVideoaulas \}\)/);
assert.match(homeViewSource, /setCursoTab\('plano'\);setView\('curso'\)/);
assertNoFreeIdentifiers(homeViewSource, 'HomeView');
assert.doesNotMatch(homeViewSource, /buildHomeJourneyState/);
assert.doesNotMatch(homeViewSource, /const journeyInfo =/);

const courseHeroJourneySource = await readFile(new URL('../src/features/course/useCourseHeroJourney.js', import.meta.url), 'utf8');
assert.match(courseHeroJourneySource, /export const useCourseHeroJourney/);
assert.match(courseHeroJourneySource, /coursePrefsLoaded/);
assert.match(courseHeroJourneySource, /vqBlocksLoaded/);
assert.match(courseHeroJourneySource, /interleavedCycleLessons/);
assert.match(courseHeroJourneySource, /position:index \+ 1/);
assert.match(courseHeroJourneySource, /position:index \+ 4/);
assert.match(courseHeroJourneySource, /position:index \+ 9/);
assert.match(courseHeroJourneySource, /openQuestions\(event\.lesson, 'direct-even'\)/);
assert.match(courseHeroJourneySource, /openQuestions\(event\.lesson, 'clinical-odd'\)/);
assert.match(courseHeroJourneySource, /openQuestions\(event\.lesson, 'clinical-even'\)/);
assert.doesNotMatch(courseHeroJourneySource, /completedAfter/);
assert.match(courseHeroJourneySource, /Fazer pares diretas/);
assert.match(courseHeroJourneySource, /Fazer clínicas ímpares/);
assert.match(courseHeroJourneySource, /Fazer clínicas pares/);
assertNoFreeIdentifiers(courseHeroJourneySource, 'useCourseHeroJourney');

assert.match(videoQuestionsViewSource, /cycleStage === 'direct-odd'/);
assert.match(videoQuestionsViewSource, /cycleStage === 'direct-even'/);
assert.match(videoQuestionsViewSource, /if \(type !== journeyStage\.type\) return false;/);
assert.match(videoQuestionsViewSource, /const clinicalReviewQuestions = parityQuestions\.filter\(question => isClinicalVqQuestion\(question\)\);/);

const settingsViewSource = await readFile(new URL('../src/features/settings/SettingsView.jsx', import.meta.url), 'utf8');
assert.match(settingsViewSource, /export default function SettingsView/);
assert.match(settingsViewSource, /useFeatureContext/);

const favoritesViewSource = await readFile(new URL('../src/features/favorites/FavoritesView.jsx', import.meta.url), 'utf8');
assert.match(favoritesViewSource, /export default function FavoritesView/);
assert.match(favoritesViewSource, /useFeatureContext/);

const spacedReviewViewSource = await readFile(new URL('../src/features/review/SpacedReviewView.jsx', import.meta.url), 'utf8');
assert.match(spacedReviewViewSource, /export default function SpacedReviewView/);
assert.match(spacedReviewViewSource, /useFeatureContext/);

const quickViewSource = await readFile(new URL('../src/features/quick/QuickView.jsx', import.meta.url), 'utf8');
assert.match(quickViewSource, /export default function QuickView/);
assert.match(quickViewSource, /useFeatureContext/);

const quickTopicViewSource = await readFile(new URL('../src/features/quick/QuickTopicView.jsx', import.meta.url), 'utf8');
assert.match(quickTopicViewSource, /export default function QuickTopicView/);
assert.match(quickTopicViewSource, /useFeatureContext/);

const subLibraryViewSource = await readFile(new URL('../src/features/library/SubLibraryView.jsx', import.meta.url), 'utf8');
assert.match(subLibraryViewSource, /export default function SubLibraryView/);
assert.match(subLibraryViewSource, /useFeatureContext/);

const adminStudyMapSource = await readFile(new URL('../src/features/admin/AdminStudyMapTopicList.jsx', import.meta.url), 'utf8');
assert.match(adminStudyMapSource, /export default AdminStudyMapTopicList/);

let deferredRan = false;
const deferred = deferInteractionWork(() => {
  deferredRan = true;
  return 'done';
});
assert.equal(deferredRan, false);
assert.equal(await deferred, 'done');
assert.equal(deferredRan, true);

console.log('unit-smoke ok');
