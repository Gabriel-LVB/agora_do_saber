import React, { useEffect, useMemo, useState } from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';
import useUsmleWorkspace from './useUsmleWorkspace.js';
import UsmleImport from './UsmleImport.jsx';
import UsmleSession, { formatTime } from './UsmleSession.jsx';
import { createSession, filterQuestions, performanceRows, stepLabel } from '../../services/usmleModel.js';
import './usmle.css';

const number = value => Number(value || 0).toLocaleString('pt-BR');
const initialFilters = { status:'unused',questionBank:'',discipline:'',topic:'',system:'',search:'',includeMissingAudio:false };
const date = value => new Date(value).toLocaleDateString('pt-BR',{ day:'2-digit',month:'short',year:'numeric' });

function Performance({ questions,progress }) {
  const [dimension,setDimension] = useState('discipline');
  const rows = useMemo(() => performanceRows(questions,progress,dimension),[questions,progress,dimension]);
  const exportCsv = () => {
    const cell = value => `"${String(value).replace(/^[=+@-]/,"'$&").replace(/"/g,'""')}"`;
    const csv = '\uFEFF'+[['Área','Questões','Respondidas','Acertos na primeira tentativa','Acerto (%)'],...rows.map(r => [r.name,r.total,r.answered,r.correct,r.percent ?? ''])].map(row => row.map(cell).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv],{ type:'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');a.href = url;a.download = 'usmle-desempenho.csv';a.click();setTimeout(() => URL.revokeObjectURL(url),1000);
  };
  return <section className="usmle-panel"><div className="usmle-section-heading"><div><h2>Onde você está avançando</h2><p>Acerto da primeira tentativa, nos pacotes selecionados. Refazer questões não altera essa medida.</p></div><button className="usmle-button" disabled={!rows.length} onClick={exportCsv}>Exportar CSV ↓</button></div>
    <div className="usmle-pills">{[['discipline','Disciplinas'],['topic','Assuntos'],['questionBank','Bancos'],['subject','Matérias']].map(([key,label]) => <button key={key} aria-pressed={dimension === key} className={dimension === key ? 'active' : ''} onClick={() => setDimension(key)}>{label}</button>)}</div>
    {rows.length ? <div className="usmle-performance-table"><div className="usmle-performance-labels"><span>Área de estudo</span><span>Resolvidas</span><span>Acerto</span></div>{rows.map(row => <div className="usmle-performance-row" key={row.name}><strong>{row.name}</strong><span>{number(row.answered)} / {number(row.total)}</span><div><progress value={row.percent || 0} max="100" aria-label={`Acerto em ${row.name}`}/><strong>{row.percent === null ? '—' : `${row.percent}%`}</strong></div></div>)}</div> : <div className="usmle-empty"><h3>Seu desempenho começa com o primeiro bloco</h3><p>Selecione um pacote para acompanhar a cobertura por área.</p></div>}
  </section>;
}

export default function UsmleView({ onSessionActive }) {
  const { user,darkMode,isAdmin } = useFeatureContext();
  if (!isAdmin) return null;
  return <UsmleWorkspace key={user.uid} uid={user.uid} darkMode={darkMode} onSessionActive={onSessionActive}/>;
}

function UsmleWorkspace({ uid,darkMode,onSessionActive }) {
  const w = useUsmleWorkspace(uid);
  const [tab,setTab] = useState('builder');
  const [step,setStep] = useState('step1');
  const [selected,setSelected] = useState([]);
  const [questions,setQuestions] = useState([]);
  const [sessionQuestions,setSessionQuestions] = useState([]);
  const [filters,setFilters] = useState(initialFilters);
  const [config,setConfig] = useState({ count:40,mode:'tutor',timed:false,random:true,secondsPerQuestion:90 });
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const [opening,setOpening] = useState(false);
  const [historyFilter,setHistoryFilter] = useState('all');
  const available = w.catalog.filter(p => p.step === step);
  const selectionKey = selected.join('|');
  useEffect(() => { onSessionActive?.(!!w.active);return () => onSessionActive?.(false); },[!!w.active,onSessionActive]);
  useEffect(() => {
    if (!selected.length && available.length) setSelected([available[0].id]);
  },[w.catalog,step]);
  useEffect(() => {
    let live = true;setError('');setQuestions([]);
    const packs = w.catalog.filter(p => selected.includes(p.id) && p.step === step);
    if (!packs.length) { setLoading(false);return; }
    setLoading(true);
    (async () => {
      const result = [];
      for (const pack of packs) result.push(...await w.load(pack));
      if (live) setQuestions(result);
    })().catch(e => { if (live) setError(e.message); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  },[selectionKey,step,w.catalog,w.load]);
  const matching = useMemo(() => filterQuestions(questions,filters,w.progress),[questions,filters,w.progress]);
  const studied = questions.filter(q => w.progress[q.key]?.lastAnswer);
  const correct = studied.filter(q => w.progress[q.key]?.firstCorrect).length;
  const incorrect = studied.filter(q => !w.progress[q.key]?.lastCorrect).length;
  const favorites = questions.filter(q => w.progress[q.key]?.favorite).length;
  const missingAudio = questions.filter(q => q.sourceHasAudio && !q.audio.length).length;
  const start = (items = matching,overrides = {}) => {
    try {
      const session = createSession(items,{ ...config,step,...overrides });
      session.runningSince = session.timed ? Date.now() : null;
      setSessionQuestions(items);w.openSession(session,items,{ save:true });window.scrollTo(0,0);
    } catch(e) { setError(e.message); }
  };
  const open = async session => {
    if (opening || w.saving || !w.ready) return;
    setOpening(true);setError('');
    try {
      const releases = [...new Map(session.questionRefs.map(ref => [`${ref.packageId}/${ref.release}`,ref])).values()];
      const loaded = [];
      for (const ref of releases) {
        const pack = w.catalog.find(p => p.id === ref.packageId);
        if (!pack) throw new Error('Um pacote deste bloco não está disponível. Importe-o novamente para retomar.');
        loaded.push(...await w.load(pack,ref.release));
      }
      const keys = new Set(session.questionRefs.map(ref => ref.key));
      const content = loaded.filter(q => keys.has(q.key));
      if (content.length !== keys.size) throw new Error('O conteúdo deste bloco está incompleto. Verifique os pacotes importados.');
      setSessionQuestions(content);w.openSession(session,content);window.scrollTo(0,0);
    } catch(e) { setError(e.message); }
    finally { setOpening(false); }
  };
  const changeStep = value => { setStep(value);setSelected([]);setFilters(initialFilters);setQuestions([]); };
  const setFilter = (key,value) => setFilters(current => ({ ...current,[key]:value,...(key === 'discipline' || key === 'questionBank' ? { topic:'' } : {}) }));
  const unfinished = w.sessions.filter(s => s.status !== 'completed');
  const canStart = w.ready && !loading && !opening && matching.length > 0 && !error && !w.error && !w.syncError && !w.saving;
  if (w.active) return <div className="usmle" data-dark={darkMode ? 'true' : 'false'}><UsmleSession session={w.active} questions={sessionQuestions} progress={w.progress} onChange={w.updateSession} onExit={w.closeSession} onAnnotate={w.annotate} saving={w.saving} syncError={w.syncError} onRetry={w.retry} onRepeat={items => start(items,{ mode:'tutor',timed:false,count:items.length,title:'Reforço · erros do bloco' })}/></div>;
  return <div className="usmle" data-dark={darkMode ? 'true' : 'false'}>
    <header className="usmle-header"><div><p className="usmle-eyebrow">ÁGORA DO SABER / BANCO DE QUESTÕES</p><h1>USMLE<span className="usmle-title-dot">.</span></h1><p>Um bloco de cada vez.</p></div><span className="usmle-admin-label">Acesso administrativo</span></header>
    <div className="usmle-step-bar"><div className="usmle-steps" aria-label="Etapa do USMLE">{['step1','step2'].map(value => <button key={value} aria-pressed={step === value} className={step === value ? 'active' : ''} onClick={() => changeStep(value)}>{stepLabel(value)}<span>{number(w.catalog.filter(p => p.step === value).reduce((n,p) => n+p.total,0))}</span></button>)}</div><span className="usmle-muted">{number(available.length)} {available.length === 1 ? 'pacote importado' : 'pacotes importados'}</span></div>
    <nav className="usmle-tabs" aria-label="Área USMLE">{[['builder','Montar bloco'],['performance','Desempenho'],['history','Histórico'],['import','Importar pacotes']].map(([key,label]) => <button key={key} aria-current={tab === key ? 'page' : undefined} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}</nav>
    {(w.error || error) && <div className="usmle-error" role="alert"><p>{w.error || error}</p><button className="usmle-button" onClick={() => window.location.reload()}>Tentar novamente</button></div>}
    {!w.ready && !w.error && <p className="usmle-notice" role="status">Sincronizando seu banco de questões…</p>}
    {opening && <p className="usmle-notice" role="status">Abrindo o bloco na versão original das questões…</p>}
    {tab === 'import' ? <UsmleImport catalog={w.catalog} uid={uid} ready={w.ready} onDeleted={()=>{w.clearContentCache();setSelected([]);setQuestions([]);}}/> : tab === 'history' ? <section className="usmle-panel"><div className="usmle-section-heading"><div><h2>Seus blocos</h2><p>Retome de onde parou ou volte às respostas. Os 50 blocos mais recentes aparecem aqui.</p></div></div><div className="usmle-pills">{[['all','Todos'],['active','Em andamento'],['completed','Concluídos']].map(([key,label]) => <button key={key} className={historyFilter === key ? 'active' : ''} aria-pressed={historyFilter === key} onClick={() => setHistoryFilter(key)}>{label}</button>)}</div>
      {w.recovery && <div className="usmle-notice"><p>Há um bloco preservado neste dispositivo: {w.recovery.title}.</p><button className="usmle-button" disabled={opening || !!w.saving} onClick={() => open(w.recovery)}>Abrir cópia local</button></div>}
      {w.sessions.filter(s => s.step === step && (historyFilter === 'all' || (historyFilter === 'active' ? s.status !== 'completed' : s.status === 'completed'))).map(session => <div className="usmle-history-row" key={session.id}><span className={`usmle-history-status ${session.status === 'completed' ? 'completed' : ''}`}>{session.status === 'completed' ? '✓' : 'Ⅱ'}</span><div><strong>{session.title}</strong><p>{date(session.startedAt)} · {session.mode === 'tutor' ? 'Estudo' : 'Prova'} · {session.questionRefs.length} questões</p></div><div className="usmle-history-score"><strong>{session.summary ? `${session.summary.percent}%` : `${Object.values(session.answers).filter(a => a.letter).length}/${session.questionRefs.length}`}</strong><small>{session.status === 'completed' ? 'concluído' : 'em andamento'}</small></div><button className="usmle-button" disabled={opening || !!w.saving} onClick={() => open(session)}>{session.status === 'completed' ? 'Revisar' : 'Retomar'} →</button></div>)}
      {!w.sessions.some(s => s.step === step) && <div className="usmle-empty"><h3>Nenhum bloco por aqui ainda</h3><p>Os blocos que você iniciar aparecerão neste histórico.</p><button className="usmle-button" onClick={() => setTab('builder')}>Montar primeiro bloco</button></div>}
    </section> : <>
      <div className="usmle-stats usmle-overview"><div><strong>{number(questions.length)}</strong><span>Questões selecionadas</span></div><div><strong>{number(studied.length)}<small> / {number(questions.length)}</small></strong><span>Já resolvidas</span></div><div><strong>{studied.length ? `${Math.round(correct/studied.length*100)}%` : '—'}</strong><span>Acerto na primeira tentativa</span></div><div><strong>{number(incorrect)}</strong><span>Erros para retomar</span></div></div>
      {available.length > 0 && <div className="usmle-package-picker"><div className="usmle-section-heading"><div><h2>Matérias do bloco</h2><p>Selecione uma ou combine várias matérias.</p></div>{available.length > 1 && <button className="usmle-button quiet" onClick={() => setSelected(available.map(p => p.id))}>Selecionar todas</button>}</div><div className="usmle-package-grid">{available.map(pack => <label key={pack.id} className={`usmle-package-choice ${selected.includes(pack.id) ? 'active' : ''}`}><input type="checkbox" checked={selected.includes(pack.id)} onChange={e => setSelected(p => e.target.checked ? [...p,pack.id] : p.filter(id => id !== pack.id))}/><span><strong>{pack.subject || pack.title}</strong><small>{pack.banks?.join(' · ')}</small></span><span className="usmle-package-count">{number(pack.total)}</span></label>)}</div></div>}
      {loading && <p className="usmle-notice" role="status">Carregando as matérias selecionadas…</p>}
      {tab === 'performance' ? <Performance questions={questions} progress={w.progress}/> : !available.length && w.ready ? <section className="usmle-panel usmle-empty"><span className="usmle-empty-mark">{step === 'step1' ? '01' : '02'}</span><h2>{stepLabel(step)} começa com o seu primeiro pacote</h2><p>Importe uma matéria para montar blocos, resolver questões e acompanhar seu desempenho.</p><button className="usmle-button primary" onClick={() => setTab('import')}>Importar pacote .zip ↑</button></section> : <>
        {unfinished.some(s => s.step === step) && <div className="usmle-resume"><div><strong>Continue de onde parou</strong><p>{unfinished.find(s => s.step === step)?.title}</p></div><button className="usmle-button" disabled={opening || !!w.saving} onClick={() => open(unfinished.find(s => s.step === step))}>Retomar bloco →</button></div>}
        <div className="usmle-builder"><section className="usmle-panel usmle-filter-panel"><div className="usmle-section-heading"><div><p className="usmle-eyebrow">01 / CONTEÚDO</p><h2>O que você quer estudar?</h2></div><button className="usmle-button quiet" onClick={() => setFilters(initialFilters)}>Limpar filtros</button></div>
          <div className="usmle-status-grid">{[['unused','Não resolvidas',questions.length-studied.length],['all','Todas',questions.length],['incorrect','Incorretas',incorrect],['favorites','Favoritas',favorites],['correct','Corretas',studied.length-incorrect],['notes','Com anotações',questions.filter(q => w.progress[q.key]?.note).length]].map(([key,label,count]) => <button key={key} aria-pressed={filters.status === key} className={filters.status === key ? 'active' : ''} onClick={() => setFilter('status',key)}><span>{label}</span><strong>{number(count)}</strong></button>)}</div>
          <div className="usmle-fields">{[['questionBank','Banco de origem'],['discipline','Disciplina'],['system','Sistema'],['topic','Assunto']].map(([field,label]) => {
            const options = [...new Set(questions.filter(q => field !== 'topic' || ((!filters.discipline || q.discipline === filters.discipline) && (!filters.questionBank || q.questionBank === filters.questionBank))).map(q => q[field]).filter(Boolean))].sort();
            return <label className="usmle-field" key={field}>{label}<select value={filters[field]} onChange={e => setFilter(field,e.target.value)}><option value="">Todos</option>{options.map(value => <option key={value} value={value}>{value}</option>)}</select></label>;
          })}</div>
          <label className="usmle-field">Buscar no banco<input type="search" placeholder="Assunto, trecho do enunciado ou ID da questão" value={filters.search} onChange={e => setFilter('search',e.target.value)}/></label>
          {missingAudio > 0 && <label className="usmle-checkbox"><input type="checkbox" checked={filters.includeMissingAudio} onChange={e => setFilter('includeMissingAudio',e.target.checked)}/><span>Incluir {missingAudio} questões sem o áudio original</span></label>}
          {questions.some(q => q.unavailableReason) && <p className="usmle-muted">{questions.filter(q => q.unavailableReason).length} questões preservadas aguardam a imagem das alternativas e não entram nos blocos.</p>}
          <div className="usmle-match-count" aria-live="polite"><strong>{number(matching.length)}</strong><span>questões disponíveis com estes filtros</span></div>
        </section><aside className="usmle-panel usmle-config-panel"><p className="usmle-eyebrow">02 / SEU BLOCO</p><h2>Como você quer praticar?</h2><div className="usmle-mode-options">{[['tutor','Estudo','Comentário após confirmar cada resposta.'],['exam','Prova','Gabarito e resultado ao encerrar o bloco.']].map(([key,label,desc]) => <button key={key} className={config.mode === key ? 'active' : ''} aria-pressed={config.mode === key} onClick={() => setConfig(c => ({ ...c,mode:key }))}><strong>{label}</strong><span>{desc}</span></button>)}</div>
          <label className="usmle-field">Quantidade de questões<input type="number" min="1" max="80" value={config.count} onChange={e => setConfig(c => ({ ...c,count:e.target.value }))}/></label><div className="usmle-count-presets">{[10,20,40,80].map(count => <button key={count} className={Number(config.count) === count ? 'active' : ''} aria-pressed={Number(config.count) === count} onClick={() => setConfig(c => ({ ...c,count }))}>{count}</button>)}</div>
          <label className="usmle-checkbox"><input type="checkbox" checked={config.timed} onChange={e => setConfig(c => ({ ...c,timed:e.target.checked }))}/><span>Usar cronômetro regressivo</span></label>
          {config.timed && <label className="usmle-field">Tempo por questão<select value={config.secondsPerQuestion} onChange={e => setConfig(c => ({ ...c,secondsPerQuestion:Number(e.target.value) }))}><option value={60}>1 minuto</option><option value={90}>1 minuto e 30 segundos</option><option value={120}>2 minutos</option><option value={180}>3 minutos</option></select></label>}
          <label className="usmle-checkbox"><input type="checkbox" checked={config.random} onChange={e => setConfig(c => ({ ...c,random:e.target.checked }))}/><span>Embaralhar a ordem das questões</span></label>
          <div className="usmle-block-summary"><strong>{Math.min(80,Math.max(1,Number(config.count) || 40),matching.length)} questões</strong><span>{config.timed ? `${formatTime(Math.min(80,Math.max(1,Number(config.count) || 40),matching.length)*config.secondsPerQuestion)} disponíveis` : 'No seu ritmo'}</span></div><button className="usmle-button primary usmle-start" disabled={!canStart} onClick={() => start()}>Iniciar bloco <span>→</span></button><p className="usmle-config-footnote">Você pode pausar e retomar pelo histórico.</p>
        </aside></div>
      </>}
    </>}
  </div>;
}
