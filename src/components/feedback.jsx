import React from 'react';
import { IconButton, InlineSpinner } from './ui.jsx';

const CheckCircleIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const InfoIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const AlertIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const ChevronUpIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);

export const ToastContainer = ({ toasts, onRemove }) => {
  if (!toasts.length) return null;
  const icons = {
    loading: <InlineSpinner className="w-4 h-4 text-yellow-400 flex-shrink-0"/>,
    success: <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0"/>,
    error: <AlertIcon className="w-4 h-4 text-red-400 flex-shrink-0"/>,
    info: <InfoIcon className="w-4 h-4 text-blue-400 flex-shrink-0"/>,
  };
  return (
    <React.Fragment>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div
        className="fixed bottom-4 right-4 sm:bottom-auto sm:top-20 z-[500] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)]"
        role="status"
        aria-live="polite"
      >
        {toasts.map(t => (
          <div key={t.id}
            onClick={t.onClick || (() => onRemove(t.id))}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl border cursor-pointer select-none transition-all
              ${t.type==='success' ? 'bg-gray-900 border-green-700/50' :
                t.type==='error'   ? 'bg-gray-900 border-red-700/50' :
                t.type==='loading' ? 'bg-gray-900 border-yellow-700/40' :
                                     'bg-gray-900 border-gray-700'}`}
            style={{animation:'slideUp 0.25s ease both'}}>
            {icons[t.type]||icons.info}
            <p className="text-sm font-medium text-gray-100 flex-1 leading-snug">{t.msg}</p>
            {t.type!=='loading'&&(
              <IconButton
                label="Fechar aviso"
                onClick={e=>{e.stopPropagation();onRemove(t.id);}}
                className="text-gray-500 hover:text-gray-300 text-lg leading-none flex-shrink-0"
              >
                x
              </IconButton>
            )}
          </div>
        ))}
      </div>
    </React.Fragment>
  );
};

export const BackToTopButton = ({ darkMode }) => (
  <IconButton
    label="Voltar ao topo"
    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    className={`fixed bottom-5 right-5 z-30 h-11 w-11 rounded-full border shadow-lg flex items-center justify-center transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${darkMode?'bg-gray-800 border-gray-700 text-yellow-400 hover:bg-gray-700':'bg-white border-gray-200 text-yellow-700 hover:bg-yellow-50'}`}
  >
    <ChevronUpIcon className="w-5 h-5"/>
  </IconButton>
);

export const EmptyState = ({ icon, title, message, action, darkMode }) => (
  <div className={`empty-state rounded-2xl border border-dashed px-5 py-12 text-center ${darkMode?'border-gray-700 bg-gray-900/60':'border-gray-200 bg-white/80'}`}>
    <div className={`mx-auto mb-4 h-14 w-14 rounded-2xl flex items-center justify-center ${darkMode?'bg-gray-800 text-yellow-400':'bg-yellow-50 text-yellow-700'}`}>
      {icon}
    </div>
    <p className={`font-serif font-bold text-lg ${darkMode?'text-gray-100':'text-gray-900'}`}>{title}</p>
    {message&&<p className={`text-sm mt-2 max-w-sm mx-auto leading-relaxed ${darkMode?'text-gray-400':'text-gray-500'}`}>{message}</p>}
    {action&&<div className="mt-6">{action}</div>}
  </div>
);

export const LoadingState = ({ label='Carregando...', darkMode }) => (
  <div className={`rounded-2xl border p-5 ${darkMode?'bg-gray-900 border-gray-800':'bg-white border-gray-200'}`} role="status" aria-live="polite">
    <div className="flex items-center gap-3 mb-5">
      <InlineSpinner className="w-5 h-5 text-yellow-600"/>
      <span className={`text-sm font-bold ${darkMode?'text-gray-300':'text-gray-700'}`}>{label}</span>
    </div>
    <div className="space-y-3">
      {[0,1,2].map(i => <div key={i} className="skeleton-line rounded-xl" style={{width:`${92 - i * 13}%`}}/>)}
    </div>
  </div>
);
