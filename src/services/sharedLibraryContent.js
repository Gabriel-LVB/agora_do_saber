export const SHARED_LIBRARY_CHUNKS_COLLECTION = 'chunks';
export const SHARED_LIBRARY_CHUNKED_FIELDS = ['directQuestions', 'clinicalQuestions'];

const SHARED_LIBRARY_CHUNK_BYTE_LIMIT = 650000;

const byteSize = (value) => {
  const text = JSON.stringify(value ?? null);
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text).length;
  return text.length;
};

export const sharedLibraryChunkDocId = (field, index) =>
  `${field}_${String(index).padStart(3, '0')}`;

export const splitSharedLibraryQuestionChunks = (questions = [], maxBytes = SHARED_LIBRARY_CHUNK_BYTE_LIMIT) => {
  const chunks = [];
  let current = [];
  for (const question of questions) {
    const candidate = [...current, question];
    if (current.length && byteSize({ questions:candidate }) > maxBytes) {
      chunks.push(current);
      current = [question];
    } else {
      current = candidate;
    }
  }
  if (current.length) chunks.push(current);
  return chunks;
};

export const prepareSharedLibraryContentForWrite = (item = {}, { updatedAt = Date.now() } = {}) => {
  const main = { ...item };
  const questionChunks = { ...(main.questionChunks || {}) };
  const chunks = {};

  SHARED_LIBRARY_CHUNKED_FIELDS.forEach(field => {
    if (!Array.isArray(main[field])) return;
    const fieldChunks = splitSharedLibraryQuestionChunks(main[field]);
    chunks[field] = fieldChunks.map((questions, index) => ({
      id:sharedLibraryChunkDocId(field, index),
      data:{
        field,
        index,
        count:questions.length,
        questions,
        updatedAt,
      },
    }));
    questionChunks[field] = {
      chunked:true,
      count:main[field].length,
      parts:fieldChunks.length,
      updatedAt,
    };
    delete main[field];
  });

  main.questionChunks = questionChunks;
  return { main, chunks };
};

export const mergeSharedLibraryQuestionChunks = (item = {}, chunkDocs = []) => {
  const questionChunks = item.questionChunks || {};
  let next = item;

  SHARED_LIBRARY_CHUNKED_FIELDS.forEach(field => {
    const meta = questionChunks[field];
    if (!meta?.chunked) return;
    const expectedParts = Math.max(0, Number(meta.parts) || 0);
    const docs = chunkDocs
      .filter(chunk => chunk.field === field || String(chunk.id || '').startsWith(`${field}_`))
      .filter(chunk => (Number(chunk.index) || 0) < expectedParts)
      .sort((a, b) => (Number(a.index) || 0) - (Number(b.index) || 0));
    next = {
      ...next,
      [field]:docs.flatMap(chunk => Array.isArray(chunk.questions) ? chunk.questions : []),
    };
  });

  return next;
};
