import React, { useState } from 'react';

const ic = (d) => ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} dangerouslySetInnerHTML={{__html:d}}/>;
const BlockIcon = ic('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>');
const CheckCircle2 = ic('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>');
const CheckIcon = ic('<polyline points="20 6 9 17 4 12"/>');
const Copy = ic('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>');
const EditIcon = ic('<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>');
const FileText = ic('<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>');
const LayersIcon = ic('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>');
const RepeatIcon = ic('<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>');
const ShieldAlert = ic('<path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3z"/><path d="M12 8v4"/><path d="M12 16h.01"/>');
const FLASHCARD_CORRECT = 'CORRECT';
const isMemoryCard = (question) => !!(question?.isFlashcard || question?.isCloze);
const isMemoryCardType = (type) => type === 'flashcard' || type === 'cloze';
const memoryCardTypeName = (types = []) => types?.[0] === 'cloze' ? 'clozes' : 'flashcards';
const getCorrectLetter = (question) => question?.options?.find(o => o.isCorrect)?.letter;
const isAnswerCorrect = (question, answer) => {
  if (!question || !answer || answer === 'SKIPPED') return false;
  if (isMemoryCard(question)) return answer === FLASHCARD_CORRECT;
  if (question.isOpen) {
    try { return (JSON.parse(answer)?.score ?? 0) >= 70; } catch(e) { return false; }
  }
  return answer === getCorrectLetter(question);
};
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
const SRModal = ({ questions, answers, aulaId, blockId, blockTitle, darkMode, onConfirm, onClose, currentReview, notebookIds=[], isAdmin=false }) => {
  const dm = darkMode;
  const SR_LABELS = ['3d','7d','14d','30d','90d'];
  const wrongIds = questions.filter(q => answers[q.id] && !isAnswerCorrect(q, answers[q.id])).map(q => q.id);

  // currentReview: object { [qId]: { interval, dueDate } } from reviewQueue[aulaId][blockId]
  const inReview = currentReview || {};
  const inReviewIds = Object.keys(inReview);

  // Ao gerenciar uma fila existente, não pré-seleciona questões novas.
  const [selected, setSelected] = useState(() => inReviewIds.length ? [] : questions.map(q=>q.id).filter(id => !inReviewIds.includes(id)));
  const [toRemove, setToRemove] = useState([]);

  const toggle = (id) => {
    if (inReviewIds.includes(id)) {
      // Already in review — toggle removal
      setToRemove(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);
    } else {
      // Not in review — toggle addition
      setSelected(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);
    }
  };

  const handleConfirm = () => {
    onConfirm(selected, toRemove);
  };

  const dueNow = (qId) => inReview[qId] && inReview[qId].dueDate <= Date.now();
  const dueLabel = (qId) => {
    if (!inReview[qId]) return null;
    const days = Math.ceil((inReview[qId].dueDate - Date.now()) / 86400000);
    const interval = SR_LABELS[inReview[qId].interval] || '?';
    if (days <= 0) return `vence hoje · intervalo ${interval}`;
    return `em ${days}d · intervalo ${interval}`;
  };

  const addCount = selected.length;
  const removeCount = toRemove.length;
  const hasChanges = addCount > 0 || removeCount > 0;

  return (
    <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4" onClick={onClose}>
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${dm?'bg-gray-900 border-gray-700':'bg-white border-gray-200'}`}
        style={{maxHeight:'calc(100dvh - 6rem)'}} onClick={e=>e.stopPropagation()}>

        <div className={`px-5 py-4 border-b flex-shrink-0 ${dm?'border-gray-700':'border-gray-100'}`}>
          <h3 className="font-serif font-bold text-lg text-yellow-600 flex items-center gap-2">
            <RepeatIcon className="w-5 h-5"/> Revisão Espaçada
          </h3>
          <p className={`text-xs mt-1 ${dm?'text-gray-400':'text-gray-500'}`}>
            {inReviewIds.length > 0
              ? <>{inReviewIds.length} questão{inReviewIds.length!==1?'s':''} já na fila · Acertos: 3→7→14→30→90 dias</>
              : <>Questões selecionadas voltarão em <strong>3 dias</strong>. Acertos avançam o intervalo.</>
            }
          </p>
        </div>

        <div className="flex gap-2 px-5 pt-3 pb-2 flex-shrink-0 flex-wrap">
          <button onClick={()=>setSelected(questions.filter(q=>!inReviewIds.includes(q.id)).map(q=>q.id))}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${dm?'border-gray-600 text-gray-300 hover:bg-gray-700':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Todas novas ({questions.filter(q=>!inReviewIds.includes(q.id)).length})
          </button>
          <button onClick={()=>setSelected((isAdmin ? notebookIds : wrongIds).filter(id=>!inReviewIds.includes(id)))}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${dm?'border-red-700/50 text-red-400 hover:bg-red-900/20':'border-red-200 text-red-600 hover:bg-red-50'}`}>
            {isAdmin
              ? `Caderno de erros (${notebookIds.filter(id=>!inReviewIds.includes(id)).length})`
              : `Só erradas novas (${wrongIds.filter(id=>!inReviewIds.includes(id)).length})`}
          </button>
          <button onClick={()=>{setSelected([]);setToRemove([]);}}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${dm?'border-gray-700 text-gray-500':'border-gray-100 text-gray-400'}`}>
            Limpar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-1.5 min-h-0">
          {questions.map((q, i) => {
            const isInReview = inReviewIds.includes(q.id);
            const isWrong = wrongIds.includes(q.id);
            const isCorrect = answers[q.id] && isAnswerCorrect(q, answers[q.id]);
            const willAdd = selected.includes(q.id);
            const willRemove = toRemove.includes(q.id);
            const isDue = dueNow(q.id);

            return (
              <button key={q.id} onClick={()=>toggle(q.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all
                  ${isInReview && !willRemove ? (dm?'border-yellow-700/50 bg-yellow-900/10':'border-yellow-200 bg-yellow-50/50') : ''}
                  ${willRemove ? (dm?'border-red-700/50 bg-red-900/10 opacity-60':'border-red-200 bg-red-50 opacity-60') : ''}
                  ${willAdd ? (dm?'border-yellow-500/60 bg-yellow-900/15':'border-yellow-400 bg-yellow-50') : ''}
                  ${!isInReview && !willAdd ? (dm?'border-gray-700 bg-gray-800/50':'border-gray-100 bg-gray-50') : ''}
                `}>
                <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all
                  ${isInReview && !willRemove ? 'bg-yellow-600 border-yellow-600' : ''}
                  ${willRemove ? 'bg-red-500 border-red-500' : ''}
                  ${willAdd ? 'bg-yellow-500 border-yellow-500' : ''}
                  ${!isInReview && !willAdd ? 'border-gray-400' : ''}
                `}>
                  {isInReview && !willRemove && <RepeatIcon className="w-3 h-3 text-white"/>}
                  {willRemove && <span className="text-white text-[10px] font-bold">✕</span>}
                  {willAdd && <svg viewBox="0 0 12 12" fill="none" width="10" height="10"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs truncate ${dm?'text-gray-300':'text-gray-700'}`}>
                    <span className="opacity-40 mr-1">Q{i+1}</span>
                    {q.statement.replace(/\n/g,' ').substring(0,80)}…
                  </p>
                  {isInReview && (
                    <p className={`text-[10px] mt-0.5 ${isDue?(dm?'text-yellow-400':'text-yellow-600'):(dm?'text-gray-500':'text-gray-400')}`}>
                      {isDue ? '🔔 ' : ''}{dueLabel(q.id)}
                    </p>
                  )}
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${isCorrect?'text-green-500':isWrong?'text-red-400':'text-gray-400'}`}>
                  {isCorrect?'✓':isWrong?'✗':'—'}
                </span>
              </button>
            );
          })}
        </div>

        <div className={`px-5 py-4 border-t flex gap-3 flex-shrink-0 ${dm?'border-gray-700':'border-gray-100'}`}>
          <button onClick={onClose} className={`flex-1 py-3 rounded-xl font-bold text-sm ${dm?'bg-gray-800 hover:bg-gray-700':'bg-gray-100 hover:bg-gray-200'}`}>
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={!hasChanges}
            className="flex-[2] px-5 py-3 rounded-xl font-bold text-sm bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-40 flex items-center justify-center gap-2">
            <RepeatIcon className="w-4 h-4"/>
            {addCount>0 && removeCount>0 ? `+${addCount} / −${removeCount}` :
             addCount>0 ? `Adicionar ${addCount} questão${addCount!==1?'s':''}` :
             removeCount>0 ? `Remover ${removeCount} da fila` : 'Sem alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};
// ─── QUESTION TYPE SELECTOR ───────────────────────────────────────────────────
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
const ExternalPromptModal = ({ darkMode, settings, settingsRef, onClose, isAdmin=false, canCreateFlashcards=false }) => {
  const dm = darkMode;
  const [cfg, setCfg] = useState({
    numTopics:       settings.numTopics      || 10,
    numSubtopics:    settings.numSubtopics   || 5,
    qPerSub:         settings.qPerSub        || 1,
    numAlternatives: settings.numAlternatives || 5,
    questionStyle:   settings.questionStyle  || 'mixed',
    questionTypes:   filterQuestionTypesForAccess(settings.questionTypes || ['direct'], { isAdmin, canCreateFlashcards }),
    autoMode:        settings.autoMode !== false,
  });
  const [copied, setCopied] = useState(false);
  const isOldExamPrompt = (cfg.questionTypes || []).includes('old_exam');
  const hasClosedTypes = (cfg.questionTypes || ['direct']).some(t => ['direct','vof','cespe'].includes(t));
  const isMemoryPrompt = (cfg.questionTypes || ['direct']).some(isMemoryCardType);

  const copy = async () => {
    const { buildExternalPrompt } = await import('../../agora_prompts.js');
    const prompt = buildExternalPrompt({...settingsRef.current, ...cfg, adminQuestionExplanations:true});
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4" onClick={onClose}>
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${dm?'bg-gray-900 border-gray-700 text-gray-100':'bg-white border-gray-200 text-gray-900'}`}
        style={{maxHeight:'calc(100dvh - 6rem)'}} onClick={e=>e.stopPropagation()}>
        <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${dm?'border-gray-700':'border-gray-100'}`}>
          <h3 className="font-serif font-bold text-lg text-yellow-600">Configurar Prompt Externo</h3>
          <button type="button" aria-label="Fechar" onClick={onClose} className={`text-xl leading-none ${dm?'text-gray-400 hover:text-gray-200':'text-gray-400 hover:text-gray-600'}`}>×</button>
        </div>
        <div className="px-6 py-4 space-y-5 overflow-y-auto flex-1 min-h-0">
          {/* AutoMode */}
          {!isOldExamPrompt&&<button onClick={()=>setCfg(p=>({...p,autoMode:!p.autoMode}))}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${cfg.autoMode?(dm?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(dm?'border-gray-600 bg-gray-800':'border-gray-200 bg-gray-50')}`}>
            <div>
              <p className={`text-sm font-bold ${cfg.autoMode?'text-yellow-500':''}`}>✦ IA escolhe a estrutura</p>
              <p className="text-xs opacity-50 mt-0.5">A IA define tópicos e subtópicos ideais</p>
            </div>
            <div style={{width:40,height:24,borderRadius:12,padding:2,background:cfg.autoMode?'#ca8a04':'#9ca3af',flexShrink:0,display:'flex',alignItems:'center',transition:'background 0.2s'}}>
              <div style={{width:20,height:20,borderRadius:10,background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.3)',transform:cfg.autoMode?'translateX(16px)':'translateX(0)',transition:'transform 0.2s'}}/>
            </div>
          </button>}

          {/* Estrutura */}
          {!isOldExamPrompt&&<div>
            <p className="text-xs font-bold uppercase opacity-50 mb-2">Estrutura do sumário</p>
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 transition-opacity ${cfg.autoMode?'opacity-30 pointer-events-none':''}`}>
              {[{l:'Tópicos',k:'numTopics',mn:1,mx:20},{l:'Subtóp./Tópico',k:'numSubtopics',mn:1,mx:30}].map(f=>(
                <div key={f.k}>
                  <label className="block text-xs font-bold uppercase mb-1.5 opacity-40">{f.l}</label>
                  <input type="number" min={f.mn} max={f.mx} value={cfg[f.k]}
                    onChange={e=>setCfg(p=>({...p,[f.k]:Math.max(f.mn,Math.min(f.mx,parseInt(e.target.value)||f.mn))}))}
                    className={`w-full p-3 rounded-lg border text-center font-bold outline-none focus:ring-2 focus:ring-yellow-500 ${dm?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
                </div>
              ))}
            </div>
          </div>}

          {/* Questões */}
          <div>
            <p className="text-xs font-bold uppercase opacity-50 mb-2">Questões</p>
            <div className="mb-3">
              <label className="block text-xs font-bold uppercase mb-1.5 opacity-40">Tipos aceitos</label>
              <QuestionTypeSelector
                selected={cfg.questionTypes || ['direct']}
                onChange={questionTypes=>setCfg(p=>({...p,questionTypes}))}
                darkMode={dm}
                single={true}
                isAdmin={isAdmin}
                canCreateFlashcards={canCreateFlashcards}
                includeExternalOnly={true}
              />
              <p className="text-[11px] opacity-45 mt-2 leading-relaxed">
                {isOldExamPrompt
                  ? 'Cole o prompt na IA e, depois, envie as questões antigas. Ela preservará o texto e as alternativas, limpando somente ruídos de OCR e formatação.'
                  : 'O prompt copiado conterá somente as regras e o formato do tipo selecionado.'}
              </p>
            </div>
            {isOldExamPrompt ? (
              <p className={`text-xs rounded-xl border px-3 py-2 ${dm?'border-yellow-800/50 bg-yellow-900/15 text-yellow-300':'border-yellow-200 bg-yellow-50 text-yellow-800'}`}>
                A quantidade será exatamente a quantidade de questões válidas fornecidas à IA.
              </p>
            ) : isMemoryPrompt ? (
              <p className={`text-xs rounded-xl border px-3 py-2 ${dm?'border-yellow-800/50 bg-yellow-900/15 text-yellow-300':'border-yellow-200 bg-yellow-50 text-yellow-800'}`}>
                {memoryCardTypeName(cfg.questionTypes)}: a IA decide a quantidade ideal, sem meta fixa por subtópico.
              </p>
            ) : <div className={`grid grid-cols-1 ${hasClosedTypes ? 'sm:grid-cols-2' : ''} gap-3`}>
              <div>
                <label className="block text-xs font-bold uppercase mb-1.5 opacity-40">Itens/Subtópico</label>
                <input type="number" min={1} max={10} value={cfg.qPerSub}
                  onChange={e=>setCfg(p=>({...p,qPerSub:Math.max(1,Math.min(10,parseInt(e.target.value)||1))}))}
                  className={`w-full p-3 rounded-lg border text-center font-bold outline-none focus:ring-2 focus:ring-yellow-500 ${dm?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
              </div>
              {hasClosedTypes&&<div>
                <label className="block text-xs font-bold uppercase mb-1.5 opacity-40">Alternativas</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{v:4,l:'4 (A-D)'},{v:5,l:'5 (A-E)'}].map(o=>(
                    <button key={o.v} onClick={()=>setCfg(p=>({...p,numAlternatives:o.v}))}
                      className={`h-[50px] rounded-lg border-2 text-xs font-bold transition-all ${cfg.numAlternatives===o.v?(dm?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-600 text-gray-300':'border-gray-200 text-gray-600')}`}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>}
            </div>}
          </div>

          {/* Estilo */}
          {!isOldExamPrompt&&<div>
            <p className="text-xs font-bold uppercase opacity-50 mb-2">Estilo</p>
            <QuestionStyleSelector value={cfg.questionStyle} onChange={value=>setCfg(p=>({...p,questionStyle:value}))} darkMode={dm}/>
          </div>}
        </div>
        <div className="px-6 pb-6 pt-4 flex gap-3 flex-shrink-0 border-t border-gray-700/30">
          <button onClick={onClose} className={`flex-1 py-3.5 rounded-xl font-bold ${dm?'bg-gray-800 hover:bg-gray-700':'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
          <button onClick={copy} className={`flex-[2] px-5 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${copied?'bg-green-600 text-white':'bg-yellow-600 hover:bg-yellow-700 text-white'}`}>
            {copied?<><CheckCircle2 className="w-4 h-4"/>Copiado!</>:<><Copy className="w-4 h-4"/>Copiar Prompt</>}
          </button>
        </div>
      </div>
    </div>
  );
};
export { SRModal, ExternalPromptModal };
