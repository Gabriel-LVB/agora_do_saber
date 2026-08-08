import React from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';

export default function SpacedReviewView() {
  const {
    ArrowLeft,
    BrainIcon,
    callWithRotation,
    CheckIcon,
    ChevronRight,
    darkMode,
    dailyStats,
    EmptyState,
    getDueReviews,
    getKey,
    getTodayKey,
    inactivateCourseQuestion,
    isAdmin,
    isAnswerCorrect,
    isReviewItemFavorite,
    nextReviewAt,
    QuestionCard,
    RepeatIcon,
    restoreReturnTarget,
    reviewForecast,
    reviewLoaded,
    reviewScheduledCount,
    reviewSession,
    setReviewNotebook,
    setReviewSession,
    settings,
    Spinner,
    toggleReviewFavorite,
    trackQuestionAnswered,
    updateReviewItem,
  } = useFeatureContext();
  const [forecastRange, setForecastRange] = React.useState(7);
  const dm = darkMode;
  const dueItems = getDueReviews();
  const dueFlashcardItems = dueItems.filter(item => item.question?.isFlashcard);
  const dueQuestionItems = dueItems.filter(item => !item.question?.isFlashcard);
  const reviewEvents = Object.values(dailyStats?.reviewEvents || {});
  const trackedReviewKeys = Object.keys(dailyStats?.questionKeys || {}).filter(key => key.startsWith('review:')).length;
  const completedToday = Math.max(reviewEvents.length, trackedReviewKeys);
  const correctToday = reviewEvents.filter(event => event?.correct).length;
  const remainingNow = reviewForecast?.dueNow ?? dueItems.length;
  const todayWork = completedToday + remainingNow;
  const todayProgress = todayWork ? Math.round(completedToday / todayWork * 100) : 100;
  const forecastDays = (reviewForecast?.days || []).slice(0, forecastRange);
  const maxForecastCount = Math.max(1, ...forecastDays.map(day => day.total));
  const nextReviewLabel = nextReviewAt
    ? new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'long' }).format(new Date(nextReviewAt))
    : null;
  const forecastDayLabel = (day, index) => {
    if (forecastRange >= 14) {
      return new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'2-digit' }).format(new Date(day.date));
    }
    if (index === 0) return 'Hoje';
    if (index === 1) return 'Amanhã';
    return new Intl.DateTimeFormat('pt-BR', { weekday:'short', day:'2-digit' })
      .format(new Date(day.date))
      .replace('.', '');
  };

  if (reviewSession) {
    const {
      items:sessionItems,
      index,
      sessionAnswers,
      sessionResults = {},
      completed = false,
    } = reviewSession;
    const current = sessionItems[index];
    const sessionItemKey = current?.item?.cardKey || `${current?.aulaId}/${current?.blockId}/${current?.qId}`;
    const total = sessionItems.length;
    const done = Object.keys(sessionAnswers).length;
    const finished = done === total;
    if (finished && completed) {
      const correct = Object.values(sessionResults).filter(Boolean).length;
      const wrong = total - correct;
      const pct = total ? Math.round(correct / total * 100) : 0;
      return (
        <div className={`mx-auto max-w-2xl rounded-2xl border p-8 text-center shadow-sm md:p-10 ${dm?'border-gray-800 bg-gray-900':'border-gray-200 bg-white'}`}>
          <CheckIcon className="mx-auto mb-4 h-12 w-12 text-green-500"/>
          <h2 className="font-serif text-3xl font-bold text-yellow-600">Revisão concluída</h2>
          <p className={`mt-3 text-sm ${dm?'text-gray-400':'text-gray-600'}`}>{correct} acertos · {wrong} erros</p>
          <p className={`mt-1 text-3xl font-serif font-bold ${pct>=70?'text-green-500':pct>=50?'text-yellow-600':'text-red-500'}`}>{pct}%</p>
          <button onClick={()=>setReviewSession(null)} className="mt-7 rounded-xl bg-yellow-600 px-8 py-3 font-bold text-white hover:bg-yellow-700">Voltar</button>
        </div>
      );
    }

    const question = current.question;
    const seed = current.item.reviewSeed || 42;
    const shuffleWithSeed = (values, value) => {
      const next = [...values];
      let state = value;
      for (let position = next.length - 1; position > 0; position -= 1) {
        state = (state * 1664525 + 1013904223) & 0xffffffff;
        const target = Math.abs(state) % (position + 1);
        [next[position], next[target]] = [next[target], next[position]];
      }
      return next;
    };
    const correctText = question.options?.find(option => option.isCorrect)?.text;
    const reviewQuestion = {
      ...question,
      options:shuffleWithSeed(question.options || [], seed).map((option, optionIndex) => ({
        ...option,
        letter:'ABCDE'[optionIndex],
        isCorrect:option.text === correctText,
      })),
    };
    const answerCurrentReview = async letter => {
      const correct = isAnswerCorrect(reviewQuestion, letter);
      trackQuestionAnswered(`review:${current.aulaId}:${current.blockId}:${current.qId}:${current.item?.dueDate||getTodayKey()}`);
      setReviewSession(previous => ({
        ...previous,
        sessionAnswers:{ ...(previous?.sessionAnswers || {}), [sessionItemKey]:letter },
        sessionResults:{ ...(previous?.sessionResults || {}), [sessionItemKey]:correct },
      }));
      if (!correct) setReviewNotebook(current, 'add');
      await updateReviewItem(current.aulaId, current.blockId, current.qId, correct);
    };
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <button onClick={()=>setReviewSession(null)} className={`flex items-center gap-2 font-bold ${dm?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="h-4 w-4"/>Sair</button>
          <div className="text-right">
            <span className={`block text-xs font-bold ${dm?'text-gray-400':'text-gray-500'}`}>{index + 1}/{total}</span>
          </div>
        </div>
        <div className={`mb-5 h-2 overflow-hidden rounded-full ${dm?'bg-gray-800':'bg-gray-100'}`}>
          <div className="h-full rounded-full bg-yellow-500 transition-all" style={{width:`${done / total * 100}%`}}/>
        </div>
        <QuestionCard
          question={reviewQuestion}
          index={index}
          selectedLetter={sessionAnswers[sessionItemKey]}
          onAnswer={answerCurrentReview}
          allowGiveUp={!question.isOpen&&!question.isFlashcard}
          darkMode={dm}
          isFavorite={isReviewItemFavorite(current)}
          onToggleFavorite={()=>toggleReviewFavorite(current)}
          showErrorNotebook={false}
          adminQuestionExplanations={isAdmin}
          onAdminDisableQuestion={isAdmin ? (()=>inactivateCourseQuestion({
            aulaId:current.aulaId,
            blockId:current.blockId,
            questionId:current.qId,
            question:current.question,
          })) : null}
          apiKey={getKey()}
          oracleLength={settings.oracleLength}
          onCall={callWithRotation}
        />
        <div className="mt-4 flex items-center justify-between gap-3">
          <button onClick={()=>setReviewSession(previous=>({...previous,index:Math.max(0,index-1)}))} disabled={index===0} className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold disabled:opacity-30 ${dm?'border-gray-700 text-gray-300':'border-gray-200 text-gray-600'}`}><ArrowLeft className="h-4 w-4"/>Anterior</button>
          <button
            onClick={()=>setReviewSession(previous=>(index===total-1?{...previous,completed:true}:{...previous,index:Math.min(total-1,index+1)}))}
            disabled={index===total-1&&!finished}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-yellow-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-30"
          >
            {index===total-1?'Concluir':'Próxima'}{index===total-1?<CheckIcon className="h-4 w-4"/>:<ChevronRight className="h-4 w-4"/>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className={`rounded-2xl border p-5 shadow-sm md:p-6 ${dm?'border-gray-800 bg-gray-900':'border-gray-200 bg-white'}`}>
        <button onClick={()=>restoreReturnTarget('library')} className={`mb-4 flex items-center gap-2 text-sm font-bold ${dm?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="h-4 w-4"/>Voltar</button>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-yellow-600">Hoje</p>
            <h2 className="mt-1 font-serif text-3xl font-bold text-yellow-600">Revisões</h2>
            <p className={`mt-1 text-sm ${dm?'text-gray-400':'text-gray-600'}`}>{dueItems.length ? `${dueItems.length} item${dueItems.length===1?'':'s'} esperando por você.` : 'Tudo em dia.'}</p>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto lg:min-w-[430px]">
            <button
              disabled={!dueQuestionItems.length}
              onClick={()=>setReviewSession({items:dueQuestionItems,index:0,sessionAnswers:{}})}
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-yellow-600 px-5 py-3 text-sm font-bold text-white hover:bg-yellow-700 disabled:opacity-35"
            >
              <RepeatIcon className="h-4 w-4"/>Responder questões <span className="rounded-full bg-black/15 px-2 py-0.5">{dueQuestionItems.length}</span>
            </button>
            <button
              disabled={!dueFlashcardItems.length}
              onClick={()=>setReviewSession({items:dueFlashcardItems,index:0,sessionAnswers:{}})}
              className={`flex min-h-[52px] items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold disabled:opacity-35 ${dm?'border-yellow-700 text-yellow-300 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-800 hover:bg-yellow-50'}`}
            >
              <BrainIcon className="h-4 w-4"/>Revisar flashcards <span className={`rounded-full px-2 py-0.5 ${dm?'bg-yellow-950':'bg-yellow-100'}`}>{dueFlashcardItems.length}</span>
            </button>
          </div>
        </div>
      </section>

      {!reviewLoaded ? (
        <div className={`flex items-center justify-center rounded-2xl border p-10 ${dm?'border-gray-800 bg-gray-900':'border-gray-200 bg-white'}`}><Spinner className="h-7 w-7 text-yellow-600"/></div>
      ) : !dueItems.length ? (
        <EmptyState
          darkMode={dm}
          icon={<RepeatIcon className="h-7 w-7"/>}
          title={reviewScheduledCount?'Revisões em dia':'Nenhuma revisão agendada'}
          message={reviewScheduledCount
            ? `${reviewScheduledCount} itens seguem no plano${nextReviewLabel?` · próximo vencimento em ${nextReviewLabel}`:''}.`
            : 'Quando uma aula assistida tiver a curadoria publicada, as questões selecionadas entram aqui.'}
        />
      ) : (
        <section className={`rounded-2xl border px-4 py-3 text-sm ${dm?'border-gray-800 bg-gray-900 text-gray-300':'border-gray-200 bg-white text-gray-700'}`}>
          A fila de hoje mistura aulas e matérias para você revisar o que precisa agora.
        </section>
      )}

      <section className={`rounded-2xl border p-5 ${dm?'border-gray-800 bg-gray-900':'border-gray-200 bg-white'}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-[.16em] ${dm?'text-gray-500':'text-gray-400'}`}>Seu dia</p>
            <p className={`mt-1 text-sm ${dm?'text-gray-300':'text-gray-700'}`}><strong className="font-serif text-2xl text-yellow-600">{completedToday}</strong> concluídas · {remainingNow} restantes</p>
          </div>
          <div className="min-w-0 flex-1 md:max-w-md">
            <div className={`h-2 overflow-hidden rounded-full ${dm?'bg-gray-800':'bg-gray-100'}`}><div className="h-full rounded-full bg-yellow-500" style={{width:`${todayProgress}%`}}/></div>
            <p className={`mt-1 text-right text-[10px] font-bold ${dm?'text-gray-500':'text-gray-400'}`}>{todayProgress}% concluído</p>
          </div>
        </div>
      </section>

      <section className={`rounded-2xl border p-5 ${dm?'border-gray-800 bg-gray-900':'border-gray-200 bg-white'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-[.16em] ${dm?'text-gray-500':'text-gray-400'}`}>Próximos dias</p>
            <h3 className="mt-1 font-serif text-xl font-bold">Carga prevista</h3>
          </div>
          <div className={`inline-flex rounded-lg border p-1 ${dm?'border-gray-700 bg-gray-950':'border-gray-200 bg-gray-50'}`}>
            {[7,14,30].map(range=><button key={range} onClick={()=>setForecastRange(range)} className={`rounded-md px-3 py-1.5 text-xs font-bold ${forecastRange===range?'bg-blue-600 text-white':dm?'text-gray-400':'text-gray-500'}`}>{range} dias</button>)}
          </div>
        </div>
        <div className="mt-5 overflow-x-auto pb-2">
          <div className="grid items-end gap-2" style={{gridTemplateColumns:`repeat(${forecastDays.length}, minmax(42px, 1fr))`,minWidth:forecastRange===7?'420px':forecastRange===14?'720px':'1380px'}}>
            {forecastDays.map((day, index)=>{
              const height = day.total ? Math.max(8, day.total / maxForecastCount * 96) : 2;
              return <div key={day.date} className="flex min-w-0 flex-col items-center" title={`${forecastDayLabel(day,index)}: ${day.total}`}>
                <span className={`mb-1 text-[10px] font-bold ${day.total?dm?'text-gray-300':'text-gray-700':'opacity-25'}`}>{day.total}</span>
                <div className={`flex h-24 w-full max-w-[34px] flex-col justify-end overflow-hidden rounded-t-md ${dm?'bg-gray-800/50':'bg-gray-100'}`}><div className="w-full bg-blue-500" style={{height}}/></div>
                <span className={`mt-2 w-full truncate text-center text-[9px] font-bold ${index===0?'text-yellow-600':dm?'text-gray-500':'text-gray-400'}`}>{forecastDayLabel(day,index)}</span>
              </div>;
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
