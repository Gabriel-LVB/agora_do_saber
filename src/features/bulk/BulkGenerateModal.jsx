import React from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';

export default function BulkGenerateModal() {
  const {
    bulkGenerateModal,
    setBulkGenerateModal,
    library,
    bulkGenerateRun,
    darkMode,
    isAdmin,
    canUseAdvancedFeatures,
    settingsRef,
    getBulkOperationMeta,
    getBulkGenerateTargets,
    getDefaultBulkConfig,
    getConfiguredGeminiKeys,
    startBulkGenerate,
    saveSettings,
    ExplanationLengthSelector,
    QuestionTypeSelector,
    QuestionStyleSelector,
    isMemoryCardType,
    memoryCardTypeName,
    AlertTriangle,
    RotateCcw,
    Zap,
    Spinner,
  } = useFeatureContext();
  if (!bulkGenerateModal) return null;

	        const subject = library.find(s => s.id === bulkGenerateModal.subjectId);
          const mode = bulkGenerateModal.mode || 'generate';
          const operation = getBulkOperationMeta(mode, subject?.source);
	        const pending = getBulkGenerateTargets(subject, mode);
	        const isAcademiaBulk = subject?.source === 'academia';
	        const isOracleBulk = subject?.source === 'gemini';
	        const keyCount = getConfiguredGeminiKeys(settingsRef.current).length;
	        const closeOrStartBulk = pending.length ? startBulkGenerate : (() => setBulkGenerateModal(null));
          const cfg = bulkGenerateModal.config || getDefaultBulkConfig(mode);
          const updateBulkConfig = (patch) => setBulkGenerateModal(p=>({...p, config:{...(p?.config||{}), ...patch}}));
          const showsLessonConfig = isAcademiaBulk && ['generate','regenAll','regenLesson'].includes(mode);
          const showsQuestionConfig = isAcademiaBulk && ['generate','extra','regenAll','regenQuestions'].includes(mode);
          const showsOracleQuestionConfig = isOracleBulk && ['generate','regenQuestions'].includes(mode);
          const isDestructiveBulk = ['regenAll','regenLesson','regenQuestions'].includes(mode);
	        return (
	          <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4" onClick={()=>{if(!bulkGenerateRun.running)setBulkGenerateModal(null);}}>
		            <div className={`w-full max-w-3xl rounded-2xl border overflow-y-auto ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`} style={{maxHeight:'calc(100dvh - 2rem)'}} onClick={e=>e.stopPropagation()}>
                  <div className="p-4 pb-0 sm:p-6 sm:pb-0">
		              <div className="flex items-start justify-between gap-4 mb-4">
		                <div className="min-w-0">
		                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Operação em lote</p>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-yellow-600 flex items-center gap-2.5">{isDestructiveBulk?<RotateCcw className="w-5 h-5 flex-shrink-0"/>:<Zap className="w-5 h-5 flex-shrink-0"/>}<span className="truncate">{operation.title}</span></h3>
                      <p className="text-sm opacity-45 mt-1 truncate">{subject?.title}</p>
		                </div>
		                <button type="button" aria-label="Fechar" disabled={bulkGenerateRun.running} onClick={()=>setBulkGenerateModal(null)} className={`p-2 rounded-lg disabled:opacity-30 ${darkMode?'hover:bg-gray-700 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>✕</button>
		              </div>

		              <div className={`grid grid-cols-3 rounded-xl border mb-4 divide-x ${darkMode?'border-gray-700 divide-gray-700 bg-gray-900/30':'border-gray-200 divide-gray-200 bg-gray-50'}`}>
                    <div className="px-3 py-3 sm:px-4"><p className="text-[10px] font-bold uppercase opacity-40">Blocos</p><p className="text-lg font-bold tabular-nums mt-0.5">{pending.length}</p></div>
                    <div className="px-3 py-3 sm:px-4"><p className="text-[10px] font-bold uppercase opacity-40">Chaves</p><p className="text-lg font-bold tabular-nums mt-0.5">{keyCount}</p></div>
                    <div className="px-3 py-3 sm:px-4 min-w-0"><p className="text-[10px] font-bold uppercase opacity-40">Estado</p><p className={`text-sm font-bold mt-1 truncate ${bulkGenerateRun.running?'text-yellow-500':pending.length?'text-green-500':'opacity-40'}`}>{bulkGenerateRun.running?'Executando':pending.length?'Pronto':'Concluído'}</p></div>
		              </div>
		              <div className={`rounded-lg border px-3 py-2.5 mb-4 flex items-start gap-2 text-xs leading-relaxed ${darkMode?'border-yellow-800/50 bg-yellow-900/10 text-yellow-100':'border-yellow-200 bg-yellow-50 text-yellow-900'}`}>
		                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-600"/>
                    <p>Processa um bloco por vez e pode consumir muitas requisições. Mantenha esta aba aberta durante a execução.</p>
		              </div>
                {isAcademiaBulk && !bulkGenerateRun.running && (
                  <div className={`rounded-xl border p-4 mb-5 space-y-5 ${darkMode?'border-gray-700 bg-gray-900/30':'border-gray-200 bg-gray-50'}`}>
                    {showsLessonConfig && (
                      <div>
                        <div className="text-xs font-bold uppercase mb-2 opacity-50">Profundidade da aula</div>
                        <ExplanationLengthSelector value={cfg.explanationLength} onChange={v=>updateBulkConfig({explanationLength:v})} darkMode={darkMode}/>
                      </div>
                    )}
                    {isDestructiveBulk && showsLessonConfig && (
                      <div>
                        <div className="text-xs font-bold uppercase mb-2 opacity-50">Instrução extra <span className="normal-case font-normal opacity-70">(opcional)</span></div>
                        <textarea value={cfg.regenReason || ''} onChange={e=>updateBulkConfig({regenReason:e.target.value})}
                          placeholder="Ex: deixar mais direto, focar em conduta, reduzir enrolação..."
                          className={`w-full h-20 p-3 rounded-xl border resize-none outline-none focus:ring-2 focus:ring-yellow-500 text-sm ${darkMode?'bg-gray-800 border-gray-700 text-white placeholder-gray-500':'bg-white border-gray-200 placeholder-gray-400'}`}/>
                      </div>
                    )}
                    {showsQuestionConfig && (
                      <div>
                        <div className="text-xs font-bold uppercase mb-2 opacity-50">Tipo de questão</div>
	                        <QuestionTypeSelector
                          selected={cfg.questionTypes || ['direct']}
                          onChange={v=>updateBulkConfig({questionTypes:v, ...(v[0]==='vof'?{numAlternatives:5}:null)})}
                          darkMode={darkMode}
                          single={true}
                          isAdmin={isAdmin}
                          canCreateFlashcards={canUseAdvancedFeatures}
                          renderTypeDetails={type => type.k === 'direct' ? (
                            <div className={`mt-2 w-full rounded-xl border-2 p-4 space-y-4 ${darkMode?'border-gray-700 bg-gray-900/40':'border-gray-200 bg-white'}`}>
                              <div>
                                <div className="text-[11px] font-bold uppercase mb-2 opacity-50">Alternativas</div>
                                <div className="flex gap-2">
                                  {[4,5].map(n=>(
                                    <button key={n} onClick={()=>updateBulkConfig({numAlternatives:n})}
                                      className={`flex-1 min-h-[44px] rounded-xl border-2 text-sm font-bold transition-all ${Number(cfg.numAlternatives)===n?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-700 text-gray-300 hover:border-gray-500':'border-gray-200 text-gray-700 hover:border-gray-300')}`}>
                                      {n} (A-{n===4?'D':'E'})
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <div className="text-[11px] font-bold uppercase mb-2 opacity-50">Estilo</div>
                                <QuestionStyleSelector value={cfg.questionStyle} onChange={value=>updateBulkConfig({questionStyle:value})} darkMode={darkMode}/>
                              </div>
                            </div>
                          ) : type.k === 'vof' ? (
                            <div className={`mt-2 w-full rounded-xl border-2 p-4 ${darkMode?'border-gray-700 bg-gray-900/40':'border-gray-200 bg-white'}`}>
                              <div className="text-[11px] font-bold uppercase mb-2 opacity-50">Afirmações</div>
                              <div className="grid grid-cols-3 gap-2">
                                {[3,4,5].map(n=>(
                                  <button key={n} onClick={()=>updateBulkConfig({vofStatementCount:n,numAlternatives:5})}
                                    className={`min-h-[44px] rounded-xl border-2 text-sm font-bold transition-all ${Number(cfg.vofStatementCount || 5)===n?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-700 text-gray-300 hover:border-gray-500':'border-gray-200 text-gray-700 hover:border-gray-300')}`}>
                                    {n}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        />
                      </div>
                    )}
                  </div>
                )}
                {!isAcademiaBulk && !bulkGenerateRun.running && (
                  <div className={`rounded-xl border p-4 mb-5 space-y-4 ${darkMode?'border-gray-700 bg-gray-900/30':'border-gray-200 bg-gray-50'}`}>
                    {showsOracleQuestionConfig && isDestructiveBulk && (
                      <div>
                        <div className="text-xs font-bold uppercase mb-2 opacity-50">Instrução extra <span className="normal-case font-normal opacity-70">(opcional)</span></div>
                        <textarea value={cfg.regenReason || ''} onChange={e=>updateBulkConfig({regenReason:e.target.value})}
                          placeholder="Opcional: deixe mais difícil, mude o foco, evite um tipo de questão..."
                          className={`w-full h-20 p-3 rounded-xl border resize-none outline-none focus:ring-2 focus:ring-yellow-500 text-sm ${darkMode?'bg-gray-800 border-gray-700 text-white placeholder-gray-500':'bg-white border-gray-200 placeholder-gray-400'}`}/>
                      </div>
                    )}
	                    {showsOracleQuestionConfig && (
	                      <div>
	                        <div className="text-xs font-bold uppercase mb-2 opacity-50">Tipo de questão</div>
		                        <QuestionTypeSelector
                            selected={cfg.questionTypes || ['direct']}
                            onChange={v=>updateBulkConfig({questionTypes:v, ...(v[0]==='vof'?{numAlternatives:5}:null)})}
                            darkMode={darkMode}
                            single={true}
                            isAdmin={isAdmin}
                            canCreateFlashcards={canUseAdvancedFeatures}
                            renderTypeDetails={type => type.k === 'direct' ? (
                              <div className={`mt-2 w-full rounded-xl border-2 p-4 space-y-4 ${darkMode?'border-gray-700 bg-gray-900/40':'border-gray-200 bg-white'}`}>
                                <div>
                                  <div className="text-[11px] font-bold uppercase mb-2 opacity-50">Alternativas</div>
                                  <div className="flex gap-2">
                                    {[4,5].map(n=>(
                                      <button key={n} onClick={()=>updateBulkConfig({numAlternatives:n})}
                                        className={`flex-1 min-h-[44px] rounded-xl border-2 text-sm font-bold transition-all ${Number(cfg.numAlternatives)===n?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-700 text-gray-300 hover:border-gray-500':'border-gray-200 text-gray-700 hover:border-gray-300')}`}>
                                        {n} (A-{n===4?'D':'E'})
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[11px] font-bold uppercase mb-2 opacity-50">Estilo</div>
                                  <QuestionStyleSelector value={cfg.questionStyle} onChange={value=>updateBulkConfig({questionStyle:value})} darkMode={darkMode}/>
                                </div>
                              </div>
                            ) : type.k === 'vof' ? (
                              <div className={`mt-2 w-full rounded-xl border-2 p-4 ${darkMode?'border-gray-700 bg-gray-900/40':'border-gray-200 bg-white'}`}>
                                <div className="text-[11px] font-bold uppercase mb-2 opacity-50">Afirmações</div>
                                <div className="grid grid-cols-3 gap-2">
                                  {[3,4,5].map(n=>(
                                    <button key={n} onClick={()=>updateBulkConfig({vofStatementCount:n,numAlternatives:5})}
                                      className={`min-h-[44px] rounded-xl border-2 text-sm font-bold transition-all ${Number(cfg.vofStatementCount || 5)===n?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-700 text-gray-300 hover:border-gray-500':'border-gray-200 text-gray-700 hover:border-gray-300')}`}>
                                      {n}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          />
	                      </div>
	                    )}
	                    {showsOracleQuestionConfig && (cfg.questionTypes || []).some(isMemoryCardType) && (
                      <div className={`rounded-xl border p-3 text-xs leading-relaxed ${darkMode?'border-yellow-800/50 bg-yellow-900/10 text-yellow-200':'border-yellow-200 bg-yellow-50 text-yellow-800'}`}>
                        {memoryCardTypeName(cfg.questionTypes || [])}: a IA decide a quantidade ideal, sem meta fixa por subtópico.
                      </div>
                    )}
                  </div>
                )}
		              <div className={`rounded-xl border overflow-hidden mb-5 ${darkMode?'border-gray-700':'border-gray-200'}`}>
		                <div className={`px-4 py-3 border-b flex items-center justify-between ${darkMode?'border-gray-700 bg-gray-900/30':'border-gray-100 bg-gray-50'}`}>
		                  <span className="text-xs font-bold uppercase tracking-widest opacity-50">Andamento</span>
		                  <span className="text-xs font-bold text-yellow-600">{bulkGenerateRun.running ? `${bulkGenerateRun.current}/${bulkGenerateRun.total}` : `${pending.length} alvo${pending.length!==1?'s':''}`}</span>
		                </div>
		                <div className="max-h-64 overflow-y-auto p-3 space-y-2">
		                  {bulkGenerateRun.logs.length===0&&<div className="py-4 text-center">
                        <Zap className="w-5 h-5 mx-auto text-yellow-600 opacity-50"/>
                        <p className="text-sm font-bold mt-2">Pronto para iniciar</p>
                        <p className="text-xs opacity-45 mt-1">O progresso de cada bloco aparecerá aqui.</p>
                      </div>}
	                  {bulkGenerateRun.logs.map(log => {
	                    const cls = log.type==='success'
	                      ? (darkMode?'text-green-400':'text-green-700')
	                      : log.type==='error'
	                        ? (darkMode?'text-red-400':'text-red-700')
	                        : log.type==='loading'
	                          ? (darkMode?'text-yellow-300':'text-yellow-700')
	                          : (darkMode?'text-gray-300':'text-gray-700');
	                    return (
	                      <div key={log.id} className={`text-sm rounded-lg px-3 py-2 ${darkMode?'bg-gray-900/40':'bg-gray-50'}`}>
	                        <span className="opacity-40 font-mono mr-2">{log.time}</span>
	                        <span className={cls}>{log.msg}</span>
	                      </div>
	                    );
		                  })}
		                </div>
		              </div>
                  </div>
		              <div className={`sticky bottom-0 flex gap-3 px-4 py-3 sm:px-6 sm:py-4 border-t ${darkMode?'border-gray-700 bg-gray-800':'border-gray-200 bg-white'}`}>
	                <button disabled={bulkGenerateRun.running} onClick={()=>setBulkGenerateModal(null)} className={`flex-1 py-3 rounded-xl font-bold disabled:opacity-40 ${darkMode?'bg-gray-700 hover:bg-gray-600':'bg-gray-100 hover:bg-gray-200'}`}>{bulkGenerateRun.running?'Rodando...':'Cancelar'}</button>
	                <button onClick={()=>{
                    if (pending.length && !bulkGenerateRun.running) {
                      const persist = {};
                      if (isAcademiaBulk && showsLessonConfig) persist.explanationLength = cfg.explanationLength;
                      if (isAcademiaBulk && showsQuestionConfig) {
                        persist.questionStyle = cfg.questionStyle;
                        persist.questionTypes = cfg.questionTypes;
                        persist.numAlternatives = cfg.numAlternatives;
                        persist.vofStatementCount = cfg.vofStatementCount;
                        persist.adminChunkedQuestions = true;
                      }
	                      if (showsOracleQuestionConfig) {
	                        persist.questionStyle = cfg.questionStyle;
	                        persist.questionTypes = cfg.questionTypes;
	                        persist.qPerSubAuto = true;
	                        persist.numAlternatives = cfg.numAlternatives;
                          persist.vofStatementCount = cfg.vofStatementCount;
                        persist.adminChunkedQuestions = true;
                      }
                      persist.geminiThinkingEnabled = !!cfg.geminiThinkingEnabled;
                      if (Object.keys(persist).length) saveSettings({...settingsRef.current, ...persist});
                    }
                    closeOrStartBulk();
                  }} disabled={bulkGenerateRun.running || !subject} className="flex-1 bg-yellow-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {bulkGenerateRun.running ? <Spinner className="w-4 h-4 text-white"/> : isDestructiveBulk ? <RotateCcw className="w-4 h-4"/> : <Zap className="w-4 h-4"/>}
	                  {bulkGenerateRun.running ? 'Rodando...' : pending.length ? operation.verb : 'Nada para fazer'}
	                </button>
	              </div>
	            </div>
	          </div>
	        );
}
