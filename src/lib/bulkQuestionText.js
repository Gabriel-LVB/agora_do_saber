export const BULK_QUESTION_TEXT_HEADER = 'AGORA-MULTIBLOCOS-V1';

export const isBulkQuestionText = value => String(value || '').trimStart().startsWith(BULK_QUESTION_TEXT_HEADER);

export const parseBulkQuestionText = value => {
  const lines = String(value || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
  const first = lines.findIndex(line => line.trim());
  if (first < 0 || lines[first].trim() !== BULK_QUESTION_TEXT_HEADER) {
    throw new Error(`O arquivo deve começar com ${BULK_QUESTION_TEXT_HEADER}.`);
  }
  const blocks = [];
  let cursor = first + 1;
  while (cursor < lines.length) {
    if (!lines[cursor].trim()) { cursor++; continue; }
    if (lines[cursor].trim() !== '=== BLOCO ===') {
      throw new Error(`Linha ${cursor + 1}: era esperado === BLOCO ===.`);
    }
    const number = blocks.length + 1;
    cursor++;
    const subjectMatch = lines[cursor]?.match(/^ASSUNTO:\s*(.+?)\s*$/i);
    if (!subjectMatch) throw new Error(`Bloco ${number}: informe ASSUNTO: na linha seguinte ao início.`);
    const subject = subjectMatch[1].trim();
    cursor++;
    const titleMatch = lines[cursor]?.match(/^NOME:\s*(.+?)\s*$/i);
    if (!titleMatch) throw new Error(`Bloco ${number}: informe NOME: após o assunto.`);
    const title = titleMatch[1].trim();
    cursor++;
    const questionLines = [];
    while (cursor < lines.length && lines[cursor].trim() !== '=== FIM DO BLOCO ===') {
      if (lines[cursor].trim() === '=== BLOCO ===') {
        throw new Error(`Bloco ${number}: falta === FIM DO BLOCO === antes do próximo bloco.`);
      }
      questionLines.push(lines[cursor]);
      cursor++;
    }
    if (cursor >= lines.length) throw new Error(`Bloco ${number}: falta === FIM DO BLOCO ===.`);
    const questionsText = questionLines.join('\n').trim();
    if (!questionsText) throw new Error(`Bloco ${number}: não há questões.`);
    blocks.push({ subject, title, questionsText });
    cursor++;
  }
  if (!blocks.length) throw new Error('O arquivo não contém blocos.');
  return blocks;
};

export const importBulkQuestionText = async ({ text, parseQuestions, saveBlock }) => {
  const blocks = parseBulkQuestionText(text);
  const prepared = blocks.map((block, index) => {
    const parsed = parseQuestions(block.questionsText, index);
    const declared = (block.questionsText.match(/(?:^|\n)[ \t]*(?:(?:\*\*|#{2,4})[ \t]*)?Quest[aã]o(?:[ \t]*(?:n[ºo]\.?)?)?[ \t]*[:#\-–—]?[ \t]*\[?\d/gim) || []).length;
    if (!parsed.questions.length || (declared && parsed.questions.length !== declared)) {
      throw new Error(`Bloco ${index + 1} (${block.title}): ${parsed.questions.length} de ${declared || '?'} questões reconhecidas. Confira enunciados, alternativas e gabaritos antes de importar.`);
    }
    return { ...block, ...parsed };
  });
  let completedBlocks = 0;
  let completedQuestions = 0;
  try {
    for (const block of prepared) {
      await saveBlock(block);
      completedBlocks++;
      completedQuestions += block.questions.length;
    }
  } catch(error) {
    error.completedBlocks = completedBlocks;
    throw error;
  }
  return { completedBlocks, completedQuestions };
};
