import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

// --- Configuração Oficial do Firebase do Usuário ---
const firebaseConfig = {
  apiKey: "AIzaSyDjdoVMrVg7dlIJLr280-thZkjrpFeChL4",
  authDomain: "agora-do-saber.firebaseapp.com",
  projectId: "agora-do-saber",
  storageBucket: "agora-do-saber.firebasestorage.app",
  messagingSenderId: "169091563204",
  appId: "1:169091563204:web:de924d4507acb1649e9391",
  measurementId: "G-X7CEZMXVL1"
};

// Inicialização Segura (Evita crash ao salvar/recarregar no Canvas)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// --- Ícones Temáticos (Grécia / Filosofia) ---
const Landmark = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 2 7 22 7 12 2"/><line x1="6" x2="6" y1="21" y2="7"/><line x1="10" x2="10" y1="21" y2="7"/><line x1="14" x2="14" y1="21" y2="7"/><line x1="18" x2="18" y1="21" y2="7"/><line x1="2" x2="22" y1="21" y2="21"/></svg>);
const Flame = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>);
const ScrollText = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M15 8h-5"/><path d="M15 12h-5"/></svg>);
const Folder = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>);
const Feather = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="6.5"/></svg>);
const ClipboardList = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>);
const CheckCircle2 = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>);
const XCircle = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>);
const BookOpen = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>);
const ArrowLeft = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>);
const SettingsIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>);
const Trash2 = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>);
const EditIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>);
const RotateCcw = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>);
const Sun = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>);
const Moon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>);
const Award = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>);
const FileText = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>);
const FileUp = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/></svg>);
const Sparkles = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3 1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M3 5h4"/><path d="M19 17v4"/><path d="M17 19h4"/></svg>);
const Send = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>);
const Eraser = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>);
const Copy = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>);
const Key = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/></svg>);
const LogOut = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
const UserIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const GoogleIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24" height="24" className={className}><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>);
const Shield = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);

const Spinner = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ animation: 'spin-animation 1s linear infinite', transformOrigin: 'center' }}>
    <style>{`@keyframes spin-animation { 100% { transform: rotate(360deg); } }`}</style>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

// --- API Gemini (Com suporte robusto a 503 e Quota) ---
const callGemini = async (prompt, systemPrompt, userApiKey) => {
  if (!userApiKey) {
    throw new Error("API_KEY_MISSING");
  }

  // Utilizando o Gemini 2.5 exatamente como solicitado
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${userApiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] }
  };

  const retry = async (n, delay) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.status === 429) throw new Error("QUOTA_EXCEEDED");
      if (response.status === 503) throw new Error("SERVER_OVERLOADED");
      if (response.status === 403 || response.status === 400 || response.status === 404) {
         throw new Error("API_KEY_INVALID");
      }
      if (!response.ok) throw new Error("Conexão falhou");
      
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (err) {
      // Interrompe imediatamente para não drenar as tentativas ou cotas desnecessariamente
      if (err.message === "API_KEY_INVALID" || err.message === "API_KEY_MISSING" || err.message === "QUOTA_EXCEEDED" || err.message === "SERVER_OVERLOADED") {
          throw err; 
      }
      
      if (n <= 1) throw err;
      await new Promise(r => setTimeout(r, delay));
      return retry(n - 1, delay * 2);
    }
  };
  return retry(5, 1000);
};

// --- UTILITÁRIOS DE INJEÇÃO SEGURA DE SCRIPTS ---
const loadScript = (src, globalVarName) => {
  return new Promise((resolve, reject) => {
    if (window[globalVarName]) {
      return resolve(window[globalVarName]);
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(window[globalVarName]);
    script.onerror = () => reject(new Error(`Falha ao carregar script de ${src}`));
    document.head.appendChild(script);
  });
};

const extractPdfText = async (arrayBuffer) => {
  const pdfjsLib = await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', 'pdfjsLib');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text;
};

const extractDocxText = async (arrayBuffer) => {
  const mammoth = await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js', 'mammoth');
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

// --- PARSER ---
const parseData = (text) => {
  const normalizedText = text.replace(/\r\n/g, '\n');
  let summary = '';
  const summaryRegex = /(?:^|\n)(?:###|##|\*\*)?\s*Resumo(?: de Consolidação)?\s*\n([\s\S]*)$/i;
  const summaryMatch = normalizedText.match(summaryRegex);
  if (summaryMatch && summaryMatch[1]) {
    summary = summaryMatch[1].replace(/\n---.*/g, '').trim();
  }

  const blocks = normalizedText.split(/(?=(?:^|\n)(?:\*\*|##)?\s*Questão\s*\d)/i).filter(b => b.trim() !== '');
  const questions = [];

  blocks.forEach((block, index) => {
    if (!block.match(/Alternativa correta:/i) && !block.match(/\nA\)/i)) return;
    try {
      const idMatch = block.match(/(?:\*\*|##)?\s*Questão\s*([0-9.]+)/i);
      const id = idMatch ? idMatch[1] : `ID-${index + 1}`;
      let statement = '';
      const statementStartMatch = block.match(/(?:\*\*|##)?\s*Questão.*?\n/i);
      const firstOptionMatch = block.match(/\n\s*A\)/i);
      if (statementStartMatch && firstOptionMatch) {
        const startIdx = statementStartMatch.index + statementStartMatch[0].length;
        const endIdx = firstOptionMatch.index;
        statement = block.substring(startIdx, endIdx).trim();
      }
      const options = [];
      const correctLineMatch = block.match(/Alternativa correta:/i);
      if (firstOptionMatch && correctLineMatch) {
        const optionsStr = block.substring(firstOptionMatch.index, correctLineMatch.index);
        const optionRegex = /([A-E])\)\s*([\s\S]*?)(?=(?:\n\s*[A-E]\)|$))/gi;
        let match;
        while ((match = optionRegex.exec(optionsStr)) !== null) {
          options.push({ letter: match[1].toUpperCase(), text: match[2].replace(/\*\*/g, '').trim() });
        }
      }
      const correctMatch = block.match(/Alternativa correta:\s*(?:\*\*)?\s*([A-E])/i);
      const correctLetter = correctMatch ? correctMatch[1].toUpperCase() : null;
      let explanation = '';
      const expMatch = block.match(/(?:Correção aprofundada|Explicação|Correção):/i);
      if (expMatch) {
        const startOfExp = expMatch.index + expMatch[0].length;
        let endOfExp = block.substring(startOfExp).search(/\n\s*(?:---|###\s*Resumo|(?:\*\*)?\s*Resumo)/i);
        if (endOfExp === -1) {
          explanation = block.substring(startOfExp).trim();
        } else {
          explanation = block.substring(startOfExp, startOfExp + endOfExp).trim();
        }
        explanation = explanation.replace(/^\*\*/, '').trim();
      }
      if (options.length > 0 && correctLetter) {
        const originalCorrectText = options.find(o => o.letter === correctLetter)?.text;
        const shuffledTexts = [...options.map(o => o.text)].sort(() => Math.random() - 0.5);
        const finalOptions = shuffledTexts.map((text, idx) => ({
          letter: ['A', 'B', 'C', 'D', 'E'][idx],
          text,
          isCorrect: text === originalCorrectText
        }));
        questions.push({ id, statement, options: finalOptions, explanation });
      }
    } catch (e) { console.error(e); }
  });
  return { questions, summary };
};

const formatText = (text, darkMode) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <React.Fragment>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{part.slice(2, -2)}</strong>;
        }
        return <span key={index}>{part}</span>;
      })}
    </React.Fragment>
  );
};

// --- COMPONENTES ---

const GrecianModal = ({ title, message, onConfirm, onCancel, confirmText, darkMode, children, isAlert = false, actionLabel, onAction }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
    <div className={`w-full max-w-md rounded-2xl shadow-2xl border p-8 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'}`}>
      <div className="flex flex-col items-center text-center">
        <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4">
          <Flame className="w-8 h-8 text-yellow-600" />
        </div>
        <h3 className="text-2xl font-serif font-bold mb-2">{title}</h3>
        <p className="mb-8 opacity-70 text-sm">{message}</p>
        
        {children}
        
        <div className="flex gap-3 w-full">
          {!isAlert && (
            <button onClick={onCancel} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
              Cancelar
            </button>
          )}
          
          {actionLabel && onAction ? (
             <button onClick={onAction} className={`flex-1 py-3 text-white rounded-xl font-bold shadow-md transition-colors bg-yellow-600 hover:bg-yellow-700`}>
               {actionLabel}
             </button>
          ) : (
             <button onClick={onConfirm} className={`flex-1 py-3 text-white rounded-xl font-bold shadow-md transition-colors ${isAlert ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'}`}>
               {confirmText}
             </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

const QuestionCard = ({ question, index, selectedLetter, onAnswer, darkMode }) => {
  const isAnswered = selectedLetter !== undefined && selectedLetter !== null;
  const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const tagBg = darkMode ? "bg-yellow-900 bg-opacity-30 text-yellow-300" : "bg-yellow-100 text-yellow-800";
  const statementColor = darkMode ? "text-gray-200" : "text-gray-800";
  const expBoxBg = darkMode ? "bg-yellow-900 bg-opacity-20 border-yellow-800 border-opacity-50 text-gray-200" : "bg-yellow-50 border-yellow-200 text-gray-800";

  return (
    <div className={`${cardBg} rounded-xl shadow-sm border p-4 md:p-6 mb-6 transition-all`}>
      <span className={`${tagBg} text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block`}>Questão {question.id}</span>
      <div className={`${statementColor} text-base md:text-lg mb-6 leading-relaxed whitespace-pre-wrap`}>{formatText(question.statement, darkMode)}</div>
      <div className="space-y-3 mb-6">
        {question.options.map((opt) => {
          const isSelected = selectedLetter === opt.letter;
          let btnClass = "w-full text-left flex items-start p-3 md:p-4 rounded-lg border transition-colors focus:outline-none ";
          if (!isAnswered) btnClass += darkMode ? "border-gray-600 bg-gray-800 text-gray-300 hover:border-yellow-500" : "border-gray-200 bg-white text-gray-700 hover:border-yellow-400";
          else {
            btnClass += "cursor-default ";
            if (opt.isCorrect) btnClass += darkMode ? "border-green-500 bg-green-900/20 text-green-100" : "border-green-500 bg-green-50 text-green-900";
            else if (isSelected) btnClass += darkMode ? "border-red-500 bg-red-900/20 text-red-100" : "border-red-50 text-red-900";
            else btnClass += "opacity-40";
          }
          return (
            <button key={opt.letter} disabled={isAnswered} onClick={() => onAnswer(opt.letter)} className={btnClass}>
              <div className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center font-bold mr-4 ${isAnswered && opt.isCorrect ? 'bg-green-500 text-white' : (isAnswered && isSelected ? 'bg-red-500 text-white' : (darkMode ? 'bg-gray-700' : 'bg-gray-100 text-gray-500'))}`}>{opt.letter}</div>
              <div className="pt-1 flex-1 leading-snug text-sm md:text-base">{formatText(opt.text, darkMode)}</div>
            </button>
          );
        })}
      </div>
      {isAnswered && <div className={`mt-6 p-4 md:p-5 ${expBoxBg} rounded-xl border animate-in fade-in`}>
        <h4 className="font-bold text-yellow-600 mb-3 flex items-center gap-2 uppercase text-sm"><BookOpen className="w-4 h-4" /> Sabedoria:</h4>
        <div className="text-sm md:text-base">{formatText(question.explanation, darkMode)}</div>
      </div>}
    </div>
  );
};

// --- APP PRINCIPAL ---

export default function QuestionBankApp() {
  const isCanvasEnvironment = window.location.hostname.includes('scf.usercontent.goog') || window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1';

  const defaultSettings = { 
     numTopics: 10, 
     numSubtopics: 5, 
     qPerSub: 1, 
     numAlternatives: 5, 
     customPrompt: "", 
     apiKey: "", 
     apiKey1: "", 
     apiKey2: "", 
     apiKey3: "", 
     activeKeyIndex: 1 
  };

  const [darkMode, setDarkMode] = useState(() => {
    try {
      const val = localStorage.getItem('qb_darkmode');
      return val ? JSON.parse(val) : false;
    } catch(e) {
      return false;
    }
  });
  const mainBg = darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900";
  const headerBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const titleColor = darkMode ? "text-yellow-500" : "text-yellow-700";
  const statsBadge = darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800";
  
  // --- AUTH & SYNC STATE ---
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loginView, setLoginView] = useState('login'); // 'login' | 'signup'
  const [signupUsername, setSignupUsername] = useState('');
  const [signupApiKey, setSignupApiKey] = useState('');
  
  // App States
  const [view, setView] = useState('library'); 
  const [libraryFilter, setLibraryFilter] = useState('gemini');
  const [library, setLibrary] = useState([]);
  
  const [settings, setSettingsState] = useState(defaultSettings);
  const settingsRef = useRef(defaultSettings);
  
  // Centraliza o controle do Settings para sempre atualizar a Referência
  const setSettings = (newSettings) => {
      setSettingsState(newSettings);
      settingsRef.current = newSettings;
  };
  
  const [creatorStep, setCreatorStep] = useState(1);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [materialText, setMaterialText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]); 
  const [proposedSyllabus, setProposedSyllabus] = useState('');
  const [syllabusFeedback, setSyllabusFeedback] = useState('');
  
  const [isBusy, setIsBusy] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [activeTopicId, setActiveTopicId] = useState(null);
  
  const [deleteId, setDeleteId] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [errorModal, setErrorModal] = useState(null);
  
  const [pasteInputText, setPasteInputText] = useState('');
  const [pasteSubjectName, setPasteSubjectName] = useState('');
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);
  const [pasteTopicName, setPasteTopicName] = useState('');
  
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [regeneratePrompt, setRegeneratePrompt] = useState('');

  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editingSubjectName, setEditingSubjectName] = useState('');

  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editingTopicName, setEditingTopicName] = useState('');
  
  const fileInputRef = useRef(null);

  // Favicon & Body Color
  useEffect(() => {
    document.title = "Ágora do Saber";
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 22 7 12 2"/><line x1="6" x2="6" y1="21" y2="7"/><line x1="10" x2="10" y1="21" y2="7"/><line x1="14" x2="14" y1="21" y2="7"/><line x1="18" x2="18" y1="21" y2="7"/><line x1="2" x2="22" y1="21" y2="21"/></svg>`;
    const encodedData = window.btoa(svgIcon);
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = `data:image/svg+xml;base64,${encodedData}`;
    
    document.body.style.backgroundColor = darkMode ? '#111827' : '#fafaf9';
    localStorage.setItem('qb_darkmode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Firebase Auth Setup
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        if (u.isAnonymous) {
          const localUser = localStorage.getItem('qb_username');
          if (localUser) {
             setUsername(localUser.toUpperCase());
             try {
               const localSettings = localStorage.getItem(`qb_settings_${localUser}`);
               if (localSettings) {
                   const parsed = JSON.parse(localSettings);
                   const newS = { 
                     ...defaultSettings, 
                     ...parsed, 
                     apiKey1: parsed.apiKey1 !== undefined ? parsed.apiKey1 : (parsed.apiKey || "") 
                   };
                   setSettings(newS);
               }
             } catch(e) {}
          } else {
             setLoginView('signup');
          }
        } else {
          try {
            const userDoc = await getDoc(doc(db, 'users', u.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setUsername(data.username.toUpperCase());
              const settingsData = data.settings || {};
              const newS = { 
                ...defaultSettings, 
                ...settingsData, 
                apiKey: data.apiKey || "", 
                apiKey1: settingsData.apiKey1 !== undefined ? settingsData.apiKey1 : (data.apiKey || "") 
              };
              setSettings(newS);
            } else {
              setLoginView('signup');
            }
          } catch (e) {
            console.error("Erro ao checar usuário no Firebase:", e);
          }
        }
      } else {
        setUser(null);
        setUsername(null);
        setLoginView('login');
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Sync Library
  useEffect(() => {
    if (!user || !username) return;

    if (user.isAnonymous) {
       let localLib = [];
       try {
         const stored = localStorage.getItem(`qb_lib_${username}`);
         if (stored) localLib = JSON.parse(stored);
       } catch(e) {}
       
       if (localLib.length === 0) {
          setLibrary([{
             id: 'imported-folder',
             title: 'Pergaminhos Diversos',
             fullSyllabus: 'Coleção de provações trazidas de outras dimensões.',
             source: 'external',
             topics: []
          }]);
       } else {
          setLibrary(localLib);
       }
       return;
    }

    const libRef = collection(db, 'users', user.uid, 'library');
    const unsubLib = onSnapshot(libRef, (snapshot) => {
      const loadedLib = snapshot.docs.map(d => d.data());
      loadedLib.sort((a,b) => b.id - a.id);
      if (loadedLib.length === 0) {
         setLibrary([{
            id: 'imported-folder',
            title: 'Pergaminhos Diversos',
            fullSyllabus: 'Coleção de provações trazidas de outras dimensões.',
            source: 'external',
            topics: []
         }]);
      } else {
         setLibrary(loadedLib);
      }
    }, (err) => console.error(err));

    return () => unsubLib();
  }, [user, username]);

  const activeSubject = library.find(s => s.id === activeSubjectId);
  const activeTopic = activeSubject?.topics.find(t => t.id === activeTopicId);

  // --- LOGIN FLOW ---
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
      setErrorModal({ title: 'Erro de Autenticação', message: "Os deuses do Google rejeitaram sua entrada. Tente novamente.", isAlert: true });
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.error("Erro no login anônimo:", e);
      setErrorModal({ title: 'Erro de Autenticação', message: "Os deuses não permitiram sua entrada anônima. Verifique se o login Anônimo está ativado no Firebase.", isAlert: true });
    }
  };

  const handleCompleteRegistration = async () => {
    if(!signupUsername.trim() || !signupApiKey.trim() || !user) return;
    const cleanName = signupUsername.trim().toUpperCase();
    const newSettings = { ...defaultSettings, apiKey: signupApiKey.trim(), apiKey1: signupApiKey.trim(), activeKeyIndex: 1 };
    
    if (user.isAnonymous) {
       localStorage.setItem('qb_username', cleanName);
       localStorage.setItem(`qb_settings_${cleanName}`, JSON.stringify(newSettings));
       setUsername(cleanName);
       setSettings(newSettings);
    } else {
       try {
         await setDoc(doc(db, 'users', user.uid), {
           username: cleanName,
           apiKey: signupApiKey.trim(),
           settings: newSettings
         });
         setUsername(cleanName);
         setSettings(newSettings);
       } catch(e) {
         console.error(e);
         setErrorModal({ title: 'Erro ao Gravar', message: "Falha ao selar seu registro nos servidores.", isAlert: true });
       }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setLibrary([]);
    setSettings(defaultSettings);
    setView('library');
    setSignupUsername('');
    setSignupApiKey('');
    localStorage.removeItem('qb_username');
  };

  // --- MUTATIONS ---
  const updateSubjectState = async (updatedSubject) => {
    setLibrary(prev => prev.map(s => s.id === updatedSubject.id ? updatedSubject : s));
    if (user && !user.isAnonymous) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'library', updatedSubject.id.toString()), updatedSubject);
      } catch(e) { console.error(e); }
    } else if (user && user.isAnonymous) {
       localStorage.setItem(`qb_lib_${username}`, JSON.stringify(library.map(s => s.id === updatedSubject.id ? updatedSubject : s)));
    }
  };

  const addSubjectState = async (newSubject) => {
    setLibrary(prev => [newSubject, ...prev]);
    if (user && !user.isAnonymous) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'library', newSubject.id.toString()), newSubject);
      } catch(e) { console.error(e); }
    } else if (user && user.isAnonymous) {
       localStorage.setItem(`qb_lib_${username}`, JSON.stringify([newSubject, ...library]));
    }
  };

  const removeSubjectState = async (subjId) => {
    setLibrary(prev => prev.filter(s => s.id !== subjId));
    if (user && !user.isAnonymous) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'library', subjId.toString()));
      } catch(e) { console.error(e); }
    } else if (user && user.isAnonymous) {
       localStorage.setItem(`qb_lib_${username}`, JSON.stringify(library.filter(s => s.id !== subjId)));
    }
  };

  const saveSettingsGlobal = async (newSettings) => {
    const sanitizedSettings = {
      ...newSettings,
      activeKeyIndex: Number(newSettings.activeKeyIndex || 1)
    };
    setSettings(sanitizedSettings);
    
    if (user && !user.isAnonymous) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          username: username,
          apiKey: sanitizedSettings.apiKey1 || sanitizedSettings.apiKey || "",
          settings: {
            numTopics: sanitizedSettings.numTopics,
            numSubtopics: sanitizedSettings.numSubtopics,
            qPerSub: sanitizedSettings.qPerSub,
            numAlternatives: sanitizedSettings.numAlternatives || 5,
            customPrompt: sanitizedSettings.customPrompt,
            apiKey1: sanitizedSettings.apiKey1 || "",
            apiKey2: sanitizedSettings.apiKey2 || "",
            apiKey3: sanitizedSettings.apiKey3 || "",
            activeKeyIndex: sanitizedSettings.activeKeyIndex
          }
        }, { merge: true });
      } catch(e) { console.error(e); }
    } else if (user && user.isAnonymous) {
       localStorage.setItem(`qb_settings_${username}`, JSON.stringify(sanitizedSettings));
    }
  };

  const handleEditSubject = async () => {
    if (!editingSubjectName.trim() || !editingSubjectId) return;
    const subjToEdit = library.find(s => s.id === editingSubjectId);
    if (subjToEdit) {
      const updated = { ...subjToEdit, title: editingSubjectName.trim() };
      await updateSubjectState(updated);
    }
    setEditingSubjectId(null);
    setEditingSubjectName('');
  };

  const handleEditTopic = async () => {
    if (!editingTopicName.trim() || !editingTopicId || !activeSubject) return;
    const updatedTopics = activeSubject.topics.map(t => 
      t.id === editingTopicId ? { ...t, title: editingTopicName.trim() } : t
    );
    const updatedSubject = { ...activeSubject, topics: updatedTopics };
    await updateSubjectState(updatedSubject);
    setEditingTopicId(null);
    setEditingTopicName('');
  };

  // --- GET ACTIVE API KEY ---
  const getActiveApiKey = () => {
    const s = settingsRef.current;
    let key = s.apiKey; 
    if (s.activeKeyIndex === 1 && s.apiKey1) key = s.apiKey1;
    if (s.activeKeyIndex === 2 && s.apiKey2) key = s.apiKey2;
    if (s.activeKeyIndex === 3 && s.apiKey3) key = s.apiKey3;
    
    if (!key) key = s.apiKey1 || s.apiKey2 || s.apiKey3 || s.apiKey;
    return key;
  };

  const checkApiKey = () => {
    const key = getActiveApiKey();
    if (!key || key.trim() === '') {
      setErrorModal({
        title: 'Oráculo sem Voz (API Key)',
        message: 'Para invocar os deuses neste ambiente, você precisa fornecer a sua própria chave secreta. Vá até as "Configurações" (ícone de engrenagem) e insira sua Gemini API Key gratuita.',
        isAlert: true
      });
      return false;
    }
    return true;
  };

  const switchToNextKey = async () => {
    const s = settingsRef.current;
    let nextIdx = s.activeKeyIndex || 1;
    for (let i = 0; i < 3; i++) {
      nextIdx = (nextIdx % 3) + 1;
      const keyAtIdx = nextIdx === 1 ? (s.apiKey1 || s.apiKey) : (nextIdx === 2 ? s.apiKey2 : s.apiKey3);
      if (keyAtIdx && keyAtIdx.trim().length > 0) {
        break;
      }
    }
    const newSettings = { ...s, activeKeyIndex: nextIdx };
    await saveSettingsGlobal(newSettings);
    return nextIdx;
  };

  // Lida visualmente e logicamente quando a cota da chave do usuário estoura
  const handleQuotaError = (retryCallback) => {
    const s = settingsRef.current;
    const validKeys = [s.apiKey1 || s.apiKey, s.apiKey2, s.apiKey3].filter(k => k && k.trim().length > 0);

    if (validKeys.length > 1) {
      setErrorModal({
        title: "Limites Mortais (Cota Excedida)",
        message: "A energia desta Chave Divina se esgotou (Limite RPD/TPM atingido). O Oráculo exige um descanso para este canal. Como você possui outras chaves forjadas em seu panteão, deseja canalizar o poder da PRÓXIMA chave e tentar novamente?",
        isAlert: false,
        actionLabel: "Canalizar Próxima Chave",
        onAction: async () => {
          setErrorModal(null);
          await switchToNextKey();
          retryCallback(); 
        },
        onCancel: () => setErrorModal(null)
      });
    } else {
      setErrorModal({
        title: "Limites Mortais (Cota Excedida)",
        message: "As energias desta Chave Divina se esgotaram por hoje (Limite RPD/TPM atingido). O Oráculo precisa de descanso. Para prosseguir sem interrupções, recomendamos que utilize outra conta do Google para gerar uma nova API Key gratuita e a adicione nas Configurações (você pode cadastrar até 3).",
        isAlert: true
      });
    }
  };

  // --- APP LOGIC ---
  const getFullPromptText = (isForAPI = false) => {
    const s = settingsRef.current;
    const qCount = s.numSubtopics * s.qPerSub;
    const numAlts = s.numAlternatives || 5;
    const alternativesTemplate = numAlts === 4 
      ? `A) [Alternativa]\nB) [Alternativa]\nC) [Alternativa]\nD) [Alternativa]`
      : `A) [Alternativa]\nB) [Alternativa]\nC) [Alternativa]\nD) [Alternativa]\nE) [Alternativa]`;

    const tokenLimitInstruction = isForAPI 
      ? `\n- O tamanho da explicação deve ser inversamente proporcional à quantidade de questões, de forma que você consiga fazer tudo que esse prompt manda e o resultado caber no limite de tokens (output limit). O mesmo vale para a consolidação, mas se tiver que escolher, faça explicações maiores e uma consolidação mais resumida.`
      : '';

    return `Você é o Oráculo de Medicina da Ágora do Saber. Seu objetivo é criar um estudo reverso de altíssima qualidade.

ATENÇÃO - REGRA DE QUANTIDADE DE QUESTÕES (MANDATÓRIA):
Você DEVE OBRIGATORIAMENTE abordar EXATAMENTE ${s.numSubtopics} subtópicos diferentes.
Para CADA UM desses ${s.numSubtopics} subtópicos, você DEVE gerar EXATAMENTE ${s.qPerSub} questão(ões).
O seu resultado final tem que ter EXATAMENTE um total de ${qCount} questões geradas. Sob nenhuma hipótese pare antes de completar as ${qCount} questões na tela.

DIRETRIZES GERAIS (ESTUDO REVERSO):
- Foco em aplicação de conhecimento e raciocínio clínico/patológico/anatomico/farmacológico/etc estilo USMLE, Step 1, Step 2, NBME.
- Enunciado claro, sem pegadinhas gramaticais. Melhor resposta única.
- Alternativas homogêneas, plausíveis e com tamanho semelhante. OBRIGATÓRIO gerar EXATAMENTE ${numAlts} alternativas (de A até ${numAlts === 4 ? 'D' : 'E'}). 

DIRETRIZES DA EXPLICAÇÃO (CONCISA E DIRETA):
- A explicação deve servir como uma aula completa sobre o assunto, e deve servir para eu saber tudo que meus materiais dizem sobre ele.${tokenLimitInstruction}
- É ESTRITAMENTE PROIBIDO se referir às letras das alternativas na explicação (ex: NUNCA diga "A alternativa A está errada..."). Em vez disso, cite o próprio termo (ex: "A Penicilina não é indicada porque...").
- Explique o porquê da correta e dê os diferenciais que excluem as incorretas de forma unificada e ágil.

TEMPLATE DE SAÍDA OBRIGATÓRIO:
### Subtópico [X.Y] - [Nome do Subtópico]
## Questão [X.Y.Z]
[Texto do Enunciado]
${alternativesTemplate}
Alternativa correta: [Letra]
Explicação:
[Explicação direta, objetiva e citando os termos/conceitos ao invés das letras]
---

### Resumo de Consolidação
[Ao final de todas as ${qCount} questões, escreva um "Resumo de Consolidação" EXCLUSIVAMENTE em parágrafos de texto corrido. É PROIBIDO o uso de bullet points ou listas].

${s.customPrompt ? `Contexto Extra do Usuário: ${s.customPrompt}` : ''}`;
  };

  const copyPromptToClipboard = () => {
    const s = settingsRef.current;
    const syllabusPrompt = `=== ETAPA 1: CRIAÇÃO DO SUMÁRIO ===
Você é o Arquiteto de Alexandria. Seu dever é organizar o conhecimento médico.
Baseado no tema e nos materiais fornecidos, crie um Sumário Didático.

DIRETRIZES DO SUMÁRIO:
- Crie EXATAMENTE ${s.numTopics} Tópicos Principais.
- Cada tópico deve ter EXATAMENTE ${s.numSubtopics} Subtópicos.
- A ordem deve ser a mais didática possível.
- Responda APENAS o sumário em formato hierárquico claro, usando a palavra 'Tópico X' no início de cada linha principal.

Primeiro envie o sumário e aguarde minha confirmação ou orientações para editar algo antes de começar a enviar as questões, e na hora de enviar as questões, envie um tópico por vez, seguindo a ordem dos subtópicos.
`;

    const questionsPrompt = `\n=== ETAPA 2: CRIAÇÃO DAS QUESTÕES ===\n${getFullPromptText(false)}`;

    navigator.clipboard.writeText(syllabusPrompt + questionsPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || e.clipboardData?.files || []);
    if (!files.length) return;

    setIsUploading(true);
    const newFiles = [];

    for (const file of files) {
      try {
        let text = '';
        if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          text = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.readAsText(file);
          });
        } else if (file.name.endsWith('.pdf')) {
          const arrayBuffer = await file.arrayBuffer();
          text = await extractPdfText(arrayBuffer);
        } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
          const arrayBuffer = await file.arrayBuffer();
          text = await extractDocxText(arrayBuffer);
        } else {
          setErrorModal({
            title: 'Formato Ignorado',
            message: `O formato do arquivo ${file.name} é desconhecido. Utilize apenas TXT, MD, PDF e DOC/DOCX.`,
            isAlert: true
          });
          continue;
        }
        newFiles.push({ name: file.name, content: text });
      } catch(err) {
        console.error("Erro lendo arquivo", err);
        setErrorModal({
          title: 'Arquivo Corrompido',
          message: `Falha ao ler o arquivo ${file.name}. O arquivo pode estar corrompido ou protegido.`,
          isAlert: true
        });
      }
    }
    
    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsUploading(false);
  };

  const handlePaste = (e) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleFileUpload(e);
    }
  };

  const removeUploadedFile = (indexToRemove) => {
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSettingBlur = (key, min, max) => {
    let val = parseInt(settings[key]);
    if (isNaN(val) || val < min) val = min;
    if (val > max) val = max;
    setSettings({ ...settings, [key]: val });
  };

  const getCombinedMaterials = () => {
    return materialText + "\n" + uploadedFiles.map(f => `[CONTEÚDO DO ARQUIVO: ${f.name}]\n${f.content}`).join("\n\n");
  }

  const handleStartCreation = async () => {
    if (!checkApiKey()) return;
    
    setIsBusy(true);
    const combinedMaterials = getCombinedMaterials();
    const systemPrompt = `Você é o Arquiteto de Alexandria. Seu dever é organizar o conhecimento médico.
Baseado no tema "${newSubjectName}" e nos materiais fornecidos, crie um Sumário Didático.

DIRETRIZES DO SUMÁRIO:
- Crie EXATAMENTE ${settingsRef.current.numTopics} Tópicos Principais.
- Cada tópico deve ter EXATAMENTE ${settingsRef.current.numSubtopics} Subtópicos.
- A ordem deve ser a mais didática possível (mesmo que fuja da ordem do material base).
- Responda APENAS o sumário em formato hierárquico claro, usando a palavra 'Tópico X' no início de cada linha principal.`;
    
    try {
      const result = await callGemini(`Materiais: ${combinedMaterials}`, systemPrompt, getActiveApiKey());
      setProposedSyllabus(result);
      setCreatorStep(2);
    } catch (e) { 
      if (e.message === "API_KEY_INVALID") setErrorModal({ title: 'Chave Inválida', message: "A chave secreta fornecida nas configurações não foi reconhecida.", isAlert: true });
      else if (e.message === "QUOTA_EXCEEDED") handleQuotaError(handleStartCreation);
      else if (e.message === "SERVER_OVERLOADED") setErrorModal({ title: 'Servidores Sobrecarregados', message: "Os servidores do Google Gemini estão sobrecarregados no momento (Erro 503). Aguarde um instante e tente novamente.", isAlert: true });
      else setErrorModal({ title: 'Falha de Conexão', message: "Falha na conexão com a IA. Tente novamente.", isAlert: true });
    }
    finally { setIsBusy(false); }
  };

  const handleReviseSyllabus = async () => {
    if(!syllabusFeedback.trim() || !checkApiKey()) return;
    setIsBusy(true);
    
    const systemPrompt = `Você é o Arquiteto de Alexandria. O usuário solicitou uma alteração no sumário proposto.
Tema original: "${newSubjectName}"
Sumário atual:
${proposedSyllabus}

Feedback/Pedido do Usuário: "${syllabusFeedback}"

Responda APENAS com o novo sumário ajustado, mantendo rigorosamente a estrutura de ${settingsRef.current.numTopics} Tópicos e ${settingsRef.current.numSubtopics} Subtópicos.`;

    try {
      const result = await callGemini(`Ajuste o sumário conforme o pedido.`, systemPrompt, getActiveApiKey());
      setProposedSyllabus(result);
      setSyllabusFeedback('');
    } catch (e) { 
      if (e.message === "QUOTA_EXCEEDED") handleQuotaError(handleReviseSyllabus);
      else if (e.message === "SERVER_OVERLOADED") setErrorModal({ title: 'Servidores Sobrecarregados', message: "Os servidores do Google Gemini estão sobrecarregados no momento (Erro 503). Aguarde um instante e tente novamente.", isAlert: true });
      else setErrorModal({ title: 'Falha de Conexão', message: "Falha na conexão com a IA. Tente novamente.", isAlert: true }); 
    }
    finally { setIsBusy(false); }
  };

  const finalizeSubject = async () => {
    // Regex relaxado: procura "Tópico" (com ou sem acento) em qualquer lugar da linha, 
    // ignorando marcações de negrito (**), titles (##) ou números soltos.
    const topicLines = proposedSyllabus.split('\n').filter(l => /T[óo]pico\s*\d+/i.test(l));

    const topics = topicLines.map((title, idx) => {
      // Limpa a sujeira visual (asteriscos e hashtags) para o nome da pasta ficar bonito
      const cleanTitle = title.replace(/[*#]/g, '').trim();
      return {
        id: `topic-${idx}-${Date.now()}`,
        title: cleanTitle,
        questions: [],
        answers: {},
        summary: ''
      };
    });

    const newSubject = {
      id: Date.now(),
      title: newSubjectName,
      fullSyllabus: proposedSyllabus,
      source: 'gemini',
      sourceMaterials: getCombinedMaterials(),
      topics: topics
    };

    await addSubjectState(newSubject);
    setLibraryFilter('gemini');
    setView('sub-library');
    setCreatorStep(1);
    setNewSubjectName('');
    setMaterialText('');
    setUploadedFiles([]);
  };

  const abortCreation = () => {
    setCreatorStep(1);
    setNewSubjectName('');
    setMaterialText('');
    setUploadedFiles([]);
    setView('library');
  };

  const generateTopicBatch = async (topicId, additionalPrompt = "") => {
    if (!checkApiKey()) return;
    
    setIsBusy(true);

    const clearedSubject = {
      ...activeSubject,
      topics: activeSubject.topics.map(t => t.id === topicId ? { ...t, questions: [], summary: '', answers: {} } : t)
    };
    await updateSubjectState(clearedSubject);

    const topic = clearedSubject.topics.find(t => t.id === topicId);
    
    const contextText = clearedSubject.sourceMaterials
      ? `\n\nMATERIAIS DE BASE OBRIGATÓRIOS:\nAs questões geradas DEVEM refletir e focar primariamente nos conceitos encontrados nos textos a seguir:\n${clearedSubject.sourceMaterials}`
      : '';

    const FULL_SYSTEM_PROMPT = getFullPromptText(true) + contextText + `\n\nInstruções específicas para esta geração (refazer com foco): ${additionalPrompt}`;

    try {
      const result = await callGemini(`Invoque o conhecimento sobre o tópico: ${topic.title} dentro do assunto ${activeSubject.title}`, FULL_SYSTEM_PROMPT, getActiveApiKey());
      const parsed = parseData(result);
      
      const updatedSubject = {
        ...clearedSubject,
        topics: clearedSubject.topics.map(t => t.id === topicId ? { ...t, questions: parsed.questions, summary: parsed.summary, answers: {} } : t)
      };
      await updateSubjectState(updatedSubject);
      setShowSummary(false);
    } catch (e) { 
      if (e.message === "API_KEY_INVALID") setErrorModal({ title: 'Chave Inválida', message: "A chave secreta fornecida nas configurações não foi reconhecida.", isAlert: true });
      else if (e.message === "QUOTA_EXCEEDED") handleQuotaError(() => generateTopicBatch(topicId, additionalPrompt));
      else if (e.message === "SERVER_OVERLOADED") setErrorModal({ title: 'Servidores Sobrecarregados', message: "Os servidores do Google Gemini estão sobrecarregados no momento (Erro 503). Aguarde um instante e tente novamente.", isAlert: true });
      else setErrorModal({ title: 'A Invocação Falhou', message: "A conexão foi interrompida. Tente novamente.", isAlert: true });
    } finally { 
      setIsBusy(false); 
    }
  };

  const handlePasteImport = async () => {
    const parsed = parseData(pasteInputText);
    if (parsed.questions.length === 0) {
      setErrorModal({
        title: "Arquivo Ilegível",
        message: "Não foi possível compreender o texto. Verifique se a estrutura está correta (## Questão, A), B), Alternativa correta:, Explicação:).",
        isAlert: true
      });
      return;
    }
    
    const subjectName = pasteSubjectName.trim() || 'Assunto Importado';
    const topicName = pasteTopicName.trim() || `Bloco (${new Date().toLocaleDateString()})`;

    const newTopic = {
      id: `imported-${Date.now()}`,
      title: topicName,
      questions: parsed.questions,
      summary: parsed.summary,
      answers: {}
    };

    let targetSubj = library.find(s => s.title.toLowerCase() === subjectName.toLowerCase() && s.source === 'external' && s.id !== 'imported-folder');

    if (targetSubj) {
      const updated = { ...targetSubj, topics: [...targetSubj.topics, newTopic] };
      await updateSubjectState(updated);
      setActiveSubjectId(targetSubj.id);
    } else if (!pasteSubjectName.trim()) {
      const importFolder = library.find(s => s.id === 'imported-folder');
      if (importFolder) {
         const updated = { ...importFolder, topics: [...importFolder.topics, newTopic] };
         await updateSubjectState(updated);
      }
      setActiveSubjectId('imported-folder');
    } else {
      const newSubj = {
        id: Date.now(),
        title: subjectName,
        source: 'external',
        fullSyllabus: "Importado via texto externo",
        topics: [newTopic]
      };
      await addSubjectState(newSubj);
      setActiveSubjectId(newSubj.id);
    }
    
    setPasteInputText('');
    setPasteTopicName('');
    setActiveTopicId(newTopic.id);
    setView('topic');
  };

  const handleAnswer = async (qId, letter) => {
    const updated = {
      ...activeSubject,
      topics: activeSubject.topics.map(t => {
        if (t.id !== activeTopicId) return t;
        return { ...t, answers: { ...t.answers, [qId]: letter } };
      })
    };
    await updateSubjectState(updated);
  };

  const resetAnswers = async () => {
    const updated = {
      ...activeSubject,
      topics: activeSubject.topics.map(t => t.id === activeTopicId ? { ...t, answers: {} } : t)
    };
    await updateSubjectState(updated);
    setShowSummary(false);
  };

  // --- RENDERS ---
  if (!authReady) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-yellow-500' : 'bg-gray-50 text-yellow-600'}`}>
        <Spinner className="w-12 h-12 text-current" />
      </div>
    );
  }

  // --- LOGIN / SIGNUP VIEW ---
  if (!username) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans p-4 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className={`w-full max-w-md p-8 rounded-2xl shadow-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex flex-col items-center text-center mb-8">
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4">
              <Landmark className="w-10 h-10 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-yellow-600 mb-2">Ágora do Saber</h1>
            <p className="opacity-70 text-sm">
              {loginView === 'login' 
                ? "Acesse sua conta para explorar seus estudos." 
                : "Crie seu perfil para acessar o Oráculo."}
            </p>
          </div>

          <div className="space-y-5">
            {loginView === 'login' ? (
              <div className="space-y-4">
                 <button 
                  onClick={handleGoogleLogin} 
                  className={`w-full py-4 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-3 border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'}`}
                >
                  <GoogleIcon className="w-6 h-6" /> Entrar com Google
                </button>

                {isCanvasEnvironment && (
                  <>
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase tracking-widest font-bold">Ou (Para testes)</span>
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    </div>

                    <button 
                      onClick={handleAnonymousLogin} 
                      className="w-full bg-stone-700 hover:bg-stone-800 text-white py-4 rounded-xl font-bold shadow-lg transition-colors flex justify-center gap-2"
                    >
                      Entrar como Convidado (Canvas)
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2 opacity-50">Nome de Usuário</label>
                  <input 
                    type="text" 
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    placeholder="Ex: JOÃO SILVA" 
                    className={`w-full p-4 rounded-xl border uppercase font-bold outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2 opacity-50 flex items-center gap-2"><Key className="w-4 h-4"/> Chave Divina (API Key)</label>
                  <input 
                    type="password" 
                    value={signupApiKey}
                    onChange={(e) => setSignupApiKey(e.target.value)}
                    placeholder="Cole a chave do Gemini aqui..." 
                    className={`w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} 
                  />
                </div>
                <div className={`p-4 rounded-lg text-xs leading-relaxed ${darkMode ? 'bg-yellow-900/20 text-yellow-200' : 'bg-yellow-50 text-yellow-800'}`}>
                  <strong>Por que preciso de uma API Key?</strong> O Oráculo precisa de uma chave gratuita para funcionar e estruturar suas questões na nuvem da IA. Crie a sua gratuitamente em: <br/>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline font-bold break-all">aistudio.google.com/app/apikey</a>
                </div>

                <button 
                  onClick={handleCompleteRegistration} 
                  disabled={!signupUsername.trim() || !signupApiKey.trim()}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-4 rounded-xl font-bold shadow-lg transition-colors flex justify-center gap-2 disabled:opacity-50"
                >
                  Criar Perfil
                </button>
                <button onClick={handleLogout} className="w-full py-3 opacity-60 hover:opacity-100 font-bold text-sm">
                  Voltar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP ---
  const subjectsToShow = library.filter(s => s.source === libraryFilter);
  const externalFolderNames = Array.from(new Set(library.filter(s => s.source === 'external' && s.id !== 'imported-folder').map(s => s.title)));

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${mainBg}`}>
      <header className={`${headerBg} border-b p-4 shadow-sm relative z-10`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('library')}>
            <div className="bg-yellow-600 p-1.5 md:p-2 rounded-lg shadow-md">
              <Landmark className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <h1 className={`font-serif font-bold text-lg md:text-xl tracking-wide ${titleColor}`}>ÁGORA DO SABER</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`hidden sm:flex items-center gap-2 text-xs font-bold mr-2 opacity-60 border-r pr-4 ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
              <UserIcon className="w-4 h-4"/> {username}
            </span>
            <button onClick={() => setView('settings')} className={`p-2 rounded-full hover:scale-110 transition-transform ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-yellow-500' : 'bg-gray-100 hover:bg-gray-200 text-yellow-600'}`}><SettingsIcon className="w-5 h-5" /></button>
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full hover:scale-110 transition-transform ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-yellow-500' : 'bg-gray-100 hover:bg-gray-200 text-yellow-600'}`}>{darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
            <button onClick={handleLogout} title="Sair da Ágora" className={`p-2 rounded-full hover:scale-110 transition-transform ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-red-400' : 'bg-gray-100 hover:bg-gray-200 text-red-500'}`}><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* VIEW: MAIN LIBRARY (ROOT) */}
        {view === 'library' && (
          <div className="animate-in fade-in">
            <div className="mb-10 text-center flex flex-col items-center justify-center">
              <h2 className="text-3xl font-serif font-bold text-yellow-600 mb-2">Não são admitidos ignorantes em geometria</h2>
              <p className="opacity-60 mb-6">Gerencie seus blocos de estudo e invoque novas questões.</p>
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl mx-auto">
                <button onClick={() => setView('creator')} className="flex-1 bg-yellow-600 text-white py-4 rounded-xl font-bold shadow-md hover:bg-yellow-700 transition-all flex items-center justify-center gap-3">
                  <Sparkles className="w-6 h-6" /> Gerar Assunto
                </button>
                <button onClick={() => { setPasteSubjectName(''); setPasteTopicName('Bloco 1'); setView('paste'); }} className={`flex-1 py-4 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-3 ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50'}`}>
                  <Feather className="w-6 h-6 text-yellow-600" /> Importar Questões
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div onClick={() => { setLibraryFilter('gemini'); setView('sub-library'); }} className={`${darkMode ? 'bg-gray-800 border-gray-700 hover:border-yellow-600' : 'bg-white border-gray-200 hover:border-yellow-500'} p-8 rounded-2xl border shadow-sm cursor-pointer transition-all flex flex-col justify-center items-center text-center group`}>
                <div className="p-5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Landmark className="w-12 h-12 text-yellow-600" />
                </div>
                <h3 className="font-serif font-bold text-2xl text-yellow-600 mb-2">Acervo do Oráculo</h3>
                <p className="text-sm opacity-60">Assuntos e tópicos gerados via Gemini.</p>
                <div className={`mt-4 text-xs font-bold px-3 py-1 rounded-full ${statsBadge}`}>{library.filter(s=>s.source === 'gemini').length} Pastas</div>
              </div>

              <div onClick={() => { setLibraryFilter('external'); setView('sub-library'); }} className={`${darkMode ? 'bg-gray-800 border-gray-700 hover:border-yellow-600' : 'bg-white border-gray-200 hover:border-yellow-500'} p-8 rounded-2xl border shadow-sm cursor-pointer transition-all flex flex-col justify-center items-center text-center group`}>
                <div className="p-5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Folder className="w-12 h-12 text-yellow-600" />
                </div>
                <h3 className="font-serif font-bold text-2xl text-yellow-600 mb-2">Acervo Externo</h3>
                <p className="text-sm opacity-60">Questões e listas coladas de outras fontes.</p>
                <div className={`mt-4 text-xs font-bold px-3 py-1 rounded-full ${statsBadge}`}>{library.filter(s=>s.source === 'external').length} Pastas</div>
              </div>
            </div>

            <div className="mt-12 flex justify-center animate-in fade-in">
              <button onClick={copyPromptToClipboard} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all border ${darkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'} ${copiedPrompt ? 'ring-2 ring-yellow-500 text-yellow-600' : ''}`}>
                {copiedPrompt ? <CheckCircle2 className="w-5 h-5 text-yellow-500" /> : <Copy className="w-5 h-5" />}
                {copiedPrompt ? "Prompt Copiado!" : "Copiar Prompt"}
              </button>
            </div>
            {copiedPrompt && <p className="text-center text-xs mt-2 opacity-50">Cole no ChatGPT ou DeepSeek para obter as provações.</p>}
          </div>
        )}

        {/* VIEW: SUB-LIBRARY (Listando Assuntos de uma Fonte) */}
        {view === 'sub-library' && (
          <div className="animate-in slide-in-from-right">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
              <div>
                <button onClick={() => setView('library')} className={`flex items-center gap-2 mb-4 font-bold transition-colors ${darkMode ? 'text-gray-400 hover:text-yellow-500' : 'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4" /> Voltar</button>
                <h2 className="text-3xl font-serif font-bold text-yellow-600">
                  {libraryFilter === 'gemini' ? 'Acervo do Oráculo' : 'Acervo Externo'}
                </h2>
                <p className="opacity-60 mt-1">Selecione uma pasta para estudar.</p>
              </div>
              {libraryFilter === 'gemini' ? (
                <button onClick={() => setView('creator')} className="bg-yellow-600 text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-yellow-700 transition-all flex items-center gap-2"><Sparkles className="w-4 h-4" /> Gerar Assunto</button>
              ) : (
                <button onClick={() => { 
                  const exts = library.filter(s => s.source === 'external').sort((a,b) => b.id - a.id);
                  const lastExt = exts.length > 0 ? exts[0] : null;
                  setPasteSubjectName(lastExt && lastExt.id !== 'imported-folder' ? lastExt.title : ''); 
                  setPasteTopicName(`Bloco ${lastExt ? lastExt.topics.length + 1 : 1}`); 
                  setView('paste'); 
                }} className="bg-yellow-600 text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-yellow-700 transition-all flex items-center gap-2"><Feather className="w-4 h-4" /> Importar Questões</button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjectsToShow.length === 0 && <div className="col-span-full py-10 text-center opacity-40 italic">As prateleiras da biblioteca estão vazias nesta sessão.</div>}
              
              {subjectsToShow.map(subject => (
                <div key={subject.id} onClick={() => { setActiveSubjectId(subject.id); setView('subject'); }} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-2xl border hover:border-yellow-500 cursor-pointer group transition-all flex flex-col justify-between`}>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <Folder className="w-10 h-10 text-yellow-600" />
                      {subject.id !== 'imported-folder' && (
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={(e) => { e.stopPropagation(); setEditingSubjectId(subject.id); setEditingSubjectName(subject.title); }} className="p-2 text-gray-400 hover:text-yellow-500"><EditIcon className="w-5 h-5" /></button>
                           <button onClick={(e) => { e.stopPropagation(); setDeleteId({type:'subject', id:subject.id}); }} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                         </div>
                      )}
                    </div>
                    <h3 className="font-serif font-bold text-xl mb-1 truncate">{subject.title}</h3>
                  </div>
                  <p className="text-xs opacity-50 uppercase tracking-widest">{subject.topics.length} Tópicos / Sessões</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: PASTE EXTERNAL */}
        {view === 'paste' && (
          <div className="animate-in slide-in-from-right max-w-3xl mx-auto">
            <button onClick={() => setView('sub-library')} className={`flex items-center gap-2 mb-6 font-bold transition-colors ${darkMode ? 'text-gray-400 hover:text-yellow-500' : 'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4" /> Voltar</button>
            <h2 className="text-3xl font-serif font-bold text-yellow-600 mb-2 flex items-center gap-3"><Feather className="w-8 h-8"/> Importar Questões</h2>
            <p className="opacity-60 mb-6">Crie um novo assunto ou adicione blocos a um existente colando questões.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 relative">
              <div className="w-full">
                <input 
                  type="text" 
                  value={pasteSubjectName} 
                  onChange={(e) => {
                    setPasteSubjectName(e.target.value);
                    setShowSubjectSuggestions(true);
                  }} 
                  onFocus={() => setShowSubjectSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSubjectSuggestions(false), 200)}
                  placeholder="Assunto Principal (Opcional)" 
                  className={`w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`} 
                />
                {showSubjectSuggestions && externalFolderNames.filter(n => n.toLowerCase().includes(pasteSubjectName.toLowerCase())).length > 0 && (
                  <ul className={`absolute z-20 w-[calc(50%-0.5rem)] mt-2 rounded-xl border shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    {externalFolderNames.filter(n => n.toLowerCase().includes(pasteSubjectName.toLowerCase())).map((name, idx) => (
                      <li 
                        key={idx} 
                        onClick={() => {
                          setPasteSubjectName(name);
                          setShowSubjectSuggestions(false);
                        }}
                        className={`p-4 cursor-pointer transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-800'}`}
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <input 
                type="text" 
                value={pasteTopicName} 
                onChange={(e) => setPasteTopicName(e.target.value)} 
                placeholder="Subpasta (Sessão) - ex: Bloco 1" 
                className={`w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`} 
              />
            </div>

            <textarea 
              value={pasteInputText} 
              onChange={(e) => setPasteInputText(e.target.value)}
              placeholder="Cole as questões com as alternativas e a explicação aqui..."
              className={`w-full h-[40vh] p-6 rounded-xl border font-mono text-sm leading-relaxed resize-none outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-800'}`} 
            />
            
            <div className="mt-6 flex justify-end">
              <button onClick={handlePasteImport} disabled={!pasteInputText.trim()} className="w-full sm:w-auto text-white p-4 rounded-xl font-bold bg-yellow-600 hover:bg-yellow-700 shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                <Folder className="w-5 h-5" /> Salvar Importação
              </button>
            </div>
          </div>
        )}

        {/* VIEW: SUBJECT (PASTA INTERNA) */}
        {view === 'subject' && activeSubject && (
          <div className="animate-in slide-in-from-right">
            <button onClick={() => { setLibraryFilter(activeSubject.source); setView('sub-library'); }} className={`flex items-center gap-2 mb-6 font-bold transition-colors ${darkMode ? 'text-gray-400 hover:text-yellow-500' : 'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4" /> Voltar</button>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-serif font-bold text-yellow-600">{activeSubject.title}</h2>
                  {activeSubject.id !== 'imported-folder' && (
                    <button onClick={() => { setEditingSubjectId(activeSubject.id); setEditingSubjectName(activeSubject.title); }} className={`p-2 rounded-full transition-colors ${darkMode ? 'text-gray-400 hover:text-yellow-500 hover:bg-gray-800' : 'text-gray-500 hover:text-yellow-600 hover:bg-gray-100'}`}>
                      <EditIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <p className="opacity-60">{activeSubject.source === 'gemini' ? 'Estrutura elaborada pelo Oráculo' : 'Blocos de questões importadas'}</p>
              </div>
              {activeSubject.source === 'external' && (
                <button onClick={() => { 
                  setPasteSubjectName(activeSubject.id === 'imported-folder' ? '' : activeSubject.title); 
                  setPasteTopicName(`Bloco ${activeSubject.topics.length + 1}`);
                  setView('paste'); 
                }} className="bg-yellow-600 text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-yellow-700 transition-all flex items-center gap-2">
                  <Feather className="w-4 h-4" /> Importar Questões
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...activeSubject.topics].sort((a, b) => {
                const timeA = parseInt(a.id.split('-').pop()) || 0;
                const timeB = parseInt(b.id.split('-').pop()) || 0;
                return timeA - timeB;
              }).map(topic => (
                <div key={topic.id} onClick={() => { setActiveTopicId(topic.id); setView('topic'); }} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 rounded-xl border flex items-center justify-between hover:border-yellow-500 cursor-pointer group`}>
                  <div className="flex items-center gap-4 flex-1 truncate pr-4">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 flex-shrink-0"><ScrollText className="w-5 h-5" /></div>
                    <div className="truncate">
                      <h4 className="font-bold text-sm truncate">{topic.title}</h4>
                      <p className="text-xs opacity-50">{topic.questions.length > 0 ? `${Object.keys(topic.answers).length}/${topic.questions.length} respondidas` : 'Nenhuma questão resolvida'}</p>
                    </div>
                  </div>
                  <div className="h-2 w-24 md:w-32 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
                    <div className="bg-yellow-500 h-full" style={{ width: topic.questions.length ? `${(Object.keys(topic.answers).length / topic.questions.length)*100}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: TOPIC (QUESTÕES) */}
        {view === 'topic' && activeTopic && (
          <div className="animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-200 dark:border-gray-700 pb-6">
              <div>
                <button onClick={() => setView('subject')} className={`flex items-center gap-2 mb-2 font-bold transition-colors ${darkMode ? 'text-gray-400 hover:text-yellow-500' : 'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4" /> Voltar</button>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-serif font-bold text-yellow-600">{activeTopic.title}</h2>
                  <button onClick={() => { setEditingTopicId(activeTopic.id); setEditingTopicName(activeTopic.title); }} className={`p-2 rounded-full transition-colors ${darkMode ? 'text-gray-400 hover:text-yellow-500 hover:bg-gray-800' : 'text-gray-500 hover:text-yellow-600 hover:bg-gray-100'}`}>
                    <EditIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {activeTopic.questions.length > 0 && (
                  <button onClick={() => setDeleteId({type:'reset_topic', id:activeTopic.id})} className="flex-1 sm:flex-none flex justify-center items-center gap-2 p-2 px-4 border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-bold text-sm">
                    <Eraser className="w-4 h-4" /> Limpar Respostas
                  </button>
                )}
                {activeTopic.questions.length > 0 && activeSubject.source === 'gemini' && (
                  <button onClick={() => setRegenerateModalOpen(true)} className="flex-1 sm:flex-none flex justify-center items-center gap-2 p-2 px-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 rounded-lg transition-colors font-bold text-sm">
                    <RotateCcw className="w-4 h-4" /> Recriar
                  </button>
                )}
                {activeTopic.questions.length === 0 && activeSubject.source === 'gemini' && (
                  <button onClick={() => generateTopicBatch(activeTopic.id)} disabled={isBusy} className="w-full sm:w-auto bg-yellow-600 text-white px-6 py-2 rounded-xl font-bold flex justify-center items-center gap-2">
                    {isBusy ? <Spinner className="w-4 h-4 text-white" /> : <Flame className="w-5 h-5"/>} {isBusy ? 'Consultando...' : 'Gerar Questões'}
                  </button>
                )}
              </div>
            </div>
            
            {/* ESTADO DE CARREGAMENTO */}
            {isBusy && activeTopic.questions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in">
                <Spinner className="w-12 h-12 text-yellow-600 mb-4" />
                <p className="text-lg font-serif font-bold text-yellow-600">O Oráculo está elaborando suas questões...</p>
              </div>
            )}

            {!isBusy && (
              <div className="space-y-6">
                {activeTopic.questions.map((q, idx) => (
                  <QuestionCard key={idx} question={q} index={idx} selectedLetter={activeTopic.answers[q.id]} onAnswer={(l) => handleAnswer(q.id, l)} darkMode={darkMode} />
                ))}
                
                {activeTopic.questions.length > 0 && Object.keys(activeTopic.answers).length === activeTopic.questions.length && (
                  <div className="text-center py-10 animate-in zoom-in">
                     <Award className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                     <h3 className="text-2xl font-serif font-bold text-yellow-600 mb-2">Provações Concluídas!</h3>
                     <p className="text-sm md:text-base mb-8 opacity-80 max-w-lg mx-auto">
                       Você demonstrou a sabedoria de Atena e a determinação de Hércules. O Oráculo está satisfeito com sua jornada e preparou a essência do conhecimento final para você.
                     </p>
                     {!showSummary && <button onClick={() => setShowSummary(true)} className="bg-yellow-600 text-white px-8 py-3 rounded-xl font-bold">Ver Resumo Final</button>}
                     {showSummary && activeTopic.summary && (
                       <div className={`mt-8 text-left p-6 md:p-8 rounded-2xl border ${darkMode ? 'bg-gray-800 border-yellow-600' : 'bg-yellow-50 border-yellow-300'}`}>
                          <div className="text-base leading-relaxed font-medium">{formatText(activeTopic.summary, darkMode)}</div>
                       </div>
                     )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW: CREATOR (INVOCAR ASSUNTO GEMINI) */}
        {view === 'creator' && (
          <div className="animate-in slide-in-from-bottom max-w-2xl mx-auto">
            <button onClick={abortCreation} className={`mb-6 font-bold flex items-center gap-2 transition-colors ${darkMode ? 'text-gray-400 hover:text-yellow-500' : 'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/> Cancelar</button>
            {creatorStep === 1 ? (
              <div className="space-y-6">
                <h2 className="text-3xl font-serif font-bold text-yellow-600 flex items-center gap-3">
                  <Sparkles className="w-8 h-8" />
                  Gerar Novo Assunto
                </h2>
                <input type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="Título do Assunto (ex: Nefrologia)" className={`w-full p-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} outline-none focus:ring-2 focus:ring-yellow-500`} />
                
                {/* Upload Section */}
                <div className="relative">
                  <div className={`text-xs font-bold uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Material Base (Cole textos ou envie PDFs, DOCX, TXT)</div>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-100 border-gray-200 text-gray-700'}`}>
                          <FileText className="w-4 h-4 text-yellow-600" />
                          <span className="max-w-[150px] truncate">{file.name}</span>
                          <button onClick={() => removeUploadedFile(idx)} className="text-gray-400 hover:text-red-500 ml-1"><XCircle className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  <textarea 
                    value={materialText} 
                    onChange={(e) => setMaterialText(e.target.value)} 
                    onPaste={handlePaste}
                    placeholder="Insira os textos base, anotações ou transcrições aqui..." 
                    className={`w-full h-48 p-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} resize-none outline-none focus:ring-2 focus:ring-yellow-500`} 
                  />
                  
                  <button onClick={() => fileInputRef.current.click()} title="Enviar arquivos (PDF, DOCX, TXT, MD)" className="absolute bottom-4 right-4 p-2 bg-yellow-600 text-white rounded-lg shadow-md hover:bg-yellow-700 transition-colors">
                    <FileUp className="w-5 h-5" />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" accept=".txt,.md,.pdf,.doc,.docx" />
                </div>

                <button onClick={handleStartCreation} disabled={isBusy || isUploading || !newSubjectName} className="w-full bg-yellow-600 text-white py-4 rounded-xl font-bold shadow-lg disabled:opacity-50 flex justify-center items-center gap-2">
                  {isBusy || isUploading ? <Spinner className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5" />} 
                  {isBusy ? 'Consultando o Oráculo...' : (isUploading ? 'Processando Arquivos...' : 'Gerar Estrutura de Estudos')}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-2xl font-serif font-bold text-yellow-600">Estrutura de Estudos Gerada</h2>
                <p className="opacity-60 mb-6">Analise o índice sugerido. Solicite ajustes ao Oráculo se desejar.</p>
                
                <div className={`w-full h-[40vh] p-6 rounded-xl border font-mono text-sm leading-relaxed overflow-y-auto whitespace-pre-wrap ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                  {proposedSyllabus}
                </div>

                <div className="relative">
                  <textarea 
                    value={syllabusFeedback} 
                    onChange={(e) => setSyllabusFeedback(e.target.value)} 
                    placeholder="Digite aqui se desejar mudar a quantidade de blocos, a ordem ou os temas..." 
                    className={`w-full h-24 p-4 pr-14 rounded-xl border resize-none outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`} 
                  />
                  <button onClick={handleReviseSyllabus} disabled={!syllabusFeedback.trim() || isBusy} className="absolute bottom-4 right-4 p-2 bg-yellow-600 text-white rounded-lg shadow-md hover:bg-yellow-700 disabled:opacity-50">
                    {isBusy ? <Spinner className="w-5 h-5 text-white" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex gap-4 mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <button onClick={() => setCreatorStep(1)} className={`flex-1 py-4 font-bold rounded-xl transition-colors ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>Voltar</button>
                  <button onClick={finalizeSubject} className="flex-[2] bg-yellow-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-yellow-700 transition-colors">Confirmar e Salvar Assunto</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: SETTINGS */}
        {view === 'settings' && (
          <div className="animate-in fade-in max-w-xl mx-auto space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setView('library')} className={`p-2 rounded-full hover:scale-110 transition-transform ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'}`}><ArrowLeft className="w-5 h-5" /></button>
              <h2 className="text-3xl font-serif font-bold text-yellow-600">Configurações do Oráculo</h2>
            </div>
            
            <div className="col-span-2 space-y-4">
              <label className="block text-xs font-bold uppercase mb-2 opacity-50 flex items-center gap-2">
                <Key className="w-4 h-4"/> Chaves Divinas (API Keys)
              </label>
              <p className="text-[11px] opacity-60">O Oráculo pode revesar entre múltiplas chaves caso uma atinja o limite diário de uso. Selecione a bolinha da chave que deseja usar por padrão.</p>
              
              {[1, 2, 3].map(num => {
                const keyValue = num === 1 ? (settings.apiKey1 !== undefined ? settings.apiKey1 : settings.apiKey) : settings[`apiKey${num}`];
                const isRadioDisabled = num !== 1 && (!keyValue || keyValue.trim() === '');
                
                return (
                  <div key={num} className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="activeKey" 
                      checked={(settings.activeKeyIndex || 1) === num} 
                      onChange={() => {
                        const newSettings = {...settings, activeKeyIndex: num};
                        saveSettingsGlobal(newSettings);
                      }}
                      disabled={isRadioDisabled}
                      className={`w-5 h-5 accent-yellow-600 ${isRadioDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    />
                    <input
                      type="password"
                      value={keyValue || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newSettings = { ...settings };
                        if (num === 1) {
                          newSettings.apiKey1 = val;
                          newSettings.apiKey = val;
                        } else {
                          newSettings[`apiKey${num}`] = val;
                          // Volta pro índice 1 se apagar a chave que estava selecionada
                          if (val.trim() === '' && settings.activeKeyIndex === num) {
                            newSettings.activeKeyIndex = 1;
                          }
                        }
                        setSettings(newSettings);
                      }}
                      onBlur={() => saveSettingsGlobal(settings)}
                      placeholder={`Chave Secreta ${num}...`}
                      className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-2 opacity-50">Tópicos (1-10)</label>
                <input 
                  type="number" min="1" max="10" 
                  value={settings.numTopics} 
                  onChange={(e) => setSettings({...settings, numTopics: e.target.value})} 
                  onBlur={() => handleSettingBlur('numTopics', 1, 10)}
                  className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-2 opacity-50">Subtópicos (1-20)</label>
                <input 
                  type="number" min="1" max="20" 
                  value={settings.numSubtopics} 
                  onChange={(e) => setSettings({...settings, numSubtopics: e.target.value})} 
                  onBlur={() => handleSettingBlur('numSubtopics', 1, 20)}
                  className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-2 opacity-50">Questões por Subtópico (1-5)</label>
                <input 
                  type="number" min="1" max="5" 
                  value={settings.qPerSub} 
                  onChange={(e) => setSettings({...settings, qPerSub: e.target.value})} 
                  onBlur={() => handleSettingBlur('qPerSub', 1, 5)}
                  className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-2 opacity-50">Alternativas por Questão</label>
                <select 
                  value={settings.numAlternatives || 5} 
                  onChange={(e) => {
                     const newSettings = {...settings, numAlternatives: parseInt(e.target.value)};
                     setSettings(newSettings);
                     saveSettingsGlobal(newSettings);
                  }} 
                  className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                >
                  <option value={4}>4 Alternativas (A - D)</option>
                  <option value={5}>5 Alternativas (A - E)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-2 opacity-50">Prompt Extra (Diretrizes Adicionais)</label>
              <textarea value={settings.customPrompt} onChange={(e) => setSettings({...settings, customPrompt: e.target.value})} onBlur={() => saveSettingsGlobal(settings)} placeholder="Ex: Priorize exames laboratoriais na explicação..." className={`w-full h-32 p-4 rounded-lg border resize-none outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} />
            </div>
            <button onClick={() => { saveSettingsGlobal(settings); setView('library'); }} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-4 rounded-xl font-bold shadow-md transition-colors">Salvar Configurações</button>
          </div>
        )}
      </main>

      {/* MODAIS GERAIS DE MENSAGENS / ALERTAS */}
      {errorModal && (
        <GrecianModal 
          title={errorModal.title} 
          message={errorModal.message} 
          confirmText={errorModal.confirmText || "Compreendido"} 
          onConfirm={errorModal.onConfirm || (() => setErrorModal(null))} 
          onCancel={errorModal.onCancel || (() => setErrorModal(null))} 
          actionLabel={errorModal.actionLabel}
          onAction={errorModal.onAction}
          darkMode={darkMode} 
          isAlert={errorModal.isAlert !== undefined ? errorModal.isAlert : true}
        />
      )}

      {/* MODAIS GERAIS DE CONFIRMAÇÃO */}
      {deleteId && deleteId.type === 'subject' && (
        <GrecianModal 
          title="Expurgar Assunto?" 
          message="Esta ação removerá permanentemente este assunto da sua biblioteca." 
          confirmText="Expurgar" 
          onConfirm={() => {
            removeSubjectState(deleteId.id);
            setDeleteId(null);
          }} 
          onCancel={() => setDeleteId(null)} 
          darkMode={darkMode} 
        />
      )}

      {deleteId && deleteId.type === 'reset_topic' && (
        <GrecianModal 
          title="Limpar Progresso?" 
          message="Deseja apagar todas as marcações de resposta para refazer as questões deste bloco?" 
          confirmText="Limpar Tudo" 
          onConfirm={() => {
            resetAnswers();
            setDeleteId(null);
          }} 
          onCancel={() => setDeleteId(null)} 
          darkMode={darkMode} 
        />
      )}

      {/* MODAL PARA REGERAR TÓPICO COM IA */}
      {regenerateModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
          <div className={`w-full max-w-md rounded-2xl p-8 border-2 border-yellow-600 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4">
                <RotateCcw className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-serif font-bold mb-2">Recriar Bloco</h3>
              <p className="mb-6 opacity-70 text-sm">Cuidado: As questões atuais deste bloco serão perdidas e substituídas. Insira um foco abaixo caso deseje direcionar o Oráculo.</p>
              
              <textarea
                value={regeneratePrompt}
                onChange={(e) => setRegeneratePrompt(e.target.value)}
                placeholder="Ex: Crie questões focando apenas no tratamento farmacológico..."
                className={`w-full h-24 p-3 rounded-lg border resize-none outline-none focus:ring-2 focus:ring-yellow-500 mb-6 text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              />
              
              <div className="flex gap-4 w-full">
                <button onClick={() => setRegenerateModalOpen(false)} className={`flex-1 py-3 rounded-xl font-bold ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
                <button onClick={() => {
                  setRegenerateModalOpen(false);
                  generateTopicBatch(activeTopic.id, regeneratePrompt);
                  setRegeneratePrompt('');
                }} className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold shadow-lg transition-colors flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4"/> Recriar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA RENOMEAR PASTA */}
      {editingSubjectId && (
        <GrecianModal 
          title="Renomear Assunto" 
          message="Insira um novo nome para esta pasta de assunto:" 
          confirmText="Renomear" 
          onConfirm={handleEditSubject} 
          onCancel={() => { setEditingSubjectId(null); setEditingSubjectName(''); }} 
          darkMode={darkMode} 
        >
          <input 
            type="text" 
            value={editingSubjectName}
            onChange={(e) => setEditingSubjectName(e.target.value)}
            className={`w-full p-4 mb-6 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 font-bold ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} 
            autoFocus
          />
        </GrecianModal>
      )}

      {/* MODAL PARA RENOMEAR SUBPASTA (TÓPICO) */}
      {editingTopicId && (
        <GrecianModal 
          title="Renomear Bloco" 
          message="Insira um novo nome para este bloco:" 
          confirmText="Renomear" 
          onConfirm={handleEditTopic} 
          onCancel={() => { setEditingTopicId(null); setEditingTopicName(''); }} 
          darkMode={darkMode} 
        >
          <input 
            type="text" 
            value={editingTopicName}
            onChange={(e) => setEditingTopicName(e.target.value)}
            className={`w-full p-4 mb-6 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500 font-bold ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} 
            autoFocus
          />
        </GrecianModal>
      )}

    </div>
  );
}