import React, { useState } from 'react';

const ic = (d) => ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} dangerouslySetInnerHTML={{__html:d}}/>;
const Printer = ic('<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>');
const escapeXml = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const stripInlineMarkdown = (s = '') => String(s).replace(/\*\*([^*\n]+?)\*\*/g, '$1').replace(/\*([^*\n]+?)\*/g, '$1');
const htmlishToText = (s = '') => stripInlineMarkdown(String(s).replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '')).trim();
const sanitizeFileName = (name = 'export') => (name || 'export').substring(0, 70).replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim() || 'export';
const parseInlineMarkdown = (text = '') => {
  const source = String(text || '')
    .replace(/<(?:strong|b)>([^<\n]+)<\/(?:strong|b)>/gi, '**$1**')
    .replace(/<(?:em|i)>([^<\n]+)<\/(?:em|i)>/gi, '*$1*');
  const parts = [];
  const re = /(\*\*([^*\n]+?)\*\*|\*([^*\n]+?)\*)/g;
  let last = 0;
  let match;
  while ((match = re.exec(source)) !== null) {
    if (match.index > last) parts.push({ text:source.slice(last, match.index), bold:false });
    parts.push({ text:match[2] || match[3] || '', bold:true });
    last = match.index + match[0].length;
  }
  if (last < source.length) parts.push({ text:source.slice(last), bold:false });
  return parts.length ? parts : [{ text:source, bold:false }];
};
const escapeHtml = (s = '') => parseInlineMarkdown(s).map(part => {
  const text = String(part.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return part.bold ? `<strong>${text}</strong>` : text;
}).join('');
const textToHtml = (s = '') => escapeHtml(s).replace(/\n/g, '<br>');

const EXPLANATION_LABELS = 'Explica[çc][aã]o|Corre[çc][aã]o|Coment[áa]rio|Justificativa|Fundamento|Racional|Racioc[íi]nio';
const QUESTION_OR_SEPARATOR_RE = /\n[ \t]*---(?=[ \t]*(?:\n[ \t]*(?:(?:\*\*|#{2,4})[ \t]*)?Quest[aã]o|$))|\n[ \t]*(?:(?:\*\*|#{2,4})[ \t]*)?Quest[aã]o|$/i;
const extractLabeledSection = (text = '', labels = EXPLANATION_LABELS, stopRe = QUESTION_OR_SEPARATOR_RE) => {
  const labelRe = new RegExp(
    `(?:^|\\n)[ \\t]*(?:[-*•][ \\t]*)?(?:\\*\\*)?[ \\t]*(?:${labels})[ \\t]*(?:(?:\\*\\*)?[ \\t]*[:\\-–—][ \\t]*(?:\\*\\*)?[ \\t]*|(?:\\*\\*)?[ \\t]*(?:\\n|$))`,
    'i'
  );
  const match = String(text || '').match(labelRe);
  if (!match) return '';
  const start = match.index + match[0].length;
  const rest = String(text || '').substring(start);
  const stop = rest.search(stopRe);
  return (stop >= 0 ? rest.substring(0, stop) : rest).trim();
};
const cleanQuestionExplanation = (explanation = '') => {
  let exp = String(explanation || '').replace(/\r\n/g, '\n').trim();
  if (!exp) return '';
  const labeled = extractLabeledSection(exp);
  if (labeled) exp = labeled;
  return exp
    .replace(/^(?:[Aa]lternativa[ \t]+correta|[Gg]abarito(?:[ \t]+oficial)?|[Rr]esposta(?:[ \t]+correta)?|[Cc]orreta)[ \t]*[:\-–—][^\n]*\n+/i, '')
    .replace(/^[-–—]+\s*/, '')
    .replace(/\n---.*$/s, '')
    .trim();
};
const cleanClinicalCaseContext = (context = '') => String(context || '')
  .replace(/^\s*Caso(?:-base|\s+cl[íi]nico)?\s*\d+\s*[—–:\-]\s*/i, '')
  .trim();
const splitQuestionCase = (question = {}) => {
  const explicitCase = String(question.caseContext || '').trim();
  const explicitStatement = String(question.statement || '').trim();
  if (explicitCase) return { caseContext:cleanClinicalCaseContext(explicitCase), statement:explicitStatement };
  const raw = explicitStatement.replace(/\r\n/g, '\n');
  if (!/^\s*Caso\s+\d+\b/i.test(raw)) return { caseContext:'', statement:raw };
  const parts = raw.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean);
  if (parts.length < 2) return { caseContext:'', statement:raw };
  return { caseContext:cleanClinicalCaseContext(parts[0]), statement:parts.slice(1).join('\n\n') };
};
const cleanStructuredExplanationPart = (text = '') => String(text || '')
  .replace(/\r\n/g, '\n')
  .replace(/^\s*(?:Aula|Alternativas)\s*:\s*/i, '')
  .replace(/\n---.*$/s, '')
  .trim();
const parseQuestionExplanationParts = (explanation = '') => {
  const raw = String(explanation || '').replace(/\r\n/g, '\n').trim();
  const markerSource = String.raw`\[{1,2}\s*ALT\s*[:\-]?\s*([A-E])\s*\]{1,2}`;
  if (!raw || !(new RegExp(markerSource, 'i')).test(raw)) return { hasStructured:false, lesson:'', alternatives:{} };
  const firstAlt = raw.search(new RegExp(markerSource, 'i'));
  const beforeAlt = firstAlt >= 0 ? raw.substring(0, firstAlt) : raw;
  const lessonMatch = beforeAlt.match(/(?:^|\n)\s*Aula\s*:\s*([\s\S]*?)(?:\n\s*Alternativas\s*:?\s*$|$)/i);
  const alternatives = {};
  const altRe = new RegExp(`${markerSource}\\s*([\\s\\S]*?)(?=\\n\\s*(?:\\*\\*)?${markerSource}(?:\\*\\*)?|$)`, 'gi');
  let m;
  while ((m = altRe.exec(raw)) !== null) {
    const letter = m[1].toUpperCase();
    const body = cleanStructuredExplanationPart(m[2]);
    if (body) alternatives[letter] = body;
  }
  return {
    hasStructured:Object.keys(alternatives).length > 0,
    lesson:cleanStructuredExplanationPart(lessonMatch?.[1] || beforeAlt),
    alternatives,
  };
};
const normalizeDisplayedAlternativeReferences = (text = '', displayLetter = '') => {
  const letter = String(displayLetter || '').trim().toUpperCase();
  if (!letter) return String(text || '');
  return String(text || '').replace(
    /\b((?:[Aa]\s+)?(?:alternativa|op[cç][aã]o|letra)\s+)(\*{0,2})([A-H])(\*{0,2})(?=\b)/gi,
    (_, prefix, open = '', _oldLetter, close = '') => `${prefix}${open}${letter}${close}`,
  );
};
const questionTypeLabel = (question = {}) => question.isCloze
  ? 'Cloze'
  : question.isFlashcard
    ? 'Flashcard'
    : question.isOpen
      ? (question.isEssay ? 'Dissertativa' : 'Aberta')
      : question.libraryQuestionKind === 'clinical' || splitQuestionCase(question).caseContext
        ? 'Clínica'
        : question.libraryQuestionKind === 'direct'
          ? 'Fixação'
          : 'Questão';
const getQuestionExportData = (question = {}) => {
  const parsed = parseQuestionExplanationParts(question.explanation || '');
  const alternatives = {
    ...(question.explanationParts?.alternatives || {}),
    ...(parsed.alternatives || {}),
  };
  const text = splitQuestionCase(question);
  const options = (question.options || []).map(opt => {
    const letter = String(opt.letter || '').toUpperCase();
    const originalLetter = String(opt.originalLetter || '').toUpperCase();
    const explanation = opt.explanation || alternatives[originalLetter] || alternatives[letter] || '';
    return { ...opt, explanation:normalizeDisplayedAlternativeReferences(explanation, letter) };
  });
  const lessonExplanation = cleanQuestionExplanation(question.explanationParts?.lesson || parsed.lesson || question.explanation || question.expectedAnswer || '');
  return {
    ...question,
    label:questionTypeLabel(question),
    caseContext:text.caseContext,
    statement:text.statement,
    options,
    explanation:lessonExplanation,
    hasAlternativeExplanations:options.some(opt => String(opt.explanation || '').trim()),
  };
};
const renderAlternativeAnalysisHtml = (options = [], opts = {}) => {
  const rows = (options || []).filter(o => o.explanation);
  if (!rows.length) return '';
  return `<div style="margin-top:${opts.compact?'10px':'12px'};border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#fff;font-family:Arial,sans-serif">
<div style="padding:9px 12px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:.08em;color:#6b7280">Análise das alternativas</div>
${rows.map((o, index)=>`<div style="display:flex;gap:10px;padding:10px 12px;${index?'border-top:1px solid #f1f5f9':''}">
<span style="width:24px;height:24px;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;flex:0 0 24px;font-size:12px;font-weight:bold;background:${o.isCorrect?'#dcfce7':'#f3f4f6'};color:${o.isCorrect?'#15803d':'#6b7280'}">${escapeHtml(o.letter)}</span>
<div style="min-width:0">
<p style="margin:0 0 3px;font-size:11px;font-weight:bold;color:${o.isCorrect?'#15803d':'#6b7280'}">${o.isCorrect?'Correta':'Incorreta'}</p>
<div style="font-size:12px;line-height:1.55;color:#374151">${textToHtml(o.explanation)}</div>
</div>
</div>`).join('')}
</div>`;
};
const PDF_EXPORT_STYLES = `
@page{margin:16mm}
*{box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;max-width:820px;margin:0 auto;padding:24px;color:#1f2937;background:#fff}
.export-header{border-bottom:1px solid #e5e7eb;margin-bottom:24px;padding-bottom:16px}
.export-brand{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:#92400e;margin-bottom:8px}
h1{font-family:Georgia,serif;color:#111827;font-size:29px;line-height:1.15;margin:0 0 8px}
.export-meta{font-size:12px;color:#6b7280;margin:0}
h2{font-family:Georgia,serif;color:#111827;font-size:22px;line-height:1.2;margin:30px 0 14px;border-bottom:1px solid #e5e7eb;padding-bottom:8px}
h3{font-size:14px;color:#92400e;margin:18px 0 8px}
.sub{color:#d97706;font-weight:800;margin-right:6px}
.lesson-content p{font-family:Georgia,serif;font-size:14px;line-height:1.72;margin:0 0 8px;color:#1f2937}
.lesson-content ul{margin:6px 0 10px 20px;padding:0}
.lesson-content li{font-family:Georgia,serif;font-size:14px;line-height:1.65;margin:3px 0}
.lesson-content table{border-collapse:collapse;width:100%;margin:12px 0;font-size:12px}
.lesson-content th{border:1px solid #d1d5db;padding:7px 9px;text-align:left;background:#f9fafb;color:#374151}
.lesson-content td{border:1px solid #e5e7eb;padding:7px 9px;color:#374151}
.question-card{border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:0 0 18px;page-break-inside:avoid;background:#fff}
.question-kicker{display:flex;align-items:center;gap:8px;margin:0 0 12px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#92400e}
.question-index{display:inline-flex;align-items:center;justify-content:center;min-width:26px;height:24px;border-radius:7px;background:#fef3c7;color:#92400e}
.case-box{border:1px solid #e5e7eb;background:#f9fafb;border-radius:10px;padding:12px 14px;margin:0 0 14px}
.case-label{margin:0 0 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#92400e}
.case-text{font-family:Georgia,serif;font-size:13px;line-height:1.6;color:#374151}
.question-statement{font-family:Georgia,serif;font-size:15px;line-height:1.65;margin:0 0 14px;color:#111827}
.option-row{display:flex;gap:10px;align-items:flex-start;border:1px solid #e5e7eb;border-radius:10px;padding:9px 11px;margin:7px 0;background:#fff}
.option-row.is-correct{border-color:#86efac;background:#f0fdf4}
.option-letter{display:inline-flex;align-items:center;justify-content:center;flex:0 0 26px;width:26px;height:26px;border-radius:8px;background:#f3f4f6;color:#4b5563;font-size:12px;font-weight:800}
.option-row.is-correct .option-letter{background:#22c55e;color:#fff}
.option-text{font-size:13px;line-height:1.55;color:#1f2937;padding-top:3px}
.answer-space{height:58px;border-bottom:1px dashed #cbd5e1;margin-top:12px}
.answer-card{border:1px solid #d1fae5;border-left:4px solid #22c55e;border-radius:12px;padding:14px 16px;margin:8px 0 28px;background:#fafffb;page-break-inside:avoid}
.answer-card.compact{margin-bottom:16px;background:#fff}
.answer-card.last{margin-bottom:16px}
.answer-title{margin:0 0 8px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#15803d}
.answer-correct{margin:0 0 10px;font-size:13px;font-weight:800;color:#065f46}
.explanation-box{border-left:3px solid #f59e0b;background:#fffbeb;border-radius:0 10px 10px 0;padding:11px 13px;margin-top:10px;font-family:Georgia,serif;font-size:13px;line-height:1.62;color:#374151}
.answer-separator{border-top:1px dashed #cbd5e1;margin:24px 0 10px;text-align:center}
.answer-separator span{position:relative;top:-8px;background:#fff;padding:0 10px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:#9ca3af}
.question-divider{border:0;border-top:1px solid #e5e7eb;margin:8px 0 30px}
.pb{page-break-before:always}
@media print{body{padding:0}.question-card,.answer-card,.case-box{break-inside:avoid}.pb{break-before:page}}
`;
const renderPdfHeader = ({ title = 'Exportar', meta = '' }) => `<header class="export-header">
<div class="export-brand">Ágora do Saber</div>
<h1>${escapeHtml(title)}</h1>
${meta ? `<p class="export-meta">${escapeHtml(meta)}</p>` : ''}
</header>`;
const renderPdfOptions = (options = [], { showAnswer = false } = {}) => (options || []).map(o => (
  `<div class="option-row ${showAnswer && o.isCorrect ? 'is-correct' : ''}">
<span class="option-letter">${escapeHtml(o.letter)}</span>
<div class="option-text">${textToHtml(o.text || '')}</div>
</div>`
)).join('');
const renderPdfQuestionHtml = (question, idx, { showAnswer = false, blank = false } = {}) => {
  const data = getQuestionExportData(question);
  const corr = data.options?.find(o => o.isCorrect);
  return `<article class="question-card">
<p class="question-kicker"><span class="question-index">${idx + 1}</span>${escapeHtml(data.label)}</p>
${data.caseContext ? `<section class="case-box"><p class="case-label">Cenário clínico</p><div class="case-text">${textToHtml(data.caseContext)}</div></section>` : ''}
<div class="question-statement">${textToHtml(data.statement || '')}</div>
${renderPdfOptions(data.options || [], { showAnswer })}
${blank ? '<div class="answer-space"></div>' : ''}
${showAnswer ? renderPdfAnswerHtml(question, idx, { embedded:true }) : ''}
</article>`;
};
const renderPdfAnswerHtml = (question, idx, { compact = false, embedded = false, isLast = false } = {}) => {
  const data = getQuestionExportData(question);
  const corr = data.options?.find(o => o.isCorrect);
  return `<section class="answer-card ${compact || embedded ? 'compact' : ''} ${isLast ? 'last' : ''}">
<p class="answer-title">Gabarito — ${escapeHtml(data.label)} ${idx + 1}</p>
${corr ? `<p class="answer-correct">${escapeHtml(corr.letter)}) ${textToHtml(corr.text || '')}</p>` : ''}
${data.explanation ? `<div class="explanation-box">${textToHtml(data.explanation)}</div>` : ''}
${data.hasAlternativeExplanations ? renderAlternativeAnalysisHtml(data.options, { compact:compact || embedded }) : ''}
</section>`;
};
const renderPdfDocument = (body = '') => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${PDF_EXPORT_STYLES}</style></head><body>${body}</body></html>`;

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const docxRuns = (text = '', opts = {}) => {
  const chunks = parseInlineMarkdown(text);
  return chunks.map(chunk => {
    const bold = opts.bold || chunk.bold;
    const clean = chunk.text;
    const props = [
      bold ? '<w:b/>' : '',
      opts.color ? `<w:color w:val="${opts.color}"/>` : '',
      opts.size ? `<w:sz w:val="${opts.size}"/>` : '',
      opts.italic ? '<w:i/>' : '',
    ].join('');
    return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ''}<w:t xml:space="preserve">${escapeXml(clean)}</w:t></w:r>`;
  }).join('');
};
const docxParagraph = (text = '', opts = {}) => {
  const lines = String(text || '').split(/\n+/).filter(line => line.trim());
  if (!lines.length && !opts.pageBreakBefore) return '';
  return lines.map((line, idx) => {
    const pPr = [
      opts.pageBreakBefore && idx === 0 ? '<w:pageBreakBefore/>' : '',
      opts.heading ? `<w:outlineLvl w:val="${opts.heading - 1}"/>` : '',
      opts.center ? '<w:jc w:val="center"/>' : '',
      `<w:spacing w:after="${opts.after ?? 120}" w:line="276" w:lineRule="auto"/>`,
      opts.border ? '<w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="E5E7EB"/></w:pBdr>' : '',
    ].join('');
    return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}${docxRuns(line, opts)}</w:p>`;
  }).join('');
};
const docxBullet = (text = '') =>
  `<w:p><w:pPr><w:ind w:left="720" w:hanging="360"/><w:spacing w:after="60"/></w:pPr><w:r><w:t xml:space="preserve">• ${escapeXml(htmlishToText(text))}</w:t></w:r></w:p>`;
const docxTable = (rows = []) => {
  if (!rows.length) return '';
  return `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="C7C7C7"/><w:left w:val="single" w:sz="4" w:color="C7C7C7"/><w:bottom w:val="single" w:sz="4" w:color="C7C7C7"/><w:right w:val="single" w:sz="4" w:color="C7C7C7"/><w:insideH w:val="single" w:sz="4" w:color="C7C7C7"/><w:insideV w:val="single" w:sz="4" w:color="C7C7C7"/></w:tblBorders></w:tblPr>${rows.map(row => `<w:tr>${row.map(cell => `<w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/></w:tcPr>${docxParagraph(cell, { after:60 })}</w:tc>`).join('')}</w:tr>`).join('')}</w:tbl>`;
};
const markdownToDocx = (md = '') => {
  const lines = String(md || '').split('\n');
  let xml = '';
  for (let i = 0; i < lines.length;) {
    const line = lines[i];
    if (/^\s*\|.+\|\s*$/.test(line)) {
      const tableLines = [];
      while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i])) tableLines.push(lines[i++]);
      const rows = tableLines
        .filter(l => !/^\s*\|[-:\s|]+\|\s*$/.test(l))
        .map(row => row.replace(/^\s*\|\s*/, '').replace(/\s*\|\s*$/, '').split(/\s*\|\s*/).map(htmlishToText));
      xml += docxTable(rows);
      continue;
    }
    if (/^\s*[-*•]\s/.test(line)) {
      while (i < lines.length && /^\s*[-*•]\s/.test(lines[i])) xml += docxBullet(lines[i++].replace(/^\s*[-*•]\s/, ''));
      continue;
    }
    if (!line.trim()) { i++; continue; }
    xml += docxParagraph(line, { after:80 });
    i++;
  }
  return xml;
};
let crcTable = null;
const makeCrcTable = () => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
};
const crc32 = (bytes) => {
  crcTable = crcTable || makeCrcTable();
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};
const u16 = (n) => [n & 255, (n >>> 8) & 255];
const u32 = (n) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
const createZipBlob = (entries, type) => {
  const enc = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;
  entries.forEach(entry => {
    const name = enc.encode(entry.name);
    const data = enc.encode(entry.content);
    const crc = crc32(data);
    const local = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0),
    ]);
    chunks.push(local, name, data);
    central.push({ name, crc, size:data.length, offset });
    offset += local.length + name.length + data.length;
  });
  const centralStart = offset;
  central.forEach(entry => {
    const head = new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(entry.crc), ...u32(entry.size), ...u32(entry.size), ...u16(entry.name.length),
      ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(entry.offset),
    ]);
    chunks.push(head, entry.name);
    offset += head.length + entry.name.length;
  });
  const centralSize = offset - centralStart;
  chunks.push(new Uint8Array([
    ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(central.length), ...u16(central.length),
    ...u32(centralSize), ...u32(centralStart), ...u16(0),
  ]));
  return new Blob(chunks, { type });
};
const createDocxBlob = (bodyXml) => {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${bodyXml}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  return createZipBlob([
    { name:'[Content_Types].xml', content:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>` },
    { name:'_rels/.rels', content:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>` },
    { name:'word/document.xml', content:documentXml },
  ], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
};
const AcademiaExportModal = ({ topic, subject, onClose, darkMode }) => {
  const [answerMode,  setAnswerMode]  = useState('after');        // 'after'|'end'|'none'
  const [fmt, setFmt] = useState('pdf');
  const lessonMode = 'end';
  const qPlace = 'end';
  const hideSubtitles = true;

  const boundaries = topic._topicBoundaries || [];
  const isFolder   = boundaries.length > 0;
  const subtopics  = topic.subtopics || [];

  const escape = s => escapeHtml(s);

  const mdToHtml = (md) => {
    if (!md) return '';
    const lines = md.split('\n');
    let html = ''; let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (/^\s*\|.+\|\s*$/.test(line)) {
        const tLines = [];
        while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i])) { tLines.push(lines[i]); i++; }
        const rows = tLines.filter(l => !/^\s*\|[-:\s|]+\|\s*$/.test(l));
        const cells = row => row.replace(/^\s*\|\s*/,'').replace(/\s*\|\s*$/,'').split(/\s*\|\s*/);
        if (rows.length > 0) {
          html += '<table>';
          html += '<thead><tr>' + cells(rows[0]).map(c=>`<th>${escape(c)}</th>`).join('') + '</tr></thead>';
          html += '<tbody>' + rows.slice(1).map((r,ri)=>`<tr>${cells(r).map(c=>`<td>${escape(c)}</td>`).join('')}</tr>`).join('') + '</tbody>';
          html += '</table>';
        }
        continue;
      }
      if (/^\s*[-*•]\s/.test(line)) {
        html += '<ul>';
        while (i < lines.length && /^\s*[-*•]\s/.test(lines[i])) {
          html += `<li>${escape(lines[i].replace(/^\s*[-*•]\s/,''))}</li>`; i++;
        }
        html += '</ul>'; continue;
      }
      if (!line.trim()) { html += '<br>'; i++; continue; }
      html += `<p>${escape(line)}</p>`; i++;
    }
    return html;
  };

  // Renders a single question. showAnswer controls whether gabarito appears.
  const renderQ = (q, localIdx, showAnswer) => renderPdfQuestionHtml(q, localIdx, { showAnswer });

  // Renders a gabarito block (for answerMode='end')
  const renderGabarito = (questions) => questions.map((q, qi) => renderPdfAnswerHtml(q, qi, { compact:true })).join('');

  const buildHtml = () => {
    let body = renderPdfHeader({
      title:topic.title || 'Academia',
      meta:[subject?.title, 'Ágora do Saber'].filter(Boolean).join(' • '),
    });

    const allFixqs = subtopics.flatMap((_,i) => topic.fixationQuestions?.[i]||[]);
    const extraQs  = (topic.extraBattery||[]).flatMap(b => b.questions||b);

    // Helper: render one block of subtopics (either whole topic or single tópico in folder)
    // localOffset: the index of the first subtopic in this block (for numbering restart per tópico)
    const renderExplanations = (subStart, subEnd, localOffset=0) => {
      let h = '';
      for (let si = subStart; si < subEnd; si++) {
        const section = topic.lessonSections?.[si];
        const localNum = String(si - subStart + 1).padStart(2,'0');
        if (!hideSubtitles) {
          h += `<h3><span class="sub">${localNum}.</span>${escape(section?.title || subtopics[si] || '')}</h3>`;
        }
        h += `<div class="lesson-content">${mdToHtml(section?.content || '')}</div>`;
      }
      return h;
    };

    const renderQBlock = (fixqs, label, showAns) => {
      if (!fixqs.length) return '';
      let h = label ? `<h3>${escape(label)}</h3>` : '';
      fixqs.forEach((q,qi) => { h += renderQ(q, qi, showAns); });
      return h;
    };

    if (!isFolder) {
      // ── SINGLE TOPIC ─────────────────────────────────────────────────────
      if (lessonMode === 'interleaved') {
        // Explanation per subtopic, then optionally its fixation q
        for (let si = 0; si < subtopics.length; si++) {
          const section = topic.lessonSections?.[si];
          const localNum = String(si + 1).padStart(2,'0');
          if (!hideSubtitles) {
            body += `<h3><span class="sub">${localNum}.</span>${escape(section?.title || subtopics[si] || '')}</h3>`;
          }
          body += mdToHtml(section?.content || '');
          if (answerMode !== 'end') {
            const fixqs = topic.fixationQuestions?.[si]||[];
            if (fixqs.length) body += renderQBlock(fixqs, null, answerMode==='after');
          }
        }
        if (answerMode === 'end' && allFixqs.length) {
          body += `<div class="pb"><h2>Questões de Fixação</h2>`;
          body += renderQBlock(allFixqs, null, false);
          body += `<div class="pb"><h2>Gabarito</h2>` + renderGabarito(allFixqs) + `</div>`;
          body += `</div>`;
        }
      } else {
        // lessonMode = 'end': all explanations first, then questions
        body += renderExplanations(0, subtopics.length);
        if (allFixqs.length) {
          body += `<div class="pb"><h2>Questões de Fixação</h2>`;
          body += renderQBlock(allFixqs, null, answerMode==='after');
          if (answerMode === 'end') {
            body += `<div class="pb"><h2>Gabarito</h2>` + renderGabarito(allFixqs) + `</div>`;
          }
          body += `</div>`;
        }
      }
    } else {
      // ── FOLDER EXPORT ────────────────────────────────────────────────────
      boundaries.forEach((b, bi) => {
        const topicFixqs = Array.from({length: b.end-b.start}, (_,i)=>topic.fixationQuestions?.[b.start+i]||[]).flat();
        const isFirst = bi === 0;

        body += `${isFirst?'':'<div class="pb">'}`;
        body += `<h2>${escape(b.title)}</h2>`;

        if (lessonMode === 'interleaved') {
          for (let si = b.start; si < b.end; si++) {
            const section = topic.lessonSections?.[si];
            const localNum = String(si - b.start + 1).padStart(2,'0');
            if (!hideSubtitles) {
              body += `<h3><span class="sub">${localNum}.</span>${escape(section?.title || subtopics[si] || '')}</h3>`;
            }
            body += mdToHtml(section?.content || '');
            // In interleaved mode, if qPlace=topic, questões appear after each subtopic
            if (qPlace === 'topic' && answerMode !== 'end') {
              const fixqs = topic.fixationQuestions?.[si]||[];
              if (fixqs.length) body += renderQBlock(fixqs, null, answerMode==='after');
            }
          }
        } else {
          // All explanations of this topic first
          body += renderExplanations(b.start, b.end);
        }

        // Questions after this topic block (if qPlace='topic')
        if (qPlace === 'topic' && topicFixqs.length && !(lessonMode==='interleaved' && answerMode!=='end')) {
          body += `<h3 style="margin-top:20px">Questões — ${escape(b.title)}</h3>`;
          topicFixqs.forEach((q,qi) => { body += renderQ(q, qi, answerMode==='after'); });
          if (answerMode === 'end') {
            body += `<h3>Gabarito — ${escape(b.title)}</h3>` + renderGabarito(topicFixqs);
          }
        }

        body += `${isFirst?'':'</div>'}`;
      });

      // If qPlace='end', dump all questions at the end
      if (qPlace === 'end' && allFixqs.length) {
        body += `<div class="pb"><h2>Questões de Fixação</h2>`;
        body += renderQBlock(allFixqs, null, answerMode==='after');
        if (answerMode === 'end') {
          body += `<div class="pb"><h2>Gabarito</h2>` + renderGabarito(allFixqs) + `</div>`;
        }
        body += `</div>`;
      }
    }

    if (extraQs.length) {
      body += `<div class="pb"><h2>Baterias Extras</h2>`;
      extraQs.forEach((q,qi) => { body += renderQ(q, qi, answerMode==='after'); });
      if (answerMode === 'end') {
        body += `<div class="pb"><h2>Gabarito — Baterias Extras</h2>` + renderGabarito(extraQs) + `</div>`;
      }
      body += `</div>`;
    }

    return renderPdfDocument(body);
  };

  const buildDocx = () => {
    let body = '';
    body += docxParagraph(topic.title || 'Academia', { bold:true, size:32, color:'92400E', after:80, border:true });
    body += docxParagraph(`${subject?.title || ''} • Ágora do Saber`, { size:20, color:'6B7280', after:260 });

    const allFixqs = subtopics.flatMap((_,i) => topic.fixationQuestions?.[i]||[]);
    const extraQs  = (topic.extraBattery||[]).flatMap(b => b.questions||b);

    const renderQuestion = (q, idx, showAnswer) => {
      const data = getQuestionExportData(q);
      let xml = docxParagraph(`${data.label} ${idx + 1}`, { bold:true, size:20, color:'92400E', after:40 });
      if (data.caseContext) {
        xml += docxParagraph('Cenário clínico', { bold:true, color:'92400E', after:40 });
        xml += docxParagraph(data.caseContext, { color:'374151', after:100 });
      }
      xml += docxParagraph(data.statement || '', { after:120 });
      (data.options || []).forEach(o => {
        xml += docxParagraph(`${o.letter}) ${o.text || ''}`, {
          after:60,
          bold: showAnswer && o.isCorrect,
          color: showAnswer && o.isCorrect ? '065F46' : undefined,
        });
      });
      if (showAnswer) {
        const corr = (data.options || []).find(o => o.isCorrect);
        if (corr) xml += docxParagraph(`Gabarito: ${corr.letter}) ${corr.text || ''}`, { bold:true, color:'15803D', after:80 });
        xml += docxParagraph(data.explanation || '', { color:'374151', after:160 });
        if (data.hasAlternativeExplanations) {
          xml += docxParagraph('Análise das alternativas', { bold:true, color:'374151', after:60 });
          (data.options || []).filter(o => o.explanation).forEach(o => {
            xml += docxParagraph(`${o.letter}. ${o.isCorrect ? 'Correta' : 'Incorreta'} — ${o.explanation}`, {
              color:o.isCorrect ? '15803D' : '374151',
              after:80,
            });
          });
        }
      }
      return xml;
    };
    const renderGabaritoDocx = (questions) => questions.map((q, qi) => {
      const data = getQuestionExportData(q);
      const corr = (data.options || []).find(o => o.isCorrect);
      let xml = docxParagraph(`Q${qi + 1}. ${corr ? `${corr.letter}) ${corr.text || ''}` : ''}`, { bold:true, color:'065F46', after:40 });
      xml += docxParagraph(data.explanation || '', { color:'374151', after:120 });
      if (data.hasAlternativeExplanations) {
        xml += docxParagraph('Análise das alternativas', { bold:true, color:'374151', after:40 });
        (data.options || []).filter(o => o.explanation).forEach(o => {
          xml += docxParagraph(`${o.letter}. ${o.isCorrect ? 'Correta' : 'Incorreta'} — ${o.explanation}`, {
            color:o.isCorrect ? '15803D' : '374151',
            after:70,
          });
        });
      }
      return xml;
    }).join('');
    const renderSections = (start, end) => {
      let xml = '';
      for (let si = start; si < end; si++) {
        const section = topic.lessonSections?.[si];
        if (!hideSubtitles) {
          xml += docxParagraph(`${String(si - start + 1).padStart(2, '0')}. ${section?.title || subtopics[si] || ''}`, { bold:true, color:'92400E', after:80 });
        }
        xml += markdownToDocx(section?.content || '');
      }
      return xml;
    };

    if (!isFolder) {
      if (lessonMode === 'interleaved') {
        for (let si = 0; si < subtopics.length; si++) {
          body += renderSections(si, si + 1);
          if (answerMode !== 'end') (topic.fixationQuestions?.[si] || []).forEach((q, qi) => { body += renderQuestion(q, qi, answerMode === 'after'); });
        }
        if (answerMode === 'end' && allFixqs.length) {
          body += docxParagraph('Questões de Fixação', { bold:true, size:28, pageBreakBefore:true, color:'92400E' });
          allFixqs.forEach((q, qi) => { body += renderQuestion(q, qi, false); });
          body += docxParagraph('Gabarito', { bold:true, size:28, pageBreakBefore:true, color:'92400E' }) + renderGabaritoDocx(allFixqs);
        }
      } else {
        body += renderSections(0, subtopics.length);
        if (allFixqs.length) {
          body += docxParagraph('Questões de Fixação', { bold:true, size:28, pageBreakBefore:true, color:'92400E' });
          allFixqs.forEach((q, qi) => { body += renderQuestion(q, qi, answerMode === 'after'); });
          if (answerMode === 'end') body += docxParagraph('Gabarito', { bold:true, size:28, pageBreakBefore:true, color:'92400E' }) + renderGabaritoDocx(allFixqs);
        }
      }
    } else {
      boundaries.forEach((b, bi) => {
        const topicFixqs = Array.from({length: b.end - b.start}, (_, i) => topic.fixationQuestions?.[b.start + i] || []).flat();
        body += docxParagraph(b.title, { bold:true, size:28, color:'374151', pageBreakBefore:bi > 0 });
        body += renderSections(b.start, b.end);
        if (qPlace === 'topic' && topicFixqs.length) {
          body += docxParagraph(`Questões — ${b.title}`, { bold:true, color:'92400E' });
          topicFixqs.forEach((q, qi) => { body += renderQuestion(q, qi, answerMode === 'after'); });
          if (answerMode === 'end') body += docxParagraph(`Gabarito — ${b.title}`, { bold:true, color:'92400E' }) + renderGabaritoDocx(topicFixqs);
        }
      });
      if (qPlace === 'end' && allFixqs.length) {
        body += docxParagraph('Questões de Fixação', { bold:true, size:28, pageBreakBefore:true, color:'92400E' });
        allFixqs.forEach((q, qi) => { body += renderQuestion(q, qi, answerMode === 'after'); });
        if (answerMode === 'end') body += docxParagraph('Gabarito', { bold:true, size:28, pageBreakBefore:true, color:'92400E' }) + renderGabaritoDocx(allFixqs);
      }
    }

    if (extraQs.length) {
      body += docxParagraph('Baterias Extras', { bold:true, size:28, pageBreakBefore:true, color:'92400E' });
      extraQs.forEach((q, qi) => { body += renderQuestion(q, qi, answerMode === 'after'); });
      if (answerMode === 'end') body += docxParagraph('Gabarito — Baterias Extras', { bold:true, size:28, pageBreakBefore:true, color:'92400E' }) + renderGabaritoDocx(extraQs);
    }
    return body;
  };

  const handleExport = () => {
    const html = buildHtml();
    if (fmt==='pdf') {
      const w = window.open('','_blank'); w.document.write(html); w.document.close(); w.print();
    } else {
      downloadBlob(createDocxBlob(buildDocx()), `${sanitizeFileName(topic.title || 'Academia')}.docx`);
    }
    onClose();
  };

  const dm = darkMode;
  const rc = (active) => `flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${active?(dm?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(dm?'border-gray-700 hover:border-gray-600':'border-gray-200 hover:border-gray-300')}`;

  return (
    <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4">
      <div className={`w-full max-w-lg rounded-2xl border overflow-y-auto p-8 ${dm?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`} style={{maxHeight:'calc(100dvh - 6rem)'}}>
        <h3 className="text-xl font-serif font-bold text-yellow-600 mb-6 flex items-center gap-3"><Printer className="w-6 h-6"/>Exportar {isFolder?'Pasta':'Aula'}</h3>

        <p className={`text-xs font-bold uppercase mb-3 ${dm?'text-gray-400':'text-gray-500'}`}>Gabarito e explicações</p>
        <div className="space-y-2 mb-5">
          {[{k:'after',title:'Logo após cada questão',desc:'Resposta e explicação abaixo de cada questão'},
            {k:'end',title:'No final (modo simulado)',desc:'Questões sem resposta + gabarito em página separada'},
            {k:'none',title:'Sem gabarito',desc:'Só enunciados e alternativas — para responder no papel'}
          ].map(o=>(
            <label key={o.k} className={rc(answerMode===o.k)}>
              <input type="radio" name="am" value={o.k} checked={answerMode===o.k} onChange={()=>setAnswerMode(o.k)} className="accent-yellow-600 mt-0.5 flex-shrink-0"/>
              <div><p className="font-bold text-sm">{o.title}</p><p className="text-xs opacity-50 mt-0.5">{o.desc}</p></div>
            </label>
          ))}
        </div>

        <p className={`text-xs font-bold uppercase mb-3 ${dm?'text-gray-400':'text-gray-500'}`}>Formato</p>
        <div className="flex gap-3 mb-8">
          {[{k:'pdf',l:'📄 PDF'},{k:'word',l:'📘 Word (.docx)'}].map(f=>(
            <button key={f.k} onClick={()=>setFmt(f.k)} className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${fmt===f.k?(dm?'border-yellow-500 bg-yellow-900/20 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-700 text-gray-400':'border-gray-200 text-gray-600')}`}>{f.l}</button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className={`flex-1 py-3 rounded-xl font-bold ${dm?'bg-gray-700 hover:bg-gray-600':'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
          <button onClick={handleExport} className="flex-1 px-5 py-3 bg-yellow-600 text-white rounded-xl font-bold hover:bg-yellow-700 flex items-center justify-center gap-2"><Printer className="w-4 h-4"/>Exportar</button>
        </div>
      </div>
    </div>
  );
};


// ─── EXPORT MODAL ─────────────────────────────────────────────────────────────
const ExportModal = ({ topic, subject, onClose, darkMode }) => {
  const [mode, setMode] = useState('study');   // 'study'|'exam'|'blank'
  const [fmt, setFmt]   = useState('pdf');     // 'pdf'|'word'

  const buildHtml = () => {
    const qs = topic.questions;
    let body = renderPdfHeader({
      title:topic.title || 'Exportar',
      meta:[`${qs.length} questões`, subject?.title, 'Ágora do Saber'].filter(Boolean).join(' • '),
    });

    if (mode==='blank') {
      qs.forEach((q, idx) => {
        body += renderPdfQuestionHtml(q, idx, { blank:true });
      });
    } else if (mode==='study') {
      // Study mode: each question appears WITHOUT answer highlighted,
      // then a big gap/separator, then the gabarito+explanation below.
      // This way you can answer it before accidentally seeing the response.
      qs.forEach((q, idx) => {
        const isLast = idx === qs.length - 1;
        body += renderPdfQuestionHtml(q, idx);
        // Spacer — big enough so the answer below isn't accidentally seen
        body += '<div class="answer-separator"><span>Gabarito</span></div>';
        // Answer + explanation
        body += renderPdfAnswerHtml(q, idx, { isLast });
        if (!isLast) body += '<hr class="question-divider">';
      });
    } else { // exam mode
      body += '<h2>Questões</h2>';
      qs.forEach((q, idx) => {
        body += renderPdfQuestionHtml(q, idx);
      });
      body += '<div class="pb"><h2>Gabarito e comentários</h2>';
      qs.forEach((q, idx) => {
        body += renderPdfAnswerHtml(q, idx, { compact:true });
      });
      body += '</div>';
    }
    return renderPdfDocument(body);
  };

  const buildDocx = () => {
    const qs = topic.questions || [];
    let body = docxParagraph(topic.title || 'Exportar', { bold:true, size:32, color:'92400E', after:80, border:true });
    body += docxParagraph(`${qs.length} questões • ${subject?.title || ''} • Ágora do Saber`, { size:20, color:'6B7280', after:260 });
    const renderQuestion = (q, idx, opts = {}) => {
      const data = getQuestionExportData(q);
      let xml = docxParagraph(`${data.label} ${idx + 1}`, { bold:true, size:20, color:'92400E', after:40 });
      if (data.caseContext) {
        xml += docxParagraph('Cenário clínico', { bold:true, color:'92400E', after:40 });
        xml += docxParagraph(data.caseContext, { color:'374151', after:100 });
      }
      xml += docxParagraph(data.statement || '', { after:120 });
      (data.options || []).forEach(o => {
        xml += docxParagraph(`${o.letter}) ${o.text || ''}`, {
          after:60,
          bold: opts.showAnswer && o.isCorrect,
          color: opts.showAnswer && o.isCorrect ? '065F46' : undefined,
        });
      });
      if (opts.blank) xml += docxParagraph('Resposta: ________________________________________________', { color:'9CA3AF', after:220 });
      return xml;
    };
    const renderAnswer = (q, idx) => {
      const data = getQuestionExportData(q);
      const corr = (data.options || []).find(o => o.isCorrect);
      let xml = docxParagraph(`Gabarito — ${data.label} ${idx + 1}`, { bold:true, color:'15803D', after:60 });
      if (corr) xml += docxParagraph(`${corr.letter}) ${corr.text || ''}`, { bold:true, color:'065F46', after:60 });
      xml += docxParagraph(data.explanation || '', { color:'374151', after:160 });
      if (data.hasAlternativeExplanations) {
        xml += docxParagraph('Análise das alternativas', { bold:true, color:'374151', after:60 });
        (data.options || []).filter(o => o.explanation).forEach(o => {
          xml += docxParagraph(`${o.letter}. ${o.isCorrect ? 'Correta' : 'Incorreta'} — ${o.explanation}`, {
            color:o.isCorrect ? '15803D' : '374151',
            after:80,
          });
        });
      }
      return xml;
    };

    if (mode === 'blank') {
      qs.forEach((q, idx) => { body += renderQuestion(q, idx, { blank:true }); });
    } else if (mode === 'study') {
      qs.forEach((q, idx) => {
        body += renderQuestion(q, idx);
        body += docxParagraph('GABARITO', { center:true, color:'D1D5DB', size:18, after:80, border:true });
        body += renderAnswer(q, idx);
      });
    } else {
      body += docxParagraph('QUESTÕES', { bold:true, size:26, color:'374151' });
      qs.forEach((q, idx) => { body += renderQuestion(q, idx); });
      body += docxParagraph('GABARITO E COMENTÁRIOS', { bold:true, size:28, color:'92400E', pageBreakBefore:true, border:true });
      qs.forEach((q, idx) => { body += renderAnswer(q, idx); });
    }
    return body;
  };

  const handleExport = () => {
    const html = buildHtml();
    if (fmt==='pdf') {
      const w = window.open('','_blank');
      w.document.write(html); w.document.close(); w.print();
    } else {
      downloadBlob(createDocxBlob(buildDocx()), `${sanitizeFileName(topic.title || 'questoes')}.docx`);
    }
    onClose();
  };

  const opts = [
    {k:'study', title:'Logo após cada questão', desc:'Resposta, explicação e análise das alternativas abaixo de cada questão'},
    {k:'exam', title:'No final (modo simulado)', desc:'Questões sem resposta + gabarito completo em página separada'},
    {k:'blank', title:'Sem gabarito', desc:'Só enunciados e alternativas — para responder no papel'},
  ];

  return (
    <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4">
      <div className={`w-full max-w-md rounded-2xl border overflow-y-auto p-8 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`} style={{maxHeight:'calc(100dvh - 6rem)'}}>
        <h3 className="text-xl font-serif font-bold text-yellow-600 mb-6 flex items-center gap-3"><Printer className="w-6 h-6"/>Exportar</h3>
        <p className={`text-xs font-bold uppercase mb-3 ${darkMode?'text-gray-400':'text-gray-500'}`}>Gabarito e explicações</p>
        <div className="space-y-3 mb-6">
          {opts.map(o=>(
            <label key={o.k} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${mode===o.k?(darkMode?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(darkMode?'border-gray-700 hover:border-gray-500':'border-gray-200 hover:border-gray-300')}`}>
              <input type="radio" name="mode" value={o.k} checked={mode===o.k} onChange={()=>setMode(o.k)} className="accent-yellow-600"/>
              <div><p className="font-bold text-sm">{o.title}</p><p className="text-xs opacity-50 mt-0.5">{o.desc}</p></div>
            </label>
          ))}
        </div>
        <div className="flex gap-3 mb-6">
          {[{k:'pdf',l:'📄 PDF'},{k:'word',l:'📘 Word (.docx)'}].map(f=>(
            <button key={f.k} onClick={()=>setFmt(f.k)} className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${fmt===f.k?(darkMode?'border-yellow-500 bg-yellow-900/20 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-700 text-gray-400':'border-gray-200 text-gray-600')}`}>{f.l}</button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className={`flex-1 py-3 rounded-xl font-bold ${darkMode?'bg-gray-700 hover:bg-gray-600':'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
          <button onClick={handleExport} className="flex-1 px-5 py-3 bg-yellow-600 text-white rounded-xl font-bold hover:bg-yellow-700">Exportar</button>
        </div>
      </div>
    </div>
  );
};
export { ExportModal, AcademiaExportModal };
