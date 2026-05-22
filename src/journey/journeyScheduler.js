export const todayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addCivilDays = (dateKey, days) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const next = new Date(year, month - 1, day);
  next.setDate(next.getDate() + days);
  return todayKey(next);
};

export const isDue = (dueDate, baseDate = todayKey()) => !dueDate || dueDate <= baseDate;

export const scheduleSkillReview = (rating, baseDate = todayKey()) => {
  const intervals = {
    easily: 14,
    yes: 7,
    hard: 3,
    no: 1,
  };
  return addCivilDays(baseDate, intervals[rating] || 3);
};

export const scheduleQuestionReview = ({ correct, quality, missReason }, currentInterval = 0, baseDate = todayKey()) => {
  const previous = Math.max(Number(currentInterval) || 0, 0);
  let nextInterval = 3;

  if (correct) {
    if (quality === 'easy') nextInterval = previous ? Math.round(previous * 2.6) : 21;
    else if (quality === 'normal') nextInterval = previous ? Math.round(previous * 1.9) : 10;
    else if (quality === 'hard') nextInterval = previous ? Math.round(previous * 1.25) : 4;
    else if (quality === 'guessed') nextInterval = 2;
  } else {
    if (quality === 'attention' || quality === 'marked_wrong') nextInterval = 3;
    else if (missReason === 'almost') nextInterval = 2;
    else nextInterval = 1;
  }

  nextInterval = Math.max(1, Math.min(nextInterval, 90));
  return {
    intervalDays: nextInterval,
    dueDate: addCivilDays(baseDate, nextInterval),
  };
};
