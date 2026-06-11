import { appEnvironment, isPrivate2Environment } from './environment.js';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingFirebaseFields = Object.entries(firebaseConfig)
  .filter(([, value]) => !String(value || '').trim())
  .map(([key]) => key);

if (missingFirebaseFields.length) {
  throw new Error(
    `Ágora 2.0 sem Firebase isolado configurado. Preencha: ${missingFirebaseFields.join(', ')}.`
  );
}

if (isPrivate2Environment && firebaseConfig.projectId === 'agora-do-saber') {
  throw new Error('Proteção da Ágora 2.0: o ambiente privado não pode usar o Firebase de produção.');
}

export { appEnvironment };
export default firebaseConfig;
