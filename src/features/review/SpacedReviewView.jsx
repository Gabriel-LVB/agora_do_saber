import React from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';

export default function SpacedReviewView() {
  const {
    ArrowLeft,
    BrainIcon,
    callWithRotation,
    canSeeVideoaulas,
    canUseAdvancedFeatures,
    CheckIcon,
    ChevronRight,
    darkMode,
    EmptyState,
    getDueReviews,
    getKey,
    getTodayKey,
    isAdmin,
    isAnswerCorrect,
    isReviewItemFavorite,
    QuestionCard,
    QUICK_SUBJECT_TITLE,
    RepeatIcon,
    restoreReturnTarget,
    reviewSession,
    setReviewNotebook,
    setReviewSession,
    settings,
    toggleReviewFavorite,
    trackQuestionAnswered,
    updateReviewItem,
  } = useFeatureContext();

	          const dm = darkMode;
	          const dueItems = getDueReviews();
	          const dueFlashcardItems = dueItems.filter(item => item.question?.isFlashcard);
	          const dueQuestionItems = dueItems.filter(item => !item.question?.isFlashcard);
	          const SR_LABELS = ['3d','7d','14d','30d','90d'];
	          const intervalSummary = SR_LABELS
	            .map((label, interval) => ({ label, count:dueItems.filter(item => item.item?.interval === interval).length }))
	            .filter(item => item.count > 0);

          if (reviewSession) {
            const { items: sessionItems, index, sessionAnswers, sessionResults = {}, completed = false } = reviewSession;
            const cur = sessionItems[index];
            const total = sessionItems.length;
            const done = Object.keys(sessionAnswers).length;
            const finished = done === total;
            const sessionAllFlashcards = sessionItems.every(item => item.question?.isFlashcard);
            const reviewListMode = !sessionAllFlashcards && canUseAdvancedFeatures && (settings.questionDisplayMode || 'list') === 'list';
            if (finished && completed) {
              const correct = Object.values(sessionResults).filter(Boolean).length;
	              const pct = Math.round(correct / total * 100);
              const wrong = total - correct;
              const tone = pct>=80 ? 'Excelente retenção.' : pct>=60 ? 'Boa sessão, com alguns pontos para reforçar.' : 'Sessão útil para revelar lacunas importantes.';
	              return (
	                <div className={`max-w-2xl mx-auto rounded-2xl border p-8 md:p-10 text-center ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'} shadow-sm`}>
	                  <RepeatIcon className="w-16 h-16 mx-auto mb-4 text-yellow-500"/>
	                  <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${dm?'text-gray-500':'text-gray-400'}`}>Sessão encerrada</p>
	                  <h2 className="text-3xl font-serif font-bold text-yellow-600 mb-3">Revisão concluída</h2>
	                  <p className={`text-4xl font-serif font-bold mb-2 ${pct>=70?'text-green-500':pct>=50?'text-yellow-600':'text-red-500'}`}>{pct}%</p>
                  <p className={`text-sm font-bold mb-4 ${dm?'text-gray-300':'text-gray-700'}`}>{correct}/{total} corretas · {wrong} para reforçar</p>
                  <p className={`text-sm leading-relaxed mb-6 ${dm?'text-gray-400':'text-gray-500'}`}>{tone} As questões acertadas foram empurradas para o próximo intervalo; as erradas voltam para revisão mais cedo.</p>
                  <div className={`grid grid-cols-2 gap-3 mb-8 text-left`}>
                    <div className={`rounded-xl border p-4 ${dm?'border-gray-800 bg-gray-950/60':'border-gray-100 bg-gray-50'}`}>
                      <p className="text-2xl font-serif font-bold text-green-500">{correct}</p>
                      <p className={`text-xs font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>avançaram</p>
                    </div>
                    <div className={`rounded-xl border p-4 ${dm?'border-gray-800 bg-gray-950/60':'border-gray-100 bg-gray-50'}`}>
                      <p className="text-2xl font-serif font-bold text-red-500">{wrong}</p>
                      <p className={`text-xs font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>reforço</p>
                    </div>
                  </div>
                  <button onClick={()=>setReviewSession(null)} className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold">
                    Voltar
                  </button>
	                </div>
	              );
	            }

	            const item = cur;
	            const q = item.question;
	            const seed = item.item.reviewSeed || 42;
	            const shuffleWithSeed = (arr, s) => {
	              const a = [...arr]; let st = s;
	              for (let i = a.length-1; i>0; i--) {
	                st = (st * 1664525 + 1013904223) & 0xffffffff;
	                const j = Math.abs(st) % (i+1);
	                [a[i], a[j]] = [a[j], a[i]];
	              }
	              return a;
	            };
	            const correctText = q.options?.find(o=>o.isCorrect)?.text;
	            const reviewQ = {...q, options:shuffleWithSeed(q.options||[], seed).map((opt,i)=>({...opt, letter:'ABCDE'[i], isCorrect: opt.text===correctText}))};
	            return (
	              <div className="max-w-2xl mx-auto">
                <button onClick={()=>setReviewSession(null)} className={`flex items-center gap-2 mb-4 font-bold ${dm?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/>Sair</button>
	                <div className={`flex items-center gap-3 mb-6 p-3 rounded-xl ${dm?'bg-gray-800':'bg-gray-50'}`}>
	                  <div className={`flex-1 h-2 rounded-full overflow-hidden ${dm?'bg-gray-700':'bg-gray-200'}`}><div className="h-full bg-yellow-500 rounded-full transition-all" style={{width:`${done/total*100}%`}}/></div>
	                  <span className={`text-xs font-bold flex-shrink-0 ${dm?'text-gray-400':'text-gray-500'}`}>{index+1}/{total}</span>
	                </div>
	                <QuestionCard
	                  question={reviewQ}
	                  index={index}
	                  selectedLetter={sessionAnswers[item.qId]}
                  onAnswer={async (letter)=>{
                    const correct = isAnswerCorrect(reviewQ, letter);
                    trackQuestionAnswered(`review:${item.aulaId}:${item.blockId}:${item.qId}:${item.item?.dueDate||getTodayKey()}`);
                    setReviewSession(p=>({...p, sessionAnswers:{...(p?.sessionAnswers||{}), [item.qId]:letter}, sessionResults:{...(p?.sessionResults||{}), [item.qId]:correct}}));
                    if (!correct) setReviewNotebook(item, 'add');
                    await updateReviewItem(item.aulaId, item.blockId, item.qId, correct);
                  }}
	                  darkMode={dm}
	                  isFavorite={isReviewItemFavorite(item)}
	                  onToggleFavorite={()=>toggleReviewFavorite(item)}
                  showErrorNotebook={false}
                  adminQuestionExplanations={isAdmin}
	                  apiKey={getKey()}
	                  oracleLength={settings.oracleLength}
	                  onCall={callWithRotation}
	                />
                <div className="flex items-center justify-between gap-3 mt-4">
                  <button onClick={()=>setReviewSession(p=>({...p,index:Math.max(0,index-1)}))} disabled={index===0} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${index===0?(dm?'border-gray-800 text-gray-700 bg-gray-900/40':'border-gray-100 text-gray-300 bg-gray-50'):(dm?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50')}`}><ArrowLeft className="w-4 h-4"/>Voltar</button>
                  <button
                    onClick={()=>setReviewSession(p=>(index===total-1?{...p,completed:true}:{...p,index:Math.min(total-1,index+1)}))}
                    disabled={index===total-1 && !finished}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${(index===total-1 && !finished)?(dm?'border-gray-800 text-gray-700 bg-gray-900/40':'border-gray-100 text-gray-300 bg-gray-50'):(dm?'border-yellow-700 bg-yellow-900/30 text-yellow-300 hover:bg-yellow-900/50':'border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100')}`}
                  >
                    {index===total-1?'Concluir':'Avançar'}
                    {index===total-1?<CheckIcon className="w-4 h-4"/>:<ChevronRight className="w-4 h-4"/>}
                  </button>
                </div>
	              </div>
	            );
	          }

	          return (
	            <div className="space-y-6">
	              <div className={`rounded-2xl border p-6 ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'} shadow-sm`}>
	                <button onClick={()=>restoreReturnTarget('library')} className={`flex items-center gap-2 mb-4 font-bold ${dm?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/>Voltar</button>
	                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
	                  <div>
	                    <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${dm?'text-yellow-500/80':'text-yellow-700/80'}`}>Fila global</p>
	                    <h2 className="text-3xl font-serif font-bold text-yellow-600">Revisão Espaçada</h2>
	                    <p className={`text-sm mt-1 ${dm?'text-gray-400':'text-gray-500'}`}>
	                      {[QUICK_SUBJECT_TITLE, 'Oráculo', canSeeVideoaulas ? 'Portal do Curso' : null, 'Academia', 'Acervo Externo'].filter(Boolean).join(', ')} no mesmo lugar.
	                    </p>
	                  </div>
	                  <div className={`rounded-xl border px-4 py-3 ${dm?'bg-gray-950 border-gray-800':'bg-gray-50 border-gray-100'}`}>
	                    <p className="text-2xl font-serif font-bold text-yellow-600">{dueItems.length}</p>
	                    <p className={`text-xs font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>pendente{dueItems.length!==1?'s':''}</p>
	                  </div>
	                </div>
	              </div>

	              {dueItems.length === 0 ? (
	                <EmptyState
	                  darkMode={dm}
	                  icon={<RepeatIcon className="w-7 h-7"/>}
	                  title="Nenhuma revisão pendente"
	                  message="Quando terminar blocos, adicione as questões à fila para manter a memória em dia."
	                />
	              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={`text-sm font-bold ${dm?'text-gray-400':'text-gray-500'}`}>
                      {dueQuestionItems.length} quest{dueQuestionItems.length===1?'ão':'ões'} · {dueFlashcardItems.length} flashcard{dueFlashcardItems.length!==1?'s':''}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={!dueQuestionItems.length}
                        onClick={()=>setReviewSession({items:dueQuestionItems,index:0,sessionAnswers:{}})}
                        className="flex items-center gap-2 px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold text-sm disabled:opacity-35"
                      >
                        <RepeatIcon className="w-4 h-4"/>Revisar questões
                      </button>
                      <button
                        disabled={!dueFlashcardItems.length}
                        onClick={()=>setReviewSession({items:dueFlashcardItems,index:0,sessionAnswers:{}})}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-bold text-sm disabled:opacity-35 ${dm?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50'}`}
                      >
                        <BrainIcon className="w-4 h-4"/>Revisar flashcards
                      </button>
                    </div>
                  </div>
                  <div className={`rounded-2xl border p-4 ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${dm?'text-gray-500':'text-gray-400'}`}>Distribuição da fila</p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {(intervalSummary.length ? intervalSummary : [{label:'hoje', count:dueItems.length}]).map(item=>(
                        <div key={item.label} className={`rounded-xl border px-3 py-2 text-center ${dm?'bg-gray-950/60 border-gray-800':'bg-gray-50 border-gray-100'}`}>
                          <p className="text-lg font-serif font-bold text-yellow-600">{item.count}</p>
                          <p className={`text-[10px] font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
	              )}
	            </div>
	          );
}
