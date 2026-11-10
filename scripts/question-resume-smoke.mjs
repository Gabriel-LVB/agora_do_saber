import assert from 'node:assert/strict';
import { readQuestionResume, saveQuestionResume } from '../src/features/questions/questionResume.js';

const data = new Map();
globalThis.window = {localStorage:{getItem:key => data.get(key) ?? null, setItem:(key, value) => data.set(key, value)}};
const first = {key:'first'};
const second = {key:'second'};
saveQuestionResume('user', first, {q1:true}, 2);
saveQuestionResume('user', second, {q1:true}, 3);
assert.deepEqual(readQuestionResume('user').map(entry => entry.key), ['second', 'first']);
saveQuestionResume('user', second, {q1:true, q2:true, q3:true}, 3);
assert.deepEqual(readQuestionResume('user').map(entry => entry.key), ['first']);
assert.deepEqual(readQuestionResume('other'), []);
saveQuestionResume('user', first, {}, 2);
assert.deepEqual(readQuestionResume('user'), []);
console.log('question-resume-smoke ok');
