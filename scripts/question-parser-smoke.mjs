import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { parseMarkdownTableAt } from '../src/lib/markdownTables.js';
import { importBulkQuestionText } from '../src/lib/bulkQuestionText.js';

// Execute the actual parsers without mounting React or connecting to Firebase.
const source = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const context = vm.createContext({ parseMarkdownTableAt });
vm.runInContext([
  source.slice(source.indexOf('const EXPLANATION_LABELS ='), source.indexOf('const getCorrectLetter =')),
  source.slice(source.indexOf('const parseData ='), source.indexOf('const renumberClinicalCases =')),
  'globalThis.parseQuestions = parseGeneratedQuestionsByTypes;',
].join('\n'), context);
const types = ['direct', 'vof', 'cespe', 'open', 'essay', 'flashcard', 'cloze'];
const parseQuestions = text => context.parseQuestions(text, 'import', types);

const objective = number => `Questão ${number}
Assinale sua resposta:
A) Primeira opção
B) Segunda opção
Gabarito: B
Entenda o tema:
O comentário responde a outra pergunta: como interpretar o resultado?
Bizu: Preserve este comentário.`;
const parsedObjective = parseQuestions(objective(1)).questions;
assert.equal(parsedObjective.length, 1, 'prose labels must not create a flashcard');
assert.equal(parsedObjective[0].options.find(option => option.isCorrect).originalLetter, 'B');
assert.match(parsedObjective[0].explanation, /outra pergunta: como interpretar/);
assert.equal(parsedObjective[0].bizu, 'Preserve este comentário.');
assert.equal(parseQuestions('Esta pergunta: é apenas prosa.\nEsta resposta: também.').questions.length, 0);

for (const prefix of ['', '## Flashcard 1\n']) {
  const cards = parseQuestions(`${prefix}  Pergunta: Qual é o termo?\n  Resposta: Termo.\n  Explicação: Contexto.`).questions;
  assert.equal(cards.length, 1);
  assert.equal(cards[0].isFlashcard, true);
  assert.equal(cards[0].statement, 'Qual é o termo?');
  assert.equal(cards[0].expectedAnswer, 'Termo.');
  assert.equal(cards[0].explanation, 'Contexto.');
}
assert.equal(parseQuestions('Qual é o termo? | Termo.').questions[0].isFlashcard, true);
const mixed = parseQuestions(`${objective(1)}\n\n## Flashcard 2\nPergunta: Qual é o termo?\nResposta: Termo.`).questions;
assert.equal(mixed.length, 2);
assert.equal(mixed.filter(question => question.isFlashcard).length, 1);

const bulkText = 'AGORA-MULTIBLOCOS-V1\n' + [18, 20].map((count, index) =>
  `=== BLOCO ===\nASSUNTO: Teste\nNOME: Bloco ${index + 1}\n${Array.from({ length:count }, (_, n) => objective(n + 1)).join('\n\n')}\n=== FIM DO BLOCO ===`
).join('\n\n');
const saved = [];
assert.deepEqual(await importBulkQuestionText({
  text:bulkText,
  parseQuestions,
  saveBlock:async block => { saved.push(block.questions.length); },
}), { completedBlocks:2, completedQuestions:38 });
assert.deepEqual(saved, [18, 20]);
console.log('Question parser smoke passed (prose labels, flashcards, mixed types, 38-question bulk import).');
