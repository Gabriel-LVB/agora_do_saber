import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const publicRoot = path.join(projectRoot, 'public', 'ecg', 'v3');
const globalsRoot = path.join(projectRoot, 'data', 'ecg', 'staging', 'v3', 'globals');
const readJson = async file => JSON.parse(await readFile(file, 'utf8'));

const [dataset, concepts, matrix] = await Promise.all([
  readJson(path.join(publicRoot, 'cases.json')),
  readJson(path.join(globalsRoot, 'concepts.json')),
  readJson(path.join(globalsRoot, 'case-concept-matrix.json')),
]);

const conceptsByCase = new Map();
matrix.forEach(row => {
  const caseId = String(row?.caseId || '');
  if (!caseId) return;
  conceptsByCase.set(caseId, [...(conceptsByCase.get(caseId) || []), {
    id:String(row.conceptId),
    role:row.role === 'primary' ? 'primary' : 'secondary',
    weight:Number(row.weight) || 0,
  }]);
});

const cases = (dataset.cases || []).map(item => {
  const principalImage = (item.images || []).find(image =>
    image?.type === 'ecg' && image?.role === 'principal' && image?.phase === 'question'
  );
  if (!principalImage) throw new Error(`${item.id}: ECG principal de questao ausente`);
  const caseConcepts = (conceptsByCase.get(String(item.id)) || [])
    .sort((left, right) => right.weight - left.weight || left.id.localeCompare(right.id));
  if (!caseConcepts.length) throw new Error(`${item.id}: conceitos ausentes`);
  return {
    id:String(item.id),
    image:{
      url:String(principalImage.url),
      width:Number(principalImage.width) || null,
      height:Number(principalImage.height) || null,
    },
    concepts:caseConcepts,
  };
});

const index = {
  schemaVersion:1,
  matchingVersion:'agora-ecg-question-matching-v2',
  datasetId:dataset.datasetId,
  caseCount:cases.length,
  conceptCount:concepts.length,
  concepts:concepts.map(concept => ({
    id:String(concept.id),
    label:String(concept.label || ''),
    aliases:Array.isArray(concept.aliases) ? concept.aliases.map(String) : [],
    parentId:concept.parentId == null ? null : String(concept.parentId),
  })),
  cases,
};

await mkdir(publicRoot, { recursive:true });
const target = path.join(publicRoot, 'question-match-index.json');
await writeFile(target, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  ok:true,
  target:path.relative(projectRoot, target).replaceAll('\\', '/'),
  cases:index.caseCount,
  concepts:index.conceptCount,
  matchingVersion:index.matchingVersion,
}, null, 2));
