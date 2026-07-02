import React, { useState, useEffect, useRef, useMemo } from 'react';

import { callGemini } from '../../services/gemini.js';

import { deferInteractionWork } from '../../lib/interaction.js';



const ic = (d) => ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} dangerouslySetInnerHTML={{__html:d}}/>;
const Landmark    = ic('<polygon points="12 2 2 7 22 7 12 2"/><line x1="6" x2="6" y1="21" y2="7"/><line x1="10" x2="10" y1="21" y2="7"/><line x1="14" x2="14" y1="21" y2="7"/><line x1="18" x2="18" y1="21" y2="7"/><line x1="2" x2="22" y1="21" y2="21"/>');
const Flame       = ic('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>');
const BlockIcon   = ic('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>');
const FolderIcon  = ic('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>');
const Feather     = ic('<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="6.5"/>');
const CheckCircle2= ic('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>');
const XCircle     = ic('<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>');
const BookOpen    = ic('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>');
const ArrowLeft   = ic('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>');
const ChevronDown = ic('<polyline points="6 9 12 15 18 9"/>');
const ChevronLeft = ic('<polyline points="15 18 9 12 15 6"/>');
const ChevronRight= ic('<polyline points="9 18 15 12 9 6"/>');
const ChevronUp   = ic('<polyline points="18 15 12 9 6 15"/>');
const Shuffle     = ic('<path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h2.5a5 5 0 0 0 4-2l7-8a5 5 0 0 1 4-2H22"/><path d="M2 6h2.5a5 5 0 0 1 4 2l1.5 1.7"/><path d="M14 14.3 15.5 16a5 5 0 0 0 4 2H22"/>');
const AlertTriangle=ic('<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>');
const SettingsIcon= ic('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>');
const Trash2      = ic('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>');
const EditIcon    = ic('<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>');
const RotateCcw   = ic('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>');
const Sun         = ic('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>');
const Moon        = ic('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>');
const Award       = ic('<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>');
const FileText    = ic('<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>');
const FileUp      = ic('<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/>');
const Sparkles    = ic('<path d="m12 3 1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M3 5h4"/><path d="M19 17v4"/><path d="M17 19h4"/>');
const Send        = ic('<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>');
const Eraser      = ic('<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>');
const Copy        = ic('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>');
const Key         = ic('<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>');
const LogOut      = ic('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>');
const UserIcon    = ic('<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>');
const Heart       = ({ className, filled }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const Clock       = ic('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>');
const TrendingUp  = ic('<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>');
const Printer     = ic('<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>');
const MessageCircle=ic('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>');
const Zap         = ic('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>');
const ShieldAlert = ic('<path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3z"/><path d="M12 8v4"/><path d="M12 16h.01"/>');
const BarChart2   = ic('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>');
const CalendarCheck=ic('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/>');
const ImageIcon   = ic('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>');
const FilterIcon  = ic('<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>');
const BrainIcon   = ic('<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-3.14Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-3.14Z"/>');
const PillIcon    = ic('<path d="m10.5 20.5 10-10a5 5 0 0 0-7.07-7.07l-10 10a5 5 0 0 0 7.07 7.07Z"/><path d="m8.5 8.5 7 7"/>');
const LayersIcon  = ic('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>');
const PlusIcon    = ic('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>');
const DownloadIcon= ic('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>');
const PlayIcon    = ic('<polygon points="5 3 19 12 5 21 5 3"/>');
const GraduationCap = ic('<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>');
const CheckIcon   = ic('<polyline points="20 6 9 17 4 12"/>');
const GripIcon    = ic('<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>');
const MoreIcon    = ic('<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>');
const VideoIcon   = ic('<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>');
const SkipForward = ic('<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>');
const SkipBack    = ic('<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>');
const MaximizeIcon= ic('<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>');
const MinimizeIcon= ic('<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>');

const RepeatIcon = ic('<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>');
const AcademiaIcon = ic('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="12" y1="7" x2="16" y2="7"/><line x1="12" y1="11" x2="16" y2="11"/><line x1="9" y1="7" x2="9.01" y2="7"/><line x1="9" y1="11" x2="9.01" y2="11"/>');

const Spinner = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{animation:'spin 1s linear infinite',transformOrigin:'center'}}><style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;

const FLASHCARD_CORRECT = 'CORRECT';
const FLASHCARD_WRONG = 'WRONG';

const EXPLANATION_LABELS = 'Explica[çc][aã]o|Corre[çc][aã]o|Coment[áa]rio|Justificativa|Fundamento|Racional|Racioc[íi]nio';
// Um separador só encerra a explicação quando realmente antecede a próxima
// questão (ou o fim do texto). Listas, subtítulos e divisórias internas da aula
// não podem amputar a explicação.
const QUESTION_OR_SEPARATOR_RE = /\n[ \t]*---(?=[ \t]*(?:\n[ \t]*(?:(?:\*\*|#{2,4})[ \t]*)?Quest[aã]o|$))|\n[ \t]*(?:(?:\*\*|#{2,4})[ \t]*)?Quest[aã]o|$/i;

const extractLabeledSection = (text = '', labels = EXPLANATION_LABELS, stopRe = QUESTION_OR_SEPARATOR_RE) => {
  const labelRe = new RegExp(
    `(?:^|\\n)[ \\t]*(?:[-*•][ \\t]*)?(?:\\*\\*)?[ \\t]*(?:${labels})[ \\t]*(?:(?:\\*\\*)?[ \\t]*[:\\-–—][ \\t]*(?:\\*\\*)?[ \\t]*|(?:\\*\\*)?[ \\t]*(?:\\n|$))`,
    'i'
  );
  const match = text.match(labelRe);
  if (!match) return '';

  const start = match.index + match[0].length;
  const rest = text.substring(start);
  const stop = rest.search(stopRe);
  return (stop >= 0 ? rest.substring(0, stop) : rest).trim();
};

const cleanQuestionExplanation = (explanation = '') => {
  let exp = String(explanation || '').replace(/\r\n/g, '\n').trim();
  if (!exp) return '';

  const labeled = extractLabeledSection(exp);
  if (labeled) exp = labeled;

  exp = exp
    .replace(/^(?:[Aa]lternativa[ \t]+correta|[Gg]abarito(?:[ \t]+oficial)?|[Rr]esposta(?:[ \t]+correta)?|[Cc]orreta)[ \t]*[:\-–—][^\n]*\n+/i, '')
    .replace(/^[-–—]+\s*/, '')
    .replace(/\n---.*$/s, '')
    .trim();

  return exp;
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

const extractStructuredQuestionText = (rawStatement = '') => {
  const raw = String(rawStatement || '').replace(/\r\n/g, '\n').trim();
  const caseMatch = raw.match(/(?:^|\n)\s*Caso-base\s*:\s*([\s\S]*?)(?=\n\s*Enunciado\s*:|$)/i);
  const statementMatch = raw.match(/(?:^|\n)\s*Enunciado\s*:\s*([\s\S]*)$/i);
  if (!caseMatch || !statementMatch) return { caseContext:'', statement:raw };
  return {
    caseContext:caseMatch[1].trim(),
    statement:statementMatch[1].trim(),
  };
};

const cleanStructuredExplanationPart = (text = '') => String(text || '')
  .replace(/\r\n/g, '\n')
  .replace(/^\s*(?:Aula|Alternativas)\s*:\s*/i, '')
  .replace(/\n---.*$/s, '')
  .trim();

const parseQuestionExplanationParts = (explanation = '') => {
  const raw = String(explanation || '').replace(/\r\n/g, '\n').trim();
  // Aceita pequenas variações comuns do modelo: [[ALT:A]], [[ALT: A]],
  // [ALT:A] e marcadores envolvidos por negrito.
  const markerSource = String.raw`\[{1,2}\s*ALT\s*[:\-]?\s*([A-E])\s*\]{1,2}`;
  const markerTest = new RegExp(markerSource, 'i');
  if (!raw || !markerTest.test(raw)) {
    return { hasStructured:false, lesson:'', alternatives:{} };
  }

  const firstAlt = raw.search(new RegExp(markerSource, 'i'));
  const beforeAlt = firstAlt >= 0 ? raw.substring(0, firstAlt) : raw;
  const lessonMatch = beforeAlt.match(/(?:^|\n)\s*Aula\s*:\s*([\s\S]*?)(?:\n\s*Alternativas\s*:?\s*$|$)/i);
  const lesson = cleanStructuredExplanationPart(lessonMatch?.[1] || beforeAlt);
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
    lesson,
    alternatives,
  };
};

const getCorrectLetter = (question) => question?.options?.find(o => o.isCorrect)?.letter;
const isMemoryCard = (question) => !!(question?.isFlashcard || question?.isCloze);
const isMemoryCardType = (type) => type === 'flashcard' || type === 'cloze';
const isOnlyMemoryCardType = (types = []) => types.length === 1 && isMemoryCardType(types[0]);
const memoryCardTypeName = (types = []) => types?.[0] === 'cloze' ? 'clozes' : 'flashcards';
const MIXED_QUESTION_STYLE = 'hybrid';
const isMixedQuestionMode = (style = '') => style === MIXED_QUESTION_STYLE;
const QUESTION_STYLE_OPTIONS = [
  { k:'hybrid', label:'Mistas', desc:'Gera diretas sobre os subtópicos e depois casos encadeados como teste clínico.' },
  { k:'mixed', label:'Casos encadeados', desc:'A IA decide quantos casos usar e faz várias questões progressivas sobre cada um.' },
  { k:'clinical', label:'Casos independentes', desc:'Cada questão apresenta uma situação clínica diferente.' },
  { k:'direct', label:'Diretas', desc:'Perguntas objetivas, sem caso clínico.' },
];
const QuestionStyleSelector = ({ value='mixed', onChange, darkMode=false }) => (
  <div className="grid grid-cols-1 gap-2">
    {QUESTION_STYLE_OPTIONS.map(option=>(
      <button type="button" key={option.k} onClick={()=>onChange(option.k)}
        className={`w-full rounded-xl border-2 px-3 py-3 text-left transition-all ${
          value===option.k
            ? (darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-300':'border-yellow-500 bg-yellow-50 text-yellow-800')
            : (darkMode?'border-gray-700 bg-gray-800/70 text-gray-200 hover:border-gray-500':'border-gray-200 bg-white text-gray-700 hover:border-gray-300')
        }`}>
        <span className="block text-sm font-bold leading-tight">{option.label}</span>
        <span className="mt-1 block text-xs font-normal leading-snug opacity-65">{option.desc}</span>
      </button>
    ))}
  </div>
);

const stripLegacyLessonHighlights = (text = '') =>
  String(text).replace(/==([^=\n]+?)==/g, '$1');

const ORACLE_LENGTH = {
  short:  { label:'⚡ Curta',   inst:'Responda em no máximo 2 frases muito diretas e objetivas.' },
  medium: { label:'📝 Média',   inst:'Responda em 1 parágrafo objetivo e bem estruturado.' },
  long:   { label:'📚 Detalhada', inst:'Responda de forma completa e didática, com exemplos clínicos quando relevante.' },
};

// Carrega KaTeX uma vez para renderização de LaTeX
let _katexLoaded = false;
const ensureKatex = () => {
  if (_katexLoaded || window.katex) { _katexLoaded = true; return Promise.resolve(); }
  return new Promise((res, rej) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
    document.head.appendChild(link);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
    s.onload = () => { _katexLoaded = true; res(); };
    s.onerror = rej;
    document.head.appendChild(s);
  });
};

// Componente que renderiza uma expressão LaTeX inline
const TexInline = ({ src, display=false }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ensureKatex().then(() => {
      try {
        window.katex.render(src, ref.current, { throwOnError: false, displayMode: display });
      } catch(e) { if (ref.current) ref.current.textContent = src; }
    }).catch(() => { if (ref.current) ref.current.textContent = src; });
  }, [src, display]);
  return <span ref={ref} style={display ? {display:'block',textAlign:'center',margin:'8px 0'} : {display:'inline'}}/>;
};

// Render rich text: bold, italic, LaTeX e line breaks
const renderRichText = (text, multiline = false) => {
  if (!text) return null;
  text = stripLegacyLessonHighlights(text);

  // Tokeniza o texto em segmentos: $$...$$ (display), $...$ (inline), **...**, <b>, <i>, <br>, texto
  const tokenize = (str) => {
    const tokens = [];
    // Regex: $$...$$, $...$, **...**, *...*, _..._, <b>...</b>, <i>...</i>, <br/>
    // Nota: [\s\S] para capturar múltiplas linhas no bold
    const re = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\*\*[\s\S]*?\*\*|\*[^*\n]+?\*|(^|[^\w])_([^_\n_](?:[^_\n]*?[^_\n_])?)_(?=$|[^\w])|<b>[\s\S]*?<\/b>|<i>[\s\S]*?<\/i>|<br\s*\/?>)/g;
    let last = 0, m;
    while ((m = re.exec(str)) !== null) {
      if (m.index > last) tokens.push({ type: 'text', val: str.slice(last, m.index) });
      const v = m[0];
      if (m[3] !== undefined) {
        if (m[2]) tokens.push({ type: 'text', val: m[2] });
        tokens.push({ type: 'italic', val: m[3] });
      }
      else if (v.startsWith('$$')) tokens.push({ type: 'tex-display', val: v.slice(2, -2).trim() });
      else if (v.startsWith('$'))  tokens.push({ type: 'tex-inline', val: v.slice(1, -1).trim() });
      else if (v.startsWith('**')) tokens.push({ type: 'bold', val: v.slice(2, -2) });
      else if (v.startsWith('*') && !v.startsWith('**')) tokens.push({ type: 'italic', val: v.slice(1, -1) });
      else if (v.startsWith('<b>'))tokens.push({ type: 'bold', val: v.slice(3, -4) });
      else if (v.startsWith('<i>'))tokens.push({ type: 'italic', val: v.slice(3, -4) });
      else if (v.match(/^<br/))   tokens.push({ type: 'br' });
      last = m.index + v.length;
    }
    if (last < str.length) tokens.push({ type: 'text', val: str.slice(last) });
    return tokens;
  };

  const renderTokens = (tokens, keyPrefix) =>
    tokens.map((tok, i) => {
      const k = `${keyPrefix}-${i}`;
      switch (tok.type) {
        case 'bold':        return <strong key={k} className="font-bold">{tok.val}</strong>;
        case 'italic':      return <em key={k}>{tok.val}</em>;
        case 'br':          return <br key={k}/>;
        case 'tex-inline':  return <TexInline key={k} src={tok.val} display={false}/>;
        case 'tex-display': return <TexInline key={k} src={tok.val} display={true}/>;
        default:            return <span key={k}>{tok.val}</span>;
      }
    });

  if (!multiline) {
    return <React.Fragment>{renderTokens(tokenize(text), 'r')}</React.Fragment>;
  }
  const lines = text.split('\n');
  const isBulletLine = (value = '') => /^\s*[-*•](?:\s+|$)/.test(value);
  const isRichTextBoundary = (value = '') => {
    const trimmed = value.trim();
    return !trimmed || /^#{1,6}\s+/.test(trimmed);
  };
  const rendered = [];
  let li = 0;
  while (li < lines.length) {
    const line = lines[li] || '';
    if (isBulletLine(line)) {
      const match = line.match(/^\s*[-*•](?:\s+(.*)|\s*)$/);
      let itemText = (match?.[1] || '').trim();
      const continuation = [];
      let j = li + 1;
      while (j < lines.length && !isBulletLine(lines[j] || '') && !isRichTextBoundary(lines[j] || '')) {
        continuation.push((lines[j] || '').trim());
        j++;
      }
      itemText = [itemText, ...continuation].filter(Boolean).join(' ');
      rendered.push(
        <span key={`bullet-${li}`} className="flex items-start gap-3 my-1">
          <span className="flex flex-shrink-0 items-center justify-center" style={{width:'0.875rem', height:'1.625rem'}}>
            <span className="rounded-full bg-current" style={{width:'0.4375rem', height:'0.4375rem'}}/>
          </span>
          <span className="min-w-0 leading-relaxed">{renderTokens(tokenize(itemText), `b${li}`)}</span>
        </span>
      );
      li = j;
      continue;
    }
    rendered.push(
      <React.Fragment key={`line-${li}`}>
        {renderTokens(tokenize(line), `l${li}`)}
        {li < lines.length - 1 && <br/>}
      </React.Fragment>
    );
    li++;
  }
  return rendered;
};

// Aliases para compatibilidade
const parseHtmlText     = (text) => renderRichText(text, false);
const parseHtmlTextChat = (text) => renderRichText(text, true);

const QuestionView = ({
  title, onBack, backLabel='Voltar',
  questions=[], answers={}, favorites=[],
  onAnswer, onToggleFavorite,
  errorNotebook=[], onToggleErrorNotebook=null, showErrorNotebook=false,
  onReset, onReshuffle, onRegenerate, onAudit, onExport,
  isGenerating=false, streamCount=0, loadingMsg='',
  showBizuario=false, onBizuario, bizuarioCached=false,
  darkMode, apiKey, oracleLength='medium', onCall, onOpenAnswer,
  generateLabel='Gerar Questões', generateIcon=null, onGenerate=null,
  subtopics=[],
  adminStudyPlan=[],
  topicStyle=null, onTopicStyleChange=null,
  topicType=null,
  isAdmin=false,
  canCreateFlashcards=false,
  adminQuestionExplanations=false,
  questionCountPerSub=1,
  questionCountAuto=false,
  numAlternatives=5,
  geminiThinkingEnabled=false,
  onGeminiThinkingChange=null,
  adminChunkedQuestionsEnabled=false,
  onAdminChunkedQuestionsChange=null,
  auditQuestionsEnabled=false,
  onAuditQuestionsChange=null,
  onAddToReview=null,
  onReviewErrorNotebook=null,
  onOpenErrorReviewResult=null,
  errorReviewResultCount=0,
  onGoToAula=null,
  goToAulaLabel='Assistir aula',
	  onGenerateExtra=null,
	  onNextUnit=null,
	  nextUnitLabel='Próxima unidade',
	  nextUnitHelper='Continuar sequência',
	  inReviewCount=0,
	  displayMode='list',
	  resumeAtFirstUnanswered=false,
	  onExportAnki=null,
}) => {
  const dm = darkMode;
  const [headerActionsOpen, setHeaderActionsOpen] = useState(false);
  const [flashcardFullscreen, setFlashcardFullscreen] = useState(false);
  const [pendingAnswers, setPendingAnswers] = useState({});
  const questionIdsKey = useMemo(() => questions.map(q=>q.id).join('|'), [questions]);
  const questionIdSet = useMemo(() => new Set(questions.map(q => String(q.id))), [questionIdsKey, questions]);
  const questionById = useMemo(() => {
    const map = new Map();
    questions.forEach(question => map.set(String(question.id), question));
    return map;
  }, [questionIdsKey, questions]);
  const favoriteSet = useMemo(() => new Set((favorites || []).map(String)), [favorites]);
  const errorNotebookSet = useMemo(() => new Set((errorNotebook || []).map(String)), [errorNotebook]);

  useEffect(() => {
    setPendingAnswers(previous => {
      let changed = false;
      const next = {...previous};
      Object.entries(previous).forEach(([id, value]) => {
        if (!questionIdSet.has(String(id)) || answers?.[id] === value) {
          delete next[id];
          changed = true;
        }
      });
      return changed ? next : previous;
    });
  }, [answers, questionIdSet]);

  const submitAnswer = (qId, letter) => {
    const q = questionById.get(String(qId));
    const currentAnswer = pendingAnswers[qId] ?? answers?.[qId];
    if (isFinalObjectiveAnswer(q, currentAnswer)) return undefined;
    setPendingAnswers(previous => ({...previous, [qId]:letter}));
    const rollback = () => setPendingAnswers(previous => {
      if (previous[qId] !== letter) return previous;
      const next = {...previous};
      delete next[qId];
      return next;
    });
    try {
      return deferInteractionWork(() => onAnswer?.(qId, letter)).catch(error => {
        rollback();
        throw error;
      });
    } catch (error) {
      rollback();
      throw error;
    }
  };

  // Auto-scroll to first unanswered question when block loads
  useEffect(() => {
    if (!questions || questions.length === 0) return;
    const validAns = Object.fromEntries(
      Object.entries(answers).filter(([id]) => questionIdSet.has(String(id)))
    );
    const answeredCount = questions.filter(q => {
      const v = validAns[q.id];
      if (!v || v === 'SKIPPED') return false;
      if (q.isOpen) { try { return !!(JSON.parse(v)?.answer); } catch(e) { return false; } }
      return true;
    }).length;
    // Don't scroll if none answered or all answered
    if (answeredCount === 0 || answeredCount === questions.length) return;
    // Find first unanswered
    const firstUnanswered = questions.find(q => {
      const v = validAns[q.id];
      if (!v || v === 'SKIPPED') return true;
      if (q.isOpen) { try { return !!(JSON.parse(v)?.answer); } catch(e) { return true; } }
      return false;
    });
    if (!firstUnanswered) return;
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-question-id="${firstUnanswered.id}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
    return () => clearTimeout(timer);
  }, []); // only on mount

  const validAnswers = useMemo(() => Object.fromEntries(
    Object.entries({...answers, ...pendingAnswers}).filter(([id]) => questionIdSet.has(String(id)))
  ), [answers, pendingAnswers, questionIdSet]);
  const allFlashcards = useMemo(() => questions.length > 0 && questions.every(q => isMemoryCard(q)), [questionIdsKey, questions]);
	  const singleMode = (allFlashcards || displayMode === 'single') && questions.length > 0;
	  const [singleIndex, setSingleIndex] = useState(0);
	  const currentSingleQuestionIdRef = useRef(null);
	  const [showCompletion, setShowCompletion] = useState(false);
	  const [flashcardQueue, setFlashcardQueue] = useState([]);
	  const [flashcardCursor, setFlashcardCursor] = useState(0);
	  const [flashcardMastered, setFlashcardMastered] = useState({});
	  const [flashcardEntryAnswers, setFlashcardEntryAnswers] = useState({});
	  const [flashcardAttempts, setFlashcardAttempts] = useState({});

	  const isOpenAnswered = (q) => {
	    if (!q.isOpen) return false;
	    const val = validAnswers[q.id];
    if (!val || val === 'SKIPPED') return false;
    try { const p = JSON.parse(val); return !!(p?.answer); } catch(e) { return false; }
  };
	  const isOpenCorrect = (q) => {
	    if (!q.isOpen) return false;
	    try { const p = JSON.parse(validAnswers[q.id]); return (p?.score ?? 0) >= 70; } catch(e) { return false; }
	  };

	  useEffect(() => {
	    if (!allFlashcards) return;
	    const baseQueue = questions.map((q, i) => ({ qid:q.id, attempt:0, origin:i }));
	    const retryQueue = [];
	    const initialMastered = {};
	    const initialEntryAnswers = {};
	    const initialAttempts = {};
	    questions.forEach(q => {
	      const saved = answers?.[q.id];
	      if (saved === FLASHCARD_CORRECT) initialMastered[q.id] = true;
	      if (saved === FLASHCARD_CORRECT || saved === FLASHCARD_WRONG) {
	        initialEntryAnswers[`${q.id}__0`] = saved;
	      }
	      if (saved === FLASHCARD_WRONG) {
	        initialAttempts[q.id] = 1;
	        retryQueue.push({ qid:q.id, attempt:1, origin:baseQueue.findIndex(entry => entry.qid === q.id) });
	      }
	    });
	    const initialQueue = [...baseQueue, ...retryQueue];
	    const entryKey = (entry) => `${entry.qid}__${entry.attempt}`;
	    const firstPending = initialQueue.findIndex(entry => !initialMastered[entry.qid] && !initialEntryAnswers[entryKey(entry)]);
	    const firstUnmastered = initialQueue.findIndex(entry => !initialMastered[entry.qid]);
	    const allInitiallyMastered = questions.length > 0 && questions.every(q => initialMastered[q.id]);
	    setFlashcardQueue(initialQueue);
	    setFlashcardCursor(firstPending >= 0 ? firstPending : (firstUnmastered >= 0 ? firstUnmastered : 0));
	    setFlashcardMastered(initialMastered);
	    setFlashcardEntryAnswers(initialEntryAnswers);
	    setFlashcardAttempts(initialAttempts);
	    setShowCompletion(allInitiallyMastered);
	  // Respostas mudam durante a sessão. Reiniciar a fila a cada acerto fazia o
	  // cursor voltar ao primeiro cartão errado em vez de seguir em frente.
	  }, [allFlashcards, questionIdsKey]); // eslint-disable-line

	  const wrongIds = questions.filter(q => {
	    if (q.isOpen) return isOpenAnswered(q) && !isOpenCorrect(q);
	    if (isMemoryCard(q)) return validAnswers[q.id] === FLASHCARD_WRONG;
	    return validAnswers[q.id] && !isAnswerCorrect(q, validAnswers[q.id]);
	  }).map(q=>q.id);

	  const isFlashcardMastered = (q) =>
	    !!flashcardMastered[q.id] || validAnswers[q.id] === FLASHCARD_CORRECT;

	  const flashcardMasteredCount = allFlashcards
	    ? questions.filter(q => isFlashcardMastered(q)).length
	    : 0;

	  const correctCount = allFlashcards
	    ? flashcardMasteredCount
	    : questions.filter(q =>
	      q.isOpen ? isOpenCorrect(q) : isAnswerCorrect(q, validAnswers[q.id])
	    ).length;

	  const answeredCount = allFlashcards
	    ? flashcardMasteredCount
	    : questions.filter(q =>
	      q.isOpen ? isOpenAnswered(q) : !!validAnswers[q.id]
	    ).length;

	  const allDone = questions.length > 0 && (allFlashcards ? questions.every(q => isFlashcardMastered(q)) : answeredCount === questions.length);
	  const pct = allDone ? Math.round(correctCount/questions.length*100) : null;

	  useEffect(() => {
	    const active = allFlashcards && singleMode;
	    window.dispatchEvent(new CustomEvent('agora-flashcard-layout', { detail:{ active, fullscreen:active && flashcardFullscreen } }));
	    return () => {
	      window.dispatchEvent(new CustomEvent('agora-flashcard-layout', { detail:{ active:false, fullscreen:false } }));
	    };
	  }, [allFlashcards, singleMode, flashcardFullscreen]);

	  useEffect(() => {
	    if (!singleMode || allFlashcards || resumeAtFirstUnanswered) return;
	    const idx = questions.findIndex(q => q.isOpen ? !isOpenAnswered(q) : !validAnswers[q.id]);
	    setSingleIndex(idx >= 0 ? idx : 0);
	  }, [singleMode, allFlashcards, questionIdsKey]); // eslint-disable-line

	  useEffect(() => {
	    if (!resumeAtFirstUnanswered || !singleMode || allFlashcards) return;
	    const idx = questions.findIndex(q => q.isOpen ? !isOpenAnswered(q) : !validAnswers[q.id]);
	    setSingleIndex(idx >= 0 ? idx : 0);
	  }, [resumeAtFirstUnanswered, singleMode, allFlashcards]); // eslint-disable-line

  const btnBase = `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold border transition-colors`;
  const btnNeutral = dm ? `${btnBase} border-gray-600 text-gray-300 hover:bg-gray-700` : `${btnBase} border-gray-200 text-gray-600 hover:bg-gray-50`;
  const goToAulaIcon = goToAulaLabel.toLowerCase().includes('ler')
    ? <BookOpen className="w-4 h-4"/>
    : <VideoIcon className="w-4 h-4"/>;
  const actionMenuItems = questions.length>0 ? [
    onGoToAula ? { label:goToAulaLabel, icon:goToAulaIcon, fn:onGoToAula } : null,
    allFlashcards && singleMode ? {
      label:`Cartão ${Math.min(flashcardCursor + 1, Math.max(1, flashcardQueue.length))} de ${Math.max(1, flashcardQueue.length)}`,
      icon:<LayersIcon className="w-4 h-4"/>,
      disabled:true,
    } : null,
    allFlashcards && singleMode ? {
      label:'Cartão anterior',
      icon:<ChevronLeft className="w-4 h-4"/>,
      fn:()=>setFlashcardCursor(i=>Math.max(0,i-1)),
      disabled:flashcardCursor===0,
    } : null,
    allFlashcards && singleMode ? {
      label:flashcardCursor>=flashcardQueue.length-1 ? 'Concluir bloco' : 'Próximo cartão',
      icon:flashcardCursor>=flashcardQueue.length-1 ? <CheckIcon className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>,
      fn:()=>{
        if (flashcardCursor>=flashcardQueue.length-1) setShowCompletion(true);
        else setFlashcardCursor(i=>Math.min(flashcardQueue.length-1,i+1));
      },
      disabled:flashcardCursor>=flashcardQueue.length-1 ? !allDone : false,
    } : null,
    allFlashcards && singleMode ? {
      label:flashcardFullscreen ? 'Sair da tela cheia' : 'Tela cheia',
      icon:flashcardFullscreen ? <MinimizeIcon className="w-4 h-4"/> : <MaximizeIcon className="w-4 h-4"/>,
      fn:()=>setFlashcardFullscreen(v=>!v),
      active:flashcardFullscreen,
    } : null,
    onExport ? { label:'Exportar', icon:<Printer className="w-4 h-4"/>, fn:onExport } : null,
    onAudit ? { label:'Auditar', icon:<ShieldAlert className="w-4 h-4"/>, fn:onAudit } : null,
    showBizuario&&onBizuario ? { label:'Criar aula sobre isso', icon:<GraduationCap className="w-4 h-4"/>, fn:onBizuario } : null,
    onAddToReview ? { label:inReviewCount>0?`Gerenciar revisão (${inReviewCount})`:'Revisão Espaçada', icon:<RepeatIcon className="w-4 h-4"/>, fn:()=>onAddToReview(questions, answers) } : null,
	    onReviewErrorNotebook && errorNotebook.length > 0 ? { label:`Revisar caderno (${errorNotebook.length})`, icon:<BookOpen className="w-4 h-4"/>, fn:onReviewErrorNotebook } : null,
	    onOpenErrorReviewResult && errorReviewResultCount > 0 ? { label:errorReviewResultCount>1?`Abrir revisões geradas (${errorReviewResultCount})`:'Abrir revisão gerada', icon:<BookOpen className="w-4 h-4"/>, fn:onOpenErrorReviewResult } : null,
	    allFlashcards && onExportAnki ? { label:'Enviar para Anki', icon:<Send className="w-4 h-4"/>, fn:()=>onExportAnki(questions) } : null,
	    onRegenerate ? { label:'Recriar', icon:<RotateCcw className="w-4 h-4"/>, fn:onRegenerate } : null,
	    onReshuffle ? { label:'Reiniciar embaralhamento', icon:<Shuffle className="w-4 h-4"/>, fn:onReshuffle, danger:true } : null,
	    onReset ? { label:'Limpar respostas', icon:<Eraser className="w-4 h-4"/>, fn:onReset, danger:true } : null,
	  ].filter(Boolean) : [];
	  const flashcardEntryKey = (entry) => entry ? `${entry.qid}__${entry.attempt}` : '';
	  const getFlashcardById = (qid) => questionById.get(String(qid));
	  const activeFlashcardEntry = allFlashcards && singleMode ? flashcardQueue[flashcardCursor] : null;
	  const currentQuestion = allFlashcards && singleMode
	    ? (activeFlashcardEntry ? getFlashcardById(activeFlashcardEntry.qid) : null)
	    : (singleMode ? questions[Math.min(singleIndex, questions.length - 1)] : null);
	  useEffect(() => {
	    if (!resumeAtFirstUnanswered || !singleMode || allFlashcards || !currentSingleQuestionIdRef.current) return;
	    const idx = questions.findIndex(q => q.id === currentSingleQuestionIdRef.current);
	    if (idx >= 0 && idx !== singleIndex) setSingleIndex(idx);
	  }, [resumeAtFirstUnanswered, singleMode, allFlashcards, questionIdsKey]); // eslint-disable-line
	  useEffect(() => {
	    if (resumeAtFirstUnanswered && currentQuestion) currentSingleQuestionIdRef.current = currentQuestion.id;
	  }, [resumeAtFirstUnanswered, singleIndex]); // eslint-disable-line
	  const navBtn = (disabled, primary=false) => `inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-colors ${disabled
	    ? (dm?'border-gray-800 text-gray-700 bg-gray-900/40 cursor-default':'border-gray-100 text-gray-300 bg-gray-50 cursor-default')
	    : primary
	      ? (dm?'border-yellow-700 bg-yellow-900/30 text-yellow-300 hover:bg-yellow-900/50':'border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100')
	      : (dm?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50')}`;
	  const flashcardNavBtn = (disabled, primary=false) => `h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${disabled
	    ? (dm?'text-gray-700 cursor-default':'text-gray-300 cursor-default')
	    : primary
	      ? (dm?'text-yellow-300 hover:bg-gray-800':'text-yellow-700 hover:bg-yellow-50')
	      : (dm?'text-gray-400 hover:bg-gray-800 hover:text-gray-200':'text-gray-500 hover:bg-gray-50 hover:text-gray-800')}`;
	  const scrollToFlashcardEntry = (entry) => {
	    if (!entry) return;
	    setTimeout(() => {
	      const el = document.querySelector(`[data-flashcard-entry="${flashcardEntryKey(entry)}"]`);
	      if (el) el.scrollIntoView({ behavior:'smooth', block:'center' });
	    }, 160);
	  };
	  const scrollToCompletion = () => {
	    setTimeout(() => {
	      const el = document.querySelector('[data-flashcard-completion="true"]');
	      if (el) el.scrollIntoView({ behavior:'smooth', block:'center' });
	    }, 180);
	  };
	  const handleFlashcardStudyAnswer = async (q, entry, queueIndex, letter) => {
	    const key = flashcardEntryKey(entry);
	    const masteredAfter = { ...flashcardMastered };
	    if (letter === FLASHCARD_CORRECT) masteredAfter[q.id] = true;
	    else delete masteredAfter[q.id];

	    const nextAttempt = (flashcardAttempts[q.id] || 0) + 1;
	    let nextQueue = flashcardQueue.filter((item, idx) => idx <= queueIndex || item.qid !== q.id);
	    if (letter === FLASHCARD_WRONG) {
	      nextQueue = [...nextQueue, { qid:q.id, attempt:nextAttempt, origin:entry?.origin ?? queueIndex }];
	      setFlashcardAttempts(prev => ({ ...prev, [q.id]:nextAttempt }));
	    }

	    setFlashcardEntryAnswers(prev => ({ ...prev, [key]:letter }));
	    setFlashcardMastered(masteredAfter);
	    setFlashcardQueue(nextQueue);
	    deferInteractionWork(() => onAnswer(q.id, letter)).catch(()=>{});

	    const completedAfter = questions.length > 0 && questions.every(item => masteredAfter[item.id]);
	    const nextIdx = nextQueue.findIndex((item, idx) => idx > queueIndex && !masteredAfter[item.qid]);
	    if (singleMode) {
	      if (nextIdx >= 0) setFlashcardCursor(nextIdx);
	      else if (completedAfter) setShowCompletion(true);
	      return;
	    }
	    if (nextIdx >= 0) scrollToFlashcardEntry(nextQueue[nextIdx]);
	    else if (completedAfter) scrollToCompletion();
	  };
	  const renderQuestion = (q, i, opts={}) => {
	    const entry = opts.flashcardEntry || null;
	    const entryKey = flashcardEntryKey(entry);
	    const selected = entry
	      ? (flashcardEntryAnswers[entryKey] || (entry.attempt === 0 ? validAnswers[q.id] : null) || null)
	      : validAnswers[q.id];
	    return (
	    <div
	      key={entry ? entryKey : (q.id||i)}
	      data-question-id={q.id}
	      data-flashcard-entry={entry ? entryKey : undefined}
	      className={allFlashcards ? 'scroll-mt-8 flex-1 min-h-0 flex flex-col' : undefined}
	    >
	      <QuestionCard question={q} index={i}
	        selectedLetter={selected}
	        onAnswer={entry ? (l=> selected ? undefined : handleFlashcardStudyAnswer(q, entry, i, l)) : (l=>submitAnswer(q.id,l))}
	        darkMode={dm} isFavorite={favoriteSet.has(String(q.id))}
	        onToggleFavorite={()=>onToggleFavorite(q.id)}
	        showErrorNotebook={showErrorNotebook}
	        isInErrorNotebook={errorNotebookSet.has(String(q.id))}
	        onToggleErrorNotebook={onToggleErrorNotebook ? ()=>onToggleErrorNotebook(q.id) : undefined}
	        apiKey={apiKey} oracleLength={oracleLength} onCall={onCall}
	        onOpenAnswer={onOpenAnswer}
	        adminQuestionExplanations={adminQuestionExplanations}
	        flashcardStudyMode={!!entry}
	        flashcardLarge={allFlashcards}/>
	    </div>
	  );};
  const renderCompletion = () => {
    const wrongCount = questions.length - correctCount;
    const tone = pct>=80 ? 'Excelente retenção.' : pct>=60 ? 'Boa sessão, com alguns pontos para reforçar.' : 'Sessão útil para revelar lacunas importantes.';
    const nextUnitAction = onNextUnit ? {
      label:nextUnitLabel,
      helper:nextUnitHelper,
      icon:<ChevronRight className="w-5 h-5"/>,
      fn:onNextUnit,
    } : null;
    const spacedReviewAction = onAddToReview ? {
      label:inReviewCount>0?`Gerenciar revisão espaçada (${inReviewCount})`:'Adicionar à revisão espaçada',
      helper:inReviewCount>0?'Ajustar as questões que já estão no ciclo.':'Colocar este bloco no ciclo de retenção.',
      icon:<RepeatIcon className="w-5 h-5"/>,
      fn:()=>onAddToReview(questions, answers),
    } : null;
    const notebookActions = [
      onReviewErrorNotebook && errorNotebook.length > 0 ? {
        label:'Gerar caderno de erros',
        icon:<BookOpen className="w-4 h-4"/>,
        fn:onReviewErrorNotebook,
      } : null,
      onOpenErrorReviewResult && errorReviewResultCount > 0 ? {
        label:errorReviewResultCount>1?`Abrir geradas (${errorReviewResultCount})`:'Abrir revisão gerada',
        icon:<BookOpen className="w-4 h-4"/>,
        fn:onOpenErrorReviewResult,
      } : null,
    ].filter(Boolean);
    const navigationActions = [
      singleMode ? {
        label:'Ver questões',
        icon:<ArrowLeft className="w-4 h-4"/>,
        fn:()=>setShowCompletion(false),
      } : null,
      onGoToAula ? {
        label:goToAulaLabel,
        icon:goToAulaIcon,
        fn:onGoToAula,
      } : null,
      nextUnitAction,
    ].filter(Boolean);
    const reviewActions = [
      spacedReviewAction,
      ...notebookActions,
    ].filter(Boolean);
	    const extraActions = [
	      allFlashcards && onExportAnki ? {
	        label:'Enviar para Anki',
	        icon:<Send className="w-4 h-4"/>,
	        fn:()=>onExportAnki(questions),
	      } : null,
	      onGenerateExtra ? {
	        label:'Gerar bloco extra',
	        icon:<PlusIcon className="w-4 h-4"/>,
        fn:onGenerateExtra,
      } : null,
      showBizuario&&onBizuario ? {
        label:'Criar aula sobre isso',
        icon:<GraduationCap className="w-4 h-4"/>,
        fn:onBizuario,
      } : null,
    ].filter(Boolean);
    const notebookBtnClass = dm
      ? 'border-yellow-800/80 text-yellow-300 hover:bg-yellow-900/20'
      : 'border-yellow-300 text-yellow-700 hover:bg-yellow-50';
    const utilityBtnClass = dm
      ? 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
      : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800';
    const primaryBtnClass = 'border-yellow-600 bg-yellow-600 text-white hover:bg-yellow-700';
    return (
      <div className={`max-w-2xl mx-auto rounded-2xl border p-8 md:p-10 text-center ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'} shadow-sm`}>
        <RepeatIcon className="w-16 h-16 mx-auto mb-4 text-yellow-500"/>
        <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${dm?'text-gray-500':'text-gray-400'}`}>Bloco encerrado</p>
        <h3 className="text-3xl font-serif font-bold text-yellow-600 mb-3">Bloco concluído</h3>
        <p className={`text-4xl font-serif font-bold mb-2 ${pct>=70?'text-green-500':pct>=50?'text-yellow-600':'text-red-500'}`}>{pct}%</p>
        <p className={`text-sm font-bold mb-4 ${dm?'text-gray-300':'text-gray-700'}`}>{correctCount}/{questions.length} corretas · {wrongCount} para reforçar</p>
        <p className={`text-sm leading-relaxed mb-6 ${dm?'text-gray-400':'text-gray-500'}`}>{tone} Adicione as questões à revisão espaçada para transformar esse resultado em ciclo de retenção.</p>
        <div className="grid grid-cols-2 gap-3 mb-8 text-left">
          <div className={`rounded-xl border p-4 ${dm?'border-gray-800 bg-gray-950/60':'border-gray-100 bg-gray-50'}`}>
            <p className="text-2xl font-serif font-bold text-green-500">{correctCount}</p>
            <p className={`text-xs font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>dominadas</p>
          </div>
          <div className={`rounded-xl border p-4 ${dm?'border-gray-800 bg-gray-950/60':'border-gray-100 bg-gray-50'}`}>
            <p className="text-2xl font-serif font-bold text-red-500">{wrongCount}</p>
            <p className={`text-xs font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>reforço</p>
          </div>
        </div>
        <div className="space-y-5 text-left">
          {navigationActions.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:justify-center gap-2">
              {navigationActions.map(action=>(
                <button key={action.label} onClick={action.fn} title={action.helper}
                  className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${action.primary?primaryBtnClass:utilityBtnClass}`}>
                    {action.icon}
                    <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}
          {reviewActions.length > 0 && (
            <div className={`border-t pt-4 ${dm?'border-gray-800':'border-gray-100'}`}>
              <div className="flex flex-wrap justify-center gap-2">
                {reviewActions.map(action=>(
                  <button key={action.label} onClick={action.fn}
                    className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${notebookBtnClass}`}>
                    {action.icon}{action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {extraActions.length > 0 && (
            <div className={`border-t pt-4 ${dm?'border-gray-800':'border-gray-100'}`}>
              <div className="flex flex-wrap justify-center gap-2">
                {extraActions.map(action=>(
                  <button key={action.label} onClick={action.fn}
                    className={`inline-flex min-h-[38px] items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-bold transition-colors ${action.active?(dm?'border-green-700 text-green-400 bg-green-900/10':'border-green-300 text-green-700 bg-green-50'):utilityBtnClass}`}>
                    {action.icon}{action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isGenerating && questions.length > 0 && showCompletion && allDone) {
    return (
      <div className="w-full">
        <div className={`mb-4 border-b pb-4 ${dm?'border-gray-700':'border-gray-200'}`}>
          <button onClick={onBack} className={`flex items-center gap-2 mb-2 font-bold ${dm?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}>
            <ArrowLeft className="w-4 h-4"/>{backLabel}
          </button>
          <h2 className={`${allFlashcards ? 'text-xl md:text-2xl' : 'text-2xl'} mobile-wrap font-serif font-bold text-yellow-600 leading-tight`}>{title}</h2>
        </div>
        {renderCompletion()}
      </div>
    );
  }

  return (
    <div className={`w-full ${allFlashcards && singleMode ? `${flashcardFullscreen ? 'flashcard-fullscreen-stage' : 'flashcard-mobile-stage h-[calc(100dvh-84px)] md:h-[calc(100dvh-94px)] md:-my-6'} flex flex-col overflow-hidden` : ''}`}>
      {/* ── Header ── */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center ${allFlashcards ? 'mb-2 pb-0 gap-1' : 'mb-6 pb-6 gap-4 border-b'} ${!allFlashcards ? (dm?'border-gray-700':'border-gray-200') : ''}`}>
        <div className="min-w-0 flex-1">
          {allFlashcards && singleMode ? (
            <div className="w-full space-y-1.5">
              <div className={`flashcard-study-topbar flex min-w-0 items-center gap-2 ${flashcardFullscreen ? '' : ''}`}>
                {!flashcardFullscreen&&(
                  <button onClick={onBack} className={`h-8 flex flex-shrink-0 items-center gap-1.5 rounded-lg pr-1 text-sm font-bold ${dm?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}>
                    <ArrowLeft className="w-4 h-4"/><span className="max-w-[5.5rem] truncate">{backLabel}</span>
                  </button>
                )}
                <h2 className="min-w-0 flex-1 truncate text-sm font-serif font-bold text-yellow-600">{title}</h2>
                <span className={`flex-shrink-0 text-xs font-bold tabular-nums ${dm?'text-gray-500':'text-gray-400'}`}>{answeredCount}/{questions.length}</span>
              {actionMenuItems.length>0&&(
                <div className="relative flex-shrink-0">
                  <button
                    onClick={()=>setHeaderActionsOpen(v=>!v)}
                    title="Ações do bloco"
                    aria-label="Ações do bloco"
                    className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-colors ${dm?'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-yellow-400':'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-yellow-700'}`}>
                    <MoreIcon className="w-4 h-4"/>
                  </button>
                  {headerActionsOpen&&(
                    <div className={`mobile-safe-action-menu absolute right-0 top-10 z-40 w-56 rounded-xl border shadow-xl overflow-hidden ${dm?'bg-gray-900 border-gray-700':'bg-white border-gray-200'}`}>
                      {actionMenuItems.map(item=>(
                        <button
                          key={item.label}
                          disabled={item.disabled}
                          onClick={()=>{if(item.disabled)return;setHeaderActionsOpen(false);item.fn();}}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs font-bold transition-colors disabled:cursor-default ${item.disabled?(dm?'text-gray-500 bg-gray-950/30':'text-gray-400 bg-gray-50'):item.danger?(dm?'text-red-400 hover:bg-red-900/20':'text-red-600 hover:bg-red-50'):item.active?(dm?'text-green-400 hover:bg-gray-800':'text-green-700 hover:bg-gray-50'):(dm?'text-gray-300 hover:bg-gray-800':'text-gray-700 hover:bg-gray-50')}`}>
                          {item.icon}{item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>
          ) : (
            <>
            <button onClick={onBack} className={`flex items-center gap-2 mb-2 font-bold ${dm?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}>
              <ArrowLeft className="w-4 h-4"/>{backLabel}
            </button>
            <div className="flex items-center justify-between gap-3">
              <h2 className="min-w-0 flex-1 text-2xl mobile-title-lg mobile-wrap font-serif font-bold text-yellow-600 leading-tight sm:truncate">{title}</h2>
            {actionMenuItems.length>0&&(
              <div className="relative flex-shrink-0">
                <button
                  onClick={()=>setHeaderActionsOpen(v=>!v)}
                  title="Ações do bloco"
                  aria-label="Ações do bloco"
                  className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-colors ${dm?'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-yellow-400':'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-yellow-700'}`}>
                  <MoreIcon className="w-5 h-5"/>
                </button>
                {headerActionsOpen&&(
                  <div className={`mobile-safe-action-menu absolute right-0 top-11 z-40 w-56 rounded-xl border shadow-xl overflow-hidden ${dm?'bg-gray-900 border-gray-700':'bg-white border-gray-200'}`}>
                    {actionMenuItems.map(item=>(
                      <button
                        key={item.label}
                        onClick={()=>{setHeaderActionsOpen(false);item.fn();}}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs font-bold transition-colors ${item.danger?(dm?'text-red-400 hover:bg-red-900/20':'text-red-600 hover:bg-red-50'):item.active?(dm?'text-green-400 hover:bg-gray-800':'text-green-700 hover:bg-gray-50'):(dm?'text-gray-300 hover:bg-gray-800':'text-gray-700 hover:bg-gray-50')}`}>
                        {item.icon}{item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            </div>
            </>
          )}
          {answeredCount>0&&!allFlashcards&&<p className="text-sm opacity-60 mt-1">
            {allDone
              ? `${correctCount}/${questions.length} corretas (${pct}%)`
              : `${answeredCount}/${questions.length} respondidas`}
          </p>}
	        </div>
	        <div className="flex flex-wrap items-center gap-2">
	          {questions.length===0&&!isGenerating&&onGenerate&&(
	            <button onClick={onGenerate} className="bg-yellow-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-700">
              {generateIcon||<Sparkles className="w-5 h-5"/>}{generateLabel}
            </button>
          )}
        </div>
      </div>

      {isAdmin&&adminStudyPlan.length>0&&questions.length===0&&<TopicStudyPlanPanel plans={adminStudyPlan} questions={questions} answers={answers} darkMode={dm}/>}

      {/* ── Subtópicos ── */}
      {!isGenerating&&questions.length===0&&subtopics.length>0&&!(isAdmin&&adminStudyPlan.length>0)&&(
        <div className={`mb-4 p-4 rounded-xl border ${dm?'bg-blue-900/20 border-blue-700':'bg-blue-50 border-blue-200'}`}>
          <p className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${dm?'text-blue-400':'text-blue-600'}`}>
            📋 Subtópicos — o Oráculo cobrirá exatamente estes:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {subtopics.map((sub,i)=>(
              <div key={i} className={`text-sm px-3 py-1.5 rounded-lg ${dm?'bg-blue-900/30 text-blue-200':'bg-white text-blue-800'}`}>
                <span className="opacity-40 mr-2">{i+1}.</span>{sub}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Seletores de estilo/tipo — aparecem abaixo dos subtópicos, antes de gerar ── */}
	      {!isGenerating&&questions.length===0&&onGenerate&&onTopicStyleChange&&(
	        <div className={`mb-6 p-4 rounded-xl border space-y-4 ${dm?'bg-gray-800/50 border-gray-700':'bg-gray-50 border-gray-200'}`}>
	          {/* Quantidade */}
	          {!isMemoryCardType(topicType || 'direct') && !(isAdmin&&adminStudyPlan.length>0) && <div>
	            <p className={`text-xs font-bold uppercase mb-2 ${dm?'text-gray-400':'text-gray-500'}`}>Configuração das questões</p>
	            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
	              <div>
                <label className={`block text-[11px] font-bold uppercase mb-1.5 ${dm?'text-gray-500':'text-gray-400'}`}>Questões/Subtópico</label>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <input type="number" min="1" max="10" value={questionCountPerSub || 1}
                    disabled={questionCountAuto}
                    onChange={e=>{
                      const v = Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1));
                      onTopicStyleChange(v, 'qPerSub');
                    }}
                    className={`w-full p-3 rounded-xl border text-center font-bold outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-40 ${dm?'bg-gray-900 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
                  <button type="button" onClick={()=>onTopicStyleChange(!questionCountAuto, 'qPerSubAuto')}
                    className={`px-3 rounded-xl border-2 text-xs font-bold transition-all ${questionCountAuto?(dm?'border-yellow-500 bg-yellow-900/20 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-600 text-gray-400 hover:border-gray-500':'border-gray-200 text-gray-500 hover:border-gray-300')}`}>
                    IA
                  </button>
                </div>
                <p className={`text-[11px] mt-1 ${dm?'text-gray-500':'text-gray-400'}`}>{questionCountAuto?'A IA decide a quantidade, com piso de 2 cobranças por subtópico e mais quando o tema for denso.':'Quantidade fixa para cada subtópico.'}</p>
              </div>
              {['direct','vof','cespe'].includes(topicType || 'direct') && (
                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1.5 ${dm?'text-gray-500':'text-gray-400'}`}>Alternativas</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[4,5].map(n=>(
                      <button key={n} type="button" onClick={()=>onTopicStyleChange(n, 'numAlternatives')}
                        style={{minHeight:54}}
                        className={`rounded-xl border-2 text-sm font-bold transition-all py-3 ${Number(numAlternatives || 5)===n?(dm?'border-yellow-500 bg-yellow-900/20 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-600 text-gray-400 hover:border-gray-500':'border-gray-200 text-gray-500 hover:border-gray-300')}`}>
                        {n} (A-{'ABCDE'[n-1]})
                      </button>
                    ))}
                  </div>
                </div>
	              )}
	            </div>
	          </div>}
	          {/* Estilo do enunciado */}
	          {!isMemoryCardType(topicType || 'direct') && <div>
	            <p className={`text-xs font-bold uppercase mb-2 ${dm?'text-gray-400':'text-gray-500'}`}>Estilo do Enunciado</p>
	            <QuestionStyleSelector value={topicStyle} onChange={value=>onTopicStyleChange(value,'style')} darkMode={dm}/>
	          </div>}
          {/* Tipo de questão */}
          <div>
            <p className={`text-xs font-bold uppercase mb-2 ${dm?'text-gray-400':'text-gray-500'}`}>Tipo de Questão</p>
            <QuestionTypeSelector
              selected={[topicType || 'direct']}
              onChange={types=>onTopicStyleChange(types[0], 'type')}
              darkMode={dm}
              single={true}
              isAdmin={isAdmin}
              canCreateFlashcards={canCreateFlashcards}
            />
          </div>
          {onGeminiThinkingChange&&(
            <div>
              <p className={`text-xs font-bold uppercase mb-2 ${dm?'text-gray-400':'text-gray-500'}`}>Modo Gemini</p>
              <GeminiThinkingSelector
                value={!!geminiThinkingEnabled}
                onChange={onGeminiThinkingChange}
                darkMode={dm}
              />
            </div>
          )}
          {onAdminChunkedQuestionsChange&&(
            <button type="button" onClick={()=>onAdminChunkedQuestionsChange(!adminChunkedQuestionsEnabled)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${adminChunkedQuestionsEnabled?(dm?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(dm?'border-gray-600 bg-gray-900':'border-gray-200 bg-white')}`}>
              <div>
                <p className={`text-sm font-bold ${adminChunkedQuestionsEnabled?'text-yellow-500':''}`}>Geração em lotes</p>
                <p className="text-xs opacity-50 mt-0.5">Divide blocos grandes em requests de até 15 questões.</p>
              </div>
              <div style={{width:40,height:24,borderRadius:12,padding:2,background:adminChunkedQuestionsEnabled?'#ca8a04':'#9ca3af',transition:'background 0.2s',flexShrink:0,display:'flex',alignItems:'center'}}>
                <div style={{width:20,height:20,borderRadius:10,background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.3)',transform:adminChunkedQuestionsEnabled?'translateX(16px)':'translateX(0)',transition:'transform 0.2s'}}/>
              </div>
            </button>
          )}
          {onAuditQuestionsChange&&(
            <button type="button" onClick={()=>onAuditQuestionsChange(!auditQuestionsEnabled)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${auditQuestionsEnabled?(dm?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(dm?'border-gray-600 bg-gray-900':'border-gray-200 bg-white')}`}>
              <div>
                <p className={`text-sm font-bold ${auditQuestionsEnabled?'text-yellow-500':''}`}>Auditoria</p>
                <p className="text-xs opacity-50 mt-0.5">Segundo request para revisar qualidade, utilidade, pistas e lacunas antes de salvar.</p>
              </div>
              <div style={{width:40,height:24,borderRadius:12,padding:2,background:auditQuestionsEnabled?'#ca8a04':'#9ca3af',transition:'background 0.2s',flexShrink:0,display:'flex',alignItems:'center'}}>
                <div style={{width:20,height:20,borderRadius:10,background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.3)',transform:auditQuestionsEnabled?'translateX(16px)':'translateX(0)',transition:'transform 0.2s'}}/>
              </div>
            </button>
          )}
        </div>
      )}

      {/* ── Gerando ── */}
      {isGenerating&&questions.length===0&&(
        <div className="flex flex-col items-center py-20">
          <Spinner className="w-12 h-12 text-yellow-600 mb-4"/>
          <p className="text-lg font-serif font-bold text-yellow-600 text-center">{loadingMsg||'Gerando questões...'}</p>
          {streamCount>0&&<p className="text-sm text-green-600 dark:text-green-400 mt-2 font-bold animate-pulse">✓ {streamCount} questões geradas...</p>}
          <p className="text-xs opacity-30 mt-2">Até 60 segundos</p>
        </div>
      )}

      {/* ── Questões ── */}
      {!isGenerating&&(
        <div className={allFlashcards && singleMode ? 'flex-1 min-h-0 flex flex-col' : ''}>
	          {singleMode && currentQuestion ? (
	            <div className={allFlashcards ? 'flex-1 min-h-0 flex flex-col' : ''}>
	              <div className={allFlashcards ? `mb-1 h-0.5 rounded-full overflow-hidden ${dm?'bg-gray-800/80':'bg-gray-200'}` : `mobile-progress-row mb-2 flex items-center justify-between gap-3 rounded-xl px-4 py-3 ${dm?'bg-gray-900':'bg-gray-50'}`}>
	                {allFlashcards ? (
	                  <div className="h-full bg-yellow-500 rounded-full transition-all" style={{width:`${questions.length ? (answeredCount / questions.length) * 100 : 0}%`}}/>
	                ) : (
	                  <>
	                    <span className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Questão {singleIndex + 1} de {questions.length}</span>
	                    <div className={`h-1.5 flex-1 rounded-full overflow-hidden ${dm?'bg-gray-800':'bg-gray-200'}`}>
	                      <div className="h-full bg-yellow-500 rounded-full transition-all" style={{width:`${questions.length ? (answeredCount / questions.length) * 100 : 0}%`}}/>
	                    </div>
	                    <span className={`text-xs font-bold tabular-nums ${dm?'text-gray-500':'text-gray-400'}`}>{answeredCount}/{questions.length}</span>
	                  </>
	                )}
	              </div>
	              <div className={allFlashcards ? 'flex-1 min-h-0 flex flex-col' : ''}>
	                {renderQuestion(currentQuestion, allFlashcards ? flashcardCursor : singleIndex, allFlashcards ? { flashcardEntry:activeFlashcardEntry } : {})}
	              </div>
	              {!allFlashcards&&<div className="mt-4 flex items-center justify-between gap-3">
	                {(
	                  <>
	                  <button disabled={singleIndex===0} onClick={()=>setSingleIndex(i=>Math.max(0,i-1))} className={navBtn(singleIndex===0)}>
	                    <ArrowLeft className="w-4 h-4"/>Voltar
	                  </button>
	                  <button
	                    disabled={singleIndex>=questions.length-1 ? !allDone : false}
	                    onClick={()=>{
	                      if (singleIndex>=questions.length-1) setShowCompletion(true);
	                      else setSingleIndex(i=>Math.min(questions.length-1,i+1));
	                    }}
	                    className={navBtn(singleIndex>=questions.length-1 ? !allDone : false, true)}
	                  >
	                    {singleIndex>=questions.length-1 ? <><CheckIcon className="w-4 h-4"/>Concluir</> : <>Avançar<ChevronRight className="w-4 h-4"/></>}
	                  </button>
	                  </>
	                )}
	              </div>}
	            </div>
	          ) : allFlashcards
	            ? flashcardQueue.map((entry, i) => {
	                const q = getFlashcardById(entry.qid);
	                return q ? renderQuestion(q, i, { flashcardEntry:entry }) : null;
	              })
	            : questions.map((q,i)=>renderQuestion(q,i))}
	          {/* ── Conclusão ── */}
	          {!singleMode&&allDone&&<div className="py-10" data-flashcard-completion={allFlashcards ? 'true' : undefined}>{renderCompletion()}</div>}
	        </div>
	      )}
    </div>
  );
};

// ─── OPEN ANSWER INLINE ──────────────────────────────────────────────────────
// Componente inline para questões abertas/dissertativas dentro do QuestionCard
const OpenAnswerInline = ({ question, darkMode, apiKey, onCall, oracleLength, savedAnswer, onSave }) => {
  const dm = darkMode;
  const isEssay = question.isEssay;
  const maxChars = isEssay ? 2000 : 400;

  // savedAnswer = JSON string { answer, score, verdict, feedback } — validar antes de usar
  let parsed = null;
  try {
    const p = savedAnswer ? JSON.parse(savedAnswer) : null;
    if (p?.answer) parsed = p; // só usa se tem campo answer
  } catch(e) { parsed = null; }

  const [answer, setAnswer]   = useState(parsed?.answer || '');
  const [result, setResult]   = useState(parsed?.score != null ? parsed : null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(!parsed?.answer);

  const callOracle = onCall || ((p,s) => callGemini(p, s, apiKey));

  const submit = async () => {
    if (!answer.trim() || loading) return;
    setLoading(true);
    try {
      const sys = `Você é um professor de medicina corrigindo uma prova de residência. Seja rigoroso e honesto.

QUESTÃO: ${question.statement}
GABARITO/REFERÊNCIA: ${question.expectedAnswer || question.explanation || ''}
RESPOSTA DO ALUNO: ${answer}

REGRA PRINCIPAL: avalie se a resposta demonstra conhecimento médico real sobre o tema perguntado.
- Se a resposta é vaga, genérica, nonsense, incompleta demais ou claramente um chute → nota baixa (0 a 30)
- Se menciona algo correto mas de forma superficial ou incompleta → nota média (31 a 65)
- Se demonstra conhecimento técnico real e cobre os pontos essenciais → nota alta (66 a 100)
- NÃO dê crédito por coincidências textuais — o aluno pode ter acertado uma palavra sem saber o conceito
- NÃO seja condescendente — se errou, errou; se não sabe, não sabe

Responda APENAS JSON válido (sem markdown, sem texto fora do JSON):
{"nota":número de 0 a 100,"veredicto":"CORRETO|PARCIALMENTE CORRETO|INCORRETO","feedback":"Use 3-5 frases como aula: mostre o que o aluno acertou ou errou, qual é a resposta correta e por que cada ponto é clinicamente relevante. Se errou tudo, explique o conteúdo do zero."}`;
      const raw = await callOracle('Corrija esta resposta.', sys);
      const json = JSON.parse(raw.replace(/```json|```/g,'').trim());
      const saved = { answer, score: json.nota, verdict: json.veredicto, feedback: json.feedback };
      setResult(saved);
      setEditing(false);
      onSave(JSON.stringify(saved));
    } catch(e) {
      const saved = { answer, score: null, verdict: 'ERRO', feedback: 'Falha na correção. Verifique sua conexão e tente novamente.' };
      setResult(saved);
      setEditing(false);
      onSave(JSON.stringify(saved));
    }
    setLoading(false);
  };

  const color = result?.score != null ? (result.score >= 70 ? 'green' : result.score >= 40 ? 'yellow' : 'red') : null;

  return (
    <div className="mb-4 space-y-3">
      {/* Campo de resposta */}
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={answer} onChange={e=>setAnswer(e.target.value.slice(0, maxChars))}
            placeholder={isEssay ? 'Escreva sua resposta dissertativa...' : 'Responda em até 3 linhas...'}
            rows={isEssay ? 7 : 3}
            className={`w-full p-3 rounded-xl border resize-none outline-none focus:ring-2 focus:ring-yellow-500 text-sm ${dm?'bg-gray-700 border-gray-600 text-white placeholder-gray-500':'bg-gray-50 border-gray-200'}`}
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${dm?'text-gray-500':'text-gray-400'}`}>{answer.length}/{maxChars}</span>
            <div className="flex gap-2">
              {result && <button onClick={()=>setEditing(false)} className={`text-xs px-3 py-1.5 rounded-lg ${dm?'text-gray-400 hover:text-gray-200':'text-gray-500 hover:text-gray-700'}`}>Cancelar</button>}
              <button onClick={submit} disabled={!answer.trim()||loading}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold text-sm disabled:opacity-40">
                {loading ? <><Spinner className="w-3.5 h-3.5 text-white"/>Corrigindo...</> : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Resposta salva */
        <div className={`rounded-xl border p-3 text-sm ${dm?'bg-gray-700/50 border-gray-600':'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-start justify-between gap-2">
            <p className={`flex-1 leading-relaxed ${dm?'text-gray-300':'text-gray-700'}`}>{answer}</p>
            <button onClick={()=>setEditing(true)} className={`flex-shrink-0 text-xs px-2 py-1 rounded ${dm?'text-gray-500 hover:text-gray-300':'text-gray-400 hover:text-gray-600'}`}>
              <EditIcon className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>
      )}

      {/* Resultado da correção */}
      {result && !editing && (
        <div className={`rounded-xl border p-4 space-y-2 ${
          color==='green'?(dm?'bg-green-900/20 border-green-700/50':'bg-green-50 border-green-200'):
          color==='yellow'?(dm?'bg-yellow-900/20 border-yellow-700/50':'bg-yellow-50 border-yellow-200'):
          color==='red'?(dm?'bg-red-900/20 border-red-700/50':'bg-red-50 border-red-200'):
          (dm?'bg-gray-800 border-gray-700':'bg-gray-50 border-gray-200')}`}>
          {result.score != null && (
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-3xl font-bold font-serif ${color==='green'?'text-green-500':color==='yellow'?'text-yellow-600':'text-red-500'}`}>{result.score}</span>
              <div>
                <p className={`font-bold text-sm ${color==='green'?'text-green-600':color==='yellow'?'text-yellow-700':color==='red'?'text-red-600':''}`}>{result.verdict}</p>
                <p className={`text-xs ${dm?'text-gray-500':'text-gray-400'}`}>de 100 pontos</p>
              </div>
            </div>
          )}
          <div className={`text-sm leading-relaxed ${dm?'text-gray-200':'text-gray-700'}`}>{parseHtmlTextChat(result.feedback||'')}</div>
        </div>
      )}

      {/* Chat com o Oráculo — aparece quando já respondeu */}
      {result && !editing && apiKey && (
        <ChatBox question={{...question, statement: question.statement, options: [], explanation: question.expectedAnswer||question.explanation||''}}
          darkMode={dm} apiKey={apiKey} oracleLength={oracleLength} onCall={onCall}/>
      )}
    </div>
  );
};

// ─── OPEN ANSWER MODAL (mantido para compatibilidade) ─────────────────────────
const OpenAnswerModal = ({ question, darkMode, apiKey, onCall, onClose, isEssay=false }) => {
  const dm = darkMode;
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { score, feedback }
  const maxChars = isEssay ? 2000 : 400;

  const submit = async () => {
    if (!answer.trim() || loading) return;
    setLoading(true);
    try {
      const ctx = isEssay
        ? `Questão dissertativa: ${question.statement}`
        : `Questão de resposta curta: ${question.statement}`;
      const esperado = question.expectedAnswer || question.explanation || '';
      const sys = `Você é um professor/monitor corrigindo uma resposta de aluno. Seja direto, justo e formal — como um docente experiente, não um assistente puxa-saco.

QUESTÃO: ${ctx}
GABARITO/REFERÊNCIA: ${esperado}
RESPOSTA DO ALUNO: ${answer}

Avalie e responda EXATAMENTE neste formato JSON (sem markdown, sem explicações fora do JSON):
{
  "nota": <número de 0 a 100>,
  "veredicto": "<CORRETO|PARCIALMENTE CORRETO|INCORRETO>",
  "feedback": "<2-4 frases diretas: o que acertou, o que errou, o que faltou. Sem elogios excessivos. Aponte a resposta correta se errou.>"
}`;
      const call = onCall || ((p, s) => callGemini(p, s, apiKey));
      const raw = await call('Corrija esta resposta.', sys);
      const json = JSON.parse(raw.replace(/```json|```/g, '').trim());
      setResult(json);
    } catch(e) {
      setResult({ nota: null, veredicto: 'ERRO', feedback: 'Não foi possível corrigir agora. Verifique sua conexão e tente novamente.' });
    }
    setLoading(false);
  };

  const color = result ? (result.nota >= 70 ? 'green' : result.nota >= 40 ? 'yellow' : 'red') : null;

  return (
    <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4" onClick={onClose}>
      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${dm?'bg-gray-900 border-gray-700':'bg-white border-gray-200'}`}
        style={{maxHeight:'calc(100dvh - 6rem)'}} onClick={e=>e.stopPropagation()}>
        <div className={`flex items-center justify-between px-5 py-4 border-b flex-shrink-0 ${dm?'border-gray-700':'border-gray-100'}`}>
          <h3 className="font-serif font-bold text-yellow-600 flex items-center gap-2">
            {isEssay ? '📝 Dissertativa' : '✏️ Resposta Curta'}
          </h3>
          <button type="button" aria-label="Fechar" onClick={onClose} className={`text-xl ${dm?'text-gray-400':'text-gray-400'}`}>×</button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0 space-y-4">
          <p className={`text-base leading-relaxed ${dm?'text-gray-200':'text-gray-800'}`}>{parseHtmlTextChat(question.statement)}</p>

          {!result ? (
            <>
              <textarea
                value={answer} onChange={e=>setAnswer(e.target.value.slice(0, maxChars))}
                placeholder={isEssay ? 'Escreva sua resposta dissertativa aqui...' : 'Responda em até 3 linhas...'}
                rows={isEssay ? 8 : 4}
                className={`w-full p-3 rounded-xl border resize-none outline-none focus:ring-2 focus:ring-yellow-500 text-sm ${dm?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}
              />
              <div className="flex items-center justify-between">
                <span className={`text-xs ${dm?'text-gray-500':'text-gray-400'}`}>{answer.length}/{maxChars} chars</span>
                <button onClick={submit} disabled={!answer.trim() || loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold text-sm disabled:opacity-40">
                  {loading ? <><Spinner className="w-4 h-4 text-white"/>Corrigindo...</> : 'Enviar para o Oráculo'}
                </button>
              </div>
            </>
          ) : (
            <div className={`rounded-xl border p-4 space-y-3 ${
              color==='green' ? (dm?'bg-green-900/20 border-green-700':'bg-green-50 border-green-200') :
              color==='yellow' ? (dm?'bg-yellow-900/20 border-yellow-700':'bg-yellow-50 border-yellow-200') :
              (dm?'bg-red-900/20 border-red-700':'bg-red-50 border-red-200')
            }`}>
              {result.nota !== null && (
                <div className="flex items-center gap-3">
                  <div className={`text-4xl font-bold font-serif ${color==='green'?'text-green-500':color==='yellow'?'text-yellow-600':'text-red-500'}`}>
                    {result.nota}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{result.veredicto}</p>
                    <p className={`text-xs ${dm?'text-gray-500':'text-gray-400'}`}>de 100 pontos</p>
                  </div>
                </div>
              )}
              <p className={`text-sm leading-relaxed ${dm?'text-gray-200':'text-gray-700'}`}>{result.feedback}</p>
              {result.veredicto === 'ERRO' && (
                <button onClick={()=>{setResult(null);}} className="text-xs text-yellow-600 font-bold underline">Tentar novamente</button>
              )}
            </div>
          )}
        </div>
        <div className={`px-5 pb-5 pt-3 border-t flex-shrink-0 ${dm?'border-gray-700':'border-gray-100'}`}>
          <button onClick={onClose} className={`w-full py-3 rounded-xl font-bold text-sm ${dm?'bg-gray-800 hover:bg-gray-700':'bg-gray-100 hover:bg-gray-200'}`}>
            {result ? 'Fechar' : 'Cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
};

const FlashcardInline = ({ question, darkMode, savedAnswer, onSave, large=false, front=null }) => {
  const dm = darkMode;
  const [revealed, setRevealed] = useState(!!savedAnswer);
  useEffect(() => { setRevealed(!!savedAnswer); }, [savedAnswer, question?.id]);
  const answered = savedAnswer === FLASHCARD_CORRECT || savedAnswer === FLASHCARD_WRONG;
  if (large) {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flashcard-study-scroll flex-1 min-h-0 overflow-y-auto px-1 py-3 md:px-8 md:py-7">
          <div className="min-h-full max-w-3xl mx-auto flex items-center">
            <section className="flashcard-study-card w-full rounded-2xl px-5 py-8 shadow-[0_18px_60px_rgba(0,0,0,0.28)] md:px-12 md:py-11">
              <div className="flashcard-study-card-inner min-h-[42vh] md:min-h-[46vh] flex flex-col justify-center">
                <div className="mx-auto max-w-2xl text-center text-lg md:text-2xl font-semibold leading-relaxed select-text" style={{userSelect:'text'}}>
                  {front || parseHtmlTextChat(question.statement)}
                </div>
                {revealed && (
                  <div className="mx-auto mt-8 max-w-2xl">
                    <div
                      className="mx-auto mb-7 mt-1 w-full max-w-xl rounded-full"
                      style={{height:2, background:'linear-gradient(90deg, transparent, #d19a2d 18%, #d19a2d 82%, transparent)'}}
                      aria-hidden="true"
                    />
                    <div className="text-center text-lg md:text-2xl font-bold leading-snug text-[#111827] select-text" style={{userSelect:'text'}}>
                      {parseHtmlTextChat(question.expectedAnswer || '')}
                    </div>
                    {question.explanation && (
                      <div className="mx-auto mt-6 text-left text-base leading-relaxed text-[#4b5563] select-text" style={{userSelect:'text'}}>
                        {parseHtmlTextChat(question.explanation)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
        <div className="flashcard-study-actions flex-shrink-0">
          {!revealed ? (
            <button
              type="button"
              onClick={()=>setRevealed(true)}
              className={`flashcard-reveal-btn mx-auto w-full max-w-md min-h-[54px] px-7 py-3.5 rounded-2xl border font-black transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] ${dm?'border-yellow-700 bg-yellow-900/40 text-yellow-100 hover:bg-yellow-900/60':'border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100'}`}
            >
              <BookOpen className="w-4 h-4"/>Mostrar resposta
            </button>
          ) : (
            <div className="flashcard-answer-grid mx-auto grid w-full max-w-xl grid-cols-2 gap-3">
              <button
                type="button"
                disabled={answered}
                onClick={()=>onSave(FLASHCARD_WRONG)}
                className={`flashcard-answer-btn flashcard-wrong-btn min-h-[58px] px-5 py-3.5 rounded-2xl text-base font-black border transition-all shadow-sm active:scale-[0.99] disabled:cursor-default ${savedAnswer===FLASHCARD_WRONG ? (dm?'border-red-300 text-red-100 bg-red-950/60':'border-red-500 text-red-700 bg-red-50') : (dm?'border-red-800 bg-red-950/30 text-red-200 hover:border-red-500 hover:bg-red-950/50':'border-red-200 bg-white text-red-700 hover:border-red-400 hover:bg-red-50')} ${answered&&savedAnswer!==FLASHCARD_WRONG?'opacity-45':''}`}
              >
                Errei
              </button>
              <button
                type="button"
                disabled={answered}
                onClick={()=>onSave(FLASHCARD_CORRECT)}
                className={`flashcard-answer-btn flashcard-correct-btn min-h-[58px] px-5 py-3.5 rounded-2xl text-base font-black border transition-all shadow-sm active:scale-[0.99] disabled:cursor-default ${savedAnswer===FLASHCARD_CORRECT ? (dm?'border-green-300 text-green-100 bg-green-950/60':'border-green-500 text-green-700 bg-green-50') : (dm?'border-green-800 bg-green-950/30 text-green-200 hover:border-green-500 hover:bg-green-950/50':'border-green-200 bg-white text-green-700 hover:border-green-400 hover:bg-green-50')} ${answered&&savedAnswer!==FLASHCARD_CORRECT?'opacity-45':''}`}
              >
                Acertei
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
  const answerTone = savedAnswer === FLASHCARD_CORRECT
    ? (dm ? 'border-green-700/80 bg-green-950/30 text-green-100' : 'border-green-200 bg-green-50 text-green-900')
    : savedAnswer === FLASHCARD_WRONG
      ? (dm ? 'border-red-700/80 bg-red-950/30 text-red-100' : 'border-red-200 bg-red-50 text-red-900')
      : (dm ? 'border-gray-700 bg-gray-950/60 text-gray-200' : 'border-gray-200 bg-white text-gray-800');
  const minHeight = large ? 'flex-1 min-h-0' : 'min-h-[220px]';

  return (
    <div className={large ? 'flex-1 min-h-0 flex flex-col' : 'space-y-5'}>
      {!revealed ? (
        <div className={`${minHeight} rounded-2xl border-2 border-dashed flex flex-col items-center ${large?'justify-end pb-6 md:pb-8':'justify-center'} text-center px-5 md:px-8 py-8 ${dm?'border-gray-700 bg-gray-950/40':'border-gray-200 bg-gray-50'}`}>
          <button
            type="button"
            onClick={()=>setRevealed(true)}
            className="w-full sm:w-auto min-h-[52px] px-7 py-3.5 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-[0.99]"
          >
            <BookOpen className="w-4 h-4"/>Mostrar resposta
          </button>
        </div>
      ) : (
        <div className={`${minHeight} rounded-2xl border p-5 md:p-7 flex flex-col ${answerTone}`}>
          <div className="flex-1">
            <div
              className="mb-5 w-full rounded-full"
              style={{height:2, background:'linear-gradient(90deg, transparent, #d19a2d 18%, #d19a2d 82%, transparent)'}}
              aria-hidden="true"
            />
            <div className="text-base md:text-xl font-bold leading-snug text-center select-text" style={{userSelect:'text'}}>
              {parseHtmlTextChat(question.expectedAnswer || '')}
            </div>
            {question.explanation && (
              <div className={`mt-5 pt-4 border-t text-base leading-relaxed select-text ${dm?'border-white/10':'border-black/10'}`} style={{userSelect:'text'}}>
                {parseHtmlTextChat(question.explanation)}
              </div>
            )}
          </div>
	          <div className="grid grid-cols-2 gap-3 mt-7">
	            <button
	              type="button"
	              disabled={answered}
	              onClick={()=>onSave(FLASHCARD_WRONG)}
	              className={`min-h-[58px] px-4 py-3 rounded-xl font-black border transition-all shadow-sm active:scale-[0.99] disabled:cursor-default ${savedAnswer===FLASHCARD_WRONG ? (dm?'border-red-300 text-red-200 bg-red-950/40':'border-red-500 text-red-700 bg-red-50') : (dm?'border-red-500 text-red-200 hover:border-red-300 hover:text-red-100':'border-red-300 text-red-700 hover:border-red-500 hover:text-red-800')} ${answered&&savedAnswer!==FLASHCARD_WRONG?'opacity-45':''}`}
	            >
	              Errei
	            </button>
	            <button
	              type="button"
	              disabled={answered}
	              onClick={()=>onSave(FLASHCARD_CORRECT)}
	              className={`min-h-[58px] px-4 py-3 rounded-xl font-black border transition-all shadow-sm active:scale-[0.99] disabled:cursor-default ${savedAnswer===FLASHCARD_CORRECT ? (dm?'border-green-300 text-green-200 bg-green-950/40':'border-green-500 text-green-700 bg-green-50') : (dm?'border-green-500 text-green-200 hover:border-green-300 hover:text-green-100':'border-green-300 text-green-700 hover:border-green-500 hover:text-green-800')} ${answered&&savedAnswer!==FLASHCARD_CORRECT?'opacity-45':''}`}
	            >
	              Acertei
	            </button>
          </div>
          {answered && <p className="text-xs opacity-50 mt-3">Resposta registrada.</p>}
        </div>
      )}
    </div>
  );
};

// ─── QUESTION TYPE SELECTOR ───────────────────────────────────────────────────
const QUESTION_TYPES = [
  { k:'direct', group:'closed', icon:CheckCircle2, label:'Múltipla escolha', desc:'Alternativas com apenas uma resposta correta' },
  { k:'vof', group:'closed', icon:LayersIcon, label:'Verdadeiro ou falso', desc:'Várias afirmações avaliadas na mesma questão' },
  { k:'cespe', group:'closed', icon:ShieldAlert, label:'Certo ou errado', desc:'Uma afirmação para julgar, no estilo Cebraspe' },
  { k:'open', group:'open', icon:EditIcon, label:'Resposta curta', desc:'Resposta breve com correção e feedback da IA' },
  { k:'essay', group:'open', icon:FileText, label:'Dissertativa', desc:'Resposta longa com avaliação detalhada da IA' },
  { k:'old_exam', group:'import', icon:BlockIcon, label:'Questões já existentes', desc:'Preserva conteúdo e corrige apenas OCR e formatação', externalOnly:true },
  { k:'flashcard', group:'memory', icon:RepeatIcon, label:'Flashcards', desc:'Pergunta e resposta para recuperação ativa', advancedOnly:true },
  { k:'cloze', group:'memory', icon:LayersIcon, label:'Preencher lacunas', desc:'Cartões com omissões no estilo AnKing e Anki', adminOnly:true },
];

const QuestionTypeSelector = ({ selected=[], onChange, darkMode, single=false, isAdmin=false, canCreateFlashcards=false, includeExternalOnly=false }) => {
  const dm = darkMode;
  const toggle = (k) => {
    if (single) { onChange([k]); return; }
    const next = selected.includes(k) ? selected.filter(x=>x!==k) : [...selected, k];
    if (next.length === 0) return;
    onChange(next);
  };
  const visibleTypes = QUESTION_TYPES
    .filter(t => includeExternalOnly || !t.externalOnly)
    .filter(t => !t.adminOnly || isAdmin)
    .filter(t => !t.advancedOnly || canCreateFlashcards || isAdmin);
  const groups = [
    { k:'closed', label:'Questões objetivas', desc:'Escolha ou julgue uma resposta', icon:CheckCircle2 },
    { k:'open', label:'Respostas abertas', desc:'Escreva e receba correção da IA', icon:EditIcon },
    { k:'memory', label:'Memorização ativa', desc:'Revise até conseguir recuperar a resposta', icon:RepeatIcon },
    { k:'import', label:'Importação', desc:'Trabalhe com questões que já existem', icon:BlockIcon },
  ].filter(group => visibleTypes.some(type => type.group === group.k));
  return (
    <div className="space-y-5">
      {groups.map(group => {
        const GroupIcon = group.icon;
        return (
          <section key={group.k}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <GroupIcon className="w-4 h-4 text-yellow-600"/>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">{group.label}</p>
                <p className="text-[11px] opacity-45">{group.desc}</p>
              </div>
            </div>
            <div className="space-y-2">
              {visibleTypes.filter(t => t.group === group.k).map(t => {
                const on = selected.includes(t.k);
                const TypeIcon = t.icon;
                return (
                  <button key={t.k} onClick={()=>toggle(t.k)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${on?(dm?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(dm?'border-gray-600 bg-gray-800 hover:border-gray-500':'border-gray-200 bg-white hover:border-gray-300')}`}>
                    <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center ${on?(dm?'bg-yellow-900/50 text-yellow-300':'bg-yellow-100 text-yellow-700'):(dm?'bg-gray-700 text-gray-400':'bg-gray-100 text-gray-500')}`}>
                      <TypeIcon className="w-4 h-4"/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold ${on?'text-yellow-500':''}`}>{t.label}</p>
                      <p className="text-xs opacity-50 mt-0.5">{t.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded${single?'-full':''} flex-shrink-0 flex items-center justify-center border-2 ${on?'bg-yellow-500 border-yellow-500':'border-gray-400'}`}>
                      {on && <CheckIcon className="w-3 h-3 text-white"/>}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};

const GeminiThinkingSelector = ({ value=false, onChange, darkMode, compact=false }) => {
  const dm = darkMode;
  const opts = [
    { k:false, label:'Rápido', desc:'thinking desligado' },
    { k:true, label:'Thinking', desc:'raciocínio dinâmico' },
  ];
  return (
    <div className={`grid grid-cols-2 gap-2 ${compact ? '' : 'w-full'}`}>
      {opts.map(opt => {
        const on = !!value === opt.k;
        return (
          <button key={String(opt.k)} type="button" onClick={()=>onChange(opt.k)}
            className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition-all text-center ${on?(dm?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500':'border-gray-200 bg-white text-gray-700 hover:border-gray-300')}`}>
            {opt.label}
            {!compact && <p className="font-normal opacity-60 mt-1 leading-snug">{opt.desc}</p>}
          </button>
        );
      })}
    </div>
  );
};

const ChatBox = ({ question, darkMode, apiKey, oracleLength='medium', onCall, selectedLetter=null }) => {
  // onCall(prompt, sys) → chama Gemini com rotação de chaves
  // fallback: usa apiKey direto se onCall não for passado
  const callOracle = onCall || ((prompt, sys) => callGemini(prompt, sys, apiKey));
  const explanation = cleanQuestionExplanation(question.explanation);
  const chatOptions = question.options || [];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  // Sem scroll automático — o usuário controla a posição da página
  const send = async () => {
    if (!input.trim()||loading) return;
    const msg = input.trim(); setInput('');
    setMessages(p=>[...p,{role:'user',text:msg}]);
    setLoading(true);
    try {
      const questionText = splitQuestionCase(question);
      const ctx = `${questionText.caseContext ? `Caso clínico: ${questionText.caseContext}\n\n` : ''}Questão: ${questionText.statement}\n\nAlternativas:\n${chatOptions.map(o=>`${o.letter}) ${o.text}${o.isCorrect?' ✓':''}`).join('\n')}\n\nExplicação: ${explanation}`;
      const sys = `Você é o Oráculo de Medicina da Ágora do Saber. ${ORACLE_LENGTH[oracleLength]?.inst||''} Responda com precisão clínica. Contexto:\n${ctx}`;
      const hist = messages.map(m=>`${m.role==='user'?'Estudante':'Oráculo'}: ${m.text}`).join('\n');
      const r = await callOracle(`${hist}\nEstudante: ${msg}`, sys);
      setMessages(p=>[...p,{role:'assistant',text:r}]);
    } catch(e) { setMessages(p=>[...p,{role:'assistant',text:'O Oráculo encontrou dificuldades. Tente novamente.'}]); }
    finally { setLoading(false); }
  };
  return (
    <div className="mt-4">
      <button onClick={()=>setOpen(!open)} className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg transition-colors ${darkMode?'bg-gray-700 hover:bg-gray-600 text-gray-300':'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
        <MessageCircle className="w-4 h-4 text-yellow-600"/>{open?'Fechar Chat':'Perguntar ao Oráculo'}
      </button>
      {open && (
        <div className={`mt-3 rounded-xl border overflow-hidden min-w-0 ${darkMode?'border-gray-700':'border-gray-200'}`}>
          <div className={`p-4 h-64 overflow-y-auto space-y-3 ${darkMode?'bg-gray-900':'bg-gray-50'}`}>
            {!messages.length && <p className="text-sm opacity-40 text-center pt-6">Faça uma pergunta sobre esta questão...</p>}
            {messages.map((m,i)=>(
              <div key={i} className={`flex ${m.role==='user'?'justify-end':''}`}>
                <div className={`text-base leading-relaxed p-3 rounded-xl ${m.role==='user'?'max-w-[75%] '+(darkMode?'bg-yellow-800 text-yellow-100':'bg-yellow-100 text-yellow-900'):'w-full '+(darkMode?'bg-gray-800 text-gray-200':'bg-white text-gray-800 border border-gray-200 shadow-sm')}`}>
                  {parseHtmlTextChat(m.text, darkMode)}
                </div>
              </div>
            ))}
            {loading && <div className="flex"><div className={`text-sm p-3 rounded-xl ${darkMode?'bg-gray-800 text-gray-400':'bg-white text-gray-500'}`}><Spinner className="w-4 h-4 inline mr-2"/>Pensando...</div></div>}
            <div ref={bottomRef}/>
          </div>
          {/* Compact alternative explanation buttons */}
          {chatOptions.length > 0 && <div className={`px-3 py-3 border-t ${darkMode?'border-gray-700 bg-gray-800':'border-gray-100 bg-white'}`}>
            <span className={`block text-xs font-bold uppercase mb-2 ${darkMode?'text-gray-400':'text-gray-500'}`}>Explicar alternativa</span>
            <div className="flex items-center gap-2 flex-wrap">
            {chatOptions.map(opt=>(
              (() => {
                const isWrongSelected = selectedLetter && selectedLetter !== 'SKIPPED' && selectedLetter === opt.letter && !opt.isCorrect;
                const tone = opt.isCorrect
                  ? (darkMode?'bg-green-800 text-green-100 border-green-700 hover:bg-green-700':'bg-green-100 text-green-800 border-green-200 hover:bg-green-200')
                  : isWrongSelected
                    ? (darkMode?'bg-red-900/70 text-red-100 border-red-700 hover:bg-red-900':'bg-red-100 text-red-800 border-red-200 hover:bg-red-200')
                    : (darkMode?'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600':'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200');
                return (
                  <button key={opt.letter}
                    onClick={()=>{ const msg=`Por que a opção "${opt.text}" está ${opt.isCorrect?'correta':'incorreta'}? Explique detalhadamente.`; setMessages(p=>[...p,{role:'user',text:msg}]); setLoading(true); (async()=>{ try{ const questionText=splitQuestionCase(question); const ctx=`${questionText.caseContext ? `Caso clínico: ${questionText.caseContext}\n\n` : ''}Questão: ${questionText.statement}\n\nAlternativas:\n${chatOptions.map(o=>`${o.letter}) ${o.text}${o.isCorrect?' ✓':''}`).join('\n')}\n\nExplicação: ${explanation}`; const sys=`Você é o Oráculo de Medicina da Ágora do Saber. ${ORACLE_LENGTH[oracleLength]?.inst||''} Contexto:\n${ctx}`; const r=await callOracle(msg,sys); setMessages(p=>[...p,{role:'assistant',text:r}]); }catch(e){setMessages(p=>[...p,{role:'assistant',text:'Tente novamente.'}]);}finally{setLoading(false);} })(); }}
                    title={opt.isCorrect ? 'Alternativa correta' : isWrongSelected ? 'Sua resposta' : `Explicar alternativa ${opt.letter}`}
                    className={`h-8 min-w-8 px-3 rounded-lg border text-sm font-bold transition-colors flex-shrink-0 ${tone}`}>
                    {opt.letter}
                  </button>
                );
              })()
            ))}
            </div>
          </div>}
          <div className={`flex gap-2 p-3 min-w-0 ${darkMode?'bg-gray-800':'bg-white'}`}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Digite sua dúvida..." className={`min-w-0 flex-1 text-sm p-2 rounded-lg outline-none ${darkMode?'bg-gray-700 text-white placeholder-gray-500':'bg-gray-50 text-gray-800'}`}/>
            <button onClick={send} disabled={!input.trim()||loading} className="h-10 w-10 flex-shrink-0 inline-flex items-center justify-center bg-yellow-600 text-white rounded-lg disabled:opacity-40 hover:bg-yellow-700"><Send className="w-4 h-4"/></button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── QUESTION CARD ────────────────────────────────────────────────────────────
const QuestionCard = ({ question, index, selectedLetter, onAnswer, darkMode, isFavorite, onToggleFavorite, showErrorNotebook=false, isInErrorNotebook=false, onToggleErrorNotebook, apiKey, oracleLength, revealMode='normal', onCall, onOpenAnswer, flashcardStudyMode=false, flashcardLarge=false, adminQuestionExplanations=false }) => {
  const [optimisticNotebook, setOptimisticNotebook] = useState(isInErrorNotebook);
  const [optimisticAnswer, setOptimisticAnswer] = useState(null);
  const [pressedAnswer, setPressedAnswer] = useState(null);
  const [lessonExplanationOpen, setLessonExplanationOpen] = useState(false);
  const [alternativeExplanationsOpen, setAlternativeExplanationsOpen] = useState(false);
  const answerLockRef = useRef(null);
  const answerPointerRef = useRef(null);
  const suppressNextAnswerClickRef = useRef({ letter:null, until:0 });
  useEffect(() => {
    setOptimisticNotebook(isInErrorNotebook);
  }, [isInErrorNotebook, question?.id]);
  useEffect(() => {
    answerLockRef.current = null;
    setOptimisticAnswer(null);
    setPressedAnswer(null);
    setLessonExplanationOpen(false);
    setAlternativeExplanationsOpen(false);
  }, [question?.id]);
  useEffect(() => {
    if (selectedLetter != null) {
      answerLockRef.current = selectedLetter;
      setOptimisticAnswer(null);
    } else {
      answerLockRef.current = null;
    }
  }, [selectedLetter]);
  const persistedAnswer = selectedLetter === '' ? null : selectedLetter;
  const displayedAnswer = persistedAnswer ?? optimisticAnswer;
  const isSkipped = displayedAnswer === 'SKIPPED';
  const effectiveLetter = isSkipped ? null : displayedAnswer;
  // Para questões abertas: só é "respondida" se tiver JSON salvo com campo answer
  const isOpenAnswered = (() => {
    if (!question.isOpen || !displayedAnswer || displayedAnswer === 'SKIPPED') return false;
    try { const p = JSON.parse(displayedAnswer); return !!(p?.answer); } catch(e) { return false; }
  })();
  const isAnswered = question.isOpen ? isOpenAnswered : question.isFlashcard ? !!effectiveLetter : (effectiveLetter != null);
  const showResults = (question.isOpen || question.isFlashcard) ? false : ((revealMode==='normal' && isAnswered) || (revealMode==='revealed' && (isAnswered || isSkipped)));
  const correctLetter = question.options?.find(o=>o.isCorrect)?.letter;
  const isCorrect = isAnswered && (question.isFlashcard ? effectiveLetter === FLASHCARD_CORRECT : correctLetter === effectiveLetter);
  const explanation = cleanQuestionExplanation(question.explanation);
  const questionText = splitQuestionCase(question);
  const questionTypeLabel = question.isCloze
    ? 'Cloze'
    : question.isFlashcard
      ? 'Flashcard'
      : question.libraryQuestionKind === 'clinical'
        ? 'Clínica'
        : question.libraryQuestionKind === 'direct'
          ? 'Fixação'
          : 'Questão';
  const hasStructuredExplanations = !!(question.explanationParts && (question.options || []).some(o => o.explanation));
  const iconBtnBase = 'h-8 w-8 rounded-full border flex items-center justify-center transition-colors shadow-sm active:shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-500/40';
  const handleNotebookClick = () => {
    if (!onToggleErrorNotebook) return;
    const previous = optimisticNotebook;
    setOptimisticNotebook(!previous);
    const result = onToggleErrorNotebook();
    if (result && typeof result.catch === 'function') result.catch(() => setOptimisticNotebook(previous));
  };
  const handleAnswerClick = (letter) => {
    const canChangeAnswer = revealMode === 'selected';
    const currentAnswer = persistedAnswer ?? optimisticAnswer ?? answerLockRef.current;
    if (!canChangeAnswer && currentAnswer != null) return undefined;
    answerLockRef.current = letter;
    if (showErrorNotebook && !question.isOpen && !isAnswerCorrect(question, letter)) setOptimisticNotebook(true);
    setOptimisticAnswer(letter);
    try {
      const result = onAnswer(letter);
      if (result && typeof result.catch === 'function') {
        result.catch(() => {
          if (answerLockRef.current === letter) answerLockRef.current = null;
          setOptimisticAnswer(null);
        });
      }
      return result;
    } catch(error) {
      if (answerLockRef.current === letter) answerLockRef.current = null;
      setOptimisticAnswer(null);
      throw error;
    }
  };
  const handleAnswerPointerDown = (letter, event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const canChangeAnswer = revealMode === 'selected';
    const currentAnswer = persistedAnswer ?? optimisticAnswer ?? answerLockRef.current;
    if (!canChangeAnswer && currentAnswer != null) return;
    setPressedAnswer(letter);
    try { event.currentTarget.setPointerCapture?.(event.pointerId); } catch(e) {}
    answerPointerRef.current = {
      id:event.pointerId,
      letter,
      x:event.clientX,
      y:event.clientY,
    };
  };
  const clearAnswerPointer = () => {
    answerPointerRef.current = null;
    setPressedAnswer(null);
  };
  const handleAnswerPointerUp = (letter, event) => {
    const start = answerPointerRef.current;
    answerPointerRef.current = null;
    setPressedAnswer(null);
    if (!start || start.letter !== letter || start.id !== event.pointerId) return;
    const moved = Math.hypot((event.clientX || 0) - (start.x || 0), (event.clientY || 0) - (start.y || 0));
    if (moved > 12) return;
    if (event.cancelable !== false) event.preventDefault();
    suppressNextAnswerClickRef.current = { letter, until:Date.now() + 700 };
    handleAnswerClick(letter);
  };
  const handleAnswerButtonClick = (letter) => {
    const suppressed = suppressNextAnswerClickRef.current;
    if (suppressed.letter === letter && Date.now() < suppressed.until) {
      suppressNextAnswerClickRef.current = { letter:null, until:0 };
      return;
    }
    handleAnswerClick(letter);
  };

  useEffect(() => {
    if (showResults && isAnswered && !isCorrect && !isSkipped) setLessonExplanationOpen(true);
  }, [showResults, isAnswered, isCorrect, isSkipped, question?.id]);

	  const cardClass = question.isFlashcard && flashcardLarge
	    ? `mb-0 flex-1 min-h-0 flex flex-col ${darkMode?'bg-transparent':'bg-transparent'}`
	    : `rounded-2xl border p-4 shadow-sm md:p-7 mb-6 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`;

		  return (
	    <div className={cardClass}>
	      {!flashcardLarge&&<div className="flex items-center justify-between mb-4">
	        <div className="flex items-center gap-2">
	          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${darkMode?'bg-yellow-900/30 text-yellow-300':'bg-yellow-100 text-yellow-800'}`}>{questionTypeLabel} {index + 1}</span>
	          {isSkipped && <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">Em branco</span>}
	        </div>
        <div className="flex items-center gap-2">
          {showErrorNotebook && (
            <button
              onClick={handleNotebookClick}
              title={optimisticNotebook ? 'Remover do caderno de erros' : 'Adicionar ao caderno de erros'}
              aria-label={optimisticNotebook ? 'Remover do caderno de erros' : 'Adicionar ao caderno de erros'}
              className={`${iconBtnBase} ${optimisticNotebook?(darkMode?'bg-yellow-500 border-yellow-300 text-gray-950 ring-2 ring-yellow-400/25':'bg-yellow-500 border-yellow-500 text-white ring-2 ring-yellow-200'):(darkMode?'border-gray-700 text-gray-500 hover:bg-gray-700 hover:text-yellow-400 hover:border-yellow-500/50':'border-transparent text-gray-300 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200')}`}
            >
              <FileText className="w-5 h-5"/>
            </button>
          )}
          <button
            onClick={onToggleFavorite}
            title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className={`${iconBtnBase} ${isFavorite?(darkMode?'bg-red-500 border-red-300 text-white ring-2 ring-red-400/25':'bg-red-500 border-red-500 text-white ring-2 ring-red-100'):(darkMode?'border-gray-700 text-gray-500 hover:bg-gray-700 hover:text-red-400 hover:border-red-500/50':'border-transparent text-gray-300 hover:bg-red-50 hover:text-red-400 hover:border-red-200')}`}
          >
            <Heart className="w-5 h-5" filled={isFavorite}/>
          </button>
        </div>
      </div>}
	      {!(question.isFlashcard && flashcardLarge)&&<>
          {questionText.caseContext&&(
            <section className={`mb-6 w-full rounded-xl border px-4 py-4 md:px-5 md:py-5 ${darkMode?'border-gray-700 bg-gray-900/20':'border-gray-200 bg-gray-50/50'}`}>
              <div className={`mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] ${darkMode?'text-yellow-300':'text-yellow-800'}`}>
                <BrainIcon className="h-4 w-4"/>Cenário clínico
              </div>
              <div className={`select-text text-base font-medium leading-7 md:text-[17px] ${darkMode?'text-gray-100':'text-gray-900'}`} style={{userSelect:'text'}}>
                {parseHtmlTextChat(questionText.caseContext)}
              </div>
            </section>
          )}
          <section className={questionText.caseContext ? 'mb-6' : ''}>
            {questionText.caseContext&&<div className={`mb-2 text-[10px] font-bold uppercase tracking-[0.16em] ${darkMode?'text-yellow-400':'text-yellow-700'}`}>Decisão</div>}
            <div
              className={`${question.isFlashcard ? 'text-base md:text-xl font-bold text-center leading-snug my-2 md:my-4 max-w-2xl mx-auto flex-shrink-0' : `text-base md:text-lg font-normal ${questionText.caseContext?'leading-relaxed':'mb-6 leading-relaxed'}`} select-text ${darkMode?'text-gray-200':'text-gray-800'}`}
              style={{userSelect:'text'}}
            >
              {parseHtmlTextChat(questionText.statement)}
            </div>
          </section>
        </>}

	      {/* Questão aberta/essay — inline com campo de resposta, correção e chat */}
	      {question.isFlashcard ? (
	        <FlashcardInline
	          question={question}
	          darkMode={darkMode}
	          savedAnswer={displayedAnswer && displayedAnswer !== 'SKIPPED' ? displayedAnswer : null}
	          onSave={l=>{
	            if (showErrorNotebook && l === FLASHCARD_WRONG) setOptimisticNotebook(true);
	            return onAnswer(l);
	          }}
	          large={flashcardLarge || flashcardStudyMode}
	          front={parseHtmlTextChat(questionText.statement)}
	        />
      ) : question.isOpen ? (
        <OpenAnswerInline
          question={question}
          darkMode={darkMode}
          apiKey={apiKey}
          onCall={onCall}
          oracleLength={oracleLength}
          savedAnswer={displayedAnswer && displayedAnswer !== 'SKIPPED' ? displayedAnswer : null}
          onSave={l=>{
            try {
              if (showErrorNotebook && (JSON.parse(l)?.score ?? 0) < 70) setOptimisticNotebook(true);
            } catch(e) {}
            return onAnswer(l);
          }}
          isFavorite={isFavorite}
        />
      ) : (
        <div className="space-y-3 mb-4">
        {question.options.map(opt=>{
          const isSelected = effectiveLetter===opt.letter;
          let cls = `w-full text-left flex flex-col items-stretch px-4 py-3.5 md:px-5 md:py-4 rounded-xl border transition-colors focus:outline-none ${darkMode?'border-gray-700':'border-gray-200'} `;
          if (!isAnswered && !isSkipped || revealMode==='selected') {
            if (isSelected && revealMode==='selected') cls += darkMode?'bg-blue-900/20 text-blue-100':'bg-blue-50 text-blue-900';
            else cls += darkMode?'bg-gray-900/35 text-gray-200 hover:bg-gray-900/65':'bg-gray-50/50 text-gray-800 hover:bg-yellow-50/30 hover:shadow-sm';
            if (revealMode==='selected') cls += ' cursor-pointer';
          } else if (isSkipped) {
            // Em branco: mantém o mesmo contorno neutro e sinaliza a correta só pelo fundo.
            cls += 'cursor-text ';
            if (opt.isCorrect) cls += darkMode?'bg-green-900/10 text-gray-300':'bg-green-50/50 text-gray-700';
            else cls += darkMode?'text-gray-500 opacity-50':'text-gray-400 opacity-60';
          } else {
            cls += 'cursor-text ';
            if (opt.isCorrect) cls += darkMode?'bg-green-900/20 text-green-100':'bg-green-50 text-green-900';
            else if (isSelected) cls += darkMode?'bg-red-900/20 text-red-100':'bg-red-50 text-red-900';
            else cls += 'opacity-55';
          }
	          const canClick = (!isAnswered && !isSkipped) || revealMode==='selected';
	          const isPressed = canClick && pressedAnswer === opt.letter;
	          if (isPressed) cls += darkMode
	            ? ' ring-2 ring-yellow-400/70 border-yellow-400 bg-yellow-900/30 text-yellow-100 scale-[0.99]'
	            : ' ring-2 ring-yellow-300 border-yellow-400 bg-yellow-50 text-yellow-900 scale-[0.99]';
	          // Letter badge color
	          let letterBadge = darkMode?'bg-gray-700 text-gray-300':'bg-gray-100 text-gray-600';
	          if (showResults && !isSkipped && opt.isCorrect) letterBadge = 'bg-green-500 text-white';
	          else if (showResults && !isSkipped && isSelected) letterBadge = 'bg-red-500 text-white';
	          else if (showResults && isSkipped && opt.isCorrect) letterBadge = darkMode?'bg-green-800 text-green-300':'bg-green-100 text-green-700';
	          else if (isSelected && revealMode==='selected') letterBadge = 'bg-blue-500 text-white';
	          else if (isPressed) letterBadge = 'bg-yellow-500 text-white';
	          const showOptionExplanation = !!(hasStructuredExplanations && showResults && !isSkipped && (opt.isCorrect || isSelected) && opt.explanation);
	          const optionExplanationLabel = opt.isCorrect ? 'Certa:' : 'Erro:';
	          const optionExplanationClass = opt.isCorrect
	            ? (darkMode ? 'border-green-400/20 text-green-100' : 'border-green-300/70 text-green-900')
	            : (darkMode ? 'border-red-400/20 text-red-100' : 'border-red-300/70 text-red-900');
	          const optionExplanationLabelClass = opt.isCorrect
	            ? (darkMode ? 'text-green-300' : 'text-green-700')
	            : (darkMode ? 'text-red-300' : 'text-red-700');
	          const content = (
	            <>
	              <div className="flex items-start w-full">
	                <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-bold mr-4 text-sm ${letterBadge}`}>
	                  {opt.letter}
	                </div>
	                <div className="pt-1.5 min-w-0 flex-1 leading-relaxed text-[15px] md:text-base select-text mobile-safe-text" style={{userSelect:'text'}}>{parseHtmlTextChat(opt.text)}</div>
	              </div>
	              {showOptionExplanation && (
	                <div className={`mt-3 border-t pt-3 text-sm leading-relaxed select-text md:text-base ${optionExplanationClass}`} style={{userSelect:'text'}}>
	                  <span className={`font-bold ${optionExplanationLabelClass}`}>{optionExplanationLabel}</span>{' '}
	                  <span>{parseHtmlTextChat(opt.explanation)}</span>
	                </div>
	              )}
	            </>
	          );
          return canClick ? (
            <button
              key={opt.letter}
              type="button"
              onPointerDown={event=>handleAnswerPointerDown(opt.letter, event)}
              onPointerUp={event=>handleAnswerPointerUp(opt.letter, event)}
              onPointerCancel={clearAnswerPointer}
              onPointerLeave={clearAnswerPointer}
              onClick={()=>handleAnswerButtonClick(opt.letter)}
              className={cls}
            >
              {content}
            </button>
          ) : (
            <div key={opt.letter} className={`${cls} cursor-text select-text`} style={{userSelect:'text'}}>
              {content}
            </div>
          );
        })}
      </div>
      )}
      {showResults && (
        <div className={`mt-7 space-y-3 border-t pt-5 ${darkMode?'border-gray-700':'border-gray-200'}`}>
          <div className={`overflow-hidden rounded-xl border ${darkMode?'border-gray-700 bg-gray-900/20':'border-gray-200 bg-white'}`}>
            <button
              type="button"
              onClick={()=>setLessonExplanationOpen(open=>!open)}
              aria-expanded={lessonExplanationOpen}
              className={`flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors md:px-5 ${darkMode?'text-gray-100 hover:bg-gray-800/60':'text-gray-900 hover:bg-gray-50'}`}
            >
              <span className="flex min-w-0 items-center gap-3 font-bold">
                <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${darkMode?'bg-yellow-900/30 text-yellow-400':'bg-yellow-50 text-yellow-700'}`}><BookOpen className="h-4 w-4"/></span>
                Explicação da questão
              </span>
              <ChevronDown className={`h-4 w-4 flex-shrink-0 opacity-50 transition-transform ${lessonExplanationOpen?'rotate-180':''}`}/>
            </button>
            {lessonExplanationOpen && (
              <div className={`border-t px-4 py-4 md:px-5 md:py-5 ${darkMode?'border-gray-700 text-gray-200':'border-gray-100 text-gray-800'}`}>
                <div className="select-text text-[15px] leading-relaxed md:text-base" style={{userSelect:'text'}}>{parseHtmlTextChat(hasStructuredExplanations ? (question.explanationParts?.lesson || explanation) : explanation)}</div>
                {apiKey && <ChatBox question={{...question, explanation}} darkMode={darkMode} apiKey={apiKey} oracleLength={oracleLength} onCall={onCall} selectedLetter={effectiveLetter}/>}
              </div>
            )}
          </div>

          <div className={`overflow-hidden rounded-xl border ${darkMode?'border-gray-700 bg-gray-900/20':'border-gray-200 bg-white'}`}>
            <button
              type="button"
              onClick={()=>hasStructuredExplanations && setAlternativeExplanationsOpen(open=>!open)}
              aria-expanded={alternativeExplanationsOpen}
              disabled={!hasStructuredExplanations}
              className={`flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors md:px-5 ${darkMode?'text-gray-100 hover:bg-gray-800/60':'text-gray-900 hover:bg-gray-50'} disabled:cursor-not-allowed disabled:opacity-45`}
            >
              <span className="flex min-w-0 items-center gap-3 font-bold">
                <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${darkMode?'bg-gray-800 text-gray-300':'bg-gray-100 text-gray-600'}`}><LayersIcon className="h-4 w-4"/></span>
                Análise das alternativas
              </span>
              <ChevronDown className={`h-4 w-4 flex-shrink-0 opacity-50 transition-transform ${alternativeExplanationsOpen?'rotate-180':''}`}/>
            </button>
            {alternativeExplanationsOpen && hasStructuredExplanations && (
              <div className={`space-y-5 border-t px-4 py-4 md:px-5 md:py-5 ${darkMode?'border-gray-700':'border-gray-100'}`}>
                {(question.options || []).filter(opt => opt.explanation).map(opt => (
                  <div key={`alt-exp-${opt.letter}`} className="select-text" style={{userSelect:'text'}}>
                    <div className="flex items-start gap-3 text-sm font-bold leading-relaxed md:text-base">
                      <span className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs ${opt.isCorrect ? 'bg-green-500 text-white' : effectiveLetter === opt.letter ? 'bg-red-500 text-white' : darkMode ? 'bg-gray-700 text-gray-300' : 'border border-gray-200 bg-gray-50 text-gray-600'}`}>{opt.letter}</span>
                      <span className={darkMode?'text-gray-100':'text-gray-900'}>{parseHtmlTextChat(opt.text)}</span>
                    </div>
                    <div className={`mt-2 pl-10 text-sm leading-relaxed md:text-[15px] ${opt.isCorrect ? darkMode?'text-green-200':'text-green-800' : effectiveLetter === opt.letter ? darkMode?'text-red-200':'text-red-800' : darkMode?'text-gray-300':'text-gray-600'}`}>{parseHtmlTextChat(opt.explanation)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TopicStudyPlanPanel = ({ plans = [], questions = [], answers = {}, darkMode }) => {
  if (!plans.length) return null;
  const [showObjectives, setShowObjectives] = useState(false);
  const hasCompleteAnswer = value => {
    if (!value || value === 'SKIPPED') return false;
    if (typeof value === 'string' && value.trim().startsWith('{')) {
      try { return !!JSON.parse(value)?.answer; } catch(e) { return true; }
    }
    return true;
  };
  const planned = plans.reduce((sum, plan) => sum + Math.max(1, Number(plan.questions) || 1), 0);
  const generated = questions.length;
  const answered = questions.filter(question => hasCompleteAnswer(answers?.[question.id])).length;
  return (
    <section className={`mb-5 rounded-xl border overflow-hidden ${darkMode?'border-gray-700 bg-gray-900/40':'border-gray-200 bg-white'}`}>
      <button type="button" onClick={()=>setShowObjectives(value=>!value)} className={`w-full px-4 py-3 flex items-center gap-3 text-left ${darkMode?'hover:bg-gray-800':'hover:bg-gray-50'}`}>
        <Landmark className="w-4 h-4 text-yellow-600 flex-shrink-0"/>
        <span className="text-sm font-bold min-w-0 flex-1">Plano do bloco</span>
        <span className="text-xs opacity-45 hidden sm:inline">{plans.length} objetivos · {planned} questões planejadas</span>
        <span className={`text-xs font-bold ${generated===planned?'text-green-500':generated===0?'opacity-40':'text-yellow-500'}`}>{generated}/{planned}</span>
        {generated>0&&<span className="text-xs opacity-45 hidden sm:inline">{answered} respondidas</span>}
        <ChevronDown className={`w-4 h-4 opacity-40 transition-transform ${showObjectives?'rotate-180':''}`}/>
      </button>
      {showObjectives&&<div className={`px-4 py-3 border-t space-y-2 ${darkMode?'border-gray-800':'border-gray-100'}`}>
        {plans.map((plan,index)=>(
          <div key={`${plan.title}-${index}`} className="flex items-start gap-2 text-xs">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-yellow-500"/>
            <div className="min-w-0 flex-1">
              <p><strong>{plan.title}</strong> <span className="opacity-40">· {Math.max(1, Number(plan.questions) || 1)} questão{Number(plan.questions)===1?'':'ões'}</span></p>
              <p className="opacity-45 mt-0.5 leading-relaxed">{plan.objective || `Dominar ${plan.title}`}</p>
            </div>
          </div>
        ))}
      </div>}
    </section>
  );
};

export { QuestionView, QuestionCard, OpenAnswerModal };

export default QuestionView;

