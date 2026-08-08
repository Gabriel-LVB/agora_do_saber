import { useMemo } from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';
import {
  buildDailyEffortSchedule,
  buildEffortBalancedSchedule,
  calculateScheduleEffort,
  interleaveLongitudinalScheduleLessons,
  interleaveScheduleSubjectBatches,
  resolveScheduleWeeksCount,
  resolveScheduleSubjectOrder,
} from '../../services/courseSchedule.js';
import { buildClinicalPrioritySchedule } from '../../services/courseClinicalPriority.js';

const scheduleDateKey = date => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');

const lessonSearchText = (lesson, normalizeTextKey) => normalizeTextKey([
  lesson.subject,
  lesson.topic,
  lesson.topicTitle,
  lesson.title,
  lesson.aula?.ai_catalog?.description,
].filter(Boolean).join(' '));

const patternRank = (text, rules, fallback = rules.length) => {
  const hit = rules.findIndex(pattern => pattern.test(text));
  return hit >= 0 ? hit : fallback;
};

// O nome do hook foi preservado para compatibilidade com as telas lazy. Desde a
// unificação de 2026, ele representa a jornada do cronograma, não um ciclo
// paralelo de pares/ímpares.
export const useCourseHeroJourney = ({ enabled = true } = {}) => {
  const {
    appliedVideoaulasData,
    aulaDocId,
    aulaVqKey,
    COURSE_SCHEDULE_DEFAULT_SUBJECT_BATCH_SIZE,
    COURSE_SCHEDULE_DEFAULT_WEEKS,
    COURSE_SCHEDULE_MAX_SUBJECT_BATCH_SIZE,
    COURSE_SCHEDULE_MIX_PRESETS,
    coursePlanSubjects,
    coursePrefsLoaded,
    courseScheduleCadence,
    courseScheduleDayCursor,
    courseScheduleEffortHours,
    courseScheduleEndDate,
    courseScheduleGoalMode,
    courseScheduleMixPreset,
    courseScheduleSubjectBatchSize,
    courseScheduleStudyDays,
    courseScheduleWeeks,
    cronStartDate,
    curWeek,
    effectiveCoursePlanLessonOrder,
    flattenCourseLessons,
    getAulaId,
    normalizeTextKey,
    setActiveAulaAndReset,
    setActiveSubjectVid,
    setActiveSubtopicVid,
    setView,
    sortCourseSubjectsForDisplay,
    watchedAulas,
  } = useFeatureContext();

  return useMemo(() => {
    const empty = {
      courseLessons:[],
      currentWeekData:null,
      backlogLessons:[],
      currentWeekRemaining:[],
      dailyScheduleActive:false,
      heroJourneyStep:null,
      isReady:false,
      lessonsPerWeekLabel:'0',
      lessonsPerDayLabel:'0',
      mixedScheduleActive:false,
      nearbyWeeks:[],
      nextScheduleLesson:null,
      orderedLessons:[],
      orderedSubjects:[],
      progress:{ completed:0, pct:0, total:0 },
      nextLessonStatus:'none',
      nextLessonWeek:null,
      plannedWeeklySeconds:0,
      plannedDailySeconds:0,
      scheduleCurrentDay:null,
      scheduleDays:[],
      scheduleCurrentWeek:1,
      scheduleEndDate:null,
      scheduleHasStarted:false,
      scheduleWeeks:[],
      selectedWeek:1,
      selectedWeekData:null,
      selectedDayData:null,
      subjectBatchSize:1,
      totalEffortSeconds:0,
      weeksCount:1,
    };
    if (!enabled || !appliedVideoaulasData || !coursePrefsLoaded) return empty;

    const courseLessons = flattenCourseLessons(appliedVideoaulasData || {});
    if (!courseLessons.length) return { ...empty, isReady:true };
    const courseSubjects = sortCourseSubjectsForDisplay([...new Set(courseLessons.map(lesson => lesson.subject))]);
    const subjectByKey = new Map(courseSubjects.map(subject => [normalizeTextKey(subject), subject]));
    const savedSubjects = (coursePlanSubjects || [])
      .map(subject => subjectByKey.get(normalizeTextKey(subject)))
      .filter(Boolean);
    const orderedSubjects = resolveScheduleSubjectOrder({
      availableSubjects:courseSubjects,
      preferredSubjects:savedSubjects,
    });
    const lessonOrderIndex = new Map((effectiveCoursePlanLessonOrder || []).map((id, index) => [String(id), index]));
    const lessonRank = lesson => {
      if (Number.isFinite(Number(lesson.aula?.display_plan_order))) {
        return { bucket:0, order:Number(lesson.aula.display_plan_order), fallback:Number(lesson.courseIndex) || 0 };
      }
      const ids = [lesson.docId, lesson.id, aulaDocId(lesson.aula), aulaVqKey(lesson.aula)].filter(Boolean).map(String);
      const hit = ids.map(id => lessonOrderIndex.get(id)).find(index => Number.isFinite(index));
      if (Number.isFinite(hit)) return { bucket:0, order:hit, fallback:Number(lesson.courseIndex) || 0 };
      return { bucket:1, order:Number(lesson.courseIndex) || 0, fallback:0 };
    };
    const compareLessonOrder = (left, right) => {
      const leftRank = lessonRank(left);
      const rightRank = lessonRank(right);
      return leftRank.bucket - rightRank.bucket
        || leftRank.order - rightRank.order
        || leftRank.fallback - rightRank.fallback
        || left.title.localeCompare(right.title, 'pt-BR');
    };
    const lessonWatched = lesson => [
      lesson.id,
      lesson.docId,
      getAulaId(lesson.aula),
      aulaDocId(lesson.aula),
      aulaVqKey(lesson.aula),
    ].filter(Boolean).some(id => !!watchedAulas[id]);
    const lessonsBySubject = new Map(orderedSubjects.map(subject => [
      subject,
      courseLessons.filter(lesson => lesson.subject === subject).sort(compareLessonOrder),
    ]));
    const allOrderedSubjectLessons = orderedSubjects.flatMap(subject => lessonsBySubject.get(subject) || []);
    const activeMixPreset = (COURSE_SCHEDULE_MIX_PRESETS || []).find(preset => preset.id === courseScheduleMixPreset) || null;
    const mixedScheduleActive = !!activeMixPreset;
    const subjectRankFrom = subjects => {
      const map = new Map(subjects.map((subject, index) => [normalizeTextKey(subject), index]));
      return subject => map.has(normalizeTextKey(subject))
        ? map.get(normalizeTextKey(subject))
        : subjects.length + orderedSubjects.indexOf(subject);
    };
    const sortLessonsByStrategy = strategy => {
      if (strategy === 'importance-life') return buildClinicalPrioritySchedule(allOrderedSubjectLessons);
      const ufcSubjectRank = subjectRankFrom(['Cardiologia','Pneumologia','Gastroenterologia','Endocrinologia','Nefrologia','Cirurgia','Obstetrícia','Pediatria','Ginecologia','Infectologia','Dermatologia','Hematologia','Reumatologia','Ortopedia','Psiquiatria','Oftalmologia']);
      const defaultSubjectRank = subjectRankFrom(orderedSubjects);
      const ruleSets = {
        'basic-advanced':[
          /\b(introducao|conceitos?|fundamentos?|anatomia|fisiologia|nocoes|classificacao|bases?)\b/,
          /\b(semiologia|diagnostico|avaliacao|rastreamento|achados)\b/,
          /\b(tratamento|manejo|terapia|profilaxia|conduta)\b/,
          /\b(complicacoes?|emergencias?|aguda|choque|insuficiencia|crise)\b/,
        ],
        'high-yield':[
          /\b(sus|epidemiologia|hipertensao|diabetes|pre[- ]?natal|parto|pneumonia|tuberculose|hiv|dengue|sepse|trauma|apendicite|cirrose|anemia|vacinas?)\b/,
          /\b(diagnostico|tratamento|manejo|classificacao|rastreamento|prevencao|complicacoes?)\b/,
        ],
        'emergency-first':[
          /\b(sepse|choque|parada|pcr|trauma|tce|ave|hemorragia|hipercalemia|hipoglicemia|cetoacidose|sdra|pneumotorax|queimaduras|intoxicacoes?)\b/,
          /\b(aguda|crise|emergencia|urgencia|insuficiencia|obstrucao|isquemia)\b/,
          /\b(tratamento|manejo|conduta|suporte|monitorizacao)\b/,
        ],
      };
      const rules = ruleSets[strategy] || ruleSets['basic-advanced'];
      if (strategy === 'course-order') return [...allOrderedSubjectLessons];
      if (strategy === 'ufc-flow' || strategy === 'medico-bicho') {
        const isPreventiveLesson = lesson => {
          const subjectKey = normalizeTextKey(lesson.subject);
          return subjectKey.includes('prevent') || subjectKey.includes('saude coletiva');
        };
        const preventiveLessons = allOrderedSubjectLessons.filter(isPreventiveLesson);
        const clinicalLessons = allOrderedSubjectLessons
          .filter(lesson => !isPreventiveLesson(lesson))
          .sort((left, right) => ufcSubjectRank(left.subject) - ufcSubjectRank(right.subject) || compareLessonOrder(left, right));
        return strategy === 'medico-bicho'
          ? clinicalLessons
          : interleaveLongitudinalScheduleLessons(clinicalLessons, preventiveLessons);
      }
      const source = allOrderedSubjectLessons;
      return [...source].sort((left, right) => {
        return patternRank(lessonSearchText(left, normalizeTextKey), rules) - patternRank(lessonSearchText(right, normalizeTextKey), rules)
          || defaultSubjectRank(left.subject) - defaultSubjectRank(right.subject)
          || compareLessonOrder(left, right);
      });
    };
    const subjectBatchSize = Math.max(1, Math.min(
      COURSE_SCHEDULE_MAX_SUBJECT_BATCH_SIZE,
      Number(courseScheduleSubjectBatchSize) || COURSE_SCHEDULE_DEFAULT_SUBJECT_BATCH_SIZE,
    ));
    const orderedLessons = mixedScheduleActive
      ? sortLessonsByStrategy(activeMixPreset.strategy)
      : interleaveScheduleSubjectBatches({ orderedSubjects, lessonsBySubject, batchSize:subjectBatchSize });
    const dailyScheduleActive = courseScheduleCadence === 'daily';
    const startDate = cronStartDate ? new Date(`${cronStartDate}T12:00:00`) : null;
    const validStartDate = !!(startDate && Number.isFinite(startDate.getTime()));
    const today = new Date();
    const todayAtNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
    const { totalEffortSeconds } = calculateScheduleEffort(orderedLessons);
    const weeksCount = resolveScheduleWeeksCount({
      cadence:courseScheduleCadence,
      effortHours:courseScheduleEffortHours,
      endDate:courseScheduleEndDate,
      fallbackWeeks:Number(courseScheduleWeeks) || COURSE_SCHEDULE_DEFAULT_WEEKS,
      goalMode:courseScheduleGoalMode,
      startDate:validStartDate ? startDate : null,
      studyDays:courseScheduleStudyDays,
      today:todayAtNoon,
      totalEffortSeconds,
    });
    const dailySchedule = dailyScheduleActive ? buildDailyEffortSchedule({
      endDate:courseScheduleGoalMode === 'date' ? courseScheduleEndDate : null,
      lessons:orderedLessons,
      startDate:validStartDate ? startDate : null,
      studyDays:courseScheduleStudyDays,
      today:todayAtNoon,
      weeksCount,
    }) : null;
    const balancedSchedule = dailyScheduleActive
      ? null
      : buildEffortBalancedSchedule({ lessons:orderedLessons, weeksCount });
    const calendarStartDate = dailySchedule?.startDate || startDate;
    const scheduleHasStarted = !!(calendarStartDate && Date.now() >= calendarStartDate.getTime());
    const rawCurrentWeek = calendarStartDate
      ? Math.floor((Date.now() - calendarStartDate.getTime()) / 604800000) + 1
      : 1;
    const scheduleCurrentWeek = Math.max(1, Math.min(weeksCount, rawCurrentWeek));
    const scheduleDays = (dailySchedule?.days || []).map(baseDay => {
      const watched = baseDay.lessons.filter(lessonWatched).length;
      return {
        ...baseDay,
        remaining:baseDay.lessons.length - watched,
        subjects:[...new Set(baseDay.lessons.map(lesson => lesson.subject))],
        watched,
        pct:baseDay.lessons.length ? Math.round(watched / baseDay.lessons.length * 100) : 0,
      };
    });
    const baseWeeks = dailyScheduleActive
      ? Array.from({ length:weeksCount }, (_, index) => {
          const days = scheduleDays.filter(day => day.week === index + 1);
          return {
            effortSeconds:days.reduce((sum, day) => sum + (day.effortSeconds || 0), 0),
            estimatedLessons:days.reduce((sum, day) => sum + (day.estimatedLessons || 0), 0),
            knownDurationSeconds:days.reduce((sum, day) => sum + (day.knownDurationSeconds || 0), 0),
            lessons:days.flatMap(day => day.lessons),
            week:index + 1,
          };
        })
      : balancedSchedule.weeks;
    const scheduleWeeks = baseWeeks.map(baseWeek => {
      const lessons = baseWeek.lessons;
      const watched = lessons.filter(lessonWatched).length;
      const weekStartDate = calendarStartDate ? new Date(calendarStartDate.getTime() + (baseWeek.week - 1) * 604800000) : null;
      const weekEndDate = weekStartDate ? new Date(weekStartDate.getTime() + 6 * 86400000) : null;
      return {
        ...baseWeek,
        endDate:weekEndDate,
        remaining:lessons.length - watched,
        startDate:weekStartDate,
        subjects:[...new Set(lessons.map(lesson => lesson.subject))],
        watched,
        pct:lessons.length ? Math.round(watched / lessons.length * 100) : 0,
      };
    });
    const nonEmptyWeekSizes = scheduleWeeks.filter(week => week.lessons.length).map(week => week.lessons.length);
    const minLessonsPerWeek = nonEmptyWeekSizes.length ? Math.min(...nonEmptyWeekSizes) : 0;
    const maxLessonsPerWeek = nonEmptyWeekSizes.length ? Math.max(...nonEmptyWeekSizes) : 0;
    const lessonsPerWeekLabel = minLessonsPerWeek === maxLessonsPerWeek
      ? String(maxLessonsPerWeek)
      : `${minLessonsPerWeek}-${maxLessonsPerWeek}`;
    const nonEmptyDaySizes = scheduleDays.filter(day => day.lessons.length).map(day => day.lessons.length);
    const minLessonsPerDay = nonEmptyDaySizes.length ? Math.min(...nonEmptyDaySizes) : 0;
    const maxLessonsPerDay = nonEmptyDaySizes.length ? Math.max(...nonEmptyDaySizes) : 0;
    const lessonsPerDayLabel = minLessonsPerDay === maxLessonsPerDay
      ? String(maxLessonsPerDay)
      : `${minLessonsPerDay}-${maxLessonsPerDay}`;
    const todayKey = scheduleDateKey(todayAtNoon);
    const scheduleCurrentDay = scheduleDays.find(day => day.dateKey === todayKey)
      || scheduleDays.find(day => day.date.getTime() >= todayAtNoon.getTime())
      || scheduleDays[scheduleDays.length - 1]
      || null;
    const selectedDayData = scheduleDays.find(day => day.dateKey === courseScheduleDayCursor)
      || scheduleCurrentDay;
    const selectedWeek = dailyScheduleActive
      ? selectedDayData?.week || scheduleCurrentWeek
      : Math.max(1, Math.min(weeksCount, Number(curWeek) || scheduleCurrentWeek));
    const selectedWeekData = scheduleWeeks.find(week => week.week === selectedWeek) || scheduleWeeks[0] || null;
    const currentWeekData = scheduleWeeks.find(week => week.week === scheduleCurrentWeek) || selectedWeekData;
    const backlogLessons = scheduleHasStarted
      ? dailyScheduleActive
        ? scheduleDays.filter(day => day.dateKey < todayKey).flatMap(day => day.lessons.filter(lesson => !lessonWatched(lesson)))
        : scheduleWeeks.filter(week => week.week < scheduleCurrentWeek).flatMap(week => week.lessons.filter(lesson => !lessonWatched(lesson)))
      : [];
    const currentWeekRemaining = dailyScheduleActive
      ? scheduleCurrentDay?.lessons.filter(lesson => !lessonWatched(lesson)) || []
      : currentWeekData?.lessons.filter(lesson => !lessonWatched(lesson)) || [];
    const nextScheduleLesson = backlogLessons[0]
      || currentWeekRemaining[0]
      || orderedLessons.find(lesson => !lessonWatched(lesson))
      || null;
    const completed = orderedLessons.filter(lessonWatched).length;
    const progress = {
      completed,
      total:orderedLessons.length,
      pct:orderedLessons.length ? Math.round(completed / orderedLessons.length * 100) : 0,
    };
    const openLesson = lesson => {
      if (!lesson) return;
      setActiveSubjectVid(lesson.subject);
      setActiveSubtopicVid(`${lesson.topic}::${lesson.cat}`);
      setActiveAulaAndReset(lesson.aula);
      setView('videoaulas');
    };
    const nextWeek = nextScheduleLesson
      ? scheduleWeeks.find(week => week.lessons.some(lesson => lesson.id === nextScheduleLesson.id))
      : null;
    const nextDay = nextScheduleLesson
      ? scheduleDays.find(day => day.lessons.some(lesson => lesson.id === nextScheduleLesson.id))
      : null;
    const nextLessonStatus = !nextScheduleLesson
      ? 'complete'
      : dailyScheduleActive
        ? nextDay?.dateKey < todayKey && scheduleHasStarted
          ? 'backlog'
          : nextDay?.dateKey === todayKey
            ? 'current'
            : 'future'
        : nextWeek?.week < scheduleCurrentWeek && scheduleHasStarted
          ? 'backlog'
          : nextWeek?.week === scheduleCurrentWeek
            ? 'current'
            : 'future';
    const heroJourneyStep = nextScheduleLesson ? {
      item:{ subject:nextScheduleLesson.subject },
      step:{
        action:()=>openLesson(nextScheduleLesson),
        detail:nextScheduleLesson.title,
        label:'Próxima aula',
        lesson:nextScheduleLesson,
        subdetail:dailyScheduleActive && nextDay
          ? nextLessonStatus === 'backlog'
            ? `Pendente de ${nextDay.date.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' }).replace('.', '')}`
            : nextDay.date.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' }).replace('.', '')
          : nextWeek
            ? nextLessonStatus === 'backlog' ? `Pendente da semana ${nextWeek.week}` : `Semana ${nextWeek.week}`
            : '',
      },
    } : null;
    const weekWindowStart = Math.max(1, Math.min(selectedWeek - 3, weeksCount - 6));
    const nearbyWeeks = scheduleWeeks.filter(week => week.week >= weekWindowStart && week.week < weekWindowStart + 7);
    const configuredEndDate = courseScheduleGoalMode === 'date' && courseScheduleEndDate
      ? new Date(`${courseScheduleEndDate}T12:00:00`)
      : null;
    const validConfiguredEndDate = configuredEndDate && Number.isFinite(configuredEndDate.getTime())
      ? configuredEndDate
      : null;
    const scheduleEndDate = dailySchedule?.endDate
      || validConfiguredEndDate
      || (validStartDate ? new Date(startDate.getTime() + weeksCount * 604800000 - 86400000) : null);

    return {
      activeMixPreset,
      backlogLessons,
      courseLessons,
      currentWeekData,
      currentWeekRemaining,
      dailyScheduleActive,
      heroJourneyStep,
      isReady:true,
      lessonWatched,
      lessonsPerWeekLabel,
      lessonsPerDayLabel,
      mixedScheduleActive,
      nearbyWeeks,
      nextScheduleLesson,
      openLesson,
      orderedLessons,
      orderedSubjects,
      progress,
      nextLessonStatus,
      nextLessonDay:nextDay || null,
      nextLessonWeek:nextWeek || null,
      plannedDailySeconds:dailySchedule?.slots?.length ? Math.round(totalEffortSeconds / dailySchedule.slots.length) : 0,
      plannedWeeklySeconds:weeksCount ? Math.round(totalEffortSeconds / weeksCount) : 0,
      scheduleCurrentDay,
      scheduleCurrentWeek,
      scheduleDays,
      scheduleEndDate,
      scheduleHasStarted,
      scheduleWeeks,
      selectedWeek,
      selectedWeekData,
      selectedDayData,
      subjectBatchSize,
      totalEffortSeconds,
      weeksCount,
    };
  }, [
    COURSE_SCHEDULE_DEFAULT_SUBJECT_BATCH_SIZE,
    COURSE_SCHEDULE_DEFAULT_WEEKS,
    COURSE_SCHEDULE_MAX_SUBJECT_BATCH_SIZE,
    COURSE_SCHEDULE_MIX_PRESETS,
    appliedVideoaulasData,
    aulaDocId,
    aulaVqKey,
    coursePlanSubjects,
    coursePrefsLoaded,
    courseScheduleCadence,
    courseScheduleDayCursor,
    courseScheduleEffortHours,
    courseScheduleEndDate,
    courseScheduleGoalMode,
    courseScheduleMixPreset,
    courseScheduleSubjectBatchSize,
    courseScheduleStudyDays,
    courseScheduleWeeks,
    cronStartDate,
    curWeek,
    effectiveCoursePlanLessonOrder,
    enabled,
    flattenCourseLessons,
    getAulaId,
    normalizeTextKey,
    setActiveAulaAndReset,
    setActiveSubjectVid,
    setActiveSubtopicVid,
    setView,
    sortCourseSubjectsForDisplay,
    watchedAulas,
  ]);
};
