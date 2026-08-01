import {
  questionHasEcgImage,
  questionRequestsEcgImage,
} from './questionVisual.js';

export const ECG_QUESTION_MATCH_VERSION = 'agora-ecg-question-matching-v1';
export const ECG_QUESTION_INDEX_URL = '/ecg/v3/question-match-index.json';

const normalizeText = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const textContainsTerm = (text, term) => {
  const normalizedText = ` ${normalizeText(text)} `;
  const normalizedTerm = normalizeText(term);
  return !!normalizedTerm && normalizedText.includes(` ${normalizedTerm} `);
};

const labelVariants = label => {
  const raw = String(label || '').trim();
  const variants = new Set([raw]);
  if (!raw.includes('/')) return [...variants];
  const [left, rest] = raw.split('/', 2);
  const suffixWords = rest.trim().split(/\s+/);
  const sharedSuffix = suffixWords.slice(1).join(' ');
  variants.add(`${left} ${sharedSuffix}`.trim());
  variants.add(rest.trim());
  return [...variants];
};

const EXTRA_ALIASES = Object.freeze({
  'ecg.arrhythmia.af':['fibrilacao auricular'],
  'ecg.arrhythmia.pvc':['extrassistoles ventriculares'],
  'ecg.arrhythmia.pac':['extrassistoles atriais'],
  'ecg.rhythm.atrial_ectopic':['ritmo ectopico atrial'],
  'ecg.rhythm.junctional':['ritmo idionodal', 'ritmo idionodal acelerado'],
  'ecg.rhythm.accelerated_idioventricular':['idioventricular acelerado', 'idioventricular acelerados', 'ritmos idioventriculares acelerados'],
  'ecg.conduction.avb1':['bloqueio de primeiro grau', 'bav de primeiro grau', 'bloqueio atrioventricular de primeiro grau'],
  'ecg.conduction.avb2_wenckebach':['bav de segundo grau mobitz i', 'wenckebach'],
  'ecg.conduction.avb2_mobitz2':['bav de segundo grau mobitz ii', 'bloqueio av de segundo grau mobitz tipo 2'],
  'ecg.conduction.avb2_2to1':['bav 2 1', 'bloqueio av de segundo grau 2 1', 'bloqueio atrioventricular 2 1'],
  'ecg.conduction.avb3':['bav de terceiro grau', 'bloqueio av total', 'bloqueio atrioventricular total'],
  'ecg.conduction.incomplete_rbbb':['brd incompleto', 'bloqueio incompleto de ramo direito'],
  'ecg.preexcitation.wpw_a':['wpw tipo a', 'sindrome wpw tipo a', 'wolff parkinson white', 'sindrome de wolff parkinson white'],
  'ecg.preexcitation.wpw_b':['wpw tipo b', 'sindrome wpw tipo b', 'wolff parkinson white', 'sindrome de wolff parkinson white'],
  'ecg.channelopathy.long_qt':['qt longo', 'intervalo qt prolongado', 'prolongamento do intervalo qt'],
  'ecg.ischemia.stemi':['infarto com supra de st', 'iam com supra de st', 'supradesnivelamento de st'],
  'ecg.ischemia.stemi_anterior':['iamst anterior', 'infarto anterior com supra', 'iam anterior com supra'],
  'ecg.ischemia.stemi_inferior':['iamst inferior', 'iam inferior com supradesnivel do segmento st', 'infarto inferior com supra', 'iam inferior com supra'],
  'ecg.ischemia.stemi_anterolateral':['iamst anterolateral', 'infarto anterolateral com supra', 'iam anterolateral com supra'],
  'ecg.ischemia.nstemi':['iamsst', 'iamssst', 'infarto sem supra de st', 'iam sem supra de st'],
  'ecg.ischemia.ischemia':['isquemia', 'isquemia anterolateral', 'isquemia lateral'],
  'ecg.ischemia.old_infarct':['infarto antigo', 'infarto do miocardio antigo', 'infarto do miocardio inferior antigo', 'infarto do miocardio anterior antigo', 'ondas q patologicas'],
  'ecg.ischemia.posterior_infarct':['infarto do miocardio posterior'],
  'ecg.repolarization.st_elevation':['supradesnivel de st', 'supradesnivelamento do segmento st'],
  'ecg.repolarization.st_depression':['infradesnivel de st', 'infradesnivelamento do segmento st'],
  'ecg.repolarization.nonspecific':['alteracoes inespecificas do ecg', 'alteracoes inespecificas da repolarizacao ventricular', 'alteracoes inespecificas de st t'],
  'ecg.chamber.lvh':['hipertrofia ventricular esquerda', 'sobrecarga ventricular esquerda'],
  'ecg.chamber.rvh':['hipertrofia ventricular direita', 'sobrecarga ventricular direita', 'sobrecarga de camaras direitas'],
  'ecg.normal.t_wave_variant':['variacao normal da onda t', 'ondas t difusamente invertidas em paciente normal', 'alteracoes difusas da onda t em paciente normal'],
  'ecg.normal.artifact':['artefatos musculares', 'artefato muscular'],
  'ecg.metabolic.digitalis':['intoxicacao digitalica', 'efeito digitalico'],
  'ecg.metabolic.hypokalemia':['hipopotassemia'],
  'ecg.metabolic.lithium':['uso de litio'],
  'ecg.metabolic.cns_t_wave':['hemorragia subaracnoidea', 'evento neurologico'],
  'ecg.pulmonary.pe':['tromboembolismo pulmonar'],
  'ecg.pacing.ventricular':['ritmo de marcapasso', 'ritmo de marca passo'],
  'ecg.arrhythmia.wide_complex_tachycardia':['taquicardia com qrs largo', 'taquicardia com qrs larga', 'taquicardia de qrs largo', 'taquicardia de qrs larga'],
});

const ignoredTerms = new Set([
  'eletrocardiograma',
  'ecg normal e variantes',
  'ritmo e frequencia',
  'arritmias',
  'disturbios de conducao',
  'pre excitacao',
  'canalopatias',
  'isquemia e infarto',
  'alteracoes de repolarizacao',
  'sobrecargas de camaras',
  'cardiomiopatias',
  'metabolico drogas e sistemico',
  'pericardio',
  'pulmao e coracao direito',
  'estimulacao cardiaca',
  'posicao anatomia',
  'normal',
]);

const conceptTerms = concept => {
  const terms = new Set([
    ...labelVariants(concept?.label),
    ...(concept?.aliases || []),
    ...(EXTRA_ALIASES[concept?.id] || []),
  ].map(normalizeText).filter(Boolean));
  return [...terms].filter(term => !ignoredTerms.has(term) && (term.length >= 4 || /^[a-z]{2,5}$/.test(term)));
};

const correctAnswerText = question => {
  if (question?.expectedAnswer) return String(question.expectedAnswer);
  const correctOptions = (Array.isArray(question?.options) ? question.options : [])
    .filter(option => option?.isCorrect)
    .map(option => option?.text || option?.label || option?.value || '')
    .filter(Boolean);
  return correctOptions.join(' ');
};

const evidenceFields = question => [
  { source:'correct-answer', weight:120, text:correctAnswerText(question) },
  {
    source:'explicit-target',
    weight:140,
    text:[
      question?.ecgDiagnosis,
      question?.visualRequirement?.target,
      question?.learningPolicy?.primaryConceptId,
      question?.metadata?.primaryConceptId,
    ].filter(Boolean).join(' ').replace(/[-_]+/g, ' '),
  },
  { source:'explanation', weight:44, text:[question?.explanation, question?.expectedExplanation].filter(Boolean).join(' ') },
  { source:'statement', weight:24, text:[question?.statement, question?.prompt, question?.caseContext].filter(Boolean).join(' ') },
];

export const rankEcgConceptsForQuestion = (question, index) => (index?.concepts || []).map(concept => {
  const terms = conceptTerms(concept);
  const evidence = evidenceFields(question).flatMap(field => terms
    .filter(term => textContainsTerm(field.text, term))
    .map(term => ({ ...field, term }))
  );
  const bestBySource = new Map();
  evidence.forEach(item => {
    const previous = bestBySource.get(item.source);
    const specificity = item.term.split(' ').length * 4 + Math.min(24, item.term.length / 2);
    const score = item.weight + specificity;
    if (!previous || score > previous.score) bestBySource.set(item.source, { ...item, score });
  });
  const matches = [...bestBySource.values()];
  const score = matches.length
    ? matches.reduce((total, item) => total + item.score, 0)
      + String(concept?.id || '').split('.').length * 2
    : 0;
  return { concept, score, matches };
}).filter(result => result.score > 0).sort((left, right) =>
  right.score - left.score
  || String(right.concept?.id || '').split('.').length - String(left.concept?.id || '').split('.').length
  || String(left.concept?.id || '').localeCompare(String(right.concept?.id || ''))
);

const hashString = value => {
  let hash = 2166136261;
  for (const character of String(value || '')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const chooseCase = ({ question, conceptId, relatedConceptIds = [], index, usageByConcept }) => {
  const candidates = (index?.cases || []).filter(item =>
    item?.concepts?.some(concept => concept?.id === conceptId)
  ).map(item => {
    const relationByConcept = new Map((item.concepts || []).map(concept => [concept.id, concept]));
    const targetRelation = relationByConcept.get(conceptId) || {};
    const overlap = relatedConceptIds.reduce((total, relatedId, relatedIndex) => {
      const relation = relationByConcept.get(relatedId);
      if (!relation) return total;
      return total + Math.max(20, 100 - relatedIndex * 12)
        * (Number(relation.weight) || 0.4)
        + (relation.role === 'primary' ? 18 : 0);
    }, 0);
    return {
      item,
      quality:overlap + (Number(targetRelation.weight) || 0) * 4,
    };
  }).sort((left, right) => {
    const relation = item => item.concepts.find(concept => concept.id === conceptId) || {};
    const leftRelation = relation(left.item);
    const rightRelation = relation(right.item);
    return right.quality - left.quality
      || Number(rightRelation.role === 'primary') - Number(leftRelation.role === 'primary')
      || Number(rightRelation.weight || 0) - Number(leftRelation.weight || 0)
      || String(left.item.id).localeCompare(String(right.item.id));
  });
  if (!candidates.length) return null;
  const bestQuality = candidates[0].quality;
  const equallySupported = candidates
    .filter(candidate => Math.abs(candidate.quality - bestQuality) < 0.001)
    .map(candidate => candidate.item);
  const usage = usageByConcept?.get(conceptId) || new Set();
  const preferred = equallySupported.filter(item => !usage.has(item.id));
  const pool = preferred.length ? preferred : equallySupported;
  const selected = pool[hashString(question?.id || question?.statement) % pool.length];
  if (usageByConcept) {
    if (!preferred.length) usage.clear();
    usage.add(selected.id);
    usageByConcept.set(conceptId, usage);
  }
  return selected;
};

export const matchEcgCaseForQuestion = (question, index, { usageByConcept } = {}) => {
  if (!questionRequestsEcgImage(question) || questionHasEcgImage(question)) return null;
  if (index?.matchingVersion !== ECG_QUESTION_MATCH_VERSION) return null;
  const explicitCaseId = String(
    question?.ecgAssetId || question?.learningPolicy?.ecgAssetId || question?.ecgMatch?.caseId || '',
  ).trim();
  if (explicitCaseId) {
    const explicitCase = (index.cases || []).find(item => item.id === explicitCaseId);
    if (explicitCase) return {
      case:explicitCase,
      conceptId:explicitCase.concepts?.find(concept => concept.role === 'primary')?.id || null,
      confidence:'explicit',
      evidence:['explicit-case-id'],
    };
  }
  const ranked = rankEcgConceptsForQuestion(question, index);
  const best = ranked[0];
  if (!best || best.score < 70) return null;
  const runnerUp = ranked[1];
  const answerBacked = best.matches.some(match => ['correct-answer', 'explicit-target'].includes(match.source));
  const closeRunnerUp = runnerUp && runnerUp.score >= best.score * (answerBacked ? 0.985 : 0.9);
  if (closeRunnerUp) {
    const hasJointCase = (index.cases || []).some(item => {
      const ids = new Set((item.concepts || []).map(concept => concept.id));
      return ids.has(best.concept.id) && ids.has(runnerUp.concept.id);
    });
    if (!hasJointCase) return null;
  }
  const relatedConceptIds = ranked
    .filter(result => result.score >= 70 && result.matches.some(match =>
      ['correct-answer', 'explicit-target'].includes(match.source)
    ))
    .slice(0, 5)
    .map(result => result.concept.id);
  const selectedCase = chooseCase({
    question,
    conceptId:best.concept.id,
    relatedConceptIds,
    index,
    usageByConcept,
  });
  if (!selectedCase) return null;
  if (relatedConceptIds.length > 1) {
    const selectedConceptIds = new Set((selectedCase.concepts || []).map(concept => concept.id));
    const supportedTargets = relatedConceptIds.filter(conceptId => selectedConceptIds.has(conceptId));
    if (supportedTargets.length < 2) return null;
  }
  return {
    case:selectedCase,
    conceptId:best.concept.id,
    confidence:answerBacked ? 'high' : 'medium',
    evidence:best.matches.map(match => `${match.source}:${match.term}`),
  };
};

const resolvedImage = match => ({
  id:`ecg-${match.case.id}-principal`,
  url:match.case.image.url,
  type:'ecg',
  role:'question',
  phase:'question',
  width:match.case.image.width,
  height:match.case.image.height,
  altText:'Eletrocardiograma para interpretação da questão.',
});

export const enrichQuestionWithEcgImage = (question, index, { usageByConcept } = {}) => {
  if (!questionRequestsEcgImage(question)) return { question, status:'not-required' };
  if (questionHasEcgImage(question)) return { question, status:'already-resolved' };
  const match = matchEcgCaseForQuestion(question, index, { usageByConcept });
  if (!match) {
    const alreadyUnresolved = question?.ecgMatch?.version === ECG_QUESTION_MATCH_VERSION
      && question?.ecgMatch?.status === 'unresolved'
      && question?.visualRequirement?.status === 'unresolved';
    return {
      question:alreadyUnresolved ? question : {
        ...question,
        visualRequirement:{
          ...(question.visualRequirement || {}),
          type:'ecg',
          status:'unresolved',
        },
        ecgMatch:{
          version:ECG_QUESTION_MATCH_VERSION,
          status:'unresolved',
          source:'automatic-structured',
        },
      },
      status:'unresolved',
    };
  }
  return {
    question:{
      ...question,
      visualRequirement:{
        ...(question.visualRequirement || {}),
        type:'ecg',
        status:'resolved',
      },
      ecgMatch:{
        version:ECG_QUESTION_MATCH_VERSION,
        status:'resolved',
        source:'automatic-structured',
        caseId:match.case.id,
        confidence:match.confidence,
      },
      images:[...(Array.isArray(question.images) ? question.images : []), resolvedImage(match)],
    },
    status:'matched',
    match,
  };
};

const blockEntries = blocks => Array.isArray(blocks)
  ? blocks.map((block, index) => [String(block?.id || `block_${index}`), block])
  : Object.entries(blocks || {});

export const enrichVqBlocksWithEcgImages = (vqBlocks = {}, index = {}) => {
  let changed = false;
  const report = { scanned:0, required:0, matched:0, alreadyResolved:0, unresolved:0 };
  const next = { ...vqBlocks };
  Object.entries(vqBlocks || {}).forEach(([aulaId, aulaData]) => {
    if (!aulaData || typeof aulaData !== 'object') return;
    const usageByConcept = new Map();
    const lessonReport = { required:0, matched:0, alreadyResolved:0, unresolved:0 };
    let lessonChanged = false;
    const mappedEntries = blockEntries(aulaData.blocks).map(([blockId, block]) => {
      if (!block || !Array.isArray(block.questions)) return [blockId, block];
      let blockChanged = false;
      const questions = block.questions.map(question => {
        report.scanned += 1;
        const result = enrichQuestionWithEcgImage(question, index, { usageByConcept });
        if (result.status !== 'not-required') {
          report.required += 1;
          lessonReport.required += 1;
        }
        if (result.status === 'matched') {
          report.matched += 1;
          lessonReport.matched += 1;
        }
        if (result.status === 'already-resolved') {
          report.alreadyResolved += 1;
          lessonReport.alreadyResolved += 1;
        }
        if (result.status === 'unresolved') {
          report.unresolved += 1;
          lessonReport.unresolved += 1;
        }
        if (result.question !== question) blockChanged = true;
        return result.question;
      });
      if (!blockChanged) return [blockId, block];
      lessonChanged = true;
      return [blockId, { ...block, questions }];
    });
    const blocks = Array.isArray(aulaData.blocks)
      ? mappedEntries.map(([, block]) => block)
      : Object.fromEntries(mappedEntries);
    const nextAula = {
      ...aulaData,
      meta:{
        ...(aulaData.meta || {}),
        ecgQuestionMatchVersion:ECG_QUESTION_MATCH_VERSION,
        ecgQuestionMatchReport:{
          required:lessonReport.required,
          matched:lessonReport.matched,
          alreadyResolved:lessonReport.alreadyResolved,
          unresolved:lessonReport.unresolved,
        },
      },
      blocks,
    };
    if (lessonChanged || nextAula.meta.ecgQuestionMatchVersion !== aulaData.meta?.ecgQuestionMatchVersion) {
      next[aulaId] = nextAula;
      changed = true;
    }
  });
  return { vqBlocks:changed ? next : vqBlocks, changed, report };
};

let indexPromise = null;
export const loadEcgQuestionIndex = async () => {
  if (!indexPromise) {
    indexPromise = fetch(ECG_QUESTION_INDEX_URL, { cache:'force-cache' })
      .then(response => {
        if (!response.ok) throw new Error(`ECG_INDEX_HTTP_${response.status}`);
        return response.json();
      })
      .then(index => {
        if (index?.matchingVersion !== ECG_QUESTION_MATCH_VERSION || !Array.isArray(index?.cases)) {
          throw new Error('ECG_INDEX_INVALID');
        }
        return index;
      })
      .catch(error => {
        indexPromise = null;
        throw error;
      });
  }
  return indexPromise;
};
