import React from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';

export default function FavoritesView() {
  const {
    addToList,
    ArrowLeft,
    callWithRotation,
    canUseAdvancedFeatures,
    darkMode,
    deferInteractionWork,
    EmptyState,
    Eraser,
    FolderIcon,
    getKey,
    Heart,
    inactivateCourseQuestion,
    isAdmin,
    isAnswerCorrect,
    isFinalObjectiveAnswer,
    library,
    libraryRef,
    listHasId,
    Printer,
    QuestionCard,
    QUICK_SOURCE,
    sameId,
    saveVqBlockPatch,
    setActiveSubjectId,
    setActiveTopicId,
    setExportModal,
    setQuickStudyTab,
    settings,
    setView,
    Spinner,
    toggleInList,
    trackQuestionAnswered,
    updateSubject,
    vqBlocks,
    vqBlocksLoaded,
    vqBlocksRef,
    vqLoading,
  } = useFeatureContext();

  const personalFavItems = [];
  library.forEach(subject => subject.topics.forEach(topic => (topic.favorites || []).forEach(favoriteId => {
    const question = (topic.questions || []).find(candidate => sameId(candidate.id, favoriteId));
    if (question) personalFavItems.push({ subject, topic, question });
  })));

  const courseFavItems = [];
  Object.entries(vqBlocks || {}).forEach(([aulaId, aulaData]) => {
    const blockEntries = Array.isArray(aulaData?.blocks)
      ? aulaData.blocks.map((block, index) => [String(block?.id || `block_${index}`), block])
      : Object.entries(aulaData?.blocks || {});
    blockEntries.forEach(([blockId, block]) => {
      (block?.favorites || []).forEach(favoriteId => {
        const question = (block?.questions || []).find(candidate => sameId(candidate.id, favoriteId));
        if (question) courseFavItems.push({ aulaId, aulaData, blockId, block, question });
      });
    });
  });

  const answerIsCorrect = (question, answer) => {
    if (!answer) return false;
    if (question.isOpen) {
      try { return (JSON.parse(answer)?.score ?? 0) >= 70; } catch(error) { return false; }
    }
    return answer === (question.options || []).find(option => option.isCorrect)?.letter;
  };
  const answerRows = [
    ...personalFavItems.map(item => ({ question:item.question, answer:item.topic.answers?.[item.question.id] })),
    ...courseFavItems.map(item => ({ question:item.question, answer:item.block.answers?.[item.question.id] })),
  ];
  const totalAnswered = answerRows.filter(row => row.answer).length;
  const totalCorrect = answerRows.filter(row => row.answer && answerIsCorrect(row.question, row.answer)).length;
  const pct = totalAnswered > 0 ? Math.round(totalCorrect / totalAnswered * 100) : 0;
  const totalFavorites = personalFavItems.length + courseFavItems.length;

  const handleFavAnswer = async (subject, topic, qId, letter) => {
    trackQuestionAnswered(`${subject?.source || 'oraculo'}:${subject.id}:${topic.id}:${qId}`);
    const freshSubject = (libraryRef.current || library).find(item => item.id === subject.id) || subject;
    const freshTopic = freshSubject?.topics?.find(item => item.id === topic.id) || topic;
    const question = (freshTopic.questions || []).find(item => sameId(item.id, qId));
    if (isFinalObjectiveAnswer(question, freshTopic.answers?.[qId])) return;
    const errorNotebook = canUseAdvancedFeatures && !isAnswerCorrect(question, letter)
      ? addToList(freshTopic.errorNotebook || [], qId)
      : (freshTopic.errorNotebook || []);
    await deferInteractionWork(() => updateSubject({
      ...freshSubject,
      topics:freshSubject.topics.map(item => item.id === freshTopic.id
        ? { ...item, answers:{ ...item.answers, [qId]:letter }, errorNotebook }
        : item),
    }));
  };

  const handleFavUnfavorite = async (subject, topic, qId) => {
    const freshSubject = (libraryRef.current || library).find(item => item.id === subject.id) || subject;
    const freshTopic = freshSubject?.topics?.find(item => item.id === topic.id) || topic;
    const favorites = (freshTopic.favorites || []).filter(id => !sameId(id, qId));
    await updateSubject({
      ...freshSubject,
      topics:freshSubject.topics.map(item => item.id === freshTopic.id ? { ...item, favorites } : item),
    });
  };

  const handleFavNotebook = async (subject, topic, qId) => {
    if (!canUseAdvancedFeatures) return;
    const freshSubject = (libraryRef.current || library).find(item => item.id === subject.id) || subject;
    const freshTopic = freshSubject?.topics?.find(item => item.id === topic.id) || topic;
    await updateSubject({
      ...freshSubject,
      topics:freshSubject.topics.map(item => item.id === freshTopic.id
        ? { ...item, errorNotebook:toggleInList(freshTopic.errorNotebook || [], qId) }
        : item),
    });
  };

  const handleCourseAnswer = async ({ aulaId, blockId, question }, letter) => {
    const freshBlock = vqBlocksRef.current?.[aulaId]?.blocks?.[blockId];
    const freshQuestion = (freshBlock?.questions || []).find(item => sameId(item.id, question.id)) || question;
    if (isFinalObjectiveAnswer(freshQuestion, freshBlock?.answers?.[question.id])) return;
    trackQuestionAnswered(`curso:${aulaId}:${blockId}:${question.id}`);
    await saveVqBlockPatch(
      aulaId,
      blockId,
      block => {
        const errorNotebook = canUseAdvancedFeatures && !isAnswerCorrect(freshQuestion, letter)
          ? addToList(block.errorNotebook || [], question.id)
          : (block.errorNotebook || []);
        return { ...block, answers:{ ...(block.answers || {}), [question.id]:letter }, errorNotebook };
      },
      block => ({ answers:{ [question.id]:letter }, errorNotebook:block.errorNotebook || [] }),
    );
  };

  const handleCourseFavorite = async ({ aulaId, blockId, question }) => {
    await saveVqBlockPatch(
      aulaId,
      blockId,
      block => ({
        ...block,
        favorites:(block.favorites || []).filter(id => !sameId(id, question.id)),
      }),
      block => ({ favorites:block.favorites || [] }),
    );
  };

  const handleCourseNotebook = async ({ aulaId, blockId, question }) => {
    if (!canUseAdvancedFeatures) return;
    await saveVqBlockPatch(
      aulaId,
      blockId,
      block => ({ ...block, errorNotebook:toggleInList(block.errorNotebook || [], question.id) }),
      block => ({ errorNotebook:block.errorNotebook || [] }),
    );
  };

  const handleFavResetAll = async () => {
    const personalUpdates = {};
    personalFavItems.forEach(({ subject, topic, question }) => {
      const key = `${subject.id}__${topic.id}`;
      if (!personalUpdates[key]) personalUpdates[key] = { subject, topic, ids:[] };
      personalUpdates[key].ids.push(String(question.id));
    });
    for (const { subject, topic, ids } of Object.values(personalUpdates)) {
      const answers = Object.fromEntries(Object.entries(topic.answers || {}).filter(([id]) => !ids.includes(String(id))));
      await updateSubject({
        ...subject,
        topics:subject.topics.map(item => item.id === topic.id ? { ...item, answers } : item),
      });
    }
    const courseGroups = new Map();
    courseFavItems.forEach(item => {
      const key = `${item.aulaId}::${item.blockId}`;
      courseGroups.set(key, {
        ...item,
        ids:[...(courseGroups.get(key)?.ids || []), String(item.question.id)],
      });
    });
    for (const { aulaId, blockId, ids } of courseGroups.values()) {
      await saveVqBlockPatch(
        aulaId,
        blockId,
        block => ({
          ...block,
          answers:Object.fromEntries(Object.entries(block.answers || {}).filter(([id]) => !ids.includes(String(id)))),
        }),
        block => ({ answers:block.answers || {} }),
      );
    }
  };

  const favoriteQuestions = [...personalFavItems, ...courseFavItems].map(item => item.question);
  const favTopic = { title:'Questões Favoritas', questions:favoriteQuestions };
  const courseGroups = Object.values(courseFavItems.reduce((groups, item) => {
    const key = `${item.aulaId}::${item.blockId}`;
    if (!groups[key]) groups[key] = { ...item, items:[] };
    groups[key].items.push(item);
    return groups;
  }, {}));

  return (
    <div>
      <div className={`mb-6 flex flex-col items-start justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center ${darkMode?'border-gray-700':'border-gray-200'}`}>
        <div>
          <button onClick={()=>setView('library')} className={`mb-2 flex items-center gap-2 font-bold ${darkMode?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="h-4 w-4"/>Voltar</button>
          <h2 className="mobile-wrap flex items-center gap-3 font-serif text-2xl font-bold leading-tight text-yellow-600"><Heart className="h-7 w-7 flex-shrink-0 text-red-500" filled/>Questões Favoritas</h2>
          {totalAnswered > 0 && <p className="mt-1 text-sm opacity-60">{totalCorrect}/{totalAnswered} corretas ({pct}%)</p>}
        </div>
        {totalFavorites > 0 && (
          <div className="flex flex-wrap gap-2">
            <button onClick={()=>setExportModal({topic:favTopic,subject:null})} className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-bold ${darkMode?'border-gray-600 text-gray-300 hover:bg-gray-700':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}><Printer className="h-4 w-4"/>Exportar</button>
            <button onClick={handleFavResetAll} className="flex items-center gap-1.5 rounded-lg border border-red-500 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Eraser className="h-4 w-4"/>Limpar respostas</button>
          </div>
        )}
      </div>

      {!vqBlocksLoaded && vqLoading && !totalFavorites ? (
        <div className="flex min-h-[180px] items-center justify-center"><Spinner className="h-7 w-7 text-yellow-600"/></div>
      ) : totalFavorites === 0 ? (
        <EmptyState
          darkMode={darkMode}
          icon={<Heart className="h-7 w-7"/>}
          title="Nenhuma questão favoritada ainda"
          message="Use o coração em qualquer questão para montar uma lista rápida do que merece voltar depois."
        />
      ) : null}

      {courseGroups.map(({ aulaId, aulaData, blockId, block, items }) => (
        <div key={`${aulaId}-${blockId}`} className="mb-8">
          <div className={`mb-4 flex items-center gap-2 border-b py-2 ${darkMode?'border-gray-700':'border-gray-200'}`}>
            <FolderIcon className="h-4 w-4 text-yellow-600"/>
            <span className="text-xs font-bold uppercase tracking-wide text-blue-500">Curso</span>
            <span className="text-xs opacity-20">›</span>
            <span className="min-w-0 truncate text-sm font-bold">{aulaData?.meta?.aulaTitle || 'Aula do curso'}</span>
            <span className="hidden text-xs opacity-40 sm:inline">· {block?.title || 'Questões'}</span>
          </div>
          {items.map((item, index) => (
            <QuestionCard
              key={item.question.id}
              question={item.question}
              index={index}
              selectedLetter={item.block.answers?.[item.question.id]}
              onAnswer={letter=>handleCourseAnswer(item, letter)}
              darkMode={darkMode}
              isFavorite
              onToggleFavorite={()=>handleCourseFavorite(item)}
              showErrorNotebook={canUseAdvancedFeatures}
              isInErrorNotebook={listHasId(item.block.errorNotebook || [], item.question.id)}
              onToggleErrorNotebook={()=>handleCourseNotebook(item)}
              apiKey={getKey()}
              oracleLength={settings.oracleLength}
              onCall={callWithRotation}
              adminQuestionExplanations={isAdmin}
              onAdminDisableQuestion={isAdmin ? (()=>inactivateCourseQuestion({
                aulaId:item.aulaId,
                blockId:item.blockId,
                question:item.question,
              })) : null}
            />
          ))}
        </div>
      ))}

      {Object.entries(personalFavItems.reduce((groups, item) => {
        const key = `${item.subject.id}__${item.topic.id}`;
        if (!groups[key]) groups[key] = { subject:item.subject, topic:item.topic, items:[] };
        groups[key].items.push(item);
        return groups;
      }, {})).map(([key, { subject, topic, items }]) => (
        <div key={key} className="mb-8">
          <div className={`mb-4 flex items-center gap-2 border-b py-2 ${darkMode?'border-gray-700':'border-gray-200'}`}>
            <FolderIcon className="h-4 w-4 text-yellow-600"/>
            <span className="text-xs opacity-40">{subject.title}</span>
            <span className="text-xs opacity-20">›</span>
            <span className="text-sm font-bold">{topic.title}</span>
            <button onClick={()=>{setActiveSubjectId(subject.id);setActiveTopicId(topic.id);setQuickStudyTab('lesson');setView(subject.source===QUICK_SOURCE?'quick-topic':'topic');}} className="ml-auto text-xs font-bold text-yellow-600 hover:underline">Ver tópico →</button>
          </div>
          {items.map(({ question }, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              selectedLetter={topic.answers?.[question.id]}
              onAnswer={letter=>handleFavAnswer(subject, topic, question.id, letter)}
              darkMode={darkMode}
              isFavorite
              onToggleFavorite={()=>handleFavUnfavorite(subject, topic, question.id)}
              showErrorNotebook={canUseAdvancedFeatures}
              isInErrorNotebook={listHasId(topic.errorNotebook || [], question.id)}
              onToggleErrorNotebook={()=>handleFavNotebook(subject, topic, question.id)}
              apiKey={getKey()}
              oracleLength={settings.oracleLength}
              onCall={callWithRotation}
              adminQuestionExplanations={isAdmin}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
