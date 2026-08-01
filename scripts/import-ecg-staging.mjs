import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  access,
  cp,
  copyFile,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED_ZIP_SHA256 = 'BEBFEDD81026596CDDF8FEC771A56432855F2A31ADC8B06A88CB7D65C5E127A2';
const BATCH_SIZE = 15;
const DATASET_ID = 'agora_ecg_import_staging_v3';
const PREPARED_ON = '2026-07-30';
const PUBLIC_BASE_PATH = '/ecg/v3';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const sourceRoot = path.resolve(process.argv[2] || '');
const validatorPath = path.join(scriptDir, 'validate-ecg-pack.mjs');
const rightsDeclarationPath = path.join(projectRoot, 'docs', 'ECG_RIGHTS_DECLARATION.md');
const finalPublicRoot = path.join(projectRoot, 'public', 'ecg', 'v3');
const finalStagingRoot = path.join(projectRoot, 'data', 'ecg', 'staging', 'v3');
const tempRoot = path.join(projectRoot, '.tmp', `ecg-import-${process.pid}`);
const tempPublicRoot = path.join(tempRoot, 'public');
const tempStagingRoot = path.join(tempRoot, 'staging');

const json = value => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = value => createHash('sha256').update(value).digest('hex');
const exists = file => access(file).then(() => true).catch(() => false);
const readJson = async name =>
  JSON.parse(await readFile(path.join(sourceRoot, 'data', name), 'utf8'));
const readJsonl = async name =>
  (await readFile(path.join(sourceRoot, 'data', name), 'utf8'))
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line));
const by = (items, field) => new Map(items.map(item => [item[field], item]));
const isRadiographFinding = entry =>
  /radiograf|raio[\s-]?x/i.test(String(entry?.finding || ''));

const assertInside = target => {
  const resolved = path.resolve(target);
  if (
    resolved === projectRoot
    || !resolved.startsWith(`${projectRoot}${path.sep}`)
  ) {
    throw new Error(`Destino fora do projeto: ${resolved}`);
  }
  return resolved;
};

const safeSourceAsset = runtimePath => {
  const normalized = String(runtimePath || '').replaceAll('\\', '/');
  const resolved = path.resolve(sourceRoot, ...normalized.split('/'));
  if (
    !normalized
    || path.isAbsolute(normalized)
    || normalized.split('/').includes('..')
    || !resolved.startsWith(`${sourceRoot}${path.sep}`)
  ) {
    throw new Error(`Caminho de asset inseguro: ${runtimePath}`);
  }
  return { normalized, resolved };
};

const replaceDirectory = async (prepared, target) => {
  assertInside(prepared);
  assertInside(target);
  await mkdir(path.dirname(target), { recursive:true });
  await rm(target, { recursive:true, force:true });
  await cp(prepared, target, { recursive:true, force:true });
  await rm(prepared, { recursive:true, force:true });
};

if (!process.argv[2]) {
  console.error('Uso: npm run import:ecg-staging -- <diretorio-extraido-da-v3>');
  process.exit(2);
}

if (!(await exists(rightsDeclarationPath))) {
  throw new Error('Declaração operacional ausente: docs/ECG_RIGHTS_DECLARATION.md');
}

const validation = spawnSync(
  process.execPath,
  ['--no-warnings', validatorPath, sourceRoot],
  { cwd:projectRoot, encoding:'utf8' },
);
if (validation.status !== 0) {
  process.stderr.write(validation.stderr || validation.stdout);
  throw new Error('O pacote não passou em scripts/validate-ecg-pack.mjs');
}
const validationReport = JSON.parse(validation.stdout);
if (!validationReport.ok || validationReport.schemaVersion !== 3) {
  throw new Error('O importador aceita somente pacote ECG v3 validado');
}

const [
  sourceActivation,
  sourceRights,
  sourceManifest,
  assets,
  matrix,
  cases,
  adminCatalog,
  publicCatalog,
  clusters,
  concepts,
  learningPath,
  microtasks,
  relations,
  trainingCandidates,
  visualTags,
  highPriorityCases,
] = await Promise.all([
  readJson('activation_manifest.json'),
  readJson('content_rights.json'),
  readJson('dataset_manifest_v3.json'),
  readJson('ecg_asset_inventory_v3.json'),
  readJson('ecg_case_concept_matrix.json'),
  readJsonl('ecg_cases_v3.jsonl'),
  readJson('ecg_catalog_admin_staging.json'),
  readJson('ecg_catalog_pre_answer_safe.json'),
  readJson('ecg_clusters.json'),
  readJson('ecg_concepts.json'),
  readJson('ecg_learning_path.json'),
  readJsonl('ecg_microtask_candidates_v3.jsonl'),
  readJson('ecg_relations.json'),
  readJsonl('ecg_training_candidates_v3.jsonl'),
  readJson('ecg_visual_tags.json'),
  readJson('high_priority_review_cases.json'),
]);

if (sourceManifest.datasetId !== DATASET_ID) {
  throw new Error(`Dataset inesperado: ${sourceManifest.datasetId}`);
}
const serializedData = [
  cases,
  adminCatalog,
  publicCatalog,
  trainingCandidates,
  microtasks,
].map(value => JSON.stringify(value)).join('\n');
if (/hampton|hamptom/i.test(serializedData)) {
  throw new Error('A referência de origem incorreta Hampton/Hamptom ainda aparece nos dados');
}

await rm(tempRoot, { recursive:true, force:true });
await mkdir(tempPublicRoot, { recursive:true });
await mkdir(path.join(tempStagingRoot, 'batches'), { recursive:true });
await mkdir(path.join(tempStagingRoot, 'globals'), { recursive:true });

const publicAssets = [];
for (const asset of assets) {
  const source = safeSourceAsset(asset.runtimePath);
  const destination = path.join(tempPublicRoot, ...source.normalized.split('/'));
  assertInside(destination);
  await mkdir(path.dirname(destination), { recursive:true });
  await copyFile(source.resolved, destination);
  const copied = await readFile(destination);
  if (sha256(copied) !== asset.sha256) {
    throw new Error(`Hash divergente após cópia: ${asset.assetId}`);
  }
  publicAssets.push({
    assetId:asset.assetId,
    caseId:asset.caseId,
    role:asset.role,
    url:`${PUBLIC_BASE_PATH}/${source.normalized}`,
    sha256:asset.sha256,
    width:asset.width,
    height:asset.height,
    preAnswerAlt:asset.preAnswerAlt,
  });
}

const safePublicCatalog = {
  schemaVersion:3,
  datasetId:DATASET_ID,
  runtimeStatus:'pending_medical_validation',
  cases:publicCatalog.map(item => ({
    ...item,
    assetPath:`${PUBLIC_BASE_PATH}/${String(item.assetPath).replaceAll('\\', '/')}`,
  })),
};
await writeFile(path.join(tempPublicRoot, 'catalog.json'), json(safePublicCatalog));
await writeFile(path.join(tempPublicRoot, 'assets.json'), json({
  schemaVersion:3,
  datasetId:DATASET_ID,
  assets:publicAssets,
}));

const caseById = by(cases, 'id');
const adminById = by(adminCatalog, 'id');
const trainingById = by(trainingCandidates, 'caseId');
const microtaskById = by(microtasks, 'caseId');
const assetsByCase = new Map();
for (const asset of assets) {
  if (!assetsByCase.has(asset.caseId)) assetsByCase.set(asset.caseId, []);
  assetsByCase.get(asset.caseId).push(asset);
}
const batchManifests = [];

for (let start = 0; start < cases.length; start += BATCH_SIZE) {
  const batchCases = cases.slice(start, start + BATCH_SIZE);
  const batchIndex = start / BATCH_SIZE;
  const batchId = `batch_${String(batchIndex).padStart(3, '0')}`;
  const records = batchCases.map(originalCase => {
    const excludedNonEcgFindings = (originalCase.sourceDerivedKeyFindings || [])
      .filter(isRadiographFinding);
    const caseRecord = {
      ...originalCase,
      sourceDerivedKeyFindings:(originalCase.sourceDerivedKeyFindings || [])
        .filter(entry => !isRadiographFinding(entry)),
      stagingTransform:{
        excludedNonEcgFindingCount:excludedNonEcgFindings.length,
        excludedNonEcgFindings,
      },
    };
    return {
      case:caseRecord,
      adminCatalog:adminById.get(originalCase.id),
      assets:assetsByCase.get(originalCase.id) || [],
      trainingCandidate:trainingById.get(originalCase.id),
      microtaskCandidate:microtaskById.get(originalCase.id),
    };
  });
  const batch = {
    schemaVersion:1,
    datasetId:DATASET_ID,
    batchId,
    importMode:'staging',
    runtimeEnabled:false,
    caseCount:records.length,
    caseIds:records.map(record => record.case.id),
    records,
  };
  const contents = json(batch);
  if (Buffer.byteLength(contents) > 650 * 1024) {
    throw new Error(`${batchId}: lote excede o limite operacional de 650 KiB`);
  }
  const batchFile = `${batchId}.json`;
  await writeFile(path.join(tempStagingRoot, 'batches', batchFile), contents);
  batchManifests.push({
    batchId,
    path:`batches/${batchFile}`,
    caseCount:records.length,
    firstCaseId:records[0].case.id,
    lastCaseId:records.at(-1).case.id,
    sha256:sha256(contents),
    byteLength:Buffer.byteLength(contents),
  });
}

const confirmedRights = {
  ...sourceRights,
  authorizationBasis:'owner_confirmation_recorded_in_project',
  confirmationRecord:'docs/ECG_RIGHTS_DECLARATION.md',
  confirmedOn:PREPARED_ON,
  publicAssetDeliveryAuthorized:true,
  publicRedistributionAuthorized:false,
  attributionCorrection:{
    invalidSourceLabels:['hampton', 'hamptom'],
    correction:'material próprio do Ágora do Saber',
  },
};
const activation = {
  ...sourceActivation,
  publicAssetDeliveryEnabled:true,
  runtimeTrainingGloballyEnabled:false,
  managementQuestionGenerationEnabled:false,
  questionImageMatchingGloballyEnabled:false,
};

const globals = {
  'activation-manifest.json':activation,
  'case-concept-matrix.json':matrix,
  'clusters.json':clusters,
  'concepts.json':concepts,
  'content-rights.json':confirmedRights,
  'high-priority-review-cases.json':highPriorityCases,
  'learning-path.json':learningPath,
  'relations.json':relations,
  'visual-tags.json':visualTags,
};
for (const [name, value] of Object.entries(globals)) {
  await writeFile(path.join(tempStagingRoot, 'globals', name), json(value));
}

const importManifest = {
  schemaVersion:1,
  datasetId:DATASET_ID,
  sourceSchemaVersion:3,
  sourceZipSha256:EXPECTED_ZIP_SHA256,
  preparedOn:PREPARED_ON,
  importMode:'staging',
  batchSize:BATCH_SIZE,
  batchCount:batchManifests.length,
  caseCount:cases.length,
  assetCount:assets.length,
  publicBasePath:PUBLIC_BASE_PATH,
  publicCatalogPath:`${PUBLIC_BASE_PATH}/catalog.json`,
  publicAssetInventoryPath:`${PUBLIC_BASE_PATH}/assets.json`,
  rightsConfirmation:'docs/ECG_RIGHTS_DECLARATION.md',
  provenanceCorrection:'Hampton/Hamptom foi uma inferência incorreta de IA; material próprio do Ágora do Saber.',
  medicalValidationComplete:false,
  runtimeTrainingEnabled:false,
  excludedNonEcgFindingCount:cases.reduce(
    (total, item) =>
      total + (item.sourceDerivedKeyFindings || []).filter(isRadiographFinding).length,
    0,
  ),
  batches:batchManifests,
};
await writeFile(path.join(tempStagingRoot, 'import-manifest.json'), json(importManifest));

await replaceDirectory(tempPublicRoot, finalPublicRoot);
await replaceDirectory(tempStagingRoot, finalStagingRoot);
await rm(tempRoot, { recursive:true, force:true });

const publicSize = (
  await Promise.all(publicAssets.map(async asset => {
    const relative = asset.url.slice(`${PUBLIC_BASE_PATH}/`.length);
    return (await stat(path.join(finalPublicRoot, ...relative.split('/')))).size;
  }))
).reduce((sum, size) => sum + size, 0);

console.log(JSON.stringify({
  ok:true,
  datasetId:DATASET_ID,
  importMode:'staging',
  cases:cases.length,
  batches:batchManifests.length,
  batchSize:BATCH_SIZE,
  assets:assets.length,
  publicAssetBytes:publicSize,
  medicalValidationComplete:false,
  runtimeTrainingEnabled:false,
  remainingWarnings:validationReport.warnings.filter(message =>
    message.includes('releitura independente')
  ),
  stagingResolutions:[
    'origem e autorização confirmadas em docs/ECG_RIGHTS_DECLARATION.md',
    'referência Hampton/Hamptom rejeitada como inferência incorreta de IA',
    '21 achados não ECG separados da projeção de staging',
  ],
}, null, 2));
