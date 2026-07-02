import React, { useState } from 'react';

const ic = (d) => ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} dangerouslySetInnerHTML={{__html:d}}/>;
const Printer = ic('<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>');
const escapeXml = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const htmlishToText = (s = '') => String(s).replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '').replace(/\*\*/g, '').trim();
const sanitizeFileName = (name = 'export') => (name || 'export').substring(0, 70).replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim() || 'export';

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const docxRuns = (text = '', opts = {}) => {
  const chunks = String(text).split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return chunks.map(chunk => {
    const bold = opts.bold || (/^\*\*[^*]+\*\*$/.test(chunk));
    const clean = chunk.replace(/^\*\*|\*\*$/g, '');
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
  const [lessonMode,  setLessonMode]  = useState('interleaved'); // 'interleaved'|'end'
  const [qPlace,      setQPlace]      = useState('topic');        // 'topic'|'end'
  const [answerMode,  setAnswerMode]  = useState('after');        // 'after'|'end'|'none'
  const [hideSubtitles, setHideSubtitles] = useState(false);
  const [fmt, setFmt] = useState('pdf');

  const boundaries = topic._topicBoundaries || [];
  const isFolder   = boundaries.length > 0;
  const subtopics  = topic.subtopics || [];

  const escape = s => (s||'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');

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
          html += '<table style="border-collapse:collapse;width:100%;margin:10px 0;font-size:13px">';
          html += '<thead><tr>' + cells(rows[0]).map(c=>`<th style="border:1px solid #aaa;padding:6px 10px;text-align:left;background:#f5f5f5">${escape(c)}</th>`).join('') + '</tr></thead>';
          html += '<tbody>' + rows.slice(1).map((r,ri)=>`<tr>${cells(r).map(c=>`<td style="border:1px solid #ccc;padding:5px 10px">${escape(c)}</td>`).join('')}</tr>`).join('') + '</tbody>';
          html += '</table>';
        }
        continue;
      }
      if (/^\s*[-*•]\s/.test(line)) {
        html += '<ul style="margin:4px 0 4px 18px;padding:0">';
        while (i < lines.length && /^\s*[-*•]\s/.test(lines[i])) {
          html += `<li style="margin:2px 0;font-size:14px;line-height:1.6">${escape(lines[i].replace(/^\s*[-*•]\s/,''))}</li>`; i++;
        }
        html += '</ul>'; continue;
      }
      if (!line.trim()) { html += '<br>'; i++; continue; }
      html += `<p style="margin:0 0 6px;font-size:14px;line-height:1.7">${escape(line)}</p>`; i++;
    }
    return html;
  };

  // Renders a single question. showAnswer controls whether gabarito appears.
  const renderQ = (q, localIdx, showAnswer) => {
    const opts = q.options||[];
    return `<div style="margin-bottom:18px;page-break-inside:avoid">
<p style="font-size:10px;color:#777;text-transform:uppercase;letter-spacing:.05em;font-family:sans-serif;margin:0 0 3px">Questão ${localIdx+1}</p>
<p style="font-size:14px;margin:4px 0 8px;line-height:1.6">${escape(q.statement||'')}</p>
${opts.map(o=>`<div style="margin:2px 0;padding:5px 10px;border-radius:5px;font-size:13px;border:1px solid #ddd${showAnswer&&o.isCorrect?';border-color:#333;font-weight:bold':''}">${o.letter}) ${escape(o.text||'')}</div>`).join('')}
${showAnswer?`<div style="background:#f5f5f5;border-left:3px solid #555;padding:8px 12px;margin-top:8px;font-size:13px;line-height:1.5">${escape(q.explanation||'')}</div>`:''}
</div>`;
  };

  // Renders a gabarito block (for answerMode='end')
  const renderGabarito = (questions) => {
    let html = '';
    questions.forEach((q, qi) => {
      const corr = q.options?.find(o=>o.isCorrect);
      html += `<div style="padding:8px 12px;border-left:3px solid #555;margin-bottom:10px;font-size:13px">
<p style="font-weight:bold;margin:0 0 3px">Q${qi+1}. ${escape(corr?.letter||'')}. ${escape(corr?.text||'')}</p>
<p style="margin:0;color:#444;line-height:1.5">${escape(q.explanation||'')}</p>
</div>`;
    });
    return html;
  };

  const buildHtml = () => {
    const styles = `body{font-family:Georgia,serif;max-width:820px;margin:0 auto;padding:24px;color:#111}
h1{color:#92400e;border-bottom:3px solid #92400e;padding-bottom:8px;margin-bottom:4px}
h2{color:#374151;margin:28px 0 12px;border-bottom:1px solid #e5e7eb;padding-bottom:5px}
h3{color:#92400e;margin:16px 0 6px;font-size:15px;font-weight:bold}
.sub{color:#d97706;font-weight:bold;margin-right:6px}
.pb{page-break-before:always}
@media print{body{padding:8px}}`;

    let body = `<h1>${escape(topic.title)}</h1>
<p style="color:#888;font-size:13px;font-family:sans-serif;margin:0 0 20px">${escape(subject?.title||'')} • Ágora do Saber</p>`;

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
        h += mdToHtml(section?.content || '');
      }
      return h;
    };

    const renderQBlock = (fixqs, label, showAns) => {
      if (!fixqs.length) return '';
      let h = label ? `<h3 style="margin-top:20px">${label}</h3>` : '';
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
      extraQs.forEach((q,qi) => { body += renderQ(q, qi, answerMode!=='none'); });
      body += `</div>`;
    }

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${styles}</style></head><body>${body}</body></html>`;
  };

  const buildDocx = () => {
    let body = '';
    body += docxParagraph(topic.title || 'Academia', { bold:true, size:32, color:'92400E', after:80, border:true });
    body += docxParagraph(`${subject?.title || ''} • Ágora do Saber`, { size:20, color:'6B7280', after:260 });

    const allFixqs = subtopics.flatMap((_,i) => topic.fixationQuestions?.[i]||[]);
    const extraQs  = (topic.extraBattery||[]).flatMap(b => b.questions||b);

    const renderQuestion = (q, idx, showAnswer) => {
      let xml = docxParagraph(`Questão ${idx + 1}`, { bold:true, size:20, color:'92400E', after:40 });
      xml += docxParagraph(q.statement || '', { after:120 });
      (q.options || []).forEach(o => {
        xml += docxParagraph(`${o.letter}) ${o.text || ''}`, {
          after:60,
          bold: showAnswer && o.isCorrect,
          color: showAnswer && o.isCorrect ? '065F46' : undefined,
        });
      });
      if (showAnswer) {
        const corr = (q.options || []).find(o => o.isCorrect);
        if (corr) xml += docxParagraph(`Gabarito: ${corr.letter}) ${corr.text || ''}`, { bold:true, color:'15803D', after:80 });
        xml += docxParagraph(q.explanation || q.expectedAnswer || '', { color:'374151', after:220 });
      }
      return xml;
    };
    const renderGabaritoDocx = (questions) => questions.map((q, qi) => {
      const corr = (q.options || []).find(o => o.isCorrect);
      return docxParagraph(`Q${qi + 1}. ${corr ? `${corr.letter}) ${corr.text || ''}` : ''}`, { bold:true, color:'065F46', after:40 }) +
        docxParagraph(q.explanation || q.expectedAnswer || '', { color:'374151', after:160 });
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
      extraQs.forEach((q, qi) => { body += renderQuestion(q, qi, answerMode !== 'none'); });
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

        <p className={`text-xs font-bold uppercase mb-3 ${dm?'text-gray-400':'text-gray-500'}`}>Disposição da explicação</p>
        <div className="space-y-2 mb-5">
          {[{k:'interleaved',title:'Intercalada',desc:'Explicação de cada subtópico seguida das suas questões'},
            {k:'end',title:'Explicação depois questões',desc:'Toda a explicação primeiro, questões separadas ao final'}
          ].map(o=>(
            <label key={o.k} className={rc(lessonMode===o.k)}>
              <input type="radio" name="lm" value={o.k} checked={lessonMode===o.k} onChange={()=>setLessonMode(o.k)} className="accent-yellow-600 mt-0.5 flex-shrink-0"/>
              <div><p className="font-bold text-sm">{o.title}</p><p className="text-xs opacity-50 mt-0.5">{o.desc}</p></div>
            </label>
          ))}
        </div>

        {isFolder&&(
          <>
            <p className={`text-xs font-bold uppercase mb-3 ${dm?'text-gray-400':'text-gray-500'}`}>Questões por</p>
            <div className="space-y-2 mb-5">
              {[{k:'topic',title:'Após cada tópico',desc:'Questões + gabarito após o bloco de cada tópico'},
                {k:'end',title:'Ao final de tudo',desc:'Todas as questões reunidas em seção única no final'}
              ].map(o=>(
                <label key={o.k} className={rc(qPlace===o.k)}>
                  <input type="radio" name="qp" value={o.k} checked={qPlace===o.k} onChange={()=>setQPlace(o.k)} className="accent-yellow-600 mt-0.5 flex-shrink-0"/>
                  <div><p className="font-bold text-sm">{o.title}</p><p className="text-xs opacity-50 mt-0.5">{o.desc}</p></div>
                </label>
              ))}
            </div>
          </>
        )}

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

        <p className={`text-xs font-bold uppercase mb-3 ${dm?'text-gray-400':'text-gray-500'}`}>Outros</p>
        <label className={`${rc(hideSubtitles)} mb-5 cursor-pointer`}>
          <input type="checkbox" checked={hideSubtitles} onChange={e=>setHideSubtitles(e.target.checked)} className="accent-yellow-600 mt-0.5 flex-shrink-0"/>
          <div><p className="font-bold text-sm">Ocultar títulos dos subtópicos</p><p className="text-xs opacity-50 mt-0.5">Remove os títulos e números — o texto flui como prosa contínua</p></div>
        </label>

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
    const escape = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
    const qs = topic.questions;
    let body = `<h1 style="color:#92400e;border-bottom:3px solid #92400e;padding-bottom:8px;font-family:Georgia,serif">${topic.title}</h1>
<p style="color:#6b7280;font-size:13px;font-family:sans-serif">${qs.length} questões • ${subject?.title||''} • Ágora do Saber</p>`;

    if (mode==='blank') {
      qs.forEach((q, idx) => {
        body += `<div style="margin-bottom:28px;page-break-inside:avoid;border-bottom:1px solid #e5e7eb;padding-bottom:16px">
<p style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;font-family:sans-serif;margin:0 0 4px">Questão ${idx + 1}</p>
<p style="font-size:15px;margin:8px 0 12px;line-height:1.6">${escape(q.statement)}</p>
${(q.options||[]).map(o=>`<div style="margin:4px 0;padding:6px 10px;border-radius:6px;font-size:13px;border:1px solid #e5e7eb">${o.letter}) ${escape(o.text)}</div>`).join('')}
<div style="height:60px;border-bottom:1px dashed #e5e7eb;margin-top:8px"></div>
</div>`;
      });
    } else if (mode==='study') {
      // Study mode: each question appears WITHOUT answer highlighted,
      // then a big gap/separator, then the gabarito+explanation below.
      // This way you can answer it before accidentally seeing the response.
      qs.forEach((q, idx) => {
        const isLast = idx === qs.length - 1;
        body += `<div style="margin-bottom:0;page-break-inside:avoid">
<p style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;font-family:sans-serif;margin:0 0 4px">Questão ${idx + 1}</p>
<p style="font-size:15px;margin:8px 0 12px;line-height:1.6">${escape(q.statement)}</p>
${(q.options||[]).map(o=>`<div style="margin:4px 0;padding:6px 10px;border-radius:6px;font-size:13px;border:1px solid #e5e7eb">${o.letter}) ${escape(o.text)}</div>`).join('')}
</div>`;
        // Spacer — big enough so the answer below isn't accidentally seen
        body += `<div style="border-top:2px dashed #e5e7eb;margin:32px 0 8px;padding-top:8px">
<p style="font-size:10px;color:#d1d5db;text-align:center;letter-spacing:.1em;font-family:sans-serif;text-transform:uppercase">✂ gabarito ✂</p>
</div>`;
        // Answer + explanation
        body += `<div style="margin-bottom:${isLast?'16px':'48px'};padding:14px 16px;background:#f0fdf4;border-radius:8px;border-left:4px solid #22c55e;page-break-inside:avoid">
<p style="font-weight:bold;color:#15803d;margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.04em">✓ Gabarito — Questão ${idx + 1}</p>
${(q.options||[]).map(o=>`<div style="margin:4px 0;padding:6px 10px;border-radius:6px;font-size:13px;${o.isCorrect?'background:#d1fae5;font-weight:bold;color:#065f46;border:1px solid #6ee7b7':'border:1px solid transparent;color:#6b7280'}">${o.letter}) ${escape(o.text)}</div>`).join('')}
<div style="background:#fef3c7;padding:12px 16px;margin-top:10px;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;font-size:13px;line-height:1.6">${escape(q.explanation)}</div>
</div>
${!isLast ? '<hr style="border:none;border-top:3px solid #e5e7eb;margin:8px 0 40px">' : ''}`;
      });
    } else { // exam mode
      body += '<h2 style="margin-top:24px;font-family:Georgia,serif;color:#374151">QUESTÕES</h2>';
      qs.forEach((q, idx) => {
        body += `<div style="margin-bottom:28px;page-break-inside:avoid">
<p style="font-size:11px;color:#9ca3af;text-transform:uppercase;font-family:sans-serif;margin:0 0 4px">Questão ${idx + 1}</p>
<p style="font-size:15px;margin:8px 0 12px;line-height:1.6">${escape(q.statement)}</p>
${(q.options||[]).map(o=>`<div style="margin:4px 0;padding:6px 10px;border-radius:6px;font-size:13px;border:1px solid #e5e7eb">${o.letter}) ${escape(o.text)}</div>`).join('')}
</div>`;
      });
      body += '<div style="page-break-before:always"><h2 style="font-family:Georgia,serif;color:#92400e;border-bottom:2px solid #92400e;padding-bottom:8px">GABARITO E COMENTÁRIOS</h2>';
      qs.forEach((q, idx) => {
      const corr = (q.options || []).find(o=>o.isCorrect);
        body += `<div style="margin-bottom:20px;padding:12px 16px;border-radius:8px;background:#f9fafb;border:1px solid #e5e7eb">
<p style="font-weight:bold;margin:0 0 4px;font-size:13px">Questão ${idx + 1}: <span style="color:#065f46">${corr?.letter}) ${escape(corr?.text||'')}</span></p>
<p style="font-size:12px;margin:0;color:#374151;line-height:1.5">${escape(q.explanation)}</p>
</div>`;
      });
      body += '</div>';
    }
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:24px;color:#111}@media print{body{padding:10px}}</style></head><body>${body}</body></html>`;
  };

  const buildDocx = () => {
    const qs = topic.questions || [];
    let body = docxParagraph(topic.title || 'Exportar', { bold:true, size:32, color:'92400E', after:80, border:true });
    body += docxParagraph(`${qs.length} questões • ${subject?.title || ''} • Ágora do Saber`, { size:20, color:'6B7280', after:260 });
    const renderQuestion = (q, idx, opts = {}) => {
      let xml = docxParagraph(`Questão ${idx + 1}`, { bold:true, size:20, color:'92400E', after:40 });
      xml += docxParagraph(q.statement || '', { after:120 });
      (q.options || []).forEach(o => {
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
      const corr = (q.options || []).find(o => o.isCorrect);
      let xml = docxParagraph(`Gabarito — Questão ${idx + 1}`, { bold:true, color:'15803D', after:60 });
      if (corr) xml += docxParagraph(`${corr.letter}) ${corr.text || ''}`, { bold:true, color:'065F46', after:60 });
      xml += docxParagraph(q.explanation || q.expectedAnswer || '', { color:'374151', after:240 });
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
    {k:'study',  icon:'📖', title:'Modo Estudo',   desc:'Questão sem resposta → ✂ separador → gabarito+explicação. Faça as questões offline!'},
    {k:'exam',   icon:'📋', title:'Modo Simulado', desc:'Todas as questões primeiro, gabarito completo ao final'},
    {k:'blank',  icon:'📝', title:'Só Questões',   desc:'Apenas perguntas e alternativas, sem nenhuma resposta'},
  ];

  return (
    <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4">
      <div className={`w-full max-w-md rounded-2xl border overflow-y-auto p-8 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`} style={{maxHeight:'calc(100dvh - 6rem)'}}>
        <h3 className="text-xl font-serif font-bold text-yellow-600 mb-6 flex items-center gap-3"><Printer className="w-6 h-6"/>Exportar</h3>
        <div className="space-y-3 mb-6">
          {opts.map(o=>(
            <label key={o.k} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${mode===o.k?(darkMode?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(darkMode?'border-gray-700 hover:border-gray-500':'border-gray-200 hover:border-gray-300')}`}>
              <input type="radio" name="mode" value={o.k} checked={mode===o.k} onChange={()=>setMode(o.k)} className="accent-yellow-600"/>
              <div><p className="font-bold text-sm">{o.icon} {o.title}</p><p className="text-xs opacity-50 mt-0.5">{o.desc}</p></div>
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
