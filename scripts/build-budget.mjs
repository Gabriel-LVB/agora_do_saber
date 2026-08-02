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
let ecgCaseBank = null;
let questionCuration = null;
let fsrsScheduler = null;
let fsrsVendor = null;
let reviewMigration = null;
let ecgQuestionMatcher = null;
let questionVisual = null;
let spacedReview = null;
let courseStudents = null;
let disabledCourseQuestions = null;

for (const file of jsFiles) {
  const data = await readFile(new URL(file, assetsDir));
  const gzipSize = gzipSync(data).length;
  totalJs += data.length;
  totalGzip += gzipSize;
  if (file.startsWith('index-')) entry = { file, raw:data.length, gzip:gzipSize };
  if (file.startsWith('quickContent-')) quickContent = { file, raw:data.length, gzip:gzipSize };
  if (file.startsWith('EcgCaseBankView-')) ecgCaseBank = { file, raw:data.length, gzip:gzipSize };
  if (file.startsWith('QuestionCurationView-')) questionCuration = { file, raw:data.length, gzip:gzipSize };
  if (file.startsWith('fsrsScheduler-')) fsrsScheduler = { file, raw:data.length, gzip:gzipSize };
  if (file.startsWith('fsrs-vendor-')) fsrsVendor = { file, raw:data.length, gzip:gzipSize };
  if (file.startsWith('reviewMigration-')) reviewMigration = { file, raw:data.length, gzip:gzipSize };
  if (file.startsWith('ecgQuestionMatcher-')) ecgQuestionMatcher = { file, raw:data.length, gzip:gzipSize };
  if (file.startsWith('questionVisual-')) questionVisual = { file, raw:data.length, gzip:gzipSize };
  if (file.startsWith('SpacedReviewView-')) spacedReview = { file, raw:data.length, gzip:gzipSize };
  if (file.startsWith('CourseStudentsView-')) courseStudents = { file, raw:data.length, gzip:gzipSize };
  if (file.startsWith('disabledCourseQuestions-')) disabledCourseQuestions = { file, raw:data.length, gzip:gzipSize };
}

assert.ok(entry, 'Bundle principal index-*.js nao encontrado.');

const ENTRY_RAW_LIMIT = 500 * 1024;
const ENTRY_GZIP_LIMIT = 220 * 1024;
// A curadoria e a seleção da Fábrica acrescentam um módulo administrativo
// completo; o teto cresceu somente pelo custo medido desta primeira fatia.
// A ponte entre selecao publicada, vq_blocks, gestao manual e ativacao adaptativa
// acrescenta cerca de 1 KiB ao nucleo; paineis e algoritmos continuam em chunks lazy.
// A busca administrativa por enunciado/alternativa acrescenta menos de 1 KiB ao
// chunk lazy da Fabrica. A confirmação da política global de limpeza acrescenta
// menos de 1 KiB ao núcleo, sem alterar o primeiro carregamento de dados.
const CORE_TOTAL_GZIP_LIMIT = 447 * 1024;
const QUICK_CONTENT_GZIP_LIMIT = 6 * 1024;
// Curadoria, seleção automática, publicação e exportação de auditoria ficam
// juntas em um único módulo administrativo carregado somente sob demanda.
const QUESTION_CURATION_GZIP_LIMIT = 15 * 1024;
// O banco de 150 ECGs é uma ferramenta administrativa sob demanda. Mantê-lo
// em chunk próprio impede que a interface da Fábrica pague esse custo antes do clique.
const ECG_CASE_BANK_GZIP_LIMIT = 6 * 1024;
// O FSRS só é carregado na primeira resposta de revisão.
// O teto inclui a ponte local e a biblioteca oficial, mantidas fora do carregamento inicial.
const FSRS_SCHEDULER_GZIP_LIMIT = 8 * 1024;
// Inclui a ponte de reparo v8 que distingue backlog legado de novas aulas sem
// puxar centenas de cartões antigos para o mesmo dia. Continua em chunk lazy.
const REVIEW_MIGRATION_GZIP_LIMIT = 5.5 * 1024;
// A ontologia nao entra no JavaScript: o matcher e seu detector visual sao
// baixados apenas quando vq_blocks precisa da projecao automatica de ECG.
const ECG_QUESTION_MATCHER_GZIP_LIMIT = 5 * 1024;
const REVIEW_DASHBOARD_GZIP_LIMIT = 6 * 1024;
// O painel le progresso de varios alunos somente quando o admin abre a aba.
const COURSE_STUDENTS_GZIP_LIMIT = 5 * 1024;
// O registro global de questões inativas e o detector textual conservador só são
// carregados após autenticação de usuário do curso e permanecem fora da Home inicial.
const DISABLED_COURSE_QUESTIONS_GZIP_LIMIT = 3 * 1024;
const TOTAL_GZIP_LIMIT = CORE_TOTAL_GZIP_LIMIT
  + QUICK_CONTENT_GZIP_LIMIT
  + QUESTION_CURATION_GZIP_LIMIT
  + ECG_CASE_BANK_GZIP_LIMIT
  + FSRS_SCHEDULER_GZIP_LIMIT
  + REVIEW_MIGRATION_GZIP_LIMIT
  + ECG_QUESTION_MATCHER_GZIP_LIMIT
  + REVIEW_DASHBOARD_GZIP_LIMIT
  + COURSE_STUDENTS_GZIP_LIMIT
  + DISABLED_COURSE_QUESTIONS_GZIP_LIMIT;
const fsrsSchedulerGzip = (fsrsScheduler?.gzip || 0) + (fsrsVendor?.gzip || 0);
const ecgQuestionMatcherGzip = (ecgQuestionMatcher?.gzip || 0) + (questionVisual?.gzip || 0);
const coreGzip = totalGzip
  - (quickContent?.gzip || 0)
  - (ecgCaseBank?.gzip || 0)
  - (questionCuration?.gzip || 0)
  - fsrsSchedulerGzip
  - (reviewMigration?.gzip || 0)
  - ecgQuestionMatcherGzip
  - (spacedReview?.gzip || 0)
  - (courseStudents?.gzip || 0)
  - (disabledCourseQuestions?.gzip || 0);

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
assert.ok(ecgCaseBank, 'Banco de ECG deve permanecer em módulo lazy próprio.');
assert.ok(
  ecgCaseBank.gzip <= ECG_CASE_BANK_GZIP_LIMIT,
  `Módulo Banco de ECG passou do budget: ${fmt(ecgCaseBank.gzip)} > ${fmt(ECG_CASE_BANK_GZIP_LIMIT)}`
);
assert.ok(questionCuration, 'A Curadoria deve permanecer em modulo lazy proprio.');
assert.ok(
  questionCuration.gzip <= QUESTION_CURATION_GZIP_LIMIT,
  `Modulo Curadoria passou do budget: ${fmt(questionCuration.gzip)} > ${fmt(QUESTION_CURATION_GZIP_LIMIT)}`
);
assert.ok(fsrsScheduler, 'A ponte do FSRS deve permanecer em modulo lazy proprio.');
assert.ok(fsrsVendor, 'A biblioteca FSRS deve permanecer fora do bundle inicial.');
assert.ok(
  fsrsSchedulerGzip <= FSRS_SCHEDULER_GZIP_LIMIT,
  `Agendador FSRS passou do budget: ${fmt(fsrsSchedulerGzip)} > ${fmt(FSRS_SCHEDULER_GZIP_LIMIT)}`
);
assert.ok(reviewMigration, 'A migracao da fila individual deve permanecer em modulo lazy proprio.');
assert.ok(
  reviewMigration.gzip <= REVIEW_MIGRATION_GZIP_LIMIT,
  `Migracao da fila individual passou do budget: ${fmt(reviewMigration.gzip)} > ${fmt(REVIEW_MIGRATION_GZIP_LIMIT)}`
);
assert.ok(disabledCourseQuestions, 'O registro de questoes inativas deve permanecer em modulo lazy proprio.');
assert.ok(
  disabledCourseQuestions.gzip <= DISABLED_COURSE_QUESTIONS_GZIP_LIMIT,
  `Registro de questoes inativas passou do budget: ${fmt(disabledCourseQuestions.gzip)} > ${fmt(DISABLED_COURSE_QUESTIONS_GZIP_LIMIT)}`
);
assert.ok(ecgQuestionMatcher, 'O matcher de ECG deve permanecer em modulo lazy proprio.');
assert.ok(questionVisual, 'A deteccao visual de ECG deve permanecer fora do bundle inicial.');
assert.ok(
  ecgQuestionMatcherGzip <= ECG_QUESTION_MATCHER_GZIP_LIMIT,
  `Matcher de ECG passou do budget: ${fmt(ecgQuestionMatcherGzip)} > ${fmt(ECG_QUESTION_MATCHER_GZIP_LIMIT)}`
);
assert.ok(spacedReview, 'A tela de Revisoes deve permanecer em modulo lazy proprio.');
assert.ok(
  spacedReview.gzip <= REVIEW_DASHBOARD_GZIP_LIMIT,
  `Dashboard de revisoes passou do budget: ${fmt(spacedReview.gzip)} > ${fmt(REVIEW_DASHBOARD_GZIP_LIMIT)}`
);
assert.ok(courseStudents, 'Painel de alunos deve permanecer em modulo lazy proprio.');
assert.ok(
  courseStudents.gzip <= COURSE_STUDENTS_GZIP_LIMIT,
  `Painel de alunos passou do budget: ${fmt(courseStudents.gzip)} > ${fmt(COURSE_STUDENTS_GZIP_LIMIT)}`
);
assert.ok(totalGzip <= TOTAL_GZIP_LIMIT, `JS total passou do budget: ${fmt(totalGzip)} > ${fmt(TOTAL_GZIP_LIMIT)}`);

console.log(`build-budget ok: ${entry.file} ${fmt(entry.gzip)} gzip; core ${fmt(coreGzip)} gzip; ${quickContent.file} ${fmt(quickContent.gzip)} gzip; ${questionCuration.file} ${fmt(questionCuration.gzip)} gzip; ${ecgCaseBank.file} ${fmt(ecgCaseBank.gzip)} gzip; FSRS ${fmt(fsrsSchedulerGzip)} gzip; migração ${fmt(reviewMigration.gzip)} gzip; revisões ${fmt(spacedReview.gzip)} gzip; alunos ${fmt(courseStudents.gzip)} gzip; JS total ${fmt(totalGzip)} gzip (${fmt(totalJs)} raw)`);
