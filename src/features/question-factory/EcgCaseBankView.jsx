import React from 'react';
import { readStorageJson, writeStorageJson } from '../../lib/safeStorage.js';

const STORAGE_KEY = 'agora_ecg_practical_progress_v1';
const compact = value => String(value || '').replace(/\s+/g, ' ').trim();
const resultFor = (progress, caseId) => progress?.results?.[caseId] || null;

function CaseImages({ images, darkMode }) {
  if (!images.length) return null;
  return (
    <div className={`grid items-start gap-4 ${images.length > 1 ? 'lg:grid-cols-2' : ''}`}>
      {images.map((image, index) => (
        <figure key={`${image.url}_${index}`} className={`overflow-hidden rounded-xl border ${darkMode?'border-gray-700 bg-gray-950':'border-gray-200 bg-white'}`}>
          <img src={image.url} alt={image.type === 'raio_x' ? 'Radiografia do caso' : 'Eletrocardiograma do caso'} className="h-auto w-full object-contain" loading="lazy"/>
        </figure>
      ))}
    </div>
  );
}

function TextSection({ title, children, darkMode }) {
  if (!String(children || '').trim()) return null;
  return <section className={`rounded-xl border p-4 md:p-5 ${darkMode?'border-gray-700 bg-gray-900/70':'border-gray-200 bg-white'}`}>
    <h4 className="text-xs font-bold uppercase tracking-[.14em] text-yellow-600">{title}</h4>
    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{children}</p>
  </section>;
}

function ProgressBar({ value, darkMode }) {
  return <div className={`h-2 overflow-hidden rounded-full ${darkMode?'bg-gray-700':'bg-gray-200'}`}>
    <div className="h-full rounded-full bg-yellow-500 transition-all" style={{width:`${Math.max(0, Math.min(100, value))}%`}}/>
  </div>;
}

export default function EcgCaseBankView({ darkMode = false }) {
  const [dataset, setDataset] = React.useState(null);
  const [error, setError] = React.useState('');
  const [mode, setMode] = React.useState('course');
  const [search, setSearch] = React.useState('');
  const [family, setFamily] = React.useState('all');
  const [activeId, setActiveId] = React.useState(null);
  const [sessionFamily, setSessionFamily] = React.useState(null);
  const [answerVisible, setAnswerVisible] = React.useState(false);
  const [selfAnswer, setSelfAnswer] = React.useState('');
  const [progress, setProgress] = React.useState(() => readStorageJson(STORAGE_KEY, { results:{}, lastCaseId:null }) || { results:{}, lastCaseId:null });

  React.useEffect(() => {
    const controller = new AbortController();
    fetch('/ecg/v3/cases.json', { signal:controller.signal, cache:'no-cache' })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(setDataset)
      .catch(fetchError => {
        if (fetchError.name !== 'AbortError') setError(fetchError.message || 'Falha ao carregar o banco');
      });
    return () => controller.abort();
  }, []);

  React.useEffect(() => {
    writeStorageJson(STORAGE_KEY, progress);
  }, [progress]);

  const cases = dataset?.cases || [];
  const families = React.useMemo(
    () => [...new Set(cases.map(item => item.primaryFamily).filter(Boolean))],
    [cases],
  );
  const familyCases = React.useCallback(
    familyName => familyName ? cases.filter(item => item.primaryFamily === familyName) : cases,
    [cases],
  );
  const completedCount = cases.filter(item => resultFor(progress, item.id)).length;
  const masteredCount = cases.filter(item => resultFor(progress, item.id) === 'mastered').length;
  const reviewCount = cases.filter(item => resultFor(progress, item.id) === 'review').length;
  const courseCompletion = cases.length ? Math.round(completedCount / cases.length * 100) : 0;
  const activeCase = cases.find(item => item.id === activeId) || null;

  const openCase = (caseId, familyScope = null) => {
    setActiveId(caseId);
    setSessionFamily(familyScope);
    setAnswerVisible(false);
    setSelfAnswer('');
    setProgress(current => ({ ...current, lastCaseId:caseId }));
  };
  const nextStudyCase = familyScope => {
    const scope = familyCases(familyScope);
    return scope.find(item => !resultFor(progress, item.id))
      || scope.find(item => resultFor(progress, item.id) === 'review')
      || scope[0]
      || null;
  };
  const startCourse = familyScope => {
    const scopedLast = cases.find(item => item.id === progress.lastCaseId && (!familyScope || item.primaryFamily === familyScope));
    const target = scopedLast && !resultFor(progress, scopedLast.id) ? scopedLast : nextStudyCase(familyScope);
    if (target) openCase(target.id, familyScope || null);
  };
  const rateCase = rating => {
    if (!activeCase) return;
    const nextProgress = {
      ...progress,
      results:{ ...progress.results, [activeCase.id]:rating },
      lastCaseId:activeCase.id,
    };
    setProgress(nextProgress);
    const scope = familyCases(sessionFamily);
    const currentIndex = scope.findIndex(item => item.id === activeCase.id);
    const orderedNext = [...scope.slice(currentIndex + 1), ...scope.slice(0, currentIndex)];
    const next = orderedNext.find(item => !nextProgress.results[item.id])
      || orderedNext.find(item => nextProgress.results[item.id] === 'review');
    if (next) openCase(next.id, sessionFamily);
    else {
      setActiveId(null);
      setAnswerVisible(false);
    }
  };

  const filteredCases = React.useMemo(() => {
    const needle = compact(search).toLocaleLowerCase('pt-BR');
    return cases.filter(item => {
      const matchesFamily = family === 'all' || item.primaryFamily === family;
      const haystack = compact([item.id, item.title, item.primaryFamily, item.subfamily, ...(item.tags || []), item.prompt].join(' ')).toLocaleLowerCase('pt-BR');
      return matchesFamily && (!needle || haystack.includes(needle));
    });
  }, [cases, family, search]);

  if (error) return <div className={`rounded-2xl border p-5 text-sm ${darkMode?'border-red-900 bg-red-950/20 text-red-200':'border-red-200 bg-red-50 text-red-800'}`}>Não foi possível carregar os ECGs: {error}</div>;
  if (!dataset) return <div className={`rounded-2xl border p-8 text-center text-sm ${darkMode?'border-gray-700 bg-gray-800 text-gray-400':'border-gray-200 bg-white text-gray-600'}`}>Carregando o curso prático de ECG...</div>;

  if (activeCase) {
    const scope = familyCases(sessionFamily);
    const scopeIndex = scope.findIndex(item => item.id === activeCase.id);
    const questionImages = (activeCase.images || []).filter(image => image.phase === 'question');
    const answerImages = (activeCase.images || []).filter(image => image.phase === 'answer');
    return <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={()=>setActiveId(null)} className={`rounded-lg border px-3 py-2 text-sm font-bold ${darkMode?'border-gray-600 text-gray-300':'border-gray-300 text-gray-700'}`}>← {mode === 'course' ? 'Curso prático' : 'Catálogo'}</button>
        <span className="text-xs font-bold text-yellow-600">Caso {scopeIndex + 1} de {scope.length}</span>
      </div>

      <ProgressBar value={(scopeIndex + 1) / scope.length * 100} darkMode={darkMode}/>
      <article className={`rounded-2xl border p-5 md:p-7 ${darkMode?'border-gray-700 bg-gray-800':'border-gray-200 bg-white'}`}>
        <p className="text-xs font-bold uppercase tracking-[.16em] text-yellow-600">Etapa 1 · interprete · {activeCase.id}</p>
        <h3 className="mt-2 font-serif text-2xl font-bold">Analise o traçado antes de revelar o gabarito</h3>
        <p className={`mt-1 text-sm ${darkMode?'text-gray-400':'text-gray-500'}`}>{activeCase.primaryFamily}</p>
        <div className="mt-5"><CaseImages images={questionImages} darkMode={darkMode}/></div>
        <div className={`mt-5 rounded-xl border p-4 md:p-5 ${darkMode?'border-yellow-900/70 bg-yellow-950/20':'border-yellow-200 bg-yellow-50'}`}>
          <h4 className="text-xs font-bold uppercase tracking-[.14em] text-yellow-600">Caso clínico</h4>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{activeCase.prompt}</p>
          <p className={`mt-4 border-t pt-4 text-sm font-semibold ${darkMode?'border-yellow-900/60':'border-yellow-200'}`}>{activeCase.suggestedQuestion}</p>
        </div>
        {!answerVisible && <label className="mt-5 block text-xs font-bold">Seu raciocínio antes do gabarito
          <textarea value={selfAnswer} onChange={event=>setSelfAnswer(event.target.value)} rows="4" placeholder="Diagnóstico, achados e conduta..." className={`mt-2 w-full rounded-xl border p-3 text-sm outline-none ${darkMode?'border-gray-700 bg-gray-900 text-white placeholder-gray-500':'border-gray-300 bg-white text-gray-900 placeholder-gray-400'}`}/>
        </label>}
      </article>

      {!answerVisible
        ? <button type="button" onClick={()=>setAnswerVisible(true)} className="w-full rounded-xl bg-yellow-600 px-5 py-3 font-bold text-white hover:bg-yellow-700">Revelar gabarito e comparar</button>
        : <section className={`space-y-4 rounded-2xl border p-5 md:p-7 ${darkMode?'border-green-900/70 bg-green-950/10':'border-green-200 bg-green-50/40'}`}>
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-green-600">Etapa 2 · gabarito</p><h3 className="mt-1 font-serif text-2xl font-bold">{activeCase.shortAnswer}</h3></div>
          {selfAnswer.trim() && <TextSection title="Seu raciocínio" darkMode={darkMode}>{selfAnswer}</TextSection>}
          <CaseImages images={answerImages} darkMode={darkMode}/>
          <TextSection title="Achados" darkMode={darkMode}>{activeCase.findings}</TextSection>
          <TextSection title="Interpretação clínica" darkMode={darkMode}>{activeCase.clinicalInterpretation}</TextSection>
          <TextSection title="Conduta" darkMode={darkMode}>{activeCase.management}</TextSection>
          <details className={`rounded-xl border p-4 ${darkMode?'border-gray-700 bg-gray-900/70':'border-gray-200 bg-white'}`}><summary className="cursor-pointer text-sm font-bold">Ver resposta completa original</summary><p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{activeCase.fullAnswer}</p></details>
          <div className={`border-t pt-4 ${darkMode?'border-green-900/60':'border-green-200'}`}>
            <p className="mb-3 text-center text-sm font-bold">Como foi sua interpretação?</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={()=>rateCase('review')} className="rounded-xl border border-orange-400 px-4 py-3 font-bold text-orange-500">Preciso rever · próximo</button>
              <button type="button" onClick={()=>rateCase('mastered')} className="rounded-xl bg-green-600 px-4 py-3 font-bold text-white hover:bg-green-700">Acertei · próximo</button>
            </div>
          </div>
        </section>}
    </div>;
  }

  return <div className="space-y-5">
    <nav className={`grid grid-cols-2 gap-1 rounded-xl border p-1 ${darkMode?'border-gray-700 bg-gray-800':'border-gray-200 bg-white'}`} aria-label="Modos do Banco de ECG">
      {[['course','Curso prático'],['catalog','Catálogo de consulta']].map(([id, label]) => <button key={id} type="button" onClick={()=>setMode(id)} className={`rounded-lg px-3 py-2.5 text-sm font-bold ${mode===id?(darkMode?'bg-yellow-900/40 text-yellow-300':'bg-yellow-100 text-yellow-800'):(darkMode?'text-gray-400':'text-gray-600')}`}>{label}</button>)}
    </nav>

    {mode === 'course' ? <>
      <section className={`overflow-hidden rounded-2xl border ${darkMode?'border-gray-700 bg-gray-800':'border-gray-200 bg-white'}`}>
        <div className={`p-5 md:p-7 ${darkMode?'bg-gradient-to-br from-yellow-950/30 to-gray-800':'bg-gradient-to-br from-yellow-50 to-white'}`}>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-yellow-600">Treino deliberado</p>
          <div className="mt-2 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div><h3 className="font-serif text-3xl font-bold">Curso prático de ECG</h3><p className={`mt-2 max-w-2xl text-sm ${darkMode?'text-gray-400':'text-gray-600'}`}>Interprete um caso de cada vez, compare seu raciocínio com o gabarito e construa domínio por família eletrocardiográfica.</p></div>
            <button type="button" onClick={()=>startCourse(null)} className="rounded-xl bg-yellow-600 px-5 py-3 font-bold text-white hover:bg-yellow-700">{completedCount ? 'Continuar curso' : 'Começar pelo primeiro caso'}</button>
          </div>
          <div className="mt-6"><div className="mb-2 flex justify-between text-xs font-bold"><span>Progresso geral</span><span>{completedCount}/{cases.length} · {courseCompletion}%</span></div><ProgressBar value={courseCompletion} darkMode={darkMode}/></div>
        </div>
        <div className="grid grid-cols-3 border-t text-center text-sm md:text-base">
          <div className={`p-4 ${darkMode?'border-gray-700':'border-gray-200'}`}><strong className="block text-2xl text-yellow-600">{cases.length - completedCount}</strong><span className="text-xs opacity-60">novos</span></div>
          <div className={`border-l p-4 ${darkMode?'border-gray-700':'border-gray-200'}`}><strong className="block text-2xl text-green-600">{masteredCount}</strong><span className="text-xs opacity-60">acertei</span></div>
          <div className={`border-l p-4 ${darkMode?'border-gray-700':'border-gray-200'}`}><strong className="block text-2xl text-orange-500">{reviewCount}</strong><span className="text-xs opacity-60">rever</span></div>
        </div>
      </section>

      <section>
        <div className="mb-3"><p className="text-xs font-bold uppercase tracking-[.16em] text-yellow-600">Trilha por módulos</p><h3 className="mt-1 font-serif text-2xl font-bold">Escolha uma família para praticar</h3></div>
        <div className="grid gap-3 md:grid-cols-2">
          {families.map((familyName, index) => {
            const moduleCases = familyCases(familyName);
            const done = moduleCases.filter(item => resultFor(progress, item.id)).length;
            const mastered = moduleCases.filter(item => resultFor(progress, item.id) === 'mastered').length;
            const percent = moduleCases.length ? Math.round(done / moduleCases.length * 100) : 0;
            return <button key={familyName} type="button" onClick={()=>startCourse(familyName)} className={`rounded-2xl border p-4 text-left transition-transform hover:-translate-y-0.5 ${darkMode?'border-gray-700 bg-gray-800 hover:border-yellow-700':'border-gray-200 bg-white hover:border-yellow-400'}`}>
              <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-yellow-600">Módulo {String(index + 1).padStart(2, '0')}</p><h4 className="mt-1 font-bold leading-snug">{familyName}</h4></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${darkMode?'bg-gray-900':'bg-gray-100'}`}>{done}/{moduleCases.length}</span></div>
              <div className="mt-4"><ProgressBar value={percent} darkMode={darkMode}/><p className="mt-2 text-xs opacity-55">{mastered} dominados · {moduleCases.length - done} novos</p></div>
            </button>;
          })}
        </div>
      </section>
    </> : <>
      <section className={`rounded-2xl border p-5 md:p-7 ${darkMode?'border-gray-700 bg-gray-800':'border-gray-200 bg-white'}`}>
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-yellow-600">Consulta rápida</p><h3 className="mt-1 font-serif text-2xl font-bold">Catálogo dos 150 casos</h3><p className={`mt-1 text-sm ${darkMode?'text-gray-400':'text-gray-600'}`}>Use para localizar um diagnóstico ou reabrir um caso específico.</p></div><strong className="text-sm text-yellow-600">{filteredCases.length} encontrados</strong></div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Buscar diagnóstico, família ou número..." className={`rounded-xl border px-4 py-3 text-sm outline-none ${darkMode?'border-gray-700 bg-gray-900 text-white placeholder-gray-500':'border-gray-300 bg-white text-gray-900 placeholder-gray-400'}`}/>
          <select value={family} onChange={event=>setFamily(event.target.value)} className={`rounded-xl border px-4 py-3 text-sm outline-none ${darkMode?'border-gray-700 bg-gray-900 text-white':'border-gray-300 bg-white text-gray-900'}`} style={{colorScheme:darkMode?'dark':'light'}}><option value="all">Todas as famílias</option>{families.map(value=><option key={value} value={value}>{value}</option>)}</select>
        </div>
      </section>
      <div className={`overflow-hidden rounded-2xl border ${darkMode?'border-gray-700 bg-gray-800':'border-gray-200 bg-white'}`}>
        {!filteredCases.length ? <p className="p-8 text-center text-sm opacity-50">Nenhum caso corresponde aos filtros.</p> : filteredCases.map(item => {
          const status = resultFor(progress, item.id);
          const principal = (item.images || []).find(image => image.role === 'principal');
          return <button key={item.id} type="button" onClick={()=>openCase(item.id, null)} className={`flex w-full items-center gap-3 border-b p-3 text-left last:border-b-0 ${darkMode?'border-gray-700 hover:bg-gray-900/50':'border-gray-200 hover:bg-gray-50'}`}>
            {principal&&<img src={principal.url} alt={`ECG ${item.id}`} className={`h-16 w-24 flex-shrink-0 rounded-lg border object-contain ${darkMode?'border-gray-700 bg-gray-950':'border-gray-200 bg-white'}`} loading="lazy"/>}
            <span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase tracking-wide text-yellow-600">{item.id} · {item.primaryFamily}</span><strong className="mt-1 block text-sm leading-snug">{item.title}</strong></span>
            <span className={`hidden rounded-full px-2 py-1 text-[10px] font-bold sm:block ${status==='mastered'?'bg-green-500/15 text-green-600':status==='review'?'bg-orange-500/15 text-orange-500':darkMode?'bg-gray-900 text-gray-500':'bg-gray-100 text-gray-500'}`}>{status==='mastered'?'dominado':status==='review'?'rever':'novo'}</span>
          </button>;
        })}
      </div>
    </>}
  </div>;
}
