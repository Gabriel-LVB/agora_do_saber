export const mergeSharedLibraryRepairCandidate = (row, candidate = {}) => {
  const original = row.question || {};
  const nextQuestion = {
    ...original,
    ...candidate,
    id:original.id || candidate?.id || `${row.field}_${row.index + 1}`,
    libraryQuestionKind:original.libraryQuestionKind || (row.field === 'clinicalQuestions' ? 'clinical' : 'direct'),
  };
  if (!nextQuestion.caseContext && original.caseContext) nextQuestion.caseContext = original.caseContext;
  if (!nextQuestion.statement && original.statement) nextQuestion.statement = original.statement;
  return nextQuestion;
};

export const mapSharedLibraryRepairCandidates = (questions = [], namespace = '', expectedCount = 0) => {
  const mapped = new Map();
  questions.forEach((question, fallbackIndex) => {
    const rawId = String(question?.id || '');
    const suffix = namespace && rawId.startsWith(`${namespace}_`) ? rawId.slice(namespace.length + 1) : '';
    const ordinal = Number(String(suffix).split('.')[0]);
    const index = Number.isInteger(ordinal) && ordinal >= 1 && ordinal <= expectedCount
      ? ordinal - 1
      : fallbackIndex;
    if (index >= 0 && index < expectedCount && !mapped.has(index)) mapped.set(index, question);
  });
  return mapped;
};

export const repairSharedLibraryIncompleteItems = async ({
  targets = [],
  reviewQuestions,
  getQuestionIssue,
  saveItem,
  refreshItems,
  countIncompleteQuestions,
  updateStatus = () => {},
  addLog = () => {},
} = {}) => {
  const initialIncompleteCount = targets.reduce((total, entry) => total + entry.issues.length, 0);
  const targetIds = new Set(targets.map(entry => String(entry.item.id)));
  let fixed = 0;

  for (const { item, issues } of targets) {
    const subtopics = (item.summaryBlocks || []).flatMap(block => block?.subtopics || []);
    const sourceMaterials = [
      item.summaryText ? `SUMÁRIO DA AULA:\n${item.summaryText}` : '',
      `QUESTÕES COM PROBLEMA:\n${issues.map((row, index) => `${index + 1}. ${row.label} #${row.index + 1}: ${row.issue}`).join('\n')}`,
    ].filter(Boolean).join('\n\n');
    updateStatus(`Revisando ${item.title || 'aula'} (${issues.length})...`);
    const repairNamespace = `shared_repair_${item.id}_${Date.now()}`;
    const result = await reviewQuestions({
      questions:issues.map(row => row.question),
      namespace:repairNamespace,
      item,
      subtopics,
      sourceMaterials,
    });
    const repaired = result.questions || [];
    if (repaired.length !== issues.length) {
      addLog('warning', `${item.title}: revisão inicial devolveu ${repaired.length}/${issues.length}; retomando as pendentes individualmente.`);
    }

    const candidatesByIssue = mapSharedLibraryRepairCandidates(repaired, repairNamespace, issues.length);
    const acceptedByIssue = new Map();
    const pending = [];
    issues.forEach((row, index) => {
      const candidate = candidatesByIssue.get(index);
      const nextQuestion = mergeSharedLibraryRepairCandidate(row, candidate);
      const remainingIssue = candidate ? getQuestionIssue(nextQuestion) : 'resposta ausente';
      if (!remainingIssue) acceptedByIssue.set(index, nextQuestion);
      else pending.push({ row, index, remainingIssue });
    });

    for (let pendingIndex = 0; pendingIndex < pending.length; pendingIndex++) {
      const { row, index, remainingIssue } = pending[pendingIndex];
      updateStatus(`Revisando ${item.title || 'aula'} · pendente ${pendingIndex + 1}/${pending.length}...`);
      const retryNamespace = `${repairNamespace}_retry_${index + 1}`;
      const retryResult = await reviewQuestions({
        questions:[row.question],
        namespace:retryNamespace,
        item,
        subtopics,
        sourceMaterials:[
          item.summaryText ? `SUMÁRIO DA AULA:\n${item.summaryText}` : '',
          `PROBLEMA QUE AINDA PRECISA SER CORRIGIDO: ${remainingIssue}. A resposta só será aceita se esse problema desaparecer por completo.`,
        ].filter(Boolean).join('\n\n'),
      });
      const retryCandidate = mapSharedLibraryRepairCandidates(retryResult.questions || [], retryNamespace, 1).get(0);
      const retryQuestion = mergeSharedLibraryRepairCandidate(row, retryCandidate);
      const retryIssue = retryCandidate ? getQuestionIssue(retryQuestion) : 'resposta ausente';
      if (!retryIssue) acceptedByIssue.set(index, retryQuestion);
      else addLog('warning', `${item.title}: questão ${row.label} #${row.index + 1} continua incompleta (${retryIssue}).`);
    }

    const patch = {};
    const byField = new Map();
    acceptedByIssue.forEach((nextQuestion, index) => {
      const row = issues[index];
      if (!byField.has(row.field)) byField.set(row.field, [...(item[row.field] || [])]);
      byField.get(row.field)[row.index] = nextQuestion;
    });
    byField.forEach((questions, field) => { patch[field] = questions; });

    const repairedCount = acceptedByIssue.size;
    const remainingCount = issues.length - repairedCount;
    if (repairedCount) {
      patch.questionRepairMeta = {
        repairedAt:Date.now(),
        repairedCount,
        attemptedCount:issues.length,
        remainingCount,
        reasons:[...new Set(issues.map(row => row.issue))],
      };
      await saveItem(item.id, patch);
      fixed += repairedCount;
      addLog('success', `${item.title}: ${repairedCount} questão(ões) reparada(s) e validada(s).`);
    }
    if (remainingCount) addLog('warning', `${item.title}: ${remainingCount} questão(ões) ainda incompleta(s).`);
  }

  const refreshedItems = await refreshItems();
  const refreshedScope = Array.isArray(refreshedItems)
    ? refreshedItems.filter(item => targetIds.has(String(item.id)))
    : null;
  const remaining = refreshedScope
    ? countIncompleteQuestions(refreshedScope)
    : Math.max(0, initialIncompleteCount - fixed);
  return {
    fixed,
    confirmedFixed:Math.max(0, initialIncompleteCount - remaining),
    initialIncompleteCount,
    remaining,
  };
};
