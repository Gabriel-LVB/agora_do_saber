import { strToU8, zipSync } from 'fflate';

const MAX_ARCHIVE_FILENAME_LENGTH = 120;
const TRANSCRIPT_FETCH_CONCURRENCY = 4;

const cleanFilenamePart = (value, fallback = 'sem-titulo') => {
  const cleaned = String(value || '')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '');
  return (cleaned || fallback).slice(0, MAX_ARCHIVE_FILENAME_LENGTH);
};

const slugifyArchiveName = value => String(value || 'materia')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'materia';

const transcriptFileText = ({ subject, topic, category, title, transcript }) => [
  title,
  '='.repeat(Math.min(Math.max(title.length, 3), 80)),
  '',
  `Matéria: ${subject}`,
  topic ? `Tópico: ${topic}` : '',
  category === 'bonus' ? 'Tipo: Aula bônus' : '',
  '',
  String(transcript || '').trim(),
].filter((line, index, rows) => line || (index > 0 && rows[index - 1])).join('\n');

export const fetchCourseTranscriptEntries = async ({ entries = [], fetchTranscript, onProgress, concurrency = TRANSCRIPT_FETCH_CONCURRENCY }) => {
  if (typeof fetchTranscript !== 'function') throw new Error('Leitor de transcrições indisponível.');
  const results = new Array(entries.length);
  let cursor = 0;
  let completed = 0;
  const workerCount = Math.min(Math.max(1, Number(concurrency) || 1), entries.length || 1);

  const worker = async () => {
    while (cursor < entries.length) {
      const index = cursor++;
      const entry = entries[index];
      try {
        const lessonData = await fetchTranscript(entry.aula);
        results[index] = { ...entry, transcript:String(lessonData?.transcript || '').trim() };
      } catch (_error) {
        results[index] = { ...entry, transcript:'' };
      } finally {
        completed += 1;
        onProgress?.({ completed, total:entries.length });
      }
    }
  };

  await Promise.all(Array.from({ length:workerCount }, worker));
  return results;
};

export const createCourseTranscriptArchive = ({ subject, entries = [] }) => {
  const normalizedSubject = String(subject || 'Sem matéria').trim() || 'Sem matéria';
  const available = entries.filter(entry => String(entry.transcript || '').trim());
  const missing = entries.filter(entry => !String(entry.transcript || '').trim());
  if (!available.length) {
    return { bytes:null, filename:'', exportedCount:0, missingCount:missing.length };
  }

  const archiveFiles = {};
  available.forEach((entry, index) => {
    const title = String(entry.title || `Aula ${index + 1}`).trim() || `Aula ${index + 1}`;
    const sequence = String(index + 1).padStart(3, '0');
    const filename = `${sequence} - ${cleanFilenamePart(title)}.txt`;
    archiveFiles[filename] = strToU8(transcriptFileText({
      subject:normalizedSubject,
      topic:String(entry.topic || '').trim(),
      category:entry.category,
      title,
      transcript:entry.transcript,
    }));
  });

  if (missing.length) {
    const missingRows = missing.map((entry, index) => `${index + 1}. ${String(entry.title || 'Aula sem título').trim() || 'Aula sem título'}`);
    archiveFiles['_TRANSCRICOES_NAO_DISPONIVEIS.txt'] = strToU8([
      `Matéria: ${normalizedSubject}`,
      '',
      'As seguintes aulas não possuíam transcrição disponível no momento da exportação:',
      '',
      ...missingRows,
    ].join('\n'));
  }

  return {
    bytes:zipSync(archiveFiles, { level:6 }),
    filename:`transcricoes-${slugifyArchiveName(normalizedSubject)}.zip`,
    exportedCount:available.length,
    missingCount:missing.length,
  };
};

export const downloadCourseTranscriptArchive = ({ bytes, filename }) => {
  const blob = new Blob([bytes], { type:'application/zip' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
