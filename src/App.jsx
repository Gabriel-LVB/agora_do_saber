import React, { useState, useEffect } from 'react';

// --- Ícones Temáticos (Grécia / Filosofia) ---
const Landmark = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="12 2 2 7 22 7 12 2" />
    <line x1="6" x2="6" y1="21" y2="7" />
    <line x1="10" x2="10" y1="21" y2="7" />
    <line x1="14" x2="14" y1="21" y2="7" />
    <line x1="18" x2="18" y1="21" y2="7" />
    <line x1="2" x2="22" y1="21" y2="21" />
  </svg>
);
const Flame = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);
const ScrollText = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4" />
    <path d="M19 17V5a2 2 0 0 0-2-2H4" />
    <path d="M15 8h-5" />
    <path d="M15 12h-5" />
  </svg>
);
const CheckCircle2 = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const XCircle = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);
const BookOpen = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
const ArrowLeft = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);
const Settings2 = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 7h-9" />
    <path d="M14 17H5" />
    <circle cx="17" cy="17" r="3" />
    <circle cx="7" cy="7" r="3" />
  </svg>
);
const RotateCcw = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
const Sun = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);
const Moon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);
const GraduationCap = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21.42 10.922a2 2 0 0 1-.01 2.83l-7.1 7.11a2 2 0 0 1-2.83 0l-7.1-7.1a2 2 0 0 1-.01-2.83l7.1-7.1a2 2 0 0 1 2.83 0l7.1 7.1Z" />
    <path d="M22 10v6" />
    <path d="M6 12v6a6 6 0 0 0 12 0v-6" />
  </svg>
);
const Award = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const DEFAULT_TEXT = `Insira aqui o néctar`;

// ALGORITMO DE PARSER ULTRA RESILIENTE
const parseData = (text) => {
  const normalizedText = text.replace(/\r\n/g, '\n');

  let summary = '';
  // Extrai o resumo ignorando se a IA esqueceu as hashtags (###)
  const summaryRegex =
    /(?:^|\n)(?:###|##|\*\*)?\s*Resumo(?: de Consolidação)?\s*\n([\s\S]*)$/i;
  const summaryMatch = normalizedText.match(summaryRegex);
  if (summaryMatch && summaryMatch[1]) {
    // Remove os "---" que a IA pode ter colocado no final do texto
    summary = summaryMatch[1].replace(/\n---.*/g, '').trim();
  }

  // Quebra os blocos independente se tem ##, ** ou nada antes de "Questão X"
  const blocks = normalizedText
    .split(/(?=(?:^|\n)(?:\*\*|##)?\s*Questão\s*\d)/i)
    .filter((b) => b.trim() !== '');
  const questions = [];

  blocks.forEach((block, index) => {
    // Relaxamos a verificação para aceitar blocos que tenham "Alternativa correta:" sem os asteriscos
    if (!block.match(/Alternativa correta:/i) && !block.match(/\nA\)/i)) return;

    try {
      const idMatch = block.match(/(?:\*\*|##)?\s*Questão\s*([0-9.]+)/i);
      const id = idMatch ? idMatch[1] : `ID-${index + 1}`;

      let statement = '';
      const statementStartMatch = block.match(/(?:\*\*|##)?\s*Questão.*?\n/i);
      const firstOptionMatch = block.match(/\n\s*A\)/i);

      if (statementStartMatch && firstOptionMatch) {
        const startIdx =
          statementStartMatch.index + statementStartMatch[0].length;
        const endIdx = firstOptionMatch.index;
        statement = block.substring(startIdx, endIdx).trim();
      }

      const options = [];
      const correctLineMatch = block.match(/Alternativa correta:/i);
      if (firstOptionMatch && correctLineMatch) {
        const optionsStr = block.substring(
          firstOptionMatch.index,
          correctLineMatch.index
        );
        const optionRegex = /([A-E])\)\s*([\s\S]*?)(?=(?:\n\s*[A-E]\)|$))/gi;
        let match;
        while ((match = optionRegex.exec(optionsStr)) !== null) {
          options.push({
            letter: match[1].toUpperCase(),
            text: match[2].trim(),
          });
        }
      }

      // Funciona mesmo se a IA escrever "Alternativa correta: B" (sem o negrito)
      const correctMatch = block.match(
        /Alternativa correta:\s*(?:\*\*)?\s*([A-E])/i
      );
      const correctLetter = correctMatch ? correctMatch[1].toUpperCase() : null;

      let explanation = '';
      // Funciona mesmo se a IA não colocar negrito na palavra "Explicação:"
      const expMatch = block.match(
        /(?:Correção aprofundada|Explicação|Correção):/i
      );
      if (expMatch) {
        const startOfExp = expMatch.index + expMatch[0].length;
        // Corta a explicação se encontrar um traço, o próximo resumo ou o final do arquivo
        let endOfExp = block
          .substring(startOfExp)
          .search(/\n\s*(?:---|###\s*Resumo|(?:\*\*)?\s*Resumo)/i);
        if (endOfExp === -1) {
          explanation = block.substring(startOfExp).trim();
        } else {
          explanation = block
            .substring(startOfExp, startOfExp + endOfExp)
            .trim();
        }
        // Limpa algum asterisco que tenha sobrado
        explanation = explanation.replace(/^\*\*/, '').trim();
      }

      if (options.length > 0 && correctLetter) {
        const originalCorrectText = options.find(
          (o) => o.letter === correctLetter
        )?.text;

        const shuffledTexts = [...options.map((o) => o.text)].sort(
          () => Math.random() - 0.5
        );

        const finalOptions = shuffledTexts.map((text, idx) => {
          const letters = ['A', 'B', 'C', 'D', 'E'];
          return {
            letter: letters[idx],
            text: text,
            isCorrect: text === originalCorrectText,
          };
        });

        questions.push({ id, statement, options: finalOptions, explanation });
      }
    } catch (e) {
      console.error('Erro ao extrair dados de uma questão: ', e);
    }
  });

  return { questions, summary };
};

// Formatação com Cores Clássicas (Gray/Yellow) para compatibilidade com Tailwind v2
const formatText = (text, darkMode) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
      return (
        <strong key={index} className={`font-bold ${textColor}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

const QuestionCard = ({
  question,
  index,
  selectedLetter,
  onAnswer,
  darkMode,
}) => {
  const isAnswered = selectedLetter !== undefined && selectedLetter !== null;

  // Usando Gray (para o mármore) e Yellow (para o Ouro) - Suportado no Tailwind v2
  const cardBg = darkMode
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border-gray-200';
  const tagBg = darkMode
    ? 'bg-yellow-900 bg-opacity-30 text-yellow-300'
    : 'bg-yellow-100 text-yellow-800';
  const statementColor = darkMode ? 'text-gray-200' : 'text-gray-800';
  const expBoxBg = darkMode
    ? 'bg-yellow-900 bg-opacity-20 border-yellow-800 border-opacity-50 text-gray-200'
    : 'bg-yellow-50 border-yellow-200 text-gray-800';
  const expTitleColor = darkMode ? 'text-yellow-400' : 'text-yellow-800';

  return (
    <div
      className={`${cardBg} rounded-xl shadow-sm border p-4 md:p-6 mb-6 transition-all`}
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className={`${tagBg} text-xs md:text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wider`}
        >
          Prova {question.id !== 'N/A' ? question.id : index + 1}
        </span>
      </div>

      <div
        className={`${statementColor} text-base md:text-lg mb-6 leading-relaxed whitespace-pre-wrap`}
      >
        {formatText(question.statement, darkMode)}
      </div>

      <div className="space-y-3 mb-6">
        {question.options.map((opt) => {
          const isSelected = selectedLetter === opt.letter;

          let btnClass =
            'w-full text-left flex items-start p-3 md:p-4 rounded-lg border transition-colors focus:outline-none ';
          let badgeClass =
            'flex-shrink-0 w-8 h-8 rounded flex items-center justify-center font-bold mr-3 md:mr-4 transition-colors ';

          if (!isAnswered) {
            btnClass += darkMode
              ? 'border-gray-600 bg-gray-800 text-gray-300 hover:border-yellow-500 hover:bg-gray-700 cursor-pointer'
              : 'border-gray-200 bg-white text-gray-700 hover:border-yellow-400 hover:bg-gray-50 cursor-pointer';
            badgeClass += darkMode
              ? 'bg-gray-700 text-gray-400'
              : 'bg-gray-100 text-gray-500';
          } else {
            btnClass += 'cursor-default ';
            if (opt.isCorrect) {
              // Verde clássico
              btnClass += darkMode
                ? 'border-green-500 bg-green-900 bg-opacity-20 text-green-100 ring-1 ring-green-500'
                : 'border-green-500 bg-green-50 text-green-900 ring-1 ring-green-500';
              badgeClass += 'bg-green-500 text-white';
            } else if (isSelected && !opt.isCorrect) {
              // Vermelho clássico
              btnClass += darkMode
                ? 'border-red-500 bg-red-900 bg-opacity-20 text-red-100 ring-1 ring-red-500'
                : 'border-red-500 bg-red-50 text-red-900 ring-1 ring-red-500';
              badgeClass += 'bg-red-500 text-white';
            } else {
              // Opaco
              btnClass += darkMode
                ? 'border-gray-700 bg-gray-800 bg-opacity-50 text-gray-500 opacity-60'
                : 'border-gray-200 bg-gray-50 text-gray-400 opacity-60';
              badgeClass += darkMode
                ? 'bg-gray-800 text-gray-600'
                : 'bg-gray-100 text-gray-400';
            }
          }

          return (
            <button
              key={opt.letter}
              disabled={isAnswered}
              onClick={() => onAnswer(opt.letter)}
              className={btnClass}
            >
              <div className={badgeClass}>{opt.letter}</div>
              <div className="pt-1 flex-1 leading-snug whitespace-pre-wrap text-sm md:text-base">
                {formatText(opt.text, darkMode)}
              </div>
              {isAnswered && opt.isCorrect && (
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-green-500 ml-2 md:ml-3 flex-shrink-0 mt-0.5" />
              )}
              {isAnswered && isSelected && !opt.isCorrect && (
                <XCircle className="w-5 h-5 md:w-6 md:h-6 text-red-500 ml-2 md:ml-3 flex-shrink-0 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {isAnswered && question.explanation && (
        <div
          className={`mt-6 p-4 md:p-5 ${expBoxBg} rounded-xl border leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-top-4 duration-300 text-sm md:text-base`}
        >
          <h4
            className={`font-bold ${expTitleColor} mb-3 flex items-center gap-2 uppercase tracking-wide text-sm`}
          >
            <ScrollText className="w-4 h-4 md:w-5 md:h-5" />A Sabedoria dos
            Filósofos:
          </h4>
          <div className="break-words">
            {formatText(question.explanation, darkMode)}
          </div>
        </div>
      )}
    </div>
  );
};

export default function QuestionBankApp() {
  const [view, setView] = useState(
    () => localStorage.getItem('qb_view') || 'input'
  );
  const [rawText, setRawText] = useState(
    () => localStorage.getItem('qb_rawText') || DEFAULT_TEXT
  );
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('qb_darkmode');
    return saved ? JSON.parse(saved) : false;
  });
  const [parsedData, setParsedData] = useState(() => {
    const saved = localStorage.getItem('qb_parsedData');
    return saved ? JSON.parse(saved) : { questions: [], summary: '' };
  });
  const [userAnswers, setUserAnswers] = useState(() => {
    const saved = localStorage.getItem('qb_answers');
    return saved ? JSON.parse(saved) : {};
  });
  const [showSummary, setShowSummary] = useState(false);

  // Sincroniza cor de fundo global com o modo noturno
  useEffect(() => {
    document.body.style.backgroundColor = darkMode ? '#111827' : '#f9fafb'; // gray-900 : gray-50
    document.body.style.transition = 'background-color 0.3s ease';
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('qb_view', view);
  }, [view]);
  useEffect(() => {
    localStorage.setItem('qb_rawText', rawText);
  }, [rawText]);
  useEffect(() => {
    localStorage.setItem('qb_darkmode', JSON.stringify(darkMode));
  }, [darkMode]);
  useEffect(() => {
    localStorage.setItem('qb_parsedData', JSON.stringify(parsedData));
  }, [parsedData]);
  useEffect(() => {
    localStorage.setItem('qb_answers', JSON.stringify(userAnswers));
  }, [userAnswers]);

  const handleProcess = () => {
    const data = parseData(rawText);
    setParsedData(data);
    setUserAnswers({});
    setShowSummary(false);
    setView('bank');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnswer = (questionId, letter) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: letter,
    }));
  };

  const handleResetAnswers = () => {
    if (
      confirm(
        'Deseja apagar todas as marcações e enfrentar as provações novamente?'
      )
    ) {
      setUserAnswers({});
      setShowSummary(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const allAnswered =
    parsedData.questions.length > 0 &&
    Object.keys(userAnswers).length === parsedData.questions.length;

  // Cores dinâmicas para a casca do app (Tema Ágora) suportadas no Tailwind v2
  const mainBg = darkMode
    ? 'bg-gray-900 text-gray-100'
    : 'bg-gray-50 text-gray-900';
  const headerBg = darkMode
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border-gray-200';
  const titleColor = darkMode ? 'text-yellow-500' : 'text-yellow-700';
  const statsBadge = darkMode
    ? 'bg-gray-700 text-yellow-400 text-opacity-80'
    : 'bg-gray-100 text-yellow-700 text-opacity-80';
  const themeBtn = darkMode
    ? 'text-yellow-400 hover:bg-gray-700'
    : 'text-yellow-600 hover:bg-gray-100';

  const secBtn = darkMode
    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700'
    : 'bg-white border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50';

  const clearBtn = darkMode
    ? 'bg-gray-800 border-red-800 border-opacity-50 text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-20'
    : 'bg-white border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50';

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 ${mainBg}`}
    >
      <header
        className={`${headerBg} border-b sticky top-0 z-10 shadow-sm transition-colors duration-300`}
      >
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-yellow-600 p-1.5 md:p-2 rounded-lg shadow-md">
              <Landmark className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <h1
              className={`font-serif font-bold text-lg md:text-xl tracking-wide ${titleColor}`}
            >
              ÁGORA DO SABER
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {view === 'bank' && (
              <div
                className={`hidden md:block text-sm font-semibold px-3 py-1 rounded-full ${statsBadge}`}
              >
                {parsedData.questions.length} Provações
              </div>
            )}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${themeBtn}`}
              title="Alternar Modo Escuro"
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {view === 'input' && (
          <div className="animate-in fade-in duration-500">
            <div className="mb-6">
              <h2
                className={`text-xl md:text-3xl font-serif font-bold mb-2 ${titleColor}`}
              >
                Oráculo de Questões
              </h2>
              <p
                className={`text-sm md:text-base ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                Deposite aqui os pergaminhos gerados pela IA. O Oráculo irá
                decifrá-los, separar os ensinamentos e{' '}
                <strong>embaralhar as provações</strong>.
              </p>
            </div>

            <div
              className={`${
                darkMode
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              } rounded-xl shadow-sm border overflow-hidden flex flex-col h-[50vh] md:h-[60vh] transition-colors duration-300`}
            >
              <div
                className={`${
                  darkMode
                    ? 'bg-gray-800 bg-opacity-80 border-gray-700 text-gray-400'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                } border-b p-3 flex items-center gap-2 text-xs md:text-sm font-medium`}
              >
                <ScrollText className="w-4 h-4" />
                Pergaminho Bruto (Raw Text)
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className={`w-full flex-1 p-4 md:p-6 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-500 font-mono text-sm leading-relaxed ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
                placeholder="Cole as questões aqui..."
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleProcess}
                disabled={!rawText.trim()}
                className="w-full md:w-auto bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-6 md:px-8 py-3 md:py-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Flame className="w-5 h-5" />
                Consultar o Oráculo
              </button>
            </div>
          </div>
        )}

        {view === 'bank' && (
          <div className="animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 md:mb-8 gap-3 md:gap-4">
              <button
                onClick={() => setView('input')}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 font-medium transition-colors px-4 py-2 border rounded-lg ${secBtn}`}
              >
                <ArrowLeft className="w-4 h-4" />
                Novos Pergaminhos
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div
                  className={`hidden sm:flex text-xs md:text-sm items-center gap-2 px-3 py-2 border rounded-lg ${
                    darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-400'
                      : 'bg-white border-gray-200 text-gray-500'
                  }`}
                >
                  <Settings2 className="w-4 h-4" />
                  Provações Embaralhadas
                </div>
                <button
                  onClick={handleResetAnswers}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 font-medium transition-colors px-4 py-2 border rounded-lg ${clearBtn}`}
                  title="Apagar as suas marcações para refazer as questões"
                >
                  <RotateCcw className="w-4 h-4" />
                  Limpar Respostas
                </button>
              </div>
            </div>

            {parsedData.questions.length === 0 ? (
              <div
                className={`text-center py-16 md:py-20 rounded-xl border border-dashed ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Landmark
                  className={`w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 ${
                    darkMode ? 'text-gray-600' : 'text-gray-300'
                  }`}
                />
                <h3
                  className={`text-base md:text-lg font-serif font-bold ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Nenhum Conhecimento Decifrado
                </h3>
                <p
                  className={`text-sm md:text-base px-4 mt-2 ${
                    darkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}
                >
                  Verifique se os pergaminhos colados seguem o formato correto.
                </p>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                {parsedData.questions.map((q, idx) => {
                  const qId = q.id !== 'N/A' ? q.id : `q_${idx}`;
                  return (
                    <QuestionCard
                      key={idx}
                      question={q}
                      index={idx}
                      selectedLetter={userAnswers[qId]}
                      onAnswer={(letter) => handleAnswer(qId, letter)}
                      darkMode={darkMode}
                    />
                  );
                })}

                {/* Exibição da Conclusão e Botão para Revelar o Resumo */}
                {allAnswered && parsedData.summary && !showSummary && (
                  <div
                    className={`mt-8 md:mt-12 rounded-2xl shadow-xl border p-6 md:p-10 relative overflow-hidden text-center animate-in fade-in zoom-in duration-500 ${
                      darkMode
                        ? 'bg-gray-800 border-yellow-600'
                        : 'bg-white border-yellow-400'
                    }`}
                  >
                    <Award
                      className={`w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 ${
                        darkMode ? 'text-yellow-500' : 'text-yellow-500'
                      }`}
                    />
                    <h3
                      className={`text-2xl md:text-3xl font-serif font-bold mb-3 ${
                        darkMode ? 'text-yellow-400' : 'text-yellow-700'
                      }`}
                    >
                      As Provações Foram Vencidas!
                    </h3>
                    <p
                      className={`text-base md:text-lg mb-8 max-w-2xl mx-auto ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      Você demonstrou a sabedoria de Atena e a determinação de
                      Hércules. O Oráculo está satisfeito com sua jornada e
                      preparou a essência do conhecimento final para você.
                    </p>
                    <button
                      onClick={() => setShowSummary(true)}
                      className="inline-flex items-center gap-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-6 py-4 md:px-8 md:py-4 rounded-xl transition-all shadow-md hover:shadow-lg text-sm md:text-base"
                    >
                      <Flame className="w-5 h-5 md:w-6 md:h-6" />
                      Revelar a Consolidação dos Saberes
                    </button>
                  </div>
                )}

                {/* Bloco de Resumo Revelado */}
                {showSummary && parsedData.summary && (
                  <div
                    className={`mt-8 md:mt-12 rounded-2xl shadow-xl border p-6 md:p-8 relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 ${
                      darkMode
                        ? 'bg-gray-800 border-yellow-600'
                        : 'bg-yellow-100 border-yellow-400'
                    }`}
                  >
                    <div className="absolute top-0 right-0 p-4 md:p-8 opacity-10 pointer-events-none">
                      <Flame
                        className={`w-24 h-24 md:w-32 md:h-32 ${
                          darkMode ? 'text-white' : 'text-yellow-800'
                        }`}
                      />
                    </div>
                    <div className="relative z-10">
                      <div
                        className={`flex items-center gap-2 md:gap-3 mb-4 ${
                          darkMode ? 'text-yellow-400' : 'text-yellow-700'
                        }`}
                      >
                        <Flame className="w-5 h-5 md:w-6 md:h-6" />
                        <h3 className="text-lg md:text-xl font-serif font-bold tracking-wide uppercase">
                          Consolidação do Saberes
                        </h3>
                      </div>
                      <div
                        className={`text-base md:text-lg leading-relaxed whitespace-pre-wrap font-medium ${
                          darkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}
                      >
                        {formatText(parsedData.summary, darkMode)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
