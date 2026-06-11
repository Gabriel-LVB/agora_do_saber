import fs from 'node:fs';
import process from 'node:process';

const fail = message => {
  console.error(`PRE-FLIGHT FALHOU: ${message}`);
  process.exitCode = 1;
};

const appSource = fs.readFileSync('src/App.jsx', 'utf8');
const firebaseSource = fs.readFileSync('src/config/firebase.js', 'utf8');
const envExample = fs.readFileSync('.env.example', 'utf8');

if (appSource.includes('projectId: "agora-do-saber"')) {
  fail('App.jsx voltou a conter as credenciais Firebase da produção.');
}

if (!firebaseSource.includes("firebaseConfig.projectId === 'agora-do-saber'")) {
  fail('A proteção contra Firebase de produção foi removida.');
}

[
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_APP_ENV',
].forEach(key => {
  if (!envExample.includes(`${key}=`)) fail(`Variável obrigatória ausente do .env.example: ${key}`);
});

if (!process.exitCode) console.log('Pre-flight Ágora 2.0 aprovado.');
