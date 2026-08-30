import React from 'react';
import { getFamedStudyMaterials } from './famedStudyMaterials.js';

const FileText = ({ className='h-5 w-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>;
const TrashIcon = ({ className='h-4 w-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 15H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>;

export default function FamedPastQuestionsView({
  subject,
  darkMode,
  isAdmin,
  isAssessment=false,
  published=false,
  saving=false,
  openingSetId=null,
  onBack,
  onDeleteSet,
  onImport,
  onOpenSet,
  onTogglePublished,
  addToast,
}) {
  const [file, setFile] = React.useState(null);
  const [copying, setCopying] = React.useState(false);
  const fileInputRef = React.useRef(null);
  const study = getFamedStudyMaterials(subject);
  const questionCount = study.pastQuestionSets.reduce((total,set)=>total + (set.questions || []).length,0);

  const copyOldExamPrompt = async () => {
    setCopying(true);
    try {
      const { buildFamedQuestionPackagePrompt } = await import('../../agora_prompts.js');
      const prompt = buildFamedQuestionPackagePrompt({ title:subject?.title });
      await navigator.clipboard.writeText(prompt);
      addToast?.('Prompt do pacote ZIP copiado.', 'success', 3000);
    } catch(error) {
      addToast?.('Não foi possível copiar o prompt.', 'error', 4000);
    } finally {
      setCopying(false);
    }
  };

  const importQuestions = async () => {
    if (!file) return;
    const imported = await onImport?.(file);
    if (imported) {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return <div className="desktop-content-limit">
    <button type="button" onClick={onBack} className={`mb-6 flex items-center gap-2 font-bold ${darkMode?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}>← Voltar ao cronograma</button>
    <div className="mb-7">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest opacity-45">FAMED · {isAssessment?'Questões da prova':'Questões antigas'}</p>
      <h2 className="font-serif text-3xl font-bold leading-tight text-yellow-600">{subject?.title}</h2>
      {isAdmin&&<p className={`mt-2 max-w-3xl text-sm leading-relaxed ${darkMode?'text-gray-400':'text-gray-600'}`}>{isAssessment?'Guarde aqui as edições anteriores desta prova, inclusive questões que dependem de imagens. Depois da conferência, publique o conjunto para os alunos.':'Guarde aqui as provas anteriores desta aula, inclusive questões que dependem de imagens. Elas também orientam a seleção dos flashcards essenciais.'}</p>}
    </div>

    {isAdmin&&isAssessment&&<section className={`mb-6 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${darkMode?'border-gray-700 bg-gray-900/40':'border-gray-200 bg-white'}`}>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest opacity-45">Publicação</p>
        <p className="mt-1 text-sm font-bold">{published?'Disponível para os alunos':'Rascunho visível somente para o admin'}</p>
      </div>
      <button type="button" disabled={saving||(!published&&!questionCount)} onClick={onTogglePublished} className={`min-h-[42px] rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40 ${published?'bg-gray-600 hover:bg-gray-700':'bg-green-600 hover:bg-green-700'}`}>{published?'Retirar dos alunos':'Publicar para alunos'}</button>
    </section>}

    {isAdmin&&<section className={`mb-6 rounded-2xl border p-5 md:p-6 ${darkMode?'border-gray-700 bg-gray-900/40':'border-gray-200 bg-white'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-serif text-xl font-bold">Adicionar pacote de questões antigas</h3>
          <p className={`mt-1 max-w-2xl text-xs leading-relaxed ${darkMode?'text-gray-400':'text-gray-500'}`}>Copie o prompt, envie-o ao GPT junto da prova, do gabarito e dos arquivos de imagem. Ele devolverá um ZIP com o JSON e todas as figuras já vinculadas às questões.</p>
        </div>
        <button type="button" disabled={copying} onClick={copyOldExamPrompt} className={`min-h-[40px] rounded-xl border px-4 py-2 text-xs font-bold disabled:opacity-40 ${darkMode?'border-gray-600 text-gray-300 hover:border-yellow-600':'border-gray-200 text-gray-700 hover:border-yellow-500'}`}>{copying?'Copiando…':'Copiar prompt para o GPT'}</button>
      </div>
      <div className={`mt-5 rounded-xl border border-dashed p-4 ${darkMode?'border-gray-700 bg-gray-950/30':'border-gray-300 bg-gray-50'}`}>
        <input ref={fileInputRef} type="file" accept=".zip,application/zip,application/x-zip-compressed" onChange={event=>setFile(event.target.files?.[0] || null)} className="sr-only"/>
        <button type="button" onClick={()=>fileInputRef.current?.click()} className={`w-full rounded-xl border px-4 py-3 text-sm font-bold ${darkMode?'border-gray-600 bg-gray-900 text-gray-200 hover:border-yellow-600':'border-gray-200 bg-white text-gray-700 hover:border-yellow-500'}`}>{file ? 'Trocar arquivo ZIP' : 'Selecionar arquivo ZIP'}</button>
        <p className={`mt-3 break-all text-center text-xs ${file?(darkMode?'text-yellow-300':'text-yellow-700'):'opacity-50'}`}>{file ? file.name : 'O site validará questions.json, gabaritos, vínculos e imagens antes de salvar.'}</p>
      </div>
      <button type="button" disabled={saving||!file} onClick={importQuestions} className="mt-4 w-full rounded-xl bg-yellow-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-yellow-700 disabled:opacity-40">{saving?'Validando e salvando…':'Importar pacote de questões'}</button>
    </section>}

    <section className={`rounded-2xl border p-5 md:p-6 ${darkMode?'border-gray-700 bg-gray-900/30':'border-gray-200 bg-gray-50'}`}>
      {isAdmin&&<div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-bold">Blocos importados</h3>
          <p className="mt-1 text-xs opacity-50">{questionCount} questões em {study.pastQuestionSets.length} bloco(s)</p>
        </div>
      </div>}
      {!study.pastQuestionSets.length&&<div className={`rounded-xl border border-dashed px-4 py-10 text-center text-sm ${darkMode?'border-gray-700 text-gray-500':'border-gray-300 text-gray-400'}`}>Nenhuma questão antiga adicionada.</div>}
      <div className="space-y-2">
        {study.pastQuestionSets.map((set,index)=><div key={set.id || index} className={`flex items-center gap-3 rounded-xl border p-3 ${darkMode?'border-gray-700 bg-gray-900':'border-gray-200 bg-white'}`}>
          <button type="button" disabled={openingSetId===set.id} onClick={()=>onOpenSet?.(set)} className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:opacity-50">
            <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${darkMode?'bg-yellow-900/30 text-yellow-300':'bg-yellow-50 text-yellow-700'}`}><FileText/></span>
            <span className="min-w-0"><strong className="block truncate text-sm">{set.title || `Bloco ${index + 1}`}</strong><span className="mt-0.5 block text-xs opacity-50">{openingSetId===set.id?'Carregando imagens…':`${(set.questions || []).length} questões`}</span></span>
          </button>
          {isAdmin&&<button type="button" disabled={saving} onClick={()=>onDeleteSet?.(set)} aria-label={`Excluir ${set.title || `bloco ${index + 1}`}`} className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg disabled:opacity-40 ${darkMode?'text-gray-500 hover:bg-red-950/40 hover:text-red-400':'text-gray-400 hover:bg-red-50 hover:text-red-600'}`}><TrashIcon/></button>}
        </div>)}
      </div>
    </section>
  </div>;
}
