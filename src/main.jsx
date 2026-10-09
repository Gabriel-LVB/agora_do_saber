import React from 'react';
import ReactDOM from 'react-dom';
import 'tailwindcss/tailwind.css';

import App from './App';

if (import.meta.env.PROD) {
  import('@vercel/analytics').then(({ inject }) => inject());
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
