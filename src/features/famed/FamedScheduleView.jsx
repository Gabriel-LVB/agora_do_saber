import React from 'react';
import {
  FAMED_S5_ARCHIVED_ITEMS,
  FAMED_S5_DISCIPLINES,
  FAMED_S5_SCHEDULE,
} from './famedSchedule.js';
import { courseLessonStableIds } from './famedCourseLessonMap.js';
import { getFamedFlashcardState, getFamedStudyMaterials } from './famedStudyMaterials.js';

const BookOpen = ({ className='h-4 w-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/></svg>;
const FileText = ({ className='h-4 w-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>;
const PlusIcon = ({ className='h-4 w-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5v14M5 12h14"/></svg>;
const PlayIcon = ({ className='h-3.5 w-3.5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const DownloadIcon = ({ className='h-4 w-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>;
const TrashIcon = ({ className='h-4 w-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 15H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>;
const CardsIcon = ({ className='h-4 w-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 13h5"/><path d="M7 2h10"/></svg>;

const disciplineTone = (_discipline, darkMode) => darkMode
  ? 'border-gray-800 bg-gray-900/30'
  : 'border-gray-200 bg-gray-50/70';

const actionClass = (enabled, darkMode, primary=false) => `inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${enabled
  ? primary
    ? 'border-yellow-600 bg-yellow-600 text-white hover:bg-yellow-700'
    : darkMode?'border-gray-600 bg-gray-900 text-gray-200 hover:border-yellow-600 hover:text-yellow-400':'border-gray-200 bg-white text-gray-700 hover:border-yellow-500 hover:text-yellow-700'
  : darkMode?'cursor-not-allowed border-gray-700 bg-gray-900 text-gray-600':'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'}`;

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

const SCHEDULE_MONTHS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

const formatScheduleDate = value => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  return `${Number(match[3])} ${SCHEDULE_MONTHS[Number(match[2]) - 1]}`;
};

const scheduleWhen = item => [formatScheduleDate(item?.date), item?.time].filter(Boolean).join(' · ');

const formatCourseDuration = seconds => {
  const totalMinutes = Math.round((Number(seconds) || 0) / 60);
  if (totalMinutes <= 0) return '';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${totalMinutes}min`;
  return minutes ? `${hours}h${String(minutes).padStart(2,'0')}` : `${hours}h`;
};

const linkedLessonsDuration = lessons => formatCourseDuration(
  (lessons || []).reduce((total,lesson) => total + Number(lesson.durationSeconds || lesson.aula?.duration_seconds || 0), 0)
);

const isCourseLessonWatched = (lesson, watchedAulas) => courseLessonStableIds(lesson)
  .some(id => !!watchedAulas?.[id]);

export default function FamedScheduleView({ darkMode, isAdmin=false, disciplineIds=[], heading='Aulas e provas', description='', emptyMessage='', contentByScheduleId={}, contentLoading=false, courseCatalogReady=false, courseLessonsByScheduleId={}, watchedAulas={}, removingContentId=null, generatingFlashcardsId=null, onOpenCourseLesson, onExportCourseCatalog, onOpenLesson, onOpenPastQuestions, onOpenFlashcards, onCreate, onRemoveContent }) {
  const visibleDisciplineIds = new Set(disciplineIds.length ? disciplineIds : FAMED_S5_DISCIPLINES.map(discipline => discipline.id));
  const visibleSchedule = FAMED_S5_SCHEDULE.filter(item => visibleDisciplineIds.has(item.discipline));
  const visibleDisciplines = FAMED_S5_DISCIPLINES.filter(discipline => visibleDisciplineIds.has(discipline.id));
  const contentForItem = item => contentByScheduleId[item.id]
    || (item.legacyContentIds || []).map(id => contentByScheduleId[id]).find(Boolean)
    || null;
  const activeContentIds = new Set(visibleSchedule.map(contentForItem).filter(Boolean).map(content => content.id));
  const archivedWithContent = FAMED_S5_ARCHIVED_ITEMS
    .map(item => ({ item, content:contentByScheduleId[item.id] }))
    .filter(({ item, content }) => visibleDisciplineIds.has(item.discipline) && content && !activeContentIds.has(content.id));
  const activeContentCount = activeContentIds.size;
  const visibleStats = visibleSchedule.reduce((stats,item) => {
    if (item.kind === 'lesson') stats.lessons += 1;
    else stats.assessments += 1;
    return stats;
  }, { lessons:0, assessments:0 });
  return (
    <div className="famed-schedule space-y-4">
      <section className="famed-schedule-summary px-1 py-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold">{heading}</h2>
            <p className={`mt-2 text-sm ${darkMode?'text-gray-400':'text-gray-600'}`}>{description || 'Cronogramas da turma 2026.2 · somente aulas teóricas e primeiras chamadas.'}</p>
          </div>
          {isAdmin&&<button type="button" disabled={!courseCatalogReady} onClick={onExportCourseCatalog}
            className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${darkMode?'border-gray-700 text-gray-300 hover:border-yellow-600 hover:text-yellow-300':'border-gray-200 bg-white text-gray-700 hover:border-yellow-500 hover:text-yellow-700'}`}>
            <DownloadIcon/>Exportar aulas do curso
          </button>}
        </div>
        <div className="famed-schedule-stats mt-5 grid grid-cols-3 gap-2">
          {[
            [visibleStats.lessons,'aulas'],
            [visibleStats.assessments,'provas'],
            [activeContentCount,contentLoading?'carregando':isAdmin?'criadas':'publicadas'],
          ].map(([value,label])=><div key={label} className={`famed-stat rounded-xl border px-3 py-3 ${darkMode?'border-gray-700 bg-gray-800':'border-gray-200 bg-gray-50'}`}><strong className="block text-xl text-yellow-600">{value}</strong><span className="mt-0.5 block text-xs opacity-50">{label}</span></div>)}
        </div>
      </section>

      {!visibleSchedule.length?<section className={`app-card rounded-2xl border border-dashed p-8 text-center ${darkMode?'border-gray-700':'border-gray-200'}`}>
        <h3 className="font-serif text-xl font-bold">Cronograma ainda não disponível</h3>
        <p className={`mx-auto mt-2 max-w-xl text-sm ${darkMode?'text-gray-400':'text-gray-600'}`}>{emptyMessage || 'Esta parte do semestre será preenchida quando o cronograma oficial estiver disponível.'}</p>
      </section>:<div className={`grid gap-4 ${visibleDisciplines.length > 1 ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {visibleDisciplines.map(discipline => {
          const items = visibleSchedule.filter(item => item.discipline === discipline.id);
          return <section key={discipline.id} className="app-card famed-discipline rounded-2xl p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-serif text-xl font-bold">{discipline.label}</h3>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${disciplineTone(discipline.id,darkMode)}`}>{items.filter(item=>item.kind==='lesson').length} aulas</span>
            </div>
            <div className="space-y-3">
              {items.map(item => {
                const content = contentForItem(item);
                const subject = content?.academiaSubject || null;
                const study = getFamedStudyMaterials(subject);
                const pastQuestionCount = study.pastQuestionSets.reduce((total,set)=>total + (set.questions || []).length,0);
                const flashcardState = getFamedFlashcardState(subject);
                const generatingFlashcards = generatingFlashcardsId === content?.id;
                const details = supplementaryTopics(item);
                const linkedCourseLessons = courseLessonsByScheduleId[item.id] || [];
                const courseDuration = linkedLessonsDuration(linkedCourseLessons);
                if (item.kind !== 'lesson') return <article key={item.id} className={`famed-assessment rounded-xl border border-dashed p-4 ${darkMode?'border-red-900 bg-red-900 bg-opacity-10':'border-red-200 bg-red-50'}`}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-xs font-bold text-red-700">{item.sequence}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-xs font-bold uppercase tracking-wide text-red-600">Prova</span>
                          <h4 className="mt-0.5 font-serif font-bold mobile-safe-text">{item.title}</h4>
                        </div>
                        {(content||isAdmin)&&<span className={`famed-status rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${content?.published?(darkMode?'bg-green-900 text-green-300':'bg-green-100 text-green-700'):(darkMode?'bg-gray-800 text-gray-500':'bg-white text-gray-400')}`}>{content?.published?'Disponível':content?'Rascunho':'Sem questões'}</span>}
                      </div>
                      <p className="mt-1 text-xs font-semibold opacity-60"><time dateTime={item.date}>{scheduleWhen(item)}</time></p>
                      {isAdmin&&item.dateNote&&<p className="mt-1 text-[11px] text-yellow-600">{item.dateNote}</p>}
                    </div>
                  </div>
                  {(isAdmin||pastQuestionCount>0)&&<div className="mt-3">
                    <button type="button" disabled={!isAdmin&&!pastQuestionCount} onClick={()=>onOpenPastQuestions?.(content,item)} className={actionClass(isAdmin||pastQuestionCount>0,darkMode,true)} title={pastQuestionCount?`${pastQuestionCount} questões antigas`:'Adicionar questões antigas desta prova'}><FileText/>{pastQuestionCount?`Questões antigas (${pastQuestionCount})`:'Adicionar questões antigas'}</button>
                  </div>}
                </article>;
                return <article key={item.id} className={`famed-lesson-card rounded-xl border p-4 ${disciplineTone(item.discipline,darkMode)}`}>
                  <div className="flex items-start gap-3">
                    <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${darkMode?'bg-gray-900 text-yellow-400':'bg-white text-yellow-700'}`}>{item.sequence}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h4 className="min-w-0 flex-1 font-serif text-base font-bold leading-tight mobile-safe-text">{item.title}</h4>
                        <div className="flex flex-shrink-0 items-center gap-1.5">
                          <span className={`famed-status rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${content?.published?(darkMode?'bg-green-900 text-green-300':'bg-green-100 text-green-700'):(darkMode?'bg-gray-800 text-gray-500':'bg-white text-gray-400')}`}>{content?.published?'Disponível':content?'Rascunho':'Em produção'}</span>
                          {isAdmin&&content&&<button type="button" disabled={removingContentId===content.id} onClick={()=>onRemoveContent?.(content)} aria-label={`Remover ${item.title} da FAMED`} title="Remover conteúdo da FAMED"
                            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${darkMode?'text-gray-500 hover:bg-red-950/40 hover:text-red-400':'text-gray-400 hover:bg-red-50 hover:text-red-600'}`}><TrashIcon/></button>}
                        </div>
                      </div>
                      <p className="mt-1 text-xs font-semibold opacity-60"><time dateTime={item.date}>{scheduleWhen(item)}</time>{item.instructor?` · ${item.instructor}`:''}</p>
                      {!!details.length&&<p className="mt-1 text-xs opacity-50">{details.join(' · ')}</p>}
                      {isAdmin&&item.dateNote&&<p className="mt-1 text-[11px] text-yellow-600">{item.dateNote}</p>}
                    </div>
                  </div>
                  {!!linkedCourseLessons.length&&<div className={`mt-4 border-t pt-3 ${darkMode?'border-gray-800':'border-gray-200'}`}>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className={`text-[10px] font-bold uppercase tracking-[.12em] ${darkMode?'text-gray-500':'text-gray-400'}`}>No curso</p>
                      <span className={`text-[11px] font-bold ${darkMode?'text-gray-400':'text-gray-500'}`}>{linkedCourseLessons.length} aula{linkedCourseLessons.length===1?'':'s'}{courseDuration?` · ${courseDuration}`:''}</span>
                    </div>
                    <div className="mt-1">
                      {linkedCourseLessons.map(lesson => {
                        const watched = isCourseLessonWatched(lesson, watchedAulas);
                        return <button key={lesson.docId||lesson.id} type="button" onClick={()=>onOpenCourseLesson?.(lesson)}
                          className={`group flex min-h-[42px] w-full items-center gap-3 border-b py-2 text-left text-xs transition-colors last:border-b-0 ${watched
                            ? darkMode?'border-gray-800 text-green-300 hover:text-green-200':'border-gray-200 text-green-700 hover:text-green-800'
                            : darkMode?'border-gray-800 text-gray-300 hover:text-yellow-300':'border-gray-200 text-gray-700 hover:text-yellow-700'}`}>
                          <span className="min-w-0 flex-1 font-bold leading-snug">{lesson.title}</span>
                          {!!lesson.duration&&<span className={`flex-shrink-0 text-[10px] font-medium ${watched?(darkMode?'text-green-500/70':'text-green-600/70'):(darkMode?'text-gray-600':'text-gray-400')}`}>{lesson.duration}</span>}
                          <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-colors ${watched
                            ? darkMode?'bg-green-950/70 text-green-400 group-hover:bg-green-900/70':'bg-green-100 text-green-700 group-hover:bg-green-200'
                            : darkMode?'bg-gray-800 text-gray-500 group-hover:bg-yellow-900/40 group-hover:text-yellow-300':'bg-white text-gray-400 group-hover:bg-yellow-50 group-hover:text-yellow-700'}`}><PlayIcon className="h-3 w-3"/></span>
                        </button>;
                      })}
                    </div>
                  </div>}
                  {(content||isAdmin)&&<div className="famed-actions mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {content&&<button type="button" onClick={()=>onOpenLesson?.(content)} className={actionClass(true,darkMode,true)}><BookOpen/>Academia</button>}
                    {content&&<button type="button" disabled={!isAdmin&&!pastQuestionCount} onClick={()=>onOpenPastQuestions?.(content)} className={actionClass(isAdmin||pastQuestionCount>0,darkMode)} title={pastQuestionCount?`${pastQuestionCount} questões antigas`:'Nenhuma questão antiga disponível'}><FileText/>Questões antigas</button>}
                    {content&&<button type="button" title={!flashcardState.lessonReady?'Gere todas as aulas da Academia primeiro.':!flashcardState.pastQuestionCount?'Adicione as questões antigas primeiro.':flashcardState.stale?'A aula ou as questões mudaram; atualize os flashcards.':'Selecionados a partir da aula e das questões antigas.'} disabled={generatingFlashcards||(!flashcardState.prerequisitesMet&&!flashcardState.fresh)} onClick={()=>onOpenFlashcards?.(content)} className={actionClass(!generatingFlashcards&&(flashcardState.prerequisitesMet||flashcardState.fresh),darkMode)}><CardsIcon/>Flashcards</button>}
                    {isAdmin&&!content&&<button type="button" onClick={()=>onCreate?.(item)} className={`${actionClass(true,darkMode,true)} sm:col-span-3`}><PlusIcon/>Criar aula</button>}
                  </div>}
                </article>;
              })}
            </div>
          </section>;
        })}
      </div>}
      {!!archivedWithContent.length&&<section className="app-card rounded-2xl p-4 md:p-5">
        <div className="mb-4">
          <h3 className="font-serif text-xl font-bold">Materiais preservados</h3>
          <p className={`mt-1 text-xs ${darkMode?'text-gray-500':'text-gray-500'}`}>Aulas já criadas que não fazem parte do cronograma 2026.2.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {archivedWithContent.map(({ item, content }) => {
            const study = getFamedStudyMaterials(content.academiaSubject);
            const pastQuestionCount = study.pastQuestionSets.reduce((total,set)=>total + (set.questions || []).length,0);
            const flashcardState = getFamedFlashcardState(content.academiaSubject);
            const generatingFlashcards = generatingFlashcardsId === content.id;
            return <article key={item.id} className={`rounded-xl border p-4 ${disciplineTone(item.discipline,darkMode)}`}>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-45">{item.discipline} · grade anterior</p>
              <h4 className="mt-1 font-serif font-bold mobile-safe-text">{item.title}</h4>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button type="button" onClick={()=>onOpenLesson?.(content)} className={actionClass(true,darkMode,true)}><BookOpen/>Academia</button>
                <button type="button" disabled={!isAdmin&&!pastQuestionCount} onClick={()=>onOpenPastQuestions?.(content)} className={actionClass(isAdmin||pastQuestionCount>0,darkMode)}><FileText/>Questões antigas</button>
                <button type="button" disabled={generatingFlashcards||(!flashcardState.prerequisitesMet&&!flashcardState.fresh)} onClick={()=>onOpenFlashcards?.(content)} className={actionClass(!generatingFlashcards&&(flashcardState.prerequisitesMet||flashcardState.fresh),darkMode)}><CardsIcon/>Flashcards</button>
              </div>
            </article>;
          })}
        </div>
      </section>}
    </div>
  );
}
