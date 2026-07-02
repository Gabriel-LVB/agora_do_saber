import { useMemo } from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';

const stageMeta = (stage) => {
  if (stage === 'direct-odd') return { type:'direct', parity:'odd' };
  if (stage === 'direct-even') return { type:'direct', parity:'even' };
  if (stage === 'clinical-odd') return { type:'clinical', parity:'odd' };
  if (stage === 'clinical-even') return { type:'clinical', parity:'even' };
  return null;
};

const stageKey = (type, parity, suffix) => `${type}${parity === 'odd' ? 'Odd' : 'Even'}${suffix}`;

export const useCourseHeroJourney = ({ enabled = true } = {}) => {
  const {
    appliedVideoaulasData,
    aulaDocId,
    aulaHasVqData,
    aulaVqKey,
    capitalizeDisplayLabel,
    cleanAulaTitle,
    coursePrefsLoaded,
    courseCycleSubjectBatchSize,
    coursePlanSubjects,
    coursePlanLocked,
    effectiveCoursePlanLessonOrder,
    flattenCourseLessons,
    getAulaId,
    getDueReviews,
    looksLikeClinicalVignette,
    normalizeTextKey,
    openSpacedReview,
    saveCourseCycleReview,
    saveCoursePlanPrefs,
    setActiveAulaAndReset,
    setActiveSubjectVid,
    setActiveSubtopicVid,
    setView,
    setVqActiveBlock,
    setVqActiveBlockView,
    setVqAula,
    setVqGenModal,
    setVqQuestionParity,
    setVqSubject,
    setVqTopic,
    sortCourseSubjectsForDisplay,
    vqBlocks,
    vqBlocksLoaded,
    watchedAulas,
  } = useFeatureContext();

  const model = useMemo(() => {
    const empty = {
      activeSubjectSummaries:[],
      courseLessons:[],
      dueCourseItems:[],
      heroJourneyStep:null,
      isReady:false,
      normalizedSubjects:[],
      progress:{ total:0, completed:0, primary:0, watched:0, pct:0 },
      subjectSummaries:[],
      unlockedSubjectLimit:0,
    };
    if (!enabled || !appliedVideoaulasData || !coursePrefsLoaded || !vqBlocksLoaded) return empty;

    const courseLessons = flattenCourseLessons(appliedVideoaulasData || {});
    if (!courseLessons.length) return { ...empty, isReady:true };

    const subjects = sortCourseSubjectsForDisplay([...new Set(courseLessons.map(lesson => lesson.subject))]);
    const subjectByKey = new Map(subjects.map(subject => [normalizeTextKey(subject), subject]));
    const savedSubjects = coursePlanSubjects.map(subject => subjectByKey.get(normalizeTextKey(subject))).filter(Boolean);
    const normalizedSubjects = [...savedSubjects, ...subjects.filter(subject => !savedSubjects.includes(subject))];
    const lessonOrderIndex = new Map((effectiveCoursePlanLessonOrder || []).map((id, index) => [String(id), index]));

    const lessonWatched = (lesson) => [
      lesson.id,
      lesson.docId,
      getAulaId(lesson.aula),
      aulaDocId(lesson.aula),
      aulaVqKey(lesson.aula),
    ].filter(Boolean).some(id => !!watchedAulas[id]);

    const blockEntriesForLesson = (lesson) => {
      const data = vqBlocks[aulaDocId(lesson.aula)] || vqBlocks[aulaVqKey(lesson.aula)];
      const rawBlocks = data?.blocks || {};
      const entries = Array.isArray(rawBlocks)
        ? rawBlocks.map((block, index) => [`block${index + 1}`, block])
        : Object.entries(rawBlocks);
      return entries.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    };

    const questionInfoForLesson = (lesson) => {
      const blockEntries = blockEntriesForLesson(lesson);
      const total = blockEntries.reduce((sum, [, block]) => sum + ((Array.isArray(block.questions) ? block.questions : []).length), 0);
      const answered = blockEntries.reduce((sum, [, block]) => {
        const answers = block.answers && typeof block.answers === 'object' && !Array.isArray(block.answers) ? block.answers : {};
        return sum + Object.keys(answers).length;
      }, 0);
      return { total, answered, blocks:blockEntries.length, blockEntries };
    };

    const isClinicalCourseQuestion = (question = {}) =>
      question.libraryQuestionKind === 'clinical' || looksLikeClinicalVignette(question);

    const journeyInfoForLesson = (lesson) => {
      const stats = {
        total:0,
        answered:0,
        directTotal:0,
        clinicalTotal:0,
        directOddTotal:0,
        directOddAnswered:0,
        directEvenTotal:0,
        directEvenAnswered:0,
        clinicalOddTotal:0,
        clinicalOddAnswered:0,
        clinicalEvenTotal:0,
        clinicalEvenAnswered:0,
      };
      let directIndex = 0;
      let clinicalIndex = 0;
      blockEntriesForLesson(lesson).forEach(([, block]) => {
        const questions = Array.isArray(block.questions) ? block.questions : [];
        const answers = block.answers && typeof block.answers === 'object' && !Array.isArray(block.answers) ? block.answers : {};
        questions.forEach(question => {
          const clinical = isClinicalCourseQuestion(question);
          const type = clinical ? 'clinical' : 'direct';
          const index = clinical ? ++clinicalIndex : ++directIndex;
          const parity = index % 2 === 1 ? 'odd' : 'even';
          const answered = Object.prototype.hasOwnProperty.call(answers, question.id);
          stats.total += 1;
          stats[`${type}Total`] += 1;
          stats[stageKey(type, parity, 'Total')] += 1;
          if (answered) {
            stats.answered += 1;
            stats[stageKey(type, parity, 'Answered')] += 1;
          }
        });
      });
      const done = (total, answered) => total > 0 && answered >= total;
      const emptyOrDone = (total, answered) => total === 0 || answered >= total;
      stats.directOddDone = done(stats.directOddTotal, stats.directOddAnswered);
      stats.directEvenDone = emptyOrDone(stats.directEvenTotal, stats.directEvenAnswered);
      stats.clinicalOddDone = emptyOrDone(stats.clinicalOddTotal, stats.clinicalOddAnswered);
      stats.clinicalEvenDone = emptyOrDone(stats.clinicalEvenTotal, stats.clinicalEvenAnswered);
      stats.primaryDone = lessonWatched(lesson) && stats.directOddDone;
      stats.journeyDone = stats.primaryDone && stats.directEvenDone && stats.clinicalOddDone && stats.clinicalEvenDone;
      return stats;
    };

    const firstQuestionBlockForLesson = (lesson, mode = 'pending') => {
      const entries = questionInfoForLesson(lesson).blockEntries;
      if (!entries.length) return null;
      const stage = stageMeta(mode);
      if (mode === 'clinical-review') {
        let firstClinicalEntry = null;
        for (const entry of entries) {
          const [, block] = entry;
          const questions = Array.isArray(block.questions) ? block.questions : [];
          const answers = block.answers && typeof block.answers === 'object' && !Array.isArray(block.answers) ? block.answers : {};
          const hasClinical = questions.some(question => isClinicalCourseQuestion(question));
          const hasPendingClinicalReview = questions.some(question =>
            isClinicalCourseQuestion(question)
            && !Object.prototype.hasOwnProperty.call(answers, `${question.id}__cycle_r10`)
          );
          if (hasClinical && !firstClinicalEntry) firstClinicalEntry = entry;
          if (hasPendingClinicalReview) return entry;
        }
        return firstClinicalEntry;
      }
      if (mode === 'review') return entries.find(([, block]) => (Array.isArray(block.questions) ? block.questions : []).length > 0) || null;
      if (stage) {
        let typeIndex = 0;
        let firstStageEntry = null;
        for (const entry of entries) {
          const [, block] = entry;
          const questions = Array.isArray(block.questions) ? block.questions : [];
          const answers = block.answers && typeof block.answers === 'object' && !Array.isArray(block.answers) ? block.answers : {};
          let hasStageQuestion = false;
          let hasPendingStageQuestion = false;
          questions.forEach(question => {
            const type = isClinicalCourseQuestion(question) ? 'clinical' : 'direct';
            if (type !== stage.type) return;
            const index = ++typeIndex;
            const parity = index % 2 === 1 ? 'odd' : 'even';
            if (parity === stage.parity) {
              hasStageQuestion = true;
              if (!Object.prototype.hasOwnProperty.call(answers, question.id)) hasPendingStageQuestion = true;
            }
          });
          if (hasStageQuestion && !firstStageEntry) firstStageEntry = entry;
          if (hasPendingStageQuestion) return entry;
        }
        return firstStageEntry;
      }
      return entries.find(([, block]) => {
        const questions = Array.isArray(block.questions) ? block.questions : [];
        const answers = block.answers && typeof block.answers === 'object' && !Array.isArray(block.answers) ? block.answers : {};
        return questions.length > 0 && Object.keys(answers).length < questions.length;
      }) || entries.find(([, block]) => (Array.isArray(block.questions) ? block.questions : []).length > 0) || null;
    };

    const planLessonRank = (lesson) => {
      if (Number.isFinite(Number(lesson.aula?.display_plan_order))) return Number(lesson.aula.display_plan_order);
      const ids = [lesson.docId, lesson.id, aulaDocId(lesson.aula), aulaVqKey(lesson.aula)].filter(Boolean).map(String);
      const hit = ids.map(id => lessonOrderIndex.get(id)).find(index => Number.isFinite(index));
      return Number.isFinite(hit) ? hit : Number.MAX_SAFE_INTEGER;
    };

    const lessonsBySubject = (subject) => courseLessons
      .filter(lesson => lesson.subject === subject)
      .sort((a, b) => {
        const byPlan = planLessonRank(a) - planLessonRank(b);
        if (byPlan) return byPlan;
        return a.title.localeCompare(b.title, 'pt');
      });

    const topicsBySubject = (subject) => {
      const map = {};
      lessonsBySubject(subject).forEach(lesson => {
        if (!map[lesson.topic]) map[lesson.topic] = [];
        map[lesson.topic].push(lesson);
      });
      return map;
    };

    const subjectSummaries = normalizedSubjects.map(subject => {
      const lessons = lessonsBySubject(subject);
      const watched = lessons.filter(lessonWatched).length;
      const completed = lessons.filter(lesson => journeyInfoForLesson(lesson).journeyDone).length;
      const primaryCompleted = lessons.filter(lesson => journeyInfoForLesson(lesson).primaryDone).length;
      const questionCount = lessons.reduce((acc, lesson) => acc + questionInfoForLesson(lesson).total, 0);
      return {
        subject,
        lessons,
        watched,
        completed,
        primaryCompleted,
        total:lessons.length,
        topics:Object.keys(topicsBySubject(subject)).length,
        pct:lessons.length ? Math.round(completed / lessons.length * 100) : 0,
        questions:questionCount,
      };
    });

    const firstUnfinishedSubject = subjectSummaries.findIndex(item => item.total && item.completed < item.total);
    const cycleSubjectBatchSize = Math.max(1, Math.min(subjectSummaries.length || 1, Number(courseCycleSubjectBatchSize) || 4));
    const activeSubjectStartIndex = firstUnfinishedSubject >= 0 ? firstUnfinishedSubject : 0;
    const unlockedSubjectLimit = firstUnfinishedSubject >= 0
      ? Math.min(subjectSummaries.length, activeSubjectStartIndex + cycleSubjectBatchSize)
      : Infinity;
    const activeSubjectSummaries = firstUnfinishedSubject >= 0
      ? subjectSummaries.slice(activeSubjectStartIndex, unlockedSubjectLimit)
      : [];
    const subjectSummaryBySubject = new Map(subjectSummaries.map(item => [item.subject, item]));
    const interleavedCycleLessons = (() => {
      const cycleSubjects = activeSubjectSummaries.length ? activeSubjectSummaries.map(item => item.subject) : normalizedSubjects;
      const queues = cycleSubjects.map(subject => lessonsBySubject(subject)).filter(queue => queue.length);
      const maxLessons = queues.reduce((highest, queue) => Math.max(highest, queue.length), 0);
      const ordered = [];
      for (let index = 0; index < maxLessons; index += 1) {
        queues.forEach(queue => {
          if (queue[index]) ordered.push(queue[index]);
        });
      }
      return ordered;
    })();
    const courseCycleLessons = interleavedCycleLessons;
    const primaryDonePrefix = (() => {
      let count = 0;
      for (const lesson of courseCycleLessons) {
        if (!journeyInfoForLesson(lesson).primaryDone) break;
        count += 1;
      }
      return count;
    })();
    const primaryCompleteThrough = (cyclePosition) => {
      if (!courseCycleLessons.length) return false;
      const requiredIndex = Math.min(cyclePosition, courseCycleLessons.length - 1);
      return primaryDonePrefix > requiredIndex;
    };
    const cycleEvents = courseCycleLessons.flatMap((lesson, index) => [
      { kind:'primary', lesson, sourceIndex:index, position:index, priority:0 },
      { kind:'direct-even', lesson, sourceIndex:index, position:index + 1, priority:1 },
      { kind:'clinical-odd', lesson, sourceIndex:index, position:index + 4, priority:2 },
      { kind:'clinical-even', lesson, sourceIndex:index, position:index + 9, priority:3 },
    ]).sort((a, b) => (
      a.position - b.position
      || a.priority - b.priority
      || a.sourceIndex - b.sourceIndex
    ));

    const openLesson = (lesson) => {
      setActiveSubjectVid(lesson.subject);
      setActiveSubtopicVid(`${lesson.topic}::${lesson.cat}`);
      setActiveAulaAndReset(lesson.aula);
      setView('videoaulas');
    };

    const openQuestions = (lesson, mode = 'direct-odd') => {
      setVqSubject(lesson.subject);
      setVqTopic(lesson.topic);
      setVqAula(lesson.aula);
      setVqActiveBlock(null);
      const journeyStage = stageMeta(mode) ? mode : null;
      setVqQuestionParity(stageMeta(mode)?.parity || 'all');
      const targetBlock = firstQuestionBlockForLesson(lesson, journeyStage || (mode === 'review-r10' ? 'clinical-review' : mode === 'review-r3' ? 'review' : 'pending'));
      setVqActiveBlockView(targetBlock ? {
        blockId:targetBlock[0],
        showWrong:false,
        fromPlan:true,
        cycleStage:journeyStage || (mode === 'review-r3' ? 'r3' : mode === 'review-r10' ? 'r10' : null),
      } : null);
      if (aulaHasVqData(lesson.aula)) setView('videoquestions');
      else setVqGenModal({ aula:lesson.aula, aulaId:aulaDocId(lesson.aula), suggestedQ:15, subject:lesson.subject, topic:lesson.topic, fromConfig:true });
    };

    const goToLessonStep = (lesson) => {
      const ji = journeyInfoForLesson(lesson);
      if (!lessonWatched(lesson)) {
        openLesson(lesson);
        return;
      }
      if (ji.directTotal === 0 || !ji.directOddDone) {
        openQuestions(lesson, 'direct-odd');
        return;
      }
      openLesson(lesson);
    };

    const lessonStep = (lesson) => {
      const ji = journeyInfoForLesson(lesson);
      if (!lessonWatched(lesson)) return { label:'Assistir aula', tone:'yellow', detail:'marque como assistida ao terminar', lesson };
      if (ji.directTotal === 0) return { label:'Gerar questões', tone:'blue', detail:'fixação ímpar pendente', lesson };
      if (!ji.directOddDone) return { label:'Fazer ímpares diretas', tone:'green', detail:`${ji.directOddAnswered}/${ji.directOddTotal} respondidas`, lesson };
      return null;
    };

    const cycleEntryForEvent = (event) => {
      const ji = journeyInfoForLesson(event.lesson);
      const item = subjectSummaryBySubject.get(event.lesson.subject) || { subject:event.lesson.subject };
      if (event.kind === 'primary') {
        const step = lessonStep(event.lesson);
        if (!step) return null;
        return {
          item,
          index:event.sourceIndex,
          step:{
            ...step,
            detail:event.lesson.title,
            subdetail:`Ato ${event.sourceIndex + 1} do ciclo · ${step.detail}`,
            action:()=>goToLessonStep(event.lesson),
          },
        };
      }
      if (!ji.primaryDone || !primaryCompleteThrough(event.position)) return null;
      if (event.kind === 'direct-even') {
        if (ji.directEvenTotal === 0 || ji.directEvenDone) return null;
        return {
          item,
          index:event.sourceIndex,
          step:{
            label:ji.directEvenAnswered > 0 ? 'Concluir pares diretas' : 'Fazer pares diretas',
            tone:'red',
            detail:event.lesson.title,
            subdetail:ji.directEvenAnswered > 0
              ? `${ji.directEvenAnswered}/${ji.directEvenTotal} respondidas`
              : `ato ${event.sourceIndex + 2} do ciclo`,
            lesson:event.lesson,
            action:()=>openQuestions(event.lesson, 'direct-even'),
          },
        };
      }
      if (event.kind === 'clinical-odd') {
        if (!ji.directEvenDone || ji.clinicalOddTotal === 0 || ji.clinicalOddDone) return null;
          return {
            item,
            index:event.sourceIndex,
            step:{
              label:ji.clinicalOddAnswered > 0 ? 'Concluir clínicas ímpares' : 'Fazer clínicas ímpares',
              tone:'red',
              detail:event.lesson.title,
              subdetail:ji.clinicalOddAnswered > 0
                ? `${ji.clinicalOddAnswered}/${ji.clinicalOddTotal} respondidas`
                : `ato ${event.sourceIndex + 5} do ciclo`,
              lesson:event.lesson,
              action:()=>openQuestions(event.lesson, 'clinical-odd'),
            },
          };
      }
      if (event.kind === 'clinical-even') {
        if (!ji.clinicalOddDone || ji.clinicalEvenTotal === 0 || ji.clinicalEvenDone) return null;
          return {
            item,
            index:event.sourceIndex,
            step:{
              label:ji.clinicalEvenAnswered > 0 ? 'Concluir clínicas pares' : 'Fazer clínicas pares',
              tone:'red',
              detail:event.lesson.title,
              subdetail:ji.clinicalEvenAnswered > 0
                ? `${ji.clinicalEvenAnswered}/${ji.clinicalEvenTotal} respondidas`
                : `ato ${event.sourceIndex + 10} do ciclo`,
              lesson:event.lesson,
              action:()=>openQuestions(event.lesson, 'clinical-even'),
            },
          };
      }
      return null;
    };

    const cycleSteps = cycleEvents.map(cycleEntryForEvent).filter(Boolean);
    const nextStepForSubject = (item) => {
      const entry = cycleSteps.find(current => current.item.subject === item.subject);
      if (entry?.step) return entry.step;
      return {
        label:'Matéria em dia',
        tone:'gray',
        detail:'sem pendência agora',
        action:()=>{},
        done:true,
      };
    };

    const heroJourneyStep = cycleSteps[0] || null;

    const progress = {
      total:subjectSummaries.reduce((sum, item) => sum + item.total, 0),
      completed:subjectSummaries.reduce((sum, item) => sum + item.completed, 0),
      primary:subjectSummaries.reduce((sum, item) => sum + item.primaryCompleted, 0),
      watched:subjectSummaries.reduce((sum, item) => sum + item.watched, 0),
    };
    progress.pct = progress.total ? Math.round(progress.completed / progress.total * 100) : 0;

    const dueCourseItems = getDueReviews().filter(item => item.source === 'curso' || vqBlocks[item.aulaId]);
    const lessonIds = (lesson) => [
      lesson.id,
      aulaVqKey(lesson.aula),
      aulaDocId(lesson.aula),
    ].filter(Boolean);
    const reviewItemsForLesson = (lesson) => dueCourseItems.filter(item =>
      lessonIds(lesson).includes(item.aulaId)
      || cleanAulaTitle(item.aulaTitle || '') === lesson.title
      || cleanAulaTitle(item.aulaTitle || '') === cleanAulaTitle(lesson.aula.title || '')
    );

    return {
      activeSubjectSummaries,
      courseLessons,
      cycleSubjectBatchSize,
      dueCourseItems,
      heroJourneyStep,
      isReady:true,
      journeyInfoForLesson,
      nextStepForSubject,
      normalizedSubjects,
      openCycleReview:async (lesson, stage) => {
        await saveCourseCycleReview(lesson.id, stage);
        openQuestions(lesson, stage === 'r10' ? 'review-r10' : 'review-r3');
      },
      progress,
      questionInfoForLesson,
      reviewItemsForLesson,
      reviewSubject:items => openSpacedReview(items),
      subjectSummaries,
      unlockedSubjectLimit,
    };
  }, [
    appliedVideoaulasData,
    aulaDocId,
    aulaHasVqData,
    aulaVqKey,
    cleanAulaTitle,
    courseCycleSubjectBatchSize,
    coursePlanSubjects,
    coursePrefsLoaded,
    effectiveCoursePlanLessonOrder,
    enabled,
    flattenCourseLessons,
    getAulaId,
    getDueReviews,
    looksLikeClinicalVignette,
    normalizeTextKey,
    openSpacedReview,
    saveCourseCycleReview,
    setActiveAulaAndReset,
    setActiveSubjectVid,
    setActiveSubtopicVid,
    setView,
    setVqActiveBlock,
    setVqActiveBlockView,
    setVqAula,
    setVqGenModal,
    setVqQuestionParity,
    setVqSubject,
    setVqTopic,
    sortCourseSubjectsForDisplay,
    vqBlocks,
    vqBlocksLoaded,
    watchedAulas,
  ]);

  const moveSubject = (idx, dir) => {
    const next = [...(model.normalizedSubjects || [])];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    saveCoursePlanPrefs(next, coursePlanLocked);
  };

  return { ...model, moveSubject };
};
