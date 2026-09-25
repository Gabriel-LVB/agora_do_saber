import React, { useEffect, useRef, useState } from 'react';
import { remainingTime, sessionScore } from '../../services/usmleModel.js';
import UsmleQuestion from './UsmleQuestion.jsx';

export const formatTime = seconds => `${Math.floor(Math.max(0,seconds)/60).toString().padStart(2,'0')}:${Math.floor(Math.max(0,seconds)%60).toString().padStart(2,'0')}`;

export default function UsmleSession({ session:s,questions,progress,onChange,onExit,onAnnotate,saving,syncError,onRetry,onRepeat }) {
  const [now,setNow] = useState(Date.now());
  const [review,setReview] = useState(false);
  const [finishOpen,setFinishOpen] = useState(false);
  const [showMap,setShowMap] = useState(false);
  const [mapFilter,setMapFilter] = useState('all');
  const [fullscreen,setFullscreen] = useState(false);
  const frame = useRef(null), heading = useRef(null), enteredAt = useRef(Date.now()), finishDialog = useRef(null);
  const currentRef = s.questionRefs[s.index];
  const q = questions.find(question => question.key === currentRef?.key);
  const answer = q && s.answers[q.key];
  const complete = s.status === 'completed';
  const reveal = complete || (s.mode === 'tutor' && answer?.committed);
  const paused = s.status === 'paused';
  const score = sessionScore(s,questions);
  const remaining = remainingTime(s,now);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()),1000);return () => clearInterval(timer); },[]);
  useEffect(() => { enteredAt.current = Date.now();heading.current?.focus(); },[q?.key]);
  useEffect(() => { if (finishOpen) finishDialog.current?.showModal(); },[finishOpen]);
  useEffect(() => {
    const listener = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange',listener);return () => document.removeEventListener('fullscreenchange',listener);
  },[]);
  const timedPatch = current => {
    const delta = Math.max(0,Math.floor((Date.now()-enteredAt.current)/1000));
    enteredAt.current = Date.now();
    return { elapsedSeconds:(current.elapsedSeconds || 0)+delta,
      remainingSeconds:remainingTime(current) ?? current.remainingSeconds,runningSince:current.timed ? Date.now() : null,
      timeByQuestion:{ ...current.timeByQuestion,[q.key]:(current.timeByQuestion?.[q.key] || 0)+delta } };
  };
  const finish = () => {
    setFinishOpen(false);
    onChange(current => ({ ...current,...timedPatch(current),status:'completed',completedAt:Date.now(),runningSince:null,summary:sessionScore(current,questions),
      answers:Object.fromEntries(Object.entries(current.answers).map(([key,a]) => [key,{ ...a,committed:!!a.letter }])) }));
  };
  useEffect(() => { if (!complete && !paused && s.timed && remaining === 0 && !syncError) finish(); },[remaining,complete,paused,s.timed,syncError]);
  const select = letter => {
    if (reveal || paused || syncError) return;
    onChange(current => {
      const time = timedPatch(current);
      return { ...current,...time,answers:{ ...current.answers,[q.key]:{ letter,committed:current.mode === 'exam',answeredAt:Date.now(),seconds:time.timeByQuestion[q.key] } } };
    });
  };
  const confirm = () => { if (!answer?.letter || reveal) return;onChange(current => ({ ...current,answers:{ ...current.answers,[q.key]:{ ...current.answers[q.key],committed:true,answeredAt:Date.now() } } })); };
  const go = index => {
    if (index < 0 || index >= s.questionRefs.length || syncError) return;
    if (complete) onChange({ ...s,index });
    else onChange(current => ({ ...current,...timedPatch(current),index }));
    window.scrollTo({ top:0,behavior:'auto' });
  };
  const flag = () => onChange(current => ({ ...current,flags:{ ...current.flags,[q.key]:!current.flags[q.key] } }));
  const pause = () => {
    onChange(current => ({ ...current,...timedPatch(current),status:'paused',runningSince:null }));
  };
  useEffect(() => {
    const back = event => { event.preventDefault();if (!complete && !paused) pause();else onExit(); };
    window.addEventListener('agora-usmle-back',back);return () => window.removeEventListener('agora-usmle-back',back);
  });
  useEffect(() => {
    const handle = event => {
      if (event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT|BUTTON/.test(event.target.tagName) || document.querySelector('dialog[open]') || paused || syncError) return;
      if (/^[1-9]$/.test(event.key) && q.options[Number(event.key)-1]) { event.preventDefault();select(q.options[Number(event.key)-1].letter); }
      if (event.key === 'ArrowRight') { event.preventDefault();go(s.index+1); }
      if (event.key === 'ArrowLeft') { event.preventDefault();go(s.index-1); }
      if (event.key.toLowerCase() === 'f') { event.preventDefault();flag(); }
      if (event.key === 'Enter' && s.mode === 'tutor' && !reveal) { event.preventDefault();confirm(); }
    };
    window.addEventListener('keydown',handle);return () => window.removeEventListener('keydown',handle);
  });
  if (!q) return <p className="usmle-error" role="alert">Não foi possível localizar a questão nesta versão do pacote.</p>;
  const result = complete && !review;
  return <section ref={frame} className={`usmle-session ${fullscreen ? 'is-fullscreen' : ''}`}>
    <header className="usmle-session-header"><div><p className="usmle-eyebrow">{s.mode === 'tutor' ? 'MODO ESTUDO' : 'MODO PROVA'}{s.timed ? ' · CRONOMETRADO' : ''}</p><h2 ref={heading} tabIndex={-1}>{result ? 'Resultado do bloco' : s.title}</h2></div><div className="usmle-actions">{!complete && <span className={`usmle-timer ${s.timed && remaining < 120 ? 'urgent' : ''}`} aria-label={s.timed ? 'Tempo restante' : 'Tempo de estudo'}>{formatTime(s.timed ? remaining : s.elapsedSeconds + (paused ? 0 : Math.floor((now-enteredAt.current)/1000)))}</span>}<button className="usmle-button quiet" onClick={async () => { try { if (document.fullscreenElement) await document.exitFullscreen();else await frame.current?.requestFullscreen(); } catch { /* Fullscreen is optional on unsupported browsers. */ } }} aria-label={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}>{fullscreen ? '↙' : '⛶'}</button><button className="usmle-button" disabled={!!syncError} onClick={() => { if (complete || paused) onExit();else pause(); }}>{complete || paused ? 'Voltar ao banco' : 'Pausar'}</button></div></header>
    <p className="usmle-sync" role="status">{syncError ? 'Alterações aguardando sincronização' : saving ? 'Salvando bloco…' : 'Bloco salvo'}</p>
    {syncError && <div className="usmle-error" role="alert"><p>{syncError}</p><div className="usmle-actions"><button className="usmle-button" onClick={onRetry}>Tentar salvar novamente</button><button className="usmle-button" onClick={onExit}>Reabrir pelo histórico</button></div></div>}
    {paused ? <div className="usmle-panel usmle-empty"><span className="usmle-empty-mark">Ⅱ</span><h3>Bloco pausado</h3><p>{score.answered} de {score.total} questões respondidas. Seu ponto de parada foi preservado.</p><button className="usmle-button primary" disabled={!!syncError} onClick={() => { enteredAt.current = Date.now();onChange(current => ({ ...current,status:'active',runningSince:current.timed ? Date.now() : null })); }}>Continuar bloco</button></div> : result ? <div className="usmle-panel usmle-result">
      <div className="usmle-result-heading"><strong>{score.percent}<span>%</span></strong><div><h3>Seu desempenho neste bloco</h3><p>{score.correct} acertos em {score.total} questões · {formatTime(s.elapsedSeconds)}</p></div></div>
      <div className="usmle-stats"><div><strong>{score.correct}</strong><span>Corretas</span></div><div><strong>{score.incorrect}</strong><span>Incorretas</span></div><div><strong>{score.omitted}</strong><span>Não respondidas</span></div><div><strong>{Object.values(s.flags).filter(Boolean).length}</strong><span>Sinalizadas</span></div></div>
      <p className="usmle-muted">O resultado descreve este bloco; não é uma estimativa de nota ou aprovação no USMLE.</p>
      <div className="usmle-actions"><button className="usmle-button primary" onClick={() => setReview(true)}>Revisar respostas</button><button className="usmle-button" disabled={saving > 0 || !!syncError || !score.incorrect} onClick={() => onRepeat(questions.filter(question => s.answers[question.key]?.letter && s.answers[question.key].letter !== question.correctAnswer))}>Refazer erros</button></div>
    </div> : <>
      <div className="usmle-session-progress"><span>Questão <strong>{s.index+1}</strong> / {score.total}</span><progress max={score.total} value={score.answered} aria-label="Questões respondidas"/><button className="usmle-button quiet" onClick={() => setShowMap(v => !v)} aria-expanded={showMap}>Mapa do bloco</button></div>
      {showMap && <div className="usmle-map-panel"><div className="usmle-actions">{[['all','Todas'],['unanswered','Em branco'],['flags','Sinalizadas']].map(([key,label]) => <button className={`usmle-button quiet ${mapFilter === key ? 'selected' : ''}`} key={key} aria-pressed={mapFilter === key} onClick={() => setMapFilter(key)}>{label}</button>)}</div><div className="usmle-question-map">{s.questionRefs.map((ref,i) => {
        const a = s.answers[ref.key];
        if (mapFilter === 'unanswered' && a?.letter || mapFilter === 'flags' && !s.flags[ref.key]) return null;
        const isCorrect = complete && a?.letter === questions.find(question => question.key === ref.key)?.correctAnswer;
        return <button key={ref.key} className={`${a?.letter ? 'answered' : ''} ${i === s.index ? 'current' : ''} ${complete && a?.letter ? isCorrect ? 'correct' : 'incorrect' : ''}`} aria-label={`Questão ${i+1}${s.flags[ref.key] ? ', sinalizada' : ''}${a?.letter ? ', respondida' : ', em branco'}`} aria-current={i === s.index ? 'step' : undefined} onClick={() => go(i)}>{i+1}{s.flags[ref.key] && <sup>⚑</sup>}</button>;
      })}</div></div>}
      <div className="usmle-panel"><UsmleQuestion key={q.key} question={q} answer={answer} reveal={reveal} locked={reveal || !!syncError} onSelect={select} onConfirm={s.mode === 'tutor' ? confirm : null} flag={s.flags[q.key]} onFlag={flag} eliminated={s.eliminated[q.key]} onEliminate={letter => onChange(current => ({ ...current,eliminated:{ ...current.eliminated,[q.key]:(current.eliminated[q.key] || []).includes(letter) ? current.eliminated[q.key].filter(l => l !== letter) : [...(current.eliminated[q.key] || []),letter] } }))} highlights={s.highlights[q.key]} onHighlights={values => onChange(current => ({ ...current,highlights:{ ...current.highlights,[q.key]:values } }))} annotation={progress[q.key]} onAnnotate={patch => onAnnotate(q.key,patch)}/></div>
      <footer className="usmle-session-footer"><button className="usmle-button" disabled={s.index === 0 || !!syncError} onClick={() => go(s.index-1)}>← Anterior</button>{complete ? <button className="usmle-button" onClick={() => setReview(false)}>Ver resultado</button> : <button className="usmle-button quiet" disabled={!!syncError} onClick={() => setFinishOpen(true)}>Encerrar bloco</button>}<button className="usmle-button primary" disabled={s.index === score.total-1 || !!syncError} onClick={() => go(s.index+1)}>Próxima →</button></footer>
      <p className="usmle-keyboard-hint">Teclado: 1–9 alternativas · Enter confirmar · ← → navegar · F sinalizar</p>
    </>}
    <dialog ref={finishDialog} className="usmle-confirm" onClose={() => setFinishOpen(false)} aria-labelledby="usmle-finish-title"><h3 id="usmle-finish-title">Encerrar este bloco?</h3><p>{score.omitted ? `${score.omitted} questões ainda estão em branco. ` : ''}O resultado será salvo e as respostas ficarão disponíveis para revisão.</p><div className="usmle-actions"><button className="usmle-button" onClick={() => finishDialog.current?.close()} autoFocus>Continuar resolvendo</button><button className="usmle-button primary" onClick={() => { finishDialog.current?.close();finish(); }}>Encerrar e ver resultado</button></div></dialog>
  </section>;
}
