export const LIBRARY_QUESTION_CHUNK_TYPE = 'question-chunk';
export const LIBRARY_QUESTION_CHUNK_STORAGE = 'library-question-chunks-v1';

export const isLibraryQuestionChunk = item => item?.itemType === LIBRARY_QUESTION_CHUNK_TYPE;

export const hydrateLibraryQuestionChunks = items => {
  const source = Array.isArray(items) ? items : [];
  const chunks = source.filter(isLibraryQuestionChunk);
  const chunksById = new Map(chunks.map(chunk => [String(chunk.id || ''), chunk]));

  return source.filter(item => !isLibraryQuestionChunk(item)).map(item => {
    if (!Array.isArray(item?.topics)) return item;
    return {
      ...item,
      topics:item.topics.map(topic => {
        if (topic?.questionStorage !== LIBRARY_QUESTION_CHUNK_STORAGE) return topic;
        const ids = Array.isArray(topic.questionChunkIds) ? topic.questionChunkIds.map(String) : [];
        const topicChunks = ids.map(id => chunksById.get(id)).filter(Boolean);
        if (!topicChunks.length && Array.isArray(topic.questions) && topic.questions.length) return topic;
        return {
          ...topic,
          questions:topicChunks.flatMap(chunk => Array.isArray(chunk.questions) ? chunk.questions : []),
        };
      }),
    };
  });
};

export const serializeLibrarySubjectForWrite = subject => {
  if (!Array.isArray(subject?.topics)) return subject;
  return {
    ...subject,
    topics:subject.topics.map(topic => topic?.questionStorage === LIBRARY_QUESTION_CHUNK_STORAGE
      ? {...topic, questions:[]}
      : topic),
  };
};

export const libraryQuestionChunkIds = subject => Array.from(new Set(
  (subject?.topics || [])
    .flatMap(topic => Array.isArray(topic?.questionChunkIds) ? topic.questionChunkIds : [])
    .map(id => String(id || '').trim())
    .filter(Boolean),
));
