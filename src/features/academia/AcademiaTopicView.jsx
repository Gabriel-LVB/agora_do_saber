import React from 'react';
import { deferInteractionWork } from '../../lib/interaction.js';
import { QuestionCard } from '../questions/QuestionFeature.jsx';

const ic = (d) => ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} dangerouslySetInnerHTML={{__html:d}}/>;
const BookOpen = ic('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>');
const ArrowLeft = ic('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>');
const Trash2 = ic('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>');
const RotateCcw = ic('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>');
const Printer = ic('<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>');
const GraduationCap = ic('<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>');
const RepeatIcon = ic('<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>');
const Spinner = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{animation:'spin 1s linear infinite',transformOrigin:'center'}}><style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;

const FLASHCARD_CORRECT = 'CORRECT';
const EXPLANATION_LENGTHS = [
  { k:'essential', label:'Essencial', desc:'Revisão curta, em tópicos, apenas com o que mais importa' },
  { k:'balanced', label:'Equilibrada', desc:'Explica o raciocínio sem aprofundar além do necessário' },
  { k:'complete', label:'Aprofundada', desc:'Cobre contexto, mecanismos, exemplos e detalhes relevantes' },
];
const LESSON_FORMAT_OPTIONS = [
  { k:'outline', label:'Tópicos de revisão', desc:'Estrutura escaneável, semelhante a Pathoma e First Aid' },
  { k:'narrative', label:'Aula em parágrafos', desc:'Explicação contínua, conectando as ideias passo a passo' },
];
const LESSON_COVERAGE_OPTIONS = [
  { k:'high-yield', label:'Mais importante', desc:'Prioriza o que mais cai, muda conduta ou ajuda a entender o tema' },
  { k:'complete', label:'Cobertura ampla', desc:'Inclui também detalhes complementares relevantes' },
];
const LESSON_TONE_OPTIONS = [
  { k:'formal', label:'Formal', desc:'Texto objetivo, técnico e semelhante a uma apostila' },
  { k:'conversational', label:'Professor ao lado', desc:'Explicação direta e informal, mantendo os termos corretos' },
];

const getCorrectLetter = (question) => question?.options?.find(o => o.isCorrect)?.letter;
const isMemoryCard = (question) => !!(question?.isFlashcard || question?.isCloze);
const isAnswerCorrect = (question, answer) => {
  if (!question || !answer || answer === 'SKIPPED') return false;
  if (isMemoryCard(question)) return answer === FLASHCARD_CORRECT;
  if (question.isOpen) {
    try { return (JSON.parse(answer)?.score ?? 0) >= 70; } catch(e) { return false; }
  }
  return answer === getCorrectLetter(question);
};
const isFinalObjectiveAnswer = (question, answer) =>
  !!question && !question.isOpen && !isMemoryCard(question) && answer != null && answer !== '' && answer !== 'SKIPPED';
const sameId = (a, b) => String(a) === String(b);
const listHasId = (list = [], id) => Array.isArray(list) && list.some(x => sameId(x, id));
const toggleInList = (list = [], id) => {
  const safe = Array.isArray(list) ? list.filter(Boolean) : [];
  return listHasId(safe, id) ? safe.filter(x => !sameId(x, id)) : [...safe, id];
};
const addToList = (list = [], id) => {
  const safe = Array.isArray(list) ? list.filter(Boolean) : [];
  return listHasId(safe, id) ? safe : [...safe, id];
};

const ExplanationLengthSelector = ({ value='complete', onChange, darkMode }) => {
  const dm = darkMode;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {EXPLANATION_LENGTHS.map(opt => {
        const on = value === opt.k;
        return (
          <button key={opt.k} type="button" onClick={()=>onChange(opt.k)}
            className={`${on?(dm?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500':'border-gray-200 bg-white text-gray-700 hover:border-gray-300')} py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all text-center`}>
            {opt.label}
            <p className="font-normal opacity-60 mt-1 leading-snug">{opt.desc}</p>
          </button>
        );
      })}
    </div>
  );
};

const LessonPreferenceSelector = ({ value, onChange, options, darkMode }) => {
  const dm = darkMode;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map(opt => {
        const on = value === opt.k;
        return (
          <button key={opt.k} type="button" onClick={()=>onChange(opt.k)}
            className={`${on?(dm?'border-yellow-500 bg-yellow-900/30 text-yellow-300':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500':'border-gray-200 bg-white text-gray-700 hover:border-gray-300')} p-3 rounded-xl border-2 text-left transition-all`}>
            <span className="block text-sm font-bold">{opt.label}</span>
            <span className="block text-xs font-normal opacity-60 mt-1 leading-snug">{opt.desc}</span>
          </button>
        );
      })}
    </div>
  );
};

function AcademiaTopicView({
  topic, subject, library, darkMode, isAdmin, canCreateFlashcards=false, canUseAcademia,
  academiaGenerating, academiaGenProgress,
  academiaTopicAnswers, setAcademiaTopicAnswers,
  academiaExtraBusy, settings, updateSubject,
  setSettings, saveSettings,
  generateAcademiaLesson, setAcademiaExtraModal, setAcademiaRegenModal, setAcademiaExportModal, setDeleteId,
  setOpenAnswerModal, getKey, callWithRotation, parseHtmlText, onBack,
  reviewQueue, setSrModal, trackQuestionAnswered,
  onOpenAcademiaQuestions,
  findErrorNotebookReviewsForSource,
  openErrorNotebookReviewResult,
}) {
  const liveSubject = (library||[]).find(s => s.id === subject.id) || subject;
  const liveTopic = liveSubject?.topics?.find(t => t.id === topic.id) || topic;
  const subtopics = liveTopic.subtopics || [];
  const hasLesson = liveTopic.lessonGenerated;
  const hideSubtopicTitles = true;
  const isContinuousNarrative = liveTopic.lessonFormat === 'narrative'
    && Number(liveTopic.lessonPresentationVersion || 0) >= 2;
  const continuousNarrativeContent = isContinuousNarrative
    ? subtopics.map((_, index) => liveTopic.lessonSections?.[index]?.content || '').filter(Boolean).join('\n\n')
    : '';
  const setLessonLength = (length) => {
    const ns = { ...settings, explanationLength: length };
    setSettings(ns);
    saveSettings(ns);
  };
  const setLessonPreference = (field, value) => {
    const ns = { ...settings, [field]: value };
    setSettings(ns);
    saveSettings(ns);
  };
  const parseLessonText = (text) => parseHtmlText ? parseHtmlText(text) : text;

  // Renderiza markdown da aula com suporte a tabelas, listas e parágrafos
  const renderLesson = (md) => {
    if (!md) return null;
    const mdLines = md.split('\n');
    const elements = [];
    let i = 0;
    while (i < mdLines.length) {
      const line = mdLines[i];
      const blockTitleMatch = line.trim().match(/^\*\*([^*]+?)\*\*:?\s*$/);
      if (blockTitleMatch) {
        const blockTitle = blockTitleMatch[1].trim().replace(/:$/, '');
        elements.push(
          <h3 key={`h3-${i}`} className={`text-sm font-bold mt-2 mb-1 ${darkMode?'text-yellow-300':'text-yellow-700'}`}>
            {blockTitle}
          </h3>
        );
        i++;
        continue;
      }
      // Tabela markdown
      if (/^\s*\|.+\|\s*$/.test(line)) {
        const tableLines = [];
        while (i < mdLines.length && /^\s*\|.+\|\s*$/.test(mdLines[i])) {
          tableLines.push(mdLines[i]); i++;
        }
        const rows = tableLines.filter(l => !/^\s*\|[-:\s|]+\|\s*$/.test(l));
        const header = rows[0];
        const body = rows.slice(1);
        const parseCells = (row) => row.replace(/^\s*\|\s*/, '').replace(/\s*\|\s*$/, '').split(/\s*\|\s*/);
        elements.push(
          <div key={`tbl-${i}`} className="overflow-x-auto my-4">
            <table className={`w-full text-sm border-collapse ${darkMode?'text-gray-200':'text-gray-800'}`}>
              <thead>
                <tr className={`border-b-2 ${darkMode?'border-gray-600':'border-gray-300'}`}>
                  {header && parseCells(header).map((cell, ci) => (
                    <th key={ci} className={`px-3 py-2 text-left font-bold ${darkMode?'bg-gray-800/80':'bg-gray-100'}`}>{parseLessonText(cell)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} className={`border-b ${darkMode?'border-gray-700/50':'border-gray-200'}`}>
                    {parseCells(row).map((cell, ci) => (
                      <td key={ci} className="px-3 py-2">{parseLessonText(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
      // Lista
      if (/^\s*[-*•](?:\s+|$)/.test(line)) {
        const items = [];
        let activeParentLevel = null;
        const isListLine = (value = '') => /^\s*[-*•](?:\s+|$)/.test(value);
        const isBlockBoundary = (value = '') => {
          const trimmed = value.trim();
          return !trimmed ||
            /^\s*\|.+\|\s*$/.test(value) ||
            /^#{1,6}\s+/.test(trimmed) ||
            /^\*\*([^*]+?)\*\*:?\s*$/.test(trimmed);
        };
        while (i < mdLines.length && isListLine(mdLines[i])) {
          const match = mdLines[i].match(/^(\s*)[-*•](?:\s+(.*)|\s*)$/);
          const explicitLevel = Math.min(2, Math.floor((match?.[1] || '').replace(/\t/g, '  ').length / 2));
          let text = (match?.[2] || '').trim();
          const continuation = [];
          let j = i + 1;
          while (j < mdLines.length && !isListLine(mdLines[j]) && !isBlockBoundary(mdLines[j])) {
            continuation.push(mdLines[j].trim());
            j++;
          }
          if (continuation.length) text = [text, ...continuation].filter(Boolean).join(' ');
          const startsLabeledItem = /^\*\*[^*]+:\*\*/.test(text);
          if (startsLabeledItem) activeParentLevel = null;
          const inferredLevel = explicitLevel === 0 && !startsLabeledItem && activeParentLevel != null
            ? Math.min(2, activeParentLevel + 1)
            : explicitLevel;
          const opensChildren = startsLabeledItem && /:\*\*\s*$/.test(text);
          items.push({
            text,
            level: inferredLevel,
            opensChildren,
          });
          if (opensChildren) activeParentLevel = inferredLevel;
          i = j;
        }
        elements.push(
          <div key={`ul-${i}`} className={`space-y-1.5 my-2 text-base ${darkMode?'text-gray-200':'text-gray-800'}`}>
            {items.map((item, ii) => (
              <div key={ii} className="flex items-start gap-3" style={{marginLeft:`${item.level * 1.35}rem`}}>
                <span className="flex flex-shrink-0 items-center justify-center" style={{width:'0.875rem', height:'1.625rem'}}>
                  <span
                    className={`rounded-full ${item.level===0?'bg-current':'border border-current opacity-70'}`}
                    style={item.level===0 ? {width:'0.4375rem', height:'0.4375rem'} : {width:'0.3125rem', height:'0.3125rem'}}
                  />
                </span>
                <span className="min-w-0 leading-relaxed">{parseLessonText(item.text)}</span>
              </div>
            ))}
          </div>
        );
        continue;
      }
      if (!line.trim()) { elements.push(<div key={`sp-${i}`} className="h-2"/>); i++; continue; }
      elements.push(
        <p key={`p-${i}`} className={`text-base leading-relaxed ${darkMode?'text-gray-200':'text-gray-800'}`}>{parseLessonText(line)}</p>
      );
      i++;
    }
    return elements;
  };

  const handleAnswer = (q, letter) => {
    trackQuestionAnswered?.(`academia:${subject.id}:${topic.id}:${q.id}`);
    const freshSubj  = (library||[]).find(s => s.id === subject.id) || subject;
    const freshTopic = freshSubj.topics.find(t => t.id === topic.id) || liveTopic;
    const previousAnswer = (freshTopic.answers || {})[q.id] ?? academiaTopicAnswers[q.id];
    if (isFinalObjectiveAnswer(q, previousAnswer)) return;
    setAcademiaTopicAnswers(p => ({...p, [q.id]: letter}));
    const errorNotebook = canUseAcademia && !isAnswerCorrect(q, letter)
      ? addToList(freshTopic.errorNotebook || [], q.id)
      : (freshTopic.errorNotebook || []);
    const updTopic = {...freshTopic, answers: {...(freshTopic.answers||{}), [q.id]: letter}, errorNotebook};
    const updSubj  = {...freshSubj, topics: freshSubj.topics.map(t => t.id===topic.id ? updTopic : t)};
    return deferInteractionWork(() => updateSubject(updSubj));
  };

  const handleFavorite = (qId) => {
    // Read fresh topic from subject to avoid stale closure bug
    const freshSubj  = (library||[]).find(s => s.id === subject.id) || subject;
    const freshTopic = freshSubj.topics.find(t => t.id === topic.id) || liveTopic;
    const favs    = freshTopic.favorites || [];
    const newFavs = toggleInList(favs, qId);
    const updTopic = {...freshTopic, favorites: newFavs.filter(Boolean)};
    const updSubj  = {...freshSubj, topics: freshSubj.topics.map(t => t.id===topic.id ? updTopic : t)};
    updateSubject(updSubj);
  };

  const handleNotebook = (qId) => {
    if (!canUseAcademia) return;
    const freshSubj  = (library||[]).find(s => s.id === subject.id) || subject;
    const freshTopic = freshSubj.topics.find(t => t.id === topic.id) || liveTopic;
    const updTopic = {...freshTopic, errorNotebook:toggleInList(freshTopic.errorNotebook||[], qId)};
    const updSubj  = {...freshSubj, topics: freshSubj.topics.map(t => t.id===topic.id ? updTopic : t)};
    updateSubject(updSubj);
  };

  const openAcademiaReview = (questions, blockId, blockTitle) => setSrModal({
    aulaId:`lib_${liveSubject.id}`,
    blockId,
    blockTitle,
    questions,
    answers:savedAnswers,
    notebookIds:liveTopic.errorNotebook||[],
    meta:{source:'academia',subjectId:liveSubject.id,topicId:liveTopic.id,subjectTitle:liveSubject.title,blockTitle},
  });

  const reviewCount = (blockId) => Object.keys(reviewQueue?.[`lib_${liveSubject.id}`]?.[blockId] || {}).length;

  const savedAnswers = {...academiaTopicAnswers, ...(liveTopic.answers||{})};
  const hasSavedAnswer = (qId) => savedAnswers[qId] != null && savedAnswers[qId] !== '';
  const fixReviewBlockId = `academia_fix_${liveTopic.id}`;
  const fixReviewCount = reviewCount(fixReviewBlockId);

  const renderFixQ = (q, idx) => (
    <div key={q.id} data-question-id={q.id} className="mb-6">
      <QuestionCard
        question={q}
        index={idx}
        selectedLetter={savedAnswers[q.id]}
        onAnswer={(letter) => handleAnswer(q, letter)}
        darkMode={darkMode}
        isFavorite={(liveTopic.favorites||[]).includes(q.id)}
        onToggleFavorite={() => handleFavorite(q.id)}
        showErrorNotebook={canUseAcademia}
        isInErrorNotebook={listHasId(liveTopic.errorNotebook || [], q.id)}
        onToggleErrorNotebook={() => handleNotebook(q.id)}
        apiKey={getKey()}
        oracleLength={settings.oracleLength||'medium'}
        onCall={callWithRotation}
        onOpenAnswer={q=>setOpenAnswerModal({question:q, isEssay:q.isEssay})}
        adminQuestionExplanations={isAdmin}
      />
    </div>
  );

  const allFixqs = subtopics.flatMap((_, idx) => liveTopic.fixationQuestions?.[idx] || []);
  const allFixAnswered = allFixqs.length > 0 && allFixqs.every(q => hasSavedAnswer(q.id));
  const fixationErrorReviews = findErrorNotebookReviewsForSource ? findErrorNotebookReviewsForSource({
    subjectTitle:[liveSubject.title, 'Fixação'],
    topicTitle:[liveTopic.title, 'Questões de fixação'],
    questionIds:allFixqs.map(q => q.id),
  }) : [];
  return (
    <div className="w-full">
      {/* Header */}
      <button onClick={onBack} className={`flex items-center gap-2 mb-8 font-bold ${darkMode?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}>
        <ArrowLeft className="w-4 h-4"/>Voltar
      </button>
      <div className="mb-10">
        <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${darkMode?'text-yellow-600/70':'text-yellow-600/80'}`}>{liveSubject.title}</div>
        <h1 className={`text-3xl mobile-title-lg mobile-wrap font-serif font-bold leading-tight mb-1 ${darkMode?'text-white':'text-gray-900'}`}>{liveTopic.title}</h1>
        {hasLesson && (
          <div className="flex items-center gap-3 mt-4 flex-wrap">
	            <button onClick={()=>setAcademiaExportModal({topic:liveTopic, subject:liveSubject})}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${darkMode?'border-gray-700 text-gray-400 hover:border-yellow-600 hover:text-yellow-400':'border-gray-200 text-gray-500 hover:border-yellow-500 hover:text-yellow-600'}`}>
              <Printer className="w-3.5 h-3.5"/>Exportar
            </button>
            {canUseAcademia && fixReviewCount > 0 && (
              <button onClick={()=>openAcademiaReview(allFixqs, fixReviewBlockId, 'Questões de fixação')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${darkMode?'border-gray-700 text-gray-400 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <RepeatIcon className="w-3.5 h-3.5"/>Gerenciar ({fixReviewCount})
              </button>
            )}
            {allFixqs.length > 0 && (
              <button onClick={()=>onOpenAcademiaQuestions?.(liveSubject, liveTopic, 'fixation')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${darkMode?'border-gray-700 text-gray-400 hover:border-yellow-600 hover:text-yellow-400':'border-gray-200 text-gray-500 hover:border-yellow-500 hover:text-yellow-600'}`}>
                <GraduationCap className="w-3.5 h-3.5"/>Questões de fixação
              </button>
            )}
            {canUseAcademia && allFixqs.length === 0 && (
              <button onClick={()=>setAcademiaRegenModal({topic:liveTopic, subject:liveSubject, generationMode:'questions'})}
                disabled={academiaGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-yellow-500 bg-yellow-600 text-white transition-all hover:bg-yellow-700 disabled:opacity-40">
                <GraduationCap className="w-3.5 h-3.5"/>Criar questões de fixação
              </button>
            )}
            {fixationErrorReviews.length > 0 && (
              <button onClick={()=>openErrorNotebookReviewResult?.(fixationErrorReviews[0])}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${darkMode?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50'}`}>
                <BookOpen className="w-3.5 h-3.5"/>{fixationErrorReviews.length>1?`Revisões geradas (${fixationErrorReviews.length})`:'Revisão gerada'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Aula não gerada */}
      {!hasLesson && !academiaGenerating && (
        <div className={`py-16 ${darkMode?'text-gray-500':'text-gray-400'}`}>
          <div className="text-center">
          <p className="font-bold text-lg mb-1">Aula não gerada</p>
          <p className="text-sm opacity-70 mb-6 max-w-xs mx-auto">Clique abaixo para gerar a explicação e as questões de fixação.</p>
          </div>
          {canUseAcademia && (
            <div className="max-w-xl mx-auto mb-6">
              <div className="text-xs font-bold uppercase mb-2 opacity-50 text-left">Profundidade da explicação</div>
              <ExplanationLengthSelector
                value={settings.explanationLength || 'complete'}
                onChange={setLessonLength}
                darkMode={darkMode}
              />
              <details className={`mt-4 rounded-xl border p-4 text-left ${darkMode?'border-gray-700 bg-gray-800/40':'border-gray-200 bg-gray-50'}`}>
                <summary className="cursor-pointer text-sm font-bold text-yellow-600">Personalizar estilo da aula</summary>
                <div className="space-y-5 mt-4">
                  <div>
                    <div className="text-xs font-bold uppercase mb-2 opacity-50">Formato</div>
                    <LessonPreferenceSelector value={settings.lessonFormat || 'outline'} onChange={value=>setLessonPreference('lessonFormat', value)} options={LESSON_FORMAT_OPTIONS} darkMode={darkMode}/>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase mb-2 opacity-50">Cobertura</div>
                    <LessonPreferenceSelector value={settings.lessonCoverage || 'high-yield'} onChange={value=>setLessonPreference('lessonCoverage', value)} options={LESSON_COVERAGE_OPTIONS} darkMode={darkMode}/>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase mb-2 opacity-50">Tom</div>
                    <LessonPreferenceSelector value={settings.lessonTone || 'formal'} onChange={value=>setLessonPreference('lessonTone', value)} options={LESSON_TONE_OPTIONS} darkMode={darkMode}/>
                  </div>
                </div>
              </details>
            </div>
          )}
          {canUseAcademia && (
            <div className="text-center">
            <button onClick={()=>generateAcademiaLesson(liveTopic, liveSubject)} className="bg-yellow-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-yellow-700">
              Gerar Aula
            </button>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {academiaGenerating && (
        <div className="py-20 text-center">
          <p className={`font-bold ${darkMode?'text-yellow-400':'text-yellow-600'}`}>{academiaGenProgress||'Gerando...'}</p>
          <p className={`text-xs mt-2 ${darkMode?'text-gray-500':'text-gray-400'}`}>Pode levar até 60 segundos</p>
        </div>
      )}

      {/* Conteúdo */}
      {hasLesson && !academiaGenerating && (
        <div>
          {/* Explicações */}

          {isContinuousNarrative ? (
            continuousNarrativeContent
              ? <div className="reading-content mb-8">{renderLesson(continuousNarrativeContent)}</div>
              : <p className={`italic text-sm mb-8 ${darkMode?'text-gray-600':'text-gray-400'}`}>Explicação não disponível.</p>
          ) : subtopics.map((subtopic, idx) => {
	            const section = liveTopic.lessonSections?.[idx];
            return (
              <div key={idx} className={hideSubtopicTitles ? 'mb-5' : 'mb-8'}>
                {!hideSubtopicTitles && (
                  <h2 className={`text-base font-semibold leading-snug mb-5 ${darkMode?'text-gray-100':'text-gray-900'}`}><span className={`text-sm font-bold tabular-nums mr-2 ${darkMode?'text-yellow-500':'text-yellow-600'}`}>{String(idx+1).padStart(2,'0')}.</span>{section?.title || subtopic}</h2>
                )}
                {section?.content ? (
                  <div className={`reading-content space-y-3 ${hideSubtopicTitles?'mb-5':'mb-8'}`}>{renderLesson(section.content)}</div>
                ) : (
                  <p className={`italic text-sm mb-8 ${darkMode?'text-gray-600':'text-gray-400'}`}>Explicação não disponível para este subtópico.</p>
                )}
              </div>
            );
          })}

          {/* Fixação no final */}
          {allFixqs.length > 0 && (
            <div className={`mt-4 pt-12 border-t ${darkMode?'border-gray-800':'border-gray-100'}`}>
              <div className="flex items-center justify-between mb-8 gap-3">
                <p className={`text-xs font-bold uppercase tracking-widest ${darkMode?'text-gray-500':'text-gray-400'}`}>Questões de fixação</p>
                {canUseAcademia && (allFixAnswered || fixReviewCount>0) && (
                  <button onClick={()=>openAcademiaReview(allFixqs, fixReviewBlockId, 'Questões de fixação')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${darkMode?'border-gray-700 text-gray-400 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <RepeatIcon className="w-3.5 h-3.5"/>{fixReviewCount>0?`Gerenciar (${fixReviewCount})`:'Revisão Espaçada'}
                  </button>
                )}
              </div>
              <div className={`rounded-2xl border p-5 text-center ${darkMode?'bg-gray-900 border-gray-800':'bg-gray-50 border-gray-100'}`}>
                <p className={`text-sm mb-4 ${darkMode?'text-gray-400':'text-gray-500'}`}>{allFixqs.length} questão{allFixqs.length!==1?'s':''} de fixação disponível{allFixqs.length!==1?'is':''} no banco de questões.</p>
                <button onClick={()=>onOpenAcademiaQuestions?.(liveSubject, liveTopic, 'fixation')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-yellow-600 text-white hover:bg-yellow-700">
                  <GraduationCap className="w-4 h-4"/>Questões de fixação
                </button>
                {fixationErrorReviews.length > 0 && (
                  <button onClick={()=>openErrorNotebookReviewResult?.(fixationErrorReviews[0])}
                    className={`ml-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${darkMode?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50'}`}>
                    <BookOpen className="w-4 h-4"/>{fixationErrorReviews.length>1?`Revisões geradas (${fixationErrorReviews.length})`:'Revisão gerada'}
                  </button>
                )}
              </div>
              {canUseAcademia && (allFixAnswered || fixReviewCount>0) && (
                <div className="text-center mt-4">
                  <button onClick={()=>openAcademiaReview(allFixqs, fixReviewBlockId, 'Questões de fixação')}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${darkMode?'border-gray-700 text-gray-400 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <RepeatIcon className="w-4 h-4"/>{fixReviewCount>0?`Gerenciar revisão (${fixReviewCount})`:'Adicionar à revisão espaçada'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Baterias extras */}
	          {(liveTopic.extraBattery||[]).map((bloco, blocoIdx) => {
	            const blocoQs = bloco.questions || bloco;
	            const blocoId = bloco.id || `legacy_${blocoIdx}`;
	            const blocoTitle = bloco.title || `Bateria ${blocoIdx+1}`;
            const reviewBlockId = `academia_extra_${liveTopic.id}_${blocoId}`;
            const blocoDone = blocoQs.length > 0 && blocoQs.every(q => hasSavedAnswer(q.id));
	            return (
	              <div key={blocoId} className={`mt-12 pt-12 border-t ${darkMode?'border-gray-800':'border-gray-100'}`}>
	                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-widest ${darkMode?'text-gray-500':'text-gray-400'}`}>{blocoTitle}</span>
                    <p className={`text-xs mt-0.5 ${darkMode?'text-gray-600':'text-gray-400'}`}>{blocoQs.length} questão{blocoQs.length!==1?'s':''}</p>
                  </div>
                  {canUseAcademia && (
                    <button title="Excluir bloco" onClick={()=>setDeleteId({type:'academia-extra-bloco', blocoId, topicId:liveTopic.id, subjectId:liveSubject.id, oracleTopicId:bloco.oracleTopicId})}
                      className={`p-2 rounded-lg transition-colors ${darkMode?'text-gray-600 hover:text-red-400':'text-gray-300 hover:text-red-500'}`}>
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  )}
	                </div>
                <div className={`rounded-2xl border p-5 text-center ${darkMode?'bg-gray-900 border-gray-800':'bg-gray-50 border-gray-100'}`}>
                  <p className={`text-sm mb-4 ${darkMode?'text-gray-400':'text-gray-500'}`}>{blocoQs.length} questão{blocoQs.length!==1?'s':''} disponível{blocoQs.length!==1?'is':''} no banco de questões.</p>
                  <button onClick={()=>onOpenAcademiaQuestions?.(liveSubject, liveTopic, 'extra', bloco)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-yellow-600 text-white hover:bg-yellow-700">
                    <GraduationCap className="w-4 h-4"/>Abrir bloco
                  </button>
                </div>
	                {canUseAcademia && (blocoDone || reviewCount(reviewBlockId)>0) && (
	                  <div className="text-center mt-8">
	                    <button onClick={()=>openAcademiaReview(blocoQs, reviewBlockId, blocoTitle)}
	                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${darkMode?'border-gray-700 text-gray-400 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
	                      <RepeatIcon className="w-4 h-4"/>{reviewCount(reviewBlockId)>0?`Gerenciar revisão (${reviewCount(reviewBlockId)})`:'Revisão Espaçada'}
	                    </button>
	                  </div>
	                )}
	              </div>
	            );
	          })}

          {/* Gerar bateria extra */}
          <div className={`mt-16 pt-10 border-t text-center ${darkMode?'border-gray-800':'border-gray-100'}`}>
            {canUseAcademia && (
              <button onClick={()=>setAcademiaExtraModal({topic:liveTopic, subject:liveSubject})} disabled={academiaExtraBusy}
                className={`text-sm font-bold px-6 py-3 rounded-xl border-2 transition-all disabled:opacity-40 ${darkMode?'border-gray-700 text-gray-400 hover:border-yellow-600 hover:text-yellow-400':'border-gray-200 text-gray-500 hover:border-yellow-500 hover:text-yellow-600'}`}>
                {academiaExtraBusy?'Gerando...':'+ Gerar bateria extra'}
              </button>
            )}
          </div>

          {/* Regenerar */}
          {canUseAcademia && (
            <div className="mt-6 text-center">
              <button onClick={()=>setAcademiaRegenModal({topic:liveTopic, subject:liveSubject})} disabled={academiaGenerating}
                className={`text-xs opacity-30 hover:opacity-60 transition-opacity flex items-center gap-1.5 mx-auto ${darkMode?'text-gray-400':'text-gray-500'}`}>
                <RotateCcw className="w-3 h-3"/>Regenerar aula
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


export default AcademiaTopicView;
