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
    getTopicStudyPlan,
    startBulkGenerate,
    saveSettings,
    ExplanationLengthSelector,
    QuestionTypeSelector,
    QuestionStyleSelector,
    GeminiThinkingSelector,
    isMemoryCardType,
    memoryCardTypeName,
    AlertTriangle,
    ShieldAlert,
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
          const isAuditBulk = ['audit','auditMissing'].includes(mode);
          const isDestructiveBulk = ['regenAll','regenLesson','regenQuestions','audit','auditMissing'].includes(mode);
          const hasBulkStudyPlan = isOracleBulk && (subject?.topics || []).length > 0 && (subject?.topics || []).every(topic =>
            getTopicStudyPlan(topic, topic.subtopics || []).length > 0
          );
	        return (
	          <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4" onClick={()=>{if(!bulkGenerateRun.running)setBulkGenerateModal(null);}}>
		            <div className={`w-full max-w-3xl rounded-2xl border overflow-y-auto ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`} style={{maxHeight:'calc(100dvh - 2rem)'}} onClick={e=>e.stopPropagation()}>
                  <div className="p-4 pb-0 sm:p-6 sm:pb-0">
		              <div className="flex items-start justify-between gap-4 mb-4">
		                <div className="min-w-0">
		                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Operação em lote</p>
		                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-yellow-600 flex items-center gap-2.5">{isAuditBulk?<ShieldAlert className="w-5 h-5 flex-shrink-0"/>:isDestructiveBulk?<RotateCcw className="w-5 h-5 flex-shrink-0"/>:<Zap className="w-5 h-5 flex-shrink-0"/>}<span className="truncate">{operation.title}</span></h3>
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
	                        <QuestionTypeSelector selected={cfg.questionTypes || ['direct']} onChange={v=>updateBulkConfig({questionTypes:v})} darkMode={darkMode} single={true} isAdmin={isAdmin} canCreateFlashcards={canUseAdvancedFeatures}/>
                      </div>
                    )}
                    {showsQuestionConfig && (cfg.questionTypes || ['direct']).some(t=>['direct','vof','cespe'].includes(t)) && (
                      <div>
                        <div className="text-xs font-bold uppercase mb-2 opacity-50">Estilo</div>
                        <QuestionStyleSelector value={cfg.questionStyle} onChange={value=>updateBulkConfig({questionStyle:value})} darkMode={darkMode}/>
                      </div>
                    )}
                    {showsQuestionConfig && !(cfg.questionTypes || []).some(isMemoryCardType) && (
                      <div>
                        <div className="text-xs font-bold uppercase mb-2 opacity-50">Alternativas</div>
                        <div className="flex gap-2">
                          {[4,5].map(n=>(
                            <button key={n} onClick={()=>updateBulkConfig({numAlternatives:n})}
                              className={`flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-all ${Number(cfg.numAlternatives)===n?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-600 bg-gray-800 text-gray-300':'border-gray-200 bg-white text-gray-700')}`}>
                              {n} (A-{n===4?'D':'E'})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold uppercase mb-2 opacity-50">Modo Gemini</div>
                      <GeminiThinkingSelector value={!!cfg.geminiThinkingEnabled} onChange={v=>updateBulkConfig({geminiThinkingEnabled:v})} darkMode={darkMode}/>
                    </div>
                    {isAdmin && showsQuestionConfig && !isAuditBulk && !(cfg.questionTypes || []).some(isMemoryCardType) && (
                      <button type="button" onClick={()=>updateBulkConfig({adminChunkedQuestions:!cfg.adminChunkedQuestions})}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${cfg.adminChunkedQuestions?(darkMode?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(darkMode?'border-gray-600 bg-gray-800':'border-gray-200 bg-white')}`}>
                        <div>
                          <p className={`text-sm font-bold ${cfg.adminChunkedQuestions?'text-yellow-500':''}`}>Geração em lotes</p>
                          <p className="text-xs opacity-50 mt-0.5">Divide fixações e baterias extras grandes em requests de até 15 questões.</p>
                        </div>
                        <div style={{width:40,height:24,borderRadius:12,padding:2,background:cfg.adminChunkedQuestions?'#ca8a04':'#9ca3af',transition:'background 0.2s',flexShrink:0,display:'flex',alignItems:'center'}}>
                          <div style={{width:20,height:20,borderRadius:10,background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.3)',transform:cfg.adminChunkedQuestions?'translateX(16px)':'translateX(0)',transition:'transform 0.2s'}}/>
                        </div>
                      </button>
                    )}
                    {isAdmin && !isAuditBulk && (
                      <button type="button" onClick={()=>updateBulkConfig({auditQuestions:!cfg.auditQuestions})}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${cfg.auditQuestions?(darkMode?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(darkMode?'border-gray-600 bg-gray-800':'border-gray-200 bg-white')}`}>
                        <div>
                          <p className={`text-sm font-bold ${cfg.auditQuestions?'text-yellow-500':''}`}>Auditoria</p>
                          <p className="text-xs opacity-50 mt-0.5">Segundo request após cada bloco para revisar qualidade e utilidade.</p>
                        </div>
                        <div style={{width:40,height:24,borderRadius:12,padding:2,background:cfg.auditQuestions?'#ca8a04':'#9ca3af',transition:'background 0.2s',flexShrink:0,display:'flex',alignItems:'center'}}>
                          <div style={{width:20,height:20,borderRadius:10,background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.3)',transform:cfg.auditQuestions?'translateX(16px)':'translateX(0)',transition:'transform 0.2s'}}/>
                        </div>
                      </button>
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
	                        <QuestionTypeSelector selected={cfg.questionTypes || ['direct']} onChange={v=>updateBulkConfig({questionTypes:v})} darkMode={darkMode} single={true} isAdmin={isAdmin} canCreateFlashcards={canUseAdvancedFeatures}/>
                      </div>
                    )}
                    {showsOracleQuestionConfig && !hasBulkStudyPlan && !(cfg.questionTypes || []).some(isMemoryCardType) && (
                      <div>
                        <div className="text-xs font-bold uppercase mb-2 opacity-50">Questões/Subtópico</div>
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <input type="number" min="1" max="10" value={cfg.qPerSub || 1}
                            disabled={!!cfg.qPerSubAuto}
                            onChange={e=>updateBulkConfig({qPerSub:Math.max(1,Math.min(10,parseInt(e.target.value,10)||1))})}
                            className={`w-full p-3 rounded-xl border text-center font-bold outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-40 ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
                          <button type="button" onClick={()=>updateBulkConfig({qPerSubAuto:!cfg.qPerSubAuto})}
                            className={`px-4 rounded-xl border-2 text-xs font-bold transition-all ${cfg.qPerSubAuto?(darkMode?'border-yellow-500 bg-yellow-900/20 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-600 bg-gray-800 text-gray-300':'border-gray-200 bg-white text-gray-700')}`}>
                            IA
                          </button>
                        </div>
                        <p className="text-[11px] opacity-50 mt-1">{cfg.qPerSubAuto?'A IA decide a quantidade, com piso de 2 cobranças por subtópico e mais quando o tema for denso.':'Quantidade fixa para cada subtópico.'}</p>
                      </div>
                    )}
                    {showsOracleQuestionConfig && (cfg.questionTypes || ['direct']).some(t=>['direct','vof','cespe'].includes(t)) && (
                      <div>
                        <div className="text-xs font-bold uppercase mb-2 opacity-50">Estilo</div>
                        <QuestionStyleSelector value={cfg.questionStyle} onChange={value=>updateBulkConfig({questionStyle:value})} darkMode={darkMode}/>
                      </div>
                    )}
                    {showsOracleQuestionConfig && !(cfg.questionTypes || []).some(isMemoryCardType) && (
                      <div>
                        <div className="text-xs font-bold uppercase mb-2 opacity-50">Alternativas</div>
                        <div className="flex gap-2">
                          {[4,5].map(n=>(
                            <button key={n} onClick={()=>updateBulkConfig({numAlternatives:n})}
                              className={`flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-all ${Number(cfg.numAlternatives)===n?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-600 bg-gray-800 text-gray-300':'border-gray-200 bg-white text-gray-700')}`}>
                              {n} (A-{n===4?'D':'E'})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {showsOracleQuestionConfig && (cfg.questionTypes || []).some(isMemoryCardType) && (
                      <div className={`rounded-xl border p-3 text-xs leading-relaxed ${darkMode?'border-yellow-800/50 bg-yellow-900/10 text-yellow-200':'border-yellow-200 bg-yellow-50 text-yellow-800'}`}>
                        {memoryCardTypeName(cfg.questionTypes || [])}: a IA decide a quantidade ideal, sem meta fixa por subtópico.
                      </div>
                    )}
                    <div className="text-xs font-bold uppercase mb-2 opacity-50">Modo Gemini</div>
                    <GeminiThinkingSelector value={!!cfg.geminiThinkingEnabled} onChange={v=>updateBulkConfig({geminiThinkingEnabled:v})} darkMode={darkMode}/>
                    {isAdmin && showsOracleQuestionConfig && !isAuditBulk && !(cfg.questionTypes || []).some(isMemoryCardType) && (
                      <button type="button" onClick={()=>updateBulkConfig({adminChunkedQuestions:!cfg.adminChunkedQuestions})}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${cfg.adminChunkedQuestions?(darkMode?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(darkMode?'border-gray-600 bg-gray-800':'border-gray-200 bg-white')}`}>
                        <div>
                          <p className={`text-sm font-bold ${cfg.adminChunkedQuestions?'text-yellow-500':''}`}>Geração em lotes</p>
                          <p className="text-xs opacity-50 mt-0.5">Divide blocos grandes em requests de até 15 questões, inclusive subtópicos muito longos.</p>
                        </div>
                        <div style={{width:40,height:24,borderRadius:12,padding:2,background:cfg.adminChunkedQuestions?'#ca8a04':'#9ca3af',transition:'background 0.2s',flexShrink:0,display:'flex',alignItems:'center'}}>
                          <div style={{width:20,height:20,borderRadius:10,background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.3)',transform:cfg.adminChunkedQuestions?'translateX(16px)':'translateX(0)',transition:'transform 0.2s'}}/>
                        </div>
                      </button>
                    )}
                    {isAdmin && !isAuditBulk && (
                      <button type="button" onClick={()=>updateBulkConfig({auditQuestions:!cfg.auditQuestions})}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${cfg.auditQuestions?(darkMode?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(darkMode?'border-gray-600 bg-gray-800':'border-gray-200 bg-white')}`}>
                        <div>
                          <p className={`text-sm font-bold ${cfg.auditQuestions?'text-yellow-500':''}`}>Auditoria</p>
                          <p className="text-xs opacity-50 mt-0.5">Segundo request após cada bloco para revisar qualidade e utilidade.</p>
                        </div>
                        <div style={{width:40,height:24,borderRadius:12,padding:2,background:cfg.auditQuestions?'#ca8a04':'#9ca3af',transition:'background 0.2s',flexShrink:0,display:'flex',alignItems:'center'}}>
                          <div style={{width:20,height:20,borderRadius:10,background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.3)',transform:cfg.auditQuestions?'translateX(16px)':'translateX(0)',transition:'transform 0.2s'}}/>
                        </div>
                      </button>
                    )}
                    {isAuditBulk && (
                      <div className={`rounded-xl border p-3 text-xs leading-relaxed ${darkMode?'border-yellow-800/50 bg-yellow-900/10 text-yellow-200':'border-yellow-200 bg-yellow-50 text-yellow-800'}`}>
                        Este modo não gera do zero: ele audita as questões já existentes, remove itens fracos e reescreve o bloco.
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
                        persist.adminChunkedQuestions = !!cfg.adminChunkedQuestions;
                      }
                      if (showsOracleQuestionConfig) {
                        persist.questionStyle = cfg.questionStyle;
                        persist.questionTypes = cfg.questionTypes;
                        persist.qPerSub = cfg.qPerSub;
                        persist.qPerSubAuto = !!cfg.qPerSubAuto;
                        persist.numAlternatives = cfg.numAlternatives;
                        persist.adminChunkedQuestions = !!cfg.adminChunkedQuestions;
                      }
                      persist.geminiThinkingEnabled = !!cfg.geminiThinkingEnabled;
                      persist.auditQuestions = !!cfg.auditQuestions;
                      if (Object.keys(persist).length) saveSettings({...settingsRef.current, ...persist});
                    }
                    closeOrStartBulk();
                  }} disabled={bulkGenerateRun.running || !subject} className="flex-1 bg-yellow-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2">
	                  {bulkGenerateRun.running ? <Spinner className="w-4 h-4 text-white"/> : isAuditBulk ? <ShieldAlert className="w-4 h-4"/> : isDestructiveBulk ? <RotateCcw className="w-4 h-4"/> : <Zap className="w-4 h-4"/>}
	                  {bulkGenerateRun.running ? 'Rodando...' : pending.length ? operation.verb : 'Nada para fazer'}
	                </button>
	              </div>
	            </div>
	          </div>
	        );
}
