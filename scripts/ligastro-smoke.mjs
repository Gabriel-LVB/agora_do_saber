import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const root = new URL('../public/ligastro/',import.meta.url);
const read = relativePath => fs.readFile(new URL(relativePath,root),'utf8');

const [rawMaterial,indexHtml,questionsHtml,appSource,stylesSource,rawVercel,viteSource] = await Promise.all([
  read('data/questions.json'),
  read('index.html'),
  read('questoes.html'),
  read('app.js'),
  read('styles.css'),
  fs.readFile(new URL('../vercel.json',import.meta.url),'utf8'),
  fs.readFile(new URL('../vite.config.js',import.meta.url),'utf8'),
]);
const material = JSON.parse(rawMaterial);
const vercel = JSON.parse(rawVercel);

assert.equal(material.schemaVersion,1);
assert.equal(material.materialId,'ligastro-gastro-s2-2026');
assert.equal(material.total,160);
assert.deepEqual(material.topics.map(topic => topic.questionIds.length),[22,27,44,45,22]);
assert.equal(Object.keys(material.questions).length,160);
assert.equal(new Set(material.topicOrder).size,160);
assert.equal(new Set(material.examOrder).size,160);
assert.deepEqual(new Set(material.topicOrder),new Set(Object.keys(material.questions)));
assert.deepEqual(new Set(material.examOrder),new Set(Object.keys(material.questions)));

const imagePaths = new Set();
for (const [id,question] of Object.entries(material.questions)) {
  assert.equal(question.id,id);
  assert.ok(material.topics.some(topic => topic.id === question.topicId && topic.questionIds.includes(id)),`${id}: tema inválido`);
  assert.equal((question.html.match(/data-correct="true"/g) || []).length,1,`${id}: deve haver um único gabarito`);
  assert.match(question.html,/data-option/);
  assert.match(question.html,/data-answer/);
  assert.doesNotMatch(question.html,/<script\b|\son[a-z]+\s*=|javascript:|data:image/i,`${id}: HTML inseguro ou imagem embutida`);
  for (const match of question.html.matchAll(/src="\.\/assets\/([^"]+)"/g)) imagePaths.add(`assets/${match[1]}`);
}
for (const imagePath of imagePaths) await fs.access(new URL(imagePath,root));
assert.ok(imagePaths.size >= 20,'As figuras das questões devem permanecer no pacote');

assert.match(indexHtml,/questoes\.html\?modo=simulado/);
assert.match(indexHtml,/questoes\.html\?modo=temas/);
assert.match(indexHtml,/<base href="\/ligastro\/"/);
assert.match(questionsHtml,/<base href="\/ligastro\/"/);
assert.match(indexHtml,/https:\/\/www\.instagram\.com\/ligastro\.ufc\//);
assert.equal((indexHtml.match(/questoes\.html\?modo=temas#[^"]+/g) || []).length,5);
assert.match(indexHtml,/incluindo os recalls da T135 e as novíssimas provas da T137/);
assert.match(indexHtml,/Precisou sair\? Não se preocupe, seu progresso fica salvo no próprio navegador\./);
assert.doesNotMatch(questionsHtml,/data-topic-picker|Todos os temas|Voltar aos temas/);
assert.match(questionsHtml,/class="back-link" href="\/ligastro"/);
assert.match(questionsHtml,/Digestório S2/);
assert.match(questionsHtml,/data-grade-exam/);
assert.doesNotMatch(`${indexHtml}\n${questionsHtml}\n${appSource}`,/firebase|access_whitelist|href="\/"/i);

assert.doesNotThrow(() => new Function(appSource));
assert.match(appSource,/ligastro-gastro-s2-progress-v1/);
assert.match(appSource,/localStorage\.setItem/);
assert.match(appSource,/renderTopic\(topic\)/);
assert.match(appSource,/location\.replace\('\/ligastro'\)/);
assert.match(appSource,/Fisiologia: /);
assert.match(appSource,/renderQuestions\(material\.examOrder/);
assert.match(appSource,/gradeQuestion/);
assert.match(stylesSource,/:root\[data-theme="dark"\]/);
assert.match(stylesSource,/@media\(max-width:760px\)/);

assert.ok(vercel.rewrites?.some(rule => rule.source === '/ligastro' && rule.destination === '/ligastro/index.html'));
assert.match(viteSource,/pathname === '\/ligastro'/);
assert.match(viteSource,/\/ligastro\/index\.html/);
assert.match(viteSource,/configurePreviewServer/);

console.log(`ligastro-smoke ok: ${material.total} questões, ${material.topics.length} temas, ${imagePaths.size} figuras`);
