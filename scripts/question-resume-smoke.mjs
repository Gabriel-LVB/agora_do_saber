import assert from 'node:assert/strict';
import { buildResumeUpdate, missingLegacyEntries, requestQuestionResume, consumeQuestionResume } from '../src/features/questions/questionResume.js';

const first = buildResumeUpdate([], {key:'first'}, {q1:true}, 2, 1);
const second = buildResumeUpdate(first.next, {key:'second'}, {q1:true}, 3, 2);
assert.deepEqual(second.next.map(entry => entry.key), ['second', 'first']);
const finished = buildResumeUpdate(second.next, {key:'second'}, {q1:true, q2:true, q3:true}, 3, 3);
assert.equal(finished.entry.completed, true);
assert.deepEqual(finished.next.map(entry => entry.key), ['first']);
assert.deepEqual(missingLegacyEntries(second.next, [finished.entry]).map(entry => entry.key), ['first']);
assert.equal(buildResumeUpdate(first.next, {key:'first'}, {}, 2).entry.completed, true);
assert.equal(buildResumeUpdate([], {key:'cards'}, {q1:'wrong'}, 1, 4, false).entry.completed, false);
requestQuestionResume('first');
assert.equal(consumeQuestionResume('other'), false);
assert.equal(consumeQuestionResume('first'), true);
assert.equal(consumeQuestionResume('first'), false);
console.log('question-resume-smoke ok');
