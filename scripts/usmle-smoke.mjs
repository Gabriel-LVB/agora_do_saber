import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import { validateUsmlePackage,filterQuestions,createSession,remainingTime,sessionScore,questionKey,performanceRows,recordableAnswers,reconcileSessionAnswers } from '../src/services/usmleModel.js';
import { buildQuestionChunks,readUsmleZip } from '../src/services/usmlePackage.js';
import { formatUsmleStatement } from '../src/features/usmle/usmleText.js';

const flattened = 'An episode lasted 10 seconds The symptoms occurred during exercise She has a 3-year history of symptoms Radial pulses are decreased bilaterally The patient most likely has which finding?';
const readable = formatUsmleStatement(flattened);
assert.equal(readable.split('\n\n').length,5);
assert.equal(readable.replace(/\s+/g,' '),flattened,'Formatting must preserve every source word and its punctuation');
assert.equal(formatUsmleStatement('History.\nExamination.\n\nWhich of the following?'),'History.\nExamination.\n\nWhich of the following?');
assert.equal(formatUsmleStatement('Dr. Smith reports a value of 3.5 mg/dL and an ECG with ST changes.'),'Dr. Smith reports a value of 3.5 mg/dL and an ECG with ST changes.');

const question = { id:'q1',questionBank:'Mehlman',subject:'Test subject',discipline:'Test discipline',topic:'Test topic',statement:'Choose an option.',correctAnswer:'B',options:[{ letter:'A',text:'One' },{ letter:'B',text:'Two' }],images:[],audio:[] };
const input = { schema:'agora-usmle-question-package-v1',title:'Test package',subject:'Test subject',questions:[question] };
const parsed = validateUsmlePackage(input,'step2');
assert.equal(parsed.questions[0].questionBank,'Mehlman');
assert.equal(parsed.questions[0].options[1].isCorrect,true);
assert.equal(parsed.step,'step2');
assert.throws(() => validateUsmlePackage({ ...input,questions:[question,question] }),/repetido/);
assert.throws(() => validateUsmlePackage({ ...input,questions:[{ ...question,correctAnswer:'F' }] }),/gabarito/);
assert.throws(() => validateUsmlePackage({ ...input,questions:[{ ...question,images:[{ file:'images/../../secrets.png',placement:'front' }] }] }),/caminho/);
const incomplete = validateUsmlePackage({ ...input,questions:[{ ...question,options:[],optionsInImage:true }] });
assert.equal(incomplete.questions.length,1);
assert.equal(incomplete.warnings.missingVisual,1);
assert.equal(filterQuestions(incomplete.questions).length,0);
const qs = Array.from({ length:5 },(_,i) => ({ ...parsed.questions[0],id:`q${i}`,key:questionKey('pack',`q${i}`),packageId:'pack',release:'v1' }));
const progress = { [qs[0].key]:{ lastAnswer:'A',lastCorrect:false,firstCorrect:false },[qs[1].key]:{ lastAnswer:'B',lastCorrect:true,firstCorrect:true,favorite:true,note:'note' } };
assert.equal(filterQuestions(qs,{ status:'unused' },progress).length,3);
assert.deepEqual(filterQuestions(qs,{ status:'incorrect' },progress).map(q => q.key),[qs[0].key]);
assert.equal(filterQuestions(qs,{ status:'favorites' },progress).length,1);
assert.equal(filterQuestions(qs,{ search:'secret answer' },progress).length,0);
assert.equal(filterQuestions([{ ...qs[0],sourceHasAudio:true,audio:[] }]).length,0);
assert.equal(filterQuestions([{ ...qs[0],sourceHasAudio:true,audio:[] }],{ includeMissingAudio:true }).length,1);
const s = createSession(qs,{ count:3,step:'step2',mode:'exam',timed:true,random:false },1000);
assert.equal(s.questionRefs.length,3);
assert.equal(s.questionRefs[0].key,qs[0].key);
assert.equal(s.durationSeconds,270);
assert.equal(remainingTime({ ...s,runningSince:1000 },11000),260);
assert.equal(remainingTime({ ...s,runningSince:null,status:'paused' },999000),270);
assert.equal(remainingTime({ ...s,runningSince:1000 },999000),0);
const answered = { ...s,answers:{ [qs[0].key]:{ letter:'B',committed:true },[qs[1].key]:{ letter:'A',committed:true } } };
assert.deepEqual(sessionScore(answered,qs),{ total:3,answered:2,correct:1,incorrect:1,omitted:1,percent:33 });
assert.equal(recordableAnswers(answered).length,0,'Exam progress is hidden until submission');
assert.equal(recordableAnswers({ ...answered,status:'completed' }).length,2);
const recorded = { ...answered,mode:'tutor',answers:{ ...answered.answers,[qs[0].key]:{ letter:'B',committed:true,recorded:true } } };
const navigation = { ...answered,mode:'tutor',index:1 };
assert.equal(reconcileSessionAnswers(navigation,recorded)[qs[0].key].recorded,true,'Navigation must not erase the idempotency marker');
assert.deepEqual(recordableAnswers(navigation,recorded).map(([key]) => key),[qs[1].key]);
assert.equal(performanceRows(qs,progress)[0].percent,50);
assert.equal(questionKey('packA','q1') === questionKey('packB','q1'),false);
const chunked = buildQuestionChunks(Array.from({ length:65 },(_,i) => ({ ...question,id:`q${i}` })));
assert.equal(chunked.length,3);assert.equal(chunked.flatMap(c => c.questions).length,65);
const globals = new Set(['window','document','navigator','console','setTimeout','clearTimeout','setInterval','clearInterval','crypto','TextDecoder','TextEncoder','Uint8Array','btoa','Error','Blob','URL','Map','Set','Promise','Date','Math','Object','Array','String','Number','Boolean','RegExp','React']);
for (const name of await fs.readdir(new URL('../src/features/usmle/',import.meta.url))) {
  if (!/\.[jt]sx?$/.test(name)) continue;
  const source = await fs.readFile(new URL(`../src/features/usmle/${name}`,import.meta.url),'utf8');
  const ast = parse(source,{ sourceType:'module',plugins:['jsx'] });
  const free = new Set();
  traverseModule.default(ast,{
    ReferencedIdentifier(path) { if (!path.scope.hasBinding(path.node.name) && !globals.has(path.node.name)) free.add(path.node.name); },
    JSXIdentifier(path) { if (/^[A-Z]/.test(path.node.name) && path.parent.type !== 'JSXMemberExpression' && !path.scope.hasBinding(path.node.name) && !globals.has(path.node.name)) free.add(path.node.name); },
  });
  assert.deepEqual([...free],[],`${name}: undeclared identifiers`);
}
const usmleStoreSource = await fs.readFile(new URL('../src/services/usmleStore.js',import.meta.url),'utf8');
assert.match(usmleStoreSource,/export async function deleteAllUsmlePackages/);
assert.match(usmleStoreSource,/for \(const kind of \['chunks','assets'\]\)/);
assert.match(usmleStoreSource,/await deleteDoc\(doc\(db,'usmle_packages',packageId\)\)/);
const usmleImportSource = await fs.readFile(new URL('../src/features/usmle/UsmleImport.jsx',import.meta.url),'utf8');
assert.match(usmleImportSource,/Excluir todas as questões/);
assert.match(usmleImportSource,/window\.confirm/);
if (process.env.USMLE_TEST_ZIP) {
  const bytes = await fs.readFile(process.env.USMLE_TEST_ZIP);
  const pack = await readUsmleZip({ size:bytes.length,name:'test.zip',arrayBuffer:async () => bytes },'step1');
  assert.equal(pack.questions.length,1239);
  assert.equal(pack.assets.length,1235);
  assert.equal(pack.warnings.missingVisual,31);
  assert.equal(pack.warnings.missingAudio,14);
  const reportedStatement = pack.questions.find(q => q.id === 'cardio-1048').statement;
  assert.equal(formatUsmleStatement(reportedStatement).split('\n\n').length,5);
  assert.equal(formatUsmleStatement(reportedStatement).replace(/\s+/g,' '),reportedStatement);
  assert.equal(buildQuestionChunks(pack.questions).flatMap(c => c.questions).length,1239);
  console.log(`USMLE supplied ZIP: ${pack.questions.length} questions, ${pack.assets.length} assets; source issues preserved and identified.`);
}
console.log('usmle-smoke ok');
