const compactText = value => String(value || '').replace(/\s+/g, ' ').trim();

export const FAMED_FLASHCARD_GENERATION_VERSION = 'famed-essential-direct-v9';

export const getFamedStudyMaterials = subject => {
  const study = subject?.famedStudy && typeof subject.famedStudy === 'object'
    ? subject.famedStudy
    : {};
  return {
    ...study,
    pastQuestionSets:Array.isArray(study.pastQuestionSets) ? study.pastQuestionSets : [],
    essentialFlashcards:Array.isArray(study.essentialFlashcards) ? study.essentialFlashcards : [],
  };
};

export const famedPastQuestions = subject => getFamedStudyMaterials(subject).pastQuestionSets
  .flatMap(set => Array.isArray(set?.questions) ? set.questions : []);

export const famedEssentialFlashcards = subject => getFamedStudyMaterials(subject).essentialFlashcards;

export const famedLessonSourceText = subject => (subject?.topics || []).map((topic, topicIndex) => {
  const sections = Object.entries(topic?.lessonSections || {})
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([, section]) => typeof section === 'string' ? section : section?.content || '')
    .filter(Boolean)
    .join('\n\n');
  return sections ? `## Aula ${topicIndex + 1}: ${topic.title || `Tópico ${topicIndex + 1}`}\n${sections}` : '';
}).filter(Boolean).join('\n\n');

export const hasFamedGeneratedLesson = subject => {
  const topics = subject?.topics || [];
  return topics.length > 0 && topics.every(topic => {
    if (!topic?.lessonGenerated) return false;
    return Object.values(topic.lessonSections || {}).some(section =>
      compactText(typeof section === 'string' ? section : section?.content)
    );
  });
};

export const famedPastQuestionsSourceText = subject => getFamedStudyMaterials(subject).pastQuestionSets
  .map((set, setIndex) => {
    const questions = (set?.questions || []).map((question, questionIndex) => {
      const options = (question.options || []).map(option =>
        `${option.letter || ''}) ${compactText(option.text)}${option.isCorrect ? ' [CORRETA]' : ''}`
      ).join('\n');
      const expected = compactText(question.expectedAnswer)
        || compactText(question.options?.find(option => option.isCorrect)?.letter);
      return [
        `### Questão ${questionIndex + 1}`,
        compactText(question.caseContext),
        compactText(question.statement),
        options,
        expected ? `Gabarito/Resposta esperada: ${expected}` : '',
        compactText(question.explanation) ? `Explicação: ${compactText(question.explanation)}` : '',
      ].filter(Boolean).join('\n');
    }).join('\n\n');
    return questions ? `## ${set?.title || `Bloco ${setIndex + 1}`}\n${questions}` : '';
  })
  .filter(Boolean)
  .join('\n\n');

const hashText = value => {
  let hash = 2166136261;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

export const famedFlashcardSourceSignature = subject => hashText(JSON.stringify({
  lesson:famedLessonSourceText(subject),
  pastQuestions:famedPastQuestionsSourceText(subject),
}));

export const buildFamedFlashcardAuditExport = (subject, {
  content={},
  exportedAt=new Date().toISOString(),
} = {}) => {
  const study = getFamedStudyMaterials(subject);
  const currentSourceSignature = famedFlashcardSourceSignature(subject);
  return {
    schema:'agora-famed-flashcard-audit-v1',
    exportedAt,
    purpose:'Auditar erros dos flashcards e aperfeiçoar o prompt de geração da FAMED.',
    content:{
      id:content?.id || subject?.famedMeta?.contentId || subject?.id || '',
      title:content?.title || subject?.title || '',
      discipline:content?.discipline || subject?.famedMeta?.discipline || '',
      scheduleItemId:content?.scheduleItemId || subject?.famedMeta?.scheduleItemId || '',
    },
    generation:{
      version:study.flashcardGenerationVersion || null,
      generatedAt:study.flashcardGeneratedAt || null,
      savedSourceSignature:study.flashcardSourceSignature || null,
      currentSourceSignature,
      sourcesStillMatch:study.flashcardSourceSignature === currentSourceSignature,
    },
    reviewChecklist:[
      'O cartão pertence ao núcleo 20/80 ou deveria ser removido?',
      'A evidência veio de questão média/difícil ou de cobrança trivial?',
      'O conteúdo é importante para prova, vida real ou ambos?',
      'A pergunta é direta, inequívoca e cobra o núcleo central identificado pelas pistas?',
      'O back exige um item curto ou, excepcionalmente, dois itens curtos explicitamente solicitados?',
      'A pergunta evita listas, tríades, enumerações e respostas com três ou mais itens?',
      'A pergunta evita verbos de inventário e não mostra parte de uma lista para pedir o restante?',
      'A pergunta evita “além de X” para cobrar os demais membros de um conjunto?',
      'O singular/plural da pergunta corresponde exatamente à quantidade de itens no back?',
      'Medicamentos e exames são cobrados por um papel individual e decisório, nunca por pertença a uma lista?',
      'Cada detalhe sem apoio de questão média/difícil passa pelo teste contrafactual de impacto clínico?',
      'A pergunta e a resposta podem ser corrigidas de forma objetiva, sem alternativas implícitas?',
      'A Explicação ensina de verdade o porquê, como ou a diferença relevante?',
    ],
    flashcards:study.essentialFlashcards.map((flashcard, index) => ({
      ordinal:index + 1,
      ...flashcard,
    })),
    sourceEvidence:{
      lessonText:famedLessonSourceText(subject),
      pastQuestionsText:famedPastQuestionsSourceText(subject),
    },
  };
};

export const getFamedFlashcardState = subject => {
  const study = getFamedStudyMaterials(subject);
  const lessonReady = hasFamedGeneratedLesson(subject);
  const pastQuestionCount = famedPastQuestions(subject).length;
  const flashcardCount = study.essentialFlashcards.length;
  const sourceSignature = famedFlashcardSourceSignature(subject);
  const fresh = flashcardCount > 0
    && study.flashcardSourceSignature === sourceSignature
    && study.flashcardGenerationVersion === FAMED_FLASHCARD_GENERATION_VERSION;
  return {
    lessonReady,
    pastQuestionCount,
    flashcardCount,
    prerequisitesMet:lessonReady && pastQuestionCount > 0,
    sourceSignature,
    fresh,
    stale:flashcardCount > 0 && !fresh,
  };
};
