export const PACKAGE_SCHEMAS = ['agora-famed-usmle-question-package-v1', 'agora-usmle-question-package-v1'];
export const STEPS = ['step1', 'step2'];
export const stepLabel = step => step === 'step2' ? 'Step 2 CK' : 'Step 1';
export const questionKey = (packageId, id) => `${packageId}__${id}`;
export const safeId = value => /^[a-zA-Z0-9_-]{1,140}$/.test(String(value || ''));
const text = value => typeof value === 'string' ? value : '';

// The package is source material, never executable HTML or application instructions.
export function validateUsmlePackage(input, step = 'step1') {
  if (!PACKAGE_SCHEMAS.includes(input?.schema)) throw new Error('Formato não reconhecido. Use um pacote USMLE v1.');
  if (!STEPS.includes(step)) throw new Error('Selecione Step 1 ou Step 2 CK.');
  if (!text(input.title).trim() || !Array.isArray(input.questions) || !input.questions.length) throw new Error('O pacote precisa de título e questões.');
  if (input.questions.length > 10000) throw new Error('Divida o pacote em matérias de até 10.000 questões.');
  const seen = new Set();
  const warnings = { imageOptions:0, missingAudio:0, noExplanation:0, missingVisual:0 };
  const questions = input.questions.map((q, index) => {
    const fail = message => { throw new Error(`Questão ${q?.id || index + 1}: ${message}`); };
    if (!safeId(q.id) || seen.has(q.id)) fail('identificador inválido ou repetido.');
    seen.add(q.id);
    for (const field of ['questionBank', 'subject', 'topic', 'statement', 'correctAnswer']) if (!text(q[field]).trim()) fail(`campo ${field} ausente.`);
    if (!/^[A-Z]$/.test(q.correctAnswer)) fail('gabarito deve ser uma letra maiúscula.');
    if (!Array.isArray(q.options)) fail('alternativas inválidas.');
    const options = q.options.map(o => ({ letter:text(o.letter), text:text(o.text), isCorrect:o.letter === q.correctAnswer, explanation:text(o.explanation) }));
    if (new Set(options.map(o => o.letter)).size !== options.length || options.some(o => !/^[A-Z]$/.test(o.letter))) fail('letras das alternativas inválidas ou repetidas.');
    if (!q.optionsInImage && (options.length < 2 || !options.some(o => o.isCorrect))) fail('gabarito não corresponde às alternativas.');
    const images = (q.images || []).map(img => {
      if (!/^images\/[a-zA-Z0-9_.-]+\.(png|jpe?g|webp)$/i.test(img.file) || !['front','back'].includes(img.placement)) fail('caminho ou posição de imagem inválidos.');
      return { file:img.file, placement:img.placement, altText:text(img.altText), credit:text(img.credit) };
    });
    const audio = (q.audio || []).map(a => {
      if (!/^audio\/[a-zA-Z0-9_.-]+\.(mp3|wav|ogg|m4a)$/i.test(a.file)) fail('caminho de áudio inválido.');
      return { file:a.file, label:text(a.label), transcript:text(a.transcript), credit:text(a.credit) };
    });
    const unavailableReason = q.optionsInImage && !images.some(img => img.placement === 'front')
      ? 'As alternativas estão em imagem, mas o pacote só inclui figuras do comentário.' : '';
    if (unavailableReason) warnings.missingVisual++;
    if (q.optionsInImage) warnings.imageOptions++;
    if (q.sourceHasAudio && !audio.length) warnings.missingAudio++;
    if (!q.explanation && !options.some(o => o.explanation)) warnings.noExplanation++;
    return { id:q.id, questionBank:q.questionBank, subject:q.subject, topic:q.topic, statement:q.statement,
      sourceQuestionId:text(q.sourceQuestionId), system:text(q.system), discipline:text(q.discipline), subtopic:text(q.subtopic),
      caseContext:text(q.caseContext), options, correctAnswer:q.correctAnswer, explanation:text(q.explanation),
      educationalObjective:text(q.educationalObjective), images, audio, references:(q.references || []).filter(r => typeof r === 'string'),
      percentCorrect:Number.isFinite(q.percentCorrect) ? q.percentCorrect : null,
      optionStatistics:Object.fromEntries(Object.entries(q.optionStatistics || {}).filter(([k,v]) => /^[A-Z]$/.test(k) && Number.isFinite(v))),
      unavailableReason, optionsInImage:!!q.optionsInImage, optionsRewritten:!!q.optionsRewritten, sourceHasAudio:!!q.sourceHasAudio };
  });
  return { schema:'agora-usmle-question-package-v1', title:input.title.trim(), subject:text(input.subject), step, questions, warnings };
}

export function filterQuestions(questions, filters = {}, progress = {}) {
  const search = (filters.search || '').trim().toLocaleLowerCase();
  return questions.filter(q => {
    if (q.unavailableReason) return false;
    const p = progress[q.key] || {};
    if (!filters.includeMissingAudio && q.sourceHasAudio && !q.audio.length) return false;
    for (const field of ['questionBank','discipline','topic','system']) if (filters[field] && q[field] !== filters[field]) return false;
    if (filters.status === 'unused' && p.lastAnswer) return false;
    if (filters.status === 'incorrect' && (!p.lastAnswer || p.lastCorrect)) return false;
    if (filters.status === 'correct' && !p.lastCorrect) return false;
    if (filters.status === 'favorites' && !p.favorite) return false;
    if (filters.status === 'notes' && !p.note?.trim()) return false;
    // Search excludes answers and objectives, so the search UI never discloses them.
    return !search || [q.statement,q.topic,q.questionBank,q.sourceQuestionId,q.id].some(v => String(v).toLocaleLowerCase().includes(search));
  });
}

export function shuffled(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}

export function createSession(questions, config, now = Date.now()) {
  const count = Math.min(80, Math.max(1, Number(config.count) || 40), questions.length);
  if (!count) throw new Error('Nenhuma questão corresponde aos filtros.');
  const selected = (config.random !== false ? shuffled(questions) : questions).slice(0,count);
  return { id:`block_${now}_${Math.random().toString(36).slice(2,9)}`, version:0, step:config.step,
    title:config.title || `${stepLabel(config.step)} · Bloco de ${count}`, mode:config.mode || 'tutor',
    timed:!!config.timed, durationSeconds:count * (Number(config.secondsPerQuestion) || 90),
    remainingSeconds:count * (Number(config.secondsPerQuestion) || 90), startedAt:now, updatedAt:now,
    status:'active', index:0, answers:{}, flags:{}, eliminated:{}, highlights:{}, elapsedSeconds:0,
    questionRefs:selected.map(q => ({ key:q.key, id:q.id, packageId:q.packageId, release:q.release })) };
}

export function remainingTime(session, now = Date.now()) {
  if (!session?.timed) return null;
  return Math.max(0, session.remainingSeconds - (session.runningSince ? Math.floor((now - session.runningSince) / 1000) : 0));
}

export function reconcileSessionAnswers(session,previous) {
  return Object.fromEntries(Object.entries(session.answers).map(([key,answer]) => [key,{
    ...answer,recorded:!!previous?.answers?.[key]?.recorded,
  }]));
}

export function recordableAnswers(session,previous) {
  return Object.entries(session.answers).filter(([key,a]) => a.letter && a.committed
    && (session.status === 'completed' || session.mode === 'tutor') && !previous?.answers?.[key]?.recorded);
}

export function sessionScore(session, questions) {
  const map = new Map(questions.map(q => [q.key,q]));
  let correct = 0, answered = 0;
  for (const ref of session.questionRefs) {
    const answer = session.answers[ref.key];
    if (answer?.letter) { answered++; if (answer.letter === map.get(ref.key)?.correctAnswer) correct++; }
  }
  return { total:session.questionRefs.length, answered, correct, incorrect:answered - correct,
    omitted:session.questionRefs.length - answered, percent:Math.round(correct / session.questionRefs.length * 100) };
}

export function performanceRows(questions, progress, dimension = 'discipline') {
  const rows = new Map();
  questions.forEach(q => {
    const name = q[dimension] || 'Sem classificação';
    const row = rows.get(name) || { name, total:0, answered:0, correct:0, seconds:0 };
    row.total++;
    const p = progress[q.key];
    if (p?.lastAnswer) { row.answered++; if (p.firstCorrect) row.correct++; row.seconds += p.firstSeconds || 0; }
    rows.set(name,row);
  });
  return [...rows.values()].map(r => ({ ...r, percent:r.answered ? Math.round(r.correct / r.answered * 100) : null })).sort((a,b) => b.total-a.total);
}
