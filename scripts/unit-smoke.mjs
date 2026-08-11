import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { strToU8, zipSync } from 'fflate';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import { cleanFirestoreData } from '../src/lib/firestoreData.js';
import { deferInteractionWork } from '../src/lib/interaction.js';
import {
  mergeSharedLibraryQuestionChunks,
  prepareSharedLibraryContentForWrite,
  sharedLibraryChunkDocId,
} from '../src/services/sharedLibraryContent.js';
import {
  mapSharedLibraryRepairCandidates,
  repairSharedLibraryIncompleteItems,
} from '../src/services/sharedLibraryRepair.js';
import {
  buildQuickPracticePrompt,
  extractQuickSection,
} from '../src/features/quick/quickContent.js';
import {
  auditQuestionCollection,
  collectAuditableQuestions,
  getQuestionCorrectAnswer,
  normalizeAuditText,
} from '../src/services/questionAudit.js';
import {
  applyQuestionMetadataOverrides,
  buildConceptAnalysisPrompt,
  buildLearningSelectionSnapshot,
  buildQuestionMetadataBatches,
  buildQuestionMetadataPrompt,
  LEARNING_SELECTION_VERSION,
  normalizeConcepts,
  normalizeQuestionMetadata,
  QUESTION_METADATA_ANALYSIS_VERSION,
  QUESTION_METADATA_BATCH_SIZE,
  QUESTION_METADATA_VERSION,
  questionSetSignature,
  selectLearningQuestions,
} from '../src/services/questionMetadata.js';
import {
  buildReviewForecast,
  buildReviewCardKey,
  completeCourseReviewFirstExposure,
  createReviewQueueItem,
  pauseReviewLesson,
  REVIEW_DAY_MS,
  REVIEW_SCHEDULER_VERSION,
  resumeReviewLesson,
  scheduleReviewOutcome,
  selectLessonReviewSeed,
  summarizeReviewQueue,
} from '../src/services/reviewScheduler.js';
import {
  allocateReviewFirstExposureWaves,
  buildWatchedLessonsIndividualPlan,
  distributeReviewFirstExposureRows,
  FSRS_PENDING_SCHEDULER_VERSION,
  INDIVIDUAL_REVIEW_PLAN_VERSION,
  orderReviewFirstExposureRows,
  REVIEW_FIRST_EXPOSURE_WAVES,
} from '../src/services/reviewMigration.js';
import {
  createNonContentCourseQuestionPolicyEntry,
  createDisabledCourseQuestionEntry,
  detectNonContentCourseQuestion,
  disableCourseReviewQueueItems,
  filterDisabledCourseQuestionsFromVqBlocks,
  findNonContentCourseQuestions,
  isCourseQuestionDisabled,
  isNonContentCourseQuestionPolicyEnabled,
  pruneDisabledCourseQuestionsFromSession,
  upsertDisabledCourseQuestion,
} from '../src/services/disabledCourseQuestions.js';
import {
  advanceFsrsCard,
  compareFsrsWithLegacy,
  FSRS_SCHEDULER_VERSION,
} from '../src/services/fsrsScheduler.js';
import { executeGeminiRotation } from '../src/services/geminiRotation.js';
import {
  buildFamedCourseCatalogExport,
  FAMED_COURSE_LESSON_MAP,
  resolveFamedCourseLessons,
} from '../src/features/famed/famedCourseLessonMap.js';
import {
  buildFamedFlashcardAuditExport,
  FAMED_FLASHCARD_GENERATION_VERSION,
  famedFlashcardSourceSignature,
  famedPastQuestions,
  getFamedFlashcardState,
  hasFamedGeneratedLesson,
} from '../src/features/famed/famedStudyMaterials.js';
import { buildFamedEssentialFlashcardsPrompt, buildFamedQuestionPackagePrompt } from '../src/agora_prompts.js';
import { parseFamedQuestionPackage } from '../src/features/famed/famedQuestionPackage.js';
import {
  buildDailyEffortSchedule,
  buildEffortBalancedSchedule,
  buildScheduleDaySlots,
  calculateScheduleEffort,
  interleaveLongitudinalScheduleLessons,
  interleaveScheduleSubjectBatches,
  resolveScheduleWeeksCount,
  resolveScheduleSubjectOrder,
} from '../src/services/courseSchedule.js';
import {
  buildClinicalPrioritySchedule,
  COURSE_CLINICAL_PRIORITY_CATALOG_SIZE,
  COURSE_CLINICAL_PRIORITY_VERSION,
} from '../src/services/courseClinicalPriority.js';
import {
  enrichQuestionWithEcgImage,
  enrichVqBlocksWithEcgImages,
  ECG_QUESTION_MATCH_VERSION,
} from '../src/services/ecgQuestionMatcher.js';
import {
  questionHasEcgImage,
  questionRequestsEcgImage,
} from '../src/services/questionVisual.js';

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

const bigQuestionText = 'x'.repeat(350000);
const chunkPrepared = prepareSharedLibraryContentForWrite({
  title:'Aula grande',
  directQuestions:[
    { id:'q1', statement:bigQuestionText },
    { id:'q2', statement:bigQuestionText },
  ],
});
assert.equal(chunkPrepared.main.directQuestions, undefined);
assert.equal(chunkPrepared.main.questionChunks.directQuestions.count, 2);
assert.equal(chunkPrepared.chunks.directQuestions.length, 2);
assert.equal(chunkPrepared.chunks.directQuestions[0].id, sharedLibraryChunkDocId('directQuestions', 0));
assert.deepEqual(
  mergeSharedLibraryQuestionChunks(chunkPrepared.main, chunkPrepared.chunks.directQuestions.map(chunk => ({ id:chunk.id, ...chunk.data }))).directQuestions.map(question => question.id),
  ['q1', 'q2'],
);

const mappedPartialRepair = mapSharedLibraryRepairCandidates([{ id:'repair_batch_2' }], 'repair_batch', 2);
assert.equal(mappedPartialRepair.has(0), false);
assert.equal(mappedPartialRepair.get(1)?.id, 'repair_batch_2');
const repairFixtureItem = {
  id:'repair-lesson',
  title:'Aula de reparo',
  directQuestions:[
    { id:'q1', statement:'Questão original 1' },
    { id:'q2', statement:'Questão original 2' },
  ],
};
const repairFixtureIssues = repairFixtureItem.directQuestions.map((question, index) => ({
  field:'directQuestions',
  index,
  issue:'explicação incompleta',
  label:'fixação',
  question,
}));
const repairCallSizes = [];
const repairLogs = [];
let savedRepairItem = null;
const repairFixtureResult = await repairSharedLibraryIncompleteItems({
  targets:[{ item:repairFixtureItem, issues:repairFixtureIssues }],
  reviewQuestions:async ({ questions, namespace }) => {
    repairCallSizes.push(questions.length);
    return { questions:[{ id:`${namespace}_1`, repaired:true }] };
  },
  getQuestionIssue:question => question.repaired ? '' : 'explicação incompleta',
  saveItem:async (id, patch) => { savedRepairItem = { ...repairFixtureItem, ...patch, id }; },
  refreshItems:async () => [savedRepairItem],
  countIncompleteQuestions:items => items.reduce((total, item) => total + item.directQuestions.filter(question => !question.repaired).length, 0),
  addLog:(type, message) => repairLogs.push({ type, message }),
});
assert.deepEqual(repairCallSizes, [2, 1]);
assert.equal(savedRepairItem.directQuestions.every(question => question.repaired), true);
assert.equal(savedRepairItem.questionRepairMeta.repairedCount, 2);
assert.equal(repairFixtureResult.confirmedFixed, 2);
assert.equal(repairFixtureResult.remaining, 0);
assert.match(repairLogs.find(entry => entry.type === 'warning')?.message || '', /1\/2/);

const fullQuickPrompt = buildQuickPracticePrompt({
  title:'Estenose mitral',
  outputs:['questions','flashcards'],
  alternativeCount:4,
  distractorRule:'REGRA DOS DISTRATORES',
});
assert.match(fullQuickPrompt, /Gere de 4 a 6 quest/);
assert.match(fullQuickPrompt, /Não siga limite, faixa, meta ou sugestão numérica/);
assert.doesNotMatch(fullQuickPrompt, /Gere de 5 a 8 flashcards|Nunca gere menos de 5/);
assert.match(fullQuickPrompt, /REGRA DOS DISTRATORES/);
assert.match(buildQuickPracticePrompt({title:'Teste', outputs:['questions']}), /N.o gere flashcards/);
assert.match(extractQuickSection('## Questoes\n## Questao 1\nEnunciado\n## Flashcards\n## Flashcard 1\nPergunta', 'Questoes'), /Questao 1/);

const famedStudyFixture = {
  title:'Valvopatias',
  topics:[{
    id:'estenose-aortica',
    title:'Estenose aórtica',
    lessonGenerated:true,
    lessonSections:{ 0:{ content:'A estenose aórtica sintomática grave exige avaliação para troca valvar.' } },
  }],
  famedStudy:{
    pastQuestionSets:[{
      id:'av1-2025',
      title:'AV1 2025',
      questions:[{
        id:'q1',
        statement:'Qual achado indica gravidade?',
        options:[
          { letter:'A', text:'Síncope aos esforços', isCorrect:true },
          { letter:'B', text:'Sopro inocente', isCorrect:false },
        ],
        explanation:'Sintomas aos esforços mudam prognóstico e conduta.',
      }],
    }],
    essentialFlashcards:[],
  },
};
assert.equal(hasFamedGeneratedLesson(famedStudyFixture), true);
assert.equal(famedPastQuestions(famedStudyFixture).length, 1);
assert.equal(getFamedFlashcardState(famedStudyFixture).prerequisitesMet, true);
const famedStudySignature = famedFlashcardSourceSignature(famedStudyFixture);
const famedStudyWithCards = {
  ...famedStudyFixture,
  famedStudy:{
    ...famedStudyFixture.famedStudy,
    essentialFlashcards:[{ id:'f1', statement:'Qual sintoma aos esforços marca gravidade na estenose aórtica?', expectedAnswer:'Síncope.', explanation:'A síncope aos esforços marca repercussão hemodinâmica.', isFlashcard:true }],
    flashcardSourceSignature:famedStudySignature,
    flashcardGenerationVersion:FAMED_FLASHCARD_GENERATION_VERSION,
  },
};
assert.equal(getFamedFlashcardState(famedStudyWithCards).fresh, true);
const famedFlashcardAudit = buildFamedFlashcardAuditExport(famedStudyWithCards, {
  content:{ id:'famed-valvopatias', title:'Valvopatias', discipline:'Cardiologia' },
  exportedAt:'2026-08-10T12:00:00.000Z',
});
assert.equal(famedFlashcardAudit.schema, 'agora-famed-flashcard-audit-v1');
assert.equal(famedFlashcardAudit.exportedAt, '2026-08-10T12:00:00.000Z');
assert.equal(famedFlashcardAudit.content.discipline, 'Cardiologia');
assert.equal(famedFlashcardAudit.generation.version, FAMED_FLASHCARD_GENERATION_VERSION);
assert.equal(famedFlashcardAudit.generation.sourcesStillMatch, true);
assert.equal(famedFlashcardAudit.flashcards.length, 1);
assert.equal(famedFlashcardAudit.flashcards[0].statement, famedStudyWithCards.famedStudy.essentialFlashcards[0].statement);
assert.equal(famedFlashcardAudit.flashcards[0].expectedAnswer, 'Síncope.');
assert.match(famedFlashcardAudit.sourceEvidence.lessonText, /estenose aórtica sintomática grave/);
assert.match(famedFlashcardAudit.sourceEvidence.pastQuestionsText, /Qual achado indica gravidade/);
assert.match(famedFlashcardAudit.reviewChecklist.join(' '), /back exige um item curto/);
assert.equal(getFamedFlashcardState({
  ...famedStudyWithCards,
  famedStudy:{ ...famedStudyWithCards.famedStudy, flashcardGenerationVersion:'famed-essential-direct-v8' },
}).stale, true);
assert.equal(getFamedFlashcardState({
  ...famedStudyWithCards,
  topics:[{ ...famedStudyWithCards.topics[0], lessonSections:{ 0:{ content:'Aula modificada.' } } }],
}).stale, true);
assert.equal(hasFamedGeneratedLesson({ ...famedStudyFixture, topics:[{ ...famedStudyFixture.topics[0], lessonGenerated:false }] }), false);
const famedFlashcardPrompt = buildFamedEssentialFlashcardsPrompt({
  title:famedStudyFixture.title,
  lessonText:'Aula sobre estenose aórtica.',
  pastQuestionsText:'Questão antiga sobre síncope.',
});
assert.match(famedFlashcardPrompt, /Isto é realmente essencial para esta aula/);
assert.match(famedFlashcardPrompt, /Eu preciso de um flashcard para aprender ou reter isto/);
assert.match(famedFlashcardPrompt, /pode ser deduzido por bom senso ou lógica genérica/);
assert.match(famedFlashcardPrompt, /O cartão só pode existir se passar claramente por TODOS os filtros/);
assert.match(famedFlashcardPrompt, /FORMATO DIRETO E ATOMIZAÇÃO/);
assert.match(famedFlashcardPrompt, /pergunta direta, curta e autossuficiente/);
assert.match(famedFlashcardPrompt, /retenha SOMENTE os 20% mais importantes/);
assert.match(famedFlashcardPrompt, /Dê peso maior à prova somente depois de filtrar a qualidade da cobrança/);
assert.match(famedFlashcardPrompt, /Questões antigas médias, difíceis ou realmente discriminativas/);
assert.match(famedFlashcardPrompt, /Ignore como sinal de prioridade toda questão fácil, elementar, óbvia/);
assert.match(famedFlashcardPrompt, /Questão classificada como fácil fornece ZERO peso de prova/);
assert.match(famedFlashcardPrompt, /recorrência de cobrança trivial continua sendo trivial/);
assert.match(famedFlashcardPrompt, /Use o espaço liberado pelas cobranças triviais/);
assert.match(famedFlashcardPrompt, /não a complete com questões fáceis/);
assert.match(famedFlashcardPrompt, /A barra de entrada pelo eixo “vida real” também é alta/);
assert.match(famedFlashcardPrompt, /Ser interessante, moderno, complementar, “potencialmente eficaz”/);
assert.match(famedFlashcardPrompt, /Manobras de nicho, cortes etários isolados/);
assert.match(famedFlashcardPrompt, /Aplique o teste contrafactual da relevância/);
assert.match(famedFlashcardPrompt, /Proporções técnicas de procedimento, metas gerais já conhecidas pelo público/);
assert.match(famedFlashcardPrompt, /Não confunda facilidade de formular uma pergunta com importância/);
assert.match(famedFlashcardPrompt, /Os 20% são um filtro de importância, não uma quantidade fixa de cartões/);
assert.match(famedFlashcardPrompt, /Questões antigas que mandam citar, listar, enumerar ou nomear uma coleção/);
assert.match(famedFlashcardPrompt, /o inventário pedido recebe ZERO peso como memória de flashcard/);
assert.match(famedFlashcardPrompt, /se a cobrança se resume a reproduzir a lista, não crie cartão/);
assert.match(famedFlashcardPrompt, /REGRA RÍGIDA DO BACK — NO MÁXIMO DOIS ITENS/);
assert.match(famedFlashcardPrompt, /A Resposta deve exigir UM item por padrão e pode exigir DOIS/);
assert.match(famedFlashcardPrompt, /Nunca exija três ou mais itens/);
assert.match(famedFlashcardPrompt, /NÃO fabrique automaticamente um cartão para cada item/);
assert.match(famedFlashcardPrompt, /FLASHCARD NÃO É INVENTÁRIO/);
assert.match(famedFlashcardPrompt, /São proibidas perguntas iniciadas ou estruturadas como “cite”, “liste”, “enumere”/);
assert.match(famedFlashcardPrompt, /Citar três exames e perguntar pelos outros dois/);
assert.match(famedFlashcardPrompt, /Não pergunte pelo conjunto de classes de medicamentos de primeira escolha/);
assert.match(famedFlashcardPrompt, /qual fármaco ou classe possui um papel ÚNICO/);
assert.match(famedFlashcardPrompt, /qual exame possui uma finalidade ÚNICA/);
assert.match(famedFlashcardPrompt, /Também é proibido mostrar parte de uma lista na Pergunta e pedir os itens restantes/);
assert.match(famedFlashcardPrompt, /Rejeite qualquer pergunta que use “além de X”/);
assert.match(famedFlashcardPrompt, /não podem ser o restante de uma tríade/);
assert.match(famedFlashcardPrompt, /Faça a concordância de cardinalidade/);
assert.match(famedFlashcardPrompt, /pergunta no singular.*exige exatamente um item sem alternativas/);
assert.match(famedFlashcardPrompt, /Nunca responda a uma pergunta no singular com alternativas unidas por “ou”, barra ou parênteses/);
assert.match(famedFlashcardPrompt, /DIREÇÃO DA PERGUNTA — NÚCLEO SEMÂNTICO/);
assert.match(famedFlashcardPrompt, /apresente W e Z na Pergunta e peça Y na Resposta/);
assert.match(famedFlashcardPrompt, /apenas pede para recitar uma das próprias pistas/);
assert.match(famedFlashcardPrompt, /TESTES DE QUALIDADE DA PERGUNTA/);
assert.match(famedFlashcardPrompt, /Não transforme uma lista antiga em “qual item falta\?”/);
assert.match(famedFlashcardPrompt, /Cardinalidade verificável/);
assert.match(famedFlashcardPrompt, /Pergunta e Explicação precisam afirmar a mesma coisa com o mesmo grau de certeza/);
assert.match(famedFlashcardPrompt, /“as diretrizes recomendam”, “há boa evidência”, “esta definição é crucial”/);
assert.match(famedFlashcardPrompt, /como o distinguem da alternativa plausível mais próxima/);
assert.match(famedFlashcardPrompt, /## Flashcard N/);
assert.match(famedFlashcardPrompt, /Pergunta: \[pergunta direta/);
assert.match(famedFlashcardPrompt, /Resposta: \[um item curto; excepcionalmente dois itens curtos/);
assert.doesNotMatch(famedFlashcardPrompt, /\{\{c1::|## Cloze N|cloze deletion/);
assert.doesNotMatch(famedFlashcardPrompt, /Limite absoluto|maxCards|quantidade mínima|quantidade máxima|até \d+ flashcards/i);
assert.match(famedFlashcardPrompt, /Distratores das questões antigas não são fatos verdadeiros/);
assert.match(famedFlashcardPrompt, /comentários metalinguísticos/);

const famedPackagePrompt = buildFamedQuestionPackagePrompt({ title:'Valvopatias' });
assert.match(famedPackagePrompt, /arquivo ZIP baixável/);
assert.match(famedPackagePrompt, /questions\.json na raiz/);
assert.match(famedPackagePrompt, /agora-famed-question-package-v1/);
assert.match(famedPackagePrompt, /images\/q1-figura\.png/);
const famedPackageZip = zipSync({
  'questions.json':strToU8(JSON.stringify({
    schema:'agora-famed-question-package-v1',
    title:'AV1 2025',
    questions:[{
      id:'q1',
      statement:'Qual é o achado?',
      caseContext:'Paciente com dispneia.',
      options:[
        { letter:'A', text:'Achado correto', isCorrect:true, explanation:'Explica o mecanismo.' },
        { letter:'B', text:'Distrator', isCorrect:false, explanation:'Não corresponde ao mecanismo.' },
      ],
      explanation:'A alternativa A decorre do mecanismo descrito.',
      expectedAnswer:'',
      isOpen:false,
      isEssay:false,
      images:[{ file:'images/q1.png', altText:'Radiografia de tórax', credit:'' }],
    }],
  })),
  'images/q1.png':new Uint8Array([137,80,78,71,13,10,26,10]),
});
const parsedFamedPackage = await parseFamedQuestionPackage(famedPackageZip,'famed-test');
assert.equal(parsedFamedPackage.title,'AV1 2025');
assert.equal(parsedFamedPackage.questions.length,1);
assert.equal(parsedFamedPackage.questions[0].images[0].file,'images/q1.png');
assert.equal(parsedFamedPackage.assets.length,1);
assert.match(parsedFamedPackage.assets[0].dataUrl,/^data:image\/png;base64,/);

assert.equal(normalizeAuditText('Nó SA e eletrocardiograma'), 'no_sinoatrial e ecg');
assert.equal(getQuestionCorrectAnswer({
  options:[
    { text:'Nó atrioventricular', isCorrect:false },
    { text:'Nó sinoatrial', isCorrect:true },
  ],
}), 'Nó sinoatrial');

const auditInput = {
  sharedLibraryItems:[{
    id:'shared-1',
    subject:'Cardiologia',
    topic:'Eletrofisiologia',
    title:'Atividade elétrica',
    directQuestions:[
      {
        id:'q1',
        statement:'Qual estrutura funciona como o marcapasso fisiológico do coração?',
        options:[{ text:'Nó sinoatrial', isCorrect:true }],
      },
      {
        id:'q2',
        statement:'Em condições normais, onde se origina o impulso elétrico cardíaco?',
        options:[{ text:'Nó SA', isCorrect:true }],
      },
      {
        id:'q3',
        statement:'Qual é a função do nó sinusal no ritmo cardíaco?',
        options:[{ text:'Nó sinoatrial', isCorrect:true }],
      },
      {
        id:'flash',
        statement:'Frente de flashcard',
        expectedAnswer:'Verso',
        isFlashcard:true,
      },
    ],
  }],
  vqBlocks:{
    mirrored:{
      meta:{ source:'shared-library', subject:'Cardiologia' },
      blocks:{ one:{ questions:[{ id:'mirror', statement:'Não deve ser contado' }] } },
    },
    native:{
      meta:{ subject:'Cardiologia', topic:'Arritmias', aulaTitle:'Ritmo sinusal' },
      blocks:{
        one:{
          title:'Automatismo',
          questions:[{
            id:'q4',
            statement:'Qual estrutura funciona como o marcapasso fisiológico do coração?',
            options:[{ text:'Nó sinoatrial', isCorrect:true }],
          }],
        },
      },
    },
  },
};

assert.deepEqual(resolveScheduleSubjectOrder({
  availableSubjects:['Obstetrícia', 'Cardiologia', 'Pneumologia'],
  preferredSubjects:['Cardiologia', 'Obstetricia'],
}), ['Cardiologia', 'Obstetrícia', 'Pneumologia']);
assert.deepEqual(resolveScheduleSubjectOrder({
  availableSubjects:['Cardiologia', 'Pneumologia', 'Cirurgia'],
  lessonCounts:{ Cardiologia:8, Pneumologia:3, Cirurgia:12 },
  orderBy:'lesson-count-desc',
}), ['Cirurgia', 'Cardiologia', 'Pneumologia']);
assert.deepEqual(interleaveScheduleSubjectBatches({
  orderedSubjects:['Cardio', 'Pneumo', 'Cirurgia'],
  lessonsBySubject:new Map([
    ['Cardio', ['c1', 'c2']],
    ['Pneumo', ['p1']],
    ['Cirurgia', ['s1', 's2']],
  ]),
  batchSize:2,
}), ['c1', 'p1', 'c2', 's1', 's2']);
const balancedCourseSchedule = buildEffortBalancedSchedule({
  lessons:[
    { id:'a', durationSeconds:3600 },
    { id:'b', durationSeconds:3600 },
    { id:'c', durationSeconds:900 },
    { id:'d', durationSeconds:900 },
  ],
  weeksCount:2,
});
assert.deepEqual(balancedCourseSchedule.weeks.map(week => week.lessons.map(lesson => lesson.id)), [
  ['a'],
  ['b', 'c', 'd'],
]);
assert.equal(balancedCourseSchedule.weeks.flatMap(week => week.lessons).length, 4);
assert.equal(buildEffortBalancedSchedule({
  lessons:[{ id:'unknown' }],
  weeksCount:2,
}).totalEffortSeconds, 45 * 60);
assert.deepEqual(interleaveLongitudinalScheduleLessons(
  ['clinica-1', 'clinica-2', 'clinica-3', 'clinica-4'],
  ['prev-1', 'prev-2'],
), ['clinica-1', 'prev-1', 'clinica-2', 'clinica-3', 'prev-2', 'clinica-4']);
const dailySlots = buildScheduleDaySlots({
  startDate:'2026-08-03',
  studyDays:[1,3,5],
  weeksCount:2,
});
assert.equal(dailySlots.slots.length, 6);
assert.deepEqual([...new Set(dailySlots.slots.map(slot => slot.weekday))], [1,3,5]);
assert.equal(dailySlots.days.length, 14);
assert.equal(dailySlots.days.filter(day => !day.planDay).length, 8);
const dailyEffortSchedule = buildDailyEffortSchedule({
  lessons:Array.from({ length:6 }, (_, index) => ({ id:`daily-${index}`, durationSeconds:1800 })),
  startDate:'2026-08-03',
  studyDays:[1,3,5],
  weeksCount:2,
});
assert.equal(dailyEffortSchedule.slots.length, 6);
assert.equal(dailyEffortSchedule.days.length, 14);
assert.equal(dailyEffortSchedule.days.flatMap(day => day.lessons).length, 6);
assert.equal(dailyEffortSchedule.days.filter(day => !day.planDay).length, 8);
assert.equal(dailyEffortSchedule.days.filter(day => !day.planDay).flatMap(day => day.lessons).length, 0);
const scheduleEffortFixture = Array.from({ length:4 }, (_, index) => ({ id:`effort-${index}`, durationSeconds:5 * 3600 }));
const scheduleEffort = calculateScheduleEffort(scheduleEffortFixture);
assert.equal(scheduleEffort.totalEffortSeconds, 20 * 3600);
assert.equal(resolveScheduleWeeksCount({
  effortHours:5,
  fallbackWeeks:24,
  goalMode:'effort',
  totalEffortSeconds:scheduleEffort.totalEffortSeconds,
}), 4);
assert.equal(resolveScheduleWeeksCount({
  cadence:'daily',
  effortHours:2,
  fallbackWeeks:24,
  goalMode:'effort',
  studyDays:[1,2,3,4,5],
  totalEffortSeconds:scheduleEffort.totalEffortSeconds,
}), 2);
assert.equal(resolveScheduleWeeksCount({
  endDate:'2026-08-30',
  fallbackWeeks:24,
  goalMode:'date',
  startDate:'2026-08-03',
}), 4);
const deadlineDailySlots = buildScheduleDaySlots({
  endDate:'2026-08-12',
  startDate:'2026-08-03',
  studyDays:[1,3,5],
  weeksCount:2,
});
assert.equal(deadlineDailySlots.slots.length, 5);
assert.equal(deadlineDailySlots.slots.at(-1).dateKey, '2026-08-12');
const famedCourseLessonsFixture = [
  { id:'asma', docId:'asma-doc', subject:'Pneumologia', title:'Asma: diagnóstico e manejo', courseIndex:2, aula:{ bunny_id:'bunny-asma' } },
  { id:'dpoc', docId:'dpoc-doc', subject:'Pneumologia', title:'DPOC', courseIndex:1, aula:{} },
  { id:'asma-ped', subject:'Pediatria', title:'Asma na infância', courseIndex:0, aula:{} },
];
assert.deepEqual(resolveFamedCourseLessons(
  'pneumo-dpoc-asma',
  famedCourseLessonsFixture,
  { links:{ 'pneumo-dpoc-asma':['bunny-asma','dpoc-doc'] } },
).map(lesson => lesson.id), ['dpoc', 'asma']);
assert.deepEqual(resolveFamedCourseLessons(
  'pneumo-dpoc-asma',
  [
    { id:'asma', subject:'Pneumologia', title:'Asma: diagnóstico e manejo', courseIndex:2 },
    { id:'dpoc', subject:'Pneumologia', title:'DPOC', courseIndex:1 },
  ],
).map(lesson => lesson.id), []);
const famedCatalogExportFixture = buildFamedCourseCatalogExport({
  courseLessons:famedCourseLessonsFixture,
  scheduleItems:[{ id:'pneumo-dpoc-asma', discipline:'Pneumologia', sequence:1, kind:'lesson', title:'DPOC e asma' }],
  exportedAt:'2026-08-01T12:00:00.000Z',
});
assert.equal(famedCatalogExportFixture.schema, 'agora-famed-course-catalog-v1');
assert.deepEqual(famedCatalogExportFixture.courseLessons.map(lesson => lesson.title), ['Asma na infância', 'DPOC', 'Asma: diagnóstico e manejo']);
assert.deepEqual(famedCatalogExportFixture.courseLessons[2].stableIds, ['asma-doc','asma','bunny-asma']);
assert.equal('transcript' in famedCatalogExportFixture.courseLessons[0], false);
const famedCourseCatalogSnapshot = JSON.parse(await readFile(
  new URL('../data/famed/course-catalog.snapshot.json', import.meta.url),
  'utf8',
));
const clinicalPriorityCuration = JSON.parse(await readFile(
  new URL('../data/famed/course-clinical-priority.v3.json', import.meta.url),
  'utf8',
));
assert.equal(famedCourseCatalogSnapshot.schema, 'agora-famed-course-catalog-v1');
assert.equal(famedCourseCatalogSnapshot.courseLessons.length, FAMED_COURSE_LESSON_MAP.catalogSnapshot.lessons);
assert.equal(famedCourseCatalogSnapshot.exportedAt, FAMED_COURSE_LESSON_MAP.catalogSnapshot.exportedAt);
const clinicalPrioritySchedule = buildClinicalPrioritySchedule(famedCourseCatalogSnapshot.courseLessons);
const curatedClinicalPriorityIndexes = clinicalPriorityCuration.units.flatMap(unit => unit.lessons);
assert.equal(clinicalPriorityCuration.schema, 'agora-course-clinical-priority-v1');
assert.equal(COURSE_CLINICAL_PRIORITY_VERSION, 'generalist-clinical-priority-v3');
assert.equal(clinicalPriorityCuration.version, COURSE_CLINICAL_PRIORITY_VERSION);
assert.equal(clinicalPriorityCuration.units.length, 128);
assert.equal(new Set(clinicalPriorityCuration.units.map(unit => unit.id)).size, clinicalPriorityCuration.units.length);
assert.equal(COURSE_CLINICAL_PRIORITY_CATALOG_SIZE, famedCourseCatalogSnapshot.courseLessons.length);
assert.equal(clinicalPrioritySchedule.length, famedCourseCatalogSnapshot.courseLessons.length);
assert.equal(new Set(clinicalPrioritySchedule.map(lesson => lesson.courseOrder)).size, clinicalPrioritySchedule.length);
assert.equal(curatedClinicalPriorityIndexes.length, famedCourseCatalogSnapshot.courseLessons.length);
assert.equal(new Set(curatedClinicalPriorityIndexes).size, curatedClinicalPriorityIndexes.length);
assert.deepEqual(clinicalPrioritySchedule.map(lesson => lesson.courseIndex), curatedClinicalPriorityIndexes);
assert.equal(clinicalPrioritySchedule[0].title, 'Parada Cardiorrespiratória e Cadeia de Sobrevivência');
const clinicalPriorityFirstFortyTitles = clinicalPrioritySchedule.slice(0, 40).map(lesson => lesson.title);
[
  'Diabetes: Introdução, Fisiologia e Classificação',
  'Noções de Espirometria e Asma',
  'Sepse e Choque Séptico',
  'Eletrocardiograma Normal: Fundamentos para Taquiarritmias',
  'Diagnóstico e Classificação da Hipertensão Arterial',
  'Trauma: Preparação, Triagem e Mortalidade',
  'Pneumonia Adquirida na Comunidade e Hospitalar',
  'Assistência Pré-Natal',
  'Tromboembolismo Pulmonar (TEP) e Trombose Venosa Profunda (TVP)',
].forEach(title => assert.equal(clinicalPriorityFirstFortyTitles.includes(title), true, `Tema clínico prioritário ausente do início: ${title}`));
const clinicalPriorityPosition = new Map(curatedClinicalPriorityIndexes.map((courseIndex, position) => [courseIndex, position]));
clinicalPriorityCuration.multipartGroups.forEach(group => group.forEach((courseIndex, index) => {
  if (!index) return;
  assert.equal(
    clinicalPriorityPosition.get(courseIndex),
    clinicalPriorityPosition.get(group[index - 1]) + 1,
    `Partes separadas no curso: ${group.join(', ')}`,
  );
}));
clinicalPriorityCuration.prerequisites.forEach(([prerequisite, dependent]) => assert.ok(
  clinicalPriorityPosition.get(prerequisite) < clinicalPriorityPosition.get(dependent),
  `Pré-requisito ${prerequisite} deve anteceder ${dependent}`,
));
const initialTraumaUnit = clinicalPriorityCuration.units.find(unit => unit.id === 'initial-trauma');
assert.ok(initialTraumaUnit.lessons.length >= 4);
assert.equal(new Set(initialTraumaUnit.lessons.map(courseIndex =>
  famedCourseCatalogSnapshot.courseLessons.find(lesson => lesson.courseIndex === courseIndex)?.subject
)).size, 1);
const changedClinicalCatalog = [...famedCourseCatalogSnapshot.courseLessons].reverse().map((lesson, index) =>
  index === 0 ? { ...lesson, title:`${lesson.title} (alterada)` } : lesson
);
assert.deepEqual(buildClinicalPrioritySchedule(changedClinicalCatalog), changedClinicalCatalog);
const famedSnapshotIds = new Set(famedCourseCatalogSnapshot.courseLessons.flatMap(lesson => lesson.stableIds || []).map(String));
Object.values(FAMED_COURSE_LESSON_MAP.links).flat().forEach(lessonId => {
  assert.equal(famedSnapshotIds.has(String(lessonId)), true, `Vínculo FAMED ausente do snapshot: ${lessonId}`);
});
const famedSnapshotScheduleLessons = famedCourseCatalogSnapshot.famedSchedule
  .filter(item => item.kind === 'lesson')
  .map(item => item.scheduleItemId)
  .sort();
const famedClassifiedScheduleLessons = [
  ...Object.keys(FAMED_COURSE_LESSON_MAP.links),
  ...Object.keys(FAMED_COURSE_LESSON_MAP.unmapped),
].sort();
assert.deepEqual(famedClassifiedScheduleLessons, famedSnapshotScheduleLessons);
const famedSnapshotLessonByStableId = new Map(famedCourseCatalogSnapshot.courseLessons.flatMap(lesson =>
  (lesson.stableIds || []).map(stableId => [String(stableId), lesson])
));
const famedSnapshotScheduleById = new Map(famedCourseCatalogSnapshot.famedSchedule.map(item => [item.scheduleItemId, item]));
Object.entries(FAMED_COURSE_LESSON_MAP.links).forEach(([scheduleItemId, lessonIds]) => {
  const scheduleItem = famedSnapshotScheduleById.get(scheduleItemId);
  const linkedLessons = lessonIds.map(lessonId => famedSnapshotLessonByStableId.get(String(lessonId)));
  assert.equal(linkedLessons.every(lesson => lesson?.subject === scheduleItem?.discipline), true, `Matéria divergente no vínculo ${scheduleItemId}`);
  assert.deepEqual(
    linkedLessons.map(lesson => lesson.courseIndex),
    linkedLessons.map(lesson => lesson.courseIndex).sort((left,right) => left - right),
    `Ordem divergente no vínculo ${scheduleItemId}`,
  );
});

const ecgQuestionIndex = JSON.parse(await readFile(
  new URL('../public/ecg/v3/question-match-index.json', import.meta.url),
  'utf8',
));
assert.equal(ecgQuestionIndex.matchingVersion, ECG_QUESTION_MATCH_VERSION);
assert.equal(ecgQuestionIndex.cases.length, 150);
assert.equal(ecgQuestionIndex.concepts.length, 89);
const ecgUsage = new Map();
const visualAfQuestion = {
  id:'ecg-fa-1',
  statement:'Analise o ECG abaixo e assinale o diagnóstico mais provável.',
  options:[
    { letter:'A', text:'Fibrilação atrial', isCorrect:true },
    { letter:'B', text:'Flutter atrial', isCorrect:false },
  ],
};
const visualAfMatch = enrichQuestionWithEcgImage(visualAfQuestion, ecgQuestionIndex, {
  usageByConcept:ecgUsage,
});
assert.equal(visualAfMatch.status, 'matched');
assert.equal(visualAfMatch.match.conceptId, 'ecg.arrhythmia.af');
assert.equal(visualAfMatch.question.ecgMatch.confidence, 'high');
assert.equal(questionHasEcgImage(visualAfMatch.question), true);
assert.deepEqual(Object.keys(visualAfMatch.question.images[0]).sort(), [
  'altText', 'height', 'id', 'phase', 'role', 'type', 'url', 'width',
]);
assert.equal('diagnosis' in visualAfMatch.question.images[0], false);
assert.equal('fullAnswer' in visualAfMatch.question.images[0], false);
const combinedEcgMatch = enrichQuestionWithEcgImage({
  id:'ecg-sinus-lbbb',
  statement:'Interprete o ECG apresentado e assinale o diagnóstico.',
  options:[{ letter:'A', text:'Ritmo sinusal com BRE', isCorrect:true }],
}, ecgQuestionIndex);
assert.equal(combinedEcgMatch.status, 'matched');
const combinedConceptIds = new Set(combinedEcgMatch.match.case.concepts.map(concept => concept.id));
assert.equal(combinedConceptIds.has('ecg.rhythm.sinus'), true);
assert.equal(combinedConceptIds.has('ecg.conduction.lbbb'), true);
assert.equal(enrichQuestionWithEcgImage({
  id:'ecg-ambiguous-infarct',
  statement:'Analise o ECG abaixo e indique o diagnóstico.',
  options:[{ letter:'A', text:'IAM anterior', isCorrect:true }],
}, ecgQuestionIndex).status, 'unresolved');
const secondVisualAfMatch = enrichQuestionWithEcgImage({
  ...visualAfQuestion,
  id:'ecg-fa-2',
}, ecgQuestionIndex, { usageByConcept:ecgUsage });
assert.equal(secondVisualAfMatch.status, 'matched');
assert.notEqual(secondVisualAfMatch.match.case.id, visualAfMatch.match.case.id);
assert.equal(questionRequestsEcgImage({
  id:'ecg-exam-request',
  statement:'Qual exame deve ser solicitado neste caso?',
  options:[{ letter:'A', text:'Eletrocardiograma', isCorrect:true }],
}), false);
const unresolvedVisual = enrichQuestionWithEcgImage({
  id:'ecg-unresolved',
  statement:'Observe o ECG abaixo e escolha a alternativa correta.',
  options:[{ letter:'A', text:'Alteração não classificada', isCorrect:true }],
}, ecgQuestionIndex);
assert.equal(unresolvedVisual.status, 'unresolved');
assert.equal(unresolvedVisual.question.visualRequirement.status, 'unresolved');
assert.equal(questionHasEcgImage(unresolvedVisual.question), false);
const preexistingVisualQuestion = {
  ...visualAfQuestion,
  images:[{ id:'existing', type:'ecg', url:'/custom/ecg.jpg' }],
};
assert.equal(
  enrichQuestionWithEcgImage(preexistingVisualQuestion, ecgQuestionIndex).question,
  preexistingVisualQuestion,
);
const enrichedVqFixture = enrichVqBlocksWithEcgImages({
  cardio:{
    meta:{ source:'shared-library' },
    blocks:{ main:{ questions:[visualAfQuestion, unresolvedVisual.question] } },
  },
}, ecgQuestionIndex);
assert.equal(enrichedVqFixture.changed, true);
assert.equal(enrichedVqFixture.report.required, 2);
assert.equal(enrichedVqFixture.report.matched, 1);
assert.equal(enrichedVqFixture.report.unresolved, 1);
assert.equal(enrichedVqFixture.vqBlocks.cardio.meta.ecgQuestionMatchVersion, ECG_QUESTION_MATCH_VERSION);
const [ecgRuntimeDataset, ecgCaseConceptMatrix] = await Promise.all([
  readFile(new URL('../public/ecg/v3/cases.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/ecg/staging/v3/globals/case-concept-matrix.json', import.meta.url), 'utf8').then(JSON.parse),
]);
const ecgPrimaryConceptByCase = new Map(ecgCaseConceptMatrix
  .filter(relation => relation.role === 'primary')
  .map(relation => [relation.caseId, relation.conceptId]));
let canonicalEcgMatches = 0;
let canonicalPrimarySupported = 0;
ecgRuntimeDataset.cases.forEach(item => {
  const result = enrichQuestionWithEcgImage({
    id:`canonical-${item.id}`,
    statement:'Analise o ECG abaixo e indique o diagnóstico.',
    options:[{ letter:'A', text:item.shortAnswer, isCorrect:true }],
  }, ecgQuestionIndex);
  if (result.status !== 'matched') return;
  canonicalEcgMatches += 1;
  if (result.match.case.concepts.some(concept =>
    concept.id === ecgPrimaryConceptByCase.get(item.id)
  )) canonicalPrimarySupported += 1;
});
assert.ok(canonicalEcgMatches >= 140, `Cobertura ECG canônica insuficiente: ${canonicalEcgMatches}/150`);
assert.equal(
  canonicalPrimarySupported,
  canonicalEcgMatches,
  `Um ECG associado não sustenta o conceito principal canônico: ${canonicalPrimarySupported}/${canonicalEcgMatches}`,
);

const metadataQuestions = Array.from({ length:81 }, (_, index) => ({
  id:`metadata-q-${index + 1}`,
  statement:`Questão de teste ${index + 1}`,
  options:[
    { letter:'A', text:'Correta', isCorrect:true },
    { letter:'B', text:'Incorreta', isCorrect:false },
  ],
}));
const metadataBatches = buildQuestionMetadataBatches(metadataQuestions);
assert.equal(QUESTION_METADATA_BATCH_SIZE, 30);
assert.deepEqual(metadataBatches.map(batch => batch.length), [30, 30, 21]);
assert.equal(questionSetSignature(metadataQuestions), questionSetSignature(metadataQuestions));
assert.notEqual(
  questionSetSignature(metadataQuestions),
  questionSetSignature([...metadataQuestions, { id:'nova', statement:'Nova questão' }]),
);

const metadataConcepts = normalizeConcepts([
  { id:'conduta', label:'Conduta', importance:5 },
  { id:'diagnostico', label:'Diagnóstico', importance:4 },
]);
const normalizedMetadata = normalizeQuestionMetadata({
  raw:{
    questionId:'metadata-q-1',
    conceptIds:['conduta'],
    primaryConceptId:'conduta',
    importance:5,
    learningRole:'core',
    qualityScore:92,
  },
  question:metadataQuestions[0],
  concepts:metadataConcepts,
  existing:{ manualOverrides:{ status:'reserve' } },
});
assert.equal(normalizedMetadata.status, 'reserve');
assert.equal(applyQuestionMetadataOverrides(normalizedMetadata).status, 'reserve');

const selectionMetadata = Object.fromEntries(metadataQuestions.slice(0, 4).map((question, index) => [
  question.id,
  {
    ...normalizedMetadata,
    questionId:question.id,
    conceptIds:[index % 2 ? 'diagnostico' : 'conduta'],
    primaryConceptId:index % 2 ? 'diagnostico' : 'conduta',
    qualityScore:90 - index,
    status:index === 3 ? 'deprecated' : 'active',
    manualOverrides:{},
  },
]));
const metadataSelection = selectLearningQuestions({
  questions:metadataQuestions.slice(0, 4),
  metadataByQuestion:selectionMetadata,
  concepts:metadataConcepts,
});
assert.ok(metadataSelection.essential.length >= 2);
assert.equal(metadataSelection.disabled.length, 1);
assert.equal(metadataSelection.totals.available, 4);
assert.equal(QUESTION_METADATA_VERSION, 2);
assert.equal(QUESTION_METADATA_ANALYSIS_VERSION, 'agora-question-metadata-v2');
assert.equal(LEARNING_SELECTION_VERSION, 'agora-learning-selection-v2');
const calibrationQuestions = Array.from({ length:20 }, (_, index) => ({
  ...metadataQuestions[index],
  id:`calibration-${index + 1}`,
}));
const calibrationConcepts = Array.from({ length:4 }, (_, index) => ({
  id:`concept-${index + 1}`,
  label:`Conceito ${index + 1}`,
  importance:5,
}));
const calibrationMetadata = Object.fromEntries(calibrationQuestions.map((question, index) => [
  question.id,
  {
    ...normalizedMetadata,
    questionId:question.id,
    conceptIds:[calibrationConcepts[index % calibrationConcepts.length].id],
    primaryConceptId:calibrationConcepts[index % calibrationConcepts.length].id,
    learningRole:index === calibrationQuestions.length - 1 ? 'variation' : 'core',
    status:'active',
    manualOverrides:{},
  },
]));
const calibratedSelection = selectLearningQuestions({
  questions:calibrationQuestions,
  metadataByQuestion:calibrationMetadata,
  concepts:calibrationConcepts,
});
assert.equal(calibratedSelection.essential.length, 5);
assert.ok(calibratedSelection.reserve.some(row => row.question.id === 'calibration-20'));
assert.match(buildConceptAnalysisPrompt({ title:'Aula' }), /no máximo 25% dos conceitos/);
assert.match(buildQuestionMetadataPrompt({ item:{}, concepts:[], questions:[], batchIndex:0, batchCount:1 }), /Não use core como padrão/);
const protectedReserveSelection = selectLearningQuestions({
  questions:metadataQuestions.slice(4, 6),
  metadataByQuestion:{
    'metadata-q-5':{ ...normalizedMetadata, questionId:'metadata-q-5', status:'reserve', manualOverrides:{} },
    'metadata-q-6':{ ...normalizedMetadata, questionId:'metadata-q-6', status:'active', learningRole:'exam_only', manualOverrides:{} },
  },
  concepts:metadataConcepts,
});
assert.equal(protectedReserveSelection.essential.length, 0);
assert.equal(protectedReserveSelection.reserve.length, 2);
const learningSelectionSnapshot = buildLearningSelectionSnapshot({
  selection:metadataSelection,
  questionSignature:questionSetSignature(metadataQuestions.slice(0, 4)),
  publishedAt:12345,
});
assert.equal(learningSelectionSnapshot.publishedAt, 12345);
assert.equal(Object.keys(learningSelectionSnapshot.questionPolicies).length, 4);
assert.equal(learningSelectionSnapshot.questionPolicies['metadata-q-4'].tier, 'disabled');
const siblingSelectionSnapshot = buildLearningSelectionSnapshot({
  selection:{
    essential:[{
      question:metadataQuestions[0],
      metadata:{
        ...normalizedMetadata,
        redundancyClusterId:'cluster-sibling',
        canonicalQuestionId:'metadata-q-1',
      },
    }],
    complementary:[],
    reserve:[],
    disabled:[],
    totals:{ available:1, essential:1 },
  },
  questionSignature:'siblings',
});
assert.equal(siblingSelectionSnapshot.questionPolicies['metadata-q-1'].redundancyClusterId, 'cluster-sibling');
assert.equal(siblingSelectionSnapshot.questionPolicies['metadata-q-1'].canonicalQuestionId, 'metadata-q-1');

const rotatedKeyCalls = [];
let rotateCount = 0;
const rotatedResult = await executeGeminiRotation({
  keys:[{ k:'key-a' }, { k:'key-b' }],
  retryDelayMs:0,
  rotate:async () => { rotateCount += 1; },
  invoke:async key => {
    rotatedKeyCalls.push(key.k);
    if (key.k === 'key-a') throw new Error('QUOTA_EXCEEDED');
    return 'ok';
  },
});
assert.equal(rotatedResult, 'ok');
assert.deepEqual(rotatedKeyCalls, ['key-a', 'key-b']);
assert.equal(rotateCount, 2);

let invalidJsonAttempts = 0;
const validatedRotationResult = await executeGeminiRotation({
  keys:[{ k:'key-a' }, { k:'key-b' }],
  retryDelayMs:0,
  retryableErrors:['METADATA_JSON_INVALID'],
  invoke:async () => (++invalidJsonAttempts === 1 ? 'cortado' : '{"ok":true}'),
  validateResult:text => {
    try {
      return JSON.parse(text);
    } catch(error) {
      throw new Error('METADATA_JSON_INVALID');
    }
  },
});
assert.deepEqual(validatedRotationResult, { ok:true });
assert.equal(invalidJsonAttempts, 2);

let nonRetryableAttempts = 0;
await assert.rejects(() => executeGeminiRotation({
  keys:[{ k:'key-a' }, { k:'key-b' }],
  retryDelayMs:0,
  invoke:async () => {
    nonRetryableAttempts += 1;
    throw new Error('REQUEST_INVALID');
  },
}), /REQUEST_INVALID/);
assert.equal(nonRetryableAttempts, 1);

let singleKeyAttempts = 0;
const singleKeyResult = await executeGeminiRotation({
  keys:[{ k:'only-key' }],
  minimumAttempts:2,
  retryDelayMs:0,
  invoke:async () => {
    singleKeyAttempts += 1;
    if (singleKeyAttempts === 1) throw new Error('REQUEST_TIMEOUT');
    return 'recovered';
  },
});
assert.equal(singleKeyResult, 'recovered');
assert.equal(singleKeyAttempts, 2);

let externalPoolLabel = '';
await executeGeminiRotation({
  keys:[{ k:'site-key', keyLabel:'Chave gk_test_8' }],
  retryDelayMs:0,
  onAttempt:({ keyLabel }) => { externalPoolLabel = keyLabel; },
  invoke:async () => 'ok',
});
assert.equal(externalPoolLabel, 'Chave gk_test_8');

const reviewNow = Date.UTC(2026, 6, 31, 12);
const reviewCard = createReviewQueueItem({
  source:'curso', aulaId:'aula-1', blockId:'diretas', qId:'q-1',
  question:{ id:'q-1', statement:'Questão' }, now:reviewNow,
});
reviewCard.learningPolicy = { tier:'essential', reviewEligible:true, status:'active' };
reviewCard.adaptiveState = 'core';
assert.equal(reviewCard.cardKey, buildReviewCardKey({ source:'curso', aulaId:'aula-1', qId:'q-1' }));
assert.equal(reviewCard.schedulerVersion, REVIEW_SCHEDULER_VERSION);
assert.equal(reviewCard.dueDate, reviewNow + 3 * REVIEW_DAY_MS);
const advancedReviewCard = scheduleReviewOutcome({ item:reviewCard, correct:true, now:reviewCard.dueDate });
assert.equal(advancedReviewCard.interval, 1);
assert.equal(advancedReviewCard.reps, 1);
assert.equal(advancedReviewCard.dueDate, reviewCard.dueDate + 7 * REVIEW_DAY_MS);
const failedReviewCard = scheduleReviewOutcome({ item:advancedReviewCard, correct:false, now:advancedReviewCard.dueDate });
assert.equal(failedReviewCard.interval, 0);
assert.equal(failedReviewCard.lapses, 1);
const lessonSeed = selectLessonReviewSeed([
  { blockId:'a', questions:[{id:'a1'},{id:'a2'},{id:'a3'}], answers:{} },
  { blockId:'b', questions:[{id:'b1'},{id:'b2'}], answers:{} },
], 4);
assert.deepEqual(lessonSeed.map(row => row.question.id), ['a1','b1','a2','b2']);
const reviewQueueSummary = summarizeReviewQueue({ aula:{ block:{ q1:reviewCard, q2:advancedReviewCard } } }, reviewNow);
assert.equal(reviewQueueSummary.total, 2);
assert.equal(reviewQueueSummary.due, 0);
assert.equal(reviewQueueSummary.nextDue, reviewCard.dueDate);
assert.equal(reviewQueueSummary.fsrs.compared, 0);
const firstFsrsState = advanceFsrsCard({
  correct:true,
  legacyDue:reviewNow + 7 * REVIEW_DAY_MS,
  now:reviewNow,
});
assert.equal(firstFsrsState.version, FSRS_SCHEDULER_VERSION);
assert.equal(firstFsrsState.mode, 'active');
assert.equal(firstFsrsState.intervalDays, 3);
assert.equal(firstFsrsState.nextDue, reviewNow + 3 * REVIEW_DAY_MS);
const completedOneTimeCard = completeCourseReviewFirstExposure({
  item:{
    ...reviewCard,
    source:'curso',
    learningPolicy:{ tier:'complementary' },
    fsrs:firstFsrsState,
  },
  correct:false,
  now:reviewNow + 10,
});
assert.equal(completedOneTimeCard.adaptiveState, 'completed-once');
assert.equal(completedOneTimeCard.dueDate, null);
assert.equal(completedOneTimeCard.lapses, 1);
assert.equal(completedOneTimeCard.fsrs, firstFsrsState);
const secondFsrsState = advanceFsrsCard({
  previous:firstFsrsState,
  correct:true,
  legacyDue:firstFsrsState.nextDue + 14 * REVIEW_DAY_MS,
  now:firstFsrsState.nextDue,
});
assert.ok(secondFsrsState.intervalDays > firstFsrsState.intervalDays);
assert.equal(secondFsrsState.card.reps, 2);
assert.equal(compareFsrsWithLegacy({ legacyDue:reviewNow + 7 * REVIEW_DAY_MS, fsrsState:firstFsrsState }).deltaDays, -4);
const fsrsSummary = summarizeReviewQueue({ aula:{ block:{ q1:{...advancedReviewCard,fsrs:firstFsrsState} } } }, reviewNow);
assert.equal(fsrsSummary.fsrs.compared, 1);
assert.equal(fsrsSummary.fsrs.earlier, 1);

const migrationQuestion = id => ({
  id,
  statement:`Questão ${id}`,
  options:[
    { letter:'A', text:'Certa', isCorrect:true },
    { letter:'B', text:'Errada', isCorrect:false },
  ],
});
assert.deepEqual(REVIEW_FIRST_EXPOSURE_WAVES, [
  { percentage:35, dayOffset:0 },
  { percentage:30, dayOffset:1 },
  { percentage:20, dayOffset:4 },
  { percentage:10, dayOffset:8 },
  { percentage:5, dayOffset:15 },
]);
assert.equal(INDIVIDUAL_REVIEW_PLAN_VERSION, 'curated-progressive-essential-fsrs-v9');
assert.deepEqual(allocateReviewFirstExposureWaves(70).map(wave => wave.count), [25,21,14,7,3]);
assert.equal(allocateReviewFirstExposureWaves(70).reduce((sum, wave) => sum + wave.count, 0), 70);
assert.deepEqual(orderReviewFirstExposureRows([
  { qId:'concept-a-1', outcome:'unseen', sourceIndex:0, policy:{ tier:'complementary', primaryConceptId:'a', importance:4, qualityScore:80 } },
  { qId:'concept-a-2', outcome:'unseen', sourceIndex:1, policy:{ tier:'complementary', primaryConceptId:'a', importance:4, qualityScore:80 } },
  { qId:'concept-b', outcome:'unseen', sourceIndex:2, policy:{ tier:'complementary', primaryConceptId:'b', importance:4, qualityScore:80 } },
]).map(row => row.qId), ['concept-a-1','concept-b','concept-a-2']);
const siblingDistribution = distributeReviewFirstExposureRows([
  { qId:'sister-1', policy:{ redundancyClusterId:'cluster-a', primaryConceptId:'a', conceptIds:['a'] } },
  { qId:'sister-2', policy:{ redundancyClusterId:'cluster-a', primaryConceptId:'a', conceptIds:['a'] } },
  { qId:'sister-3', policy:{ redundancyClusterId:'cluster-a', primaryConceptId:'a', conceptIds:['a'] } },
  { qId:'other-1', policy:{ primaryConceptId:'b', conceptIds:['b'] } },
  { qId:'other-2', policy:{ primaryConceptId:'c', conceptIds:['c'] } },
  { qId:'other-3', policy:{ primaryConceptId:'d', conceptIds:['d'] } },
  { qId:'other-4', policy:{ primaryConceptId:'e', conceptIds:['e'] } },
  { qId:'other-5', policy:{ primaryConceptId:'f', conceptIds:['f'] } },
], allocateReviewFirstExposureWaves(8));
assert.deepEqual(siblingDistribution.map(bucket => bucket.rows.length), [3,2,2,1,0]);
assert.deepEqual(siblingDistribution
  .map((bucket, bucketIndex) => bucket.rows.some(row => row.qId === 'sister-1') ? bucketIndex : null)
  .filter(index => index != null), [0]);
assert.deepEqual(['sister-1', 'sister-2', 'sister-3'].map(qId =>
  siblingDistribution.findIndex(bucket => bucket.rows.some(row => row.qId === qId))
), [0,1,2]);
const sharedConceptDistribution = distributeReviewFirstExposureRows([
  { qId:'shared-1', policy:{ primaryConceptId:'a', conceptIds:['shared', 'a'] } },
  { qId:'shared-2', policy:{ primaryConceptId:'b', conceptIds:['shared', 'b'] } },
  { qId:'different', policy:{ primaryConceptId:'c', conceptIds:['c'] } },
], allocateReviewFirstExposureWaves(3));
assert.notEqual(
  sharedConceptDistribution.findIndex(bucket => bucket.rows.some(row => row.qId === 'shared-1')),
  sharedConceptDistribution.findIndex(bucket => bucket.rows.some(row => row.qId === 'shared-2')),
);
const individualPlan = buildWatchedLessonsIndividualPlan({
  now:reviewNow,
  lessons:[
    {
      aulaId:'watched-1', aulaTitle:'Aula 1', subject:'Cardiologia', topic:'ECG',
      aulaData:{ blocks:{ main:{
        questions:[migrationQuestion('w1'), migrationQuestion('u1'), migrationQuestion('c1')],
        answers:{ w1:'B', c1:'A' },
        errorNotebook:['w1'],
      } } },
    },
    {
      aulaId:'watched-2', aulaTitle:'Aula 2', subject:'Clínica', topic:'Choque',
      aulaData:{ blocks:{ main:{ questions:[migrationQuestion('u2'), migrationQuestion('c2')], answers:{ c2:'A' } } } },
    },
  ],
});
assert.equal(individualPlan.added, 0);
assert.equal(individualPlan.adaptive.awaitingCuration, 5);
assert.deepEqual(individualPlan.counts, { wrong:0, unseen:0, correct:0 });
assert.equal(individualPlan.queue['watched-1'], undefined);
assert.equal(individualPlan.queue['watched-2'], undefined);
const repeatedIndividualPlan = buildWatchedLessonsIndividualPlan({
  now:reviewNow,
  lessons:[{ aulaId:'watched-1', aulaData:{ blocks:{ main:{
    questions:[migrationQuestion('w1')],
    answers:{ w1:'B' },
    errorNotebook:['w1'],
  } } } }],
  existingQueue:individualPlan.queue,
});
assert.equal(repeatedIndividualPlan.added, 0);
assert.equal(repeatedIndividualPlan.changed, 0);
const parkedLegacyPlan = buildWatchedLessonsIndividualPlan({
  now:reviewNow,
  lessons:[{ aulaId:'watched-legacy', aulaData:{ blocks:{ main:{ questions:[migrationQuestion('legacy')] } } } }],
  existingQueue:{ 'watched-legacy':{ main:{ legacy:{
    source:'curso',
    cardKey:'course/watched-legacy/legacy',
    dueDate:reviewNow + 1234,
    adaptiveState:'core',
  } } } },
});
assert.equal(parkedLegacyPlan.queue['watched-legacy'].main.legacy.dueDate, null);
assert.equal(parkedLegacyPlan.queue['watched-legacy'].main.legacy.parkedDueDate, reviewNow + 1234);
assert.equal(parkedLegacyPlan.queue['watched-legacy'].main.legacy.adaptiveState, 'awaiting-curation');
const curatedPlan = buildWatchedLessonsIndividualPlan({
  now:reviewNow,
  lessons:[{
    aulaId:'curated-1',
    aulaTitle:'Aula curada',
    subject:'Cardiologia',
    topic:'Arritmias',
    aulaData:{ blocks:{ main:{
      questions:[
        { ...migrationQuestion('essential'), learningPolicy:{ tier:'essential', conceptIds:['ritmo'], importance:5 } },
        { ...migrationQuestion('support'), learningPolicy:{ tier:'complementary', conceptIds:['ritmo'], importance:4 } },
        { ...migrationQuestion('reserve'), learningPolicy:{ tier:'reserve', conceptIds:['ritmo'], importance:2 } },
        { ...migrationQuestion('disabled'), learningPolicy:{ tier:'disabled', conceptIds:['ritmo'], reviewEligible:false } },
        { ...migrationQuestion('prior-wrong'), learningPolicy:{ tier:'complementary', conceptIds:['bloqueio'], importance:4 } },
      ],
      answers:{ 'prior-wrong':'B' },
      errorNotebook:['prior-wrong'],
    } } },
  }],
});
assert.equal(curatedPlan.added, 4);
assert.equal(curatedPlan.adaptive.essential, 1);
assert.equal(curatedPlan.adaptive.remediation, 1);
assert.equal(curatedPlan.adaptive.complementaryScheduled, 1);
assert.equal(curatedPlan.adaptive.reserveScheduled, 1);
assert.equal(curatedPlan.adaptive.complementaryWaiting, 0);
assert.equal(curatedPlan.adaptive.reserveWaiting, 0);
assert.equal(curatedPlan.adaptive.disabled, 1);
assert.ok(Number.isFinite(curatedPlan.queue['curated-1'].main.support.dueDate));
assert.equal(curatedPlan.queue['curated-1'].main.support.adaptiveState, 'introduction');
const progressiveLessonPlan = buildWatchedLessonsIndividualPlan({
  now:reviewNow,
  lessons:[{
    aulaId:'progressive-70',
    aulaTitle:'Aula com 70 questões',
    subject:'Cardiologia',
    topic:'Teste progressivo',
    aulaData:{ blocks:{ main:{
      questions:Array.from({ length:70 }, (_, index) => ({
        ...migrationQuestion(`progressive-${String(index).padStart(2, '0')}`),
        learningPolicy:{
          tier:index < 10 ? 'essential' : index < 55 ? 'complementary' : 'reserve',
          conceptIds:[`concept-${index % 12}`],
          primaryConceptId:`concept-${index % 12}`,
          importance:index < 10 ? 5 : index < 55 ? 4 : 2,
          qualityScore:100 - index,
          learningRole:index < 10 ? 'core' : index < 55 ? 'reinforcement' : 'variation',
          reviewEligible:true,
          status:'active',
        },
      })),
    } } },
  }],
});
assert.equal(progressiveLessonPlan.added, 70);
assert.deepEqual(progressiveLessonPlan.introduction.buckets.map(bucket => bucket.count), [25,21,14,7,3]);
assert.equal(summarizeReviewQueue(progressiveLessonPlan.queue, reviewNow).total, 70);
const progressiveForecast = buildReviewForecast(progressiveLessonPlan.queue, { now:reviewNow, days:16 });
assert.equal(progressiveForecast.days[0].total, 25);
assert.equal(progressiveForecast.days[1].total, 21);
assert.equal(progressiveForecast.days[4].total, 14);
assert.equal(progressiveForecast.days[8].total, 7);
assert.equal(progressiveForecast.days[15].total, 3);
const progressiveItems = Object.values(progressiveLessonPlan.queue['progressive-70'].main);
assert.equal(progressiveItems.filter(item => item.adaptiveState === 'dormant').length, 0);
assert.ok(progressiveItems
  .filter(item => item.learningPolicy.tier === 'essential')
  .every(item => item.migration.firstExposure.bucketIndex === 0));
const siblingAwareLesson = {
  aulaId:'sibling-aware',
  aulaTitle:'Aula com questões irmãs',
  subject:'Cardiologia',
  topic:'Valvopatias',
  aulaData:{ blocks:{ main:{
    questions:[
      ...['sister-1', 'sister-2', 'sister-3'].map((id, index) => ({
        ...migrationQuestion(id),
        learningPolicy:{
          tier:'essential',
          conceptIds:['estenose-aortica'],
          primaryConceptId:'estenose-aortica',
          redundancyClusterId:'criterio-gravidade-ea',
          canonicalQuestionId:index ? 'sister-1' : null,
          importance:5,
          qualityScore:95 - index,
          learningRole:'core',
          reviewEligible:true,
          status:'active',
        },
      })),
      ...Array.from({ length:5 }, (_, index) => ({
        ...migrationQuestion(`different-${index}`),
        learningPolicy:{
          tier:'complementary',
          conceptIds:[`different-concept-${index}`],
          primaryConceptId:`different-concept-${index}`,
          importance:3,
          qualityScore:75 - index,
          learningRole:'reinforcement',
          reviewEligible:true,
          status:'active',
        },
      })),
    ],
  } } },
};
const siblingAwarePlan = buildWatchedLessonsIndividualPlan({
  now:reviewNow,
  lessons:[siblingAwareLesson],
});
const siblingAwareItems = siblingAwarePlan.queue['sibling-aware'].main;
assert.deepEqual(['sister-1', 'sister-2', 'sister-3'].map(qId =>
  siblingAwareItems[qId].migration.firstExposure.bucketIndex
), [0,1,2]);
assert.ok(['sister-1', 'sister-2', 'sister-3'].every(qId =>
  siblingAwareItems[qId].migration.firstExposure.siblingStrategy === 'metadata-v1'
));
const legacyV5Queue = JSON.parse(JSON.stringify(siblingAwarePlan.queue));
const legacyV5DueDates = {};
Object.entries(legacyV5Queue['sibling-aware'].main).forEach(([qId, item], index) => {
  item.dueDate = reviewNow + 1000 + index;
  item.migration.version = 'curated-progressive-essential-fsrs-v5';
  item.migration.firstExposure = {
    ...item.migration.firstExposure,
    version:'curated-progressive-essential-fsrs-v5',
    siblingStrategy:undefined,
  };
  legacyV5DueDates[qId] = item.dueDate;
});
const preservedLegacyV5Plan = buildWatchedLessonsIndividualPlan({
  now:reviewNow + 2000,
  existingQueue:legacyV5Queue,
  lessons:[siblingAwareLesson],
});
assert.deepEqual(
  Object.fromEntries(Object.entries(preservedLegacyV5Plan.queue['sibling-aware'].main)
    .map(([qId, item]) => [qId, item.dueDate])),
  legacyV5DueDates,
);
assert.ok(Object.values(preservedLegacyV5Plan.queue['sibling-aware'].main).every(item =>
  item.migration.firstExposure.version === INDIVIDUAL_REVIEW_PLAN_VERSION
  && item.migration.firstExposure.siblingStrategy === 'legacy-preserved'
));

// A v6 chegou a matricular novamente todo o estoque legado e a v7 ainda o
// ancorou em uma data antiga, transformando centenas de cartões em atrasados.
// A v9 devolve o núcleo antigo à agenda gradual e distribui o complemento
// legado pelos próximos 29 dias, visíveis na previsão de 30 dias.
const brokenReplanAt = reviewNow + 10 * REVIEW_DAY_MS;
const brokenV6Queue = JSON.parse(JSON.stringify(legacyV5Queue));
Object.entries(brokenV6Queue['sibling-aware'].main).forEach(([qId, item], index) => {
  const siblingExposure = siblingAwareItems[qId].migration.firstExposure;
  item.dueDate = brokenReplanAt + siblingExposure.dayOffset * REVIEW_DAY_MS + index;
  item.migration.version = 'curated-progressive-essential-fsrs-v6';
  item.migration.firstExposure = {
    ...siblingExposure,
    version:'curated-progressive-essential-fsrs-v6',
    plannedAt:brokenReplanAt,
  };
});
const recoveredV6Plan = buildWatchedLessonsIndividualPlan({
  now:brokenReplanAt + 2000,
  existingQueue:brokenV6Queue,
  lessons:[siblingAwareLesson],
});
const recoveredV6Items = recoveredV6Plan.queue['sibling-aware'].main;
assert.deepEqual(['sister-1', 'sister-2', 'sister-3'].map(qId =>
  recoveredV6Items[qId].migration.firstExposure.bucketIndex
), [null,null,null]);
assert.ok(['sister-1', 'sister-2', 'sister-3'].every(qId =>
  recoveredV6Items[qId].migration.firstExposure.siblingStrategy === 'legacy-schedule-restored'
  && recoveredV6Items[qId].migration.firstExposure.plannedAt === reviewNow
  && recoveredV6Items[qId].dueDate < reviewNow
));
assert.ok(['different-0', 'different-1', 'different-2', 'different-3', 'different-4'].every(qId =>
  recoveredV6Items[qId].adaptiveState === 'introduction'
  && recoveredV6Items[qId].dueDate > brokenReplanAt
  && recoveredV6Items[qId].migration.firstExposure.siblingStrategy === 'legacy-backlog-balanced-v1'
));

const brokenV7Queue = JSON.parse(JSON.stringify(brokenV6Queue));
Object.values(brokenV7Queue['sibling-aware'].main).forEach(item => {
  item.migration.version = 'curated-progressive-essential-fsrs-v7';
  item.migration.firstExposure = {
    ...item.migration.firstExposure,
    version:'curated-progressive-essential-fsrs-v7',
    siblingStrategy:'v6-calendar-recovery',
    plannedAt:reviewNow,
    recoveredAt:brokenReplanAt,
  };
  item.dueDate = reviewNow - REVIEW_DAY_MS;
});
const repairedV7Plan = buildWatchedLessonsIndividualPlan({
  now:brokenReplanAt + 3000,
  existingQueue:brokenV7Queue,
  lessons:[siblingAwareLesson],
});
assert.equal(Object.values(repairedV7Plan.queue['sibling-aware'].main)
  .filter(item => item.dueDate != null).length, 8);
assert.equal(Object.values(repairedV7Plan.queue['sibling-aware'].main)
  .filter(item => item.adaptiveState === 'dormant').length, 0);

// Regressão do caso real: centenas de complementares retroativas não podem
// substituir a carga gradual de 30 cartões do núcleo que já estava em curso,
// mas todas precisam ganhar uma data dentro da previsão de 30 dias.
const avalancheNow = reviewNow + 2 * REVIEW_DAY_MS;
const avalancheQuestions = [
  ...Array.from({ length:100 }, (_, index) => ({
    ...migrationQuestion(`legacy-core-${index}`),
    learningPolicy:{
      tier:'essential',
      conceptIds:[`core-${index}`],
      importance:5,
      qualityScore:90,
      reviewEligible:true,
      status:'active',
    },
  })),
  ...Array.from({ length:700 }, (_, index) => ({
    ...migrationQuestion(`legacy-extra-${index}`),
    learningPolicy:{
      tier:'complementary',
      conceptIds:[index < 3 ? 'legacy-sister-concept' : `extra-${index}`],
      primaryConceptId:index < 3 ? 'legacy-sister-concept' : `extra-${index}`,
      redundancyClusterId:index < 3 ? 'legacy-sister-cluster' : null,
      canonicalQuestionId:index > 0 && index < 3 ? 'legacy-extra-0' : null,
      importance:3,
      qualityScore:70,
      reviewEligible:true,
      status:'active',
    },
  })),
];
const avalancheQueue = { avalanche:{ main:Object.fromEntries(avalancheQuestions.map(question => [
  question.id,
  {
    source:'curso',
    cardKey:`course/avalanche/${question.id}`,
    question,
    learningPolicy:question.learningPolicy,
    adaptiveState:question.learningPolicy.tier === 'essential' ? 'core' : 'introduction',
    dueDate:reviewNow - REVIEW_DAY_MS,
    reps:0,
    lastReview:null,
    addedAt:reviewNow,
    migration:{
      version:'curated-progressive-essential-fsrs-v7',
      createdAt:reviewNow,
      firstExposure:{
        version:'curated-progressive-essential-fsrs-v7',
        siblingStrategy:'v6-calendar-recovery',
        plannedAt:reviewNow,
        recoveredAt:avalancheNow,
      },
    },
  },
])) } };
const repairedAvalanchePlan = buildWatchedLessonsIndividualPlan({
  now:avalancheNow,
  existingQueue:avalancheQueue,
  lessons:[{
    aulaId:'avalanche',
    aulaData:{ blocks:{ main:{ questions:avalancheQuestions } } },
  }],
});
const repairedAvalancheSummary = summarizeReviewQueue(repairedAvalanchePlan.queue, avalancheNow);
assert.equal(repairedAvalancheSummary.total, 800);
assert.equal(repairedAvalancheSummary.due, 30);
assert.equal(Object.values(repairedAvalanchePlan.queue.avalanche.main)
  .filter(item => item.adaptiveState === 'introduction').length, 700);
const repairedAvalancheForecast = buildReviewForecast(repairedAvalanchePlan.queue, { now:avalancheNow, days:30 });
assert.equal(repairedAvalancheForecast.beyondRange, 0);
assert.equal(
  repairedAvalancheForecast.days.reduce((sum, day) => sum + day.total, 0) + repairedAvalancheForecast.overdue,
  800,
);
assert.ok(Object.values(repairedAvalanchePlan.queue.avalanche.main)
  .filter(item => item.migration.firstExposure.siblingStrategy === 'legacy-backlog-balanced-v1')
  .every(item => item.dueDate > avalancheNow && item.dueDate < avalancheNow + 30 * REVIEW_DAY_MS));
assert.equal(new Set(['legacy-extra-0', 'legacy-extra-1', 'legacy-extra-2'].map(qId =>
  new Date(repairedAvalanchePlan.queue.avalanche.main[qId].dueDate).toISOString().slice(0, 10)
)).size, 3);
const repeatedAvalanchePlan = buildWatchedLessonsIndividualPlan({
  now:avalancheNow + 1000,
  existingQueue:repairedAvalanchePlan.queue,
  lessons:[{
    aulaId:'avalanche',
    aulaData:{ blocks:{ main:{ questions:avalancheQuestions } } },
  }],
});
assert.equal(repeatedAvalanchePlan.changed, 0);

// O reparo precisa considerar também os cartões já concluídos ao reconstruir
// as ondas antigas. Senão ele aplicaria novamente 35% apenas sobre o restante,
// que foi precisamente o motivo do salto na carga diária.
const partialBrokenAt = reviewNow + 2 * REVIEW_DAY_MS;
const partialBrokenV6Queue = JSON.parse(JSON.stringify(legacyV5Queue));
['sister-1', 'sister-2', 'sister-3', 'different-0', 'different-1'].forEach(qId => {
  const item = partialBrokenV6Queue['sibling-aware'].main[qId];
  item.reps = 1;
  item.lastReview = reviewNow + REVIEW_DAY_MS;
  if (qId.startsWith('different-')) {
    item.adaptiveState = 'completed-once';
    item.dueDate = null;
  }
});
['different-2', 'different-3', 'different-4'].forEach((qId, index) => {
  const item = partialBrokenV6Queue['sibling-aware'].main[qId];
  item.dueDate = partialBrokenAt + index;
  item.migration.version = 'curated-progressive-essential-fsrs-v6';
  item.migration.firstExposure = {
    ...item.migration.firstExposure,
    version:'curated-progressive-essential-fsrs-v6',
    bucketIndex:index,
    dayOffset:REVIEW_FIRST_EXPOSURE_WAVES[index].dayOffset,
    plannedAt:partialBrokenAt,
  };
});
const recoveredPartialV6Plan = buildWatchedLessonsIndividualPlan({
  now:partialBrokenAt + 2000,
  existingQueue:partialBrokenV6Queue,
  lessons:[siblingAwareLesson],
});
assert.deepEqual(['different-2', 'different-3', 'different-4'].map(qId =>
  recoveredPartialV6Plan.queue['sibling-aware'].main[qId].migration.firstExposure.bucketIndex
), [2,2,3]);
assert.ok(['different-2', 'different-3', 'different-4'].every(qId =>
  recoveredPartialV6Plan.queue['sibling-aware'].main[qId].dueDate > partialBrokenAt
));

// Cartões que nasceram corretamente na v6 têm criação e planejamento no mesmo
// instante e não devem perder a distribuição de irmãs ao receber o marcador v9.
const nativeV6Queue = JSON.parse(JSON.stringify(siblingAwarePlan.queue));
Object.values(nativeV6Queue['sibling-aware'].main).forEach(item => {
  item.migration.version = 'curated-progressive-essential-fsrs-v6';
  item.migration.firstExposure.version = 'curated-progressive-essential-fsrs-v6';
});
const preservedNativeV6Plan = buildWatchedLessonsIndividualPlan({
  now:reviewNow + 2000,
  existingQueue:nativeV6Queue,
  lessons:[siblingAwareLesson],
});
assert.deepEqual(['sister-1', 'sister-2', 'sister-3'].map(qId =>
  preservedNativeV6Plan.queue['sibling-aware'].main[qId].migration.firstExposure.bucketIndex
), [0,1,2]);

const reviewedSiblingQueue = JSON.parse(JSON.stringify(brokenV6Queue));
reviewedSiblingQueue['sibling-aware'].main['sister-2'].reps = 1;
reviewedSiblingQueue['sibling-aware'].main['sister-2'].lastReview = reviewNow - 1000;
reviewedSiblingQueue['sibling-aware'].main['sister-2'].dueDate = reviewNow + 123456;
const preservedReviewedSiblingPlan = buildWatchedLessonsIndividualPlan({
  now:brokenReplanAt + 2000,
  existingQueue:reviewedSiblingQueue,
  lessons:[siblingAwareLesson],
});
assert.equal(
  preservedReviewedSiblingPlan.queue['sibling-aware'].main['sister-2'].dueDate,
  reviewNow + 123456,
);
const repeatedProgressivePlan = buildWatchedLessonsIndividualPlan({
  now:reviewNow + 1000,
  existingQueue:progressiveLessonPlan.queue,
  lessons:[{
    aulaId:'progressive-70',
    aulaData:{ blocks:{ main:{ questions:progressiveItems.map(item => item.question) } } },
  }],
});
assert.equal(repeatedProgressivePlan.changed, 0);
const upgradedDormantPlan = buildWatchedLessonsIndividualPlan({
  now:reviewNow,
  lessons:[{
    aulaId:'legacy-eligible',
    aulaData:{ blocks:{ main:{ questions:[
      { ...migrationQuestion('support'), learningPolicy:{ tier:'complementary', conceptIds:['ritmo'], importance:4, qualityScore:80 } },
      { ...migrationQuestion('support-fsrs'), learningPolicy:{ tier:'complementary', conceptIds:['ritmo'], importance:3, qualityScore:70 } },
    ] } } },
  }],
  existingQueue:{ 'legacy-eligible':{ main:{
    support:{
      source:'curso',
      cardKey:'course/legacy-eligible/support',
      dueDate:null,
      adaptiveState:'dormant',
      learningPolicy:{ tier:'complementary', reviewEligible:true, status:'active' },
      migration:{ version:'curated-adaptive-individual-v3' },
    },
    'support-fsrs':{
      source:'curso',
      cardKey:'course/legacy-eligible/support-fsrs',
      dueDate:null,
      adaptiveState:'dormant',
      learningPolicy:{ tier:'complementary', reviewEligible:true, status:'active' },
      fsrs:firstFsrsState,
      migration:{ version:'curated-adaptive-individual-v3' },
    },
  } } },
});
assert.equal(upgradedDormantPlan.queue['legacy-eligible'].main.support.adaptiveState, 'introduction');
assert.ok(Number.isFinite(upgradedDormantPlan.queue['legacy-eligible'].main.support.dueDate));
assert.equal(upgradedDormantPlan.queue['legacy-eligible'].main['support-fsrs'].adaptiveState, 'completed-once');
assert.equal(upgradedDormantPlan.queue['legacy-eligible'].main['support-fsrs'].dueDate, null);
assert.equal(upgradedDormantPlan.queue['legacy-eligible'].main['support-fsrs'].fsrs, firstFsrsState);
const pausedLegacyOneTimePlan = buildWatchedLessonsIndividualPlan({
  now:reviewNow,
  lessons:[{
    aulaId:'paused-one-time',
    aulaData:{ blocks:{ main:{ questions:[{
      ...migrationQuestion('support-fsrs'),
      learningPolicy:{ tier:'complementary', conceptIds:['ritmo'] },
    }] } } },
  }],
  existingQueue:{ 'paused-one-time':{ main:{ 'support-fsrs':{
    source:'curso',
    cardKey:'course/paused-one-time/support-fsrs',
    dueDate:null,
    parkedDueDate:firstFsrsState.nextDue,
    adaptiveState:'paused',
    fsrs:firstFsrsState,
    reviewPause:{ adaptiveState:'longitudinal', dueDate:firstFsrsState.nextDue },
  } } } },
});
assert.equal(pausedLegacyOneTimePlan.queue['paused-one-time'].main['support-fsrs'].reviewPause.adaptiveState, 'completed-once');
const resumedLegacyOneTime = resumeReviewLesson({ queue:pausedLegacyOneTimePlan.queue, aulaId:'paused-one-time', now:reviewNow });
assert.equal(resumedLegacyOneTime.queue['paused-one-time'].main['support-fsrs'].adaptiveState, 'completed-once');
assert.equal(resumedLegacyOneTime.queue['paused-one-time'].main['support-fsrs'].dueDate, null);
const visualWaitingPlan = buildWatchedLessonsIndividualPlan({
  now:reviewNow,
  lessons:[{
    aulaId:'visual-waiting',
    aulaData:{ blocks:{ main:{ questions:[{
      ...unresolvedVisual.question,
      learningPolicy:{ tier:'essential', conceptIds:['ecg'], importance:5 },
    }] } } },
  }],
});
assert.equal(visualWaitingPlan.adaptive.awaitingVisual, 1);
assert.equal(visualWaitingPlan.queue['visual-waiting'].main['ecg-unresolved'].adaptiveState, 'awaiting-visual');
assert.equal(visualWaitingPlan.queue['visual-waiting'].main['ecg-unresolved'].dueDate, null);
assert.equal(summarizeReviewQueue(visualWaitingPlan.queue, reviewNow).total, 0);
const visualResolvedPlan = buildWatchedLessonsIndividualPlan({
  now:reviewNow + 1000,
  existingQueue:visualWaitingPlan.queue,
  lessons:[{
    aulaId:'visual-waiting',
    aulaData:{ blocks:{ main:{ questions:[{
      ...unresolvedVisual.question,
      visualRequirement:{ type:'ecg', status:'resolved' },
      ecgMatch:{ version:ECG_QUESTION_MATCH_VERSION, status:'resolved', caseId:'ECG005' },
      images:[visualAfMatch.question.images[0]],
      learningPolicy:{ tier:'essential', conceptIds:['ecg'], importance:5 },
    }] } } },
  }],
});
assert.equal(visualResolvedPlan.adaptive.essential, 1);
assert.equal(visualResolvedPlan.queue['visual-waiting'].main['ecg-unresolved'].adaptiveState, 'core');
assert.equal(questionHasEcgImage(visualResolvedPlan.queue['visual-waiting'].main['ecg-unresolved'].question), true);
const essentialDueBeforePause = curatedPlan.queue['curated-1'].main.essential.dueDate;
const pausedLesson = pauseReviewLesson({ queue:curatedPlan.queue, aulaId:'curated-1', now:reviewNow + 500 });
assert.equal(pausedLesson.changed, true);
assert.equal(pausedLesson.queue['curated-1'].main.essential.adaptiveState, 'paused');
assert.equal(pausedLesson.queue['curated-1'].main.essential.dueDate, null);
assert.equal(pausedLesson.queue['curated-1'].main.essential.parkedDueDate, essentialDueBeforePause);
assert.equal(summarizeReviewQueue(pausedLesson.queue, reviewNow).total, 0);
const pausedReconciledPlan = buildWatchedLessonsIndividualPlan({
  now:reviewNow + 1000,
  lessons:[{
    aulaId:'curated-1',
    aulaData:{ blocks:{ main:{ questions:[
      { ...migrationQuestion('essential'), learningPolicy:{ tier:'essential', conceptIds:['ritmo'] } },
      { ...migrationQuestion('support'), learningPolicy:{ tier:'complementary', conceptIds:['ritmo'] } },
      { ...migrationQuestion('new-essential'), learningPolicy:{ tier:'essential', conceptIds:['ritmo'] } },
    ] } } },
  }],
  existingQueue:pausedLesson.queue,
});
assert.equal(pausedReconciledPlan.queue['curated-1'].main.essential.adaptiveState, 'paused');
assert.equal(pausedReconciledPlan.queue['curated-1'].main.essential.dueDate, null);
assert.equal(pausedReconciledPlan.queue['curated-1'].main['new-essential'].adaptiveState, 'paused');
assert.equal(pausedReconciledPlan.queue['curated-1'].main['new-essential'].dueDate, null);
const resumedLesson = resumeReviewLesson({ queue:pausedReconciledPlan.queue, aulaId:'curated-1', now:reviewNow + 1500 });
assert.equal(resumedLesson.changed, true);
assert.equal(resumedLesson.queue['curated-1'].main.essential.adaptiveState, 'core');
assert.equal(resumedLesson.queue['curated-1'].main.essential.dueDate, essentialDueBeforePause);
assert.equal(resumedLesson.queue['curated-1'].main.support.adaptiveState, 'introduction');
assert.ok(Number.isFinite(resumedLesson.queue['curated-1'].main.support.dueDate));
const restoredCuratedPlan = buildWatchedLessonsIndividualPlan({
  now:reviewNow,
  lessons:[{
    aulaId:'curated-restore',
    aulaData:{ blocks:{ main:{ questions:[
      { ...migrationQuestion('essential'), learningPolicy:{ tier:'essential', conceptIds:['ritmo'] } },
    ] } } },
  }],
  existingQueue:{
    'curated-restore':{ main:{ essential:{
      source:'curso',
      cardKey:'course/curated-restore/essential',
      dueDate:null,
      parkedDueDate:reviewNow - 5000,
      adaptiveState:'awaiting-curation',
      learningPolicy:{ tier:'unclassified', reviewEligible:false },
    } } },
  },
});
assert.equal(restoredCuratedPlan.queue['curated-restore'].main.essential.dueDate, reviewNow - 5000);
assert.equal(restoredCuratedPlan.queue['curated-restore'].main.essential.parkedDueDate, null);
assert.equal(curatedPlan.queue['curated-1'].main.disabled.adaptiveState, 'disabled');
const retiredAdaptiveSupport = buildWatchedLessonsIndividualPlan({
  now:reviewNow + 500,
  lessons:[{
    aulaId:'curated-1',
    aulaData:{ blocks:{ main:{
      questions:[
        { ...migrationQuestion('essential'), learningPolicy:{ tier:'essential', conceptIds:['ritmo'], importance:5 } },
        { ...migrationQuestion('support'), learningPolicy:{ tier:'complementary', conceptIds:['ritmo'], importance:4 } },
      ],
    } } },
  }],
  existingQueue:{
    ...curatedPlan.queue,
    'curated-1':{
      ...curatedPlan.queue['curated-1'],
      main:{
        ...curatedPlan.queue['curated-1'].main,
        support:{
          ...curatedPlan.queue['curated-1'].main.support,
          adaptiveState:'remediation',
          dueDate:reviewNow + 1000,
          adaptiveActivation:{ reason:'related-error', activatedAt:reviewNow },
        },
      },
    },
  },
});
assert.equal(retiredAdaptiveSupport.queue['curated-1'].main.support.adaptiveState, 'introduction');
assert.notEqual(retiredAdaptiveSupport.queue['curated-1'].main.support.dueDate, reviewNow + 1000);
assert.equal(retiredAdaptiveSupport.queue['curated-1'].main.support.adaptiveActivation, undefined);

const disabledEntry = createDisabledCourseQuestionEntry({
  aulaId:'aula-visible',
  sharedLibraryItemId:'shared-lesson-1',
  question:migrationQuestion('bad-question'),
  disabledAt:reviewNow,
  disabledBy:'admin@example.com',
});
assert.ok(detectNonContentCourseQuestion({ statement:'Por que é importante estudar a anatomia do reto?' }));
assert.equal(
  detectNonContentCourseQuestion({ statement:'Qual é a finalidade desta aula sobre valvopatias?' })?.code,
  'lesson-purpose',
);
assert.equal(
  detectNonContentCourseQuestion({ statement:'Ao final desta aula, o aluno deverá compreender a circulação coronariana.' })?.code,
  'lesson-outcome',
);
assert.equal(
  detectNonContentCourseQuestion({ statement:'Qual é a relevância deste tema para a formação médica?' })?.code,
  'course-relevance',
);
assert.equal(
  detectNonContentCourseQuestion({ statement:'Qual é o principal motivo para abordar as valvopatias nesta aula?' })?.code,
  'course-relevance',
);
assert.equal(
  detectNonContentCourseQuestion({ statement:'Qual é a importância clínica da ausência das tênias colônicas para delimitar o reto?' }),
  null,
);
assert.equal(
  detectNonContentCourseQuestion({ statement:'Qual é a finalidade da colonoscopia no rastreamento do câncer colorretal?' }),
  null,
);
assert.equal(
  detectNonContentCourseQuestion({ statement:'Qual é a finalidade da abordagem cirúrgica na obstrução intestinal?' }),
  null,
);
assert.equal(
  detectNonContentCourseQuestion({ statement:'Qual é a importância do estudo histopatológico na doença inflamatória intestinal?' }),
  null,
);
assert.equal(
  detectNonContentCourseQuestion({ statement:'Qual é a importância do conhecimento do tipo sanguíneo antes da transfusão?' }),
  null,
);
assert.equal(
  detectNonContentCourseQuestion({ statement:'Qual é a importância do ácido fólico na formação do tubo neural?' }),
  null,
);
const nonContentMatches = findNonContentCourseQuestions([{
  id:'shared-lesson-meta',
  lessonId:'lesson-meta',
  title:'Aula de teste',
  directQuestions:[
    { id:'meta-1', statement:'Qual é a importância de compreender este tema para a formação médica?' },
    { id:'content-1', statement:'Qual artéria irriga predominantemente o nó atrioventricular?' },
  ],
  clinicalQuestions:[
    { id:'meta-2', statement:'Qual é o objetivo desta videoaula sobre insuficiência cardíaca?' },
  ],
}]);
assert.deepEqual(nonContentMatches.map(row => row.question.id), ['meta-1', 'meta-2']);
const nonContentPolicy = createNonContentCourseQuestionPolicyEntry({
  enabledAt:reviewNow,
  enabledBy:'admin@example.com',
  matchedCount:nonContentMatches.length,
});
const entriesWithPolicy = upsertDisabledCourseQuestion([disabledEntry], nonContentPolicy);
assert.equal(isNonContentCourseQuestionPolicyEnabled(entriesWithPolicy), true);
assert.equal(isCourseQuestionDisabled(entriesWithPolicy, {
  aulaId:'lesson-meta',
  question:nonContentMatches[0].question,
}), true);
assert.equal(isCourseQuestionDisabled(entriesWithPolicy, {
  aulaId:'lesson-meta',
  question:{ id:'content-1', statement:'Qual artéria irriga predominantemente o nó atrioventricular?' },
}), false);
const policyFilteredBlocks = filterDisabledCourseQuestionsFromVqBlocks({
  'lesson-meta':{
    meta:{ totalQuestions:2 },
    blocks:{ main:{ questions:[
      nonContentMatches[0].question,
      { id:'content-1', statement:'Qual artéria irriga predominantemente o nó atrioventricular?' },
    ] } },
  },
}, entriesWithPolicy);
assert.deepEqual(policyFilteredBlocks['lesson-meta'].blocks.main.questions.map(question => question.id), ['content-1']);
const policyFilteredQueue = disableCourseReviewQueueItems({
  'lesson-meta':{ main:{
    'meta-1':{
      source:'curso',
      dueDate:reviewNow,
      adaptiveState:'introduction',
      question:nonContentMatches[0].question,
    },
  } },
}, entriesWithPolicy);
assert.equal(policyFilteredQueue['lesson-meta'].main['meta-1'].globallyDisabled, true);
assert.equal(policyFilteredQueue['lesson-meta'].main['meta-1'].dueDate, null);
assert.equal(isCourseQuestionDisabled([disabledEntry], {
  aulaId:'another-runtime-id',
  sharedLibraryItemId:'shared-lesson-1',
  questionId:'bad-question',
}), true);
const disabledVqBlocks = filterDisabledCourseQuestionsFromVqBlocks({
  'aula-visible':{
    meta:{ sharedLibraryItemId:'shared-lesson-1', totalQuestions:2 },
    blocks:{ main:{
      questions:[migrationQuestion('bad-question'), migrationQuestion('good-question')],
      favorites:['bad-question'],
    } },
  },
}, [disabledEntry]);
assert.deepEqual(disabledVqBlocks['aula-visible'].blocks.main.questions.map(question => question.id), ['good-question']);
assert.equal(disabledVqBlocks['aula-visible'].meta.totalQuestions, 1);
const disabledQueue = disableCourseReviewQueueItems({
  'aula-visible':{ main:{
    'bad-question':{
      source:'curso',
      cardKey:'course/aula-visible/bad-question',
      dueDate:reviewNow,
      adaptiveState:'core',
      question:migrationQuestion('bad-question'),
    },
  } },
  lib_personal:{ main:{
    'bad-question':{ source:'oraculo', dueDate:reviewNow, adaptiveState:'core' },
  } },
}, [disabledEntry], {
  'aula-visible':{ meta:{ sharedLibraryItemId:'shared-lesson-1' } },
});
assert.equal(disabledQueue['aula-visible'].main['bad-question'].globallyDisabled, true);
assert.equal(disabledQueue['aula-visible'].main['bad-question'].dueDate, null);
assert.equal(disabledQueue.lib_personal.main['bad-question'].dueDate, reviewNow);
const disabledSession = pruneDisabledCourseQuestionsFromSession({
  items:[
    { aulaId:'aula-visible', blockId:'main', qId:'bad-question', question:migrationQuestion('bad-question') },
    { aulaId:'aula-visible', blockId:'main', qId:'good-question', question:migrationQuestion('good-question') },
  ],
  index:0,
  sessionAnswers:{},
}, [disabledEntry], {
  'aula-visible':{ meta:{ sharedLibraryItemId:'shared-lesson-1' } },
});
assert.deepEqual(disabledSession.items.map(item => item.qId), ['good-question']);
const individualForecast = buildReviewForecast(individualPlan.queue, { now:reviewNow, days:7 });
assert.equal(individualForecast.total, 0);
assert.equal(individualForecast.dueNow, 0);
assert.equal(individualForecast.adaptive.awaitingCuration, 0);
assert.equal(individualForecast.days[0].total, 0);
assert.equal(individualForecast.days[0].unseen, 0);
assert.equal(individualForecast.days[0].review, 0);
assert.equal(individualForecast.days[1].total, 0);
assert.equal(individualForecast.fsrsActive, 0);
assert.equal(individualForecast.awaitingFirstFsrsReview, 0);
const auditableQuestions = collectAuditableQuestions(auditInput);
assert.equal(auditableQuestions.length, 4);
const auditReport = auditQuestionCollection(auditInput);
assert.equal(auditReport.summary.total, 4);
assert.ok(auditReport.summary.probable >= 1);
assert.ok(auditReport.conceptGroups.some(group => group.concept === 'no_sinoatrial' && group.records.length === 4));

const firebaseConfig = JSON.parse(await readFile(new URL('../firebase.json', import.meta.url), 'utf8'));
assert.equal(firebaseConfig.firestore?.rules, 'firestore.rules');

const vercelConfig = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
assert.ok(vercelConfig.headers?.some(item => item.source === '/index.html' && JSON.stringify(item.headers).includes('no-store')));
assert.ok(vercelConfig.headers?.some(item => item.source === '/assets/:path*' && JSON.stringify(item.headers).includes('immutable')));

const firestoreRules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
assert.match(firestoreRules, /function isOwner\(/);
assert.match(firestoreRules, /function isAdmin\(/);
assert.match(firestoreRules, /match \/\{document=\*\*\}/);
assert.match(firestoreRules, /allow read, write: if false;/);

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
assert.equal(packageJson.scripts?.check, 'npm run test:unit && npm run test:rules && npm run validate:ecg-staging && npm run build && npm run budget');
assert.equal(packageJson.scripts?.['audit:moderate'], 'npm audit --audit-level=moderate');
assert.equal(packageJson.scripts?.budget, 'node --no-warnings scripts/build-budget.mjs');
assert.equal(packageJson.scripts?.['import:ecg-site-pack'], 'node --no-warnings scripts/import-ecg-site-pack.mjs');
assert.equal(packageJson.scripts?.['import:ecg-staging'], 'node --no-warnings scripts/import-ecg-staging.mjs');
assert.equal(packageJson.scripts?.['validate:ecg'], 'node --no-warnings scripts/validate-ecg-pack.mjs');
assert.equal(packageJson.scripts?.['validate:ecg-staging'], 'node --no-warnings scripts/validate-ecg-staging.mjs');
assert.equal(packageJson.scripts?.['test:rules'], 'node --no-warnings scripts/firestore-rules-smoke.mjs');
assert.equal(packageJson.scripts?.['test:rules:emulator'], 'npx firebase-tools@13.35.1 emulators:exec --only firestore "node --no-warnings scripts/firestore-emulator-rules-test.mjs"');
assert.equal(packageJson.dependencies?.['ts-fsrs'], '5.4.1');
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

const appSource = (await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8'))
  .replace(/\r\n/g, '\n');
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
assert.match(appSource, /const lazyWithRetry = \(factory\) => factory\(\)\.catch/);
assert.match(appSource, /promptModulePromise = lazyWithRetry\(\(\) => import\(['"]\.\/agora_prompts\.js['"]\)\)/);
assert.match(appSource, /React\.lazy\(\(\) => lazyWithRetry\(\(\) => import\(['"]\.\/features\/bizuario\/BizuarioModal\.jsx['"]\)\)\)/);
assert.match(appSource, /React\.lazy\(\(\) => lazyWithRetry\(\(\) => import\(['"]\.\/features\/study-map\/StudyMapPreview\.jsx['"]\)\)\)/);
assert.match(appSource, /React\.lazy\(\(\) => lazyWithRetry\(\(\) => import\(['"]\.\/features\/shared-library\/SharedLibraryView\.jsx['"]\)\)\)/);
assert.match(appSource, /React\.lazy\(\(\) => lazyWithRetry\(\(\) => import\(['"]\.\/features\/famed\/FamedPortalView\.jsx['"]\)\)\)/);
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
assert.match(appSource, /const needsReviewQueueData = foregroundReviewQueueData \|\| \(canSeeVideoaulas && backgroundPrefetchStage >= 2\);/);
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
assert.match(geminiRuntimeSource, /options = \{\}/);
assert.match(geminiRuntimeSource, /\.\.\.geminiOptions/);
assert.match(geminiRuntimeSource, /validateResult/);
assert.match(geminiRuntimeSource, /executeGeminiRotation/);
assert.match(geminiRuntimeSource, /hasExternalPool/);
assert.match(geminiRuntimeSource, /keyCursorRef\.current/);
assert.match(geminiRuntimeSource, /entry\?\.fingerprint/);

const geminiRotationSource = await readFile(new URL('../src/services/geminiRotation.js', import.meta.url), 'utf8');
assert.match(geminiRotationSource, /retryable\.has/);
assert.match(geminiRotationSource, /attempt % keys\.length/);

const geminiServiceSource = await readFile(new URL('../src/services/gemini.js', import.meta.url), 'utf8');
assert.match(geminiServiceSource, /VITE_GEMINI_BACKEND_URL/);
assert.match(geminiServiceSource, /callGeminiBackend/);
assert.match(geminiServiceSource, /\/generate/);
assert.match(geminiServiceSource, /resolveGeminiTimeout/);
assert.match(geminiServiceSource, /REQUEST_TIMEOUT/);
assert.match(geminiServiceSource, /responseMimeType/);
assert.match(geminiServiceSource, /responseSchema/);

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
assert.match(sharedLibrarySyncSource, /return hydratedItems;/);

const bizuarioSource = await readFile(new URL('../src/features/bizuario/BizuarioModal.jsx', import.meta.url), 'utf8');
assert.match(bizuarioSource, /export default function BizuarioModal/);

const studyMapPreviewSource = await readFile(new URL('../src/features/study-map/StudyMapPreview.jsx', import.meta.url), 'utf8');
assert.match(studyMapPreviewSource, /export default function StudyMapPreview/);

const questionFeatureSource = await readFile(new URL('../src/features/questions/QuestionFeature.jsx', import.meta.url), 'utf8');
assert.match(questionFeatureSource, /O traçado desta questão ainda não pôde ser associado com segurança/);
assert.match(questionFeatureSource, /export \{ QuestionView, QuestionCard, OpenAnswerModal \}/);
assert.match(questionFeatureSource, /const isAnswerCorrect = \(question, answer\) =>/);
assert.match(questionFeatureSource, /const isFinalObjectiveAnswer = \(question, answer\) =>/);
assert.match(questionFeatureSource, /normalizeDisplayedAlternativeReferences\(opt\.explanation, opt\.letter\)/);
assert.match(questionFeatureSource, /const renderClozeSentence =/);
assert.match(questionFeatureSource, /Revelar informação/);
assert.match(questionFeatureSource, />Entenda</);

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
assert.match(academiaTopicViewSource, /Sumário da aula/);
assert.match(academiaTopicViewSource, /chapterQuestions\.map/);
assert.match(academiaTopicViewSource, /Fixação do capítulo/);
assert.match(academiaTopicViewSource, /academiaQuestionPlacement/);
assert.match(academiaTopicViewSource, /Durante a aula/);
assert.match(academiaTopicViewSource, /Ao final/);
assert.match(academiaTopicViewSource, /questionPlacement === 'inline'/);
assert.match(academiaTopicViewSource, /questionPlacement === 'end'/);
assert.doesNotMatch(academiaTopicViewSource, /Depois da aula/);
assert.doesNotMatch(academiaTopicViewSource, /idx>0\?\(darkMode\?'border-t/);

const bulkGenerateModalSource = await readFile(new URL('../src/features/bulk/BulkGenerateModal.jsx', import.meta.url), 'utf8');
assert.match(bulkGenerateModalSource, /export default function BulkGenerateModal/);
assert.match(bulkGenerateModalSource, /useFeatureContext/);
assert.match(bulkGenerateModalSource, /bulkGenerateModal\.subject/);

const sharedLibraryViewSource = await readFile(new URL('../src/features/shared-library/SharedLibraryView.jsx', import.meta.url), 'utf8');
assert.match(sharedLibraryViewSource, /export default function SharedLibraryView/);
assert.match(sharedLibraryViewSource, /useFeatureContext/);
assert.match(sharedLibraryViewSource, /showSharedLibraryAdminTools = isAdmin/);
assert.match(sharedLibraryViewSource, /if \(!isAdmin\) return null/);
assert.match(sharedLibraryViewSource, /EcgCaseBankView/);
assert.match(sharedLibraryViewSource, /id:'ecg', label:'Banco de ECG'/);
assert.match(sharedLibraryViewSource, /QuestionCurationView = React\.lazy/);
assert.doesNotMatch(sharedLibraryViewSource, /QuestionSelectionView|id:'selection'|label:'Seleção'/);
assert.doesNotMatch(sharedLibraryViewSource, /sharedLibraryAudienceMode|Prévia aluno|setSharedLibraryAudienceMode/);
assert.doesNotMatch(sharedLibraryViewSource, /id:'exams'|id:'pharmacology'|id:'famed'/);
assert.match(sharedLibraryViewSource, /questionMatchesSearch/);
assert.match(sharedLibraryViewSource, /Buscar questão/);
assert.match(sharedLibraryViewSource, /Inativar perguntas sobre a própria aula/);
assert.match(sharedLibraryViewSource, /Filtro de perguntas metadidáticas ativo/);
assert.match(appSource, /findNonContentCourseQuestions\(sharedLibraryItems\)/);
assert.match(appSource, /createNonContentCourseQuestionPolicyEntry/);

const ecgCaseBankViewSource = await readFile(new URL('../src/features/question-factory/EcgCaseBankView.jsx', import.meta.url), 'utf8');
assert.match(ecgCaseBankViewSource, /export default function EcgCaseBankView/);
assert.match(ecgCaseBankViewSource, /\/ecg\/v3\/cases\.json/);
assert.match(ecgCaseBankViewSource, /Curso prático de ECG/);
assert.match(ecgCaseBankViewSource, /Revelar gabarito e comparar/);
assert.match(ecgCaseBankViewSource, /Preciso rever/);
assert.match(ecgCaseBankViewSource, /agora_ecg_practical_progress_v1/);
assert.match(ecgCaseBankViewSource, /Caso clínico/);
assert.match(ecgCaseBankViewSource, /Interpretação clínica/);

const questionCurationViewSource = await readFile(new URL('../src/features/question-factory/QuestionCurationView.jsx', import.meta.url), 'utf8');
assert.match(questionCurationViewSource, /Metadados por matéria, em lotes otimizados/);
assert.match(questionCurationViewSource, /Atualizar metadados/);
assert.match(questionCurationViewSource, /Clique em Atualizar metadados/);
assert.match(questionCurationViewSource, /analysisRead/);
assert.doesNotMatch(questionCurationViewSource, /refreshAnalyses\(\);/);
assert.doesNotMatch(questionCurationViewSource, /await refreshAnalyses\(\)\.catch/);
assert.match(questionCurationViewSource, /lotes retomáveis de até 30 questões/);
assert.match(questionCurationViewSource, /selectedSubjects/);
assert.match(questionCurationViewSource, /Selecione uma ou mais matérias/);
assert.match(questionCurationViewSource, />Todas<\/button>/);
assert.match(questionCurationViewSource, /Com várias matérias, a fila inclui todas as aulas selecionadas/);
assert.match(questionCurationViewSource, /maxTokens:24000/);
assert.match(questionCurationViewSource, /minimumAttempts:2/);
assert.match(questionCurationViewSource, /collectLikelySiteGeminiKeys/);
assert.match(questionCurationViewSource, /keyPool:keyPoolRef\.current/);
assert.match(questionCurationViewSource, /responseMimeType:'application\/json'/);
assert.match(questionCurationViewSource, /thinkingBudget:0/);
assert.match(questionCurationViewSource, /timeoutMs:180000/);
assert.match(questionCurationViewSource, /pool administrativo/);
assert.match(questionCurationViewSource, /METADATA_BATCH_INCOMPLETE/);
assert.match(questionCurationViewSource, /processAnalysisItem/);
assert.match(questionCurationViewSource, /nenhuma chamada ao Gemini foi necessária/);
assert.match(questionCurationViewSource, /A fila seguirá para a próxima aula/);
assert.match(questionCurationViewSource, /Registro da fila/);
assert.match(questionCurationViewSource, /pauseRun/);
assert.match(questionCurationViewSource, /stopRun/);
assert.doesNotMatch(questionCurationViewSource, /stopRef/);
assert.match(questionCurationViewSource, /Todas as aulas da matéria/);
assert.match(questionCurationViewSource, /Curar e publicar \{selectedScopeLabel\}/);
assert.match(questionCurationViewSource, /publishCompletedAnalysis\(item\)/);
assert.match(questionCurationViewSource, /buildLearningSelectionSnapshot/);
assert.match(questionCurationViewSource, /Exportar auditoria/);
assert.match(questionCurationViewSource, /agora-question-curation-audit-v1/);
assert.match(questionCurationViewSource, /analysisMatchesItem/);
assert.match(questionCurationViewSource, /LEARNING_SELECTION_VERSION/);
assert.match(questionCurationViewSource, /for \(let itemIndex = 0; itemIndex < analysisItems\.length/);
assert.match(questionCurationViewSource, /Aulas assistidas aguardando curadoria/);
assert.match(questionCurationViewSource, /Atualizar prioridades/);
assert.match(questionCurationViewSource, /Clique em Atualizar prioridades/);
assert.match(questionCurationViewSource, /loaded:false/);
assert.doesNotMatch(questionCurationViewSource, /refreshWatchedDemand\(\);/);
assert.doesNotMatch(questionCurationViewSource, /await refreshWatchedDemand\(\)\.catch/);
assert.match(questionCurationViewSource, /Curar e publicar todas/);
assert.doesNotMatch(questionCurationViewSource, /Fazer curadoria desta aula|Abrir Seleção e publicar/);

const questionMetadataStoreSource = await readFile(new URL('../src/services/questionMetadataStore.js', import.meta.url), 'utf8');
assert.match(questionMetadataStoreSource, /belongsToManifest/);
assert.match(questionMetadataStoreSource, /batchIndex < expectedBatchCount/);

const famedPortalViewSource = await readFile(new URL('../src/features/famed/FamedPortalView.jsx', import.meta.url), 'utf8');
assert.match(famedPortalViewSource, /export default function FamedPortalView/);
assert.match(famedPortalViewSource, /FAMED_PROGRAM/);
assert.match(famedPortalViewSource, /FamedScheduleView/);
assert.match(famedPortalViewSource, /grid grid-cols-4 gap-2/);
assert.match(famedPortalViewSource, /AcademiaTopicView/);
assert.match(famedPortalViewSource, /AdminStudyMapTopicList/);
assert.match(famedPortalViewSource, /startFamedAcademiaCreation/);
assert.match(famedPortalViewSource, /Geração em lote/);
assert.match(famedPortalViewSource, /openBulkGenerateModal/);
assert.match(famedPortalViewSource, /subscribeFamedContent/);
assert.match(famedPortalViewSource, /buildFamedCourseCatalogExport/);
assert.match(famedPortalViewSource, /resolveFamedCourseLessons/);
assert.match(famedPortalViewSource, /agora-famed-catalogo-curso-/);
assert.match(famedPortalViewSource, /removeScheduleContent/);
assert.match(famedPortalViewSource, /As videoaulas do Portal do Curso não serão alteradas/);
assert.match(famedPortalViewSource, /parseGeneratedQuestionsByTypes/);
assert.match(famedPortalViewSource, /buildFamedEssentialFlashcardsPrompt/);
assert.match(famedPortalViewSource, /flashcardSourceSignature/);
assert.match(famedPortalViewSource, /FAMED_FLASHCARD_GENERATION_VERSION/);
assert.match(famedPortalViewSource, /\['flashcard'\]/);
assert.doesNotMatch(famedPortalViewSource, /\['cloze'\]/);
assert.match(famedPortalViewSource, /Nunca peça listas, inventários de medicamentos\/exames/);
assert.match(famedPortalViewSource, /Faça singular\/plural corresponder exatamente ao back/);
assert.match(famedPortalViewSource, /deleteEssentialFlashcards/);
assert.match(famedPortalViewSource, /buildFamedFlashcardAuditExport/);
assert.match(famedPortalViewSource, /Exportar para revisar o prompt/);
assert.match(famedPortalViewSource, /famed-flashcards-auditoria-/);
assert.doesNotMatch(famedPortalViewSource, /rejectedFlashcards|getFamedEssentialClozeIssue/);
assert.match(famedPortalViewSource, /saveFamedQuestionAssets/);
assert.match(famedPortalViewSource, /loadFamedQuestionAssets/);
assert.match(famedPortalViewSource, /activePanel === 'student-topics'/);
assert.match(famedPortalViewSource, /Tópicos da aula/);
assert.match(famedPortalViewSource, /Escolha um tópico\. Dentro dele, leia a aula e responda às questões logo abaixo\./);
assert.match(famedPortalViewSource, /'student-topics'\)/);
assert.match(famedPortalViewSource, /activeTopic\?'topic':isAdmin\?'subject':'student-topics'/);
assert.doesNotMatch(famedPortalViewSource, /id:'__all__'/);
assert.doesNotMatch(famedPortalViewSource, /maxCards|maxTokens|slice\(0,\s*20\)/);
assert.doesNotMatch(famedPortalViewSource, /matchFamedScheduleCourseLessons/);
assert.doesNotMatch(famedPortalViewSource, /FamedManualEditor|FamedPackageImporter/);
assert.doesNotMatch(famedPortalViewSource, /const TABS|activeTab/);

const famedCatalogSource = await readFile(new URL('../src/features/famed/famedCatalog.js', import.meta.url), 'utf8');
assert.match(famedCatalogSource, /curriculum:'PPC 2018'/);
assert.match(famedCatalogSource, /semesters:\[5, 6, 7, 8\]/);
assert.doesNotMatch(famedCatalogSource, /length:\s*12|S1|S2|S3|S4|S9|S10|S11|S12|Internato/i);
assert.match(famedCatalogSource, /Cardio \+ Pneumo/);
assert.match(famedCatalogSource, /id:'cardio-pneumo'/);
assert.match(famedCatalogSource, /id:'endocrino-nutro-gastro'/);

const famedScheduleSource = await readFile(new URL('../src/features/famed/famedSchedule.js', import.meta.url), 'utf8');
assert.match(famedScheduleSource, /status:'previous-class-reference'/);
assert.match(famedScheduleSource, /cardio-valvopatias/);
assert.match(famedScheduleSource, /pneumo-dpoc-asma/);
assert.doesNotMatch(famedScheduleSource, /2026-\d{2}-\d{2}|\d{2}:\d{2}|segunda-chamada|cardio-af/i);

const famedScheduleViewSource = await readFile(new URL('../src/features/famed/FamedScheduleView.jsx', import.meta.url), 'utf8');
assert.match(famedScheduleViewSource, /Aulas e provas/);
assert.match(famedScheduleViewSource, />Academia</);
assert.match(famedScheduleViewSource, />Questões antigas</);
assert.match(famedScheduleViewSource, /<CardsIcon\/>Flashcards/);
assert.match(famedScheduleViewSource, /sm:grid-cols-3/);
assert.doesNotMatch(famedScheduleViewSource, /onOpenQuestions/);
assert.match(famedScheduleViewSource, /Exportar aulas do curso/);
assert.match(famedScheduleViewSource, />No curso</);
assert.match(famedScheduleViewSource, /linkedLessonsDuration/);
assert.match(famedScheduleViewSource, /isCourseLessonWatched/);
assert.match(famedScheduleViewSource, /text-green-700 hover:text-green-800/);
assert.doesNotMatch(famedScheduleViewSource, />Assistida<\/span>/);
assert.match(famedScheduleViewSource, /lesson\.duration/);
assert.match(famedScheduleViewSource, /onRemoveContent/);
assert.match(famedScheduleViewSource, /Remover conteúdo da FAMED/);
assert.match(famedScheduleViewSource, /Adicione as questões antigas primeiro/);
assert.doesNotMatch(famedScheduleViewSource, /courseIndex \?\?|Ver mais|expandedCourseLinks/);
assert.doesNotMatch(famedScheduleViewSource, /Nenhuma correspondência direta encontrada/);
assert.doesNotMatch(famedScheduleViewSource, /Cronograma interativo|Sequência de referência/);
assert.doesNotMatch(famedScheduleViewSource, /Fontes, avaliação de Pneumo e observações|FAMED_S5_SCHEDULE_META/);
assert.doesNotMatch(famedScheduleViewSource, /formatScheduleDate|item\.date|item\.time|item\.instructor/);

const famedPastQuestionsViewSource = await readFile(new URL('../src/features/famed/FamedPastQuestionsView.jsx', import.meta.url), 'utf8');
assert.match(famedPastQuestionsViewSource, /Adicionar pacote de questões antigas/);
assert.match(famedPastQuestionsViewSource, /buildFamedQuestionPackagePrompt/);
assert.match(famedPastQuestionsViewSource, /accept="\.zip,application\/zip/);
assert.match(famedPastQuestionsViewSource, /\{isAdmin&&<p className=.*Guarde aqui as provas anteriores/);
assert.match(famedPastQuestionsViewSource, /\{isAdmin&&<div className="mb-4 flex items-center justify-between gap-3">/);
assert.doesNotMatch(famedPastQuestionsViewSource, /<textarea|buildExternalPrompt/);

const famedQuestionPackageSource = await readFile(new URL('../src/features/famed/famedQuestionPackage.js', import.meta.url), 'utf8');
assert.match(famedQuestionPackageSource, /FAMED_QUESTION_PACKAGE_SCHEMA/);
assert.match(famedQuestionPackageSource, /unzipSync/);
assert.match(famedQuestionPackageSource, /isSafeRelativePath/);
assert.match(famedQuestionPackageSource, /libraryQuestionKind:'old_exam'/);

const famedContentServiceSource = await readFile(new URL('../src/services/famedContent.js', import.meta.url), 'utf8');
assert.match(famedContentServiceSource, /CONTENT_COLLECTION = 'famed_content'/);
assert.match(famedContentServiceSource, /saveFamedAcademiaSubject/);
assert.match(famedContentServiceSource, /famedContentToAcademiaSubject/);
assert.match(famedContentServiceSource, /deleteFamedContent/);
assert.match(famedContentServiceSource, /deleteLegacyFamedContent/);
assert.match(famedContentServiceSource, /saveFamedQuestionAssets/);
assert.match(famedContentServiceSource, /loadFamedQuestionAssets/);
assert.match(famedContentServiceSource, /deleteFamedQuestionAssets/);
assert.match(famedContentServiceSource, /creationMode:'academia'/);
assert.doesNotMatch(famedContentServiceSource, /firebase\/storage/);

assert.match(appSource, /const \[famedCreationTarget, setFamedCreationTarget\]/);
assert.match(appSource, /const FamedIcon = \(\{ className \}\) => \(/);
assert.match(appSource, /viewBox="0 0 64 64"/);
assert.match(appSource, /M13 23h38v17\.5/);
assert.doesNotMatch(appSource, /const FamedIcon\s+= ic\(/);
assert.match(appSource, /const startFamedAcademiaCreation = scheduleItem =>/);
assert.match(appSource, /famedCreationTarget\.famedStudy/);
assert.match(appSource, /const persistAcademiaSubject = async subject =>/);
assert.match(appSource, /\n\s+bulkActionMenu,\n\s+bulkGenerateModal,/);
assert.match(appSource, /\n\s+setBulkActionMenu,\n\s+setBulkGenerateModal,/);

assert.match(questionFeatureSource, /ClinicalCaseIntro/);
assert.match(questionFeatureSource, /Use este caso para responder/);
assert.match(questionFeatureSource, /hideCaseContext/);
assert.doesNotMatch(questionFeatureSource, />Decisão<\/div>/);
assert.doesNotMatch(academiaTopicViewSource, /continuousNarrativeContent/);
const promptsSource = await readFile(new URL('../src/agora_prompts.js', import.meta.url), 'utf8');
assert.match(promptsSource, /Toda alternativa deve conter algum núcleo plausível ou verdadeiro/);
assert.match(promptsSource, /PRINCÍPIO DE EFICIÊNCIA E ALTO RENDIMENTO/);
assert.match(promptsSource, /maximizar domínio relevante por tempo de estudo/);
assert.match(promptsSource, /sem meta padrão, piso artificial ou incentivo para preencher volume/);
assert.match(promptsSource, /qual é o objetivo\/finalidade da aula/);
assert.match(promptsSource, /Ignore falas metadidáticas da transcrição/);
assert.match(promptsSource, /Devolva EXATAMENTE .*item\(ns\), na mesma ordem da bateria recebida/);
assert.match(appSource, /import\('\.\/services\/sharedLibraryRepair\.js'\)/);
assert.match(appSource, /Revisão conferida:/);
assert.match(appSource, /timeoutMs:120000/);
assert.match(appSource, /REQUEST_TIMEOUT/);

const videoaulasViewSource = await readFile(new URL('../src/features/course/VideoaulasView.jsx', import.meta.url), 'utf8');
assert.match(videoaulasViewSource, /export default function VideoaulasView/);
assert.match(videoaulasViewSource, /useFeatureContext/);
assert.doesNotMatch(videoaulasViewSource, /Continuar ciclo|Fazer ímpares|Fazer pares/);
assert.match(videoaulasViewSource, /Adicionar à Revisão/);
assert.match(videoaulasViewSource, /Remover da Revisão/);
assert.match(videoaulasViewSource, /Retomar Revisão/);
assert.match(videoaulasViewSource, /Pausar Revisão/);
assert.match(videoaulasViewSource, /Zerar Revisão/);
assert.doesNotMatch(videoaulasViewSource, /Concluir aula e ativar revisão|Longo prazo: essenciais|Revisão aguardando curadoria/);
assert.match(videoaulasViewSource, /addCourseLessonToReview/);
assert.match(videoaulasViewSource, /pauseCourseLessonReview/);
assert.match(videoaulasViewSource, /resetCourseLessonReview/);
assert.match(videoaulasViewSource, /resumeCourseLessonReview/);
assert.match(videoaulasViewSource, /disabled:cursor-not-allowed disabled:opacity-35/);
assert.ok(
  videoaulasViewSource.indexOf("{effWatched?'Assistida':'Marcar assistida'}")
    < videoaulasViewSource.indexOf('{effReviewButtonLabel}'),
  'o controle de revisão deve ficar abaixo de Marcar assistida',
);
assert.match(appSource, /if \(reviewState === 'reset'\) return \[\];/);
assert.ok(
  appSource.indexOf('const [courseReviewLessonStates, setCourseReviewLessonStates]')
    < appSource.indexOf('courseReviewLessonStatesRef.current = courseReviewLessonStates || {}'),
  'o estado de revisão por aula deve existir antes do efeito que sincroniza sua ref',
);
assert.match(videoaulasViewSource, /const courseNavEntries = subjects\.flatMap/);
assert.match(videoaulasViewSource, /openCourseNavEntry\(prevNavEntry\)/);
assert.match(videoaulasViewSource, /openCourseNavEntry\(nextNavEntry\)/);
assert.match(videoaulasViewSource, /faixa compacta das aulas do tópico/);
assertNoFreeIdentifiers(videoaulasViewSource, 'VideoaulasView');
assert.match(videoaulasViewSource, /\bClock,\s*[\s\S]*\} = useFeatureContext\(\)/);
assert.match(videoaulasViewSource, /\bvideoMainScrollRef,\s*[\s\S]*\} = useFeatureContext\(\)/);
assert.match(appSource, /\bClock,/);

const coursePortalViewSource = await readFile(new URL('../src/features/course/CoursePortalView.jsx', import.meta.url), 'utf8');
assert.match(coursePortalViewSource, /export default function CoursePortalView/);
assert.match(coursePortalViewSource, /dayIndex\+1/);
assert.match(coursePortalViewSource, /Descanso/);
assert.match(coursePortalViewSource, /useFeatureContext/);
assert.match(coursePortalViewSource, /useCourseHeroJourney/);
assert.match(coursePortalViewSource, /useCourseHeroJourney\(\{ enabled:true \}\)/);
assert.doesNotMatch(coursePortalViewSource, /id:'questoes'/);
assert.doesNotMatch(coursePortalViewSource, /cursoTab==='plano'&&isAdmin/);
assert.match(coursePortalViewSource, /Plano de estudos/);
assert.match(coursePortalViewSource, /Configurar plano/);
assert.match(coursePortalViewSource, /Dias de estudo/);
assert.match(coursePortalViewSource, /courseScheduleCadence/);
assert.match(coursePortalViewSource, /Carga horária/);
assert.match(coursePortalViewSource, /Data final/);
assert.match(coursePortalViewSource, /horas por dia de estudo/);
assert.match(coursePortalViewSource, /h-14 rounded-xl border px-3 py-4/);
assert.doesNotMatch(coursePortalViewSource, /\[12,16,24,36\]/);
assert.doesNotMatch(coursePortalViewSource, /Cirurgia \+ GO primeiro/);
assert.doesNotMatch(coursePortalViewSource, />Recomendado</);
assert.doesNotMatch(coursePortalViewSource, /appendAdaptiveSupportToReviewSession|adaptiveSupportAdded/);
assert.match(coursePortalViewSource, /onAdminDisableQuestion/);
assert.match(coursePortalViewSource, /progress:scheduleProgress/);
assert.doesNotMatch(coursePortalViewSource, /const lessonOrderIndex = new Map/);
assertNoFreeIdentifiers(coursePortalViewSource, 'CoursePortalView');
assert.doesNotMatch(coursePortalViewSource, /const journeyInfoForLesson =/);
assert.doesNotMatch(coursePortalViewSource, /const firstQuestionBlockForLesson =/);
assert.match(coursePortalViewSource, /role="button"[\s\S]{0,260}setVqExpandedSubj\(p=>\(\{\.\.\.p,\[subj\]:!isExp\}\)\)/);

const videoQuestionsViewSource = await readFile(new URL('../src/features/course/VideoQuestionsView.jsx', import.meta.url), 'utf8');
assert.match(videoQuestionsViewSource, /export default function VideoQuestionsView/);
assert.match(videoQuestionsViewSource, /useFeatureContext/);
assert.doesNotMatch(videoQuestionsViewSource, /Ímpares|Pares|Continuar ciclo/);

const homeViewSource = await readFile(new URL('../src/features/home/HomeView.jsx', import.meta.url), 'utf8');
assert.match(homeViewSource, /export default function HomeView/);
assert.match(homeViewSource, /useFeatureContext/);
assert.match(homeViewSource, /useCourseHeroJourney/);
assert.match(homeViewSource, /useCourseHeroJourney\(\{ enabled:homeCanSeeVideoaulas \}\)/);
assert.match(homeViewSource, /setCursoTab\('cronograma'\);setView\('curso'\)/);
assertNoFreeIdentifiers(homeViewSource, 'HomeView');
assert.doesNotMatch(homeViewSource, /buildHomeJourneyState/);
assert.doesNotMatch(homeViewSource, /const journeyInfo =/);
assert.match(homeViewSource, /BrandIdentity variant="hero" showMark=\{false\}/);
assert.match(homeViewSource, /Prioridade de hoje/);
assert.match(homeViewSource, /Revisar agora/);
assert.match(appSource, /\['curso','videoaulas','videoquestions','spaced-review'\]\.includes\(view\)/);
assert.match(appSource, /const foregroundReviewQueueData = canSeeVideoaulas &&/);
assert.match(appSource, /const needsReviewQueueData = foregroundReviewQueueData \|\| \(canSeeVideoaulas && backgroundPrefetchStage >= 2\)/);
assert.match(appSource, /homeCanSeeVideoaulas \? \{label:'Revisões'/);
assert.match(appSource, /view==='spaced-review'&&canSeeVideoaulas&&<SpacedReviewView\/>/);
assert.match(appSource, /setSrModal=\{canSeeVideoaulas \? setSrModal : null\}/);
assert.match(homeViewSource, /homeCanSeeVideoaulas&&dueCount>0/);
assert.doesNotMatch(homeViewSource, /homeCanUseAdvancedFeatures&&dueCount>0/);
assert.doesNotMatch(homeViewSource, /Pórtico da academia do Gabigol/);
assert.doesNotMatch(homeViewSource, /Conhecimento organizado\. Estudo com propósito\./);
assert.doesNotMatch(homeViewSource, /Todo o seu conteúdo organizado em um único lugar/);
assert.doesNotMatch(homeViewSource, /home-goals/);
assert.match(homeViewSource, /home-progress-card/);
assert.doesNotMatch(famedPortalViewSource, /Foco atual|Aulas e questões em uma única sequência/);
assert.match(famedScheduleViewSource, /supplementaryTopics/);
assert.match(famedScheduleViewSource, />No curso</);
assert.match(famedPortalViewSource, /resolveFamedCourseLessons/);
assert.match(appSource, /courseScheduleCadence:cleanCadence/);
assert.match(appSource, /courseScheduleStudyDays:cleanStudyDays/);
assert.match(appSource, /courseScheduleGoalMode:cleanGoalMode/);
assert.match(appSource, /courseScheduleEffortHours:cleanEffortHours/);
assert.match(appSource, /courseScheduleEndDate:cleanEndDate/);
assert.doesNotMatch(appSource, /Plano alinhado à curadoria/);
assert.match(appSource, /action:toggleMobileMenu/);

const brandIdentitySource = await readFile(new URL('../src/components/BrandIdentity.jsx', import.meta.url), 'utf8');
assert.match(brandIdentitySource, /agora-brand-circle\.png/);
assert.match(brandIdentitySource, /Lux in tenebris/);
assert.doesNotMatch(appSource, /BrandIdentity variant="sidebar"/);
assert.doesNotMatch(appSource, /BrandIdentity variant="mobile" showTagline=\{false\}/);
const brandCssSource = await readFile(new URL('../src/brand.css', import.meta.url), 'utf8');
assert.match(brandCssSource, /agora-brand--hero/);
assert.match(brandCssSource, /agora-sidebar/);
assert.match(brandCssSource, /home-page-header/);
assert.match(brandCssSource, /agora-brand__name > span:first-child/);
assert.match(brandCssSource, /home-icon/);
assert.match(brandCssSource, /\.app-card\.famed-discipline:hover\s*\{\s*background: var\(--surface-strong\)/);
assert.match(brandCssSource, /background: var\(--surface-muted\) !important/);
assert.match(brandCssSource, /background: #151719/);
const brandImage = await readFile(new URL('../public/brand/agora-brand-circle.png', import.meta.url));
assert.ok(brandImage.length > 1_000_000);
const faviconImage = await readFile(new URL('../public/brand/agora-favicon-v2.png', import.meta.url));
assert.ok(faviconImage.length > 500_000);
const faviconIco = await readFile(new URL('../public/favicon.ico', import.meta.url));
assert.deepEqual([...faviconIco.subarray(0, 4)], [0, 0, 1, 0]);
const siteIcon = await readFile(new URL('../public/brand/agora-site-icon.png', import.meta.url));
assert.ok(siteIcon.length > 500_000);
assert.doesNotMatch(appSource, /data:image\/svg\+xml;base64/);

const courseHeroJourneySource = await readFile(new URL('../src/features/course/useCourseHeroJourney.js', import.meta.url), 'utf8');
assert.match(courseHeroJourneySource, /export const useCourseHeroJourney/);
assert.match(courseHeroJourneySource, /coursePrefsLoaded/);
assert.match(courseHeroJourneySource, /scheduleWeeks/);
assert.match(courseHeroJourneySource, /scheduleCurrentWeek/);
assert.match(courseHeroJourneySource, /nextScheduleLesson/);
assert.match(courseHeroJourneySource, /label:'Próxima aula'/);
assert.match(courseHeroJourneySource, /buildEffortBalancedSchedule/);
assert.match(courseHeroJourneySource, /buildDailyEffortSchedule/);
assert.match(courseHeroJourneySource, /courseIndex/);
assert.match(courseHeroJourneySource, /buildClinicalPrioritySchedule\(allOrderedSubjectLessons\)/);
assert.match(appSource, /label:'Ordem de importância'/);
assert.match(courseHeroJourneySource, /interleaveLongitudinalScheduleLessons\(clinicalLessons, preventiveLessons\)/);
assert.match(courseHeroJourneySource, /strategy === 'medico-bicho'/);
assert.doesNotMatch(courseHeroJourneySource, /vqBlocksLoaded|interleavedCycleLessons|direct-even|clinical-odd|clinical-even/);
assertNoFreeIdentifiers(courseHeroJourneySource, 'useCourseHeroJourney');

assert.match(videoQuestionsViewSource, /Voltar ao plano/);
assert.match(videoQuestionsViewSource, /setCursoTab\('cronograma'\)/);
assert.doesNotMatch(videoQuestionsViewSource, /cycleStage|direct-odd|direct-even|clinical-odd|clinical-even|Continuar ciclo/);

const settingsViewSource = await readFile(new URL('../src/features/settings/SettingsView.jsx', import.meta.url), 'utf8');
assert.match(settingsViewSource, /export default function SettingsView/);
assert.match(settingsViewSource, /useFeatureContext/);

const favoritesViewSource = await readFile(new URL('../src/features/favorites/FavoritesView.jsx', import.meta.url), 'utf8');
assert.match(favoritesViewSource, /export default function FavoritesView/);
assert.match(favoritesViewSource, /useFeatureContext/);
assert.match(favoritesViewSource, /Object\.entries\(vqBlocks/);
assert.match(favoritesViewSource, />Curso</);
assert.match(favoritesViewSource, /onAdminDisableQuestion/);

const spacedReviewViewSource = await readFile(new URL('../src/features/review/SpacedReviewView.jsx', import.meta.url), 'utf8');
assert.match(spacedReviewViewSource, /export default function SpacedReviewView/);
assert.match(spacedReviewViewSource, /return deferInteractionWork\(\(\) => \{/);
assert.match(spacedReviewViewSource, /setReviewNotebook\(current, 'add'\)\.catch/);
assert.match(spacedReviewViewSource, /reviewSessionTopRef\.current\?\.scrollIntoView\(\{behavior:'smooth',block:'start'\}\)/);
assert.match(spacedReviewViewSource, /moveReviewSession\(Math\.min\(total-1,index\+1\)\)/);
assert.match(appSource, /saveVqBlockPatch\([\s\S]*?errorNotebook:nextList\(previousBlock\.errorNotebook\)/);
assert.match(spacedReviewViewSource, /useFeatureContext/);
assert.match(spacedReviewViewSource, />Revisões</);
assert.match(spacedReviewViewSource, /reviewScheduledCount/);
assert.match(spacedReviewViewSource, /Responder questões/);
assert.match(spacedReviewViewSource, /allowGiveUp/);
assert.match(questionFeatureSource, /DONT_KNOW/);
assert.match(questionFeatureSource, /const isSelected = gaveUp \|\| effectiveLetter===opt\.letter/);
assert.match(questionFeatureSource, />\s*Não sei\s*<\/button>/);
assert.match(questionFeatureSource, /hover:-translate-y-0\.5 hover:shadow-md/);
assert.doesNotMatch(spacedReviewViewSource, /appendAdaptiveSupportToReviewSession|adaptiveSupportAdded/);
assert.match(spacedReviewViewSource, /onAdminDisableQuestion/);
assert.match(spacedReviewViewSource, /Revisar flashcards/);
assert.match(spacedReviewViewSource, /Carga prevista/);
assert.match(spacedReviewViewSource, /max-w-5xl/);
assert.match(spacedReviewViewSource, /reviewForecast/);
assert.match(spacedReviewViewSource, /forecastRange >= 14/);
assert.match(spacedReviewViewSource, /day:'2-digit', month:'2-digit'/);
assert.doesNotMatch(spacedReviewViewSource, /mais cedo que o modelo antigo|adoção do FSRS|calculad[oa] pelo FSRS/i);
assert.match(appSource, /import\('\.\/services\/fsrsScheduler\.js'\)/);
assert.doesNotMatch(appSource, /from ['"]\.\/services\/fsrsScheduler/);
assert.match(appSource, /import\('\.\/services\/reviewMigration\.js'\)/);
assert.doesNotMatch(appSource, /from ['"]\.\/services\/reviewMigration/);
assert.match(appSource, /import\('\.\/services\/ecgQuestionMatcher\.js'\)/);
assert.doesNotMatch(appSource, /from ['"]\.\/services\/ecgQuestionMatcher/);
assert.match(appSource, /ecgQuestionMatchVersion/);
assert.match(appSource, /trackReviewOutcome/);
assert.match(appSource, /reviewEvents/);

const quickViewSource = await readFile(new URL('../src/features/quick/QuickView.jsx', import.meta.url), 'utf8');
assert.match(quickViewSource, /export default function QuickView/);
assert.match(quickViewSource, /useFeatureContext/);
assert.match(quickViewSource, /settings\.quickOutputs/);
assert.match(quickViewSource, /O que .+ quer gerar\?/);
assert.doesNotMatch(quickViewSource, /sinal de Jobert/);

const quickTopicViewSource = await readFile(new URL('../src/features/quick/QuickTopicView.jsx', import.meta.url), 'utf8');
assert.match(quickTopicViewSource, /export default function QuickTopicView/);
assert.match(quickTopicViewSource, /useFeatureContext/);
assert.match(quickTopicViewSource, /availableTabs/);
assert.match(quickTopicViewSource, /QuickLessonContent/);
assert.match(quickTopicViewSource, /onAddToReview=\{canSeeVideoaulas \?/);
assert.doesNotMatch(quickTopicViewSource, /onAddToReview=\{canUseAdvancedFeatures \?/);

const quickLessonContentSource = await readFile(new URL('../src/features/quick/QuickLessonContent.jsx', import.meta.url), 'utf8');
assert.match(quickLessonContentSource, /export default function QuickLessonContent/);
assert.doesNotMatch(appSource, /const renderQuickLesson =/);

const subLibraryViewSource = await readFile(new URL('../src/features/library/SubLibraryView.jsx', import.meta.url), 'utf8');
assert.match(subLibraryViewSource, /export default function SubLibraryView/);
assert.match(subLibraryViewSource, /useFeatureContext/);
assert.match(subLibraryViewSource, /Criar Aula/);
assert.match(subLibraryViewSource, /Criar Quest/);
assert.match(subLibraryViewSource, /Importar Quest/);
assert.match(appSource, /quickOutputs:\['lesson','questions','flashcards'\]/);
assert.match(appSource, /const wantsLesson = quickOutputs\.includes\('lesson'\)/);
assert.match(appSource, /import\('\.\/features\/quick\/quickContent\.js'\)/);
assert.doesNotMatch(appSource, /REGRAS DOS FLASHCARDS:/);

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
