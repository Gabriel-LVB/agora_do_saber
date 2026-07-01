const readEnv = (key, fallback = '') => {
  const value = import.meta.env?.[key];
  return value == null || value === '' ? fallback : String(value);
};

export const appEnvironment = readEnv('VITE_APP_ENV', 'production');
export const adminEmail = readEnv('VITE_ADMIN_EMAIL', 'gabrielvieiraxc12@gmail.com').trim().toLowerCase();

export const firebaseConfig = {
  apiKey: readEnv('VITE_FIREBASE_API_KEY', 'AIzaSyDjdoVMrVg7dlIJLr280-thZkjrpFeChL4'),
  authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN', 'agora-do-saber.firebaseapp.com'),
  projectId: readEnv('VITE_FIREBASE_PROJECT_ID', 'agora-do-saber'),
  storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET', 'agora-do-saber.firebasestorage.app'),
  messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '169091563204'),
  appId: readEnv('VITE_FIREBASE_APP_ID', '1:169091563204:web:de924d4507acb1649e9391'),
};
