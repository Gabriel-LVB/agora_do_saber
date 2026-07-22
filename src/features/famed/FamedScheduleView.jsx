import React from 'react';
import { FAMED_S5_SCHEDULE, FAMED_S5_SCHEDULE_STATS } from './famedSchedule.js';

const BookOpen = ({ className='h-4 w-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/></svg>;
const FileText = ({ className='h-4 w-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>;
const PlusIcon = ({ className='h-4 w-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5v14M5 12h14"/></svg>;

const disciplineTone = (_discipline, darkMode) => darkMode
  ? 'border-gray-800 bg-gray-900/30'
  : 'border-gray-200 bg-gray-50/70';

const actionClass = (enabled, darkMode, primary=false) => `inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${enabled
  ? primary
    ? 'border-yellow-600 bg-yellow-600 text-white hover:bg-yellow-700'
    : darkMode?'border-gray-600 bg-gray-900 text-gray-200 hover:border-yellow-600 hover:text-yellow-400':'border-gray-200 bg-white text-gray-700 hover:border-yellow-500 hover:text-yellow-700'
  : darkMode?'cursor-not-allowed border-gray-700 bg-gray-900 text-gray-600':'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'}`;

const contentQuestionCount = content => (content?.academiaSubject?.topics || []).reduce((total,topic) => total
  + Object.values(topic.fixationQuestions || {}).flat().length
  + (topic.extraBattery || []).reduce((sum,block)=>sum + (block.questions || block || []).length, 0), 0);

const normalizeLabel = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const supplementaryTopics = item => {
  const title = normalizeLabel(item?.title);
  return (item?.topics || []).filter(topic => {
    const normalizedTopic = normalizeLabel(topic);
    return normalizedTopic && !title.includes(normalizedTopic);
  });
};

export default function FamedScheduleView({ darkMode, isAdmin=false, contentByScheduleId={}, contentLoading=false, onOpenLesson, onOpenQuestions, onCreate }) {
  return (
    <div className="famed-schedule space-y-4">
      <section className="famed-schedule-summary px-1 py-1">
        <h2 className="font-serif text-2xl font-bold">Aulas e provas</h2>
        <p className={`mt-2 text-sm ${darkMode?'text-gray-400':'text-gray-600'}`}>Ordem provisória baseada na turma anterior.</p>
        <div className="famed-schedule-stats mt-5 grid grid-cols-3 gap-2">
          {[
            [FAMED_S5_SCHEDULE_STATS.lessons,'aulas'],
            [FAMED_S5_SCHEDULE_STATS.assessments,'provas'],
            [Object.keys(contentByScheduleId).length,contentLoading?'carregando':isAdmin?'criadas':'publicadas'],
          ].map(([value,label])=><div key={label} className={`famed-stat rounded-xl border px-3 py-3 ${darkMode?'border-gray-700 bg-gray-800':'border-gray-200 bg-gray-50'}`}><strong className="block text-xl text-yellow-600">{value}</strong><span className="mt-0.5 block text-xs opacity-50">{label}</span></div>)}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {['Cardiologia','Pneumologia'].map(discipline => {
          const items = FAMED_S5_SCHEDULE.filter(item => item.discipline === discipline);
          return <section key={discipline} className="app-card famed-discipline rounded-2xl p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-serif text-xl font-bold">{discipline}</h3>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${disciplineTone(discipline,darkMode)}`}>{items.filter(item=>item.kind==='lesson').length} aulas</span>
            </div>
            <div className="space-y-3">
              {items.map(item => {
                const content = contentByScheduleId[item.id];
                const questionCount = contentQuestionCount(content);
                const details = supplementaryTopics(item);
                if (item.kind !== 'lesson') return <article key={item.id} className={`famed-assessment rounded-xl border border-dashed p-4 ${darkMode?'border-red-900 bg-red-900 bg-opacity-10':'border-red-200 bg-red-50'}`}><div className="flex items-center gap-3"><span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-xs font-bold text-red-700">{item.sequence}</span><div className="min-w-0"><span className="text-xs font-bold uppercase tracking-wide text-red-600">Prova</span><h4 className="mt-0.5 font-serif font-bold mobile-safe-text">{item.title}</h4></div></div></article>;
                return <article key={item.id} className={`famed-lesson-card rounded-xl border p-4 ${disciplineTone(item.discipline,darkMode)}`}>
                  <div className="flex items-start gap-3">
                    <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${darkMode?'bg-gray-900 text-yellow-400':'bg-white text-yellow-700'}`}>{item.sequence}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h4 className="min-w-0 flex-1 font-serif text-base font-bold leading-tight mobile-safe-text">{item.title}</h4>
                        <span className={`famed-status flex-shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${content?.published?(darkMode?'bg-green-900 text-green-300':'bg-green-100 text-green-700'):(darkMode?'bg-gray-800 text-gray-500':'bg-white text-gray-400')}`}>{content?.published?'Disponível':content?'Rascunho':'Em produção'}</span>
                      </div>
                      {!!details.length&&<p className="mt-1 text-xs opacity-50">{details.join(' · ')}</p>}
                      {(content||isAdmin)&&<div className="famed-actions mt-3 grid grid-cols-2 gap-2">
                        {content&&<button type="button" onClick={()=>onOpenLesson?.(content)} className={actionClass(true,darkMode,true)}><BookOpen/>Aula da Academia</button>}
                        {content&&<button type="button" disabled={!questionCount} onClick={()=>questionCount&&onOpenQuestions?.(content)} className={actionClass(!!questionCount,darkMode)}><FileText/>{questionCount?`${questionCount} questões`:'Questões'}</button>}
                        {isAdmin&&!content&&<button type="button" onClick={()=>onCreate?.(item)} className={`${actionClass(true,darkMode,true)} col-span-2`}><PlusIcon/>Criar aula</button>}
                      </div>}
                    </div>
                  </div>
                </article>;
              })}
            </div>
          </section>;
        })}
      </div>
    </div>
  );
}
