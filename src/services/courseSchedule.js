const DEFAULT_LESSON_EFFORT_SECONDS = 45 * 60;

const normalizeScheduleKey = (value = '') => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

const positiveNumber = value => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

const median = values => {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

const localDateKey = date => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');

const isoWeekday = date => date.getDay() === 0 ? 7 : date.getDay();

const parseScheduleDate = (value, fallback = null) => {
  const parsed = value instanceof Date
    ? new Date(value.getTime())
    : value ? new Date(`${value}T12:00:00`) : null;
  if (parsed && Number.isFinite(parsed.getTime())) {
    parsed.setHours(12, 0, 0, 0);
    return parsed;
  }
  if (!(fallback instanceof Date) || !Number.isFinite(fallback.getTime())) return null;
  const safeFallback = new Date(fallback.getTime());
  safeFallback.setHours(12, 0, 0, 0);
  return safeFallback;
};

const addCalendarDays = (date, days) => {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
};

const calendarDayNumber = date => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;

const clampScheduleWeeks = value => Math.max(1, Math.min(104, Math.ceil(positiveNumber(value) || 1)));

export const calculateScheduleEffort = (lessons = []) => {
  const knownDurations = lessons
    .map(lesson => positiveNumber(lesson?.durationSeconds || lesson?.aula?.duration_seconds))
    .filter(Boolean);
  const fallbackSeconds = Math.max(15 * 60, median(knownDurations) || DEFAULT_LESSON_EFFORT_SECONDS);
  const weightedLessons = lessons.map(lesson => {
    const knownDurationSeconds = positiveNumber(lesson?.durationSeconds || lesson?.aula?.duration_seconds);
    return {
      effortSeconds:knownDurationSeconds || fallbackSeconds,
      estimated:!knownDurationSeconds,
      knownDurationSeconds,
      lesson,
    };
  });
  return {
    fallbackSeconds,
    totalEffortSeconds:weightedLessons.reduce((sum, item) => sum + item.effortSeconds, 0),
    weightedLessons,
  };
};

export const resolveScheduleWeeksCount = ({
  cadence = 'weekly',
  effortHours = 0,
  endDate = '',
  fallbackWeeks = 1,
  goalMode = 'weeks',
  startDate = null,
  studyDays = [1,2,3,4,5],
  today = new Date(),
  totalEffortSeconds = 0,
} = {}) => {
  const cleanFallbackWeeks = clampScheduleWeeks(fallbackWeeks);
  if (goalMode === 'effort') {
    const cleanEffortHours = positiveNumber(effortHours);
    if (!cleanEffortHours || !positiveNumber(totalEffortSeconds)) return cleanFallbackWeeks;
    const activeDays = cadence === 'daily' ? normalizeScheduleStudyDays(studyDays).length : 1;
    const weeklyCapacitySeconds = cleanEffortHours * activeDays * 3600;
    return clampScheduleWeeks(totalEffortSeconds / weeklyCapacitySeconds);
  }
  if (goalMode === 'date') {
    const fallbackToday = parseScheduleDate(today, new Date());
    const baseDate = parseScheduleDate(startDate, fallbackToday);
    const targetDate = parseScheduleDate(endDate);
    if (!baseDate || !targetDate || targetDate.getTime() < baseDate.getTime()) return cleanFallbackWeeks;
    const inclusiveDays = calendarDayNumber(targetDate) - calendarDayNumber(baseDate) + 1;
    return clampScheduleWeeks(inclusiveDays / 7);
  }
  return cleanFallbackWeeks;
};

export const resolveScheduleSubjectOrder = ({
  availableSubjects = [],
  preferredSubjects = [],
  lessonCounts = {},
  orderBy = '',
} = {}) => {
  const availableByKey = new Map();
  availableSubjects.forEach(subject => {
    const key = normalizeScheduleKey(subject);
    if (key && !availableByKey.has(key)) availableByKey.set(key, subject);
  });
  const available = [...availableByKey.values()];
  if (orderBy === 'lesson-count-asc' || orderBy === 'lesson-count-desc') {
    const countByKey = new Map(Object.entries(lessonCounts || {})
      .map(([subject, count]) => [normalizeScheduleKey(subject), positiveNumber(count)]));
    const direction = orderBy === 'lesson-count-asc' ? 1 : -1;
    return available
      .map((subject, index) => ({ subject, index, count:countByKey.get(normalizeScheduleKey(subject)) || 0 }))
      .sort((left, right) => direction * (left.count - right.count) || left.index - right.index)
      .map(item => item.subject);
  }

  const seen = new Set();
  const ordered = [];
  preferredSubjects.forEach(preferred => {
    const key = normalizeScheduleKey(preferred);
    const subject = availableByKey.get(key);
    if (!subject || seen.has(key)) return;
    seen.add(key);
    ordered.push(subject);
  });
  available.forEach(subject => {
    const key = normalizeScheduleKey(subject);
    if (seen.has(key)) return;
    seen.add(key);
    ordered.push(subject);
  });
  return ordered;
};

export const interleaveScheduleSubjectBatches = ({
  orderedSubjects = [],
  lessonsBySubject = new Map(),
  batchSize = 1,
} = {}) => {
  const cleanBatchSize = Math.max(1, Math.floor(positiveNumber(batchSize) || 1));
  const result = [];
  for (let start = 0; start < orderedSubjects.length; start += cleanBatchSize) {
    const queues = orderedSubjects.slice(start, start + cleanBatchSize)
      .map(subject => lessonsBySubject.get(subject) || [])
      .filter(queue => queue.length);
    const longestQueue = queues.reduce((highest, queue) => Math.max(highest, queue.length), 0);
    for (let lessonIndex = 0; lessonIndex < longestQueue; lessonIndex += 1) {
      queues.forEach(queue => {
        if (queue[lessonIndex]) result.push(queue[lessonIndex]);
      });
    }
  }
  return result;
};

export const interleaveLongitudinalScheduleLessons = (primaryLessons = [], longitudinalLessons = []) => {
  if (!longitudinalLessons.length) return [...primaryLessons];
  if (!primaryLessons.length) return [...longitudinalLessons];
  return [
    ...primaryLessons.map((lesson, index) => ({
      index,
      lesson,
      position:(index + 1) / (primaryLessons.length + 1),
      type:1,
    })),
    ...longitudinalLessons.map((lesson, index) => ({
      index,
      lesson,
      position:(index + 1) / (longitudinalLessons.length + 1),
      type:0,
    })),
  ]
    .sort((left, right) => left.position - right.position || left.type - right.type || left.index - right.index)
    .map(item => item.lesson);
};

export const normalizeScheduleStudyDays = (studyDays = [], fallback = [1,2,3,4,5]) => {
  const normalized = [...new Set((studyDays || []).map(Number).filter(day => day >= 1 && day <= 7))]
    .sort((left, right) => left - right);
  return normalized.length ? normalized : [...fallback];
};

export const buildScheduleDaySlots = ({
  endDate = null,
  startDate = null,
  studyDays = [1,2,3,4,5],
  today = new Date(),
  weeksCount = 1,
} = {}) => {
  const cleanWeeksCount = Math.max(1, Math.floor(positiveNumber(weeksCount) || 1));
  const fallbackToday = parseScheduleDate(today, new Date());
  const baseDate = parseScheduleDate(startDate, fallbackToday);
  const requestedEndDate = parseScheduleDate(endDate);
  const maximumEndDate = addCalendarDays(baseDate, cleanWeeksCount * 7 - 1);
  const boundedEndDate = requestedEndDate && requestedEndDate.getTime() >= baseDate.getTime()
    ? new Date(Math.min(requestedEndDate.getTime(), maximumEndDate.getTime()))
    : maximumEndDate;
  const totalCalendarDays = calendarDayNumber(boundedEndDate) - calendarDayNumber(baseDate) + 1;
  const allowedDays = new Set(normalizeScheduleStudyDays(studyDays));
  const days = [];
  const slots = [];
  for (let offset = 0; offset < totalCalendarDays; offset += 1) {
    const date = addCalendarDays(baseDate, offset);
    const weekday = isoWeekday(date);
    const calendarDay = {
      date,
      dateKey:localDateKey(date),
      week:Math.floor(offset / 7) + 1,
      weekday,
    };
    days.push(calendarDay);
    if (!allowedDays.has(weekday)) continue;
    calendarDay.planDay = slots.length + 1;
    slots.push(calendarDay);
  }
  return {
    days,
    endDate:boundedEndDate,
    slots,
    startDate:baseDate,
  };
};

export const buildDailyEffortSchedule = ({
  endDate = null,
  lessons = [],
  startDate = null,
  studyDays = [1,2,3,4,5],
  today = new Date(),
  weeksCount = 1,
} = {}) => {
  const calendar = buildScheduleDaySlots({ endDate, startDate, studyDays, today, weeksCount });
  const balanced = buildEffortBalancedSchedule({ lessons, weeksCount:calendar.slots.length || 1 });
  const days = calendar.days.map(day => !day.planDay ? {
    ...day,
    lessons:[],
  } : {
    ...balanced.weeks[day.planDay - 1],
    ...day,
  });
  return {
    ...calendar,
    fallbackSeconds:balanced.fallbackSeconds,
    totalEffortSeconds:balanced.totalEffortSeconds,
    days,
  };
};

export const buildEffortBalancedSchedule = ({ lessons = [], weeksCount = 1 } = {}) => {
  const cleanWeeksCount = Math.max(1, Math.floor(positiveNumber(weeksCount) || 1));
  const { fallbackSeconds, totalEffortSeconds, weightedLessons } = calculateScheduleEffort(lessons);
  const activeWeeksCount = Math.min(cleanWeeksCount, Math.max(1, weightedLessons.length));
  const result = [];
  let cursor = 0;
  let assignedEffortSeconds = 0;

  for (let weekIndex = 0; weekIndex < cleanWeeksCount; weekIndex += 1) {
    const remainingActiveWeeks = Math.max(1, activeWeeksCount - weekIndex);
    const remainingEffort = Math.max(0, totalEffortSeconds - assignedEffortSeconds);
    const targetEffort = remainingEffort / remainingActiveWeeks;
    const weekItems = [];
    let weekEffortSeconds = 0;

    if (weekIndex < activeWeeksCount) {
      while (cursor < weightedLessons.length) {
        const item = weightedLessons[cursor];
        const lessonsAfterCandidate = weightedLessons.length - cursor - 1;
        const weeksAfterThis = activeWeeksCount - weekIndex - 1;
        const canLeaveOnePerWeek = lessonsAfterCandidate >= weeksAfterThis;
        const currentDifference = Math.abs(targetEffort - weekEffortSeconds);
        const candidateDifference = Math.abs(targetEffort - (weekEffortSeconds + item.effortSeconds));
        if (weekItems.length && canLeaveOnePerWeek && candidateDifference > currentDifference) break;
        weekItems.push(item);
        weekEffortSeconds += item.effortSeconds;
        cursor += 1;
        if (lessonsAfterCandidate === weeksAfterThis) break;
      }
    }

    assignedEffortSeconds += weekEffortSeconds;
    result.push({
      effortSeconds:weekEffortSeconds,
      estimatedLessons:weekItems.filter(item => item.estimated).length,
      knownDurationSeconds:weekItems.reduce((sum, item) => sum + item.knownDurationSeconds, 0),
      lessons:weekItems.map(item => item.lesson),
      week:weekIndex + 1,
    });
  }

  return {
    fallbackSeconds,
    totalEffortSeconds,
    weeks:result,
  };
};
