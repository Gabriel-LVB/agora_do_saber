import React, { useEffect, useState } from 'react';

const ic = (d) => ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} dangerouslySetInnerHTML={{__html:d}}/>;
const BlockIcon = ic('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>');
const CheckCircle2 = ic('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>');
const CheckIcon = ic('<polyline points="20 6 9 17 4 12"/>');
const Clock = ic('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>');
const EditIcon = ic('<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>');
const FileText = ic('<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>');
const LayersIcon = ic('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>');
const RepeatIcon = ic('<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>');
const RotateCcw = ic('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>');
const ShieldAlert = ic('<path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3z"/><path d="M12 8v4"/><path d="M12 16h.01"/>');
const Sparkles = ic('<path d="m12 3 1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M3 5h4"/><path d="M19 17v4"/><path d="M17 19h4"/>');
const Spinner = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{animation:'spin 1s linear infinite',transformOrigin:'center'}}><style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const ADMIN_ORACLE_QUESTION_CHUNK_TARGET = 15;
const ADMIN_COURSE_TOPIC_QUESTION_MAX = 30;

const getCourseVqQuestionPlan = ({ durationSecs = 0, suggestedQ = 10, isAdmin = false, maxPerBlock = 20 }) => {
  if (isAdmin && durationSecs > 0) {
    const totalQ = Math.max(1, Math.ceil(durationSecs / 60));
    const qPerBlock = Math.min(ADMIN_COURSE_TOPIC_QUESTION_MAX, totalQ);
    return { totalQ, qPerBlock, numBlocks:Math.ceil(totalQ / qPerBlock), adminMinuteRule:true };
  }
  const raw = durationSecs > 0 ? Math.ceil(durationSecs / 120) : (suggestedQ || 10);
  const totalQ = Math.max(10, Math.round(raw / 10) * 10);
  const qPerBlock = Math.min(maxPerBlock, totalQ);
  return { totalQ, qPerBlock, numBlocks:Math.ceil(totalQ / qPerBlock), adminMinuteRule:false };
};
const isMemoryCardType = (type) => type === 'flashcard' || type === 'cloze';
const canUseQuestionType = (type, access = {}) => {
  if (type === 'cloze') return !!access.isAdmin;
  if (type === 'flashcard') return !!access.canCreateFlashcards;
  return true;
};
const filterQuestionTypesForAccess = (types = ['direct'], access = {}) => {
  const clean = (types || ['direct']).filter(type => canUseQuestionType(type, access));
  return clean.length ? clean : ['direct'];
};
const QUESTION_STYLE_OPTIONS = [
  { k:'hybrid', label:'Mistas', desc:'Gera diretas sobre os subtópicos e depois casos encadeados como teste clínico.' },
  { k:'mixed', label:'Casos encadeados', desc:'A IA decide quantos casos usar e faz várias questões progressivas sobre cada um.' },
  { k:'clinical', label:'Casos independentes', desc:'Cada questão apresenta uma situação clínica diferente.' },
  { k:'direct', label:'Diretas', desc:'Perguntas objetivas, sem caso clínico.' },
];
const QuestionStyleSelector = ({ value='mixed', onChange, darkMode=false }) => (
  <div className="grid grid-cols-1 gap-2">
    {QUESTION_STYLE_OPTIONS.map(option=>(
      <button type="button" key={option.k} onClick={()=>onChange(option.k)}
        className={`w-full rounded-xl border-2 px-3 py-3 text-left transition-all ${
          value===option.k
            ? (darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-300':'border-yellow-500 bg-yellow-50 text-yellow-800')
            : (darkMode?'border-gray-700 bg-gray-800/70 text-gray-200 hover:border-gray-500':'border-gray-200 bg-white text-gray-700 hover:border-gray-300')
        }`}>
        <span className="block text-sm font-bold leading-tight">{option.label}</span>
        <span className="mt-1 block text-xs font-normal leading-snug opacity-65">{option.desc}</span>
      </button>
    ))}
  </div>
);
// ─── QUESTION TYPE SELECTOR// ─── QUESTION TYPE SELECTOR ───────────────────────────────────────────────────
const QUESTION_TYPES = [
  { k:'direct', group:'closed', icon:CheckCircle2, label:'Múltipla escolha', desc:'Alternativas com apenas uma resposta correta' },
  { k:'vof', group:'closed', icon:LayersIcon, label:'Verdadeiro ou falso', desc:'Várias afirmações avaliadas na mesma questão' },
  { k:'cespe', group:'closed', icon:ShieldAlert, label:'Certo ou errado', desc:'Uma afirmação para julgar, no estilo Cebraspe' },
  { k:'open', group:'open', icon:EditIcon, label:'Resposta curta', desc:'Resposta breve com correção e feedback da IA' },
  { k:'essay', group:'open', icon:FileText, label:'Dissertativa', desc:'Resposta longa com avaliação detalhada da IA' },
  { k:'old_exam', group:'import', icon:BlockIcon, label:'Questões já existentes', desc:'Preserva conteúdo e corrige apenas OCR e formatação', externalOnly:true },
  { k:'flashcard', group:'memory', icon:RepeatIcon, label:'Flashcards', desc:'Pergunta e resposta para recuperação ativa', advancedOnly:true },
  { k:'cloze', group:'memory', icon:LayersIcon, label:'Preencher lacunas', desc:'Cartões com omissões no estilo AnKing e Anki', adminOnly:true },
];

const QuestionTypeSelector = ({ selected=[], onChange, darkMode, single=false, isAdmin=false, canCreateFlashcards=false, includeExternalOnly=false }) => {
  const dm = darkMode;
  const toggle = (k) => {
    if (single) { onChange([k]); return; }
    const next = selected.includes(k) ? selected.filter(x=>x!==k) : [...selected, k];
    if (next.length === 0) return;
    onChange(next);
  };
  const visibleTypes = QUESTION_TYPES
    .filter(t => includeExternalOnly || !t.externalOnly)
    .filter(t => !t.adminOnly || isAdmin)
    .filter(t => !t.advancedOnly || canCreateFlashcards || isAdmin);
  const groups = [
    { k:'closed', label:'Questões objetivas', desc:'Escolha ou julgue uma resposta', icon:CheckCircle2 },
    { k:'open', label:'Respostas abertas', desc:'Escreva e receba correção da IA', icon:EditIcon },
    { k:'memory', label:'Memorização ativa', desc:'Revise até conseguir recuperar a resposta', icon:RepeatIcon },
    { k:'import', label:'Importação', desc:'Trabalhe com questões que já existem', icon:BlockIcon },
  ].filter(group => visibleTypes.some(type => type.group === group.k));
  return (
    <div className="space-y-5">
      {groups.map(group => {
        const GroupIcon = group.icon;
        return (
          <section key={group.k}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <GroupIcon className="w-4 h-4 text-yellow-600"/>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">{group.label}</p>
                <p className="text-[11px] opacity-45">{group.desc}</p>
              </div>
            </div>
            <div className="space-y-2">
              {visibleTypes.filter(t => t.group === group.k).map(t => {
                const on = selected.includes(t.k);
                const TypeIcon = t.icon;
                return (
                  <button key={t.k} onClick={()=>toggle(t.k)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${on?(dm?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(dm?'border-gray-600 bg-gray-800 hover:border-gray-500':'border-gray-200 bg-white hover:border-gray-300')}`}>
                    <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center ${on?(dm?'bg-yellow-900/50 text-yellow-300':'bg-yellow-100 text-yellow-700'):(dm?'bg-gray-700 text-gray-400':'bg-gray-100 text-gray-500')}`}>
                      <TypeIcon className="w-4 h-4"/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold ${on?'text-yellow-500':''}`}>{t.label}</p>
                      <p className="text-xs opacity-50 mt-0.5">{t.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded${single?'-full':''} flex-shrink-0 flex items-center justify-center border-2 ${on?'bg-yellow-500 border-yellow-500':'border-gray-400'}`}>
                      {on && <CheckIcon className="w-3 h-3 text-white"/>}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};
const GeminiThinkingSelector = ({ value=false, onChange, darkMode, compact=false }) => {
  const dm = darkMode;
  const opts = [
    { k:false, label:'Rápido', desc:'thinking desligado' },
    { k:true, label:'Thinking', desc:'raciocínio dinâmico' },
  ];
  return (
    <div className={`grid grid-cols-2 gap-2 ${compact ? '' : 'w-full'}`}>
      {opts.map(opt => {
        const on = !!value === opt.k;
        return (
          <button key={String(opt.k)} type="button" onClick={()=>onChange(opt.k)}
            className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition-all text-center ${on?(dm?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500':'border-gray-200 bg-white text-gray-700 hover:border-gray-300')}`}>
            {opt.label}
            {!compact && <p className="font-normal opacity-60 mt-1 leading-snug">{opt.desc}</p>}
          </button>
        );
      })}
    </div>
  );
};
const VqGenModal = ({ aula, aulaId, suggestedQ, subject, topic, isReset, darkMode, onClose, onConfirm, loading, savedSettings={}, isAdmin=false, canCreateFlashcards=false }) => {
  const dm = darkMode;
  const MAX_PER_BLOCK = isAdmin ? ADMIN_COURSE_TOPIC_QUESTION_MAX : 20;

  const [lessonMeta, setLessonMeta]   = useState(null);
  const [metaLoading, setMetaLoading] = useState(true);

  const durationSecs = lessonMeta?.duration_seconds || aula.duration_seconds || 0;
  const durationFmt  = lessonMeta?.duration_formatted || aula.duration_formatted || '';
  const calculatedPlan = getCourseVqQuestionPlan({ durationSecs, suggestedQ, isAdmin, maxPerBlock:MAX_PER_BLOCK });
  const calculatedQ  = calculatedPlan.totalQ;
  const initialPlan = getCourseVqQuestionPlan({ durationSecs:aula.duration_seconds || 0, suggestedQ, isAdmin, maxPerBlock:MAX_PER_BLOCK });

  const [totalQ,      setTotalQ]      = useState(initialPlan.totalQ);
  const [qPerBlock,   setQPerBlock]   = useState(initialPlan.qPerBlock);
  const [numBlocks,   setNumBlocks]   = useState(initialPlan.numBlocks);
  // Inicializar com as configurações salvas do usuário
  const [numAlts,       setNumAlts]     = useState(savedSettings.numAlternatives || 5);
  const [extraPrompt,   setExtraPrompt] = useState('');
  const [questionStyle, setQuestionStyle] = useState(savedSettings.questionStyle || 'mixed');
  const [questionTypes, setQuestionTypes] = useState(filterQuestionTypesForAccess(savedSettings.questionTypes || ['direct'], { isAdmin, canCreateFlashcards }));
  const [autoMode,      setAutoMode]    = useState(savedSettings.autoMode !== false);
  const [geminiThinkingEnabled, setGeminiThinkingEnabled] = useState(!!savedSettings.geminiThinkingEnabled);
  const [auditQuestions, setAuditQuestions] = useState(!!savedSettings.auditQuestions);
  const [adminChunkedQuestions, setAdminChunkedQuestions] = useState(!!savedSettings.adminChunkedQuestions);
  const [initialized,   setInitialized] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setMetaLoading(true);
      try {
        const docId = (aula.title || '').replace(/\//g, '-');
        const snap = await getDoc(doc(db, 'lessons', docId));
        if (snap.exists()) {
          const d = snap.data();
          setLessonMeta({ duration_seconds: d.duration_seconds, duration_formatted: d.duration_formatted });
        }
      } catch(e) {}
      finally { setMetaLoading(false); }
    };
    fetch();
  }, [aula.title]); // eslint-disable-line

  useEffect(() => {
    if (metaLoading || initialized) return;
    const secs = lessonMeta?.duration_seconds || aula.duration_seconds || 0;
    const plan = getCourseVqQuestionPlan({ durationSecs:secs, suggestedQ, isAdmin, maxPerBlock:MAX_PER_BLOCK });
    setTotalQ(plan.totalQ); setQPerBlock(plan.qPerBlock); setNumBlocks(plan.numBlocks);
    setInitialized(true);
  }, [metaLoading, initialized, isAdmin]); // eslint-disable-line

  // Helpers de mudança — mantém consistência entre os 3 campos
  const handleTotalChange = (v) => {
    const t = Math.max(1, Math.min(isAdmin ? 9999 : 300, parseInt(v)||1));
    setTotalQ(t);
    const perB = Math.min(MAX_PER_BLOCK, qPerBlock);
    setQPerBlock(perB);
    setNumBlocks(Math.ceil(t / perB));
  };
  const handlePerBlockChange = (v) => {
    const p = Math.max(1, Math.min(MAX_PER_BLOCK, parseInt(v)||1));
    setQPerBlock(p);
    setNumBlocks(Math.ceil(totalQ / p));
  };
  const handleBlocksChange = (v) => {
    const b = Math.max(1, Math.min(50, parseInt(v)||1));
    setNumBlocks(b);
    setQPerBlock(Math.min(MAX_PER_BLOCK, Math.ceil(totalQ / b)));
  };

  // Garante que qPerBlock nunca excede totalQ
  const effectivePerBlock = Math.min(qPerBlock, totalQ);
  const remainder    = totalQ % effectivePerBlock;
  const fullBlocks   = remainder === 0 ? numBlocks : numBlocks - 1;
  const lastBlock    = remainder === 0 ? 0 : remainder;
  const summaryText  = lastBlock === 0
    ? `${numBlocks} bloco(s) de ${effectivePerBlock} questões = ${totalQ} no total`
    : `${fullBlocks > 0 ? `${fullBlocks} bloco(s) de ${effectivePerBlock} + ` : ''}1 bloco de ${lastBlock} = ${totalQ} no total`;

  // Salva preferências atuais e fecha — chamado em qualquer forma de fechar
  const handleClose = () => onClose({ questionStyle, numAlternatives: numAlts, autoMode, geminiThinkingEnabled, auditQuestions, adminChunkedQuestions });

  return (
    <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4" onClick={handleClose}>
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${dm?'bg-gray-900 border-gray-700 text-gray-100':'bg-white border-gray-200 text-gray-900'}`}
        style={{isolation:'isolate', maxHeight:'calc(100dvh - 6rem)'}}
        onClick={e=>e.stopPropagation()}
      >
        {/* Header fixo */}
        <div className={`flex items-center justify-between px-6 py-5 border-b flex-shrink-0 ${dm?'border-gray-700':'border-gray-100'}`}>
          <div>
            <h3 className="text-lg font-serif font-bold text-yellow-600 flex items-center gap-2">
              <GraduationCap className="w-5 h-5"/>Gerar Questões da Aula
            </h3>
            <p className={`text-sm mt-0.5 truncate max-w-xs ${dm?'text-gray-400':'text-gray-500'}`}>{aula.title}</p>
          </div>
          <button type="button" aria-label="Fechar" onClick={handleClose} className={`p-2 rounded-full ${dm?'hover:bg-gray-700 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>✕</button>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1 min-h-0">
          {/* Duração + sugestão */}
          <div className={`flex items-center gap-3 p-3 rounded-xl ${dm?'bg-gray-800':'bg-gray-50'}`}>
            <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0"/>
            {metaLoading ? (
              <div className="flex items-center gap-2">
                <Spinner className="w-4 h-4 text-yellow-600"/>
                <span className={`text-sm ${dm?'text-gray-400':'text-gray-500'}`}>Calculando duração...</span>
              </div>
            ) : durationSecs > 0 ? (
              <div>
                <p className="text-sm font-bold">Duração: {durationFmt}</p>
                <p className={`text-xs mt-0.5 ${dm?'text-gray-400':'text-gray-500'}`}>
                  {isAdmin
                    ? `Modo admin: cobertura integral da aula, sem limite total; até ${ADMIN_COURSE_TOPIC_QUESTION_MAX} subtópicos por bloco/tópico`
                    : `Sugestão: ${calculatedQ} questões (${Math.ceil(durationSecs/60)} min ÷ 2, arredondado para dezena)`}
                </p>
              </div>
            ) : (
              <p className={`text-sm ${dm?'text-gray-400':'text-gray-500'}`}>Duração não disponível — ajuste manualmente</p>
            )}
          </div>

          {/* Toggle autoMode */}
          <button onClick={()=>setAutoMode(!autoMode)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${autoMode?(dm?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(dm?'border-gray-600 bg-gray-800':'border-gray-200 bg-white')}`}>
            <div>
              <p className={`text-sm font-bold ${autoMode?'text-yellow-500':''}`}>✦ Deixar o Oráculo escolher</p>
              <p className="text-xs opacity-50 mt-0.5">A IA define a estrutura ideal de blocos e subtópicos</p>
            </div>
            <div style={{width:40,height:24,borderRadius:12,padding:2,background:autoMode?'#ca8a04':'#9ca3af',transition:'background 0.2s',flexShrink:0,display:'flex',alignItems:'center'}}>
              <div style={{width:20,height:20,borderRadius:10,background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.3)',transform:autoMode?'translateX(16px)':'translateX(0)',transition:'transform 0.2s'}}/>
            </div>
          </button>

          {isAdmin && autoMode && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${dm?'bg-yellow-900/20 border border-yellow-800/40 text-yellow-300':'bg-yellow-50 border border-yellow-200 text-yellow-800'}`}>
              <Sparkles className="w-4 h-4 text-yellow-600 flex-shrink-0"/>
              <span>O sumário vai cobrir a aula inteira na ordem do professor. O único limite é de até {ADMIN_COURSE_TOPIC_QUESTION_MAX} subtópicos por bloco/tópico.</span>
            </div>
          )}

          {/* Configuração numérica */}
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 transition-opacity ${autoMode?'opacity-30 pointer-events-none':''}`}>
            {[
              {label:'Total',sub:'questões',val:totalQ,fn:handleTotalChange},
              {label:`Por bloco (máx ${MAX_PER_BLOCK})`,sub:'questões',val:qPerBlock,fn:handlePerBlockChange},
              {label:'Blocos',sub:'blocos',val:numBlocks,fn:handleBlocksChange},
            ].map(f=>(
              <div key={f.label}>
                <label className="block text-xs font-bold uppercase mb-1.5 opacity-50">{f.label}</label>
                <input type="number" min="1" value={f.val} onChange={e=>f.fn(e.target.value)}
                  className={`w-full p-3 rounded-xl border text-center text-lg font-bold outline-none focus:ring-2 focus:ring-yellow-500 ${dm?'bg-gray-800 border-gray-600 text-white':'bg-white border-gray-200'}`}/>
                <p className="text-[10px] text-center mt-1 opacity-40">{f.sub}</p>
              </div>
            ))}
          </div>

          {/* Resumo visual — mostra distribuição real */}
          {!autoMode&&<div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${dm?'bg-yellow-900/20 border border-yellow-800/40':'bg-yellow-50 border border-yellow-200'}`}>
            <Sparkles className="w-4 h-4 text-yellow-600 flex-shrink-0"/>
            <span className={dm?'text-yellow-300':'text-yellow-800'}>{summaryText}</span>
          </div>}

          {/* Tipo de questão */}
          <div>
            <label className="block text-xs font-bold uppercase mb-2 opacity-50">Tipo de questão <span className="normal-case font-normal opacity-70">(escolha um ou mais)</span></label>
            <QuestionTypeSelector selected={questionTypes} onChange={setQuestionTypes} darkMode={dm} single={true} isAdmin={isAdmin} canCreateFlashcards={canCreateFlashcards}/>
          </div>

          {/* Estilo clínico/direto — só aparece se "direta" está selecionada */}
          {(questionTypes.includes('direct') || questionTypes.includes('vof') || questionTypes.includes('cespe')) && (
            <div>
              <label className="block text-xs font-bold uppercase mb-2 opacity-50">Estilo do enunciado</label>
              <QuestionStyleSelector value={questionStyle} onChange={setQuestionStyle} darkMode={dm}/>
            </div>
          )}

          {/* Alternativas */}
          {!questionTypes.some(isMemoryCardType)&&<div>
            <label className="block text-xs font-bold uppercase mb-2 opacity-50">Alternativas por questão</label>
            <div className="flex gap-3">
              {[4,5].map(n=>(
                <button key={n} onClick={()=>setNumAlts(n)}
                  className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${numAlts===n?(dm?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500':'border-gray-200 bg-white text-gray-700')}`}>
                  {n} alt. (A–{'ABCDE'[n-1]})
                </button>
              ))}
            </div>
          </div>}

          {/* Prompt extra */}
          <div>
            <label className="block text-xs font-bold uppercase mb-2 opacity-50">Instruções Extras <span className="normal-case font-normal opacity-70">(opcional)</span></label>
            <textarea
              value={extraPrompt} onChange={e=>setExtraPrompt(e.target.value)}
              placeholder="Ex: Foque em farmacologia e diagnóstico. Priorize o que o professor marcou como mais importante..."
              className={`w-full h-20 p-3 rounded-xl border resize-none outline-none focus:ring-2 focus:ring-yellow-500 text-sm ${dm?'bg-gray-800 border-gray-700 text-white placeholder-gray-500':'bg-white border-gray-200 placeholder-gray-400'}`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-2 opacity-50">Modo Gemini</label>
            <GeminiThinkingSelector value={geminiThinkingEnabled} onChange={setGeminiThinkingEnabled} darkMode={dm}/>
          </div>

          {isAdmin&&(
            <>
              <button onClick={()=>setAdminChunkedQuestions(!adminChunkedQuestions)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${adminChunkedQuestions?(dm?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(dm?'border-gray-600 bg-gray-800':'border-gray-200 bg-white')}`}>
                <div>
                  <p className={`text-sm font-bold ${adminChunkedQuestions?'text-yellow-500':''}`}>Geração em lotes</p>
                  <p className="text-xs opacity-50 mt-0.5">Limita o sumário a cerca de 15 questões por bloco antes de gerar a aula.</p>
                </div>
                <div style={{width:40,height:24,borderRadius:12,padding:2,background:adminChunkedQuestions?'#ca8a04':'#9ca3af',transition:'background 0.2s',flexShrink:0,display:'flex',alignItems:'center'}}>
                  <div style={{width:20,height:20,borderRadius:10,background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.3)',transform:adminChunkedQuestions?'translateX(16px)':'translateX(0)',transition:'transform 0.2s'}}/>
                </div>
              </button>
              <button onClick={()=>setAuditQuestions(!auditQuestions)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${auditQuestions?(dm?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(dm?'border-gray-600 bg-gray-800':'border-gray-200 bg-white')}`}>
                <div>
                  <p className={`text-sm font-bold ${auditQuestions?'text-yellow-500':''}`}>Auditoria</p>
                  <p className="text-xs opacity-50 mt-0.5">Segundo request para cortar questão inútil, corrigir pistas e cobrir lacunas.</p>
                </div>
                <div style={{width:40,height:24,borderRadius:12,padding:2,background:auditQuestions?'#ca8a04':'#9ca3af',transition:'background 0.2s',flexShrink:0,display:'flex',alignItems:'center'}}>
                  <div style={{width:20,height:20,borderRadius:10,background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.3)',transform:auditQuestions?'translateX(16px)':'translateX(0)',transition:'transform 0.2s'}}/>
                </div>
              </button>
            </>
          )}

          {isReset&&(
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${dm?'bg-red-900/20 border border-red-800/40 text-red-400':'bg-red-50 border border-red-200 text-red-700'}`}>
              <RotateCcw className="w-4 h-4 flex-shrink-0"/>
              Os blocos e questões anteriores desta aula serão substituídos.
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-4 flex-shrink-0 border-t border-gray-700/30">
          <button onClick={handleClose} className={`flex-1 py-4 rounded-xl font-bold ${dm?'bg-gray-800 hover:bg-gray-700':'bg-gray-100 hover:bg-gray-200'}`}>
            Cancelar
          </button>
          <button
            disabled={loading || metaLoading}
            onClick={()=>{
              const effectivePerBlock = adminChunkedQuestions ? Math.min(qPerBlock, ADMIN_ORACLE_QUESTION_CHUNK_TARGET) : qPerBlock;
              onConfirm({
                totalQ,
                numBlocks:adminChunkedQuestions ? Math.ceil(totalQ / Math.max(1, effectivePerBlock)) : numBlocks,
                qPerBlock:effectivePerBlock,
                numAlternatives:numAlts,
                extraPrompt,
                lessonMeta,
                questionStyle,
                autoMode,
                questionTypes,
                geminiThinkingEnabled,
                auditQuestions,
                adminChunkedQuestions,
                syllabusMaxPerBlock:isAdmin?(adminChunkedQuestions ? ADMIN_ORACLE_QUESTION_CHUNK_TARGET : ADMIN_COURSE_TOPIC_QUESTION_MAX):undefined,
                adminMinuteRule:isAdmin,
                adminFullCoverage:isAdmin,
              });
            }}
            className="flex-[2] px-5 py-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 text-base"
          >
            {loading
              ? <><Spinner className="w-4 h-4 text-white"/>Gerando sumário...</>
              : metaLoading
                ? <><Spinner className="w-4 h-4 text-white"/>Carregando...</>
                : <><Sparkles className="w-4 h-4"/>Confirmar e Gerar</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};
export default VqGenModal;
