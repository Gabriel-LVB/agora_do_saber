import { createHash } from 'node:crypto';
import {
  copyFile,
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const sourceRoot = path.resolve(process.argv[2] || '');
const publicRoot = path.join(projectRoot, 'public', 'ecg', 'v3');
const extrasRoot = path.join(publicRoot, 'extras');
const expectedCaseIds = Array.from(
  { length:150 },
  (_, index) => `ECG${String(index + 1).padStart(3, '0')}`,
);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;

const safeSourcePath = relativePath => {
  const normalized = String(relativePath || '').replaceAll('\\', '/');
  const resolved = path.resolve(sourceRoot, ...normalized.split('/'));
  if (
    !normalized
    || path.isAbsolute(normalized)
    || normalized.split('/').includes('..')
    || !resolved.startsWith(`${sourceRoot}${path.sep}`)
  ) {
    throw new Error(`Caminho inseguro no pacote: ${relativePath}`);
  }
  return { normalized, resolved };
};

if (!process.argv[2]) {
  console.error('Uso: npm run import:ecg-site-pack -- <diretorio-extraido-do-pacote-original>');
  process.exit(2);
}

const sourceCases = JSON.parse(
  await readFile(path.join(sourceRoot, 'dados', 'cases.json'), 'utf8'),
);
const publicInventory = JSON.parse(
  await readFile(path.join(publicRoot, 'assets.json'), 'utf8'),
);
const publicCatalog = JSON.parse(
  await readFile(path.join(publicRoot, 'catalog.json'), 'utf8'),
);
const principalByCase = new Map(
  publicInventory.assets
    .filter(asset => asset.role === 'principal')
    .map(asset => [asset.caseId, asset]),
);

if (sourceCases.length !== 150) {
  throw new Error(`Esperados 150 casos; encontrados ${sourceCases.length}`);
}
const sourceIds = new Set(sourceCases.map(item => item.id));
if (
  sourceIds.size !== 150
  || !expectedCaseIds.every(id => sourceIds.has(id))
) {
  throw new Error('Sequência ECG001..ECG150 incompleta ou duplicada');
}

await rm(extrasRoot, { recursive:true, force:true });
await mkdir(extrasRoot, { recursive:true });

let imageCount = 0;
let questionImageCount = 0;
let answerImageCount = 0;
const cases = [];

for (const item of sourceCases) {
  for (const field of [
    'enunciado',
    'pergunta_sugerida',
    'resumo',
    'interpretacao_clinica',
    'resposta_completa',
  ]) {
    if (!String(item[field] || '').trim()) {
      throw new Error(`${item.id}: campo obrigatório ausente (${field})`);
    }
  }

  const images = [];
  for (const image of item.imagens || []) {
    const source = safeSourcePath(image.path);
    const contents = await readFile(source.resolved);
    const isPrincipal = image.role === 'principal';
    const isAnswer = image.role === 'resposta_extra'
      || /(^|[/_])resposta([/_]|$)/i.test(source.normalized);
    let url;

    if (isPrincipal) {
      const principal = principalByCase.get(item.id);
      if (!principal) throw new Error(`${item.id}: ECG principal não existe no inventário público`);
      if (sha256(contents) !== principal.sha256) {
        throw new Error(`${item.id}: ECG principal diverge entre pacote original e v3`);
      }
      url = principal.url;
    } else {
      const filename = path.basename(source.normalized);
      const destination = path.join(extrasRoot, item.id, filename);
      await mkdir(path.dirname(destination), { recursive:true });
      await copyFile(source.resolved, destination);
      if (sha256(await readFile(destination)) !== sha256(contents)) {
        throw new Error(`${item.id}: imagem extra divergiu após cópia`);
      }
      url = `/ecg/v3/extras/${item.id}/${filename}`;
    }

    images.push({
      url,
      type:image.type || 'ecg',
      role:image.role || (isAnswer ? 'answer_support' : 'question_support'),
      phase:isAnswer ? 'answer' : 'question',
      sha256:sha256(contents),
      width:image.width,
      height:image.height,
      sourcePage:image.source_page,
    });
    imageCount += 1;
    if (isAnswer) answerImageCount += 1;
    else questionImageCount += 1;
  }

  if (!images.some(image => image.role === 'principal')) {
    throw new Error(`${item.id}: ECG principal ausente`);
  }

  cases.push({
    id:item.id,
    number:item.numero,
    title:item.titulo,
    primaryFamily:item.familia_principal,
    families:item.familias || [],
    subfamily:item.subfamilia || '',
    tags:item.tags || [],
    prompt:item.enunciado,
    suggestedQuestion:item.pergunta_sugerida,
    shortAnswer:item.resumo,
    findings:item.achados_ecg_rx || '',
    clinicalInterpretation:item.interpretacao_clinica,
    management:item.conduta || '',
    fullAnswer:item.resposta_completa,
    images,
  });
}

const runtimeDataset = {
  schemaVersion:1,
  datasetId:'agora_ecg_cases_owner_provided_v1',
  contentStatus:'owner_provided_complete',
  source:'Casos_ECG_site_pack.zip',
  sourceZipSha256:'981F05618F4A0CDA0FB0C003D548A4E0194B503B9EDC501EF9C4446FD5A241E0',
  caseCount:cases.length,
  imageCount,
  questionImageCount,
  answerImageCount,
  answerRevealRequired:true,
  cases,
};
await writeFile(path.join(publicRoot, 'cases.json'), json(runtimeDataset));
await writeFile(path.join(publicRoot, 'catalog.json'), json({
  ...publicCatalog,
  datasetId:runtimeDataset.datasetId,
  contentStatus:runtimeDataset.contentStatus,
  runtimeStatus:'owner_provided_complete',
  cases:(publicCatalog.cases || []).map(item => ({
    ...item,
    runtimeStatus:'owner_provided_complete',
  })),
}));

console.log(JSON.stringify({
  ok:true,
  datasetId:runtimeDataset.datasetId,
  cases:cases.length,
  images:imageCount,
  questionImages:questionImageCount,
  answerImages:answerImageCount,
  families:new Set(cases.map(item => item.primaryFamily)).size,
}, null, 2));
