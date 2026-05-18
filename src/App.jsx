import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, getRedirectResult, setPersistence, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';
import {
  SYLLABUS_LIMITS,
  buildOracleQuestionPrompt,
  buildOracleSyllabusPrompt,
  buildOracleSyllabusRevisePrompt,
  buildExternalPrompt,
  buildVqSyllabusPrompt,
  buildVqBlockPrompt,
  buildTypeInst,
  buildAcademiaSyllabusPrompt,
  buildAcademiaLessonPrompt,
  buildAcademiaFixationPrompt,
  buildAcademiaExtraBatteryPrompt,
} from './agora_prompts.js';
import { BackToTopButton, EmptyState, LoadingState, ToastContainer } from './components/feedback.jsx';
import { readStorageJson, readStorageText, removeStorageItem, writeStorageJson, writeStorageText } from './lib/safeStorage.js';

const firebaseConfig = {
  apiKey: "AIzaSyDjdoVMrVg7dlIJLr280-thZkjrpFeChL4",
  authDomain: "agora-do-saber.firebaseapp.com",
  projectId: "agora-do-saber",
  storageBucket: "agora-do-saber.firebasestorage.app",
  messagingSenderId: "169091563204",
  appId: "1:169091563204:web:de924d4507acb1649e9391",
};
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db   = getFirestore(app);

const getGoogleProvider = () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt:'select_account' });
  return provider;
};

const authErrorMessage = (error, fallback = 'Login falhou.') => {
  const code = error?.code || 'sem-codigo';
  const message = error?.message || fallback;
  const localHint = code === 'auth/unauthorized-domain'
    ? '\n\nDica: adicione localhost e 127.0.0.1 em Firebase Console > Authentication > Settings > Authorized domains.'
    : '';
  const popupHint = ['auth/popup-blocked', 'auth/cancelled-popup-request', 'auth/popup-closed-by-user'].includes(code)
    ? '\n\nDica: se o Chrome bloqueou o popup, tente novamente; no localhost o app usa redirecionamento como fallback quando possível.'
    : '';
  return `${fallback}\n\nFirebase: ${code}\n${message}${localHint}${popupHint}`;
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
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
const ChevronRight= ic('<polyline points="9 18 15 12 9 6"/>');
const ChevronUp   = ic('<polyline points="18 15 12 9 6 15"/>');
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
const BarChart2   = ic('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>');
const CalendarCheck=ic('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/>');
const ImageIcon   = ic('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>');
const FilterIcon  = ic('<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>');
const BrainIcon   = ic('<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-3.14Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-3.14Z"/>');
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

const RepeatIcon = ic('<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>');
const AcademiaIcon = ic('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="12" y1="7" x2="16" y2="7"/><line x1="12" y1="11" x2="16" y2="11"/><line x1="9" y1="7" x2="9.01" y2="7"/><line x1="9" y1="11" x2="9.01" y2="11"/>');

const GoogleIcon  = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24" height="24" className={className}><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>;
const Spinner = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{animation:'spin 1s linear infinite',transformOrigin:'center'}}><style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
// Order of subjects following the course chronogram
const SUBJECT_ORDER = ['Nefrologia','Cirurgia','Ginecologia','Preventiva','Obstetricia','Pediatria','Reumatologia','Hematologia','Gastrologia','Hepatologia','Cardiologia','Endocrinologia','Pneumologia','Infectologia','Neurologia','Psiquiatria','Ortopedia','Dermatologia','Oftalmologia'];

const MAX_MATERIAL_CHARS = 180000;
const MATERIAL_CHUNK_CHARS = 170000;
const ADMIN_EMAIL = 'gabrielvieiraxc12@gmail.com';
const LOADING_MSGS = ["O Oráculo está consultando os pergaminhos...","Formulando os enunciados clínicos...","Elaborando as alternativas...","Revisando a semiologia...","Correlacionando fisiopatologia...","Quase pronto, aguarde...","Gerações longas levam até 60s...","O Oráculo não abandona seus discípulos..."];
const EXPLANATION_LENGTHS = [
  { k:'essential', label:'Nível 1', desc:'Resumo ultra-direto com pontos essenciais' },
  { k:'balanced', label:'Nível 2', desc:'Explicação enxuta com raciocínio e exemplos' },
  { k:'complete', label:'Nível 3', desc:'Explicação mais aprofundada e contextualizada' },
];

const buildAcademiaMaterialText = (text = '', files = [], maxChars = MAX_MATERIAL_CHARS) => {
  const sections = [];
  const intro = text.trim();
  const safeFiles = files.filter(f => (f.content || '').trim());
  if (intro) sections.push(`INSTRUÇÃO/ANOTAÇÕES DO USUÁRIO:\n${intro}`);
  safeFiles.forEach((f, i) => sections.push(`ARQUIVO ${i + 1}/${safeFiles.length}: ${f.name}\n${(f.content || '').trim()}`));
  const out = sections.join('\n\n---\n\n');
  return out.length > maxChars ? `${out.substring(0, maxChars)}\n[TRUNCADO]` : out;
};

const estimateMaterialRequestCount = (text = '', files = [], maxChunkChars = MATERIAL_CHUNK_CHARS) => {
  return buildAcademiaMaterialChunks(text, files, maxChunkChars).length;
};

const buildAcademiaMaterialChunks = (text = '', files = [], maxChunkChars = MATERIAL_CHUNK_CHARS) => {
  const items = [];
  const intro = text.trim();
  const safeFiles = files.filter(f => (f.content || '').trim());
  if (intro) items.push({ title:'INSTRUÇÃO/ANOTAÇÕES DO USUÁRIO', content:intro });
  safeFiles.forEach((f, i) => items.push({ title:`ARQUIVO ${i + 1}/${safeFiles.length}: ${f.name}`, content:(f.content || '').trim() }));
  if (!items.length) return [];

  const chunks = [];
  let current = '';
  const pushCurrent = () => {
    if (current.trim()) chunks.push(current.trim());
    current = '';
  };

  items.forEach(item => {
    const header = `\n\n---\n\n${item.title}\n`;
    const content = item.content;
    if ((header + content).length <= maxChunkChars) {
      if (current && current.length + header.length + content.length > maxChunkChars) pushCurrent();
      current += header + content;
      return;
    }

    if (current) pushCurrent();
    let offset = 0;
    let part = 1;
    const sliceSize = Math.max(10000, maxChunkChars - header.length - 80);
    while (offset < content.length) {
      const slice = content.slice(offset, offset + sliceSize);
      chunks.push(`${item.title} — parte ${part}\n${slice}`.trim());
      offset += sliceSize;
      part += 1;
    }
  });

  pushCurrent();
  return chunks;
};

const cleanSyllabusLine = (line = '') => line
  .replace(/\r/g, '')
  .replace(/`/g, '')
  .replace(/\*\*/g, '')
  .trim();

const getSyllabusTopicTitle = (line = '') => {
  const clean = cleanSyllabusLine(line);
  if (!clean || /^[-–—]{3,}$/.test(clean)) return null;

  const patterns = [
    /^\s*#{0,6}\s*(?:[-*•]\s*)?T[óo]pico\s*\d{0,3}\s*[:.)\-–—]?\s*(.+)$/i,
    /^\s*#{0,6}\s*(?:Bloco|M[oó]dulo|Unidade|Parte|Se[cç][aã]o)\s*\d{0,3}\s*[:.)\-–—]\s*(.+)$/i,
    /^\s*#{0,6}\s*(\d{1,3})\s*[.)]\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = clean.match(pattern);
    const title = (match?.[2] || match?.[1] || '').trim();
    if (title.length > 2 && !/^\[?nome\]?$/i.test(title)) return title;
  }
  return null;
};

const isExplicitSyllabusTopicLine = (line = '') => {
  const clean = cleanSyllabusLine(line);
  return /^\s*#{0,6}\s*(?:[-*•]\s*)?(?:T[óo]pico|Bloco|M[oó]dulo|Unidade|Parte|Se[cç][aã]o)\b/i.test(clean);
};

const cleanSyllabusSubtopic = (line = '') => cleanSyllabusLine(line)
  .replace(/^\s*#{1,6}\s*/, '')
  .replace(/^\s*\d{1,3}(?:\.\d{1,3})+[.)]?\s+/, '')
  .replace(/^\s*(?:[-*•]|[a-zA-Z]\)|[a-zA-Z]\.|[ivxlcdmIVXLCDM]+\)|[ivxlcdmIVXLCDM]+\.|\d{1,3}[.)])\s+/, '')
  .replace(/^Subt[óo]pico\s*\d{0,3}\s*[:.)\-–—]?\s*/i, '')
  .trim();

const parseSyllabusTopics = (syllabusText) => {
  const lines = (syllabusText || '').split('\n');
  const topics = [];
  let current = null;

  const pushCurrent = () => {
    if (current?.subtopics?.length) topics.push(current);
    current = null;
  };

  lines.forEach((rawLine) => {
    const clean = cleanSyllabusLine(rawLine);
    if (!clean || /^sum[áa]rio\b/i.test(clean)) return;

    const indent = (rawLine.match(/^\s*/)?.[0] || '').replace(/\t/g, '  ').length;
    const topicTitle = getSyllabusTopicTitle(rawLine);
    const bulletLike = /^\s*(?:[-*•]|[a-zA-Z]\)|[a-zA-Z]\.|[ivxlcdmIVXLCDM]+\)|[ivxlcdmIVXLCDM]+\.)\s+/.test(clean);
    const numbered = /^\s*\d{1,3}[.)]\s+/.test(clean);
    const explicitTopic = isExplicitSyllabusTopicLine(rawLine);

    if (topicTitle && (!current || explicitTopic || (numbered && indent === 0))) {
      pushCurrent();
      current = { title: topicTitle, subtopics: [] };
      return;
    }

    const subtopic = cleanSyllabusSubtopic(rawLine);
    if (!subtopic || subtopic.length <= 3) return;
    if (/^(subt[óo]picos?|t[óo]picos?)\s*:?\s*$/i.test(subtopic)) return;

    if (current) {
      current.subtopics.push(subtopic);
    } else if (numbered || bulletLike) {
      current = { title: 'Tópico 1', subtopics: [subtopic] };
    }
  });

  pushCurrent();

  return topics.map((topic, index) => ({
    title: /^T[óo]pico\s*\d+/i.test(topic.title) ? topic.title : `Tópico ${index + 1}: ${topic.title}`,
    subtopics: [...new Set(topic.subtopics)],
  }));
};

const formatSyllabusTopics = (topics) => topics.map((topic, index) => {
  const cleanTitle = topic.title.replace(/^T[óo]pico\s*\d+\s*[:.)-]?\s*/i, '').trim();
  return `Tópico ${index + 1}: ${cleanTitle || topic.title}\n${topic.subtopics.map(sub => `  - ${sub}`).join('\n')}`;
}).join('\n\n');

const EXPLANATION_LABELS = 'Explica[çc][aã]o|Corre[çc][aã]o|Coment[áa]rio|Justificativa|Fundamento|Racional|Racioc[íi]nio';
const QUESTION_OR_SEPARATOR_RE = /\n[ \t]*---|\n[ \t]*##|\n[ \t]*(?:(?:\*\*)?[ \t]*)?Quest[aã]o|$/i;

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

const getCorrectLetter = (question) => question?.options?.find(o => o.isCorrect)?.letter;

const isAnswerCorrect = (question, answer) => {
  if (!question || !answer || answer === 'SKIPPED') return false;
  if (question.isOpen) {
    try { return (JSON.parse(answer)?.score ?? 0) >= 70; } catch(e) { return false; }
  }
  return answer === getCorrectLetter(question);
};

const toggleInList = (list = [], id) => {
  const safe = Array.isArray(list) ? list.filter(Boolean) : [];
  return safe.includes(id) ? safe.filter(x => x !== id) : [...new Set([...safe, id])];
};

const addToList = (list = [], id) => {
  const safe = Array.isArray(list) ? list.filter(Boolean) : [];
  return safe.includes(id) ? safe : [...safe, id];
};

const getTodayKey = () => new Date().toLocaleDateString('en-CA');

const normalizeIntervals = (intervals = []) => (Array.isArray(intervals) ? intervals : [])
  .map(pair => [Math.max(0, Number(pair?.[0]) || 0), Math.max(0, Number(pair?.[1]) || 0)])
  .filter(([a, b]) => b > a)
  .sort((a, b) => a[0] - b[0]);

const mergeIntervals = (intervals = []) => {
  const sorted = normalizeIntervals(intervals);
  const merged = [];
  sorted.forEach(([start, end]) => {
    const last = merged[merged.length - 1];
    if (last && start <= last[1] + 1) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  });
  return merged;
};

const sumIntervalsSeconds = (intervals = []) =>
  mergeIntervals(intervals).reduce((acc, [start, end]) => acc + Math.max(0, end - start), 0);

const getDailyLessonSeconds = (stats = {}) =>
  Object.values(stats.lessonIntervals || {}).reduce((acc, intervals) => acc + sumIntervalsSeconds(intervals), 0);

const cleanTopicTitle = (title = '') => title.replace(/^T[óo]pico\s*\d+\s*[:.)-]?\s*/i, '').trim();
const isFolderItem = (item) => item?.itemType === 'folder';
const isAcademiaMirrorRootFolder = (item) =>
  item?.itemType === 'folder' && item.source === 'gemini' && item.mirrorRoot === 'academia';
const isErrorNotebookRootFolder = (item) =>
  item?.itemType === 'folder' && item.source === 'gemini' && item.mirrorRoot === 'errorNotebook';
const isProtectedMirrorRootFolder = (item) =>
  isAcademiaMirrorRootFolder(item) || isErrorNotebookRootFolder(item);
const hasAcademiaOriginTopic = (item) =>
  !isFolderItem(item) && (item.topics || []).some(t => t.origin?.source === 'academia');

const buildErrorNotebookReviewPrompt = ({ subjectTitle='', topicTitle='', questions=[], settings={} }) => {
  const total = Math.max(1, questions.length * 2);
  const type = (settings.questionTypes || ['direct'])[0] || 'direct';
  const typeInst = buildTypeInst([type]);
  const styleInst = {
    clinical: 'Use enunciados clínicos quando isso ajudar a testar aplicação, com idade/sexo/contexto e achados relevantes.',
    direct: 'Use questões diretas, objetivas, sobre definição, mecanismo, classificação, diagnóstico, conduta ou complicação.',
    mixed: 'Misture questões diretas para conceito central e questões clínicas para aplicação/pegadinhas.',
  }[settings.questionStyle || 'mixed'];
  const na = settings.numAlternatives || 5;
  const alts = na === 4
    ? 'A) [alternativa]\nB) [alternativa]\nC) [alternativa]\nD) [alternativa]'
    : 'A) [alternativa]\nB) [alternativa]\nC) [alternativa]\nD) [alternativa]\nE) [alternativa]';
  const openMode = ['open', 'essay'].includes(type);
  const sourceQuestions = questions.map((q, i) => {
    const correct = (q.options || []).find(o => o.isCorrect)?.text || q.expectedAnswer || '';
    const options = (q.options || []).map(o => `${o.letter}) ${o.text}`).join('\n');
    return `QUESTÃO ERRADA ${i + 1}
Enunciado: ${String(q.statement || '').replace(/\s+/g, ' ').trim()}
${options ? `Alternativas originais:\n${options}` : ''}
Resposta correta/esperada: ${correct}
Explicação original: ${String(q.explanation || '').replace(/\s+/g, ' ').trim()}`;
  }).join('\n\n---\n\n');

  return `Você é um examinador de residência médica criando uma revisão ativa de caderno de erros.

Contexto do bloco original:
- Assunto: ${subjectTitle || 'Não informado'}
- Bloco/tópico: ${topicTitle || 'Não informado'}

Objetivo:
Gerar EXATAMENTE ${total} questões novas, sendo 2 questões para cada questão errada listada abaixo.
Para cada questão errada:
1. A primeira questão deve cobrar o conceito central que provavelmente causou o erro.
2. A segunda questão deve cobrar uma variação, pegadinha, aplicação clínica ou diferenciação próxima.

REGRAS CRÍTICAS:
- Não copie o enunciado, alternativas ou explicação da questão original.
- Não crie questões genéricas: cada questão deve nascer do erro específico listado.
- Não mencione "caderno de erros", "questão original", "aluno" ou "revisão" no enunciado.
- Mantenha alto rendimento: foco no que mais cai e no que diferencia alternativas parecidas.
- Se houver lacuna de contexto, use apenas inferências seguras a partir da questão errada.

ESTILO: ${styleInst}
${typeInst ? `${typeInst}\n` : ''}
${openMode ? `FORMATO OBRIGATÓRIO:
## Questão N
[Enunciado]
Resposta esperada: [resposta]
Explicação: [correção didática curta]
---` : `FORMATO OBRIGATÓRIO:
## Questão N
[Enunciado]
${alts}
Gabarito: A
Explicação: [por que a correta está certa e por que os distratores estão errados]`}

QUESTÕES ERRADAS DO CADERNO:
${sourceQuestions}

Gere TODAS as ${total} questões sem interromper.`;
};

const isLikelySyllabusGroupTitle = (subtopic = '') => {
  const clean = cleanSyllabusSubtopic(subtopic);
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 7) return false;
  if (/[.;:]/.test(clean) || /\([^)]{12,}\)/.test(clean)) return false;
  if (/^(defini[çc][aã]o|etiologia|epidemiologia|fatores? de risco|cl[íi]nica|sintomas?|diagn[óo]stico|tratamento|complica[çc][õo]es|patogenia|fisiopatologia|morfologia|caracter[íi]sticas|tipos?|causas?|papel|risco|rela[çc][aã]o)\b/i.test(clean)) return false;
  if (/^(doen[çc]as?|c[aâ]ncer|carcinoma|tumores?|neoplasias?|s[íi]ndrome|anatomia|fisiologia|inflama[çc][aã]o|infec[çc][õo]es?|anomalias?|obstru[çc][aã]o|m[áa] absor[çc][aã]o|p[oó]lipos?|apendicite|ureter|bexiga|pr[óo]stata|uretra|p[eê]nis|test[íi]culos|intestino|c[óo]lon|retocolite|diverticulite|salpingite|salmonelose|tuberculose|ameb[íi]ase)\b/i.test(clean)) return true;
  return words.length <= 4 && words.every(w => /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9]/.test(w) || /^(de|da|do|das|dos|e|em|por|para|com|sem)$/i.test(w));
};

const splitOversizedSyllabusTopics = (topics, maxSubtopics = 20, splitThreshold = 30) => {
  const hardMax = Math.max(31, splitThreshold);
  const out = [];

  topics.forEach(topic => {
    const subs = [...new Set(topic.subtopics || [])].filter(Boolean);
    const baseTitle = cleanTopicTitle(topic.title);
    if (subs.length <= splitThreshold) {
      out.push({ title: baseTitle || topic.title, subtopics: subs });
      return;
    }

    const segments = [];
    let current = { title: baseTitle || topic.title, subtopics: [] };
    const pushCurrent = () => {
      if (current.subtopics.length) segments.push(current);
    };

    subs.forEach((sub) => {
      const shouldPromote = current.subtopics.length >= 6 && isLikelySyllabusGroupTitle(sub);
      const shouldChunk = current.subtopics.length >= hardMax;
      if ((shouldPromote || shouldChunk) && current.subtopics.length) {
        pushCurrent();
        current = {
          title: shouldPromote ? cleanSyllabusSubtopic(sub) : `${baseTitle || topic.title} (continuação)`,
          subtopics: shouldPromote ? [] : [sub],
        };
        return;
      }
      current.subtopics.push(sub);
    });
    pushCurrent();

    segments.forEach(segment => {
      if (segment.subtopics.length <= splitThreshold) {
        out.push(segment);
        return;
      }
      for (let i = 0; i < segment.subtopics.length; i += maxSubtopics) {
        out.push({
          title: `${cleanTopicTitle(segment.title) || baseTitle} ${i === 0 ? '' : `(parte ${Math.floor(i / maxSubtopics) + 1})`}`.trim(),
          subtopics: segment.subtopics.slice(i, i + maxSubtopics),
        });
      }
    });
  });

  return out;
};

const normalizeSyllabusByLimits = (syllabusText, source = 'oracle', settings = {}) => {
  const topics = parseSyllabusTopics(syllabusText);
  if (!topics.length) return syllabusText;
  const limits = source === 'academia' ? SYLLABUS_LIMITS.academia : SYLLABUS_LIMITS.oracle;
  const manual = !settings.autoMode;
  const configuredMax = manual && Number(settings.numSubtopics)
    ? Number(settings.numSubtopics)
    : limits.targetMaxSubtopicsPerTopic;
  const maxSubtopics = manual
    ? Math.max(3, Math.min(30, configuredMax || limits.targetMaxSubtopicsPerTopic))
    : Math.max(8, Math.min(20, configuredMax || limits.targetMaxSubtopicsPerTopic));
  return formatSyllabusTopics(splitOversizedSyllabusTopics(topics, maxSubtopics, 30));
};

const normalizeOracleSyllabus = (syllabusText, settings = {}) =>
  normalizeSyllabusByLimits(syllabusText, 'oracle', settings);

const normalizeAcademiaSyllabus = (syllabusText, settings = {}) =>
  normalizeSyllabusByLimits(syllabusText, 'academia', settings);

const buildChunkedSyllabusMessage = ({ chunk, index, total, accumulated, subjectTitle, settings = {}, source = 'oracle' }) => {
  const limits = source === 'academia' ? SYLLABUS_LIMITS.academia : SYLLABUS_LIMITS.oracle;
  const manual = !settings.autoMode;
  const shapeRule = manual
    ? `MOLDE FINAL OBRIGATÓRIO: ${settings.numTopics || limits.targetMaxTopics} tópicos, com no máximo ${settings.numSubtopics || limits.targetMaxSubtopicsPerTopic} subtópicos por tópico. Se o material for maior, priorize cobertura fiel e divida em tópicos menores quando necessário.`
    : `MOLDE FINAL: tópicos podem ter até cerca de ${limits.targetMaxSubtopicsPerTopic} subtópicos quando o bloco for grande. Só divida obrigatoriamente se um tópico passaria de 30 subtópicos.`;
  const antiHugeTopicRule = `REGRA CRÍTICA: NÃO crie um tópico gigante como "Urologia" ou "Intestino" com 40, 60 ou 80 subtópicos. Tópico é bloco didático; subtópico é item testável.`;

  if (total <= 1) {
    return `ASSUNTO: ${subjectTitle}

${shapeRule}
${antiHugeTopicRule}

MATERIAL BASE:
${chunk}`;
  }

  if (index === 0) {
    return `ASSUNTO: ${subjectTitle}
MATERIAL BASE — PARTE 1/${total}:
${chunk}

Crie um sumário parcial fiel apenas desta parte.
${shapeRule}
${antiHugeTopicRule}`;
  }

  return `ASSUNTO: ${subjectTitle}

SUMÁRIO ACUMULADO ATÉ AGORA:
${accumulated}

MATERIAL BASE — PARTE ${index + 1}/${total}:
${chunk}

Atualize o sumário acumulado incorporando esta nova parte.
Responda com o SUMÁRIO CONSOLIDADO COMPLETO.
${shapeRule}
${antiHugeTopicRule}
Ao consolidar, reorganize os blocos: se algum tópico ficar grande demais, quebre-o em tópicos menores e preserve subtópicos relevantes.`;
};

const parseAcademiaLessonSections = (lessonText, subtopics) => {
  const lessonSections = {};
  if (!lessonText) return lessonSections;

  const sectionRegex = /^##\s+(.+)$/gm;
  const positions = [];
  let match;
  while ((match = sectionRegex.exec(lessonText)) !== null) {
    const rawTitle = match[1].replace(/\*+/g, '').trim();
    if (rawTitle.length >= 3) positions.push({ title: rawTitle, index: match.index, end: match.index + match[0].length });
  }

  if (positions.length >= subtopics.length) {
    positions.slice(0, subtopics.length).forEach((pos, i) => {
      const start = pos.end;
      const end = positions[i + 1]?.index ?? lessonText.length;
      lessonSections[i] = { title: pos.title, content: lessonText.slice(start, end).trim() };
    });
    return lessonSections;
  }

  if (positions.length > 0 && positions.length < subtopics.length) {
    positions.forEach((pos, pi) => {
      const start = pos.end;
      const end = positions[pi + 1]?.index ?? lessonText.length;
      const sectionContent = lessonText.slice(start, end).trim();
      const subStart = Math.round(pi * subtopics.length / positions.length);
      const subEnd = Math.round((pi + 1) * subtopics.length / positions.length);
      for (let si = subStart; si < subEnd; si++) {
        lessonSections[si] = { title: si === subStart ? pos.title : subtopics[si], content: sectionContent };
      }
    });
    return lessonSections;
  }

  const paras = lessonText.split(/\n\n+/).filter(p => p.trim().length > 10);
  subtopics.forEach((sub, i) => {
    const from = Math.floor(i * paras.length / subtopics.length);
    const to = Math.max(from + 1, Math.floor((i + 1) * paras.length / subtopics.length));
    lessonSections[i] = { title: sub, content: paras.slice(from, to).join('\n\n') };
  });
  return lessonSections;
};

const countAcademiaTeachingUnits = (text = '') => {
  const lines = String(text).split('\n').map(l => l.trim()).filter(Boolean);
  const labeledLines = lines.filter(line =>
    /^[-*•]?\s*(defini[çc][aã]o|diagn[óo]stico|achados?|causas?|classifica[çc][aã]o|complica[çc][õo]es|cl[íi]nica|fisiopatologia|mecanismo|morfologia|epidemiologia|localiza[çc][aã]o|risco|tratamento|avalia[çc][aã]o|exames?)\b\s*:/i.test(line)
  ).length;
  const colonBlocks = (String(text).match(/(?:^|\n)\s*[^:\n]{3,70}:/g) || []).length;
  return Math.max(labeledLines, colonBlocks);
};

const buildAcademiaFixationPlan = (subtopics, lessonSections = {}) => subtopics.map((subtopic, i) => {
  const content = lessonSections[i]?.content || '';
  const len = content.length;
  const teachingUnits = countAcademiaTeachingUnits(`${subtopic}\n${content}`);
  if (len > 2600 || teachingUnits >= 6) return 4;
  if (len > 1300 || teachingUnits >= 3) return 3;
  return 2;
});

const distributeAcademiaFixQuestions = (questions, plan) => {
  const bySubtopic = Object.fromEntries(plan.map((_, i) => [i, []]));
  const leftovers = [];

  questions.forEach(q => {
    const m = String(q.id || '').match(/_(\d+)\.(\d+)$/);
    const idx = m ? parseInt(m[1], 10) - 1 : -1;
    if (idx >= 0 && idx < plan.length) bySubtopic[idx].push(q);
    else leftovers.push(q);
  });

  let cursor = 0;
  leftovers.forEach(q => {
    while ((bySubtopic[cursor]?.length || 0) >= (plan[cursor] || 1) && cursor < plan.length - 1) cursor++;
    bySubtopic[cursor] = [...(bySubtopic[cursor] || []), q];
  });

  return bySubtopic;
};
// Extract unique ID from Bunny embed_url
const getAulaId = (aula) => {
  if (!aula) return null;
  const m = (aula.embed_url||'').match(/\/embed\/\d+\/([a-f0-9\-]{30,})/i);
  return m ? m[1] : (aula.embed_url || aula.path || '');
};

// Clean raw filenames like "VIDEOAULA_S19_medcurso_GAS1_Acalasia" → "Acalasia"
const cleanAulaTitle = (title) => {
  if (!title) return '';
  // Strip all-caps prefix codes + underscores: "VIDEOAULA_S19_medcurso_GAS1_" → ""
  let t = title
    .replace(/^(?:VIDEOAULA|AULA[_ ]B[ÔO]NUS|AULABONUS)[_\s]+S?\d+_?(?:medcurso_)?[A-Z0-9]+_?(?:BLOCO\d+_?)?/i, '')
    .replace(/^S\d+_AULABONUS_[A-Z0-9]+_(?:BLOCO\d+_)?/i, '')
    .replace(/_NOVO$|_SLIDE$/i, '')
    .replace(/_/g, ' ')
    .trim();
  // Also strip trailing _NOVO etc that survived
  t = t.replace(/\s*_?NOVO\s*$/i,'').replace(/\s*_?SLIDE\s*$/i,'').trim();
  return t || title;
};


// Cronogram subtopic order — partial key match → sort index
const SUBTOPIC_ORDER_MAP = {
  // Nefrologia
  'NEFRO 1':1,'NEFRO 2':2,'NEFRO 3':3,
  // Cirurgia
  'CIR 1':1,'CIR 2':2,'CIR 3':3,'CIR 4':4,
  // Ginecologia
  'GIN 1':1,'GIN 2':2,'GIN 3':3,'GIN 4':4,'GIN 5':5,'GIN 6':6,
  // Preventiva
  'PREV 1':1,'PREV 2':2,'PREV 3':3,'PREV 4':4,
  // Obstetrícia
  'OBS 1':1,'OBS 2':2,'OBS 3':3,'OBS 4':4,'OBS 5':5,
  'Obstetricia BONUS':6,'BONUS':6,
  // Pediatria
  'PED 1':1,'PED 2':2,'PED 3':3,'PED 4':4,'PED 5':5,
  // Reumatologia
  'REU 1':1,'REU 2':2,
  // Hematologia
  'HEM 1':1,'HEM 2':2,
  // Gastrologia
  'GAS 1':1,'GAS 2':2,'GAS 3':3,
  // Hepatologia
  'HEP 1':1,'HEP 2':2,
  // Cardiologia
  'CAR 1':1,'CAR 2':2,'CAR 3':3,
  // Endocrinologia
  'ENDO 1':1,'ENDO 2':2,
  // Pneumologia
  'PNEUMO 1':1,'PNEUMO 2':2,
  // Infectologia
  'INFECTO 1':1,'INFECTO 2':2,'INFECTO 3':3,
  // Neurologia (single subtopic)
  'NEURO':1,
  // Others (single subtopic)
  'PSIQUIATRIA':1,'ORTOPEDIA':1,
  // Derma
  'DOENÇAS INFECTO':1,
  // Oftalmo
  'video aula':1,
};

const getSubtopicOrder = (key) => {
  const upper = key.toUpperCase();
  for (const [pattern, idx] of Object.entries(SUBTOPIC_ORDER_MAP)) {
    if (upper.includes(pattern.toUpperCase())) return idx;
  }
  // fallback: extract first number
  const m = key.match(/\d+/);
  return m ? parseInt(m[0]) : 99;
};

const FOCUS_AREAS = [
  { id:'bases',          label:'🔬 Bases',          desc:'Anatomia, Fisiologia, Histologia, Bioquímica',         inst:'Priorize questões de anatomia, fisiologia, histologia e bioquímica fundamentais ao tema.' },
  { id:'fisiopatologia', label:'⚙️ Fisiopatologia',  desc:'Mecanismos de doença, alterações fisiopatológicas',    inst:'Priorize questões sobre mecanismos de doença, fisiopatologia e alterações moleculares/celulares.' },
  { id:'clinica',        label:'🩺 Clínica',         desc:'Semiologia, manobras, apresentações clínicas',         inst:'Priorize questões de semiologia, exame físico, manobras, apresentações clínicas e diagnóstico diferencial.' },
  { id:'farmacologia',   label:'💊 Farmacologia',    desc:'Fármacos, mecanismos, doses, efeitos adversos',        inst:'Priorize questões de farmacologia: mecanismos de ação, indicações, efeitos adversos e interações.' },
];
const ORACLE_LENGTH = {
  short:  { label:'⚡ Curta',   inst:'Responda em no máximo 2 frases muito diretas e objetivas.' },
  medium: { label:'📝 Média',   inst:'Responda em 1 parágrafo objetivo e bem estruturado.' },
  long:   { label:'📚 Detalhada', inst:'Responda de forma completa e didática, com exemplos clínicos quando relevante.' },
};

// ─── API ──────────────────────────────────────────────────────────────────────
const callGemini = async (prompt, systemPrompt, apiKey, images=[], opts={}) => {
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const parts = [{text:prompt}];
  images.forEach(img => parts.push({inline_data:{mime_type:img.mimeType,data:img.base64}}));
  const payload = {
    contents:[{parts}],
    systemInstruction:{parts:[{text:systemPrompt}]},
    generationConfig: {
      thinkingConfig: { thinkingBudget: opts.thinking ?? 0 },
      ...(opts.maxTokens ? {maxOutputTokens: opts.maxTokens} : {}),
    },
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);
  try {
    const res = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
    clearTimeout(timeout);
    if (res.status===503) throw new Error("SERVER_OVERLOADED");  // sem retry — 1 req por chamada
    if (res.status===429) throw new Error("QUOTA_EXCEEDED");
    if ([400,403,404].includes(res.status)) throw new Error("API_KEY_INVALID");
    if (!res.ok) throw new Error("CONNECTION_ERROR");
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('');
    if (!text) throw new Error("CONNECTION_ERROR");
    return text;
  } catch(e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') throw new Error("CONNECTION_ERROR");
    throw e;
  }
};

const callGeminiStream = async (prompt, systemPrompt, apiKey, onProgress, images=[]) => {
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`;
  const parts = [{text:prompt}];
  images.forEach(img => parts.push({inline_data:{mime_type:img.mimeType,data:img.base64}}));
  const payload = {
    contents:[{parts}],
    systemInstruction:{parts:[{text:systemPrompt}]},
    generationConfig:{ thinkingConfig:{ thinkingBudget:0 } },
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 2min timeout para streaming
  try {
    const res = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
    if (res.status===429) throw new Error("QUOTA_EXCEEDED");
    if (res.status===503) throw new Error("SERVER_OVERLOADED");
    if ([400,403,404].includes(res.status)) throw new Error("API_KEY_INVALID");
    if (!res.ok) throw new Error("CONNECTION_ERROR");
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let full = '';
    let pending = '';
    const consumeLine = (line) => {
      if (!line.startsWith('data: ') || line.includes('[DONE]')) return;
      try {
        const j = JSON.parse(line.slice(6));
        const t = j.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
        if (t) {
          full += t;
          onProgress?.(full, (full.match(/##\s*Quest[aã]o\s*\[?\d/gi) || []).length);
        }
      } catch(e) {}
    };
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      pending += dec.decode(value,{stream:true});
      const lines = pending.split('\n');
      pending = lines.pop() || '';
      lines.forEach(consumeLine);
    }
    if (pending.trim()) consumeLine(pending.trim());
    clearTimeout(timeout);
    return full;
  } catch(e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') throw new Error("CONNECTION_ERROR");
    throw e;
  }
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
const loadScript = (src, gv) => new Promise((res,rej)=>{ if(window[gv]) return res(window[gv]); const s=document.createElement('script'); s.src=src; s.onload=()=>res(window[gv]); s.onerror=()=>rej(new Error(`Failed: ${src}`)); document.head.appendChild(s); });
const extractPdfText = async (ab) => { const lib = await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js','pdfjsLib'); lib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; const pdf=await lib.getDocument({data:ab}).promise; let t=''; for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const c=await pg.getTextContent();t+=c.items.map(x=>x.str).join(' ')+'\n';} return t; };
const extractDocxText = async (ab) => { const m = await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js','mammoth'); const r=await m.extractRawText({arrayBuffer:ab}); return r.value; };

const makeGeminiKeyId = () => `gemini_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const uniqueGeminiValues = (items = []) => {
  const seen = new Set();
  return items
    .map(v => String(v || '').trim())
    .filter(v => {
      if (!v || seen.has(v)) return false;
      seen.add(v);
      return true;
    });
};
const normalizeGeminiKeys = (settings = {}) => {
  const fromArray = Array.isArray(settings.geminiKeys) ? settings.geminiKeys : [];
  const legacyKeys = uniqueGeminiValues([
    settings.apiKey1 || settings.apiKey || '',
    settings.apiKey2 || '',
    settings.apiKey3 || '',
    ...(Array.isArray(settings.geminiKeysBackup) ? settings.geminiKeysBackup.map(k => k?.value || k?.key || k) : []),
  ]);
  const fromArrayHasValues = fromArray.some(item => {
    const obj = typeof item === 'string' ? { value:item } : (item || {});
    return String(obj.value || obj.key || '').trim();
  });

  let keys = (!fromArrayHasValues && legacyKeys.length ? [] : fromArray).map((item, i) => {
    const obj = typeof item === 'string' ? { value:item } : (item || {});
    return {
      id: obj.id || `gemini_${i + 1}`,
      name: obj.name || `Chave ${i + 1}`,
      value: obj.value || obj.key || '',
    };
  });

  if (!keys.length && legacyKeys.length) {
    keys = legacyKeys.map((value, i) => ({ id:`gemini_${i + 1}`, name:`Chave ${i + 1}`, value }));
  }

  if (!keys.length) {
    keys = [
      { id:'gemini_1', name:'Chave 1', value:settings.apiKey1 || settings.apiKey || '' },
      { id:'gemini_2', name:'Chave 2', value:settings.apiKey2 || '' },
      { id:'gemini_3', name:'Chave 3', value:settings.apiKey3 || '' },
    ];
  }

  keys = keys
    .map((k, i) => ({ id:k.id || `gemini_${i + 1}`, name:k.name || `Chave ${i + 1}`, value:k.value || '' }))
    .filter(k => k.value.trim());

  return keys.length ? keys : [{ id:'gemini_1', name:'Chave 1', value:'' }];
};
const readLocalGeminiKeyBackup = (name = '') => {
  if (!name) return [];
  const candidates = [
    `qb_settings_${name}`,
    `qb_settings_${name.toLowerCase()}`,
    `qb_settings_${name.toUpperCase()}`,
  ];
  for (const key of candidates) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const keys = getConfiguredGeminiKeys(parsed).map(k => k.value);
      if (keys.length) return keys.map((value, i) => ({ id:`gemini_backup_${i + 1}`, name:`Chave ${i + 1}`, value }));
    } catch(e) {}
  }
  return [];
};
const buildSettingsWithGeminiRecovery = (rawSettings = {}, topLevelApiKey = '', usernameForBackup = '') => {
  const localBackup = readLocalGeminiKeyBackup(usernameForBackup);
  const topLevelKeys = topLevelApiKey ? [{ id:'gemini_doc_api_key', name:'Chave 1', value:topLevelApiKey }] : [];
  return withGeminiKeys({ ...defaultSettings, ...rawSettings, apiKey:rawSettings.apiKey || topLevelApiKey }, [
    ...normalizeGeminiKeys({ ...rawSettings, apiKey:rawSettings.apiKey || topLevelApiKey }),
    ...topLevelKeys,
    ...localBackup,
  ]);
};
const getActiveGeminiKeyId = (settings = {}, keys = normalizeGeminiKeys(settings)) => {
  if (settings.activeKeyId && keys.some(k => k.id === settings.activeKeyId)) return settings.activeKeyId;
  const idx = Math.max(0, Number(settings.activeKeyIndex || 1) - 1);
  return keys[idx]?.id || keys.find(k => k.value.trim())?.id || keys[0]?.id;
};
const withGeminiKeys = (settings = {}, keys = normalizeGeminiKeys(settings), requestedActiveId = null) => {
  const seenValues = new Set();
  const cleaned = keys
    .map((k, i) => ({
      id: k.id && k.id !== 'new' ? k.id : makeGeminiKeyId(),
      name: k.name || `Chave ${i + 1}`,
      value: k.value || '',
    }))
    .filter(k => {
      const value = k.value.trim();
      if (!value || seenValues.has(value)) return false;
      seenValues.add(value);
      return true;
    });
  const finalKeys = cleaned.length ? cleaned : [{ id:'gemini_1', name:'Chave 1', value:'' }];
  const currentActive = requestedActiveId || getActiveGeminiKeyId(settings, finalKeys);
  const activeHasValue = finalKeys.some(k => k.id === currentActive && k.value.trim());
  const activeKeyId = activeHasValue ? currentActive : (finalKeys.find(k => k.value.trim())?.id || finalKeys[0].id);
  const activeKeyIndex = Math.max(1, finalKeys.findIndex(k => k.id === activeKeyId) + 1);
  return {
    ...settings,
    geminiKeys: finalKeys,
    activeKeyId,
    activeKeyIndex,
    apiKey: finalKeys[0]?.value || '',
    apiKey1: finalKeys[0]?.value || '',
    apiKey2: finalKeys[1]?.value || '',
    apiKey3: finalKeys[2]?.value || '',
  };
};
const getConfiguredGeminiKeys = (settings = {}) =>
  normalizeGeminiKeys(settings).filter(k => k.value.trim()).map((k, i) => ({ ...k, n:i + 1, k:k.value.trim() }));
const getGeminiKeyRows = (settings = {}) => {
  const rows = normalizeGeminiKeys(settings);
  const last = rows[rows.length - 1];
  return last?.value.trim() ? [...rows, { id:'new', name:'', value:'', isNew:true }] : rows;
};

const escapeXml = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const htmlishToText = (s = '') => String(s)
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/p>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/\*\*/g, '')
  .trim();
const sanitizeFileName = (name = 'export') =>
  (name || 'export').substring(0, 70).replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim() || 'export';
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

const parseData = (text, namespace = '') => {
  const norm = text.replace(/\r\n/g,'\n');
  const questionStartRe = /(?=(?:^|\n)[ \t]*(?:(?:\*\*|##)[ \t]*)?Quest[aã]o(?:[ \t]*(?:n[ºo]\.?)?)?[ \t]*[:#\-–—]?[ \t]*\[?\d|(?:^|\n)[ \t]*\d{1,3}[ \t]*[).][ \t])/im;

  // Legacy summary
  let summary = '';
  const sm = norm.match(/(?:^|\n)(?:###|##|\*\*)?\s*Resumo(?: de Consolida[çc][aã]o)?\s*\n([\s\S]*)$/i);
  if (sm?.[1]) summary = sm[1].replace(/\n---.*/g,'').trim();

  const questions = [];
  const blocks = norm.split(questionStartRe)
    .filter(b => b.trim());

  let qCount = 0;

  blocks.forEach((block) => {
    if (!block.trim()) return;
    const hasOptions = /(?:^|\n)[ \t]*[A-Ea-e][ \t]*[).:\-–—][ \t]*\S/.test(block);
    if (!hasOptions) return;

    try {
      const idM = block.match(/(?:\*\*|##)?[ \t]*Quest[aã]o(?:[ \t]*(?:n[ºo]\.?)?)?[ \t]*[:#\-–—]?[ \t]*\[?(\d+(?:\.\d+)*)\]?/i) ||
                  block.match(/(?:^|\n)[ \t]*(\d{1,3})[ \t]*[).]/m);
      const rawId = idM ? idM[1] : `${++qCount}`;
      // ID único: combina namespace (topicId/blockId) com o id da questão
      const id = namespace ? `${namespace}_${rawId}` : rawId;

      const firstOptMatch = block.match(/(?:^|\n)([ \t]*[A-Ea-e][ \t]*[).:\-–—][ \t]*\S)/);
      if (!firstOptMatch) return;
      const firstOptIdx = block.indexOf(firstOptMatch[0]);

      const inlineM = block.match(/(?:^|\n)[ \t]*\d{1,3}[ \t]*[).][ \t]*([^\n]{5,})/m);
      const qHeaderM = block.match(/(?:\*\*|##)?[ \t]*Quest[aã]o[^\n]*\n/i);
      let stmt = '';
      if (inlineM && inlineM.index <= firstOptIdx) {
        stmt = inlineM[1].trim();
        const contStart = block.indexOf(inlineM[0]) + inlineM[0].length;
        if (contStart < firstOptIdx) stmt += ' ' + block.substring(contStart, firstOptIdx).trim();
      } else if (qHeaderM) {
        stmt = block.substring(qHeaderM.index + qHeaderM[0].length, firstOptIdx).trim();
      } else {
        stmt = block.substring(0, firstOptIdx).trim();
      }
      stmt = stmt.trim();
      if (!stmt || stmt.length < 5) return;

      const ansM =
        block.match(/(?:[Aa]lternativa[ \t]+correta|[Gg]abarito(?:[ \t]+oficial)?|[Rr]esposta(?:[ \t]+correta)?|[Cc]orreta)[ \t]*[:\-–—][ \t]*(?:\*{0,2}[ \t]*)?(?:letra[ \t]*)?\(?([A-Ea-e])\)?/im);

      let correct = null;
      let optionsEnd = block.length;

      if (ansM) {
        correct = ansM[1].toUpperCase();
        optionsEnd = ansM.index;
      } else {
        const stM = block.match(/\n[ \t]*\(?([A-Ea-e])\)?[ \t]*(?:\n|$)/m);
        if (stM && stM.index > firstOptIdx + 10) {
          correct = stM[1].toUpperCase();
          optionsEnd = stM.index;
        }
      }

      const optText = block.substring(firstOptIdx, optionsEnd);
      const options = [];
      const optRe = /(?:^|\n)[ \t]*\(?([A-Ea-e])[ \t]*[).:\-–—][ \t]*([\s\S]*?)(?=(?:\n[ \t]*\(?[A-Ea-e][ \t]*[).:\-–—])|\n[ \t]*$|$)/gim;
      let m;
      while ((m = optRe.exec(optText)) !== null) {
        const letter = m[1].toUpperCase();
        const txt = m[2].replace(/\*\*/g,'').replace(/\n/g,' ').trim();
        if (txt) options.push({ letter, txt });
      }
      if (options.length < 2) return;

      let exp = '';
      const labeledExp = extractLabeledSection(block);
      if (labeledExp.length > 5) {
        exp = labeledExp;
      } else if (ansM) {
        const after = block.substring(ansM.index + ansM[0].length).replace(/^\s*\n/,'').trim();
        if (after.length > 5) exp = after;
      }
      exp = cleanQuestionExplanation(exp);

      if (correct) {
        const ctTxt = options.find(o => o.letter === correct)?.txt;
        if (!ctTxt) return;
        // Seed usa o id completo (com namespace) para garantir embaralhamento consistente
        const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        const seededShuffle = (arr) => {
          const a = [...arr]; let s = seed;
          for (let i = a.length - 1; i > 0; i--) {
            s = (s * 1664525 + 1013904223) & 0xffffffff;
            const j = Math.abs(s) % (i + 1);
            [a[i], a[j]] = [a[j], a[i]];
          }
          return a;
        };
        // Shuffle distratores only, then insert correct at seed-determined position
        const distractors = options.filter(o => o.txt !== ctTxt).map(o => o.txt);
        const shuffledDistractors = seededShuffle(distractors);
        // Position of correct answer: spread across all positions using seed
        const nOpts = options.length;
        const correctPos = Math.abs(seed * 2654435761) % nOpts; // well-distributed hash
        const withCorrect = [...shuffledDistractors];
        withCorrect.splice(correctPos, 0, ctTxt);
        const final = withCorrect.slice(0, nOpts).map((t, i) => ({ letter: 'ABCDE'[i], text: t, isCorrect: t === ctTxt }));
        questions.push({ id, statement: stmt, options: final, explanation: exp });
      } else {
        const final = options.map((o, i) => ({ letter: 'ABCDE'[i], text: o.txt, isCorrect: false }));
        questions.push({ id, statement: stmt, options: final, explanation: '(Gabarito não fornecido — adicione "Gabarito: X" ao texto para marcar a resposta correta.)' });
      }
    } catch(e) {}
  });

  return { questions, summary };
};

// Parser específico para questões abertas (sem alternativas A/B/C/D)
const parseOpenQuestions = (text, namespace='', isEssay=false) => {
  const norm = text.replace(/\r\n/g,'\n');
  const questions = [];
  let qCount = 0;

  // Dividir por ## Questão N, ## Questão [1.2.1], N) ou N.
  const blocks = norm.split(/(?=(?:^|\n)[ \t]*(?:(?:\*\*|##)[ \t]*)?Quest[aã]o(?:[ \t]*(?:n[ºo]\.?)?)?[ \t]*[:#\-–—]?[ \t]*\[?\d|(?:^|\n)[ \t]*\d{1,3}[ \t]*[).][ \t])/im).filter(b=>b.trim());

  blocks.forEach(block => {
    if (!block.trim()) return;
    try {
      const respMatch = block.match(/Resposta esperada:\s*([\s\S]*?)(?:\nExplica[çc][aã]o:|\nAlternativa correta:|\n---|$)/i);
      if (!respMatch) return;
      const idM = block.match(/(?:\*\*|##)?[ \t]*Quest[aã]o(?:[ \t]*(?:n[ºo]\.?)?)?[ \t]*[:#\-–—]?[ \t]*\[?(\d+(?:\.\d+)*)\]?/i) || block.match(/(?:^|\n)[ \t]*(\d{1,3})[ \t]*[).]/m);
      const rawId = idM ? idM[1] : `${++qCount}`;
      const id = namespace ? `${namespace}_${rawId}` : rawId;

      // Extrai enunciado: tudo antes de "Resposta esperada:"
      const stmtEnd = respMatch ? block.indexOf(respMatch[0]) : block.length;

      // Limpa cabeçalho da questão do enunciado
      let stmt = block.substring(0, stmtEnd)
        .replace(/(?:\*\*|##)?[ \t]*Quest[aã]o(?:[ \t]*(?:n[ºo]\.?)?)?[ \t]*[:#\-–—]?[ \t]*\[?\d+(?:\.\d+)*\]?[^\n]*\n?/i, '')
        .replace(/(?:^|\n)[ \t]*\d{1,3}[ \t]*[).][^\n]*\n?/, '')
        .trim();
      if (!stmt || stmt.length < 5) return;

      const expectedAnswer = respMatch ? respMatch[1].trim() : '';

      // Extrai explicação
      let exp = cleanQuestionExplanation(extractLabeledSection(block));

      questions.push({ id, statement: stmt, options: [], explanation: exp, expectedAnswer, isOpen: true, isEssay });
    } catch(e) {}
  });

  return { questions, summary: '' };
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

// Render rich text: bold (**text**), italic, LaTeX ($...$, $$...$$), line breaks
const renderRichText = (text, multiline = false) => {
  if (!text) return null;

  // Tokeniza o texto em segmentos: $$...$$ (display), $...$ (inline), **...**, <b>, <i>, <br>, texto
  const tokenize = (str) => {
    const tokens = [];
    // Regex: $$...$$, $...$, **...**, *...*, <b>...</b>, <i>...</i>, <br/>
    // Nota: [\s\S] para capturar múltiplas linhas no bold
    const re = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\*\*[\s\S]*?\*\*|\*[^*\n]+?\*|<b>[\s\S]*?<\/b>|<i>[\s\S]*?<\/i>|<br\s*\/?>)/g;
    let last = 0, m;
    while ((m = re.exec(str)) !== null) {
      if (m.index > last) tokens.push({ type: 'text', val: str.slice(last, m.index) });
      const v = m[0];
      if (v.startsWith('$$')) tokens.push({ type: 'tex-display', val: v.slice(2, -2).trim() });
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
  return lines.map((line, li) => (
    <React.Fragment key={li}>
      {renderTokens(tokenize(line), `l${li}`)}
      {li < lines.length - 1 && <br/>}
    </React.Fragment>
  ));
};

// Aliases para compatibilidade
const parseHtmlText     = (text) => renderRichText(text, false);
const parseHtmlTextChat = (text) => renderRichText(text, true);


// Retorna os valores de blocks como array seguro, independente do formato salvo
const blockValues = (blocks) => {
  if (!blocks) return [];
  if (Array.isArray(blocks)) return blocks;
  if (typeof blocks === 'object') {
    return Object.values(blocks).map(b => ({
      ...b,
      questions: Array.isArray(b?.questions) ? b.questions : [],
      answers:   (b?.answers && !Array.isArray(b.answers)) ? b.answers : {},
    }));
  }
  return [];
};
// Converte o raw do Firestore (qualquer formato) para estrutura canônica:
// { [subject]: { [topic]: { main: Aula[], bonus: Aula[] } } }
const parseVideoaulasData = (raw) => {
  if (!raw || !Object.keys(raw).length) return {};
  const result = {};
  Object.entries(raw).forEach(([subj, rawTopics]) => {
    const sortedTopics = Object.keys(rawTopics).sort((a, b) => getSubtopicOrder(a) - getSubtopicOrder(b));
    result[subj] = {};
    // Primeiro passo: agrupar chaves com ⭐ na sua base (formato antigo do Firestore)
    const merged = {};
    sortedTopics.forEach(key => {
      const val = rawTopics[key];
      const isBonus = /⭐/.test(key);
      const baseKey = key.replace(/\s*⭐\s*$/, '').trim();
      if (!merged[baseKey]) merged[baseKey] = { main: [], bonus: [] };
      if (Array.isArray(val)) {
        if (isBonus) merged[baseKey].bonus.push(...val);
        else         merged[baseKey].main.push(...val);
      } else if (val && typeof val === 'object') {
        merged[baseKey].main.push(...(val['Aulas Principais'] || []));
        merged[baseKey].bonus.push(...(val['Bônus'] || []));
      }
    });
    // Ordenar keys mescladas
    const sortedMerged = Object.keys(merged).sort((a, b) => getSubtopicOrder(a) - getSubtopicOrder(b));
    sortedMerged.forEach(k => { result[subj][k] = merged[k]; });
  });
  return result;
};

// Extrai array flat de aulas de qualquer formato de cats
const extractAulas = (cats) => {
  if (!cats) return [];
  if (Array.isArray(cats)) return cats;
  const main = cats['Aulas Principais'] || cats.main || [];
  const bonus = cats['Bônus'] || cats.bonus || [];
  if (main.length || bonus.length) return [...main, ...bonus];
  return Object.values(cats).filter(Array.isArray).flat();
};

// Sort subjects by course chronogram order
const sortSubjects = (subjects) =>
  [...subjects].sort((a, b) => {
    const ai = SUBJECT_ORDER.findIndex(s => a.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(a.toLowerCase()));
    const bi = SUBJECT_ORDER.findIndex(s => b.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(b.toLowerCase()));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

const libraryOrderValue = (item) => Number.isFinite(Number(item?.sortOrder))
  ? Number(item.sortOrder)
  : -(Number(item?.createdAt || item?.id) || 0);
const sortLibraryItems = (items) => [...items].sort((a,b)=>{
  const d = libraryOrderValue(a) - libraryOrderValue(b);
  if (d) return d;
  return String(a?.title || '').localeCompare(String(b?.title || ''), 'pt');
});

// Short display name for a topic key: "GIN 6 - IST" → "Ist"
const shortTopicName = (key) => {
  const clean = key.replace(/^[A-ZÁÉÍÓÚ]{2,8}\s*\d+\s*[-–]\s*/i, '').trim();
  const t = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  return t.length > 32 ? t.substring(0, 31) + '…' : (t || key);
};
// Modal de configuração de geração de questões para uma videoaula
const VqGenModal = ({ aula, aulaId, suggestedQ, subject, topic, isReset, darkMode, onClose, onConfirm, loading, savedSettings={} }) => {
  const dm = darkMode;
  const MAX_PER_BLOCK = 20;

  const [lessonMeta, setLessonMeta]   = useState(null);
  const [metaLoading, setMetaLoading] = useState(true);

  const durationSecs = lessonMeta?.duration_seconds || aula.duration_seconds || 0;
  const durationFmt  = lessonMeta?.duration_formatted || aula.duration_formatted || '';
  const roundToTen   = (n) => Math.max(10, Math.round(n / 10) * 10);
  const calculatedQ  = durationSecs > 0 ? roundToTen(Math.ceil(durationSecs / 120)) : (suggestedQ || 10);

  const [totalQ,      setTotalQ]      = useState(suggestedQ || 10);
  const [qPerBlock,   setQPerBlock]   = useState(Math.min(MAX_PER_BLOCK, suggestedQ || 10));
  const [numBlocks,   setNumBlocks]   = useState(Math.ceil((suggestedQ || 10) / Math.min(MAX_PER_BLOCK, suggestedQ || 10)));
  // Inicializar com as configurações salvas do usuário
  const [numAlts,       setNumAlts]     = useState(savedSettings.numAlternatives || 5);
  const [extraPrompt,   setExtraPrompt] = useState('');
  const [questionStyle, setQuestionStyle] = useState(savedSettings.questionStyle || 'mixed');
  const [questionTypes, setQuestionTypes] = useState(savedSettings.questionTypes || ['direct']);
  const [autoMode,      setAutoMode]    = useState(savedSettings.autoMode !== false);
  const [initialized,   setInitialized] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setMetaLoading(true);
      try {
        const docId = (aula.title || '').replace(/\//g, '-');
        const snap = await getDoc(doc(db, 'lessons', docId));
        if (snap.exists()) {
          const d = snap.data();
          setLessonMeta({ duration_seconds: d.duration_seconds, duration_formatted: d.duration_formatted });
        }
      } catch(e) {}
      finally { setMetaLoading(false); }
    };
    fetch();
  }, [aula.title]); // eslint-disable-line

  useEffect(() => {
    if (metaLoading || initialized) return;
    const secs = lessonMeta?.duration_seconds || aula.duration_seconds || 0;
    const raw = secs > 0 ? Math.ceil(secs / 120) : (suggestedQ || 10);
    const q   = Math.max(10, Math.round(raw / 10) * 10);
    const perB = Math.min(MAX_PER_BLOCK, q);
    const blks = Math.ceil(q / perB);
    setTotalQ(q); setQPerBlock(perB); setNumBlocks(blks);
    setInitialized(true);
  }, [metaLoading, initialized]); // eslint-disable-line

  // Helpers de mudança — mantém consistência entre os 3 campos
  const handleTotalChange = (v) => {
    const t = Math.max(1, Math.min(300, parseInt(v)||1));
    setTotalQ(t);
    const perB = Math.min(MAX_PER_BLOCK, qPerBlock);
    setQPerBlock(perB);
    setNumBlocks(Math.ceil(t / perB));
  };
  const handlePerBlockChange = (v) => {
    const p = Math.max(1, Math.min(MAX_PER_BLOCK, parseInt(v)||1));
    setQPerBlock(p);
    setNumBlocks(Math.ceil(totalQ / p));
  };
  const handleBlocksChange = (v) => {
    const b = Math.max(1, Math.min(50, parseInt(v)||1));
    setNumBlocks(b);
    setQPerBlock(Math.min(MAX_PER_BLOCK, Math.ceil(totalQ / b)));
  };

  // Garante que qPerBlock nunca excede totalQ
  const effectivePerBlock = Math.min(qPerBlock, totalQ);
  const remainder    = totalQ % effectivePerBlock;
  const fullBlocks   = remainder === 0 ? numBlocks : numBlocks - 1;
  const lastBlock    = remainder === 0 ? 0 : remainder;
  const summaryText  = lastBlock === 0
    ? `${numBlocks} bloco(s) de ${effectivePerBlock} questões = ${totalQ} no total`
    : `${fullBlocks > 0 ? `${fullBlocks} bloco(s) de ${effectivePerBlock} + ` : ''}1 bloco de ${lastBlock} = ${totalQ} no total`;

  // Salva preferências atuais e fecha — chamado em qualquer forma de fechar
  const handleClose = () => onClose({ questionStyle, numAlternatives: numAlts, autoMode });

  return (
    <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4" onClick={handleClose}>
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${dm?'bg-gray-900 border-gray-700 text-gray-100':'bg-white border-gray-200 text-gray-900'}`}
        style={{isolation:'isolate', maxHeight:'calc(100dvh - 6rem)'}}
        onClick={e=>e.stopPropagation()}
      >
        {/* Header fixo */}
        <div className={`flex items-center justify-between px-6 py-5 border-b flex-shrink-0 ${dm?'border-gray-700':'border-gray-100'}`}>
          <div>
            <h3 className="text-lg font-serif font-bold text-yellow-600 flex items-center gap-2">
              <GraduationCap className="w-5 h-5"/>Gerar Questões da Aula
            </h3>
            <p className={`text-sm mt-0.5 truncate max-w-xs ${dm?'text-gray-400':'text-gray-500'}`}>{aula.title}</p>
          </div>
          <button type="button" aria-label="Fechar" onClick={handleClose} className={`p-2 rounded-full ${dm?'hover:bg-gray-700 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>✕</button>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1 min-h-0">
          {/* Duração + sugestão */}
          <div className={`flex items-center gap-3 p-3 rounded-xl ${dm?'bg-gray-800':'bg-gray-50'}`}>
            <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0"/>
            {metaLoading ? (
              <div className="flex items-center gap-2">
                <Spinner className="w-4 h-4 text-yellow-600"/>
                <span className={`text-sm ${dm?'text-gray-400':'text-gray-500'}`}>Calculando duração...</span>
              </div>
            ) : durationSecs > 0 ? (
              <div>
                <p className="text-sm font-bold">Duração: {durationFmt}</p>
                <p className={`text-xs mt-0.5 ${dm?'text-gray-400':'text-gray-500'}`}>
                  Sugestão: {calculatedQ} questões ({Math.ceil(durationSecs/60)} min ÷ 2, arredondado para dezena)
                </p>
              </div>
            ) : (
              <p className={`text-sm ${dm?'text-gray-400':'text-gray-500'}`}>Duração não disponível — ajuste manualmente</p>
            )}
          </div>

          {/* Toggle autoMode */}
          <button onClick={()=>setAutoMode(!autoMode)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${autoMode?(dm?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(dm?'border-gray-600 bg-gray-800':'border-gray-200 bg-white')}`}>
            <div>
              <p className={`text-sm font-bold ${autoMode?'text-yellow-500':''}`}>✦ Deixar o Oráculo escolher</p>
              <p className="text-xs opacity-50 mt-0.5">A IA define a estrutura ideal de blocos e subtópicos</p>
            </div>
            <div style={{width:40,height:24,borderRadius:12,padding:2,background:autoMode?'#ca8a04':'#9ca3af',transition:'background 0.2s',flexShrink:0,display:'flex',alignItems:'center'}}>
              <div style={{width:20,height:20,borderRadius:10,background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.3)',transform:autoMode?'translateX(16px)':'translateX(0)',transition:'transform 0.2s'}}/>
            </div>
          </button>

          {/* Configuração numérica */}
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 transition-opacity ${autoMode?'opacity-30 pointer-events-none':''}`}>
            {[
              {label:'Total',sub:'questões',val:totalQ,fn:handleTotalChange},
              {label:`Por bloco (máx ${MAX_PER_BLOCK})`,sub:'questões',val:qPerBlock,fn:handlePerBlockChange},
              {label:'Blocos',sub:'blocos',val:numBlocks,fn:handleBlocksChange},
            ].map(f=>(
              <div key={f.label}>
                <label className="block text-xs font-bold uppercase mb-1.5 opacity-50">{f.label}</label>
                <input type="number" min="1" value={f.val} onChange={e=>f.fn(e.target.value)}
                  className={`w-full p-3 rounded-xl border text-center text-lg font-bold outline-none focus:ring-2 focus:ring-yellow-500 ${dm?'bg-gray-800 border-gray-600 text-white':'bg-white border-gray-200'}`}/>
                <p className="text-[10px] text-center mt-1 opacity-40">{f.sub}</p>
              </div>
            ))}
          </div>

          {/* Resumo visual — mostra distribuição real */}
          {!autoMode&&<div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${dm?'bg-yellow-900/20 border border-yellow-800/40':'bg-yellow-50 border border-yellow-200'}`}>
            <Sparkles className="w-4 h-4 text-yellow-600 flex-shrink-0"/>
            <span className={dm?'text-yellow-300':'text-yellow-800'}>{summaryText}</span>
          </div>}

          {/* Tipo de questão */}
          <div>
            <label className="block text-xs font-bold uppercase mb-2 opacity-50">Tipo de questão <span className="normal-case font-normal opacity-70">(escolha um ou mais)</span></label>
            <QuestionTypeSelector selected={questionTypes} onChange={setQuestionTypes} darkMode={dm} single={true}/>
          </div>

          {/* Estilo clínico/direto — só aparece se "direta" está selecionada */}
          {(questionTypes.includes('direct') || questionTypes.includes('vof') || questionTypes.includes('cespe')) && (
            <div>
              <label className="block text-xs font-bold uppercase mb-2 opacity-50">Estilo do enunciado</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[{k:'mixed',label:'Misto',desc:'Clínicas e diretas'},{k:'clinical',label:'Clínico',desc:'Casos clínicos'},{k:'direct',label:'Direto',desc:'Perguntas diretas'}].map(opt=>(
                  <button key={opt.k} onClick={()=>setQuestionStyle(opt.k)}
                    className={`py-2.5 px-2 rounded-xl border-2 text-xs font-bold transition-all text-center ${questionStyle===opt.k?(dm?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-600 bg-gray-800 text-gray-300':'border-gray-200 bg-white text-gray-700')}`}>
                    {opt.label}
                    <p className="font-normal opacity-60 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Alternativas */}
          <div>
            <label className="block text-xs font-bold uppercase mb-2 opacity-50">Alternativas por questão</label>
            <div className="flex gap-3">
              {[4,5].map(n=>(
                <button key={n} onClick={()=>setNumAlts(n)}
                  className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${numAlts===n?(dm?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500':'border-gray-200 bg-white text-gray-700')}`}>
                  {n} alt. (A–{'ABCDE'[n-1]})
                </button>
              ))}
            </div>
          </div>

          {/* Prompt extra */}
          <div>
            <label className="block text-xs font-bold uppercase mb-2 opacity-50">Instruções Extras <span className="normal-case font-normal opacity-70">(opcional)</span></label>
            <textarea
              value={extraPrompt} onChange={e=>setExtraPrompt(e.target.value)}
              placeholder="Ex: Foque em farmacologia e diagnóstico. Priorize o que o professor marcou como mais importante..."
              className={`w-full h-20 p-3 rounded-xl border resize-none outline-none focus:ring-2 focus:ring-yellow-500 text-sm ${dm?'bg-gray-800 border-gray-700 text-white placeholder-gray-500':'bg-white border-gray-200 placeholder-gray-400'}`}
            />
          </div>

          {isReset&&(
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${dm?'bg-red-900/20 border border-red-800/40 text-red-400':'bg-red-50 border border-red-200 text-red-700'}`}>
              <RotateCcw className="w-4 h-4 flex-shrink-0"/>
              Os blocos e questões anteriores desta aula serão substituídos.
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-4 flex-shrink-0 border-t border-gray-700/30">
          <button onClick={handleClose} className={`flex-1 py-4 rounded-xl font-bold ${dm?'bg-gray-800 hover:bg-gray-700':'bg-gray-100 hover:bg-gray-200'}`}>
            Cancelar
          </button>
          <button
            disabled={loading || metaLoading}
            onClick={()=>onConfirm({totalQ, numBlocks, qPerBlock, numAlternatives:numAlts, extraPrompt, lessonMeta, questionStyle, autoMode, questionTypes})}
            className="flex-[2] px-5 py-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 text-base"
          >
            {loading
              ? <><Spinner className="w-4 h-4 text-white"/>Gerando sumário...</>
              : metaLoading
                ? <><Spinner className="w-4 h-4 text-white"/>Carregando...</>
                : <><Sparkles className="w-4 h-4"/>Confirmar e Gerar</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── REVISAR ERROS MODAL ──────────────────────────────────────────────────────
// ─── QUESTION VIEW ────────────────────────────────────────────────────────────
// Componente reutilizado pela view topic e pela view de bloco do curso.
// Props:
//   title, onBack, backLabel
//   questions, answers, favorites
//   onAnswer(qId, letter), onToggleFavorite(qId)
//   onReset, onRegenerate, onExport
//   isGenerating, streamCount, loadingMsg
//   showBizuario, onBizuario
//   darkMode, apiKey, oracleLength
//   generateLabel, generateIcon — botão primário quando sem questões
//   onGenerate — callback do botão primário
//   subtopics — painel azul de subtópicos (opcional)
const QuestionView = ({
  title, onBack, backLabel='Voltar',
  questions=[], answers={}, favorites=[],
  onAnswer, onToggleFavorite,
  errorNotebook=[], onToggleErrorNotebook=null, showErrorNotebook=false,
  onReset, onRegenerate, onExport,
  isGenerating=false, streamCount=0, loadingMsg='',
  showBizuario=false, onBizuario, bizuarioCached=false,
  darkMode, apiKey, oracleLength='medium', onCall, onOpenAnswer,
  generateLabel='Gerar Questões', generateIcon=null, onGenerate=null,
  subtopics=[],
  topicStyle=null, onTopicStyleChange=null,
  topicType=null,
  onAddToReview=null,
  onReviewErrorNotebook=null,
  onGoToAula=null,
  goToAulaLabel='Assistir aula',
  onGenerateExtra=null,
  inReviewCount=0,
  displayMode='list',
}) => {
  const dm = darkMode;
  const [headerActionsOpen, setHeaderActionsOpen] = useState(false);

  // Auto-scroll to first unanswered question when block loads
  useEffect(() => {
    if (!questions || questions.length === 0) return;
    const validAns = Object.fromEntries(
      Object.entries(answers).filter(([id]) => questions.some(q => q.id === id))
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

  const correctLetter = (q) => q.options?.find(o=>o.isCorrect)?.letter;

  const validAnswers = Object.fromEntries(
    Object.entries(answers).filter(([id]) => questions.some(q => q.id === id))
  );

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

  const wrongIds = questions.filter(q => {
    if (q.isOpen) return isOpenAnswered(q) && !isOpenCorrect(q);
    return validAnswers[q.id] && validAnswers[q.id] !== correctLetter(q);
  }).map(q=>q.id);

  const correctCount = questions.filter(q =>
    q.isOpen ? isOpenCorrect(q) : validAnswers[q.id] === correctLetter(q)
  ).length;

  const answeredCount = questions.filter(q =>
    q.isOpen ? isOpenAnswered(q) : !!validAnswers[q.id]
  ).length;

  const allDone = questions.length > 0 && answeredCount === questions.length;
  const pct = allDone ? Math.round(correctCount/questions.length*100) : null;
  const singleMode = displayMode === 'single' && questions.length > 0;
  const [singleIndex, setSingleIndex] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    if (!singleMode) return;
    const idx = questions.findIndex(q => q.isOpen ? !isOpenAnswered(q) : !validAnswers[q.id]);
    setSingleIndex(idx >= 0 ? idx : 0);
  }, [singleMode, questions.map(q=>q.id).join('|')]); // eslint-disable-line

  const btnBase = `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold border transition-colors`;
  const btnNeutral = dm ? `${btnBase} border-gray-600 text-gray-300 hover:bg-gray-700` : `${btnBase} border-gray-200 text-gray-600 hover:bg-gray-50`;
  const goToAulaIcon = goToAulaLabel.toLowerCase().includes('ler')
    ? <BookOpen className="w-4 h-4"/>
    : <VideoIcon className="w-4 h-4"/>;
  const actionMenuItems = questions.length>0 ? [
    onGoToAula ? { label:goToAulaLabel, icon:goToAulaIcon, fn:onGoToAula } : null,
    onExport ? { label:'Exportar', icon:<Printer className="w-4 h-4"/>, fn:onExport } : null,
    showBizuario&&onBizuario ? { label:bizuarioCached?'Bizuário ✓':'Bizuário', icon:<BrainIcon className="w-4 h-4"/>, fn:onBizuario, active:bizuarioCached } : null,
    onAddToReview ? { label:inReviewCount>0?`Gerenciar revisão (${inReviewCount})`:'Revisão Espaçada', icon:<RepeatIcon className="w-4 h-4"/>, fn:()=>onAddToReview(questions, answers) } : null,
    onReviewErrorNotebook && errorNotebook.length > 0 ? { label:`Revisar caderno (${errorNotebook.length})`, icon:<BookOpen className="w-4 h-4"/>, fn:onReviewErrorNotebook } : null,
    onRegenerate ? { label:'Recriar', icon:<RotateCcw className="w-4 h-4"/>, fn:onRegenerate } : null,
    onReset ? { label:'Limpar respostas', icon:<Eraser className="w-4 h-4"/>, fn:onReset, danger:true } : null,
  ].filter(Boolean) : [];
  const currentQuestion = singleMode ? questions[Math.min(singleIndex, questions.length - 1)] : null;
  const navBtn = (disabled, primary=false) => `inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${disabled
    ? (dm?'border-gray-800 text-gray-700 bg-gray-900/40 cursor-default':'border-gray-100 text-gray-300 bg-gray-50 cursor-default')
    : primary
      ? (dm?'border-yellow-700 bg-yellow-900/30 text-yellow-300 hover:bg-yellow-900/50':'border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100')
      : (dm?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50')}`;
  const renderQuestion = (q, i) => (
    <div key={q.id||i} data-question-id={q.id}>
      <QuestionCard question={q} index={i}
        selectedLetter={answers[q.id]} onAnswer={l=>onAnswer(q.id,l)}
        darkMode={dm} isFavorite={favorites.includes(q.id)}
        onToggleFavorite={()=>onToggleFavorite(q.id)}
        showErrorNotebook={showErrorNotebook}
        isInErrorNotebook={errorNotebook.includes(q.id)}
        onToggleErrorNotebook={onToggleErrorNotebook ? ()=>onToggleErrorNotebook(q.id) : undefined}
        apiKey={apiKey} oracleLength={oracleLength} onCall={onCall}
        onOpenAnswer={onOpenAnswer}/>
    </div>
  );
  const renderCompletion = () => {
    const wrongCount = questions.length - correctCount;
    const tone = pct>=80 ? 'Excelente retenção.' : pct>=60 ? 'Boa sessão, com alguns pontos para reforçar.' : 'Sessão útil para revelar lacunas importantes.';
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
        <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
          {onAddToReview&&(
            <button onClick={()=>onAddToReview(questions, answers)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold bg-yellow-600 text-white hover:bg-yellow-700">
              <RepeatIcon className="w-5 h-5"/>{inReviewCount>0?`Gerenciar revisão (${inReviewCount})`:'Adicionar à revisão'}
            </button>
          )}
          {onReviewErrorNotebook && errorNotebook.length > 0 && (
            <button onClick={onReviewErrorNotebook}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold border ${dm?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50'}`}>
              <BookOpen className="w-4 h-4"/>Revisar caderno de erros
            </button>
          )}
          {singleMode && (
            <button onClick={()=>setShowCompletion(false)}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold border ${dm?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
              <ArrowLeft className="w-4 h-4"/>Ver questões
            </button>
          )}
          {onGoToAula&&(
            <button onClick={onGoToAula}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold border ${dm?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
              {goToAulaIcon}{goToAulaLabel}
            </button>
          )}
          {onGenerateExtra&&(
            <button onClick={onGenerateExtra}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold border ${dm?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50'}`}>
              <PlusIcon className="w-4 h-4"/>Gerar bloco extra
            </button>
          )}
          {showBizuario&&onBizuario&&(
            <button onClick={onBizuario}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold border ${bizuarioCached?(dm?'border-green-600 text-green-400 bg-green-900/20':'border-green-400 text-green-700 bg-green-50'):(dm?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-700 hover:bg-gray-50')}`}>
              <BrainIcon className="w-4 h-4"/>{bizuarioCached?'Bizuário ✓':'Bizuário'}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (!isGenerating && questions.length > 0 && showCompletion && allDone) {
    return (
      <div>
        <div className={`mb-6 border-b pb-6 ${dm?'border-gray-700':'border-gray-200'}`}>
          <button onClick={onBack} className={`flex items-center gap-2 mb-2 font-bold ${dm?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}>
            <ArrowLeft className="w-4 h-4"/>{backLabel}
          </button>
          <h2 className="text-2xl font-serif font-bold text-yellow-600">{title}</h2>
        </div>
        {renderCompletion()}
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b pb-6 ${dm?'border-gray-700':'border-gray-200'}`}>
        <div className="min-w-0 flex-1">
          <button onClick={onBack} className={`flex items-center gap-2 mb-2 font-bold ${dm?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}>
            <ArrowLeft className="w-4 h-4"/>{backLabel}
          </button>
          <div className="flex items-center justify-between gap-3">
            <h2 className="min-w-0 flex-1 text-2xl font-serif font-bold text-yellow-600 truncate">{title}</h2>
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
                  <div className={`absolute right-0 top-11 z-40 w-56 rounded-xl border shadow-xl overflow-hidden ${dm?'bg-gray-900 border-gray-700':'bg-white border-gray-200'}`}>
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
          {answeredCount>0&&<p className="text-sm opacity-60 mt-1">
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

      {/* ── Subtópicos ── */}
      {!isGenerating&&questions.length===0&&subtopics.length>0&&(
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
          {/* Estilo do enunciado */}
          <div>
            <p className={`text-xs font-bold uppercase mb-2 ${dm?'text-gray-400':'text-gray-500'}`}>Estilo do Enunciado</p>
            <div className="flex gap-2">
              {[{k:'mixed',l:'Misto',d:'Clínico + Direto'},{k:'clinical',l:'Clínico',d:'Casos clínicos'},{k:'direct',l:'Direto',d:'Conceitos'}].map(o=>(
                <button key={o.k} onClick={()=>onTopicStyleChange(o.k,'style')}
                  className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all text-center ${topicStyle===o.k?(dm?'border-yellow-500 bg-yellow-900/20 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-600 text-gray-400 hover:border-gray-500':'border-gray-200 text-gray-500 hover:border-gray-300')}`}>
                  {o.l}
                  <p className="font-normal opacity-50 mt-0.5 hidden sm:block">{o.d}</p>
                </button>
              ))}
            </div>
          </div>
          {/* Tipo de questão */}
          <div>
            <p className={`text-xs font-bold uppercase mb-2 ${dm?'text-gray-400':'text-gray-500'}`}>Tipo de Questão</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUESTION_TYPES.map(t=>(
                <button key={t.k} onClick={()=>onTopicStyleChange(t.k,'type')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${topicType===t.k?(dm?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(dm?'border-gray-600 hover:border-gray-500':'border-gray-200 hover:border-gray-300')}`}>
                  <span className={`text-sm font-bold ${topicType===t.k?(dm?'text-yellow-400':'text-yellow-700'):(dm?'text-gray-300':'text-gray-600')}`}>{t.label}</span>
                  <span className={`text-xs ml-auto ${dm?'text-gray-500':'text-gray-400'}`}>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
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
        <div>
          {singleMode && currentQuestion ? (
            <div>
              <div className={`mb-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3 ${dm?'bg-gray-900':'bg-gray-50'}`}>
                <span className={`text-xs font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>Questão {singleIndex + 1} de {questions.length}</span>
                <div className={`h-1.5 flex-1 rounded-full overflow-hidden ${dm?'bg-gray-800':'bg-gray-200'}`}>
                  <div className="h-full bg-yellow-500 rounded-full transition-all" style={{width:`${((singleIndex + 1) / questions.length) * 100}%`}}/>
                </div>
              </div>
              {renderQuestion(currentQuestion, singleIndex)}
              <div className="mt-4 flex items-center justify-between gap-3">
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
              </div>
            </div>
          ) : questions.map((q,i)=>renderQuestion(q,i))}
          {/* ── Conclusão ── */}
          {!singleMode&&allDone&&<div className="py-10">{renderCompletion()}</div>}
        </div>
      )}
    </div>
  );
};

// ─── VQ CONFIG MODAL ──────────────────────────────────────────────────────────
// Modal leve de configurações rápidas das questões de aulas
const VqConfigModal = ({ darkMode, settings, onSave, onClose }) => {
  const dm = darkMode;
  const [numAlts, setNumAlts] = useState(settings.numAlternatives || 5);
  const [style, setStyle]     = useState(settings.questionStyle || 'mixed');
  const [auto, setAuto]       = useState(settings.autoMode !== false);

  const confirm = () => {
    onSave({ numAlternatives: numAlts, questionStyle: style, autoMode: auto });
    onClose();
  };

  return (
    <div className="modal-scroll fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black bg-opacity-80 p-4" onClick={onClose}>
      <div className={`w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden ${dm?'bg-gray-900 border-gray-700':'bg-white border-gray-200'}`}
        onClick={e=>e.stopPropagation()}>
        <div className={`flex items-center justify-between px-5 py-4 border-b ${dm?'border-gray-700':'border-gray-100'}`}>
          <h3 className="font-serif font-bold text-base text-yellow-600">Configurações das Questões</h3>
          <button type="button" aria-label="Fechar" onClick={onClose} className={`text-xl leading-none ${dm?'text-gray-500 hover:text-gray-300':'text-gray-400 hover:text-gray-600'}`}>×</button>
        </div>
        <div className="px-5 py-4 space-y-5">
          {/* Auto mode */}
          <button onClick={()=>setAuto(!auto)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${auto?(dm?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(dm?'border-gray-600 bg-gray-800':'border-gray-200 bg-gray-50')}`}>
            <div className="text-left">
              <p className={`text-sm font-bold ${auto?'text-yellow-500':''}`}>✦ Oráculo escolhe a estrutura</p>
              <p className="text-xs opacity-50 mt-0.5">Blocos e subtópicos definidos pela IA</p>
            </div>
            <div className={`w-10 h-6 rounded-full flex items-center px-0.5 flex-shrink-0 ml-3 ${auto?'bg-yellow-500':'bg-gray-400'}`}>
              <div style={{width:20,height:20,borderRadius:10,background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.3)',transform:auto?'translateX(16px)':'translateX(0)',transition:'transform 0.2s'}}/>
            </div>
          </button>

          {/* Estilo */}
          <div>
            <p className="text-xs font-bold uppercase opacity-50 mb-2">Estilo</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[{k:'mixed',l:'Misto'},{k:'clinical',l:'Clínico'},{k:'direct',l:'Direto'}].map(o=>(
                <button key={o.k} onClick={()=>setStyle(o.k)}
                  className={`py-2 rounded-xl border-2 text-xs font-bold transition-all ${style===o.k?(dm?'border-yellow-500 bg-yellow-900/20 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-600 text-gray-300':'border-gray-200 text-gray-600')}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          {/* Alternativas */}
          <div>
            <p className="text-xs font-bold uppercase opacity-50 mb-2">Alternativas</p>
            <div className="grid grid-cols-2 gap-2">
              {[{v:4,l:'4 (A–D)'},{v:5,l:'5 (A–E)'}].map(o=>(
                <button key={o.v} onClick={()=>setNumAlts(o.v)}
                  className={`py-2 rounded-xl border-2 text-xs font-bold transition-all ${numAlts===o.v?(dm?'border-yellow-500 bg-yellow-900/20 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-600 text-gray-300':'border-gray-200 text-gray-600')}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 pb-5">
          <button onClick={confirm} className="w-full px-5 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold text-sm">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── SPACED REVIEW MODAL ─────────────────────────────────────────────────────
const SRModal = ({ questions, answers, aulaId, blockId, blockTitle, darkMode, onConfirm, onClose, currentReview, notebookIds=[], isAdmin=false }) => {
  const dm = darkMode;
  const SR_LABELS = ['3d','7d','14d','30d','90d'];
  const correctLetter = q => q.options?.find(o => o.isCorrect)?.letter;
  const wrongIds = questions.filter(q => answers[q.id] && answers[q.id] !== correctLetter(q)).map(q => q.id);

  // currentReview: object { [qId]: { interval, dueDate } } from reviewQueue[aulaId][blockId]
  const inReview = currentReview || {};
  const inReviewIds = Object.keys(inReview);

  // Ao gerenciar uma fila existente, não pré-seleciona questões novas.
  const [selected, setSelected] = useState(() => inReviewIds.length ? [] : questions.map(q=>q.id).filter(id => !inReviewIds.includes(id)));
  const [toRemove, setToRemove] = useState([]);

  const toggle = (id) => {
    if (inReviewIds.includes(id)) {
      // Already in review — toggle removal
      setToRemove(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);
    } else {
      // Not in review — toggle addition
      setSelected(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);
    }
  };

  const handleConfirm = () => {
    onConfirm(selected, toRemove);
  };

  const dueNow = (qId) => inReview[qId] && inReview[qId].dueDate <= Date.now();
  const dueLabel = (qId) => {
    if (!inReview[qId]) return null;
    const days = Math.ceil((inReview[qId].dueDate - Date.now()) / 86400000);
    const interval = SR_LABELS[inReview[qId].interval] || '?';
    if (days <= 0) return `vence hoje · intervalo ${interval}`;
    return `em ${days}d · intervalo ${interval}`;
  };

  const addCount = selected.length;
  const removeCount = toRemove.length;
  const hasChanges = addCount > 0 || removeCount > 0;

  return (
    <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4" onClick={onClose}>
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${dm?'bg-gray-900 border-gray-700':'bg-white border-gray-200'}`}
        style={{maxHeight:'calc(100dvh - 6rem)'}} onClick={e=>e.stopPropagation()}>

        <div className={`px-5 py-4 border-b flex-shrink-0 ${dm?'border-gray-700':'border-gray-100'}`}>
          <h3 className="font-serif font-bold text-lg text-yellow-600 flex items-center gap-2">
            <RepeatIcon className="w-5 h-5"/> Revisão Espaçada
          </h3>
          <p className={`text-xs mt-1 ${dm?'text-gray-400':'text-gray-500'}`}>
            {inReviewIds.length > 0
              ? <>{inReviewIds.length} questão{inReviewIds.length!==1?'s':''} já na fila · Acertos: 3→7→14→30→90 dias</>
              : <>Questões selecionadas voltarão em <strong>3 dias</strong>. Acertos avançam o intervalo.</>
            }
          </p>
        </div>

        <div className="flex gap-2 px-5 pt-3 pb-2 flex-shrink-0 flex-wrap">
          <button onClick={()=>setSelected(questions.filter(q=>!inReviewIds.includes(q.id)).map(q=>q.id))}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${dm?'border-gray-600 text-gray-300 hover:bg-gray-700':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Todas novas ({questions.filter(q=>!inReviewIds.includes(q.id)).length})
          </button>
          <button onClick={()=>setSelected((isAdmin ? notebookIds : wrongIds).filter(id=>!inReviewIds.includes(id)))}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${dm?'border-red-700/50 text-red-400 hover:bg-red-900/20':'border-red-200 text-red-600 hover:bg-red-50'}`}>
            {isAdmin
              ? `Caderno de erros (${notebookIds.filter(id=>!inReviewIds.includes(id)).length})`
              : `Só erradas novas (${wrongIds.filter(id=>!inReviewIds.includes(id)).length})`}
          </button>
          <button onClick={()=>{setSelected([]);setToRemove([]);}}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${dm?'border-gray-700 text-gray-500':'border-gray-100 text-gray-400'}`}>
            Limpar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-1.5 min-h-0">
          {questions.map((q, i) => {
            const isInReview = inReviewIds.includes(q.id);
            const isWrong = wrongIds.includes(q.id);
            const isCorrect = answers[q.id] && answers[q.id] === correctLetter(q);
            const willAdd = selected.includes(q.id);
            const willRemove = toRemove.includes(q.id);
            const isDue = dueNow(q.id);

            return (
              <button key={q.id} onClick={()=>toggle(q.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all
                  ${isInReview && !willRemove ? (dm?'border-yellow-700/50 bg-yellow-900/10':'border-yellow-200 bg-yellow-50/50') : ''}
                  ${willRemove ? (dm?'border-red-700/50 bg-red-900/10 opacity-60':'border-red-200 bg-red-50 opacity-60') : ''}
                  ${willAdd ? (dm?'border-yellow-500/60 bg-yellow-900/15':'border-yellow-400 bg-yellow-50') : ''}
                  ${!isInReview && !willAdd ? (dm?'border-gray-700 bg-gray-800/50':'border-gray-100 bg-gray-50') : ''}
                `}>
                <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all
                  ${isInReview && !willRemove ? 'bg-yellow-600 border-yellow-600' : ''}
                  ${willRemove ? 'bg-red-500 border-red-500' : ''}
                  ${willAdd ? 'bg-yellow-500 border-yellow-500' : ''}
                  ${!isInReview && !willAdd ? 'border-gray-400' : ''}
                `}>
                  {isInReview && !willRemove && <RepeatIcon className="w-3 h-3 text-white"/>}
                  {willRemove && <span className="text-white text-[10px] font-bold">✕</span>}
                  {willAdd && <svg viewBox="0 0 12 12" fill="none" width="10" height="10"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs truncate ${dm?'text-gray-300':'text-gray-700'}`}>
                    <span className="opacity-40 mr-1">Q{i+1}</span>
                    {q.statement.replace(/\n/g,' ').substring(0,80)}…
                  </p>
                  {isInReview && (
                    <p className={`text-[10px] mt-0.5 ${isDue?(dm?'text-yellow-400':'text-yellow-600'):(dm?'text-gray-500':'text-gray-400')}`}>
                      {isDue ? '🔔 ' : ''}{dueLabel(q.id)}
                    </p>
                  )}
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${isCorrect?'text-green-500':isWrong?'text-red-400':'text-gray-400'}`}>
                  {isCorrect?'✓':isWrong?'✗':'—'}
                </span>
              </button>
            );
          })}
        </div>

        <div className={`px-5 py-4 border-t flex gap-3 flex-shrink-0 ${dm?'border-gray-700':'border-gray-100'}`}>
          <button onClick={onClose} className={`flex-1 py-3 rounded-xl font-bold text-sm ${dm?'bg-gray-800 hover:bg-gray-700':'bg-gray-100 hover:bg-gray-200'}`}>
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={!hasChanges}
            className="flex-[2] px-5 py-3 rounded-xl font-bold text-sm bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-40 flex items-center justify-center gap-2">
            <RepeatIcon className="w-4 h-4"/>
            {addCount>0 && removeCount>0 ? `+${addCount} / −${removeCount}` :
             addCount>0 ? `Adicionar ${addCount} questão${addCount!==1?'s':''}` :
             removeCount>0 ? `Remover ${removeCount} da fila` : 'Sem alterações'}
          </button>
        </div>
      </div>
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

  const isDaytime = () => { const h = new Date().getHours(); return h >= 6 && h < 20; };
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
      const saved = { answer, score: null, verdict: 'ERRO', feedback: isDaytime() ? 'Falha na correção. O Gemini funciona melhor à noite — tente novamente.' : 'Falha na correção. Tente novamente.' };
      setResult(saved);
      setEditing(false);
      onSave(JSON.stringify(saved));
    }
    setLoading(false);
  };

  const color = result?.score != null ? (result.score >= 70 ? 'green' : result.score >= 40 ? 'yellow' : 'red') : null;

  return (
    <div className="mb-4 space-y-3">
      {isDaytime() && editing && (
        <div className={`flex items-start gap-2 p-3 rounded-xl text-xs ${dm?'bg-orange-900/20 border border-orange-700/40 text-orange-300':'bg-orange-50 border border-orange-200 text-orange-800'}`}>
          ⚠️ O Gemini funciona melhor à noite — a correção pode ser imprecisa agora.
        </div>
      )}

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

  const isDaytime = () => {
    const h = new Date().getHours();
    return h >= 6 && h < 20; // 6h–20h = horário de pico
  };

  const submit = async () => {
    if (!answer.trim() || loading) return;
    if (isDaytime()) {
      // Avisar mas não bloquear — deixar tentar
      const ok = window.confirm('⚠️ Aviso: o Gemini costuma funcionar mal durante o dia (6h–20h). A correção pode ser imprecisa ou falhar.\n\nDeseja tentar mesmo assim?');
      if (!ok) return;
    }
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
      setResult({ nota: null, veredicto: 'ERRO', feedback: 'Não foi possível corrigir agora. ' + (isDaytime() ? 'Tente novamente à noite.' : 'Verifique sua conexão e tente novamente.') });
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

          {isDaytime() && !result && (
            <div className={`flex items-start gap-2 p-3 rounded-xl text-xs ${dm?'bg-orange-900/20 border border-orange-700/40 text-orange-300':'bg-orange-50 border border-orange-200 text-orange-800'}`}>
              <span>⚠️</span>
              <span>O Gemini funciona melhor à noite. A correção pode ser imprecisa durante o dia.</span>
            </div>
          )}

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

// ─── QUESTION TYPE SELECTOR ───────────────────────────────────────────────────
const QUESTION_TYPES = [
  { k: 'direct',   label: '📋 Direta',       desc: 'Pergunta + alternativas' },
  { k: 'vof',      label: '☑️ V ou F',        desc: 'Assertivas verdadeiro/falso' },
  { k: 'cespe',    label: '⚖️ Certo/Errado',  desc: 'Estilo CESPE — 1 afirmação' },
  { k: 'open',     label: '✏️ Aberta',        desc: 'Resposta curta corrigida pela IA' },
  { k: 'essay',    label: '📝 Dissertativa',  desc: 'Resposta longa corrigida pela IA' },
];

const QuestionTypeSelector = ({ selected=[], onChange, darkMode, single=false }) => {
  const dm = darkMode;
  const toggle = (k) => {
    if (single) { onChange([k]); return; }
    const next = selected.includes(k) ? selected.filter(x=>x!==k) : [...selected, k];
    if (next.length === 0) return;
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {QUESTION_TYPES.map(t => {
        const on = selected.includes(t.k);
        return (
          <button key={t.k} onClick={()=>toggle(t.k)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-left transition-all ${on?(dm?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(dm?'border-gray-600 bg-gray-800 hover:border-gray-500':'border-gray-200 bg-white hover:border-gray-300')}`}>
            <div className={`w-5 h-5 rounded${single?'-full':''} flex-shrink-0 flex items-center justify-center border-2 ${on?'bg-yellow-500 border-yellow-500':'border-gray-400'}`}>
              {on && <svg viewBox="0 0 12 12" fill="none" width="10" height="10"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>}
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-bold ${on?'text-yellow-500':''}`}>{t.label}</p>
              <p className="text-xs opacity-50">{t.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

const ExplanationLengthSelector = ({ value='complete', onChange, darkMode }) => {
  const dm = darkMode;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {EXPLANATION_LENGTHS.map(opt => {
        const on = value === opt.k;
        return (
          <button key={opt.k} type="button" onClick={()=>onChange(opt.k)}
            className={`py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all text-center ${on?(dm?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500':'border-gray-200 bg-white text-gray-700 hover:border-gray-300')}`}>
            {opt.label}
            <p className="font-normal opacity-60 mt-1 leading-snug">{opt.desc}</p>
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
      const ctx = `Questão: ${question.statement}\n\nAlternativas:\n${chatOptions.map(o=>`${o.letter}) ${o.text}${o.isCorrect?' ✓':''}`).join('\n')}\n\nExplicação: ${explanation}`;
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
                    onClick={()=>{ const msg=`Por que a opção "${opt.text}" está ${opt.isCorrect?'correta':'incorreta'}? Explique detalhadamente.`; setMessages(p=>[...p,{role:'user',text:msg}]); setLoading(true); (async()=>{ try{ const ctx=`Questão: ${question.statement}\n\nAlternativas:\n${chatOptions.map(o=>`${o.letter}) ${o.text}${o.isCorrect?' ✓':''}`).join('\n')}\n\nExplicação: ${explanation}`; const sys=`Você é o Oráculo de Medicina da Ágora do Saber. ${ORACLE_LENGTH[oracleLength]?.inst||''} Contexto:\n${ctx}`; const r=await callOracle(msg,sys); setMessages(p=>[...p,{role:'assistant',text:r}]); }catch(e){setMessages(p=>[...p,{role:'assistant',text:'Tente novamente.'}]);}finally{setLoading(false);} })(); }}
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
const QuestionCard = ({ question, index, selectedLetter, onAnswer, darkMode, isFavorite, onToggleFavorite, showErrorNotebook=false, isInErrorNotebook=false, onToggleErrorNotebook, apiKey, oracleLength, revealMode='normal', onCall, onOpenAnswer }) => {
  const isSkipped = selectedLetter === 'SKIPPED';
  const effectiveLetter = isSkipped ? null : selectedLetter;
  // Para questões abertas: só é "respondida" se tiver JSON salvo com campo answer
  const isOpenAnswered = (() => {
    if (!question.isOpen || !selectedLetter || selectedLetter === 'SKIPPED') return false;
    try { const p = JSON.parse(selectedLetter); return !!(p?.answer); } catch(e) { return false; }
  })();
  const isAnswered = question.isOpen ? isOpenAnswered : (effectiveLetter != null);
  const showResults = question.isOpen ? false : ((revealMode==='normal' && isAnswered) || (revealMode==='revealed' && (isAnswered || isSkipped)));
  const correctLetter = question.options?.find(o=>o.isCorrect)?.letter;
  const isCorrect = isAnswered && correctLetter === effectiveLetter;
  const explanation = cleanQuestionExplanation(question.explanation);
  const iconBtnBase = 'h-8 w-8 rounded-full border flex items-center justify-center transition-all shadow-sm hover:-translate-y-0.5 active:translate-y-0.5 active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-500/40';

	  return (
    <div className={`rounded-xl shadow-sm border p-4 md:p-6 mb-6 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${darkMode?'bg-yellow-900/30 text-yellow-300':'bg-yellow-100 text-yellow-800'}`}>Questão {index + 1}</span>
          {isSkipped && <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">Em branco</span>}
        </div>
        <div className="flex items-center gap-2">
          {showErrorNotebook && (
            <button
              onClick={onToggleErrorNotebook}
              title={isInErrorNotebook ? 'Remover do caderno de erros' : 'Adicionar ao caderno de erros'}
              aria-label={isInErrorNotebook ? 'Remover do caderno de erros' : 'Adicionar ao caderno de erros'}
              className={`${iconBtnBase} ${isInErrorNotebook?(darkMode?'bg-yellow-500 border-yellow-300 text-gray-950 ring-2 ring-yellow-400/25':'bg-yellow-500 border-yellow-500 text-white ring-2 ring-yellow-200'):(darkMode?'border-gray-700 text-gray-500 hover:bg-gray-700 hover:text-yellow-400 hover:border-yellow-500/50':'border-transparent text-gray-300 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200')}`}
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
      </div>
      <div className={`text-base md:text-lg mb-6 leading-relaxed ${darkMode?'text-gray-200':'text-gray-800'}`}>{parseHtmlTextChat(question.statement)}</div>

      {/* Questão aberta/essay — inline com campo de resposta, correção e chat */}
      {question.isOpen ? (
        <OpenAnswerInline
          question={question}
          darkMode={darkMode}
          apiKey={apiKey}
          onCall={onCall}
          oracleLength={oracleLength}
          savedAnswer={selectedLetter && selectedLetter !== 'SKIPPED' ? selectedLetter : null}
          onSave={l=>onAnswer(l)}
          isFavorite={isFavorite}
        />
      ) : (
        <div className="space-y-3 mb-4">
        {question.options.map(opt=>{
          const isSelected = effectiveLetter===opt.letter;
          let cls = "w-full text-left flex items-start p-3 md:p-4 rounded-lg border transition-colors focus:outline-none ";
          if (!isAnswered && !isSkipped || revealMode==='selected') {
            if (isSelected && revealMode==='selected') cls += darkMode?'border-blue-500 bg-blue-900/20 text-blue-100':'border-blue-400 bg-blue-50 text-blue-900';
            else cls += darkMode?'border-gray-600 bg-gray-800 text-gray-300 hover:border-yellow-500':'border-gray-200 bg-white text-gray-700 hover:border-yellow-400';
            if (revealMode==='selected') cls += ' cursor-pointer';
          } else if (isSkipped) {
            // Em branco: all neutral, correct gets a soft green border only
            cls += 'cursor-default ';
            if (opt.isCorrect) cls += darkMode?'border-green-700 bg-green-900/10 text-gray-300':'border-green-300 bg-green-50/50 text-gray-700';
            else cls += darkMode?'border-gray-700 text-gray-500 opacity-50':'border-gray-100 text-gray-400 opacity-60';
          } else {
            cls += 'cursor-default ';
            if (opt.isCorrect) cls += darkMode?'border-green-500 bg-green-900/20 text-green-100':'border-green-500 bg-green-50 text-green-900';
            else if (isSelected) cls += darkMode?'border-red-500 bg-red-900/20 text-red-100':'border-red-400 bg-red-50 text-red-900';
            else cls += 'opacity-40';
          }
          const canClick = (!isAnswered && !isSkipped) || revealMode==='selected';
          // Letter badge color
          let letterBadge = darkMode?'bg-gray-700 text-gray-300':'bg-gray-100 text-gray-600';
          if (showResults && !isSkipped && opt.isCorrect) letterBadge = 'bg-green-500 text-white';
          else if (showResults && !isSkipped && isSelected) letterBadge = 'bg-red-500 text-white';
          else if (showResults && isSkipped && opt.isCorrect) letterBadge = darkMode?'bg-green-800 text-green-300':'bg-green-100 text-green-700';
          else if (isSelected && revealMode==='selected') letterBadge = 'bg-blue-500 text-white';
          return (
            <button key={opt.letter} disabled={!canClick} onClick={()=>canClick&&onAnswer(opt.letter)} className={cls}>
              <div className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center font-bold mr-4 text-sm ${letterBadge}`}>
                {opt.letter}
              </div>
              <div className="pt-1 flex-1 leading-snug text-sm md:text-base">{parseHtmlTextChat(opt.text)}</div>
            </button>
          );
        })}
      </div>
      )}
      {showResults && (
        <div className={`mt-4 p-4 md:p-5 rounded-xl border ${darkMode?'bg-yellow-900/20 border-yellow-800/50 text-gray-200':'bg-yellow-50 border-yellow-200 text-gray-800'}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-yellow-600 flex items-center gap-2 uppercase text-sm"><BookOpen className="w-4 h-4"/>Sabedoria:</h4>
            {isCorrect
              ? <span className="text-xs text-green-600 font-bold">✓ Correto</span>
              : isSkipped
                ? <span className="text-xs text-gray-400 font-bold">— Em branco</span>
                : <span className="text-xs text-red-500 font-bold">✗ Incorreto</span>
            }
          </div>
          <div className="text-base leading-relaxed">{parseHtmlTextChat(explanation)}</div>
          {apiKey && <ChatBox question={{...question, explanation}} darkMode={darkMode} apiKey={apiKey} oracleLength={oracleLength} onCall={onCall} selectedLetter={effectiveLetter}/>}
        </div>
      )}
    </div>
  );
};

// ─── EXPORT MODAL ─────────────────────────────────────────────────────────────

// ─── ACADEMIA EXPORT MODAL ───────────────────────────────────────────────────

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

// ─── INSIGHTS MODAL ───────────────────────────────────────────────────────────
// cachedText: saved insight string (skip API call if present)
// onSave: callback(text) — called after generating to persist in DB
// ─── BIZUÁRIO MODAL ───────────────────────────────────────────────────────────
// High-yield topic summary (AnKing/First Aid/Mehlman style), cached in topic.bizuario
const BizuarioModal = ({ topicTitle, subjectTitle, questions=[], subtopics=[], topicContexts=null, apiKey, darkMode, onClose, cachedText, onSave, onRotateKey }) => {
  const [text, setText] = useState(cachedText || '');
  const [loading, setLoading] = useState(!cachedText);
  const [phase, setPhase] = useState(cachedText ? 'done' : 'loading');
  const wasCached = !!cachedText;

  const generate = async () => {
    setText(''); setLoading(true); setPhase('loading');
    try {
      const sys = `Você é o Oráculo da Ágora do Saber — editor do melhor material de revisão médica do mundo, no estilo AnKing, First Aid e Mehlman. Escreva em português brasileiro. Seja absolutamente denso e high-yield: cada frase deve conter informação cobrada em prova. PROIBIDO fluff, introduções, conclusões ou frases de efeito. Use **negrito** para termos-chave, valores, critérios diagnósticos e mecanismos críticos.`;

      let contextBlock = '';

      if (topicContexts && topicContexts.length > 0) {
        // Subject-level bizuário — aggregate all topics
        contextBlock = topicContexts.map(tc => {
          if (tc.questions.length > 0) {
            // Has questions — use them
            const qLines = tc.questions.slice(0, 10).map((q, i) =>
              `  ${i+1}. ${q.statement.substring(0,100).replace(/\n/g,' ')}...\n     ✓ ${(q.options||[]).find(o=>o.isCorrect)?.text||q.expectedAnswer||''} | ${q.explanation.substring(0,200).replace(/\n/g,' ')}...`
            ).join('\n');
            return `TÓPICO: ${tc.title}\n${qLines}`;
          } else if (tc.subtopics.length > 0) {
            // No questions — use subtopics list
            return `TÓPICO: ${tc.title}\n  Subtópicos: ${tc.subtopics.join(', ')}`;
          }
          return `TÓPICO: ${tc.title}`;
        }).join('\n\n');
      } else if (questions.length > 0) {
        // Single topic with questions
        contextBlock = questions.slice(0, 15).map((q, i) =>
          `${i+1}. ${q.statement.substring(0,120).replace(/\n/g,' ')}...\n   ✓ ${(q.options||[]).find(o=>o.isCorrect)?.text||q.expectedAnswer||''}\n   ${q.explanation.substring(0,300).replace(/\n/g,' ')}...`
        ).join('\n\n');
      } else if (subtopics.length > 0) {
        // Single topic, no questions — use subtopics
        contextBlock = `Subtópicos do tópico: ${subtopics.join(', ')}`;
      }

      const scope = topicContexts ? `da pasta "${topicTitle}" (${topicContexts.length} tópicos)` : `do tópico "${topicTitle}"${subjectTitle ? ` (${subjectTitle})` : ''}`;
      const wordLimit = topicContexts ? 'Máximo 600 palavras, abordando todos os tópicos' : 'Máximo 400 palavras — densidade máxima, zero enrolação';

      // Tenta usar prompt do Firestore
      let prompt = '';
      try {
        const pSnap = await getDoc(doc(db,'config','prompts'));
        if (pSnap.exists() && pSnap.data().bizuario) {
          let t = pSnap.data().bizuario;
          t = t.replaceAll('{{TOPIC_TITLE}}', scope);
          t = t.replaceAll('{{SUBJECT_CONTEXT}}', subjectTitle?` — ${subjectTitle}`:'');
          t = t.replaceAll('{{QUESTIONS_CONTEXT}}', contextBlock?`CONTEÚDO BASE:\n${contextBlock}`:'');
          t = t.replaceAll('{{WORD_LIMIT}}', topicContexts?'600':'400');
          prompt = t;
        }
      } catch(e) {}

      if (!prompt) {
        prompt = `Crie o BIZUÁRIO ${scope}.\n\n${contextBlock?`CONTEÚDO BASE:\n${contextBlock}\n`:''}\nOBJETIVO: Cola de revisão ultra-rápida — o estudante lê 2 minutos antes da prova.\n\nFORMATO: Parágrafos corridos, densos, sem bullet points. Valores numéricos, critérios, associações clássicas. ${wordLimit}.`;
      }

      const r = await callGemini(prompt, sys, apiKey);
      setText(r); setPhase('done');
      if (onSave) onSave(r);
      if (onRotateKey) onRotateKey();
    } catch(e) {
      setText('Não foi possível gerar o bizuário agora. Verifique sua API Key.');
      setPhase('done');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (!cachedText) generate(); }, []); // eslint-disable-line

  return (
    <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4" onClick={onClose}>
      <div
        className={`w-full max-w-2xl rounded-2xl border flex flex-col overflow-hidden ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}
        style={{maxHeight:'calc(100dvh - 6rem)'}}
        onClick={e=>e.stopPropagation()}
      >
        <div className={`flex items-center justify-between p-5 border-b flex-shrink-0 ${darkMode?'border-gray-700':'border-gray-200'}`}>
          <h3 className="text-lg font-serif font-bold text-yellow-600 flex items-center gap-2">
            <BrainIcon className="w-5 h-5"/>
            Bizuário — {topicTitle}
            {wasCached && !loading && <span className={`text-xs font-normal px-2 py-0.5 rounded-full ml-1 ${darkMode?'bg-green-900/40 text-green-400':'bg-green-100 text-green-700'}`}>✓ salvo</span>}
          </h3>
          <div className="flex items-center gap-2">
            {/* Refazer button */}
            {phase === 'done' && !loading && (
              <button onClick={generate} title="Regenerar bizuário" className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${darkMode?'bg-gray-700 hover:bg-gray-600 text-gray-300':'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Refazer
              </button>
            )}
            <button type="button" aria-label="Fechar" onClick={onClose} className={`p-2 rounded-full font-bold text-lg leading-none transition-colors ${darkMode?'hover:bg-gray-700 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 min-h-0">
          {loading ? (
            <div className="flex flex-col items-center py-10">
              <Spinner className="w-10 h-10 text-yellow-600 mb-4"/>
              <p className="text-yellow-600 font-serif font-bold">O Oráculo está destilando o bizu...</p>
              {topicContexts && <p className="text-xs opacity-40 mt-2">{topicContexts.length} tópicos sendo processados</p>}
            </div>
          ) : (
            <div className={`text-base leading-relaxed ${darkMode?'text-gray-200':'text-gray-800'}`}>
              {parseHtmlTextChat(text, darkMode)}
            </div>
          )}
        </div>

        {phase === 'done' && (
          <div className={`p-4 border-t flex-shrink-0 ${darkMode?'border-gray-700':'border-gray-200'}`}>
            <button onClick={onClose} className={`w-full py-3 rounded-xl font-bold text-sm ${darkMode?'bg-gray-700 hover:bg-gray-600':'bg-gray-100 hover:bg-gray-200'}`}>Fechar</button>
          </div>
        )}
      </div>
    </div>
  );
};

// Error configs per type — titles, messages, actions
const ERROR_CONFIGS = {
  QUOTA_EXCEEDED: {
    title: 'Limite de Requisições Atingido',
    message: 'Esta chave API atingiu o limite gratuito (20 req/dia por chave). Isso é diferente de congestionamento — o limite foi mesmo atingido.\n\nOpções:\n• Aguardar renovação automática (reseta à meia-noite no horário de Brasília)\n• Cadastrar outra chave gratuita nas Configurações\n• Criar uma nova chave em outra conta Google',
    link: { label: 'Criar nova chave gratuita', url: 'https://aistudio.google.com/app/apikey' },
  },
  API_KEY_INVALID: {
    title: 'Chave API Inválida',
    message: 'A chave não foi aceita. Verifique:\n• Se foi copiada corretamente (sem espaços extras)\n• Se é de um projeto ativo no Google AI Studio\n• Se a API Gemini está habilitada\n\n⚠️ Atenção: durante horários de pico (manhã/tarde), o Gemini pode rejeitar requisições válidas com este mesmo erro. Se sua chave funcionou antes, tente novamente mais tarde ou à noite.',
    link: { label: 'Verificar minhas chaves', url: 'https://aistudio.google.com/app/apikey' },
  },
  API_KEY_MISSING: {
    title: 'Nenhuma Chave Cadastrada',
    message: 'Você ainda não cadastrou uma chave API do Gemini. A chave é gratuita e necessária para gerar questões.\n\nComo criar:\n1. Acesse o link abaixo\n2. Clique em "Create API key"\n3. Copie a chave e cole nas Configurações do site',
    link: { label: 'Criar chave gratuita agora', url: 'https://aistudio.google.com/app/apikey' },
  },
  SERVER_OVERLOADED: {
    title: 'Gemini Sobrecarregado 😤',
    message: 'Os servidores do Gemini estão com alto tráfego agora (erro 503). Isso é comum durante o dia, especialmente de manhã e à tarde.\n\nO que fazer:\n• Aguarde 2–5 minutos e tente novamente\n• Prefira usar o site à noite (horário de Brasília) — o Gemini funciona muito melhor\n• Sua chave está OK, o problema é no lado do Google',
    link: { label: 'Ver status do Google AI', url: 'https://status.cloud.google.com' },
  },
  CONNECTION_ERROR: {
    title: 'Falha de Conexão',
    message: 'Não foi possível conectar ao Gemini.\n\nPossíveis causas:\n• Problema de internet\n• Gemini sobrecarregado (comum durante o dia)\n• Timeout na requisição\n\nTente novamente. Se o problema persistir durante o dia, tente à noite.',
    link: null,
  },
};

const GModal = ({ title, message, onConfirm, onCancel, confirmText='OK', darkMode, children, isAlert=false, actionLabel, onAction, link }) => (
  <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4">
    <div className={`w-full max-w-md rounded-2xl shadow-2xl border p-8 overflow-y-auto ${darkMode?'bg-gray-800 border-gray-700 text-gray-100':'bg-white border-gray-200 text-gray-900'}`} style={{maxHeight:'calc(100dvh - 6rem)'}}>
      <div className="flex flex-col items-center text-center">
        <div className={`p-4 rounded-full mb-4 ${darkMode?'bg-yellow-900/30':'bg-yellow-100'}`}><Flame className="w-8 h-8 text-yellow-600"/></div>
        <h3 className="text-xl font-serif font-bold mb-3">{title}</h3>
        <p className="mb-4 opacity-70 text-sm whitespace-pre-line leading-relaxed">{message}</p>
        {link&&<a href={link.url} target="_blank" rel="noreferrer" className="mb-4 text-sm font-bold text-yellow-600 hover:underline flex items-center gap-1">{link.label} ↗</a>}
        {children}
        <div className="flex gap-3 w-full mt-2">
          {!isAlert&&<button onClick={onCancel} className={`flex-1 py-3 rounded-xl font-bold ${darkMode?'bg-gray-700 hover:bg-gray-600':'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>}
          {actionLabel&&onAction
            ?<button onClick={onAction} className="flex-1 px-5 py-3 text-white rounded-xl font-bold bg-yellow-600 hover:bg-yellow-700">{actionLabel}</button>
            :<button onClick={onConfirm} className={`flex-1 px-5 py-3 text-white rounded-xl font-bold ${isAlert?'bg-yellow-600 hover:bg-yellow-700':'bg-red-600 hover:bg-red-700'}`}>{confirmText}</button>}
        </div>
      </div>
    </div>
  </div>
);

// ─── EXTERNAL PROMPT MODAL ────────────────────────────────────────────────────
const ExternalPromptModal = ({ darkMode, settings, settingsRef, onClose }) => {
  const dm = darkMode;
  const [cfg, setCfg] = useState({
    numTopics:       settings.numTopics      || 10,
    numSubtopics:    settings.numSubtopics   || 5,
    qPerSub:         settings.qPerSub        || 1,
    numAlternatives: settings.numAlternatives || 5,
    questionStyle:   settings.questionStyle  || 'mixed',
    autoMode:        settings.autoMode !== false,
    customPrompt:    settings.customPrompt   || '',
  });
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const prompt = buildExternalPrompt({...settingsRef.current, ...cfg});
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4" onClick={onClose}>
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${dm?'bg-gray-900 border-gray-700 text-gray-100':'bg-white border-gray-200 text-gray-900'}`}
        style={{maxHeight:'calc(100dvh - 6rem)'}} onClick={e=>e.stopPropagation()}>
        <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${dm?'border-gray-700':'border-gray-100'}`}>
          <h3 className="font-serif font-bold text-lg text-yellow-600">Configurar Prompt Externo</h3>
          <button type="button" aria-label="Fechar" onClick={onClose} className={`text-xl leading-none ${dm?'text-gray-400 hover:text-gray-200':'text-gray-400 hover:text-gray-600'}`}>×</button>
        </div>
        <div className="px-6 py-4 space-y-5 overflow-y-auto flex-1 min-h-0">
          {/* AutoMode */}
          <button onClick={()=>setCfg(p=>({...p,autoMode:!p.autoMode}))}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${cfg.autoMode?(dm?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(dm?'border-gray-600 bg-gray-800':'border-gray-200 bg-gray-50')}`}>
            <div>
              <p className={`text-sm font-bold ${cfg.autoMode?'text-yellow-500':''}`}>✦ IA escolhe a estrutura</p>
              <p className="text-xs opacity-50 mt-0.5">A IA define tópicos e subtópicos ideais</p>
            </div>
            <div style={{width:40,height:24,borderRadius:12,padding:2,background:cfg.autoMode?'#ca8a04':'#9ca3af',flexShrink:0,display:'flex',alignItems:'center',transition:'background 0.2s'}}>
              <div style={{width:20,height:20,borderRadius:10,background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.3)',transform:cfg.autoMode?'translateX(16px)':'translateX(0)',transition:'transform 0.2s'}}/>
            </div>
          </button>

          {/* Estrutura */}
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 transition-opacity ${cfg.autoMode?'opacity-30 pointer-events-none':''}`}>
            {[{l:'Tópicos',k:'numTopics',mn:1,mx:20},{l:'Subtóp./Tópico',k:'numSubtopics',mn:1,mx:30},{l:'Q./Subtópico',k:'qPerSub',mn:1,mx:10}].map(f=>(
              <div key={f.k}>
                <label className="block text-xs font-bold uppercase mb-1.5 opacity-40">{f.l}</label>
                <input type="number" min={f.mn} max={f.mx} value={cfg[f.k]}
                  onChange={e=>setCfg(p=>({...p,[f.k]:Math.max(f.mn,Math.min(f.mx,parseInt(e.target.value)||f.mn))}))}
                  className={`w-full p-3 rounded-lg border text-center font-bold outline-none focus:ring-2 focus:ring-yellow-500 ${dm?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
              </div>
            ))}
          </div>

          {/* Estilo */}
          <div>
            <p className="text-xs font-bold uppercase opacity-50 mb-2">Estilo</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[{k:'mixed',l:'Misto'},{k:'clinical',l:'Clínico'},{k:'direct',l:'Direto'}].map(o=>(
                <button key={o.k} onClick={()=>setCfg(p=>({...p,questionStyle:o.k}))}
                  className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${cfg.questionStyle===o.k?(dm?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-600 text-gray-300':'border-gray-200 text-gray-600')}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          {/* Alternativas */}
          <div>
            <p className="text-xs font-bold uppercase opacity-50 mb-2">Alternativas</p>
            <div className="grid grid-cols-2 gap-2">
              {[{v:4,l:'4 (A–D)'},{v:5,l:'5 (A–E)'}].map(o=>(
                <button key={o.v} onClick={()=>setCfg(p=>({...p,numAlternatives:o.v}))}
                  className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${cfg.numAlternatives===o.v?(dm?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(dm?'border-gray-600 text-gray-300':'border-gray-200 text-gray-600')}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          {/* Instrução extra */}
          <div>
            <p className="text-xs font-bold uppercase opacity-50 mb-2">Instrução Extra (opcional)</p>
            <textarea value={cfg.customPrompt} onChange={e=>setCfg(p=>({...p,customPrompt:e.target.value}))}
              placeholder="Ex: Foque apenas em farmacologia clínica..."
              rows={3} className={`w-full p-3 rounded-xl border resize-none outline-none focus:ring-2 focus:ring-yellow-500 text-sm ${dm?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
          </div>
        </div>
        <div className="px-6 pb-6 pt-4 flex gap-3 flex-shrink-0 border-t border-gray-700/30">
          <button onClick={onClose} className={`flex-1 py-3.5 rounded-xl font-bold ${dm?'bg-gray-800 hover:bg-gray-700':'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
          <button onClick={copy} className={`flex-[2] px-5 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${copied?'bg-green-600 text-white':'bg-yellow-600 hover:bg-yellow-700 text-white'}`}>
            {copied?<><CheckCircle2 className="w-4 h-4"/>Copiado!</>:<><Copy className="w-4 h-4"/>Copiar Prompt</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
const defaultSettings = { numTopics:10,numSubtopics:5,qPerSub:1,numAlternatives:5,customPrompt:'',apiKey:'',apiKey1:'',apiKey2:'',apiKey3:'',geminiKeys:[],activeKeyId:'gemini_1',activeKeyIndex:1,oracleLength:'medium',questionStyle:'mixed',autoMode:false,questionTypes:['direct'],explanationLength:'complete',dailyQuestionGoal:120,dailyLectureMinutesGoal:90,questionDisplayMode:'list',fontScale:100 };
const FONT_SCALE_OPTIONS = [
  { value:90, label:'Pequena' },
  { value:100, label:'Normal' },
  { value:112, label:'Grande' },
  { value:125, label:'Enorme' },
];


// ─── ACADEMIA TOPIC VIEW ─────────────────────────────────────────────────────

function AcademiaTopicView({
  topic, subject, library, darkMode, isAdmin, canUseAcademia,
  academiaGenerating, academiaGenProgress,
  academiaTopicAnswers, setAcademiaTopicAnswers,
  academiaExtraBusy, settings, updateSubject,
  setSettings, saveSettings,
  generateAcademiaLesson, setAcademiaExtraModal, setAcademiaRegenModal, setAcademiaExportModal, setDeleteId,
  setOpenAnswerModal, getKey, callWithRotation, parseHtmlText, onBack,
  reviewQueue, setSrModal, trackQuestionAnswered,
  onOpenAcademiaQuestions,
}) {
  const liveSubject = (library||[]).find(s => s.id === subject.id) || subject;
  const liveTopic = liveSubject?.topics?.find(t => t.id === topic.id) || topic;
  const subtopics = liveTopic.subtopics || [];
  const hasLesson = liveTopic.lessonGenerated;
  const hideSubtopicTitles = true;
  const setLessonLength = (length) => {
    const ns = { ...settings, explanationLength: length };
    setSettings(ns);
    saveSettings(ns);
  };

  // Renderiza markdown da aula com suporte a tabelas, listas e parágrafos
  const renderLesson = (md) => {
    if (!md) return null;
    const mdLines = md.split('\n');
    const elements = [];
    let i = 0;
    while (i < mdLines.length) {
      const line = mdLines[i];
      const blockTitleMatch = line.trim().match(/^\*\*([^*]+?)\*\*:?\s*$/);
      if (blockTitleMatch) {
        const blockTitle = blockTitleMatch[1].trim().replace(/:$/, '');
        elements.push(
          <h3 key={`h3-${i}`} className={`text-[15px] font-bold mt-2 mb-1 ${darkMode?'text-yellow-300':'text-yellow-700'}`}>
            {blockTitle}
          </h3>
        );
        i++;
        continue;
      }
      // Tabela markdown
      if (/^\s*\|.+\|\s*$/.test(line)) {
        const tableLines = [];
        while (i < mdLines.length && /^\s*\|.+\|\s*$/.test(mdLines[i])) {
          tableLines.push(mdLines[i]); i++;
        }
        const rows = tableLines.filter(l => !/^\s*\|[-:\s|]+\|\s*$/.test(l));
        const header = rows[0];
        const body = rows.slice(1);
        const parseCells = (row) => row.replace(/^\s*\|\s*/, '').replace(/\s*\|\s*$/, '').split(/\s*\|\s*/);
        elements.push(
          <div key={`tbl-${i}`} className="overflow-x-auto my-4">
            <table className={`w-full text-sm border-collapse ${darkMode?'text-gray-200':'text-gray-800'}`}>
              <thead>
                <tr className={`border-b-2 ${darkMode?'border-gray-600':'border-gray-300'}`}>
                  {header && parseCells(header).map((cell, ci) => (
                    <th key={ci} className={`px-3 py-2 text-left font-bold ${darkMode?'bg-gray-800/80':'bg-gray-100'}`}>{parseHtmlText(cell)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} className={`border-b ${darkMode?'border-gray-700/50':'border-gray-200'}`}>
                    {parseCells(row).map((cell, ci) => (
                      <td key={ci} className="px-3 py-2">{parseHtmlText(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
      // Lista
      if (/^\s*[-*•]\s/.test(line)) {
        const items = [];
        while (i < mdLines.length && /^\s*[-*•]\s/.test(mdLines[i])) {
          items.push(mdLines[i].replace(/^\s*[-*•]\s/, '')); i++;
        }
        elements.push(
          <ul key={`ul-${i}`} className={`list-disc ml-5 space-y-1 my-2 text-[16px] ${darkMode?'text-gray-300':'text-gray-700'}`}>
            {items.map((item, ii) => <li key={ii}>{parseHtmlText(item)}</li>)}
          </ul>
        );
        continue;
      }
      if (!line.trim()) { elements.push(<div key={`sp-${i}`} className="h-2"/>); i++; continue; }
      elements.push(
        <p key={`p-${i}`} className={`text-[16px] leading-relaxed ${darkMode?'text-gray-200':'text-gray-800'}`}>{parseHtmlText(line)}</p>
      );
      i++;
    }
    return elements;
  };

  const handleAnswer = (q, letter) => {
    trackQuestionAnswered?.(`academia:${subject.id}:${topic.id}:${q.id}`);
    setAcademiaTopicAnswers(p => ({...p, [q.id]: letter}));
    const freshSubj  = (library||[]).find(s => s.id === subject.id) || subject;
    const freshTopic = freshSubj.topics.find(t => t.id === topic.id) || liveTopic;
    const errorNotebook = canUseAcademia && !isAnswerCorrect(q, letter)
      ? addToList(freshTopic.errorNotebook || [], q.id)
      : (freshTopic.errorNotebook || []);
    const updTopic = {...freshTopic, answers: {...(freshTopic.answers||{}), [q.id]: letter}, errorNotebook};
    const updSubj  = {...freshSubj, topics: freshSubj.topics.map(t => t.id===topic.id ? updTopic : t)};
    updateSubject(updSubj);
  };

  const handleFavorite = (qId) => {
    // Read fresh topic from subject to avoid stale closure bug
    const freshSubj  = (library||[]).find(s => s.id === subject.id) || subject;
    const freshTopic = freshSubj.topics.find(t => t.id === topic.id) || liveTopic;
    const favs    = freshTopic.favorites || [];
    const newFavs = toggleInList(favs, qId);
    const updTopic = {...freshTopic, favorites: newFavs.filter(Boolean)};
    const updSubj  = {...freshSubj, topics: freshSubj.topics.map(t => t.id===topic.id ? updTopic : t)};
    updateSubject(updSubj);
  };

  const handleNotebook = (qId) => {
    if (!canUseAcademia) return;
    const freshSubj  = (library||[]).find(s => s.id === subject.id) || subject;
    const freshTopic = freshSubj.topics.find(t => t.id === topic.id) || liveTopic;
    const updTopic = {...freshTopic, errorNotebook:toggleInList(freshTopic.errorNotebook||[], qId)};
    const updSubj  = {...freshSubj, topics: freshSubj.topics.map(t => t.id===topic.id ? updTopic : t)};
    updateSubject(updSubj);
  };

  const openAcademiaReview = (questions, blockId, blockTitle) => setSrModal({
    aulaId:`lib_${liveSubject.id}`,
    blockId,
    blockTitle,
    questions,
    answers:savedAnswers,
    notebookIds:liveTopic.errorNotebook||[],
    meta:{source:'academia',subjectId:liveSubject.id,topicId:liveTopic.id,subjectTitle:liveSubject.title,blockTitle},
  });

  const reviewCount = (blockId) => Object.keys(reviewQueue?.[`lib_${liveSubject.id}`]?.[blockId] || {}).length;

  const savedAnswers = {...academiaTopicAnswers, ...(liveTopic.answers||{})};
  const hasSavedAnswer = (qId) => savedAnswers[qId] != null && savedAnswers[qId] !== '';
  const fixReviewBlockId = `academia_fix_${liveTopic.id}`;
  const fixReviewCount = reviewCount(fixReviewBlockId);

  const renderFixQ = (q, idx) => (
    <div key={q.id} data-question-id={q.id} className="mb-6">
      <QuestionCard
        question={q}
        index={idx}
        selectedLetter={savedAnswers[q.id]}
        onAnswer={(letter) => handleAnswer(q, letter)}
        darkMode={darkMode}
        isFavorite={(liveTopic.favorites||[]).includes(q.id)}
        onToggleFavorite={() => handleFavorite(q.id)}
        showErrorNotebook={canUseAcademia}
        isInErrorNotebook={(liveTopic.errorNotebook||[]).includes(q.id)}
        onToggleErrorNotebook={() => handleNotebook(q.id)}
        apiKey={getKey()}
        oracleLength={settings.oracleLength||'medium'}
        onCall={callWithRotation}
        onOpenAnswer={q=>setOpenAnswerModal({question:q, isEssay:q.isEssay})}
      />
    </div>
  );

  const allFixqs = subtopics.flatMap((_, idx) => liveTopic.fixationQuestions?.[idx] || []);
  const allFixAnswered = allFixqs.length > 0 && allFixqs.every(q => hasSavedAnswer(q.id));
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <button onClick={onBack} className={`flex items-center gap-2 mb-8 font-bold ${darkMode?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}>
        <ArrowLeft className="w-4 h-4"/>Voltar
      </button>
      <div className="mb-10">
        <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${darkMode?'text-yellow-600/70':'text-yellow-600/80'}`}>{liveSubject.title}</div>
        <h1 className={`text-3xl font-serif font-bold leading-tight mb-1 ${darkMode?'text-white':'text-gray-900'}`}>{liveTopic.title}</h1>
        {hasLesson && (
          <div className="flex items-center gap-3 mt-4 flex-wrap">
	            <button onClick={()=>setAcademiaExportModal({topic:liveTopic, subject:liveSubject})}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${darkMode?'border-gray-700 text-gray-400 hover:border-yellow-600 hover:text-yellow-400':'border-gray-200 text-gray-500 hover:border-yellow-500 hover:text-yellow-600'}`}>
              <Printer className="w-3.5 h-3.5"/>Exportar
            </button>
            {canUseAcademia && fixReviewCount > 0 && (
              <button onClick={()=>openAcademiaReview(allFixqs, fixReviewBlockId, 'Questões de fixação')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${darkMode?'border-gray-700 text-gray-400 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <RepeatIcon className="w-3.5 h-3.5"/>Gerenciar ({fixReviewCount})
              </button>
            )}
            {allFixqs.length > 0 && (
              <button onClick={()=>onOpenAcademiaQuestions?.(liveSubject, liveTopic, 'fixation')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${darkMode?'border-gray-700 text-gray-400 hover:border-yellow-600 hover:text-yellow-400':'border-gray-200 text-gray-500 hover:border-yellow-500 hover:text-yellow-600'}`}>
                <GraduationCap className="w-3.5 h-3.5"/>Questões de fixação
              </button>
            )}
          </div>
        )}
      </div>

      {/* Aula não gerada */}
      {!hasLesson && !academiaGenerating && (
        <div className={`py-16 ${darkMode?'text-gray-500':'text-gray-400'}`}>
          <div className="text-center">
          <p className="font-bold text-lg mb-1">Aula não gerada</p>
          <p className="text-sm opacity-70 mb-6 max-w-xs mx-auto">Clique abaixo para gerar a explicação e as questões de fixação.</p>
          </div>
          {canUseAcademia && (
            <div className="max-w-xl mx-auto mb-6">
              <div className="text-xs font-bold uppercase mb-2 opacity-50 text-left">Tamanho da aula</div>
              <ExplanationLengthSelector
                value={settings.explanationLength || 'complete'}
                onChange={setLessonLength}
                darkMode={darkMode}
              />
            </div>
          )}
          {canUseAcademia && (
            <div className="text-center">
            <button onClick={()=>generateAcademiaLesson(liveTopic, liveSubject)} className="bg-yellow-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-yellow-700">
              Gerar Aula
            </button>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {academiaGenerating && (
        <div className="py-20 text-center">
          <p className={`font-bold ${darkMode?'text-yellow-400':'text-yellow-600'}`}>{academiaGenProgress||'Gerando...'}</p>
          <p className={`text-xs mt-2 ${darkMode?'text-gray-500':'text-gray-400'}`}>Pode levar até 60 segundos</p>
        </div>
      )}

      {/* Conteúdo */}
      {hasLesson && !academiaGenerating && (
        <div>
          {/* Explicações */}
          {subtopics.map((subtopic, idx) => {
	            const section = liveTopic.lessonSections?.[idx];
	            const fixqs   = liveTopic.fixationQuestions?.[idx] || [];
            return (
              <div key={idx} className={hideSubtopicTitles ? 'mb-5' : 'mb-8'}>
                {!hideSubtopicTitles && (
                  <h2 className={`text-base font-semibold leading-snug mb-5 ${darkMode?'text-gray-100':'text-gray-900'}`}><span className={`text-sm font-bold tabular-nums mr-2 ${darkMode?'text-yellow-500':'text-yellow-600'}`}>{String(idx+1).padStart(2,'0')}.</span>{section?.title || subtopic}</h2>
                )}
                {section?.content ? (
                  <div className={`space-y-3 ${hideSubtopicTitles?'mb-5':'mb-8'}`}>{renderLesson(section.content)}</div>
                ) : (
                  <p className={`italic text-sm mb-8 ${darkMode?'text-gray-600':'text-gray-400'}`}>Explicação não disponível para este subtópico.</p>
                )}
              </div>
            );
          })}

          {/* Fixação no final */}
          {allFixqs.length > 0 && (
            <div className={`mt-4 pt-12 border-t ${darkMode?'border-gray-800':'border-gray-100'}`}>
              <div className="flex items-center justify-between mb-8 gap-3">
                <p className={`text-xs font-bold uppercase tracking-widest ${darkMode?'text-gray-500':'text-gray-400'}`}>Questões de fixação</p>
                {canUseAcademia && (allFixAnswered || fixReviewCount>0) && (
                  <button onClick={()=>openAcademiaReview(allFixqs, fixReviewBlockId, 'Questões de fixação')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${darkMode?'border-gray-700 text-gray-400 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <RepeatIcon className="w-3.5 h-3.5"/>{fixReviewCount>0?`Gerenciar (${fixReviewCount})`:'Revisão Espaçada'}
                  </button>
                )}
              </div>
              <div className={`rounded-2xl border p-5 text-center ${darkMode?'bg-gray-900 border-gray-800':'bg-gray-50 border-gray-100'}`}>
                <p className={`text-sm mb-4 ${darkMode?'text-gray-400':'text-gray-500'}`}>{allFixqs.length} questão{allFixqs.length!==1?'s':''} de fixação disponível{allFixqs.length!==1?'is':''} no Acervo do Oráculo.</p>
                <button onClick={()=>onOpenAcademiaQuestions?.(liveSubject, liveTopic, 'fixation')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-yellow-600 text-white hover:bg-yellow-700">
                  <GraduationCap className="w-4 h-4"/>Questões de fixação
                </button>
              </div>
              {canUseAcademia && (allFixAnswered || fixReviewCount>0) && (
                <div className="text-center mt-4">
                  <button onClick={()=>openAcademiaReview(allFixqs, fixReviewBlockId, 'Questões de fixação')}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${darkMode?'border-gray-700 text-gray-400 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <RepeatIcon className="w-4 h-4"/>{fixReviewCount>0?`Gerenciar revisão (${fixReviewCount})`:'Adicionar à revisão espaçada'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Baterias extras */}
	          {(liveTopic.extraBattery||[]).map((bloco, blocoIdx) => {
	            const blocoQs = bloco.questions || bloco;
	            const blocoId = bloco.id || `legacy_${blocoIdx}`;
	            const blocoTitle = bloco.title || `Bateria ${blocoIdx+1}`;
            const reviewBlockId = `academia_extra_${liveTopic.id}_${blocoId}`;
            const blocoDone = blocoQs.length > 0 && blocoQs.every(q => hasSavedAnswer(q.id));
	            return (
	              <div key={blocoId} className={`mt-12 pt-12 border-t ${darkMode?'border-gray-800':'border-gray-100'}`}>
	                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-widest ${darkMode?'text-gray-500':'text-gray-400'}`}>{blocoTitle}</span>
                    <p className={`text-xs mt-0.5 ${darkMode?'text-gray-600':'text-gray-400'}`}>{blocoQs.length} questão{blocoQs.length!==1?'s':''}</p>
                  </div>
                  {canUseAcademia && (
                    <button title="Excluir bloco" onClick={()=>setDeleteId({type:'academia-extra-bloco', blocoId, topicId:liveTopic.id, subjectId:liveSubject.id, oracleTopicId:bloco.oracleTopicId})}
                      className={`p-2 rounded-lg transition-colors ${darkMode?'text-gray-600 hover:text-red-400':'text-gray-300 hover:text-red-500'}`}>
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  )}
	                </div>
                <div className={`rounded-2xl border p-5 text-center ${darkMode?'bg-gray-900 border-gray-800':'bg-gray-50 border-gray-100'}`}>
                  <p className={`text-sm mb-4 ${darkMode?'text-gray-400':'text-gray-500'}`}>{blocoQs.length} questão{blocoQs.length!==1?'s':''} disponível{blocoQs.length!==1?'is':''} no Acervo do Oráculo.</p>
                  <button onClick={()=>onOpenAcademiaQuestions?.(liveSubject, liveTopic, 'extra', bloco)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-yellow-600 text-white hover:bg-yellow-700">
                    <GraduationCap className="w-4 h-4"/>Abrir bloco
                  </button>
                </div>
	                {canUseAcademia && (blocoDone || reviewCount(reviewBlockId)>0) && (
	                  <div className="text-center mt-8">
	                    <button onClick={()=>openAcademiaReview(blocoQs, reviewBlockId, blocoTitle)}
	                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${darkMode?'border-gray-700 text-gray-400 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
	                      <RepeatIcon className="w-4 h-4"/>{reviewCount(reviewBlockId)>0?`Gerenciar revisão (${reviewCount(reviewBlockId)})`:'Revisão Espaçada'}
	                    </button>
	                  </div>
	                )}
	              </div>
	            );
	          })}

          {/* Gerar bateria extra */}
          <div className={`mt-16 pt-10 border-t text-center ${darkMode?'border-gray-800':'border-gray-100'}`}>
            {canUseAcademia && (
              <button onClick={()=>setAcademiaExtraModal({topic:liveTopic, subject:liveSubject})} disabled={academiaExtraBusy}
                className={`text-sm font-bold px-6 py-3 rounded-xl border-2 transition-all disabled:opacity-40 ${darkMode?'border-gray-700 text-gray-400 hover:border-yellow-600 hover:text-yellow-400':'border-gray-200 text-gray-500 hover:border-yellow-500 hover:text-yellow-600'}`}>
                {academiaExtraBusy?'Gerando...':'+ Gerar bateria extra'}
              </button>
            )}
          </div>

          {/* Regenerar */}
          {canUseAcademia && (
            <div className="mt-6 text-center">
              <button onClick={()=>setAcademiaRegenModal({topic:liveTopic, subject:liveSubject})} disabled={academiaGenerating}
                className={`text-xs opacity-30 hover:opacity-60 transition-opacity flex items-center gap-1.5 mx-auto ${darkMode?'text-gray-400':'text-gray-500'}`}>
                <RotateCcw className="w-3 h-3"/>Regenerar aula
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── FIM ACADEMIA TOPIC VIEW ─────────────────────────────────────────────────

export default function QuestionBankApp() {
  const isCanvas = window.location.hostname.includes('scf.usercontent.goog')||window.location.hostname.includes('localhost')||window.location.hostname==='127.0.0.1';

  // ── Theme ─────────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(()=>readStorageJson('qb_dark', false));
  const [menuOpen, setMenuOpen] = useState(false);   // hamburger
  const [headerVisible, setHeaderVisible] = useState(true); // hide on scroll down
  const bg    = darkMode?'bg-gray-900 text-gray-100':'bg-gray-50 text-gray-900';
  const hdr   = darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200';
  const badge = darkMode?'bg-gray-700 text-gray-200':'bg-gray-100 text-gray-800';

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [user, setUser]           = useState(null);
  const [username, setUsername]   = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loginView, setLoginView] = useState('login');
  const [sigName, setSigName]     = useState('');
  const [sigKey, setSigKey]       = useState('');

  // ── Library ───────────────────────────────────────────────────────────────
  const [library, setLibrary] = useState([]);
  const libraryRef = useRef([]);
  const academiaMirrorSyncRef = useRef(false);

  // ── Settings ──────────────────────────────────────────────────────────────
  const [settings, setSettingsS]  = useState(defaultSettings);
  const settingsRef               = useRef(defaultSettings);
  const setSettings = (s) => { setSettingsS(s); settingsRef.current=s; };
  const fontScale = Math.max(90, Math.min(130, Number(settings.fontScale) || 100));

  useEffect(() => {
    libraryRef.current = library;
  }, [library]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const [view, setView]                 = useState('library');
  const [libFilter, setLibFilter]       = useState('gemini');
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [activeTopicId, setActiveTopicId]     = useState(null);

  // ── Creator ───────────────────────────────────────────────────────────────
  const [creatorStep, setCreatorStep]   = useState(1);
  const [newSubName, setNewSubName]     = useState('');
  const [focusAreas, setFocusAreas]     = useState([]); // selected focus area IDs for current creation
  const [materialText, setMaterialText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [syllabus, setSyllabus]         = useState('');
  const [syllabusFB, setSyllabusFB]     = useState('');

  // ── UI State ──────────────────────────────────────────────────────────────
  const [isBusy, setIsBusy]           = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [externalPromptModal, setExternalPromptModal] = useState(false);
  const [loadingMsg, setLoadingMsg]   = useState('');
  const [streamCount, setStreamCount] = useState(0);
  const [deleteId, setDeleteId]       = useState(null);

  const [openAnswerModal, setOpenAnswerModal] = useState(null); // { question, onScore }

  const [errorModal, setErrorModal]   = useState(null);
  const [regenModal, setRegenModal]   = useState(false);
  const [regenPrompt, setRegenPrompt] = useState('');
  const [editingSub, setEditingSub]   = useState(null);
  const [editingSubName, setEditingSubName] = useState('');
  const [editingTopic, setEditingTopic] = useState(null);
  const [editingTopicName, setEditingTopicName] = useState('');
  const [newFolderModal, setNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState(null);
  const [libraryOpenFolders, setLibraryOpenFolders] = useState({});
  const [libraryActionMenu, setLibraryActionMenu] = useState(null);
  const [libraryDrag, setLibraryDrag] = useState(null);
  const libraryDragRef = useRef(null);
  const libraryDragCleanupRef = useRef(null);
  const suppressLibraryClickUntil = useRef(0);
  const [blockActionMenu, setBlockActionMenu] = useState(null);
  const [moveNewFolderName, setMoveNewFolderName] = useState('');
  const [moveSubjectModal, setMoveSubjectModal] = useState(null);
  const [folderReviewModal, setFolderReviewModal] = useState(null);
  const [folderReviewConfig, setFolderReviewConfig] = useState({ total:30, perTopic:5, selected:{} });
  const [bulkGenerateModal, setBulkGenerateModal] = useState(null); // { subjectId }
  const [bulkGenerateRun, setBulkGenerateRun] = useState({ running:false, current:0, total:0, logs:[] });

  // ── Paste ─────────────────────────────────────────────────────────────────
  const [pasteText, setPasteText]     = useState('');
  const [pasteSubName, setPasteSubName] = useState('');
  const [pasteTopic, setPasteTopic]   = useState('');
  const [showSubSugs, setShowSubSugs] = useState(false);

  // ── Academia do Saber ─────────────────────────────────────────────────────
  const [academiaCreatorStep, setAcademiaCreatorStep] = useState(1);
  const [academiaSubName, setAcademiaSubName]         = useState('');
  const [academiaMaterialText, setAcademiaMaterialText] = useState('');
  const [academiaUploadedFiles, setAcademiaUploadedFiles] = useState([]);
  const [academiaUploadedImages, setAcademiaUploadedImages] = useState([]);
  const [academiaSyllabus, setAcademiaSyllabus]       = useState('');
  const [academiaSyllabusFB, setAcademiaSyllabusFB]   = useState('');
  const [academiaFocusAreas, setAcademiaFocusAreas]   = useState([]);
  const academiaFileInputRef  = useRef(null);
  const academiaImageInputRef = useRef(null);
  // Academia topic view state
  const [academiaGenerating, setAcademiaGenerating]   = useState(false);
  const [academiaGenProgress, setAcademiaGenProgress] = useState('');
  const [academiaTopicAnswers, setAcademiaTopicAnswers] = useState({});
  const [academiaExtraBusy, setAcademiaExtraBusy]     = useState(false);
  const [academiaExtraModal, setAcademiaExtraModal]   = useState(null); // { topic, subject } — modal de config da bateria extra
  const [academiaRegenModal, setAcademiaRegenModal]   = useState(null); // { topic, subject }
  const [academiaRegenReason, setAcademiaRegenReason] = useState('');
  const [academiaExportModal, setAcademiaExportModal] = useState(null); // { topic, subject }
  const [errorReviewModal, setErrorReviewModal]       = useState(null); // { subject, topic, questions, notebookIds, sourceLabel }
  const [errorReviewQStyle, setErrorReviewQStyle]     = useState('mixed');
  const [errorReviewQTypes, setErrorReviewQTypes]     = useState(['direct']);
  const [errorReviewQAlts, setErrorReviewQAlts]       = useState(5);
  const [academiaExtraQStyle, setAcademiaExtraQStyle] = useState('mixed');
  const [academiaExtraQTypes, setAcademiaExtraQTypes] = useState(['direct']);
  const [academiaExtraQAlts, setAcademiaExtraQAlts]   = useState(5);
  const [academiaRegenLength, setAcademiaRegenLength] = useState('complete');
  const [academiaRegenQStyle, setAcademiaRegenQStyle] = useState('mixed');
  const [academiaRegenQTypes, setAcademiaRegenQTypes] = useState(['direct']);
  const [academiaRegenQAlts, setAcademiaRegenQAlts]   = useState(5);

  // ── Features ──────────────────────────────────────────────────────────────
  const [showOnlyWrong, setShowOnlyWrong] = useState(false);

  // Whitelist de videoaulas — carregada do Firestore
  const [allowedEmails, setAllowedEmails]       = useState([]);
  const [newWhitelistEmail, setNewWhitelistEmail] = useState('');
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const canSeeVideoaulas = user?.email ? allowedEmails.map(e=>e.toLowerCase()).includes(user.email.toLowerCase()) : false;
  const canUseAcademia = isAdmin || canSeeVideoaulas;
  const canUseAdvancedFeatures = canUseAcademia;

  // Exam
  const [examSetup, setExamSetup]       = useState(null);
  const [activeExam, setActiveExam]     = useState(null);
  const [examTime, setExamTime]         = useState(60);
  const [examQCount, setExamQCount]     = useState(30);
  const [examTopics, setExamTopics]     = useState([]);
  const [examOpenFolders, setExamOpenFolders] = useState({});
  const [examOpenSubjects, setExamOpenSubjects] = useState({});
  const [examBlind, setExamBlind]       = useState(false); // show corrections after finish

  // Stats
  const [statsExpanded, setStatsExpanded] = useState({});

  // Export
  const [exportModal, setExportModal]   = useState(null); // { topic, subject }

  // Bizuário
  const [bizuarioModal, setBizuarioModal] = useState(null); // { topicTitle, subjectTitle, cachedText, onSave }

  const fileInputRef  = useRef(null);
  const imageInputRef = useRef(null);

  // Videoaulas
  const [videoaulasData, setVideoaulasData] = useState(null);  // JSON do Firestore
  const [videoaulasLoading, setVideoaulasLoading] = useState(false);
  const [activeSubjectVid, setActiveSubjectVid] = useState(null);
  const [activeSubtopicVid, setActiveSubtopicVid] = useState(null);
  const [activeAula, setActiveAula] = useState(null);
  const [videoSeek, setVideoSeek]   = useState(null); // null = não forçar tempo, número = seek em segundos
  const videoFrameRef = useRef(null);
  const videoWatchRef = useRef({ aulaId:null, last:null });
  // Resetar seek ao trocar de aula
  const setActiveAulaAndReset = (aula) => { setActiveAula(aula); setVideoSeek(null); };
  const [watchedAulas, setWatchedAulas] = useState({});  // { bunny_id: true }
  const [expandedSubjectsVid, setExpandedSubjectsVid] = useState({});
  const [mobileNavOpen, setMobileNavOpen] = useState(false); // subject/subtopic picker on mobile

  // Questões do Curso (videoaulas)
  const [vqSubject, setVqSubject]   = useState(null);
  const [vqTopic, setVqTopic]       = useState(null);
  const [vqAula, setVqAula]         = useState(null);
  const [vqBlocks, setVqBlocks]     = useState({});
  const [vqLoading, setVqLoading]   = useState(false);   // carregamento do Firestore
  const [vqSyllabusLoading, setVqSyllabusLoading] = useState(false); // geração do sumário
  const [vqGenModal, setVqGenModal] = useState(null);
  const [toasts, setToasts] = useState([]); // notificações toast
  const [dailyStats, setDailyStats] = useState({date:getTodayKey(),questionKeys:{},lessonIntervals:{}});
  const dailyStatsRef = useRef(dailyStats);
  const dailyStatsSaveTimer = useRef(null);
  const academiaOracleMigratedRef = useRef(false);
  const [vqActiveBlock, setVqActiveBlock] = useState(null);
  const [vqActiveBlockView, setVqActiveBlockView] = useState(null); // { aulaId, blockId } — view página completa do bloco
  const [vqExpandedSubj, setVqExpandedSubj] = useState({});
  const [vqExpandedTopic, setVqExpandedTopic] = useState({});

  // Portal do Curso — aba ativa e cronograma
  const [cursoTab, setCursoTab]           = useState('videoaulas');
  const [reviewQueue, setReviewQueue]     = useState({});  // { aulaId: { blockId: { qId: { interval, dueDate, seed } } } }
  const reviewQueueRef = useRef({});
  const [reviewLoaded, setReviewLoaded]   = useState(false);
  const [resetCourseModal, setResetCourseModal] = useState(false);
  const [resetCourseInput, setResetCourseInput] = useState('');
  const RESET_CONFIRM_WORD = 'APAGAR';
  const [srModal, setSrModal]             = useState(null);  // modal de adicionar à revisão
  const [reviewSession, setReviewSession] = useState(null);  // sessão ativa de revisão
  const [cronograma, setCronograma]       = useState(null);   // array de 46 semanas
  const [cronLoading, setCronLoading]     = useState(false);
  const [curWeek, setCurWeek]             = useState(null);   // semana selecionada no cronograma
  const [cronStartDate, setCronStartDate] = useState(null);   // data de início do curso (salva no Firestore)

  useEffect(() => {
    reviewQueueRef.current = reviewQueue;
  }, [reviewQueue]);

  // Load videoaulas: carrega UMA VEZ no login e usa localStorage como cache entre sessões
  const videoaulasLoadedRef = useRef(false);
  useEffect(() => {
    if (!user || user.isAnonymous || videoaulasLoadedRef.current) return;

    // Tentar cache do localStorage primeiro (evita loading na abertura)
    const cacheKey = `agora_videoaulas_${user.uid}`;
    const watchedKey = `agora_watched_${user.uid}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      const cachedWatched = localStorage.getItem(watchedKey);
      if (cached) {
        setVideoaulasData(JSON.parse(cached));
        if (cachedWatched) setWatchedAulas(JSON.parse(cachedWatched));
        videoaulasLoadedRef.current = true;
        // Recarrega em background silenciosamente para atualizar cache
        refreshVideoaulasInBackground(user, cacheKey, watchedKey);
        return;
      }
    } catch(e) {}

    // Sem cache — carrega normalmente com loading
    videoaulasLoadedRef.current = true;
    setVideoaulasLoading(true);
    refreshVideoaulasInBackground(user, cacheKey, watchedKey, true);
  }, [user]); // eslint-disable-line

  // Resetar ao fazer logout
  useEffect(() => {
    if (!user) { videoaulasLoadedRef.current = false; }
  }, [user]);

  const refreshVideoaulasInBackground = async (u, cacheKey, watchedKey, showLoading=false) => {
    try {
      const snap = await getDocs(collection(db, 'lessons'));
      if (!snap.empty) {
        const built = {};
        snap.forEach(d => {
          const data = d.data();
          const subj  = data.subject;
          const topic = data.topic;
          const isBonus = !!data.is_bonus;
          if (!subj || !topic) return;
          if (!built[subj]) built[subj] = {};
          if (!built[subj][topic]) built[subj][topic] = { 'Aulas Principais': [], 'Bônus': [] };
          const aula = {
            title:             data.title,
            embed_url:         data.embed_url,
            bunny_id:          data.bunny_id,
            duration_seconds:  data.duration_seconds  || 0,
            duration_formatted:data.duration_formatted || '',
          };
          if (isBonus) built[subj][topic]['Bônus'].push(aula);
          else         built[subj][topic]['Aulas Principais'].push(aula);
        });
        Object.values(built).forEach(topics =>
          Object.values(topics).forEach(cats =>
            Object.values(cats).forEach(arr =>
              arr.sort((a,b) => a.title.localeCompare(b.title, 'pt'))
            )
          )
        );
        setVideoaulasData(built);
        try { localStorage.setItem(cacheKey, JSON.stringify(built)); } catch(e) {}
      } else {
        setVideoaulasData({});
      }
      const ps = await getDoc(doc(db, 'users', u.uid, 'videoaulas_progress', 'watched'));
      if (ps.exists()) {
        const w = ps.data() || {};
        setWatchedAulas(w);
        try { localStorage.setItem(watchedKey, JSON.stringify(w)); } catch(e) {}
      }
    } catch(e) { console.error(e); if (showLoading) setVideoaulasData({}); }
    finally { if (showLoading) setVideoaulasLoading(false); }
  };

  const markAulaWatched = async (bunnyId, aula = null) => {
    if (!bunnyId) return;
    const already = !!watchedAulas[bunnyId];
    const u = { ...watchedAulas };
    if (already) { delete u[bunnyId]; } else { u[bunnyId] = true; recordLessonInterval(bunnyId, 0, aula?.duration_seconds || 0, true); }
    setWatchedAulas(u);
    addToast(already ? 'Aula desmarcada como assistida.' : 'Aula marcada como assistida.', already ? 'info' : 'success', 2500);
    // Atualizar cache local imediatamente
    if (user) try { localStorage.setItem(`agora_watched_${user.uid}`, JSON.stringify(u)); } catch(e) {}
    if (user && !user.isAnonymous) try {
      await setDoc(doc(db,'users',user.uid,'videoaulas_progress','watched'), u);
    } catch(e) {
      addToast('Não consegui sincronizar agora, mas salvei no aparelho.', 'info', 3500);
    }
  };

  const resetWatchedProgress = async () => {
    setWatchedAulas({});
    if (user && !user.isAnonymous) try {
      await setDoc(doc(db,'users',user.uid,'videoaulas_progress','watched'), {});
    } catch(e) {}
  };

  const persistDailyStats = (next, immediate=false) => {
    dailyStatsRef.current = next;
    setDailyStats(next);
    if (user) {
      try { localStorage.setItem(`agora_daily_stats_${user.uid}_${next.date}`, JSON.stringify(next)); } catch(e) {}
    }
    if (!user || user.isAnonymous) return;
    clearTimeout(dailyStatsSaveTimer.current);
    const save = () => setDoc(doc(db, 'users', user.uid, 'daily_stats', next.date), next, {merge:false}).catch(()=>{});
    if (immediate) save();
    else dailyStatsSaveTimer.current = setTimeout(save, 1200);
  };

  const ensureTodayStats = () => {
    const today = getTodayKey();
    const cur = dailyStatsRef.current || {};
    if (cur.date === today) return {
      date: today,
      questionKeys: cur.questionKeys || {},
      lessonIntervals: cur.lessonIntervals || {},
    };
    const fresh = {date:today, questionKeys:{}, lessonIntervals:{}};
    persistDailyStats(fresh, false);
    return fresh;
  };

  const trackQuestionAnswered = (key) => {
    if (!canUseAdvancedFeatures || !key) return;
    const cur = ensureTodayStats();
    if (cur.questionKeys?.[key]) return;
    persistDailyStats({...cur, questionKeys:{...(cur.questionKeys||{}), [key]:Date.now()}}, true);
  };

  const recordLessonInterval = (aulaId, fromSec, toSec, allowLong=false) => {
    if (!canUseAdvancedFeatures || !aulaId) return;
    const start = Math.max(0, Number(fromSec) || 0);
    const end = Math.max(0, Number(toSec) || 0);
    if (end - start < 1 || (!allowLong && end - start > 30)) return;
    const cur = ensureTodayStats();
    const before = cur.lessonIntervals?.[aulaId] || [];
    const merged = mergeIntervals([...before, [start, end]]);
    if (sumIntervalsSeconds(merged) === sumIntervalsSeconds(before)) return;
    persistDailyStats({...cur, lessonIntervals:{...(cur.lessonIntervals||{}), [aulaId]:merged}}, false);
  };

  useEffect(() => {
    const today = getTodayKey();
    const empty = {date:today, questionKeys:{}, lessonIntervals:{}};
    if (!user || user.isAnonymous) {
      dailyStatsRef.current = empty;
      setDailyStats(empty);
      return;
    }
    const cacheKey = `agora_daily_stats_${user.uid}_${today}`;
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (cached?.date === today) {
        dailyStatsRef.current = {...empty, ...cached, questionKeys:cached.questionKeys||{}, lessonIntervals:cached.lessonIntervals||{}};
        setDailyStats(dailyStatsRef.current);
      }
    } catch(e) {}
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'daily_stats', today));
        if (snap.exists()) {
          const data = snap.data() || {};
          const loaded = {...empty, ...data, questionKeys:data.questionKeys||{}, lessonIntervals:data.lessonIntervals||{}};
          dailyStatsRef.current = loaded;
          setDailyStats(loaded);
          try { localStorage.setItem(cacheKey, JSON.stringify(loaded)); } catch(e) {}
        }
      } catch(e) {}
    })();
  }, [user]);

  useEffect(() => {
    if (!canUseAdvancedFeatures || view !== 'videoaulas' || !activeAula) return;
    const aulaId = getAulaId(activeAula);
    if (!aulaId) return;
    videoWatchRef.current = { aulaId, last:null };
    const readSeconds = (raw) => {
      const data = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch(e) { return null; } })() : raw;
      if (!data) return null;
      const payload = data.data && typeof data.data === 'object' ? data.data : data;
      const seconds = payload.seconds ?? payload.currentTime ?? payload.time ?? payload.position ?? data.seconds ?? data.currentTime;
      const n = Number(seconds);
      return Number.isFinite(n) ? n : null;
    };
    const onMessage = (event) => {
      if (videoFrameRef.current?.contentWindow && event.source !== videoFrameRef.current.contentWindow) return;
      const seconds = readSeconds(event.data);
      if (seconds == null) return;
      const cur = videoWatchRef.current;
      if (cur.aulaId !== aulaId) return;
      if (cur.last != null && seconds > cur.last) recordLessonInterval(aulaId, cur.last, seconds);
      videoWatchRef.current = { aulaId, last:seconds };
    };
    window.addEventListener('message', onMessage);
    const subscribe = () => {
      const win = videoFrameRef.current?.contentWindow;
      if (!win) return;
      [
        {event:'command', func:'addEventListener', args:['timeupdate']},
        {context:'player.js', version:'0.0.11', event:'command', func:'addEventListener', args:['timeupdate']},
      ].forEach(msg => {
        try { win.postMessage(JSON.stringify(msg), '*'); } catch(e) {}
        try { win.postMessage(msg, '*'); } catch(e) {}
      });
    };
    const t1 = setTimeout(subscribe, 800);
    const t2 = setInterval(subscribe, 4000);
    return () => {
      clearTimeout(t1);
      clearInterval(t2);
      window.removeEventListener('message', onMessage);
    };
  }, [canUseAdvancedFeatures, view, activeAula?.bunny_id, activeAula?.embed_url]);

  // Load cronograma from Firestore — carrega UMA VEZ no login com cache localStorage
  const cronLoadedRef = useRef(false);
  useEffect(() => {
    if (!user || user.isAnonymous || cronLoadedRef.current) return;
    cronLoadedRef.current = true;

    const cacheKey = `agora_cronograma_${user.uid}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setCronograma(JSON.parse(cached));
        // Carregar prefs do usuário (data de início) em background
        getDoc(doc(db, 'users', user.uid, 'curso_prefs', 'main')).then(prefSnap => {
          if (prefSnap.exists() && prefSnap.data().startDate) setCronStartDate(prefSnap.data().startDate);
        }).catch(()=>{});
        return;
      }
    } catch(e) {}

    // Sem cache — carrega do Firestore
    setCronLoading(true);
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'cronograma'));
        const weeks = [];
        snap.forEach(d => weeks.push(d.data()));
        weeks.sort((a,b) => a.week - b.week);
        setCronograma(weeks);
        try { localStorage.setItem(cacheKey, JSON.stringify(weeks)); } catch(e) {}
        const prefSnap = await getDoc(doc(db, 'users', user.uid, 'curso_prefs', 'main'));
        if (prefSnap.exists() && prefSnap.data().startDate) setCronStartDate(prefSnap.data().startDate);
      } catch(e) { setCronograma([]); }
      finally { setCronLoading(false); }
    })();
  }, [user]); // eslint-disable-line

  // Resetar ao logout
  useEffect(() => {
    if (!user) cronLoadedRef.current = false;
  }, [user]);

  // Load reviewQueue — carrega uma vez no login
  useEffect(() => {
    if (!user || user.isAnonymous || reviewLoaded) return;
    setReviewLoaded(true);
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'vq_review'));
        const loaded = {};
        snap.forEach(d => { loaded[d.id] = d.data(); });
        reviewQueueRef.current = loaded;
        setReviewQueue(loaded);
      } catch(e) {}
    })();
  }, [user]); // eslint-disable-line

  useEffect(() => {
    if (!user) { setReviewLoaded(false); reviewQueueRef.current = {}; setReviewQueue({}); }
  }, [user]);

  const saveCronStartDate = async (dateStr) => {
    setCronStartDate(dateStr);
    if (user && !user.isAnonymous) try {
      await setDoc(doc(db, 'users', user.uid, 'curso_prefs', 'main'), { startDate: dateStr }, { merge: true });
    } catch(e) {}
  };

  // Calcula semana atual baseada na data de início
  const getCurrentWeek = () => {
    if (!cronStartDate) return null;
    const start = new Date(cronStartDate);
    const now = new Date();
    const diffMs = now - start;
    if (diffMs < 0) return 1;
    return Math.min(46, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1);
  };

  // ── Revisão Espaçada ───────────────────────────────────────────────────────
  const SR_INTERVALS = [3, 7, 14, 30, 90]; // dias
  const MS_DAY = 86400000;

  const saveReviewQueue = async (updated) => {
    reviewQueueRef.current = updated;
    setReviewQueue(updated);
    // Persiste cada aulaId como doc separado
    if (!user || user.isAnonymous) return;
    // Calcular diffs para salvar apenas os que mudaram
    for (const [aulaId, data] of Object.entries(updated)) {
      try { await setDoc(doc(db, 'users', user.uid, 'vq_review', aulaId), data); } catch(e) {}
    }
  };

  // Adiciona questões selecionadas à fila de revisão
  const addToReview = async (aulaId, blockId, selectedQIds, questions, meta = {}) => {
    const now = Date.now();
    const queue = reviewQueueRef.current || {};
    const cur = queue[aulaId] || {};
    const curBlock = cur[blockId] || {};
    const updated = { ...cur, [blockId]: { ...curBlock } };
    selectedQIds.forEach(qId => {
      const q = questions.find(x => x.id === qId);
      if (!updated[blockId][qId]) {
        updated[blockId][qId] = {
          interval: 0,
          dueDate: now + SR_INTERVALS[0] * MS_DAY,
          reviewSeed: Math.floor(Math.random() * 999999),
          source: meta.source || 'curso',
          subjectId: meta.subjectId || null,
          topicId: meta.topicId || null,
          aulaTitle: meta.aulaTitle || meta.subjectTitle || null,
          blockTitle: meta.blockTitle || null,
          question: q ? { ...q } : null,
        };
      }
    });
    await saveReviewQueue({ ...queue, [aulaId]: updated });
  };

  const updateReviewMembership = async (aulaId, blockId, selectedQIds = [], removeQIds = [], questions = [], meta = {}) => {
    const now = Date.now();
    const queue = reviewQueueRef.current || {};
    const cur = queue[aulaId] || {};
    const curBlock = cur[blockId] || {};
    const nextBlock = { ...curBlock };
    removeQIds.forEach(qId => delete nextBlock[qId]);
    selectedQIds.forEach(qId => {
      const q = questions.find(x => x.id === qId);
      if (!nextBlock[qId]) {
        nextBlock[qId] = {
          interval: 0,
          dueDate: now + SR_INTERVALS[0] * MS_DAY,
          reviewSeed: Math.floor(Math.random() * 999999),
          source: meta.source || 'curso',
          subjectId: meta.subjectId || null,
          topicId: meta.topicId || null,
          aulaTitle: meta.aulaTitle || meta.subjectTitle || null,
          blockTitle: meta.blockTitle || null,
          question: q ? { ...q } : null,
        };
      }
    });
    await saveReviewQueue({ ...queue, [aulaId]: { ...cur, [blockId]: nextBlock } });
  };

  // Atualiza após responder uma questão na revisão (acerto avança, erro volta)
  const updateReviewItem = async (aulaId, blockId, qId, correct) => {
    const queue = reviewQueueRef.current || {};
    const cur = queue[aulaId] || {};
    const item = cur[blockId]?.[qId];
    if (!item) return;
    const newInterval = correct
      ? Math.min(item.interval + 1, SR_INTERVALS.length - 1)
      : 0;
    const newDue = Date.now() + SR_INTERVALS[newInterval] * MS_DAY;
    const updated = {
      ...cur,
      [blockId]: { ...cur[blockId], [qId]: { ...item, interval: newInterval, dueDate: newDue, reviewSeed: Math.floor(Math.random() * 999999) } }
    };
    await saveReviewQueue({ ...queue, [aulaId]: updated });
  };

  // Remove questão da fila de revisão
  const removeFromReview = async (aulaId, blockId, qId) => {
    const queue = reviewQueueRef.current || {};
    const cur = queue[aulaId] || {};
    const updBlock = { ...(cur[blockId] || {}) };
    delete updBlock[qId];
    const updated = { ...cur, [blockId]: updBlock };
    await saveReviewQueue({ ...queue, [aulaId]: updated });
  };

  const removeManyFromReview = async (aulaId, blockId, qIds = []) => {
    if (!qIds.length) return;
    const queue = reviewQueueRef.current || {};
    const cur = queue[aulaId] || {};
    const updBlock = { ...(cur[blockId] || {}) };
    qIds.forEach(qId => delete updBlock[qId]);
    const updated = { ...cur, [blockId]: updBlock };
    await saveReviewQueue({ ...queue, [aulaId]: updated });
  };

  // Retorna todas as questões com revisão vencida hoje
  const getDueReviews = () => {
    const now = Date.now();
    const due = [];
    const resolveFromLibrary = (item, qId) => {
      if (item?.question) return item.question;
      const subj = library.find(s => String(s.id) === String(item?.subjectId));
      const topic = subj?.topics?.find(t => String(t.id) === String(item?.topicId));
      if (!topic) return null;
      const questions = subj.source === 'academia'
        ? Object.values(topic.fixationQuestions || {}).flat().concat((topic.extraBattery || []).flatMap(b => b.questions || b))
        : (topic.questions || []);
      return questions.find(q => q.id === qId) || null;
    };
    Object.entries(reviewQueue).forEach(([aulaId, blocks]) => {
      const aulaData = vqBlocks[aulaId];
      Object.entries(blocks).forEach(([blockId, qMap]) => {
        const block = aulaData?.blocks?.[blockId];
        const questions = Array.isArray(block?.questions) ? block.questions : [];
        Object.entries(qMap).forEach(([qId, item]) => {
          if (item.dueDate <= now) {
            const q = questions.find(x => x.id === qId) || resolveFromLibrary(item, qId);
            if (q) due.push({
              aulaId,
              blockId,
              qId,
              item,
              question: q,
              aulaTitle: item.aulaTitle || aulaData?.meta?.aulaTitle,
              blockTitle: item.blockTitle || block?.title,
              source: item.source || (aulaData ? 'curso' : 'oraculo'),
              subjectId: item.subjectId,
              topicId: item.topicId,
            });
          }
        });
      });
    });
    return due.sort((a, b) => a.item.dueDate - b.item.dueDate);
  };

  const isReviewItemFavorite = (reviewItem) => {
    if (!reviewItem) return false;
    if ((reviewItem.source || reviewItem.item?.source) === 'curso' || vqBlocks[reviewItem.aulaId]) {
      const block = vqBlocks[reviewItem.aulaId]?.blocks?.[reviewItem.blockId];
      return (block?.favorites || []).includes(reviewItem.qId);
    }
    const subj = library.find(s => String(s.id) === String(reviewItem.subjectId || reviewItem.item?.subjectId));
    const topic = subj?.topics?.find(t => String(t.id) === String(reviewItem.topicId || reviewItem.item?.topicId));
    return (topic?.favorites || []).includes(reviewItem.qId);
  };

  const toggleReviewFavorite = async (reviewItem) => {
    if (!reviewItem) return;
    if ((reviewItem.source || reviewItem.item?.source) === 'curso' || vqBlocks[reviewItem.aulaId]) {
      const aulaData = vqBlocks[reviewItem.aulaId];
      const block = aulaData?.blocks?.[reviewItem.blockId];
      if (!aulaData || !block) return;
      await saveVqBlock(reviewItem.aulaId, {...aulaData, blocks:{...aulaData.blocks,[reviewItem.blockId]:{...block,favorites:toggleInList(block.favorites||[], reviewItem.qId)}}});
      return;
    }
    const subj = library.find(s => String(s.id) === String(reviewItem.subjectId || reviewItem.item?.subjectId));
    const topic = subj?.topics?.find(t => String(t.id) === String(reviewItem.topicId || reviewItem.item?.topicId));
    if (!subj || !topic) return;
    await updateSubject({...subj, topics:subj.topics.map(t=>t.id===topic.id?{...t,favorites:toggleInList(t.favorites||[], reviewItem.qId)}:t)});
  };

  const getReviewOrigin = (reviewItem) => {
    if (!reviewItem) return {};
    if ((reviewItem.source || reviewItem.item?.source) === 'curso' || vqBlocks[reviewItem.aulaId]) {
      const aulaData = vqBlocks[reviewItem.aulaId];
      const block = aulaData?.blocks?.[reviewItem.blockId];
      return { type:'curso', aulaData, block };
    }
    const subj = library.find(s => String(s.id) === String(reviewItem.subjectId || reviewItem.item?.subjectId));
    const topic = subj?.topics?.find(t => String(t.id) === String(reviewItem.topicId || reviewItem.item?.topicId));
    return { type:'library', subj, topic };
  };

  const isReviewItemInNotebook = (reviewItem) => {
    const origin = getReviewOrigin(reviewItem);
    if (origin.type === 'curso') return (origin.block?.errorNotebook || []).includes(reviewItem.qId);
    return (origin.topic?.errorNotebook || []).includes(reviewItem.qId);
  };

  const setReviewNotebook = async (reviewItem, mode = 'toggle') => {
    if (!canUseAdvancedFeatures || !reviewItem) return;
    const origin = getReviewOrigin(reviewItem);
    const nextList = (list) => mode === 'add' ? addToList(list || [], reviewItem.qId) : toggleInList(list || [], reviewItem.qId);
    if (origin.type === 'curso') {
      if (!origin.aulaData || !origin.block) return;
      await saveVqBlock(reviewItem.aulaId, {...origin.aulaData, blocks:{...origin.aulaData.blocks,[reviewItem.blockId]:{...origin.block,errorNotebook:nextList(origin.block.errorNotebook)}}});
      return;
    }
    if (!origin.subj || !origin.topic) return;
    await updateSubject({...origin.subj, topics:origin.subj.topics.map(t=>t.id===origin.topic.id?{...t,errorNotebook:nextList(t.errorNotebook)}:t)});
  };

  // Total de revisões pendentes (para badge)
  const dueCount = getDueReviews().length;
  // Load vqBlocks — carrega UMA VEZ quando o usuário loga, não a cada troca de view
  const vqBlocksLoadedRef = useRef(false);
  useEffect(() => {
    if (!user || user.isAnonymous || vqBlocksLoadedRef.current) return;
    vqBlocksLoadedRef.current = true;
    (async () => {
      setVqLoading(true);
      try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'vq_blocks'));
        const loaded = {};
        snap.forEach(d => { loaded[d.id] = d.data(); });
        setVqBlocks(loaded);
      } catch(e) { console.error('vqBlocks load error:', e); }
      finally { setVqLoading(false); }
    })();
  }, [user]); // eslint-disable-line

  // Resetar o cache quando o usuário faz logout
  useEffect(() => {
    if (!user) { vqBlocksLoadedRef.current = false; setVqBlocks({}); }
  }, [user]);

  // Save a single aula's vqBlock data to Firestore
  const resetCourseProgress = async () => {
    if (!user || user.isAnonymous) return;
    try {
      // 1. Clear watched status
      await setDoc(doc(db,'users',user.uid,'videoaulas_progress','watched'), {});
      setWatchedAulas({});
      localStorage.removeItem(`agora_watched_${user.uid}`);

      // 2. Delete all vq_blocks docs
      const blocksSnap = await getDocs(collection(db,'users',user.uid,'vq_blocks'));
      await Promise.all(blocksSnap.docs.map(d => deleteDoc(d.ref)));
      setVqBlocks({});

      // 3. Delete all vq_review docs
      const reviewSnap = await getDocs(collection(db,'users',user.uid,'vq_review'));
      await Promise.all(reviewSnap.docs.map(d => deleteDoc(d.ref)));
      reviewQueueRef.current = {};
      setReviewQueue({});

      setResetCourseModal(false);
      setResetCourseInput('');
      addToast('Progresso do curso apagado com sucesso.', 'success', 5000);
    } catch(e) {
      console.error('Reset failed:', e);
      addToast('Erro ao apagar progresso. Tente novamente.', 'info', 4000);
    }
  };

  const saveVqBlock = async (aulaId, data) => {
    const updated = { ...vqBlocks, [aulaId]: data };
    setVqBlocks(updated);
    if (user && !user.isAnonymous) try {
      await setDoc(doc(db, 'users', user.uid, 'vq_blocks', aulaId), data);
    } catch(e) {}
  };

  // Build stable Firestore document ID — tenta bunny_id primeiro, depois título sanitizado (legacy)
  const aulaDocId = (aula) => {
    if (!aula) return 'unknown';
    if (aula.bunny_id) return aula.bunny_id;
    return (aula.title || '').replace(/\//g, '-').replace(/[^a-zA-Z0-9\-_]/g, '').trim().substring(0, 100) || 'unknown';
  };

  // Dado um aula, retorna a chave que de fato existe em vqBlocks (bunny_id ou título legacy)
  // Sempre retorna UMA chave determinística — nunca null para aulas válidas
  const aulaVqKey = (aula) => {
    if (!aula) return null;
    // 1. bunny_id exato
    if (aula.bunny_id && vqBlocks[aula.bunny_id]) return aula.bunny_id;
    // 2. título sanitizado sem espaços
    const titleKey = (aula.title || '').replace(/\//g, '-').replace(/[^a-zA-Z0-9\-_]/g, '').trim().substring(0, 100);
    if (vqBlocks[titleKey]) return titleKey;
    // 3. título sanitizado com espaços (formato mais antigo)
    const titleKeyOld = (aula.title || '').replace(/\//g, '-').replace(/[^a-zA-Z0-9\-_ ]/g, '').trim().substring(0, 100);
    if (vqBlocks[titleKeyOld]) return titleKeyOld;
    // 4. fallback preferencial — bunny_id é o formato novo padrão de escrita
    return aula.bunny_id || titleKey || 'unknown';
  };

  // Verifica se uma aula tem dados em vqBlocks (independente do formato da chave)
  const aulaHasVqData = (aula) => {
    if (!aula) return false;
    if (aula.bunny_id && vqBlocks[aula.bunny_id]?.meta?.totalQuestions) return true;
    const titleKey = (aula.title || '').replace(/\//g, '-').replace(/[^a-zA-Z0-9\-_]/g, '').trim().substring(0, 100);
    if (vqBlocks[titleKey]?.meta?.totalQuestions) return true;
    const titleKeyOld = (aula.title || '').replace(/\//g, '-').replace(/[^a-zA-Z0-9\-_ ]/g, '').trim().substring(0, 100);
    if (vqBlocks[titleKeyOld]?.meta?.totalQuestions) return true;
    return false;
  };



  useEffect(()=>{
    document.title='Ágora do Saber';
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><polygon points="12 2 2 7 22 7 12 2"/><line x1="6" x2="6" y1="21" y2="7"/><line x1="10" x2="10" y1="21" y2="7"/><line x1="14" x2="14" y1="21" y2="7"/><line x1="18" x2="18" y1="21" y2="7"/><line x1="2" x2="22" y1="21" y2="21"/></svg>`;
    let lnk=document.querySelector("link[rel~='icon']")||document.createElement('link');
    lnk.rel='icon'; lnk.href=`data:image/svg+xml;base64,${window.btoa(svg)}`;
    if(!document.querySelector("link[rel~='icon']")) document.head.appendChild(lnk);
    document.body.style.backgroundColor=darkMode?'#111827':'#fafaf9';
    writeStorageJson('qb_dark', darkMode);
  },[darkMode]);

  useEffect(() => {
    const scale = Math.max(90, Math.min(130, Number(settings.fontScale) || 100));
    writeStorageText('qb_font_scale', String(scale));
  }, [settings.fontScale]);

  // Android/browser back button — navigates within the app instead of leaving
  useEffect(() => {
    const handlePop = (e) => {
      if (view === 'library') return; // allow leaving the site from home
      e.preventDefault();
      // Navigate back logically
      if (view === 'topic')        { setView('subject'); return; }
      if (view === 'academia-topic') { setView('subject'); return; }
      if (view === 'subject')      { setView('sub-library'); return; }
      if (view === 'sub-library')  { setView('library'); return; }
      if (view === 'creator')      { setCreatorStep(1); setView('library'); return; }
      if (view === 'academia-creator') { setAcademiaCreatorStep(1); setView('library'); return; }
      setView('library');
    };
    // Push a state so back button fires popstate instead of leaving
    if (view !== 'library') window.history.pushState({ view }, '');
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [view]); // eslint-disable-line
  useEffect(()=>{
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY && y > 60) setHeaderVisible(false);
      else setHeaderVisible(true);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Exam timer
  useEffect(()=>{
    if(!activeExam||activeExam.finished) return;
    const t=setInterval(()=>setActiveExam(p=>{
      if(!p) return p;
      if(p.timeLeft>0) return {...p,timeLeft:p.timeLeft-1};
      // Bug 5: mark unanswered as SKIPPED when time runs out
      const skipped={};
      p.questions.forEach(q=>{ if(!p.answers[q.id]) skipped[q.id]='SKIPPED'; });
      return {...p,finished:true,answers:{...p.answers,...skipped}};
    }),1000);
    return ()=>clearInterval(t);
  },[activeExam?.id]);

  // Keyboard shortcuts
  useEffect(()=>{
    const handleKey = (e) => {
      if (e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
      if (view!=='topic'||!activeTopic) return;
      const unanswered = displayedQs.find(q=>!activeTopic.answers?.[q.id]);
      if (!unanswered) return;
      const map={a:'A',b:'B',c:'C',d:'D',e:'E','1':'A','2':'B','3':'C','4':'D','5':'E'};
      if (map[e.key?.toLowerCase()]) handleAnswer(unanswered.id, map[e.key.toLowerCase()]);
    };
    window.addEventListener('keydown',handleKey);
    return ()=>window.removeEventListener('keydown',handleKey);
  });

  // Auth
  useEffect(()=>{
    let mounted = true;
    const applyAuthUser = async (u) => {
      if (!mounted) return;
      if (u) {
        setUser(u);
        if (u.isAnonymous) {
          const ln=readStorageText('qb_username', '');
          if (ln) {
            setUsername(ln.toUpperCase());
            const savedSettings = readStorageJson(`qb_settings_${ln}`, null);
            if(savedSettings) setSettings(buildSettingsWithGeminiRecovery(savedSettings, '', ln));
          }
          else setLoginView('signup');
        } else {
          try {
            const ud=await getDoc(doc(db,'users',u.uid));
            if(ud.exists()){const d=ud.data();const uname=d.username||u.email||'';setUsername(uname.toUpperCase());setSettings(buildSettingsWithGeminiRecovery(d.settings||{}, d.apiKey||'', uname));}
            else setLoginView('signup');
          } catch(e){
            console.error('Failed to load user profile after login:', e);
            const fallbackName = u.email || u.displayName || 'USUARIO';
            setUsername(fallbackName.toUpperCase());
            const savedSettings = readStorageJson(`qb_settings_${fallbackName.toUpperCase()}`, null);
            if(savedSettings) setSettings(buildSettingsWithGeminiRecovery(savedSettings, '', fallbackName.toUpperCase()));
            setErrorModal({
              title:'Perfil carregado parcialmente',
              message:`Login feito, mas não consegui carregar seu perfil completo no Firestore.\n\nFirebase: ${e?.code || 'sem-codigo'}\n${e?.message || ''}`,
              isAlert:true,
            });
          }
        }
      } else { setUser(null);setUsername(null);setLoginView('login'); }
    };
    setPersistence(auth, browserLocalPersistence).catch(e => console.error('Failed to set auth persistence:', e));
    getRedirectResult(auth)
      .then(async result => {
        console.log('Google redirect result:', result?.user?.email || result?.user?.uid || 'empty');
        if (result?.user) await applyAuthUser(result.user);
      })
      .catch(e => {
        console.error('Google redirect login failed:', e);
        if (mounted) setErrorModal({ title:'Erro no login Google', message:authErrorMessage(e), isAlert:true });
      });
    const unsub = onAuthStateChanged(auth, async(u)=>{
      await applyAuthUser(u);
      setAuthReady(true);
      // Carregar whitelist de videoaulas do Firestore (público, qualquer usuário pode ler)
      try {
        const wSnap = await getDoc(doc(db, 'config', 'videoaulas_whitelist'));
        if (wSnap.exists()) setAllowedEmails(wSnap.data().emails || []);
        else setAllowedEmails([ADMIN_EMAIL]); // fallback: só o admin
      } catch(e) { setAllowedEmails([ADMIN_EMAIL]); }
    });
    return ()=>{ mounted = false; unsub(); };
  },[]);

  // Library sync
  useEffect(()=>{
    if(!user||!username) return;
    const defFolder=[{id:'imported-folder',title:'Pergaminhos Diversos',fullSyllabus:'Questões importadas.',source:'external',topics:[]}];
    if(user.isAnonymous){
      try{const s=localStorage.getItem(`qb_lib_${username}`);setLibrary(s?sortLibraryItems(JSON.parse(s)):defFolder);}catch(e){setLibrary(defFolder);}
      return;
    }
    const libRef=collection(db,'users',user.uid,'library');
    const u1=onSnapshot(libRef,(snap)=>{
      const d=sortLibraryItems(snap.docs.map(x=>x.data()));
      setLibrary(d.length?d:defFolder);
    });
    return ()=>u1();
  },[user,username]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeSubject = library.find(s=>s.id===activeSubjectId);
  const activeTopic   = activeSubject?.topics?.find(t=>t.id===activeTopicId);
  const librarySubjects = library.filter(s => !isFolderItem(s));
  const libraryFolders = library.filter(isFolderItem);
  const sourceSubjects = (source = libFilter) => librarySubjects.filter(s => s.source === source);
  const sourceFolders = (source = libFilter) => libraryFolders.filter(f => f.source === source);
  const activeFolder = activeFolderId ? libraryFolders.find(f => f.id === activeFolderId) : null;
  const getFolderPath = (folderId) => {
    const path = [];
    let cur = libraryFolders.find(f => f.id === folderId);
    const seen = new Set();
    while (cur && !seen.has(cur.id)) {
      path.unshift(cur);
      seen.add(cur.id);
      cur = libraryFolders.find(f => f.id === cur.parentFolderId);
    }
    return path;
  };
  const getFolderLabel = (folderId) => {
    if (!folderId) return 'Raiz';
    const path = getFolderPath(folderId);
    return path.length ? path.map(f => f.title).join(' > ') : 'Raiz';
  };
  const isFolderDescendant = (candidateId, parentId) => {
    let cur = libraryFolders.find(f => f.id === candidateId);
    const seen = new Set();
    while (cur && !seen.has(cur.id)) {
      if (cur.parentFolderId === parentId) return true;
      seen.add(cur.id);
      cur = libraryFolders.find(f => f.id === cur.parentFolderId);
    }
    return false;
  };
  const folderChildren = (folderId) => sourceSubjects(libFilter).filter(s => (s.folderId || null) === folderId);
  const currentSubjects = sourceSubjects(libFilter).filter(s => (s.folderId || null) === (activeFolderId || null));
  const currentFolders = sourceFolders(libFilter).filter(f => (f.parentFolderId || null) === (activeFolderId || null));
  const getSubjectFolderTitle = (subject) => getFolderLabel(subject?.folderId || null);
  const getFolderParentTitle = (folder) => getFolderLabel(folder?.parentFolderId || null);
  const getSubjectsInFolderTree = (folder) => {
    if (!folder) return [];
    const folderIds = new Set([folder.id]);
    let changed = true;
    while (changed) {
      changed = false;
      libraryFolders.forEach(f => {
        if (f.source === folder.source && folderIds.has(f.parentFolderId) && !folderIds.has(f.id)) {
          folderIds.add(f.id);
          changed = true;
        }
      });
    }
    return librarySubjects.filter(s => s.source === folder.source && folderIds.has(s.folderId));
  };
  const displayedQs   = (() => {
    if (!activeTopic) return [];
    if (showOnlyWrong) return activeTopic.questions.filter(q=>{
      if (q.isOpen) {
        const val = activeTopic.answers?.[q.id];
        try { const p = JSON.parse(val); return !!(p?.answer) && (p?.score ?? 0) < 70; } catch(e) { return false; }
      }
      const a = activeTopic.answers?.[q.id];
      return a && a !== q.options?.find(o=>o.isCorrect)?.letter;
    });
    return activeTopic.questions;
  })();

  // ── DB helpers ─────────────────────────────────────────────────────────────
  const updateSubject = async (s) => {
    libraryRef.current = libraryRef.current.map(x=>x.id===s.id?s:x);
    setLibrary(p=>p.map(x=>x.id===s.id?s:x));
    if(user&&!user.isAnonymous) await setDoc(doc(db,'users',user.uid,'library',s.id.toString()),s).catch(console.error);
    else if(user?.isAnonymous) localStorage.setItem(`qb_lib_${username}`,JSON.stringify(library.map(x=>x.id===s.id?s:x)));
    if (s.source === 'academia' || hasAcademiaOriginTopic(s)) scheduleAcademiaOracleMirrorSync(libraryRef.current);
  };
  const updateLibraryItems = async (items) => {
    const changed = new Map(items.map(item=>[item.id,item]));
    const nextLibrary = sortLibraryItems(library.map(item=>changed.get(item.id)||item));
    libraryRef.current = nextLibrary;
    setLibrary(nextLibrary);
    if(user&&!user.isAnonymous) await Promise.all(items.map(item=>setDoc(doc(db,'users',user.uid,'library',item.id.toString()),item).catch(console.error)));
    else if(user?.isAnonymous) localStorage.setItem(`qb_lib_${username}`,JSON.stringify(nextLibrary));
    if (items.some(item => item.source === 'academia' || hasAcademiaOriginTopic(item))) scheduleAcademiaOracleMirrorSync(nextLibrary);
  };
  const addSubject = async (s) => {
    let ns = s;
    if (!Number.isFinite(Number(ns.sortOrder)) && ns.source) {
      const parent = isFolderItem(ns) ? (ns.parentFolderId || null) : (ns.folderId || null);
      const siblings = library.filter(item => item.source === ns.source && (isFolderItem(item) ? (item.parentFolderId || null) : (item.folderId || null)) === parent);
      const maxOrder = siblings.reduce((max,item)=>Math.max(max, Number(item.sortOrder)||0), 0);
      ns = { ...ns, sortOrder:maxOrder+1 };
    }
    libraryRef.current = sortLibraryItems([ns, ...libraryRef.current.filter(x=>x.id!==ns.id)]);
    setLibrary(p=>sortLibraryItems([ns,...p.filter(x=>x.id!==ns.id)]));
    if(user&&!user.isAnonymous) await setDoc(doc(db,'users',user.uid,'library',ns.id.toString()),ns).catch(console.error);
    else if(user?.isAnonymous) localStorage.setItem(`qb_lib_${username}`,JSON.stringify([ns,...library]));
    if (ns.source === 'academia' || hasAcademiaOriginTopic(ns)) scheduleAcademiaOracleMirrorSync(libraryRef.current);
  };
  const removeSubject = async (id) => {
    const removed = libraryRef.current.find(s=>s.id===id);
    if (isProtectedMirrorRootFolder(removed)) return;
    libraryRef.current = libraryRef.current.filter(s=>s.id!==id);
    setLibrary(p=>p.filter(s=>s.id!==id));
    if(user&&!user.isAnonymous) await deleteDoc(doc(db,'users',user.uid,'library',id.toString())).catch(console.error);
    else if(user?.isAnonymous) localStorage.setItem(`qb_lib_${username}`,JSON.stringify(library.filter(s=>s.id!==id)));
    if (removed?.source === 'academia' || hasAcademiaOriginTopic(removed)) scheduleAcademiaOracleMirrorSync(libraryRef.current);
  };
  const createLibraryFolder = async (source, title, parentFolderId = activeFolderId || null) => {
    const localItems = libraryRef.current?.length ? libraryRef.current : library;
    const clean = (title || '').trim();
    if (!clean) return null;
    const parent = parentFolderId || null;
    const parentFolder = parent ? localItems.find(item => String(item.id) === String(parent)) : null;
    if (isProtectedMirrorRootFolder(parentFolder)) return null;
    const siblings = localItems.filter(item => item.source === source && (isFolderItem(item) ? (item.parentFolderId || null) : (item.folderId || null)) === parent);
    const maxOrder = siblings.reduce((max,item)=>Math.max(max, Number(item.sortOrder)||0), 0);
    const folder = { id:Date.now(), itemType:'folder', title:clean, source, parentFolderId:parent, createdAt:Date.now(), sortOrder:maxOrder+1, topics:[] };
    await addSubject(folder);
    return folder;
  };

  const ensureFolderByTitle = async (source, title, parentFolderId = null, localItems = library) => {
    const clean = (title || '').trim();
    const existing = localItems.find(item => isFolderItem(item) && item.source === source && item.title === clean && (item.parentFolderId || null) === (parentFolderId || null));
    if (existing) return { folder:existing, items:localItems };
    const siblings = localItems.filter(item => item.source === source && (isFolderItem(item) ? (item.parentFolderId || null) : (item.folderId || null)) === (parentFolderId || null));
    const maxOrder = siblings.reduce((max,item)=>Math.max(max, Number(item.sortOrder)||0), 0);
    const folder = { id:`folder_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, itemType:'folder', title:clean, source, parentFolderId:parentFolderId || null, createdAt:Date.now(), sortOrder:maxOrder+1, topics:[] };
    await addSubject(folder);
    const items = [folder, ...localItems];
    libraryRef.current = sortLibraryItems(items);
    return { folder, items };
  };

  const ensureFolderPath = async (source, titles = [], parentFolderId = null, localItems = library) => {
    let items = localItems;
    let parent = parentFolderId || null;
    let folder = null;
    for (const rawTitle of titles) {
      const title = (rawTitle || '').trim();
      if (!title) continue;
      const result = await ensureFolderByTitle(source, title, parent, items);
      folder = result.folder;
      items = result.items;
      parent = folder.id;
    }
    return { folder, parentFolderId:parent, items };
  };

  function scheduleAcademiaOracleMirrorSync(baseItems = libraryRef.current) {
    if (academiaMirrorSyncRef.current) return;
    setTimeout(() => syncAcademiaOracleMirror(baseItems).catch(console.error), 0);
  }

  async function syncAcademiaOracleMirror(baseItems = libraryRef.current) {
    if (academiaMirrorSyncRef.current) return;
    const hasAcademiaOracleBlocks = (baseItems || []).some(item =>
      !isFolderItem(item) &&
      item.source === 'gemini' &&
      (item.topics || []).some(t => t.origin?.source === 'academia')
    );
    if (!hasAcademiaOracleBlocks) return;

    academiaMirrorSyncRef.current = true;
    try {
      let items = sortLibraryItems([...(baseItems || [])]);
      const changed = new Map();
      const deletedIds = new Set();
      const sameIdValue = (a, b) => String(a ?? '') === String(b ?? '');
      const itemChanged = (a, b) => JSON.stringify(a) !== JSON.stringify(b);
      const folderParentId = (item) => item?.parentFolderId || null;
      const subjectParentId = (item) => item?.folderId || null;
      const titleKey = (title) => (title || '').trim().toLocaleLowerCase('pt-BR');
      const upsert = (item) => {
        const idx = items.findIndex(x => sameIdValue(x.id, item.id));
        if (idx >= 0) {
          if (!itemChanged(items[idx], item)) return items[idx];
          items = [...items.slice(0, idx), item, ...items.slice(idx + 1)];
        } else {
          items = [item, ...items];
        }
        changed.set(item.id, item);
        return item;
      };
      const removeItem = (item) => {
        if (!item) return;
        deletedIds.add(item.id);
        changed.delete(item.id);
        items = items.filter(x => !sameIdValue(x.id, item.id));
      };
      const findAcademiaSubject = (subjectId) => items.find(item =>
        !isFolderItem(item) &&
        item.source === 'academia' &&
        sameIdValue(item.id, subjectId)
      );
      const academiaOriginExists = (origin) => {
        if (origin?.source !== 'academia') return true;
        const sourceSubject = findAcademiaSubject(origin.subjectId);
        if (!sourceSubject) return false;
        return (sourceSubject.topics || []).some(topic => sameIdValue(topic.id, origin.topicId));
      };
      items
        .filter(item => !isFolderItem(item) && item.source === 'gemini' && (item.topics || []).some(t => t.origin?.source === 'academia'))
        .forEach(oracleSubject => {
          const nextTopics = (oracleSubject.topics || []).filter(topic =>
            topic.origin?.source !== 'academia' || academiaOriginExists(topic.origin)
          );
          if (nextTopics.length === (oracleSubject.topics || []).length) return;
          if (nextTopics.length) upsert({ ...oracleSubject, topics:nextTopics });
          else removeItem(oracleSubject);
        });
      const folderPathFromItems = (folderId, source) => {
        const path = [];
        let cur = items.find(f => isFolderItem(f) && sameIdValue(f.id, folderId) && f.source === source);
        const seen = new Set();
        while (cur && !seen.has(String(cur.id))) {
          path.unshift(cur);
          seen.add(String(cur.id));
          cur = items.find(f => isFolderItem(f) && sameIdValue(f.id, cur.parentFolderId) && f.source === source);
        }
        return path;
      };
      const siblingsMaxOrder = (source, parentId) => items
        .filter(item => item.source === source && (isFolderItem(item) ? (item.parentFolderId || null) : (item.folderId || null)) === (parentId || null))
        .reduce((max, item) => Math.max(max, Number(item.sortOrder)||0), 0);
      const ensureMirrorFolder = ({ title, parentFolderId = null, mirrorKey, mirrorValue }) => {
        const clean = (title || '').trim();
        if (!clean) return null;
        let folder = items.find(item =>
          isFolderItem(item) &&
          item.source === 'gemini' &&
          mirrorKey &&
          sameIdValue(item[mirrorKey], mirrorValue)
        );
        if (!folder) {
          folder = items.find(item =>
            isFolderItem(item) &&
            item.source === 'gemini' &&
            item.title === clean &&
            (item.parentFolderId || null) === (parentFolderId || null)
          );
        }
        if (!folder) {
          folder = {
            id:`mirror_${mirrorKey || 'folder'}_${mirrorValue || Date.now()}_${Math.random().toString(36).slice(2,6)}`,
            itemType:'folder',
            source:'gemini',
            title:clean,
            parentFolderId:parentFolderId || null,
            createdAt:Date.now(),
            sortOrder:siblingsMaxOrder('gemini', parentFolderId || null) + 1,
            topics:[],
          };
        }
        const updated = {
          ...folder,
          title:clean,
          parentFolderId:parentFolderId || null,
          ...(mirrorKey ? {[mirrorKey]:mirrorValue} : {}),
        };
        return upsert(updated);
      };

      const root = ensureMirrorFolder({ title:'Academia', parentFolderId:null, mirrorKey:'mirrorRoot', mirrorValue:'academia' });
      const ensureAcademiaSourcePath = (subject) => {
        let parentId = root.id;
        folderPathFromItems(subject.folderId || null, 'academia').forEach(folder => {
          const mirror = ensureMirrorFolder({
            title:folder.title,
            parentFolderId:parentId,
            mirrorKey:'mirrorOfAcademiaFolderId',
            mirrorValue:folder.id,
          });
          parentId = mirror.id;
        });
        const subjectFolder = ensureMirrorFolder({
          title:subject.title,
          parentFolderId:parentId,
          mirrorKey:'mirrorOfAcademiaSubjectId',
          mirrorValue:subject.id,
        });
        return subjectFolder.id;
      };

      items
        .filter(item => !isFolderItem(item) && item.source === 'gemini' && (item.topics || []).some(t => t.origin?.source === 'academia'))
        .forEach(oracleSubject => {
          const origin = (oracleSubject.topics || []).find(t => t.origin?.source === 'academia')?.origin;
          if (!origin) return;
          const academiaSubject = items.find(item => !isFolderItem(item) && item.source === 'academia' && sameIdValue(item.id, origin.subjectId));
          const academiaTopic = academiaSubject?.topics?.find(t => sameIdValue(t.id, origin.topicId));
          if (!academiaSubject || !academiaTopic) return;
          const subjectFolderId = ensureAcademiaSourcePath(academiaSubject);
          const topicFolder = ensureMirrorFolder({
            title:academiaTopic.title,
            parentFolderId:subjectFolderId,
            mirrorKey:'mirrorOfAcademiaTopicId',
            mirrorValue:academiaTopic.id,
          });
          let targetFolderId = topicFolder.id;
          if (origin.kind === 'extra') {
            const extraBucket = ensureMirrorFolder({
              title:'Baterias extras',
              parentFolderId:topicFolder.id,
              mirrorKey:'mirrorOfAcademiaExtraBucketTopicId',
              mirrorValue:academiaTopic.id,
            });
            targetFolderId = extraBucket.id;
          }
          if (!sameIdValue(oracleSubject.folderId, targetFolderId)) {
            upsert({ ...oracleSubject, folderId:targetFolderId });
          }
        });

      items
        .filter(item => !isFolderItem(item) && item.source === 'gemini' && (item.topics || []).some(t => t.origin?.source === 'academia'))
        .forEach(oracleSubject => {
          let changedSubject = false;
          const nextTopics = (oracleSubject.topics || []).map(oracleTopic => {
            const origin = oracleTopic.origin;
            if (origin?.source !== 'academia') return oracleTopic;
            const academiaSubject = findAcademiaSubject(origin.subjectId);
            const academiaTopic = academiaSubject?.topics?.find(t => sameIdValue(t.id, origin.topicId));
            if (!academiaTopic) return oracleTopic;
            const oracleQuestionIds = new Set((oracleTopic.questions || []).map(q => q.id));
            const sourceAnswers = Object.fromEntries(
              Object.entries(academiaTopic.answers || {}).filter(([id, value]) =>
                oracleQuestionIds.has(id) && value != null && value !== ''
              )
            );
            const sourceNotebook = (academiaTopic.errorNotebook || []).filter(id => oracleQuestionIds.has(id));
            const nextTopic = {
              ...oracleTopic,
              answers:{...(oracleTopic.answers || {}), ...sourceAnswers},
              errorNotebook:sourceNotebook,
            };
            if (itemChanged(oracleTopic, nextTopic)) changedSubject = true;
            return nextTopic;
          });
          if (changedSubject) upsert({ ...oracleSubject, topics:nextTopics });
        });

      const academiaOriginKey = (subject) => {
        const origin = (subject.topics || []).find(t => t.origin?.source === 'academia')?.origin;
        if (!origin) return null;
        return `${origin.subjectId}__${origin.topicId}__${origin.kind || 'fixation'}`;
      };
      const questionCountOfSubject = (subject) => (subject.topics || []).reduce((acc,t)=>acc+(t.questions||[]).length,0);
      const answerCountOfSubject = (subject) => (subject.topics || []).reduce((acc,t)=>acc+Object.keys(t.answers||{}).length,0);
      const mergeTopicData = (base, incoming) => ({
        ...incoming,
        ...base,
        questions:(base.questions || []).length ? base.questions : (incoming.questions || []),
        answers:{...(incoming.answers||{}), ...(base.answers||{})},
        favorites:[...new Set([...(incoming.favorites||[]), ...(base.favorites||[])])],
        errorNotebook:[...new Set([...(incoming.errorNotebook||[]), ...(base.errorNotebook||[])])],
        spacedReview:{...(incoming.spacedReview||{}), ...(base.spacedReview||{})},
        summary:base.summary || incoming.summary || '',
        bizuario:base.bizuario || incoming.bizuario || null,
      });
      const subjectsByOrigin = new Map();
      items
        .filter(item => !isFolderItem(item) && item.source === 'gemini')
        .forEach(subject => {
          const key = academiaOriginKey(subject);
          if (!key) return;
          subjectsByOrigin.set(key, [...(subjectsByOrigin.get(key) || []), subject]);
        });
      subjectsByOrigin.forEach(group => {
        if (group.length < 2) return;
        const sorted = [...group].sort((a,b) => {
          const ans = answerCountOfSubject(b) - answerCountOfSubject(a);
          if (ans) return ans;
          const qs = questionCountOfSubject(b) - questionCountOfSubject(a);
          if (qs) return qs;
          return libraryOrderValue(a) - libraryOrderValue(b);
        });
        let keeper = sorted[0];
        sorted.slice(1).forEach(dup => {
          const nextTopics = [...(keeper.topics || [])];
          (dup.topics || []).forEach(dupTopic => {
            const idx = nextTopics.findIndex(t =>
              t.id === dupTopic.id ||
              (t.origin?.source === 'academia' &&
                dupTopic.origin?.source === 'academia' &&
                sameIdValue(t.origin.subjectId, dupTopic.origin.subjectId) &&
                sameIdValue(t.origin.topicId, dupTopic.origin.topicId) &&
                (t.origin.kind || 'fixation') === (dupTopic.origin.kind || 'fixation'))
            );
            if (idx >= 0) nextTopics[idx] = mergeTopicData(nextTopics[idx], dupTopic);
            else nextTopics.push(dupTopic);
          });
          keeper = upsert({
            ...keeper,
            title:keeper.title || dup.title,
            fullSyllabus:keeper.fullSyllabus || dup.fullSyllabus,
            topics:nextTopics,
          });
          removeItem(dup);
        });
      });

      const academyMirrorTitles = new Set(['academia']);
      items.forEach(item => {
        if (item.source === 'academia') {
          academyMirrorTitles.add(titleKey(item.title));
          (item.topics || []).forEach(t => academyMirrorTitles.add(titleKey(t.title)));
        }
      });
      const academiaRoot = items.find(item => isFolderItem(item) && item.source === 'gemini' && item.mirrorRoot === 'academia');
      const academiaRootId = academiaRoot?.id || root.id;
      const isInsideAcademiaMirror = (folder) => {
        let cur = folder;
        const seen = new Set();
        while (cur && !seen.has(String(cur.id))) {
          if (sameIdValue(cur.id, academiaRootId)) return true;
          seen.add(String(cur.id));
          cur = items.find(item => isFolderItem(item) && sameIdValue(item.id, cur.parentFolderId));
        }
        return false;
      };
      const folderHasContent = (folderId) => items.some(item =>
        item.source === 'gemini' &&
        (isFolderItem(item) ? sameIdValue(folderParentId(item), folderId) : sameIdValue(subjectParentId(item), folderId))
      );
      const hasAcademiaOriginSubject = (folderId) => items.some(item =>
        !isFolderItem(item) &&
        item.source === 'gemini' &&
        sameIdValue(item.folderId, folderId) &&
        (item.topics || []).some(t => t.origin?.source === 'academia')
      );
      let mergedSomething = true;
      while (mergedSomething) {
        mergedSomething = false;
        const groups = new Map();
        items
          .filter(item => isFolderItem(item) && item.source === 'gemini')
          .forEach(folder => {
            const key = `${folderParentId(folder) || 'root'}__${titleKey(folder.title)}`;
            groups.set(key, [...(groups.get(key) || []), folder]);
          });
        for (const group of groups.values()) {
          if (group.length < 2) continue;
          const sorted = [...group].sort((a,b) => {
            const am = Number(!!(a.mirrorRoot || a.mirrorOfAcademiaFolderId || a.mirrorOfAcademiaSubjectId || a.mirrorOfAcademiaTopicId || a.mirrorOfAcademiaExtraBucketTopicId));
            const bm = Number(!!(b.mirrorRoot || b.mirrorOfAcademiaFolderId || b.mirrorOfAcademiaSubjectId || b.mirrorOfAcademiaTopicId || b.mirrorOfAcademiaExtraBucketTopicId));
            if (bm - am) return bm - am;
            return libraryOrderValue(a) - libraryOrderValue(b);
          });
          const keeper = sorted[0];
          sorted.slice(1).forEach(dup => {
            items.forEach(item => {
              if (item.source !== 'gemini') return;
              if (isFolderItem(item) && sameIdValue(item.parentFolderId, dup.id)) upsert({ ...item, parentFolderId:keeper.id });
              if (!isFolderItem(item) && sameIdValue(item.folderId, dup.id)) upsert({ ...item, folderId:keeper.id });
            });
            removeItem(dup);
            mergedSomething = true;
          });
        }
      }

      let removedEmpty = true;
      while (removedEmpty) {
        removedEmpty = false;
        items
          .filter(item => isFolderItem(item) && item.source === 'gemini')
          .forEach(folder => {
            const mirrorMarked = !!(folder.mirrorOfAcademiaFolderId || folder.mirrorOfAcademiaSubjectId || folder.mirrorOfAcademiaTopicId || folder.mirrorOfAcademiaExtraBucketTopicId);
            const legacyAcademiaLike = !isInsideAcademiaMirror(folder) && academyMirrorTitles.has(titleKey(folder.title));
            if (sameIdValue(folder.id, academiaRootId)) return;
            if ((mirrorMarked || legacyAcademiaLike || hasAcademiaOriginSubject(folder.id)) && !folderHasContent(folder.id)) {
              removeItem(folder);
              removedEmpty = true;
            }
          });
      }

      if (!changed.size && !deletedIds.size) return;
      const nextLibrary = sortLibraryItems(items);
      libraryRef.current = nextLibrary;
      setLibrary(nextLibrary);
      if(user&&!user.isAnonymous) {
        await Promise.all([
          ...Array.from(changed.values()).map(item => setDoc(doc(db,'users',user.uid,'library',item.id.toString()),item).catch(console.error)),
          ...Array.from(deletedIds).map(id => deleteDoc(doc(db,'users',user.uid,'library',id.toString())).catch(console.error)),
        ]);
      } else if(user?.isAnonymous) {
        localStorage.setItem(`qb_lib_${username}`, JSON.stringify(nextLibrary));
      }
    } finally {
      academiaMirrorSyncRef.current = false;
    }
  }

  useEffect(() => {
    if (!user || !library.length) return;
    const hasAcademiaOracleBlocks = library.some(item =>
      !isFolderItem(item) &&
      item.source === 'gemini' &&
      (item.topics || []).some(t => t.origin?.source === 'academia')
    );
    if (hasAcademiaOracleBlocks) scheduleAcademiaOracleMirrorSync(library);
  }, [user?.uid, library.length]); // eslint-disable-line

  const ensureAcademiaOracleTopic = async ({ subject, topic, kind='fixation', questions=[], title=null, extraId=null, questionStyle='mixed' }) => {
    let items = libraryRef.current?.length ? libraryRef.current : library;
    let r = await ensureFolderByTitle('gemini', 'Academia', null, items); const root = r.folder; items = r.items;
    const academiaSourcePath = getFolderPath(subject.folderId || null).filter(f => f.source === 'academia').map(f => f.title);
    r = await ensureFolderPath('gemini', academiaSourcePath, root.id, items); items = r.items;
    r = await ensureFolderByTitle('gemini', subject.title, r.parentFolderId || root.id, items); const subjectFolder = r.folder; items = r.items;
    r = await ensureFolderByTitle('gemini', topic.title, subjectFolder.id, items); const aulaFolder = r.folder; items = r.items;
    let targetFolder = aulaFolder;
    if (kind === 'extra') {
      r = await ensureFolderByTitle('gemini', 'Baterias extras', aulaFolder.id, items);
      targetFolder = r.folder; items = r.items;
    }
    const subjectTitle = title || (kind === 'extra' ? 'Bateria extra' : 'Fixação');
    const topicId = kind === 'extra'
      ? `academia_extra_${topic.id}_${extraId || Date.now()}`
      : `academia_fix_${topic.id}`;
    const topicTitle = kind === 'extra' ? subjectTitle : 'Questões de fixação';
    const questionIds = new Set(questions.map(q=>q.id));
    const syncedAnswers = Object.fromEntries(
      Object.entries(topic.answers || {}).filter(([id, value]) => questionIds.has(id) && value != null && value !== '')
    );
    const syncedFavorites = (topic.favorites || []).filter(id => questionIds.has(id));
    const syncedNotebook = (topic.errorNotebook || []).filter(id => questionIds.has(id));
    const findMatchingOracleSubject = () => items.find(item =>
      !isFolderItem(item) &&
      item.source === 'gemini' &&
      (item.topics || []).some(t =>
        t.id === topicId ||
        (t.origin?.source === 'academia' &&
          String(t.origin.subjectId) === String(subject.id) &&
          String(t.origin.topicId) === String(topic.id) &&
          t.origin.kind === kind)
      )
    );
    const existingSubject = items.find(item => !isFolderItem(item) && item.source === 'gemini' && item.title === subjectTitle && (item.folderId || null) === targetFolder.id)
      || findMatchingOracleSubject();
    const oracleTopic = {
      id:topicId,
      title:topicTitle,
      subtopics:topic.subtopics || [],
      questions,
      answers:syncedAnswers,
      summary:'',
      favorites:syncedFavorites,
      errorNotebook:syncedNotebook,
      spacedReview:{},
      questionStyle,
      origin:{source:'academia', subjectId:subject.id, topicId:topic.id, kind},
    };
    if (existingSubject) {
      const existingTopic = (existingSubject.topics || []).find(t =>
        t.id === topicId ||
        (t.origin?.source === 'academia' &&
          String(t.origin.subjectId) === String(subject.id) &&
          String(t.origin.topicId) === String(topic.id) &&
          t.origin.kind === kind)
      );
      const mergedTopic = existingTopic
        ? {
            ...existingTopic,
            ...oracleTopic,
            answers:{...(existingTopic.answers||{}), ...syncedAnswers},
            favorites:[...new Set([...(existingTopic.favorites||[]), ...syncedFavorites])],
            errorNotebook:[...new Set([...(existingTopic.errorNotebook||[]), ...syncedNotebook])],
            spacedReview:existingTopic.spacedReview||{},
          }
        : oracleTopic;
      const updated = {
        ...existingSubject,
        title:subjectTitle,
        folderId:targetFolder.id,
        topics: existingTopic ? existingSubject.topics.map(t=>t===existingTopic?mergedTopic:t) : [...(existingSubject.topics||[]), mergedTopic],
      };
      await updateSubject(updated);
      return { subject:updated, topic:mergedTopic, folder:targetFolder };
    }
    const newSubject = {
      id:`academia_oracle_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      title:subjectTitle,
      source:'gemini',
      folderId:targetFolder.id,
      fullSyllabus:`Questões da Academia: ${subject.title} / ${topic.title}`,
      topics:[oracleTopic],
    };
    await addSubject(newSubject);
    return { subject:newSubject, topic:oracleTopic, folder:targetFolder };
  };
  const moveSubjectToFolder = async (subject, folderId) => {
    if (!subject || isFolderItem(subject)) return;
    if (isProtectedMirrorRootFolder(libraryFolders.find(f => String(f.id) === String(folderId)))) return;
    await updateSubject({ ...subject, folderId:folderId || null });
  };
  const moveFolderToFolder = async (folder, parentFolderId) => {
    if (!folder || !isFolderItem(folder)) return;
    if (isProtectedMirrorRootFolder(folder)) return;
    if (isProtectedMirrorRootFolder(libraryFolders.find(f => String(f.id) === String(parentFolderId)))) return;
    const nextParent = parentFolderId || null;
    if (nextParent === folder.id || isFolderDescendant(nextParent, folder.id)) return;
    await updateSubject({ ...folder, parentFolderId:nextParent });
  };
  const getLibraryItemParentId = (item) => isFolderItem(item) ? (item.parentFolderId || null) : (item.folderId || null);
  const reorderLibraryItem = async (item, targetParentId, targetItem = null, position = 'inside') => {
    if (!item) return;
    if (isProtectedMirrorRootFolder(item)) return;
    if (isProtectedMirrorRootFolder(targetItem)) return;
    if (isProtectedMirrorRootFolder(libraryFolders.find(f => String(f.id) === String(targetParentId)))) return;
    const nextParent = targetParentId || null;
    if (isFolderItem(item) && (nextParent === item.id || isFolderDescendant(nextParent, item.id))) return;
    const moved = isFolderItem(item) ? { ...item, parentFolderId:nextParent } : { ...item, folderId:nextParent };
    const siblings = sortLibraryItems(library.filter(candidate => (
      candidate.source === item.source &&
      candidate.id !== item.id &&
      getLibraryItemParentId(candidate) === nextParent
    )));
    let insertAt = siblings.length;
    if (targetItem) {
      const idx = siblings.findIndex(candidate => candidate.id === targetItem.id);
      if (idx >= 0) insertAt = position === 'before' ? idx : idx + 1;
    }
    const ordered = [...siblings];
    ordered.splice(insertAt, 0, moved);
    await updateLibraryItems(ordered.map((candidate, index) => ({ ...candidate, sortOrder:index+1 })));
  };
  const deleteFolderAndKeepContents = async (folder) => {
    if (!folder) return;
    if (isProtectedMirrorRootFolder(folder)) return;
    const children = librarySubjects.filter(s => s.source === folder.source && s.folderId === folder.id);
    for (const child of children) await updateSubject({ ...child, folderId:folder.parentFolderId || null });
    const childFolders = libraryFolders.filter(f => f.source === folder.source && f.parentFolderId === folder.id);
    for (const childFolder of childFolders) await updateSubject({ ...childFolder, parentFolderId:folder.parentFolderId || null });
    await removeSubject(folder.id);
    if (activeFolderId === folder.id) setActiveFolderId(null);
  };
  const getFolderTreeIds = (folder) => {
    if (!folder) return new Set();
    const ids = new Set([folder.id]);
    let changed = true;
    while (changed) {
      changed = false;
      libraryFolders.forEach(f => {
        if (f.source === folder.source && ids.has(f.parentFolderId) && !ids.has(f.id)) {
          ids.add(f.id);
          changed = true;
        }
      });
    }
    return ids;
  };
  const deleteFolderWithContents = async (folder) => {
    if (!folder) return;
    if (isProtectedMirrorRootFolder(folder)) return;
    const folderIds = getFolderTreeIds(folder);
    const idsToDelete = new Set([
      ...Array.from(folderIds),
      ...librarySubjects
        .filter(s => s.source === folder.source && folderIds.has(s.folderId))
        .map(s => s.id),
    ]);
    const nextLibrary = library.filter(item => !idsToDelete.has(item.id));
    libraryRef.current = nextLibrary;
    setLibrary(nextLibrary);
    if(user&&!user.isAnonymous) {
      await Promise.all(Array.from(idsToDelete).map(id => deleteDoc(doc(db,'users',user.uid,'library',id.toString())).catch(console.error)));
    } else if(user?.isAnonymous) {
      localStorage.setItem(`qb_lib_${username}`, JSON.stringify(nextLibrary));
    }
    if (folderIds.has(activeFolderId)) setActiveFolderId(folder.parentFolderId || null);
    if (idsToDelete.has(activeSubjectId)) {
      setActiveSubjectId(null);
      setActiveTopicId(null);
      setView('sub-library');
    }
  };

  const saveSettingsTimer = useRef(null);
  const saveSettings = async (s) => {
    const currentKeys = getConfiguredGeminiKeys(settingsRef.current);
    let ns=withGeminiKeys({...s,activeKeyIndex:Number(s.activeKeyIndex||1)});
    const incomingKeys = getConfiguredGeminiKeys(ns);
    if (!incomingKeys.length && currentKeys.length) {
      ns = withGeminiKeys(ns, currentKeys.map(({id,name,value}) => ({id,name,value})));
    }
    const backupKeys = getConfiguredGeminiKeys(ns).map(({id,name,value}) => ({id,name,value}));
    ns = { ...ns, geminiKeysBackup: backupKeys };
    setSettings(ns);
    clearTimeout(saveSettingsTimer.current);
    saveSettingsTimer.current = setTimeout(async () => {
      let finalNs = ns;
      if(user&&!user.isAnonymous && !getConfiguredGeminiKeys(finalNs).length) {
        try {
          const existing = await getDoc(doc(db,'users',user.uid));
          if (existing.exists()) {
            const data = existing.data() || {};
            const recovered = buildSettingsWithGeminiRecovery(data.settings || {}, data.apiKey || '', username || data.username || '');
            const recoveredKeys = getConfiguredGeminiKeys(recovered);
            if (recoveredKeys.length) {
              finalNs = withGeminiKeys(finalNs, recoveredKeys.map(({id,name,value}) => ({id,name,value})));
              finalNs = { ...finalNs, geminiKeysBackup:getConfiguredGeminiKeys(finalNs).map(({id,name,value}) => ({id,name,value})) };
              setSettings(finalNs);
            }
          }
        } catch(e) {}
      }
      if(user&&!user.isAnonymous) await setDoc(doc(db,'users',user.uid),{username,apiKey:finalNs.apiKey1||finalNs.apiKey||'',settings:finalNs},{merge:true}).catch(console.error);
      if (username) {
        writeStorageJson(`qb_settings_${username}`, finalNs);
      }
    }, 800);
  };

  // ── API Key helpers ────────────────────────────────────────────────────────
  const getKey = () => {
    const s = settingsRef.current;
    const keys = getConfiguredGeminiKeys(s);
    const activeId = getActiveGeminiKeyId(s);
    return keys.find(x => x.id === activeId)?.k || keys[0]?.k || s.apiKey1 || s.apiKey;
  };
  const checkKey = () => { if (!getKey()?.trim()){showApiError('API_KEY_MISSING');return false;} return true; };

  // Show error modal with full context for each API error type
  const showApiError = (errCode, extra='') => {
    const cfg = ERROR_CONFIGS[errCode] || { title:'Erro Desconhecido', message:extra||'Tente novamente.', link:null };
    setErrorModal({ title:cfg.title, message:cfg.message+(extra?`\n${extra}`:''), link:cfg.link, isAlert:true });
  };

  // Build ordered key list starting from current active key
  const getOrderedKeys = () => {
    const s = settingsRef.current;
    const slots = getConfiguredGeminiKeys(s);
    const activeId = getActiveGeminiKeyId(s);
    const startIdx = Math.max(0, slots.findIndex(x => x.id === activeId));
    return [...slots.slice(startIdx), ...slots.slice(0, startIdx)];
  };

  // Advance to the next available key (called after every request, success or quota fail)
  const rotateKey = async () => {
    const s = settingsRef.current;
    const slots = getConfiguredGeminiKeys(s);
    if (slots.length <= 1) return;
    const activeId = getActiveGeminiKeyId(s);
    const curIdx = Math.max(0, slots.findIndex(x => x.id === activeId));
    const nextId = slots[(curIdx + 1) % slots.length].id;
    await saveSettings(withGeminiKeys(s, normalizeGeminiKeys(s), nextId));
  };

  // ── Material helpers ───────────────────────────────────────────────────────
  const getMaterial = () => { const c=materialText+'\n'+uploadedFiles.map(f=>`[${f.name}]\n${f.content}`).join('\n'); return c.length>MAX_MATERIAL_CHARS?c.substring(0,MAX_MATERIAL_CHARS)+'\n[TRUNCADO]':c; };
  const materialRequestCount = () => estimateMaterialRequestCount(materialText, uploadedFiles);
  const academiaMaterialRequestCount = () => estimateMaterialRequestCount(academiaMaterialText, academiaUploadedFiles);
  const isBig = () => materialRequestCount() > 1;
  // Build focus instructions from stored focus area IDs on the subject
  const getFocusInst = (areas=[]) => {
    if (!areas || areas.length === 0) return '';
    const insts = areas.map(id => FOCUS_AREAS.find(f=>f.id===id)?.inst).filter(Boolean);
    return insts.length ? `ÊNFASES OBRIGATÓRIAS:\n${insts.map(i=>`- ${i}`).join('\n')}` : '';
  };

  const getPrompt = (forAPI=false, areas=[]) => {
    const s = settingsRef.current;
    const focusBlock = getFocusInst(areas);
    return buildOracleQuestionPrompt(s, focusBlock, s.autoMode || false);
  };

  const getExternalPrompt = () => buildExternalPrompt(settingsRef.current);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const files=Array.from(e.target.files||[]);if(!files.length)return;setIsUploading(true);
    for(const file of files){
      try{let t='';if(file.name.match(/\.(txt|md)$/i)){t=await new Promise(r=>{const fr=new FileReader();fr.onload=ev=>r(ev.target.result);fr.readAsText(file);});}else if(file.name.match(/\.pdf$/i)){t=await extractPdfText(await file.arrayBuffer());}else if(file.name.match(/\.docx?$/i)){t=await extractDocxText(await file.arrayBuffer());}else{setErrorModal({title:'Formato não suportado',message:`Use TXT, PDF ou DOCX.`,isAlert:true});continue;}setUploadedFiles(p=>[...p,{name:file.name,content:t}]);}catch(e){setErrorModal({title:'Erro ao ler arquivo',message:e.message,isAlert:true});}
    }
    if(fileInputRef.current) fileInputRef.current.value='';setIsUploading(false);
  };
  const handleImageUpload = async (e) => {
    const files=Array.from(e.target.files||[]);if(!files.length)return;
    for(const f of files){if(!f.type.startsWith('image/'))continue;const b64=await new Promise(r=>{const fr=new FileReader();fr.onload=ev=>r(ev.target.result.split(',')[1]);fr.readAsDataURL(f);});setUploadedImages(p=>[...p,{name:f.name,base64:b64,mimeType:f.type,preview:URL.createObjectURL(f)}]);}
    if(imageInputRef.current) imageInputRef.current.value='';
  };

  // Wrapper que chama Gemini com rotação automática de chaves — para uso no ChatBox
  const callWithRotation = async (prompt, sys) => {
    const orderedKeys = getOrderedKeys();
    let lastErr;
    for (const {k} of orderedKeys) {
      try {
        const r = await callGemini(prompt, sys, k);
        await rotateKey();
        return r;
      } catch(e) {
        lastErr = e;
        if (e.message === 'QUOTA_EXCEEDED') { await rotateKey(); continue; }
        // SERVER_OVERLOADED, CONNECTION_ERROR etc. — não tenta outra chave, só desperdiça
        throw e;
      }
    }
    throw lastErr;
  };
  const addToast = (msg, type='info', duration=5000, onClick=null) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type, onClick }]);
    if (duration > 0) setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
    return id;
  };
  const removeToast = (id) => setToasts(p => p.filter(t => t.id !== id));
  const updateToast = (id, msg, type) => setToasts(p => p.map(t => t.id===id ? {...t, msg, type} : t));

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (bulkGenerateRun.running) return;
      const close = (setter, value=null) => { setter(value); e.preventDefault(); };

      if (menuOpen) return close(setMenuOpen, false);
      if (libraryActionMenu) return close(setLibraryActionMenu);
      if (blockActionMenu) return close(setBlockActionMenu);
      if (mobileNavOpen) return close(setMobileNavOpen, false);
      if (errorModal) return close(setErrorModal);
      if (deleteId) return close(setDeleteId);
      if (openAnswerModal) return close(setOpenAnswerModal);
      if (externalPromptModal) return close(setExternalPromptModal, false);
      if (regenModal) return close(setRegenModal, false);
      if (newFolderModal) return close(setNewFolderModal, false);
      if (moveSubjectModal) return close(setMoveSubjectModal);
      if (folderReviewModal) return close(setFolderReviewModal);
      if (bulkGenerateModal) return close(setBulkGenerateModal);
      if (academiaExtraModal) return close(setAcademiaExtraModal);
      if (academiaRegenModal) return close(setAcademiaRegenModal);
      if (academiaExportModal) return close(setAcademiaExportModal);
      if (errorReviewModal) return close(setErrorReviewModal);
      if (examSetup !== null) { setExamSetup(null); setExamTopics([]); e.preventDefault(); return; }
      if (exportModal) return close(setExportModal);
      if (bizuarioModal) return close(setBizuarioModal);
      if (vqGenModal) return close(setVqGenModal);
      if (resetCourseModal) return close(setResetCourseModal, false);
      if (srModal) return close(setSrModal);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    menuOpen, libraryActionMenu, blockActionMenu, mobileNavOpen, errorModal, deleteId,
    openAnswerModal, externalPromptModal, regenModal, newFolderModal, moveSubjectModal,
    folderReviewModal, bulkGenerateModal, bulkGenerateRun.running, academiaExtraModal,
    academiaRegenModal, academiaExportModal, errorReviewModal, examSetup, exportModal,
    bizuarioModal, vqGenModal, resetCourseModal, srModal
  ]);

  const getBulkGenerateTargets = (subject) => {
    const topics = subject?.topics || [];
    if (subject?.source === 'academia') return topics.filter(t => !t.lessonGenerated);
    if (subject?.source === 'gemini') return topics.filter(t => !(t.questions || []).length);
    return [];
  };
  const createBulkLog = (type, msg) => {
    const time = new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    return { id:Date.now()+Math.random(), type, msg, time };
  };
  const addBulkLog = (type, msg) => {
    setBulkGenerateRun(p => ({ ...p, logs:[...p.logs, createBulkLog(type, msg)] }));
  };
  const getBulkErrorText = (err) => ERROR_CONFIGS[err?.message]?.title || err?.message || 'Erro desconhecido';
  const isRetryableBulkError = (err) => ['SERVER_OVERLOADED', 'CONNECTION_ERROR', 'NETWORK_ERROR'].includes(err?.message);

  // ── Gerar questões direto (sem modal) ──────────────────────────────────────
  const gerarQuestoesDireto = async (aula, subject, topic) => {
    if (!checkKey()) return;
    const s = settingsRef.current;
    const durationSecs = aula.duration_seconds || 0;
    const raw = durationSecs > 0 ? Math.ceil(durationSecs / 120) : 10;
    const totalQ = Math.max(10, Math.round(raw / 10) * 10);
    const qPerBlock = Math.min(30, totalQ);
    const numBlocks = Math.ceil(totalQ / qPerBlock);
    const aulaId = aulaDocId(aula);

    const toastId = addToast('📋 Gerando sumário da aula...', 'loading', 0);

    await generateVqSyllabus({
      aula, aulaId, totalQ, numBlocks, qPerBlock,
      numAlternatives: s.numAlternatives || 5,
      questionStyle: s.questionStyle || 'mixed',
      autoMode: s.autoMode !== false,
      extraPrompt: '',
      subject, topic,
      toastId,
    });
  };
  // Busca transcrição do Firestore (coleção lessons, id = título da aula)
  const fetchTranscript = async (aula) => {
    try {
      // O ID do doc é o título exato, com barras substituídas por hífen
      const docId = (aula.title||'').replace(/\//g,'-');
      const snap = await getDoc(doc(db,'lessons',docId));
      if (snap.exists()) return snap.data();
      // fallback: busca pelo bunny_id se não achar pelo título
      return null;
    } catch(e) { return null; }
  };

  // Gera sumário + todos os blocos em background sem redirecionar
  // toastId: ID do toast de progresso já criado pelo chamador
  const generateVqSyllabus = async (cfg) => {
    if(!checkKey()) return;
    const { aula, aulaId, totalQ, numBlocks, qPerBlock, extraPrompt, numAlternatives=5, questionStyle='mixed', toastId } = cfg;
    setVqSyllabusLoading(true);

    // 1. Buscar transcrição
    const lessonData = await fetchTranscript(aula);
    const transcript = lessonData?.transcript || '';

    // 2. Fatiar transcrição por parágrafo (não por caractere cru)
    const splitByParagraph = (text, n) => {
      if (!text || n <= 1) return text ? [text] : [];
      const paras = text.split(/\n{2,}/);
      const size = Math.ceil(paras.length / n);
      return Array.from({length: n}, (_, i) => paras.slice(i*size, (i+1)*size).join('\n\n'));
    };
    const transcriptSlices = splitByParagraph(transcript, numBlocks);

    // 3. Gerar sumário
    const summaryPrompt = buildVqSyllabusPrompt(aula, numBlocks, qPerBlock, transcript, extraPrompt);
    const orderedKeys = getOrderedKeys();
    let summaryText = null;
    for (const {k} of orderedKeys) {
      try {
        summaryText = await callGemini('Gere o sumário.', summaryPrompt, k);
        await rotateKey(); break;
      } catch(e) {
        if(e.message==='QUOTA_EXCEEDED'){await rotateKey();continue;}
        if(toastId) updateToast(toastId, `❌ Erro ao gerar sumário: ${e.message}`, 'error');
        setVqSyllabusLoading(false); return;
      }
    }
    if (!summaryText) {
      if(toastId) updateToast(toastId, '❌ Não foi possível gerar o sumário. Tente novamente.', 'error');
      setVqSyllabusLoading(false); return;
    }

    // 4. Parsear blocos
    const blockRegex = /##\s*Bloco\s*(\d+)[:\s]*([^\n]*)\n([\s\S]*?)(?=##\s*Bloco|\s*$)/gi;
    const parsedBlocks = {};
    let match, blockIndex = 0;
    while ((match = blockRegex.exec(summaryText)) !== null) {
      const blockNum = match[1];
      const subtopics = match[3].split('\n')
        .map(l=>l.replace(/^[\s\-\*•]+/,'').trim()).filter(l=>l.length>3);
      const blockId = `block${blockNum.padStart(2,'0')}`;
      parsedBlocks[blockId] = {
        title: match[2].trim() || `Bloco ${blockNum}`,
        subtopics,
        transcriptSlice: transcriptSlices[blockIndex] || '', // só em memória, não salvo no Firestore
        questions: [], answers: {}, generating: true,
      };
      blockIndex++;
    }
    if (Object.keys(parsedBlocks).length === 0) {
      for (let i = 1; i <= numBlocks; i++) {
        const blockId = `block${String(i).padStart(2,'0')}`;
        parsedBlocks[blockId] = {
          title: `Bloco ${i}`, subtopics: [],
          transcriptSlice: transcriptSlices[i-1] || '',
          questions: [], answers: {}, generating: true,
        };
      }
    }

    // 5. Salvar estrutura inicial SEM transcriptSlice (evita exceder limite do Firestore)
    const blocksForFirestore = Object.fromEntries(
      Object.entries(parsedBlocks).map(([id, b]) => {
        const { transcriptSlice, ...rest } = b;
        return [id, rest];
      })
    );
    const aulaData = {
      meta: {
        totalQuestions: totalQ, numBlocks, qPerBlock,
        numAlternatives, aulaTitle: aula.title,
        subject: cfg.subject||'', topic: cfg.topic||'',
        questionStyle, createdAt: Date.now(),
      },
      blocks: blocksForFirestore,
    };
    await saveVqBlock(aulaId, aulaData);
    setVqSyllabusLoading(false);
    setVqGenModal(null);
    // NÃO redireciona — aluno continua onde estava

    const blockIds = Object.keys(parsedBlocks).sort();
    const total = blockIds.length;
    if(toastId) updateToast(toastId, `⚡ Gerando questões (0/${total} blocos)...`, 'loading');

    // 6. Gerar todos os blocos em paralelo, cada um com chave rotacionada
    let done = 0;
    const na = numAlternatives;
    const alts = na===4
      ? 'A) [Alt]\nB) [Alt]\nC) [Alt]\nD) [Alt]'
      : 'A) [Alt]\nB) [Alt]\nC) [Alt]\nD) [Alt]\nE) [Alt]';

    const generateBlock = async (blockId, keySlot) => {
      const block = parsedBlocks[blockId];
      const PROMPT = buildVqBlockPrompt(block, aulaData.meta, block.subtopics||[], block.transcriptSlice||'', alts);
      // Tenta com a chave designada, rotaciona se quota
      const keys = getOrderedKeys();
      const startIdx = keySlot % keys.length;
      const ordered = [...keys.slice(startIdx), ...keys.slice(0, startIdx)];
      for (const {k} of ordered) {
        try {
          const full = await callGeminiStream(
            `Gere as questões do bloco "${block.title}" — ${aula.title}`,
            PROMPT, k, ()=>{}
          );
          const parsed = parseData(full, `${aulaId}_${blockId}`);
          const { transcriptSlice: _ts, ...blockToSave } = block;
          setVqBlocks(prev => {
            const cur = prev[aulaId] || aulaData;
            const updBlocks = {
              ...(cur.blocks||{}),
              [blockId]: {...blockToSave, generating:false, questions:parsed.questions, answers:{}}
            };
            const updated = {...cur, blocks:updBlocks};
            if(user&&!user.isAnonymous) setDoc(doc(db,'users',user.uid,'vq_blocks',aulaId), updated).catch(()=>{});
            return {...prev, [aulaId]: updated};
          });
          await rotateKey();
          done++;
          if(toastId) {
            if(done < total) updateToast(toastId, `⚡ Gerando questões (${done}/${total} blocos)...`, 'loading');
          }
          return;
        } catch(e) {
          if(e.message==='QUOTA_EXCEEDED'){await rotateKey();continue;}
          // SERVER_OVERLOADED ou outro erro — não tenta outra chave
          setVqBlocks(prev => {
            const cur = prev[aulaId] || aulaData;
            const updBlocks = {...(cur.blocks||{}), [blockId]:{...block,generating:false}};
            return {...prev, [aulaId]:{...cur,blocks:updBlocks}};
          });
          return;
        }
      }
    };

    // Disparar em paralelo — cada bloco usa um índice de chave diferente para distribuir carga
    await Promise.all(blockIds.map((id, i) => generateBlock(id, i)));

    // 7. Toast final clicável
    if(toastId) {
      updateToast(toastId, `✅ Questões da aula prontas! Toque para ver.`, 'success');
      setToasts(p => p.map(t => t.id===toastId ? {
        ...t,
        onClick: () => {
          setVqSubject(cfg.subject||null); setVqTopic(cfg.topic||null); setVqAula(aula);
          setVqActiveBlock(null); setVqActiveBlockView(null); setView('videoquestions');
          removeToast(toastId);
        }
      } : t));
      setTimeout(()=>removeToast(toastId), 15000);
    }
  };

  // Gera as questões de um bloco específico usando transcrição parcial
  const generateVqBlock = async (aulaId, blockId) => {
    if(!checkKey()) return;
    const aulaData = vqBlocks[aulaId];
    if(!aulaData) return;
    const block = aulaData.blocks?.[blockId];
    if(!block) return;
    const meta = aulaData.meta || {};
    const na = meta.numAlternatives || settings.numAlternatives || 5;
    const alts = na===4?'A) [Alt]\nB) [Alt]\nC) [Alt]\nD) [Alt]':'A) [Alt]\nB) [Alt]\nC) [Alt]\nD) [Alt]\nE) [Alt]';

    // Marcar como gerando
    const updBlocks = {...aulaData.blocks,[blockId]:{...block,generating:true}};
    await saveVqBlock(aulaId,{...aulaData,blocks:updBlocks});
    setStreamCount(0);

    const subtopicsArr = block.subtopics||[];
    const transcriptSlice = block.transcriptSlice||'';
    const total = subtopicsArr.length||meta.qPerBlock||5;

    const qStyleInst = {
      clinical: 'Use EXCLUSIVAMENTE enunciados com casos clínicos (paciente com X apresenta Y, qual a conduta/diagnóstico?).',
      direct:   'Use EXCLUSIVAMENTE questões diretas sobre conceitos (sem caso clínico — pergunte diretamente sobre mecanismos, critérios, classificações, doses).',
      mixed:    'Misture questões com caso clínico e questões diretas sobre conceitos.',
    }[meta.questionStyle||'mixed'];

    const PROMPT = buildVqBlockPrompt(block, meta, subtopicsArr, transcriptSlice, alts);

    const orderedKeys = getOrderedKeys();
    let ok = false, err = null;

    for (const {k} of orderedKeys) {
      try {
        const full = await callGeminiStream(
          `Gere as questões do bloco "${block.title}" — ${meta.aulaTitle}`,
          PROMPT, k,
          (acc,qc)=>setStreamCount(qc)
        );
        const parsed = parseData(full, `${aulaId}_${blockId}`);
        const finalBlocks = {
          ...aulaData.blocks,
          [blockId]: { ...block, generating:false, questions:parsed.questions, answers:{} }
        };
        await saveVqBlock(aulaId, {...aulaData, blocks:finalBlocks});
        await rotateKey();
        ok = true; break;
      } catch(e) {
        err = e;
        if(e.message==='QUOTA_EXCEEDED'){await rotateKey();continue;}
        break;
      }
    }
    setStreamCount(0);
    if(!ok) {
      // Desmarcar generating em caso de erro
      const errBlocks = {...aulaData.blocks,[blockId]:{...block,generating:false}};
      await saveVqBlock(aulaId,{...aulaData,blocks:errBlocks});
      showApiError(err?.message||'CONNECTION_ERROR');
    }
  };

  const syncAcademiaOriginAnswer = async (origin, qId, letter, question = null) => {
    if (origin?.source !== 'academia') return;
    const items = libraryRef.current?.length ? libraryRef.current : library;
    const sourceSubject = items.find(s => !isFolderItem(s) && s.source === 'academia' && String(s.id) === String(origin.subjectId));
    const sourceTopic = sourceSubject?.topics?.find(t => String(t.id) === String(origin.topicId));
    if (!sourceSubject || !sourceTopic) return;
    const sourceQuestion = question || Object.values(sourceTopic.fixationQuestions || {}).flat()
      .concat((sourceTopic.extraBattery || []).flatMap(b => b.questions || b))
      .find(q => q.id === qId);
    const errorNotebook = canUseAdvancedFeatures && sourceQuestion && !isAnswerCorrect(sourceQuestion, letter)
      ? addToList(sourceTopic.errorNotebook || [], qId)
      : (sourceTopic.errorNotebook || []);
    const updatedTopic = {
      ...sourceTopic,
      answers:{...(sourceTopic.answers || {}), [qId]:letter},
      errorNotebook,
    };
    setAcademiaTopicAnswers(p => ({...p, [qId]:letter}));
    await updateSubject({
      ...sourceSubject,
      topics:sourceSubject.topics.map(t => String(t.id) === String(sourceTopic.id) ? updatedTopic : t),
    });
  };

  const syncAcademiaOriginNotebook = async (origin, qId, shouldInclude) => {
    if (origin?.source !== 'academia') return;
    const items = libraryRef.current?.length ? libraryRef.current : library;
    const sourceSubject = items.find(s => !isFolderItem(s) && s.source === 'academia' && String(s.id) === String(origin.subjectId));
    const sourceTopic = sourceSubject?.topics?.find(t => String(t.id) === String(origin.topicId));
    if (!sourceSubject || !sourceTopic) return;
    const nextNotebook = shouldInclude
      ? addToList(sourceTopic.errorNotebook || [], qId)
      : (sourceTopic.errorNotebook || []).filter(id => id !== qId);
    const updatedTopic = {...sourceTopic, errorNotebook:nextNotebook};
    await updateSubject({
      ...sourceSubject,
      topics:sourceSubject.topics.map(t => String(t.id) === String(sourceTopic.id) ? updatedTopic : t),
    });
  };

  const handleAnswer = async (qId, letter) => {
    trackQuestionAnswered(`${activeSubject?.source||'oraculo'}:${activeSubject?.id||'subject'}:${activeTopic?.id||activeTopicId}:${qId}`);
    const q = activeTopic.questions.find(x=>x.id===qId);
    const now = Date.now();
    const sr = { ...(activeTopic.spacedReview || {}) };
    let isRight = false;

    if (q?.isOpen) {
      try {
        const parsed = JSON.parse(letter);
        isRight = (parsed?.score ?? 0) >= 70;
      } catch(e) {
        isRight = false;
      }
    } else {
      isRight = q?.options?.find(o=>o.isCorrect)?.letter === letter;
    }

    if(canUseAdvancedFeatures && !isRight) sr[qId]={dueDate:now+86400000,interval:1,wrongCount:(sr[qId]?.wrongCount||0)+1};
    else if(canUseAdvancedFeatures && sr[qId]){const ni=Math.min((sr[qId].interval||1)*2,30);sr[qId]={...sr[qId],dueDate:now+ni*86400000,interval:ni};}
    await updateSubject({...activeSubject,topics:activeSubject.topics.map(t=>{
      if (t.id !== activeTopicId) return t;
      const errorNotebook = canUseAdvancedFeatures && !isRight ? addToList(t.errorNotebook || [], qId) : (t.errorNotebook || []);
      return {...t,answers:{...(t.answers||{}),[qId]:letter},spacedReview:sr,errorNotebook};
    })});
    await syncAcademiaOriginAnswer(activeTopic.origin, qId, letter, q);
  };

  const handleFavorite = async (qId) => {
    if(!activeTopic)return;
    const favs=activeTopic.favorites||[]; const nf=toggleInList(favs,qId);
    await updateSubject({...activeSubject,topics:activeSubject.topics.map(t=>t.id===activeTopicId?{...t,favorites:nf}:t)});
  };

  const handleErrorNotebook = async (qId) => {
    if(!canUseAdvancedFeatures || !activeTopic) return;
    const currentNotebook = activeTopic.errorNotebook || [];
    const nextNotebook = toggleInList(currentNotebook, qId);
    const shouldInclude = nextNotebook.includes(qId);
    await syncAcademiaOriginNotebook(activeTopic.origin, qId, shouldInclude);
    await updateSubject({...activeSubject,topics:activeSubject.topics.map(t=>t.id===activeTopicId?{...t,errorNotebook:nextNotebook}:t)});
  };

  // Bug 6: toggle favorite for a question that came from the exam (carries _subjectId, _topicId)
  const handleExamFavorite = async (q) => {
    const subj = library.find(s=>s.id===q._subjectId); if(!subj) return;
    const topic = subj.topics.find(t=>t.id===q._topicId); if(!topic) return;
    const favs = topic.favorites||[];
    const nf = favs.includes(q.id) ? favs.filter(f=>f!==q.id) : [...favs,q.id];
    await updateSubject({...subj, topics:subj.topics.map(t=>t.id===q._topicId?{...t,favorites:nf}:t)});
    // also update the live exam so the heart icon reflects immediately
    setActiveExam(p=>({...p, _favRefresh:Date.now()}));
  };

  // Helper: is a question favorited (checks the live library, works even during exam)
  const isExamQuestionFav = (q) => {
    const subj = library.find(s=>s.id===q._subjectId);
    const topic = subj?.topics.find(t=>t.id===q._topicId);
    return (topic?.favorites||[]).includes(q.id);
  };

  const handleExamNotebook = async (q) => {
    if (!canUseAdvancedFeatures) return;
    const subj = library.find(s=>s.id===q._subjectId); if(!subj) return;
    const topic = subj.topics.find(t=>t.id===q._topicId); if(!topic) return;
    const errorNotebook = toggleInList(topic.errorNotebook||[], q.id);
    await updateSubject({...subj, topics:subj.topics.map(t=>t.id===q._topicId?{...t,errorNotebook}:t)});
    setActiveExam(p=>({...p, _notebookRefresh:Date.now()}));
  };

  const isExamQuestionInNotebook = (q) => {
    const subj = library.find(s=>s.id===q._subjectId);
    const topic = subj?.topics.find(t=>t.id===q._topicId);
    return (topic?.errorNotebook||[]).includes(q.id);
  };

  // Bug 1: also clear cached insights — they're based on old answers and would be stale
  const resetAnswers = async () => { await updateSubject({...activeSubject,topics:activeSubject.topics.map(t=>t.id===activeTopicId?{...t,answers:{},bizuario:null}:t)}); };
  const resetOnlyWrong = async () => {
    const wrong=(activeTopic.questions||[]).filter(q=>{
      const a=activeTopic.answers?.[q.id];
      if (!a) return false;
      if (q.isOpen) { try { return (JSON.parse(a)?.score ?? 0) < 70; } catch(e) { return false; } }
      return a!==q.options?.find(o=>o.isCorrect)?.letter;
    }).map(q=>q.id);
    const na=Object.fromEntries(Object.entries(activeTopic.answers||{}).filter(([k])=>!wrong.includes(k)));
    await updateSubject({...activeSubject,topics:activeSubject.topics.map(t=>t.id===activeTopicId?{...t,answers:na}:t)});setShowOnlyWrong(false);
  };

  const generateOracleTopicForSubject = async (subject, topic, addPrompt='', { onProgress } = {}) => {
    const cleared = { ...subject, topics: subject.topics.map(t => t.id === topic.id ? { ...t, questions:[], summary:'', answers:{} } : t) };
    await updateSubject(cleared);
    const clearedTopic = cleared.topics.find(t => t.id === topic.id) || topic;

    const topicStyle = clearedTopic.questionStyle || settingsRef.current.questionStyle || 'mixed';
    const subtopicsArr = clearedTopic.subtopics?.filter(s => s.length > 0) || [];
    const qPerSub = Math.max(1, parseInt(settingsRef.current.qPerSub, 10) || 1);
    const promptSubtopicCount = subtopicsArr.length > 0
      ? subtopicsArr.length
      : Math.max(1, parseInt(settingsRef.current.numSubtopics, 10) || 1);
    const total = promptSubtopicCount * qPerSub;
    const subtopicsBlock = subtopicsArr.length > 0
      ? `\n\nSUBTÓPICOS OBRIGATÓRIOS deste tópico (cubra EXATAMENTE estes, sem invenções):\n${subtopicsArr.map((s,i)=>`${i+1}. ${s}`).join('\n')}\n\nREGRA CRÍTICA: gere EXATAMENTE ${qPerSub} questão(ões) para CADA subtópico da lista. NÃO pule subtópicos. NÃO repita subtópicos antes de cobrir todos. Total: EXATAMENTE ${total} questões.`
      : '';
    const matInst = cleared.sourceMaterials
      ? `\n\nINSTRUÇÃO PRIORITÁRIA — MATERIAL BASE DO USUÁRIO:\n${cleared.sourceMaterials}\n\nEsta instrução tem PRIORIDADE MÁXIMA. Siga-a à risca antes de qualquer outra consideração.\n`
      : '';
    const s = {
      ...settingsRef.current,
      numSubtopics: promptSubtopicCount,
      qPerSub,
      questionStyle: topicStyle,
      questionTypes: clearedTopic.questionTypes || settingsRef.current.questionTypes || ['direct'],
    };
    const na = s.numAlternatives || 5;
    const types = s.questionTypes || ['direct'];
    const hasOpen   = types.includes('open');
    const hasEssay  = types.includes('essay');
    const hasClosed = types.some(t => ['direct','vof','cespe'].includes(t));
    const altSuffix = hasClosed
      ? `\n\nATENÇÃO FINAL: Gere TODAS as ${total} questões sem interromper. NÃO pare antes de terminar. Questões com alternativas devem ter EXATAMENTE ${na} alternativas (${['A','B','C','D','E'].slice(0,na).join(', ')}).`
      : `\n\nATENÇÃO FINAL: Gere TODAS as ${total} questões sem interromper. NÃO pare antes de terminar. NÃO inclua alternativas A/B/C/D — apenas enunciado, resposta esperada e explicação.`;
    const PROMPT = buildOracleQuestionPrompt(s, getFocusInst(cleared.focusAreas||[]), s.autoMode||false)
      + matInst + subtopicsBlock
      + (addPrompt ? `\n\nFoco adicional: ${addPrompt}` : '')
      + altSuffix;

    const orderedKeys = getOrderedKeys();
    let lastErr = null;
    for (const { k } of orderedKeys) {
      try {
        const full = await callGeminiStream(`Invoque: ${clearedTopic.title} — ${subject.title}`, PROMPT, k, (acc,qc)=>onProgress?.(qc));
        let allQuestions = [];
        if (hasClosed) {
          const p = parseData(full, `${subject.id}_${clearedTopic.id}`);
          allQuestions = [...allQuestions, ...p.questions];
        }
        if (hasOpen)  { const p = parseOpenQuestions(full, `${subject.id}_${clearedTopic.id}`, false); allQuestions = [...allQuestions, ...p.questions]; }
        if (hasEssay) { const p = parseOpenQuestions(full, `${subject.id}_${clearedTopic.id}`, true);  allQuestions = [...allQuestions, ...p.questions]; }
        const summary = parseData(full).summary;
        const updatedSubject = {
          ...cleared,
          topics: cleared.topics.map(t => t.id === clearedTopic.id
            ? { ...t, questions:allQuestions, summary, answers:{}, favorites:t.favorites||[], spacedReview:t.spacedReview||{}, subtopics:clearedTopic.subtopics, questionStyle:topicStyle }
            : t
          )
        };
        await updateSubject(updatedSubject);
        await rotateKey();
        return { subject:updatedSubject, questionCount:allQuestions.length };
      } catch(e) {
        lastErr = e;
        if (e.message === 'QUOTA_EXCEEDED') { await rotateKey(); continue; }
        break;
      }
    }
    throw lastErr || new Error('CONNECTION_ERROR');
  };

  // Generate questions (streaming)
  const generateBatch = async (topicId, addPrompt='') => {
    if(!checkKey())return;setIsBusy(true);setStreamCount(0);
    let mi=0;setLoadingMsg(LOADING_MSGS[0]);
    const mi_int=setInterval(()=>{mi=(mi+1)%LOADING_MSGS.length;setLoadingMsg(LOADING_MSGS[mi]);},8000);
    const cleared={...activeSubject,topics:activeSubject.topics.map(t=>t.id===topicId?{...t,questions:[],summary:'',answers:{}}:t)};
    await updateSubject(cleared);
    const topic=cleared.topics.find(t=>t.id===topicId);

    // Estilo salvo no tópico tem prioridade sobre settings global
    const topicStyle = topic.questionStyle || settingsRef.current.questionStyle || 'mixed';

    const subtopicsArr = topic.subtopics?.filter(s=>s.length>0) || [];
    const qPerSub = Math.max(1, parseInt(settingsRef.current.qPerSub, 10) || 1);
    const promptSubtopicCount = subtopicsArr.length > 0
      ? subtopicsArr.length
      : Math.max(1, parseInt(settingsRef.current.numSubtopics, 10) || 1);
    const total = promptSubtopicCount * qPerSub;
    const subtopicsBlock = subtopicsArr.length > 0
      ? `\n\nSUBTÓPICOS OBRIGATÓRIOS deste tópico (cubra EXATAMENTE estes, sem invenções):\n${subtopicsArr.map((s,i)=>`${i+1}. ${s}`).join('\n')}\n\nREGRA CRÍTICA: gere EXATAMENTE ${qPerSub} questão(ões) para CADA subtópico da lista. NÃO pule subtópicos. NÃO repita subtópicos antes de cobrir todos. Total: EXATAMENTE ${total} questões.`
      : '';

    // Material base como instrução PRIORITÁRIA — vem antes de tudo no system prompt
    const matInst = cleared.sourceMaterials
      ? `\n\nINSTRUÇÃO PRIORITÁRIA — MATERIAL BASE DO USUÁRIO:\n${cleared.sourceMaterials}\n\nEsta instrução tem PRIORIDADE MÁXIMA. Siga-a à risca antes de qualquer outra consideração.\n`
      : '';

    const s = {
      ...settingsRef.current,
      numSubtopics: promptSubtopicCount,
      qPerSub,
      questionStyle: topicStyle,
      questionTypes: topic.questionTypes || settingsRef.current.questionTypes || ['direct'],
    };
    const na = s.numAlternatives || 5;
    const types = s.questionTypes || ['direct'];
    const hasOpen   = types.includes('open');
    const hasEssay  = types.includes('essay');
    const hasClosed = types.some(t=>['direct','vof','cespe'].includes(t));

    const altSuffix = hasClosed
      ? `\n\nATENÇÃO FINAL: Gere TODAS as ${total} questões sem interromper. NÃO pare antes de terminar. Questões com alternativas devem ter EXATAMENTE ${na} alternativas (${['A','B','C','D','E'].slice(0,na).join(', ')}).`
      : `\n\nATENÇÃO FINAL: Gere TODAS as ${total} questões sem interromper. NÃO pare antes de terminar. NÃO inclua alternativas A/B/C/D — apenas enunciado, resposta esperada e explicação.`;

    const PROMPT = buildOracleQuestionPrompt(s, getFocusInst(cleared.focusAreas||[]), s.autoMode||false)
      + matInst + subtopicsBlock
      + (addPrompt?`\n\nFoco adicional: ${addPrompt}`:'')
      + altSuffix;

    const orderedKeys = getOrderedKeys();
    let err=null, ok=false;
    for (const {k} of orderedKeys) {
      try {
        const full=await callGeminiStream(`Invoque: ${topic.title} — ${activeSubject.title}`,PROMPT,k,(acc,qc)=>setStreamCount(qc));
        // Separar questões fechadas (com alternativas) das abertas
        let allQuestions = [];
        if (hasClosed) {
          const p = parseData(full, `${activeSubject.id}_${topicId}`);
          allQuestions = [...allQuestions, ...p.questions];
        }
        if (hasOpen)  { const p = parseOpenQuestions(full, `${activeSubject.id}_${topicId}`, false); allQuestions = [...allQuestions, ...p.questions]; }
        if (hasEssay) { const p = parseOpenQuestions(full, `${activeSubject.id}_${topicId}`, true);  allQuestions = [...allQuestions, ...p.questions]; }
        const summary = parseData(full).summary;
        await updateSubject({...cleared,topics:cleared.topics.map(t=>t.id===topicId?{...t,questions:allQuestions,summary,answers:{},favorites:t.favorites||[],spacedReview:t.spacedReview||{},subtopics:topic.subtopics,questionStyle:topicStyle}:t)});
        await rotateKey();
        ok=true; break;
      } catch(e) {
        err=e;
        if (e.message==='QUOTA_EXCEEDED') { await rotateKey(); continue; }
        break;
      }
    }
    clearInterval(mi_int);setLoadingMsg('');setStreamCount(0);
    if(!ok) showApiError(err?.message||'CONNECTION_ERROR');
    setIsBusy(false);
  };

  // Creator
  const startCreation = async () => {
    const subjectTitle = newSubName.trim();
    if (!subjectTitle) {
      setErrorModal({ title: 'Título obrigatório', message: 'Digite o nome do assunto antes de gerar a estrutura.', isAlert: true });
      return;
    }
    if(!checkKey())return;setIsBusy(true);
    const s = settingsRef.current;
    const sys = buildOracleSyllabusPrompt(subjectTitle, s, s.autoMode || false);
    const orderedKeys = getOrderedKeys();
    const chunks = buildAcademiaMaterialChunks(materialText, uploadedFiles);
    if (chunks.length > 1) {
      addToast(`Material grande: vou processar em ${chunks.length} partes. Isso usa ${chunks.length} requests.`, 'info', 7000);
    }

    let ok=false;
    let accumulated = '';
    const totalChunks = chunks.length || 1;

    for (let i = 0; i < totalChunks; i++) {
      const chunk = chunks[i] || `Crie o sumário para: ${subjectTitle}`;
      const userMsg = buildChunkedSyllabusMessage({
        chunk,
        index: i,
        total: totalChunks,
        accumulated,
        subjectTitle,
        settings: s,
        source: 'oracle',
      });

      setSyllabus(chunks.length > 1 ? `Processando material ${i + 1}/${totalChunks}...` : '');
      let chunkOk = false;
      for (const {k} of orderedKeys) {
        try {
          const r=await callGemini(userMsg, sys, k, i === 0 ? uploadedImages : []);
          accumulated = normalizeOracleSyllabus(r, s);
          await rotateKey();
          chunkOk = true;
          break;
        } catch(e) {
          if (e.message==='QUOTA_EXCEEDED') { await rotateKey(); continue; }
          showApiError(e.message);
          setIsBusy(false);
          return;
        }
      }
      if (!chunkOk) {
        showApiError('QUOTA_EXCEEDED');
        setIsBusy(false);
        return;
      }
      ok = true;
    }

    if (ok) {
      setSyllabus(accumulated);
      setCreatorStep(2);
    }
    setIsBusy(false);
  };
  const reviseSyllabus = async () => {
    if(!syllabusFB.trim()||!checkKey())return;setIsBusy(true);
    const sys = buildOracleSyllabusRevisePrompt(syllabus, syllabusFB, settingsRef.current);
    const orderedKeys = getOrderedKeys();
    for (const {k} of orderedKeys) {
      try {
        const r=await callGemini('Revise.',sys,k);
        setSyllabus(normalizeOracleSyllabus(r, settingsRef.current));setSyllabusFB('');
        await rotateKey(); break;
      } catch(e) {
        if (e.message==='QUOTA_EXCEEDED') { await rotateKey(); continue; }
        showApiError(e.message); break;
      }
    }
    setIsBusy(false);
  };
  const finalizeSub = async () => {
    const parsedTopics = parseSyllabusTopics(syllabus);
    if (!parsedTopics.length) {
      setErrorModal({ title: 'Sumário ilegível', message: 'Não encontrei tópicos com subtópicos. Use títulos numerados ou "Tópico 1" e liste os subtópicos abaixo.', isAlert: true });
      return;
    }

    const topics = parsedTopics.map(({ title, subtopics }, topicPos) => {
      return {
        id: `t-${topicPos}-${Date.now()}`,
        title,
        subtopics,
        questionStyle: settingsRef.current.questionStyle || 'mixed', // herdado do modal na criação
        questions: [], answers: {}, summary: '', favorites: [], errorNotebook: [], spacedReview: {},
      };
    });

    const ns = { id: Date.now(), title: newSubName, fullSyllabus: syllabus, source: 'gemini', folderId:libFilter==='gemini'?activeFolderId:null, sourceMaterials: getMaterial(), focusAreas, topics };
    await addSubject(ns);
    setLibFilter('gemini'); setView('sub-library'); setCreatorStep(1);
    setNewSubName(''); setMaterialText(''); setUploadedFiles([]); setUploadedImages([]); setFocusAreas([]);
  };

  // Paste import
  const handlePasteImport = async () => {
    const parsed=parseData(pasteText);if(!parsed.questions.length){setErrorModal({title:'Ilegível',message:'Verifique a estrutura.',isAlert:true});return;}
    const sn=pasteSubName.trim()||'Assunto Importado'; const tn=pasteTopic.trim()||`Bloco (${new Date().toLocaleDateString()})`;
    const nt={id:`imp-${Date.now()}`,title:tn,questions:parsed.questions,summary:parsed.summary,answers:{},favorites:[],errorNotebook:[],spacedReview:{}};
    let ts=library.find(s=>s.title.toLowerCase()===sn.toLowerCase()&&s.source==='external'&&s.id!=='imported-folder');
    if(ts){await updateSubject({...ts,topics:[...ts.topics,nt]});setActiveSubjectId(ts.id);}
    else if(!pasteSubName.trim()){const f=library.find(s=>s.id==='imported-folder');if(f)await updateSubject({...f,topics:[...f.topics,nt]});setActiveSubjectId('imported-folder');}
    else{const ns={id:Date.now(),title:sn,source:'external',folderId:libFilter==='external'?activeFolderId:null,fullSyllabus:'Importado',topics:[nt]};await addSubject(ns);setActiveSubjectId(ns.id);}
    setPasteText('');setPasteTopic('');setActiveTopicId(nt.id);setView('topic');
  };

  // Statistics
  // Open Bizuário — cached in topic.bizuario
  // Bug 7: accepts optional overrideData (e.g. from exam results) skipping topicData
  // Open Bizuário for a topic — cached in topic.bizuario, regenerated only if not cached
  const openBizuario = (topic, subject) => {
    if (!checkKey()) return;
    const cachedText = topic.bizuario || null;
    const onSave = (txt) => updateSubject({
      ...subject,
      topics: subject.topics.map(t => t.id === topic.id ? { ...t, bizuario: txt } : t)
    });
    setBizuarioModal({
      topicTitle: topic.title,
      subjectTitle: subject?.title || '',
      questions: topic.questions || [],
      subtopics: topic.subtopics || [],
      cachedText,
      onSave,
      forceRegen: false,
    });
  };

  // Bizuário for a full subject — aggregates all topics
  const openBizuarioSubject = (subject) => {
    if (!checkKey()) return;
    const cachedText = subject.bizuario || null;
    const onSave = (txt) => updateSubject({ ...subject, bizuario: txt });

    // Build aggregated context: for topics with questions use them, for others use subtopics
    const allQuestions = [];
    const topicContexts = subject.topics.map(t => {
      const qs = t.questions || [];
      const subs = t.subtopics || [];
      return { title: t.title, questions: qs, subtopics: subs };
    });

    setBizuarioModal({
      topicTitle: subject.title,
      subjectTitle: '',
      questions: [],           // not used directly — topicContexts handles it
      subtopics: [],
      topicContexts,           // full subject mode
      cachedText,
      onSave,
      forceRegen: false,
    });
  };

  const createFocusedBatch = async (topicData) => {
    if(!checkKey())return;
    const weakData = topicData ? `Foco no tópico: ${topicData.topic.title}` : 'Foco nas áreas com menor desempenho';
    const focusSubject = library.find(s=>s.title==='📌 Focos de Estudo') || {id:Date.now(),title:'📌 Focos de Estudo',source:'gemini',fullSyllabus:'Baterias focadas geradas por IA.',topics:[]};
    const focusTopic = {id:`focus-${Date.now()}`,title:`Foco: ${topicData?.topic.title||new Date().toLocaleDateString()}`,questions:[],answers:{},favorites:[],errorNotebook:[],spacedReview:{}};
    const updated = {...focusSubject,topics:[...focusSubject.topics,focusTopic]};
    if(!library.find(s=>s.title==='📌 Focos de Estudo')) await addSubject(updated); else await updateSubject(updated);
    setActiveSubjectId(updated.id); setActiveTopicId(focusTopic.id); setBizuarioModal(null);
    setView('topic');
    setTimeout(()=>generateBatch(focusTopic.id, weakData),500);
  };

  // Exam
  const startExam = (items,qCount,time) => {
    // Bug 6: include _subjectId and _topicId so favorites can be toggled during exam
    const expanded = items.flatMap(item => {
      if (item.type === 'folder') {
        return getSubjectsInFolderTree(item.folder)
          .flatMap(subject => (subject.topics || []).filter(t => (t.questions || []).length > 0).map(topic => ({ subject, topic })));
      }
      if (item.type === 'subject') {
        return (item.subject.topics || []).filter(t => (t.questions || []).length > 0).map(topic => ({ subject:item.subject, topic }));
      }
      return item.subject && item.topic ? [{ subject:item.subject, topic:item.topic }] : [];
    });
    const seen = new Set();
    const unique = expanded.filter(({subject, topic}) => {
      const key = `${subject.id}__${topic.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const all=unique.flatMap(({subject,topic})=>(topic.questions||[]).map(q=>({...q,_subjectId:subject.id,_topicId:topic.id,_subjectTitle:subject.title,_topicTitle:topic.title})));
    const shuffled=all.sort(()=>Math.random()-.5).slice(0,Math.min(qCount,all.length));
    setActiveExam({id:Date.now(),questions:shuffled,answers:{},timeLeft:time*60,finished:false,blindMode:examBlind});
    setView('exam');
  };

  const saveWhitelist = async (emails) => {
    if (!isAdmin) return;
    setAllowedEmails(emails);
    try { await setDoc(doc(db,'config','videoaulas_whitelist'),{emails}); } catch(e) {}
  };
  const addToWhitelist = async () => {
    if (!isAdmin) return;
    const email = newWhitelistEmail.trim().toLowerCase();
    if (!email || allowedEmails.map(e=>e.toLowerCase()).includes(email)) return;
    await saveWhitelist([...allowedEmails, email]);
    setNewWhitelistEmail('');
  };
  const removeFromWhitelist = async (email) => {
    if (!isAdmin) return;
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return; // nunca remover o admin
    await saveWhitelist(allowedEmails.filter(e=>e.toLowerCase()!==email.toLowerCase()));
  };

  // Helpers
  const countValidAnswers = (topic) => {
    const qs = topic.questions || [];
    const ans = topic.answers || {};
    return qs.filter(q => {
      const v = ans[q.id];
      if (!v || v === 'SKIPPED') return false;
      if (q.isOpen) { try { const p = JSON.parse(v); return !!(p?.answer); } catch(e) { return false; } }
      return true;
    }).length;
  };

  const isCompleteAnswerValue = (value) => {
    if (!value || value === 'SKIPPED') return false;
    if (typeof value === 'string' && value.trim().startsWith('{')) {
      try { return !!JSON.parse(value)?.answer; } catch(e) { return true; }
    }
    return true;
  };

  const getAcademiaQuestionAnswer = (subject, topic, qId) => {
    const own = (topic.answers || {})[qId];
    if (isCompleteAnswerValue(own)) return own;
    const mirrorTopic = librarySubjects
      .filter(s => s.source === 'gemini')
      .flatMap(s => s.topics || [])
      .find(t =>
        t.origin?.source === 'academia' &&
        String(t.origin.subjectId) === String(subject.id) &&
        String(t.origin.topicId) === String(topic.id)
      );
    return mirrorTopic?.answers?.[qId];
  };

  const subjectProgress = (s) => {
    if (s.source === 'academia') {
      // Academia progress tracks required fixation only; extra batteries are optional practice.
      const allFixqs = s.topics.flatMap(t =>
        Object.values(t.fixationQuestions||{}).flat().map(q => ({ q, topic:t }))
      );
      if (allFixqs.length === 0) return s.topics.every(t=>t.lessonGenerated) ? 100 : 0;
      const answered = allFixqs.filter(({q, topic}) => isCompleteAnswerValue(getAcademiaQuestionAnswer(s, topic, q.id))).length;
      return Math.round(answered / allFixqs.length * 100);
    }
    const all = s.topics.flatMap(t=>t.questions||[]);
    const ans = s.topics.reduce((acc,t) => acc + countValidAnswers(t), 0);
    return all.length>0 ? Math.round(ans/all.length*100) : 0;
  };
  // ── ACADEMIA: funções de criação ──────────────────────────────────────────

  const getAcademiaMaterial = () => {
    return buildAcademiaMaterialText(academiaMaterialText, academiaUploadedFiles);
  };

  const startAcademiaCreation = async () => {
    const subjectTitle = academiaSubName.trim();
    if (!subjectTitle) {
      setErrorModal({ title: 'Título obrigatório', message: 'Digite o nome da aula antes de gerar a estrutura.', isAlert: true });
      return;
    }
    if (!checkKey()) return;
    setIsBusy(true);
    const s = settingsRef.current;
    const sys = buildAcademiaSyllabusPrompt(subjectTitle, s, s.autoMode || false);
    const chunks = buildAcademiaMaterialChunks(academiaMaterialText, academiaUploadedFiles);
    if (chunks.length > 1) {
      addToast(`Material grande: vou processar em ${chunks.length} partes. Isso usa ${chunks.length} requests.`, 'info', 7000);
    }

    let ok = false;
    let accumulated = '';
    const totalChunks = chunks.length || 1;

    for (let i = 0; i < totalChunks; i++) {
      const chunk = chunks[i] || `Crie o sumário para: ${subjectTitle}`;
      const userMsg = buildChunkedSyllabusMessage({
        chunk,
        index: i,
        total: totalChunks,
        accumulated,
        subjectTitle,
        settings: s,
        source: 'academia',
      });

      setAcademiaSyllabus(chunks.length > 1 ? `Processando material ${i + 1}/${totalChunks}...` : '');
      let chunkOk = false;
      const orderedKeys = getOrderedKeys();
      for (const { k } of orderedKeys) {
        try {
          const r = await callGemini(userMsg, sys, k, i === 0 ? academiaUploadedImages : []);
          accumulated = normalizeAcademiaSyllabus(r, s);
          await rotateKey();
          chunkOk = true;
          break;
        } catch (e) {
          if (e.message === 'QUOTA_EXCEEDED') { await rotateKey(); continue; }
          showApiError(e.message);
          setIsBusy(false);
          return;
        }
      }
      if (!chunkOk) {
        showApiError('QUOTA_EXCEEDED');
        setIsBusy(false);
        return;
      }
      ok = true;
    }

    if (ok) {
      setAcademiaSyllabus(accumulated);
      setAcademiaCreatorStep(2);
    }
    setIsBusy(false);
  };

  const reviseAcademiaSyllabus = async () => {
    if (!academiaSyllabusFB.trim() || !checkKey()) return;
    setIsBusy(true);
    const sys = buildOracleSyllabusRevisePrompt(academiaSyllabus, academiaSyllabusFB, {...settingsRef.current, source: 'academia'});
    const orderedKeys = getOrderedKeys();
    for (const { k } of orderedKeys) {
      try {
        const r = await callGemini('Revise.', sys, k);
        setAcademiaSyllabus(normalizeAcademiaSyllabus(r, settingsRef.current));
        setAcademiaSyllabusFB('');
        await rotateKey(); break;
      } catch (e) {
        if (e.message === 'QUOTA_EXCEEDED') { await rotateKey(); continue; }
        showApiError(e.message); break;
      }
    }
    setIsBusy(false);
  };

  const finalizeAcademia = async () => {
    const parsedTopics = parseSyllabusTopics(academiaSyllabus);
    if (!parsedTopics.length) {
      setErrorModal({ title: 'Sumário ilegível', message: 'Não encontrei tópicos com subtópicos. Use títulos numerados ou "Tópico 1" e liste os subtópicos abaixo.', isAlert: true });
      return;
    }

    const topics = parsedTopics.map(({ title, subtopics }, topicPos) => {
      return {
        id: `ac-${topicPos}-${Date.now()}`,
        title,
        subtopics,
        questionStyle: settingsRef.current.questionStyle || 'mixed',
        questions: [],
        answers: {},
	        summary: '',
	        favorites: [],
	        errorNotebook: [],
	        spacedReview: {},
        // Academia-specific fields
        lessonSections: {},   // { subtopicIndex: markdownText }
        fixationQuestions: {}, // { subtopicIndex: [questions] }
        lessonGenerated: false,
      };
    });

    const ns = {
      id: Date.now(),
      title: academiaSubName,
      fullSyllabus: academiaSyllabus,
      source: 'academia',
      folderId: libFilter==='academia' ? activeFolderId : null,
      sourceMaterials: getAcademiaMaterial(),
      focusAreas: academiaFocusAreas,
      topics,
    };

    await addSubject(ns);
    setAcademiaSubName('');
    setAcademiaMaterialText('');
    setAcademiaUploadedFiles([]);
    setAcademiaUploadedImages([]);
    setAcademiaSyllabus('');
    setAcademiaFocusAreas([]);
    setAcademiaCreatorStep(1);
    setView('library');
    addToast('Academia criada! Agora entre no assunto e gere as aulas.', 'success', 4000);
  };

  // ── ACADEMIA: geração da aula ─────────────────────────────────────────────

  const generateAcademiaLessonForSubject = async (topic, subject, lessonSettings = {}, { onProgress } = {}) => {
    const s = { ...settingsRef.current, ...lessonSettings };
    const material = subject.sourceMaterials || '';
    const subtopics = topic.subtopics || [];

    const na = s.numAlternatives || 5;
    const alts = na === 4
      ? 'A) [alternativa]\nB) [alternativa]\nC) [alternativa]\nD) [alternativa]'
      : 'A) [alternativa]\nB) [alternativa]\nC) [alternativa]\nD) [alternativa]\nE) [alternativa]';

    const orderedKeys = getOrderedKeys();

    // Requisição A: aula em markdown
    let lessonText = '';
    const lessonLevel = s.explanationLength || 'complete';
    const lessonPrompt = buildAcademiaLessonPrompt(topic.title, subtopics, material, subject.title, lessonLevel, s.regenReason || '');
    const lessonSystemPrompt = lessonLevel === 'essential'
      ? 'Você é professor de medicina. Escreva em português. Modo Nível 1: escreva em outline de revisão tipo Pathoma/First Aid. Após cada ##, comece com um título curto em negrito que dê contexto aos bullets. Use bullets densos e sem letras ou números como marcadores.'
      : 'Você é professor de medicina. Escreva em português. Após cada ##, comece com um título curto em negrito que dê contexto à explicação.';
    onProgress?.('📝 Gerando explicação dos subtópicos...');
    let lessonErr = null;
    for (const { k } of orderedKeys) {
      try {
        lessonText = await callGemini(
          lessonPrompt,
          lessonSystemPrompt,
          k,
          [],
          {}
        );
        await rotateKey();
        break;
      } catch (e) {
        lessonErr = e;
        if (e.message === 'QUOTA_EXCEEDED') { await rotateKey(); continue; }
        break;
      }
    }
    if (!lessonText) throw lessonErr || new Error('CONNECTION_ERROR');

    const lessonSections = parseAcademiaLessonSections(lessonText, subtopics);
    const fixationPlan = buildAcademiaFixationPlan(subtopics, lessonSections);

    // Requisição B: questões de fixação da aula como um todo
    onProgress?.('Gerando questões de fixação...');
	    const fixPrompt = buildAcademiaFixationPrompt(
	      subtopics,
	      topic.title,
	      s,
	      lessonText,
	      fixationPlan,
	      summarizeQuestionsForPrompt(getTopicReviewQuestions({source:'academia'}, topic))
	    );
    let fixText = '';
    const orderedKeys2 = getOrderedKeys();
    for (const { k } of orderedKeys2) {
      try {
        fixText = await callGemini(fixPrompt, 'Você é examinador de residência médica. Escreva em português.', k);
        await rotateKey();
        break;
      } catch (e) {
        if (e.message === 'QUOTA_EXCEEDED') { await rotateKey(); continue; }
        // Questões falharam mas temos a aula — continua sem questões
        break;
      }
    }

    // Parsear as questões de fixação; se falhar, preserva a aula e segue sem questões.
    let fixQuestions = [];
    if (fixText) {
      try {
        fixQuestions = parseData(fixText, `acfix_${topic.id}_${Date.now()}`).questions;
      } catch(e) {
        onProgress?.('Questões de fixação vieram malformadas; salvando a aula sem elas.');
      }
    }
    const fixationBySubtopic = distributeAcademiaFixQuestions(fixQuestions, fixationPlan);

    // Salvar no tópico
    const updatedTopic = {
      ...topic,
      lessonSections,
      fixationQuestions: fixationBySubtopic,
      lessonGenerated: true,
    };
    const updatedSubject = {
      ...subject,
      topics: subject.topics.map(t => t.id === topic.id ? updatedTopic : t),
    };
    await updateSubject(updatedSubject);
    if (fixQuestions.length) {
      await ensureAcademiaOracleTopic({
        subject:updatedSubject,
        topic:updatedTopic,
        kind:'fixation',
        questions:fixQuestions,
        questionStyle:s.questionStyle || 'mixed',
      });
    }
    return { subject:updatedSubject, fixationCount:fixQuestions.length };
  };

  const generateAcademiaLesson = async (topic, subject, lessonSettings = {}) => {
    if (!checkKey()) return;
    setAcademiaGenerating(true);
    setAcademiaGenProgress('Gerando aula e questões de fixação...');
    try {
      const result = await generateAcademiaLessonForSubject(topic, subject, lessonSettings, { onProgress:setAcademiaGenProgress });
      addToast('Aula gerada com sucesso!', 'success', 4000);
      return result?.subject;
    } catch(e) {
      showApiError(e.message || 'CONNECTION_ERROR');
      return null;
    } finally {
      setAcademiaGenerating(false);
      setAcademiaGenProgress('');
    }
  };

  const openAcademiaQuestionsInOracle = async (subject, topic, kind='fixation', bloco=null) => {
    const questions = kind === 'extra'
      ? (bloco?.questions || bloco || [])
      : Object.values(topic.fixationQuestions || {}).flat();
    if (!questions.length) {
      addToast('Nenhuma questão disponível ainda.', 'info', 3000);
      return;
    }
    const extraId = bloco?.id || bloco?.oracleTopicId?.replace(`academia_extra_${topic.id}_`, '') || null;
    const oracle = await ensureAcademiaOracleTopic({
      subject,
      topic,
      kind,
      questions,
      title:kind === 'extra' ? (bloco?.title || 'Bateria extra') : 'Fixação',
      extraId,
      questionStyle:settingsRef.current.questionStyle || 'mixed',
    });
    setLibFilter('gemini');
    setActiveFolderId(oracle.folder?.id || null);
    setActiveSubjectId(oracle.subject.id);
    setActiveTopicId(oracle.topic.id);
    setShowOnlyWrong(false);
    setView('topic');
  };

  useEffect(() => {
    if (!canUseAdvancedFeatures || academiaOracleMigratedRef.current || !librarySubjects.some(s => s.source === 'academia')) return;
    academiaOracleMigratedRef.current = true;
    (async () => {
      const academiaSubjects = librarySubjects.filter(s => s.source === 'academia');
      for (const subject of academiaSubjects) {
        for (const topic of subject.topics || []) {
          const fixQs = Object.values(topic.fixationQuestions || {}).flat();
          if (fixQs.length) {
            await ensureAcademiaOracleTopic({subject, topic, kind:'fixation', questions:fixQs, questionStyle:topic.questionStyle || settingsRef.current.questionStyle || 'mixed'});
          }
          for (const bloco of topic.extraBattery || []) {
            const qs = bloco.questions || bloco || [];
            if (qs.length) {
              await ensureAcademiaOracleTopic({subject, topic, kind:'extra', questions:qs, title:bloco.title || 'Bateria extra', extraId:bloco.id || null, questionStyle:topic.questionStyle || settingsRef.current.questionStyle || 'mixed'});
            }
          }
        }
      }
    })();
  }, [canUseAdvancedFeatures, librarySubjects.length]); // eslint-disable-line

  const startBulkGenerate = async () => {
    const initialSubject = library.find(s => s.id === bulkGenerateModal?.subjectId);
    if (!initialSubject || bulkGenerateRun.running || !checkKey()) return;

    const targets = getBulkGenerateTargets(initialSubject);
    if (!targets.length) {
      setBulkGenerateRun({
        running:false,
        current:0,
        total:0,
        logs:[createBulkLog('success', 'Nada pendente: todos os blocos desta pasta já foram gerados.')]
      });
      return;
    }

    setBulkGenerateRun({
      running:true,
      current:0,
      total:targets.length,
      logs:[createBulkLog('info', `Iniciando geração sequencial de ${targets.length} bloco${targets.length!==1?'s':''}.`)]
    });

    const toastId = addToast(`Gerar tudo: 0/${targets.length} blocos concluídos...`, 'loading', 0);
    let workingSubject = initialSubject;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const topic = workingSubject.topics.find(t => t.id === target.id) || target;
      setBulkGenerateRun(p => ({ ...p, current:i + 1 }));
      addBulkLog('loading', `Gerando "${topic.title}" (${i + 1}/${targets.length})...`);

      try {
        let result = null;
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            if (workingSubject.source === 'academia') {
              result = await generateAcademiaLessonForSubject(topic, workingSubject, {}, {
                onProgress: msg => addBulkLog('info', `"${topic.title}": ${msg.replace(/^📝\s*/, '')}`)
              });
            } else {
              result = await generateOracleTopicForSubject(workingSubject, topic, '', {
                onProgress: count => {
                  if (count > 0) setStreamCount(count);
                }
              });
            }
            break;
          } catch(e) {
            if (attempt === 1 && isRetryableBulkError(e)) {
              addBulkLog('info', `"${topic.title}" teve instabilidade (${getBulkErrorText(e)}). Aguardando 3s e tentando de novo...`);
              await new Promise(resolve => setTimeout(resolve, 3000));
              continue;
            }
            throw e;
          }
        }

        workingSubject = result?.subject || workingSubject;
        successCount++;
        const detail = workingSubject.source === 'academia'
          ? `${result?.fixationCount || 0} questões de fixação`
          : `${result?.questionCount || 0} questões`;
        addBulkLog('success', `"${topic.title}" concluído (${detail}).`);
      } catch(e) {
        errorCount++;
        addBulkLog('error', `"${topic.title}" falhou: ${getBulkErrorText(e)}. Pulei este bloco e continuei.`);
      }

      updateToast(toastId, `Gerar tudo: ${successCount}/${targets.length} blocos concluídos${errorCount ? `, ${errorCount} erro${errorCount!==1?'s':''}` : ''}...`, errorCount ? 'info' : 'loading');
    }

    setStreamCount(0);
    setBulkGenerateRun(p => ({ ...p, running:false, current:targets.length }));
    const finalType = errorCount ? 'info' : 'success';
    updateToast(toastId, `Gerar tudo finalizado: ${successCount} certo${successCount!==1?'s':''}, ${errorCount} erro${errorCount!==1?'s':''}.`, finalType);
    setTimeout(() => removeToast(toastId), 15000);
  };

  const generateAcademiaExtraBattery = async (topic, subject, extraSettings = null) => {
    if (!checkKey()) return;
    setAcademiaExtraBusy(true);
    try {
      const s = extraSettings || settingsRef.current;
      const subtopics = topic.subtopics || [];
	      const lessonText = Object.values(topic.lessonSections || {}).map(sec => `${sec?.title || ''}\n${sec?.content || ''}`).join('\n\n');
	      const previousQuestions = summarizeQuestionsForPrompt(getTopicReviewQuestions({source:'academia'}, topic));
	      const prompt = buildAcademiaExtraBatteryPrompt(topic.title, subtopics, s, lessonText, previousQuestions);
      const orderedKeys = getOrderedKeys();
      let extraText = '';
      for (const { k } of orderedKeys) {
        try {
          extraText = await callGemini(prompt, 'Você é examinador de residência médica. Escreva em português.', k);
          await rotateKey();
          break;
        } catch (e) {
          if (e.message === 'QUOTA_EXCEEDED') { await rotateKey(); continue; }
          showApiError(e.message);
          return;
        }
      }

      const parsed = parseData(extraText, `extra_${topic.id}_${Date.now()}`);
      if (!parsed.questions.length) {
        addToast('Nenhuma questão foi gerada. Tente novamente.', 'info', 4000);
        return;
      }

      const extraId = `eb_${Date.now()}`;
      const extraTitle = `Bateria ${(topic.extraBattery||[]).length + 1}`;

      // Salva no tópico da Academia (campo extraBattery) E cria/atualiza assunto no Oráculo
      const updatedTopic = {
        ...topic,
        extraBattery: [...(topic.extraBattery || []), {
          id: extraId,
          title: extraTitle,
          generatedAt: Date.now(),
          oracleTopicId: `academia_extra_${topic.id}_${extraId}`,
          questions: parsed.questions,
        }],
      };
      const updatedSubject = {
        ...subject,
        topics: subject.topics.map(t => t.id === topic.id ? updatedTopic : t),
      };
      await updateSubject(updatedSubject);

      const oracle = await ensureAcademiaOracleTopic({
        subject:updatedSubject,
        topic:updatedTopic,
        kind:'extra',
        questions:parsed.questions,
        title:extraTitle,
        extraId,
        questionStyle:s.questionStyle || 'mixed',
      });
      setLibFilter('gemini');
      setActiveFolderId(oracle.folder?.id || null);
      setActiveSubjectId(oracle.subject.id);
      setActiveTopicId(oracle.topic.id);
      setShowOnlyWrong(false);
      setView('topic');

      addToast(`${parsed.questions.length} questões extras adicionadas ao Oráculo!`, 'success', 5000);
    } catch (e) {
      showApiError(e.message || 'CONNECTION_ERROR');
    } finally {
      setAcademiaExtraBusy(false);
    }
  };

  const openErrorReviewModal = ({ subject, topic, questions=[], notebookIds=[], sourceLabel='', pathTitles=null }) => {
    const ids = new Set(notebookIds || []);
    const selected = questions.filter(q => ids.has(q.id));
    if (!selected.length) {
      addToast('O caderno de erros deste bloco ainda está vazio.', 'info', 4000);
      return;
    }
    setErrorReviewQStyle(settingsRef.current.questionStyle || 'mixed');
    setErrorReviewQTypes(settingsRef.current.questionTypes || ['direct']);
    setErrorReviewQAlts(settingsRef.current.numAlternatives || 5);
    setErrorReviewModal({ subject, topic, questions:selected, notebookIds, sourceLabel, pathTitles });
  };

  const sourceLabelForErrorReview = (subject = {}, explicit = '') => {
    if (explicit) return explicit;
    if (subject.source === 'academia') return 'Academia';
    if (subject.source === 'external') return 'Externo';
    if (subject.source === 'curso') return 'Curso';
    return 'Oráculo';
  };

  const getErrorReviewFolderPath = (payload) => {
    if (Array.isArray(payload?.pathTitles) && payload.pathTitles.length) return payload.pathTitles.filter(Boolean);
    const subject = payload.subject || {};
    const topic = payload.topic || {};
    const sourceLabel = sourceLabelForErrorReview(subject, payload.sourceLabel);
    const sourcePath = subject.folderId ? getFolderPath(subject.folderId).filter(f => f.source === subject.source).map(f => f.title) : [];
    return [sourceLabel, ...sourcePath, subject.title, topic.title].filter(Boolean);
  };

  const ensureErrorNotebookFolder = async (pathTitles = []) => {
    let items = libraryRef.current?.length ? libraryRef.current : library;
    let rootResult = await ensureFolderByTitle('gemini', 'Caderno de erros', null, items);
    let root = rootResult.folder;
    items = rootResult.items;
    if (root.mirrorRoot !== 'errorNotebook') {
      root = { ...root, mirrorRoot:'errorNotebook' };
      await updateSubject(root);
      items = libraryRef.current?.length ? libraryRef.current : items.map(item => item.id === root.id ? root : item);
    }
    const pathResult = await ensureFolderPath('gemini', pathTitles, root.id, items);
    return pathResult.folder || root;
  };

  const generateErrorNotebookReview = async (cfg) => {
    if (!errorReviewModal || !checkKey()) return;
    setIsBusy(true);
    try {
      const s = {
        ...settingsRef.current,
        questionStyle:cfg.questionStyle,
        questionTypes:cfg.questionTypes,
        numAlternatives:cfg.numAlternatives,
      };
      const prompt = buildErrorNotebookReviewPrompt({
        subjectTitle:errorReviewModal.subject?.title || sourceLabelForErrorReview(errorReviewModal.subject, errorReviewModal.sourceLabel),
        topicTitle:errorReviewModal.topic?.title || 'Caderno de erros',
        questions:errorReviewModal.questions || [],
        settings:s,
      });
      const orderedKeys = getOrderedKeys();
      let text = '';
      for (const { k } of orderedKeys) {
        try {
          text = await callGemini(prompt, 'Você é examinador de residência médica. Escreva em português do Brasil.', k);
          await rotateKey();
          break;
        } catch (e) {
          if (e.message === 'QUOTA_EXCEEDED') { await rotateKey(); continue; }
          showApiError(e.message);
          return;
        }
      }
      if (!text) {
        showApiError('QUOTA_EXCEEDED');
        return;
      }
      const namespace = `err_${Date.now()}`;
      const questionType = (s.questionTypes || ['direct'])[0];
      const parsed = ['open', 'essay'].includes(questionType)
        ? parseOpenQuestions(text, namespace, questionType === 'essay')
        : parseData(text, namespace);
      if (!parsed.questions.length) {
        addToast('Não consegui ler as questões geradas. Tente de novo.', 'info', 5000);
        return;
      }
      const pathTitles = getErrorReviewFolderPath(errorReviewModal);
      const targetFolder = await ensureErrorNotebookFolder(pathTitles);
      const dateLabel = new Date().toLocaleDateString('pt-BR');
      const baseTitle = errorReviewModal.topic?.title || 'Revisão';
      const newTopic = {
        id:`err_topic_${Date.now()}`,
        title:`Revisão do caderno de erros`,
        questions:parsed.questions,
        summary:parsed.summary || `Questões geradas a partir de ${errorReviewModal.questions.length} questão(ões) no caderno de erros.`,
        answers:{},
        favorites:[],
        errorNotebook:[],
        spacedReview:{},
        questionStyle:s.questionStyle || 'mixed',
        questionTypes:s.questionTypes || ['direct'],
        origin:{
          source:'errorNotebook',
          sourceSubjectTitle:errorReviewModal.subject?.title || '',
          sourceTopicTitle:baseTitle,
          generatedAt:Date.now(),
          sourceQuestionIds:(errorReviewModal.questions || []).map(q => q.id),
        },
      };
      const newSubject = {
        id:`error_notebook_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
        title:`${baseTitle} — ${dateLabel}`,
        source:'gemini',
        folderId:targetFolder?.id || null,
        fullSyllabus:`Revisão do caderno de erros: ${pathTitles.join(' > ')}`,
        topics:[newTopic],
        origin:{ source:'errorNotebook', pathSnapshot:pathTitles, generatedAt:Date.now() },
      };
      await addSubject(newSubject);
      setErrorReviewModal(null);
      setLibFilter('gemini');
      setActiveFolderId(targetFolder?.id || null);
      setActiveSubjectId(newSubject.id);
      setActiveTopicId(newTopic.id);
      setShowOnlyWrong(false);
      setView('topic');
      addToast(`${parsed.questions.length} questões criadas no Caderno de erros.`, 'success', 5000);
    } catch (e) {
      showApiError(e.message || 'CONNECTION_ERROR');
    } finally {
      setIsBusy(false);
    }
  };

  // ── FIM ACADEMIA ──────────────────────────────────────────────────────────

  const wrongCount = activeTopic?(activeTopic.questions||[]).filter(q=>{
    const a=activeTopic.answers?.[q.id];
    if (!a) return false;
    if (q.isOpen) { try { return (JSON.parse(a)?.score ?? 0) < 70; } catch(e) { return false; } }
    return a!==q.options?.find(o=>o.isCorrect)?.letter;
  }).length:0;
  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
	  const getTopicReviewQuestions = (subject, topic) => {
	    if (subject.source === 'academia') {
	      return Object.values(topic.fixationQuestions || {}).flat()
	        .concat((topic.extraBattery || []).flatMap(b => b.questions || b));
	    }
	    return topic.questions || [];
	  };
	  const getTopicErrorNotebookQuestions = (subject, topic) => {
	    const ids = new Set(topic.errorNotebook || []);
	    if (!ids.size) return [];
	    return getTopicReviewQuestions(subject, topic).filter(q => ids.has(q.id));
	  };
	  const getSubjectErrorNotebookQuestions = (subject) => (subject?.topics || [])
	    .flatMap(topic => getTopicErrorNotebookQuestions(subject, topic));
	  const getFolderErrorNotebookSources = (folder) => getFolderReviewSources(folder)
	    .map(({subject, topic}) => {
	      const questions = getTopicErrorNotebookQuestions(subject, topic);
	      return questions.length ? {subject, topic, questions} : null;
	    })
	    .filter(Boolean);
	  const openSubjectErrorReview = (subject) => {
	    const questions = getSubjectErrorNotebookQuestions(subject);
	    if (!questions.length) {
	      addToast('O caderno de erros deste assunto ainda está vazio.', 'info', 4000);
	      return;
	    }
	    const sourceLabel = sourceLabelForErrorReview(subject);
	    const sourcePath = subject.folderId ? getFolderPath(subject.folderId).filter(f => f.source === subject.source).map(f => f.title) : [];
	    openErrorReviewModal({
	      subject,
	      topic:{id:`subject_error_${subject.id}`, title:'Caderno de erros do assunto'},
	      questions,
	      notebookIds:questions.map(q => q.id),
	      sourceLabel,
	      pathTitles:[sourceLabel, ...sourcePath, subject.title, 'Caderno de erros'],
	    });
	  };
	  const openFolderErrorReview = (folder) => {
	    const sources = getFolderErrorNotebookSources(folder);
	    const questions = sources.flatMap(s => s.questions);
	    if (!questions.length) {
	      addToast('O caderno de erros desta pasta ainda está vazio.', 'info', 4000);
	      return;
	    }
	    const sourceLabel = folder.source === 'academia' ? 'Academia' : folder.source === 'external' ? 'Externo' : 'Oráculo';
	    openErrorReviewModal({
	      subject:{id:`folder_error_${folder.id}`, title:folder.title, source:folder.source, folderId:folder.id},
	      topic:{id:`folder_error_topic_${folder.id}`, title:'Caderno de erros da pasta'},
	      questions,
	      notebookIds:questions.map(q => q.id),
	      sourceLabel,
	      pathTitles:[sourceLabel, ...getFolderPath(folder.id).filter(f => f.source === folder.source).map(f => f.title), 'Caderno de erros'],
	    });
	  };
	  const summarizeQuestionsForPrompt = (questions = []) => questions.slice(0, 80).map((q, i) => {
	    const correct = (q.options || []).find(o => o.isCorrect)?.text || q.expectedAnswer || '';
	    return `${i + 1}. ${String(q.statement || '').replace(/\n/g, ' ').slice(0, 180)}${correct ? ` | Correta: ${String(correct).slice(0, 120)}` : ''}`;
	  }).join('\n');
  const getFolderReviewSources = (folder) => {
    const children = getSubjectsInFolderTree(folder);
    return children.flatMap(subject => (subject.topics || []).map(topic => {
      const questions = getTopicReviewQuestions(subject, topic);
      return questions.length ? { subject, topic, questions } : null;
    }).filter(Boolean));
  };
  const openFolderReview = (folder) => {
    const sources = getFolderReviewSources(folder);
    const selected = Object.fromEntries(sources.map(({subject, topic}) => [`${subject.id}__${topic.id}`, true]));
    setFolderReviewConfig({ total:Math.min(30, Math.max(1, sources.reduce((a, s) => a + s.questions.length, 0))), perTopic:5, selected });
    setFolderReviewModal(folder);
  };
  const createFolderReview = async () => {
    const folder = folderReviewModal;
    if (!folder) return;
    const sources = getFolderReviewSources(folder).filter(({subject, topic}) => folderReviewConfig.selected[`${subject.id}__${topic.id}`]);
    const total = Math.max(1, parseInt(folderReviewConfig.total, 10) || 1);
    const perTopic = Math.max(1, parseInt(folderReviewConfig.perTopic, 10) || 1);
    const picked = [];
    const rest = [];
    sources.forEach(({subject, topic, questions}) => {
      const stats = topic.reviewStats || {};
      const ranked = [...questions].map(q => ({ subject, topic, q, count:stats[q.id] || 0, rand:Math.random() }))
        .sort((a,b) => (a.count - b.count) || (a.rand - b.rand));
      picked.push(...ranked.slice(0, perTopic));
      rest.push(...ranked.slice(perTopic));
    });
    const final = [...picked, ...rest.sort((a,b)=>(a.count-b.count)||(a.rand-b.rand))]
      .slice(0, total)
      .sort(()=>Math.random()-.5);
    if (!final.length) return;

    const updates = new Map();
    final.forEach(({subject, topic, q}) => {
      if (!updates.has(subject.id)) updates.set(subject.id, { subject, topicIds:new Map() });
      const subjectUpdate = updates.get(subject.id);
      if (!subjectUpdate.topicIds.has(topic.id)) subjectUpdate.topicIds.set(topic.id, { topic, ids:[] });
      subjectUpdate.topicIds.get(topic.id).ids.push(q.id);
    });
    for (const {subject, topicIds} of updates.values()) {
      const updatedTopics = (subject.topics || []).map(t => {
        const hit = topicIds.get(t.id);
        if (!hit) return t;
        const reviewStats = { ...(t.reviewStats || {}) };
        hit.ids.forEach(id => { reviewStats[id] = (reviewStats[id] || 0) + 1; });
        return { ...t, reviewStats };
      });
      await updateSubject({ ...subject, topics:updatedTopics });
    }

    const now = Date.now();
    const reviewTopic = {
      id:`folder-review-${now}`,
      title:`Revisão — ${folder.title} (${new Date(now).toLocaleDateString('pt-BR')})`,
      questions: final.map(({subject, topic, q}, i) => ({
        ...q,
        id:`rev_${now}_${i}_${q.id}`,
        _originSubjectId:subject.id,
        _originTopicId:topic.id,
        _originQId:q.id,
        _subjectTitle:subject.title,
        _topicTitle:topic.title,
      })),
      answers:{}, favorites:[], errorNotebook:[], spacedReview:{},
      summary:`Bloco de revisão criado a partir da pasta "${folder.title}".`,
      sourceFolderId:folder.id,
    };
    const reviewTitle = 'Revisões de Pastas';
    const existing = librarySubjects.find(s => s.source === 'gemini' && s.title === reviewTitle);
    if (existing) {
      await updateSubject({ ...existing, folderId:folder.source === 'gemini' ? folder.id : existing.folderId, topics:[...(existing.topics || []), reviewTopic] });
      setActiveSubjectId(existing.id);
    } else {
      const ns = { id:Date.now()+1, title:reviewTitle, source:'gemini', folderId:folder.source === 'gemini' ? folder.id : null, fullSyllabus:'Revisões criadas a partir de pastas.', topics:[reviewTopic] };
      await addSubject(ns);
      setActiveSubjectId(ns.id);
    }
    setActiveTopicId(reviewTopic.id);
    setFolderReviewModal(null);
    setLibFilter('gemini');
    setView('topic');
    addToast(`${final.length} questões adicionadas ao Oráculo.`, 'success', 5000);
  };

  // ── AUTH ──────────────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const mustUseRedirect = window.location.hostname.includes('scf.usercontent.goog');
      if (mustUseRedirect) {
        await signInWithRedirect(auth, getGoogleProvider());
        return;
      }
      await signInWithPopup(auth, getGoogleProvider());
    } catch(e) {
      console.error('Google popup login failed:', e);
      const canFallbackToRedirect = ['auth/popup-blocked', 'auth/cancelled-popup-request', 'auth/popup-closed-by-user'].includes(e?.code);
      if (canFallbackToRedirect) {
        try {
          await signInWithRedirect(auth, getGoogleProvider());
          return;
        } catch(redirectError) {
          console.error('Google redirect login failed:', redirectError);
          setErrorModal({title:'Erro no login Google', message:authErrorMessage(redirectError), isAlert:true});
          return;
        }
      }
      setErrorModal({title:'Erro no login Google', message:authErrorMessage(e), isAlert:true});
    }
  };
  const handleAnonLogin   = async () => { try{await setPersistence(auth, browserLocalPersistence);await signInAnonymously(auth);}catch(e){console.error('Anonymous login failed:', e);setErrorModal({title:'Erro',message:authErrorMessage(e, 'Login anônimo falhou.'),isAlert:true});} };
  const handleRegister    = async () => {
    if(!sigName.trim()||!sigKey.trim()||!user)return;
    const name=sigName.trim().toUpperCase(); const ns={...defaultSettings,apiKey:sigKey.trim(),apiKey1:sigKey.trim()};
    if(user.isAnonymous){writeStorageText('qb_username',name);writeStorageJson(`qb_settings_${name}`,ns);setUsername(name);setSettings(ns);}
    else{try{await setDoc(doc(db,'users',user.uid),{username:name,apiKey:sigKey.trim(),settings:ns});setUsername(name);setSettings(ns);}catch(e){setErrorModal({title:'Erro',message:'Falha ao registrar.',isAlert:true});}}
  };
  const handleLogout = async () => { await signOut(auth);setLibrary([]);setSettings(defaultSettings);setView('library');setSigName('');setSigKey('');removeStorageItem('qb_username'); };

  // ─────────────────────────────────────────────────────────────────────────
  if (!authReady) return <div className={`min-h-screen flex items-center justify-center ${darkMode?'bg-gray-900 text-yellow-500':'bg-gray-50 text-yellow-600'}`}><Spinner className="w-12 h-12 text-current"/></div>;

  if (!username) return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode?'bg-gray-900 text-gray-100':'bg-gray-50 text-gray-900'}`}>
      <div className={`w-full max-w-md p-8 rounded-2xl shadow-xl border ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-4 bg-yellow-100 rounded-full mb-4"><Landmark className="w-10 h-10 text-yellow-600"/></div>
          <h1 className="text-3xl font-serif font-bold text-yellow-600 mb-2">Ágora do Saber</h1>
          <p className="opacity-70 text-sm">{loginView==='login'?'Acesse sua conta.':'Crie seu perfil.'}</p>
        </div>
        {loginView==='login'?(
          <div className="space-y-4">
            <button onClick={handleGoogleLogin} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 border ${darkMode?'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700':'bg-white border-gray-200 hover:bg-gray-50'}`}><GoogleIcon/>Entrar com Google</button>
            {isCanvas&&<button onClick={handleAnonLogin} className="w-full bg-stone-700 hover:bg-stone-800 text-white py-4 rounded-xl font-bold">Entrar como Convidado</button>}
          </div>
        ):(
          <div className="space-y-4">
            <input type="text" value={sigName} onChange={e=>setSigName(e.target.value)} placeholder="Nome de Usuário" className={`w-full p-4 rounded-xl border uppercase font-bold outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-700 border-gray-600 text-white':'bg-gray-50 border-gray-200'}`}/>
            <input type="password" value={sigKey} onChange={e=>setSigKey(e.target.value)} placeholder="API Key do Gemini" className={`w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-700 border-gray-600 text-white':'bg-gray-50 border-gray-200'}`}/>
            <div className={`p-4 rounded-lg text-xs leading-relaxed ${darkMode?'bg-yellow-900/20 text-yellow-200':'bg-yellow-50 text-yellow-800'}`}>
              <p className="font-bold mb-1">🔑 O que é a API Key do Gemini?</p>
              <p className="mb-1">É uma chave gratuita que dá acesso à IA do Google (Gemini). Sem ela o site não consegue gerar questões.</p>
              <p className="mb-1">✅ 100% gratuita • ✅ Fácil de criar • ⚠️ Funciona melhor à noite</p>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold">→ Clique aqui para criar a sua chave</a>
            </div>
            <button onClick={handleRegister} disabled={!sigName.trim()||!sigKey.trim()} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-4 rounded-xl font-bold disabled:opacity-50">Criar Perfil</button>
            <button onClick={handleLogout} className="w-full py-3 opacity-60 hover:opacity-100 font-bold text-sm">Voltar</button>
          </div>
        )}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div
      className={`agora-shell min-h-screen font-sans transition-colors duration-300 ${bg}`}
      data-theme={darkMode ? 'dark' : 'light'}
      style={{
        '--font-xs':`${0.75 * fontScale / 100}rem`,
        '--font-sm':`${0.875 * fontScale / 100}rem`,
        '--font-base':`${fontScale / 100}rem`,
        '--font-lg':`${1.125 * Math.min(fontScale, 112) / 100}rem`,
      }}
    >
      <style>{`
        .agora-shell {
          --bg: ${darkMode ? '#0b1118' : '#f6f3ea'};
          --bg-soft: ${darkMode ? '#101923' : '#fbfaf5'};
          --surface: ${darkMode ? '#111827' : 'rgba(255, 255, 255, .94)'};
          --surface-strong: ${darkMode ? '#111827' : '#ffffff'};
          --surface-muted: ${darkMode ? '#172131' : 'rgba(248, 246, 238, .94)'};
          --line: ${darkMode ? 'rgba(148, 163, 184, .24)' : 'rgba(120, 113, 108, .18)'};
          --line-strong: ${darkMode ? 'rgba(217, 119, 6, .42)' : 'rgba(180, 83, 9, .3)'};
          --text: ${darkMode ? '#f1f5f9' : '#1f2933'};
          --muted: ${darkMode ? '#cbd5e1' : '#667085'};
          --accent: #b45309;
          --accent-2: #0f766e;
          --accent-3: #1d4ed8;
          --danger: #dc2626;
          --shadow-sm: ${darkMode ? '0 10px 30px rgba(0, 0, 0, .26)' : '0 10px 26px rgba(42, 32, 14, .08)'};
          --shadow-md: ${darkMode ? '0 18px 50px rgba(0, 0, 0, .38)' : '0 20px 48px rgba(42, 32, 14, .12)'};
          color: var(--text);
          background:
            linear-gradient(180deg, ${darkMode ? 'rgba(15, 23, 42, .96)' : 'rgba(255, 251, 235, .72)'} 0%, transparent 22rem),
            radial-gradient(circle at top left, ${darkMode ? 'rgba(15, 118, 110, .16)' : 'rgba(15, 118, 110, .08)'} 0%, ${darkMode ? 'rgba(15, 118, 110, .16)' : 'rgba(15, 118, 110, .08)'} 24rem, transparent 24.5rem),
            linear-gradient(135deg, var(--bg), var(--bg-soft));
          min-height: 100vh;
          overflow-x: hidden;
        }
        .agora-shell * {
          letter-spacing: 0;
          box-sizing: border-box;
        }
        .agora-shell header {
          background: ${darkMode ? 'rgba(11, 17, 24, .82)' : 'rgba(255, 255, 255, .78)'} !important;
          border-color: var(--line) !important;
          box-shadow: ${darkMode ? '0 14px 38px rgba(0, 0, 0, .24)' : '0 14px 34px rgba(42, 32, 14, .07)'} !important;
          backdrop-filter: blur(18px) saturate(1.25);
        }
        .agora-shell main {
          position: relative;
        }
        .agora-shell main,
        .agora-shell section,
        .agora-shell article,
        .agora-shell aside,
        .agora-shell .grid,
        .agora-shell .flex {
          min-width: 0;
        }
        .agora-shell .bg-white,
        .agora-shell .bg-gray-50 {
          background-color: var(--surface) !important;
        }
        .agora-shell .bg-gray-900,
        .agora-shell .bg-gray-800 {
          background-color: var(--surface) !important;
        }
        .agora-shell .bg-gray-100,
        .agora-shell .bg-gray-700,
        .agora-shell .bg-yellow-50 {
          background-color: var(--surface-muted) !important;
        }
        .agora-shell .border-gray-200,
        .agora-shell .border-gray-100,
        .agora-shell .border-gray-700,
        .agora-shell .border-gray-800 {
          border-color: var(--line) !important;
        }
        .agora-shell .text-gray-900,
        .agora-shell .text-gray-800,
        .agora-shell .text-gray-700,
        .agora-shell .text-gray-200,
        .agora-shell .text-gray-100 {
          color: var(--text) !important;
        }
        .agora-shell .text-gray-600,
        .agora-shell .text-gray-500,
        .agora-shell .text-gray-400,
        .agora-shell .text-gray-300 {
          color: var(--muted) !important;
        }
        .agora-shell .opacity-40 {
          opacity: ${darkMode ? '.7' : '.62'} !important;
        }
        .agora-shell .opacity-50 {
          opacity: ${darkMode ? '.82' : '.68'} !important;
        }
        .agora-shell .opacity-60 {
          opacity: ${darkMode ? '.9' : '.78'} !important;
        }
        .agora-shell .text-yellow-600,
        .agora-shell .text-yellow-700,
        .agora-shell .text-yellow-500,
        .agora-shell .text-yellow-400,
        .agora-shell .text-yellow-300 {
          color: ${darkMode ? '#f5c66a' : '#9a5a12'} !important;
        }
        .agora-shell .bg-yellow-600,
        .agora-shell .bg-yellow-500,
        .agora-shell .hover\\:bg-yellow-700:hover {
          background: linear-gradient(135deg, #b45309, #d97706) !important;
          color: #fff !important;
          border-color: rgba(180, 83, 9, .42) !important;
          box-shadow: 0 10px 22px rgba(180, 83, 9, .2);
        }
        .agora-shell .rounded-2xl,
        .agora-shell .rounded-xl {
          border-radius: 14px !important;
        }
        .agora-shell button,
        .agora-shell input,
        .agora-shell textarea,
        .agora-shell select {
          transition: background-color .18s ease, border-color .18s ease, color .18s ease, box-shadow .18s ease, transform .18s ease, opacity .18s ease;
          touch-action: manipulation;
        }
        .agora-shell button:not(:disabled):hover {
          transform: translateY(-1px);
        }
        .agora-shell button:not(:disabled):active {
          transform: translateY(0);
        }
        .agora-shell input,
        .agora-shell textarea {
          background: ${darkMode ? '#0f172a' : 'rgba(255, 255, 255, .88)'} !important;
          border-color: var(--line) !important;
          color: var(--text) !important;
          font-size: var(--font-base);
          line-height: 1.45;
          min-width: 0;
        }
        .agora-shell select {
          font-size: var(--font-base);
          min-width: 0;
        }
        .agora-shell .text-xs {
          font-size: var(--font-xs) !important;
        }
        .agora-shell .text-sm {
          font-size: var(--font-sm) !important;
        }
        .agora-shell .text-base {
          font-size: var(--font-base) !important;
        }
        .agora-shell .text-lg {
          font-size: var(--font-lg) !important;
        }
        .agora-shell input:focus,
        .agora-shell textarea:focus,
        .agora-shell button:focus-visible {
          outline: none;
          box-shadow: 0 0 0 4px ${darkMode ? 'rgba(217, 119, 6, .22)' : 'rgba(217, 119, 6, .18)'} !important;
          border-color: var(--line-strong) !important;
        }
        .agora-shell .shadow-sm,
        .agora-shell .shadow-lg,
        .agora-shell .shadow-xl,
        .agora-shell .shadow-2xl {
          box-shadow: var(--shadow-sm) !important;
        }
        .agora-shell table {
          border-radius: 12px;
          overflow: hidden;
        }
        .agora-shell ::selection {
          background: rgba(217, 119, 6, .25);
        }
        .agora-shell .app-hero {
          background:
            linear-gradient(135deg, ${darkMode ? 'rgba(17, 24, 39, .94)' : 'rgba(255, 255, 255, .94)'}, ${darkMode ? 'rgba(17, 34, 42, .9)' : 'rgba(240, 253, 250, .86)'}),
            linear-gradient(90deg, rgba(180, 83, 9, .14), rgba(15, 118, 110, .12));
          border: 1px solid var(--line);
          box-shadow: var(--shadow-md);
        }
        .agora-shell .app-card {
          background: var(--surface);
          border: 1px solid var(--line);
          box-shadow: var(--shadow-sm);
        }
        .agora-shell .app-card:hover {
          border-color: var(--line-strong);
          box-shadow: var(--shadow-md);
        }
        .agora-shell .glass-panel {
          background: ${darkMode ? '#101827' : 'rgba(255, 255, 255, .86)'};
          border: 1px solid var(--line);
          backdrop-filter: ${darkMode ? 'none' : 'blur(14px) saturate(1.2)'};
        }
        .agora-shell .modal-scroll > div {
          background-color: ${darkMode ? '#111827' : '#ffffff'} !important;
          border-color: var(--line) !important;
          max-height: calc(100dvh - 2rem);
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        .agora-shell button:disabled,
        .agora-shell input:disabled,
        .agora-shell textarea:disabled {
          cursor: not-allowed;
          filter: saturate(.78);
        }
        .agora-shell .skeleton-line {
          height: .9rem;
          background: linear-gradient(90deg, ${darkMode ? '#182233' : '#f1eee5'}, ${darkMode ? '#243246' : '#faf8ef'}, ${darkMode ? '#182233' : '#f1eee5'});
          background-size: 220% 100%;
          animation: agoraShimmer 1.35s ease-in-out infinite;
        }
        .agora-shell .empty-state {
          box-shadow: ${darkMode ? 'inset 0 1px 0 rgba(255,255,255,.03)' : 'inset 0 1px 0 rgba(255,255,255,.75)'};
        }
        .agora-shell .empty-state button {
          min-height: 2.75rem;
        }
        .agora-shell [class*="truncate"] {
          min-width: 0;
        }
        .agora-shell .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        .agora-shell textarea::placeholder,
        .agora-shell input::placeholder {
          color: ${darkMode ? '#94a3b8' : '#8a8178'} !important;
          opacity: 1;
        }
        @keyframes agoraShimmer {
          0% { background-position: 180% 0; }
          100% { background-position: -80% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .agora-shell *,
          .agora-shell *::before,
          .agora-shell *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
          }
        }
        @media (max-width: 640px) {
          .agora-shell .modal-scroll {
            padding: .75rem !important;
            overflow-y: auto !important;
            align-items: flex-end !important;
          }
          .agora-shell .modal-scroll > div {
            width: 100%;
            max-height: calc(100dvh - 1.5rem);
          }
          .agora-shell main:not(:empty) {
            padding-left: .9rem;
            padding-right: .9rem;
          }
          .agora-shell button {
            min-height: 2.5rem;
          }
          .agora-shell .fixed.bottom-5.right-5 {
            bottom: 1rem;
            right: 1rem;
          }
          .agora-shell h1,
          .agora-shell h2 {
            overflow-wrap: anywhere;
          }
        }
        .modal-scroll,
        .modal-scroll * {
          scrollbar-width: thin;
          scrollbar-color: #d97706 ${darkMode ? '#1f2937' : '#f5f5f4'};
        }
        .modal-scroll::-webkit-scrollbar,
        .modal-scroll *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .modal-scroll::-webkit-scrollbar-track,
        .modal-scroll *::-webkit-scrollbar-track {
          background: ${darkMode ? '#111827' : '#f5f5f4'};
          border-radius: 999px;
        }
        .modal-scroll::-webkit-scrollbar-thumb,
        .modal-scroll *::-webkit-scrollbar-thumb {
          background: #b45309;
          border-radius: 999px;
          border: 2px solid ${darkMode ? '#111827' : '#f5f5f4'};
        }
        .modal-scroll::-webkit-scrollbar-thumb:hover,
        .modal-scroll *::-webkit-scrollbar-thumb:hover {
          background: #d97706;
        }
      `}</style>
	      {/* HEADER */}
	      <header className={`${hdr} sticky top-0 z-20 shadow-sm transition-transform duration-300 ${headerVisible?'translate-y-0':'-translate-y-full'}`}>
	        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
	          {/* Logo */}
	          <div className="flex items-center gap-3 cursor-pointer min-w-0" onClick={()=>{setView('library');setMenuOpen(false);}}>
	            <div className="bg-yellow-600 p-2 rounded-xl shadow-md flex-shrink-0"><Landmark className="w-5 h-5 text-white"/></div>
	            <div className="min-w-0">
	              <h1 className={`font-serif font-bold text-lg leading-none truncate ${darkMode?'text-yellow-500':'text-yellow-700'}`}>Ágora do Saber</h1>
	              <p className={`hidden sm:block text-[10px] font-bold uppercase mt-1 ${darkMode?'text-gray-500':'text-gray-400'}`}>Lux in Tenebris</p>
	            </div>
	          </div>

          {/* Desktop nav buttons */}
          <div className="hidden md:flex items-center gap-1.5">
            <span className={`flex items-center gap-2 text-xs font-bold mr-2 border rounded-full px-3 py-2 ${darkMode?'border-gray-700 bg-gray-900 text-gray-400':'border-gray-200 bg-white text-gray-500'}`}><UserIcon className="w-3 h-3"/>{username}</span>
            {[
              {icon:<Heart className="w-4 h-4"/>,         action:()=>setView('favorites'), title:'Favoritos'},
              {icon:<SettingsIcon className="w-4 h-4"/>,  action:()=>setView('settings'),  title:'Configurações'},
              {icon:darkMode?<Sun className="w-4 h-4"/>:<Moon className="w-4 h-4"/>, action:()=>setDarkMode(!darkMode), title:'Tema'},
              {icon:<LogOut className="w-4 h-4"/>,        action:handleLogout,             title:'Sair', danger:true},
            ].map((btn,i)=>(
              <button key={i} type="button" onClick={btn.action} title={btn.title} aria-label={btn.title} className={`relative h-10 w-10 rounded-xl flex items-center justify-center transition-all ${btn.danger?(darkMode?'border border-gray-700 bg-gray-900 text-red-400 hover:border-red-500/50 hover:bg-red-950/30':'border border-red-200 bg-red-50 text-red-500 hover:bg-red-100'):(darkMode?'border border-gray-700 bg-gray-900 text-yellow-500 hover:bg-gray-800':'border border-gray-200 bg-white text-yellow-700 hover:bg-yellow-50')}`}>
                {btn.icon}
                {(btn.badge||0)>0&&<span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{btn.badge>9?'9+':btn.badge}</span>}
              </button>
            ))}
          </div>

          {/* Mobile right: theme + hamburger */}
          <div className="flex md:hidden items-center gap-1">
            <button type="button" onClick={()=>setDarkMode(!darkMode)} aria-label="Alternar tema" className={`p-2 rounded-xl border ${darkMode?'border-gray-700 bg-gray-900 text-yellow-500':'border-gray-200 bg-white text-yellow-700'}`}>
              {darkMode?<Sun className="w-5 h-5"/>:<Moon className="w-5 h-5"/>}
            </button>
            <button type="button" onClick={()=>setMenuOpen(!menuOpen)} className={`p-2 rounded-xl border ${darkMode?'border-gray-700 bg-gray-900 text-yellow-500':'border-gray-200 bg-white text-yellow-700'}`} aria-label="Menu">
              {menuOpen
                ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
              }
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen&&(
          <div className={`md:hidden border-t ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
            <div className="px-4 py-2 grid grid-cols-2 gap-1">
              {[
                {icon:<Heart className="w-5 h-5"/>,         label:'Favoritos',     action:()=>setView('favorites')},
                {icon:<SettingsIcon className="w-5 h-5"/>,  label:'Configurações', action:()=>setView('settings')},
                {icon:<Zap className="w-5 h-5 text-yellow-600"/>, label:'Modo Prova', action:()=>setExamSetup({})},
                {icon:<LogOut className="w-5 h-5 text-red-500"/>, label:'Sair',     action:handleLogout, danger:true},
              ].map((item,i)=>(
                <button key={i} onClick={()=>{item.action();setMenuOpen(false);}}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${item.danger?(darkMode?'text-red-400 hover:bg-red-900/20':'text-red-500 hover:bg-red-50'):(darkMode?'text-gray-200 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50')}`}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
            <div className={`px-6 py-3 border-t text-xs font-bold opacity-40 ${darkMode?'border-gray-700':'border-gray-100'}`}>{username}</div>
          </div>
        )}
      </header>

      <main className={view==='videoaulas'||view==='curso'?'':'max-w-6xl mx-auto px-4 py-8 md:py-10'}>

	        {/* ── LIBRARY ── */}
	        {view==='library'&&(
	          (()=>{
			    const homeCards = [
			              canUseAcademia ? {key:'academia', icon:<AcademiaIcon className="w-5 h-5"/>, title:'Academia do Saber', desc:'Aulas autorais com fixação no final.', meta:`${sourceSubjects('academia').length} aulas · ${sourceFolders('academia').length} pastas`, action:()=>{setLibFilter('academia');setActiveFolderId(null);setView('sub-library');}} : null,
			              canSeeVideoaulas ? {key:'curso', icon:<GraduationCap className="w-5 h-5"/>, title:'Portal do Curso', desc:'Videoaulas, questões e cronograma.', meta:'Acesso restrito', action:()=>setView('curso')} : null,
			              {key:'gemini', icon:<Landmark className="w-5 h-5"/>, title:'Acervo do Oráculo', desc:'Assuntos, blocos e simulados gerados por IA.', meta:`${sourceSubjects('gemini').length} assuntos · ${sourceFolders('gemini').length} pastas`, action:()=>{setLibFilter('gemini');setActiveFolderId(null);setView('sub-library');}},
			              {key:'external', icon:<FolderIcon className="w-5 h-5"/>, title:'Acervo Externo', desc:'Importações, provas e listas coladas.', meta:`${sourceSubjects('external').length} assuntos · ${sourceFolders('external').length} pastas`, action:()=>{setLibFilter('external');setActiveFolderId(null);setView('sub-library');}},
			            ].filter(Boolean);
                const questionGoal = Math.max(1, parseInt(settings.dailyQuestionGoal, 10) || 120);
                const minuteGoal = Math.max(1, parseInt(settings.dailyLectureMinutesGoal, 10) || 90);
                const dailyQuestions = Object.keys(dailyStats.questionKeys || {}).length;
	                const dailyMinutes = Math.floor(getDailyLessonSeconds(dailyStats) / 60);
	                const questionPct = Math.min(100, Math.round(dailyQuestions / questionGoal * 100));
	                const minutePct = Math.min(100, Math.round(dailyMinutes / minuteGoal * 100));
                  const DailyRing = ({label, value, goal, pct, unit='', accent='text-yellow-500'}) => {
                    const radius = 30;
                    const circumference = 2 * Math.PI * radius;
                    const offset = circumference - (Math.min(100, pct) / 100) * circumference;
                    return (
                      <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${darkMode?'bg-gray-950/70':'bg-white/80'}`}>
                        <div className="relative h-16 w-16 flex-shrink-0">
                          <svg viewBox="0 0 72 72" className="h-16 w-16 -rotate-90">
                            <circle cx="36" cy="36" r={radius} fill="none" stroke="currentColor" strokeWidth="7" className={darkMode?'text-gray-800':'text-gray-100'}/>
                            <circle cx="36" cy="36" r={radius} fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className={accent} style={{transition:'stroke-dashoffset .45s ease'}}/>
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-sm font-serif font-bold ${darkMode?'text-white':'text-gray-900'}`}>{pct}%</span>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className={`text-[11px] font-bold uppercase tracking-widest ${darkMode?'text-gray-500':'text-gray-400'}`}>{label}</p>
                          <p className={`text-sm font-bold tabular-nums ${darkMode?'text-gray-200':'text-gray-800'}`}>{value}{unit}<span className="opacity-35"> / {goal}{unit}</span></p>
                        </div>
                      </div>
                    );
                  };
				            return (
				              <div className="space-y-6">
                        <section className="app-hero rounded-2xl p-5 md:p-7 overflow-hidden">
                          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] lg:items-center">
                            <div className="min-w-0 max-w-2xl">
                              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase mb-4 ${darkMode?'border-gray-700 bg-gray-950/50 text-gray-400':'border-yellow-200 bg-yellow-50 text-yellow-800'}`}>
                                <Sparkles className="w-3.5 h-3.5"/>Painel de estudos
                              </div>
                              <h2 className="text-3xl md:text-3xl font-serif font-bold text-yellow-600 leading-tight">Não são admitidos ignorantes em geometria</h2>
                              <p className={`mt-3 text-sm md:text-base max-w-xl ${darkMode?'text-gray-400':'text-gray-600'}`}>- Pórtico da Academia de Platão</p>
                              <p className={`mt-3 text-sm italic ${darkMode?'text-gray-500':'text-gray-500'}`}> </p>
                            </div>
                            <div className="min-w-0 space-y-3">
                              {canUseAdvancedFeatures&&(
                                <div className="glass-panel rounded-2xl p-3 md:p-4">
                                  <div className="mb-3 flex items-center gap-2 px-1">
                                    <CalendarCheck className="w-4 h-4 text-yellow-600"/>
                                    <span className={`text-xs font-bold uppercase tracking-widest ${darkMode?'text-gray-500':'text-gray-400'}`}>Progresso de hoje</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <DailyRing label="Questões" value={dailyQuestions} goal={questionGoal} pct={questionPct}/>
                                    <DailyRing label="Tempo assistido" value={dailyMinutes} goal={minuteGoal} pct={minutePct} unit="min" accent="text-green-500"/>
                                  </div>
                                </div>
                              )}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {canUseAdvancedFeatures&&(
                                  <button onClick={()=>setView('spaced-review')} className={`glass-panel flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${darkMode?'text-gray-200 hover:bg-gray-800':'text-gray-800 hover:bg-white'}`}>
                                    <RepeatIcon className="w-4 h-4"/>Revisão
                                    {dueCount>0&&<span className="ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-yellow-600 text-white">{dueCount}</span>}
                                  </button>
                                )}
                                <button onClick={()=>setExamSetup({})} className={`glass-panel flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${darkMode?'text-gray-200 hover:bg-gray-800':'text-gray-800 hover:bg-white'}`}>
                                  <Zap className="w-4 h-4 text-yellow-600"/>Modo Prova
                                </button>
                              </div>
                            </div>
                          </div>
                        </section>
			                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
	                  {homeCards.map(card=>(
	                    <button key={card.key} onClick={card.action} className="app-card group text-left rounded-xl p-4 md:p-5 flex items-center gap-4 transition-all">
	                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode?'bg-gray-800 text-yellow-400 group-hover:bg-yellow-900/30':'bg-yellow-50 text-yellow-700 group-hover:bg-white'}`}>{card.icon}</div>
	                      <div className="min-w-0 flex-1">
	                        <h3 className="font-serif font-bold text-lg text-yellow-600 truncate">{card.title}</h3>
	                        <p className={`text-sm mt-1 line-clamp-2 ${darkMode?'text-gray-400':'text-gray-600'}`}>{card.desc}</p>
	                      </div>
	                      <div className="hidden sm:block text-right flex-shrink-0">
	                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${badge}`}>{card.meta}</span>
	                      </div>
	                      <ChevronRight className="w-4 h-4 opacity-30 flex-shrink-0"/>
	                    </button>
	                  ))}
	                </div>
	              </div>
	            );
	          })()
	        )}

        {/* ── SUB-LIBRARY ── */}
        {view==='sub-library'&&(
          (()=>{
            const sourceTitle = libFilter==='gemini'?'Acervo do Oráculo':libFilter==='academia'?'Academia do Saber':'Acervo Externo';
            const iconBox = darkMode?'bg-gray-800 text-yellow-500':'bg-yellow-50 text-yellow-700';
            const actionBtn = darkMode?'border-gray-700 text-gray-400 hover:text-yellow-400 hover:border-yellow-700 hover:bg-gray-800':'border-gray-200 text-gray-500 hover:text-yellow-700 hover:border-yellow-400 hover:bg-yellow-50';
            const primaryLabel = libFilter==='gemini'?'Gerar assunto':libFilter==='academia'?'Nova aula':'Importar';
            const primaryIcon = libFilter==='gemini'?<Sparkles className="w-4 h-4"/>:libFilter==='academia'?<AcademiaIcon className="w-4 h-4"/>:<Feather className="w-4 h-4"/>;
            const primaryAction = () => {
              if (libFilter==='gemini') setView('creator');
              else if (libFilter==='academia') { setAcademiaCreatorStep(1); setView('academia-creator'); }
              else { setPasteSubName(''); setPasteTopic('Bloco 1'); setView('paste'); }
            };
            const renderIconButton = (label, icon, fn, extra='') => (
              <button onClick={e=>{e.stopPropagation();fn();}} title={label} aria-label={label} className={`h-8 w-8 md:h-9 md:w-9 rounded-lg border flex items-center justify-center ${actionBtn} ${extra}`}>
                {icon}
              </button>
            );
            const renderActionButtons = (actions) => actions.map((a,i)=>
              <React.Fragment key={`${a.label}-${i}`}>{renderIconButton(a.label, a.icon, a.fn, a.extra || '')}</React.Fragment>
            );
            const mobileActionsMenu = (id, actions) => (
              <div className="relative flex-shrink-0">
                <button
                  onClick={e=>{e.stopPropagation();setLibraryActionMenu(p=>p===id?null:id);}}
                  className={`h-8 w-8 rounded-lg border flex items-center justify-center ${actionBtn}`}
                  aria-label="Ações"
                  title="Ações"
                >
                  <MoreIcon className="w-4 h-4"/>
                </button>
                {libraryActionMenu===id&&(
                  <div className={`absolute right-0 top-9 z-40 min-w-40 rounded-xl border p-1 shadow-xl ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
                    {actions.map((a,i)=>(
                      <button key={`${a.label}-${i}`} onClick={e=>{e.stopPropagation();setLibraryActionMenu(null);a.fn();}} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm font-bold ${a.danger?(darkMode?'text-red-300 hover:bg-red-900/20':'text-red-600 hover:bg-red-50'):(darkMode?'text-gray-200 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50')}`}>
                        {a.icon}
                        <span>{a.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
            const toggleLibraryFolder = (id) => setLibraryOpenFolders(p=>({...p,[id]:!(p[id] ?? false)}));
            const countSubjectQuestions = (subject) => subject.source==='academia'
              ? subject.topics.flatMap(t=>Object.values(t.fixationQuestions||{}).flat()).length
              : subject.topics.reduce((acc,t)=>acc+(t.questions?.length||0), 0);
            const countFolderQuestions = (folder) => getSubjectsInFolderTree(folder).reduce((acc,s)=>acc+countSubjectQuestions(s),0);
            const directFolders = (parentId) => sortLibraryItems(sourceFolders(libFilter).filter(f=>(f.parentFolderId||null)===(parentId||null)));
            const directSubjects = (folderId) => sortLibraryItems(sourceSubjects(libFilter).filter(s=>(s.folderId||null)===(folderId||null)));
            const directItems = (parentId) => sortLibraryItems([...directFolders(parentId), ...directSubjects(parentId)]);
            const treeRootId = activeFolderId || null;
            const treeItems = directItems(treeRootId);
            const treeItemCount = treeItems.length;
            const activeFolderLocked = isProtectedMirrorRootFolder(activeFolder);
            const activeFolderErrorCount = activeFolder
              ? getFolderErrorNotebookSources(activeFolder).reduce((acc, s) => acc + s.questions.length, 0)
              : 0;
            const collectTreeFolderIds = (parentId) => {
              const ids = [];
              const walk = (id) => directFolders(id).forEach(folder => {
                ids.push(folder.id);
                walk(folder.id);
              });
              walk(parentId || null);
              return ids;
            };
            const treeFolderIds = collectTreeFolderIds(treeRootId);
            const allTreeFoldersOpen = treeFolderIds.length > 0 && treeFolderIds.every(id => libraryOpenFolders[id] ?? false);
            const setAllTreeFoldersOpen = (open) => setLibraryOpenFolders(p => {
              const next = {...p};
              treeFolderIds.forEach(id => { next[id] = open; });
              return next;
            });
            const rowBorder = darkMode?'border-gray-800':'border-gray-100';
            const rowHover = darkMode?'hover:bg-gray-800/70':'hover:bg-gray-50';
            const dropSlot = (position) => (
              <div className={`absolute left-3 right-3 ${position==='before'?'top-0':'bottom-0'} z-20 pointer-events-none flex items-center gap-1`}>
                <span className="h-2 w-2 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/40"/>
                <span className="h-0.5 flex-1 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/40"/>
                <span className="h-2 w-2 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/40"/>
              </div>
            );
            const getDropId = (el) => {
              const raw = el?.dataset?.dropId;
              if (!raw || raw === 'root') return null;
              return libraryFolders.find(f=>String(f.id)===raw)?.id ?? raw;
            };
            const sameId = (a,b) => (a || null) === null || (b || null) === null ? (a || null) === (b || null) : String(a) === String(b);
            const getLibraryItemById = (id) => library.find(item=>String(item.id)===String(id));
            const isValidDrop = (drag, targetId, mode = 'inside', targetItem = null) => {
              if (!drag) return false;
              if (isProtectedMirrorRootFolder(drag.item)) return false;
              if (mode === 'before' || mode === 'after') {
                if (!targetItem || sameId(drag.item.id, targetItem.id) || drag.item.source !== targetItem.source) return false;
                if (isProtectedMirrorRootFolder(targetItem)) return false;
                const parentId = getLibraryItemParentId(targetItem);
                if (isProtectedMirrorRootFolder(libraryFolders.find(f => sameId(f.id, parentId)))) return false;
                return !isFolderItem(drag.item) || (!sameId(drag.item.id, parentId) && !isFolderDescendant(parentId, drag.item.id));
              }
              if (isProtectedMirrorRootFolder(libraryFolders.find(f => sameId(f.id, targetId)))) return false;
              if (drag.type === 'subject') return !sameId(drag.item.folderId || null, targetId || null);
              return !sameId(drag.item.id, targetId) && !sameId(drag.item.parentFolderId || null, targetId || null) && !isFolderDescendant(targetId, drag.item.id);
            };
            const isDropActive = (targetId) => libraryDrag?.active && libraryDrag?.targetFound && libraryDrag.dropMode === 'inside' && isValidDrop(libraryDrag, targetId) && sameId(libraryDrag.targetId || null, targetId || null);
            const isSlotActive = (parentId, slotIndex) => libraryDrag?.active && libraryDrag?.targetFound && libraryDrag.dropMode !== 'inside' && sameId(libraryDrag.slotParentId || null, parentId || null) && libraryDrag.slotIndex === slotIndex;
            const getDragPoint = (e) => {
              const touch = e.touches?.[0] || e.changedTouches?.[0];
              if (touch) return { clientX:touch.clientX, clientY:touch.clientY };
              return { clientX:e.clientX, clientY:e.clientY };
            };
            const stopLibraryDragEvent = (e) => {
              e.stopPropagation();
              if (e.cancelable !== false) e.preventDefault();
            };
            const startLibraryDrag = (e, item, type) => {
              if (libraryDragRef.current) return;
              if (e.button !== undefined && e.button !== 0) return;
              stopLibraryDragEvent(e);
              const point = getDragPoint(e);
              suppressLibraryClickUntil.current = Date.now() + 450;
              if (e.pointerId !== undefined) e.currentTarget.setPointerCapture?.(e.pointerId);
              const nextDrag = { item, type, source:item.source, startX:point.clientX, startY:point.clientY, x:point.clientX, y:point.clientY, active:false, targetId:null, targetItem:null, dropMode:'inside', targetFound:false, slotParentId:null, slotIndex:null };
              libraryDragRef.current = nextDrag;
              setLibraryDrag(nextDrag);
              libraryDragCleanupRef.current?.();
              const doc = e.currentTarget?.ownerDocument || document;
              const move = ev => updateLibraryDrag(ev);
              const end = ev => finishLibraryDrag(ev);
              const cancel = ev => {
                stopLibraryDragEvent(ev);
                if (libraryDragRef.current) setLibraryDrag(p=>p||libraryDragRef.current);
              };
              doc.addEventListener('pointermove', move, { passive:false });
              doc.addEventListener('pointerup', end, { passive:false });
              doc.addEventListener('touchmove', move, { passive:false });
              doc.addEventListener('touchend', end, { passive:false });
              doc.addEventListener('touchcancel', cancel, { passive:false });
              libraryDragCleanupRef.current = () => {
                doc.removeEventListener('pointermove', move);
                doc.removeEventListener('pointerup', end);
                doc.removeEventListener('touchmove', move);
                doc.removeEventListener('touchend', end);
                doc.removeEventListener('touchcancel', cancel);
                libraryDragCleanupRef.current = null;
              };
            };
            const updateLibraryDrag = (e) => {
              const drag = libraryDragRef.current || libraryDrag;
              if (!drag) return;
              stopLibraryDragEvent(e);
              const point = getDragPoint(e);
              const active = drag.active || Math.hypot(point.clientX-drag.startX, point.clientY-drag.startY) > 5;
              let targetId = drag.targetId ?? null;
              let targetItem = null;
              let dropMode = 'inside';
              let targetFound = false;
              let slotParentId = null;
              let slotIndex = null;
              if (active) {
                const pointEl = document.elementFromPoint(point.clientX, point.clientY);
                const itemEl = pointEl?.closest?.('[data-library-item]');
                const dropEl = pointEl?.closest?.('[data-library-drop]');
                if (itemEl?.dataset?.itemId) {
                  const itemUnderPointer = getLibraryItemById(itemEl.dataset.itemId);
                  if (itemUnderPointer && itemUnderPointer.source === drag.item.source && !sameId(itemUnderPointer.id, drag.item.id)) {
                    const rect = itemEl.getBoundingClientRect();
                    const relativeY = (point.clientY - rect.top) / Math.max(rect.height, 1);
                    if (relativeY < 0.35) dropMode = 'before';
                    else if (relativeY > 0.65 || !isFolderItem(itemUnderPointer)) dropMode = 'after';
                    else dropMode = 'inside';
                    targetItem = itemUnderPointer;
                    targetId = dropMode === 'inside' ? itemUnderPointer.id : getLibraryItemParentId(itemUnderPointer);
                    targetFound = isValidDrop(drag, targetId, dropMode, targetItem);
                    if (targetFound && dropMode !== 'inside') {
                      slotParentId = targetId || null;
                      const slotSiblings = sortLibraryItems(library.filter(candidate =>
                        candidate.source === drag.item.source &&
                        candidate.id !== drag.item.id &&
                        getLibraryItemParentId(candidate) === (slotParentId || null)
                      ));
                      const targetIndex = slotSiblings.findIndex(candidate=>sameId(candidate.id, itemUnderPointer.id));
                      slotIndex = targetIndex < 0 ? null : (dropMode === 'before' ? targetIndex : targetIndex + 1);
                    }
                  }
                }
                if (dropEl) {
                  if (!targetFound) {
                    targetId = getDropId(dropEl);
                    targetItem = null;
                    dropMode = 'inside';
                    slotParentId = null;
                    slotIndex = null;
                    targetFound = isValidDrop(drag, targetId, dropMode, null);
                  }
                  if (!targetFound) targetId = null;
                }
                if (targetId) setLibraryOpenFolders(p=>p[targetId]?p:{...p,[targetId]:true});
              }
              const nextDrag = {...drag,x:point.clientX,y:point.clientY,active,targetId,targetItem,dropMode,targetFound,slotParentId,slotIndex};
              libraryDragRef.current = nextDrag;
              setLibraryDrag(nextDrag);
            };
            const finishLibraryDrag = async (e) => {
              const drag = libraryDragRef.current || libraryDrag;
              if (!drag) return;
              stopLibraryDragEvent(e);
              if (e.pointerId !== undefined) e.currentTarget.releasePointerCapture?.(e.pointerId);
              libraryDragCleanupRef.current?.();
              libraryDragRef.current = null;
              setLibraryDrag(null);
              suppressLibraryClickUntil.current = Date.now() + 650;
              if (!drag.active || !drag.targetFound || !isValidDrop(drag, drag.targetId, drag.dropMode, drag.targetItem)) return;
              await reorderLibraryItem(drag.item, drag.targetId || null, drag.targetItem, drag.dropMode);
            };
            const cancelLibraryDrag = () => {
              libraryDragCleanupRef.current?.();
              libraryDragRef.current = null;
              setLibraryDrag(null);
              suppressLibraryClickUntil.current = Date.now() + 650;
            };
            const dragHandle = (item, type) => (
              <button
                onPointerDown={e=>startLibraryDrag(e,item,type)}
                onPointerMove={updateLibraryDrag}
                onPointerUp={finishLibraryDrag}
                onPointerCancel={e=>updateLibraryDrag(e)}
                onTouchStart={e=>startLibraryDrag(e,item,type)}
                onTouchMove={updateLibraryDrag}
                onTouchEnd={finishLibraryDrag}
                onTouchCancel={cancelLibraryDrag}
                onClick={e=>{e.preventDefault();e.stopPropagation();suppressLibraryClickUntil.current=Date.now()+650;}}
                title="Arrastar para mover"
                aria-label="Arrastar para mover"
                className={`h-8 w-6 md:h-8 md:w-8 rounded-lg flex items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing touch-none ${darkMode?'text-gray-500 hover:text-yellow-400 hover:bg-gray-700':'text-gray-400 hover:text-yellow-700 hover:bg-gray-100'}`}
              >
                <GripIcon className="w-4 h-4"/>
              </button>
            );
            const renderTreeSubject = (s, depth=0, siblings=[], index=0) => {
              const pct=subjectProgress(s);
              const totalTopics = s.topics.length;
              const totalQs = countSubjectQuestions(s);
              const dragging = libraryDrag?.item?.id === s.id;
              const parentId = getLibraryItemParentId(s);
              const beforeTarget = isSlotActive(parentId, index);
              const afterTarget = index === siblings.length - 1 && isSlotActive(parentId, siblings.length);
              const mobilePad = 4 + depth*8;
              const desktopPad = 12 + depth*18;
              const openSubject = () => {
                if (Date.now() <= suppressLibraryClickUntil.current) return;
                setActiveSubjectId(s.id);
                setView('subject');
              };
              const actions = s.id==='imported-folder' ? [] : [
                {label:'Renomear', icon:<EditIcon className="w-3.5 h-3.5"/>, fn:()=>{setEditingSub(s.id);setEditingSubName(s.title);}},
                {label:'Excluir', icon:<Trash2 className="w-3.5 h-3.5"/>, fn:()=>setDeleteId({type:'subject',id:s.id}), extra:darkMode?'hover:text-red-400 hover:border-red-700':'hover:text-red-600 hover:border-red-300', danger:true},
              ];
              return (
                <div key={s.id} data-library-item data-item-id={s.id} data-item-type="subject" data-library-drop data-drop-id={s.folderId || 'root'} className={`group border-b last:border-b-0 transition-colors relative ${rowBorder} ${rowHover} ${(beforeTarget||afterTarget)?(darkMode?'bg-yellow-900/5':'bg-yellow-50/30'):''} ${dragging?'opacity-40':''}`}>
                  {depth>0&&<span className={`absolute left-3 top-0 bottom-0 w-px ${darkMode?'bg-gray-800':'bg-gray-200'}`}/>}
                  {beforeTarget&&dropSlot('before')}
                  {afterTarget&&dropSlot('after')}
                  <div className="md:hidden px-2.5 py-2" style={{paddingLeft:mobilePad}}>
                    <div className="flex items-center gap-1.5">
                      {s.id!=='imported-folder'?dragHandle(s,'subject'):<span className="w-6 flex-shrink-0"/>}
                      <span className="w-3 flex-shrink-0"/>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBox}`}>{s.source==='academia'?<AcademiaIcon className="w-3.5 h-3.5"/>:<BlockIcon className="w-3.5 h-3.5"/>}</div>
                      <div className="min-w-0 flex-1 flex items-center gap-1.5">
                        <button onClick={openSubject} className="min-w-0 flex-1 text-left">
                          <h3 className="font-bold text-sm leading-tight truncate">{s.title}</h3>
                          <p className="text-xs opacity-50 mt-0.5 leading-snug truncate">{totalTopics} tópico{totalTopics!==1?'s':''}{totalQs>0?` · ${totalQs} questões`:''} · {pct}%</p>
                        </button>
                        {actions.length>0&&mobileActionsMenu(`subject-${s.id}`, actions)}
                      </div>
                    </div>
                  </div>
                  <div onClick={openSubject} className="hidden md:flex items-center gap-3 py-3 pr-4 cursor-pointer" style={{paddingLeft:desktopPad}}>
                    {s.id!=='imported-folder'?dragHandle(s,'subject'):<span className="w-8 flex-shrink-0"/>}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBox}`}>{s.source==='academia'?<AcademiaIcon className="w-4 h-4"/>:<BlockIcon className="w-4 h-4"/>}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm truncate">{s.title}</h3>
                    </div>
                    <div className="w-44 flex-shrink-0 text-sm opacity-60">{totalTopics} tópico{totalTopics!==1?'s':''}{totalQs>0?` · ${totalQs} questões`:''}</div>
                    <div className="w-32 flex-shrink-0 flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="bg-yellow-500 h-full" style={{width:`${pct}%`}}/></div>
                      <span className="text-xs font-bold text-yellow-600">{pct}%</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 flex-shrink-0 w-32 opacity-0 group-hover:opacity-100 transition-opacity">
                      {renderActionButtons(actions)}
                    </div>
                  </div>
                </div>
              );
            };
            const renderTreeFolder = (folder, depth=0, siblings=[], index=0) => {
              const open = libraryOpenFolders[folder.id] ?? false;
              const lockedMirrorRoot = isProtectedMirrorRootFolder(folder);
              const FolderGlyph = isAcademiaMirrorRootFolder(folder) ? AcademiaIcon : isErrorNotebookRootFolder(folder) ? BookOpen : FolderIcon;
              const totalQs = countFolderQuestions(folder);
              const totalSubjects = getSubjectsInFolderTree(folder).length;
              const dropActive = isDropActive(folder.id);
              const dragging = libraryDrag?.item?.id === folder.id;
              const parentId = getLibraryItemParentId(folder);
              const beforeTarget = isSlotActive(parentId, index);
              const afterTarget = index === siblings.length - 1 && isSlotActive(parentId, siblings.length);
              const mobilePad = 4 + depth*8;
              const desktopPad = 12 + depth*18;
              const openFolderView = () => {
                if (Date.now() <= suppressLibraryClickUntil.current) return;
                setActiveFolderId(folder.id);
              };
              const actions = lockedMirrorRoot ? [] : [
                {label:'Nova filha', icon:<PlusIcon className="w-3.5 h-3.5"/>, fn:()=>{setLibraryOpenFolders(p=>({...p,[folder.id]:true}));setNewFolderParentId(folder.id);setNewFolderName('');setNewFolderModal(true);}},
                {label:'Renomear', icon:<EditIcon className="w-3.5 h-3.5"/>, fn:()=>{setEditingSub(folder.id);setEditingSubName(folder.title);}},
                {label:'Excluir', icon:<Trash2 className="w-3.5 h-3.5"/>, fn:()=>setDeleteId({type:'folder',id:folder.id}), extra:darkMode?'hover:text-red-400 hover:border-red-700':'hover:text-red-600 hover:border-red-300', danger:true},
              ];
              return (
                <React.Fragment key={folder.id}>
                  <div data-library-item data-item-id={folder.id} data-item-type="folder" data-library-drop data-drop-id={folder.id} className={`group border-b transition-colors relative ${rowBorder} ${rowHover} ${dropActive?(darkMode?'bg-yellow-900/25 ring-1 ring-inset ring-yellow-700':'bg-yellow-50 ring-1 ring-inset ring-yellow-300'):''} ${(beforeTarget||afterTarget)?(darkMode?'bg-yellow-900/5':'bg-yellow-50/30'):''} ${dragging?'opacity-40':''}`}>
                    {depth>0&&<span className={`absolute left-3 top-0 bottom-0 w-px ${darkMode?'bg-gray-800':'bg-gray-200'}`}/>}
                    {beforeTarget&&dropSlot('before')}
                    {afterTarget&&dropSlot('after')}
                    <div className="md:hidden px-2.5 py-2" style={{paddingLeft:mobilePad}}>
                      <div className="flex items-center gap-1.5">
                        {lockedMirrorRoot?<span className="w-6 flex-shrink-0"/>:dragHandle(folder,'folder')}
                        <button onClick={e=>{e.stopPropagation();toggleLibraryFolder(folder.id);}} title={open?'Recolher':'Expandir'} className={`h-8 w-4 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode?'hover:bg-gray-700 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>
                          {open?<ChevronDown className="w-4 h-4"/>:<ChevronRight className="w-4 h-4"/>}
                        </button>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBox}`}><FolderGlyph className="w-4 h-4"/></div>
                        <div className="min-w-0 flex-1 flex items-center gap-1.5">
                          <button onClick={openFolderView} className="min-w-0 flex-1 text-left">
                            <h3 className="font-bold text-sm leading-tight truncate">{folder.title}</h3>
                            <p className="text-xs opacity-50 mt-0.5 leading-snug truncate">{totalSubjects} assunto{totalSubjects!==1?'s':''}{totalQs>0?` · ${totalQs} questões`:''}</p>
                          </button>
                          {actions.length>0&&<div className="flex-shrink-0">{mobileActionsMenu(`folder-${folder.id}`, actions)}</div>}
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-3 py-3 pr-4" style={{paddingLeft:desktopPad}}>
                    {lockedMirrorRoot?<span className="w-8 flex-shrink-0"/>:dragHandle(folder,'folder')}
                      <button onClick={e=>{e.stopPropagation();toggleLibraryFolder(folder.id);}} title={open?'Recolher':'Expandir'} className={`h-8 w-5 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode?'hover:bg-gray-700 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>
                        {open?<ChevronDown className="w-4 h-4"/>:<ChevronRight className="w-4 h-4"/>}
                      </button>
                      <button onClick={openFolderView} className="min-w-0 flex-1 flex items-center gap-3 text-left">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBox}`}><FolderGlyph className="w-5 h-5"/></div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm truncate">{folder.title}</h3>
                        </div>
                      </button>
                      <div className="w-44 flex-shrink-0 text-sm opacity-60">{totalSubjects} assunto{totalSubjects!==1?'s':''}{totalQs>0?` · ${totalQs} questões`:''}</div>
                      <div className="w-32 flex-shrink-0 text-xs opacity-40">Pasta</div>
                      <div className="flex items-center justify-end gap-1.5 flex-shrink-0 w-32 opacity-0 group-hover:opacity-100 transition-opacity">
                        {renderActionButtons(actions)}
                      </div>
                    </div>
                  </div>
                  {open&&(
                    <>
                      {directItems(folder.id).map((item,index,items)=>renderTreeItem(item, depth+1, items, index))}
                    </>
                  )}
                </React.Fragment>
              );
            };
            const renderTreeItem = (item, depth=0, siblings=[], index=0) => isFolderItem(item) ? renderTreeFolder(item, depth, siblings, index) : renderTreeSubject(item, depth, siblings, index);
            return (
              <div>
                <div className="mb-6">
                  <button onClick={()=>activeFolderId?setActiveFolderId(activeFolder?.parentFolderId || null):setView('library')} className={`flex items-center gap-2 mb-4 font-bold ${darkMode?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}>
                    <ArrowLeft className="w-4 h-4"/>{activeFolderId?'Voltar':'Acervos'}
                  </button>
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-40 mb-2 flex-wrap">
                        <button data-library-drop data-drop-id="root" onClick={()=>setActiveFolderId(null)} className="hover:text-yellow-600">{sourceTitle}</button>
                        <ChevronRight className="w-3 h-3"/>
                        <button data-library-drop data-drop-id="root" onClick={()=>setActiveFolderId(null)} className="hover:text-yellow-600">Raiz</button>
                        {getFolderPath(activeFolderId).map(folder => (
                          <React.Fragment key={folder.id}>
                            <ChevronRight className="w-3 h-3"/>
                            <button data-library-drop data-drop-id={folder.id} onClick={()=>setActiveFolderId(folder.id)} className="hover:text-yellow-600">{folder.title}</button>
                          </React.Fragment>
                        ))}
                      </div>
                      <h2 className="text-3xl font-serif font-bold text-yellow-600 truncate">{activeFolder?.title || sourceTitle}</h2>
                      <p className="text-sm opacity-50 mt-1">{treeItemCount} item{treeItemCount!==1?'s':''} nesta pasta</p>
	                    </div>
	                    <div className="flex flex-wrap gap-2">
	                      {activeFolder&&<button onClick={()=>openFolderReview(activeFolder)} className={`px-4 py-2 rounded-xl font-bold text-sm border flex items-center gap-2 ${darkMode?'border-green-700 text-green-400 hover:bg-green-900/20':'border-green-400 text-green-700 hover:bg-green-50'}`}><RepeatIcon className="w-4 h-4"/>Revisar pasta</button>}
	                      {activeFolder&&activeFolderErrorCount>0&&<button onClick={()=>openFolderErrorReview(activeFolder)} className={`px-4 py-2 rounded-xl font-bold text-sm border flex items-center gap-2 ${darkMode?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50'}`}><BookOpen className="w-4 h-4"/>Caderno de erros ({activeFolderErrorCount})</button>}
	                      {libFilter==='external'&&<button onClick={()=>setExternalPromptModal(true)} className={`px-4 py-2 rounded-xl font-bold text-sm border flex items-center gap-2 ${darkMode?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-700 hover:bg-gray-50'} ${copiedPrompt?'ring-2 ring-yellow-500 text-yellow-600':''}`}>{copiedPrompt?<CheckCircle2 className="w-4 h-4 text-yellow-500"/>:<Copy className="w-4 h-4"/>}{copiedPrompt?'Copiado':'Prompt'}</button>}
	                      {treeFolderIds.length>0&&<button onClick={()=>setAllTreeFoldersOpen(!allTreeFoldersOpen)} className={`px-4 py-2 rounded-xl font-bold text-sm border flex items-center gap-2 ${darkMode?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{allTreeFoldersOpen?<ChevronUp className="w-4 h-4"/>:<ChevronDown className="w-4 h-4"/>}{allTreeFoldersOpen?'Recolher tudo':'Expandir tudo'}</button>}
	                      {!activeFolderLocked&&<button onClick={()=>{setNewFolderParentId(activeFolderId || null);setNewFolderName('');setNewFolderModal(true);}} className={`px-4 py-2 rounded-xl font-bold text-sm border flex items-center gap-2 ${darkMode?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-700 hover:bg-gray-50'}`}><PlusIcon className="w-4 h-4"/>Nova pasta</button>}
                      {(libFilter!=='academia'||canUseAcademia)&&<button onClick={primaryAction} className="bg-yellow-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-yellow-700 flex items-center gap-2 text-sm">{primaryIcon}{primaryLabel}</button>}
                    </div>
                  </div>
                </div>

                <div data-library-drop data-drop-id={treeRootId || 'root'} className={`rounded-xl border overflow-visible md:overflow-hidden ${isDropActive(treeRootId)?(darkMode?'ring-2 ring-yellow-700 bg-yellow-900/10':'ring-2 ring-yellow-300 bg-yellow-50/40'):''} ${darkMode?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                  <div className={`hidden md:flex items-center gap-3 px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-b ${darkMode?'border-gray-800 text-gray-500 bg-gray-950/40':'border-gray-100 text-gray-400 bg-gray-50'}`}>
                    <span className="w-8 flex-shrink-0"/>
                    <span className="flex-1 min-w-0">Nome</span>
                    <span className="w-44 flex-shrink-0">Conteúdo</span>
                    <span className="w-32 flex-shrink-0">Progresso</span>
                    <span className="w-32 flex-shrink-0 text-right">Ações</span>
                  </div>
                  {treeItemCount===0&&(
                    <div className="p-4">
                      <EmptyState
                        darkMode={darkMode}
                        icon={<FolderIcon className="w-7 h-7"/>}
                        title="Nada aqui ainda"
                        message="Crie uma pasta ou adicione um assunto para começar a organizar este acervo."
                      />
                    </div>
                  )}
                  {treeItems.map((item,index,items)=>renderTreeItem(item,0,items,index))}
                </div>
                {libraryDrag?.active&&(
                  <div className={`fixed z-[80] pointer-events-none rounded-xl border px-3 py-2 text-sm font-bold shadow-2xl ${darkMode?'bg-gray-800 border-yellow-700 text-yellow-300':'bg-white border-yellow-300 text-yellow-800'}`} style={{left:libraryDrag.x+12,top:libraryDrag.y+12,maxWidth:280}}>
                    <div className="flex items-center gap-2 min-w-0">
                      {libraryDrag.type==='folder'?(isAcademiaMirrorRootFolder(libraryDrag.item)?<AcademiaIcon className="w-4 h-4 flex-shrink-0"/>:isErrorNotebookRootFolder(libraryDrag.item)?<BookOpen className="w-4 h-4 flex-shrink-0"/>:<FolderIcon className="w-4 h-4 flex-shrink-0"/>):<BlockIcon className="w-4 h-4 flex-shrink-0"/>}
                      <span className="truncate">{libraryDrag.item.title}</span>
                    </div>
                    <p className="text-[11px] opacity-60 mt-0.5">{libraryDrag.targetFound?(libraryDrag.dropMode==='inside'?'Solte dentro da pasta':'Solte para reordenar'):'Arraste até uma pasta ou linha'}</p>
                  </div>
                )}
              </div>
            );
          })()
        )}

        {/* ── SUBJECT ── */}
        {view==='subject'&&activeSubject&&(
          <div>
            <button onClick={()=>{setLibFilter(activeSubject.source);setView('sub-library');}} className={`flex items-center gap-2 mb-6 font-bold ${darkMode?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/>Voltar</button>
            <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-serif font-bold text-yellow-600">{activeSubject.title}</h2>
                  {activeSubject.id!=='imported-folder'&&<button onClick={()=>{setEditingSub(activeSubject.id);setEditingSubName(activeSubject.title);}} className="p-2 rounded-full text-gray-400 hover:text-yellow-500"><EditIcon className="w-5 h-5"/></button>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-40 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"><div className="bg-yellow-500 h-full" style={{width:`${subjectProgress(activeSubject)}%`}}/></div>
                  <span className="text-sm font-bold text-yellow-600">{subjectProgress(activeSubject)}% concluído</span>
                </div>
	              </div>
	              <div className="flex gap-2 flex-wrap">
	                {['gemini','academia'].includes(activeSubject.source)&&(()=>{
	                  const pendingCount = getBulkGenerateTargets(activeSubject).length;
	                  const runningHere = bulkGenerateRun.running && bulkGenerateModal?.subjectId === activeSubject.id;
	                  return (
	                    <button
	                      onClick={()=>{setBulkGenerateModal({subjectId:activeSubject.id});setBulkGenerateRun({running:false,current:0,total:pendingCount,logs:[]});}}
	                      disabled={runningHere || pendingCount===0}
	                      title={pendingCount ? `Gerar ${pendingCount} bloco${pendingCount!==1?'s':''} pendente${pendingCount!==1?'s':''}` : 'Todos os blocos já foram gerados'}
	                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-all ${pendingCount&&!runningHere?(darkMode?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50'):'opacity-40 cursor-not-allowed '+(darkMode?'border-gray-700 text-gray-500':'border-gray-200 text-gray-400')}`}>
	                      {runningHere ? <Spinner className="w-4 h-4"/> : <Zap className="w-4 h-4"/>}
	                      {runningHere ? 'Gerando...' : pendingCount ? `Gerar tudo (${pendingCount})` : 'Tudo gerado'}
	                    </button>
	                  );
	                })()}
	                {activeSubject.source!=='academia'&&<button onClick={()=>openBizuarioSubject(activeSubject)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border ${activeSubject.bizuario?(darkMode?'border-green-600 text-green-400 bg-green-900/20':'border-green-400 text-green-700 bg-green-50'):(darkMode?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50')}`}><BrainIcon className="w-4 h-4"/>{activeSubject.bizuario?'Bizuário ✓':'Bizuário da Pasta'}</button>}
	                {canUseAdvancedFeatures&&(()=>{
	                  const count = getSubjectErrorNotebookQuestions(activeSubject).length;
	                  return count > 0 ? (
	                    <button onClick={()=>openSubjectErrorReview(activeSubject)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border ${darkMode?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50'}`}>
	                      <BookOpen className="w-4 h-4"/>Caderno de erros ({count})
	                    </button>
	                  ) : null;
	                })()}
                {activeSubject.source==='external'&&<button onClick={()=>{setPasteSubName(activeSubject.id==='imported-folder'?'':activeSubject.title);setPasteTopic(`Bloco ${activeSubject.topics.length+1}`);setView('paste');}} className="bg-yellow-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-yellow-700 flex items-center gap-2 text-sm"><Feather className="w-4 h-4"/>Importar</button>}
                {activeSubject.source==='academia'&&(()=>{
                  const allGenerated = activeSubject.topics.length > 0 && activeSubject.topics.every(t=>t.lessonGenerated);
                  const pendingCount = activeSubject.topics.filter(t=>!t.lessonGenerated).length;
                  return (
                    <button
                      onClick={allGenerated ? ()=>{
                        const topics = activeSubject.topics;
                        // Compute per-topic subtopic offsets for boundary tracking
                        const boundaries = [];
                        let offset = 0;
                        topics.forEach(t => {
                          boundaries.push({title: t.title, start: offset, end: offset+(t.subtopics||[]).length});
                          offset += (t.subtopics||[]).length;
                        });
                        const merged = {
                          title: activeSubject.title,
                          subtopics: topics.flatMap(t=>t.subtopics||[]),
                          lessonSections: Object.assign({}, ...topics.map((t,ti)=>{
                            const off = boundaries[ti].start;
                            return Object.fromEntries(Object.entries(t.lessonSections||{}).map(([k,v])=>[Number(k)+off,v]));
                          })),
                          fixationQuestions: Object.assign({}, ...topics.map((t,ti)=>{
                            const off = boundaries[ti].start;
                            return Object.fromEntries(Object.entries(t.fixationQuestions||{}).map(([k,v])=>[Number(k)+off,v]));
                          })),
                          answers: Object.assign({}, ...topics.map(t=>t.answers||{})),
                          favorites: topics.flatMap(t=>t.favorites||[]),
                          extraBattery: topics.flatMap(t=>t.extraBattery||[]),
                          lessonGenerated: true,
                          _topicBoundaries: boundaries,
                        };
                        setAcademiaExportModal({topic: merged, subject: activeSubject});
                      } : undefined}
                      disabled={!allGenerated}
                      title={allGenerated ? 'Exportar toda a pasta' : `${pendingCount} aula${pendingCount!==1?'s':''} ainda não gerada${pendingCount!==1?'s':''}`}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-all ${allGenerated?(darkMode?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50'):'opacity-40 cursor-not-allowed '+(darkMode?'border-gray-700 text-gray-500':'border-gray-200 text-gray-400')}`}>
                      <Printer className="w-4 h-4"/>
                      {allGenerated ? 'Exportar pasta' : `Exportar (${pendingCount} pendente${pendingCount!==1?'s':''})`}
                    </button>
                  );
                })()}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...activeSubject.topics].map(topic=>{
                const isAcademiaTopic = activeSubject.source==='academia';
                const fixAll = isAcademiaTopic ? Object.values(topic.fixationQuestions||{}).flat() : [];
                const fixTotal = fixAll.length;
                const fixAnswered = fixAll.filter(q=>isCompleteAnswerValue(getAcademiaQuestionAnswer(activeSubject, topic, q.id))).length;
                const due=Object.values(topic.spacedReview||{}).filter(r=>r.dueDate<=Date.now()).length;
                const pct=isAcademiaTopic
                  ?(topic.lessonGenerated?(fixTotal>0?Math.round(fixAnswered/fixTotal*100):100):0)
                  :(topic.questions?.length?Math.round(countValidAnswers(topic)/topic.questions.length*100):0);
                return (
                  <div key={topic.id} onClick={()=>{setActiveTopicId(topic.id);setShowOnlyWrong(false);setView(activeSubject.source==='academia'?'academia-topic':'topic');}} className={`${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'} p-4 rounded-xl border flex items-center justify-between hover:border-yellow-500 cursor-pointer group transition-all`}>
                    <div className="flex items-center gap-3 flex-1 truncate pr-3">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 flex-shrink-0">{isAcademiaTopic?<AcademiaIcon className="w-5 h-5"/>:<BlockIcon className="w-5 h-5"/>}</div>
                      <div className="truncate">
                        <h4 className="font-bold text-sm truncate">{topic.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs opacity-50">{isAcademiaTopic?(topic.lessonGenerated?`${fixAnswered}/${fixTotal} respostas`:'Aula não gerada'):(topic.questions?.length?`${countValidAnswers(topic)}/${topic.questions.length}`:'Sem questões')}</p>
                          {(topic.favorites||[]).length>0&&<span className="text-xs text-red-400">♥{topic.favorites.length}</span>}
                          {(topic.subtopics?.length>0)&&<span className="text-xs text-blue-400 dark:text-blue-500" title={topic.subtopics.join('\n')}>📋 {topic.subtopics.length} subtópicos</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="h-2 w-20 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="bg-yellow-500 h-full" style={{width:`${pct}%`}}/>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TOPIC ── */}
        {view==='topic'&&activeTopic&&(
          <div>
            <QuestionView
              title={activeTopic.title}
              onBack={()=>setView('subject')}
              backLabel="Voltar"
              questions={activeTopic.questions||[]}
              answers={activeTopic.answers||{}}
              favorites={activeTopic.favorites||[]}
              onAnswer={(qId,l)=>handleAnswer(qId,l)}
              onToggleFavorite={(qId)=>handleFavorite(qId)}
              errorNotebook={activeTopic.errorNotebook||[]}
              showErrorNotebook={canUseAdvancedFeatures}
              onToggleErrorNotebook={(qId)=>handleErrorNotebook(qId)}
              onReset={activeTopic.questions?.length>0?()=>setDeleteId({type:'reset',id:activeTopic.id}):null}
              onRegenerate={activeTopic.questions?.length>0&&activeSubject?.source==='gemini'?()=>setRegenModal(true):null}
              onExport={activeTopic.questions?.length>0?()=>setExportModal({topic:activeTopic,subject:activeSubject}):null}
              isGenerating={isBusy&&(activeTopic.questions?.length||0)===0}
              streamCount={streamCount}
              loadingMsg={loadingMsg}
              showBizuario={true}
              onBizuario={()=>openBizuario(activeTopic,activeSubject)}
              bizuarioCached={!!activeTopic.bizuario}
              darkMode={darkMode}
              apiKey={getKey()}
              oracleLength={settings.oracleLength||'medium'}
              onCall={callWithRotation}
              onOpenAnswer={q=>setOpenAnswerModal({question:q, isEssay:q.isEssay})}
              displayMode={canUseAdvancedFeatures ? (settings.questionDisplayMode || 'list') : 'list'}
              generateIcon={isBusy?<Spinner className="w-4 h-4 text-white"/>:<Flame className="w-5 h-5"/>}
              onGenerate={activeSubject?.source==='gemini'?()=>generateBatch(activeTopic.id):null}
              subtopics={activeTopic.subtopics||[]}
              topicStyle={activeTopic.questionStyle||settings.questionStyle||'mixed'}
              topicType={(activeTopic.questionTypes||settings.questionTypes||['direct'])[0]}
              onTopicStyleChange={activeSubject?.source==='gemini'?(val,kind)=>{
                const field = kind==='type' ? 'questionTypes' : 'questionStyle';
                const newVal = kind==='type' ? [val] : val;
                const updated = {...activeSubject, topics: activeSubject.topics.map(t=>
                  t.id===activeTopic.id ? {...t, [field]: newVal} : t
                )};
                updateSubject(updated);
	              }:null}
              onAddToReview={canUseAdvancedFeatures ? ((qs, ans)=>setSrModal({
                aulaId:`lib_${activeSubject.id}`,
                blockId:`topic_${activeTopic.id}`,
                blockTitle:activeTopic.title,
                questions:qs,
                answers:ans,
                notebookIds:activeTopic.errorNotebook||[],
                meta:{source:activeSubject.source||'oraculo',subjectId:activeSubject.id,topicId:activeTopic.id,subjectTitle:activeSubject.title,blockTitle:activeTopic.title}
              })) : null}
              onReviewErrorNotebook={(activeTopic.errorNotebook||[]).length ? (()=>openErrorReviewModal({
                subject:activeSubject,
                topic:activeTopic,
                questions:activeTopic.questions || [],
                notebookIds:activeTopic.errorNotebook || [],
              })) : null}
              onGoToAula={activeTopic.origin?.source==='academia' ? ()=>{
                const originSubject = library.find(s => String(s.id) === String(activeTopic.origin.subjectId));
                const originTopic = originSubject?.topics?.find(t => String(t.id) === String(activeTopic.origin.topicId));
                if (!originSubject || !originTopic) return;
                setLibFilter('academia');
                setActiveFolderId(originSubject.folderId || null);
                setActiveSubjectId(originSubject.id);
                setActiveTopicId(originTopic.id);
                setView('academia-topic');
              } : null}
              goToAulaLabel={activeTopic.origin?.source==='academia' ? 'Ler aula' : 'Assistir aula'}
              onGenerateExtra={canUseAcademia && activeTopic.origin?.source==='academia' ? ()=>{
                const originSubject = library.find(s => String(s.id) === String(activeTopic.origin.subjectId));
                const originTopic = originSubject?.topics?.find(t => String(t.id) === String(activeTopic.origin.topicId));
                if (!originSubject || !originTopic) return;
                setAcademiaExtraModal({topic:originTopic, subject:originSubject});
              } : null}
              inReviewCount={canUseAdvancedFeatures ? Object.keys(reviewQueue[`lib_${activeSubject.id}`]?.[`topic_${activeTopic.id}`]||{}).length : 0}
            />
          </div>
        )}

        {/* ── ACADEMIA TOPIC ── */}
        {/* ── ACADEMIA TOPIC ── */}
        {/* ── ACADEMIA TOPIC ── */}
        {view==='academia-topic'&&activeTopic&&activeSubject?.source==='academia'&&(
          <AcademiaTopicView
            topic={activeTopic}
            subject={activeSubject}
            library={library}
            darkMode={darkMode}
            isAdmin={canUseAdvancedFeatures}
            canUseAcademia={canUseAcademia}
            academiaGenerating={academiaGenerating}
            academiaGenProgress={academiaGenProgress}
            academiaTopicAnswers={academiaTopicAnswers}
            setAcademiaTopicAnswers={setAcademiaTopicAnswers}
            academiaExtraBusy={academiaExtraBusy}
            settings={settings}
            setSettings={setSettings}
            saveSettings={saveSettings}
            updateSubject={updateSubject}
            generateAcademiaLesson={generateAcademiaLesson}
            setAcademiaExtraModal={setAcademiaExtraModal}
            setAcademiaRegenModal={(payload)=>{
              setAcademiaRegenLength(settings.explanationLength || 'complete');
              setAcademiaRegenQStyle(settings.questionStyle || 'mixed');
              setAcademiaRegenQTypes(settings.questionTypes || ['direct']);
              setAcademiaRegenQAlts(settings.numAlternatives || 5);
              setAcademiaRegenReason('');
              setAcademiaRegenModal(payload);
            }}
            setDeleteId={setDeleteId}
            setAcademiaExportModal={setAcademiaExportModal}
            setOpenAnswerModal={setOpenAnswerModal}
            getKey={getKey}
            callWithRotation={callWithRotation}
            parseHtmlText={parseHtmlText}
            onBack={()=>setView('subject')}
            reviewQueue={reviewQueue}
            setSrModal={setSrModal}
            trackQuestionAnswered={trackQuestionAnswered}
            onOpenAcademiaQuestions={openAcademiaQuestionsInOracle}
          />
        )}


        {/* ── CREATOR ── */}
        {view==='creator'&&(
          <div className="max-w-2xl mx-auto">
            <button onClick={()=>{setCreatorStep(1);setNewSubName('');setMaterialText('');setUploadedFiles([]);setUploadedImages([]);setFocusAreas([]);setView('library');}} className={`mb-6 font-bold flex items-center gap-2 ${darkMode?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/>Cancelar</button>
            {creatorStep===1?(
              <div className="space-y-6">
                <h2 className="text-3xl font-serif font-bold text-yellow-600 flex items-center gap-3"><Sparkles className="w-8 h-8"/>Novo Assunto</h2>
                <input value={newSubName} onChange={e=>setNewSubName(e.target.value)} placeholder="Título (ex: Nefrologia)" className={`w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>

                {/* Focus areas multi-select */}
                <div>
                  <div className="text-xs font-bold uppercase mb-3 opacity-50">Ênfases das questões <span className="opacity-60 normal-case font-normal">(opcional — selecione uma ou mais)</span></div>
                  <div className="grid grid-cols-2 gap-2">
                    {FOCUS_AREAS.map(area=>{
                      const selected = focusAreas.includes(area.id);
                      return (
                        <button key={area.id} type="button"
                          onClick={()=>setFocusAreas(p=>p.includes(area.id)?p.filter(x=>x!==area.id):[...p,area.id])}
                          className={`text-left p-3 rounded-xl border-2 transition-all ${selected?'border-yellow-500 bg-yellow-600 text-white':(darkMode?'border-gray-600 bg-gray-800 text-gray-300 hover:border-yellow-600':'border-gray-200 bg-white text-gray-700 hover:border-yellow-400')}`}>
                          <div className="font-bold text-sm">{area.label}</div>
                          <div className={`text-xs mt-0.5 ${selected?'text-yellow-100 opacity-80':'opacity-40'}`}>{area.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="relative">
                  <div className="text-xs font-bold uppercase mb-2 opacity-50">Material Base</div>
                  {uploadedFiles.length>0&&<div className="flex flex-wrap gap-2 mb-3">{uploadedFiles.map((f,i)=><div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border ${darkMode?'bg-gray-700 border-gray-600 text-gray-200':'bg-gray-100 border-gray-200 text-gray-700'}`}><FileText className="w-4 h-4 text-yellow-600"/><span className="max-w-[120px] truncate">{f.name}</span><button type="button" aria-label={`Remover ${f.name}`} onClick={()=>setUploadedFiles(p=>p.filter((_,j)=>j!==i))} className="text-gray-400 hover:text-red-500"><XCircle className="w-4 h-4"/></button></div>)}</div>}
                  {uploadedImages.length>0&&<div className="flex flex-wrap gap-2 mb-3">{uploadedImages.map((img,i)=><div key={i} className="relative group"><img src={img.preview} alt="" className="w-16 h-16 object-cover rounded-lg border-2 border-yellow-400"/><button type="button" aria-label={`Remover imagem ${i + 1}`} onClick={()=>setUploadedImages(p=>p.filter((_,j)=>j!==i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-100 sm:opacity-0 sm:group-hover:opacity-100">×</button></div>)}</div>}
                  <textarea value={materialText} onChange={e=>setMaterialText(e.target.value)} placeholder="Insira textos base, anotações, transcrições..." className={`w-full h-48 p-4 rounded-xl border resize-none outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button type="button" aria-label="Adicionar imagem" onClick={()=>imageInputRef.current.click()} className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><ImageIcon className="w-5 h-5"/></button>
                    <button type="button" aria-label="Adicionar arquivo" onClick={()=>fileInputRef.current.click()} className="p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"><FileUp className="w-5 h-5"/></button>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" accept=".txt,.md,.pdf,.doc,.docx"/>
                  <input type="file" ref={imageInputRef} onChange={handleImageUpload} multiple className="hidden" accept="image/*"/>
                </div>
                {isBig()&&<div className={`text-xs p-3 rounded-lg flex gap-2 ${darkMode?'bg-yellow-900/20 text-yellow-300':'bg-yellow-50 text-yellow-800'}`}>
                  Material extenso — será processado em cerca de {materialRequestCount()} partes/requests.
                </div>}

                {/* Parâmetros de geração */}
                <div>
                  <div className="text-xs font-bold uppercase mb-3 opacity-50 flex items-center gap-2"><Sparkles className="w-3 h-3"/>Parâmetros de Geração</div>
                  {/* Toggle autoMode */}
                  <button onClick={()=>{ const ns={...settings,autoMode:!settings.autoMode}; setSettings(ns); saveSettings(ns); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${settings.autoMode?(darkMode?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(darkMode?'border-gray-600 bg-gray-800':'border-gray-200 bg-white')}`}>
                    <div>
                      <p className={`text-sm font-bold ${settings.autoMode?'text-yellow-500':''}`}>✦ Deixar o Oráculo escolher</p>
                      <p className="text-xs opacity-50 mt-0.5">A IA define a quantidade ideal de tópicos, subtópicos e questões</p>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-all flex items-center px-0.5 ${settings.autoMode?'bg-yellow-500':'bg-gray-400 dark:bg-gray-600'}`}>
                      <div style={{width:20,height:20,borderRadius:10,background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.3)',transform:settings.autoMode?'translateX(16px)':'translateX(0)',transition:'transform 0.2s'}}/>
                    </div>
                  </button>

                  <div className={`grid grid-cols-2 gap-3 transition-opacity ${settings.autoMode?'opacity-30 pointer-events-none':''}`}>
                    {[{l:'Tópicos',k:'numTopics',mn:1,mx:10},{l:'Subtópicos/Tópico',k:'numSubtopics',mn:1,mx:30},{l:'Questões/Subtópico',k:'qPerSub',mn:1,mx:10}].map(f=>(
                      <div key={f.k}>
                        <label className="block text-xs font-bold uppercase mb-1.5 opacity-40">{f.l}</label>
                        <input type="number" min={f.mn} max={f.mx} value={settings[f.k]}
                          onChange={e=>setSettings({...settings,[f.k]:e.target.value})}
                          onBlur={()=>{let v=parseInt(settings[f.k]);if(isNaN(v)||v<f.mn)v=f.mn;if(v>f.mx)v=f.mx;const ns={...settings,[f.k]:v};setSettings(ns);saveSettings(ns);}}
                          className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-bold uppercase mb-1.5 opacity-40">Alternativas</label>
                      <select value={settings.numAlternatives||5} onChange={e=>{const ns={...settings,numAlternatives:parseInt(e.target.value)};setSettings(ns);saveSettings(ns);}} className={`w-full p-3 rounded-lg border outline-none ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}>
                        <option value={4}>4 (A-D)</option>
                        <option value={5}>5 (A-E)</option>
                      </select>
                    </div>
                  </div>
                  {!settings.autoMode&&<p className={`text-xs mt-2 opacity-40`}>
                    Total estimado: {(settings.numTopics||10) * (settings.numSubtopics||5) * (settings.qPerSub||1)} questões
                  </p>}
                </div>

                {/* Tipo e estilo das questões */}
                <div>
                  <div className="text-xs font-bold uppercase mb-2 opacity-50">Tipo de questão <span className="normal-case font-normal opacity-70">(escolha um)</span></div>
                  <QuestionTypeSelector
                    selected={settings.questionTypes || ['direct']}
                    onChange={types=>{ const ns={...settings, questionTypes:types}; setSettings(ns); saveSettings(ns); }}
                    darkMode={darkMode}
                    single={true}
                  />
                </div>

                {/* Estilo clínico/direto */}
                {((settings.questionTypes||['direct']).some(t=>['direct','vof','cespe'].includes(t))) && (
                  <div>
                    <div className="text-xs font-bold uppercase mb-2 opacity-50">Estilo das questões</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[{k:'mixed',label:'Misto',desc:'Clínicas e diretas'},{k:'clinical',label:'Clínico',desc:'Casos clínicos'},{k:'direct',label:'Direto',desc:'Perguntas diretas'}].map(opt=>(
                        <button key={opt.k} onClick={()=>{ const ns={...settings,questionStyle:opt.k}; setSettings(ns); saveSettings(ns); }}
                          className={`py-2.5 px-2 rounded-xl border-2 text-xs font-bold transition-all text-center ${(settings.questionStyle||'mixed')===opt.k?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-600 bg-gray-800 text-gray-300':'border-gray-200 bg-white text-gray-700')}`}>
                          {opt.label}
                          <p className="font-normal opacity-60 mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={startCreation} disabled={isBusy||isUploading} className="w-full bg-yellow-600 text-white px-5 py-4 rounded-xl font-bold disabled:opacity-50 flex justify-center items-center gap-2">
                  {isBusy?<Spinner className="w-5 h-5 text-white"/>:<Sparkles className="w-5 h-5"/>}{isBusy?'Consultando...':(isUploading?'Processando...':'Gerar Estrutura')}
                </button>
              </div>
            ):(
              <div className="space-y-6">
                <h2 className="text-2xl font-serif font-bold text-yellow-600">Estrutura Gerada</h2>
                <div className={`w-full h-[40vh] p-6 rounded-xl border font-mono text-sm overflow-y-auto whitespace-pre-wrap ${darkMode?'bg-gray-800 border-gray-700 text-gray-300':'bg-gray-50 border-gray-200'}`}>{syllabus}</div>
                <div className="relative">
                  <textarea value={syllabusFB} onChange={e=>setSyllabusFB(e.target.value)} placeholder="Solicite ajustes..." className={`w-full h-20 p-4 pr-14 rounded-xl border resize-none outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
                  <button onClick={reviseSyllabus} disabled={!syllabusFB.trim()||isBusy} className="absolute bottom-4 right-4 p-2 bg-yellow-600 text-white rounded-lg disabled:opacity-40">{isBusy?<Spinner className="w-5 h-5 text-white"/>:<Send className="w-5 h-5"/>}</button>
                </div>
                <div className="flex gap-4">
                  <button onClick={()=>setCreatorStep(1)} className={`flex-1 py-4 rounded-xl font-bold ${darkMode?'bg-gray-800 hover:bg-gray-700':'bg-gray-200 hover:bg-gray-300'}`}>Voltar</button>
                  <button onClick={finalizeSub} className="flex-[2] bg-yellow-600 text-white px-5 py-4 rounded-xl font-bold hover:bg-yellow-700">Confirmar e Salvar</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ACADEMIA CREATOR ── */}
        {view==='academia-creator'&&canUseAcademia&&(
          <div className="max-w-2xl mx-auto">
            <button onClick={()=>{setAcademiaCreatorStep(1);setAcademiaSubName('');setAcademiaMaterialText('');setAcademiaUploadedFiles([]);setAcademiaUploadedImages([]);setAcademiaFocusAreas([]);setView('library');}} className={`mb-6 font-bold flex items-center gap-2 ${darkMode?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/>Cancelar</button>
            {academiaCreatorStep===1?(
              <div className="space-y-6">
                <h2 className="text-3xl font-serif font-bold text-yellow-600 flex items-center gap-3"><AcademiaIcon className="w-8 h-8"/>Nova Aula</h2>
                <p className={`text-sm rounded-xl p-4 ${darkMode?'bg-yellow-900/20 text-yellow-300 border border-yellow-800/30':'bg-yellow-50 text-yellow-800 border border-yellow-200'}`}>
                  📖 A Academia gera <strong>aula + questões de fixação</strong> a partir do conteúdo — como um curso profissional. Quanto mais detalhado o material, melhor a aula.
                </p>

                <input value={academiaSubName} onChange={e=>setAcademiaSubName(e.target.value)} placeholder="Título do assunto (ex: Síndrome Nefrótica)" className={`w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>

                {/* Focus areas */}
                <div>
                  <div className="text-xs font-bold uppercase mb-3 opacity-50">Ênfases <span className="opacity-60 normal-case font-normal">(opcional)</span></div>
                  <div className="grid grid-cols-2 gap-2">
                    {FOCUS_AREAS.map(area=>{
                      const selected = academiaFocusAreas.includes(area.id);
                      return (
                        <button key={area.id} type="button"
                          onClick={()=>setAcademiaFocusAreas(p=>p.includes(area.id)?p.filter(x=>x!==area.id):[...p,area.id])}
                          className={`text-left p-3 rounded-xl border-2 transition-all ${selected?'border-yellow-500 bg-yellow-600 text-white':(darkMode?'border-gray-600 bg-gray-800 text-gray-300 hover:border-yellow-600':'border-gray-200 bg-white text-gray-700 hover:border-yellow-400')}`}>
                          <div className="font-bold text-sm">{area.label}</div>
                          <div className={`text-xs mt-0.5 ${selected?'text-yellow-100 opacity-80':'opacity-40'}`}>{area.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Material */}
                <div className="relative">
                  <div className="text-xs font-bold uppercase mb-2 opacity-50">Material Base <span className="opacity-60 normal-case font-normal">(quanto mais completo, melhor a aula)</span></div>
                  {academiaUploadedFiles.length>0&&<div className="flex flex-wrap gap-2 mb-3">{academiaUploadedFiles.map((f,i)=><div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border ${darkMode?'bg-gray-700 border-gray-600 text-gray-200':'bg-gray-100 border-gray-200 text-gray-700'}`}><FileText className="w-4 h-4 text-yellow-600"/><span className="max-w-[120px] truncate">{f.name}</span><button type="button" aria-label={`Remover ${f.name}`} onClick={()=>setAcademiaUploadedFiles(p=>p.filter((_,j)=>j!==i))} className="text-gray-400 hover:text-red-500"><XCircle className="w-4 h-4"/></button></div>)}</div>}
                  {academiaUploadedImages.length>0&&<div className="flex flex-wrap gap-2 mb-3">{academiaUploadedImages.map((img,i)=><div key={i} className="relative group"><img src={img.preview} alt="" className="w-16 h-16 object-cover rounded-lg border-2 border-yellow-400"/><button type="button" aria-label={`Remover imagem ${i + 1}`} onClick={()=>setAcademiaUploadedImages(p=>p.filter((_,j)=>j!==i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-100 sm:opacity-0 sm:group-hover:opacity-100">×</button></div>)}</div>}
                  <textarea value={academiaMaterialText} onChange={e=>setAcademiaMaterialText(e.target.value)} placeholder="Cole slides, transcrições, resumos, anotações..." className={`w-full h-48 p-4 rounded-xl border resize-none outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button type="button" aria-label="Adicionar imagem" onClick={()=>academiaImageInputRef.current.click()} className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><ImageIcon className="w-5 h-5"/></button>
                    <button type="button" aria-label="Adicionar arquivo" onClick={()=>academiaFileInputRef.current.click()} className="p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"><FileUp className="w-5 h-5"/></button>
                  </div>
	                  <input type="file" ref={academiaFileInputRef} onChange={async(e)=>{
	                    const files=Array.from(e.target.files||[]);
	                    setIsUploading(true);
                    const loaded=[];
                    for(const f of files){
                      try{
                        const ab=await f.arrayBuffer();
                        let content='';
                        if(f.name.endsWith('.pdf')) content=await extractPdfText(ab);
                        else if(f.name.endsWith('.docx')) content=await extractDocxText(ab);
                        else content=await f.text();
                        loaded.push({name:f.name,content});
                      }catch(err){loaded.push({name:f.name,content:`[Erro ao ler ${f.name}]`});}
                    }
                    setAcademiaUploadedFiles(p=>[...p,...loaded]);
                    setIsUploading(false);
                    e.target.value='';
	                  }} multiple className="hidden" accept=".txt,.md,.pdf,.doc,.docx"/>
	                  <input type="file" ref={academiaImageInputRef} onChange={async(e)=>{
                    const files=Array.from(e.target.files||[]);
                    const loaded=[];
                    for(const f of files){
                      const b64=await new Promise(res=>{const r=new FileReader();r.onload=()=>res(r.result.split(',')[1]);r.readAsDataURL(f);});
                      loaded.push({base64:b64,mimeType:f.type,preview:URL.createObjectURL(f)});
                    }
                    setAcademiaUploadedImages(p=>[...p,...loaded]);
                    e.target.value='';
	                  }} multiple className="hidden" accept="image/*"/>
	                </div>
	                {academiaMaterialRequestCount()>1&&<div className={`text-xs p-3 rounded-lg flex gap-2 ${darkMode?'bg-yellow-900/20 text-yellow-300':'bg-yellow-50 text-yellow-800'}`}>
	                  Material extenso — será processado em cerca de {academiaMaterialRequestCount()} partes/requests.
	                </div>}

	                {/* Parâmetros */}
                <div>
                  <div className="text-xs font-bold uppercase mb-3 opacity-50 flex items-center gap-2"><Sparkles className="w-3 h-3"/>Parâmetros da Aula</div>
                  <button onClick={()=>{ const ns={...settings,autoMode:!settings.autoMode}; setSettings(ns); saveSettings(ns); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${settings.autoMode?(darkMode?'border-yellow-500 bg-yellow-900/20':'border-yellow-500 bg-yellow-50'):(darkMode?'border-gray-600 bg-gray-800':'border-gray-200 bg-white')}`}>
                    <div>
                      <p className={`text-sm font-bold ${settings.autoMode?'text-yellow-500':''}`}>✦ Deixar o Oráculo escolher</p>
                      <p className="text-xs opacity-50 mt-0.5">A IA define a quantidade ideal de tópicos e subtópicos</p>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-all flex items-center px-0.5 ${settings.autoMode?'bg-yellow-500':'bg-gray-400'}`}>
                      <div style={{width:20,height:20,borderRadius:10,background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.3)',transform:settings.autoMode?'translateX(16px)':'translateX(0)',transition:'transform 0.2s'}}/>
                    </div>
                  </button>
                  <div className={`grid grid-cols-2 gap-3 mt-3 transition-opacity ${settings.autoMode?'opacity-30 pointer-events-none':''}`}>
                    {[{l:'Tópicos',k:'numTopics',mn:1,mx:10},{l:'Subtópicos/Tópico',k:'numSubtopics',mn:2,mx:15}].map(f=>(
                      <div key={f.k}>
                        <label className="block text-xs font-bold uppercase mb-1.5 opacity-40">{f.l}</label>
                        <input type="number" min={f.mn} max={f.mx} value={settings[f.k]}
                          onChange={e=>setSettings({...settings,[f.k]:e.target.value})}
                          onBlur={()=>{let v=parseInt(settings[f.k]);if(isNaN(v)||v<f.mn)v=f.mn;if(v>f.mx)v=f.mx;const ns={...settings,[f.k]:v};setSettings(ns);saveSettings(ns);}}
                          className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-bold uppercase mb-2 opacity-40">Tamanho da aula gerada</label>
                    <ExplanationLengthSelector
                      value={settings.explanationLength || 'complete'}
                      onChange={(length)=>{const ns={...settings,explanationLength:length};setSettings(ns);saveSettings(ns);}}
                      darkMode={darkMode}
                    />
                  </div>
                  {/* Alternativas — sempre visível, independente do autoMode */}
                  <div className="mt-3">
                    <label className="block text-xs font-bold uppercase mb-1.5 opacity-40">Alternativas por questão</label>
                    <div className="flex gap-2">
                      {[{v:4,l:'4 (A-D)'},{v:5,l:'5 (A-E)'}].map(opt=>(
                        <button key={opt.v} type="button"
                          onClick={()=>{const ns={...settings,numAlternatives:opt.v};setSettings(ns);saveSettings(ns);}}
                          className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-bold transition-all ${(settings.numAlternatives||5)===opt.v?(darkMode?'border-yellow-500 bg-yellow-900/20 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-600 bg-gray-800 text-gray-300':'border-gray-200 bg-white text-gray-700')}`}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tipo e estilo das questões de fixação */}
                <div>
                  <div className="text-xs font-bold uppercase mb-2 opacity-50">Questões de fixação — tipo</div>
                  <QuestionTypeSelector selected={settings.questionTypes||['direct']} onChange={types=>{const ns={...settings,questionTypes:types};setSettings(ns);saveSettings(ns);}} darkMode={darkMode} single={true}/>
                </div>
                {((settings.questionTypes||['direct']).some(t=>['direct','vof','cespe'].includes(t)))&&(
                  <div>
                    <div className="text-xs font-bold uppercase mb-2 opacity-50">Estilo das questões</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[{k:'mixed',label:'Misto',desc:'Clínicas e diretas'},{k:'clinical',label:'Clínico',desc:'Casos clínicos'},{k:'direct',label:'Direto',desc:'Perguntas diretas'}].map(opt=>(
                        <button key={opt.k} onClick={()=>{const ns={...settings,questionStyle:opt.k};setSettings(ns);saveSettings(ns);}}
                          className={`py-2.5 px-2 rounded-xl border-2 text-xs font-bold transition-all text-center ${(settings.questionStyle||'mixed')===opt.k?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-600 bg-gray-800 text-gray-300':'border-gray-200 bg-white text-gray-700')}`}>
                          {opt.label}<p className="font-normal opacity-60 mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={startAcademiaCreation} disabled={isBusy||isUploading} className="w-full bg-yellow-600 text-white px-5 py-4 rounded-xl font-bold disabled:opacity-50 flex justify-center items-center gap-2">
                  {isBusy?<Spinner className="w-5 h-5 text-white"/>:<AcademiaIcon className="w-5 h-5"/>}{isBusy?'Consultando...':(isUploading?'Processando...':'Gerar Estrutura da Aula')}
                </button>
              </div>
            ):(
              <div className="space-y-6">
                <h2 className="text-2xl font-serif font-bold text-yellow-600">Estrutura da Aula</h2>
                <p className={`text-sm rounded-xl p-3 ${darkMode?'bg-blue-900/20 text-blue-300 border border-blue-800/30':'bg-blue-50 text-blue-800 border border-blue-200'}`}>
                  ✅ Revise os tópicos e subtópicos. Eles viram seções da aula; as questões de fixação serão geradas para a aula como um todo, evitando repetir o mesmo eixo de cobrança entre subtópicos próximos.
                </p>
                <div className={`w-full h-[40vh] p-6 rounded-xl border font-mono text-sm overflow-y-auto whitespace-pre-wrap ${darkMode?'bg-gray-800 border-gray-700 text-gray-300':'bg-gray-50 border-gray-200'}`}>{academiaSyllabus}</div>
                <div className="relative">
                  <textarea value={academiaSyllabusFB} onChange={e=>setAcademiaSyllabusFB(e.target.value)} placeholder="Solicite ajustes (ex: adicione mais subtópicos sobre tratamento...)" className={`w-full h-20 p-4 pr-14 rounded-xl border resize-none outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
                  <button onClick={reviseAcademiaSyllabus} disabled={!academiaSyllabusFB.trim()||isBusy} className="absolute bottom-4 right-4 p-2 bg-yellow-600 text-white rounded-lg disabled:opacity-40">{isBusy?<Spinner className="w-5 h-5 text-white"/>:<Send className="w-5 h-5"/>}</button>
                </div>
                <div className="flex gap-4">
                  <button onClick={()=>setAcademiaCreatorStep(1)} className={`flex-1 py-4 rounded-xl font-bold ${darkMode?'bg-gray-800 hover:bg-gray-700':'bg-gray-200 hover:bg-gray-300'}`}>Voltar</button>
                  <button onClick={finalizeAcademia} className="flex-[2] bg-yellow-600 text-white px-5 py-4 rounded-xl font-bold hover:bg-yellow-700 flex items-center justify-center gap-2"><AcademiaIcon className="w-5 h-5"/>Criar Academia</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PASTE ── */}
        {view==='paste'&&(
          <div className="max-w-3xl mx-auto">
            <button onClick={()=>setView('sub-library')} className={`flex items-center gap-2 mb-6 font-bold ${darkMode?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/>Voltar</button>
            <h2 className="text-3xl font-serif font-bold text-yellow-600 mb-6 flex items-center gap-3"><Feather className="w-8 h-8"/>Importar Questões</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 relative">
              <div>
                <input value={pasteSubName} onChange={e=>{setPasteSubName(e.target.value);setShowSubSugs(true);}} onFocus={()=>setShowSubSugs(true)} onBlur={()=>setTimeout(()=>setShowSubSugs(false),200)} placeholder="Assunto Principal (opcional)" className={`w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
                {showSubSugs&&library.filter(s=>s.source==='external'&&s.id!=='imported-folder'&&s.title.toLowerCase().includes(pasteSubName.toLowerCase())).length>0&&(
                  <ul className={`absolute z-20 w-full md:w-[calc(50%-0.5rem)] mt-1 rounded-xl border shadow-lg overflow-hidden ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
                    {library.filter(s=>s.source==='external'&&s.id!=='imported-folder'&&s.title.toLowerCase().includes(pasteSubName.toLowerCase())).map((s,i)=><li key={i} onMouseDown={()=>setPasteSubName(s.title)} className={`p-3 cursor-pointer ${darkMode?'hover:bg-gray-700':'hover:bg-gray-50'}`}>{s.title}</li>)}
                  </ul>
                )}
              </div>
              <input value={pasteTopic} onChange={e=>setPasteTopic(e.target.value)} placeholder="Nome do Bloco — ex: Bloco 1" className={`w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
            </div>
            <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)} placeholder="Cole as questões aqui..." className={`w-full h-[40vh] p-6 rounded-xl border font-mono text-sm resize-none outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-800 border-gray-700 text-gray-300':'bg-white border-gray-200'}`}/>
            <button onClick={handlePasteImport} disabled={!pasteText.trim()} className="mt-4 w-full bg-yellow-600 text-white px-5 py-4 rounded-xl font-bold hover:bg-yellow-700 disabled:opacity-50">Salvar Importação</button>
          </div>
        )}

        {/* ── FAVORITES ── */}
        {view==='favorites'&&(()=>{
          // Build flat list of all favorited questions with context
          const favItems=[];
          library.forEach(s=>s.topics.forEach(t=>(t.favorites||[]).forEach(fId=>{
            const q=(t.questions||[]).find(x=>x.id===fId);
            if(q) favItems.push({subject:s,topic:t,question:q});
          })));

          const totalAnswered = favItems.filter(({topic,question})=>topic.answers?.[question.id]).length;
          const totalCorrect  = favItems.filter(({topic,question})=>{
            const answer = topic.answers?.[question.id];
            if (question.isOpen) { try { return (JSON.parse(answer)?.score ?? 0) >= 70; } catch(e) { return false; } }
            return answer===(question.options||[]).find(o=>o.isCorrect)?.letter;
          }).length;
          const pct = totalAnswered>0 ? Math.round(totalCorrect/totalAnswered*100) : 0;

  const handleFavAnswer = async (subject, topic, qId, letter) => {
    trackQuestionAnswered(`${subject?.source||'oraculo'}:${subject.id}:${topic.id}:${qId}`);
    const q = (topic.questions||[]).find(x=>x.id===qId);
	            const errorNotebook = canUseAdvancedFeatures && !isAnswerCorrect(q, letter) ? addToList(topic.errorNotebook||[], qId) : (topic.errorNotebook||[]);
	            await updateSubject({...subject, topics:subject.topics.map(t2=>t2.id===topic.id?{...t2,answers:{...t2.answers,[qId]:letter},errorNotebook}:t2)});
	          };
	          const handleFavUnfavorite = async (subject, topic, qId) => {
	            const nf=(topic.favorites||[]).filter(f=>f!==qId);
	            await updateSubject({...subject,topics:subject.topics.map(t2=>t2.id===topic.id?{...t2,favorites:nf}:t2)});
	          };
	          const handleFavNotebook = async (subject, topic, qId) => {
	            if (!canUseAdvancedFeatures) return;
	            await updateSubject({...subject,topics:subject.topics.map(t2=>t2.id===topic.id?{...t2,errorNotebook:toggleInList(topic.errorNotebook||[],qId)}:t2)});
	          };
          const handleFavResetAll = async () => {
            // Reset only answers for favorited questions
            const updates = {};
            favItems.forEach(({subject,topic,question})=>{
              const key=`${subject.id}__${topic.id}`;
              if(!updates[key]) updates[key]={subject,topic,idsToReset:[]};
              updates[key].idsToReset.push(question.id);
            });
            for(const {subject,topic,idsToReset} of Object.values(updates)){
              const newAns=Object.fromEntries(Object.entries(topic.answers||{}).filter(([k])=>!idsToReset.includes(k)));
              await updateSubject({...subject,topics:subject.topics.map(t2=>t2.id===topic.id?{...t2,answers:newAns}:t2)});
            }
          };

          // Build a synthetic "topic" for export
          const favTopic = {
            title:'Questões Favoritas',
            questions: favItems.map(({question})=>question),
          };

          return (
            <div>
              {/* Header */}
              <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 pb-6 border-b ${darkMode?'border-gray-700':'border-gray-200'}`}>
                <div>
                  <button onClick={()=>setView('library')} className={`flex items-center gap-2 mb-2 font-bold ${darkMode?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/>Voltar</button>
                  <h2 className="text-2xl font-serif font-bold text-yellow-600 flex items-center gap-3"><Heart className="w-7 h-7 text-red-500" filled/>Questões Favoritas</h2>
                  {totalAnswered>0&&<p className="text-sm opacity-60 mt-1">{totalCorrect}/{totalAnswered} corretas ({pct}%)</p>}
                </div>
                {favItems.length>0&&(
                  <div className="flex flex-wrap gap-2">
                    <button onClick={()=>setExportModal({topic:favTopic,subject:null})} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold border ${darkMode?'border-gray-600 text-gray-300 hover:bg-gray-700':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}><Printer className="w-4 h-4"/>Exportar</button>
                    <button onClick={handleFavResetAll} className="flex items-center gap-1.5 px-3 py-2 border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-bold"><Eraser className="w-4 h-4"/>Limpar</button>
                  </div>
                )}
              </div>

              {favItems.length===0&&(
                <EmptyState
                  darkMode={darkMode}
                  icon={<Heart className="w-7 h-7"/>}
                  title="Nenhuma questão favoritada ainda"
                  message="Use o coração em qualquer questão para montar uma lista rápida do que merece voltar depois."
                />
              )}

              {/* Group by subject › topic */}
              {Object.entries(
                favItems.reduce((acc,item)=>{
                  const key=`${item.subject.id}__${item.topic.id}`;
                  if(!acc[key]) acc[key]={subject:item.subject,topic:item.topic,items:[]};
                  acc[key].items.push(item);
                  return acc;
                },{})
              ).map(([key,{subject,topic,items}])=>(
                <div key={key} className="mb-8">
                  <div className={`flex items-center gap-2 mb-4 py-2 border-b ${darkMode?'border-gray-700':'border-gray-200'}`}>
                    <FolderIcon className="w-4 h-4 text-yellow-600"/>
                    <span className="text-xs opacity-40">{subject.title}</span>
                    <span className="text-xs opacity-20">›</span>
                    <span className="text-sm font-bold">{topic.title}</span>
                    <button onClick={()=>{setActiveSubjectId(subject.id);setActiveTopicId(topic.id);setView('topic');}} className="ml-auto text-xs text-yellow-600 font-bold hover:underline">Ver tópico →</button>
                  </div>
                  {items.map(({question},i)=>(
                    <QuestionCard
                      key={i} question={question} index={i}
                      selectedLetter={topic.answers?.[question.id]}
                      onAnswer={l=>handleFavAnswer(subject,topic,question.id,l)}
                      darkMode={darkMode}
	                      isFavorite={true}
	                      onToggleFavorite={()=>handleFavUnfavorite(subject,topic,question.id)}
	                      showErrorNotebook={canUseAdvancedFeatures}
	                      isInErrorNotebook={(topic.errorNotebook||[]).includes(question.id)}
	                      onToggleErrorNotebook={()=>handleFavNotebook(subject,topic,question.id)}
	                      apiKey={getKey()} oracleLength={settings.oracleLength} onCall={callWithRotation}
                    />
                  ))}
                </div>
              ))}
            </div>
          );
	        })()}

	        {/* ── REVISÃO ESPAÇADA GLOBAL ── */}
	        {view==='spaced-review'&&canUseAdvancedFeatures&&(()=>{
	          const dm = darkMode;
	          const dueItems = getDueReviews();
	          const SR_LABELS = ['3d','7d','14d','30d','90d'];
	          const bySource = {};
	          dueItems.forEach(item => {
	            const source = item.source === 'academia' ? 'Academia' : item.source === 'curso' ? 'Portal do Curso' : item.source === 'external' ? 'Acervo Externo' : 'Oráculo';
	            const groupKey = `${source}__${item.aulaId}`;
	            if (!bySource[groupKey]) bySource[groupKey] = { source, title:item.aulaTitle || item.item?.aulaTitle || item.aulaId, items:[] };
	            bySource[groupKey].items.push(item);
	          });

          if (reviewSession) {
            const { items: sessionItems, index, sessionAnswers, sessionResults = {}, completed = false } = reviewSession;
            const cur = sessionItems[index];
            const total = sessionItems.length;
            const done = Object.keys(sessionAnswers).length;
            const finished = done === total;
            const reviewListMode = canUseAdvancedFeatures && (settings.questionDisplayMode || 'list') === 'list';
            if (finished && completed) {
              const correct = Object.values(sessionResults).filter(Boolean).length;
	              const pct = Math.round(correct / total * 100);
              const wrong = total - correct;
              const tone = pct>=80 ? 'Excelente retenção.' : pct>=60 ? 'Boa sessão, com alguns pontos para reforçar.' : 'Sessão útil para revelar lacunas importantes.';
	              return (
	                <div className={`max-w-2xl mx-auto rounded-2xl border p-8 md:p-10 text-center ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'} shadow-sm`}>
	                  <RepeatIcon className="w-16 h-16 mx-auto mb-4 text-yellow-500"/>
	                  <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${dm?'text-gray-500':'text-gray-400'}`}>Sessão encerrada</p>
	                  <h2 className="text-3xl font-serif font-bold text-yellow-600 mb-3">Revisão concluída</h2>
	                  <p className={`text-4xl font-serif font-bold mb-2 ${pct>=70?'text-green-500':pct>=50?'text-yellow-600':'text-red-500'}`}>{pct}%</p>
                  <p className={`text-sm font-bold mb-4 ${dm?'text-gray-300':'text-gray-700'}`}>{correct}/{total} corretas · {wrong} para reforçar</p>
                  <p className={`text-sm leading-relaxed mb-6 ${dm?'text-gray-400':'text-gray-500'}`}>{tone} As questões acertadas foram empurradas para o próximo intervalo; as erradas voltam para revisão mais cedo.</p>
                  <div className={`grid grid-cols-2 gap-3 mb-8 text-left`}>
                    <div className={`rounded-xl border p-4 ${dm?'border-gray-800 bg-gray-950/60':'border-gray-100 bg-gray-50'}`}>
                      <p className="text-2xl font-serif font-bold text-green-500">{correct}</p>
                      <p className={`text-xs font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>avançaram</p>
                    </div>
                    <div className={`rounded-xl border p-4 ${dm?'border-gray-800 bg-gray-950/60':'border-gray-100 bg-gray-50'}`}>
                      <p className="text-2xl font-serif font-bold text-red-500">{wrong}</p>
                      <p className={`text-xs font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>reforço</p>
                    </div>
                  </div>
                  <button onClick={()=>setReviewSession(null)} className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold">
                    Voltar
                  </button>
	                </div>
	              );
	            }

	            const item = cur;
	            const q = item.question;
	            const seed = item.item.reviewSeed || 42;
	            const shuffleWithSeed = (arr, s) => {
	              const a = [...arr]; let st = s;
	              for (let i = a.length-1; i>0; i--) {
	                st = (st * 1664525 + 1013904223) & 0xffffffff;
	                const j = Math.abs(st) % (i+1);
	                [a[i], a[j]] = [a[j], a[i]];
	              }
	              return a;
	            };
	            const correctText = q.options?.find(o=>o.isCorrect)?.text;
	            const reviewQ = {...q, options:shuffleWithSeed(q.options||[], seed).map((opt,i)=>({...opt, letter:'ABCDE'[i], isCorrect: opt.text===correctText}))};
	            return (
	              <div className="max-w-2xl mx-auto">
                <button onClick={()=>setReviewSession(null)} className={`flex items-center gap-2 mb-4 font-bold ${dm?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/>Sair</button>
	                <div className={`flex items-center gap-3 mb-6 p-3 rounded-xl ${dm?'bg-gray-800':'bg-gray-50'}`}>
	                  <div className={`flex-1 h-2 rounded-full overflow-hidden ${dm?'bg-gray-700':'bg-gray-200'}`}><div className="h-full bg-yellow-500 rounded-full transition-all" style={{width:`${done/total*100}%`}}/></div>
	                  <span className={`text-xs font-bold flex-shrink-0 ${dm?'text-gray-400':'text-gray-500'}`}>{index+1}/{total}</span>
	                </div>
	                <p className={`text-xs mb-2 ${dm?'text-gray-500':'text-gray-400'}`}>{item.aulaTitle} — {item.blockTitle}</p>
	                <QuestionCard
	                  question={reviewQ}
	                  index={index}
	                  selectedLetter={sessionAnswers[item.qId]}
                  onAnswer={async (letter)=>{
                    const correct = isAnswerCorrect(reviewQ, letter);
                    trackQuestionAnswered(`review:${item.aulaId}:${item.blockId}:${item.qId}:${item.item?.dueDate||getTodayKey()}`);
                    setReviewSession(p=>({...p, sessionAnswers:{...(p?.sessionAnswers||{}), [item.qId]:letter}, sessionResults:{...(p?.sessionResults||{}), [item.qId]:correct}}));
                    if (!correct) setReviewNotebook(item, 'add');
                    await updateReviewItem(item.aulaId, item.blockId, item.qId, correct);
                  }}
	                  darkMode={dm}
	                  isFavorite={isReviewItemFavorite(item)}
	                  onToggleFavorite={()=>toggleReviewFavorite(item)}
                  showErrorNotebook={false}
	                  apiKey={getKey()}
	                  oracleLength={settings.oracleLength}
	                  onCall={callWithRotation}
	                />
                <div className="flex items-center justify-between gap-3 mt-4">
                  <button onClick={()=>setReviewSession(p=>({...p,index:Math.max(0,index-1)}))} disabled={index===0} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${index===0?(dm?'border-gray-800 text-gray-700 bg-gray-900/40':'border-gray-100 text-gray-300 bg-gray-50'):(dm?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50')}`}><ArrowLeft className="w-4 h-4"/>Voltar</button>
                  <button
                    onClick={()=>setReviewSession(p=>(index===total-1?{...p,completed:true}:{...p,index:Math.min(total-1,index+1)}))}
                    disabled={index===total-1 && !finished}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${(index===total-1 && !finished)?(dm?'border-gray-800 text-gray-700 bg-gray-900/40':'border-gray-100 text-gray-300 bg-gray-50'):(dm?'border-yellow-700 bg-yellow-900/30 text-yellow-300 hover:bg-yellow-900/50':'border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100')}`}
                  >
                    {index===total-1?'Concluir':'Avançar'}
                    {index===total-1?<CheckIcon className="w-4 h-4"/>:<ChevronRight className="w-4 h-4"/>}
                  </button>
                </div>
	              </div>
	            );
	          }

	          return (
	            <div className="space-y-6">
	              <div className={`rounded-2xl border p-6 ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'} shadow-sm`}>
	                <button onClick={()=>setView('library')} className={`flex items-center gap-2 mb-4 font-bold ${dm?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/>Início</button>
	                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
	                  <div>
	                    <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${dm?'text-yellow-500/80':'text-yellow-700/80'}`}>Fila global</p>
	                    <h2 className="text-3xl font-serif font-bold text-yellow-600">Revisão Espaçada</h2>
	                    <p className={`text-sm mt-1 ${dm?'text-gray-400':'text-gray-500'}`}>Oráculo, Portal do Curso, Academia e Acervo Externo no mesmo lugar.</p>
	                  </div>
	                  <div className={`rounded-xl border px-4 py-3 ${dm?'bg-gray-950 border-gray-800':'bg-gray-50 border-gray-100'}`}>
	                    <p className="text-2xl font-serif font-bold text-yellow-600">{dueItems.length}</p>
	                    <p className={`text-xs font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>pendente{dueItems.length!==1?'s':''}</p>
	                  </div>
	                </div>
	              </div>

	              {dueItems.length === 0 ? (
	                <EmptyState
	                  darkMode={dm}
	                  icon={<RepeatIcon className="w-7 h-7"/>}
	                  title="Nenhuma revisão pendente"
	                  message="Quando terminar blocos, adicione as questões à fila para manter a memória em dia."
	                />
	              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={`text-sm font-bold ${dm?'text-gray-400':'text-gray-500'}`}>{dueItems.length} {dueItems.length===1?'questão pendente':'questões pendentes'}</p>
                    <button onClick={()=>setReviewSession({items:dueItems,index:0,sessionAnswers:{}})} className="flex items-center gap-2 px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold text-sm"><RepeatIcon className="w-4 h-4"/>Começar revisão</button>
                  </div>
                  {Object.entries(bySource).map(([key,{source,title,items}])=>(
                    <div key={key} className={`rounded-2xl border overflow-hidden ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                      <div className={`flex items-center justify-between px-5 py-3 border-b ${dm?'border-gray-800':'border-gray-100'}`}>
	                        <div className="min-w-0">
	                          <p className={`text-[11px] font-bold uppercase tracking-widest ${dm?'text-gray-500':'text-gray-400'}`}>{source}</p>
	                          <p className="font-bold text-sm truncate">{title}</p>
	                          <p className={`text-xs mt-0.5 ${dm?'text-gray-500':'text-gray-400'}`}>{items.length} {items.length===1?'questão':'questões'}</p>
                        </div>
                        <button onClick={()=>setReviewSession({items,index:0,sessionAnswers:{}})} className={`flex-shrink-0 ml-3 text-xs font-bold px-3 py-1.5 rounded-lg ${dm?'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50':'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}>Revisar</button>
                      </div>
                      <div className={`px-5 py-3 text-xs ${dm?'text-gray-500':'text-gray-400'}`}>
                        {items.length} revisão{items.length!==1?'ões':''} vencida{items.length!==1?'s':''} nesta origem.
                      </div>
                    </div>
                  ))}
                </div>
	              )}
	            </div>
	          );
	        })()}

	        {/* ── PORTAL DO CURSO ── */}
        {view==='curso'&&canSeeVideoaulas&&(()=>{
          const dm = darkMode;
          const currentWeek = getCurrentWeek();
          const activeWeek = curWeek ?? currentWeek ?? 1;
          const weekData = cronograma?.find(w=>w.week===activeWeek);

          // Progresso por tópico
          const watchedByTopic = {};
          if(videoaulasData){
            Object.values(videoaulasData).forEach(topics=>
              Object.entries(topics).forEach(([topic,cats])=>{
                const all=extractAulas(cats);
                const watched=all.filter(a=>watchedAulas[getAulaId(a)]).length;
                watchedByTopic[topic]={watched,total:all.length};
              })
            );
          }

          // Total geral de progresso
          const totalWatched = Object.values(watchedByTopic).reduce((a,b)=>a+b.watched,0);
          const totalAulas   = Object.values(watchedByTopic).reduce((a,b)=>a+b.total,0);
          const globalPct    = totalAulas>0?Math.round(totalWatched/totalAulas*100):0;

          const tabs = [
            {id:'videoaulas', label:'Videoaulas',   icon:<VideoIcon className="w-4 h-4"/>},
            {id:'questoes',   label:'Questões',     icon:<GraduationCap className="w-4 h-4"/>},
            {id:'revisoes',   label:'Revisões',     icon:<RepeatIcon className="w-4 h-4"/>, badge: dueCount},
            {id:'cronograma', label:'Cronograma',   icon:<CalendarCheck className="w-4 h-4"/>},
          ];

          return (
            <div className={`min-h-screen ${dm?'bg-gray-950':'bg-gray-50'}`}>

              {/* ── HERO HEADER ── */}
              <div className={`relative overflow-hidden ${dm?'bg-gray-900':'bg-white'} border-b ${dm?'border-gray-800':'border-gray-100'}`}>
                <div className="max-w-5xl mx-auto px-4 pt-6 pb-0">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <button onClick={()=>setView('library')} className={`flex items-center gap-1.5 text-xs font-bold mb-3 transition-colors ${dm?'text-gray-500 hover:text-gray-300':'text-gray-400 hover:text-gray-600'}`}>
                        <ArrowLeft className="w-3 h-3"/>Início
                      </button>
                      <h1 className="text-2xl md:text-3xl font-serif font-bold text-yellow-600 leading-tight">Portal do Curso</h1>
                      <p className={`text-sm mt-1 ${dm?'text-gray-400':'text-gray-500'}`}>Videoaulas · Questões · Cronograma</p>
                    </div>
                    {/* Progresso global */}
                    <div className={`flex-shrink-0 text-right`}>
                      <div className={`text-3xl font-bold font-serif ${globalPct===100?'text-green-500':'text-yellow-600'}`}>{globalPct}<span className="text-lg">%</span></div>
                      <div className={`text-xs ${dm?'text-gray-500':'text-gray-400'}`}>{totalWatched}/{totalAulas} aulas</div>
                      {currentWeek&&<div className={`text-xs font-bold mt-1 ${dm?'text-yellow-500':'text-yellow-600'}`}>Semana {currentWeek} de 46</div>}
                    </div>
                  </div>
                  {/* Barra de progresso global */}
                  <div className={`h-1 w-full rounded-full overflow-hidden mb-0 ${dm?'bg-gray-800':'bg-gray-100'}`}>
                    <div className={`h-full rounded-full transition-all duration-700 ${globalPct===100?'bg-green-500':'bg-yellow-500'}`} style={{width:`${globalPct}%`}}/>
                  </div>
                  {/* Tabs */}
                  <div className="flex mt-1 -mb-px">
	                    {tabs.map(tab=>(
	                      <button key={tab.id} onClick={()=>tab.id==='revisoes'&&canUseAdvancedFeatures?setView('spaced-review'):setCursoTab(tab.id)}
                        className={`relative flex items-center gap-2 px-4 py-3.5 text-sm font-bold border-b-2 transition-all ${cursoTab===tab.id
                          ?'border-yellow-500 text-yellow-600'
                          :`border-transparent ${dm?'text-gray-500 hover:text-gray-300':'text-gray-400 hover:text-gray-700'}`}`}>
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                        {(tab.badge||0)>0&&<span className="absolute -top-0 right-0 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-0.5 flex items-center justify-center">{tab.badge>9?'9+':tab.badge}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── TAB CONTENT ── */}
              <div className="max-w-5xl mx-auto px-4 py-6">

                {/* ── ABA VIDEOAULAS ── */}
                {cursoTab==='videoaulas'&&(()=>{
                  if(videoaulasLoading) return <LoadingState darkMode={dm} label="Carregando videoaulas..."/>;
                  if(!videoaulasData||Object.keys(videoaulasData).length===0) return (
                    <EmptyState
                      darkMode={dm}
                      icon={<VideoIcon className="w-7 h-7"/>}
                      title="Nenhuma videoaula carregada"
                      message="Quando o conteúdo estiver disponível, ele aparece aqui organizado por assunto e tópico."
                    />
                  );
                  const parsedData = parseVideoaulasData(videoaulasData);
                  const subjects   = sortSubjects(Object.keys(parsedData));
                  return (
                    <div className="space-y-3">
                      {subjects.map(subj=>{
                        const topics  = parsedData[subj];
                        const allAulas = Object.values(topics).flatMap(t=>[...t.main,...t.bonus]);
                        const watched  = allAulas.filter(a=>watchedAulas[getAulaId(a)]).length;
                        const pct = allAulas.length>0?Math.round(watched/allAulas.length*100):0;
                        const isExp = vqExpandedSubj[subj]??false;
                        return (
                          <div key={subj} className={`rounded-2xl border overflow-hidden ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                            {/* Assunto header */}
                            <button onClick={()=>setVqExpandedSubj(p=>({...p,[subj]:!isExp}))}
                              className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${dm?'hover:bg-gray-800':'hover:bg-gray-50'}`}>
                              <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-sm ${pct===100?'bg-green-500 text-white':(dm?'bg-gray-800 text-yellow-400':'bg-yellow-100 text-yellow-700')}`}>
                                {pct===100?<CheckIcon className="w-5 h-5"/>:`${pct}%`}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold truncate">{subj}</p>
                                <div className={`flex items-center gap-2 mt-1`}>
                                  <div className={`flex-1 h-1 rounded-full overflow-hidden ${dm?'bg-gray-700':'bg-gray-100'}`} style={{maxWidth:'120px'}}>
                                    <div className={`h-full rounded-full ${pct===100?'bg-green-500':'bg-yellow-500'}`} style={{width:`${pct}%`}}/>
                                  </div>
                                  <span className={`text-xs ${dm?'text-gray-500':'text-gray-400'}`}>{watched}/{allAulas.length}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={e=>{e.stopPropagation();setActiveSubjectVid(subj);setActiveSubtopicVid(null);setActiveAula(null);setView('videoaulas');}}
                                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${dm?'border-gray-700 text-gray-300 hover:bg-gray-700':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                  <PlayIcon className="w-3 h-3"/>Ver
                                </button>
                                {isExp?<ChevronDown className="w-4 h-4 opacity-40"/>:<ChevronRight className="w-4 h-4 opacity-40"/>}
                              </div>
                            </button>
                            {/* Tópicos expandidos */}
                            {isExp&&(
                              <div className={`border-t ${dm?'border-gray-800':'border-gray-100'}`}>
                                {Object.entries(topics).map(([topic,{main,bonus}])=>{
                                  const tAll=[...main,...bonus];
                                  const tW=tAll.filter(a=>watchedAulas[getAulaId(a)]).length;
                                  const tPct=tAll.length>0?Math.round(tW/tAll.length*100):0;
                                  const shortT=topic.replace(/^[A-ZÁÉÍÓÚ]{2,8}\s*\d+\s*[-–]\s*/i,'').trim();
                                  return (
                                    <button key={topic}
                                      onClick={()=>{setActiveSubjectVid(subj);setActiveSubtopicVid(`${topic}::main`);setActiveAula(null);setView('videoaulas');}}
                                      className={`w-full flex items-center gap-3 px-4 py-3 border-b text-left transition-colors last:border-0 ${dm?'border-gray-800 hover:bg-gray-800':'border-gray-50 hover:bg-gray-50'}`}>
                                      <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${tPct===100?'bg-green-500 text-white':(dm?'bg-gray-800 text-gray-400':'bg-gray-100 text-gray-500')}`}>
                                        {tPct===100?<CheckIcon className="w-3.5 h-3.5"/>:`${tPct}%`}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${dm?'text-gray-300':'text-gray-700'}`}>{shortT||topic}</p>
                                        <p className={`text-xs ${dm?'text-gray-600':'text-gray-400'}`}>{tW}/{tAll.length} aulas{bonus.length>0?` · ${bonus.length} bônus`:''}</p>
                                      </div>
                                      <ChevronRight className="w-3.5 h-3.5 opacity-30 flex-shrink-0"/>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* ── ABA QUESTÕES ── */}
                {cursoTab==='questoes'&&(()=>{
                  if(!videoaulasData) return <LoadingState darkMode={dm} label="Carregando questões do curso..."/>;

                  const parsedData = parseVideoaulasData(videoaulasData);
                  const subjects   = sortSubjects(Object.keys(parsedData));

                  return (
                    <div className="space-y-2">
                      {subjects.map(subj => {
                        const topics   = parsedData[subj] || {};
                        const allAulas = Object.values(topics).flatMap(t=>[...t.main,...t.bonus]);
                        if (!allAulas.length) return null;
                        const isExpSubj = vqExpandedSubj[subj] ?? false;
                        const subjQs = allAulas.reduce((acc,a)=>{
                          const d=vqBlocks[aulaVqKey(a)];
                          return acc+(d?.blocks?blockValues(d.blocks).reduce((s,b)=>s+(b.questions?.length||0),0):0);
                        },0);

                        return (
                          <div key={subj} className={`rounded-2xl border overflow-hidden ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                            {/* Assunto */}
                            <button onClick={()=>setVqExpandedSubj(p=>({...p,[subj]:!isExpSubj}))}
                              className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${dm?'hover:bg-gray-800':'hover:bg-gray-50'}`}>
                              <FolderIcon className="w-5 h-5 text-yellow-600 flex-shrink-0"/>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold">{subj}</p>
                                <p className={`text-xs mt-0.5 ${dm?'text-gray-500':'text-gray-400'}`}>
                                  {allAulas.length} aulas{subjQs>0?` · ${subjQs} questões`:''}</p>
                              </div>
                              {isExpSubj?<ChevronDown className="w-4 h-4 opacity-40 flex-shrink-0"/>:<ChevronRight className="w-4 h-4 opacity-40 flex-shrink-0"/>}
                            </button>

                            {/* Tópicos */}
                            {isExpSubj&&Object.entries(topics).map(([topic, {main,bonus}])=>{
                              const topicAulas = [...main,...bonus];
                              if (!topicAulas.length) return null;
                              const shortT = topic.replace(/^[A-ZÁÉÍÓÚ]{2,8}\s*\d+\s*[-–]\s*/i,'').trim();
                              const topicKey = `q_${subj}_${topic}`;
                              const isExpTopic = vqExpandedTopic[topicKey] ?? false;
                              const topicQs = topicAulas.reduce((acc,a)=>{
                                const d=vqBlocks[aulaVqKey(a)];
                                return acc+(d?.blocks?blockValues(d.blocks).reduce((s,b)=>s+(b.questions?.length||0),0):0);
                              },0);

                              return (
                                <div key={topic} className={`border-t ${dm?'border-gray-800':'border-gray-100'}`}>
                                  <button onClick={()=>setVqExpandedTopic(p=>({...p,[topicKey]:!isExpTopic}))}
                                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${dm?'hover:bg-gray-800':'hover:bg-gray-50'}`}>
                                    <LayersIcon className="w-4 h-4 text-yellow-600 opacity-70 flex-shrink-0"/>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-bold truncate ${dm?'text-gray-300':'text-gray-700'}`}>{shortT||topic}</p>
                                      <p className={`text-xs ${dm?'text-gray-600':'text-gray-400'}`}>
                                        {topicAulas.length} aulas{topicQs>0?` · ${topicQs} questões`:''}</p>
                                    </div>
                                    {isExpTopic?<ChevronDown className="w-3.5 h-3.5 opacity-30 flex-shrink-0"/>:<ChevronRight className="w-3.5 h-3.5 opacity-30 flex-shrink-0"/>}
                                  </button>

                                  {/* Aulas */}
                                  {isExpTopic&&topicAulas.map((aula,ai)=>{
                                    const key = aulaVqKey(aula);
                                    const d = vqBlocks[key];
                                    const qTotal = d?.blocks?blockValues(d.blocks).reduce((a,b)=>a+(b.questions?.length||0),0):0;
                                    const qAns   = d?.blocks?blockValues(d.blocks).reduce((a,b)=>a+Object.keys(b.answers||{}).length,0):0;
                                    const qPct   = qTotal>0?Math.round(qAns/qTotal*100):null;
                                    const hasQ   = qTotal > 0;
                                    return (
                                      <button key={ai}
                                        onClick={()=>{setVqSubject(subj);setVqTopic(topic);setVqAula(aula);setVqActiveBlock(null);setVqActiveBlockView(null);setView('videoquestions');}}
                                        className={`w-full flex items-center gap-3 px-5 py-3 border-t text-left transition-colors ${dm?'border-gray-800 hover:bg-gray-800':'border-gray-50 hover:bg-gray-50'}`}>
                                        <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${qPct===100?'bg-green-500 text-white':hasQ?(dm?'bg-yellow-900/40 text-yellow-400':'bg-yellow-100 text-yellow-700'):(dm?'bg-gray-800 text-gray-600':'bg-gray-100 text-gray-400')}`}>
                                          {qPct===100?<CheckIcon className="w-3.5 h-3.5"/>:hasQ?`${qPct}%`:<Sparkles className="w-3 h-3"/>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className={`text-sm truncate ${dm?'text-gray-300':'text-gray-700'}`}>{cleanAulaTitle(aula.title)}</p>
                                          <p className={`text-xs ${dm?'text-gray-600':'text-gray-400'}`}>
                                            {hasQ?`${qAns}/${qTotal} respondidas · ${Object.keys(d?.blocks||{}).length} bloco(s)`:'Sem questões'}
                                          </p>
                                        </div>
                                        <ChevronRight className="w-3.5 h-3.5 opacity-30 flex-shrink-0"/>
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        );
                      }).filter(Boolean)}
                    </div>
                  );
                })()}

                {/* ── ABA CRONOGRAMA ── */}
                {cursoTab==='revisoes'&&(()=>{
                  const dueItems = getDueReviews();
                  const SR_LABELS = ['3d','7d','14d','30d','90d'];

                  // Agrupar por aula
                  const byAula = {};
                  dueItems.forEach(item => {
                    const key = item.aulaId;
                    if (!byAula[key]) byAula[key] = { aulaTitle: item.aulaTitle, blockTitle: item.blockTitle, items: [] };
                    byAula[key].items.push(item);
                  });

                  if (!reviewSession) {
                    // Tela de lista de revisões pendentes
                    return (
                      <div>
                        {dueItems.length === 0 ? (
                          <EmptyState
                            darkMode={dm}
                            icon={<RepeatIcon className="w-7 h-7"/>}
                            title="Nenhuma revisão pendente"
                            message="Quando terminar um bloco de questões, adicione-o à revisão espaçada."
                          />
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between mb-2">
	                              <p className={`text-sm font-bold ${dm?'text-gray-400':'text-gray-500'}`}>
	                                {dueItems.length} {dueItems.length===1?'questão pendente':'questões pendentes'}
	                              </p>
		                              <button onClick={()=>setReviewSession({items: dueItems, index: 0, sessionAnswers: {}})}
		                                className="flex items-center gap-2 px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold text-sm">
		                                <RepeatIcon className="w-4 h-4"/> Começar revisão
		                              </button>
                            </div>
                            {Object.entries(byAula).map(([aulaId, {aulaTitle, items}]) => (
                              <div key={aulaId} className={`rounded-2xl border overflow-hidden ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                                <div className={`flex items-center justify-between px-5 py-3 border-b ${dm?'border-gray-800':'border-gray-100'}`}>
                                  <div className="min-w-0">
                                    <p className="font-bold text-sm truncate">{aulaTitle||aulaId}</p>
	                                    <p className={`text-xs mt-0.5 ${dm?'text-gray-500':'text-gray-400'}`}>{items.length} {items.length===1?'questão':'questões'}</p>
                                  </div>
                                  <button onClick={()=>setReviewSession({items, index:0, sessionAnswers:{}})}
                                    className={`flex-shrink-0 ml-3 text-xs font-bold px-3 py-1.5 rounded-lg ${dm?'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50':'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}>
                                    Revisar
                                  </button>
                                </div>
                                {items.map((item, i) => (
                                  <div key={item.qId} className={`flex items-center gap-3 px-5 py-2.5 ${i<items.length-1?`border-b ${dm?'border-gray-800':'border-gray-50'}`:''}`}>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${dm?'bg-gray-800 text-gray-400':'bg-gray-100 text-gray-500'}`}>
                                      {SR_LABELS[item.item.interval]||'—'}
                                    </span>
                                    <p className={`text-xs truncate flex-1 ${dm?'text-gray-400':'text-gray-600'}`}>
                                      {item.blockTitle} — {item.question.statement.replace(/\n/g,' ').substring(0,60)}…
                                    </p>
                                    <button onClick={()=>removeFromReview(item.aulaId, item.blockId, item.qId)}
                                      className={`flex-shrink-0 text-xs ${dm?'text-gray-600 hover:text-red-400':'text-gray-300 hover:text-red-500'}`} title="Remover da revisão">
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Sessão de revisão ativa
                  const { items: sessionItems, index, sessionAnswers, sessionResults = {}, completed = false } = reviewSession;
                  const cur = sessionItems[index];
                  const total = sessionItems.length;
                  const done = Object.keys(sessionAnswers).length;
                  const finished = done === total;
                  const reviewListMode = canUseAdvancedFeatures && (settings.questionDisplayMode || 'list') === 'list';

                  if (finished && completed) {
                    const correct = Object.values(sessionResults).filter(Boolean).length;
                    const pct = Math.round(correct / total * 100);
                    const wrong = total - correct;
                    const tone = pct>=80 ? 'Excelente retenção.' : pct>=60 ? 'Boa sessão, com alguns pontos para reforçar.' : 'Sessão útil para revelar lacunas importantes.';
                    return (
                      <div className={`rounded-2xl border p-8 md:p-10 text-center ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'} shadow-sm`}>
                        <RepeatIcon className="w-16 h-16 mx-auto mb-4 text-yellow-500"/>
                        <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${dm?'text-gray-500':'text-gray-400'}`}>Sessão encerrada</p>
                        <h3 className="text-3xl font-serif font-bold text-yellow-600 mb-3">Revisão concluída</h3>
                        <p className={`text-4xl font-serif font-bold mb-2 ${pct>=70?'text-green-500':pct>=50?'text-yellow-600':'text-red-500'}`}>{pct}%</p>
                        <p className={`text-sm font-bold mb-4 ${dm?'text-gray-300':'text-gray-700'}`}>{correct}/{total} corretas · {wrong} para reforçar</p>
                        <p className={`text-sm leading-relaxed mb-6 ${dm?'text-gray-400':'text-gray-500'}`}>{tone} As questões acertadas foram empurradas para o próximo intervalo; as erradas voltam para revisão mais cedo.</p>
                        <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                          <div className={`rounded-xl border p-4 ${dm?'border-gray-800 bg-gray-950/60':'border-gray-100 bg-gray-50'}`}>
                            <p className="text-2xl font-serif font-bold text-green-500">{correct}</p>
                            <p className={`text-xs font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>avançaram</p>
                          </div>
                          <div className={`rounded-xl border p-4 ${dm?'border-gray-800 bg-gray-950/60':'border-gray-100 bg-gray-50'}`}>
                            <p className="text-2xl font-serif font-bold text-red-500">{wrong}</p>
                            <p className={`text-xs font-bold uppercase ${dm?'text-gray-500':'text-gray-400'}`}>reforço</p>
                          </div>
                        </div>
	                        <button onClick={()=>setReviewSession(null)} className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold">
	                          Voltar
	                        </button>
                      </div>
                    );
                  }

                  if (reviewListMode) {
                    return (
                      <div className="max-w-3xl mx-auto">
                        <button onClick={()=>setReviewSession(null)} className={`flex items-center gap-2 mb-4 font-bold ${dm?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/>Sair</button>
                        <div className={`mb-5 flex items-center gap-3 rounded-xl px-4 py-3 ${dm?'bg-gray-900':'bg-gray-50'}`}>
                          <div className={`flex-1 h-2 rounded-full overflow-hidden ${dm?'bg-gray-800':'bg-gray-200'}`}><div className="h-full bg-yellow-500 rounded-full transition-all" style={{width:`${done/total*100}%`}}/></div>
                          <span className={`text-xs font-bold ${dm?'text-gray-400':'text-gray-500'}`}>{done}/{total}</span>
                        </div>
                        {sessionItems.map((item, i)=>(
                          <QuestionCard
                            key={`${item.blockId}-${item.qId}`}
                            question={item.question}
                            index={i}
                            selectedLetter={sessionAnswers[item.qId]}
                            onAnswer={async (letter)=>{
                              const correct = isAnswerCorrect(item.question, letter);
                              trackQuestionAnswered(`review:${item.aulaId}:${item.blockId}:${item.qId}:${item.item?.dueDate||getTodayKey()}`);
                              setReviewSession(p=>({...p, sessionAnswers:{...(p?.sessionAnswers||{}), [item.qId]: letter}, sessionResults:{...(p?.sessionResults||{}), [item.qId]:correct}}));
                              if (canUseAdvancedFeatures && !correct) setReviewNotebook(item, 'add');
                              await updateReviewItem(item.aulaId, item.blockId, item.qId, correct);
                            }}
                            darkMode={dm}
                            isFavorite={isReviewItemFavorite(item)}
                            onToggleFavorite={()=>toggleReviewFavorite(item)}
                            showErrorNotebook={false}
                            apiKey={getKey()} oracleLength={settings.oracleLength} onCall={callWithRotation}
                          />
                        ))}
                        {finished&&(
                          <div className="text-center mt-2">
                            <button onClick={()=>setReviewSession(p=>({...p,completed:true}))} className="inline-flex items-center gap-2 px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold">
                              Concluir<CheckIcon className="w-4 h-4"/>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Questão atual da sessão com seed diferente para embaralhar alternativas
                  const item = cur;
                  const q = item.question;
                  const seed = item.item.reviewSeed || 42;
                  const shuffleWithSeed = (arr, s) => {
                    const a = [...arr]; let st = s;
                    for (let i = a.length-1; i>0; i--) {
                      st = (st * 1664525 + 1013904223) & 0xffffffff;
                      const j = Math.abs(st) % (i+1);
                      [a[i], a[j]] = [a[j], a[i]];
                    }
                    return a;
                  };
                  const correctText = q.options?.find(o=>o.isCorrect)?.text;
                  const shuffled = shuffleWithSeed(q.options||[], seed).map((opt,i)=>({...opt, letter:'ABCDE'[i], isCorrect: opt.text===correctText}));
                  const reviewQ = {...q, options: shuffled};

                  return (
                    <div className="max-w-2xl mx-auto">
                      {/* Progresso */}
                      <div className={`flex items-center gap-3 mb-6 p-3 rounded-xl ${dm?'bg-gray-800':'bg-gray-50'}`}>
                        <div className={`flex-1 h-2 rounded-full overflow-hidden ${dm?'bg-gray-700':'bg-gray-200'}`}>
                          <div className="h-full bg-yellow-500 rounded-full transition-all" style={{width:`${done/total*100}%`}}/>
                        </div>
	                        <span className={`text-xs font-bold flex-shrink-0 ${dm?'text-gray-400':'text-gray-500'}`}>{index+1}/{total}</span>
		                        <button onClick={()=>setReviewSession(null)} className={`text-xs ${dm?'text-gray-500 hover:text-gray-300':'text-gray-400 hover:text-gray-600'}`}>Sair</button>
	                      </div>
	                      <p className={`text-xs mb-2 ${dm?'text-gray-500':'text-gray-400'}`}>{item.aulaTitle} — {item.blockTitle}</p>
	                      <QuestionCard
	                        question={reviewQ} index={index}
	                        selectedLetter={sessionAnswers[item.qId]}
			                        onAnswer={async (letter)=>{
			                          const correct = isAnswerCorrect(reviewQ, letter);
			                          trackQuestionAnswered(`review:${item.aulaId}:${item.blockId}:${item.qId}:${item.item?.dueDate||getTodayKey()}`);
			                          setReviewSession(p=>({...p, sessionAnswers:{...(p?.sessionAnswers||{}), [item.qId]: letter}, sessionResults:{...(p?.sessionResults||{}), [item.qId]:correct}}));
			                          if (canUseAdvancedFeatures && !correct) setReviewNotebook(item, 'add');
			                          await updateReviewItem(item.aulaId, item.blockId, item.qId, correct);
			                        }}
	                        darkMode={dm}
	                        isFavorite={isReviewItemFavorite(item)}
	                        onToggleFavorite={()=>toggleReviewFavorite(item)}
		                        showErrorNotebook={false}
	                        apiKey={getKey()} oracleLength={settings.oracleLength} onCall={callWithRotation}
	                      />
	                      <div className="flex items-center justify-between gap-3 mt-4">
	                        <button onClick={()=>setReviewSession(p=>({...p,index:Math.max(0,index-1)}))} disabled={index===0}
	                          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${index===0?(dm?'border-gray-800 text-gray-700 bg-gray-900/40':'border-gray-100 text-gray-300 bg-gray-50'):(dm?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50')}`}>
	                          <ArrowLeft className="w-4 h-4"/>Voltar
	                        </button>
	                        <button
                            onClick={()=>setReviewSession(p=>(index===total-1?{...p,completed:true}:{...p,index:Math.min(total-1,index+1)}))}
                            disabled={index===total-1 && !finished}
	                          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${(index===total-1 && !finished)?(dm?'border-gray-800 text-gray-700 bg-gray-900/40':'border-gray-100 text-gray-300 bg-gray-50'):(dm?'border-yellow-700 bg-yellow-900/30 text-yellow-300 hover:bg-yellow-900/50':'border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100')}`}>
	                          {index===total-1?'Concluir':'Avançar'}
                            {index===total-1?<CheckIcon className="w-4 h-4"/>:<ChevronRight className="w-4 h-4"/>}
	                        </button>
	                      </div>
                    </div>
                  );
                })()}

                {cursoTab==='cronograma'&&(()=>{
                  // Config de data de início
                  const hasStart = !!cronStartDate;
                  return (
                    <div>
                      {/* Configuração de data */}
                      <div className={`rounded-2xl border p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${dm?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`}>
                        <CalendarCheck className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5 sm:mt-0"/>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">Data de início do curso</p>
                          <p className={`text-xs mt-0.5 ${dm?'text-gray-500':'text-gray-400'}`}>
                            {hasStart?`Semana atual calculada automaticamente: Semana ${currentWeek??'—'} de 46`:'Defina a data para calcular sua semana atual automaticamente.'}
                          </p>
                        </div>
                        <input type="date" value={cronStartDate||''} onChange={e=>saveCronStartDate(e.target.value)}
                          className={`flex-shrink-0 p-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-yellow-500 font-medium ${dm?'bg-gray-800 border-gray-700 text-white':'bg-gray-50 border-gray-200 text-gray-800'}`}/>
                      </div>

                      {cronLoading&&<div className="flex justify-center py-16"><Spinner className="w-8 h-8 text-yellow-600"/></div>}

                      {/* Grade de semanas */}
                      {!cronLoading&&(
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {(cronograma||[]).map(week=>{
                            const isActive = week.week===activeWeek;
                            const isCurrent = week.week===currentWeek;
                            const isPast = currentWeek!==null&&week.week<currentWeek;
                            // Calcular progresso da semana
                            const weekTopics=[...new Set(week.entries.map(e=>e.topic))];
                            const weekWatched=weekTopics.reduce((acc,t)=>acc+(watchedByTopic[t]?.watched||0),0);
                            const weekTotal=weekTopics.reduce((acc,t)=>acc+(watchedByTopic[t]?.total||0),0);
                            const weekPct=weekTotal>0?Math.round(weekWatched/weekTotal*100):0;
                            const weekSubjects=[...new Set(week.entries.map(e=>e.subject))];

                            if(isActive){
                              // Card expandido para semana ativa
                              return (
                                <div key={week.week} className={`sm:col-span-2 lg:col-span-3 rounded-2xl border-2 border-yellow-500 overflow-hidden ${dm?'bg-gray-900':'bg-white'}`}>
                                  <div className="p-4 pb-3">
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className="w-10 h-10 rounded-xl bg-yellow-600 text-white flex items-center justify-center font-bold font-serif text-lg flex-shrink-0">
                                        {week.week}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h3 className="font-bold text-yellow-600">Semana {week.week}</h3>
                                          {isCurrent&&<span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-500 text-white">📍 Esta semana</span>}
                                        </div>
                                        <p className={`text-xs mt-0.5 ${dm?'text-gray-400':'text-gray-500'}`}>{weekSubjects.join(' · ')}</p>
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <div className={`text-xl font-bold font-serif ${weekPct===100?'text-green-500':'text-yellow-600'}`}>{weekPct}%</div>
                                        <div className={`text-[10px] ${dm?'text-gray-500':'text-gray-400'}`}>{weekWatched}/{weekTotal}</div>
                                      </div>
                                    </div>
                                    <div className={`h-1.5 rounded-full overflow-hidden mb-3 ${dm?'bg-gray-800':'bg-gray-100'}`}>
                                      <div className={`h-full rounded-full transition-all ${weekPct===100?'bg-green-500':'bg-yellow-500'}`} style={{width:`${weekPct}%`}}/>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {week.entries.map((entry,i)=>(
                                        <button key={i} onClick={()=>{setActiveSubjectVid(entry.subject);setActiveSubtopicVid(`${entry.topic}::main`);setActiveAula(null);setView('videoaulas');}}
                                          className={`flex items-center gap-2 p-3 rounded-xl text-left transition-colors ${dm?'bg-gray-800 hover:bg-gray-700':'bg-gray-50 hover:bg-gray-100'}`}>
                                          <PlayIcon className="w-3 h-3 text-yellow-600 flex-shrink-0"/>
                                          <div className="min-w-0">
                                            <p className={`text-xs font-bold truncate ${dm?'text-gray-200':'text-gray-700'}`}>{entry.label}</p>
                                            <p className={`text-[10px] truncate ${dm?'text-gray-500':'text-gray-400'}`}>{entry.subject}</p>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            // Cards normais
                            return (
                              <button key={week.week} onClick={()=>setCurWeek(week.week)}
                                className={`rounded-2xl border p-4 text-left transition-all hover:border-yellow-400 ${isCurrent?'border-yellow-400':(dm?'border-gray-800':'border-gray-200')} ${dm?'bg-gray-900 hover:bg-gray-800':'bg-white hover:bg-gray-50'}`}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${weekPct===100?'bg-green-500 text-white':isCurrent?(dm?'bg-yellow-900/60 text-yellow-400 ring-1 ring-yellow-500':'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-400'):(isPast?(dm?'bg-gray-800 text-gray-400':'bg-gray-100 text-gray-500'):(dm?'bg-gray-800 text-gray-500':'bg-gray-100 text-gray-400'))}`}>
                                    {weekPct===100?<CheckIcon className="w-3.5 h-3.5"/>:week.week}
                                  </div>
                                  <span className={`text-[10px] font-bold ${weekPct===100?'text-green-500':dm?'text-gray-500':'text-gray-400'}`}>{weekPct}%</span>
                                </div>
                                <p className={`text-xs font-bold truncate mb-0.5 ${dm?'text-gray-300':'text-gray-700'}`}>{weekSubjects.join(' + ')}</p>
                                <p className={`text-[10px] truncate ${dm?'text-gray-600':'text-gray-400'}`}>{week.entries[0]?.label}{week.entries.length>1?` +${week.entries.length-1}`:''}</p>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })()}

        {/* ── VIDEOAULAS ── */}
        {view==='videoaulas'&&(()=>{
          const dm = darkMode;
          // DEMO_DATA usa o novo formato: Assunto → Tópico → { "Aulas Principais": [], "Bônus": [] }
          const DEMO_DATA = {
            "Ginecologia": {
              "GIN 6 - IST": {
                "Aulas Principais": [
                  {title:"02 - Introdução (GIN 6)",embed_url:"https://iframe.mediadelivery.net/embed/649407/fd56f7e5-8e2f-4f25-a45d-1c7a4f2a0b08",bunny_id:"fd56f7e5-8e2f-4f25-a45d-1c7a4f2a0b08"},
                  {title:"03 - Violência Sexual",embed_url:"https://iframe.mediadelivery.net/embed/649407/fd7c6bf6-558c-4be9-8178-7a2beeb778cc",bunny_id:"fd7c6bf6-558c-4be9-8178-7a2beeb778cc"},
                ],
                "Bônus": [
                  {title:"06 - Bônus - HIV e Gestação",embed_url:"https://iframe.mediadelivery.net/embed/649407/7c36c74d-d714-434d-bd9f-4ef095d2ace6",bunny_id:"7c36c74d-d714-434d-bd9f-4ef095d2ace6"},
                ]
              },
              "GIN 2 - SANGRAMENTO UTERINO ANORMAL": {
                "Aulas Principais": [
                  {title:"02 - Pólipos",embed_url:"https://iframe.mediadelivery.net/embed/649407/62e67657-9e68-49cd-8fb7-e4ad577ab3c8",bunny_id:"62e67657-9e68-49cd-8fb7-e4ad577ab3c8"},
                  {title:"03 - Sangramento Uterino Anormal",embed_url:"https://iframe.mediadelivery.net/embed/649407/88576d68-a31f-4d9e-af08-453a88e02cee",bunny_id:"88576d68-a31f-4d9e-af08-453a88e02cee"},
                ],
                "Bônus": [
                  {title:"04 - Bônus - Infertilidade",embed_url:"https://iframe.mediadelivery.net/embed/649407/153044db-1a93-4bd5-b9e3-0a8301489002",bunny_id:"153044db-1a93-4bd5-b9e3-0a8301489002"},
                ]
              },
            },
            "Reumatologia": {
              "REU 1 - GOTA E FEBRE REUMÁTICA": {
                "Aulas Principais": [
                  {title:"01 - Artrite Reumatoide",embed_url:"https://iframe.mediadelivery.net/embed/649407/2b5e6a59-509e-488c-b0ee-bb9cd5c00a2f",bunny_id:"2b5e6a59-509e-488c-b0ee-bb9cd5c00a2f"},
                ],
                "Bônus": []
              },
            },
          };
          const isDemo = !videoaulasData || Object.keys(videoaulasData).length===0;
          const raw = isDemo ? DEMO_DATA : videoaulasData;

          // Usar o helper global parseVideoaulasData → { [subj]: { [topic]: { main, bonus } } }
          const data     = parseVideoaulasData(raw);
          const subjects = sortSubjects(Object.keys(data));

          // allAulas = todas as aulas flat (main + bonus) para contagem de progresso
          const allAulas = Object.values(data).flatMap(s=>Object.values(s).flatMap(t=>[...t.main,...t.bonus]));
          const watchedCount = allAulas.filter(a=>watchedAulas[getAulaId(a)]).length;

          // Estado ativo: subject + topic + categoria ('main'|'bonus')
          const effSubject  = activeSubjectVid || subjects[0] || null;
          const effTopic    = activeSubtopicVid?.split('::')[0] || (effSubject ? Object.keys(data[effSubject]||{})[0] : null);
          const effCat      = activeSubtopicVid?.split('::')[1] || 'main';
          const effAulas    = (effSubject && effTopic) ? (data[effSubject]?.[effTopic]?.[effCat] || []) : [];
          const effAula     = activeAula || effAulas[0] || null;
          const effIdx      = effAulas.findIndex(a=>getAulaId(a)===getAulaId(effAula));
          const prevAula    = effIdx>0 ? effAulas[effIdx-1] : null;
          const nextAula    = effIdx<effAulas.length-1 ? effAulas[effIdx+1] : null;
          const sideBorder  = dm?'border-gray-700':'border-gray-200';
          const sideBg      = dm?'bg-gray-800/50':'bg-white';
          const textMuted   = dm?'text-gray-400':'text-gray-500';

          // Helper para setar tópico+cat ao mesmo tempo
          const setTopicCat = (subject, topic, cat) => {
            setActiveSubjectVid(subject);
            setActiveSubtopicVid(`${topic}::${cat}`);
            setActiveAula(data[subject]?.[topic]?.[cat]?.[0] || null);
          };

          return (
            <div className={`flex w-full ${dm?'bg-gray-900':'bg-gray-950'}`} style={{minHeight:'calc(100vh - 62px)',overflow:'hidden'}}>

              {/* ══ SIDEBAR ══ */}
              <div className={`w-64 xl:w-80 flex-shrink-0 border-r ${sideBg} ${sideBorder} hidden md:flex flex-col`} style={{height:'calc(100vh - 62px)'}}>
                <div className={`px-4 py-3 border-b ${sideBorder} flex-shrink-0`}>
                  <div className="flex items-center gap-2 mb-2">
                    <button onClick={()=>setView('library')} className={`p-1 rounded ${dm?'hover:bg-gray-700 text-gray-500':'hover:bg-gray-100 text-gray-400'}`}><ArrowLeft className="w-4 h-4"/></button>
                    <span className="font-bold text-sm text-yellow-600 flex items-center gap-1.5"><VideoIcon className="w-4 h-4"/>Videoaulas</span>
                    {isDemo&&<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto ${dm?'bg-yellow-900/40 text-yellow-500':'bg-yellow-100 text-yellow-600'}`}>DEMO</span>}
                    {!isDemo&&Object.keys(watchedAulas).length>0&&(
                      <button onClick={()=>{if(confirm('Resetar todo o progresso de aulas assistidas?')) resetWatchedProgress();}} title="Resetar progresso" className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded ${dm?'text-gray-500 hover:text-red-400':'text-gray-400 hover:text-red-500'}`}>resetar</button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-1 rounded-full overflow-hidden ${dm?'bg-gray-700':'bg-gray-100'}`}><div className="h-full bg-yellow-500 transition-all" style={{width:`${allAulas.length?watchedCount/allAulas.length*100:0}%`}}/></div>
                    <span className={`text-[10px] font-bold ${textMuted}`}>{watchedCount}/{allAulas.length}</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {videoaulasLoading&&<div className="flex justify-center py-8"><Spinner className="w-6 h-6 text-yellow-600"/></div>}
                  {subjects.map(subject=>{
                    const sAulas=Object.values(data[subject]).flatMap(t=>[...t.main,...t.bonus]);
                    const sW=sAulas.filter(a=>watchedAulas[getAulaId(a)]).length;
                    const isExp=expandedSubjectsVid[subject]??(subject===effSubject);
                    return (
                      <div key={subject} className={`border-b ${sideBorder}`}>
                        {/* Assunto */}
                        <button onClick={()=>{setExpandedSubjectsVid(p=>({...p,[subject]:!isExp}));setActiveSubjectVid(subject);}}
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-left ${dm?'hover:bg-gray-700/60':'hover:bg-gray-50'}`}>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold truncate ${effSubject===subject?'text-yellow-500':''}`}>{subject}</p>
                            <p className={`text-[10px] mt-0.5 ${textMuted}`}>{sW}/{sAulas.length}</p>
                          </div>
                          {isExp?<ChevronDown className="w-3 h-3 opacity-30 ml-1 flex-shrink-0"/>:<ChevronRight className="w-3 h-3 opacity-30 ml-1 flex-shrink-0"/>}
                        </button>
                        {isExp&&Object.entries(data[subject]).map(([topic,{main,bonus}])=>{
                          const topicAulas=[...main,...bonus];
                          const topicW=topicAulas.filter(a=>watchedAulas[getAulaId(a)]).length;
                          const isTopicExp=expandedSubjectsVid[`${subject}::${topic}`]??(effSubject===subject&&effTopic===topic);
                          return (
                            <div key={topic}>
                              {/* Tópico */}
                              <button onClick={()=>setExpandedSubjectsVid(p=>({...p,[`${subject}::${topic}`]:!isTopicExp}))}
                                className={`w-full flex items-center justify-between px-3 py-1.5 pl-5 text-left ${dm?'hover:bg-gray-700/40 text-gray-300':'hover:bg-gray-50 text-gray-600'} ${effSubject===subject&&effTopic===topic?(dm?'text-yellow-400':'text-yellow-700'):''}`}>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-semibold truncate">{shortTopicName(topic)}</p>
                                  <p className={`text-[9px] ${textMuted}`}>{topicW}/{topicAulas.length}</p>
                                </div>
                                {isTopicExp?<ChevronDown className="w-3 h-3 opacity-30 flex-shrink-0"/>:<ChevronRight className="w-3 h-3 opacity-30 flex-shrink-0"/>}
                              </button>
                              {isTopicExp&&(
                                <div>
                                  {/* Categoria: Aulas */}
                                  {main.length>0&&(
                                    <div>
                                      <button onClick={()=>setTopicCat(subject,topic,'main')}
                                        className={`w-full text-left px-3 py-1 pl-8 text-[10px] font-bold uppercase tracking-wider transition-colors ${effSubject===subject&&effTopic===topic&&effCat==='main'?(dm?'text-yellow-400 bg-yellow-900/30':'text-yellow-700 bg-yellow-50'):(dm?'text-gray-500 hover:bg-gray-700/30':'text-gray-400 hover:bg-gray-50')}`}>
                                        📖 Aulas ({main.length})
                                      </button>
                                      {effSubject===subject&&effTopic===topic&&effCat==='main'&&main.map((aula,ai)=>{
                                        const isAct=getAulaId(effAula)===getAulaId(aula);
                                        const watched=watchedAulas[getAulaId(aula)];
                                        return (
                                          <button key={getAulaId(aula)||ai} onClick={()=>setActiveAulaAndReset(aula)}
                                            className={`w-full flex items-center gap-2 px-3 py-1.5 pl-10 text-left transition-colors ${isAct?(dm?'bg-yellow-900/40 text-yellow-300':'bg-yellow-100 text-yellow-800'):(dm?'text-gray-500 hover:bg-gray-700/30':'text-gray-500 hover:bg-gray-50')}`}>
                                            <div className={`w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 ${watched?'bg-green-500 text-white':'border '+(dm?'border-gray-600':'border-gray-300')}`}>
                                              {watched&&<CheckIcon className="w-2 h-2"/>}
                                            </div>
                                            <span className="text-[11px] truncate leading-tight">{cleanAulaTitle(aula.title)}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                  {/* Categoria: Bônus */}
                                  {bonus.length>0&&(
                                    <div>
                                      <button onClick={()=>setTopicCat(subject,topic,'bonus')}
                                        className={`w-full text-left px-3 py-1 pl-8 text-[10px] font-bold uppercase tracking-wider transition-colors ${effSubject===subject&&effTopic===topic&&effCat==='bonus'?(dm?'text-yellow-400 bg-yellow-900/30':'text-yellow-700 bg-yellow-50'):(dm?'text-gray-500 hover:bg-gray-700/30':'text-gray-400 hover:bg-gray-50')}`}>
                                        ⭐ Bônus ({bonus.length})
                                      </button>
                                      {effSubject===subject&&effTopic===topic&&effCat==='bonus'&&bonus.map((aula,ai)=>{
                                        const isAct=getAulaId(effAula)===getAulaId(aula);
                                        const watched=watchedAulas[getAulaId(aula)];
                                        return (
                                          <button key={getAulaId(aula)||ai} onClick={()=>setActiveAulaAndReset(aula)}
                                            className={`w-full flex items-center gap-2 px-3 py-1.5 pl-10 text-left transition-colors ${isAct?(dm?'bg-yellow-900/40 text-yellow-300':'bg-yellow-100 text-yellow-800'):(dm?'text-gray-500 hover:bg-gray-700/30':'text-gray-500 hover:bg-gray-50')}`}>
                                            <div className={`w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 ${watched?'bg-green-500 text-white':'border '+(dm?'border-gray-600':'border-gray-300')}`}>
                                              {watched&&<CheckIcon className="w-2 h-2"/>}
                                            </div>
                                            <span className="text-[11px] truncate leading-tight">{cleanAulaTitle(aula.title)}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ══ MAIN ══ */}
              <div className="flex-1 overflow-y-auto" style={{height:'calc(100vh - 62px)'}}>
                {/* Mobile back bar */}
                <div className={`flex items-center gap-2 px-3 py-2.5 md:hidden border-b flex-shrink-0 ${sideBorder} ${dm?'bg-gray-800':'bg-white'}`}>
                  <button onClick={()=>setView('library')} className={`p-1.5 rounded-lg ${dm?'bg-gray-700 text-gray-300':'bg-gray-100 text-gray-600'}`}><ArrowLeft className="w-4 h-4"/></button>
                  <span className="text-sm font-bold text-yellow-600 flex-1 truncate">
                    {effAula ? cleanAulaTitle(effAula.title) : 'Videoaulas'}
                  </span>
                  {effAula&&<span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${dm?'bg-gray-700 text-gray-400':'bg-gray-100 text-gray-500'}`}>{effIdx+1}/{effAulas.length}</span>}
                </div>

                {!effAula ? (
                  <div className="flex flex-col items-center justify-center h-64 opacity-30">
                    <VideoIcon className="w-12 h-12 mb-3 text-gray-400"/>
                    <p className="font-serif font-bold text-gray-400">Selecione uma aula</p>
                  </div>
                ) : (
                  <div>
                    {/* Player */}
                    <div className="relative w-full bg-black" style={{aspectRatio:'16/9',maxHeight:'70vh'}}>
                      {isDemo ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{background:'#0d0d0d'}}>
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border-2 ${dm?'border-yellow-600 bg-yellow-900/30':'border-yellow-500 bg-yellow-50'}`}>
                            <PlayIcon className="w-7 h-7 text-yellow-500 ml-0.5"/>
                          </div>
                          <p className="text-white font-bold text-lg px-4 text-center">{cleanAulaTitle(effAula.title)}</p>
                          <p className="text-gray-500 text-sm mt-1">Player Bunny Stream</p>
                          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-10" style={{background:'linear-gradient(transparent,rgba(0,0,0,0.88))'}}>
                            <div className="mb-2"><div className="h-1 bg-gray-600/60 rounded-full"><div className="h-full bg-yellow-500 rounded-full" style={{width:'34%'}}/></div></div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <button className="text-white/70"><SkipBack className="w-4 h-4"/></button>
                                <button className="text-white/70"><PlayIcon className="w-5 h-5"/></button>
                                <button className="text-white/70"><SkipForward className="w-4 h-4"/></button>
                                <span className="text-xs text-gray-400 font-mono">14:22 / 42:00</span>
                              </div>
                              <div className="relative group">
                                <button className="text-xs text-white bg-white/15 px-2.5 py-1 rounded font-bold">1x</button>
                                <div className="absolute bottom-9 right-0 bg-gray-900/95 border border-gray-700 rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto shadow-xl z-20" style={{minWidth:'72px'}}>
                                  {['0.5','0.75','1','1.25','1.5','2'].map(s=>(
                                    <div key={s} className={`px-4 py-2 text-xs cursor-pointer hover:bg-white/10 text-center font-medium ${s==='1'?'text-yellow-400 font-bold':'text-gray-200'}`}>{s}x</div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : effAula?.embed_url ? (
                        <iframe
                          ref={videoFrameRef}
                          key={`${getAulaId(effAula)||effAula.embed_url}-${videoSeek??44}`}
                          src={`${effAula.embed_url}${effAula.embed_url.includes('?')?'&':'?'}t=${videoSeek??44}`}
                          className="absolute inset-0 w-full h-full"
                          id="bunny-player"
                          style={{border:'none'}}
                          allow="accelerometer;gyroscope;encrypted-media;picture-in-picture;fullscreen"
                          allowFullScreen
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-white opacity-40 text-sm">Vídeo não disponível</p>
                        </div>
                      )}
                    </div>

                    <div className={`${dm?'bg-gray-900':'bg-white'}`}>
                      {/* MOBILE: Navegação anterior/próxima */}
                      <div className={`flex items-center gap-2 px-3 py-2 md:hidden border-b ${sideBorder}`}>
                        <button onClick={()=>prevAula&&setActiveAulaAndReset(prevAula)} disabled={!prevAula}
                          className={`flex items-center gap-2 flex-1 min-w-0 px-3 py-3 rounded-xl border font-bold text-xs transition-colors disabled:opacity-25 ${dm?'border-gray-700 text-gray-300 active:bg-gray-700':'border-gray-200 text-gray-700 active:bg-gray-100'}`}>
                          <SkipBack className="w-4 h-4 flex-shrink-0"/>
                          <div className="min-w-0 text-left">
                            <p className="text-[9px] uppercase opacity-40 font-bold leading-none mb-0.5">Anterior</p>
                            <p className="truncate">{prevAula?cleanAulaTitle(prevAula.title):'—'}</p>
                          </div>
                        </button>
                        <button onClick={()=>nextAula&&setActiveAulaAndReset(nextAula)} disabled={!nextAula}
                          className={`flex items-center gap-2 flex-1 min-w-0 px-3 py-3 rounded-xl border font-bold text-xs transition-colors disabled:opacity-25 justify-end text-right ${dm?'border-gray-700 text-gray-300 active:bg-gray-700':'border-gray-200 text-gray-700 active:bg-gray-100'}`}>
                          <div className="min-w-0 text-right">
                            <p className="text-[9px] uppercase opacity-40 font-bold leading-none mb-0.5">Próxima</p>
                            <p className="truncate">{nextAula?cleanAulaTitle(nextAula.title):'—'}</p>
                          </div>
                          <SkipForward className="w-4 h-4 flex-shrink-0"/>
                        </button>
                      </div>

                      {/* MOBILE: Tópico atual clicável + botões de ação */}
                      <div className={`md:hidden border-b ${sideBorder} px-3 py-3 space-y-2`}>
                        {/* Nome do assunto/tópico — toca pra trocar */}
                        <button onClick={()=>setMobileNavOpen(true)}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-left ${dm?'bg-gray-800 text-gray-300':'bg-gray-100 text-gray-600'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/></svg>
                          <span className="flex-1 truncate">{effSubject} — {shortTopicName(effTopic||'')} {effCat==='bonus'?'⭐':''}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-40 flex-shrink-0"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>

                        {/* Botões principais em linha — grandes e bem espaçados */}
                        <div className="flex gap-2">
                          {/* Questões + config */}
                          <div className={`flex flex-1 rounded-xl overflow-hidden border ${aulaHasVqData(effAula)?(dm?'border-green-700':'border-green-500'):(dm?'border-yellow-700':'border-yellow-500')}`}>
                            <button
                              onClick={()=>{
                                if(aulaHasVqData(effAula)){
                                  setVqSubject(effSubject);setVqTopic(effTopic);setVqAula(effAula);setVqActiveBlock(null);setVqActiveBlockView(null);setView('videoquestions');
                                } else {
                                  gerarQuestoesDireto(effAula, effSubject, effTopic);
                                }
                              }}
                              className={`flex items-center justify-center gap-2 flex-1 py-3.5 font-bold text-sm transition-all ${aulaHasVqData(effAula)?(dm?'bg-green-900/20 text-green-400 active:bg-green-900/40':'bg-green-50 text-green-700 active:bg-green-100'):(dm?'bg-yellow-900/20 text-yellow-400 active:bg-yellow-900/40':'bg-yellow-50 text-yellow-700 active:bg-yellow-100')}`}>
                              <GraduationCap className="w-4 h-4"/>
                              {aulaHasVqData(effAula)?'Ver Questões':'Gerar Questões'}
                            </button>
                            {!aulaHasVqData(effAula)&&(
                              <button
                                onClick={()=>setVqGenModal({aula:effAula,aulaId:aulaDocId(effAula),suggestedQ:10,subject:effSubject,topic:effTopic,fromConfig:true})}
                                className={`flex items-center justify-center px-3.5 border-l transition-all ${dm?'border-yellow-700/50 text-yellow-600 active:bg-yellow-900/30':'border-yellow-300 text-yellow-600 active:bg-yellow-50'}`}>
                                <SettingsIcon className="w-4 h-4"/>
                              </button>
                            )}
                          </div>

                          {/* Marcar assistida */}
                          <button onClick={()=>!isDemo&&markAulaWatched(getAulaId(effAula), effAula)}
                            className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold text-sm flex-shrink-0 transition-all ${watchedAulas[getAulaId(effAula)]?'bg-green-500 text-white active:bg-green-600':('border '+(dm?'border-gray-600 text-gray-300 active:bg-gray-700':'border-gray-200 text-gray-600 active:bg-gray-100'))}`}>
                            <CheckIcon className="w-4 h-4"/>
                            {watchedAulas[getAulaId(effAula)]?'✓':'Assistida'}
                          </button>
                        </div>
                      </div>

                      {/* MOBILE: scrollable aula list */}
                      <div className={`md:hidden border-b ${sideBorder} overflow-y-auto`} style={{maxHeight:'38vh'}}>
                        <div className={`px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider sticky top-0 ${dm?'bg-gray-900 text-gray-500':'bg-white text-gray-400'}`}>
                          {shortTopicName(effTopic||'')} {effCat==='bonus'?'— Bônus':'— Aulas'}
                        </div>
                        {effAulas.map((aula)=>{
                          const id = getAulaId(aula);
                          const isAct = id===getAulaId(effAula);
                          const watched = watchedAulas[id];
                          return (
                            <button key={id||aula.path} onClick={()=>setActiveAulaAndReset(aula)}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b transition-colors ${isAct?(dm?'bg-yellow-900/25':'bg-yellow-50'):(dm?'hover:bg-gray-800':'hover:bg-gray-50')} ${dm?'border-gray-700/40':'border-gray-100'}`}>
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${watched?'bg-green-500 text-white':(isAct?'bg-yellow-500 text-white':'border '+(dm?'border-gray-600':'border-gray-300'))}`}>
                                {watched?<CheckIcon className="w-3 h-3"/>:isAct?<PlayIcon className="w-2.5 h-2.5" style={{marginLeft:'1px'}}/>:null}
                              </div>
                              <span className={`text-sm truncate ${isAct?'font-semibold '+(dm?'text-yellow-300':'text-yellow-700'):(watched?'text-gray-400':(dm?'text-gray-300':'text-gray-700'))}`}>
                                {cleanAulaTitle(aula.title)}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* MOBILE BOTTOM SHEET: 3 níveis */}
                      {mobileNavOpen&&(
                        <div className="fixed inset-0 z-[300] md:hidden" onClick={()=>setMobileNavOpen(false)}>
                          <div className="absolute inset-0 bg-black bg-opacity-80"/>
                          <div className={`absolute bottom-0 left-0 right-0 rounded-t-2xl overflow-hidden ${dm?'bg-gray-800':'bg-white'}`}
                            onClick={e=>e.stopPropagation()}>
                            <div className="flex justify-center pt-3 pb-1">
                              <div className={`w-10 h-1 rounded-full ${dm?'bg-gray-600':'bg-gray-300'}`}/>
                            </div>
                            <div className={`flex items-center justify-between px-4 py-3 border-b ${dm?'border-gray-700':'border-gray-100'}`}>
                              <span className="font-bold text-sm text-yellow-600">Navegar</span>
                              <button type="button" aria-label="Fechar lista de aulas" onClick={()=>setMobileNavOpen(false)} className={`text-lg leading-none font-bold ${dm?'text-gray-400':'text-gray-400'}`}>✕</button>
                            </div>
                            <div className="overflow-y-auto" style={{maxHeight:'65vh'}}>
                              {subjects.map(subj=>{
                                const sAulas=Object.values(data[subj]).flatMap(t=>[...t.main,...t.bonus]);
                                const sW=sAulas.filter(a=>watchedAulas[getAulaId(a)]).length;
                                const isExpS=expandedSubjectsVid[subj]??(subj===effSubject);
                                return (
                                  <div key={subj} className={`border-b ${dm?'border-gray-700/60':'border-gray-100'}`}>
                                    <button onClick={()=>setExpandedSubjectsVid(p=>({...p,[subj]:!isExpS}))}
                                      className={`w-full flex items-center justify-between px-4 py-3 text-left ${dm?'hover:bg-gray-700':'hover:bg-gray-50'}`}>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold truncate ${subj===effSubject?'text-yellow-500':''}`}>{subj}</p>
                                        <p className={`text-xs mt-0.5 ${dm?'text-gray-500':'text-gray-400'}`}>{sW}/{sAulas.length} assistidas</p>
                                      </div>
                                      <ChevronDown className={`w-4 h-4 opacity-30 ml-2 transition-transform ${isExpS?'':'rotate-180'}`}/>
                                    </button>
                                    {isExpS&&Object.entries(data[subj]).map(([topic,{main,bonus}])=>{
                                      const isActT=subj===effSubject&&topic===effTopic;
                                      const topicAulas=[...main,...bonus];
                                      const tW=topicAulas.filter(a=>watchedAulas[getAulaId(a)]).length;
                                      return (
                                        <div key={topic} className={`border-t ${dm?'border-gray-700/40':'border-gray-50'}`}>
                                          <div className={`px-4 py-2 pl-7 text-xs font-bold ${isActT?(dm?'text-yellow-400':'text-yellow-700'):(dm?'text-gray-400':'text-gray-500')}`}>
                                            {shortTopicName(topic)} <span className="opacity-40 font-normal">({tW}/{topicAulas.length})</span>
                                          </div>
                                          {main.length>0&&(
                                            <button onClick={()=>{setTopicCat(subj,topic,'main');setMobileNavOpen(false);}}
                                              className={`w-full flex items-center justify-between px-4 py-2 pl-10 text-left ${isActT&&effCat==='main'?(dm?'bg-yellow-900/30 text-yellow-400':'bg-yellow-50 text-yellow-700'):(dm?'text-gray-400 hover:bg-gray-700':'text-gray-500 hover:bg-gray-50')}`}>
                                              <span className="text-xs">📖 Aulas ({main.length})</span>
                                            </button>
                                          )}
                                          {bonus.length>0&&(
                                            <button onClick={()=>{setTopicCat(subj,topic,'bonus');setMobileNavOpen(false);}}
                                              className={`w-full flex items-center justify-between px-4 py-2 pl-10 text-left ${isActT&&effCat==='bonus'?(dm?'bg-yellow-900/30 text-yellow-400':'bg-yellow-50 text-yellow-700'):(dm?'text-gray-400 hover:bg-gray-700':'text-gray-500 hover:bg-gray-50')}`}>
                                              <span className="text-xs">⭐ Bônus ({bonus.length})</span>
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* DESKTOP info block */}
                      <div className="hidden md:block px-6 lg:px-8 py-4">
                        <p className={`text-xs mb-2 flex items-center gap-1 flex-wrap ${textMuted}`}>
                          <span>{effSubject}</span>
                          <ChevronRight className="w-3 h-3 opacity-40"/>
                          <span>{shortTopicName(effTopic||'')} {effCat==='bonus'?'⭐':''}</span>
                          <ChevronRight className="w-3 h-3 opacity-40"/>
                          <span className={dm?'text-gray-200':'text-gray-700'}>{cleanAulaTitle(effAula.title)}</span>
                        </p>
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <h2 className={`text-xl font-serif font-bold truncate ${dm?'text-white':'text-gray-900'}`}>{cleanAulaTitle(effAula.title)}</h2>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {effAula.duration_formatted&&(
                              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${dm?'bg-gray-700 text-gray-400':'bg-gray-100 text-gray-500'}`}>⏱ {effAula.duration_formatted}</span>
                            )}
                            <button onClick={()=>{
                              if(aulaHasVqData(effAula)){
                                setVqSubject(effSubject);setVqTopic(effTopic);setVqAula(effAula);setVqActiveBlock(null);setVqActiveBlockView(null);setView('videoquestions');
                              } else {
                                gerarQuestoesDireto(effAula, effSubject, effTopic);
                              }
                            }} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm transition-all border ${aulaHasVqData(effAula)?(dm?'border-green-700 text-green-400 hover:bg-green-900/20':'border-green-500 text-green-700 hover:bg-green-50'):(dm?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50')}`}>
                              <GraduationCap className="w-4 h-4"/>{aulaHasVqData(effAula)?'Ver Questões':'Questões'}
                            </button>
                            {!aulaHasVqData(effAula)&&(
                              <button onClick={()=>setVqGenModal({aula:effAula,aulaId:aulaDocId(effAula),suggestedQ:10,subject:effSubject,topic:effTopic,fromConfig:true})}
                                title="Configurações das questões"
                                className={`p-2 rounded-xl border transition-all ${dm?'border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-gray-200':'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}>
                                <SettingsIcon className="w-4 h-4"/>
                              </button>
                            )}
                            <button onClick={async()=>{
                              try {
                                const docId=(effAula.title||'').replace(/\//g,'-');
                                const snap=await getDoc(doc(db,'lessons',docId));
                                const transcript=snap.exists()?snap.data().transcript:'';
                                if(!transcript){addToast('Transcrição não disponível para esta aula.', 'info', 3500);return;}
                                const blob=new Blob([`${effAula.title}\n${'='.repeat(effAula.title.length)}\n\n${transcript}`],{type:'text/plain;charset=utf-8'});
                                const a=document.createElement('a');a.href=URL.createObjectURL(blob);
                                a.download=`${effAula.title.substring(0,60).replace(/[^a-zA-Z0-9\s\-]/g,'')}.txt`;a.click();
                                addToast('Transcrição exportada.', 'success', 2500);
                              } catch(e){addToast('Erro ao exportar transcrição.', 'error', 3500);}
                            }} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm transition-all border ${dm?'border-gray-600 text-gray-400 hover:bg-gray-700':'border-gray-200 text-gray-500 hover:bg-gray-50'}`} title="Exportar transcrição">
                              <DownloadIcon className="w-4 h-4"/>
                            </button>
                            <button onClick={()=>!isDemo&&markAulaWatched(getAulaId(effAula), effAula)}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm flex-shrink-0 transition-all ${watchedAulas[getAulaId(effAula)]?'bg-green-500 text-white':('border '+(dm?'border-green-700 text-green-400 hover:bg-green-900/20':'border-green-400 text-green-700 hover:bg-green-50'))}`}>
                              <CheckIcon className="w-4 h-4"/>
                              {watchedAulas[getAulaId(effAula)]?'Assistida':'Marcar assistida'}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-stretch gap-3">
                          <button onClick={()=>prevAula&&setActiveAulaAndReset(prevAula)} disabled={!prevAula}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold flex-1 border transition-colors disabled:opacity-30 ${dm?'border-gray-700 hover:bg-gray-800 text-gray-300':'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                            <SkipBack className="w-4 h-4 flex-shrink-0"/>
                            <div className="text-left min-w-0">
                              <p className="text-[10px] opacity-40 uppercase font-bold leading-none mb-0.5">Anterior</p>
                              <p className="truncate text-xs">{cleanAulaTitle(prevAula?.title||'—')}</p>
                            </div>
                          </button>
                          <div className={`flex items-center px-3 rounded-xl text-xs font-bold flex-shrink-0 ${dm?'bg-gray-800 text-gray-500':'bg-gray-100 text-gray-400'}`}>{effIdx+1}/{effAulas.length}</div>
                          <button onClick={()=>nextAula&&setActiveAulaAndReset(nextAula)} disabled={!nextAula}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold flex-1 border transition-colors disabled:opacity-30 justify-end text-right ${dm?'border-gray-700 hover:bg-gray-800 text-gray-300':'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                            <div className="min-w-0">
                              <p className="text-[10px] opacity-40 uppercase font-bold leading-none mb-0.5">Próxima</p>
                              <p className="truncate text-xs">{cleanAulaTitle(nextAula?.title||'—')}</p>
                            </div>
                            <SkipForward className="w-4 h-4 flex-shrink-0"/>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
        {/* ── QUESTÕES DO CURSO ── */}
        {view==='videoquestions'&&canSeeVideoaulas&&(()=>{
          const dm = darkMode;
          const data     = parseVideoaulasData(videoaulasData || {});
          const subjects = sortSubjects(Object.keys(data));

          // Count total questions for an aula
          const aulaQCount = (aula) => {
            const id = aulaVqKey(aula);
            const d = vqBlocks[id];
            if(!d?.blocks) return 0;
            return blockValues(d.blocks).reduce((acc,b)=>acc+(b.questions?.length||0),0);
          };

          // DETAIL VIEW: aula selecionada — mostra blocos
          if(vqAula && vqSubject && vqTopic) {
            const aulaId    = aulaVqKey(vqAula);
            const aulaIdNew = aulaDocId(vqAula);
            const aulaData  = vqBlocks[aulaId] || {};
            // blocks pode vir como array do Firestore em edge cases — normalizar para objeto
            const rawBlocks = aulaData.blocks || {};
            const blocks    = Array.isArray(rawBlocks) ? {} : rawBlocks;
            const meta      = aulaData.meta || {};
            const blockList = Object.entries(blocks).sort((a,b)=>a[0].localeCompare(b[0]));
            const hasSetup  = aulaHasVqData(vqAula); // usa busca em todos os formatos de chave
            const durationSecs = vqAula.duration_seconds || 0;
            const suggestedQ   = durationSecs > 0 ? Math.ceil(durationSecs/90) : 10;

            // ── VIEW COMPLETA DE UM BLOCO ── usa o mesmo QuestionView do topic
            if(vqActiveBlockView) {
              const { blockId } = vqActiveBlockView;
              const block = blocks[blockId] || {};
              const qs      = Array.isArray(block.questions) ? block.questions : [];
	              const ans     = (block.answers && typeof block.answers==='object' && !Array.isArray(block.answers)) ? block.answers : {};
	              const blockFavs = Array.isArray(block.favorites) ? block.favorites : [];
	              const blockNotebook = Array.isArray(block.errorNotebook) ? block.errorNotebook : [];

  const handleVqAnswer = async (qId, letter) => {
    trackQuestionAnswered(`curso:${aulaIdNew}:${blockId}:${qId}`);
    const q = qs.find(x => x.id === qId);
	                const nextNotebook = canUseAdvancedFeatures && !isAnswerCorrect(q, letter) ? addToList(blockNotebook, qId) : blockNotebook;
	                await saveVqBlock(aulaIdNew, {...aulaData, blocks:{...blocks,[blockId]:{...block,answers:{...ans,[qId]:letter},errorNotebook:nextNotebook}}});
	              };
	              const handleVqFavorite = async (qId) => {
	                const nf = toggleInList(blockFavs, qId);
	                await saveVqBlock(aulaIdNew, {...aulaData, blocks:{...blocks,[blockId]:{...block,favorites:nf}}});
	              };
	              const handleVqNotebook = async (qId) => {
	                if (!canUseAdvancedFeatures) return;
	                await saveVqBlock(aulaIdNew, {...aulaData, blocks:{...blocks,[blockId]:{...block,errorNotebook:toggleInList(blockNotebook,qId)}}});
	              };
              const handleVqReset = async () => {
                await saveVqBlock(aulaIdNew, {...aulaData, blocks:{...blocks,[blockId]:{...block,answers:{}}}});
              };

              return (
                <div className="max-w-3xl mx-auto">
                  <QuestionView
                    title={block.title||`Bloco ${blockId.replace('block','')}`}
                    onBack={()=>setVqActiveBlockView(null)}
                    backLabel={vqAula.title}
                    questions={qs}
                    answers={ans}
	                    favorites={blockFavs}
	                    onAnswer={handleVqAnswer}
	                    onToggleFavorite={handleVqFavorite}
	                    errorNotebook={blockNotebook}
	                    showErrorNotebook={canUseAdvancedFeatures}
	                    onToggleErrorNotebook={handleVqNotebook}
                    onReset={qs.length>0?handleVqReset:null}
                    onRegenerate={qs.length>0?()=>generateVqBlock(aulaIdNew,blockId):null}
                    onExport={qs.length>0?()=>setExportModal({topic:{title:`${vqAula.title} — ${block.title||`Bloco ${blockId.replace('block','')}`}`,questions:qs},subject:null}):null}
                    isGenerating={!!block.generating}
                    streamCount={streamCount}
                    showBizuario={qs.length>0}
                    onBizuario={()=>{
                      if(!checkKey()) return;
                      const syntheticTopic = {title: block.title||`Bloco ${blockId.replace('block','')}`, questions:qs, subtopics:block.subtopics||[]};
                      const cachedText = block.bizuario||null;
                      const onSave = async (txt) => {
                        await saveVqBlock(aulaIdNew, {...aulaData, blocks:{...blocks,[blockId]:{...block,bizuario:txt}}});
                      };
                      setBizuarioModal({topicTitle:syntheticTopic.title,subjectTitle:vqAula.title,questions:qs,subtopics:block.subtopics||[],cachedText,onSave});
                    }}
                    bizuarioCached={!!block.bizuario}
                    darkMode={darkMode}
                    apiKey={getKey()}
                    oracleLength={settings.oracleLength}
                    onCall={callWithRotation}
                    onOpenAnswer={q=>setOpenAnswerModal({question:q, isEssay:q.isEssay})}
	                    displayMode={canUseAdvancedFeatures ? (settings.questionDisplayMode || 'list') : 'list'}
	                    onAddToReview={(qs, ans)=>setSrModal({aulaId:aulaIdNew, blockId, blockTitle:block.title||`Bloco ${blockId.replace('block','')}`, questions:qs, answers:ans, notebookIds:blockNotebook, meta:{source:'curso',aulaTitle:vqAula.title,blockTitle:block.title||`Bloco ${blockId.replace('block','')}`}})}
                    onReviewErrorNotebook={blockNotebook.length ? (()=>openErrorReviewModal({
                      subject:{id:aulaIdNew, title:vqAula.title, source:'curso'},
                      topic:{id:blockId, title:block.title||`Bloco ${blockId.replace('block','')}`},
                      questions:qs,
                      notebookIds:blockNotebook,
                      sourceLabel:'Curso',
                    })) : null}
                    inReviewCount={Object.keys(reviewQueue[aulaIdNew]?.[blockId]||{}).length}
                    onGoToAula={()=>{setVqActiveBlockView(null); setView('videoaulas'); setActiveSubjectVid(vqSubject); setActiveSubtopicVid(`${vqTopic}::main`); setActiveAulaAndReset(vqAula);}}
                    generateLabel="Gerar Questões"
                    onGenerate={()=>generateVqBlock(aulaIdNew,blockId)}
                    subtopics={block.subtopics||[]}
                  />
                </div>
              );
            }

            if (reviewListMode) {
              return (
                <div className="max-w-3xl mx-auto">
                  <button onClick={()=>setReviewSession(null)} className={`flex items-center gap-2 mb-4 font-bold ${dm?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/>Sair</button>
                  <div className={`mb-5 flex items-center gap-3 rounded-xl px-4 py-3 ${dm?'bg-gray-900':'bg-gray-50'}`}>
                    <div className={`flex-1 h-2 rounded-full overflow-hidden ${dm?'bg-gray-800':'bg-gray-200'}`}><div className="h-full bg-yellow-500 rounded-full transition-all" style={{width:`${done/total*100}%`}}/></div>
                    <span className={`text-xs font-bold ${dm?'text-gray-400':'text-gray-500'}`}>{done}/{total}</span>
                  </div>
                  {sessionItems.map((item, i)=>(
                    <QuestionCard
                      key={`${item.blockId}-${item.qId}`}
                      question={item.question}
                      index={i}
                      selectedLetter={sessionAnswers[item.qId]}
                      onAnswer={async (letter)=>{
                        const correct = isAnswerCorrect(item.question, letter);
                        trackQuestionAnswered(`review:${item.aulaId}:${item.blockId}:${item.qId}:${item.item?.dueDate||getTodayKey()}`);
                        setReviewSession(p=>({...p, sessionAnswers:{...(p?.sessionAnswers||{}), [item.qId]:letter}, sessionResults:{...(p?.sessionResults||{}), [item.qId]:correct}}));
                        if (!correct) setReviewNotebook(item, 'add');
                        await updateReviewItem(item.aulaId, item.blockId, item.qId, correct);
                      }}
                      darkMode={dm}
                      isFavorite={isReviewItemFavorite(item)}
                      onToggleFavorite={()=>toggleReviewFavorite(item)}
                      showErrorNotebook={false}
                      apiKey={getKey()}
                      oracleLength={settings.oracleLength}
                      onCall={callWithRotation}
                    />
                  ))}
                </div>
              );
            }

            // ── LISTA DE BLOCOS DA AULA ──
            return (
              <div className="max-w-3xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-6 text-sm flex-wrap">
                  <button onClick={()=>{setVqAula(null);setVqActiveBlockView(null);}}
                    className={`font-bold flex items-center gap-1 ${dm?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}>
                    <ArrowLeft className="w-4 h-4"/>{vqSubject}
                  </button>
                  <span className="opacity-30">/</span>
                  <span className="opacity-50 text-xs truncate max-w-[140px]">{shortTopicName(vqTopic)}</span>
                  <span className="opacity-30">/</span>
                  <span className={`font-bold truncate max-w-[180px] ${dm?'text-yellow-400':'text-yellow-700'}`}>{vqAula.title}</span>
                </div>

                <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 pb-6 border-b ${dm?'border-gray-700':'border-gray-200'}`}>
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-yellow-600">{vqAula.title}</h2>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {vqAula.duration_formatted&&<p className="text-sm opacity-50">⏱ {vqAula.duration_formatted}</p>}
                      {/* Progresso dos blocos */}
                      {blockList.length>0&&(()=>{
                        const done = blockList.filter(([,b])=>{
                          const qs = Array.isArray(b.questions)?b.questions:[];
                          const ans = (b.answers&&typeof b.answers==='object'&&!Array.isArray(b.answers))?b.answers:{};
                          return qs.length>0 && Object.keys(ans).length===qs.length;
                        }).length;
                        return (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${done===blockList.length?(dm?'bg-green-900/40 text-green-400':'bg-green-100 text-green-700'):(dm?'bg-gray-700 text-gray-300':'bg-gray-100 text-gray-600')}`}>
                            {done}/{blockList.length} blocos concluídos
                          </span>
                        );
                      })()}</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {hasSetup&&(
                      <button onClick={()=>setVqGenModal({aula:vqAula,aulaId:aulaIdNew,suggestedQ,reset:true})}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold border ${dm?'border-gray-600 text-gray-300 hover:bg-gray-700':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <RotateCcw className="w-4 h-4"/>Regenerar
                      </button>
                    )}
                    {!hasSetup&&(
                      <button onClick={()=>setVqGenModal({aula:vqAula,aulaId:aulaIdNew,suggestedQ})}
                        className="flex items-center gap-2 px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold text-sm">
                        <Sparkles className="w-4 h-4"/>Gerar Questões
                      </button>
                    )}
                  </div>
                </div>

                {/* Vazio */}
                {!hasSetup&&blockList.length===0&&(
                  <EmptyState
                    darkMode={dm}
                    icon={<GraduationCap className="w-7 h-7"/>}
                    title="Nenhuma questão ainda"
                    message="Clique em Gerar Questões para o Oráculo criar uma bateria baseada nesta aula."
                    action={
                      <button onClick={()=>setVqGenModal({aula:vqAula,aulaId:aulaIdNew,suggestedQ})}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold">
                        <Sparkles className="w-5 h-5"/>Gerar Questões
                      </button>
                    }
                  />
                )}

                {/* Cards de bloco */}
                {blockList.length>0&&(
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase opacity-40 mb-1">{blockList.length} bloco(s) · {aulaQCount(vqAula)} questões</p>
                    {blockList.map(([blockId, block])=>{
                      const qs  = Array.isArray(block.questions) ? block.questions : [];
                      const ans = (block.answers && typeof block.answers==='object' && !Array.isArray(block.answers)) ? block.answers : {};
                      const answered = Object.keys(ans).length;
                      const correct = qs.filter(q=>ans[q.id]===q.options?.find(o=>o.isCorrect)?.letter).length;
                      const pct = answered>0?Math.round(correct/answered*100):null;
                      const allDone = qs.length>0&&answered===qs.length;
                      const hasQs = qs.length>0;
                      const blockNum = blockId.replace('block','');
                      const blockTitle = block.title||`Bloco ${blockNum}`;
                      const openBlockBizuario = () => {
                        if(!checkKey() || !hasQs) return;
                        const syntheticTopic = {title:blockTitle, questions:qs, subtopics:block.subtopics||[]};
                        const cachedText = block.bizuario||null;
                        const onSave = async (txt) => {
                          await saveVqBlock(aulaIdNew, {...aulaData, blocks:{...blocks,[blockId]:{...block,bizuario:txt}}});
                        };
                        setBizuarioModal({topicTitle:syntheticTopic.title,subjectTitle:vqAula.title,questions:qs,subtopics:block.subtopics||[],cachedText,onSave});
                      };
                      const cardActions = hasQs ? [
                        {label:'Assistir aula', icon:<VideoIcon className="w-4 h-4"/>, fn:()=>{setView('videoaulas'); setActiveSubjectVid(vqSubject); setActiveSubtopicVid(`${vqTopic}::main`); setActiveAulaAndReset(vqAula);}},
                        {label:'Exportar', icon:<Printer className="w-4 h-4"/>, fn:()=>setExportModal({topic:{title:`${vqAula.title} — ${blockTitle}`,questions:qs},subject:null})},
                        {label:block.bizuario?'Bizuário ✓':'Bizuário', icon:<BrainIcon className="w-4 h-4"/>, fn:openBlockBizuario, active:!!block.bizuario},
                        {label:Object.keys(reviewQueue[aulaIdNew]?.[blockId]||{}).length>0?`Gerenciar revisão (${Object.keys(reviewQueue[aulaIdNew]?.[blockId]||{}).length})`:'Revisão Espaçada', icon:<RepeatIcon className="w-4 h-4"/>, fn:()=>setSrModal({aulaId:aulaIdNew, blockId, blockTitle, questions:qs, answers:ans, notebookIds:Array.isArray(block.errorNotebook)?block.errorNotebook:[], meta:{source:'curso',aulaTitle:vqAula.title,blockTitle}})},
                        {label:'Recriar', icon:<RotateCcw className="w-4 h-4"/>, fn:()=>generateVqBlock(aulaIdNew,blockId)},
                        {label:'Limpar respostas', icon:<Eraser className="w-4 h-4"/>, fn:()=>saveVqBlock(aulaIdNew, {...aulaData, blocks:{...blocks,[blockId]:{...block,answers:{}}}}), danger:true},
                      ] : [];

                      return (
                        <div key={blockId} className={`relative rounded-2xl border overflow-visible transition-all ${dm?'bg-gray-800 border-gray-700 hover:border-gray-600':'bg-white border-gray-200 hover:border-gray-300'}`}>
                          <button
                            onClick={()=>{
                              if(hasQs) setVqActiveBlockView({blockId,showWrong:false});
                              else generateVqBlock(aulaIdNew,blockId);
                            }}
                            disabled={block.generating}
                            className="w-full p-5 flex items-center gap-4 text-left">
                            {/* Número / progresso — verde SÓ quando tudo respondido */}
                            <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center font-bold font-serif text-lg ${allDone?'bg-green-500 text-white':hasQs?(dm?'bg-yellow-900/40 text-yellow-400':'bg-yellow-100 text-yellow-700'):(dm?'bg-gray-700 text-gray-400':'bg-gray-100 text-gray-500')}`}>
                              {allDone?<CheckIcon className="w-6 h-6"/>:blockNum}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold truncate pr-9">{blockTitle}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {block.generating?(
                                  <span className="text-xs text-yellow-600 font-bold animate-pulse flex items-center gap-1">
                                    <Spinner className="w-3 h-3"/>Gerando{streamCount>0?` (${streamCount} questões)`:'...'}
                                  </span>
                                ):hasQs?(
                                  <>
                                    <div className={`h-1.5 rounded-full overflow-hidden flex-1 max-w-24 ${dm?'bg-gray-700':'bg-gray-100'}`}>
                                      <div className={`h-full rounded-full ${allDone?'bg-green-500':'bg-yellow-500'}`} style={{width:`${Math.round(answered/qs.length*100)}%`}}/>
                                    </div>
                                    <span className={`text-xs ${dm?'text-gray-500':'text-gray-400'}`}>{answered}/{qs.length} respondidas</span>
                                    {pct!==null&&<span className={`text-xs font-bold ml-1 ${pct>=70?'text-green-600':pct>=50?'text-yellow-600':'text-red-500'}`}>{pct}%</span>}
                                  </>
                                ):(
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dm?'bg-yellow-900/40 text-yellow-500':'bg-yellow-100 text-yellow-700'}`}>
                                    Toque para gerar
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 flex-shrink-0 ${dm?'text-gray-600':'text-gray-300'}`}/>
                          </button>
                          {cardActions.length>0&&(
                            <div className="absolute right-3 top-3">
                              <button
                                onClick={e=>{e.preventDefault();e.stopPropagation();setBlockActionMenu(blockActionMenu===blockId?null:blockId);}}
                                title="Ações do bloco"
                                aria-label="Ações do bloco"
                                className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-colors ${dm?'border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-yellow-400':'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-yellow-700'}`}>
                                <MoreIcon className="w-4 h-4"/>
                              </button>
                              {blockActionMenu===blockId&&(
                                <div className={`absolute right-0 top-10 z-40 w-56 rounded-xl border shadow-xl overflow-hidden ${dm?'bg-gray-900 border-gray-700':'bg-white border-gray-200'}`}>
                                  {cardActions.map(item=>(
                                    <button
                                      key={item.label}
                                      onClick={e=>{e.preventDefault();e.stopPropagation();setBlockActionMenu(null);item.fn();}}
                                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs font-bold transition-colors ${item.danger?(dm?'text-red-400 hover:bg-red-900/20':'text-red-600 hover:bg-red-50'):item.active?(dm?'text-green-400 hover:bg-gray-800':'text-green-700 hover:bg-gray-50'):(dm?'text-gray-300 hover:bg-gray-800':'text-gray-700 hover:bg-gray-50')}`}>
                                      {item.icon}{item.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // LIST VIEW: navegação por assunto → tópico → aula
          return (
            <div className="max-w-3xl mx-auto">
              <button onClick={()=>setView('curso')} className={`flex items-center gap-2 mb-6 font-bold ${dm?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/>Portal do Curso</button>
              <div className="flex items-center gap-3 mb-8">
                <GraduationCap className="w-8 h-8 text-yellow-600"/>
                <h2 className="text-3xl font-serif font-bold text-yellow-600">Questões do Curso</h2>
              </div>

              {vqLoading&&<div className="flex justify-center py-16"><Spinner className="w-10 h-10 text-yellow-600"/></div>}

              {!vqLoading&&subjects.length===0&&(
                <div className="text-center py-16 opacity-50">
                  <GraduationCap className="w-16 h-16 mx-auto mb-4"/>
                  <p className="font-bold text-lg">Nenhum conteúdo disponível</p>
                  <p className="text-sm mt-2">Acesse as Videoaulas para que o conteúdo apareça aqui.</p>
                </div>
              )}

              {!vqLoading&&subjects.map(subj=>{
                const isExp = vqExpandedSubj[subj]??true;
                const topics = data[subj]||{};
                // data[subj][topic] = { main:[], bonus:[] } — extrair aulas flat
                const allSubjAulas = Object.values(topics).flatMap(t=>[...(t.main||[]),...(t.bonus||[])]);
                const totalAulas = allSubjAulas.length;
                const totalQs = allSubjAulas.reduce((acc,a)=>acc+aulaQCount(a),0);
                return (
                  <div key={subj} className={`mb-3 rounded-2xl border overflow-hidden ${dm?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
                    {/* Assunto header */}
                    <button onClick={()=>setVqExpandedSubj(p=>({...p,[subj]:!isExp}))} className="w-full p-5 flex items-center justify-between text-left hover:opacity-80 transition-opacity">
                      <div className="flex items-center gap-3">
                        <FolderIcon className="w-5 h-5 text-yellow-600"/>
                        <div>
                          <p className="font-bold">{subj}</p>
                          <p className="text-xs opacity-40 mt-0.5">{totalAulas} aulas{totalQs>0?` • ${totalQs} questões`:''}</p>
                        </div>
                      </div>
                      {isExp?<ChevronDown className="w-4 h-4 opacity-30"/>:<ChevronRight className="w-4 h-4 opacity-30"/>}
                    </button>

                    {isExp&&Object.entries(topics).map(([topic, cats])=>{
                      const aulas = [...(cats.main||[]),...(cats.bonus||[])];
                      const tExp = vqExpandedTopic[`${subj}/${topic}`]??false;
                      const topicQs = aulas.reduce((acc,a)=>acc+aulaQCount(a),0);
                      return (
                        <div key={topic} className={`border-t ${dm?'border-gray-700':'border-gray-100'}`}>
                          {/* Tópico header */}
                          <button onClick={()=>setVqExpandedTopic(p=>({...p,[`${subj}/${topic}`]:!tExp}))} className={`w-full flex items-center justify-between px-5 py-3 text-left ${dm?'hover:bg-gray-700':'hover:bg-gray-50'}`}>
                            <div className="flex items-center gap-3">
                              <LayersIcon className="w-4 h-4 text-yellow-600 opacity-70"/>
                              <div>
                                <p className="text-sm font-bold">{shortTopicName(topic)}</p>
                                <p className="text-xs opacity-40">{aulas.length} aulas{topicQs>0?` • ${topicQs} questões`:''}</p>
                              </div>
                            </div>
                            {tExp?<ChevronDown className="w-3.5 h-3.5 opacity-30"/>:<ChevronRight className="w-3.5 h-3.5 opacity-30"/>}
                          </button>

                          {tExp&&aulas.map((aula,ai)=>{
                            const key = aulaVqKey(aula);
                            const d = vqBlocks[key];
                            const qTotal  = d?.blocks ? blockValues(d.blocks).reduce((a,b)=>a+b.questions.length,0) : 0;
                            const qAns    = d?.blocks ? blockValues(d.blocks).reduce((a,b)=>a+Object.keys(b.answers).length,0) : 0;
                            const allDoneAula = qTotal>0 && qAns===qTotal;
                            const hasSetup = aulaHasVqData(aula);
                            return (
                              <button key={ai}
                                onClick={()=>{setVqSubject(subj);setVqTopic(topic);setVqAula(aula);setVqActiveBlock(null);setVqActiveBlockView(null);}}
                                className={`w-full flex items-center justify-between px-5 py-3 border-t text-left transition-colors ${dm?'border-gray-700/50 hover:bg-gray-700':'border-gray-50 hover:bg-gray-50'}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${allDoneAula?'bg-green-500 text-white':hasSetup?(dm?'bg-yellow-900/40 text-yellow-400':'bg-yellow-100 text-yellow-700'):(dm?'bg-gray-700':'bg-gray-100')}`}>
                                    {allDoneAula?<CheckIcon className="w-4 h-4"/>:hasSetup?<span className="text-xs font-bold">{qAns}/{qTotal}</span>:<PlayIcon className="w-3 h-3 opacity-30" style={{marginLeft:'1px'}}/>}
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`text-sm font-medium truncate ${dm?'text-gray-200':'text-gray-800'}`}>{aula.title}</p>
                                    {aula.duration_formatted&&<p className="text-xs opacity-40">⏱ {aula.duration_formatted}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                  {hasSetup&&!allDoneAula&&<span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dm?'bg-yellow-900/40 text-yellow-400':'bg-yellow-100 text-yellow-700'}`}>{qTotal} questões</span>}
                                  {!hasSetup&&<span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dm?'bg-gray-700 text-gray-400':'bg-gray-100 text-gray-500'}`}>Gerar</span>}
                                  <ChevronRight className="w-3.5 h-3.5 opacity-30"/>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* ── EXAM SETUP MODAL ── */}
        {examSetup!==null&&(
          // Bug 4: backdrop click closes modal
          <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4" onClick={()=>{setExamSetup(null);setExamTopics([]);}}>
            <div className={`w-full max-w-2xl overflow-y-auto rounded-2xl border p-8 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}
              style={{maxHeight:'calc(100dvh - 6rem)'}}
              onClick={e=>e.stopPropagation()} // Bug 4: prevent backdrop close when clicking inside
            >
              <h2 className="text-2xl font-serif font-bold text-yellow-600 mb-6 flex items-center gap-3"><Zap className="w-7 h-7"/>Configurar Prova</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div><label className="block text-xs font-bold uppercase mb-2 opacity-50">Questões</label><input type="number" value={examQCount} onChange={e=>setExamQCount(parseInt(e.target.value)||10)} min="1" max="100" className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-700 border-gray-600 text-white':'bg-gray-50 border-gray-200'}`}/></div>
                <div><label className="block text-xs font-bold uppercase mb-2 opacity-50">Tempo</label><select value={examTime} onChange={e=>setExamTime(parseInt(e.target.value))} className={`w-full p-3 rounded-lg border outline-none ${darkMode?'bg-gray-700 border-gray-600 text-white':'bg-gray-50 border-gray-200'}`}>{[15,30,45,60,90,120].map(t=><option key={t} value={t}>{t} min</option>)}</select></div>
              </div>
              {/* Blind mode */}
              <div className={`flex items-center justify-between p-4 rounded-xl border mb-6 ${darkMode?'border-gray-700 bg-gray-700/50':'border-gray-200 bg-gray-50'}`}>
                <div>
                  <p className="font-bold text-sm">Modo Cego</p>
                  <p className="text-xs opacity-50 mt-0.5">Correções aparecem apenas ao finalizar. Permite alterar respostas.</p>
                </div>
                <button onClick={()=>setExamBlind(!examBlind)} className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${examBlind?'bg-yellow-500':'bg-gray-300 dark:bg-gray-600'}`}>
                  <span className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200" style={{left: examBlind ? '26px' : '4px'}}/>
                </button>
              </div>
              <label className="block text-xs font-bold uppercase mb-3 opacity-50">Conteúdo da prova ({examTopics.length} selecionados)</label>
              {(()=>{
                const subjectHasQuestions = (subject) => (subject.topics || []).some(t => (t.questions || []).length > 0);
                const topicCount = (topics = []) => topics.reduce((acc,t)=>acc+(t.questions?.length||0),0);
                const qLabel = (count) => `${count} ${count===1?'questão':'questões'}`;
                const subjectsWithQuestions = librarySubjects.filter(subjectHasQuestions);
                const sourceRoots = [
                  {source:'gemini', title:'Oráculo'},
                  {source:'external', title:'Externo'},
                  {source:'academia', title:'Academia'},
                ].map(root => {
                  const subjects = subjectsWithQuestions.filter(s=>s.source===root.source);
                  return {
                    ...root,
                    subjects,
                    count:topicCount(subjects.flatMap(s=>s.topics||[])),
                    directSubjects:subjects.filter(s=>!(s.folderId||null)),
                    folders:libraryFolders.filter(f=>f.source===root.source&&!(f.parentFolderId||null)),
                  };
                }).filter(root=>root.count>0);
                const isChecked = (key) => examTopics.some(x=>x.key===key);
                const toggleItem = (item) => setExamTopics(p=>p.some(x=>x.key===item.key)?p.filter(x=>x.key!==item.key):[...p,item]);
                const toggleFolderOpen = (key) => setExamOpenFolders(p=>({...p,[key]:!(p[key] ?? false)}));
                const toggleSubjectOpen = (key) => setExamOpenSubjects(p=>({...p,[key]:!p[key]}));
                const folderSubjects = (folderId, source) => subjectsWithQuestions.filter(s=>s.source===source&&(s.folderId||null)===(folderId||null));
                const childFolders = (folderId, source) => libraryFolders.filter(f=>f.source===source&&(f.parentFolderId||null)===(folderId||null));
                const folderQuestionCount = (folder) => topicCount(getSubjectsInFolderTree(folder).flatMap(s=>s.topics||[]));
                const CheckMark = ({checked}) => (
                  <span className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${checked?(darkMode?'bg-yellow-500 border-yellow-400 text-gray-950 shadow-sm shadow-yellow-900/40':'bg-yellow-500 border-yellow-500 text-white shadow-sm'):(darkMode?'border-gray-600 bg-gray-900 text-transparent':'border-gray-300 bg-white text-transparent')}`}>
                    <CheckIcon className="w-3.5 h-3.5"/>
                  </span>
                );
                const SelectButton = ({checked, onClick, title}) => (
                  <button type="button" onClick={e=>{e.stopPropagation();onClick();}} title={title} aria-pressed={checked} className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${checked?(darkMode?'bg-yellow-900/30':'bg-yellow-50'):(darkMode?'hover:bg-gray-700':'hover:bg-gray-100')}`}>
                    <CheckMark checked={checked}/>
                  </button>
                );
                const renderSubject = (subject, depth = 0) => {
                  const topics = (subject.topics || []).filter(t=>(t.questions||[]).length>0);
                  const subjectItem = {type:'subject', key:`subject-${subject.id}`, subject, count:topicCount(topics)};
                  const subjectChecked = isChecked(subjectItem.key);
                  const subjectOpen = !!examOpenSubjects[subjectItem.key];
                  const left = 34 + depth * 20;
                  return (
                    <div key={subject.id} className={`border-t ${darkMode?'border-gray-700 bg-gray-800/20':'border-gray-100 bg-white'}`}>
                      <div className={`flex items-center gap-2 py-2.5 pr-3 ${subjectChecked?(darkMode?'bg-yellow-900/10':'bg-yellow-50/70'):''}`} style={{paddingLeft:left}}>
                        <SelectButton checked={subjectChecked} onClick={()=>toggleItem(subjectItem)} title="Selecionar assunto inteiro"/>
                        <button onClick={()=>toggleSubjectOpen(subjectItem.key)} className="min-w-0 flex-1 flex items-center gap-2 text-left">
                          {subjectOpen?<ChevronDown className="w-4 h-4 opacity-40 flex-shrink-0"/>:<ChevronRight className="w-4 h-4 opacity-40 flex-shrink-0"/>}
                          <BlockIcon className="w-4 h-4 text-yellow-600 flex-shrink-0"/>
                          <span className="min-w-0">
                            <span className="block text-sm font-bold truncate">{subject.title}</span>
                            <span className="block text-xs opacity-40">{topics.length} tópico{topics.length!==1?'s':''} • {qLabel(subjectItem.count)}</span>
                          </span>
                        </button>
                      </div>
                      {subjectOpen&&<div className="pb-2">
                        {topics.map(topic=>{
                          const item = {type:'topic', key:`topic-${subject.id}-${topic.id}`, subject, topic, count:topic.questions.length};
                          const checked = isChecked(item.key);
                          return (
                            <button type="button" key={item.key} onClick={()=>toggleItem(item)} className={`mr-3 mb-1 flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-left ${checked?(darkMode?'bg-yellow-900/20 text-yellow-300':'bg-yellow-50 text-yellow-800'):(darkMode?'hover:bg-gray-700 text-gray-300':'hover:bg-gray-50 text-gray-700')}`} style={{marginLeft:left + 48, width:`calc(100% - ${left + 60}px)`}}>
                              <CheckMark checked={checked}/>
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate">{topic.title}</p>
                                <p className="text-xs opacity-40">{qLabel(item.count)}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>}
                    </div>
                  );
                };
                const renderFolder = (folder, depth = 0) => {
                  const folderItem = {type:'folder', key:`folder-${folder.id}`, folder, count:folderQuestionCount(folder)};
                  const folderChecked = isChecked(folderItem.key);
                  const folderOpen = examOpenFolders[folderItem.key] ?? false;
                  const directSubjects = folderSubjects(folder.id, folder.source);
                  const children = childFolders(folder.id, folder.source).filter(child => folderQuestionCount(child) > 0 || folderSubjects(child.id, child.source).length > 0 || childFolders(child.id, child.source).length > 0);
                  const left = 12 + depth * 20;
                      return (
                    <section key={folder.id} className={`border-t ${darkMode?'border-gray-700':'border-gray-100'}`}>
                          <div className={`flex items-center gap-2 px-3 py-2.5 ${folderChecked?(darkMode?'bg-yellow-900/10':'bg-yellow-50'):(darkMode?'bg-gray-900/30':'bg-gray-50')}`}>
                        <div className="flex items-center gap-2 min-w-0 flex-1" style={{paddingLeft:left}}>
                          <SelectButton checked={folderChecked} onClick={()=>toggleItem(folderItem)} title="Selecionar toda a pasta"/>
                          <button onClick={()=>toggleFolderOpen(folderItem.key)} className="min-w-0 flex-1 flex items-center gap-2 text-left">
                              {folderOpen?<ChevronDown className="w-4 h-4 opacity-40 flex-shrink-0"/>:<ChevronRight className="w-4 h-4 opacity-40 flex-shrink-0"/>}
                              <FolderIcon className="w-4 h-4 text-yellow-600 flex-shrink-0"/>
                              <span className="min-w-0">
                              <span className="block text-sm font-bold truncate">{folder.title}</span>
                              <span className="block text-xs opacity-40">{qLabel(folderItem.count)} • inclui subpastas</span>
                              </span>
                            </button>
                        </div>
                          </div>
                          {folderOpen&&<div>
                        {directSubjects.map(subject=>renderSubject(subject, depth + 1))}
                        {children.map(child=>renderFolder(child, depth + 1))}
                        {directSubjects.length===0&&children.length===0&&<p className="px-12 py-3 text-xs opacity-40 italic">Nenhuma questão direta nesta pasta.</p>}
                          </div>}
                        </section>
                      );
                };
                const totalCount = sourceRoots.reduce((acc,root)=>acc+root.count,0);
                return (
                  <div className={`rounded-xl border overflow-hidden max-h-80 overflow-y-auto mb-6 ${darkMode?'border-gray-700':'border-gray-200'}`}>
                    {totalCount===0&&<p className="text-sm opacity-50 italic p-4">Nenhuma questão disponível para prova.</p>}
                    {sourceRoots.map(root=>{
                      const rootKey = `source-${root.source}`;
                      const rootOpen = examOpenFolders[rootKey] ?? false;
                      const visibleFolders = root.folders.filter(folder => folderQuestionCount(folder) > 0 || folderSubjects(folder.id, root.source).length > 0 || childFolders(folder.id, root.source).length > 0);
                      return (
                        <section key={root.source} className={`border-b last:border-b-0 ${darkMode?'border-gray-700':'border-gray-100'}`}>
                          <div className={`flex items-center gap-2 px-3 py-2.5 ${darkMode?'bg-gray-900/30':'bg-gray-50'}`}>
                            <span className="w-8"/>
                            <button onClick={()=>toggleFolderOpen(rootKey)} className="min-w-0 flex-1 flex items-center gap-2 text-left">
                              {rootOpen?<ChevronDown className="w-4 h-4 opacity-40 flex-shrink-0"/>:<ChevronRight className="w-4 h-4 opacity-40 flex-shrink-0"/>}
                              <FolderIcon className="w-4 h-4 text-yellow-600 flex-shrink-0"/>
                              <span className="min-w-0">
                                <span className="block text-sm font-bold truncate">{root.title}</span>
                                <span className="block text-xs opacity-40">{qLabel(root.count)}</span>
                              </span>
                            </button>
                          </div>
                          {rootOpen&&(
                            <div>
                              {root.directSubjects.map(subject=>renderSubject(subject, 0))}
                              {visibleFolders.map(folder=>renderFolder(folder, 0))}
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </div>
                );
              })()}
              <div className="flex gap-4">
                <button onClick={()=>{setExamSetup(null);setExamTopics([]);}} className={`flex-1 py-3 rounded-xl font-bold ${darkMode?'bg-gray-700 hover:bg-gray-600':'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
                <button
                  disabled={!examTopics.length}
                  className="flex-1 bg-yellow-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-yellow-700 disabled:opacity-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!examTopics.length) return;
                    const topics = [...examTopics];
                    const qCount = examQCount;
                    const time   = examTime;
                    setExamSetup(null);
                    setExamTopics([]);
                    startExam(topics, qCount, time); // Bug 4: call after clearing state
                  }}
                >Iniciar Prova</button>
              </div>
            </div>
          </div>
        )}

        {/* ── EXAM ── */}
        {view==='exam'&&activeExam&&(
          <div>
            <div className={`sticky top-16 z-10 mb-6 p-4 rounded-xl border flex items-center justify-between ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'} shadow-md`}>
              <div>
                <h2 className="font-serif font-bold text-yellow-600">Modo Prova{activeExam.blindMode?' (Cego)':''}</h2>
                <p className="text-xs opacity-50">{Object.keys(activeExam.answers).length}/{activeExam.questions.length} respondidas</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block w-28 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"><div className="bg-yellow-500 h-full" style={{width:`${Object.keys(activeExam.answers).length/activeExam.questions.length*100}%`}}/></div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-bold ${activeExam.timeLeft<300?(darkMode?'bg-red-900/30 text-red-400':'bg-red-50 text-red-600'):(darkMode?'bg-gray-700 text-gray-200':'bg-gray-100')}`}><Clock className="w-4 h-4"/>{formatTime(activeExam.timeLeft)}</div>
                <button onClick={()=>setActiveExam(p=>{
                  // Bug 5: mark unanswered questions as SKIPPED so they count as wrong
                  const skipped = {};
                  p.questions.forEach(q=>{ if(!p.answers[q.id]) skipped[q.id]='SKIPPED'; });
                  return {...p, finished:true, answers:{...p.answers,...skipped}};
                })} className="text-xs font-bold text-red-500 hover:text-red-600">Encerrar</button>
              </div>
            </div>
            {(activeExam.finished||activeExam.timeLeft<=0)?(
              <div className="text-center py-10">
                <Award className="w-16 h-16 mx-auto text-yellow-500 mb-4"/>
                <h3 className="text-2xl font-serif font-bold text-yellow-600 mb-4">{activeExam.timeLeft<=0?'Tempo Esgotado!':'Prova Encerrada!'}</h3>
                {(()=>{
                  const correct=activeExam.questions.filter(q=>{
                    const answer = activeExam.answers[q.id];
                    if (q.isOpen) { try { return (JSON.parse(answer)?.score ?? 0) >= 70; } catch(e) { return false; } }
                    return answer===(q.options||[]).find(o=>o.isCorrect)?.letter;
                  }).length;
                  const skipped=activeExam.questions.filter(q=>activeExam.answers[q.id]==='SKIPPED').length;
                  const total=activeExam.questions.length; const pct=Math.round(correct/total*100);
                  const byTopic={};
                  activeExam.questions.forEach(q=>{
                    if(!byTopic[q._topicTitle])byTopic[q._topicTitle]={c:0,t:0,s:0};
                    byTopic[q._topicTitle].t++;
                    if(q.isOpen) {
                      try { if ((JSON.parse(activeExam.answers[q.id])?.score ?? 0) >= 70) byTopic[q._topicTitle].c++; } catch(e) {}
                    } else if(activeExam.answers[q.id]===(q.options||[]).find(o=>o.isCorrect)?.letter) byTopic[q._topicTitle].c++;
                    if(activeExam.answers[q.id]==='SKIPPED') byTopic[q._topicTitle].s++;
                  });
                  // Build data for insights
                  const examData = `Prova de ${total} questões\nCorretas: ${correct} | Erradas: ${total-correct-skipped} | Em branco: ${skipped}\nAproveitamento: ${pct}%\n\nPOR TÓPICO:\n${Object.entries(byTopic).map(([t,s])=>`${t}: ${s.c}/${s.t} (${s.s} em branco)`).join('\n')}`;
                  return (
                    <div className="w-full">
                      <div className={`p-6 rounded-2xl border mb-4 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
                        <div className={`text-5xl font-bold mb-2 ${pct>=70?'text-green-600':pct>=50?'text-yellow-600':'text-red-500'}`}>{pct}%</div>
                        <p className="opacity-60">{correct} de {total} corretas{skipped>0?` • ${skipped} em branco`:''}</p>
                      </div>
                      <div className="space-y-2 text-left mb-4">
                        {Object.entries(byTopic).map(([t,s],i)=>(
                          <div key={i} className={`flex justify-between p-3 rounded-lg border ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
                            <span className="text-sm font-bold truncate">{t}</span>
                            <span className={`text-sm font-bold ${s.c/s.t>=0.7?'text-green-600':'text-red-500'}`}>{s.c}/{s.t}{s.s>0?` (${s.s}✗)`:''}</span>
                          </div>
                        ))}
                      </div>
                      {/* Show corrections in blind mode after finish */}
                      {activeExam.blindMode&&(
                        <div className="mb-4 text-left">
                          <h4 className="font-bold mb-4 opacity-70">Correções:</h4>
                          {activeExam.questions.map((q,i)=>(
                            <QuestionCard key={i} question={q} index={i}
                              selectedLetter={activeExam.answers[q.id]}
	                              onAnswer={()=>{}} darkMode={darkMode}
	                              isFavorite={isExamQuestionFav(q)} onToggleFavorite={()=>handleExamFavorite(q)}
	                              showErrorNotebook={canUseAdvancedFeatures}
	                              isInErrorNotebook={isExamQuestionInNotebook(q)}
	                              onToggleErrorNotebook={()=>handleExamNotebook(q)}
	                              apiKey={getKey()} oracleLength={settings.oracleLength} onCall={callWithRotation} revealMode="revealed"/>
                          ))}
                        </div>
                      )}
                      <button onClick={()=>{setActiveExam(null);setView('library');}} className="w-full bg-yellow-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-yellow-700">Voltar</button>
                    </div>
                  );
                })()}
              </div>
            ):(
              <div>
                {/* Bug 6: real favorite toggle using handleExamFavorite */}
                {activeExam.questions.map((q,i)=>(
                  <QuestionCard key={i} question={q} index={i}
                    selectedLetter={activeExam.answers[q.id]==='SKIPPED'?undefined:activeExam.answers[q.id]}
                    onAnswer={l=>{trackQuestionAnswered(`exam:${activeExam.id}:${q.id}`);setActiveExam(p=>({...p,answers:{...p.answers,[q.id]:l}}));}}
                    darkMode={darkMode}
	                    isFavorite={isExamQuestionFav(q)}
	                    onToggleFavorite={()=>handleExamFavorite(q)}
	                    showErrorNotebook={canUseAdvancedFeatures}
	                    isInErrorNotebook={isExamQuestionInNotebook(q)}
	                    onToggleErrorNotebook={()=>handleExamNotebook(q)}
	                    apiKey={getKey()} oracleLength={settings.oracleLength} onCall={callWithRotation}
                    revealMode={activeExam.blindMode?'selected':'normal'}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS ── */}
        {view==='settings'&&(
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="app-hero rounded-2xl p-5 md:p-6 flex items-center gap-4 mb-8">
              <button onClick={()=>setView('library')} className={`h-11 w-11 rounded-xl border flex items-center justify-center ${darkMode?'border-gray-700 bg-gray-900':'border-gray-200 bg-white'}`}><ArrowLeft className="w-5 h-5"/></button>
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${darkMode?'text-gray-500':'text-gray-400'}`}>Preferências</p>
                <h2 className="text-3xl font-serif font-bold text-yellow-600">Configurações</h2>
              </div>
            </div>
            {/* API Keys */}
            <div className="app-card rounded-2xl p-5">
              <label className="block text-xs font-bold uppercase mb-3 opacity-50 flex items-center gap-2"><Key className="w-4 h-4"/>Chaves API (Gemini)</label>
              <div className={`p-3 rounded-xl mb-3 text-xs leading-relaxed ${darkMode?'bg-blue-900/20 border border-blue-800/40 text-blue-300':'bg-blue-50 border border-blue-200 text-blue-800'}`}>
                <p className="font-bold mb-1">ℹ️ Sobre as chaves</p>
                <p>Cada chave gratuita tem limite de ~20 requests/dia. Cadastre quantas chaves quiser para o site alternar automaticamente.</p>
                <p className="mt-1 opacity-80">⚠️ O Gemini funciona melhor à noite. Erros durante o dia geralmente são sobrecarga dos servidores, não problema da sua chave.</p>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold block mt-1">Criar nova chave gratuita →</a>
              </div>
              {(() => {
                const rows = getGeminiKeyRows(settings);
                const activeId = getActiveGeminiKeyId(settings);
                const updateRow = (idx, field, value) => {
                  const baseRows = getGeminiKeyRows(settingsRef.current);
                  const updated = baseRows.map((row, i) => i === idx
                    ? { ...row, id:row.isNew ? makeGeminiKeyId() : row.id, isNew:false, name:`Chave ${idx + 1}`, [field]:value }
                    : row
                  ).filter(row => !row.isNew);
                  setSettings(withGeminiKeys(settingsRef.current, updated));
                };
                const removeRow = (idx) => {
                  const baseRows = getGeminiKeyRows(settingsRef.current);
                  const updated = baseRows.filter((row, i) => i !== idx && !row.isNew);
                  saveSettings(withGeminiKeys(settingsRef.current, updated));
                };
                return rows.map((row, idx) => {
                  const disabled = !row.value.trim();
                  const canRemove = rows.filter(r => !r.isNew).length > 1 && !row.isNew;
                  return (
                    <div key={row.id} className={`mb-3 rounded-xl border p-3 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="ak" checked={!disabled && activeId===row.id} onChange={()=>saveSettings(withGeminiKeys(settingsRef.current, normalizeGeminiKeys(settingsRef.current), row.id))} disabled={disabled} className="w-5 h-5 accent-yellow-600 disabled:opacity-30 flex-shrink-0"/>
                        <input type="text" value={row.value||''} onChange={e=>updateRow(idx,'value',e.target.value)} onBlur={()=>saveSettings(settingsRef.current)} placeholder={`Chave Gemini ${idx + 1}...`} className={`flex-1 min-w-0 p-3 rounded-lg border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-900 border-gray-700 text-white':'bg-gray-50 border-gray-200'}`}/>
                        {canRemove&&(
                          <button type="button" onClick={()=>removeRow(idx)} title="Remover chave" aria-label={`Remover chave Gemini ${idx + 1}`} className={`p-2 rounded-lg ${darkMode?'text-gray-500 hover:text-red-400 hover:bg-gray-700':'text-gray-400 hover:text-red-500 hover:bg-gray-100'}`}>
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            {/* Oracle Length */}
            <div className="app-card rounded-2xl p-5">
              <label className="block text-xs font-bold uppercase mb-3 opacity-50 flex items-center gap-2"><MessageCircle className="w-4 h-4"/>Resposta do Chat</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(ORACLE_LENGTH).map(([k,c])=>(
                  <button key={k} onClick={()=>{const ns={...settings,oracleLength:k};setSettings(ns);saveSettings(ns);}}
                    className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${settings.oracleLength===k?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500':'border-gray-200 bg-white text-gray-700 hover:border-gray-300')}`}>
                    {c.label}
                  </button>
                ))}
	              </div>
	            </div>
            <div className="app-card rounded-2xl p-5">
              <label className="block text-xs font-bold uppercase mb-3 opacity-50 flex items-center gap-2"><SettingsIcon className="w-4 h-4"/>Tamanho da fonte</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {FONT_SCALE_OPTIONS.map(opt=>(
                  <button
                    key={opt.value}
                    onClick={()=>saveSettings({...settingsRef.current,fontScale:opt.value})}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${fontScale===opt.value?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-300':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600':'border-gray-200 bg-white text-gray-700 hover:border-gray-300')}`}>
                    <span className="block text-sm font-bold">{opt.label}</span>
                    <span className="block text-xs opacity-50 mt-0.5">{opt.value}%</span>
                  </button>
                ))}
              </div>
              <div className={`rounded-xl border p-4 ${darkMode?'bg-gray-900 border-gray-700':'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-sm font-bold">Ajuste fino</span>
                  <span className="text-sm font-serif font-bold text-yellow-600 tabular-nums">{fontScale}%</span>
                </div>
                <input
                  type="range"
                  min="90"
                  max="130"
                  step="1"
                  value={fontScale}
                  onChange={e=>setSettings({...settingsRef.current,fontScale:Number(e.target.value)})}
                  onMouseUp={()=>saveSettings(settingsRef.current)}
                  onTouchEnd={()=>saveSettings(settingsRef.current)}
                  onBlur={()=>saveSettings(settingsRef.current)}
                  className="w-full accent-yellow-600"
                />
                <p className={`text-xs mt-3 ${darkMode?'text-gray-500':'text-gray-500'}`}>A mudança afeta textos, questões, menus e formulários do site inteiro.</p>
              </div>
            </div>
	            {canUseAdvancedFeatures&&(
	              <div className="app-card rounded-2xl p-5">
	                <label className="block text-xs font-bold uppercase mb-3 opacity-50 flex items-center gap-2"><CalendarCheck className="w-4 h-4"/>Metas diárias</label>
	                <div className={`rounded-2xl border p-4 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
	                  <p className={`text-xs mb-4 ${darkMode?'text-gray-400':'text-gray-500'}`}>Sugestão inicial: 120 questões e 90 minutos úteis de aula por dia.</p>
	                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
	                    <div>
	                      <label className="block text-xs font-bold uppercase mb-2 opacity-50 leading-snug">Questões/dia</label>
	                      <input
	                        type="number"
	                        min="1"
	                        value={settings.dailyQuestionGoal || 120}
	                        onChange={e=>setSettings({...settings,dailyQuestionGoal:parseInt(e.target.value,10)||1})}
	                        onBlur={()=>saveSettings(settingsRef.current)}
	                        className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 font-bold ${darkMode?'bg-gray-900 border-gray-700 text-white':'bg-gray-50 border-gray-200'}`}
	                      />
	                    </div>
	                    <div>
	                      <label className="block text-xs font-bold uppercase mb-2 opacity-50 leading-snug">Minutos de aula/dia</label>
	                      <input
	                        type="number"
	                        min="1"
	                        value={settings.dailyLectureMinutesGoal || 90}
	                        onChange={e=>setSettings({...settings,dailyLectureMinutesGoal:parseInt(e.target.value,10)||1})}
	                        onBlur={()=>saveSettings(settingsRef.current)}
	                        className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 font-bold ${darkMode?'bg-gray-900 border-gray-700 text-white':'bg-gray-50 border-gray-200'}`}
	                      />
	                    </div>
	                  </div>
	                </div>
	              </div>
	            )}
	            {canUseAdvancedFeatures&&(
	              <div className="app-card rounded-2xl p-5">
	                <label className="block text-xs font-bold uppercase mb-3 opacity-50 flex items-center gap-2"><GraduationCap className="w-4 h-4"/>Modo de questões</label>
	                <div className="grid grid-cols-2 gap-3">
	                  {[
	                    {k:'list',label:'Lista',desc:'Todas na página'},
	                    {k:'single',label:'Uma por vez',desc:'Navegação focada'},
	                  ].map(opt=>(
	                    <button key={opt.k} onClick={()=>saveSettings({...settingsRef.current,questionDisplayMode:opt.k})}
	                      className={`p-3 rounded-xl border-2 text-left transition-all ${(settings.questionDisplayMode||'list')===opt.k?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-300':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600':'border-gray-200 bg-white text-gray-700 hover:border-gray-300')}`}>
	                      <span className="block text-sm font-bold">{opt.label}</span>
	                      <span className="block text-xs opacity-50 mt-0.5">{opt.desc}</span>
	                    </button>
	                  ))}
	                </div>
	              </div>
	            )}
	            <div className="app-card rounded-2xl p-5"><label className="block text-xs font-bold uppercase mb-2 opacity-50">Prompt Extra</label><textarea value={settings.customPrompt} onChange={e=>setSettings({...settings,customPrompt:e.target.value})} onBlur={()=>saveSettings(settings)} placeholder="Instruções adicionais para o Oráculo..." className={`w-full h-28 p-4 rounded-lg border resize-none outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}/></div>

            {/* ── ADMIN: Whitelist de Videoaulas ── */}
            {isAdmin&&(
              <div className={`rounded-2xl border p-5 ${darkMode?'bg-gray-800/50 border-yellow-900/40':'bg-yellow-50 border-yellow-200'}`}>
                <label className="block text-xs font-bold uppercase mb-4 flex items-center gap-2 text-yellow-600">
                  <Sparkles className="w-4 h-4"/>Acesso às Videoaulas
                </label>
                <div className="space-y-2 mb-4">
                  {allowedEmails.map(email=>(
                    <div key={email} className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl ${darkMode?'bg-gray-700':'bg-white'} border ${darkMode?'border-gray-600':'border-gray-200'}`}>
                      <span className="text-sm font-medium truncate">{email}</span>
                      {email.toLowerCase()===ADMIN_EMAIL.toLowerCase()
                        ? <span className="text-xs font-bold text-yellow-600 flex-shrink-0">admin</span>
                        : <button type="button" aria-label={`Remover ${email}`} onClick={()=>removeFromWhitelist(email)} className="text-red-400 hover:text-red-600 flex-shrink-0 p-1 rounded"><Trash2 className="w-4 h-4"/></button>
                      }
                    </div>
                  ))}
                  {allowedEmails.length===0&&<p className="text-sm opacity-40 text-center py-2">Nenhum email cadastrado</p>}
                </div>
                <div className="flex gap-2">
                  <input
                    type="email" value={newWhitelistEmail}
                    onChange={e=>setNewWhitelistEmail(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&addToWhitelist()}
                    placeholder="novo@email.com"
                    className={`flex-1 p-3 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 text-sm ${darkMode?'bg-gray-700 border-gray-600 text-white':'bg-white border-gray-200'}`}
                  />
                  <button type="button" aria-label="Adicionar email" onClick={addToWhitelist} disabled={!newWhitelistEmail.trim()}
                    className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold disabled:opacity-40">
                    <PlusIcon className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            )}

            {/* Zona de perigo */}
            {canSeeVideoaulas&&(
              <div className={`border-2 border-dashed rounded-2xl p-6 ${darkMode?'border-red-800/50':'border-red-200'}`}>
                <p className={`text-xs font-bold uppercase mb-1 ${darkMode?'text-red-400':'text-red-600'}`}>Zona de perigo</p>
                <p className={`text-sm mb-4 ${darkMode?'text-gray-400':'text-gray-600'}`}>Apaga todo o progresso do Portal do Curso: aulas assistidas, questões geradas e fila de revisão espaçada. A biblioteca do Oráculo não é afetada.</p>
                <button onClick={()=>{setResetCourseModal(true);setResetCourseInput('');}}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${darkMode?'border-red-700 text-red-400 hover:bg-red-900/20':'border-red-300 text-red-600 hover:bg-red-50'}`}>
                  <Trash2 className="w-4 h-4"/>Apagar progresso do curso
                </button>
              </div>
            )}

            <button onClick={()=>{saveSettings(settings);addToast('Configurações salvas.', 'success', 2500);setView('library');}} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-4 rounded-xl font-bold">Salvar</button>
          </div>
        )}
      </main>



      {externalPromptModal&&<ExternalPromptModal
        darkMode={darkMode}
        settings={settings}
        settingsRef={settingsRef}
        onClose={()=>setExternalPromptModal(false)}
      />}

      {vqGenModal&&<VqGenModal
        key={vqGenModal.aulaId}
        aula={vqGenModal.aula}
        aulaId={vqGenModal.aulaId}
        suggestedQ={vqGenModal.suggestedQ}
        subject={vqGenModal.subject}
        topic={vqGenModal.topic}
        isReset={!!vqGenModal.reset}
        darkMode={darkMode}
        savedSettings={settings}
        onClose={(prefs={})=>{
          // Salvar preferências mesmo ao fechar sem confirmar
          if (prefs.questionStyle || prefs.numAlternatives || prefs.autoMode !== undefined) {
            const ns = {...settings, ...prefs};
            saveSettings(ns);
          }
          setVqGenModal(null);
        }}
        onConfirm={(cfg)=>{
          // Salvar preferências para próximas aulas
          const ns = {...settings, numAlternatives: cfg.numAlternatives, questionStyle: cfg.questionStyle||settings.questionStyle, autoMode: cfg.autoMode};
          saveSettings(ns);
          setVqGenModal(null);
          const toastId = addToast('📋 Gerando sumário da aula...', 'loading', 0);
          generateVqSyllabus({...cfg, aula:vqGenModal.aula, aulaId:vqGenModal.aulaId, subject:vqGenModal.subject, topic:vqGenModal.topic, toastId});
        }}
        loading={vqSyllabusLoading}
      />}

	      {/* Toasts */}
	      <ToastContainer toasts={toasts} onRemove={removeToast}/>
	      {['topic','academia-topic','videoquestions','curso','favorites'].includes(view)&&!reviewSession&&!(canUseAdvancedFeatures&&(settings.questionDisplayMode||'list')==='single'&&(['topic','videoquestions'].includes(view)||(view==='curso'&&vqActiveBlockView)))&&<BackToTopButton darkMode={darkMode}/>}

	      {/* Spaced Review Modal */}
      {srModal&&<SRModal
        questions={srModal.questions}
        answers={srModal.answers}
        aulaId={srModal.aulaId}
        blockId={srModal.blockId}
        blockTitle={srModal.blockTitle}
	        darkMode={darkMode}
	        currentReview={reviewQueue[srModal.aulaId]?.[srModal.blockId] || {}}
	        notebookIds={srModal.notebookIds || []}
	        isAdmin={canUseAdvancedFeatures}
	        onClose={()=>setSrModal(null)}
	        onConfirm={async(selectedIds, removeIds=[])=>{
	          if (selectedIds.length > 0 || removeIds.length > 0) {
	            await updateReviewMembership(srModal.aulaId, srModal.blockId, selectedIds, removeIds, srModal.questions, srModal.meta || {});
	          }
          setSrModal(null);
          const parts = [];
          if (selectedIds.length > 0) parts.push(`+${selectedIds.length} adicionada${selectedIds.length!==1?'s':''}`);
          if (removeIds.length > 0) parts.push(`−${removeIds.length} removida${removeIds.length!==1?'s':''}`);
          if (parts.length) addToast(`↺ Revisão: ${parts.join(' · ')}`, 'success', 4000);
        }}
      />}

      {/* Error Notebook Review Modal */}
      {errorReviewModal&&(
        <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4" onClick={()=>setErrorReviewModal(null)}>
          <div className={`w-full max-w-md rounded-2xl p-8 border overflow-y-auto ${darkMode?'bg-gray-900 border-gray-700 text-white':'bg-white border-gray-200 text-gray-900'}`} style={{maxHeight:'calc(100dvh - 6rem)'}} onClick={e=>e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-6">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode?'bg-yellow-900/30 text-yellow-400':'bg-yellow-50 text-yellow-700'}`}>
                <BookOpen className="w-6 h-6"/>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">Caderno de erros</p>
                <h3 className="text-xl font-serif font-bold text-yellow-600">Revisar caderno de erros</h3>
                <p className="text-sm opacity-60 mt-1">
                  {errorReviewModal.questions.length} {errorReviewModal.questions.length===1?'questão':'questões'} no caderno → cerca de {errorReviewModal.questions.length * 2} novas questões.
                </p>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <div className="text-xs font-bold uppercase mb-2 opacity-50">Tipo de questão</div>
                <QuestionTypeSelector selected={errorReviewQTypes} onChange={setErrorReviewQTypes} darkMode={darkMode} single={true}/>
              </div>
              {errorReviewQTypes.some(t=>['direct','vof','cespe'].includes(t))&&(
                <div>
                  <div className="text-xs font-bold uppercase mb-2 opacity-50">Estilo</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[{k:'mixed',label:'Misto'},{k:'clinical',label:'Clínico'},{k:'direct',label:'Direto'}].map(opt=>(
                      <button key={opt.k} onClick={()=>setErrorReviewQStyle(opt.k)}
                        className={`py-2 rounded-xl border-2 text-xs font-bold transition-all ${errorReviewQStyle===opt.k?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-600 bg-gray-800 text-gray-300':'border-gray-200 bg-white text-gray-700')}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs font-bold uppercase mb-2 opacity-50">Alternativas</div>
                <div className="flex gap-2">
                  {[4,5].map(n=>(
                    <button key={n} onClick={()=>setErrorReviewQAlts(n)}
                      className={`flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-all ${errorReviewQAlts===n?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-600 bg-gray-800 text-gray-300':'border-gray-200 bg-white text-gray-700')}`}>
                      {n} (A-{n===4?'D':'E'})
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-7">
              <button onClick={()=>setErrorReviewModal(null)} className={`flex-1 py-3 rounded-xl font-bold ${darkMode?'bg-gray-800 hover:bg-gray-700':'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
              <button
                disabled={isBusy}
                onClick={()=>generateErrorNotebookReview({questionStyle:errorReviewQStyle, questionTypes:errorReviewQTypes, numAlternatives:errorReviewQAlts})}
                className="flex-[2] px-5 py-3 bg-yellow-600 text-white rounded-xl font-bold hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {isBusy?<Spinner className="w-4 h-4 text-white"/>:<Sparkles className="w-4 h-4"/>}
                {isBusy?'Gerando...':'Gerar revisão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open Answer Modal */}
      {openAnswerModal&&<OpenAnswerModal
        question={openAnswerModal.question}
        darkMode={darkMode}
        apiKey={getKey()}
        onCall={callWithRotation}
        onClose={()=>setOpenAnswerModal(null)}
        isEssay={openAnswerModal.isEssay}
      />}

      {/* ── EXPORT MODAL ── */}
      {exportModal&&<ExportModal topic={exportModal.topic} subject={exportModal.subject} onClose={()=>setExportModal(null)} darkMode={darkMode}/>}
      {academiaExportModal&&<AcademiaExportModal topic={academiaExportModal.topic} subject={academiaExportModal.subject} onClose={()=>setAcademiaExportModal(null)} darkMode={darkMode}/>}

      {/* ── INSIGHTS MODAL ── */}
      {bizuarioModal&&<BizuarioModal topicTitle={bizuarioModal.topicTitle} subjectTitle={bizuarioModal.subjectTitle} questions={bizuarioModal.questions||[]} subtopics={bizuarioModal.subtopics||[]} topicContexts={bizuarioModal.topicContexts||null} apiKey={getKey()} darkMode={darkMode} onClose={()=>setBizuarioModal(null)} cachedText={bizuarioModal.cachedText} onSave={bizuarioModal.onSave} onRotateKey={rotateKey}/>}

      {/* ── RESET COURSE MODAL ── */}
      {resetCourseModal&&(
        <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4">
          <div className={`w-full max-w-sm rounded-2xl border p-8 overflow-y-auto ${darkMode?'bg-gray-900 border-gray-700':'bg-white border-gray-200'}`} style={{maxHeight:'calc(100dvh - 6rem)'}}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${darkMode?'bg-red-900/30':'bg-red-100'}`}>
              <Trash2 className="w-6 h-6 text-red-500"/>
            </div>
            <h3 className="font-serif font-bold text-xl mb-2">Apagar progresso do curso?</h3>
            <p className={`text-sm mb-5 ${darkMode?'text-gray-400':'text-gray-500'}`}>
              Isso vai apagar permanentemente:<br/>
              • Todas as aulas marcadas como assistidas<br/>
              • Todas as questões geradas no curso<br/>
              • Toda a fila de revisão espaçada<br/><br/>
              <strong>A biblioteca do Oráculo não será afetada.</strong>
            </p>
            <p className={`text-xs font-bold mb-2 ${darkMode?'text-gray-400':'text-gray-600'}`}>
              Digite <strong>APAGAR</strong> para confirmar:
            </p>
            <input
              value={resetCourseInput}
              onChange={e=>setResetCourseInput(e.target.value.toUpperCase())}
              placeholder="APAGAR"
              className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-red-500 mb-5 font-mono ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-300'}`}
            />
            <div className="flex gap-3">
              <button onClick={()=>{setResetCourseModal(false);setResetCourseInput('');}}
                className={`flex-1 py-3 rounded-xl font-bold ${darkMode?'bg-gray-800 hover:bg-gray-700':'bg-gray-100 hover:bg-gray-200'}`}>
                Cancelar
              </button>
              <button
                onClick={resetCourseProgress}
                disabled={resetCourseInput !== RESET_CONFIRM_WORD}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold disabled:opacity-40 transition-all">
                Apagar tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ACADEMIA REGENERATE MODAL ── */}
      {academiaRegenModal&&(
        <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4" onClick={()=>setAcademiaRegenModal(null)}>
          <div onClick={e=>e.stopPropagation()} className={`w-full max-w-lg rounded-2xl p-7 border overflow-y-auto ${darkMode?'bg-gray-900 border-gray-700 text-white':'bg-white border-gray-200 text-gray-900'}`} style={{maxHeight:'calc(100dvh - 6rem)'}}>
            <h3 className="text-xl font-serif font-bold text-yellow-600 mb-1 flex items-center gap-2"><RotateCcw className="w-5 h-5"/>Regenerar aula</h3>
            <p className="text-sm mb-6 opacity-60">A aula e as questões de fixação atuais serão substituídas.</p>
            <div className="space-y-5">
              <div>
                <div className="text-xs font-bold uppercase mb-2 opacity-50">Profundidade da aula</div>
                <ExplanationLengthSelector value={academiaRegenLength} onChange={setAcademiaRegenLength} darkMode={darkMode}/>
              </div>
              <div>
                <div className="text-xs font-bold uppercase mb-2 opacity-50">Por que regenerar? <span className="normal-case font-normal opacity-70">(opcional)</span></div>
                <textarea
                  value={academiaRegenReason}
                  onChange={e=>setAcademiaRegenReason(e.target.value)}
                  placeholder="Ex: ficou prolixo, faltaram exemplos de prova, quero mais foco em tratamento..."
                  className={`w-full h-24 p-3 rounded-xl border resize-none outline-none focus:ring-2 focus:ring-yellow-500 text-sm ${darkMode?'bg-gray-800 border-gray-700 text-white placeholder-gray-500':'bg-white border-gray-200 placeholder-gray-400'}`}
                />
              </div>
              <div>
                <div className="text-xs font-bold uppercase mb-2 opacity-50">Tipo das questões de fixação</div>
                <QuestionTypeSelector selected={academiaRegenQTypes} onChange={setAcademiaRegenQTypes} darkMode={darkMode} single={true}/>
              </div>
              {academiaRegenQTypes.some(t=>['direct','vof','cespe'].includes(t))&&(
                <div>
                  <div className="text-xs font-bold uppercase mb-2 opacity-50">Estilo</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[{k:'mixed',label:'Misto'},{k:'clinical',label:'Clínico'},{k:'direct',label:'Direto'}].map(opt=>(
                      <button key={opt.k} onClick={()=>setAcademiaRegenQStyle(opt.k)}
                        className={`py-2 rounded-xl border-2 text-xs font-bold transition-all ${academiaRegenQStyle===opt.k?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-600 bg-gray-800 text-gray-300':'border-gray-200 bg-white text-gray-700')}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs font-bold uppercase mb-2 opacity-50">Alternativas</div>
                <div className="flex gap-2">
                  {[4,5].map(n=>(
                    <button key={n} onClick={()=>setAcademiaRegenQAlts(n)}
                      className={`flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-all ${academiaRegenQAlts===n?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-600 bg-gray-800 text-gray-300':'border-gray-200 bg-white text-gray-700')}`}>
                      {n} (A-{n===4?'D':'E'})
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-7">
              <button onClick={()=>setAcademiaRegenModal(null)} className={`flex-1 py-3 rounded-xl font-bold ${darkMode?'bg-gray-800 hover:bg-gray-700':'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
              <button onClick={()=>{
                const regenSettings = {
                  explanationLength: academiaRegenLength,
                  regenReason: academiaRegenReason.trim(),
                  questionStyle: academiaRegenQStyle,
                  questionTypes: academiaRegenQTypes,
                  numAlternatives: academiaRegenQAlts,
                };
                const { regenReason, ...persistedSettings } = regenSettings;
                const ns = { ...settings, ...persistedSettings };
                saveSettings(ns);
                const { topic, subject } = academiaRegenModal;
                setAcademiaRegenModal(null);
                setAcademiaRegenReason('');
                generateAcademiaLesson(topic, subject, regenSettings);
              }} className="flex-[2] px-5 py-3 bg-yellow-600 text-white rounded-xl font-bold hover:bg-yellow-700 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4"/>Regenerar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ACADEMIA EXTRA BATTERY MODAL ── */}
      {academiaExtraModal&&(
        <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4">
          <div className={`w-full max-w-md rounded-2xl p-8 border overflow-y-auto ${darkMode?'bg-gray-900 border-gray-700 text-white':'bg-white border-gray-200 text-gray-900'}`} style={{maxHeight:'calc(100dvh - 6rem)'}}>
            <h3 className="text-xl font-serif font-bold text-yellow-600 mb-1">Bateria Extra</h3>
            <p className={`text-sm mb-6 opacity-60`}>Gera novas questões sobre todos os subtópicos de <strong>{academiaExtraModal.topic.title}</strong>.</p>
            <div className="space-y-5">
              <div>
                <div className="text-xs font-bold uppercase mb-2 opacity-50">Tipo de questão</div>
                <QuestionTypeSelector selected={academiaExtraQTypes} onChange={setAcademiaExtraQTypes} darkMode={darkMode} single={true}/>
              </div>
              {academiaExtraQTypes.some(t=>['direct','vof','cespe'].includes(t))&&(
                <div>
                  <div className="text-xs font-bold uppercase mb-2 opacity-50">Estilo</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[{k:'mixed',label:'Misto'},{k:'clinical',label:'Clínico'},{k:'direct',label:'Direto'}].map(opt=>(
                      <button key={opt.k} onClick={()=>setAcademiaExtraQStyle(opt.k)}
                        className={`py-2 rounded-xl border-2 text-xs font-bold transition-all ${academiaExtraQStyle===opt.k?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-600 bg-gray-800 text-gray-300':'border-gray-200 bg-white text-gray-700')}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Alternativas — sempre visível independente do autoMode */}
              <div>
                <div className="text-xs font-bold uppercase mb-2 opacity-50">Alternativas</div>
                <div className="flex gap-2">
                  {[4,5].map(n=>(
                    <button key={n} onClick={()=>setAcademiaExtraQAlts(n)}
                      className={`flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-all ${academiaExtraQAlts===n?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-600 bg-gray-800 text-gray-300':'border-gray-200 bg-white text-gray-700')}`}>
                      {n} (A-{n===4?'D':'E'})
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-7">
              <button onClick={()=>setAcademiaExtraModal(null)} className={`flex-1 py-3 rounded-xl font-bold ${darkMode?'bg-gray-800 hover:bg-gray-700':'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
              <button onClick={()=>{
                const extraSettings = {...settings, questionStyle:academiaExtraQStyle, questionTypes:academiaExtraQTypes, numAlternatives:academiaExtraQAlts};
                const {topic,subject} = academiaExtraModal;
                setAcademiaExtraModal(null);
                generateAcademiaExtraBattery(topic, subject, extraSettings);
              }} className="flex-[2] px-5 py-3 bg-yellow-600 text-white rounded-xl font-bold hover:bg-yellow-700 flex items-center justify-center gap-2">
                <Zap className="w-4 h-4"/>Gerar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REGEN MODAL ── */}
      {regenModal&&(
        <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4">
          <div className={`w-full max-w-md rounded-2xl p-8 border-2 border-yellow-600 overflow-y-auto ${darkMode?'bg-gray-900 text-white':'bg-white text-gray-900'}`} style={{maxHeight:'calc(100dvh - 6rem)'}}>
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4"><RotateCcw className="w-8 h-8 text-yellow-600"/></div>
              <h3 className="text-2xl font-serif font-bold mb-2">Recriar Bloco</h3>
              <p className="mb-6 opacity-70 text-sm">As questões atuais serão substituídas.</p>
              <textarea value={regenPrompt} onChange={e=>setRegenPrompt(e.target.value)} placeholder="Foco específico (opcional)..." className={`w-full h-20 p-3 rounded-lg border resize-none outline-none mb-6 text-sm ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
              <div className="flex gap-4 w-full">
                <button onClick={()=>setRegenModal(false)} className={`flex-1 py-3 rounded-xl font-bold ${darkMode?'bg-gray-800':'bg-gray-100'}`}>Cancelar</button>
                <button onClick={()=>{setRegenModal(false);generateBatch(activeTopic.id,regenPrompt);setRegenPrompt('');}} className="flex-1 px-5 py-3 bg-yellow-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"><Sparkles className="w-4 h-4"/>Recriar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STANDARD MODALS ── */}
      {newFolderModal&&(()=>{
        const sourceLabel = libFilter==='gemini'?'Oráculo':libFilter==='academia'?'Academia':'Externo';
        const parentLabel = newFolderParentId ? getFolderLabel(newFolderParentId) : sourceLabel;
        const cleanName = newFolderName.trim();
        return (
          <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4" onClick={()=>{setNewFolderModal(false);setNewFolderName('');setNewFolderParentId(null);}}>
            <div className={`w-full max-w-lg rounded-2xl border p-6 overflow-y-auto ${darkMode?'bg-gray-900 border-gray-700 text-gray-100':'bg-white border-gray-200 text-gray-900'}`} style={{maxHeight:'calc(100dvh - 6rem)'}} onClick={e=>e.stopPropagation()}>
              <div className="flex items-start gap-4 mb-6">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode?'bg-yellow-900/30 text-yellow-400':'bg-yellow-50 text-yellow-700'}`}>
                  <FolderIcon className="w-6 h-6"/>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">{newFolderParentId?'Nova pasta filha':'Nova pasta'}</p>
                  <h3 className="text-2xl font-serif font-bold text-yellow-600">Criar pasta</h3>
                  <p className="text-sm opacity-60 mt-1">Destino: <span className="font-bold">{parentLabel}</span></p>
                </div>
              </div>
              <label className="block text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Nome da pasta</label>
              <input value={newFolderName} onChange={e=>setNewFolderName(e.target.value)} onKeyDown={async e=>{if(e.key==='Enter'&&cleanName){await createLibraryFolder(libFilter,cleanName,newFolderParentId);setNewFolderModal(false);setNewFolderName('');setNewFolderParentId(null);}}} placeholder="Ex: Prova 1, AFP, Revisão de cardio..." className={`w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 font-bold ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-gray-50 border-gray-200'}`} autoFocus/>
              <div className={`mt-4 rounded-xl border p-4 ${darkMode?'border-gray-700 bg-gray-800/50':'border-gray-200 bg-gray-50'}`}>
                <p className="text-[11px] font-bold uppercase tracking-widest opacity-40 mb-2">Vai aparecer como</p>
                <div className="flex items-center gap-2 min-w-0 text-sm">
                  <FolderIcon className="w-4 h-4 text-yellow-600 flex-shrink-0"/>
                  <span className="opacity-60 truncate">{parentLabel}</span>
                  <ChevronRight className="w-3 h-3 opacity-40 flex-shrink-0"/>
                  <span className="font-bold truncate">{cleanName || 'Nome da pasta'}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={()=>{setNewFolderModal(false);setNewFolderName('');setNewFolderParentId(null);}} className={`flex-1 py-3 rounded-xl font-bold ${darkMode?'bg-gray-800 hover:bg-gray-700':'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
                <button disabled={!cleanName} onClick={async()=>{await createLibraryFolder(libFilter,cleanName,newFolderParentId);setNewFolderModal(false);setNewFolderName('');setNewFolderParentId(null);}} className="flex-1 bg-yellow-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-yellow-700 disabled:opacity-50">Criar pasta</button>
              </div>
            </div>
          </div>
        );
      })()}
      {moveSubjectModal&&(()=>{
        const movingFolder = isFolderItem(moveSubjectModal);
        const currentId = movingFolder ? (moveSubjectModal.parentFolderId || null) : (moveSubjectModal.folderId || null);
        const selectedDest = Object.prototype.hasOwnProperty.call(moveSubjectModal, '_selectedDest') ? moveSubjectModal._selectedDest : currentId;
        const setSelectedDest = (id) => setMoveSubjectModal(p=>({...p,_selectedDest:id}));
        const folderDestinations = sourceFolders(moveSubjectModal.source)
          .filter(folder => !isProtectedMirrorRootFolder(folder))
          .filter(folder => !movingFolder || (folder.id !== moveSubjectModal.id && !isFolderDescendant(folder.id, moveSubjectModal.id)))
          .map(folder => ({...folder, title:getFolderLabel(folder.id)}));
        const destinations = [{id:null,title:'Raiz'},...folderDestinations];
        const selectedDestObj = destinations.find(f=>(f.id||null)===(selectedDest||null)) || destinations[0];
        const selectedDestId = selectedDestObj.id || null;
        const selectedDestLocked = isProtectedMirrorRootFolder(libraryFolders.find(f=>String(f.id)===String(selectedDestId)));
        const currentLocation = movingFolder ? getFolderParentTitle(moveSubjectModal) : getSubjectFolderTitle(moveSubjectModal);
        const createMoveFolder = async () => {
          if (selectedDestLocked) return;
          const created = await createLibraryFolder(moveSubjectModal.source, moveNewFolderName, selectedDestId);
          if (!created) return;
          setMoveNewFolderName('');
          setSelectedDest(created.id);
        };
        return (
          <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4" onClick={()=>{setMoveSubjectModal(null);setMoveNewFolderName('');}}>
            <div className={`w-full max-w-lg rounded-2xl border p-6 overflow-y-auto ${darkMode?'bg-gray-800 border-gray-700 text-gray-100':'bg-white border-gray-200 text-gray-900'}`} style={{maxHeight:'calc(100dvh - 6rem)'}} onClick={e=>e.stopPropagation()}>
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">{movingFolder?'Mover pasta':'Mover assunto'}</p>
                <h3 className="text-xl font-serif font-bold text-yellow-600">{moveSubjectModal.title}</h3>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm`}>
                  <div className={`rounded-xl border p-3 ${darkMode?'border-gray-700 bg-gray-900/40':'border-gray-200 bg-gray-50'}`}>
                    <p className="text-[11px] font-bold uppercase tracking-widest opacity-40 mb-1">Está em</p>
                    <p className="font-bold truncate">{currentLocation}</p>
                  </div>
                  <div className={`rounded-xl border p-3 ${darkMode?'border-yellow-700 bg-yellow-900/10':'border-yellow-200 bg-yellow-50'}`}>
                    <p className="text-[11px] font-bold uppercase tracking-widest opacity-50 mb-1">Vai para</p>
                    <p className="font-bold text-yellow-600 truncate">{selectedDestObj.title}</p>
                  </div>
                </div>
              </div>
              <div className={`rounded-xl border overflow-hidden mb-5 ${darkMode?'border-gray-700':'border-gray-200'}`}>
                {destinations.map(folder=> {
                  const id = folder.id || null;
                  const selected = (selectedDest || null) === id;
                  return (
                    <button key={folder.id||'root'} onClick={()=>setSelectedDest(id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 border-b last:border-b-0 text-left transition-colors ${darkMode?'border-gray-700':'border-gray-100'} ${selected?(darkMode?'bg-yellow-900/20 text-yellow-300':'bg-yellow-50 text-yellow-800'):(darkMode?'hover:bg-gray-700 text-gray-200':'hover:bg-gray-50 text-gray-800')}`}>
                      <FolderIcon className="w-5 h-5 text-yellow-600 flex-shrink-0"/>
                      <span className="font-bold text-sm truncate">{folder.title}</span>
                      {selected&&<CheckIcon className="w-4 h-4 ml-auto text-yellow-600 flex-shrink-0"/>}
                    </button>
                  );
                })}
              </div>
              {!selectedDestLocked&&<div className={`rounded-xl border p-3 mb-5 ${darkMode?'border-gray-700 bg-gray-900/30':'border-gray-200 bg-gray-50'}`}>
                <p className="text-[11px] font-bold uppercase tracking-widest opacity-40 mb-2">Criar nova pasta em {selectedDestObj.title}</p>
                <div className="flex gap-2">
                  <input value={moveNewFolderName} onChange={e=>setMoveNewFolderName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') createMoveFolder();}} placeholder="Nome da pasta" className={`min-w-0 flex-1 px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-yellow-500 text-sm font-bold ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
                  <button onClick={createMoveFolder} disabled={!moveNewFolderName.trim()} className="px-3 py-2 rounded-lg bg-yellow-600 text-white font-bold text-sm hover:bg-yellow-700 disabled:opacity-50">Criar</button>
                </div>
              </div>}
              <div className="flex gap-3">
                <button onClick={()=>{setMoveSubjectModal(null);setMoveNewFolderName('');}} className={`flex-1 py-3 rounded-xl font-bold ${darkMode?'bg-gray-700 hover:bg-gray-600':'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
                <button onClick={async()=>{movingFolder?await moveFolderToFolder(moveSubjectModal,selectedDestId):await moveSubjectToFolder(moveSubjectModal,selectedDestId);setMoveSubjectModal(null);setMoveNewFolderName('');}} className="flex-1 bg-yellow-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-yellow-700">Mover</button>
              </div>
            </div>
          </div>
        );
      })()}
      {folderReviewModal&&(()=>{
        const sources = getFolderReviewSources(folderReviewModal);
        const selectedCount = sources.filter(({subject,topic})=>folderReviewConfig.selected[`${subject.id}__${topic.id}`]).length;
        return (
          <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4" onClick={()=>setFolderReviewModal(null)}>
            <div className={`w-full max-w-2xl rounded-2xl border p-8 overflow-y-auto ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`} style={{maxHeight:'calc(100dvh - 6rem)'}} onClick={e=>e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">Revisão de pasta</p>
                  <h3 className="text-2xl font-serif font-bold text-yellow-600 flex items-center gap-3"><RepeatIcon className="w-6 h-6"/>{folderReviewModal.title}</h3>
                </div>
                <button type="button" aria-label="Fechar" onClick={()=>setFolderReviewModal(null)} className={`p-2 rounded-lg ${darkMode?'hover:bg-gray-700 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>✕</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div><label className="block text-xs font-bold uppercase mb-2 opacity-50">Total de questões</label><input type="number" min="1" max="200" value={folderReviewConfig.total} onChange={e=>setFolderReviewConfig(p=>({...p,total:parseInt(e.target.value)||1}))} className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-700 border-gray-600 text-white':'bg-gray-50 border-gray-200'}`}/></div>
                <div><label className="block text-xs font-bold uppercase mb-2 opacity-50">Máx. por tema</label><input type="number" min="1" max="50" value={folderReviewConfig.perTopic} onChange={e=>setFolderReviewConfig(p=>({...p,perTopic:parseInt(e.target.value)||1}))} className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-700 border-gray-600 text-white':'bg-gray-50 border-gray-200'}`}/></div>
              </div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-3 opacity-50">Temas ({selectedCount} selecionados)</label>
              <div className={`rounded-xl border overflow-hidden max-h-72 overflow-y-auto mb-6 ${darkMode?'border-gray-700':'border-gray-200'}`}>
                {sources.length===0&&<p className="text-sm opacity-50 italic p-4">Nenhuma questão encontrada nesta pasta.</p>}
                {sources.map(({subject, topic, questions})=>{
                  const key=`${subject.id}__${topic.id}`;
                  const checked=!!folderReviewConfig.selected[key];
                  const avg = questions.length ? Math.round(questions.reduce((acc,q)=>acc+((topic.reviewStats||{})[q.id]||0),0)/questions.length*10)/10 : 0;
                  return (
                    <label key={key} className={`flex items-center gap-3 p-3 cursor-pointer border-b last:border-b-0 transition-colors ${darkMode?'border-gray-700':'border-gray-100'} ${checked?(darkMode?'bg-yellow-900/20':'bg-yellow-50'):(darkMode?'hover:bg-gray-700':'hover:bg-gray-50')}`}>
                      <input type="checkbox" checked={checked} onChange={()=>setFolderReviewConfig(p=>({...p,selected:{...p.selected,[key]:!p.selected[key]}}))} className="accent-yellow-600"/>
                      <div className="min-w-0"><p className="text-sm font-bold truncate">{topic.title}</p><p className="text-xs opacity-40">{subject.title} • {questions.length} questões • média {avg} revisão(ões)</p></div>
                    </label>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setFolderReviewModal(null)} className={`flex-1 py-3 rounded-xl font-bold ${darkMode?'bg-gray-700 hover:bg-gray-600':'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
                <button onClick={createFolderReview} disabled={!selectedCount} className="flex-1 bg-yellow-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-yellow-700 disabled:opacity-50">Criar bloco</button>
              </div>
            </div>
	          </div>
	        );
	      })()}
	      {bulkGenerateModal&&(()=>{
	        const subject = library.find(s => s.id === bulkGenerateModal.subjectId);
	        const pending = getBulkGenerateTargets(subject);
	        const isAcademiaBulk = subject?.source === 'academia';
	        const keyCount = getConfiguredGeminiKeys(settingsRef.current).length;
	        const closeOrStartBulk = pending.length ? startBulkGenerate : (() => setBulkGenerateModal(null));
	        return (
	          <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-90 p-4" onClick={()=>{if(!bulkGenerateRun.running)setBulkGenerateModal(null);}}>
	            <div className={`w-full max-w-2xl rounded-2xl border p-8 overflow-y-auto ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`} style={{maxHeight:'calc(100dvh - 6rem)'}} onClick={e=>e.stopPropagation()}>
	              <div className="flex items-start justify-between gap-4 mb-5">
	                <div>
	                  <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">Geração em massa</p>
	                  <h3 className="text-2xl font-serif font-bold text-yellow-600 flex items-center gap-3"><Zap className="w-6 h-6"/>Gerar tudo</h3>
	                </div>
	                <button type="button" aria-label="Fechar" disabled={bulkGenerateRun.running} onClick={()=>setBulkGenerateModal(null)} className={`p-2 rounded-lg disabled:opacity-30 ${darkMode?'hover:bg-gray-700 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>✕</button>
	              </div>
	              <div className={`rounded-xl border p-4 mb-5 text-sm leading-relaxed ${darkMode?'border-yellow-700/60 bg-yellow-900/10 text-yellow-100':'border-yellow-300 bg-yellow-50 text-yellow-900'}`}>
	                <p className="font-bold mb-2">Use com cuidado.</p>
	                <p>Isso vai gerar {isAcademiaBulk?'aula + questões de fixação':'questões'} para {pending.length} bloco{pending.length!==1?'s':''} pendente{pending.length!==1?'s':''}, um por vez. Pode demorar bastante, consumir muitas requisições e ainda assim falhar em alguns blocos por quota, instabilidade do Gemini ou resposta malformada.</p>
	                <p className="mt-2">Recomendação: rode à noite, mantenha a aba aberta, tenha várias chaves cadastradas e evite mexer nos blocos durante o processo. Chaves detectadas agora: <strong>{keyCount}</strong>.</p>
	              </div>
	              <div className={`rounded-xl border overflow-hidden mb-5 ${darkMode?'border-gray-700':'border-gray-200'}`}>
	                <div className={`px-4 py-3 border-b flex items-center justify-between ${darkMode?'border-gray-700 bg-gray-900/30':'border-gray-100 bg-gray-50'}`}>
	                  <span className="text-xs font-bold uppercase tracking-widest opacity-50">Log</span>
	                  <span className="text-xs font-bold text-yellow-600">{bulkGenerateRun.running ? `${bulkGenerateRun.current}/${bulkGenerateRun.total}` : `${pending.length} pendente${pending.length!==1?'s':''}`}</span>
	                </div>
	                <div className="max-h-72 overflow-y-auto p-3 space-y-2">
	                  {bulkGenerateRun.logs.length===0&&<p className="text-sm opacity-50 italic p-2">Confirme para iniciar. O progresso aparecerá aqui.</p>}
	                  {bulkGenerateRun.logs.map(log => {
	                    const cls = log.type==='success'
	                      ? (darkMode?'text-green-400':'text-green-700')
	                      : log.type==='error'
	                        ? (darkMode?'text-red-400':'text-red-700')
	                        : log.type==='loading'
	                          ? (darkMode?'text-yellow-300':'text-yellow-700')
	                          : (darkMode?'text-gray-300':'text-gray-700');
	                    return (
	                      <div key={log.id} className={`text-sm rounded-lg px-3 py-2 ${darkMode?'bg-gray-900/40':'bg-gray-50'}`}>
	                        <span className="opacity-40 font-mono mr-2">{log.time}</span>
	                        <span className={cls}>{log.msg}</span>
	                      </div>
	                    );
	                  })}
	                </div>
	              </div>
	              <div className="flex gap-3">
	                <button disabled={bulkGenerateRun.running} onClick={()=>setBulkGenerateModal(null)} className={`flex-1 py-3 rounded-xl font-bold disabled:opacity-40 ${darkMode?'bg-gray-700 hover:bg-gray-600':'bg-gray-100 hover:bg-gray-200'}`}>{bulkGenerateRun.running?'Rodando...':'Cancelar'}</button>
	                <button onClick={closeOrStartBulk} disabled={bulkGenerateRun.running || !subject} className="flex-1 bg-yellow-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2">
	                  {bulkGenerateRun.running ? <Spinner className="w-4 h-4 text-white"/> : <Zap className="w-4 h-4"/>}
	                  {bulkGenerateRun.running ? 'Gerando...' : pending.length ? 'Confirmar e gerar' : 'Nada pendente'}
	                </button>
	              </div>
	            </div>
	          </div>
	        );
	      })()}
	      {errorModal&&<GModal title={errorModal.title} message={errorModal.message} link={errorModal.link} confirmText={errorModal.confirmText||'OK'} onConfirm={errorModal.onConfirm||(()=>setErrorModal(null))} onCancel={errorModal.onCancel||(()=>setErrorModal(null))} actionLabel={errorModal.actionLabel} onAction={errorModal.onAction} darkMode={darkMode} isAlert={errorModal.isAlert!==false}/>}
      {deleteId?.type==='subject'&&<GModal title="Excluir Assunto?" message="Esta ação é permanente." confirmText="Excluir" onConfirm={()=>{removeSubject(deleteId.id);setDeleteId(null);}} onCancel={()=>setDeleteId(null)} darkMode={darkMode}/>}
      {deleteId?.type==='folder'&&(()=>{
        const folder = libraryFolders.find(f=>f.id===deleteId.id);
        if (isProtectedMirrorRootFolder(folder)) {
          return null;
        }
        const folderIds = getFolderTreeIds(folder);
        const subjectCount = folder ? librarySubjects.filter(s => s.source === folder.source && folderIds.has(s.folderId)).length : 0;
        const childFolderCount = Math.max(0, folderIds.size - 1);
        return (
          <div className="modal-scroll fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-80 p-4" onClick={()=>setDeleteId(null)}>
            <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${darkMode?'bg-gray-900 border-gray-700 text-gray-100':'bg-white border-gray-200 text-gray-900'}`} onClick={e=>e.stopPropagation()}>
              <div className="flex items-start gap-4 mb-5">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode?'bg-red-900/30 text-red-400':'bg-red-50 text-red-600'}`}>
                  <Trash2 className="w-6 h-6"/>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">Excluir pasta</p>
                  <h3 className="text-xl font-serif font-bold text-yellow-600 truncate">{folder?.title || 'Pasta'}</h3>
                  <p className="text-sm opacity-60 mt-1">
                    Dentro dela: {childFolderCount} subpasta{childFolderCount!==1?'s':''} e {subjectCount} assunto{subjectCount!==1?'s':''}.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <button onClick={async()=>{await deleteFolderAndKeepContents(folder);setDeleteId(null);}}
                  className={`w-full p-4 rounded-xl border text-left transition-colors ${darkMode?'border-gray-700 hover:bg-gray-800':'border-gray-200 hover:bg-gray-50'}`}>
                  <span className="block font-bold text-sm">Excluir só a pasta</span>
                  <span className="block text-xs opacity-50 mt-1">Subpastas e assuntos serão movidos para a pasta anterior.</span>
                </button>
                <button onClick={async()=>{await deleteFolderWithContents(folder);setDeleteId(null);}}
                  className={`w-full p-4 rounded-xl border text-left transition-colors ${darkMode?'border-red-800 text-red-300 hover:bg-red-900/20':'border-red-200 text-red-700 hover:bg-red-50'}`}>
                  <span className="block font-bold text-sm">Excluir pasta e tudo dentro</span>
                  <span className="block text-xs opacity-60 mt-1">Apaga subpastas, assuntos e questões contidas nela. Ação permanente.</span>
                </button>
              </div>
              <button onClick={()=>setDeleteId(null)} className={`w-full mt-4 py-3 rounded-xl font-bold text-sm ${darkMode?'bg-gray-800 hover:bg-gray-700':'bg-gray-100 hover:bg-gray-200'}`}>
                Cancelar
              </button>
            </div>
          </div>
        );
      })()}
      {deleteId?.type==='academia-extra-bloco'&&<GModal title="Excluir bloco?" message="As questões deste bloco serão removidas da Academia e do Acervo do Oráculo." confirmText="Excluir" onConfirm={async()=>{
        const {blocoId, topicId, subjectId, oracleTopicId} = deleteId;
        // Remove from Academia subject
        const acSub = library.find(s=>s.id===subjectId);
        if(acSub){
          const updatedAcSub = {...acSub, topics: acSub.topics.map(t=>t.id===topicId?{...t,extraBattery:(t.extraBattery||[]).filter(b=>(b.id||`legacy_${(t.extraBattery||[]).indexOf(b)}`)!==blocoId)}:t)};
          await updateSubject(updatedAcSub);
        }
        // Remove from Oracle subject
        if(oracleTopicId){
          const oracleSub = library.find(s=>s.source==='gemini' && (s.topics||[]).some(t=>t.id===oracleTopicId));
          if(oracleSub){
            const updatedOracle = {...oracleSub, topics: oracleSub.topics.filter(t=>t.id!==oracleTopicId)};
            if(updatedOracle.topics.length===0) await removeSubject(oracleSub.id);
            else await updateSubject(updatedOracle);
          }
        }
        setDeleteId(null);
      }} onCancel={()=>setDeleteId(null)} darkMode={darkMode}/>}
      {deleteId?.type==='reset'&&<GModal title="Limpar Progresso?" message="Apagar todas as respostas deste bloco?" confirmText="Limpar" onConfirm={()=>{resetAnswers();setDeleteId(null);}} onCancel={()=>setDeleteId(null)} darkMode={darkMode}/>}
      {editingSub&&(()=>{
        const editableItem = library.find(x=>x.id===editingSub);
        if (isProtectedMirrorRootFolder(editableItem)) {
          return null;
        }
        return <GModal title="Renomear" message="" confirmText="Renomear" onConfirm={async()=>{if(editableItem)await updateSubject({...editableItem,title:editingSubName.trim()});setEditingSub(null);}} onCancel={()=>setEditingSub(null)} darkMode={darkMode}><input value={editingSubName} onChange={e=>setEditingSubName(e.target.value)} className={`w-full p-4 mb-6 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 font-bold ${darkMode?'bg-gray-700 border-gray-600 text-white':'bg-gray-50 border-gray-200'}`} autoFocus/></GModal>;
      })()}
      {editingTopic&&<GModal title="Renomear Bloco" message="" confirmText="Renomear" onConfirm={async()=>{if(!activeSubject)return;await updateSubject({...activeSubject,topics:activeSubject.topics.map(t=>t.id===editingTopic?{...t,title:editingTopicName.trim()}:t)});setEditingTopic(null);}} onCancel={()=>setEditingTopic(null)} darkMode={darkMode}><input value={editingTopicName} onChange={e=>setEditingTopicName(e.target.value)} className={`w-full p-4 mb-6 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 font-bold ${darkMode?'bg-gray-700 border-gray-600 text-white':'bg-gray-50 border-gray-200'}`} autoFocus/></GModal>}
    </div>
  );
}
