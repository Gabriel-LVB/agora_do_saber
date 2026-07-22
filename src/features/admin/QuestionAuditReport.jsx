import React, { useMemo, useState } from 'react';
import { auditQuestionCollection, collectAuditableQuestions } from '../../services/questionAudit.js';

const compactText = (value, max = 260) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
};

const csvCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;

const downloadReportCsv = report => {
  const rows = [
    ['tipo','gravidade','similaridade','materia','origem_1','local_1','questao_1','origem_2','local_2','questao_2'],
    ...report.issues.map(issue => [
      'similaridade',
      issue.severity === 'probable' ? 'provavel duplicata' : 'revisar',
      `${Math.round(issue.score * 100)}%`,
      issue.left.subject,
      issue.left.sourceLabel,
      issue.left.label,
      issue.left.statement,
      issue.right.sourceLabel,
      issue.right.label,
      issue.right.statement,
    ]),
    ...report.conceptGroups.map(group => [
      'saturacao conceitual',
      `${group.records.length} ocorrencias`,
      '',
      group.subject,
      '',
      '',
      group.label,
      '',
      '',
      Object.entries(group.axes).map(([axis, count]) => `${axis}: ${count}`).join('; '),
    ]),
  ];
  const blob = new Blob([`\uFEFF${rows.map(row => row.map(csvCell).join(';')).join('\n')}`], { type:'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `auditoria-questoes-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const SummaryCard = ({ value, label, tone = 'default', darkMode }) => {
  const tones = {
    danger:darkMode ? 'border-red-900/70 bg-red-950/20 text-red-300' : 'border-red-200 bg-red-50 text-red-700',
    warning:darkMode ? 'border-yellow-900/70 bg-yellow-950/20 text-yellow-300' : 'border-yellow-200 bg-yellow-50 text-yellow-800',
    default:darkMode ? 'border-gray-700 bg-gray-900/60 text-gray-200' : 'border-gray-200 bg-gray-50 text-gray-800',
  };
  return (
    <div className={`rounded-xl border p-3 ${tones[tone]}`}>
      <p className="text-2xl font-serif font-bold">{value}</p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider opacity-65">{label}</p>
    </div>
  );
};

const QuestionExcerpt = ({ record, darkMode }) => (
  <div className={`rounded-xl border p-3 ${darkMode ? 'border-gray-700 bg-gray-900/60' : 'border-gray-200 bg-gray-50'}`}>
    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
      <span className={record.source === 'course' ? 'text-blue-500' : 'text-yellow-600'}>{record.sourceLabel}</span>
      <span className="opacity-40">·</span>
      <span className="opacity-55">{record.label || record.subject}</span>
    </div>
    <p className="mt-2 text-sm leading-relaxed">{compactText(record.statement)}</p>
    {record.answer && <p className="mt-2 text-xs opacity-60"><strong>Resposta:</strong> {compactText(record.answer, 160)}</p>}
  </div>
);

export default function QuestionAuditReport({
  isAdmin,
  sharedLibraryItems,
  vqBlocks,
  darkMode,
  onClose,
}) {
  const allRecords = useMemo(
    () => collectAuditableQuestions({ sharedLibraryItems, vqBlocks }),
    [sharedLibraryItems, vqBlocks],
  );
  const subjectRows = useMemo(() => {
    const bySubject = new Map();
    allRecords.forEach(record => {
      const current = bySubject.get(record.subject) || { subject:record.subject, total:0, course:0, library:0 };
      current.total += 1;
      current[record.source] += 1;
      bySubject.set(record.subject, current);
    });
    return [...bySubject.values()].sort((left, right) => left.subject.localeCompare(right.subject, 'pt-BR'));
  }, [allRecords]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [report, setReport] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [tab, setTab] = useState('similarity');
  const [source, setSource] = useState('all');
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('all');

  if (!isAdmin) return null;

  const runSubjectAudit = () => {
    if (!selectedSubject || calculating) return;
    setCalculating(true);
    setReport(null);
    setTimeout(() => {
      const subjectRecords = allRecords.filter(record => record.subject === selectedSubject);
      setReport(auditQuestionCollection(subjectRecords));
      setCalculating(false);
      setTab('similarity');
      setSource('all');
      setSearch('');
      setSeverity('all');
    }, 40);
  };

  if (!report) {
    const selectedRow = subjectRows.find(row => row.subject === selectedSubject);
    return (
      <div
        className="modal-scroll fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-black bg-opacity-90 p-3 sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Selecionar matéria para auditoria"
        onMouseDown={event => { if (event.target === event.currentTarget && !calculating) onClose(); }}
      >
        <div
          className={`flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${darkMode ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white text-gray-900'}`}
          style={{height:'min(720px, calc(100dvh - 2rem))', maxHeight:'calc(100dvh - 2rem)', overflow:'hidden'}}
          onMouseDown={event => event.stopPropagation()}
        >
          <header className={`flex flex-shrink-0 items-start justify-between gap-4 border-b p-4 sm:p-5 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-yellow-600">Somente administrador</p>
              <h2 className="mt-1 font-serif text-2xl font-bold sm:text-3xl">Auditoria por matéria</h2>
              <p className="mt-1 max-w-xl text-xs leading-relaxed opacity-60 sm:text-sm">
                Escolha uma matéria. Somente as questões dela serão processadas, evitando travar o site com o acervo inteiro.
              </p>
            </div>
            <button type="button" onClick={onClose} disabled={calculating} className={`h-10 w-10 flex-shrink-0 rounded-xl border text-xl disabled:opacity-40 ${darkMode ? 'border-gray-700 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-50'}`} aria-label="Fechar">×</button>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5">
            <div className={`mb-3 flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-55">Acervo encontrado</p>
                <p className="mt-0.5 font-serif text-xl font-bold">{allRecords.length} questões</p>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'}`}>{subjectRows.length} matérias</span>
            </div>
            {!subjectRows.length ? (
              <div className="py-12 text-center">
                <p className="font-bold">Nenhuma questão disponível.</p>
                <p className="mt-1 text-sm opacity-55">Atualize a Biblioteca ou aguarde o carregamento das questões do curso.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {subjectRows.map(row => (
                  <button
                    type="button"
                    key={row.subject}
                    disabled={calculating}
                    onClick={() => setSelectedSubject(row.subject)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left disabled:opacity-40 sm:px-4 ${selectedSubject === row.subject
                      ? (darkMode ? 'border-yellow-600 bg-yellow-950/25' : 'border-yellow-500 bg-yellow-50')
                      : (darkMode ? 'border-gray-700 bg-gray-900/40 hover:border-gray-600' : 'border-gray-200 bg-white hover:border-gray-300')}`}
                  >
                    <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${selectedSubject === row.subject ? 'border-yellow-500' : (darkMode ? 'border-gray-600' : 'border-gray-300')}`}>
                      {selectedSubject === row.subject && <span className="h-2.5 w-2.5 rounded-full bg-yellow-500"/>}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{row.subject}</span>
                      <span className="mt-0.5 block text-xs opacity-55">Curso: {row.course} · Biblioteca: {row.library}</span>
                    </span>
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{row.total}</span>
                  </button>
                ))}
              </div>
            )}
          </main>
          <footer className={`flex-shrink-0 border-t p-3 sm:p-4 ${darkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-gray-50'}`}>
            <button
              type="button"
              onClick={runSubjectAudit}
              disabled={!selectedSubject || calculating}
              className="w-full rounded-xl bg-yellow-600 px-5 py-3 font-bold text-white disabled:opacity-40"
            >
              {calculating ? `Analisando ${selectedSubject}…` : selectedRow ? `Analisar ${selectedRow.subject} (${selectedRow.total} questões)` : 'Escolha uma matéria'}
            </button>
          </footer>
        </div>
      </div>
    );
  }

  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
  const recordMatches = record => (
    (source === 'all' || record.source === source)
    && (!normalizedSearch || `${record.statement} ${record.answer} ${record.label}`.toLocaleLowerCase('pt-BR').includes(normalizedSearch))
  );
  const visibleIssues = report.issues.filter(issue => (
    (severity === 'all' || issue.severity === severity)
    && recordMatches(issue.left)
    && recordMatches(issue.right)
  ));
  const visibleConcepts = report.conceptGroups
    .map(group => ({ ...group, records:group.records.filter(recordMatches) }))
    .filter(group => group.records.length >= 3)
    .filter(group => !normalizedSearch || `${group.label} ${group.concept}`.toLocaleLowerCase('pt-BR').includes(normalizedSearch)
      || group.records.some(record => recordMatches(record)));

  return (
    <div
      className="modal-scroll fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-black bg-opacity-90 p-2 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Auditoria de questões"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        className={`w-full max-w-6xl overflow-y-auto rounded-2xl border shadow-2xl ${darkMode ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white text-gray-900'}`}
        style={{maxHeight:'calc(100dvh - 2rem)', overscrollBehavior:'contain'}}
        onMouseDown={event => event.stopPropagation()}
      >
        <header className={`flex flex-col gap-3 border-b p-3 sm:p-5 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-yellow-600">Somente administrador</p>
              <h2 className="mt-1 font-serif text-2xl font-bold sm:text-3xl">Auditoria · {report.records[0]?.subject || selectedSubject}</h2>
              <p className="mt-1 max-w-3xl text-xs opacity-60 sm:text-sm">
                Análise local, sem IA e sem consumo de tokens. Similaridade indica possível repetição; concentração mostra respostas/conceitos cobrados muitas vezes.
              </p>
            </div>
            <button type="button" onClick={onClose} className={`h-10 w-10 flex-shrink-0 rounded-xl border text-xl ${darkMode ? 'border-gray-700 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-50'}`} aria-label="Fechar">×</button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <SummaryCard value={report.summary.total} label="questões analisadas" darkMode={darkMode}/>
            <SummaryCard value={report.summary.course} label="do curso" darkMode={darkMode}/>
            <SummaryCard value={report.summary.library} label="da biblioteca" darkMode={darkMode}/>
            <SummaryCard value={report.summary.probable} label="prováveis duplicatas" tone="danger" darkMode={darkMode}/>
            <SummaryCard value={report.summary.review} label="pares para revisar" tone="warning" darkMode={darkMode}/>
            <SummaryCard value={report.summary.saturatedConcepts} label="conceitos concentrados" tone="warning" darkMode={darkMode}/>
          </div>
        </header>

        <div className={`border-b p-3 sm:p-4 ${darkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-gray-50'}`}>
          <div className="grid gap-2 md:grid-cols-[1fr_160px_160px_auto_auto]">
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar questão, resposta ou aula..." className={`rounded-xl border px-3 py-2.5 text-sm ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}/>
            <select value={source} onChange={event => setSource(event.target.value)} className={`rounded-xl border px-3 py-2.5 text-sm ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
              <option value="all">Curso + Biblioteca</option>
              <option value="course">Somente Curso</option>
              <option value="library">Somente Biblioteca</option>
            </select>
            {tab === 'similarity' ? (
              <select value={severity} onChange={event => setSeverity(event.target.value)} className={`rounded-xl border px-3 py-2.5 text-sm ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                <option value="all">Todas as gravidades</option>
                <option value="probable">Provável duplicata</option>
                <option value="review">Revisar</option>
              </select>
            ) : <div/>}
            <button type="button" onClick={() => downloadReportCsv(report)} disabled={!report.records.length} className={`rounded-xl border px-4 py-2.5 text-xs font-bold disabled:opacity-40 ${darkMode ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-white'}`}>Baixar CSV</button>
            <button type="button" onClick={() => { setReport(null); setSelectedSubject(''); }} className={`rounded-xl border px-4 py-2.5 text-xs font-bold ${darkMode ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-white'}`}>Trocar matéria</button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setTab('similarity')} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${tab === 'similarity' ? 'bg-yellow-600 text-white' : (darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600')}`}>
              Similaridade ({visibleIssues.length})
            </button>
            <button type="button" onClick={() => setTab('concepts')} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${tab === 'concepts' ? 'bg-yellow-600 text-white' : (darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600')}`}>
              Concentração conceitual ({visibleConcepts.length})
            </button>
          </div>
        </div>

        <main className="p-3 sm:p-5">
          {!report.records.length && (
            <div className="py-16 text-center">
              <p className="font-bold">Nenhuma questão disponível para analisar.</p>
              <p className="mt-1 text-sm opacity-55">Atualize a Biblioteca ou aguarde o carregamento das questões do curso.</p>
            </div>
          )}

          {report.records.length > 0 && tab === 'similarity' && (
            <div className="space-y-3">
              {!visibleIssues.length && <p className="py-12 text-center text-sm opacity-55">Nenhum par encontrado com os filtros atuais.</p>}
              {visibleIssues.map(issue => (
                <article key={issue.id} className={`rounded-2xl border p-4 ${issue.severity === 'probable' ? (darkMode ? 'border-red-900/70' : 'border-red-200') : (darkMode ? 'border-yellow-900/70' : 'border-yellow-200')}`}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${issue.severity === 'probable' ? 'bg-red-500/15 text-red-500' : 'bg-yellow-500/15 text-yellow-600'}`}>
                        {issue.severity === 'probable' ? 'Provável duplicata' : 'Revisar'}
                      </span>
                      {issue.exact && <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold uppercase text-red-500">Texto idêntico</span>}
                      {issue.sameAnswer && <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-500">Mesma resposta</span>}
                    </div>
                    <span className="font-mono text-sm font-bold">{Math.round(issue.score * 100)}% semelhante</span>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <QuestionExcerpt record={issue.left} darkMode={darkMode}/>
                    <QuestionExcerpt record={issue.right} darkMode={darkMode}/>
                  </div>
                </article>
              ))}
            </div>
          )}

          {report.records.length > 0 && tab === 'concepts' && (
            <div className="space-y-3">
              {!visibleConcepts.length && <p className="py-12 text-center text-sm opacity-55">Nenhuma concentração encontrada com os filtros atuais.</p>}
              {visibleConcepts.map(group => (
                <details key={group.key} className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-gray-50'}`}>
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-yellow-600">{group.subject}</p>
                        <h3 className="mt-1 font-bold">{compactText(group.label, 180)}</h3>
                        <p className="mt-1 text-xs opacity-55">
                          {Object.entries(group.axes).map(([axis, count]) => `${axis}: ${count}`).join(' · ')}
                        </p>
                      </div>
                      <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-bold text-yellow-600">{group.records.length} questões</span>
                    </div>
                  </summary>
                  <div className="mt-4 grid gap-2 lg:grid-cols-2">
                    {group.records.map(record => <QuestionExcerpt key={record.key} record={record} darkMode={darkMode}/>)}
                  </div>
                </details>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
