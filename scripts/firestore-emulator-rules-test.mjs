import { readFile } from 'node:fs/promises';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  collection,
} from 'firebase/firestore';

const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'demo-agora-rules';
const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');

const testEnv = await initializeTestEnvironment({
  projectId,
  firestore:{ rules },
});

try {
  await testEnv.clearFirestore();

  const anonDb = testEnv.unauthenticatedContext().firestore();
  const studentDb = testEnv.authenticatedContext('student_uid', {
    email:'aluno@example.com',
  }).firestore();
  const otherStudentDb = testEnv.authenticatedContext('other_uid', {
    email:'outro@example.com',
  }).firestore();
  const adminDb = testEnv.authenticatedContext('admin_uid', {
    email:'gabrielvieiraxc12@gmail.com',
    admin:true,
  }).firestore();

  await assertFails(getDoc(doc(anonDb, 'users', 'student_uid')));
  await assertSucceeds(setDoc(doc(studentDb, 'users', 'student_uid'), { username:'ALUNO' }));
  await assertFails(setDoc(doc(studentDb, 'users', 'other_uid'), { username:'INVASOR' }));
  await assertSucceeds(getDoc(doc(adminDb, 'users', 'student_uid')));

  await assertSucceeds(setDoc(doc(studentDb, 'users', 'student_uid', 'library', 'subject_1'), {
    title:'Cardiologia',
    source:'gemini',
  }));
  await assertSucceeds(setDoc(doc(studentDb, 'users', 'student_uid', 'library_progress', 'subject_1__topic_1'), {
    subjectId:'subject_1',
    topicId:'topic_1',
    answers:{ q1:'A' },
    favorites:['q1'],
  }));
  await assertFails(getDoc(doc(otherStudentDb, 'users', 'student_uid', 'library', 'subject_1')));
  await assertFails(getDoc(doc(otherStudentDb, 'users', 'student_uid', 'library_progress', 'subject_1__topic_1')));
  await assertSucceeds(getDoc(doc(adminDb, 'users', 'student_uid', 'library', 'subject_1')));
  await assertSucceeds(getDoc(doc(adminDb, 'users', 'student_uid', 'library_progress', 'subject_1__topic_1')));

  await assertFails(setDoc(doc(studentDb, 'shared_library', 'aula_1'), { title:'Aula' }));
  await assertSucceeds(setDoc(doc(adminDb, 'shared_library', 'aula_1'), { title:'Aula', published:true }));
  await assertSucceeds(setDoc(doc(adminDb, 'shared_library', 'rascunho_1'), { title:'Rascunho', published:false }));
  await assertSucceeds(getDoc(doc(studentDb, 'shared_library', 'aula_1')));
  await assertFails(getDoc(doc(studentDb, 'shared_library', 'rascunho_1')));
  await assertSucceeds(getDocs(query(collection(studentDb, 'shared_library'), where('published', '==', true))));
  await assertSucceeds(getDoc(doc(adminDb, 'shared_library', 'aula_1')));

  await assertSucceeds(getDoc(doc(studentDb, 'config', 'site_ui')));
  await assertFails(setDoc(doc(studentDb, 'config', 'site_ui'), { homeMotto:'x' }));
  await assertSucceeds(setDoc(doc(adminDb, 'config', 'site_ui'), { homeMotto:'x' }));

  await assertSucceeds(setDoc(doc(studentDb, 'access_logs', 'student_log'), { uid:'student_uid' }));
  await assertFails(setDoc(doc(studentDb, 'access_logs', 'other_log'), { uid:'other_uid' }));
  await assertSucceeds(getDoc(doc(adminDb, 'access_logs', 'student_log')));

  await assertFails(getDoc(doc(studentDb, 'unknown_collection', 'doc')));
  await assertFails(setDoc(doc(studentDb, 'unknown_collection', 'doc'), { ok:true }));
} finally {
  await testEnv.cleanup();
}

console.log('firestore-emulator-rules-test ok');
