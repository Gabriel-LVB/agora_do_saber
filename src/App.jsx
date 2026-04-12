import React, { useState, useEffect, useRef } from 'react';

// --- Ícones Temáticos (Grécia / Filosofia) ---
const Landmark = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 2 7 22 7 12 2"/><line x1="6" x2="6" y1="21" y2="7"/><line x1="10" x2="10" y1="21" y2="7"/><line x1="14" x2="14" y1="21" y2="7"/><line x1="18" x2="18" y1="21" y2="7"/><line x1="2" x2="22" y1="21" y2="21"/></svg>);
const Flame = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>);
const ScrollText = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M15 8h-5"/><path d="M15 12h-5"/></svg>);
const Folder = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>);
const CheckCircle2 = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>);
const XCircle = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>);
const BookOpen = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>);
const ArrowLeft = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>);
const SettingsIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>);
const Trash2 = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>);
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

// --- API Gemini ---
// O modelo agora aponta para a versão pública e estável do Gemini.
const callGemini = async (prompt, systemPrompt, userApiKey) => {
  if (!userApiKey) {
    throw new Error("API_KEY_MISSING");
  }

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
      
      if (response.status === 403 || response.status === 400 || response.status === 404) {
         throw new Error("API_KEY_INVALID");
      }
      if (!response.ok) throw new Error("Conexão falhou");
      
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (err) {
      if (err.message === "API_KEY_INVALID" || err.message === "API_KEY_MISSING") throw err;
      if (n === 1) throw err;
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

const GrecianModal = ({ title, message, onConfirm, onCancel, confirmText, darkMode, children, isAlert = false }) => (
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
              Desistir
            </button>
          )}
          <button onClick={onConfirm} className={`flex-1 py-3 text-white rounded-xl font-bold shadow-md transition-colors ${isAlert ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'}`}>
            {confirmText}
          </button>
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
      <span className={`${tagBg} text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block`}>Prova {question.id}</span>
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
  // Variáveis de Tema
  const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem('qb_darkmode') || 'false'));
  const mainBg = darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900";
  const headerBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const titleColor = darkMode ? "text-yellow-500" : "text-yellow-700";
  const statsBadge = darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800";
  
  // Estados principais
  const [view, setView] = useState('library'); 
  const [libraryFilter, setLibraryFilter] = useState('gemini'); // 'gemini' ou 'external'
  const [library, setLibrary] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('qb_v2_library') || '[]');
    return saved.map(s => {
      if (s.isImportFolder) return { ...s, source: 'external', title: 'Pergaminhos Diversos', isImportFolder: false };
      if (!s.source) return { ...s, source: 'gemini' };
      return s;
    }).filter(s => s.id !== 'imported-folder'); 
  });
  
  // Incluído campo para apiKey
  const defaultSettings = { numTopics: 10, numSubtopics: 5, qPerSub: 1, customPrompt: "", apiKey: "" };
  const [settings, setSettings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('qb_v2_settings'));
      return saved ? { ...defaultSettings, ...saved } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });
  
  // Estados de Criação e Navegação
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
  const [errorModal, setErrorModal] = useState(null); // { title, message, isAlert }
  
  // Paste states
  const [pasteInputText, setPasteInputText] = useState('');
  const [pasteSubjectName, setPasteSubjectName] = useState('');
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);
  const [pasteTopicName, setPasteTopicName] = useState('');
  
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [regeneratePrompt, setRegeneratePrompt] = useState('');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    document.title = "Ágora do Saber";
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 22 7 12 2"/><line x1="6" x2="6" y1="21" y2="7"/><line x1="10" x2="10" y1="21" y2="7"/><line x1="14" x2="14" y1="21" y2="7"/><line x1="18" x2="18" y1="21" y2="7"/><line x1="2" x2="22" y1="21" y2="21"/></svg>`;
    const encodedData = window.btoa(svgIcon);
    
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = `data:image/svg+xml;base64,${encodedData}`;
  }, []);

  useEffect(() => {
    localStorage.setItem('qb_v2_library', JSON.stringify(library));
    localStorage.setItem('qb_v2_settings', JSON.stringify(settings));
    localStorage.setItem('qb_darkmode', JSON.stringify(darkMode));
    document.body.style.backgroundColor = darkMode ? '#111827' : '#fafaf9';
  }, [library, settings, darkMode]);

  const activeSubject = library.find(s => s.id === activeSubjectId);
  const activeTopic = activeSubject?.topics.find(t => t.id === activeTopicId);

  const getFullPromptText = () => {
    const qCount = settings.numSubtopics * settings.qPerSub;
    return `Você é o Oráculo de Medicina da Ágora do Saber. Seu objetivo é criar um estudo reverso de altíssima qualidade.
Gere questões divididas em ${settings.numSubtopics} subtópicos, com ${settings.qPerSub} questões por subtópico (Total: ${qCount} questões).

DIRETRIZES GERAIS (ESTUDO REVERSO):
- Foco em aplicação de conhecimento e raciocínio clínico/básico estilo USMLE, Step 1, Step 2, NBME.
- Enunciado claro, sem pegadinhas gramaticais. Melhor resposta única.
- Alternativas homogêneas, plausíveis e com tamanho semelhante. A alternativa correta não deve se destacar visualmente por ser mais longa.
- Ensine cada ponto apenas uma vez de forma progressiva. Faça apenas conexões breves se o conceito já foi ensinado.
- A explicação deve soar direta, natural e autoral (não use "segundo o texto").

DIRETRIZES DA EXPLICAÇÃO (Deep Dive):
- Cada questão deve trazer imediatamente o gabarito e a explicação profunda.
- A explicação deve ser uma verdadeira aula. Comece pelas bases e vá aprofundando.
- Explique o porquê da correta e dê os diferenciais ('high-yield') que excluem as incorretas no mesmo bloco. Não precisa de um parágrafo isolado para distratores.

REFERÊNCIAS PRIORITÁRIAS:
- Patologia: Robbins & Cotran; Rosai & Ackerman; Rubin’s; WHO Tumours.
- Fisiologia: Guyton & Hall; Boron; Berne & Levy; West's.
- Clínica: Harrison; Goldman-Cecil; Oxford Handbook.
- Anatomia: Gray’s.
- Laboratório: Wallach; Henry’s; Diretrizes SBPC/ML.

TEMPLATE DE SAÍDA OBRIGATÓRIO (MUITO IMPORTANTE):
### Subtópico [X.Y] - [Nome do Subtópico]
## Questão [X.Y.Z]
[Texto do Enunciado]
A) [Alternativa]
B) [Alternativa]
C) [Alternativa]
D) [Alternativa]
E) [Alternativa]
Alternativa correta: [Letra]
Explicação:
[Aula profunda e diferenciais]
---

### Resumo de Consolidação
[Ao final de tudo, escreva um "Resumo de Consolidação" EXCLUSIVAMENTE em parágrafos de texto corrido. É ESTRITAMENTE PROIBIDO o uso de bullet points, listas numeradas ou tabelas. Escreva reforçando pontos importantes, conexões de conceitos e erros frequentes].

${settings.customPrompt ? `Contexto Extra do Usuário: ${settings.customPrompt}` : ''}`;
  };

  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(getFullPromptText());
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
            message: `O formato do artefato ${file.name} é desconhecido. O Oráculo decifra apenas pedras TXT, MD, PDF e DOC/DOCX.`
          });
          continue;
        }
        newFiles.push({ name: file.name, content: text });
      } catch(err) {
        console.error("Erro lendo arquivo", err);
        setErrorModal({
          title: 'Pergaminho Corrompido',
          message: `O feitiço falhou em ${file.name}. O pergaminho pode estar corrompido ou selado com magia negra.`
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
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const getCombinedMaterials = () => {
    return materialText + "\n" + uploadedFiles.map(f => `[CONTEÚDO DO ARQUIVO: ${f.name}]\n${f.content}`).join("\n\n");
  }

  // Função central para checar a chave da API
  const checkApiKey = () => {
    if (!settings.apiKey || settings.apiKey.trim() === '') {
      setErrorModal({
        title: 'Oráculo sem Voz (API Key)',
        message: 'Para invocar os deuses neste ambiente, você precisa fornecer a sua própria chave secreta. Vá até as "Leis do Oráculo" (ícone de engrenagem) e insira sua Gemini API Key gratuita.',
        isAlert: true
      });
      return false;
    }
    return true;
  };

  const handleStartCreation = async () => {
    if (!checkApiKey()) return;
    
    setIsBusy(true);
    const combinedMaterials = getCombinedMaterials();
    const systemPrompt = `Você é o Arquiteto de Alexandria. Seu dever é organizar o conhecimento médico.
Baseado no tema "${newSubjectName}" e nos materiais fornecidos, crie um Sumário Didático.

DIRETRIZES DO SUMÁRIO:
- Crie EXATAMENTE ${settings.numTopics} Tópicos Principais.
- Cada tópico deve ter EXATAMENTE ${settings.numSubtopics} Subtópicos.
- A ordem deve ser a mais didática possível (mesmo que fuja da ordem do material base).
- Responda APENAS o sumário em formato hierárquico claro, usando a palavra 'Tópico X' no início de cada linha principal.`;
    
    try {
      const result = await callGemini(`Materiais: ${combinedMaterials}`, systemPrompt, settings.apiKey);
      setProposedSyllabus(result);
      setCreatorStep(2);
    } catch (e) { 
      if (e.message === "API_KEY_INVALID") {
        setErrorModal({ title: 'Chave Inválida', message: "A chave secreta fornecida nas configurações não foi reconhecida pelos Deuses.", isAlert: true });
      } else {
        setErrorModal({ title: 'O Oráculo Calou-se', message: "Falha na conexão com os deuses antigos. Tente novamente.", isAlert: true });
      }
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

Responda APENAS com o novo sumário ajustado, mantendo rigorosamente a estrutura de ${settings.numTopics} Tópicos e ${settings.numSubtopics} Subtópicos.`;

    try {
      const result = await callGemini(`Ajuste o sumário conforme o pedido.`, systemPrompt, settings.apiKey);
      setProposedSyllabus(result);
      setSyllabusFeedback('');
    } catch (e) { 
      setErrorModal({ title: 'O Oráculo Calou-se', message: "Falha na conexão com os deuses antigos. Tente novamente.", isAlert: true }); 
    }
    finally { setIsBusy(false); }
  };

  const finalizeSubject = () => {
    const topicLines = proposedSyllabus.split('\n').filter(l => l.match(/(?:^|\n)Tópico\s*\d+/i));
    const topics = topicLines.map((title, idx) => ({
      id: `topic-${idx}-${Date.now()}`,
      title: title.trim(),
      questions: [],
      answers: {},
      summary: ''
    }));

    const newSubject = {
      id: Date.now(),
      title: newSubjectName,
      fullSyllabus: proposedSyllabus,
      source: 'gemini',
      sourceMaterials: getCombinedMaterials(),
      topics: topics
    };

    setLibrary([newSubject, ...library]);
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

    setLibrary(prev => prev.map(s => {
      if (s.id !== activeSubjectId) return s;
      return {
        ...s,
        topics: s.topics.map(t => t.id === topicId ? { ...t, questions: [], summary: '', answers: {} } : t)
      };
    }));

    const topic = activeSubject.topics.find(t => t.id === topicId);
    const qCount = settings.numSubtopics * settings.qPerSub;
    
    const contextText = activeSubject.sourceMaterials
      ? `\n\nMATERIAIS DE BASE OBRIGATÓRIOS (Textos Sagrados):\nAs questões geradas DEVEM refletir e focar primariamente nos conceitos encontrados nos textos a seguir:\n${activeSubject.sourceMaterials}`
      : '';

    const FULL_SYSTEM_PROMPT = getFullPromptText() + contextText + `\n\nInstruções específicas para esta geração (refazer com foco): ${additionalPrompt}`;

    try {
      const result = await callGemini(`Invoque o conhecimento sobre o tópico: ${topic.title}`, FULL_SYSTEM_PROMPT, settings.apiKey);
      const parsed = parseData(result);
      
      setLibrary(prev => prev.map(s => {
        if (s.id !== activeSubjectId) return s;
        return {
          ...s,
          topics: s.topics.map(t => t.id === topicId ? { ...t, questions: parsed.questions, summary: parsed.summary, answers: {} } : t)
        };
      }));
      setShowSummary(false);
    } catch (e) { 
      if (e.message === "API_KEY_INVALID") {
        setErrorModal({ title: 'Chave Inválida', message: "A chave secreta fornecida nas configurações não foi reconhecida pelos Deuses.", isAlert: true });
      } else {
        setErrorModal({ title: 'A Invocação Falhou', message: "A conexão foi interrompida pelo tempo ou pelos Deuses. Tente novamente.", isAlert: true });
      }
    } finally { 
      setIsBusy(false); 
    }
  };

  const handlePasteImport = () => {
    const parsed = parseData(pasteInputText);
    if (parsed.questions.length === 0) {
      setErrorModal({
        title: "Pergaminho Ilegível",
        message: "O Oráculo não compreendeu estes símbolos. Assegure-se de que os deuses antigos aprovariam a estrutura (## Questão, A), B), Alternativa correta:, Explicação:).",
        isAlert: true
      });
      return;
    }
    
    const subjectName = pasteSubjectName.trim() || 'Pergaminhos Sem Nome';
    const topicName = pasteTopicName.trim() || `Sessão de Provações (${new Date().toLocaleDateString()})`;

    const newTopic = {
      id: `imported-${Date.now()}`,
      title: topicName,
      questions: parsed.questions,
      summary: parsed.summary,
      answers: {}
    };

    let targetSubj = library.find(s => s.title.toLowerCase() === subjectName.toLowerCase() && s.source === 'external');

    if (targetSubj) {
      setLibrary(prev => prev.map(s => s.id === targetSubj.id ? { ...s, topics: [...s.topics, newTopic] } : s));
      setActiveSubjectId(targetSubj.id);
    } else {
      const newSubj = {
        id: Date.now(),
        title: subjectName,
        source: 'external',
        fullSyllabus: "Importado via texto externo",
        topics: [newTopic]
      };
      setLibrary(prev => [newSubj, ...prev]);
      setActiveSubjectId(newSubj.id);
    }
    
    setPasteInputText('');
    setPasteTopicName('');
    setActiveTopicId(newTopic.id);
    setView('topic');
  };

  const handleAnswer = (qId, letter) => {
    setLibrary(prev => prev.map(s => {
      if (s.id !== activeSubjectId) return s;
      return {
        ...s,
        topics: s.topics.map(t => {
          if (t.id !== activeTopicId) return t;
          return { ...t, answers: { ...t.answers, [qId]: letter } };
        })
      };
    }));
  };

  const resetAnswers = () => {
    setLibrary(prev => prev.map(s => {
      if (s.id !== activeSubjectId) return s;
      return {
        ...s,
        topics: s.topics.map(t => t.id === activeTopicId ? { ...t, answers: {} } : t)
      };
    }));
    setShowSummary(false);
  };

  const subjectsToShow = library.filter(s => s.source === libraryFilter);
  const externalFolderNames = Array.from(new Set(library.filter(s => s.source === 'external').map(s => s.title)));

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
            <button onClick={() => setView('settings')} className={`p-2 rounded-full hover:scale-110 transition-transform ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-yellow-500' : 'bg-gray-100 hover:bg-gray-200 text-yellow-600'}`}><SettingsIcon className="w-5 h-5" /></button>
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full hover:scale-110 transition-transform ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-yellow-500' : 'bg-gray-100 hover:bg-gray-200 text-yellow-600'}`}>{darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* VIEW: MAIN LIBRARY (ROOT) */}
        {view === 'library' && (
          <div className="animate-in fade-in">
            <div className="mb-10">
              <h2 className="text-3xl font-serif font-bold text-yellow-600 mb-2">Não são admitidos ignorantes em geometria</h2>
              <p className="opacity-60 mb-6">Escolha o seu caminho do conhecimento.</p>
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <button onClick={() => setView('creator')} className="flex-1 bg-yellow-600 text-white py-4 rounded-xl font-bold shadow-md hover:bg-yellow-700 transition-all flex items-center justify-center gap-3">
                  <Sparkles className="w-6 h-6" /> Invocar Assunto (Gemini)
                </button>
                <button onClick={() => setView('paste')} className={`flex-1 py-4 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-3 ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50'}`}>
                  <ScrollText className="w-6 h-6 text-yellow-600" /> Decifrar Pergaminho (Externo)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div onClick={() => { setLibraryFilter('gemini'); setView('sub-library'); }} className={`${darkMode ? 'bg-gray-800 border-gray-700 hover:border-yellow-600' : 'bg-white border-gray-200 hover:border-yellow-500'} p-8 rounded-2xl border shadow-sm cursor-pointer transition-all flex flex-col justify-center items-center text-center group`}>
                <div className="p-5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Landmark className="w-12 h-12 text-yellow-600" />
                </div>
                <h3 className="font-serif font-bold text-2xl text-yellow-600 mb-2">Acervo do Oráculo</h3>
                <p className="text-sm opacity-60">Assuntos e sumários gerados pelo Gemini.</p>
                <div className={`mt-4 text-xs font-bold px-3 py-1 rounded-full ${statsBadge}`}>{library.filter(s=>s.source === 'gemini').length} Pastas</div>
              </div>

              <div onClick={() => { setLibraryFilter('external'); setView('sub-library'); }} className={`${darkMode ? 'bg-gray-800 border-gray-700 hover:border-yellow-600' : 'bg-white border-gray-200 hover:border-yellow-500'} p-8 rounded-2xl border shadow-sm cursor-pointer transition-all flex flex-col justify-center items-center text-center group`}>
                <div className="p-5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Folder className="w-12 h-12 text-yellow-600" />
                </div>
                <h3 className="font-serif font-bold text-2xl text-yellow-600 mb-2">Pergaminhos Externos</h3>
                <p className="text-sm opacity-60">Pastas e blocos importados manualmente de IAs externas.</p>
                <div className={`mt-4 text-xs font-bold px-3 py-1 rounded-full ${statsBadge}`}>{library.filter(s=>s.source === 'external').length} Pastas</div>
              </div>
            </div>

            <div className="mt-12 flex justify-center animate-in fade-in">
              <button onClick={copyPromptToClipboard} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all border ${darkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'} ${copiedPrompt ? 'ring-2 ring-yellow-500 text-yellow-600' : ''}`}>
                {copiedPrompt ? <CheckCircle2 className="w-5 h-5 text-yellow-500" /> : <Copy className="w-5 h-5" />}
                {copiedPrompt ? "Prece Copiada!" : "Copiar Prece ao Oráculo (Prompt)"}
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
                <button onClick={() => setView('library')} className={`flex items-center gap-2 mb-4 font-bold transition-colors ${darkMode ? 'text-gray-400 hover:text-yellow-500' : 'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4" /> Retornar</button>
                <h2 className="text-3xl font-serif font-bold text-yellow-600">
                  {libraryFilter === 'gemini' ? 'Acervo do Oráculo' : 'Pergaminhos Externos'}
                </h2>
                <p className="opacity-60 mt-1">Selecione uma pasta para estudar.</p>
              </div>
              {libraryFilter === 'gemini' ? (
                <button onClick={() => setView('creator')} className="bg-yellow-600 text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-yellow-700 transition-all flex items-center gap-2"><Sparkles className="w-4 h-4" /> Novo Panteão</button>
              ) : (
                <button onClick={() => setView('paste')} className="bg-stone-700 text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-stone-800 transition-all flex items-center gap-2"><ScrollText className="w-4 h-4" /> Novos Escritos</button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjectsToShow.length === 0 && <div className="col-span-full py-10 text-center opacity-40 italic">As prateleiras da biblioteca estão vazias nesta sessão.</div>}
              
              {subjectsToShow.map(subject => (
                <div key={subject.id} onClick={() => { setActiveSubjectId(subject.id); setView('subject'); }} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-2xl border hover:border-yellow-500 cursor-pointer group transition-all flex flex-col justify-between`}>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <Folder className="w-10 h-10 text-yellow-600" />
                      <button onClick={(e) => { e.stopPropagation(); setDeleteId({type:'subject', id:subject.id}); }} className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>
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
            <button onClick={() => setView('sub-library')} className={`flex items-center gap-2 mb-6 font-bold transition-colors ${darkMode ? 'text-gray-400 hover:text-yellow-500' : 'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4" /> Desistir da Jornada</button>
            <h2 className="text-3xl font-serif font-bold text-yellow-600 mb-2 flex items-center gap-3"><ScrollText className="w-8 h-8"/> Decifrar Pergaminho Externo</h2>
            <p className="opacity-60 mb-6">Crie uma nova pasta ou adicione tópicos a uma existente colando questões de outras IAs.</p>
            
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
                  placeholder="Pasta Principal (Assunto) - ex: Nefrologia" 
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
              <button onClick={handlePasteImport} disabled={!pasteInputText.trim()} className="w-full sm:w-auto bg-stone-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-stone-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                <Folder className="w-5 h-5" /> Gravar nas Pedras
              </button>
            </div>
          </div>
        )}

        {/* VIEW: SUBJECT (PASTA INTERNA) */}
        {view === 'subject' && activeSubject && (
          <div className="animate-in slide-in-from-right">
            <button onClick={() => { setLibraryFilter(activeSubject.source); setView('sub-library'); }} className={`flex items-center gap-2 mb-6 font-bold transition-colors ${darkMode ? 'text-gray-400 hover:text-yellow-500' : 'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4" /> Retornar</button>
            <h2 className="text-3xl font-serif font-bold text-yellow-600 mb-2">{activeSubject.title}</h2>
            <p className="opacity-60 mb-8">{activeSubject.source === 'gemini' ? 'Sumário Estruturado pelo Oráculo' : 'Subpastas Importadas'}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSubject.topics.map(topic => (
                <div key={topic.id} onClick={() => { setActiveTopicId(topic.id); setView('topic'); }} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 rounded-xl border flex items-center justify-between hover:border-yellow-500 cursor-pointer group`}>
                  <div className="flex items-center gap-4 flex-1 truncate pr-4">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 flex-shrink-0"><ScrollText className="w-5 h-5" /></div>
                    <div className="truncate">
                      <h4 className="font-bold text-sm truncate">{topic.title}</h4>
                      <p className="text-xs opacity-50">{topic.questions.length > 0 ? `${Object.keys(topic.answers).length}/${topic.questions.length} respondidas` : 'Silêncio - Aguardando os Deuses'}</p>
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
                <button onClick={() => setView('subject')} className={`flex items-center gap-2 mb-2 font-bold transition-colors ${darkMode ? 'text-gray-400 hover:text-yellow-500' : 'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4" /> Retornar</button>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-serif font-bold text-yellow-600">{activeTopic.title}</h2>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {activeTopic.questions.length > 0 && (
                  <button onClick={() => setDeleteId({type:'reset_topic', id:activeTopic.id})} className="flex-1 sm:flex-none flex justify-center items-center gap-2 p-2 px-4 border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-bold text-sm">
                    <Eraser className="w-4 h-4" /> Purificar
                  </button>
                )}
                {activeTopic.questions.length > 0 && activeSubject.source === 'gemini' && (
                  <button onClick={() => setRegenerateModalOpen(true)} className="flex-1 sm:flex-none flex justify-center items-center gap-2 p-2 px-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 rounded-lg transition-colors font-bold text-sm">
                    <RotateCcw className="w-4 h-4" /> Refazer
                  </button>
                )}
                {activeTopic.questions.length === 0 && activeSubject.source === 'gemini' && (
                  <button onClick={() => generateTopicBatch(activeTopic.id)} disabled={isBusy} className="w-full sm:w-auto bg-yellow-600 text-white px-6 py-2 rounded-xl font-bold flex justify-center items-center gap-2">
                    {isBusy ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Flame className="w-5 h-5"/>} {isBusy ? 'Invocando...' : 'Invocar Provações'}
                  </button>
                )}
              </div>
            </div>
            
            {/* ESTADO DE CARREGAMENTO */}
            {isBusy && activeTopic.questions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in">
                <div className="w-12 h-12 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-lg font-serif font-bold text-yellow-600">O Oráculo está forjando suas provações...</p>
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
                     {!showSummary && <button onClick={() => setShowSummary(true)} className="bg-yellow-600 text-white px-8 py-3 rounded-xl font-bold">Ver Consolidação</button>}
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
            <button onClick={abortCreation} className={`mb-6 font-bold flex items-center gap-2 transition-colors ${darkMode ? 'text-gray-400 hover:text-yellow-500' : 'text-gray-500 hover:text-yellow-600'}`}><ArrowLeft className="w-4 h-4"/> Desistir da Jornada</button>
            {creatorStep === 1 ? (
              <div className="space-y-6">
                <h2 className="text-3xl font-serif font-bold text-yellow-600 flex items-center gap-3">
                  <Sparkles className="w-8 h-8" />
                  Invocar Assunto (Gemini)
                </h2>
                <input type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="Nome do Novo Panteão (ex: Nefrologia)" className={`w-full p-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} outline-none focus:ring-2 focus:ring-yellow-500`} />
                
                {/* Upload Section */}
                <div className="relative">
                  <div className={`text-xs font-bold uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Textos Sagrados (Copie & Cole textos ou Oferende Arquivos PDF, DOCX, TXT)</div>
                  
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
                    placeholder="Insira o néctar ou suas anotações aqui... Você também pode dar Ctrl+V ou colar os arquivos PDF/Word diretamente aqui." 
                    className={`w-full h-48 p-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} resize-none outline-none focus:ring-2 focus:ring-yellow-500`} 
                  />
                  
                  <button onClick={() => fileInputRef.current.click()} title="Oferendar arquivos (PDF, DOCX, TXT, MD)" className="absolute bottom-4 right-4 p-2 bg-yellow-600 text-white rounded-lg shadow-md hover:bg-yellow-700 transition-colors">
                    <FileUp className="w-5 h-5" />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" accept=".txt,.md,.pdf,.doc,.docx" />
                </div>

                <button onClick={handleStartCreation} disabled={isBusy || isUploading || !newSubjectName} className="w-full bg-yellow-600 text-white py-4 rounded-xl font-bold shadow-lg disabled:opacity-50 flex justify-center items-center gap-2">
                  {isBusy || isUploading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Sparkles className="w-5 h-5" />} 
                  {isBusy ? 'Consultando as Estrelas...' : (isUploading ? 'Decifrando Arquivos...' : 'Gerar Proposta de Sumário')}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-2xl font-serif font-bold text-yellow-600">O Mapa da Jornada</h2>
                <p className="opacity-60 mb-6">Analise os caminhos propostos. Dialogue com o Oráculo abaixo para ajustar seu destino.</p>
                
                <div className={`w-full h-[40vh] p-6 rounded-xl border font-mono text-sm leading-relaxed overflow-y-auto whitespace-pre-wrap ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                  {proposedSyllabus}
                </div>

                <div className="relative">
                  <textarea 
                    value={syllabusFeedback} 
                    onChange={(e) => setSyllabusFeedback(e.target.value)} 
                    placeholder="Suplique aos deuses por mudanças na jornada..." 
                    className={`w-full h-24 p-4 pr-14 rounded-xl border resize-none outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`} 
                  />
                  <button onClick={handleReviseSyllabus} disabled={!syllabusFeedback.trim() || isBusy} className="absolute bottom-4 right-4 p-2 bg-yellow-600 text-white rounded-lg shadow-md hover:bg-yellow-700 disabled:opacity-50">
                    {isBusy ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Send className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex gap-4 mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <button onClick={() => setCreatorStep(1)} className={`flex-1 py-4 font-bold rounded-xl transition-colors ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>Retornar</button>
                  <button onClick={finalizeSubject} className="flex-[2] bg-yellow-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-yellow-700 transition-colors">Selar os Pergaminhos</button>
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
              <h2 className="text-3xl font-serif font-bold text-yellow-600">Leis do Oráculo</h2>
            </div>
            
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase mb-2 opacity-50 flex items-center gap-2"><Key className="w-4 h-4"/> Chave Divina (Gemini API Key)</label>
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                placeholder="Cole sua chave AI Studio secreta aqui..."
                className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              />
              <p className="text-[11px] mt-2 opacity-60">Para invocar a IA em suas próprias terras (Vercel), os Deuses exigem um tributo. Obtenha sua chave gratuita em: aistudio.google.com/app/apikey. Ela repousa segura, apenas no cofre deste navegador.</p>
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
              <label className="block text-xs font-bold uppercase mb-2 opacity-50">Prompt Extra (Diretrizes Adicionais)</label>
              <textarea value={settings.customPrompt} onChange={(e) => setSettings({...settings, customPrompt: e.target.value})} placeholder="Ex: Priorize exames laboratoriais na explicação..." className={`w-full h-32 p-4 rounded-lg border resize-none outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} />
            </div>
            <button onClick={() => setView('library')} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-4 rounded-xl font-bold shadow-md transition-colors">Gravar nas Pedras</button>
          </div>
        )}
      </main>

      {/* MODAIS GERAIS DE MENSAGENS / ALERTAS */}
      {errorModal && (
        <GrecianModal 
          title={errorModal.title} 
          message={errorModal.message} 
          confirmText="Compreendido" 
          onConfirm={() => setErrorModal(null)} 
          darkMode={darkMode} 
          isAlert={true}
        />
      )}

      {/* MODAIS GERAIS DE CONFIRMAÇÃO */}
      {deleteId && deleteId.type === 'subject' && (
        <GrecianModal 
          title="Expurgar Pasta?" 
          message="Esta ação queimará este registro para sempre na biblioteca." 
          confirmText="Expurgar" 
          onConfirm={() => {
            setLibrary(library.filter(s => s.id !== deleteId.id));
            setDeleteId(null);
          }} 
          onCancel={() => setDeleteId(null)} 
          darkMode={darkMode} 
        />
      )}

      {deleteId && deleteId.type === 'reset_topic' && (
        <GrecianModal 
          title="Purificar Provações?" 
          message="Deseja apagar todas as marcações para refazer este bloco?" 
          confirmText="Expurgar Tudo" 
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
              <h3 className="text-2xl font-serif font-bold mb-2">Reinvocar Tópico</h3>
              <p className="mb-6 opacity-70 text-sm">Cuidado: As provações atuais deste tópico serão varridas da história. Informe aos deuses se deseja um novo foco.</p>
              
              <textarea
                value={regeneratePrompt}
                onChange={(e) => setRegeneratePrompt(e.target.value)}
                placeholder="Ex: Crie questões focando apenas no tratamento farmacológico pediátrico..."
                className={`w-full h-24 p-3 rounded-lg border resize-none outline-none focus:ring-2 focus:ring-yellow-500 mb-6 text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              />
              
              <div className="flex gap-4 w-full">
                <button onClick={() => setRegenerateModalOpen(false)} className={`flex-1 py-3 rounded-xl font-bold ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>Recuar</button>
                <button onClick={() => {
                  setRegenerateModalOpen(false);
                  generateTopicBatch(activeTopic.id, regeneratePrompt);
                  setRegeneratePrompt('');
                }} className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold shadow-lg transition-colors flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4"/> Reinvocar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}