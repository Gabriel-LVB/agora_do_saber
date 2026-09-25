import React, { useEffect, useRef, useState } from 'react';
import { loadUsmleAsset } from '../../services/usmleStore.js';
import { formatUsmleStatement } from './usmleText.js';

function Media({ question,asset,onZoom }) {
  const [url,setUrl] = useState('');
  const [error,setError] = useState(false);
  const [attempt,setAttempt] = useState(0);
  useEffect(() => {
    let live = true;setUrl('');setError(false);
    loadUsmleAsset(question,asset.file).then(value => { if (live) setUrl(value); }).catch(() => { if (live) setError(true); });
    return () => { live = false; };
  },[question.packageId,question.release,asset.file,attempt]);
  if (error) return <div className="usmle-error" role="alert">Não foi possível carregar este arquivo. <button className="usmle-button" onClick={() => setAttempt(n => n+1)}>Tentar novamente</button></div>;
  if (!url) return <div className="usmle-media-loading" role="status">Carregando arquivo…</div>;
  if (asset.file.startsWith('audio/')) return <figure><audio controls preload="metadata" src={url} aria-label={asset.label || 'Áudio da questão'}/>{asset.transcript && <details><summary>Transcrição</summary><p>{asset.transcript}</p></details>}</figure>;
  return <figure className="usmle-figure"><button onClick={() => onZoom({ url,alt:asset.altText || 'Figura da questão' })} aria-label="Ampliar imagem"><img src={url} alt={asset.altText || 'Figura da questão'} loading="lazy"/></button><figcaption>{asset.credit} <span>Toque para ampliar</span></figcaption></figure>;
}

function HighlightedText({ value,highlights }) {
  if (!highlights?.length) return value;
  const expression = new RegExp(`(${highlights.map(s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})`,'g');
  return value.split(expression).map((part,index) => highlights.includes(part) ? <mark key={index}>{part}</mark> : part);
}

export default function UsmleQuestion({ question:q,answer,reveal,locked,onSelect,onConfirm,flag,onFlag,eliminated = [],onEliminate,highlights = [],onHighlights,annotation = {},onAnnotate }) {
  const [zoom,setZoom] = useState(null);
  const [note,setNote] = useState(annotation.note || '');
  const [noteStatus,setNoteStatus] = useState('');
  const [annotating,setAnnotating] = useState(false);
  const dialog = useRef(null), statement = useRef(null);
  useEffect(() => { if (zoom) dialog.current?.showModal(); },[zoom]);
  const annotate = async patch => {
    setAnnotating(true);setNoteStatus('Salvando…');
    try { await onAnnotate(patch);setNoteStatus('Salvo'); }
    catch(e) { setNoteStatus(e.message); }
    finally { setAnnotating(false); }
  };
  const highlight = () => {
    const selection = window.getSelection();
    const value = selection?.toString().trim();
    if (value && value.length <= 1000 && statement.current?.contains(selection.anchorNode) && statement.current?.contains(selection.focusNode)) {
      const next = [...new Set([...highlights,value])].slice(-10);
      while (next.join('').length > 1000) next.shift();
      onHighlights(next);selection.removeAllRanges();
    } else setNoteStatus('Selecione um trecho do enunciado para destacá-lo.');
  };
  return <article className="usmle-question">
    <div className="usmle-question-tools"><span className="usmle-tag">{q.questionBank}{q.sourceQuestionId ? ` · ${q.sourceQuestionId}` : ''}</span><div className="usmle-actions"><button className={`usmle-button quiet ${flag ? 'selected' : ''}`} aria-pressed={!!flag} onClick={onFlag}>⚑ {flag ? 'Sinalizada' : 'Sinalizar'}</button><button className={`usmle-button quiet ${annotation.favorite ? 'selected' : ''}`} disabled={annotating} aria-pressed={!!annotation.favorite} onClick={() => annotate({ favorite:!annotation.favorite })}>{annotation.favorite ? '★ Favorita' : '☆ Favoritar'}</button></div></div>
    <div className="usmle-text-tools"><button className="usmle-button quiet" onMouseDown={e => e.preventDefault()} onClick={highlight}>Destacar trecho</button>{highlights.length > 0 && <button className="usmle-button quiet" onClick={() => onHighlights([])}>Limpar destaques</button>}</div>
    <div className="usmle-statement" ref={statement} lang="en">{q.caseContext && <p>{q.caseContext}</p>}<p><HighlightedText value={formatUsmleStatement(q.statement)} highlights={highlights}/></p></div>
    {q.images.filter(a => a.placement === 'front').map(a => <Media key={a.file} question={q} asset={a} onZoom={setZoom}/>)}
    {q.audio.map(a => <Media key={a.file} question={q} asset={a} onZoom={setZoom}/>)}
    {q.sourceHasAudio && !q.audio.length && <p className="usmle-notice">O áudio original não acompanha esta questão.</p>}
    {q.options.length >= 2 && q.options.some(o => o.letter === q.correctAnswer) ? <div className="usmle-options" role="radiogroup" aria-label="Alternativas" lang="en">{q.options.map(option => {
      const selected = answer?.letter === option.letter;
      const correct = reveal && option.letter === q.correctAnswer;
      const wrong = reveal && selected && !correct;
      const removed = eliminated.includes(option.letter);
      return <div key={option.letter} className={`usmle-option ${selected ? 'is-selected' : ''} ${correct ? 'is-correct' : ''} ${wrong ? 'is-wrong' : ''} ${removed && !reveal ? 'is-eliminated' : ''}`}>
        <button role="radio" aria-checked={selected} disabled={locked || (removed && !selected)} onClick={() => onSelect(option.letter)}><span className="usmle-option-letter">{option.letter}</span><span>{option.text}</span>{reveal && (correct || wrong) && <strong className="usmle-option-result">{correct ? '✓ Correta' : '✕ Sua resposta'}</strong>}</button>
        {!reveal && <button className="usmle-strike" aria-label={`${removed ? 'Restaurar' : 'Riscar'} alternativa ${option.letter}`} aria-pressed={removed} disabled={locked || selected} onClick={() => onEliminate(option.letter)} title="Riscar alternativa">{removed ? '↶' : '−'}</button>}
      </div>;
    })}</div> : <label className="usmle-field usmle-image-answer">As alternativas estão na imagem. Digite a letra escolhida.<input aria-label="Letra da alternativa na imagem" maxLength={1} value={answer?.letter || ''} disabled={locked} onChange={e => { const letter = e.target.value.toUpperCase().replace(/[^A-Z]/g,'');onSelect(letter); }} autoComplete="off"/></label>}
    {onConfirm && !reveal && <button className="usmle-button primary" disabled={!answer?.letter || locked} onClick={onConfirm}>Confirmar resposta</button>}
    {reveal && <section className="usmle-explanation">
      <div className={`usmle-answer-heading ${answer?.letter === q.correctAnswer ? 'correct' : 'incorrect'}`}><h3>{!answer?.letter ? 'Questão não respondida' : answer.letter === q.correctAnswer ? 'Resposta correta' : 'Resposta incorreta'}</h3><span>Gabarito: {q.correctAnswer}</span></div>
      <p className="usmle-question-taxonomy">{[q.discipline,q.topic].filter(Boolean).join(' / ')}</p>
      {q.educationalObjective && <div className="usmle-objective"><h4>Objetivo de aprendizagem</h4><p lang="en">{q.educationalObjective}</p></div>}
      {q.explanation && <div className="usmle-prose" lang="en">{q.explanation}</div>}
      {q.images.filter(a => a.placement === 'back').map(a => <Media key={a.file} question={q} asset={a} onZoom={setZoom}/>)}
      {q.options.some(o => o.explanation) && <div className="usmle-option-explanations"><h4>Análise das alternativas</h4>{q.options.filter(o => o.explanation).map(o => <div key={o.letter}><strong>{o.letter}. {o.text}</strong><p lang="en">{o.explanation}</p></div>)}</div>}
      {!q.explanation && !q.options.some(o => o.explanation) && <p>O pacote original não contém comentário para esta questão.</p>}
      {q.percentCorrect !== null && <p className="usmle-source-stat">{q.percentCorrect}% de acerto informado pelo banco de origem</p>}
      {Object.keys(q.optionStatistics).length > 0 && <details className="usmle-help"><summary>Distribuição das respostas no banco de origem</summary>{Object.entries(q.optionStatistics).map(([letter,percent]) => <div className="usmle-stat-line" key={letter}><span>{letter}</span><progress max="100" value={percent}/><span>{percent}%</span></div>)}</details>}
      {q.references.length > 0 && <details className="usmle-help"><summary>Referências do material</summary>{q.references.map((r,i) => <p key={i}>{r}</p>)}</details>}
    </section>}
    <details className="usmle-notes"><summary>Anotações pessoais{annotation.note ? ' · 1 nota' : ''}</summary><label className="usmle-field"><span>O que você quer lembrar desta questão?</span><textarea maxLength={6000} rows={4} value={note} onChange={e => setNote(e.target.value)} onBlur={() => { if (note !== (annotation.note || '')) annotate({ note }); }} placeholder="Registre seu raciocínio, uma dúvida ou o ponto que precisa rever."/></label><button className="usmle-button" disabled={annotating || note === (annotation.note || '')} onClick={() => annotate({ note })}>Salvar anotação</button></details>
    {noteStatus && <p className="usmle-muted" role="status">{noteStatus}</p>}
    <dialog ref={dialog} className="usmle-zoom" onClose={() => setZoom(null)} aria-label="Imagem ampliada"><button className="usmle-button" onClick={() => dialog.current?.close()} autoFocus>Fechar imagem ×</button>{zoom && <img src={zoom.url} alt={zoom.alt}/>}</dialog>
  </article>;
}
