import React from 'react';

export const cx = (...classes) => classes.filter(Boolean).join(' ');

export const IconButton = ({ label, className='', children, ...props }) => (
  <button
    type="button"
    aria-label={label}
    title={props.title || label}
    className={cx('inline-flex items-center justify-center transition-all', className)}
    {...props}
  >
    {children}
  </button>
);

export const InlineSpinner = ({ className='w-4 h-4' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ animation:'spin 1s linear infinite', transformOrigin:'center' }}
  >
    <style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

export const FormLabel = ({ icon, children, className='' }) => (
  <label className={cx('block text-xs font-bold uppercase mb-3 opacity-50 flex items-center gap-2', className)}>
    {icon}
    {children}
  </label>
);
