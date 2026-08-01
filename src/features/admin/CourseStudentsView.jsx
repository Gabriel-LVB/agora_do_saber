import React from 'react';
import {
  collection,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  doc,
} from 'firebase/firestore';

import { useFeatureContext } from '../FeatureContext.jsx';
import { db } from '../../services/firebase.js';
import { isReviewQueueItemScheduled } from '../../services/reviewScheduler.js';

const flattenReviewItems = snapshot => snapshot.docs.flatMap(entry =>
  Object.values(entry.data() || {}).flatMap(qMap => Object.values(qMap || {}))
).filter(Boolean);

const summarizeQuestionProgress = snapshot => {
  let answered = 0;
  let wrong = 0;
  snapshot.forEach(entry => {
    Object.values(entry.data()?.blocks || {}).forEach(block => {
      const answers = Object.entries(block?.answers || {})
        .filter(([, answer]) => answer != null && answer !== '' && answer !== 'SKIPPED');
      const errorIds = new Set((block?.errorNotebook || []).map(String));
      answered += answers.length;
      wrong += answers.filter(([questionId]) => errorIds.has(String(questionId))).length;
    });
  });
  return { answered, wrong, correct:Math.max(0, answered - wrong) };
};

const intervalSeconds = intervals => (Array.isArray(intervals) ? intervals : [])
  .reduce((total, interval) => total + Math.max(0, Number(interval?.[1]) - Number(interval?.[0])), 0);

const summarizeRecentActivity = snapshot => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 13);
  const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
  let questions = 0;
  let reviews = 0;
  let lessonSeconds = 0;
  let activeDays = 0;
  snapshot.forEach(entry => {
    if (entry.id < cutoffKey) return;
    const data = entry.data() || {};
    const dayQuestions = Object.keys(data.questionKeys || {}).length;
    const dayReviews = Object.keys(data.reviewEvents || {}).length;
    const daySeconds = Object.values(data.lessonIntervals || {}).reduce(
      (total, intervals) => total + intervalSeconds(intervals),
      0,
    );
    questions += dayQuestions;
    reviews += dayReviews;
    lessonSeconds += daySeconds;
    if (dayQuestions || dayReviews || daySeconds) activeDays += 1;
  });
  return {
    questions,
    reviews,
    lessonMinutes:Math.round(lessonSeconds / 60),
    activeDays,
  };
};

const emptyRecentActivity = () => ({ questions:0, reviews:0, lessonMinutes:0, activeDays:0 });

const recentDateKeys = (days = 14) => Array.from({ length:days }, (_, index) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - index);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
});

const readProgressSource = async (source, reader) => {
  try {
    return { source, value:await reader(), error:null };
  } catch(error) {
    console.warn(`Course student ${source} read failed:`, error);
    return {
      source,
      value:null,
      error:{
        source,
        code:error?.code || 'unknown',
        message:error?.message || 'Falha sem detalhes',
      },
    };
  }
};

const loadRecentActivity = async uid => {
  // Os documentos têm IDs determinísticos YYYY-MM-DD. Leituras pontuais evitam
  // depender de índices/consultas para um intervalo pequeno e fixo.
  const snapshots = await Promise.all(recentDateKeys().map(dateKey =>
    getDoc(doc(db, 'users', uid, 'daily_stats', dateKey))
  ));
  return {
    forEach(callback) {
      snapshots.forEach(snapshot => {
        if (snapshot.exists()) callback(snapshot);
      });
    },
  };
};

const mapWithConcurrency = async (items, concurrency, mapper) => {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length:Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
};

const loadStudentProgress = async ({ email, device, totalLessons }) => {
  if (!device?.uid) return {
    email,
    uid:null,
    displayName:'',
    lastSeenAt:null,
    watched:0,
    totalLessons,
    answered:0,
    correct:0,
    wrong:0,
    reviewTotal:0,
    reviewDue:0,
    fsrsActive:0,
    adaptiveWaiting:0,
    recent:emptyRecentActivity(),
  };
  const uid = String(device.uid);
  const [watchedResult, reviewResult, blocksResult, dailyResult] = await Promise.all([
    readProgressSource('aulas', () => getDoc(doc(db, 'users', uid, 'videoaulas_progress', 'watched'))),
    readProgressSource('revisões', () => getDocs(collection(db, 'users', uid, 'vq_review'))),
    readProgressSource('questões', () => getDocs(collection(db, 'users', uid, 'vq_blocks'))),
    readProgressSource('atividade', () => loadRecentActivity(uid)),
  ]);
  const errors = [watchedResult, reviewResult, blocksResult, dailyResult]
    .map(result => result.error)
    .filter(Boolean);
  const watchedSnap = watchedResult.value;
  const watched = watchedSnap?.exists()
      ? Object.values(watchedSnap.data() || {}).filter(Boolean).length
      : 0;
  const reviewItems = reviewResult.value ? flattenReviewItems(reviewResult.value) : [];
  const scheduled = reviewItems.filter(isReviewQueueItemScheduled);
  const questionProgress = blocksResult.value
    ? summarizeQuestionProgress(blocksResult.value)
    : { answered:0, correct:0, wrong:0 };
  return {
    email,
    uid,
    displayName:device.displayName || '',
    lastSeenAt:Number(device.lastSeenAt) || null,
    watched,
    totalLessons,
    ...questionProgress,
    reviewTotal:scheduled.length,
    reviewDue:scheduled.filter(item => Number(item.dueDate) <= Date.now()).length,
    fsrsActive:scheduled.filter(item => !!item.fsrs).length,
    adaptiveWaiting:reviewItems.filter(item => item.adaptiveState === 'dormant').length,
    recent:dailyResult.value ? summarizeRecentActivity(dailyResult.value) : emptyRecentActivity(),
    errors,
  };
};

const formatSeen = timestamp => {
  if (!timestamp) return 'Ainda não entrou';
  const diff = Math.max(0, Date.now() - Number(timestamp));
  if (diff < 90_000) return 'Agora';
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)} min atrás`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)} h atrás`;
  if (diff < 7 * 86_400_000) return `${Math.round(diff / 86_400_000)} d atrás`;
  return new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'short', year:'numeric' })
    .format(new Date(timestamp));
};

export default function CourseStudentsView() {
  const {
    darkMode,
    courseAllowedEmails,
    flattenCourseLessons,
    isAdmin,
    Spinner,
    user,
    videoaulasData,
  } = useFeatureContext();
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const whitelistKey = (courseAllowedEmails || []).map(email => String(email).toLowerCase()).sort().join('|');
  const totalLessons = React.useMemo(
    () => flattenCourseLessons(videoaulasData || {}).length,
    [flattenCourseLessons, videoaulasData],
  );

  const refresh = React.useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const devicesSnap = await getDocs(query(
        collection(db, 'user_devices'),
        orderBy('lastSeenAt', 'desc'),
        limit(1000),
      ));
      const latestDeviceByEmail = new Map();
      devicesSnap.forEach(entry => {
        const data = { id:entry.id, ...(entry.data() || {}) };
        const email = String(data.email || '').trim().toLowerCase();
        if (email && !latestDeviceByEmail.has(email)) latestDeviceByEmail.set(email, data);
      });
      const adminEmail = String(user?.email || '').trim().toLowerCase();
      const courseEmails = [...new Set(
        whitelistKey.split('|').map(email => email.trim()).filter(email => email && email !== adminEmail)
      )];
      const loaded = await mapWithConcurrency(courseEmails, 4, email => loadStudentProgress({
        email,
        device:latestDeviceByEmail.get(email),
        totalLessons,
      }));
      setRows(loaded.sort((left, right) =>
        Number(right.lastSeenAt || 0) - Number(left.lastSeenAt || 0)
        || left.email.localeCompare(right.email, 'pt-BR')
      ));
    } catch(loadError) {
      console.error('Course students progress load failed:', loadError);
      setError(loadError?.code || loadError?.message || 'Falha ao carregar alunos');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, totalLessons, user?.email, whitelistKey]);

  React.useEffect(() => { refresh(); }, [refresh]);

  if (!isAdmin) return null;
  const needle = search.trim().toLocaleLowerCase('pt-BR');
  const visibleRows = rows.filter(row => !needle
    || `${row.email} ${row.displayName}`.toLocaleLowerCase('pt-BR').includes(needle)
  );
  const started = rows.filter(row => row.uid).length;
  const activeSevenDays = rows.filter(row => row.lastSeenAt && Date.now() - row.lastSeenAt <= 7 * 86_400_000).length;
  const averageWatched = started
    ? Math.round(rows.reduce((total, row) => total + row.watched, 0) / started)
    : 0;
  const totalAnswered = rows.reduce((total, row) => total + row.answered, 0);
  const surface = darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white';

  return (
    <div className="space-y-4">
      <section className={`rounded-2xl border p-5 ${surface}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-yellow-600">Controle do curso</p>
            <h3 className="mt-1 font-serif text-2xl font-bold">Alunos e progresso</h3>
            <p className={`mt-1 max-w-3xl text-sm ${darkMode?'text-gray-400':'text-gray-600'}`}>
              Visão administrativa de aulas assistidas, questões respondidas, carga de revisão e atividade recente. Nenhum aluno vê esta área.
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold disabled:opacity-50 ${darkMode?'border-gray-600 hover:bg-gray-700':'border-gray-300 hover:bg-gray-50'}`}
          >
            {loading&&<Spinner className="h-4 w-4"/>}
            Atualizar progresso
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['Matriculados', rows.length],
            ['Já acessaram', started],
            ['Ativos em 7 dias', activeSevenDays],
            ['Questões respondidas', totalAnswered],
          ].map(([label, value]) => <div key={label} className={`rounded-xl border p-4 ${darkMode?'border-gray-700 bg-gray-900':'border-gray-200 bg-gray-50'}`}>
            <strong className="block font-serif text-2xl text-yellow-600">{value}</strong>
            <span className="text-[10px] font-bold uppercase opacity-50">{label}</span>
          </div>)}
        </div>
        {!!started&&<p className={`mt-3 text-xs ${darkMode?'text-gray-500':'text-gray-400'}`}>Média de {averageWatched} aula{averageWatched===1?'':'s'} assistida{averageWatched===1?'':'s'} por aluno que já acessou.</p>}
      </section>

      <section className={`rounded-2xl border p-4 md:p-5 ${surface}`}>
        <input
          value={search}
          onChange={event=>setSearch(event.target.value)}
          placeholder="Buscar por nome ou e-mail"
          className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none ${darkMode?'border-gray-700 bg-gray-900 text-gray-100':'border-gray-200 bg-gray-50 text-gray-900'}`}
        />
        {error&&<p className={`mt-4 rounded-xl border px-4 py-3 text-sm ${darkMode?'border-red-900 bg-red-950/20 text-red-200':'border-red-200 bg-red-50 text-red-800'}`}>Não foi possível atualizar o painel: {error}</p>}
        {loading&&!rows.length
          ? <div className="flex items-center justify-center gap-2 py-12 text-sm opacity-60"><Spinner className="h-5 w-5"/>Lendo progresso dos alunos…</div>
          : <div className="mt-4 space-y-3">
              {!visibleRows.length&&<p className="py-10 text-center text-sm opacity-50">Nenhum aluno encontrado.</p>}
              {visibleRows.map(row => {
                const lessonPercent = row.totalLessons ? Math.round(row.watched / row.totalLessons * 100) : 0;
                const accuracy = row.answered ? Math.round(row.correct / row.answered * 100) : null;
                return <article key={row.email} className={`rounded-xl border p-4 ${darkMode?'border-gray-700 bg-gray-900/60':'border-gray-200 bg-gray-50'}`}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{row.displayName || row.email}</p>
                      {!!row.displayName&&<p className="truncate text-xs opacity-50">{row.email}</p>}
                    </div>
                    <span className={`text-xs font-bold ${row.lastSeenAt?'text-emerald-500':'text-orange-500'}`}>{formatSeen(row.lastSeenAt)}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <div>
                      <div className="flex justify-between gap-2 text-xs"><span>Aulas</span><strong>{row.watched}/{row.totalLessons}</strong></div>
                      <div className={`mt-1.5 h-1.5 overflow-hidden rounded-full ${darkMode?'bg-gray-700':'bg-gray-200'}`}><div className="h-full rounded-full bg-yellow-500" style={{width:`${Math.min(100, lessonPercent)}%`}}/></div>
                    </div>
                    <div><strong className="block text-lg text-blue-500">{row.answered}</strong><span className="text-[10px] uppercase opacity-50">respondidas{accuracy!=null?` · ${accuracy}%`:''}</span></div>
                    <div><strong className="block text-lg text-red-500">{row.reviewDue}</strong><span className="text-[10px] uppercase opacity-50">hoje · {row.reviewTotal} no plano</span></div>
                    <div><strong className="block text-lg text-emerald-500">{row.fsrsActive}</strong><span className="text-[10px] uppercase opacity-50">cartões no FSRS</span></div>
                    <div><strong className="block text-lg text-yellow-600">{row.recent.activeDays}/14</strong><span className="text-[10px] uppercase opacity-50">dias ativos · {row.recent.lessonMinutes} min</span></div>
                  </div>
                  <p className={`mt-3 text-[11px] ${darkMode?'text-gray-500':'text-gray-400'}`}>
                    Últimos 14 dias: {row.recent.questions} questões e {row.recent.reviews} revisões · {row.adaptiveWaiting} reforços fora da carga.
                  </p>
                  {!!row.errors?.length&&<div className="mt-2 text-xs text-red-500">
                    <p>Leitura parcial em {row.errors.map(error=>error.source).join(', ')}.</p>
                    <details className="mt-1 opacity-80">
                      <summary className="cursor-pointer">Ver detalhes técnicos</summary>
                      {row.errors.map(error=><p key={`${error.source}-${error.code}`} className="mt-1 break-words">
                        {error.source}: {error.code} — {error.message}
                      </p>)}
                    </details>
                  </div>}
                </article>;
              })}
            </div>}
      </section>
    </div>
  );
}
