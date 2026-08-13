import React from 'react';

import { useFeatureContext } from '../FeatureContext.jsx';

const number = value => Number(value || 0).toLocaleString('pt-BR');
const percent = (value, total) => total ? `${Math.round((value / total) * 100)}%` : '0%';

const Metric = ({ value, label, detail, tone = 'default', darkMode }) => {
  const toneClass = tone === 'danger'
    ? darkMode?'border-red-900/70 bg-red-950/20 text-red-200':'border-red-200 bg-red-50 text-red-800'
    : tone === 'warning'
      ? darkMode?'border-yellow-900/70 bg-yellow-950/20 text-yellow-200':'border-yellow-200 bg-yellow-50 text-yellow-900'
      : tone === 'success'
        ? darkMode?'border-emerald-900/70 bg-emerald-950/20 text-emerald-200':'border-emerald-200 bg-emerald-50 text-emerald-900'
        : darkMode?'border-gray-700 bg-gray-900/40':'border-gray-200 bg-white';
  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <p className="font-serif text-2xl font-bold">{number(value)}</p>
      <p className="mt-0.5 text-xs font-bold uppercase tracking-wide opacity-70">{label}</p>
      {detail&&<p className="mt-1 text-xs leading-relaxed opacity-60">{detail}</p>}
    </div>
  );
};

const Breakdown = ({ title, rows, darkMode }) => (
  <section className={`rounded-2xl border p-4 ${darkMode?'border-gray-700 bg-gray-800':'border-gray-200 bg-white'}`}>
    <h3 className="font-serif text-xl font-bold">{title}</h3>
    <div className="mt-3 space-y-2">
      {rows.map(row=><div key={row.label} className="flex items-center justify-between gap-4 text-sm"><span className="opacity-65">{row.label}</span><strong>{number(row.value)}</strong></div>)}
    </div>
  </section>
);

export default function QuestionBankSizingView({ items = [] }) {
  const {
    addToast,
    darkMode,
    disabledCourseQuestions,
    inactivateQuestionBankSizingCandidates,
    Spinner,
  } = useFeatureContext();
  const [report, setReport] = React.useState(null);
  const [running, setRunning] = React.useState(false);
  const [inactivating, setInactivating] = React.useState(false);
  const [progress, setProgress] = React.useState({ current:0, total:0, subject:'' });
  const workerRef = React.useRef(null);

  React.useEffect(() => () => workerRef.current?.terminate(), []);

  const calculate = () => {
    workerRef.current?.terminate();
    setRunning(true);
    setReport(null);
    setProgress({ current:0, total:0, subject:'Preparando o acervo' });
    const worker = new Worker(new URL('../../workers/questionBankSizing.worker.js', import.meta.url), { type:'module' });
    workerRef.current = worker;
    worker.onmessage = event => {
      if (event.data?.type === 'progress') {
        setProgress(event.data.progress);
        return;
      }
      if (event.data?.type === 'complete') {
        setReport(event.data.report);
        setRunning(false);
        worker.terminate();
        workerRef.current = null;
        return;
      }
      if (event.data?.type === 'error') {
        setRunning(false);
        worker.terminate();
        workerRef.current = null;
        addToast(event.data.error, 'error', 4500);
      }
    };
    worker.onerror = () => {
      setRunning(false);
      worker.terminate();
      workerRef.current = null;
      addToast('Não foi possível dimensionar o banco.', 'error', 4500);
    };
    worker.postMessage({
      type:'calculate',
      sharedLibraryItems:items,
      disabledCourseQuestions:disabledCourseQuestions || [],
    });
  };

  const inactivateOutsideHighYield = async () => {
    if (inactivating || !report?.actions?.highYieldRemovalCandidates?.length) return;
    setInactivating(true);
    try {
      const result = await inactivateQuestionBankSizingCandidates({
        candidates:report.actions.highYieldRemovalCandidates,
        reason:report.actions.highYieldRemovalReason,
        scenarioLabel:'corte global do banco curado',
        reportSchema:report.schema,
        reportGeneratedAt:report.generatedAt,
      });
      if (result?.ok && result.added > 0) setReport(null);
    } finally {
      setInactivating(false);
    }
  };

  const total = report?.inventory?.total || 0;
  const curated = report?.inventory?.curated || 0;
  const progressPercent = progress.total ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="space-y-5">
      <section className={`rounded-2xl border p-5 md:p-6 ${darkMode?'border-gray-700 bg-gray-800':'border-gray-200 bg-white'}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-yellow-600">Retrato sob demanda</p>
            <h2 className="mt-1 font-serif text-2xl font-bold">Dimensionar o banco</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed opacity-65">
              Conta o que já existe e usa apenas a curadoria publicada e a auditoria local de similaridade. O cálculo não altera nada; a inativação exige o botão e uma confirmação separada.
            </p>
          </div>
          <button type="button" onClick={calculate} disabled={running||!items.length} className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-yellow-600 px-5 py-3 font-bold text-white disabled:opacity-40">
            {running&&<Spinner className="h-4 w-4"/>}{running?'Calculando…':report?'Recalcular retrato':'Calcular retrato'}
          </button>
        </div>
        {running&&<div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs"><span className="truncate opacity-60">{progress.subject}</span><strong>{progress.total?`${progress.current}/${progress.total}`:'…'}</strong></div>
          <div className={`h-2 overflow-hidden rounded-full ${darkMode?'bg-gray-700':'bg-gray-200'}`}><div className="h-full bg-yellow-600 transition-all" style={{width:`${progressPercent}%`}}/></div>
          <p className="mt-2 text-xs opacity-50">A comparação roda fora da interface para o site continuar responsivo.</p>
        </div>}
      </section>

      {!report&&!running&&<section className={`rounded-2xl border border-dashed p-8 text-center ${darkMode?'border-gray-700':'border-gray-300'}`}><p className="font-bold">O cálculo só começa quando você pedir.</p><p className="mt-1 text-sm opacity-55">Assim, entrar na Fábrica não dispara outra varredura pesada.</p></section>}

      {report&&<>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric value={total} label="questões ativas" detail={`${number(report.inventory.direct)} diretas · ${number(report.inventory.clinical)} clínicas`} darkMode={darkMode}/>
          <Metric value={curated} label="com curadoria válida" detail={`${percent(curated,total)} do banco atual`} darkMode={darkMode}/>
          <Metric value={report.highYield.keep.total} label="ficariam no banco curado" detail={`${number(report.highYield.keep.direct)} diretas · ${number(report.highYield.keep.clinical)} clínicas`} tone="success" darkMode={darkMode}/>
          <Metric value={report.highYield.remove.total} label="seriam inativadas" detail={`${number(report.highYield.remove.direct)} diretas · ${number(report.highYield.remove.clinical)} clínicas`} tone="danger" darkMode={darkMode}/>
        </div>

        {report.inventory.pending>0&&<div className={`rounded-xl border px-4 py-3 text-sm ${darkMode?'border-yellow-900/60 bg-yellow-950/20 text-yellow-100':'border-yellow-200 bg-yellow-50 text-yellow-900'}`}>
          Este retrato é parcial: <strong>{number(report.inventory.pending)} questões</strong> ainda não têm uma seleção publicada compatível com o banco atual. Elas entram no total e na auditoria de repetição, mas não recebem julgamento de qualidade ou importância.
        </div>}
        {report.inventory.alreadyInactive>0&&<div className={`rounded-xl border px-4 py-3 text-sm ${darkMode?'border-gray-700 bg-gray-900/40':'border-gray-200 bg-gray-50'}`}>
          Além do banco ativo, existem <strong>{number(report.inventory.alreadyInactive)} questões já inativas</strong> ({number(report.inventory.alreadyInactiveDirect)} diretas e {number(report.inventory.alreadyInactiveClinical)} clínicas). Elas não entram novamente nos cenários nem no botão abaixo.
        </div>}

        <section className={`rounded-2xl border p-5 md:p-6 ${darkMode?'border-emerald-900/70 bg-emerald-950/10':'border-emerald-200 bg-emerald-50/40'}`}>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-600">Novo núcleo global</p>
          <h3 className="mt-1 font-serif text-2xl font-bold">Essenciais, indispensáveis e importantes excepcionais</h3>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed opacity-70">
            Entre as questões com curadoria válida, ficam as do tier essencial, as de importância 5 e as de importância 4 quando a qualidade é excepcional (90–100). A união abaixo elimina as sobreposições. Questões ainda sem curadoria não entram no corte.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Metric value={report.highYield.essential.total} label="tier essencial" detail="Elegíveis e não bloqueadas" tone="success" darkMode={darkMode}/>
            <Metric value={report.highYield.indispensable.total} label="indispensáveis" detail="Importância 5" tone="success" darkMode={darkMode}/>
            <Metric value={report.highYield.importantExceptional.total} label="importantes excepcionais" detail="Importância 4 · qualidade ≥ 90" tone="success" darkMode={darkMode}/>
            <Metric value={report.highYield.keep.total} label="união que fica" detail={`${percent(report.highYield.keep.total,curated)} das curadas ativas`} tone="success" darkMode={darkMode}/>
            <Metric value={report.highYield.remove.total} label="fora do núcleo" detail="Serão inativadas globalmente" tone="danger" darkMode={darkMode}/>
          </div>
          <button
            type="button"
            onClick={inactivateOutsideHighYield}
            disabled={inactivating||!report.actions?.highYieldRemovalCandidates?.length}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 font-bold text-white hover:bg-red-700 disabled:opacity-40"
          >
            {inactivating&&<Spinner className="h-4 w-4"/>}
            {inactivating
              ? 'Aplicando corte global…'
              : `Inativar tudo fora do novo núcleo (${number(report.highYield.remove.total)})`}
          </button>
          <p className="mt-2 text-center text-xs opacity-60">A ação vale para todos os alunos, usa somente este retrato parcial e preserva o conteúdo original para auditoria.</p>
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <Breakdown title="Seleção pedagógica" darkMode={darkMode} rows={[
            {label:'Essenciais',value:report.breakdowns.tier.essential},
            {label:'Complementares',value:report.breakdowns.tier.complementary},
            {label:'Reserva',value:report.breakdowns.tier.reserve},
            {label:'Desativadas pela curadoria',value:report.breakdowns.tier.disabled},
            {label:'Ainda sem curadoria válida',value:report.breakdowns.tier.uncurated},
          ]}/>
          <Breakdown title="Importância" darkMode={darkMode} rows={[
            {label:'5 · indispensável',value:report.breakdowns.importance['5']},
            {label:'4 · importante',value:report.breakdowns.importance['4']},
            {label:'3 · útil',value:report.breakdowns.importance['3']},
            {label:'2 · apoio',value:report.breakdowns.importance['2']},
            {label:'1 · dispensável',value:report.breakdowns.importance['1']},
          ]}/>
          <Breakdown title="Qualidade" darkMode={darkMode} rows={[
            {label:'90–100 · excepcional',value:report.breakdowns.quality.exceptional90plus},
            {label:'75–89 · forte',value:report.breakdowns.quality.strong75to89},
            {label:'60–74 · utilizável',value:report.breakdowns.quality.usable60to74},
            {label:'Abaixo de 60 · problema relevante',value:report.breakdowns.quality.below60},
          ]}/>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Breakdown title="Papel da questão" darkMode={darkMode} rows={[
            {label:'Core',value:report.breakdowns.learningRole.core},
            {label:'Reforço',value:report.breakdowns.learningRole.reinforcement},
            {label:'Variação',value:report.breakdowns.learningRole.variation},
            {label:'Apenas prova',value:report.breakdowns.learningRole.exam_only},
          ]}/>
          <Breakdown title="Estilo cognitivo" darkMode={darkMode} rows={[
            {label:'Reconhecimento',value:report.breakdowns.cognitiveLevel.recognition},
            {label:'Compreensão',value:report.breakdowns.cognitiveLevel.understanding},
            {label:'Aplicação',value:report.breakdowns.cognitiveLevel.application},
            {label:'Raciocínio',value:report.breakdowns.cognitiveLevel.reasoning},
          ]}/>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Breakdown title="Sinais individuais de redução" darkMode={darkMode} rows={[
            {label:'Bloqueios objetivos',value:report.removal.hardMetadata.total},
            {label:'Qualidade abaixo de 60',value:report.breakdowns.quality.below60},
            {label:'Importância 1 ou 2',value:report.breakdowns.importance['1']+report.breakdowns.importance['2']},
            {label:'Papel de variação',value:report.breakdowns.learningRole.variation},
            {label:'Detalhe exclusivo de prova',value:report.breakdowns.learningRole.exam_only},
            {label:'Redundância alta e não canônica',value:report.removal.highCurationRedundancy.total},
            {label:'Excedentes pela auditoria textual',value:report.removal.probableDuplicates.total},
          ]}/>
          <Breakdown title="Status da curadoria" darkMode={darkMode} rows={[
            {label:'Ativas',value:report.breakdowns.status.active},
            {label:'Em reserva',value:report.breakdowns.status.reserve},
            {label:'Obsoletas',value:report.breakdowns.status.deprecated},
            {label:'Exigem conferência',value:report.breakdowns.status.review_required},
            {label:'Sem curadoria válida',value:report.breakdowns.status.uncurated},
          ]}/>
        </div>

        <section className={`rounded-2xl border p-5 md:p-6 ${darkMode?'border-gray-700 bg-gray-800':'border-gray-200 bg-white'}`}>
          <h3 className="font-serif text-2xl font-bold">Cenários para decidir</h3>
          <p className="mt-1 text-sm opacity-60">São contagens para planejamento, não uma ordem de exclusão.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Metric value={report.removal.conservativeMetadata.total} label="corte conservador por metadados" detail={`${number(report.removal.conservativeMetadata.direct)} diretas · ${number(report.removal.conservativeMetadata.clinical)} clínicas`} tone="warning" darkMode={darkMode}/>
            <Metric value={report.removal.probableDuplicates.total} label="excedentes quase repetidas" detail={`${number(report.removal.probableDuplicates.groupCount)} grupos · ${number(report.removal.probableDuplicates.direct)} diretas · ${number(report.removal.probableDuplicates.clinical)} clínicas`} tone="danger" darkMode={darkMode}/>
            <Metric value={report.removal.conservativeCombined.total} label="corte conservador combinado" detail={`${percent(report.removal.conservativeCombined.total,total)} do banco · ${number(report.removal.conservativeCombined.direct)} diretas · ${number(report.removal.conservativeCombined.clinical)} clínicas`} tone="warning" darkMode={darkMode}/>
            <Metric value={report.removal.broadCombined.total} label="cenário amplo" detail={`${number(report.removal.broadCombined.direct)} diretas · ${number(report.removal.broadCombined.clinical)} clínicas`} tone="danger" darkMode={darkMode}/>
          </div>
          <div className={`mt-4 rounded-xl border p-4 text-xs leading-relaxed ${darkMode?'border-gray-700 bg-gray-900/50':'border-gray-200 bg-gray-50'}`}>
            <strong>Como ler:</strong> os cenários abaixo continuam servindo como comparação histórica. O corte global acionável está no quadro acima e mantém a união de essenciais, indispensáveis e importantes excepcionais. O corte conservador inclui bloqueios objetivos, qualidade abaixo de 60 e reservas que também sejam pouco importantes, variações, detalhes exclusivos de prova ou redundantes. O cenário amplo inclui toda reserva e toda desativada. A auditoria chama de quase repetida apenas similaridade provável; ela agrupa os pares e conta somente o excedente depois de preservar a melhor representante.
          </div>
          <p className="mt-3 text-xs opacity-50">Os sinais individuais acima se sobrepõem. Somente os cartões de cenário e a coluna “Combinado” eliminam a dupla contagem.</p>
        </section>

        <section className={`overflow-hidden rounded-2xl border ${darkMode?'border-gray-700 bg-gray-800':'border-gray-200 bg-white'}`}>
          <div className="p-5"><h3 className="font-serif text-2xl font-bold">Por matéria</h3><p className="mt-1 text-sm opacity-55">Nenhum enunciado é exibido; somente quantidades.</p></div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className={darkMode?'bg-gray-900/60':'bg-gray-50'}><tr>{['Matéria','Total','Diretas','Clínicas','Curadas','Novo núcleo','Fora do núcleo','Corte conservador','Repetidas','Combinado'].map(label=><th key={label} className="whitespace-nowrap px-4 py-3 font-bold">{label}</th>)}</tr></thead>
              <tbody>{report.subjects.map(row=><tr key={row.subject} className={`border-t ${darkMode?'border-gray-700':'border-gray-200'}`}>
                <td className="whitespace-nowrap px-4 py-3 font-bold">{row.subject}</td>
                {[row.total,row.direct,row.clinical,row.curated,row.highYieldKeep,row.highYieldRemoval,row.conservative,row.duplicateExcess,row.conservativeCombined].map((value,index)=><td key={index} className="px-4 py-3 tabular-nums">{number(value)}</td>)}
              </tr>)}</tbody>
            </table>
          </div>
        </section>
      </>}
    </div>
  );
}
