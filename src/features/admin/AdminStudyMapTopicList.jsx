import React, { useState } from 'react';

const ic = (d) => ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} dangerouslySetInnerHTML={{__html:d}}/>;
const ChevronDown = ic('<polyline points="6 9 12 15 18 9"/>');

const AdminStudyMapTopicList = ({ subject, darkMode, onOpenTopic, getTopicStudyPlan }) => {
  const [expanded, setExpanded] = useState({});
  const topics = subject?.topics || [];
  const hasAnswer = value => !!value && value !== 'SKIPPED';

  return (
    <div className={`rounded-xl border overflow-hidden ${darkMode?'border-gray-700 bg-gray-900/30':'border-gray-200 bg-white'}`}>
      {topics.map((topic, index) => {
        const plans = getTopicStudyPlan(topic, topic.subtopics || []);
        const planned = plans.reduce((sum, plan) => sum + plan.questions, 0);
        const questions = subject.source === 'academia' ? Object.values(topic.fixationQuestions || {}).flat() : (topic.questions || []);
        const generated = questions.length;
        const answered = questions.filter(question => hasAnswer(topic.answers?.[question.id])).length;
        const isOpen = !!expanded[topic.id];
        const cleanTitle = String(topic.title || `Tópico ${index + 1}`).replace(/^T[óo]pico\s*\d+\s*[:.)-]?\s*/i, '');
        const generationStatus = generated === 0
          ? 'A gerar'
          : generated < planned
            ? `Faltam ${planned - generated}`
            : generated === planned
              ? 'Plano atendido'
              : generated - planned === 1
                ? '1 questão extra'
                : `${generated - planned} questões extras`;
        const statusTone = generated === 0
          ? darkMode ? 'text-gray-400 bg-gray-800' : 'text-gray-500 bg-gray-100'
          : generated < planned
            ? darkMode ? 'text-yellow-300 bg-yellow-900/30' : 'text-yellow-700 bg-yellow-50'
            : darkMode ? 'text-green-300 bg-green-900/30' : 'text-green-700 bg-green-50';
        return (
          <div key={topic.id} className={`border-b last:border-b-0 ${darkMode?'border-gray-800':'border-gray-100'}`}>
            <div className={`flex items-center gap-2 p-2 sm:p-3 transition-colors ${darkMode?'hover:bg-gray-800/50':'hover:bg-gray-50'}`}>
              <button type="button" onClick={()=>onOpenTopic(topic)} className="min-w-0 flex-1 flex items-center gap-3 rounded-lg px-1 py-1 text-left">
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-serif font-bold text-sm ${darkMode?'bg-gray-800 text-yellow-400':'bg-yellow-50 text-yellow-700'}`}>{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-sm sm:text-base truncate">{cleanTitle}</span>
                  <span className="block text-xs opacity-45 mt-0.5 truncate">
                    {plans.length} objetivos · {generated ? `${answered}/${generated} respondidas` : `${planned} questões planejadas`}
                  </span>
                </span>
              </button>
              <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap ${statusTone}`}>{generationStatus}</span>
              <button type="button" onClick={()=>setExpanded(prev=>({...prev,[topic.id]:!isOpen}))} aria-label={isOpen?'Recolher objetivos':'Ver objetivos'} className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode?'hover:bg-gray-800':'hover:bg-gray-100'}`}>
                <ChevronDown className={`w-4 h-4 opacity-45 transition-transform ${isOpen?'rotate-180':''}`}/>
              </button>
            </div>
            {isOpen&&<div className={`border-t px-4 sm:px-14 py-3 space-y-3 ${darkMode?'border-gray-800 bg-gray-950/20':'border-gray-100 bg-gray-50/70'}`}>
              <div className="sm:hidden">
                <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold ${statusTone}`}>{generationStatus}</span>
              </div>
              {plans.map((plan, planIndex)=>(
                <div key={`${topic.id}-${planIndex}`} className="flex items-start gap-2 text-xs">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-yellow-500"/>
                  <div className="min-w-0 flex-1">
                    <p className="leading-relaxed"><strong>{plan.title}</strong> <span className="opacity-40">· {plan.questions} questão{plan.questions===1?'':'ões'}</span></p>
                    <p className="opacity-50 mt-0.5 leading-relaxed">{plan.objective || `Dominar ${plan.title}`}</p>
                  </div>
                </div>
              ))}
            </div>}
          </div>
        );
      })}
    </div>
  );
};
export default AdminStudyMapTopicList;
