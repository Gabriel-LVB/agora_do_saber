// Tabelas de enunciados usam o formato pipe do Markdown. Exigimos a linha de
// alinhamento para não interpretar frases com barras verticais como tabelas.
export const splitMarkdownTableRow = (line = '') => {
  const value = String(line).trim().replace(/\\\|/g, '\u0000');
  if (!value.includes('|')) return [];
  const cells = value.split('|');
  if (!cells[0].trim()) cells.shift();
  if (!cells[cells.length - 1].trim()) cells.pop();
  return cells.map(cell => cell.replace(/\u0000/g, '|').trim());
};

export const looksLikeMarkdownTableRow = (line = '') => {
  const value = String(line).trim();
  return value.startsWith('|') && splitMarkdownTableRow(value).length >= 2;
};

export const parseMarkdownTableAt = (lines, start) => {
  const header = splitMarkdownTableRow(lines[start]);
  const alignment = splitMarkdownTableRow(lines[start + 1]);
  if (header.length < 2 || alignment.length !== header.length
    || !alignment.every(cell => /^:?-{3,}:?$/.test(cell))) return null;

  const rows = [];
  let nextIndex = start + 2;
  while (nextIndex < lines.length) {
    const cells = splitMarkdownTableRow(lines[nextIndex]);
    if (cells.length !== header.length) break;
    rows.push(cells);
    nextIndex++;
  }

  const headers = [];
  for (let i = 0; i < header.length;) {
    let colSpan = 1;
    if (header[i]) {
      while (i + colSpan < header.length && !header[i + colSpan]) colSpan++;
    }
    headers.push({ text:header[i], colSpan });
    i += colSpan;
  }
  return { headers, rows, columnCount:header.length, nextIndex };
};

export const splitMarkdownTableBlocks = (value = '') => {
  const lines = String(value ?? '').replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let textLines = [];
  for (let i = 0; i < lines.length;) {
    const table = parseMarkdownTableAt(lines, i);
    if (table) {
      if (textLines.length) blocks.push({ type:'text', text:textLines.join('\n') });
      blocks.push({ type:'table', ...table });
      textLines = [];
      i = table.nextIndex;
    } else {
      textLines.push(lines[i]);
      i++;
    }
  }
  if (textLines.length) blocks.push({ type:'text', text:textLines.join('\n') });
  return blocks;
};
