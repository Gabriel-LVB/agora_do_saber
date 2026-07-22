import React, { useState } from 'react';

const cleanSyllabusLine = (line = '') => line
  .replace(/\*\*/g, '')
  .replace(/^\s*[-*•]\s*/, '')
  .replace(/^\s*\d+[\).:-]\s*/, '')
  .replace(/\s+/g, ' ')
  .trim();

const cleanSyllabusSubtopic = (line = '') => cleanSyllabusLine(line)
  .replace(/^(subt[óo]pico|objetivo)\s*\d*\s*[:.)-]?\s*/i, '')
  .trim();

const getSyllabusTopicTitle = (line = '') => {
  const clean = cleanSyllabusLine(line);
  return clean.match(/^(?:#{1,6}\s*)?T[óo]pico\s*\d{0,3}\s*[:.)\-–—]?\s*(.+)$/i)?.[1]?.trim() || '';
};

const parseSyllabusTopics = (syllabusText = '') => {
  const topics = [];
  let current = null;
  const pushCurrent = () => {
    if (current?.subtopics?.length) topics.push(current);
    current = null;
  };

  String(syllabusText || '').split('\n').forEach(rawLine => {
    const clean = cleanSyllabusLine(rawLine);
    if (!clean) return;
    const topicTitle = getSyllabusTopicTitle(clean);
    if (topicTitle) {
      pushCurrent();
      current = { title:topicTitle, subtopics:[] };
      return;
    }
    const subtopic = cleanSyllabusSubtopic(clean);
    if (!subtopic) return;
    if (!current) current = { title:`Tópico ${topics.length + 1}`, subtopics:[] };
    current.subtopics.push(subtopic);
  });
  pushCurrent();

  return topics.map((topic, index) => ({
    title:/^T[óo]pico\s*\d+/i.test(topic.title) ? topic.title : `Tópico ${index + 1}: ${topic.title}`,
    subtopics:[...new Set(topic.subtopics)],
  }));
};

const parseStudyMapSubtopic = (raw = '') => {
  const text = String(raw).replace(/^\s*\|?/, '').replace(/\|?\s*$/, '').replace(/\s*\|\s*/g, ' ');
  const questions = Math.max(1, Math.min(30, Number(text.match(/\[Q:(\d+)\]/i)?.[1]) || 1));
  const objective = String(text.match(/\[OBJ:([^\]]+)\]/i)?.[1] || '').trim();
  const title = cleanSyllabusSubtopic(text.replace(/\[(?:Q|P|OBJ):[^\]]+\]\s*/gi, '').replace(/^(?:subt[óo]pico|objetivo)\s*:?\s*/i, '').trim());
  return { title, questions, objective };
};

const parseStudyMapSyllabus = (syllabusText = '') => {
  const parsed = parseSyllabusTopics(syllabusText).map(topic => ({
    title:topic.title,
    subtopics:(topic.subtopics || []).map(parseStudyMapSubtopic).filter(subtopic => subtopic.title),
  })).filter(topic => topic.subtopics.length);
  if (parsed.length) return parsed;

  const topics = [];
  let current = null;
  const pushCurrent = () => {
    if (current?.subtopics?.length) topics.push(current);
    current = null;
  };

  String(syllabusText || '').split('\n').forEach(rawLine => {
    const clean = cleanSyllabusLine(rawLine).replace(/^\|+|\|+$/g, '').trim();
    if (!clean || /^\|?\s*:?-{3,}/.test(clean)) return;
    if (/\[Q:\s*\d+\]/i.test(clean)) {
      const subtopic = parseStudyMapSubtopic(clean);
      if (!subtopic.title) return;
      if (!current) current = {title:`Tópico ${topics.length + 1}: Objetivos de estudo`, subtopics:[]};
      current.subtopics.push(subtopic);
      return;
    }
    const explicitTitle = getSyllabusTopicTitle(clean);
    const flexibleTitle = clean.match(/^(?:#{1,6}\s*)?(?:Eixo|Trilha|N[úu]cleo|Tema)\s*\d{0,3}\s*[:.)\-–—]?\s*(.+)$/i)?.[1];
    if (explicitTitle || flexibleTitle) {
      pushCurrent();
      current = {title:`Tópico ${topics.length + 1}: ${explicitTitle || flexibleTitle}`, subtopics:[]};
    }
  });
  pushCurrent();
  return topics;
};

const formatStudyMapSyllabus = (topics = []) => topics.map((topic, topicIndex) => {
  const cleanTitle = topic.title.replace(/^T[óo]pico\s*\d+\s*[:.)-]?\s*/i, '').trim();
  return `Tópico ${topicIndex + 1}: ${cleanTitle || topic.title}\n${topic.subtopics.map(subtopic =>
    `  - [Q:${Math.max(1, Math.min(30, Number(subtopic.questions) || 1))}] [OBJ:${subtopic.objective || `Dominar ${subtopic.title}`}] ${subtopic.title}`
  ).join('\n')}`;
}).join('\n\n');

const ChevronDown = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

export default function StudyMapPreview({ syllabus, onChange, darkMode }) {
  const topics = parseStudyMapSyllabus(syllabus);
  const [expanded, setExpanded] = useState({});
  const totalSubtopics = topics.reduce((sum, topic) => sum + topic.subtopics.length, 0);
  const totalQuestions = topics.reduce((sum, topic) => sum + topic.subtopics.reduce((acc, subtopic) => acc + subtopic.questions, 0), 0);

  if (!topics.length) {
    return (
      <div className={`rounded-xl border overflow-hidden ${darkMode?'border-red-900/60 bg-gray-900/40':'border-red-200 bg-white'}`}>
        <div className={`px-5 py-4 border-b ${darkMode?'border-red-900/60 bg-red-950/20':'border-red-200 bg-red-50'}`}>
          <p className="font-bold text-red-500">O plano não conseguiu organizar esta resposta</p>
          <p className="text-xs opacity-60 mt-1">A resposta original foi preservada abaixo. Solicite uma revisão ou volte e gere novamente.</p>
        </div>
        <pre className={`max-h-[52vh] overflow-auto whitespace-pre-wrap p-5 text-xs ${darkMode?'text-gray-300':'text-gray-700'}`}>{syllabus || 'O Gemini devolveu uma resposta vazia.'}</pre>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border overflow-hidden ${darkMode?'border-gray-700 bg-gray-900/40':'border-gray-200 bg-white'}`}>
      <div className={`px-5 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${darkMode?'border-gray-700 bg-gray-900':'border-gray-200 bg-gray-50'}`}>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-600">Sumário completo</p>
          <p className="text-sm opacity-60 mt-1">{topics.length} tópicos · {totalSubtopics} objetivos · {totalQuestions} questões planejadas</p>
        </div>
      </div>
      <div className={`px-5 py-3 border-b text-xs leading-relaxed ${darkMode?'border-gray-700 bg-gray-900/50':'border-gray-200 bg-yellow-50/40'}`}>
        <p className="opacity-60">A IA dividiu o assunto em objetivos verificáveis e planejou questões suficientes para revisar cada um.</p>
      </div>
      <div className="max-h-[52vh] overflow-y-auto">
        {topics.map((topic, topicIndex) => {
          const isOpen = expanded[topicIndex] ?? topicIndex === 0;
          const topicQuestions = topic.subtopics.reduce((sum, subtopic) => sum + subtopic.questions, 0);
          return (
            <section key={`${topic.title}-${topicIndex}`} className={`border-b last:border-b-0 ${darkMode?'border-gray-700':'border-gray-100'}`}>
              <button type="button" onClick={()=>setExpanded(prev=>({...prev,[topicIndex]:!isOpen}))}
                className={`w-full px-5 py-4 flex items-center gap-4 text-left ${darkMode?'hover:bg-gray-800':'hover:bg-yellow-50/50'}`}>
                <span className="w-8 h-8 flex-shrink-0 rounded-lg bg-yellow-600 text-white flex items-center justify-center font-serif font-bold">{topicIndex + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold truncate">{topic.title.replace(/^T[óo]pico\s*\d+\s*[:.)-]?\s*/i, '')}</span>
                  <span className="block text-xs opacity-50 mt-0.5">{topic.subtopics.length} objetivos · {topicQuestions} questões</span>
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen?'rotate-180':''}`}/>
              </button>
              {isOpen&&<div className="px-5 pb-5 space-y-2">
                {topic.subtopics.map((subtopic, subtopicIndex)=>(
                  <div key={`${subtopic.title}-${subtopicIndex}`} className={`border-l-2 pl-4 py-2 ${darkMode?'border-gray-600':'border-yellow-400'}`}>
                    <div className="min-w-0">
                      <p className="font-bold text-sm">{subtopic.title}</p>
                      <p className="text-xs opacity-55 mt-1 leading-relaxed">{subtopic.objective || `Dominar ${subtopic.title}`}</p>
                    </div>
                  </div>
                ))}
              </div>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
