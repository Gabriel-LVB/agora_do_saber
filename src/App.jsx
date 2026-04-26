import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

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

// ─── ICONS ────────────────────────────────────────────────────────────────────
const ic = (d) => ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} dangerouslySetInnerHTML={{__html:d}}/>;
const Landmark    = ic('<polygon points="12 2 2 7 22 7 12 2"/><line x1="6" x2="6" y1="21" y2="7"/><line x1="10" x2="10" y1="21" y2="7"/><line x1="14" x2="14" y1="21" y2="7"/><line x1="18" x2="18" y1="21" y2="7"/><line x1="2" x2="22" y1="21" y2="21"/>');
const Flame       = ic('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>');
const ScrollText  = ic('<path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M15 8h-5"/><path d="M15 12h-5"/>');
const FolderIcon  = ic('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>');
const Feather     = ic('<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="6.5"/>');
const CheckCircle2= ic('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>');
const XCircle     = ic('<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>');
const BookOpen    = ic('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>');
const ArrowLeft   = ic('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>');
const ChevronDown = ic('<polyline points="6 9 12 15 18 9"/>');
const ChevronRight= ic('<polyline points="9 18 15 12 9 6"/>');
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
const SearchIcon  = ic('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>');
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
const FlipIcon    = ic('<path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.7L3 8"/><path d="M21 22v-6h-6"/><path d="M3 12a9 9 0 0 0 15 6.3l3-2.3"/>');
const PlayCircle  = ic('<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>');
const PlayIcon    = ic('<polygon points="5 3 19 12 5 21 5 3"/>');
const CheckIcon   = ic('<polyline points="20 6 9 17 4 12"/>');
const VideoIcon   = ic('<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>');
const SkipForward = ic('<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>');
const SkipBack    = ic('<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>');

const GoogleIcon  = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24" height="24" className={className}><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>;
const Spinner = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{animation:'spin 1s linear infinite',transformOrigin:'center'}}><style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
// Order of subjects following the course chronogram
const SUBJECT_ORDER = ['Nefrologia','Cirurgia','Ginecologia','Preventiva','Obstetricia','Pediatria','Reumatologia','Hematologia','Gastrologia','Hepatologia','Cardiologia','Endocrinologia','Pneumologia','Infectologia','Neurologia','Psiquiatria','Ortopedia','Dermatologia','Oftalmologia'];

const MAX_MATERIAL_CHARS = 180000;
const VIDEOAULAS_ALLOWED_EMAILS = [
  'lucasferreira.paz31@gmail.com',
  'ruanmotahz@gmail.com',
  'caiolucca125@gmail.com',
  'matheustene@gmail.com',
  'lucasteles42@gmail.com',
  'gabrielvieiraxc12@gmail.com',
];
const LOADING_MSGS = ["O Oráculo está consultando os pergaminhos...","Formulando os enunciados clínicos...","Elaborando as alternativas...","Revisando a semiologia...","Correlacionando fisiopatologia...","Quase pronto, aguarde...","Gerações longas levam até 60s...","O Oráculo não abandona seus discípulos..."];
// Extract unique ID from Bunny embed_url
const getAulaId = (aula) => {
  if (!aula) return null;
  const m = (aula.embed_url||'').match(/\/embed\/\d+\/([a-f0-9\-]{30,})/i);
  return m ? m[1] : (aula.embed_url || aula.path || '');
};

// Clean raw filenames like "VIDEOAULA_S19_MEDCURSO_GAS1_Acalasia" → "Acalasia"
const cleanAulaTitle = (title) => {
  if (!title) return '';
  // Strip all-caps prefix codes + underscores: "VIDEOAULA_S19_MEDCURSO_GAS1_" → ""
  let t = title
    .replace(/^(?:VIDEOAULA|AULA[_ ]B[ÔO]NUS|AULABONUS)[_\s]+S?\d+_?(?:MEDCURSO_)?[A-Z0-9]+_?(?:BLOCO\d+_?)?/i, '')
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
const callGemini = async (prompt, systemPrompt, apiKey, images=[]) => {
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const parts = [{text:prompt}];
  images.forEach(img => parts.push({inline_data:{mime_type:img.mimeType,data:img.base64}}));
  const payload = {contents:[{parts}],systemInstruction:{parts:[{text:systemPrompt}]}};
  // NOTE: 503 only retries once — each failed request counts against quota
  const attempt = async (triesLeft, delay) => {
    const res = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if (res.status===503) {
      if (triesLeft<=1) throw new Error("SERVER_OVERLOADED");
      await new Promise(r=>setTimeout(r,delay));
      return attempt(triesLeft-1, delay*2);
    }
    if (res.status===429) throw new Error("QUOTA_EXCEEDED");
    if ([400,403,404].includes(res.status)) throw new Error("API_KEY_INVALID");
    if (!res.ok) throw new Error("CONNECTION_ERROR");
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  };
  return attempt(2, 3000); // max 2 attempts for 503
};

const callGeminiStream = async (prompt, systemPrompt, apiKey, onProgress, images=[]) => {
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`;
  const parts = [{text:prompt}];
  images.forEach(img => parts.push({inline_data:{mime_type:img.mimeType,data:img.base64}}));
  const res = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts}],systemInstruction:{parts:[{text:systemPrompt}]}})});
  if (res.status===429) throw new Error("QUOTA_EXCEEDED");
  if (res.status===503) throw new Error("SERVER_OVERLOADED");
  if ([400,403,404].includes(res.status)) throw new Error("API_KEY_INVALID");
  if (!res.ok) throw new Error("CONNECTION_ERROR");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = '';
  while (true) {
    const {done,value} = await reader.read();
    if (done) break;
    const lines = dec.decode(value,{stream:true}).split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')&&!line.includes('[DONE]')) {
        try { const j=JSON.parse(line.slice(6)); const t=j.candidates?.[0]?.content?.parts?.[0]?.text||''; if(t){full+=t; onProgress(full,(full.match(/##\s*Quest[aã]o\s*\d/gi)||[]).length);} } catch(e){}
      }
    }
  }
  return full;
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
const loadScript = (src, gv) => new Promise((res,rej)=>{ if(window[gv]) return res(window[gv]); const s=document.createElement('script'); s.src=src; s.onload=()=>res(window[gv]); s.onerror=()=>rej(new Error(`Failed: ${src}`)); document.head.appendChild(s); });
const extractPdfText = async (ab) => { const lib = await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js','pdfjsLib'); lib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; const pdf=await lib.getDocument({data:ab}).promise; let t=''; for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const c=await pg.getTextContent();t+=c.items.map(x=>x.str).join(' ')+'\n';} return t; };
const extractDocxText = async (ab) => { const m = await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js','mammoth'); const r=await m.extractRawText({arrayBuffer:ab}); return r.value; };

const parseData = (text) => {
  const norm = text.replace(/\r\n/g,'\n');

  // Legacy summary
  let summary = '';
  const sm = norm.match(/(?:^|\n)(?:###|##|\*\*)?\s*Resumo(?: de Consolida[çc][aã]o)?\s*\n([\s\S]*)$/i);
  if (sm?.[1]) summary = sm[1].replace(/\n---.*/g,'').trim();

  const questions = [];

  // Split by question headers — only at start of line
  // Handles: "## Questão 1", "1)", "1.", "Questão 1", "Q1)"
  const blocks = norm.split(/(?=(?:^|\n)[ \t]*(?:(?:\*\*|##)[ \t]*)?Quest[aã]o[ \t]*\d|(?:^|\n)[ \t]*\d{1,2}[ \t]*[).][ \t])/im)
    .filter(b => b.trim());

  let qCount = 0;

  blocks.forEach((block) => {
    if (!block.trim()) return;

    // Must have lettered options on their own line
    const hasOptions = /(?:^|\n)[ \t]*[A-Ea-e][ \t]*[).][ \t]*\S/.test(block);
    if (!hasOptions) return;

    try {
      // Question ID
      const idM = block.match(/(?:\*\*|##)?[ \t]*Quest[aã]o[ \t]*([0-9.]+)/i) ||
                  block.match(/(?:^|\n)[ \t]*(\d{1,2})[ \t]*[).]/m);
      const id = idM ? idM[1] : `${++qCount}`;

      // First option position
      const firstOptMatch = block.match(/(?:^|\n)([ \t]*[Aa][ \t]*[).][ \t]*\S)/);
      if (!firstOptMatch) return;
      const firstOptIdx = block.indexOf(firstOptMatch[0]);

      // Statement: text before first option
      // Handle "1) Question text here" (inline) and multi-line statements
      const inlineM = block.match(/(?:^|\n)[ \t]*\d{1,2}[ \t]*[).][ \t]*([^\n]{5,})/m);
      const qHeaderM = block.match(/(?:\*\*|##)?[ \t]*Quest[aã]o[^\n]*\n/i);
      let stmt = '';
      if (inlineM && inlineM.index <= firstOptIdx) {
        stmt = inlineM[1].trim();
        // grab continuation lines
        const contStart = block.indexOf(inlineM[0]) + inlineM[0].length;
        if (contStart < firstOptIdx) stmt += ' ' + block.substring(contStart, firstOptIdx).trim();
      } else if (qHeaderM) {
        stmt = block.substring(qHeaderM.index + qHeaderM[0].length, firstOptIdx).trim();
      } else {
        stmt = block.substring(0, firstOptIdx).trim();
      }
      stmt = stmt.trim();
      if (!stmt || stmt.length < 5) return;

      // Answer marker
      const ansM =
        block.match(/(?:[Aa]lternativa[ \t]+correta|[Gg]abarito|[Rr]esposta(?:[ \t]+correta)?)[ \t]*[:\-][ \t]*\*{0,2}[ \t]*\(?([A-Ea-e])\)?/im);

      let correct = null;
      let optionsEnd = block.length;

      if (ansM) {
        correct = ansM[1].toUpperCase();
        optionsEnd = ansM.index;
      } else {
        // Standalone line with ONLY a letter after options
        const stM = block.match(/\n[ \t]*\(?([A-Ea-e])\)?[ \t]*(?:\n|$)/m);
        if (stM && stM.index > firstOptIdx + 10) {
          correct = stM[1].toUpperCase();
          optionsEnd = stM.index;
        }
      }

      // Parse options
      const optText = block.substring(firstOptIdx, optionsEnd);
      const options = [];
      const optRe = /(?:^|\n)[ \t]*\(?([A-Ea-e])[ \t]*[).][ \t]*([\s\S]*?)(?=(?:\n[ \t]*\(?[A-Ea-e][ \t]*[).])|\n[ \t]*$|$)/gim;
      let m;
      while ((m = optRe.exec(optText)) !== null) {
        const letter = m[1].toUpperCase();
        const txt = m[2].replace(/\*\*/g,'').replace(/\n/g,' ').trim();
        if (txt) options.push({ letter, txt });
      }
      if (options.length < 2) return;

      // Explanation
      let exp = '';
      const expM = block.match(/(?:Explica[çc][aã]o|Corre[çc][aã]o|Coment[áa]rio|Justificativa|Fundamento)[ \t]*:([\s\S]*?)(?=\n[ \t]*(?:---|Quest[aã]o|\d{1,2}[ \t]*[).])  |$)/i);
      if (expM) exp = expM[1].trim();
      else if (ansM) {
        const after = block.substring(ansM.index + ansM[0].length).trim();
        if (after.length > 5) exp = after;
      }

      // Build final question
      if (correct) {
        const ctTxt = options.find(o => o.letter === correct)?.txt;
        if (!ctTxt) return;
        const shuffled = [...options.map(o => o.txt)].sort(() => Math.random() - 0.5);
        const final = shuffled.map((t, i) => ({ letter: 'ABCDE'[i], text: t, isCorrect: t === ctTxt }));
        questions.push({ id, statement: stmt, options: final, explanation: exp });
      } else {
        // No answer key — import without correct answer marked
        const final = options.map((o, i) => ({ letter: 'ABCDE'[i], text: o.txt, isCorrect: false }));
        questions.push({ id, statement: stmt, options: final, explanation: '(Gabarito não fornecido — adicione "Gabarito: X" ao texto para marcar a resposta correta.)' });
      }
    } catch(e) {}
  });

  return { questions, summary };
};


// Parse HTML-like tags in explanation text from Gemini
const parseHtmlText = (text, darkMode) => {
  if (!text) return null;
  // Handle **bold**, <b>bold</b>, <i>italic</i>, <br>
  const parts = text.split(/(\*\*.*?\*\*|<b>.*?<\/b>|<i>.*?<\/i>|<br\s*\/?>)/g);
  return <React.Fragment>{parts.map((p,i)=>{
    if (p.startsWith('**')&&p.endsWith('**')) return <strong key={i} className="font-bold">{p.slice(2,-2)}</strong>;
    if (p.startsWith('<b>')&&p.endsWith('</b>')) return <strong key={i} className="font-bold">{p.slice(3,-4)}</strong>;
    if (p.startsWith('<i>')&&p.endsWith('</i>')) return <em key={i}>{p.slice(3,-4)}</em>;
    if (p.match(/^<br\s*\/?>$/)) return <br key={i}/>;
    return <span key={i}>{p}</span>;
  })}</React.Fragment>;
};

// Full markdown parser for chat messages (handles newlines + bold)
const parseHtmlTextChat = (text, darkMode) => {
  if (!text) return null;
  return text.split('\n').map((line, li, arr) => {
    const parts = line.split(/(\*\*.*?\*\*|<b>.*?<\/b>)/g);
    return (
      <React.Fragment key={li}>
        {parts.map((p,pi)=>{
          if (p.startsWith('**')&&p.endsWith('**')) return <strong key={pi} className="font-bold">{p.slice(2,-2)}</strong>;
          if (p.startsWith('<b>')&&p.endsWith('</b>')) return <strong key={pi} className="font-bold">{p.slice(3,-4)}</strong>;
          return <span key={pi}>{p}</span>;
        })}
        {li < arr.length-1 && <br/>}
      </React.Fragment>
    );
  });
};


const ChatBox = ({ question, darkMode, apiKey, oracleLength='medium' }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  useEffect(()=>{ if(open) bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[messages,open]);
  const send = async () => {
    if (!input.trim()||loading) return;
    const msg = input.trim(); setInput('');
    setMessages(p=>[...p,{role:'user',text:msg}]);
    setLoading(true);
    try {
      const ctx = `Questão: ${question.statement}\n\nAlternativas:\n${question.options.map(o=>`${o.letter}) ${o.text}${o.isCorrect?' ✓':''}`).join('\n')}\n\nExplicação: ${question.explanation}`;
      const sys = `Você é o Oráculo de Medicina da Ágora do Saber. ${ORACLE_LENGTH[oracleLength]?.inst||''} Responda com precisão clínica. Contexto:\n${ctx}`;
      const hist = messages.map(m=>`${m.role==='user'?'Estudante':'Oráculo'}: ${m.text}`).join('\n');
      const r = await callGemini(`${hist}\nEstudante: ${msg}`,sys,apiKey);
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
        <div className={`mt-3 rounded-xl border overflow-hidden ${darkMode?'border-gray-700':'border-gray-200'}`}>
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
          <div className={`flex items-center gap-1.5 px-3 pt-2 pb-1 border-t ${darkMode?'border-gray-700 bg-gray-800':'border-gray-100 bg-white'}`}>
            <span className={`text-xs mr-1 ${darkMode?'text-gray-500':'text-gray-400'}`}>Explicar:</span>
            {question.options.map(opt=>(
              <button key={opt.letter}
                onClick={()=>{ const msg=`Por que a alternativa ${opt.letter}) está ${opt.isCorrect?'correta':'incorreta'}? Explique detalhadamente.`; setMessages(p=>[...p,{role:'user',text:msg}]); setLoading(true); (async()=>{ try{ const ctx=`Questão: ${question.statement}\n\nAlternativas:\n${question.options.map(o=>`${o.letter}) ${o.text}${o.isCorrect?' ✓':''}`).join('\n')}\n\nExplicação: ${question.explanation}`; const sys=`Você é o Oráculo de Medicina da Ágora do Saber. ${ORACLE_LENGTH[oracleLength]?.inst||''} Contexto:\n${ctx}`; const r=await callGemini(msg,sys,apiKey); setMessages(p=>[...p,{role:'assistant',text:r}]); }catch(e){setMessages(p=>[...p,{role:'assistant',text:'Tente novamente.'}]);}finally{setLoading(false);} })(); }}
                className={`text-xs font-bold px-2 py-1 rounded-lg transition-colors ${opt.isCorrect?(darkMode?'bg-green-800 text-green-200 hover:bg-green-700':'bg-green-100 text-green-700 hover:bg-green-200'):(darkMode?'bg-gray-700 text-gray-300 hover:bg-gray-600':'bg-gray-100 text-gray-500 hover:bg-gray-200')}`}>
                {opt.letter}
              </button>
            ))}
          </div>
          <div className={`flex gap-2 p-3 ${darkMode?'bg-gray-800':'bg-white'}`}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Digite sua dúvida..." className={`flex-1 text-sm p-2 rounded-lg outline-none ${darkMode?'bg-gray-700 text-white placeholder-gray-500':'bg-gray-50 text-gray-800'}`}/>
            <button onClick={send} disabled={!input.trim()||loading} className="p-2 bg-yellow-600 text-white rounded-lg disabled:opacity-40 hover:bg-yellow-700"><Send className="w-4 h-4"/></button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── QUESTION CARD ────────────────────────────────────────────────────────────
const QuestionCard = ({ question, index, selectedLetter, onAnswer, darkMode, isFavorite, onToggleFavorite, apiKey, oracleLength, revealMode='normal' }) => {
  // revealMode: 'normal' (immediate), 'selected' (blind - no green/red), 'revealed' (blind - show results)
  // Fix 3: treat 'SKIPPED' as answered-wrong (show correct answer but no wrong highlight)
  const isSkipped = selectedLetter === 'SKIPPED';
  const effectiveLetter = isSkipped ? null : selectedLetter;
  const isAnswered = effectiveLetter != null;
  const showResults = (revealMode==='normal' && isAnswered) || (revealMode==='revealed' && (isAnswered || isSkipped));
  const correctLetter = question.options.find(o=>o.isCorrect)?.letter;
  const isCorrect = isAnswered && correctLetter === effectiveLetter;

  return (
    <div className={`rounded-xl shadow-sm border p-4 md:p-6 mb-6 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${darkMode?'bg-yellow-900/30 text-yellow-300':'bg-yellow-100 text-yellow-800'}`}>Questão {question.id}</span>
          {isSkipped && <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">Em branco</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleFavorite} className={`p-1 rounded-full transition-colors ${isFavorite?'text-red-500':'text-gray-300 hover:text-red-400'}`}><Heart className="w-5 h-5" filled={isFavorite}/></button>
        </div>
      </div>
      <div className={`text-base md:text-lg mb-6 leading-relaxed whitespace-pre-wrap ${darkMode?'text-gray-200':'text-gray-800'}`}>{parseHtmlText(question.statement,darkMode)}</div>
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
              <div className="pt-1 flex-1 leading-snug text-sm md:text-base">{parseHtmlText(opt.text,darkMode)}</div>
            </button>
          );
        })}
      </div>
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
          <div className="text-base leading-relaxed">{parseHtmlText(question.explanation,darkMode)}</div>
          {apiKey && <ChatBox question={question} darkMode={darkMode} apiKey={apiKey} oracleLength={oracleLength}/>}
        </div>
      )}
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
      qs.forEach(q => {
        body += `<div style="margin-bottom:28px;page-break-inside:avoid;border-bottom:1px solid #e5e7eb;padding-bottom:16px">
<p style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;font-family:sans-serif;margin:0 0 4px">Questão ${q.id}</p>
<p style="font-size:15px;margin:8px 0 12px;line-height:1.6">${escape(q.statement)}</p>
${q.options.map(o=>`<div style="margin:4px 0;padding:6px 10px;border-radius:6px;font-size:13px;border:1px solid #e5e7eb">${o.letter}) ${escape(o.text)}</div>`).join('')}
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
<p style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;font-family:sans-serif;margin:0 0 4px">Questão ${q.id}</p>
<p style="font-size:15px;margin:8px 0 12px;line-height:1.6">${escape(q.statement)}</p>
${q.options.map(o=>`<div style="margin:4px 0;padding:6px 10px;border-radius:6px;font-size:13px;border:1px solid #e5e7eb">${o.letter}) ${escape(o.text)}</div>`).join('')}
</div>`;
        // Spacer — big enough so the answer below isn't accidentally seen
        body += `<div style="border-top:2px dashed #e5e7eb;margin:32px 0 8px;padding-top:8px">
<p style="font-size:10px;color:#d1d5db;text-align:center;letter-spacing:.1em;font-family:sans-serif;text-transform:uppercase">✂ gabarito ✂</p>
</div>`;
        // Answer + explanation
        body += `<div style="margin-bottom:${isLast?'16px':'48px'};padding:14px 16px;background:#f0fdf4;border-radius:8px;border-left:4px solid #22c55e;page-break-inside:avoid">
<p style="font-weight:bold;color:#15803d;margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.04em">✓ Gabarito — Questão ${q.id}</p>
${q.options.map(o=>`<div style="margin:4px 0;padding:6px 10px;border-radius:6px;font-size:13px;${o.isCorrect?'background:#d1fae5;font-weight:bold;color:#065f46;border:1px solid #6ee7b7':'border:1px solid transparent;color:#6b7280'}">${o.letter}) ${escape(o.text)}</div>`).join('')}
<div style="background:#fef3c7;padding:12px 16px;margin-top:10px;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;font-size:13px;line-height:1.6">${escape(q.explanation)}</div>
</div>
${!isLast ? '<hr style="border:none;border-top:3px solid #e5e7eb;margin:8px 0 40px">' : ''}`;
      });
    } else { // exam mode
      body += '<h2 style="margin-top:24px;font-family:Georgia,serif;color:#374151">QUESTÕES</h2>';
      qs.forEach(q => {
        body += `<div style="margin-bottom:28px;page-break-inside:avoid">
<p style="font-size:11px;color:#9ca3af;text-transform:uppercase;font-family:sans-serif;margin:0 0 4px">Questão ${q.id}</p>
<p style="font-size:15px;margin:8px 0 12px;line-height:1.6">${escape(q.statement)}</p>
${q.options.map(o=>`<div style="margin:4px 0;padding:6px 10px;border-radius:6px;font-size:13px;border:1px solid #e5e7eb">${o.letter}) ${escape(o.text)}</div>`).join('')}
</div>`;
      });
      body += '<div style="page-break-before:always"><h2 style="font-family:Georgia,serif;color:#92400e;border-bottom:2px solid #92400e;padding-bottom:8px">GABARITO E COMENTÁRIOS</h2>';
      qs.forEach(q => {
        const corr = q.options.find(o=>o.isCorrect);
        body += `<div style="margin-bottom:20px;padding:12px 16px;border-radius:8px;background:#f9fafb;border:1px solid #e5e7eb">
<p style="font-weight:bold;margin:0 0 4px;font-size:13px">Questão ${q.id}: <span style="color:#065f46">${corr?.letter}) ${escape(corr?.text||'')}</span></p>
<p style="font-size:12px;margin:0;color:#374151;line-height:1.5">${escape(q.explanation)}</p>
</div>`;
      });
      body += '</div>';
    }
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:24px;color:#111}@media print{body{padding:10px}}</style></head><body>${body}</body></html>`;
  };

  const handleExport = () => {
    const html = buildHtml();
    if (fmt==='pdf') {
      const w = window.open('','_blank');
      w.document.write(html); w.document.close(); w.print();
    } else {
      const blob = new Blob([`<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'></head><body>${buildHtml()}</body></html>`],{type:'application/msword'});
      const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
      a.download=`${topic.title.substring(0,40)}.doc`; a.click();
    }
    onClose();
  };

  const opts = [
    {k:'study',  icon:'📖', title:'Modo Estudo',   desc:'Questão sem resposta → ✂ separador → gabarito+explicação. Faça as questões offline!'},
    {k:'exam',   icon:'📋', title:'Modo Simulado', desc:'Todas as questões primeiro, gabarito completo ao final'},
    {k:'blank',  icon:'📝', title:'Só Questões',   desc:'Apenas perguntas e alternativas, sem nenhuma resposta'},
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
      <div className={`w-full max-w-md rounded-2xl border p-8 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
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
          {[{k:'pdf',l:'📄 PDF'},{k:'word',l:'📘 Word (.doc)'}].map(f=>(
            <button key={f.k} onClick={()=>setFmt(f.k)} className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${fmt===f.k?(darkMode?'border-yellow-500 bg-yellow-900/20 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-700 text-gray-400':'border-gray-200 text-gray-600')}`}>{f.l}</button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className={`flex-1 py-3 rounded-xl font-bold ${darkMode?'bg-gray-700 hover:bg-gray-600':'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
          <button onClick={handleExport} className="flex-1 py-3 bg-yellow-600 text-white rounded-xl font-bold hover:bg-yellow-700">Exportar</button>
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
              `  ${i+1}. ${q.statement.substring(0,100).replace(/\n/g,' ')}...\n     ✓ ${q.options.find(o=>o.isCorrect)?.text||''} | ${q.explanation.substring(0,200).replace(/\n/g,' ')}...`
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
          `${i+1}. ${q.statement.substring(0,120).replace(/\n/g,' ')}...\n   ✓ ${q.options.find(o=>o.isCorrect)?.text||''}\n   ${q.explanation.substring(0,300).replace(/\n/g,' ')}...`
        ).join('\n\n');
      } else if (subtopics.length > 0) {
        // Single topic, no questions — use subtopics
        contextBlock = `Subtópicos do tópico: ${subtopics.join(', ')}`;
      }

      const scope = topicContexts ? `da pasta "${topicTitle}" (${topicContexts.length} tópicos)` : `do tópico "${topicTitle}"${subjectTitle ? ` (${subjectTitle})` : ''}`;

      const prompt = `Crie o BIZUÁRIO ${scope}.

${contextBlock ? `CONTEÚDO BASE:\n${contextBlock}\n` : ''}
OBJETIVO: Uma cola de revisão ultra-rápida. O estudante vai ler isso 2 minutos antes da prova.

FORMATO OBRIGATÓRIO:
- Parágrafos corridos, densos, sem bullet points
- Baseie-se no conteúdo acima — cubra os mesmos conceitos de forma sintética
- Destaque o que mais aparece nas questões e explicações
- Valores numéricos, critérios diagnósticos, associações clássicas
- Mnemônicos quando úteis ("3 Ds de...", "pensar em X quando Y")
- ${topicContexts ? 'Máximo 600 palavras, abordando todos os tópicos' : 'Máximo 400 palavras — densidade máxima, zero enrolação'}`;

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className={`w-full max-w-2xl rounded-2xl border flex flex-col ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}
        style={{maxHeight:'85vh'}}
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
            <button onClick={onClose} className={`p-2 rounded-full font-bold text-lg leading-none transition-colors ${darkMode?'hover:bg-gray-700 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>✕</button>
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

// ─── GRACIAN MODAL ────────────────────────────────────────────────────────────
// "L" hand in sign language — icon for error modals
const LHandIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* Palm */}
    <rect x="8" y="9" width="5" height="10" rx="2.5"/>
    {/* Index finger pointing up */}
    <rect x="8" y="2" width="3" height="9" rx="1.5"/>
    {/* Thumb pointing right */}
    <rect x="8" y="13" width="9" height="3" rx="1.5"/>
  </svg>
);

// Error configs per type — titles, messages, actions
const ERROR_CONFIGS = {
  QUOTA_EXCEEDED: {
    title: 'Cota da Chave Excedida',
    message: 'Esta chave API atingiu o limite de requisições gratuitas (20/dia). Você pode:\n• Aguardar a renovação (reseta à meia-noite)\n• Cadastrar outra chave gratuita nas Configurações\n• Usar uma chave diferente da conta Google',
    link: { label: 'Criar nova chave gratuita', url: 'https://aistudio.google.com/app/apikey' },
  },
  API_KEY_INVALID: {
    title: 'Chave API Inválida',
    message: 'A chave cadastrada não foi aceita pelo Gemini. Verifique:\n• Se a chave foi copiada corretamente (sem espaços)\n• Se a chave é de um projeto ativo no Google AI Studio\n• Se a API Gemini está habilitada no projeto',
    link: { label: 'Verificar minhas chaves', url: 'https://aistudio.google.com/app/apikey' },
  },
  API_KEY_MISSING: {
    title: 'Nenhuma Chave Cadastrada',
    message: 'Você ainda não cadastrou uma chave API do Gemini. A chave é gratuita e necessária para gerar questões.',
    link: { label: 'Criar chave gratuita agora', url: 'https://aistudio.google.com/app/apikey' },
  },
  SERVER_OVERLOADED: {
    title: 'Servidores do Gemini Sobrecarregados',
    message: 'O Gemini está temporariamente indisponível (erro 503). Este problema é no lado do Google e se resolve sozinho em alguns minutos. Aguarde 2–5 minutos e tente novamente.',
    link: { label: 'Ver status do Google AI', url: 'https://status.cloud.google.com' },
  },
  CONNECTION_ERROR: {
    title: 'Falha de Conexão',
    message: 'Não foi possível conectar ao Gemini. Verifique sua conexão com a internet e tente novamente.',
    link: null,
  },
};

const GModal = ({ title, message, onConfirm, onCancel, confirmText='OK', darkMode, children, isAlert=false, actionLabel, onAction, link }) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4">
    <div className={`w-full max-w-md rounded-2xl shadow-2xl border p-8 ${darkMode?'bg-gray-800 border-gray-700 text-gray-100':'bg-white border-gray-200 text-gray-900'}`}>
      <div className="flex flex-col items-center text-center">
        <div className={`p-4 rounded-full mb-4 ${darkMode?'bg-yellow-900/30':'bg-yellow-100'}`}><Flame className="w-8 h-8 text-yellow-600"/></div>
        <h3 className="text-xl font-serif font-bold mb-3">{title}</h3>
        <p className="mb-4 opacity-70 text-sm whitespace-pre-line leading-relaxed">{message}</p>
        {link&&<a href={link.url} target="_blank" rel="noreferrer" className="mb-4 text-sm font-bold text-yellow-600 hover:underline flex items-center gap-1">{link.label} ↗</a>}
        {children}
        <div className="flex gap-3 w-full mt-2">
          {!isAlert&&<button onClick={onCancel} className={`flex-1 py-3 rounded-xl font-bold ${darkMode?'bg-gray-700 hover:bg-gray-600':'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>}
          {actionLabel&&onAction
            ?<button onClick={onAction} className="flex-1 py-3 text-white rounded-xl font-bold bg-yellow-600 hover:bg-yellow-700">{actionLabel}</button>
            :<button onClick={onConfirm} className={`flex-1 py-3 text-white rounded-xl font-bold ${isAlert?'bg-yellow-600 hover:bg-yellow-700':'bg-red-600 hover:bg-red-700'}`}>{confirmText}</button>}
        </div>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
const defaultSettings = { numTopics:10,numSubtopics:5,qPerSub:1,numAlternatives:5,customPrompt:'',apiKey:'',apiKey1:'',apiKey2:'',apiKey3:'',activeKeyIndex:1,oracleLength:'medium' };

export default function QuestionBankApp() {
  const isCanvas = window.location.hostname.includes('scf.usercontent.goog')||window.location.hostname.includes('localhost')||window.location.hostname==='127.0.0.1';

  // ── Theme ─────────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(()=>{ try { return JSON.parse(localStorage.getItem('qb_dark')||'false'); } catch(e){return false;} });
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
  const [library, setLibrary]     = useState([]);

  // ── Settings ──────────────────────────────────────────────────────────────
  const [settings, setSettingsS]  = useState(defaultSettings);
  const settingsRef               = useRef(defaultSettings);
  const setSettings = (s) => { setSettingsS(s); settingsRef.current=s; };

  // ── Navigation ────────────────────────────────────────────────────────────
  const [view, setView]                 = useState('library');
  const [libFilter, setLibFilter]       = useState('gemini');
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
  const [loadingMsg, setLoadingMsg]   = useState('');
  const [streamCount, setStreamCount] = useState(0);
  const [deleteId, setDeleteId]       = useState(null);

  const [errorModal, setErrorModal]   = useState(null);
  const [regenModal, setRegenModal]   = useState(false);
  const [regenPrompt, setRegenPrompt] = useState('');
  const [editingSub, setEditingSub]   = useState(null);
  const [editingSubName, setEditingSubName] = useState('');
  const [editingTopic, setEditingTopic] = useState(null);
  const [editingTopicName, setEditingTopicName] = useState('');

  // ── Paste ─────────────────────────────────────────────────────────────────
  const [pasteText, setPasteText]     = useState('');
  const [pasteSubName, setPasteSubName] = useState('');
  const [pasteTopic, setPasteTopic]   = useState('');
  const [showSubSugs, setShowSubSugs] = useState(false);

  // ── Features ──────────────────────────────────────────────────────────────
  const [showOnlyWrong, setShowOnlyWrong] = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchOpen, setSearchOpen]     = useState(false);

  // Exam
  const [examSetup, setExamSetup]       = useState(null);
  const [activeExam, setActiveExam]     = useState(null);
  const [examTime, setExamTime]         = useState(60);
  const [examQCount, setExamQCount]     = useState(30);
  const [examTopics, setExamTopics]     = useState([]);
  const [examBlind, setExamBlind]       = useState(false); // show corrections after finish

  // Review
  const [reviewQs, setReviewQs]         = useState([]);
  const [reviewAns, setReviewAns]       = useState({});
  const [reviewSchedule, setReviewSchedule] = useState(false); // show schedule

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
  const [watchedAulas, setWatchedAulas] = useState({});  // { bunny_id: true }
  const [expandedSubjectsVid, setExpandedSubjectsVid] = useState({});

  // Load videoaulas JSON from Firestore on first visit
  useEffect(() => {
    if (view !== 'videoaulas' || !user || videoaulasData) return;
    setVideoaulasLoading(true);
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'videoaulas', 'estrutura'));
        if (snap.exists()) {
          const d = snap.data().json;
          setVideoaulasData(typeof d === 'string' ? JSON.parse(d) : d);
        } else { setVideoaulasData({}); }
        const ps = await getDoc(doc(db, 'users', user.uid, 'videoaulas_progress', 'watched'));
        if (ps.exists()) setWatchedAulas(ps.data() || {});
      } catch(e) { setVideoaulasData({}); }
      finally { setVideoaulasLoading(false); }
    })();
  }, [view, user, videoaulasData]); // eslint-disable-line

  const markAulaWatched = async (bunnyId) => {
    if (!bunnyId) return;
    const already = !!watchedAulas[bunnyId];
    const u = { ...watchedAulas };
    if (already) { delete u[bunnyId]; } else { u[bunnyId] = true; }
    setWatchedAulas(u);
    if (user && !user.isAnonymous) try {
      // Use setDoc (not merge) to write the full clean object so deletes persist
      await setDoc(doc(db,'users',user.uid,'videoaulas_progress','watched'), u);
    } catch(e) {}
  };

  const resetWatchedProgress = async () => {
    setWatchedAulas({});
    if (user && !user.isAnonymous) try {
      await setDoc(doc(db,'users',user.uid,'videoaulas_progress','watched'), {});
    } catch(e) {}
  };

  useEffect(()=>{
    document.title='Ágora do Saber';
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><polygon points="12 2 2 7 22 7 12 2"/><line x1="6" x2="6" y1="21" y2="7"/><line x1="10" x2="10" y1="21" y2="7"/><line x1="14" x2="14" y1="21" y2="7"/><line x1="18" x2="18" y1="21" y2="7"/><line x1="2" x2="22" y1="21" y2="21"/></svg>`;
    let lnk=document.querySelector("link[rel~='icon']")||document.createElement('link');
    lnk.rel='icon'; lnk.href=`data:image/svg+xml;base64,${window.btoa(svg)}`;
    if(!document.querySelector("link[rel~='icon']")) document.head.appendChild(lnk);
    document.body.style.backgroundColor=darkMode?'#111827':'#fafaf9';
    localStorage.setItem('qb_dark',JSON.stringify(darkMode));
  },[darkMode]);

  // Android/browser back button — navigates within the app instead of leaving
  useEffect(() => {
    const handlePop = (e) => {
      if (view === 'library') return; // allow leaving the site from home
      e.preventDefault();
      // Navigate back logically
      if (view === 'topic')        { setView('subject'); return; }
      if (view === 'subject')      { setView('sub-library'); return; }
      if (view === 'sub-library')  { setView('library'); return; }
      if (view === 'creator')      { setCreatorStep(1); setView('library'); return; }
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
      // Search shortcut
      if (e.key==='/'&&!searchOpen) { e.preventDefault(); setSearchOpen(true); return; }
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
    const unsub = onAuthStateChanged(auth, async(u)=>{
      if (u) {
        setUser(u);
        if (u.isAnonymous) {
          const ln=localStorage.getItem('qb_username');
          if (ln) { setUsername(ln.toUpperCase()); try{const s=localStorage.getItem(`qb_settings_${ln}`);if(s)setSettings({...defaultSettings,...JSON.parse(s)});}catch(e){} }
          else setLoginView('signup');
        } else {
          try {
            const ud=await getDoc(doc(db,'users',u.uid));
            if(ud.exists()){const d=ud.data();setUsername(d.username.toUpperCase());setSettings({...defaultSettings,...(d.settings||{}),apiKey:d.apiKey||''});}
            else setLoginView('signup');
          } catch(e){}
        }
      } else { setUser(null);setUsername(null);setLoginView('login'); }
      setAuthReady(true);
    });
    return ()=>unsub();
  },[]);

  // Library sync
  useEffect(()=>{
    if(!user||!username) return;
    const defFolder=[{id:'imported-folder',title:'Pergaminhos Diversos',fullSyllabus:'Questões importadas.',source:'external',topics:[]}];
    if(user.isAnonymous){
      try{const s=localStorage.getItem(`qb_lib_${username}`);setLibrary(s?JSON.parse(s):defFolder);}catch(e){setLibrary(defFolder);}
      return;
    }
    const libRef=collection(db,'users',user.uid,'library');
    const u1=onSnapshot(libRef,(snap)=>{const d=snap.docs.map(x=>x.data()).sort((a,b)=>b.id-a.id);setLibrary(d.length?d:defFolder);});
    return ()=>u1();
  },[user,username]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeSubject = library.find(s=>s.id===activeSubjectId);
  const activeTopic   = activeSubject?.topics.find(t=>t.id===activeTopicId);
  const displayedQs   = (() => {
    if (!activeTopic) return [];
    if (showOnlyWrong) return activeTopic.questions.filter(q=>{ const a=activeTopic.answers?.[q.id]; return a&&a!==q.options.find(o=>o.isCorrect)?.letter; });
    return activeTopic.questions;
  })();

  // ── DB helpers ─────────────────────────────────────────────────────────────
  const updateSubject = async (s) => {
    setLibrary(p=>p.map(x=>x.id===s.id?s:x));
    if(user&&!user.isAnonymous) await setDoc(doc(db,'users',user.uid,'library',s.id.toString()),s).catch(console.error);
    else if(user?.isAnonymous) localStorage.setItem(`qb_lib_${username}`,JSON.stringify(library.map(x=>x.id===s.id?s:x)));
  };
  const addSubject = async (s) => {
    setLibrary(p=>[s,...p]);
    if(user&&!user.isAnonymous) await setDoc(doc(db,'users',user.uid,'library',s.id.toString()),s).catch(console.error);
    else if(user?.isAnonymous) localStorage.setItem(`qb_lib_${username}`,JSON.stringify([s,...library]));
  };
  const removeSubject = async (id) => {
    setLibrary(p=>p.filter(s=>s.id!==id));
    if(user&&!user.isAnonymous) await deleteDoc(doc(db,'users',user.uid,'library',id.toString())).catch(console.error);
    else if(user?.isAnonymous) localStorage.setItem(`qb_lib_${username}`,JSON.stringify(library.filter(s=>s.id!==id)));
  };

  const saveSettings = async (s) => {
    const ns={...s,activeKeyIndex:Number(s.activeKeyIndex||1)};
    setSettings(ns);
    if(user&&!user.isAnonymous) await setDoc(doc(db,'users',user.uid),{username,apiKey:ns.apiKey1||ns.apiKey||'',settings:ns},{merge:true}).catch(console.error);
    else if(user?.isAnonymous) localStorage.setItem(`qb_settings_${username}`,JSON.stringify(ns));
  };

  // ── API Key helpers ────────────────────────────────────────────────────────
  const getKey = () => { const s=settingsRef.current; const k=s.activeKeyIndex===2?s.apiKey2:(s.activeKeyIndex===3?s.apiKey3:(s.apiKey1||s.apiKey)); return k||s.apiKey1||s.apiKey2||s.apiKey3||s.apiKey; };
  const checkKey = () => { if (!getKey()?.trim()){showApiError('API_KEY_MISSING');return false;} return true; };

  // Show error modal with full context for each API error type
  const showApiError = (errCode, extra='') => {
    const cfg = ERROR_CONFIGS[errCode] || { title:'Erro Desconhecido', message:extra||'Tente novamente.', link:null };
    setErrorModal({ title:cfg.title, message:cfg.message+(extra?`\n${extra}`:''), link:cfg.link, isAlert:true });
  };

  // Build ordered key list starting from current active key
  const getOrderedKeys = () => {
    const s = settingsRef.current;
    const slots = [
      { n:1, k: s.apiKey1||s.apiKey },
      { n:2, k: s.apiKey2 },
      { n:3, k: s.apiKey3 },
    ].filter(x => x.k?.trim());
    const startIdx = Math.max(0, slots.findIndex(x => x.n === (s.activeKeyIndex||1)));
    return [...slots.slice(startIdx), ...slots.slice(0, startIdx)];
  };

  // Advance to the next available key (called after every request, success or quota fail)
  const rotateKey = async () => {
    const s = settingsRef.current;
    const slots = [
      { n:1, k: s.apiKey1||s.apiKey },
      { n:2, k: s.apiKey2 },
      { n:3, k: s.apiKey3 },
    ].filter(x => x.k?.trim());
    if (slots.length <= 1) return;
    const curIdx = slots.findIndex(x => x.n === (s.activeKeyIndex||1));
    const nextN = slots[(curIdx + 1) % slots.length].n;
    await saveSettings({ ...s, activeKeyIndex: nextN });
  };

  // ── Material helpers ───────────────────────────────────────────────────────
  const getMaterial = () => { const c=materialText+'\n'+uploadedFiles.map(f=>`[${f.name}]\n${f.content}`).join('\n'); return c.length>MAX_MATERIAL_CHARS?c.substring(0,MAX_MATERIAL_CHARS)+'\n[TRUNCADO]':c; };
  const isBig = () => (materialText+uploadedFiles.map(f=>f.content).join('')).length>MAX_MATERIAL_CHARS;
  // Build focus instructions from stored focus area IDs on the subject
  const getFocusInst = (areas=[]) => {
    if (!areas || areas.length === 0) return '';
    const insts = areas.map(id => FOCUS_AREAS.find(f=>f.id===id)?.inst).filter(Boolean);
    return insts.length ? `ÊNFASES OBRIGATÓRIAS:\n${insts.map(i=>`- ${i}`).join('\n')}` : '';
  };

  const getPrompt = (forAPI=false, areas=[]) => {
    const s=settingsRef.current; const total=s.numSubtopics*s.qPerSub; const na=s.numAlternatives||5;
    const alts=na===4?'A) [Alt]\nB) [Alt]\nC) [Alt]\nD) [Alt]':'A) [Alt]\nB) [Alt]\nC) [Alt]\nD) [Alt]\nE) [Alt]';
    const focusBlock = getFocusInst(areas);
    return `Você é o Oráculo de Medicina da Ágora do Saber. Crie questões médicas de altíssima qualidade.\n\n${focusBlock?focusBlock+'\n\n':''}\nREGRA MANDATÓRIA: Aborde EXATAMENTE ${s.numSubtopics} subtópicos, ${s.qPerSub} questão(ões) cada. Total: EXATAMENTE ${total} questões.\n\nDIRETRIZES:\n- Raciocínio clínico estilo USMLE/Residência brasileira\n- EXATAMENTE ${na} alternativas homogêneas e plausíveis\n- NUNCA cite letras na explicação, use termos médicos\n- Embaralhe as alternativas aleatoriamente\n- Explicação: densa, didática, com mecanismo fisiopatológico e diferencial quando relevante\n\nTEMPLATE:\n## Questão [X.Y.Z]\n[Enunciado clínico]\n${alts}\nAlternativa correta: [Letra]\nExplicação:\n[Explicação sem citar letras]\n---\n\n${s.customPrompt?`Instruções extras: ${s.customPrompt}`:''}`;
  };

  // External prompt (for copying to ChatGPT / Claude / Gemini web)
  const getExternalPrompt = () => {
    const s=settingsRef.current; const na=s.numAlternatives||5;
    const alts=na===4?'A) [Alt]\nB) [Alt]\nC) [Alt]\nD) [Alt]':'A) [Alt]\nB) [Alt]\nC) [Alt]\nD) [Alt]\nE) [Alt]';
    return `[INSTRUÇÕES PARA IA EXTERNA - ÁGORA DO SABER]

*** PARTE 1: ESTRUTURAÇÃO ***
Atue como o Arquiteto de Alexandria. Crie um sumário focado em [INSERIR TEMA AQUI]. O sumário deve conter EXATAMENTE ${s.numTopics} Tópicos principais, e cada tópico deve ter EXATAMENTE ${s.numSubtopics} Subtópicos. Apresente apenas o sumário com 'Tópico X' no início de cada linha principal. Ao final da estruturação, aguarde minhas sugestões de alterações ou minha confirmação. NÃO gere as questões ainda.

*** PARTE 2: GERAÇÃO DE QUESTÕES ***
Após eu confirmar o sumário, você iniciará a geração das questões, PROCESSANDO UM TÓPICO POR VEZ a cada comando meu de "Próximo Tópico". Para cada tópico, use as seguintes diretrizes:

Você é o Oráculo de Medicina da Ágora do Saber. Crie questões médicas de altíssima qualidade.
${getFocusInst([])}

REGRA MANDATÓRIA: Crie EXATAMENTE ${s.qPerSub} questão(ões) para CADA subtópico do tópico atual. NÃO pare a geração até ter coberto absolutamente todos os subtópicos do bloco atual! Se precisar continuar em outra mensagem, avise mas continue sem perder nenhum subtópico.

DIRETRIZES:
- Raciocínio clínico estilo USMLE/Residência brasileira
- EXATAMENTE ${na} alternativas homogêneas e plausíveis
- NUNCA cite letras na explicação, use termos médicos
- Embaralhe as alternativas aleatoriamente
- Explicação: densa, didática, com mecanismo fisiopatológico e diferencial quando relevante

TEMPLATE DE SAÍDA OBRIGATÓRIO:
## Questão [X.Y.Z]
[Enunciado clínico]
${alts}
Alternativa correta: [Letra]
Explicação:
[Explicação sem citar letras]
---
${s.customPrompt?`\nInstruções extras do usuário: ${s.customPrompt}`:''}`;
  };

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

  const handleAnswer = async (qId, letter) => {
    const q=activeTopic.questions.find(x=>x.id===qId); const isRight=q?.options.find(o=>o.isCorrect)?.letter===letter;
    const now=Date.now(); const sr={...(activeTopic.spacedReview||{})};
    if(!isRight) sr[qId]={dueDate:now+86400000,interval:1,wrongCount:(sr[qId]?.wrongCount||0)+1};
    else if(sr[qId]){const ni=Math.min((sr[qId].interval||1)*2,30);sr[qId]={...sr[qId],dueDate:now+ni*86400000,interval:ni};}
    await updateSubject({...activeSubject,topics:activeSubject.topics.map(t=>t.id!==activeTopicId?t:{...t,answers:{...t.answers,[qId]:letter},spacedReview:sr})});
  };

  const handleFavorite = async (qId) => {
    if(!activeTopic)return;
    const favs=activeTopic.favorites||[]; const nf=favs.includes(qId)?favs.filter(f=>f!==qId):[...favs,qId];
    await updateSubject({...activeSubject,topics:activeSubject.topics.map(t=>t.id===activeTopicId?{...t,favorites:nf}:t)});
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

  // Bug 1: also clear cached insights — they're based on old answers and would be stale
  const resetAnswers = async () => { await updateSubject({...activeSubject,topics:activeSubject.topics.map(t=>t.id===activeTopicId?{...t,answers:{},bizuario:null}:t)}); };
  const resetOnlyWrong = async () => {
    const wrong=(activeTopic.questions||[]).filter(q=>{const a=activeTopic.answers?.[q.id];return a&&a!==q.options.find(o=>o.isCorrect)?.letter;}).map(q=>q.id);
    const na=Object.fromEntries(Object.entries(activeTopic.answers||{}).filter(([k])=>!wrong.includes(k)));
    await updateSubject({...activeSubject,topics:activeSubject.topics.map(t=>t.id===activeTopicId?{...t,answers:na}:t)});setShowOnlyWrong(false);
  };

  // Generate questions (streaming)
  const generateBatch = async (topicId, addPrompt='') => {
    if(!checkKey())return;setIsBusy(true);setStreamCount(0);
    let mi=0;setLoadingMsg(LOADING_MSGS[0]);
    const mi_int=setInterval(()=>{mi=(mi+1)%LOADING_MSGS.length;setLoadingMsg(LOADING_MSGS[mi]);},8000);
    const cleared={...activeSubject,topics:activeSubject.topics.map(t=>t.id===topicId?{...t,questions:[],summary:'',answers:{}}:t)};
    await updateSubject(cleared);
    const topic=cleared.topics.find(t=>t.id===topicId);

    // Build subtopics injection
    const subtopicsArr = topic.subtopics?.filter(s=>s.length>0) || [];
    const total = subtopicsArr.length > 0 ? subtopicsArr.length * settingsRef.current.qPerSub : settingsRef.current.numSubtopics * settingsRef.current.qPerSub;
    const subtopicsBlock = subtopicsArr.length > 0
      ? `\n\nSUBTÓPICOS OBRIGATÓRIOS deste tópico (cubra EXATAMENTE estes, um por questão, sem invenções):\n${subtopicsArr.map((s,i)=>`${i+1}. ${s}`).join('\n')}\n\nREGRA CRÍTICA: Cada questão = 1 subtópico da lista. NÃO repita. NÃO invente. Total: EXATAMENTE ${total} questões.`
      : '';

    const ctx=cleared.sourceMaterials?`\n\nMATERIAIS:\n${cleared.sourceMaterials}`:'';
    const PROMPT=getPrompt(true, cleared.focusAreas||[])+ctx+subtopicsBlock+(addPrompt?`\n\nFoco adicional: ${addPrompt}`:'')+
      `\n\nATENÇÃO FINAL: Você DEVE gerar TODAS as ${total} questões sem interromper. NÃO pare antes de terminar. NÃO resuma. NÃO pergunte. Gere questão por questão até o total de ${total}.`;

    const orderedKeys = getOrderedKeys();
    let err=null, ok=false;
    for (const {k} of orderedKeys) {
      try {
        const full=await callGeminiStream(`Invoque: ${topic.title} — ${activeSubject.title}`,PROMPT,k,(acc,qc)=>setStreamCount(qc));
        const p=parseData(full);
        await updateSubject({...cleared,topics:cleared.topics.map(t=>t.id===topicId?{...t,questions:p.questions,summary:p.summary,answers:{},favorites:t.favorites||[],spacedReview:t.spacedReview||{},subtopics:topic.subtopics}:t)});
        await rotateKey(); // Always rotate after success
        ok=true; break;
      } catch(e) {
        err=e;
        if (e.message==='QUOTA_EXCEEDED') { await rotateKey(); continue; } // try next key
        break; // other errors: stop
      }
    }
    clearInterval(mi_int);setLoadingMsg('');setStreamCount(0);
    if(!ok) showApiError(err?.message||'CONNECTION_ERROR');
    setIsBusy(false);
  };

  // Creator
  const startCreation = async () => {
    if(!checkKey())return;setIsBusy(true);
    const sys=`Você é o Arquiteto de Alexandria. Baseado em "${newSubName}" e materiais, crie sumário com EXATAMENTE ${settingsRef.current.numTopics} Tópicos e ${settingsRef.current.numSubtopics} Subtópicos cada. Responda APENAS o sumário com 'Tópico X' no início de cada linha principal.`;
    const orderedKeys = getOrderedKeys();
    let ok=false;
    for (const {k} of orderedKeys) {
      try {
        const r=await callGemini(`Materiais: ${getMaterial()}`,sys,k,uploadedImages);
        setSyllabus(r);setCreatorStep(2);
        await rotateKey();
        ok=true; break;
      } catch(e) {
        if (e.message==='QUOTA_EXCEEDED') { await rotateKey(); continue; }
        showApiError(e.message); break;
      }
    }
    if (!ok && !errorModal) showApiError('QUOTA_EXCEEDED');
    setIsBusy(false);
  };
  const reviseSyllabus = async () => {
    if(!syllabusFB.trim()||!checkKey())return;setIsBusy(true);
    const sys=`Arquiteto de Alexandria. Ajuste o sumário conforme o pedido, mantendo EXATAMENTE ${settingsRef.current.numTopics} Tópicos e ${settingsRef.current.numSubtopics} Subtópicos.\nAtual:\n${syllabus}\nPedido: "${syllabusFB}"\nResponda APENAS o novo sumário.`;
    const orderedKeys = getOrderedKeys();
    for (const {k} of orderedKeys) {
      try {
        const r=await callGemini('Ajuste.',sys,k);
        setSyllabus(r);setSyllabusFB('');
        await rotateKey(); break;
      } catch(e) {
        if (e.message==='QUOTA_EXCEEDED') { await rotateKey(); continue; }
        showApiError(e.message); break;
      }
    }
    setIsBusy(false);
  };
  const finalizeSub = async () => {
    const lines = syllabus.split('\n');
    // Identify which lines are topic headers
    const topicLineIndices = lines.reduce((acc, l, i) => {
      if (/T[óo]pico\s*\d+/i.test(l)) acc.push(i);
      return acc;
    }, []);

    const topics = topicLineIndices.map((lineIdx, topicPos) => {
      const title = lines[lineIdx].replace(/[*#]/g,'').trim();
      // Collect subtopic lines: everything between this topic header and the next one
      const nextTopicIdx = topicLineIndices[topicPos + 1] ?? lines.length;
      const subtopics = lines
        .slice(lineIdx + 1, nextTopicIdx)
        .map(l => l.replace(/^[\s*#\-–]+/, '').trim())  // strip leading symbols/spaces
        .filter(l => l.length > 3 && !/^T[óo]pico\s*\d+/i.test(l));
      return {
        id: `t-${topicPos}-${Date.now()}`,
        title,
        subtopics,  // ← stored per topic
        questions: [], answers: {}, summary: '', favorites: [], spacedReview: {},
      };
    });

    const ns = { id: Date.now(), title: newSubName, fullSyllabus: syllabus, source: 'gemini', sourceMaterials: getMaterial(), focusAreas, topics };
    await addSubject(ns);
    setLibFilter('gemini'); setView('sub-library'); setCreatorStep(1);
    setNewSubName(''); setMaterialText(''); setUploadedFiles([]); setUploadedImages([]); setFocusAreas([]);
  };

  // Paste import
  const handlePasteImport = async () => {
    const parsed=parseData(pasteText);if(!parsed.questions.length){setErrorModal({title:'Ilegível',message:'Verifique a estrutura.',isAlert:true});return;}
    const sn=pasteSubName.trim()||'Assunto Importado'; const tn=pasteTopic.trim()||`Bloco (${new Date().toLocaleDateString()})`;
    const nt={id:`imp-${Date.now()}`,title:tn,questions:parsed.questions,summary:parsed.summary,answers:{},favorites:[],spacedReview:{}};
    let ts=library.find(s=>s.title.toLowerCase()===sn.toLowerCase()&&s.source==='external'&&s.id!=='imported-folder');
    if(ts){await updateSubject({...ts,topics:[...ts.topics,nt]});setActiveSubjectId(ts.id);}
    else if(!pasteSubName.trim()){const f=library.find(s=>s.id==='imported-folder');if(f)await updateSubject({...f,topics:[...f.topics,nt]});setActiveSubjectId('imported-folder');}
    else{const ns={id:Date.now(),title:sn,source:'external',fullSyllabus:'Importado',topics:[nt]};await addSubject(ns);setActiveSubjectId(ns.id);}
    setPasteText('');setPasteTopic('');setActiveTopicId(nt.id);setView('topic');
  };

  // Spaced review
  const getDueReviews = () => {
    const now=Date.now(); const due=[];
    library.forEach(s=>s.topics.forEach(t=>{Object.entries(t.spacedReview||{}).forEach(([qId,r])=>{if(r.dueDate<=now){const q=(t.questions||[]).find(x=>x.id===qId);if(q)due.push({subject:s,topic:t,question:q,review:r,topicId:t.id,subjectId:s.id});}});}));
    return due;
  };
  const getUpcomingReviews = () => {
    const now=Date.now(); const week=now+7*86400000; const items=[];
    library.forEach(s=>s.topics.forEach(t=>{Object.entries(t.spacedReview||{}).forEach(([qId,r])=>{if(r.dueDate>now&&r.dueDate<=week){const q=(t.questions||[]).find(x=>x.id===qId);if(q)items.push({subjectTitle:s.title,topicTitle:t.title,question:q,dueDate:r.dueDate});}});}));
    return items.sort((a,b)=>a.dueDate-b.dueDate);
  };
  const startReview = () => { const d=getDueReviews();if(!d.length){setErrorModal({title:'Sem Revisões',message:'Nenhuma questão programada para hoje!',isAlert:true});return;}setReviewQs(d);setReviewAns({});setReviewSchedule(false);setView('review'); };
  const handleReviewAns = async (qId,letter,topicId,subjectId) => {
    setReviewAns(p=>({...p,[qId]:letter}));
    const s=library.find(x=>x.id===subjectId); const t=s?.topics.find(x=>x.id===topicId); if(!t)return;
    const q=t.questions.find(x=>x.id===qId); const ok=q?.options.find(o=>o.isCorrect)?.letter===letter;
    const now=Date.now(); const sr={...(t.spacedReview||{})};
    if(!ok) sr[qId]={...sr[qId],dueDate:now+86400000,interval:1,wrongCount:(sr[qId]?.wrongCount||0)+1};
    else{const ni=Math.min((sr[qId]?.interval||1)*2,30);sr[qId]={...sr[qId],dueDate:now+ni*86400000,interval:ni};}
    await updateSubject({...s,topics:s.topics.map(x=>x.id===topicId?{...x,spacedReview:sr}:x)});
  };

  // Statistics
  const getStats = () => {
    let tQ=0,tA=0,tC=0; const bySubject={};
    library.forEach(s=>{
      if(!bySubject[s.id]) bySubject[s.id]={title:s.title,source:s.source,topics:[],total:0,answered:0,correct:0};
      s.topics.forEach(t=>{
        const qs=t.questions?.length||0; const ans=Object.keys(t.answers||{}).length;
        const correct=(t.questions||[]).filter(q=>t.answers?.[q.id]===q.options.find(o=>o.isCorrect)?.letter).length;
        tQ+=qs;tA+=ans;tC+=correct;
        bySubject[s.id].total+=qs;bySubject[s.id].answered+=ans;bySubject[s.id].correct+=correct;
        if(qs>0) bySubject[s.id].topics.push({id:t.id,title:t.title,total:qs,answered:ans,correct,pct:ans>0?Math.round(correct/ans*100):0,subjectId:s.id,subjectTitle:s.title});
      });
    });
    return {tQ,tA,tC,pct:tA>0?Math.round(tC/tA*100):0,bySubject,due:getDueReviews().length};
  };

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
    const focusTopic = {id:`focus-${Date.now()}`,title:`Foco: ${topicData?.topic.title||new Date().toLocaleDateString()}`,questions:[],answers:{},favorites:[],spacedReview:{}};
    const updated = {...focusSubject,topics:[...focusSubject.topics,focusTopic]};
    if(!library.find(s=>s.title==='📌 Focos de Estudo')) await addSubject(updated); else await updateSubject(updated);
    setActiveSubjectId(updated.id); setActiveTopicId(focusTopic.id); setBizuarioModal(null);
    setView('topic');
    setTimeout(()=>generateBatch(focusTopic.id, weakData),500);
  };

  // Exam
  const startExam = (items,qCount,time) => {
    // Bug 6: include _subjectId and _topicId so favorites can be toggled during exam
    const all=items.flatMap(({subject,topic})=>(topic.questions||[]).map(q=>({...q,_subjectId:subject.id,_topicId:topic.id,_subjectTitle:subject.title,_topicTitle:topic.title})));
    const shuffled=all.sort(()=>Math.random()-.5).slice(0,Math.min(qCount,all.length));
    setActiveExam({id:Date.now(),questions:shuffled,answers:{},timeLeft:time*60,finished:false,blindMode:examBlind});
    setView('exam');
  };

  // Search
  const getSearchResults = (q) => {
    if(!q.trim()||q.length<2)return[];
    const ql=q.toLowerCase();const res=[];
    library.forEach(s=>s.topics.forEach(t=>(t.questions||[]).forEach(q=>{
      if(q.statement.toLowerCase().includes(ql)||q.explanation.toLowerCase().includes(ql)||q.options.some(o=>o.text.toLowerCase().includes(ql)))
        res.push({subject:s,topic:t,question:q});
    })));
    return res;
  };

  // Helpers
  const subjectProgress = (s) => { const all=s.topics.flatMap(t=>t.questions||[]); const ans=s.topics.flatMap(t=>Object.keys(t.answers||{})).length; return all.length>0?Math.round(ans/all.length*100):0; };
  const dueCount = getDueReviews().length;
  const canSeeVideoaulas = user?.email
    ? VIDEOAULAS_ALLOWED_EMAILS.includes(user.email.toLowerCase())
    : false;
  const wrongCount = activeTopic?(activeTopic.questions||[]).filter(q=>{const a=activeTopic.answers?.[q.id];return a&&a!==q.options.find(o=>o.isCorrect)?.letter;}).length:0;
  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const formatDate = (ts) => { const d=new Date(ts); return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`; };
  const daysUntil = (ts) => Math.max(0,Math.ceil((ts-Date.now())/86400000));

  // ── AUTH ──────────────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => { try{await signInWithPopup(auth,new GoogleAuthProvider());}catch(e){setErrorModal({title:'Erro',message:'Login falhou.',isAlert:true});} };
  const handleAnonLogin   = async () => { try{await signInAnonymously(auth);}catch(e){setErrorModal({title:'Erro',message:'Login anônimo falhou.',isAlert:true});} };
  const handleRegister    = async () => {
    if(!sigName.trim()||!sigKey.trim()||!user)return;
    const name=sigName.trim().toUpperCase(); const ns={...defaultSettings,apiKey:sigKey.trim(),apiKey1:sigKey.trim()};
    if(user.isAnonymous){localStorage.setItem('qb_username',name);localStorage.setItem(`qb_settings_${name}`,JSON.stringify(ns));setUsername(name);setSettings(ns);}
    else{try{await setDoc(doc(db,'users',user.uid),{username:name,apiKey:sigKey.trim(),settings:ns});setUsername(name);setSettings(ns);}catch(e){setErrorModal({title:'Erro',message:'Falha ao registrar.',isAlert:true});}}
  };
  const handleLogout = async () => { await signOut(auth);setLibrary([]);setSettings(defaultSettings);setView('library');setSigName('');setSigKey('');localStorage.removeItem('qb_username'); };

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
            <div className={`p-4 rounded-lg text-xs leading-relaxed ${darkMode?'bg-yellow-900/20 text-yellow-200':'bg-yellow-50 text-yellow-800'}`}>Crie sua chave gratuita: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold">aistudio.google.com/app/apikey</a></div>
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
    <div className={`min-h-screen font-sans transition-colors duration-300 ${bg}`}>
      {/* HEADER */}
      <header className={`${hdr} border-b sticky top-0 z-20 shadow-sm transition-transform duration-300 ${headerVisible?'translate-y-0':'-translate-y-full'}`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={()=>{setView('library');setMenuOpen(false);}}>
            <div className="bg-yellow-600 p-1.5 rounded-lg shadow-md"><Landmark className="w-4 h-4 text-white"/></div>
            <h1 className={`font-serif font-bold text-lg tracking-wide ${darkMode?'text-yellow-500':'text-yellow-700'}`}>ÁGORA DO SABER</h1>
          </div>

          {/* Desktop nav buttons */}
          <div className="hidden md:flex items-center gap-1.5">
            <span className={`flex items-center gap-2 text-xs font-bold mr-2 opacity-50 border-r pr-3 ${darkMode?'border-gray-700':'border-gray-300'}`}><UserIcon className="w-3 h-3"/>{username}</span>
            {[
              {icon:<SearchIcon className="w-4 h-4"/>,   action:()=>setSearchOpen(true), title:'Buscar'},
              {icon:<Heart className="w-4 h-4"/>,         action:()=>setView('favorites'), title:'Favoritos'},
              {icon:<BarChart2 className="w-4 h-4"/>,     action:()=>setView('stats'),     title:'Estatísticas'},
              {icon:<CalendarCheck className="w-4 h-4"/>, action:startReview,              title:'Revisão', badge:dueCount},
              {icon:<SettingsIcon className="w-4 h-4"/>,  action:()=>setView('settings'),  title:'Configurações'},
              {icon:darkMode?<Sun className="w-4 h-4"/>:<Moon className="w-4 h-4"/>, action:()=>setDarkMode(!darkMode), title:'Tema'},
              {icon:<LogOut className="w-4 h-4"/>,        action:handleLogout,             title:'Sair', danger:true},
            ].map((btn,i)=>(
              <button key={i} onClick={btn.action} title={btn.title} className={`relative p-2 rounded-full transition-all hover:scale-110 ${btn.danger?(darkMode?'bg-gray-800 hover:bg-gray-700 text-red-400':'bg-gray-100 hover:bg-gray-200 text-red-500'):(darkMode?'bg-gray-800 hover:bg-gray-700 text-yellow-500':'bg-gray-100 hover:bg-gray-200 text-yellow-600')}`}>
                {btn.icon}
                {(btn.badge||0)>0&&<span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{btn.badge>9?'9+':btn.badge}</span>}
              </button>
            ))}
          </div>

          {/* Mobile right: theme + hamburger */}
          <div className="flex md:hidden items-center gap-1">
            {dueCount>0&&(
              <button onClick={startReview} className={`relative p-2 rounded-full ${darkMode?'bg-gray-800 text-yellow-500':'bg-gray-100 text-yellow-600'}`}>
                <CalendarCheck className="w-5 h-5"/>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{dueCount>9?'9+':dueCount}</span>
              </button>
            )}
            <button onClick={()=>setDarkMode(!darkMode)} className={`p-2 rounded-full ${darkMode?'bg-gray-800 text-yellow-500':'bg-gray-100 text-yellow-600'}`}>
              {darkMode?<Sun className="w-5 h-5"/>:<Moon className="w-5 h-5"/>}
            </button>
            <button onClick={()=>setMenuOpen(!menuOpen)} className={`p-2 rounded-full ${darkMode?'bg-gray-800 text-yellow-500':'bg-gray-100 text-yellow-600'}`} aria-label="Menu">
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
                {icon:<SearchIcon className="w-5 h-5"/>,   label:'Buscar',        action:()=>setSearchOpen(true)},
                {icon:<Heart className="w-5 h-5"/>,         label:'Favoritos',     action:()=>setView('favorites')},
                {icon:<BarChart2 className="w-5 h-5"/>,     label:'Estatísticas',  action:()=>setView('stats')},
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

      <main className={view==='videoaulas'?'':'max-w-5xl mx-auto px-4 py-8'}>

        {/* ── LIBRARY ── */}
        {view==='library'&&(
          <div>
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-serif font-bold text-yellow-600 mb-2">Não são admitidos ignorantes em geometria</h2>
              <p className="opacity-60 mb-6">Gerencie seus blocos de estudo e invoque novas questões.</p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
                <button onClick={()=>setView('creator')} className="flex-1 bg-yellow-600 text-white py-4 rounded-xl font-bold hover:bg-yellow-700 flex items-center justify-center gap-2"><Sparkles className="w-5 h-5"/>Gerar Assunto</button>
                <button onClick={()=>{setPasteSubName('');setPasteTopic('Bloco 1');setView('paste');}} className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 border ${darkMode?'bg-gray-800 text-white hover:bg-gray-700 border-gray-700':'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'}`}><Feather className="w-5 h-5 text-yellow-600"/>Importar</button>
                <button onClick={()=>setExamSetup({})} className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 border ${darkMode?'bg-gray-800 text-white hover:bg-gray-700 border-gray-700':'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'}`}><Zap className="w-5 h-5 text-yellow-600"/>Modo Prova</button>
              </div>
            </div>
            <div className={`grid grid-cols-1 gap-6 ${canSeeVideoaulas?'md:grid-cols-3':'md:grid-cols-2'}`}>
              {[{f:'gemini',icon:<Landmark className="w-12 h-12 text-yellow-600"/>,title:'Acervo do Oráculo',desc:'Assuntos gerados via Gemini'},{f:'external',icon:<FolderIcon className="w-12 h-12 text-yellow-600"/>,title:'Acervo Externo',desc:'Questões importadas'}].map(item=>(
                <div key={item.f} onClick={()=>{setLibFilter(item.f);setView('sub-library');}} className={`${darkMode?'bg-gray-800 border-gray-700 hover:border-yellow-600':'bg-white border-gray-200 hover:border-yellow-500'} p-8 rounded-2xl border shadow-sm cursor-pointer transition-all flex flex-col items-center text-center group`}>
                  <div className="p-5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                  <h3 className="font-serif font-bold text-2xl text-yellow-600 mb-2">{item.title}</h3>
                  <p className="text-sm opacity-60">{item.desc}</p>
                  <div className={`mt-4 text-xs font-bold px-3 py-1 rounded-full ${badge}`}>{library.filter(s=>s.source===item.f).length} Pastas</div>
                </div>
              ))}
              {canSeeVideoaulas&&(
                <div onClick={()=>setView('videoaulas')} className={`${darkMode?'bg-gray-800 border-gray-700 hover:border-yellow-600':'bg-white border-gray-200 hover:border-yellow-500'} p-8 rounded-2xl border shadow-sm cursor-pointer transition-all flex flex-col items-center text-center group`}>
                  <div className="p-5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4 group-hover:scale-110 transition-transform"><VideoIcon className="w-12 h-12 text-yellow-600"/></div>
                  <h3 className="font-serif font-bold text-2xl text-yellow-600 mb-2">Videoaulas</h3>
                  <p className="text-sm opacity-60">Aulas em vídeo do curso</p>
                  <div className={`mt-4 text-xs font-bold px-3 py-1 rounded-full ${badge}`}>Acesso restrito</div>
                </div>
              )}
            </div>
            <div className="mt-8 flex justify-center">
              <button onClick={()=>{navigator.clipboard.writeText(getExternalPrompt());setCopiedPrompt(true);setTimeout(()=>setCopiedPrompt(false),3000);}} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold border transition-all ${darkMode?'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300':'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'} ${copiedPrompt?'ring-2 ring-yellow-500 text-yellow-600':''}`}>
                {copiedPrompt?<CheckCircle2 className="w-5 h-5 text-yellow-500"/>:<Copy className="w-5 h-5"/>}{copiedPrompt?'Copiado!':'Copiar Prompt'}
              </button>
            </div>
          </div>
        )}

        {/* ── SUB-LIBRARY ── */}
        {view==='sub-library'&&(
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
              <div>
                <button onClick={()=>setView('library')} className={`flex items-center gap-2 mb-4 font-bold ${darkMode?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/>Voltar</button>
                <h2 className="text-3xl font-serif font-bold text-yellow-600">{libFilter==='gemini'?'Acervo do Oráculo':'Acervo Externo'}</h2>
              </div>
              {libFilter==='gemini'
                ?<button onClick={()=>setView('creator')} className="bg-yellow-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-yellow-700 flex items-center gap-2"><Sparkles className="w-4 h-4"/>Gerar</button>
                :<button onClick={()=>{setPasteSubName('');setPasteTopic('Bloco 1');setView('paste');}} className="bg-yellow-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-yellow-700 flex items-center gap-2"><Feather className="w-4 h-4"/>Importar</button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {library.filter(s=>s.source===libFilter).length===0&&<div className="col-span-full py-10 text-center opacity-40 italic">Biblioteca vazia.</div>}
              {library.filter(s=>s.source===libFilter).map(s=>{
                const pct=subjectProgress(s);
                return (
                  <div key={s.id} onClick={()=>{setActiveSubjectId(s.id);setView('subject');}} className={`${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'} p-6 rounded-2xl border hover:border-yellow-500 cursor-pointer group transition-all`}>
                    <div className="flex justify-between items-start mb-4">
                      <FolderIcon className="w-10 h-10 text-yellow-600"/>
                      {s.id!=='imported-folder'&&(
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e=>{e.stopPropagation();setEditingSub(s.id);setEditingSubName(s.title);}} className="p-1.5 text-gray-400 hover:text-yellow-500"><EditIcon className="w-4 h-4"/></button>
                          <button onClick={e=>{e.stopPropagation();setDeleteId({type:'subject',id:s.id});}} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      )}
                    </div>
                    <h3 className="font-serif font-bold text-xl mb-3 truncate">{s.title}</h3>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                      <div className="bg-yellow-500 h-full transition-all" style={{width:`${pct}%`}}/>
                    </div>
                    <div className="flex justify-between"><p className="text-xs opacity-50">{s.topics.length} tópicos</p><p className="text-xs font-bold text-yellow-600">{pct}%</p></div>
                  </div>
                );
              })}
            </div>
          </div>
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
              <div className="flex gap-2">
                <button onClick={()=>openBizuarioSubject(activeSubject)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border ${activeSubject.bizuario?(darkMode?'border-green-600 text-green-400 bg-green-900/20':'border-green-400 text-green-700 bg-green-50'):(darkMode?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50')}`}><BrainIcon className="w-4 h-4"/>{activeSubject.bizuario?'Bizuário ✓':'Bizuário da Pasta'}</button>
                {activeSubject.source==='external'&&<button onClick={()=>{setPasteSubName(activeSubject.id==='imported-folder'?'':activeSubject.title);setPasteTopic(`Bloco ${activeSubject.topics.length+1}`);setView('paste');}} className="bg-yellow-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-yellow-700 flex items-center gap-2 text-sm"><Feather className="w-4 h-4"/>Importar</button>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...activeSubject.topics].map(topic=>{
                const due=Object.values(topic.spacedReview||{}).filter(r=>r.dueDate<=Date.now()).length;
                const pct=topic.questions?.length?Math.round(Object.keys(topic.answers||{}).length/topic.questions.length*100):0;
                return (
                  <div key={topic.id} onClick={()=>{setActiveTopicId(topic.id);setShowOnlyWrong(false);setView('topic');}} className={`${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'} p-4 rounded-xl border flex items-center justify-between hover:border-yellow-500 cursor-pointer group transition-all`}>
                    <div className="flex items-center gap-3 flex-1 truncate pr-3">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 flex-shrink-0"><ScrollText className="w-5 h-5"/></div>
                      <div className="truncate">
                        <h4 className="font-bold text-sm truncate">{topic.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs opacity-50">{topic.questions?.length?`${Object.keys(topic.answers||{}).length}/${topic.questions.length}`:'Sem questões'}</p>
                          {due>0&&<span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full font-bold">{due} revisar</span>}
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
            <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b pb-6 ${darkMode?'border-gray-700':'border-gray-200'}`}>
              <div>
                <button onClick={()=>setView('subject')} className={`flex items-center gap-2 mb-2 font-bold ${darkMode?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/>Voltar</button>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-serif font-bold text-yellow-600">{activeTopic.title}</h2>
                  <button onClick={()=>{setEditingTopic(activeTopic.id);setEditingTopicName(activeTopic.title);}} className="p-1.5 rounded-full text-gray-400 hover:text-yellow-500"><EditIcon className="w-4 h-4"/></button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {activeTopic.questions.length>0&&(
                  <>
                    <button onClick={()=>setExportModal({topic:activeTopic,subject:activeSubject})} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold border ${darkMode?'border-gray-600 text-gray-300 hover:bg-gray-700':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}><Printer className="w-4 h-4"/>Exportar</button>
                    <button onClick={()=>openBizuario(activeTopic,activeSubject)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold border transition-colors ${activeTopic.bizuario?(darkMode?'border-green-600 text-green-400 bg-green-900/20':'border-green-400 text-green-700 bg-green-50'):(darkMode?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50')}`}><BrainIcon className="w-4 h-4"/>{activeTopic.bizuario?'Bizuário ✓':'Bizuário'}</button>
                    {wrongCount>0&&<button onClick={()=>setShowOnlyWrong(!showOnlyWrong)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold border ${showOnlyWrong?(darkMode?'bg-red-900/30 text-red-400 border-red-700':'bg-red-50 text-red-600 border-red-300'):(darkMode?'border-gray-600 text-gray-300 hover:bg-gray-700':'border-gray-200 text-gray-600 hover:bg-gray-50')}`}><FilterIcon className="w-4 h-4"/>{showOnlyWrong?`Erradas (${wrongCount})`:`Filtrar (${wrongCount})`}</button>}
                    {showOnlyWrong&&wrongCount>0&&<button onClick={resetOnlyWrong} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700"><RotateCcw className="w-4 h-4"/>Refazer</button>}
                    <button onClick={()=>setDeleteId({type:'reset',id:activeTopic.id})} className="flex items-center gap-1.5 px-3 py-2 border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-bold"><Eraser className="w-4 h-4"/>Limpar</button>
                    {activeSubject.source==='gemini'&&<button onClick={()=>setRegenModal(true)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold ${darkMode?'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50':'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}><RotateCcw className="w-4 h-4"/>Recriar</button>}
                  </>
                )}
                {activeTopic.questions.length===0&&activeSubject.source==='gemini'&&(
                  <button onClick={()=>generateBatch(activeTopic.id)} disabled={isBusy} className="bg-yellow-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2">
                    {isBusy?<Spinner className="w-4 h-4 text-white"/>:<Flame className="w-5 h-5"/>}{isBusy?'Gerando...':'Gerar Questões'}
                  </button>
                )}
              </div>
            </div>

            {/* Show subtopics panel when no questions yet and subtopics are stored */}
            {!isBusy&&activeTopic.questions.length===0&&(activeTopic.subtopics?.length>0)&&(
              <div className={`mb-6 p-4 rounded-xl border ${darkMode?'bg-blue-900/20 border-blue-700':'bg-blue-50 border-blue-200'}`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${darkMode?'text-blue-400':'text-blue-600'}`}>
                  📋 Subtópicos salvos — o Oráculo cobrirá exatamente estes:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {activeTopic.subtopics.map((sub,i)=>(
                    <div key={i} className={`text-sm px-3 py-1.5 rounded-lg ${darkMode?'bg-blue-900/30 text-blue-200':'bg-white text-blue-800'}`}>
                      <span className="opacity-40 mr-2">{i+1}.</span>{sub}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isBusy&&activeTopic.questions.length===0&&(
              <div className="flex flex-col items-center py-20">
                <Spinner className="w-12 h-12 text-yellow-600 mb-4"/>
                <p className="text-lg font-serif font-bold text-yellow-600 text-center">{loadingMsg}</p>
                {streamCount>0&&<p className="text-sm text-green-600 dark:text-green-400 mt-2 font-bold animate-pulse">✓ {streamCount} questão(ões) gerada(s)...</p>}
                <p className="text-xs opacity-30 mt-2">Até 60 segundos</p>
              </div>
            )}
            {!isBusy&&(
              <div>
                {showOnlyWrong&&displayedQs.length===0&&<div className="text-center py-16 opacity-60"><CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4"/><p className="font-bold text-lg">Nenhum erro encontrado!</p></div>}
                {displayedQs.map((q,i)=>(
                  <QuestionCard key={i} question={q} index={i} selectedLetter={activeTopic.answers?.[q.id]} onAnswer={l=>handleAnswer(q.id,l)} darkMode={darkMode} isFavorite={(activeTopic.favorites||[]).includes(q.id)} onToggleFavorite={()=>handleFavorite(q.id)} apiKey={getKey()} oracleLength={settings.oracleLength||'medium'}/>
                ))}
                {activeTopic.questions.length>0&&Object.keys(activeTopic.answers||{}).length===activeTopic.questions.length&&!showOnlyWrong&&(
                  <div className="text-center py-10">
                    <Award className="w-16 h-16 mx-auto text-yellow-500 mb-4"/>
                    <h3 className="text-2xl font-serif font-bold text-yellow-600 mb-2">Provações Concluídas!</h3>
                    <p className="opacity-70 mb-6">{activeTopic.questions.filter(q=>activeTopic.answers?.[q.id]===q.options.find(o=>o.isCorrect)?.letter).length}/{activeTopic.questions.length} corretas ({Math.round(activeTopic.questions.filter(q=>activeTopic.answers?.[q.id]===q.options.find(o=>o.isCorrect)?.letter).length/activeTopic.questions.length*100)}%)</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button onClick={()=>openBizuario(activeTopic,activeSubject)} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-yellow-600 text-white hover:bg-yellow-700"><BrainIcon className="w-5 h-5"/>{activeTopic.bizuario?'Bizuário ✓':'Bizuário'}</button>
                    </div>

                  </div>
                )}
              </div>
            )}
          </div>
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
                  {uploadedFiles.length>0&&<div className="flex flex-wrap gap-2 mb-3">{uploadedFiles.map((f,i)=><div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border ${darkMode?'bg-gray-700 border-gray-600 text-gray-200':'bg-gray-100 border-gray-200 text-gray-700'}`}><FileText className="w-4 h-4 text-yellow-600"/><span className="max-w-[120px] truncate">{f.name}</span><button onClick={()=>setUploadedFiles(p=>p.filter((_,j)=>j!==i))} className="text-gray-400 hover:text-red-500"><XCircle className="w-4 h-4"/></button></div>)}</div>}
                  {uploadedImages.length>0&&<div className="flex flex-wrap gap-2 mb-3">{uploadedImages.map((img,i)=><div key={i} className="relative group"><img src={img.preview} alt="" className="w-16 h-16 object-cover rounded-lg border-2 border-yellow-400"/><button onClick={()=>setUploadedImages(p=>p.filter((_,j)=>j!==i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100">×</button></div>)}</div>}
                  <textarea value={materialText} onChange={e=>setMaterialText(e.target.value)} placeholder="Insira textos base, anotações, transcrições..." className={`w-full h-48 p-4 rounded-xl border resize-none outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button onClick={()=>imageInputRef.current.click()} className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><ImageIcon className="w-5 h-5"/></button>
                    <button onClick={()=>fileInputRef.current.click()} className="p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"><FileUp className="w-5 h-5"/></button>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" accept=".txt,.md,.pdf,.doc,.docx"/>
                  <input type="file" ref={imageInputRef} onChange={handleImageUpload} multiple className="hidden" accept="image/*"/>
                </div>
                {isBig()&&<div className={`text-xs p-3 rounded-lg flex gap-2 ${darkMode?'bg-yellow-900/20 text-yellow-300':'bg-yellow-50 text-yellow-800'}`}>⚠️ Material extenso — os primeiros ~45k tokens serão usados.</div>}
                <button onClick={startCreation} disabled={isBusy||isUploading||!newSubName} className="w-full bg-yellow-600 text-white py-4 rounded-xl font-bold disabled:opacity-50 flex justify-center items-center gap-2">
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
                  <button onClick={finalizeSub} className="flex-[2] bg-yellow-600 text-white py-4 rounded-xl font-bold hover:bg-yellow-700">Confirmar e Salvar</button>
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
                  <ul className={`absolute z-20 w-[calc(50%-0.5rem)] mt-1 rounded-xl border shadow-lg overflow-hidden ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
                    {library.filter(s=>s.source==='external'&&s.id!=='imported-folder'&&s.title.toLowerCase().includes(pasteSubName.toLowerCase())).map((s,i)=><li key={i} onMouseDown={()=>setPasteSubName(s.title)} className={`p-3 cursor-pointer ${darkMode?'hover:bg-gray-700':'hover:bg-gray-50'}`}>{s.title}</li>)}
                  </ul>
                )}
              </div>
              <input value={pasteTopic} onChange={e=>setPasteTopic(e.target.value)} placeholder="Nome do Bloco — ex: Bloco 1" className={`w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
            </div>
            <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)} placeholder="Cole as questões aqui..." className={`w-full h-[40vh] p-6 rounded-xl border font-mono text-sm resize-none outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-800 border-gray-700 text-gray-300':'bg-white border-gray-200'}`}/>
            <button onClick={handlePasteImport} disabled={!pasteText.trim()} className="mt-4 w-full bg-yellow-600 text-white py-4 rounded-xl font-bold hover:bg-yellow-700 disabled:opacity-50">Salvar Importação</button>
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
          const totalCorrect  = favItems.filter(({topic,question})=>topic.answers?.[question.id]===question.options.find(o=>o.isCorrect)?.letter).length;
          const pct = totalAnswered>0 ? Math.round(totalCorrect/totalAnswered*100) : 0;

          const handleFavAnswer = async (subject, topic, qId, letter) => {
            await updateSubject({...subject, topics:subject.topics.map(t2=>t2.id===topic.id?{...t2,answers:{...t2.answers,[qId]:letter}}:t2)});
          };
          const handleFavUnfavorite = async (subject, topic, qId) => {
            const nf=(topic.favorites||[]).filter(f=>f!==qId);
            await updateSubject({...subject,topics:subject.topics.map(t2=>t2.id===topic.id?{...t2,favorites:nf}:t2)});
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
                <div className="text-center py-16 opacity-40">
                  <Heart className="w-16 h-16 mx-auto mb-4"/>
                  <p className="font-bold">Nenhuma questão favoritada ainda.</p>
                  <p className="text-sm mt-2">Use o ♥ em qualquer questão para favoritar.</p>
                </div>
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
                      apiKey={getKey()} oracleLength={settings.oracleLength}
                    />
                  ))}
                </div>
              ))}
            </div>
          );
        })()}

        {/* ── VIDEOAULAS ── */}
        {view==='videoaulas'&&(()=>{
          const dm = darkMode;
          const DEMO_DATA = {
            "Cardiologia": {
              "CARDIO 01 — SCA": [
                {bunny_id:"d1",title:"Fisiopatologia da SCA",embed_url:"https://iframe.mediadelivery.net/embed/0/0",has_transcript:false},
                {bunny_id:"d2",title:"IAM com Supra de ST",embed_url:"https://iframe.mediadelivery.net/embed/0/0",has_transcript:false},
                {bunny_id:"d3",title:"IAM sem Supra e Angina Instável",embed_url:"https://iframe.mediadelivery.net/embed/0/0",has_transcript:false},
                {bunny_id:"d4",title:"Tratamento da SCA",embed_url:"https://iframe.mediadelivery.net/embed/0/0",has_transcript:false},
              ],
              "CARDIO 02 — IC": [
                {bunny_id:"d5",title:"Fisiopatologia da IC",embed_url:"https://iframe.mediadelivery.net/embed/0/0",has_transcript:false},
                {bunny_id:"d6",title:"Diagnóstico e Estadiamento",embed_url:"https://iframe.mediadelivery.net/embed/0/0",has_transcript:false},
                {bunny_id:"d7",title:"Tratamento Farmacológico",embed_url:"https://iframe.mediadelivery.net/embed/0/0",has_transcript:false},
              ],
              "CARDIO 03 — Valvulopatias": [
                {bunny_id:"d8",title:"Estenose Aórtica",embed_url:"https://iframe.mediadelivery.net/embed/0/0",has_transcript:false},
                {bunny_id:"d9",title:"Insuficiência Mitral",embed_url:"https://iframe.mediadelivery.net/embed/0/0",has_transcript:false},
              ],
            },
            "Reumatologia": {
              "REU 01 — Artrite": [
                {bunny_id:"d10",title:"Artrite Reumatoide",embed_url:"https://iframe.mediadelivery.net/embed/0/0",has_transcript:false},
                {bunny_id:"d11",title:"Espondiloartrites",embed_url:"https://iframe.mediadelivery.net/embed/0/0",has_transcript:false},
              ],
              "REU 02 — Cristais": [
                {bunny_id:"d12",title:"Gota e Hiperuricemia",embed_url:"https://iframe.mediadelivery.net/embed/0/0",has_transcript:false},
                {bunny_id:"d13",title:"Pseudogota",embed_url:"https://iframe.mediadelivery.net/embed/0/0",has_transcript:false},
              ],
            },
          };
          const isDemo = !videoaulasData || Object.keys(videoaulasData).length===0;
          const raw = isDemo ? DEMO_DATA : videoaulasData;

          // Sort subjects by chronogram
          const subjects = Object.keys(raw).sort((a,b) => {
            const ai = SUBJECT_ORDER.findIndex(s=>a.toLowerCase().includes(s.toLowerCase())||s.toLowerCase().includes(a.toLowerCase()));
            const bi = SUBJECT_ORDER.findIndex(s=>b.toLowerCase().includes(s.toLowerCase())||s.toLowerCase().includes(b.toLowerCase()));
            return (ai===-1?99:ai) - (bi===-1?99:bi);
          });

          // Build merged + sorted data
          // The JSON has pairs: "NEFRO 1 - Name" (main) + "NEFRO 1 - Name ⭐" (bonus)
          // Merge them into one group, sort groups numerically, main aulas first then bonus
          const data = {};
          subjects.forEach(subj => {
            const rawSubs = raw[subj];
            // Group by base key (strip trailing ⭐ and whitespace)
            const groups = {};
            Object.entries(rawSubs).forEach(([key, aulas]) => {
              const isBonus = /⭐/.test(key);
              const baseKey = key.replace(/\s*⭐\s*$/, '').trim();
              if (!groups[baseKey]) groups[baseKey] = { main: [], bonus: [] };
              if (isBonus) {
                groups[baseKey].bonus.push(...aulas);
              } else {
                groups[baseKey].main.push(...aulas);
              }
            });
            // Sort groups: extract number from key (e.g. "NEFRO 1" → 1, "NEFRO 2" → 2)
            const sortedKeys = Object.keys(groups).sort((a, b) => {
              return getSubtopicOrder(a) - getSubtopicOrder(b);
            });
            data[subj] = {};
            sortedKeys.forEach(key => {
              // Sort: "Introdução (X)" first, then main in JSON order, then bonus
              const isIntro = (a) => /^\d+\s*[-–]\s*Introdução\s*\(/i.test(a.title) || /^Introdução\s*\(/i.test(a.title);
              const introMain = groups[key].main.filter(isIntro);
              const otherMain = groups[key].main.filter(a => !isIntro(a));
              data[subj][key] = [...introMain, ...otherMain, ...groups[key].bonus];
            });
          });

          // Helper: get clean short display name for sidebar
          const shortSubName = (key) => {
            // Strip specialty code prefix: "NEFRO 1 - INTRODUÇÃO A NEFRO" → "Introdução à Nefro"
            // Or shorten to reasonable length
            const clean = key.replace(/^[A-ZÁÉÍÓÚ]{2,6}\s*\d+\s*[-–]\s*/, '').trim();
            return clean.length > 32 ? clean.substring(0,31)+'…' : clean;
          };
          const allAulas = Object.values(data).flatMap(s=>Object.values(s).flat());
          const watchedCount = allAulas.filter(a=>watchedAulas[getAulaId(a)]).length;
          const effSubject  = activeSubjectVid  || subjects[0] || null;
          // Strip trailing ⭐ in case old state has bonus subtopic key
          const effSubtopicRaw = activeSubtopicVid || (effSubject ? Object.keys(data[effSubject]||{})[0] : null);
          const effSubtopic = effSubtopicRaw?.replace(/\s*⭐\s*$/, '').trim() || null;
          const effAulas    = (effSubject&&effSubtopic) ? (data[effSubject]?.[effSubtopic]||[]) : [];
          const effAula     = activeAula || effAulas[0] || null;
          const effIdx      = effAulas.findIndex(a=>getAulaId(a)===getAulaId(effAula));
          const prevAula    = effIdx>0 ? effAulas[effIdx-1] : null;
          const nextAula    = effIdx<effAulas.length-1 ? effAulas[effIdx+1] : null;
          const sideBorder  = dm?'border-gray-700':'border-gray-200';
          const sideBg      = dm?'bg-gray-800/50':'bg-white';
          const textMuted   = dm?'text-gray-400':'text-gray-500';

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
                    const sAulas=Object.values(data[subject]).flat();
                    const sW=sAulas.filter(a=>watchedAulas[getAulaId(a)]).length;
                    const isExp=expandedSubjectsVid[subject]??(subject===effSubject);
                    return (
                      <div key={subject} className={`border-b ${sideBorder}`}>
                        <button onClick={()=>{setExpandedSubjectsVid(p=>({...p,[subject]:!isExp}));setActiveSubjectVid(subject);}}
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-left ${dm?'hover:bg-gray-700/60':'hover:bg-gray-50'}`}>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold truncate ${effSubject===subject?'text-yellow-500':''}`}>{subject.replace(/\s*⭐\s*/g,'').trim()}</p>
                            <p className={`text-[10px] mt-0.5 ${textMuted}`}>{sW}/{sAulas.length}</p>
                          </div>
                          {isExp?<ChevronDown className="w-3 h-3 opacity-30 ml-1 flex-shrink-0"/>:<ChevronRight className="w-3 h-3 opacity-30 ml-1 flex-shrink-0"/>}
                        </button>
                        {isExp&&Object.entries(data[subject]).map(([sub,aulas])=>{
                          const isActSub=effSubject===subject&&effSubtopic===sub;
                          return (
                            <div key={sub}>
                              <button onClick={()=>{setActiveSubjectVid(subject);setActiveSubtopicVid(sub);setActiveAula(data[subject][sub]?.[0]||null);}}
                                className={`w-full text-left px-3 py-1.5 pl-6 text-[11px] font-semibold transition-colors ${isActSub?(dm?'text-yellow-400 bg-yellow-900/30':'text-yellow-700 bg-yellow-50'):(dm?'text-gray-400 hover:bg-gray-700/40':'text-gray-500 hover:bg-gray-50')}`}>
                                {shortSubName(sub)}
                              </button>
                              {isActSub&&aulas.map((aula,ai)=>{
                                const isAct=getAulaId(effAula)===getAulaId(aula);
                                const watched=watchedAulas[getAulaId(aula)];
                                return (
                                  <button key={getAulaId(aula)||aula.path} onClick={()=>setActiveAula(aula)}
                                    className={`w-full flex items-center gap-2 px-3 py-1.5 pl-9 text-left transition-colors ${isAct?(dm?'bg-yellow-900/40 text-yellow-300':'bg-yellow-100 text-yellow-800'):(dm?'text-gray-500 hover:bg-gray-700/30':'text-gray-500 hover:bg-gray-50')}`}>
                                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${watched?'bg-green-500 text-white':'border '+(dm?'border-gray-600':'border-gray-300')}`}>
                                      {watched?<CheckIcon className="w-2 h-2"/>:<span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 inline-block"/>}
                                    </div>
                                    <span className="text-xs truncate leading-tight">{cleanAulaTitle(aula.title)}</span>
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
              </div>

              {/* ══ MAIN ══ */}
              <div className="flex-1 overflow-y-auto" style={{height:'calc(100vh - 62px)'}}>
                <div className="flex items-center gap-2 p-3 md:hidden border-b" style={{borderColor:dm?'#374151':'#e5e7eb'}}>
                  <button onClick={()=>setView('library')} className={`p-1.5 rounded ${dm?'bg-gray-700 text-gray-300':'bg-gray-100 text-gray-600'}`}><ArrowLeft className="w-4 h-4"/></button>
                  <span className="text-sm font-bold text-yellow-600">Videoaulas</span>
                </div>

                {!effAula ? (
                  <div className="flex flex-col items-center justify-center h-64 opacity-30">
                    <VideoIcon className="w-12 h-12 mb-3 text-gray-400"/>
                    <p className="font-serif font-bold text-gray-400">Selecione uma aula</p>
                  </div>
                ) : (
                  <div>
                    {/* Player — full width, black bg */}
                    <div className="relative w-full bg-black" style={{aspectRatio:'16/9',maxHeight:'72vh'}}>
                      {isDemo ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{background:'#0d0d0d'}}>
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border-2 ${dm?'border-yellow-600 bg-yellow-900/30':'border-yellow-500 bg-yellow-50'}`}>
                            <PlayIcon className="w-7 h-7 text-yellow-500 ml-0.5"/>
                          </div>
                          <p className="text-white font-bold text-lg">{effAula.title}</p>
                          <p className="text-gray-500 text-sm mt-1">Player Bunny Stream</p>
                          {/* Fake controls overlay */}
                          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-10" style={{background:'linear-gradient(transparent,rgba(0,0,0,0.88))'}}>
                            <div className="mb-2">
                              <div className="h-1 bg-gray-600/60 rounded-full cursor-pointer hover:h-1.5 transition-all"><div className="h-full bg-yellow-500 rounded-full" style={{width:'34%'}}/></div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <button className="text-white/70 hover:text-white"><SkipBack className="w-4 h-4"/></button>
                                <button className="text-white/70 hover:text-white"><PlayIcon className="w-5 h-5"/></button>
                                <button className="text-white/70 hover:text-white"><SkipForward className="w-4 h-4"/></button>
                                <span className="text-xs text-gray-400 font-mono tabular-nums">14:22 / 42:00</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Speed — bottom right, dropdown on hover */}
                                <div className="relative group">
                                  <button className="text-xs text-white bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded font-bold transition-colors">1×</button>
                                  <div className="absolute bottom-9 right-0 bg-gray-900/95 border border-gray-700 rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto shadow-xl z-20 min-w-[72px]">
                                    {['0.5','0.75','1','1.25','1.5','2'].map(s=>(
                                      <div key={s} className={`px-4 py-2 text-xs cursor-pointer hover:bg-white/10 text-center font-medium ${s==='1'?'text-yellow-400 font-bold':'text-gray-200'}`}>{s}×</div>
                                    ))}
                                  </div>
                                </div>
                                {/* Fullscreen */}
                                <button className="text-white/70 hover:text-white">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <iframe key={getAulaId(effAula)||effAula.embed_url} src={`${effAula.embed_url}?responsive=true&preload=false&defaultQuality=720p&qualities=720p,480p`}
                          className="absolute inset-0 w-full h-full" style={{border:'none'}}
                          allow="accelerometer;gyroscope;encrypted-media;picture-in-picture" allowFullScreen/>
                      )}
                    </div>

                    {/* Info below player */}
                    <div className={`px-5 lg:px-8 py-4 ${dm?'bg-gray-900':'bg-white'}`}>
                      <p className={`text-xs mb-2 flex items-center gap-1 flex-wrap ${textMuted}`}>
                        <span>{effSubject?.replace(/\s*⭐\s*/g,'')}</span><ChevronRight className="w-3 h-3 opacity-40"/><span>{shortSubName(effSubtopic||'')}</span><ChevronRight className="w-3 h-3 opacity-40"/>
                        <span className={dm?'text-gray-200':'text-gray-700'}>{cleanAulaTitle(effAula.title)}</span>
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <h2 className={`text-xl font-serif font-bold ${dm?'text-white':'text-gray-900'}`}>{cleanAulaTitle(effAula.title)}</h2>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={()=>!isDemo&&markAulaWatched(getAulaId(effAula))}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all ${watchedAulas[getAulaId(effAula)]?'bg-green-500 text-white':('border '+(dm?'border-green-700 text-green-400 hover:bg-green-900/20':'border-green-400 text-green-700 hover:bg-green-50'))}`}>
                            <CheckIcon className="w-4 h-4"/>
                            {watchedAulas[getAulaId(effAula)]?'Assistida':'Marcar assistida'}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-stretch gap-3 mb-4">
                        <button onClick={()=>prevAula&&(setActiveAula(prevAula))} disabled={!prevAula}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold flex-1 border transition-colors disabled:opacity-30 ${dm?'border-gray-700 hover:bg-gray-800 text-gray-300':'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                          <SkipBack className="w-4 h-4 flex-shrink-0"/>
                          <div className="text-left min-w-0">
                            <p className="text-[10px] opacity-40 uppercase font-bold leading-none mb-0.5">Anterior</p>
                            <p className="truncate text-xs">{cleanAulaTitle(prevAula?.title||'—')}</p>
                          </div>
                        </button>
                        <div className={`flex items-center px-3 rounded-xl text-xs font-bold flex-shrink-0 ${dm?'bg-gray-800 text-gray-500':'bg-gray-100 text-gray-400'}`}>{effIdx+1}/{effAulas.length}</div>
                        <button onClick={()=>nextAula&&(setActiveAula(nextAula))} disabled={!nextAula}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold flex-1 border transition-colors disabled:opacity-30 justify-end text-right ${dm?'border-gray-700 hover:bg-gray-800 text-gray-300':'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                          <div className="min-w-0">
                            <p className="text-[10px] opacity-40 uppercase font-bold leading-none mb-0.5">Próxima</p>
                            <p className="truncate text-xs">{cleanAulaTitle(nextAula?.title||'—')}</p>
                          </div>
                          <SkipForward className="w-4 h-4 flex-shrink-0"/>
                        </button>
                      </div>
                      {/* Mobile aula list */}
                      <div className={`md:hidden border-t pt-4 ${sideBorder}`}>
                        <p className={`text-xs font-bold uppercase mb-2 ${textMuted}`}>{effSubtopic}</p>
                        {effAulas.map((aula,ai)=>(
                          <button key={getAulaId(aula)||aula.path} onClick={()=>setActiveAula(aula)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl mb-1.5 text-left border transition-colors ${getAulaId(effAula)===getAulaId(aula)?(dm?'border-yellow-700 bg-yellow-900/20':'border-yellow-400 bg-yellow-50'):(dm?'border-gray-700 hover:bg-gray-800':'border-gray-200 hover:bg-gray-50')}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${watchedAulas[getAulaId(aula)]?'bg-green-500 text-white':'border '+(dm?'border-gray-600 text-gray-400':'border-gray-300 text-gray-500')}`}>
                              {watchedAulas[getAulaId(aula)]?<CheckIcon className="w-3.5 h-3.5"/>:null}
                            </div>
                            <span className="text-sm">{aula.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── STATS ── */}
        {view==='stats'&&(()=>{
          const stats=getStats();
          return (
            <div className="max-w-3xl mx-auto">
              <button onClick={()=>setView('library')} className={`flex items-center gap-2 mb-6 font-bold ${darkMode?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/>Voltar</button>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-serif font-bold text-yellow-600 flex items-center gap-3"><TrendingUp className="w-8 h-8"/>Desempenho</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[{l:'Total',v:stats.tQ,c:'text-yellow-600'},{l:'Respondidas',v:stats.tA,c:'text-blue-600'},{l:'Corretas',v:stats.tC,c:'text-green-600'},{l:'Aproveitamento',v:`${stats.pct}%`,c:stats.pct>=70?'text-green-600':stats.pct>=50?'text-yellow-600':'text-red-600'}].map(x=>(
                  <div key={x.l} className={`${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'} p-4 rounded-xl border text-center`}><div className={`text-3xl font-bold ${x.c}`}>{x.v}</div><div className="text-xs opacity-50 uppercase mt-1">{x.l}</div></div>
                ))}
              </div>
              {stats.due>0&&(
                <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between ${darkMode?'bg-orange-900/20 border-orange-700':'bg-orange-50 border-orange-200'}`}>
                  <div className="flex items-center gap-3"><CalendarCheck className="w-5 h-5 text-orange-600"/><span className="font-bold text-orange-600">{stats.due} questão(ões) para revisão hoje</span></div>
                  <button onClick={startReview} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-600">Revisar</button>
                </div>
              )}
              {/* Collapsible folders */}
              <div className="space-y-3">
                {Object.values(stats.bySubject).filter(s=>s.total>0).map(subj=>{
                  const pct=subj.answered>0?Math.round(subj.correct/subj.answered*100):0;
                  const open=statsExpanded[subj.title];
                  return (
                    <div key={subj.title} className={`${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'} rounded-xl border overflow-hidden`}>
                      <button onClick={()=>setStatsExpanded(p=>({...p,[subj.title]:!p[subj.title]}))} className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity">
                        <div className="flex items-center gap-3">
                          <FolderIcon className="w-5 h-5 text-yellow-600"/>
                          <div className="text-left">
                            <p className="font-bold text-sm">{subj.title}</p>
                            <p className="text-xs opacity-40">{subj.topics.length} tópicos • {subj.answered}/{subj.total}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-bold ${pct>=70?'text-green-600':pct>=50?'text-yellow-600':'text-red-500'}`}>{subj.answered>0?`${pct}%`:'–'}</span>
                          {open?<ChevronDown className="w-4 h-4 opacity-40"/>:<ChevronRight className="w-4 h-4 opacity-40"/>}
                        </div>
                      </button>
                      {open&&(
                        <div className={`border-t ${darkMode?'border-gray-700':'border-gray-100'}`}>
                          {subj.topics.map((t,i)=>(
                            <div key={i} className={`p-3 flex items-center justify-between ${i>0?(darkMode?'border-t border-gray-700':'border-t border-gray-100'):''}`}>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{t.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="w-32 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className={`h-full ${t.pct>=70?'bg-green-500':t.pct>=50?'bg-yellow-500':'bg-red-400'}`} style={{width:t.answered>0?`${t.pct}%`:'0%'}}/>
                                  </div>
                                  <span className="text-xs opacity-40">{t.correct}/{t.answered}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${t.pct>=70?'text-green-600':t.pct>=50?'text-yellow-600':'text-red-500'}`}>{t.answered>0?`${t.pct}%`:'–'}</span>
                                <button onClick={()=>{const s=library.find(x=>x.id===t.subjectId);const tp=s?.topics.find(x=>x.id===t.id);if(tp&&s)openBizuario(tp,s);}} title="Bizuário" className={`p-1.5 rounded-lg ${(()=>{const s=library.find(x=>x.id===t.subjectId);return s?.topics.find(x=>x.id===t.id)?.bizuario;})()?(darkMode?'text-green-400 hover:bg-green-900/20':'text-green-600 hover:bg-green-50'):(darkMode?'text-yellow-500 hover:bg-yellow-900/20':'text-yellow-600 hover:bg-yellow-50')}`}><BrainIcon className="w-4 h-4"/></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {Object.values(stats.bySubject).filter(s=>s.total>0).length===0&&<p className="text-center opacity-40 py-8">Nenhum dado ainda. Responda algumas questões!</p>}
              </div>
            </div>
          );
        })()}

        {/* ── REVIEW ── */}
        {view==='review'&&(
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <button onClick={()=>setView('library')} className={`flex items-center gap-2 mb-2 font-bold ${darkMode?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/>Voltar</button>
                <h2 className="text-2xl font-serif font-bold text-yellow-600 flex items-center gap-3"><CalendarCheck className="w-7 h-7"/>Revisão Espaçada</h2>
              </div>
              <button onClick={()=>setReviewSchedule(!reviewSchedule)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${reviewSchedule?(darkMode?'border-yellow-600 bg-yellow-900/20 text-yellow-400':'border-yellow-400 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-600 text-gray-400':'border-gray-200 text-gray-600')}`}><Clock className="w-4 h-4"/>Próximas</button>
            </div>
            {reviewSchedule?(
              <div>
                <h3 className="font-bold text-lg mb-4 opacity-70">Próximas 7 Dias</h3>
                {getUpcomingReviews().length===0?<p className="opacity-40 text-center py-8">Nenhuma revisão agendada para os próximos 7 dias.</p>:(
                  <div className="space-y-2">
                    {getUpcomingReviews().map((item,i)=>(
                      <div key={i} className={`p-4 rounded-xl border ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium line-clamp-1">{item.question.statement.substring(0,80)}...</p>
                            <p className="text-xs opacity-40 mt-1">{item.subjectTitle} › {item.topicTitle}</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ml-3 ${daysUntil(item.dueDate)===0?'bg-red-100 text-red-700':daysUntil(item.dueDate)<=2?'bg-orange-100 text-orange-700':'bg-gray-100 text-gray-600'}`}>{formatDate(item.dueDate)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ):(
              <div>
                <p className="text-sm opacity-60 mb-6">{reviewQs.length} questões para hoje • {Object.keys(reviewAns).length} respondidas</p>
                {reviewQs.map((item,i)=>(
                  <QuestionCard key={i} question={item.question} index={i} selectedLetter={reviewAns[item.question.id]} onAnswer={l=>handleReviewAns(item.question.id,l,item.topicId,item.subjectId)} darkMode={darkMode} isFavorite={false} onToggleFavorite={()=>{}} apiKey={getKey()} oracleLength={settings.oracleLength}/>
                ))}
                {Object.keys(reviewAns).length===reviewQs.length&&reviewQs.length>0&&(
                  <div className="text-center py-10">
                    <Award className="w-16 h-16 mx-auto text-yellow-500 mb-4"/>
                    <h3 className="text-2xl font-serif font-bold text-yellow-600 mb-2">Revisão Concluída!</h3>
                    <button onClick={()=>setView('library')} className="mt-4 bg-yellow-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-yellow-700">Voltar</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── EXAM SETUP MODAL ── */}
        {examSetup!==null&&(
          // Bug 4: backdrop click closes modal
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4" onClick={()=>{setExamSetup(null);setExamTopics([]);}}>
            <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border p-8 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}
              onClick={e=>e.stopPropagation()} // Bug 4: prevent backdrop close when clicking inside
            >
              <h2 className="text-2xl font-serif font-bold text-yellow-600 mb-6 flex items-center gap-3"><Zap className="w-7 h-7"/>Configurar Prova</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
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
              <label className="block text-xs font-bold uppercase mb-3 opacity-50">Tópicos ({examTopics.length} selecionados)</label>
              <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
                {library.flatMap(s=>s.topics.filter(t=>t.questions?.length>0).map(t=>({subject:s,topic:t}))).map(({subject,topic},i)=>{
                  const key=`${subject.id}-${topic.id}`; const checked=examTopics.some(x=>x.key===key);
                  return (
                    <label key={i} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${checked?(darkMode?'border-yellow-600 bg-yellow-900/20':'border-yellow-400 bg-yellow-50'):(darkMode?'border-gray-700 hover:bg-gray-700':'border-gray-200 hover:bg-gray-50')}`}>
                      <input type="checkbox" checked={checked} onChange={()=>setExamTopics(p=>p.some(x=>x.key===key)?p.filter(x=>x.key!==key):[...p,{key,subject,topic}])} className="accent-yellow-600"/>
                      <div><p className="text-sm font-bold">{topic.title}</p><p className="text-xs opacity-40">{subject.title} • {topic.questions.length} questões</p></div>
                    </label>
                  );
                })}
              </div>
              <div className="flex gap-4">
                <button onClick={()=>{setExamSetup(null);setExamTopics([]);}} className={`flex-1 py-3 rounded-xl font-bold ${darkMode?'bg-gray-700 hover:bg-gray-600':'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
                <button
                  disabled={!examTopics.length}
                  className="flex-1 bg-yellow-600 text-white py-3 rounded-xl font-bold hover:bg-yellow-700 disabled:opacity-50"
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
                  const correct=activeExam.questions.filter(q=>activeExam.answers[q.id]===q.options.find(o=>o.isCorrect)?.letter).length;
                  const skipped=activeExam.questions.filter(q=>activeExam.answers[q.id]==='SKIPPED').length;
                  const total=activeExam.questions.length; const pct=Math.round(correct/total*100);
                  const byTopic={};
                  activeExam.questions.forEach(q=>{
                    if(!byTopic[q._topicTitle])byTopic[q._topicTitle]={c:0,t:0,s:0};
                    byTopic[q._topicTitle].t++;
                    if(activeExam.answers[q.id]===q.options.find(o=>o.isCorrect)?.letter) byTopic[q._topicTitle].c++;
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
                              apiKey={getKey()} oracleLength={settings.oracleLength} revealMode="revealed"/>
                          ))}
                        </div>
                      )}
                      <button onClick={()=>{setActiveExam(null);setView('library');}} className="w-full bg-yellow-600 text-white py-3 rounded-xl font-bold hover:bg-yellow-700">Voltar</button>
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
                    onAnswer={l=>setActiveExam(p=>({...p,answers:{...p.answers,[q.id]:l}}))}
                    darkMode={darkMode}
                    isFavorite={isExamQuestionFav(q)}
                    onToggleFavorite={()=>handleExamFavorite(q)}
                    apiKey={getKey()} oracleLength={settings.oracleLength}
                    revealMode={activeExam.blindMode?'selected':'normal'}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS ── */}
        {view==='settings'&&(
          <div className="max-w-xl mx-auto space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={()=>setView('library')} className={`p-2 rounded-full ${darkMode?'bg-gray-700':'bg-gray-200'}`}><ArrowLeft className="w-5 h-5"/></button>
              <h2 className="text-3xl font-serif font-bold text-yellow-600">Configurações</h2>
            </div>
            {/* API Keys */}
            <div>
              <label className="block text-xs font-bold uppercase mb-3 opacity-50 flex items-center gap-2"><Key className="w-4 h-4"/>Chaves API (Gemini)</label>
              {[1,2,3].map(n=>{const kv=n===1?(settings.apiKey1!==undefined?settings.apiKey1:settings.apiKey):settings[`apiKey${n}`];const disabled=n>1&&(!kv||!kv.trim());return(
                <div key={n} className="flex items-center gap-3 mb-3">
                  <input type="radio" name="ak" checked={(settings.activeKeyIndex||1)===n} onChange={()=>saveSettings({...settings,activeKeyIndex:n})} disabled={disabled} className="w-5 h-5 accent-yellow-600 disabled:opacity-30"/>
                  <input type="password" value={kv||''} onChange={e=>{const ns={...settings};if(n===1){ns.apiKey1=e.target.value;ns.apiKey=e.target.value;}else{ns[`apiKey${n}`]=e.target.value;}setSettings(ns);}} onBlur={()=>saveSettings(settings)} placeholder={`Chave ${n}...`} className={`flex-1 p-3 rounded-lg border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
                </div>
              );})}
            </div>
            {/* Oracle Length */}
            <div>
              <label className="block text-xs font-bold uppercase mb-3 opacity-50 flex items-center gap-2"><MessageCircle className="w-4 h-4"/>Resposta do Chat</label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(ORACLE_LENGTH).map(([k,c])=>(
                  <button key={k} onClick={()=>{const ns={...settings,oracleLength:k};setSettings(ns);saveSettings(ns);}}
                    className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${settings.oracleLength===k?(darkMode?'border-yellow-500 bg-yellow-900/30 text-yellow-400':'border-yellow-500 bg-yellow-50 text-yellow-700'):(darkMode?'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500':'border-gray-200 bg-white text-gray-700 hover:border-gray-300')}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Numbers */}
            <div className="grid grid-cols-2 gap-4">
              {[{l:'Tópicos (1-10)',k:'numTopics',mn:1,mx:10},{l:'Subtópicos (1-20)',k:'numSubtopics',mn:1,mx:20},{l:'Questões/Subtópico (1-5)',k:'qPerSub',mn:1,mx:5}].map(f=>(
                <div key={f.k}><label className="block text-xs font-bold uppercase mb-2 opacity-50">{f.l}</label><input type="number" min={f.mn} max={f.mx} value={settings[f.k]} onChange={e=>setSettings({...settings,[f.k]:e.target.value})} onBlur={()=>{let v=parseInt(settings[f.k]);if(isNaN(v)||v<f.mn)v=f.mn;if(v>f.mx)v=f.mx;const ns={...settings,[f.k]:v};setSettings(ns);saveSettings(ns);}} className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}/></div>
              ))}
              <div><label className="block text-xs font-bold uppercase mb-2 opacity-50">Alternativas</label><select value={settings.numAlternatives||5} onChange={e=>{const ns={...settings,numAlternatives:parseInt(e.target.value)};setSettings(ns);saveSettings(ns);}} className={`w-full p-3 rounded-lg border outline-none ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}><option value={4}>4 (A-D)</option><option value={5}>5 (A-E)</option></select></div>
            </div>
            <div><label className="block text-xs font-bold uppercase mb-2 opacity-50">Prompt Extra</label><textarea value={settings.customPrompt} onChange={e=>setSettings({...settings,customPrompt:e.target.value})} onBlur={()=>saveSettings(settings)} placeholder="Instruções adicionais para o Oráculo..." className={`w-full h-28 p-4 rounded-lg border resize-none outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}/></div>
            <button onClick={()=>{saveSettings(settings);setView('library');}} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-4 rounded-xl font-bold">Salvar</button>
          </div>
        )}
      </main>

      {/* ── SEARCH OVERLAY ── */}
      {searchOpen&&(
        <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 p-4 pt-20">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
            <div className={`flex items-center gap-3 p-4 border-b ${darkMode?'border-gray-700':'border-gray-200'}`}>
              <SearchIcon className="w-5 h-5 opacity-40"/>
              <input autoFocus type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Buscar em toda a biblioteca..." className={`flex-1 outline-none text-base ${darkMode?'bg-transparent text-white':'text-gray-900'}`}/>
              <button onClick={()=>{setSearchOpen(false);setSearchQuery('');}} className="opacity-40 hover:opacity-100 text-lg font-bold">×</button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {searchQuery.length<2?<p className="text-center py-10 opacity-40 text-sm">Digite ao menos 2 caracteres...</p>:(()=>{
                const r=getSearchResults(searchQuery);
                return r.length===0?<p className="text-center py-10 opacity-40 text-sm">Nenhum resultado para "{searchQuery}"</p>:(
                  <div>
                    <p className={`text-xs font-bold uppercase px-4 py-2 opacity-40 border-b ${darkMode?'border-gray-700':''}`}>{r.length} resultado(s)</p>
                    {r.map(({subject,topic,question},i)=>(
                      <div key={i} onClick={()=>{setSearchOpen(false);setSearchQuery('');setActiveSubjectId(subject.id);setActiveTopicId(topic.id);setShowOnlyWrong(false);setView('topic');}} className={`p-4 border-b cursor-pointer ${darkMode?'border-gray-700 hover:bg-gray-700':'border-gray-100 hover:bg-gray-50'}`}>
                        <p className="text-xs opacity-40 mb-1">{subject.title} › {topic.title}</p>
                        <p className="text-sm line-clamp-2">{question.statement.substring(0,150)}...</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── EXPORT MODAL ── */}
      {exportModal&&<ExportModal topic={exportModal.topic} subject={exportModal.subject} onClose={()=>setExportModal(null)} darkMode={darkMode}/>}

      {/* ── INSIGHTS MODAL ── */}
      {bizuarioModal&&<BizuarioModal topicTitle={bizuarioModal.topicTitle} subjectTitle={bizuarioModal.subjectTitle} questions={bizuarioModal.questions||[]} subtopics={bizuarioModal.subtopics||[]} topicContexts={bizuarioModal.topicContexts||null} apiKey={getKey()} darkMode={darkMode} onClose={()=>setBizuarioModal(null)} cachedText={bizuarioModal.cachedText} onSave={bizuarioModal.onSave} onRotateKey={rotateKey}/>}

      {/* ── REGEN MODAL ── */}
      {regenModal&&(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
          <div className={`w-full max-w-md rounded-2xl p-8 border-2 border-yellow-600 ${darkMode?'bg-gray-900 text-white':'bg-white text-gray-900'}`}>
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4"><RotateCcw className="w-8 h-8 text-yellow-600"/></div>
              <h3 className="text-2xl font-serif font-bold mb-2">Recriar Bloco</h3>
              <p className="mb-6 opacity-70 text-sm">As questões atuais serão substituídas.</p>
              <textarea value={regenPrompt} onChange={e=>setRegenPrompt(e.target.value)} placeholder="Foco específico (opcional)..." className={`w-full h-20 p-3 rounded-lg border resize-none outline-none mb-6 text-sm ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-200'}`}/>
              <div className="flex gap-4 w-full">
                <button onClick={()=>setRegenModal(false)} className={`flex-1 py-3 rounded-xl font-bold ${darkMode?'bg-gray-800':'bg-gray-100'}`}>Cancelar</button>
                <button onClick={()=>{setRegenModal(false);generateBatch(activeTopic.id,regenPrompt);setRegenPrompt('');}} className="flex-1 py-3 bg-yellow-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"><Sparkles className="w-4 h-4"/>Recriar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STANDARD MODALS ── */}
      {errorModal&&<GModal title={errorModal.title} message={errorModal.message} link={errorModal.link} confirmText={errorModal.confirmText||'OK'} onConfirm={errorModal.onConfirm||(()=>setErrorModal(null))} onCancel={errorModal.onCancel||(()=>setErrorModal(null))} actionLabel={errorModal.actionLabel} onAction={errorModal.onAction} darkMode={darkMode} isAlert={errorModal.isAlert!==false}/>}
      {deleteId?.type==='subject'&&<GModal title="Excluir Assunto?" message="Esta ação é permanente." confirmText="Excluir" onConfirm={()=>{removeSubject(deleteId.id);setDeleteId(null);}} onCancel={()=>setDeleteId(null)} darkMode={darkMode}/>}
      {deleteId?.type==='reset'&&<GModal title="Limpar Progresso?" message="Apagar todas as respostas deste bloco?" confirmText="Limpar" onConfirm={()=>{resetAnswers();setDeleteId(null);}} onCancel={()=>setDeleteId(null)} darkMode={darkMode}/>}
      {editingSub&&<GModal title="Renomear" message="" confirmText="Renomear" onConfirm={async()=>{const s=library.find(x=>x.id===editingSub);if(s)await updateSubject({...s,title:editingSubName.trim()});setEditingSub(null);}} onCancel={()=>setEditingSub(null)} darkMode={darkMode}><input value={editingSubName} onChange={e=>setEditingSubName(e.target.value)} className={`w-full p-4 mb-6 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 font-bold ${darkMode?'bg-gray-700 border-gray-600 text-white':'bg-gray-50 border-gray-200'}`} autoFocus/></GModal>}
      {editingTopic&&<GModal title="Renomear Bloco" message="" confirmText="Renomear" onConfirm={async()=>{if(!activeSubject)return;await updateSubject({...activeSubject,topics:activeSubject.topics.map(t=>t.id===editingTopic?{...t,title:editingTopicName.trim()}:t)});setEditingTopic(null);}} onCancel={()=>setEditingTopic(null)} darkMode={darkMode}><input value={editingTopicName} onChange={e=>setEditingTopicName(e.target.value)} className={`w-full p-4 mb-6 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 font-bold ${darkMode?'bg-gray-700 border-gray-600 text-white':'bg-gray-50 border-gray-200'}`} autoFocus/></GModal>}
    </div>
  );
}