import React from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';

export default function VideoaulasView() {
  const {
    darkMode,
    appliedVideoaulasData,
    parseVideoaulasData,
    sortCourseSubjectsForDisplay,
    watchedAulas,
    getAulaId,
    formatCourseDuration,
    totalLessonSeconds,
    activeSubjectVid,
    activeSubtopicVid,
    activeAula,
    setActiveSubjectVid,
    setActiveSubtopicVid,
    setActiveAula,
    setActiveAulaAndReset,
    expandedSubjectsVid,
    setExpandedSubjectsVid,
    canUseCourseOrganization,
    effectiveCoursePlanLessonOrder,
    displayCourseOrgProposal,
    vqBlocks,
    aulaVqKey,
    blockValues,
    aulaHasVqData,
    aulaDocId,
    isAdmin,
    markAulaWatched,
    mobileNavOpen,
    setMobileNavOpen,
    setVqQuestionParity,
    setVqSubject,
    setVqTopic,
    setVqAula,
    setVqActiveBlock,
    setVqActiveBlockView,
    setVqGenModal,
    setView,
    gerarQuestoesDireto,
    fetchTranscript,
    addToast,
    courseLessonDisplayTitle,
    shortTopicName,
    capitalizeDisplayLabel,
    videoaulasLoading,
    videoMainScrollRef,
    Spinner,
    ArrowLeft,
    VideoIcon,
    ChevronDown,
    ChevronRight,
    CheckIcon,
    Sparkles,
    DownloadIcon,
    PlayIcon,
    SettingsIcon,
    SkipBack,
    SkipForward,
    GraduationCap,
    RepeatIcon,
    BookOpen,
    Clock,
    videoFrameRef,
    videoSeek,
  } = useFeatureContext();

          const dm = darkMode;
          // DEMO_DATA usa o novo formato: Assunto → Tópico → { "Aulas Principais": [], "Bônus": [] }
          const DEMO_DATA = {
            "Ginecologia": {
              "GIN 6 - IST": {
                "Aulas Principais": [
                  {title:"02 - Introdução (GIN 6)",embed_url:"https://iframe.mediadelivery.net/embed/649407/fd56f7e5-8e2f-4f25-a45d-1c7a4f2a0b08",bunny_id:"fd56f7e5-8e2f-4f25-a45d-1c7a4f2a0b08"},
                  {title:"03 - Violência Sexual",embed_url:"https://iframe.mediadelivery.net/embed/649407/fd7c6bf6-558c-4be9-8178-7a2beeb778cc",bunny_id:"fd7c6bf6-558c-4be9-8178-7a2beeb778cc"},
                ],
                "Bônus": [
                  {title:"06 - Bônus - HIV e Gestação",embed_url:"https://iframe.mediadelivery.net/embed/649407/7c36c74d-d714-434d-bd9f-4ef095d2ace6",bunny_id:"7c36c74d-d714-434d-bd9f-4ef095d2ace6"},
                ]
              },
              "GIN 2 - SANGRAMENTO UTERINO ANORMAL": {
                "Aulas Principais": [
                  {title:"02 - Pólipos",embed_url:"https://iframe.mediadelivery.net/embed/649407/62e67657-9e68-49cd-8fb7-e4ad577ab3c8",bunny_id:"62e67657-9e68-49cd-8fb7-e4ad577ab3c8"},
                  {title:"03 - Sangramento Uterino Anormal",embed_url:"https://iframe.mediadelivery.net/embed/649407/88576d68-a31f-4d9e-af08-453a88e02cee",bunny_id:"88576d68-a31f-4d9e-af08-453a88e02cee"},
                ],
                "Bônus": [
                  {title:"04 - Bônus - Infertilidade",embed_url:"https://iframe.mediadelivery.net/embed/649407/153044db-1a93-4bd5-b9e3-0a8301489002",bunny_id:"153044db-1a93-4bd5-b9e3-0a8301489002"},
                ]
              },
            },
            "Reumatologia": {
              "REU 1 - GOTA E FEBRE REUMÁTICA": {
                "Aulas Principais": [
                  {title:"01 - Artrite Reumatoide",embed_url:"https://iframe.mediadelivery.net/embed/649407/2b5e6a59-509e-488c-b0ee-bb9cd5c00a2f",bunny_id:"2b5e6a59-509e-488c-b0ee-bb9cd5c00a2f"},
                ],
                "Bônus": []
              },
            },
          };
          const isDemo = !appliedVideoaulasData || Object.keys(appliedVideoaulasData).length===0;
          const raw = isDemo ? DEMO_DATA : appliedVideoaulasData;

          // Usar o helper global parseVideoaulasData → { [subj]: { [topic]: { main, bonus } } }
          const data     = parseVideoaulasData(raw);
          const subjects = sortCourseSubjectsForDisplay(Object.keys(data));

          // allAulas = todas as aulas flat (main + bonus) para contagem de progresso
          const allAulas = Object.values(data).flatMap(s=>Object.values(s).flatMap(t=>[...t.main,...t.bonus]));
          const watchedCount = allAulas.filter(a=>watchedAulas[getAulaId(a)]).length;
          const allAulasDuration = formatCourseDuration(totalLessonSeconds(allAulas));

          // Estado ativo: subject + topic + categoria ('main'|'bonus')
          const effSubject  = activeSubjectVid && data[activeSubjectVid] ? activeSubjectVid : subjects[0] || null;
          const requestedTopic = activeSubtopicVid?.split('::')[0] || null;
          const firstTopic = effSubject ? Object.keys(data[effSubject]||{})[0] : null;
          const effTopic = requestedTopic && data[effSubject]?.[requestedTopic] ? requestedTopic : firstTopic;
          const requestedCat = activeSubtopicVid?.split('::')[1] || 'main';
          const effCat = data[effSubject]?.[effTopic]?.[requestedCat] ? requestedCat : 'main';
          const effAulas    = (effSubject && effTopic) ? (data[effSubject]?.[effTopic]?.[effCat] || []) : [];
          const activeAulaId = getAulaId(activeAula);
          const effAula     = (activeAulaId ? effAulas.find(aula => getAulaId(aula) === activeAulaId) : null) || effAulas[0] || null;
	          const effDescription = effAula?.description || effAula?.ai_catalog?.description || '';
	          const effIdx      = effAulas.findIndex(a=>getAulaId(a)===getAulaId(effAula));
	          const prevAula    = effIdx>0 ? effAulas[effIdx-1] : null;
	          const nextAula    = effIdx<effAulas.length-1 ? effAulas[effIdx+1] : null;
	          const sideBorder  = dm?'border-gray-700':'border-gray-200';
	          const sideBg      = dm?'bg-gray-800/50':'bg-white';
	          const textMuted   = dm?'text-gray-400':'text-gray-500';
	          const useIntegratedCourseNav = canUseCourseOrganization && effectiveCoursePlanLessonOrder.length && displayCourseOrgProposal?.mode === 'integrated';
	          const effQuestionData = effAula ? vqBlocks[aulaVqKey(effAula)] : null;
	          const effQuestionBlocks = blockValues(effQuestionData?.blocks);
	          const effQuestionTotal = effQuestionBlocks.reduce((sum, block) => sum + (block.questions?.length || 0), 0);
	          const effQuestionAnswered = effQuestionBlocks.reduce((sum, block) => sum + Object.keys(block.answers || {}).length, 0);
	          const effWatched = !!watchedAulas[getAulaId(effAula)];
	          const effQuestionComplete = effQuestionTotal > 0 && effQuestionAnswered >= effQuestionTotal;
	          const effQuestionActionLabel = effQuestionTotal === 0
	            ? 'Gerar questões de fixação'
	            : effQuestionAnswered < effQuestionTotal
	              ? `Responder questões (${effQuestionAnswered}/${effQuestionTotal})`
	              : 'Rever questões';
	          const openEffAulaQuestions = (parity = 'all') => {
	            setVqQuestionParity(parity);
	            if (aulaHasVqData(effAula)) {
	              const availableBlocks = Object.entries(Array.isArray(effQuestionData?.blocks) ? {} : (effQuestionData?.blocks || {}))
	                .filter(([, block])=>(block?.questions || []).length > 0);
	              setVqSubject(effSubject);setVqTopic(effTopic);setVqAula(effAula);setVqActiveBlock(null);
	              setVqActiveBlockView(availableBlocks.length===1 ? {blockId:availableBlocks[0][0],showWrong:false} : null);
	              setView('videoquestions');
	            } else {
	              gerarQuestoesDireto(effAula, effSubject, effTopic);
	            }
	          };
	          const downloadEffTranscript = async () => {
	            try {
	              const lessonData = await fetchTranscript(effAula);
	              const transcript = lessonData?.transcript || '';
	              if (!transcript) { addToast('Transcrição não disponível para esta aula.', 'info', 3500); return; }
	              const title = courseLessonDisplayTitle(effAula);
	              const blob = new Blob([`${title}\n${'='.repeat(title.length)}\n\n${transcript}`], {type:'text/plain;charset=utf-8'});
	              const anchor = document.createElement('a');
	              anchor.href = URL.createObjectURL(blob);
	              anchor.download = `${title.substring(0,60).replace(/[^a-zA-Z0-9\s\-]/g,'')}.txt`;
	              anchor.click();
	              URL.revokeObjectURL(anchor.href);
	              addToast('Transcrição exportada.', 'success', 2500);
	            } catch(e) { addToast('Erro ao exportar transcrição.', 'error', 3500); }
	          };

          // Helper para setar tópico+cat ao mesmo tempo
          const setTopicCat = (subject, topic, cat) => {
            setActiveSubjectVid(subject);
            setActiveSubtopicVid(`${topic}::${cat}`);
            setActiveAula(data[subject]?.[topic]?.[cat]?.[0] || null);
          };

          return (
	            <div className={`course-workspace flex w-full overflow-visible md:overflow-hidden md:gap-4 md:py-4 md:pr-4 md:pl-8 ${dm?'bg-gray-950':'bg-gray-100'}`} style={{minHeight:'calc(100dvh - 62px)'}}>

              {/* ══ SIDEBAR ══ */}
              <div className={`course-workspace-nav w-72 xl:w-80 flex-shrink-0 overflow-hidden rounded-2xl border shadow-sm ${sideBg} ${sideBorder} hidden md:flex flex-col`}>
                <div className={`px-4 py-3 border-b ${sideBorder} flex-shrink-0`}>
                  <div className="flex items-center gap-2 mb-2">
                    <button onClick={()=>setView('library')} className={`p-1 rounded ${dm?'hover:bg-gray-700 text-gray-500':'hover:bg-gray-100 text-gray-400'}`}><ArrowLeft className="w-4 h-4"/></button>
                    <span className="font-bold text-sm text-yellow-600 flex items-center gap-1.5"><VideoIcon className="w-4 h-4"/>Videoaulas</span>
                    {isDemo&&<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto ${dm?'bg-yellow-900/40 text-yellow-500':'bg-yellow-100 text-yellow-600'}`}>DEMO</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-1 rounded-full overflow-hidden ${dm?'bg-gray-700':'bg-gray-100'}`}><div className="h-full bg-yellow-500 transition-all" style={{width:`${allAulas.length?watchedCount/allAulas.length*100:0}%`}}/></div>
                    <span className={`text-[10px] font-bold ${textMuted}`}>
                      {watchedCount}/{allAulas.length}{allAulasDuration?` · ${allAulasDuration}`:''}
                    </span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {videoaulasLoading&&<div className="flex justify-center py-8"><Spinner className="w-6 h-6 text-yellow-600"/></div>}
                  {subjects.map(subject=>{
                    const sAulas=Object.values(data[subject]).flatMap(t=>[...t.main,...t.bonus]);
                    const sW=sAulas.filter(a=>watchedAulas[getAulaId(a)]).length;
                    const sDuration=formatCourseDuration(totalLessonSeconds(sAulas));
                    const isExp=expandedSubjectsVid[subject]??(subject===effSubject);
                    return (
                      <div key={subject} className={`border-b ${sideBorder}`}>
                        {/* Assunto */}
                        <button onClick={()=>{setExpandedSubjectsVid(p=>({...p,[subject]:!isExp}));setActiveSubjectVid(subject);}}
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-left ${dm?'hover:bg-gray-700/60':'hover:bg-gray-50'}`}>
                          <div className="min-w-0 flex-1">
	                                  <p className={`text-xs font-bold truncate ${effSubject===subject?'text-yellow-500':''}`}>{capitalizeDisplayLabel(subject)}</p>
                            <p className={`text-[10px] mt-0.5 ${textMuted}`}>{sW}/{sAulas.length}{sDuration?` · ${sDuration}`:''}</p>
                          </div>
                          {isExp?<ChevronDown className="w-3 h-3 opacity-30 ml-1 flex-shrink-0"/>:<ChevronRight className="w-3 h-3 opacity-30 ml-1 flex-shrink-0"/>}
                        </button>
	                        {isExp&&Object.entries(data[subject]).map(([topic,{main,bonus}])=>{
	                          const topicAulas=[...main,...bonus];
	                          const topicW=topicAulas.filter(a=>watchedAulas[getAulaId(a)]).length;
                            const topicDuration=formatCourseDuration(totalLessonSeconds(topicAulas));
                            const mainDuration=formatCourseDuration(totalLessonSeconds(main));
                            const bonusDuration=formatCourseDuration(totalLessonSeconds(bonus));
	                          const isTopicExp=expandedSubjectsVid[`${subject}::${topic}`]??(effSubject===subject&&effTopic===topic);
	                          return (
	                            <div key={topic}>
	                              {/* Tópico */}
	                              <button onClick={()=>setExpandedSubjectsVid(p=>({...p,[`${subject}::${topic}`]:!isTopicExp}))}
	                                className={`w-full flex items-center justify-between px-3 py-1.5 pl-5 text-left ${dm?'hover:bg-gray-700/40 text-gray-300':'hover:bg-gray-50 text-gray-600'} ${effSubject===subject&&effTopic===topic?(dm?'text-yellow-400':'text-yellow-700'):''}`}>
	                                <div className="min-w-0 flex-1">
	                                  <p className="text-[11px] font-semibold truncate">{shortTopicName(topic)}</p>
	                                  {!useIntegratedCourseNav&&<p className={`text-[9px] ${textMuted}`}>{topicW}/{topicAulas.length}{topicDuration?` · ${topicDuration}`:''}</p>}
	                                </div>
	                                {isTopicExp?<ChevronDown className="w-3 h-3 opacity-30 flex-shrink-0"/>:<ChevronRight className="w-3 h-3 opacity-30 flex-shrink-0"/>}
	                              </button>
	                              {isTopicExp&&(
	                                <div>
	                                  {useIntegratedCourseNav ? (
	                                    topicAulas.map((aula, ai)=>{
	                                      const isAct=getAulaId(effAula)===getAulaId(aula);
	                                      const watched=watchedAulas[getAulaId(aula)];
	                                      return (
	                                        <button key={getAulaId(aula)||ai} onClick={()=>{setTopicCat(subject,topic,aula.display_cat || 'main');setActiveAulaAndReset(aula);}}
	                                          className={`w-full flex items-center gap-2 px-3 py-1.5 pl-8 text-left transition-colors ${isAct?(dm?'bg-yellow-900/40 text-yellow-300':'bg-yellow-100 text-yellow-800'):(dm?'text-gray-500 hover:bg-gray-700/30':'text-gray-500 hover:bg-gray-50')}`}>
	                                          <div className={`w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 ${watched?'bg-green-500 text-white':'border '+(dm?'border-gray-600':'border-gray-300')}`}>
	                                            {watched&&<CheckIcon className="w-2 h-2"/>}
	                                          </div>
	                                          <span className="text-[11px] truncate leading-tight">{courseLessonDisplayTitle(aula)}</span>
	                                        </button>
	                                      );
	                                    })
	                                  ) : (
	                                    <>
	                                      {/* Categoria: Aulas */}
	                                      {main.length>0&&(
	                                        <div>
	                                          <button onClick={()=>setTopicCat(subject,topic,'main')}
	                                            className={`w-full text-left px-3 py-1 pl-8 text-[10px] font-bold uppercase tracking-wider transition-colors ${effSubject===subject&&effTopic===topic&&effCat==='main'?(dm?'text-yellow-400 bg-yellow-900/30':'text-yellow-700 bg-yellow-50'):(dm?'text-gray-500 hover:bg-gray-700/30':'text-gray-400 hover:bg-gray-50')}`}>
	                                            📖 Aulas ({main.length}{mainDuration?` · ${mainDuration}`:''})
	                                          </button>
	                                          {effSubject===subject&&effTopic===topic&&effCat==='main'&&main.map((aula,ai)=>{
	                                            const isAct=getAulaId(effAula)===getAulaId(aula);
	                                            const watched=watchedAulas[getAulaId(aula)];
	                                            return (
	                                              <button key={getAulaId(aula)||ai} onClick={()=>setActiveAulaAndReset(aula)}
	                                                className={`w-full flex items-center gap-2 px-3 py-1.5 pl-10 text-left transition-colors ${isAct?(dm?'bg-yellow-900/40 text-yellow-300':'bg-yellow-100 text-yellow-800'):(dm?'text-gray-500 hover:bg-gray-700/30':'text-gray-500 hover:bg-gray-50')}`}>
	                                                <div className={`w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 ${watched?'bg-green-500 text-white':'border '+(dm?'border-gray-600':'border-gray-300')}`}>
	                                                  {watched&&<CheckIcon className="w-2 h-2"/>}
	                                                </div>
	                                                <span className="text-[11px] truncate leading-tight">{courseLessonDisplayTitle(aula)}</span>
	                                              </button>
	                                            );
	                                          })}
	                                        </div>
	                                      )}
	                                    </>
	                                  )}
	                                  {/* Categoria: Bônus */}
	                                  {!useIntegratedCourseNav&&bonus.length>0&&(
                                    <div>
                                      <button onClick={()=>setTopicCat(subject,topic,'bonus')}
                                        className={`w-full text-left px-3 py-1 pl-8 text-[10px] font-bold uppercase tracking-wider transition-colors ${effSubject===subject&&effTopic===topic&&effCat==='bonus'?(dm?'text-yellow-400 bg-yellow-900/30':'text-yellow-700 bg-yellow-50'):(dm?'text-gray-500 hover:bg-gray-700/30':'text-gray-400 hover:bg-gray-50')}`}>
                                        ⭐ Bônus ({bonus.length}{bonusDuration?` · ${bonusDuration}`:''})
                                      </button>
                                      {effSubject===subject&&effTopic===topic&&effCat==='bonus'&&bonus.map((aula,ai)=>{
                                        const isAct=getAulaId(effAula)===getAulaId(aula);
                                        const watched=watchedAulas[getAulaId(aula)];
                                        return (
                                          <button key={getAulaId(aula)||ai} onClick={()=>setActiveAulaAndReset(aula)}
                                            className={`w-full flex items-center gap-2 px-3 py-1.5 pl-10 text-left transition-colors ${isAct?(dm?'bg-yellow-900/40 text-yellow-300':'bg-yellow-100 text-yellow-800'):(dm?'text-gray-500 hover:bg-gray-700/30':'text-gray-500 hover:bg-gray-50')}`}>
                                            <div className={`w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 ${watched?'bg-green-500 text-white':'border '+(dm?'border-gray-600':'border-gray-300')}`}>
                                              {watched&&<CheckIcon className="w-2 h-2"/>}
                                            </div>
                                            <span className="text-[11px] truncate leading-tight">{courseLessonDisplayTitle(aula)}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ══ MAIN ══ */}
              <div ref={videoMainScrollRef} className={`course-workspace-main h-auto min-h-[calc(100dvh-62px)] min-w-0 flex-1 overflow-visible md:h-[calc(100dvh-2rem)] md:min-h-0 md:overflow-y-auto md:rounded-2xl md:border md:shadow-sm ${dm?'bg-gray-900 md:border-gray-800':'bg-white md:border-gray-200'}`}>
                {/* Mobile back bar */}
                <div className={`flex items-center gap-2 px-3 py-2.5 md:hidden border-b flex-shrink-0 ${sideBorder} ${dm?'bg-gray-800':'bg-white'}`}>
                  <button onClick={()=>setView('library')} className={`p-1.5 rounded-lg ${dm?'bg-gray-700 text-gray-300':'bg-gray-100 text-gray-600'}`}><ArrowLeft className="w-4 h-4"/></button>
                  <span className="text-sm font-bold text-yellow-600 flex-1 truncate">
                    {effAula ? courseLessonDisplayTitle(effAula) : 'Videoaulas'}
                  </span>
                  {effAula?.duration_formatted&&<span className={`flex-shrink-0 text-xs font-bold ${dm?'text-gray-400':'text-gray-500'}`}>{effAula.duration_formatted}</span>}
                </div>

                {!effAula ? (
                  <div className="flex flex-col items-center justify-center h-64 opacity-30">
                    <VideoIcon className="w-12 h-12 mb-3 text-gray-400"/>
                    <p className="font-serif font-bold text-gray-400">Selecione uma aula</p>
                  </div>
                ) : (
                  <div>
                    <div className="mx-auto w-full max-w-5xl px-3 pt-4 md:px-6 md:pt-6">
                      <div className="mb-4 hidden min-w-0 md:block">
                        <p className={`truncate text-xs font-semibold ${textMuted}`} title={`${capitalizeDisplayLabel(effSubject)} — ${shortTopicName(effTopic||'')}`}>
                          {capitalizeDisplayLabel(effSubject)} <span className="mx-1.5 opacity-35">/</span> {shortTopicName(effTopic||'')}
                        </p>
                        <div className="mt-1.5 flex min-w-0 items-center justify-between gap-6">
                          <h2 className={`min-w-0 truncate font-serif text-2xl font-bold ${dm?'text-gray-100':'text-gray-900'}`} title={courseLessonDisplayTitle(effAula)}>{courseLessonDisplayTitle(effAula)}</h2>
                          <div className="flex flex-shrink-0 items-center gap-2">
                            <span className={`flex items-center gap-1.5 text-sm font-bold ${dm?'text-gray-300':'text-gray-600'}`}><Clock className="h-4 w-4 text-yellow-600"/>{effAula.duration_formatted || 'Duração não informada'}</span>
                            {isAdmin&&<button onClick={downloadEffTranscript} title="Baixar transcrição" aria-label="Baixar transcrição" className={`flex h-8 w-8 items-center justify-center rounded-lg opacity-35 transition-opacity hover:opacity-100 ${dm?'hover:bg-gray-800 text-gray-300':'hover:bg-gray-100 text-gray-600'}`}><DownloadIcon className="h-4 w-4"/></button>}
                          </div>
                        </div>
                      </div>
                    {/* Player */}
                    <div className="relative w-full overflow-hidden rounded-xl bg-black shadow-lg" style={{aspectRatio:'16/9',maxHeight:'62vh'}}>
                      {isDemo ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{background:'#0d0d0d'}}>
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border-2 ${dm?'border-yellow-600 bg-yellow-900/30':'border-yellow-500 bg-yellow-50'}`}>
                            <PlayIcon className="w-7 h-7 text-yellow-500 ml-0.5"/>
                          </div>
                          <p className="text-white font-bold text-lg px-4 text-center">{courseLessonDisplayTitle(effAula)}</p>
                          <p className="text-gray-500 text-sm mt-1">Player Bunny Stream</p>
                          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-10" style={{background:'linear-gradient(transparent,rgba(0,0,0,0.88))'}}>
                            <div className="mb-2"><div className="h-1 bg-gray-600/60 rounded-full"><div className="h-full bg-yellow-500 rounded-full" style={{width:'34%'}}/></div></div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <button className="text-white/70"><SkipBack className="w-4 h-4"/></button>
                                <button className="text-white/70"><PlayIcon className="w-5 h-5"/></button>
                                <button className="text-white/70"><SkipForward className="w-4 h-4"/></button>
                                <span className="text-xs text-gray-400 font-mono">14:22 / 42:00</span>
                              </div>
                              <div className="relative group">
                                <button className="text-xs text-white bg-white/15 px-2.5 py-1 rounded font-bold">1x</button>
                                <div className="absolute bottom-9 right-0 bg-gray-900/95 border border-gray-700 rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto shadow-xl z-20" style={{minWidth:'72px'}}>
                                  {['0.5','0.75','1','1.25','1.5','2'].map(s=>(
                                    <div key={s} className={`px-4 py-2 text-xs cursor-pointer hover:bg-white/10 text-center font-medium ${s==='1'?'text-yellow-400 font-bold':'text-gray-200'}`}>{s}x</div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : effAula?.embed_url ? (
                        <iframe
                          ref={videoFrameRef}
                          key={`${getAulaId(effAula)||effAula.embed_url}-${videoSeek??45}`}
                          src={`${effAula.embed_url}${effAula.embed_url.includes('?')?'&':'?'}t=${videoSeek??45}`}
                          className="absolute inset-0 w-full h-full"
                          id="bunny-player"
                          style={{border:'none'}}
                          allow="accelerometer;gyroscope;encrypted-media;picture-in-picture;fullscreen"
                          allowFullScreen
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-white opacity-40 text-sm">Vídeo não disponível</p>
                        </div>
                      )}
                    </div>
                    </div>

                    <div className={`${dm?'bg-gray-900':'bg-white'}`}>
                      {/* MOBILE: Navegação anterior/próxima */}
                      <div className={`flex items-center gap-2 px-3 py-2 md:hidden border-b ${sideBorder}`}>
                        <button onClick={()=>prevAula&&setActiveAulaAndReset(prevAula)} disabled={!prevAula}
                          className={`flex items-center gap-2 flex-1 min-w-0 px-3 py-3 rounded-xl border font-bold text-xs transition-colors disabled:opacity-25 ${dm?'border-gray-700 text-gray-300 active:bg-gray-700':'border-gray-200 text-gray-700 active:bg-gray-100'}`}>
                          <SkipBack className="w-4 h-4 flex-shrink-0"/>
                          <div className="min-w-0 text-left">
                            <p className="text-[9px] uppercase opacity-40 font-bold leading-none mb-0.5">Anterior</p>
                            <p className="truncate">{prevAula?courseLessonDisplayTitle(prevAula):'—'}</p>
                          </div>
                        </button>
                        <button onClick={()=>nextAula&&setActiveAulaAndReset(nextAula)} disabled={!nextAula}
                          className={`flex items-center gap-2 flex-1 min-w-0 px-3 py-3 rounded-xl border font-bold text-xs transition-colors disabled:opacity-25 justify-end text-right ${dm?'border-gray-700 text-gray-300 active:bg-gray-700':'border-gray-200 text-gray-700 active:bg-gray-100'}`}>
                          <div className="min-w-0 text-right">
                            <p className="text-[9px] uppercase opacity-40 font-bold leading-none mb-0.5">Próxima</p>
                            <p className="truncate">{nextAula?courseLessonDisplayTitle(nextAula):'—'}</p>
                          </div>
                          <SkipForward className="w-4 h-4 flex-shrink-0"/>
                        </button>
                      </div>

                      {/* MOBILE: Tópico atual clicável + botões de ação */}
                      <div className={`md:hidden border-b ${sideBorder} px-3 py-3 space-y-2`}>
                        {/* Nome do assunto/tópico — toca pra trocar */}
                        <button onClick={()=>setMobileNavOpen(true)}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-left ${dm?'bg-gray-800 text-gray-300':'bg-gray-100 text-gray-600'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/></svg>
                          <span className="flex-1 truncate">{capitalizeDisplayLabel(effSubject)} — {shortTopicName(effTopic||'')} {effCat==='bonus'?'⭐':''}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-40 flex-shrink-0"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        {effDescription&&<p className={`px-1 text-xs leading-relaxed ${dm?'text-gray-500':'text-gray-500'}`}>{effDescription}</p>}
	                        <div className="grid grid-cols-[auto_1fr] gap-2">
	                          <button onClick={()=>!isDemo&&markAulaWatched(getAulaId(effAula), effAula)}
	                            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-bold transition-all ${effWatched?(dm?'border-green-700 bg-green-900/25 text-green-300':'border-green-500 bg-green-50 text-green-700'):(dm?'border-gray-700 bg-gray-800 text-gray-300 active:bg-gray-700':'border-gray-200 bg-white text-gray-700 active:bg-gray-50')}`}>
	                            <CheckIcon className="w-4 h-4"/>{effWatched?'Assistida':'Marcar assistida'}
	                          </button>
	                          <button onClick={()=>openEffAulaQuestions('all')}
	                            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-bold transition-all ${effQuestionComplete?(dm?'border-green-700 bg-green-900/25 text-green-300':'border-green-500 bg-green-50 text-green-700'):(dm?'border-gray-600 bg-gray-800 text-gray-100 active:bg-gray-700':'border-gray-300 bg-white text-gray-800 active:bg-gray-50')}`}>
	                            <GraduationCap className="w-4 h-4"/>{effQuestionActionLabel}
	                          </button>
	                        </div>
	                        {effQuestionTotal>1&&(
	                          <div className="grid grid-cols-2 gap-2 pl-[7.25rem]">
	                            <button onClick={()=>openEffAulaQuestions('odd')} className={`rounded-lg border px-3 py-2 text-xs font-bold ${dm?'border-gray-700 bg-gray-800 text-gray-300':'border-gray-200 bg-white text-gray-600'}`}>Fazer ímpares</button>
	                            <button onClick={()=>openEffAulaQuestions('even')} className={`rounded-lg border px-3 py-2 text-xs font-bold ${dm?'border-gray-700 bg-gray-800 text-gray-300':'border-gray-200 bg-white text-gray-600'}`}>Fazer pares</button>
	                          </div>
	                        )}
	                        {!aulaHasVqData(effAula)&&isAdmin&&(
	                          <button onClick={()=>setVqGenModal({aula:effAula,aulaId:aulaDocId(effAula),suggestedQ:10,subject:effSubject,topic:effTopic,fromConfig:true})}
	                            className={`ml-auto flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold ${dm?'text-gray-400 hover:bg-gray-800':'text-gray-500 hover:bg-gray-50'}`}>
	                            <SettingsIcon className="w-3.5 h-3.5"/>Personalizar geração
	                          </button>
	                        )}
                      </div>

                      {/* MOBILE: scrollable aula list */}
                      <div className={`md:hidden border-b ${sideBorder} overflow-y-auto`} style={{maxHeight:'38vh'}}>
                        <div className={`px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider sticky top-0 ${dm?'bg-gray-900 text-gray-500':'bg-white text-gray-400'}`}>
                          {shortTopicName(effTopic||'')} {effCat==='bonus'?'— Bônus':'— Aulas'}
                        </div>
                        {effAulas.map((aula)=>{
                          const id = getAulaId(aula);
                          const isAct = id===getAulaId(effAula);
                          const watched = watchedAulas[id];
                          return (
                            <button key={id||aula.path} onClick={()=>setActiveAulaAndReset(aula)}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b transition-colors ${isAct?(dm?'bg-yellow-900/25':'bg-yellow-50'):(dm?'hover:bg-gray-800':'hover:bg-gray-50')} ${dm?'border-gray-700/40':'border-gray-100'}`}>
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${watched?'bg-green-500 text-white':(isAct?'bg-yellow-500 text-white':'border '+(dm?'border-gray-600':'border-gray-300'))}`}>
                                {watched?<CheckIcon className="w-3 h-3"/>:isAct?<PlayIcon className="w-2.5 h-2.5" style={{marginLeft:'1px'}}/>:null}
                              </div>
                              <span className={`text-sm truncate ${isAct?'font-semibold '+(dm?'text-yellow-300':'text-yellow-700'):(watched?'text-gray-400':(dm?'text-gray-300':'text-gray-700'))}`}>
                                {courseLessonDisplayTitle(aula)}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* MOBILE BOTTOM SHEET: 3 níveis */}
                      {mobileNavOpen&&(
                        <div className="fixed inset-0 z-[300] md:hidden" onClick={()=>setMobileNavOpen(false)}>
                          <div className="absolute inset-0 bg-black bg-opacity-80"/>
                          <div className={`absolute bottom-0 left-0 right-0 rounded-t-2xl overflow-hidden ${dm?'bg-gray-800':'bg-white'}`}
                            onClick={e=>e.stopPropagation()}>
                            <div className="flex justify-center pt-3 pb-1">
                              <div className={`w-10 h-1 rounded-full ${dm?'bg-gray-600':'bg-gray-300'}`}/>
                            </div>
                            <div className={`flex items-center justify-between px-4 py-3 border-b ${dm?'border-gray-700':'border-gray-100'}`}>
                              <span className="font-bold text-sm text-yellow-600">Navegar</span>
                              <button type="button" aria-label="Fechar lista de aulas" onClick={()=>setMobileNavOpen(false)} className={`text-lg leading-none font-bold ${dm?'text-gray-400':'text-gray-400'}`}>✕</button>
                            </div>
                            <div className="overflow-y-auto" style={{maxHeight:'65vh'}}>
                              {subjects.map(subj=>{
                                const sAulas=Object.values(data[subj]).flatMap(t=>[...t.main,...t.bonus]);
                                const sW=sAulas.filter(a=>watchedAulas[getAulaId(a)]).length;
                                const sDuration=formatCourseDuration(totalLessonSeconds(sAulas));
                                const isExpS=expandedSubjectsVid[subj]??(subj===effSubject);
                                return (
                                  <div key={subj} className={`border-b ${dm?'border-gray-700/60':'border-gray-100'}`}>
                                    <button onClick={()=>setExpandedSubjectsVid(p=>({...p,[subj]:!isExpS}))}
                                      className={`w-full flex items-center justify-between px-4 py-3 text-left ${dm?'hover:bg-gray-700':'hover:bg-gray-50'}`}>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold truncate ${subj===effSubject?'text-yellow-500':''}`}>{capitalizeDisplayLabel(subj)}</p>
                                        <p className={`text-xs mt-0.5 ${dm?'text-gray-500':'text-gray-400'}`}>
                                          {sW}/{sAulas.length} assistidas{sDuration?` · ${sDuration}`:''}
                                        </p>
                                      </div>
                                      <ChevronDown className={`w-4 h-4 opacity-30 ml-2 transition-transform ${isExpS?'':'rotate-180'}`}/>
                                    </button>
                                    {isExpS&&Object.entries(data[subj]).map(([topic,{main,bonus}])=>{
                                      const isActT=subj===effSubject&&topic===effTopic;
                                      const topicAulas=[...main,...bonus];
                                      const tW=topicAulas.filter(a=>watchedAulas[getAulaId(a)]).length;
                                      const topicDuration=formatCourseDuration(totalLessonSeconds(topicAulas));
                                      const mainDuration=formatCourseDuration(totalLessonSeconds(main));
                                      const bonusDuration=formatCourseDuration(totalLessonSeconds(bonus));
                                      return (
                                        <div key={topic} className={`border-t ${dm?'border-gray-700/40':'border-gray-50'}`}>
                                          <div className={`px-4 py-2 pl-7 text-xs font-bold ${isActT?(dm?'text-yellow-400':'text-yellow-700'):(dm?'text-gray-400':'text-gray-500')}`}>
                                            {shortTopicName(topic)} <span className="opacity-40 font-normal">({tW}/{topicAulas.length}{topicDuration?` · ${topicDuration}`:''})</span>
                                          </div>
                                          {main.length>0&&(
                                            <button onClick={()=>{setTopicCat(subj,topic,'main');setMobileNavOpen(false);}}
                                              className={`w-full flex items-center justify-between px-4 py-2 pl-10 text-left ${isActT&&effCat==='main'?(dm?'bg-yellow-900/30 text-yellow-400':'bg-yellow-50 text-yellow-700'):(dm?'text-gray-400 hover:bg-gray-700':'text-gray-500 hover:bg-gray-50')}`}>
                                              <span className="text-xs">📖 Aulas ({main.length}{mainDuration?` · ${mainDuration}`:''})</span>
                                            </button>
                                          )}
                                          {bonus.length>0&&(
                                            <button onClick={()=>{setTopicCat(subj,topic,'bonus');setMobileNavOpen(false);}}
                                              className={`w-full flex items-center justify-between px-4 py-2 pl-10 text-left ${isActT&&effCat==='bonus'?(dm?'bg-yellow-900/30 text-yellow-400':'bg-yellow-50 text-yellow-700'):(dm?'text-gray-400 hover:bg-gray-700':'text-gray-500 hover:bg-gray-50')}`}>
                                              <span className="text-xs">⭐ Bônus ({bonus.length}{bonusDuration?` · ${bonusDuration}`:''})</span>
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

	                      {/* DESKTOP info block */}
	                      <div className="mx-auto hidden w-full max-w-5xl px-6 py-5 md:block">
	                        <div className={`rounded-2xl border p-6 shadow-sm ${dm?'border-gray-800 bg-gray-900':'border-gray-200 bg-white'}`}>
	                          <div className="flex items-start justify-between gap-6">
	                            <div className="min-w-0 flex-1">
	                              <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${textMuted}`}>Sobre esta aula</p>
		                              <p className={`mt-2 max-w-3xl text-sm leading-relaxed ${dm?'text-gray-300':'text-gray-600'}`}>{effDescription || 'Assista ao conteúdo e use as questões para consolidar os pontos centrais da aula.'}</p>
		                            </div>
		                            <div className="w-64 flex-shrink-0 space-y-2">
		                              <button onClick={()=>!isDemo&&markAulaWatched(getAulaId(effAula), effAula)}
		                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-bold text-sm transition-all ${effWatched?(dm?'border-green-700 bg-green-900/25 text-green-300':'border-green-500 bg-green-50 text-green-700'):(dm?'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700':'border-gray-200 bg-white text-gray-700 hover:bg-gray-50')}`}>
		                                <CheckIcon className="w-4 h-4"/>
		                                {effWatched?'Assistida':'Marcar assistida'}
		                              </button>
		                              <button onClick={()=>openEffAulaQuestions('all')} className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold text-sm transition-all border ${effQuestionComplete?(dm?'border-green-700 bg-green-900/25 text-green-300 hover:bg-green-900/35':'border-green-500 bg-green-50 text-green-700 hover:bg-green-100'):(dm?'border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700':'border-gray-300 bg-white text-gray-800 hover:bg-gray-50')}`}>
		                                <GraduationCap className="w-4 h-4"/>{effQuestionActionLabel}
		                              </button>
		                              {effQuestionTotal>1&&<div className="grid grid-cols-2 gap-2">
		                                <button onClick={()=>openEffAulaQuestions('odd')} className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors ${dm?'border-gray-700 bg-gray-800 text-gray-300 hover:border-yellow-700':'border-gray-200 bg-white text-gray-600 hover:border-yellow-400'}`}>Ímpares</button>
		                                <button onClick={()=>openEffAulaQuestions('even')} className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors ${dm?'border-gray-700 bg-gray-800 text-gray-300 hover:border-yellow-700':'border-gray-200 bg-white text-gray-600 hover:border-yellow-400'}`}>Pares</button>
		                              </div>}
	                                {!aulaHasVqData(effAula)&&(
	                                  <button onClick={()=>setVqGenModal({aula:effAula,aulaId:aulaDocId(effAula),suggestedQ:10,subject:effSubject,topic:effTopic,fromConfig:true})}
	                                    title="Configurações das questões"
	                                    className={`flex w-full items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${dm?'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200':'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
	                                    <SettingsIcon className="w-4 h-4"/>Config.
	                                  </button>
	                                )}
	                            </div>
	                          </div>
	                          <div className={`mt-5 pt-4 border-t grid grid-cols-2 gap-3 ${dm?'border-gray-800':'border-gray-200'}`}>
	                            <button onClick={()=>prevAula&&setActiveAulaAndReset(prevAula)} disabled={!prevAula}
	                              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold border transition-colors disabled:opacity-30 ${dm?'border-gray-800 hover:bg-gray-900 text-gray-300':'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}`}>
	                              <SkipBack className="w-4 h-4 flex-shrink-0"/>
	                              <div className="text-left min-w-0">
	                                <p className="text-[10px] opacity-40 uppercase font-bold leading-none mb-1">Anterior</p>
	                                <p className="truncate text-xs">{prevAula?courseLessonDisplayTitle(prevAula):'—'}</p>
	                              </div>
	                            </button>
	                            <button onClick={()=>nextAula&&setActiveAulaAndReset(nextAula)} disabled={!nextAula}
	                              className={`flex items-center justify-end gap-3 px-4 py-3 rounded-xl text-sm font-bold border transition-colors disabled:opacity-30 text-right ${dm?'border-gray-800 hover:bg-gray-900 text-gray-300':'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}`}>
	                              <div className="min-w-0">
	                                <p className="text-[10px] opacity-40 uppercase font-bold leading-none mb-1">Próxima</p>
	                                <p className="truncate text-xs">{nextAula?courseLessonDisplayTitle(nextAula):'—'}</p>
	                              </div>
	                              <SkipForward className="w-4 h-4 flex-shrink-0"/>
	                            </button>
	                          </div>
	                        </div>
	                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
}
