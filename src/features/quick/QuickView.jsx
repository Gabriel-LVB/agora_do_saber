import React from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';

export default function QuickView() {
  const {
    ArrowLeft,
    createQuickSession,
    darkMode,
    EmptyState,
    ExplanationLengthSelector,
    exportFlashcardsToAnki,
    GeminiThinkingSelector,
    isAdmin,
    openQuickSession,
    QUICK_SOURCE,
    QUICK_SUBJECT_TITLE,
    quickContext,
    quickGenerating,
    quickSessions,
    restoreReturnTarget,
    saveSettings,
    Send,
    setDeleteId,
    setQuickContext,
    setSettings,
    settings,
    settingsRef,
    Sparkles,
    Spinner,
    Trash2,
    Zap,
  } = useFeatureContext();

          const dm = darkMode;
          const totalFlashcards = quickSessions.reduce((sum, topic) => sum + (topic.questions || []).filter(q => q.isFlashcard).length, 0);
          const totalQuestions = quickSessions.reduce((sum, topic) => sum + (topic.questions || []).filter(q => !q.isFlashcard).length, 0);
          const panel = dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
          return (
            <div className="space-y-6">
              <section className="app-hero rounded-2xl p-5 md:p-6">
                <button onClick={()=>restoreReturnTarget('library')} className={`flex items-center gap-2 mb-4 font-bold ${dm?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}>
                  <ArrowLeft className="w-4 h-4"/>Início
                </button>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${dm?'text-yellow-500/80':'text-yellow-700/80'}`}>Estudo rápido</p>
                    <h2 className="text-3xl mobile-title-lg mobile-wrap font-serif font-bold text-yellow-600 leading-tight">{QUICK_SUBJECT_TITLE}</h2>
                    <p className={`text-sm mt-2 max-w-2xl mobile-safe-text ${dm?'text-gray-400':'text-gray-600'}`}>Para lacunas pontuais: jogue o tema, receba uma explicação curta, questões e flashcards para revisar na hora.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
                    {[
                      ['Centelhas', quickSessions.length],
                      ['Questões', totalQuestions],
                      ['Flashcards', totalFlashcards],
                    ].map(([label, value])=>(
                      <div key={label} className={`mobile-stat-card min-w-0 rounded-xl border px-4 py-3 text-center ${dm?'bg-gray-950/70 border-gray-800':'bg-white/80 border-yellow-100'}`}>
                        <p className="text-2xl font-serif font-bold text-yellow-600">{value}</p>
                        <p className={`mobile-stat-label text-[11px] font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-5">
                <section className={`mobile-card-pad rounded-2xl border p-5 md:p-6 ${panel}`}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${dm?'bg-yellow-900/30 text-yellow-400':'bg-yellow-50 text-yellow-700'}`}>
                      <Zap className="w-5 h-5"/>
                    </div>
                    <div className="min-w-0">
                      <h3 className="mobile-wrap font-serif font-bold text-xl text-yellow-600 leading-tight">Nova centelha</h3>
                      <p className={`text-xs mobile-safe-text ${dm?'text-gray-500':'text-gray-400'}`}>Feito para resolver um assunto sem montar pasta.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-xs font-bold uppercase mb-2 ${dm?'text-gray-500':'text-gray-400'}`}>Dúvida rápida</label>
                      <textarea value={quickContext} onChange={e=>setQuickContext(e.target.value)} placeholder="Ex: meu professor perguntou como pesquisar o sinal de Jobert e eu travei. Quero entender o que é, como faz e por que indica pneumoperitônio." className={`w-full h-44 p-4 rounded-xl border resize-none outline-none focus:ring-2 focus:ring-yellow-500 mobile-safe-text ${dm?'bg-gray-950 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase mb-2 ${dm?'text-gray-500':'text-gray-400'}`}>Tamanho da explicação</label>
                      <ExplanationLengthSelector
                        value={settings.quickExplanationLength || 'essential'}
                        onChange={value=>{
                          const ns = {...settingsRef.current, quickExplanationLength:value};
                          setSettings(ns);
                          saveSettings(ns);
                        }}
                        darkMode={dm}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase mb-2 ${dm?'text-gray-500':'text-gray-400'}`}>Gemini</label>
                      <GeminiThinkingSelector value={!!settings.geminiThinkingEnabled} onChange={enabled=>{const ns={...settingsRef.current,geminiThinkingEnabled:enabled};setSettings(ns);saveSettings(ns);}} darkMode={dm} compact/>
                    </div>
                    <button onClick={createQuickSession} disabled={quickGenerating || !quickContext.trim()} className="w-full min-h-[56px] bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-4 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                      {quickGenerating ? <Spinner className="w-5 h-5 text-white"/> : <Sparkles className="w-5 h-5"/>}
                      {quickGenerating ? 'Gerando centelha...' : 'Gerar centelha'}
                    </button>
                  </div>
                </section>

                <section className={`rounded-2xl border overflow-hidden ${panel}`}>
                  <div className={`px-5 py-4 border-b ${dm?'border-gray-800':'border-gray-100'}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Histórico</p>
                    <h3 className="font-serif font-bold text-xl text-yellow-600">Centelhas salvas</h3>
                  </div>
                  {quickSessions.length===0 ? (
                    <div className="p-6">
                      <EmptyState darkMode={dm} icon={<Zap className="w-7 h-7"/>} title="Nenhuma centelha ainda" message="Crie a primeira a partir de uma dúvida específica."/>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {quickSessions.map(topic=>{
                        const qs = (topic.questions || []).filter(q => !q.isFlashcard);
                        const fcs = (topic.questions || []).filter(q => q.isFlashcard);
                        const answered = Object.keys(topic.answers || {}).filter(id => (topic.questions || []).some(q => q.id === id)).length;
                        const created = topic.createdAt ? new Date(topic.createdAt).toLocaleDateString('pt-BR') : '';
                        return (
                          <div key={topic.id} className={`p-4 md:p-5 transition-colors ${dm?'hover:bg-gray-800/60':'hover:bg-gray-50'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <button onClick={()=>openQuickSession(topic)} className="min-w-0 flex-1 text-left">
                                <h4 className="font-bold text-base truncate">{topic.title}</h4>
                                <p className={`text-xs mt-1 ${dm?'text-gray-500':'text-gray-400'}`}>{created} · {qs.length} questões · {fcs.length} flashcards · {answered}/{(topic.questions||[]).length} respondidas</p>
                                {topic.quickContext&&<p className={`text-sm mt-2 line-clamp-2 ${dm?'text-gray-400':'text-gray-600'}`}>{topic.quickContext}</p>}
                              </button>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isAdmin&&fcs.length>0&&(
                                  <button onClick={()=>exportFlashcardsToAnki({questions:fcs,title:topic.title,subjectTitle:topic.title,deckTitle:QUICK_SUBJECT_TITLE,source:QUICK_SOURCE})} title="Enviar flashcards para Anki" aria-label="Enviar flashcards para Anki" className={`h-9 w-9 rounded-xl border flex items-center justify-center ${dm?'border-gray-700 text-yellow-400 hover:bg-gray-800':'border-gray-200 text-yellow-700 hover:bg-yellow-50'}`}>
                                    <Send className="w-4 h-4"/>
                                  </button>
                                )}
                                  <button onClick={()=>setDeleteId({type:'quick-topic', id:topic.id})} title="Excluir centelha" aria-label="Excluir centelha" className={`h-9 w-9 rounded-xl border flex items-center justify-center ${dm?'border-gray-700 text-red-400 hover:bg-red-950/30':'border-red-100 text-red-500 hover:bg-red-50'}`}>
                                  <Trash2 className="w-4 h-4"/>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            </div>
          );
}
