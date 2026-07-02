import { doc, setDoc } from 'firebase/firestore';

import { cleanFirestoreData } from '../lib/firestoreData.js';
import { db } from './firebase.js';

export const LIBRARY_PROGRESS_COLLECTION = 'library_progress';

export const libraryProgressDocId = (subjectId, topicId) =>
  `${String(subjectId)}__${String(topicId)}`;

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);

export const saveLibraryTopicProgressPatch = async ({
  userId,
  subjectId,
  topicId,
  patch,
  updatedAt = Date.now(),
}) => {
  if (!userId) throw new Error('USER_MISSING');
  if (!subjectId) throw new Error('SUBJECT_MISSING');
  if (!topicId) throw new Error('TOPIC_MISSING');
  await setDoc(
    doc(db, 'users', userId, LIBRARY_PROGRESS_COLLECTION, libraryProgressDocId(subjectId, topicId)),
    cleanFirestoreData({
      subjectId:String(subjectId),
      topicId:String(topicId),
      ...patch,
      updatedAt,
    }),
    { merge:true }
  );
};

export const applyLibraryProgressEntries = (items = [], entries = []) => {
  const progressByKey = new Map(
    entries
      .filter(entry => entry?.subjectId && entry?.topicId)
      .map(entry => [libraryProgressDocId(entry.subjectId, entry.topicId), entry])
  );
  if (!progressByKey.size) return items;

  return items.map(item => {
    if (!Array.isArray(item?.topics)) return item;
    return {
      ...item,
      topics:item.topics.map(topic => {
        const progress = progressByKey.get(libraryProgressDocId(item.id, topic.id));
        if (!progress) return topic;
        return {
          ...topic,
          answers:hasOwn(progress, 'answers') ? (progress.answers || {}) : (topic.answers || {}),
          favorites:Array.isArray(progress.favorites) ? progress.favorites : (topic.favorites || []),
          errorNotebook:Array.isArray(progress.errorNotebook) ? progress.errorNotebook : (topic.errorNotebook || []),
          spacedReview:hasOwn(progress, 'spacedReview') ? (progress.spacedReview || {}) : (topic.spacedReview || {}),
          ...(hasOwn(progress, 'bizuario') ? { bizuario:progress.bizuario || null } : {}),
        };
      }),
    };
  });
};
