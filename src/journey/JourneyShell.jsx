import React, { useEffect, useMemo, useState } from 'react';
import { getCurriculumStats, getOrderedTopicRefs, getTopicRefByIndex } from './journeyCurriculum.js';
import { buildMasterQuestionsPrompt, buildSkillReviewQuestionPrompt, buildSubtopicsPrompt } from './journeyPrompts.js';
import { isDue, scheduleQuestionReview, todayKey } from './journeyScheduler.js';
import { appendLog, makeTopicKey, readJourneyState, touchStreak, writeJourneyState } from './journeyStorage.js';

const Icon = ({ name, className = '' }) => {
  const paths = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    book: '<path d="M4 5a3 3 0 0 1 3-3h13v17H7a3 3 0 0 0-3 3V5Z"/><path d="M4 19a3 3 0 0 1 3-3h13"/>',
    repeat: '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    map: '<path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/>',
    arrow: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    play: '<path d="m8 5 11 7-11 7V5Z"/>',
    spark: '<path d="m12 3 2 6 6 3-6 3-2 6-2-6-6-3 6-3 2-6Z"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    calendar: '<path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/>',
    chart: '<path d="M4 19V5M4 19h16"/><path d="M8 16v-5M13 16V8M18 16v-9"/>',
  };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: paths[name] || paths.spark }} />
  );
};

const slug = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '')
  .slice(0, 64);

const extractJson = (raw) => {
  const text = String(raw || '').trim();
  try { return JSON.parse(text); } catch {}
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('A resposta da IA não veio em JSON.');
  return JSON.parse(match[0]);
};

const correctLabels = [
  { id: 'easy', label: 'Fácil' },
  { id: 'normal', label: 'Normal' },
  { id: 'hard', label: 'Difícil' },
  { id: 'guessed', label: 'Acertei no chute' },
];

const wrongLabels = [
  { id: 'attention', label: 'Desatenção' },
  { id: 'marked_wrong', label: 'Erro de marcação' },
  { id: 'missed', label: 'Não sabia resolver' },
];

const TopicBadge = ({ status, darkMode }) => {
  const label = status === 'done' ? 'feito' : status === 'active' ? 'atual' : status === 'ready' ? 'gerado' : 'pend.';
  const cls = status === 'done'
    ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
    : status === 'active'
      ? 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30'
      : status === 'ready'
        ? 'bg-blue-500/15 text-blue-600 border-blue-500/30'
        : darkMode ? 'bg-gray-900 text-gray-500 border-gray-800' : 'bg-gray-50 text-gray-500 border-gray-200';
  return <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-black uppercase leading-none ${cls}`}>{label}</span>;
};

function StatCard({ label, value, helper, darkMode }) {
  return (
    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
      <p className="mt-2 text-3xl font-black text-yellow-600">{value}</p>
      {helper && <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{helper}</p>}
    </div>
  );
}

function JourneyQuestion({ question, state, setState, topicRef, subtopic, darkMode, onComplete, navigation }) {
  const attempt = state.questionAttempts?.[question.id] || null;
  const alreadyDone = (state.completedQuestionIds || []).includes(question.id);
  const [choice, setChoice] = useState(attempt?.choice || '');
  const [checked, setChecked] = useState(Boolean(attempt || alreadyDone));
  const [expandedPanel, setExpandedPanel] = useState('explanation');
  const [quality, setQuality] = useState(attempt?.quality || '');
  const [scheduled, setScheduled] = useState(Boolean(attempt || alreadyDone));

  const panel = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const soft = darkMode ? 'bg-gray-950 border-gray-800' : 'bg-yellow-50/40 border-yellow-100';
  const muted = darkMode ? 'text-gray-400' : 'text-gray-600';
  const selectedChoice = choice || attempt?.choice || question.answer;
  const isCorrect = selectedChoice === question.answer;

  useEffect(() => {
    const nextAttempt = state.questionAttempts?.[question.id] || null;
    const done = (state.completedQuestionIds || []).includes(question.id);
    setChoice(nextAttempt?.choice || '');
    setChecked(Boolean(nextAttempt || done));
    setQuality(nextAttempt?.quality || '');
    setScheduled(Boolean(nextAttempt || done));
    setExpandedPanel('explanation');
  }, [question.id, state.questionAttempts, state.completedQuestionIds]);

  const scheduleThisQuestion = () => {
    if (!quality || scheduled) return;
    const today = todayKey();
    const next = scheduleQuestionReview({ correct: isCorrect, quality, missReason: quality }, attempt?.intervalDays || 0, today);
    const review = {
      id: `question-${question.id}-${Date.now()}`,
      source: 'question',
      sourceQuestionId: question.id,
      area: topicRef.area,
      topic: topicRef.topic,
      subtopic: subtopic.title,
      prompt: question.stem,
      focus: 'Revisar o mesmo ponto de raciocinio em uma questao curta diferente.',
      originalQuestion: question,
      dueDate: next.dueDate,
      intervalDays: next.intervalDays,
      history: [{
        at: today,
        correct: isCorrect,
        quality,
        missReason: quality,
        choice: selectedChoice,
        answer: question.answer,
      }],
    };
    setScheduled(true);
    setState((prev) => {
      const existingReviews = (prev.skillReviews || []).filter((item) => item.sourceQuestionId !== question.id || item.source !== 'question');
      return appendLog(touchStreak({
        ...prev,
        questionAttempts: {
          ...(prev.questionAttempts || {}),
          [question.id]: {
            choice: selectedChoice,
            answer: question.answer,
            correct: isCorrect,
            quality,
            missReason: quality,
            intervalDays: next.intervalDays,
            dueDate: next.dueDate,
            at: today,
          },
        },
        skillReviews: [...existingReviews, review],
        completedQuestionIds: [...new Set([...(prev.completedQuestionIds || []), question.id])],
      }), `Questao agendada para ${next.dueDate}.`);
    });
    const total = navigation?.total || 1;
    const current = navigation?.current || 1;
    const remaining = Math.max(0, total - current);
    onComplete?.({ intervalDays: next.intervalDays, remaining }, question.id);
  };

  const altClass = (alt) => {
    if (!checked) {
      return choice === alt.letter
        ? darkMode ? 'border-blue-500 bg-blue-900/20 text-blue-100' : 'border-blue-400 bg-blue-50 text-blue-900'
        : darkMode ? 'border-gray-600 bg-gray-800 text-gray-300 hover:border-yellow-500' : 'border-gray-200 bg-white text-gray-700 hover:border-yellow-400';
    }
    if (alt.letter === question.answer) return darkMode ? 'border-green-500 bg-green-900/20 text-green-100' : 'border-green-500 bg-green-50 text-green-900';
    if (alt.letter === selectedChoice) return darkMode ? 'border-red-500 bg-red-900/20 text-red-100' : 'border-red-400 bg-red-50 text-red-900';
    return 'opacity-40';
  };

  const toolButtons = [
    { id: 'explanation', label: 'Explicação' },
    { id: 'alternatives', label: 'Alternativas' },
  ];

  return (
    <div className={`mb-6 rounded-xl border p-4 shadow-sm md:p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${darkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
            Questão {navigation?.current || 1}
          </span>
          {scheduled && <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">Respondida</span>}
        </div>
        {navigation && (
          <div className="flex items-center gap-2">
          <button
            onClick={navigation.onPrev}
            disabled={!navigation.canPrev}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-40 ${darkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-yellow-400' : 'border-transparent text-gray-300 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200'}`}
            title="Questão anterior"
          >
            <Icon name="arrow" className="h-4 w-4" />
          </button>
          <span className={`text-xs font-bold ${muted}`}>{navigation.current}/{navigation.total}</span>
          <button
            onClick={navigation.onNext}
            disabled={!navigation.canNext}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-40 ${darkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-yellow-400' : 'border-transparent text-gray-300 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200'}`}
            title="Próxima questão"
          >
            <Icon name="chevron" className="h-4 w-4" />
          </button>
          </div>
        )}
      </div>
      <div className={`mb-6 whitespace-pre-wrap text-base leading-relaxed select-text md:text-lg ${darkMode ? 'text-gray-200' : 'text-gray-800'}`} style={{ userSelect: 'text' }}>{question.stem}</div>
        <div className="mb-4 space-y-3">
          {(question.alternatives || []).map((alt) => (
            <div key={alt.letter} className={`rounded-lg border transition-colors ${altClass(alt)}`}>
              <button
                onClick={() => !checked && setChoice(alt.letter)}
                disabled={checked}
                className="flex w-full items-start p-3 text-left md:p-4"
              >
                <span className={`mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded text-sm font-bold ${checked && alt.letter === question.answer ? 'bg-green-500 text-white' : checked && alt.letter === selectedChoice ? 'bg-red-500 text-white' : choice === alt.letter && !checked ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{alt.letter}</span>
                <span className="min-w-0 flex-1 pt-1 text-sm leading-snug select-text md:text-base" style={{ userSelect: 'text' }}>{alt.text}</span>
                {checked && alt.letter === question.answer && <Icon name="check" className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />}
                {checked && alt.letter === selectedChoice && alt.letter !== question.answer && <span className="mt-0.5 shrink-0 text-xl font-black text-red-500">×</span>}
              </button>
              {checked && (alt.letter === question.answer || alt.letter === selectedChoice) && (
                <div className={`mx-4 mb-4 rounded-lg border p-3 text-sm leading-relaxed ${alt.letter === question.answer ? 'border-emerald-500/30 bg-emerald-500/10' : alt.letter === selectedChoice ? 'border-red-500/30 bg-red-500/10' : darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                  {alt.explanation || (alt.letter === question.answer ? 'Esta é a alternativa correta.' : 'Esta alternativa não é a melhor resposta para o caso.')}
                </div>
              )}
            </div>
          ))}
        </div>
        {!checked ? (
          <div className="mt-5 flex justify-center">
            <button disabled={!choice} onClick={() => setChecked(true)} className="min-w-[220px] rounded-xl bg-yellow-600 px-6 py-3 text-center font-black text-gray-950 shadow-sm disabled:opacity-40">
              Corrigir
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
          <div>
            {!scheduled && (
              <div className={`rounded-xl border p-4 ${soft}`}>
                <p className="text-center font-black">{isCorrect ? 'Como foi esse acerto?' : 'O que aconteceu no erro?'}</p>
                {isCorrect ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-4">
                    {correctLabels.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setQuality(item.id)}
                        className={`rounded-xl border px-3 py-3 font-bold ${quality === item.id ? 'border-yellow-500 bg-yellow-500/15 text-yellow-600' : darkMode ? 'border-gray-800 bg-gray-950 hover:border-gray-700' : 'border-gray-200 bg-white hover:border-yellow-300'}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    <div className="grid gap-2 sm:grid-cols-3">
                      {wrongLabels.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setQuality(item.id)}
                          className={`rounded-xl border px-3 py-3 font-bold ${quality === item.id ? 'border-yellow-500 bg-yellow-500/15 text-yellow-600' : darkMode ? 'border-gray-800 bg-gray-950 hover:border-gray-700' : 'border-gray-200 bg-white hover:border-yellow-300'}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-4 flex justify-center">
                  <button
                    disabled={!quality}
                    onClick={scheduleThisQuestion}
                    className="min-w-[220px] rounded-xl bg-yellow-600 px-6 py-3 text-center font-black text-gray-950 shadow-sm disabled:opacity-40"
                  >
                    Confirmar revisão
                  </button>
                </div>
              </div>
            )}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {toolButtons.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setExpandedPanel((prev) => prev === item.id ? '' : item.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-bold ${expandedPanel === item.id ? 'border-yellow-500 bg-yellow-500/15 text-yellow-600' : darkMode ? 'border-gray-800 hover:border-gray-700' : 'border-gray-200 hover:border-yellow-400'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {expandedPanel && (
              <div className={`mt-3 rounded-xl border p-4 text-sm leading-relaxed ${soft}`}>
                {expandedPanel === 'explanation' && <p className="whitespace-pre-wrap">{question.explanation}</p>}
                {expandedPanel === 'alternatives' && (
                  <div className="space-y-3">
                    {(question.alternatives || []).map((alt) => (
                      <p key={alt.letter}><span className="font-black">{alt.letter}.</span> {alt.explanation || (alt.letter === question.answer ? 'Alternativa correta.' : 'Alternativa incorreta.')}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
            {scheduled ? (
              <div className={`mt-5 rounded-xl border p-4 text-center ${soft}`}>
                <p className="font-black text-emerald-600">Questão já agendada</p>
                <p className={`mt-1 text-sm ${muted}`}>Ela volta em {attempt?.dueDate || 'uma data futura'} conforme a sua resposta.</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review, setState, darkMode, onGenerateReviewQuestion, loading }) {
  const [choice, setChoice] = useState('');
  const [checked, setChecked] = useState(false);
  const [quality, setQuality] = useState('');
  const [scheduled, setScheduled] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState('explanation');
  const panel = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const soft = darkMode ? 'bg-gray-950 border-gray-800' : 'bg-yellow-50/40 border-yellow-100';
  const mini = review.reviewQuestion;
  const toolButtons = [
    { id: 'explanation', label: 'Explicação' },
    { id: 'alternatives', label: 'Alternativas' },
  ];
  const reviewAltClass = (alt) => {
    if (!checked) {
      return choice === alt.letter
        ? darkMode ? 'border-blue-500 bg-blue-900/20 text-blue-100' : 'border-blue-400 bg-blue-50 text-blue-900'
        : darkMode ? 'border-gray-600 bg-gray-800 text-gray-300 hover:border-yellow-500' : 'border-gray-200 bg-white text-gray-700 hover:border-yellow-400';
    }
    if (alt.letter === mini.answer) return darkMode ? 'border-green-500 bg-green-900/20 text-green-100' : 'border-green-500 bg-green-50 text-green-900';
    if (alt.letter === choice) return darkMode ? 'border-red-500 bg-red-900/20 text-red-100' : 'border-red-400 bg-red-50 text-red-900';
    return 'opacity-40';
  };

  const reschedule = () => {
    if (!mini || !checked || !quality || scheduled) return;
    const correct = choice === mini.answer;
    const next = scheduleQuestionReview({ correct, quality, missReason: quality }, review.intervalDays || 0);
    setScheduled(true);
    setState((prev) => appendLog(touchStreak({
      ...prev,
      skillReviews: (prev.skillReviews || []).map((item) => item.id === review.id ? {
        ...item,
        dueDate: next.dueDate,
        intervalDays: next.intervalDays,
        history: [...(item.history || []), { at: todayKey(), correct, quality, missReason: quality, choice, answer: mini.answer }],
      } : item),
    }), `Revisão reagendada para ${next.dueDate}.`));
  };

  return (
    <div className={`mb-6 rounded-xl border p-4 shadow-sm md:p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${darkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
            Revisão
          </span>
          {scheduled && <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">Respondida</span>}
        </div>
      </div>
      <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{review.area} · {review.topic}</p>
      <h3 className="mt-2 text-xl font-black text-yellow-600">{review.subtopic}</h3>
      <div className={`mt-4 rounded-xl border p-4 ${soft}`}>
        <p className="font-bold">{review.prompt}</p>
        {review.focus && <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Foco: {review.focus}</p>}
      </div>
      {!mini ? (
        <button
          onClick={() => onGenerateReviewQuestion(review)}
          disabled={!!loading}
          className="mt-4 rounded-xl bg-yellow-600 px-5 py-3 font-bold text-gray-950 disabled:opacity-50"
        >
          Gerar miniquestão
        </button>
      ) : (
        <div className="mt-5 space-y-4">
          <div>
            <div className={`mb-6 whitespace-pre-wrap text-base font-bold leading-relaxed select-text md:text-lg ${darkMode ? 'text-gray-200' : 'text-gray-800'}`} style={{ userSelect: 'text' }}>{mini.stem}</div>
            <div className="mb-4 space-y-3">
              {(mini.alternatives || []).map((alt) => (
                <div key={alt.letter} className={`rounded-lg border transition-colors ${reviewAltClass(alt)}`}>
                  <button
                    onClick={() => !checked && setChoice(alt.letter)}
                    disabled={checked}
                    className="flex w-full items-start p-3 text-left md:p-4"
                  >
                    <span className={`mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded text-sm font-bold ${checked && alt.letter === mini.answer ? 'bg-green-500 text-white' : checked && alt.letter === choice ? 'bg-red-500 text-white' : choice === alt.letter && !checked ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{alt.letter}</span>
                    <span className="min-w-0 flex-1 pt-1 text-sm leading-snug select-text md:text-base" style={{ userSelect: 'text' }}>{alt.text}</span>
                    {checked && alt.letter === mini.answer && <Icon name="check" className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />}
                    {checked && alt.letter === choice && alt.letter !== mini.answer && <span className="mt-0.5 shrink-0 text-xl font-black text-red-500">×</span>}
                  </button>
                  {checked && (alt.letter === mini.answer || alt.letter === choice) && (
                    <div className={`mx-4 mb-4 rounded-lg border p-3 text-sm leading-relaxed ${alt.letter === mini.answer ? 'border-emerald-500/30 bg-emerald-500/10' : alt.letter === choice ? 'border-red-500/30 bg-red-500/10' : darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                      {alt.explanation || (alt.letter === mini.answer ? 'Esta é a alternativa correta.' : 'Esta alternativa não é a melhor resposta para o caso.')}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!checked ? (
              <div className="mt-5 flex justify-center">
                <button disabled={!choice} onClick={() => setChecked(true)} className="min-w-[220px] rounded-xl bg-yellow-600 px-6 py-3 text-center font-black text-gray-950 shadow-sm disabled:opacity-40">
                  Corrigir revisão
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
      {mini && checked && !scheduled && (
        <div className={`mt-4 rounded-xl border p-4 ${soft}`}>
          <p className="text-center font-black">{choice === mini.answer ? 'Como foi esse acerto?' : 'O que aconteceu no erro?'}</p>
          <div className={`mt-3 grid gap-2 ${choice === mini.answer ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
            {(choice === mini.answer ? correctLabels : wrongLabels).map((item) => (
              <button
                key={item.id}
                onClick={() => setQuality(item.id)}
                className={`rounded-xl border px-3 py-3 font-bold ${quality === item.id ? 'border-yellow-500 bg-yellow-500/15 text-yellow-600' : darkMode ? 'border-gray-800 bg-gray-950 hover:border-gray-700' : 'border-gray-200 bg-white hover:border-yellow-300'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <button
              disabled={!quality}
              onClick={reschedule}
              className="min-w-[220px] rounded-xl bg-yellow-600 px-6 py-3 text-center font-black text-gray-950 shadow-sm disabled:opacity-40"
            >
              Confirmar revisão
            </button>
          </div>
        </div>
      )}
      {mini && checked && (
        <>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {toolButtons.map((item) => (
              <button
                key={item.id}
                onClick={() => setExpandedPanel((prev) => prev === item.id ? '' : item.id)}
                className={`rounded-full border px-4 py-2 text-sm font-bold ${expandedPanel === item.id ? 'border-yellow-500 bg-yellow-500/15 text-yellow-600' : darkMode ? 'border-gray-800 hover:border-gray-700' : 'border-gray-200 hover:border-yellow-400'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {expandedPanel && (
            <div className={`mt-3 rounded-xl border p-4 text-sm leading-relaxed ${soft}`}>
              {expandedPanel === 'explanation' && <p className="whitespace-pre-wrap">{mini.explanation}</p>}
              {expandedPanel === 'alternatives' && (
                <div className="space-y-3">
                  {(mini.alternatives || []).map((alt) => (
                    <p key={alt.letter}><span className="font-black">{alt.letter}.</span> {alt.explanation || (alt.letter === mini.answer ? 'Alternativa correta.' : 'Alternativa incorreta.')}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
      {mini && scheduled && (
        <div className={`mt-4 rounded-xl border p-4 text-center ${soft}`}>
          <p className="font-black text-emerald-600">Revisão reagendada</p>
        </div>
      )}
    </div>
  );
}

export default function JourneyShell({ darkMode, onBack, onCallGemini }) {
  const [state, setStateRaw] = useState(() => readJourneyState());
  const [tab, setTab] = useState(state.activeTab || 'home');
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const stats = useMemo(() => getCurriculumStats(), []);
  const orderedTopics = useMemo(() => getOrderedTopicRefs(), []);

  const setState = (updater) => {
    setStateRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
  };

  useEffect(() => {
    writeJourneyState({ ...state, activeTab: tab });
  }, [state, tab]);

  const theme = {
    shell: darkMode ? 'bg-gray-950 text-gray-100' : 'bg-yellow-50/50 text-gray-950',
    side: darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-yellow-100',
    panel: darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
    soft: darkMode ? 'bg-gray-950 border-gray-800' : 'bg-yellow-50/60 border-yellow-100',
    muted: darkMode ? 'text-gray-400' : 'text-gray-600',
  };

  const today = todayKey();
  const dueReviews = (state.skillReviews || []).filter((item) => isDue(item.dueDate, today));
  const completedCount = (state.completedQuestionIds || []).length;
  const generatedCount = Object.keys(state.generatedTopics || {}).length;
  const activeTopic = getTopicRefByIndex(state.currentTopicIndex) || getTopicRefByIndex(0);
  const activeTopicKey = activeTopic ? makeTopicKey(activeTopic) : null;
  const activeGenerated = activeTopicKey ? state.generatedTopics?.[activeTopicKey] : null;
  const completedIds = state.completedQuestionIds || [];
  const activeSubtopic = activeGenerated?.subtopics?.find((subtopic) => {
    const subtopicKey = `${activeTopicKey}::${subtopic.id || slug(subtopic.title)}`;
    const questions = state.masterQuestions?.[subtopicKey] || [];
    return !questions.length || questions.some((question) => !completedIds.includes(question.id));
  }) || null;
  const activeSubtopicKey = activeSubtopic ? `${activeTopicKey}::${activeSubtopic.id || slug(activeSubtopic.title)}` : null;
  const activeQuestions = activeSubtopicKey ? state.masterQuestions?.[activeSubtopicKey] || [] : [];
  const activeQuestion = activeQuestions.find((question) => !completedIds.includes(question.id)) || null;
  const activeQuestionEntries = (activeGenerated?.subtopics || []).flatMap((subtopic) => {
    const subtopicKey = `${activeTopicKey}::${subtopic.id || slug(subtopic.title)}`;
    return (state.masterQuestions?.[subtopicKey] || []).map((question) => ({ question, subtopic, subtopicKey }));
  });
  const nextQuestionEntry = activeQuestionEntries.find((entry) => !completedIds.includes(entry.question.id)) || null;
  const selectedQuestionEntry = state.selectedQuestionId
    ? activeQuestionEntries.find((entry) => entry.question.id === state.selectedQuestionId)
    : null;
  const displayQuestionEntry = selectedQuestionEntry || nextQuestionEntry || (activeQuestion ? { question: activeQuestion, subtopic: activeSubtopic, subtopicKey: activeSubtopicKey } : null);
  const displayQuestionIndex = displayQuestionEntry
    ? activeQuestionEntries.findIndex((entry) => entry.question.id === displayQuestionEntry.question.id)
    : -1;

  const nav = [
    { id: 'home', label: 'Início', icon: 'home' },
    { id: 'library', label: 'Questões novas', icon: 'book' },
    { id: 'review', label: 'Revisão', icon: 'repeat' },
    { id: 'schedule', label: 'Cronograma', icon: 'map' },
  ];

  const goNextStep = async () => {
    setError('');
    setNotice('');
    if (!state.started || !activeGenerated) {
      await generateForTopic(activeTopic);
      return;
    }
    setTab('library');
    setNotice('Próxima etapa aberta.');
  };

  const generateQuestionsForSubtopic = async (topicRef, subtopic) => {
    const topicKey = makeTopicKey(topicRef);
    const subtopicKey = `${topicKey}::${subtopic.id || slug(subtopic.title)}`;
    setError('');
    setLoading('Gerando questões...');
    const rawQuestions = await onCallGemini(
      buildMasterQuestionsPrompt({ ...topicRef, subtopic }),
      'Responda apenas JSON válido. Você cria sequências de questões médicas curtas, progressivas e sem epidemiologia desnecessária.'
    );
    const parsedQuestions = extractJson(rawQuestions);
    const questions = (parsedQuestions.questions || []).map((item, index) => ({
      id: item.id || `${slug(subtopic.title)}-q${index + 1}`,
      ...item,
    }));
    if (!questions.length) throw new Error('A IA não retornou questões.');
    setState((prev) => appendLog({
      ...prev,
      masterQuestions: {
        ...(prev.masterQuestions || {}),
        [subtopicKey]: questions,
      },
      selectedQuestionId: questions[0]?.id || prev.selectedQuestionId,
      generatedTopics: {
        ...(prev.generatedTopics || {}),
        [topicKey]: {
          ...(prev.generatedTopics?.[topicKey] || topicRef),
          subtopics: (prev.generatedTopics?.[topicKey]?.subtopics || []).map((item) => item.id === subtopic.id ? { ...item, status: 'active' } : item),
        },
      },
    }, `Questões geradas: ${subtopic.title}`));
    return questions;
  };

  const generateForTopic = async (topicRef = activeTopic) => {
    if (!topicRef) return;
    setError('');
    setLoading('Gerando subtópicos...');
    const topicKey = makeTopicKey(topicRef);
    if (state.generatedTopics?.[topicKey]) {
      setTab('library');
      setNotice('Este bloco já está pronto. Abri a próxima questão.');
      setLoading('');
      return;
    }
    try {
      const rawSubtopics = await onCallGemini(
        buildSubtopicsPrompt(topicRef),
        'Responda apenas JSON válido. Você organiza currículo médico em subtópicos pedagógicos.'
      );
      const parsedSubtopics = extractJson(rawSubtopics);
      const subtopics = (parsedSubtopics.subtopics || []).map((item, index) => ({
        id: item.id || slug(item.title || `subtopico-${index + 1}`),
        title: item.title || `Subtópico ${index + 1}`,
        why_now: item.why_now || '',
        scope: Array.isArray(item.scope) ? item.scope : [],
        status: index === 0 ? 'active' : 'pending',
      }));
      if (!subtopics.length) throw new Error('A IA não retornou subtópicos.');

      setState((prev) => appendLog({
        ...prev,
        started: true,
        selectedAreaId: topicRef.areaId,
        selectedTopicKey: topicKey,
        generatedTopics: {
          ...(prev.generatedTopics || {}),
          [topicKey]: {
            ...topicRef,
            status: 'active',
            generatedAt: new Date().toISOString(),
            subtopics,
          },
        },
      }, `Gerado: ${topicRef.area} · ${topicRef.topic}`));
      const questions = await generateQuestionsForSubtopic(topicRef, subtopics[0]);
      setTab('library');
      setNotice(`${questions.length} ${questions.length === 1 ? 'questão gerada' : 'questões geradas'}. Pode começar.`);
    } catch (err) {
      setError(err?.message || 'Não foi possível gerar a Jornada agora.');
    } finally {
      setLoading('');
    }
  };

  const completeTopicAndPrepareNext = async () => {
    if (!activeTopic || !activeTopicKey) return;
    const nextTopic = getTopicRefByIndex(activeTopic.globalIndex + 1);
    setState((prev) => appendLog(touchStreak({
      ...prev,
      completedTopicKeys: [...new Set([...(prev.completedTopicKeys || []), activeTopicKey])],
      currentTopicIndex: nextTopic ? nextTopic.globalIndex : activeTopic.globalIndex,
    }), `Tópico concluído: ${activeTopic.topic}`));
    if (nextTopic) await generateForTopic(nextTopic);
  };

  const generateReviewQuestion = async (review) => {
    setError('');
    setLoading('Gerando miniquestão de revisão...');
    try {
      const raw = await onCallGemini(
        buildSkillReviewQuestionPrompt(review),
        'Responda apenas JSON válido. Você cria miniquestões médicas objetivas para revisar o mesmo raciocínio de uma questão anterior.'
      );
      const parsed = extractJson(raw);
      const question = parsed.question;
      if (!question?.stem || !question?.answer) throw new Error('A IA não retornou uma miniquestão válida.');
      setState((prev) => appendLog({
        ...prev,
        skillReviews: (prev.skillReviews || []).map((item) => item.id === review.id ? {
          ...item,
          reviewQuestion: {
            id: question.id || `rev-${slug(review.prompt)}-${Date.now()}`,
            ...question,
          },
        } : item),
      }, `Miniquestão gerada: ${review.subtopic}`));
    } catch (err) {
      setError(err?.message || 'Não foi possível gerar a miniquestão.');
    } finally {
      setLoading('');
    }
  };

  const renderHome = () => (
    <div className="space-y-6">
      <section className={`rounded-2xl border p-6 ${theme.panel}`}>
        <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Jornada do Herói</p>
        <h1 className="mt-2 text-3xl font-black text-yellow-600">A próxima coisa certa, sem você ter que escolher</h1>
        <p className={`mt-3 max-w-3xl ${theme.muted}`}>
          A Jornada agora funciona como uma esteira de questões curtas: gerar subtópicos, responder uma sequência progressiva e deixar cada questão voltar no dia certo.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={goNextStep} disabled={!!loading} className="inline-flex items-center gap-2 rounded-xl bg-yellow-600 px-5 py-3 font-bold text-gray-950 disabled:opacity-50">
            <Icon name="play" className="h-4 w-4"/> {state.started ? 'Continuar Jornada' : 'Iniciar Jornada'}
          </button>
          <button onClick={() => setTab('schedule')} className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-bold ${darkMode ? 'border-gray-800 hover:border-gray-700' : 'border-gray-200 hover:border-yellow-400'}`}>
            <Icon name="map" className="h-4 w-4"/> Ver cronograma
          </button>
        </div>
        {loading && <p className="mt-4 text-sm font-bold text-yellow-600">{loading}</p>}
        {notice && <p className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-600">{notice}</p>}
        {error && <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm font-bold text-red-500">{error}</p>}
      </section>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard darkMode={darkMode} label="Revisões de hoje" value={dueReviews.length} helper="questões vencidas" />
        <StatCard darkMode={darkMode} label="Assuntos novos" value={state.started ? 1 : 0} helper={activeTopic?.topic || 'aguardando início'} />
        <StatCard darkMode={darkMode} label="Sequência" value={state.streak?.current || 0} helper={`melhor: ${state.streak?.best || 0}`} />
        <StatCard darkMode={darkMode} label="Mapa" value={`${generatedCount}/${stats.topics}`} helper={`${stats.areas} áreas`} />
      </div>
    </div>
  );

  const renderLibrary = () => (
    <div className="mx-auto max-w-5xl space-y-4">
      <section className={`rounded-2xl border p-5 ${theme.panel}`}>
        <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Questões novas</p>
        <h2 className="mt-2 text-2xl font-black text-yellow-600">Próxima questão</h2>
        <p className={`mt-1 ${theme.muted}`}>
          {activeQuestionEntries.length
            ? `${completedIds.filter((id) => activeQuestionEntries.some((entry) => entry.question.id === id)).length}/${activeQuestionEntries.length} questões deste bloco`
            : 'Prepare o próximo bloco para começar.'}
        </p>
        {loading && <p className="mt-3 text-sm font-bold text-yellow-600">{loading}</p>}
        {notice && <p className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-600">{notice}</p>}
        {error && <p className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm font-bold text-red-500">{error}</p>}
      </section>

      {!activeGenerated ? (
        <section className={`rounded-2xl border p-8 text-center ${theme.panel}`}>
          <p className="text-xl font-black">Próximo bloco ainda não foi preparado</p>
          <p className={`mt-2 ${theme.muted}`}>O Gemini vai gerar a estrutura interna e a primeira bateria de questões.</p>
          <button onClick={() => generateForTopic(activeTopic)} disabled={!!loading} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-yellow-600 px-5 py-3 font-bold text-gray-950 disabled:opacity-50">
            <Icon name="spark" className="h-4 w-4"/> Preparar próximo bloco
          </button>
        </section>
      ) : activeSubtopic && !activeQuestions.length ? (
        <section className={`rounded-2xl border p-6 ${theme.panel}`}>
          <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Próxima etapa</p>
          <h3 className="mt-2 text-xl font-black text-yellow-600">Gerar questões</h3>
          <p className={`mt-2 ${theme.muted}`}>A estrutura interna já existe. Agora só falta criar a bateria de questões da próxima etapa.</p>
          <button
            onClick={async () => {
              try {
                const questions = await generateQuestionsForSubtopic(activeTopic, activeSubtopic);
                setNotice(`${questions.length} ${questions.length === 1 ? 'questão gerada' : 'questões geradas'}. Pode responder a próxima.`);
              } catch (err) {
                setError(err?.message || 'Não foi possível gerar as questões.');
              } finally {
                setLoading('');
              }
            }}
            disabled={!!loading}
            className="mt-4 rounded-xl bg-yellow-600 px-5 py-3 font-bold text-gray-950 disabled:opacity-50"
          >
            Gerar questões
          </button>
        </section>
      ) : displayQuestionEntry ? (
        <JourneyQuestion
          key={displayQuestionEntry.question.id}
          question={displayQuestionEntry.question}
          state={state}
          setState={setState}
          topicRef={activeTopic}
          subtopic={displayQuestionEntry.subtopic}
          darkMode={darkMode}
          navigation={{
            current: displayQuestionIndex + 1,
            total: activeQuestionEntries.length,
            canPrev: displayQuestionIndex > 0,
            canNext: displayQuestionIndex >= 0 && displayQuestionIndex < activeQuestionEntries.length - 1,
            onPrev: () => {
              const prev = activeQuestionEntries[displayQuestionIndex - 1];
              if (prev) setState((currentState) => ({ ...currentState, selectedQuestionId: prev.question.id }));
            },
            onNext: () => {
              const next = activeQuestionEntries[displayQuestionIndex + 1];
              if (next) setState((currentState) => ({ ...currentState, selectedQuestionId: next.question.id }));
            },
          }}
          onComplete={(_, completedQuestionId) => {
            const completedSet = new Set([...completedIds, completedQuestionId]);
            const nextEntry = activeQuestionEntries.find((entry) => !completedSet.has(entry.question.id));
            setState((currentState) => ({ ...currentState, selectedQuestionId: nextEntry?.question.id || completedQuestionId }));
          }}
        />
      ) : (
        <section className={`rounded-2xl border p-6 ${theme.panel}`}>
          <p className="text-xl font-black text-yellow-600">Bloco concluído</p>
          <p className={`mt-2 ${theme.muted}`}>Todas as questões geradas deste bloco foram concluídas.</p>
          <button onClick={completeTopicAndPrepareNext} disabled={!!loading} className="mt-4 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white disabled:opacity-50">
            Concluir bloco e preparar próximo
          </button>
        </section>
      )}
    </div>
  );

  const renderReview = () => (
    <div className="space-y-4">
      <section className={`rounded-2xl border p-5 ${theme.panel}`}>
        <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Revisão</p>
        <h2 className="mt-2 text-2xl font-black text-yellow-600">{dueReviews.length} revisões para hoje</h2>
          <p className={`mt-1 ${theme.muted}`}>Tudo que venceu na data de hoje aparece aqui, independente da hora em que foi estudado.</p>
        {loading && <p className="mt-3 text-sm font-bold text-yellow-600">{loading}</p>}
        {error && <p className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm font-bold text-red-500">{error}</p>}
      </section>
      {dueReviews.length ? (
        dueReviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            setState={setState}
            darkMode={darkMode}
            loading={loading}
            onGenerateReviewQuestion={generateReviewQuestion}
          />
        ))
      ) : (
        <div className={`rounded-2xl border p-8 text-center ${theme.panel}`}>
          <p className="text-xl font-black">Nada vencido agora</p>
          <p className={`mt-2 ${theme.muted}`}>Quando questões vencerem, elas entram aqui como revisão.</p>
        </div>
      )}
    </div>
  );

  const getTopicStatus = (area, topic) => {
    const key = makeTopicKey({ areaId: area.id, topic });
    const generated = state.generatedTopics?.[key];
    if ((state.completedTopicKeys || []).includes(key)) return 'done';
    if (generated?.status) return generated.status;
    if (key === activeTopicKey) return 'active';
    return 'pending';
  };

  const selectedTopicKey = state.selectedTopicKey || activeTopicKey;
  const selectedTopic = orderedTopics.find((item) => makeTopicKey(item) === selectedTopicKey) || activeTopic;
  const selectedGenerated = selectedTopic ? state.generatedTopics?.[makeTopicKey(selectedTopic)] : null;

  const renderSchedule = () => (
    <div className="grid h-full min-h-0 min-w-0 gap-5 lg:grid-cols-[minmax(300px,420px)_minmax(0,1fr)]">
      <section className={`flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border p-4 ${theme.panel}`}>
        <div className="shrink-0 flex items-end justify-between gap-3">
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Cronograma</p>
            <h2 className="mt-1 text-2xl font-black text-yellow-600">Ordem da Jornada</h2>
          </div>
          <span className={`text-xs font-bold ${theme.muted}`}>{orderedTopics.length} tópicos</span>
        </div>
        <div
          className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {orderedTopics.map((item, index) => {
            const key = makeTopicKey(item);
            const active = key === selectedTopicKey;
            return (
              <button
                key={key}
                onClick={() => setState((prev) => ({ ...prev, selectedAreaId: item.areaId, selectedTopicKey: key }))}
                className={`flex w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${active ? 'border-yellow-500 bg-yellow-500/15' : darkMode ? 'border-gray-800 hover:bg-gray-950' : 'border-gray-200 hover:bg-yellow-50'}`}
              >
                <span className={`w-7 shrink-0 text-right text-xs font-black ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black">{item.topic}</span>
                  <span className={`block truncate text-xs ${theme.muted}`}>{item.area}</span>
                </span>
                <TopicBadge darkMode={darkMode} status={getTopicStatus({ id: item.areaId }, item.topic)} />
              </button>
            );
          })}
        </div>
      </section>

      <section className={`flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border p-5 ${theme.panel}`}>
        <div className="shrink-0">
          <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Detalhes</p>
          <h3 className="mt-2 min-w-0 break-words text-2xl font-black text-yellow-600">{selectedTopic?.topic}</h3>
          <p className={`mt-1 break-words ${theme.muted}`}>{selectedTopic?.area}</p>
        </div>
        <div
          className={`mt-5 min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border p-4 ${theme.soft}`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-black">Subtópicos</p>
              <p className={`text-sm ${theme.muted}`}>{selectedGenerated?.subtopics?.length ? 'Gerados pelo Gemini para este tópico.' : 'Ainda não gerados.'}</p>
            </div>
            <TopicBadge darkMode={darkMode} status={selectedTopic ? getTopicStatus({ id: selectedTopic.areaId }, selectedTopic.topic) : 'pending'} />
          </div>
          {selectedGenerated?.subtopics?.length ? (
            <div className="mt-4 divide-y divide-gray-500/10">
              {selectedGenerated.subtopics.map((subtopic, index) => {
                const subtopicKey = `${makeTopicKey(selectedTopic)}::${subtopic.id || slug(subtopic.title)}`;
                const qs = state.masterQuestions?.[subtopicKey] || [];
                const done = qs.filter((question) => (state.completedQuestionIds || []).includes(question.id)).length;
                return (
                  <div key={subtopic.id || subtopic.title} className="grid min-w-0 grid-cols-[32px_minmax(0,1fr)_auto] items-start gap-3 py-3">
                    <span className={`mt-0.5 w-7 shrink-0 text-right text-xs font-black ${theme.muted}`}>{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-bold">{subtopic.title}</p>
                      {subtopic.why_now && <p className={`mt-1 break-words text-sm ${theme.muted}`}>{subtopic.why_now}</p>}
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${darkMode ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-600'}`}>{done}/{qs.length || 0}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 text-center">
              <p className={`text-sm ${theme.muted}`}>Quando este tópico entrar na fila, os subtópicos aparecem aqui.</p>
              {selectedTopic && makeTopicKey(selectedTopic) === activeTopicKey && (
                <button onClick={() => generateForTopic(selectedTopic)} disabled={!!loading || !!selectedGenerated} className="mt-4 rounded-xl bg-yellow-600 px-5 py-3 font-bold text-gray-950 disabled:opacity-50">
                  Preparar este tópico
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );

  return (
    <div
      className={`fixed inset-x-0 bottom-0 overflow-hidden ${theme.shell}`}
      style={{ top: 72, zIndex: 99999 }}
    >
      <div className="flex min-h-0" style={{ height: 'calc(100vh - 72px)' }}>
        <aside
          className={`${collapsed ? 'w-[76px]' : 'w-[280px]'} hidden h-full shrink-0 overflow-y-auto border-r p-3 transition-all md:block ${theme.side}`}
        >
          <div className="flex items-center justify-between gap-2 px-2 py-3">
            {!collapsed && <div><p className="text-lg font-black text-yellow-600">Jornada</p><p className={`text-xs ${theme.muted}`}>do Herói</p></div>}
            <button onClick={() => setCollapsed((v) => !v)} className={`rounded-lg border p-2 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`} title="Recolher menu">
              <Icon name="menu" className="h-5 w-5" />
            </button>
          </div>
          <nav className="mt-4 space-y-1">
            <button onClick={onBack} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-bold ${darkMode ? 'hover:bg-gray-950' : 'hover:bg-yellow-50'}`}>
              <Icon name="arrow" className="h-5 w-5" /> {!collapsed && <span>Voltar ao site</span>}
            </button>
            {nav.map((item) => (
              <button key={item.id} onClick={() => setTab(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-bold ${tab === item.id ? 'bg-yellow-600 text-gray-950' : darkMode ? 'hover:bg-gray-950' : 'hover:bg-yellow-50'}`}>
                <Icon name={item.icon} className="h-5 w-5" /> {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </aside>
        <main className="h-full min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
          <div className="mb-4 flex items-center gap-2 md:hidden">
            {nav.map((item) => (
              <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-lg border px-3 py-2 text-sm font-bold ${tab === item.id ? 'border-yellow-600 bg-yellow-600 text-gray-950' : darkMode ? 'border-gray-800' : 'border-gray-200'}`}>{item.label}</button>
            ))}
          </div>
          {tab === 'home' && renderHome()}
          {tab === 'library' && renderLibrary()}
          {tab === 'review' && renderReview()}
          {tab === 'schedule' && renderSchedule()}
        </main>
      </div>
    </div>
  );
}
