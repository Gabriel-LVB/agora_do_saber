const STOP_WORDS = new Set([
  'a','ao','aos','aquela','aquele','aqueles','as','ate','com','como','da','das','de','dela','dele',
  'do','dos','e','em','entre','essa','esse','esta','este','foi','mais','na','nas','no','nos','o','os',
  'ou','para','pela','pelo','por','qual','quais','que','se','sem','ser','sobre','sua','suas','um','uma',
  'assinale','alternativa','afirmacao','afirmacoes','correta','correto','incorreta','incorreto',
  'considere','questao','relacao','respeito','seguinte','seguintes',
]);

const GENERIC_ANSWERS = new Set([
  'a','b','c','d','e','certo','errado','sim','nao','verdadeiro','falso',
  'todas anteriores','nenhuma anteriores',
]);

const PHRASE_ALIASES = [
  [/\bno\s+(?:sinoatrial|sinusal|sa)\b/g, ' no_sinoatrial '],
  [/\beletrocardiogram(?:a|as|ico|icos|ica|icas)\b/g, ' ecg '],
  [/\bpressao\s+arterial\b/g, ' pressao_arterial '],
  [/\binsuficiencia\s+cardiaca\b/g, ' insuficiencia_cardiaca '],
  [/\binfarto\s+agudo\s+do\s+miocardio\b/g, ' infarto_miocardio '],
  [/\bdoenca\s+arterial\s+coronariana\b/g, ' doenca_coronariana '],
  [/\bdiabetes\s+mellitus\b/g, ' diabetes '],
  [/\btomografia\s+computadorizada\b/g, ' tomografia '],
  [/\bressonancia\s+magnetica\b/g, ' ressonancia '],
];

const AXIS_RULES = [
  ['conduta', /\b(?:conduta|manejo|tratamento|terapia|indicado|indicada|primeira escolha|proxima etapa)\b/],
  ['diagnóstico', /\b(?:diagnostico|diagnosticar|confirmacao|confirma|criterio|criterios)\b/],
  ['mecanismo', /\b(?:mecanismo|fisiopatologia|ocorre|acontece|causa|causado|desencadeia)\b/],
  ['função', /\b(?:funcao|responsavel|atua|papel|serve|produz|realiza)\b/],
  ['localização', /\b(?:onde|localizado|localizada|localizacao|situa|origina)\b/],
  ['interpretação', /\b(?:interpreta|interpretacao|achado|indica|representa|significa)\b/],
  ['complicação', /\b(?:complicacao|consequencia|evolucao|prognostico|risco)\b/],
  ['contraindicação', /\b(?:contraindicacao|contraindicado|evitar|nao deve)\b/],
  ['classificação', /\b(?:classificacao|classe|estagio|grau|categoria)\b/],
  ['anatomia', /\b(?:anatomia|estrutura|arteria|veia|irrigacao|inervacao)\b/],
];

const stripMarkup = value => String(value || '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/\{\{c\d+::(.*?)(?:::[^{}]*)?\}\}/g, '$1')
  .replace(/&nbsp;|&amp;|&quot;|&#39;/gi, ' ')
  .replace(/[*_`#>\[\](){}]/g, ' ');

export const normalizeAuditText = value => {
  let normalized = stripMarkup(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  PHRASE_ALIASES.forEach(([pattern, replacement]) => {
    normalized = normalized.replace(pattern, replacement);
  });
  return normalized
    .replace(/[^a-z0-9_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const lightStem = token => {
  if (token.includes('_') || token.length < 6) return token;
  return token
    .replace(/(?:amentos|imentos|acoes|logias|idades|mente)$/i, '')
    .replace(/(?:amento|imento|acao|logia|idade)$/i, '')
    .replace(/(?:icos|icas|osos|osas)$/i, '')
    .replace(/(?:ico|ica|oso|osa)$/i, '')
    .replace(/(?:es|s)$/i, '');
};

export const tokenizeAuditText = value => normalizeAuditText(value)
  .split(' ')
  .filter(token => token.length > 1 && !STOP_WORDS.has(token))
  .map(lightStem)
  .filter(Boolean);

export const getQuestionCorrectAnswer = question => {
  const expected = stripMarkup(question?.expectedAnswer || '').trim();
  if (expected) return expected;
  const option = (question?.options || []).find(item => item?.isCorrect);
  return stripMarkup(option?.text || option?.txt || '').trim();
};

const detectQuestionAxis = question => {
  const normalized = normalizeAuditText(`${question?.statement || ''} ${question?.caseContext || ''}`);
  return AXIS_RULES.find(([, pattern]) => pattern.test(normalized))?.[0] || 'conceito';
};

const conceptFromAnswer = answer => {
  const normalized = normalizeAuditText(answer);
  if (!normalized || GENERIC_ANSWERS.has(normalized) || /^[vfcex\s]+$/i.test(normalized)) return null;
  const tokens = tokenizeAuditText(normalized);
  if (!tokens.length || tokens.length > 12) return null;
  return [...new Set(tokens)].slice(0, 10).join(' ');
};

const recordLabel = record => [record.subject, record.lesson, record.block].filter(Boolean).join(' · ');

export const collectAuditableQuestions = ({ sharedLibraryItems = [], vqBlocks = {} } = {}) => {
  const records = [];
  const seenLocations = new Set();
  const add = (question, context) => {
    if (!question || question.isFlashcard) return;
    const statement = stripMarkup(question.statement || '').trim();
    if (!statement) return;
    const locationKey = `${context.source}|${context.containerId}|${context.blockId || ''}|${question.id || statement}`;
    if (seenLocations.has(locationKey)) return;
    seenLocations.add(locationKey);
    records.push({
      key:locationKey,
      question,
      questionId:String(question.id || ''),
      statement,
      answer:getQuestionCorrectAnswer(question),
      source:context.source,
      sourceLabel:context.source === 'course' ? 'Curso' : 'Biblioteca',
      subject:String(context.subject || 'Sem matéria'),
      topic:String(context.topic || ''),
      lesson:String(context.lesson || ''),
      block:String(context.block || ''),
      containerId:String(context.containerId || ''),
      label:recordLabel(context),
    });
  };

  sharedLibraryItems.forEach(item => {
    const base = {
      source:'library',
      subject:item?.subject,
      topic:item?.topic,
      lesson:item?.title,
      containerId:item?.id,
    };
    (item?.directQuestions || []).forEach(question => add(question, { ...base, block:'Questões diretas', blockId:'direct' }));
    (item?.clinicalQuestions || []).forEach(question => add(question, { ...base, block:'Questões clínicas', blockId:'clinical' }));
  });

  Object.entries(vqBlocks || {}).forEach(([aulaId, aulaData]) => {
    if (aulaData?.meta?.source === 'shared-library') return;
    const blocks = Array.isArray(aulaData?.blocks) ? {} : (aulaData?.blocks || {});
    Object.entries(blocks).forEach(([blockId, block]) => {
      (block?.questions || []).forEach(question => add(question, {
        source:'course',
        subject:aulaData?.meta?.subject,
        topic:aulaData?.meta?.topic,
        lesson:aulaData?.meta?.aulaTitle || aulaId,
        block:block?.title || blockId,
        blockId,
        containerId:aulaId,
      }));
    });
  });

  return records;
};

const termFrequency = tokens => {
  const counts = new Map();
  tokens.forEach(token => counts.set(token, (counts.get(token) || 0) + 1));
  const max = Math.max(1, ...counts.values());
  return new Map([...counts].map(([token, count]) => [token, count / max]));
};

const dotSimilarity = (left, right) => {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  left.forEach(value => { leftNorm += value * value; });
  right.forEach(value => { rightNorm += value * value; });
  const [small, large] = left.size <= right.size ? [left, right] : [right, left];
  small.forEach((value, token) => { dot += value * (large.get(token) || 0); });
  return leftNorm && rightNorm ? dot / Math.sqrt(leftNorm * rightNorm) : 0;
};

const jaccardSimilarity = (leftTokens, rightTokens) => {
  const left = new Set(leftTokens);
  const right = new Set(rightTokens);
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  left.forEach(token => { if (right.has(token)) intersection += 1; });
  return intersection / (left.size + right.size - intersection);
};

const buildVectors = records => {
  const docs = records.map(record => {
    const statementTokens = tokenizeAuditText(`${record.question?.caseContext || ''} ${record.statement}`);
    const answerTokens = tokenizeAuditText(record.answer);
    return { statementTokens, answerTokens, allTokens:[...statementTokens, ...answerTokens, ...answerTokens] };
  });
  const documentFrequency = new Map();
  docs.forEach(doc => {
    new Set(doc.allTokens).forEach(token => documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1));
  });
  return docs.map(doc => {
    const tf = termFrequency(doc.allTokens);
    const vector = new Map();
    tf.forEach((frequency, token) => {
      const idf = Math.log((records.length + 1) / ((documentFrequency.get(token) || 0) + 1)) + 1;
      vector.set(token, frequency * idf);
    });
    return { ...doc, vector };
  });
};

const comparePair = (left, right, leftDoc, rightDoc) => {
  const normalizedLeft = normalizeAuditText(left.statement);
  const normalizedRight = normalizeAuditText(right.statement);
  const exact = normalizedLeft.length >= 12 && normalizedLeft === normalizedRight;
  const answerLeft = conceptFromAnswer(left.answer);
  const answerRight = conceptFromAnswer(right.answer);
  const sameAnswer = !!answerLeft && answerLeft === answerRight;
  const textCosine = dotSimilarity(leftDoc.vector, rightDoc.vector);
  const statementOverlap = jaccardSimilarity(leftDoc.statementTokens, rightDoc.statementTokens);
  const answerOverlap = jaccardSimilarity(leftDoc.answerTokens, rightDoc.answerTokens);
  let score = (textCosine * 0.58) + (statementOverlap * 0.27) + (answerOverlap * 0.15);
  if (sameAnswer && statementOverlap >= 0.24) score = Math.max(score, 0.72 + Math.min(0.16, statementOverlap * 0.2));
  if (exact) score = 1;
  return {
    score,
    exact,
    sameAnswer,
    textCosine,
    statementOverlap,
    answerOverlap,
  };
};

const severityFor = comparison => {
  if (comparison.exact || comparison.score >= 0.84) return 'probable';
  if (comparison.score >= 0.68) return 'review';
  return null;
};

const buildCandidatePairs = (records, docs) => {
  const bySubject = new Map();
  records.forEach((record, index) => {
    const subject = normalizeAuditText(record.subject) || 'sem materia';
    bySubject.set(subject, [...(bySubject.get(subject) || []), index]);
  });

  const pairKeys = new Set();
  const addPair = (left, right) => {
    if (left === right) return;
    pairKeys.add(left < right ? `${left}:${right}` : `${right}:${left}`);
  };
  bySubject.forEach(indices => {
    const inverted = new Map();
    const exactStatements = new Map();
    const concepts = new Map();
    indices.forEach(index => {
      const normalizedStatement = normalizeAuditText(records[index].statement);
      if (normalizedStatement.length >= 12) {
        exactStatements.set(normalizedStatement, [...(exactStatements.get(normalizedStatement) || []), index]);
      }
      const concept = conceptFromAnswer(records[index].answer);
      if (concept) concepts.set(concept, [...(concepts.get(concept) || []), index]);
      const usefulTokens = new Set([
        ...docs[index].statementTokens,
        ...docs[index].answerTokens,
      ].filter(token => token.length >= 3));
      usefulTokens.forEach(token => inverted.set(token, [...(inverted.get(token) || []), index]));
    });
    const candidateCounts = new Map();
    inverted.forEach(tokenIndices => {
      if (tokenIndices.length > Math.max(30, indices.length * 0.45)) return;
      for (let i = 0; i < tokenIndices.length; i += 1) {
        for (let j = i + 1; j < tokenIndices.length; j += 1) {
          const key = `${tokenIndices[i]}:${tokenIndices[j]}`;
          candidateCounts.set(key, (candidateCounts.get(key) || 0) + 1);
        }
      }
    });
    candidateCounts.forEach((sharedTerms, key) => {
      if (sharedTerms < 2) return;
      const [left, right] = key.split(':').map(Number);
      addPair(left, right);
    });
    exactStatements.forEach(group => {
      for (let i = 0; i < group.length; i += 1) {
        for (let j = i + 1; j < group.length; j += 1) addPair(group[i], group[j]);
      }
    });
    concepts.forEach(group => {
      if (group.length > Math.max(40, indices.length * 0.5)) return;
      for (let i = 0; i < group.length; i += 1) {
        for (let j = i + 1; j < group.length; j += 1) addPair(group[i], group[j]);
      }
    });
  });
  return [...pairKeys].map(key => key.split(':').map(Number));
};

const buildConceptGroups = records => {
  const groups = new Map();
  records.forEach(record => {
    const concept = conceptFromAnswer(record.answer);
    if (!concept) return;
    const subjectKey = normalizeAuditText(record.subject) || 'sem materia';
    const key = `${subjectKey}|${concept}`;
    const axis = detectQuestionAxis(record.question);
    const current = groups.get(key) || {
      key,
      subject:record.subject,
      concept,
      label:record.answer,
      records:[],
      axes:{},
    };
    current.records.push(record);
    current.axes[axis] = (current.axes[axis] || 0) + 1;
    groups.set(key, current);
  });
  return [...groups.values()]
    .filter(group => group.records.length >= 3)
    .map(group => ({
      ...group,
      sourceCounts:group.records.reduce((counts, record) => ({
        ...counts,
        [record.source]:(counts[record.source] || 0) + 1,
      }), {}),
    }))
    .sort((a, b) => b.records.length - a.records.length || a.label.localeCompare(b.label, 'pt-BR'));
};

export const auditQuestionCollection = input => {
  const records = Array.isArray(input) ? input : collectAuditableQuestions(input);
  const docs = buildVectors(records);
  const issues = buildCandidatePairs(records, docs)
    .map(([leftIndex, rightIndex]) => {
      const comparison = comparePair(records[leftIndex], records[rightIndex], docs[leftIndex], docs[rightIndex]);
      const severity = severityFor(comparison);
      if (!severity) return null;
      return {
        id:`${records[leftIndex].key}::${records[rightIndex].key}`,
        severity,
        ...comparison,
        left:records[leftIndex],
        right:records[rightIndex],
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
  const conceptGroups = buildConceptGroups(records);
  const bySource = records.reduce((counts, record) => ({
    ...counts,
    [record.source]:(counts[record.source] || 0) + 1,
  }), {});
  const subjects = [...new Set(records.map(record => record.subject))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  return {
    generatedAt:Date.now(),
    records,
    issues,
    conceptGroups,
    subjects,
    summary:{
      total:records.length,
      course:bySource.course || 0,
      library:bySource.library || 0,
      probable:issues.filter(issue => issue.severity === 'probable').length,
      review:issues.filter(issue => issue.severity === 'review').length,
      saturatedConcepts:conceptGroups.length,
    },
  };
};
