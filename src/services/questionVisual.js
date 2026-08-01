const normalizeVisualText = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const ECG_TERM = '(?:ecg|eletrocardiograma|tracado(?: eletrocardiografico)?)';
const ECG_VISUAL_PATTERNS = [
  new RegExp(`(?:analise|avalie|interprete|observe|examine|identifique).{0,80}${ECG_TERM}`),
  new RegExp(`${ECG_TERM}.{0,50}(?:abaixo|acima|a seguir|mostrado|apresentado|exibido|anexo|fornecido|ilustrado)`),
  new RegExp(`(?:com base|de acordo).{0,40}${ECG_TERM}`),
  new RegExp(`(?:imagem|figura).{0,40}${ECG_TERM}`),
];

export const questionHasEcgImage = question => (Array.isArray(question?.images) ? question.images : [])
  .some(image => image?.type === 'ecg' || /(?:^|\/)ecg(?:\/|[-_])/i.test(String(image?.url || '')));

export const questionRequestsEcgImage = question => {
  if (!question || typeof question !== 'object') return false;
  if (question.visualRequirement?.type === 'ecg') return true;
  if (question.ecgMatch?.status === 'resolved' || questionHasEcgImage(question)) return true;
  const explicitType = normalizeVisualText(
    question.visualType || question.learningPolicy?.visualType || question.metadata?.visualType,
  );
  const explicitNeed = question.needsVisual === true || question.metadata?.needsVisual === true;
  if (explicitNeed && /(?:^| )ecg(?: |$)|eletrocardiograma|tracado/.test(explicitType || 'ecg')) return true;
  const statement = normalizeVisualText([
    question.statement,
    question.prompt,
    question.caseContext,
    question.command,
  ].filter(Boolean).join(' '));
  if (ECG_VISUAL_PATTERNS.some(pattern => pattern.test(statement))) return true;
  return question.learningPolicy?.needsVisual === true
    && question.learningPolicy?.visualType === 'ecg'
    && /(?:imagem|figura|abaixo|acima|a seguir|mostrado|apresentado|exibido|anexo)/.test(statement);
};

export const questionHasUnresolvedRequiredVisual = question =>
  questionRequestsEcgImage(question) && !questionHasEcgImage(question);
