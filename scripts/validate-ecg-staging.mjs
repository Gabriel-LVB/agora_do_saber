import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const stagingRoot = path.join(projectRoot, 'data', 'ecg', 'staging', 'v3');
const publicRoot = path.join(projectRoot, 'public', 'ecg', 'v3');
const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};
const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const sha256 = value => createHash('sha256').update(value).digest('hex');
const expectedCaseIds = Array.from(
  { length:150 },
  (_, index) => `ECG${String(index + 1).padStart(3, '0')}`,
);
const forbiddenPublicKeys = new Set([
  'answer',
  'answerConceptId',
  'canonicalCaseId',
  'conceptIds',
  'diagnosis',
  'diagnosisText',
  'keyEvidence',
  'keyFindings',
  'primaryConceptId',
  'sourceDiagnosis',
  'variationCaseIds',
]);
const findForbiddenPublicKey = (value, trail = '') => {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const location = trail ? `${trail}.${key}` : key;
    if (forbiddenPublicKeys.has(key)) {
      errors.push(`catálogo público revela ${location}`);
    }
    findForbiddenPublicKey(child, location);
  }
};

const manifest = await readJson(path.join(stagingRoot, 'import-manifest.json'));
check(manifest.datasetId === 'agora_ecg_import_staging_v3', 'datasetId divergente');
check(manifest.importMode === 'staging', 'modo não está em staging');
check(manifest.batchSize === 15, 'batchSize deve ser 15');
check(manifest.batchCount === 10, 'esperados 10 lotes');
check(manifest.caseCount === 150, 'esperados 150 casos');
check(manifest.assetCount === 158, 'esperados 158 assets');
check(manifest.medicalValidationComplete === false, 'validação médica foi ativada');
check(manifest.runtimeTrainingEnabled === false, 'treino foi ativado');
check(manifest.rightsConfirmation === 'docs/ECG_RIGHTS_DECLARATION.md', 'declaração de direitos ausente');

const seenCaseIds = new Set();
let excludedNonEcgFindingCount = 0;
for (const batchEntry of manifest.batches || []) {
  const batchPath = path.join(stagingRoot, ...String(batchEntry.path).split('/'));
  const contents = await readFile(batchPath, 'utf8');
  check(sha256(contents) === batchEntry.sha256, `${batchEntry.batchId}: hash do lote divergente`);
  check(Buffer.byteLength(contents) === batchEntry.byteLength, `${batchEntry.batchId}: tamanho divergente`);
  check(Buffer.byteLength(contents) <= 650 * 1024, `${batchEntry.batchId}: lote excede 650 KiB`);
  const batch = JSON.parse(contents);
  check(batch.batchId === batchEntry.batchId, `${batchEntry.batchId}: id interno divergente`);
  check(batch.importMode === 'staging', `${batchEntry.batchId}: modo divergente`);
  check(batch.runtimeEnabled === false, `${batchEntry.batchId}: runtime habilitado`);
  check(batch.caseCount === 15, `${batchEntry.batchId}: lote não possui 15 casos`);
  check(batch.records?.length === 15, `${batchEntry.batchId}: registros incompletos`);
  for (const record of batch.records || []) {
    const item = record.case;
    check(!seenCaseIds.has(item.id), `${item.id}: caso duplicado`);
    seenCaseIds.add(item.id);
    check(item.medicalValidation?.status === 'pending_independent_review', `${item.id}: revisão médica indevidamente concluída`);
    check(item.medicalValidation?.independentImageReviewCompleted === false, `${item.id}: revisão independente ativada`);
    for (const flag of [
      'diagnosisTrainingEnabled',
      'microtasksEnabled',
      'questionImageMatchingEnabled',
      'spacedReviewEnabled',
    ]) {
      check(item.runtimeActivation?.[flag] === false, `${item.id}: ${flag} habilitado`);
    }
    check(record.trainingCandidate?.enabled === false, `${item.id}: treino candidato habilitado`);
    check(record.microtaskCandidate?.enabled === false, `${item.id}: microtarefa habilitada`);
    check(item.questionMatchingCandidate?.managementUse?.enabled === false, `${item.id}: conduta habilitada`);
    check(
      !(item.sourceDerivedKeyFindings || []).some(entry =>
        /radiograf|raio[\s-]?x/i.test(String(entry?.finding || ''))
      ),
      `${item.id}: achado não ECG permaneceu na projeção de staging`,
    );
    excludedNonEcgFindingCount += item.stagingTransform?.excludedNonEcgFindingCount || 0;
  }
}
check(
  expectedCaseIds.every(id => seenCaseIds.has(id)) && seenCaseIds.size === 150,
  'sequência ECG001..ECG150 incompleta',
);
check(
  excludedNonEcgFindingCount === manifest.excludedNonEcgFindingCount,
  'contagem de achados não ECG excluídos diverge',
);
check(excludedNonEcgFindingCount === 21, 'esperados 21 achados não ECG excluídos');

const publicCatalog = await readJson(path.join(publicRoot, 'catalog.json'));
const publicInventory = await readJson(path.join(publicRoot, 'assets.json'));
check(publicCatalog.datasetId === 'agora_ecg_cases_owner_provided_v1', 'dataset público completo divergente');
check(publicCatalog.contentStatus === 'owner_provided_complete', 'conteúdo original não está marcado como completo');
check(publicCatalog.runtimeStatus === 'owner_provided_complete', 'catálogo público ainda está preso ao staging');
check(publicCatalog.cases?.length === 150, 'catálogo público não possui 150 casos');
findForbiddenPublicKey(publicCatalog);

const publicCaseIds = new Set();
for (const item of publicCatalog.cases || []) {
  check(!publicCaseIds.has(item.id), `${item.id}: duplicado no catálogo público`);
  publicCaseIds.add(item.id);
  check(item.runtimeStatus === 'owner_provided_complete', `${item.id}: status público inesperado`);
  check(
    item.assetPath === `/ecg/v3/assets/${item.id}/ecg_principal.jpg`,
    `${item.id}: caminho público principal divergente`,
  );
  check(typeof item.preAnswerAlt === 'string' && item.preAnswerAlt.trim(), `${item.id}: alt text ausente`);
}
check(expectedCaseIds.every(id => publicCaseIds.has(id)), 'catálogo público incompleto');
check(publicInventory.assets?.length === 158, 'inventário público não possui 158 assets');

const assetHashes = new Set();
for (const asset of publicInventory.assets || []) {
  check(!assetHashes.has(asset.sha256), `${asset.assetId}: hash público duplicado`);
  assetHashes.add(asset.sha256);
  const prefix = '/ecg/v3/';
  check(asset.url.startsWith(prefix), `${asset.assetId}: URL fora do prefixo público`);
  const relativePath = asset.url.slice(prefix.length);
  const filePath = path.resolve(publicRoot, ...relativePath.split('/'));
  check(filePath.startsWith(`${publicRoot}${path.sep}`), `${asset.assetId}: caminho público inseguro`);
  try {
    const contents = await readFile(filePath);
    check(sha256(contents) === asset.sha256, `${asset.assetId}: hash do arquivo público divergente`);
  } catch {
    errors.push(`${asset.assetId}: arquivo público ausente`);
  }
}

const runtimeDataset = await readJson(path.join(publicRoot, 'cases.json'));
check(runtimeDataset.datasetId === 'agora_ecg_cases_owner_provided_v1', 'dataset de casos completo divergente');
check(runtimeDataset.contentStatus === 'owner_provided_complete', 'casos completos não estão liberados para a aba');
check(runtimeDataset.caseCount === 150, 'dataset completo não possui 150 casos');
check(runtimeDataset.imageCount === 189, 'dataset completo não possui 189 imagens');
check(runtimeDataset.questionImageCount === 183, 'contagem de imagens de questão divergente');
check(runtimeDataset.answerImageCount === 6, 'contagem de imagens de resposta divergente');
check(runtimeDataset.answerRevealRequired === true, 'respostas não exigem revelação explícita');
check(runtimeDataset.cases?.length === 150, 'lista completa não possui 150 casos');

const runtimeCaseIds = new Set();
let runtimeImageCount = 0;
let runtimeQuestionImageCount = 0;
let runtimeAnswerImageCount = 0;
for (const item of runtimeDataset.cases || []) {
  check(!runtimeCaseIds.has(item.id), `${item.id}: duplicado no dataset completo`);
  runtimeCaseIds.add(item.id);
  for (const field of [
    'prompt',
    'suggestedQuestion',
    'shortAnswer',
    'clinicalInterpretation',
    'fullAnswer',
  ]) {
    check(typeof item[field] === 'string' && item[field].trim(), `${item.id}: ${field} ausente`);
  }
  check(
    item.images?.some(image => image.role === 'principal' && image.phase === 'question'),
    `${item.id}: ECG principal de questão ausente`,
  );
  for (const image of item.images || []) {
    const prefix = '/ecg/v3/';
    check(image.url.startsWith(prefix), `${item.id}: imagem fora do prefixo público`);
    check(['question', 'answer'].includes(image.phase), `${item.id}: fase de imagem inválida`);
    const relativePath = image.url.slice(prefix.length);
    const filePath = path.resolve(publicRoot, ...relativePath.split('/'));
    check(filePath.startsWith(`${publicRoot}${path.sep}`), `${item.id}: caminho de imagem inseguro`);
    try {
      const contents = await readFile(filePath);
      check(sha256(contents) === image.sha256, `${item.id}: hash de imagem completa divergente`);
    } catch {
      errors.push(`${item.id}: imagem completa ausente (${image.url})`);
    }
    runtimeImageCount += 1;
    if (image.phase === 'answer') runtimeAnswerImageCount += 1;
    else runtimeQuestionImageCount += 1;
  }
}
check(expectedCaseIds.every(id => runtimeCaseIds.has(id)), 'dataset completo ECG001..ECG150 incompleto');
check(runtimeImageCount === 189, 'total calculado de imagens completas divergente');
check(runtimeQuestionImageCount === 183, 'total calculado de imagens de questão divergente');
check(runtimeAnswerImageCount === 6, 'total calculado de imagens de resposta divergente');

const [questionMatchIndex, conceptOntology, caseConceptMatrix] = await Promise.all([
  readJson(path.join(publicRoot, 'question-match-index.json')),
  readJson(path.join(stagingRoot, 'globals', 'concepts.json')),
  readJson(path.join(stagingRoot, 'globals', 'case-concept-matrix.json')),
]);
check(questionMatchIndex.schemaVersion === 1, 'schema do indice de matching divergente');
check(
  questionMatchIndex.matchingVersion === 'agora-ecg-question-matching-v2',
  'versao do matching ECG divergente',
);
check(questionMatchIndex.datasetId === runtimeDataset.datasetId, 'dataset do indice de matching divergente');
check(questionMatchIndex.caseCount === 150, 'indice de matching nao possui 150 casos');
check(questionMatchIndex.conceptCount === conceptOntology.length, 'ontologia compacta incompleta');
const sourceConceptsById = new Map(conceptOntology.map(concept => [String(concept.id), concept]));
for (const concept of questionMatchIndex.concepts || []) {
  const source = sourceConceptsById.get(String(concept.id));
  check(!!source, `${concept.id}: conceito desconhecido no indice`);
  check(concept.label === source?.label, `${concept.id}: rotulo do conceito divergente`);
  check(
    JSON.stringify(concept.aliases || []) === JSON.stringify(source?.aliases || []),
    `${concept.id}: aliases do conceito divergentes`,
  );
}
const runtimeCasesById = new Map((runtimeDataset.cases || []).map(item => [String(item.id), item]));
const matrixByCase = new Map();
for (const relation of caseConceptMatrix || []) {
  const caseId = String(relation.caseId);
  matrixByCase.set(caseId, [...(matrixByCase.get(caseId) || []), {
    id:String(relation.conceptId),
    role:relation.role === 'primary' ? 'primary' : 'secondary',
    weight:Number(relation.weight) || 0,
  }]);
}
const indexedCaseIds = new Set();
for (const item of questionMatchIndex.cases || []) {
  check(!indexedCaseIds.has(item.id), `${item.id}: caso duplicado no indice de matching`);
  indexedCaseIds.add(item.id);
  const sourceCase = runtimeCasesById.get(String(item.id));
  const sourceImage = sourceCase?.images?.find(image =>
    image?.type === 'ecg' && image?.role === 'principal' && image?.phase === 'question'
  );
  check(!!sourceCase, `${item.id}: caso desconhecido no indice de matching`);
  check(item.image?.url === sourceImage?.url, `${item.id}: ECG principal divergente no indice`);
  check(item.image?.url?.startsWith(`/ecg/v3/assets/${item.id}/`), `${item.id}: URL insegura no indice`);
  check(!('phase' in (item.image || {})) || item.image.phase === 'question', `${item.id}: imagem de resposta no indice`);
  for (const forbiddenKey of ['title', 'diagnosis', 'shortAnswer', 'fullAnswer', 'management', 'findings']) {
    check(!(forbiddenKey in item), `${item.id}: indice revela ${forbiddenKey}`);
  }
  const expectedConcepts = (matrixByCase.get(String(item.id)) || [])
    .sort((left, right) => right.weight - left.weight || left.id.localeCompare(right.id));
  check(
    JSON.stringify(item.concepts || []) === JSON.stringify(expectedConcepts),
    `${item.id}: matriz conceitual divergente no indice`,
  );
  check(item.concepts?.some(concept => concept.role === 'primary'), `${item.id}: conceito primario ausente`);
}
check(expectedCaseIds.every(id => indexedCaseIds.has(id)), 'indice de matching ECG001..ECG150 incompleto');

const serializedStaging = await Promise.all(
  (manifest.batches || []).map(entry =>
    readFile(path.join(stagingRoot, ...String(entry.path).split('/')), 'utf8')
  ),
);
check(
  !/externalBookSource"\s*:\s*true/i.test(serializedStaging.join('\n')),
  'staging ainda afirma origem em livro externo',
);

const report = {
  ok:errors.length === 0,
  datasetId:manifest.datasetId,
  counts:{
    cases:seenCaseIds.size,
    batches:manifest.batches?.length || 0,
    assets:publicInventory.assets?.length || 0,
    runtimeImages:runtimeImageCount,
    questionMatchCases:indexedCaseIds.size,
    questionMatchConcepts:questionMatchIndex.concepts?.length || 0,
    excludedNonEcgFindings:excludedNonEcgFindingCount,
  },
  errors,
};
console.log(JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
