import React, { useRef, useState } from 'react';
import { readUsmleZip } from '../../services/usmlePackage.js';
import { deleteAllUsmlePackages, publishUsmlePackage } from '../../services/usmleStore.js';
import { stepLabel } from '../../services/usmleModel.js';

export default function UsmleImport({ catalog,uid,ready=false,onDone,onDeleted }) {
  const [step,setStep] = useState('step1');
  const [pack,setPack] = useState(null);
  const [busy,setBusy] = useState(false);
  const [percent,setPercent] = useState(0);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  const [deleting,setDeleting] = useState(false);
  const [deletePercent,setDeletePercent] = useState(0);
  const input = useRef(null);
  const read = async file => {
    if (!file || busy) return;
    setBusy(true);setPack(null);setError('');setMessage('Conferindo questões e arquivos…');setPercent(0);
    try { setPack(await readUsmleZip(file,step));setMessage('Pacote conferido. Revise os dados antes de importar.'); }
    catch(e) { setError(e.message);setMessage(''); }
    finally { setBusy(false);if (input.current) input.current.value = ''; }
  };
  const publish = async () => {
    setBusy(true);setError('');setMessage('Importando questões e imagens…');
    try {
      const result = await publishUsmlePackage(pack,setPercent);
      setMessage(result.duplicate ? 'Este pacote já está importado. Nenhuma questão foi duplicada.' : 'Importação concluída. O banco já está disponível para montar blocos.');
      setPack(null);onDone?.();
    } catch(e) { setError(`${e.message} Você pode tentar importar novamente; o banco anterior foi preservado.`); }
    finally { setBusy(false); }
  };
  const existing = pack && catalog.find(p => p.id === pack.id);
  const deleteAll = async () => {
    if (busy || deleting || !ready || !catalog.length) return;
    const totalQuestions = catalog.reduce((total,item) => total + (Number(item.total) || 0),0);
    const confirmed = window.confirm(`Excluir permanentemente ${totalQuestions.toLocaleString('pt-BR')} questões de ${catalog.length} pacote(s) do USMLE?\n\nTambém serão apagadas todas as versões, imagens e áudios desses pacotes. Histórico, desempenho, favoritos e notas pessoais serão preservados, mas os blocos antigos não poderão ser reabertos sem reimportar os mesmos pacotes.`);
    if (!confirmed) return;
    setDeleting(true);setDeletePercent(0);setError('');setMessage('Excluindo pacotes, versões e arquivos do USMLE…');
    try {
      const result = await deleteAllUsmlePackages({ catalog,uid,onProgress:setDeletePercent });
      setMessage(`${result.packages} pacote(s) e ${totalQuestions.toLocaleString('pt-BR')} questões foram excluídos. O histórico pessoal foi preservado.`);
      setPack(null);onDeleted?.(result);
    } catch(e) {
      setError(`${e.message || 'Não foi possível concluir a exclusão.'} Tente novamente para remover os itens restantes.`);
      setMessage('');
    } finally { setDeleting(false); }
  };
  return <section className="usmle-panel usmle-import">
    <div className="usmle-section-heading"><div><p className="usmle-eyebrow">ADMINISTRAÇÃO</p><h2>Adicionar um banco de questões</h2><p>Envie um pacote por matéria. Você pode reunir diferentes bancos no mesmo arquivo.</p></div></div>
    <label className="usmle-field">Etapa do exame<select disabled={busy || !!pack} value={step} onChange={e => setStep(e.target.value)}><option value="step1">Step 1</option><option value="step2">Step 2 CK</option></select></label>
    <div className="usmle-upload" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault();read(e.dataTransfer.files[0]); }}>
      <span className="usmle-upload-mark" aria-hidden="true">↑</span><h3>Arraste seu pacote .zip</h3>
      <p>Questões, comentários e imagens em um único envio.</p>
      <button className="usmle-button" disabled={busy} onClick={() => input.current?.click()}>Escolher arquivo</button>
      <input ref={input} type="file" accept=".zip,application/zip" hidden onChange={e => read(e.target.files[0])}/>
      <small>Até 90 MB por arquivo</small>
    </div>
    {message && <p className="usmle-notice" role="status">{message}</p>}
    {busy && percent > 0 && <progress max="100" value={percent} aria-label="Progresso da importação"/>}
    {error && <p className="usmle-error" role="alert">{error}</p>}
    {pack && <div className="usmle-import-preview">
      <span className="usmle-tag">{stepLabel(pack.step)}</span><h3>{pack.title}</h3>
      <div className="usmle-stats"><div><strong>{pack.questions.length.toLocaleString('pt-BR')}</strong><span>questões</span></div><div><strong>{pack.assets.length.toLocaleString('pt-BR')}</strong><span>arquivos</span></div><div><strong>{new Set(pack.questions.map(q => q.questionBank)).size}</strong><span>bancos de origem</span></div></div>
      <p>{[...new Set(pack.questions.map(q => q.questionBank))].join(' · ')}</p>
      {!!pack.warnings.imageOptions && <p>{pack.warnings.imageOptions} questões têm alternativas na imagem. Elas preservam a figura e permitem informar a letra.</p>}
      {!!pack.warnings.missingAudio && <p>{pack.warnings.missingAudio} questões não incluem o áudio original e ficam fora dos blocos por padrão.</p>}
      {!!pack.warnings.missingVisual && <p>{pack.warnings.missingVisual} questões precisam da imagem de alternativas, mas só incluem figuras do comentário. Serão preservadas no pacote e ficarão fora dos blocos até uma versão corrigida.</p>}
      {pack.questions.some(q => q.unavailableReason) && <details className="usmle-help"><summary>Questões com imagem de alternativas pendente</summary><p>{pack.questions.filter(q => q.unavailableReason).map(q => q.id).join(', ')}</p></details>}
      {!!pack.warnings.noExplanation && <p>{pack.warnings.noExplanation} questões não têm comentário no material enviado.</p>}
      {existing && <p className="usmle-notice">{existing.release === pack.release ? 'Este arquivo já foi importado.' : 'Uma nova versão substituirá este pacote no catálogo. Histórico e anotações serão preservados pelos IDs das questões.'}</p>}
      <div className="usmle-actions"><button className="usmle-button primary" disabled={busy} onClick={publish}>{busy ? `Importando · ${percent}%` : existing ? 'Importar versão' : 'Importar questões'}</button><button className="usmle-button quiet" disabled={busy} onClick={() => { setPack(null);setMessage(''); }}>Cancelar</button></div>
    </div>}
    <details className="usmle-help"><summary>Como preparar outros pacotes</summary><p>O ZIP deve conter <code>questions.json</code> na raiz e as pastas <code>images/</code> e <code>audio/</code>, quando necessárias. Use o mesmo formato do pacote de Cardiologia. O campo <code>questionBank</code> aceita outros bancos, incluindo Mehlman. Mantenha o título do pacote e os IDs para atualizar conteúdo sem perder o histórico.</p><p>A importação preserva o idioma, as alternativas, o gabarito e os comentários. Ela não gera nem traduz questões.</p></details>
    {catalog.length > 0 && <div className="usmle-imported"><h3>Pacotes importados</h3>{catalog.map(p => <div key={p.id} className="usmle-package-row"><div><strong>{p.title}</strong><small>{stepLabel(p.step)} · {p.banks?.join(', ')}</small></div><span>{p.total.toLocaleString('pt-BR')} questões</span></div>)}</div>}
    {catalog.length > 0 && <section className="usmle-danger-zone"><div><h3>Excluir os bancos atuais</h3><p>Remove do Firestore todas as questões, versões e mídias importadas do USMLE. Seu histórico, desempenho, favoritos e notas não serão apagados.</p></div><button type="button" className="usmle-button danger" disabled={busy||deleting||!ready} onClick={deleteAll}>{deleting ? `Excluindo · ${deletePercent}%` : ready ? 'Excluir todas as questões' : 'Confirmando banco remoto…'}</button>{deleting&&<progress max="100" value={deletePercent} aria-label="Progresso da exclusão"/>}</section>}
  </section>;
}
