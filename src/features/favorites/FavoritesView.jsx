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
    isAdmin,
    isAnswerCorrect,
    isFinalObjectiveAnswer,
    library,
    libraryRef,
    listHasId,
    Printer,
    QuestionCard,
    QUICK_SOURCE,
    setActiveSubjectId,
    setActiveTopicId,
    setExportModal,
    setQuickStudyTab,
    settings,
    setView,
    toggleInList,
    trackQuestionAnswered,
    updateSubject,
  } = useFeatureContext();

          // Build flat list of all favorited questions with context
          const favItems=[];
          library.forEach(s=>s.topics.forEach(t=>(t.favorites||[]).forEach(fId=>{
            const q=(t.questions||[]).find(x=>x.id===fId);
            if(q) favItems.push({subject:s,topic:t,question:q});
          })));

          const totalAnswered = favItems.filter(({topic,question})=>topic.answers?.[question.id]).length;
          const totalCorrect  = favItems.filter(({topic,question})=>{
            const answer = topic.answers?.[question.id];
            if (question.isOpen) { try { return (JSON.parse(answer)?.score ?? 0) >= 70; } catch(e) { return false; } }
            return answer===(question.options||[]).find(o=>o.isCorrect)?.letter;
          }).length;
          const pct = totalAnswered>0 ? Math.round(totalCorrect/totalAnswered*100) : 0;

  const handleFavAnswer = async (subject, topic, qId, letter) => {
    trackQuestionAnswered(`${subject?.source||'oraculo'}:${subject.id}:${topic.id}:${qId}`);
    const freshSubject = (libraryRef.current || library).find(s => s.id === subject.id) || subject;
    const freshTopic = freshSubject?.topics?.find(t => t.id === topic.id) || topic;
    const q = (freshTopic.questions||[]).find(x=>x.id===qId);
    if (isFinalObjectiveAnswer(q, freshTopic.answers?.[qId])) return;
	            const errorNotebook = canUseAdvancedFeatures && !isAnswerCorrect(q, letter) ? addToList(freshTopic.errorNotebook||[], qId) : (freshTopic.errorNotebook||[]);
	            await deferInteractionWork(() => updateSubject({...freshSubject, topics:freshSubject.topics.map(t2=>t2.id===freshTopic.id?{...t2,answers:{...t2.answers,[qId]:letter},errorNotebook}:t2)}));
	          };
	          const handleFavUnfavorite = async (subject, topic, qId) => {
    const freshSubject = (libraryRef.current || library).find(s => s.id === subject.id) || subject;
    const freshTopic = freshSubject?.topics?.find(t => t.id === topic.id) || topic;
	            const nf=(freshTopic.favorites||[]).filter(f=>f!==qId);
	            await updateSubject({...freshSubject,topics:freshSubject.topics.map(t2=>t2.id===freshTopic.id?{...t2,favorites:nf}:t2)});
	          };
	          const handleFavNotebook = async (subject, topic, qId) => {
	            if (!canUseAdvancedFeatures) return;
    const freshSubject = (libraryRef.current || library).find(s => s.id === subject.id) || subject;
    const freshTopic = freshSubject?.topics?.find(t => t.id === topic.id) || topic;
	            await updateSubject({...freshSubject,topics:freshSubject.topics.map(t2=>t2.id===freshTopic.id?{...t2,errorNotebook:toggleInList(freshTopic.errorNotebook||[],qId)}:t2)});
	          };
          const handleFavResetAll = async () => {
            // Reset only answers for favorited questions
            const updates = {};
            favItems.forEach(({subject,topic,question})=>{
              const key=`${subject.id}__${topic.id}`;
              if(!updates[key]) updates[key]={subject,topic,idsToReset:[]};
              updates[key].idsToReset.push(question.id);
            });
            for(const {subject,topic,idsToReset} of Object.values(updates)){
              const newAns=Object.fromEntries(Object.entries(topic.answers||{}).filter(([k])=>!idsToReset.includes(k)));
              await updateSubject({...subject,topics:subject.topics.map(t2=>t2.id===topic.id?{...t2,answers:newAns}:t2)});
            }
          };

          // Build a synthetic "topic" for export
          const favTopic = {
            title:'Questões Favoritas',
            questions: favItems.map(({question})=>question),
          };

          return (
            <div>
              {/* Header */}
              <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 pb-6 border-b ${darkMode?'border-gray-700':'border-gray-200'}`}>
                <div>
                  <button onClick={()=>setView('library')} className={`flex items-center gap-2 mb-2 font-bold ${darkMode?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/>Voltar</button>
                  <h2 className="text-2xl mobile-wrap font-serif font-bold text-yellow-600 flex items-center gap-3 leading-tight"><Heart className="w-7 h-7 text-red-500 flex-shrink-0" filled/>Questões Favoritas</h2>
                  {totalAnswered>0&&<p className="text-sm opacity-60 mt-1">{totalCorrect}/{totalAnswered} corretas ({pct}%)</p>}
                </div>
                {favItems.length>0&&(
                  <div className="flex flex-wrap gap-2">
                    <button onClick={()=>setExportModal({topic:favTopic,subject:null})} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold border ${darkMode?'border-gray-600 text-gray-300 hover:bg-gray-700':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}><Printer className="w-4 h-4"/>Exportar</button>
                    <button onClick={handleFavResetAll} className="flex items-center gap-1.5 px-3 py-2 border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-bold"><Eraser className="w-4 h-4"/>Limpar</button>
                  </div>
                )}
              </div>

              {favItems.length===0&&(
                <EmptyState
                  darkMode={darkMode}
                  icon={<Heart className="w-7 h-7"/>}
                  title="Nenhuma questão favoritada ainda"
                  message="Use o coração em qualquer questão para montar uma lista rápida do que merece voltar depois."
                />
              )}

              {/* Group by subject › topic */}
              {Object.entries(
                favItems.reduce((acc,item)=>{
                  const key=`${item.subject.id}__${item.topic.id}`;
                  if(!acc[key]) acc[key]={subject:item.subject,topic:item.topic,items:[]};
                  acc[key].items.push(item);
                  return acc;
                },{})
              ).map(([key,{subject,topic,items}])=>(
                <div key={key} className="mb-8">
                  <div className={`flex items-center gap-2 mb-4 py-2 border-b ${darkMode?'border-gray-700':'border-gray-200'}`}>
                    <FolderIcon className="w-4 h-4 text-yellow-600"/>
                    <span className="text-xs opacity-40">{subject.title}</span>
                    <span className="text-xs opacity-20">›</span>
                    <span className="text-sm font-bold">{topic.title}</span>
                    <button onClick={()=>{setActiveSubjectId(subject.id);setActiveTopicId(topic.id);setQuickStudyTab('lesson');setView(subject.source===QUICK_SOURCE?'quick-topic':'topic');}} className="ml-auto text-xs text-yellow-600 font-bold hover:underline">Ver tópico →</button>
                  </div>
                  {items.map(({question},i)=>(
                    <QuestionCard
                      key={i} question={question} index={i}
                      selectedLetter={topic.answers?.[question.id]}
                      onAnswer={l=>handleFavAnswer(subject,topic,question.id,l)}
                      darkMode={darkMode}
	                      isFavorite={true}
	                      onToggleFavorite={()=>handleFavUnfavorite(subject,topic,question.id)}
	                      showErrorNotebook={canUseAdvancedFeatures}
	                      isInErrorNotebook={listHasId(topic.errorNotebook || [], question.id)}
	                      onToggleErrorNotebook={()=>handleFavNotebook(subject,topic,question.id)}
	                      apiKey={getKey()} oracleLength={settings.oracleLength} onCall={callWithRotation}
	                      adminQuestionExplanations={isAdmin}
                    />
                  ))}
                </div>
              ))}
            </div>
          );
}
