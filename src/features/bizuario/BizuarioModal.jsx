import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase.js';
import { callGemini } from '../../services/gemini.js';

const ic = (d) => ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} dangerouslySetInnerHTML={{__html:d}}/>
);

const BrainIcon = ic('<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-3.14Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-3.14Z"/>');

const Spinner = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{animation:'spin 1s linear infinite',transformOrigin:'center'}}>
    <style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const renderInline = (text, keyPrefix) => {
  const parts = String(text || '').split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    const bold = part.startsWith('**') && part.endsWith('**');
    const content = bold ? part.slice(2, -2) : part;
    return bold ? <strong key={`${keyPrefix}-${index}`}>{content}</strong> : <React.Fragment key={`${keyPrefix}-${index}`}>{content}</React.Fragment>;
  });
};

const RichText = ({ text, darkMode }) => (
  <div className={`space-y-3 ${darkMode?'text-gray-200':'text-gray-800'}`}>
    {String(text || '').split(/\n{2,}/).filter(Boolean).map((paragraph, index) => (
      <p key={index} className="leading-relaxed">{renderInline(paragraph.replace(/\n/g, ' '), `p-${index}`)}</p>
    ))}
  </div>
);

export default function BizuarioModal({
  topicTitle,
  subjectTitle,
  questions=[],
  subtopics=[],
  topicContexts=null,
  apiKey,
  darkMode,
  onClose,
  cachedText,
  onSave,
  onRotateKey,
  geminiOptions={},
}) {
  const [text, setText] = useState(cachedText || '');
  const [loading, setLoading] = useState(!cachedText);
  const [phase, setPhase] = useState(cachedText ? 'done' : 'loading');
  const wasCached = !!cachedText;

  const buildContextBlock = () => {
    if (topicContexts?.length) {
      return topicContexts.map(tc => {
        if (tc.questions?.length) {
          const qLines = tc.questions.slice(0, 10).map((q, i) =>
            `  ${i + 1}. ${String(q.statement || '').substring(0, 100).replace(/\n/g, ' ')}...\n     ✓ ${(q.options || []).find(o => o.isCorrect)?.text || q.expectedAnswer || ''} | ${String(q.explanation || '').substring(0, 200).replace(/\n/g, ' ')}...`
          ).join('\n');
          return `TÓPICO: ${tc.title}\n${qLines}`;
        }
        if (tc.subtopics?.length) return `TÓPICO: ${tc.title}\n  Subtópicos: ${tc.subtopics.join(', ')}`;
        return `TÓPICO: ${tc.title}`;
      }).join('\n\n');
    }
    if (questions.length) {
      return questions.slice(0, 15).map((q, i) =>
        `${i + 1}. ${String(q.statement || '').substring(0, 120).replace(/\n/g, ' ')}...\n   ✓ ${(q.options || []).find(o => o.isCorrect)?.text || q.expectedAnswer || ''}\n   ${String(q.explanation || '').substring(0, 300).replace(/\n/g, ' ')}...`
      ).join('\n\n');
    }
    if (subtopics.length) return `Subtópicos do tópico: ${subtopics.join(', ')}`;
    return '';
  };

  const generate = async () => {
    setText('');
    setLoading(true);
    setPhase('loading');
    try {
      const sys = 'Você é o Oráculo da Ágora do Saber, editor de revisão médica high-yield em português brasileiro. Seja denso, clínico e direto. Use **negrito** para termos-chave, valores, critérios diagnósticos e mecanismos críticos.';
      const contextBlock = buildContextBlock();
      const scope = topicContexts ? `da pasta "${topicTitle}" (${topicContexts.length} tópicos)` : `do tópico "${topicTitle}"${subjectTitle ? ` (${subjectTitle})` : ''}`;
      const wordLimit = topicContexts ? 'Máximo 600 palavras, abordando todos os tópicos' : 'Máximo 400 palavras, densidade máxima, zero enrolação';

      let prompt = '';
      try {
        const pSnap = await getDoc(doc(db, 'config', 'prompts'));
        const template = pSnap.exists() ? pSnap.data()?.bizuario : '';
        if (template) {
          prompt = template
            .replaceAll('{{TOPIC_TITLE}}', scope)
            .replaceAll('{{SUBJECT_CONTEXT}}', subjectTitle ? ` — ${subjectTitle}` : '')
            .replaceAll('{{QUESTIONS_CONTEXT}}', contextBlock ? `CONTEÚDO BASE:\n${contextBlock}` : '')
            .replaceAll('{{WORD_LIMIT}}', topicContexts ? '600' : '400');
        }
      } catch(e) {}

      if (!prompt) {
        prompt = `Crie o BIZUÁRIO ${scope}.\n\n${contextBlock ? `CONTEÚDO BASE:\n${contextBlock}\n` : ''}\nOBJETIVO: cola de revisão ultra-rápida para prova.\n\nFORMATO: parágrafos corridos, densos, sem bullet points. Valores numéricos, critérios, associações clássicas. ${wordLimit}.`;
      }

      const result = await callGemini(prompt, sys, apiKey, [], geminiOptions);
      setText(result);
      setPhase('done');
      onSave?.(result);
    } catch(e) {
      setText('Não foi possível gerar o bizuário agora. Verifique sua API Key.');
      setPhase('done');
    } finally {
      if (onRotateKey) await onRotateKey();
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cachedText) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            {wasCached && !loading && <span className={`text-xs font-normal px-2 py-0.5 rounded-full ml-1 ${darkMode?'bg-green-900/40 text-green-400':'bg-green-100 text-green-700'}`}>salvo</span>}
          </h3>
          <div className="flex items-center gap-2">
            {phase === 'done' && !loading && (
              <button onClick={generate} title="Regenerar bizuário" className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${darkMode?'bg-gray-700 hover:bg-gray-600 text-gray-300':'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                Refazer
              </button>
            )}
            <button type="button" aria-label="Fechar" onClick={onClose} className={`p-2 rounded-full font-bold text-lg leading-none transition-colors ${darkMode?'hover:bg-gray-700 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>x</button>
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
            <RichText text={text} darkMode={darkMode}/>
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
}
