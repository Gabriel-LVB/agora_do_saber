import { JOURNEY_CURRICULUM_VERSION } from './journeyCurriculum.js';
import { todayKey } from './journeyScheduler.js';

const STORAGE_KEY = 'agora.heroJourney.simple.v1';

export const createInitialJourneyState = () => ({
  version: JOURNEY_CURRICULUM_VERSION,
  started: false,
  activeTab: 'home',
  currentTopicIndex: 0,
  selectedAreaId: null,
  selectedTopicKey: null,
  selectedQuestionId: null,
  generatedTopics: {},
  masterQuestions: {},
  skillReviews: [],
  questionReviews: [],
  questionAttempts: {},
  completedQuestionIds: [],
  completedTopicKeys: [],
  streak: {
    lastStudyDate: null,
    current: 0,
    best: 0,
  },
  logs: [],
});

export const readJourneyState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialJourneyState();
    const parsed = JSON.parse(raw);
    if (parsed?.version !== JOURNEY_CURRICULUM_VERSION) return createInitialJourneyState();
    return {
      ...createInitialJourneyState(),
      ...parsed,
      streak: { ...createInitialJourneyState().streak, ...(parsed.streak || {}) },
    };
  } catch {
    return createInitialJourneyState();
  }
};

export const writeJourneyState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const makeTopicKey = ({ areaId, topic }) => `${areaId}::${topic}`;

export const appendLog = (state, message) => ({
  ...state,
  logs: [
    { id: `${Date.now()}-${Math.random()}`, at: new Date().toISOString(), message },
    ...(state.logs || []),
  ].slice(0, 40),
});

export const touchStreak = (state, date = todayKey()) => {
  const last = state.streak?.lastStudyDate;
  let current = state.streak?.current || 0;
  if (last !== date) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    current = last === todayKey(yesterday) ? current + 1 : 1;
  }
  return {
    ...state,
    streak: {
      lastStudyDate: date,
      current,
      best: Math.max(state.streak?.best || 0, current),
    },
  };
};
