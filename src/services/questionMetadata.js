export const QUESTION_METADATA_VERSION = 2;
export const QUESTION_METADATA_ANALYSIS_VERSION = 'agora-question-metadata-v2';
export const QUESTION_METADATA_BATCH_SIZE = 30;
export const LEARNING_SELECTION_VERSION = 'agora-learning-selection-v2';

export const QUESTION_METADATA_ENUMS = {
  cognitiveLevel:['recognition', 'understanding', 'application', 'reasoning'],
  learningRole:['core', 'reinforcement', 'variation', 'exam_only'],
  clinicalDepth:['none', 'contextualized', 'integrated'],
  longevity:['evergreen', 'guideline_sensitive', 'course_specific'],
  factualConfidence:['high', 'medium', 'review_required'],
  status:['active', 'reserve', 'deprecated', 'review_required'],
};

const clamp = (value, min, max, fallback = min) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
};

const compactText = (value, max = 1200) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
};

const normalizeId = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80);

const enumValue = (group, value, fallback) =>
  QUESTION_METADATA_ENUMS[group].includes(value) ? value : fallback;

const uniqueStrings = (values = [], max = 12) => [...new Set(
  (Array.isArray(values) ? values : [])
    .map(value => String(value || '').trim())
    .filter(Boolean)
)].slice(0, max);

const optionAnswer = question => (question?.options || [])
  .find(option => option?.isCorrect)?.text || question?.expectedAnswer || '';

const visualHintForQuestion = question => {
  const text = `${question?.statement || ''} ${question?.caseContext || ''}`;
  if (/(?:analise|avalie|interprete|observe|examine|identifique|com base|de acordo)[\s\S]{0,80}\b(?:eletrocardiograma|ecg|tra[cç]ado)\b|\b(?:eletrocardiograma|ecg|tra[cç]ado)\b[\s\S]{0,50}(?:abaixo|acima|a seguir|mostrado|apresentado|exibido|anexo|fornecido|ilustrado)/i.test(text)) {
    return { needsVisual:true, visualType:'ecg' };
  }
  if (/\b(?:imagem|radiografia|tomografia|resson[aâ]ncia|fotografia|l[aâ]mina)\b/i.test(text)) {
    return { needsVisual:true, visualType:'other' };
  }
  return { needsVisual:false, visualType:null };
};

const heuristicQuality = question => {
  const statementLength = String(question?.statement || '').trim().length;
  const options = Array.isArray(question?.options) ? question.options : [];
  const explanationLength = String(question?.explanation || '').trim().length;
  let score = 45;
  if (statementLength >= 30) score += 10;
  if (statementLength >= 80) score += 5;
  if (options.length >= 4) score += 10;
  if (options.some(option => option?.isCorrect)) score += 10;
  if (explanationLength >= 100) score += 10;
  if (options.every(option => String(option?.text || '').trim().length >= 2)) score += 5;
  if (question?.caseContext) score += 5;
  return clamp(score, 0, 100, 50);
};

export const flattenSharedLibraryQuestions = item => [
  ...(item?.directQuestions || []).map(question => ({
    ...question,
    libraryQuestionKind:question.libraryQuestionKind || 'direct',
  })),
  ...(item?.clinicalQuestions || []).map(question => ({
    ...question,
    libraryQuestionKind:question.libraryQuestionKind || 'clinical',
  })),
].filter(question => question?.id);

export const buildQuestionMetadataBatches = (
  questions = [],
  size = QUESTION_METADATA_BATCH_SIZE,
) => {
  const safeSize = Math.max(1, Number(size) || QUESTION_METADATA_BATCH_SIZE);
  const batches = [];
  for (let index = 0; index < questions.length; index += safeSize) {
    batches.push(questions.slice(index, index + safeSize));
  }
  return batches;
};

export const questionSetSignature = (questions = []) => {
  const source = questions.map(question => [
    question.id,
    question.statement,
    optionAnswer(question),
  ].join('::')).join('||');
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `qset_${questions.length}_${(hash >>> 0).toString(36)}`;
};

export const normalizeConcepts = (rawConcepts = []) => {
  const used = new Set();
  const concepts = [];
  (Array.isArray(rawConcepts) ? rawConcepts : []).forEach((raw, index) => {
    const label = compactText(raw?.label || raw?.name || raw, 120);
    if (!label) return;
    let id = normalizeId(raw?.id || label) || `concept-${index + 1}`;
    if (used.has(id)) id = `${id}-${index + 1}`;
    used.add(id);
    concepts.push({
      id,
      label,
      description:compactText(raw?.description, 360),
      importance:clamp(raw?.importance, 1, 5, 3),
      parentConceptId:raw?.parentConceptId ? normalizeId(raw.parentConceptId) : null,
      aliases:uniqueStrings(raw?.aliases, 8),
      tags:uniqueStrings(raw?.tags, 8),
    });
  });
  return concepts;
};

export const buildHeuristicQuestionMetadata = (question, concepts = []) => {
  const isClinical = question?.libraryQuestionKind === 'clinical' || !!question?.caseContext;
  const visual = visualHintForQuestion(question);
  return {
    metadataVersion:QUESTION_METADATA_VERSION,
    analysisVersion:QUESTION_METADATA_ANALYSIS_VERSION,
    questionId:String(question?.id || ''),
    conceptIds:[],
    primaryConceptId:null,
    importance:3,
    difficulty:3,
    cognitiveLevel:isClinical ? 'application' : 'recognition',
    learningRole:'reinforcement',
    clinicalDepth:isClinical ? 'contextualized' : 'none',
    longevity:'evergreen',
    redundancyClusterId:null,
    redundancyScore:0,
    canonicalQuestionId:null,
    qualityScore:heuristicQuality(question),
    factualConfidence:'medium',
    reviewEligible:true,
    ...visual,
    ecgAssetId:null,
    status:'active',
    rationale:'',
    manualOverrides:{},
    analysisSource:'heuristic',
    availableConceptIds:concepts.map(concept => concept.id),
  };
};

export const applyQuestionMetadataOverrides = metadata => {
  const overrides = metadata?.manualOverrides && typeof metadata.manualOverrides === 'object'
    ? metadata.manualOverrides
    : {};
  return { ...metadata, ...overrides, manualOverrides:overrides };
};

export const normalizeQuestionMetadata = ({
  raw,
  question,
  concepts = [],
  existing = null,
}) => {
  const fallback = buildHeuristicQuestionMetadata(question, concepts);
  const conceptIds = new Set(concepts.map(concept => concept.id));
  const requestedConceptIds = uniqueStrings(raw?.conceptIds, 8)
    .map(normalizeId)
    .filter(id => conceptIds.has(id));
  const requestedPrimary = normalizeId(raw?.primaryConceptId);
  const primaryConceptId = conceptIds.has(requestedPrimary)
    ? requestedPrimary
    : requestedConceptIds[0] || null;
  const existingOverrides = existing?.manualOverrides && typeof existing.manualOverrides === 'object'
    ? existing.manualOverrides
    : {};
  const visualType = ['ecg', 'other'].includes(raw?.visualType) ? raw.visualType : fallback.visualType;
  const normalized = {
    ...fallback,
    questionId:String(question.id),
    conceptIds:requestedConceptIds,
    primaryConceptId,
    importance:clamp(raw?.importance, 1, 5, fallback.importance),
    difficulty:clamp(raw?.difficulty, 1, 5, fallback.difficulty),
    cognitiveLevel:enumValue('cognitiveLevel', raw?.cognitiveLevel, fallback.cognitiveLevel),
    learningRole:enumValue('learningRole', raw?.learningRole, fallback.learningRole),
    clinicalDepth:enumValue('clinicalDepth', raw?.clinicalDepth, fallback.clinicalDepth),
    longevity:enumValue('longevity', raw?.longevity, fallback.longevity),
    redundancyClusterId:raw?.redundancyClusterId ? normalizeId(raw.redundancyClusterId) : null,
    redundancyScore:clamp(raw?.redundancyScore, 0, 1, 0),
    canonicalQuestionId:raw?.canonicalQuestionId ? String(raw.canonicalQuestionId) : null,
    qualityScore:clamp(raw?.qualityScore, 0, 100, fallback.qualityScore),
    factualConfidence:enumValue(
      'factualConfidence',
      raw?.factualConfidence,
      fallback.factualConfidence,
    ),
    reviewEligible:raw?.reviewEligible !== false,
    needsVisual:raw?.needsVisual === true || fallback.needsVisual,
    visualType,
    ecgAssetId:existing?.ecgAssetId || null,
    status:enumValue('status', raw?.status, fallback.status),
    rationale:compactText(raw?.rationale, 500),
    manualOverrides:existingOverrides,
    analysisSource:'gemini',
    updatedAt:Date.now(),
  };
  if (normalized.factualConfidence === 'review_required' && normalized.status === 'active') {
    normalized.status = 'review_required';
  }
  return applyQuestionMetadataOverrides(normalized);
};

export const parseGeminiJson = text => {
  const clean = String(text || '').trim();
  const candidates = [
    clean,
    clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, ''),
  ];
  const firstObject = clean.indexOf('{');
  const lastObject = clean.lastIndexOf('}');
  if (firstObject >= 0 && lastObject > firstObject) {
    candidates.push(clean.slice(firstObject, lastObject + 1));
  }
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch(error) {}
  }
  throw new Error('METADATA_JSON_INVALID');
};

export const buildConceptAnalysisPrompt = item => {
  const summary = compactText(item?.summaryText, 18000);
  const summaryBlocks = (item?.summaryBlocks || []).map(block => ({
    title:block?.title || '',
    subtopics:block?.subtopics || [],
  }));
  return `Analise a aula médica abaixo e crie um mapa conceitual enxuto para classificar questões.

AULA: ${item?.title || ''}
MATÉRIA: ${item?.subject || ''}
TÓPICO: ${item?.topic || ''}

SUMÁRIO ESTRUTURADO:
${JSON.stringify(summaryBlocks)}

TEXTO DO SUMÁRIO:
${summary}

Retorne SOMENTE JSON válido:
{
  "concepts": [
    {
      "id": "slug-estavel",
      "label": "nome curto",
      "description": "o que o aluno deve dominar",
      "importance": 1,
      "parentConceptId": null,
      "aliases": [],
      "tags": []
    }
  ]
}

Regras:
- Use entre 8 e 30 conceitos quando o conteúdo justificar.
- Importance mede o valor do conceito para retenção longitudinal nesta aula, não a relevância geral da Cardiologia:
  1 = detalhe periférico; 2 = apoio útil; 3 = conteúdo relevante; 4 = objetivo importante; 5 = objetivo indispensável da aula.
- Use 5 com parcimônia: em regra, no máximo 25% dos conceitos. Se quase tudo parecer 4 ou 5, recalibre relativamente ao conteúdo desta própria aula.
- Evite conceitos duplicados, vagos ou que sejam apenas títulos decorativos.
- Não declare que verificou diretrizes ou fontes externas.
- Se algo parecer factual ou temporalmente sensível, apenas descreva o conceito; a confiança será avaliada por questão.`;
};

export const buildQuestionMetadataPrompt = ({
  item,
  concepts,
  questions,
  batchIndex,
  batchCount,
}) => {
  const compactQuestions = questions.map(question => ({
    id:String(question.id),
    kind:question.libraryQuestionKind || 'direct',
    statement:compactText(question.statement, 1400),
    caseContext:compactText(question.caseContext, 1200),
    options:(question.options || []).map(option => ({
      letter:option.letter,
      text:compactText(option.text, 500),
      isCorrect:!!option.isCorrect,
    })),
    answer:compactText(optionAnswer(question), 500),
    explanation:compactText(question.explanation, 1600),
  }));
  return `Classifique semanticamente este lote de questões médicas já existentes.

AULA: ${item?.title || ''}
MATÉRIA: ${item?.subject || ''}
LOTE: ${batchIndex + 1}/${batchCount}

CONCEITOS PERMITIDOS:
${JSON.stringify(concepts)}

QUESTÕES:
${JSON.stringify(compactQuestions)}

Retorne SOMENTE JSON válido, com exatamente uma entrada por questionId:
{
  "items": [
    {
      "questionId": "id original",
      "conceptIds": ["ids da lista permitida"],
      "primaryConceptId": "id ou null",
      "importance": 1,
      "difficulty": 1,
      "cognitiveLevel": "recognition|understanding|application|reasoning",
      "learningRole": "core|reinforcement|variation|exam_only",
      "clinicalDepth": "none|contextualized|integrated",
      "longevity": "evergreen|guideline_sensitive|course_specific",
      "redundancyClusterId": "slug ou null",
      "redundancyScore": 0,
      "canonicalQuestionId": "id ou null",
      "qualityScore": 0,
      "factualConfidence": "high|medium|review_required",
      "reviewEligible": true,
      "needsVisual": false,
      "visualType": "ecg|other|null",
      "status": "active|reserve|deprecated|review_required",
      "rationale": "justificativa curta"
    }
  ]
}

Critérios:
- importance e difficulty: inteiros de 1 a 5.
- importance avalia esta pergunta como cartão de retenção longitudinal, não a importância ampla do tema: 1 = detalhe dispensável; 2 = apoio; 3 = útil; 4 = importante; 5 = indispensável e difícil de substituir. Nota 5 deve ser minoria no lote (normalmente até 25%).
- learningRole: core somente quando a pergunta representa um objetivo central e insubstituível; reinforcement consolida um núcleo já coberto; variation testa o mesmo aprendizado por outra formulação ou cenário; exam_only cobra detalhe válido, mas inadequado para revisão rotineira. Não use core como padrão.
- conceptIds deve conter apenas conceitos efetivamente exigidos para responder, geralmente entre 1 e 3. Não inclua conceitos que aparecem apenas como pano de fundo da vinheta. primaryConceptId é o principal aprendizado discriminado pela pergunta.
- qualityScore: 90 a 100 é excepcional; 75 a 89 é forte; 60 a 74 é utilizável; abaixo de 60 indica problema relevante. Não repita uma nota fixa em quase todo o lote.
- Compare todas as perguntas do lote entre si. Perguntas que cobram essencialmente a mesma decisão ou recordação devem compartilhar redundancyClusterId; escolha uma canonicalQuestionId e aumente redundancyScore nas demais.
- clinicalDepth=none para recordação direta, ainda que o fato seja clínico; contextualized quando o caso é necessário; integrated somente quando a resposta combina pelo menos dois dados úteis do caso.
- factualConfidence=high exige enunciado, gabarito e explicação internamente inequívocos e conteúdo estável. medium é a classificação normal quando existe nuance; review_required sinaliza possível erro, ambiguidade ou desatualização.
- Como calibração do lote, core, importance=5, qualityScore>=90 e factualConfidence=high devem ser decisões seletivas e justificadas, nunca valores automáticos.
- redundancyScore: 0 a 1; qualityScore: 0 a 100.
- "integrated" exige combinar pelo menos dois dados úteis do caso, não apenas uma vinheta decorativa.
- Questões redundantes não devem ser apagadas: use variation/reserve.
- Use review_required quando houver possível erro, ambiguidade ou desatualização. Você não possui fonte externa nesta tarefa.
- Marque needsVisual/visualType=ecg quando um ECG real for necessário ou melhorar materialmente a avaliação; não associe um asset.
- Preserve exatamente os IDs recebidos.`;
};

const effectiveMetadataForQuestion = (question, metadataByQuestion) => {
  const metadata = metadataByQuestion?.[String(question.id)]
    || buildHeuristicQuestionMetadata(question);
  return applyQuestionMetadataOverrides(metadata);
};

const selectionScore = metadata => {
  let score = metadata.importance * 20 + metadata.qualityScore * 0.45;
  if (metadata.learningRole === 'core') score += 28;
  if (metadata.learningRole === 'reinforcement') score += 10;
  if (metadata.learningRole === 'variation') score -= 15;
  if (metadata.learningRole === 'exam_only') score -= 28;
  if (metadata.clinicalDepth === 'integrated') score += 14;
  if (metadata.cognitiveLevel === 'reasoning') score += 10;
  if (metadata.cognitiveLevel === 'application') score += 5;
  score -= metadata.redundancyScore * 30;
  if (metadata.canonicalQuestionId && metadata.canonicalQuestionId !== metadata.questionId) score -= 18;
  return score;
};

const redundancyClusterKey = row => String(row?.metadata?.redundancyClusterId || '').trim();

const primaryConceptKey = row => String(
  row?.metadata?.primaryConceptId || row?.metadata?.conceptIds?.[0] || '',
).trim();

export const selectLearningQuestions = ({
  questions = [],
  metadataByQuestion = {},
  concepts = [],
}) => {
  const rows = questions.map(question => {
    const metadata = effectiveMetadataForQuestion(question, metadataByQuestion);
    return { question, metadata, score:selectionScore(metadata) };
  });
  const eligible = rows.filter(row =>
    row.metadata.reviewEligible !== false
    && !['deprecated', 'review_required'].includes(row.metadata.status)
  );
  const disabled = rows.filter(row => !eligible.includes(row));
  const routineEligible = eligible.filter(row =>
    row.metadata.status === 'active'
    && row.metadata.learningRole !== 'exam_only'
  );
  const selectedIds = new Set();
  const selectedClusters = new Set();
  const selectedByPrimaryConcept = new Map();
  const selected = [];
  const choose = (row, reason) => {
    if (!row || selectedIds.has(String(row.question.id))) return;
    selectedIds.add(String(row.question.id));
    const clusterKey = redundancyClusterKey(row);
    if (clusterKey) selectedClusters.add(clusterKey);
    const conceptKey = primaryConceptKey(row);
    if (conceptKey) {
      selectedByPrimaryConcept.set(conceptKey, (selectedByPrimaryConcept.get(conceptKey) || 0) + 1);
    }
    selected.push({ ...row, reason });
  };

  const importantConcepts = [...concepts]
    .filter(concept => concept.importance >= 4)
    .sort((left, right) => right.importance - left.importance || left.label.localeCompare(right.label));
  importantConcepts.forEach(concept => {
    const candidates = routineEligible
      .filter(row => row.metadata.conceptIds.includes(concept.id))
      .sort((left, right) => {
        const roleDelta = Number(right.metadata.learningRole === 'core')
          - Number(left.metadata.learningRole === 'core');
        return roleDelta
          || right.score - left.score
          || String(left.question.id).localeCompare(String(right.question.id));
      });
    const candidate = candidates.find(row => {
      const clusterKey = redundancyClusterKey(row);
      return !clusterKey || !selectedClusters.has(clusterKey);
    }) || candidates[0];
    choose(candidate, `Melhor cobertura para ${concept.label}`);
  });

  const conceptWeight = importantConcepts.reduce((sum, concept) => sum + concept.importance, 0);
  const densityCeiling = Math.max(selected.length, Math.ceil(routineEligible.length * 0.3));
  const target = Math.min(
    routineEligible.length,
    Math.max(selected.length, Math.min(densityCeiling, Math.ceil(conceptWeight / 4.5))),
  );
  [...routineEligible]
    .filter(row => row.metadata.learningRole === 'core')
    .sort((left, right) => {
      const adjustedScore = row => {
        const clusterPenalty = selectedClusters.has(redundancyClusterKey(row)) ? 80 : 0;
        const conceptPenalty = (selectedByPrimaryConcept.get(primaryConceptKey(row)) || 0) * 32;
        return row.score - clusterPenalty - conceptPenalty;
      };
      return adjustedScore(right) - adjustedScore(left)
        || String(left.question.id).localeCompare(String(right.question.id));
    })
    .forEach(row => {
      if (selected.length < target) choose(row, 'Melhor equilíbrio entre importância, qualidade e diversidade');
    });

  const remaining = eligible.filter(row => !selectedIds.has(String(row.question.id)));
  const complementary = remaining.filter(row =>
    row.metadata.status === 'active'
    && !['variation', 'exam_only'].includes(row.metadata.learningRole)
    && (
      row.metadata.learningRole === 'reinforcement'
      || (row.metadata.importance >= 4 && row.metadata.redundancyScore < 0.75)
    )
  );
  const complementaryIds = new Set(complementary.map(row => String(row.question.id)));
  const reserve = remaining.filter(row => !complementaryIds.has(String(row.question.id)));

  return {
    essential:selected,
    complementary,
    reserve,
    disabled,
    totals:{
      available:questions.length,
      essential:selected.length,
      complementary:complementary.length,
      reserve:reserve.length,
      disabled:disabled.length,
    },
  };
};

const compactLearningPolicy = (row, tier) => {
  const metadata = applyQuestionMetadataOverrides(row?.metadata || {});
  return {
    tier,
    conceptIds:uniqueStrings(metadata.conceptIds, 8),
    primaryConceptId:metadata.primaryConceptId || null,
    importance:clamp(metadata.importance, 1, 5, 3),
    difficulty:clamp(metadata.difficulty, 1, 5, 3),
    cognitiveLevel:enumValue('cognitiveLevel', metadata.cognitiveLevel, 'recognition'),
    learningRole:enumValue('learningRole', metadata.learningRole, 'reinforcement'),
    clinicalDepth:enumValue('clinicalDepth', metadata.clinicalDepth, 'none'),
    qualityScore:clamp(metadata.qualityScore, 0, 100, 50),
    redundancyScore:clamp(metadata.redundancyScore, 0, 1, 0),
    reviewEligible:metadata.reviewEligible !== false,
    needsVisual:metadata.needsVisual === true,
    visualType:['ecg', 'other'].includes(metadata.visualType) ? metadata.visualType : null,
    ecgAssetId:metadata.ecgAssetId || null,
    status:enumValue('status', metadata.status, 'active'),
  };
};

// A curadoria completa fica privada. Este snapshot publica somente a decisao
// pedagogica minima que o aluno precisa para montar sua propria fila adaptativa.
export const buildLearningSelectionSnapshot = ({
  selection,
  questionSignature,
  metadataCompletedAt = null,
  publishedAt = Date.now(),
}) => {
  const questionPolicies = {};
  ['essential', 'complementary', 'reserve', 'disabled'].forEach(tier => {
    (selection?.[tier] || []).forEach(row => {
      const questionId = String(row?.question?.id || '');
      if (!questionId) return;
      questionPolicies[questionId] = compactLearningPolicy(row, tier);
    });
  });
  return {
    version:LEARNING_SELECTION_VERSION,
    questionSignature:String(questionSignature || ''),
    metadataCompletedAt:Number(metadataCompletedAt) || null,
    publishedAt:Number(publishedAt) || Date.now(),
    totals:{
      available:Number(selection?.totals?.available) || 0,
      essential:Number(selection?.totals?.essential) || 0,
      complementary:Number(selection?.totals?.complementary) || 0,
      reserve:Number(selection?.totals?.reserve) || 0,
      disabled:Number(selection?.totals?.disabled) || 0,
    },
    questionPolicies,
  };
};
