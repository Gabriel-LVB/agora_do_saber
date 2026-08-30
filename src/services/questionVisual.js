const normalizeVisualText = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const ECG_TERM = '(?:ecg|eletrocardiograma|tracado(?: eletrocardiografico)?)';
const ECG_VISUAL_PATTERNS = [
  new RegExp(`(?:analise|avalie|interprete|observe|examine) (?:o |este |esse |aquele )?${ECG_TERM}(?: |$)`),
  new RegExp(`identifique.{0,60}(?:no|neste|nesse|pelo|a partir do|com base no) ${ECG_TERM}(?: |$)`),
  new RegExp(`${ECG_TERM}.{0,50}(?:abaixo|acima|a seguir|mostrado|apresentado|exibido|anexo|fornecido|ilustrado)`),
  new RegExp(`(?:com base|de acordo) (?:no|com o) ${ECG_TERM}(?: |$)`),
  new RegExp(`(?:imagem|figura).{0,40}${ECG_TERM}`),
];

const automaticUnresolvedEcgRequirement = question => {
  const requirement = question?.visualRequirement;
  if (requirement?.type !== 'ecg' || requirement?.status !== 'unresolved') return false;
  if (requirement?.source === 'automatic-structured') return true;
  if (question?.ecgMatch?.source !== 'automatic-structured'
    || question?.ecgMatch?.status !== 'unresolved') return false;
  const requirementKeys = Object.keys(requirement);
  return requirementKeys.every(key => ['type', 'status'].includes(key));
};

const imageLooksLikeEcg = image => {
  if (image?.type === 'ecg') return true;
  const metadata = normalizeVisualText([
    image?.url,
    image?.file,
    image?.fileName,
    image?.altText,
    image?.caption,
    image?.title,
    image?.description,
  ].filter(Boolean).join(' '));
  return /(?:^| )(?:ecg|eletrocardiograma|tracado eletrocardiografico)(?: |$)/.test(metadata);
};

export const questionHasEcgImage = question => (Array.isArray(question?.images) ? question.images : [])
  .some(imageLooksLikeEcg);

export const questionTextRequestsEcgImage = question => {
  const statement = normalizeVisualText([
    question?.statement,
    question?.prompt,
    question?.caseContext,
    question?.command,
  ].filter(Boolean).join(' '));
  return ECG_VISUAL_PATTERNS.some(pattern => pattern.test(statement));
};

export const questionHasAutomaticUnresolvedEcgProjection = question =>
  automaticUnresolvedEcgRequirement(question);

export const questionRequestsEcgImage = question => {
  if (!question || typeof question !== 'object') return false;
  if (question.visualRequirement?.type === 'ecg'
    && !automaticUnresolvedEcgRequirement(question)) return true;
  if (question.ecgMatch?.status === 'resolved' || questionHasEcgImage(question)) return true;
  const explicitType = normalizeVisualText(
    question.visualType || question.learningPolicy?.visualType || question.metadata?.visualType,
  );
  const explicitNeed = question.needsVisual === true || question.metadata?.needsVisual === true;
  if (explicitNeed && /(?:^| )ecg(?: |$)|eletrocardiograma|tracado/.test(explicitType || 'ecg')) return true;
  if (questionTextRequestsEcgImage(question)) return true;
  const statement = normalizeVisualText([
    question.statement,
    question.prompt,
    question.caseContext,
    question.command,
  ].filter(Boolean).join(' '));
  return question.learningPolicy?.needsVisual === true
    && question.learningPolicy?.visualType === 'ecg'
    && /(?:imagem|figura|abaixo|acima|a seguir|mostrado|apresentado|exibido|anexo)/.test(statement);
};

export const questionHasUnresolvedRequiredVisual = question =>
  questionRequestsEcgImage(question) && !questionHasEcgImage(question);
