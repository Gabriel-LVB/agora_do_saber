import { useCallback, useMemo } from 'react';

export const useCourseDerivedState = ({
  applyCourseOrgProposalToVideoData,
  courseCatalogStats,
  courseOrgProposal,
  courseOrgSourceMode,
  coursePlanLessonOrder,
  coursePlanSubjects,
  isAdmin,
  canSeeVideoaulas,
  normalizeCourseOrgProposal,
  normalizeTextKey,
  sortSubjects,
  videoaulasData,
}) => {
  const displayCourseOrgProposal = useMemo(
    () => normalizeCourseOrgProposal(courseOrgProposal),
    [courseOrgProposal, normalizeCourseOrgProposal]
  );

  const courseOrgProposalUsesOriginalSubjects = displayCourseOrgProposal?.sourceMode === courseOrgSourceMode;
  const effectiveCoursePlanLessonOrder = courseOrgProposalUsesOriginalSubjects ? coursePlanLessonOrder : [];
  const canUseCourseOrganization = isAdmin || canSeeVideoaulas;

  const appliedVideoaulasData = useMemo(
    () => canUseCourseOrganization && effectiveCoursePlanLessonOrder.length && displayCourseOrgProposal?.subjects?.length
      ? applyCourseOrgProposalToVideoData(videoaulasData || {}, displayCourseOrgProposal)
      : videoaulasData,
    [
      applyCourseOrgProposalToVideoData,
      canUseCourseOrganization,
      displayCourseOrgProposal,
      effectiveCoursePlanLessonOrder,
      videoaulasData,
    ]
  );

  const appliedCourseSubjectOrder = useMemo(
    () => courseOrgProposalUsesOriginalSubjects
      ? (displayCourseOrgProposal?.subjects || []).map(item => item.subject).filter(Boolean)
      : [],
    [courseOrgProposalUsesOriginalSubjects, displayCourseOrgProposal]
  );

  const originalSubjectOptions = useMemo(
    () => sortSubjects((courseCatalogStats.rows || []).map(row => row.subject).filter(Boolean)),
    [courseCatalogStats.rows, sortSubjects]
  );

  const sortCourseSubjectsForDisplay = useCallback((subjects = []) => {
    if (!canUseCourseOrganization) return sortSubjects(subjects);
    const availableByKey = new Map(subjects.map(subject => [normalizeTextKey(subject), subject]));
    const seen = new Set();
    const ordered = [];
    [...(coursePlanSubjects || []), ...appliedCourseSubjectOrder].forEach(preferred => {
      const subject = availableByKey.get(normalizeTextKey(preferred));
      const key = normalizeTextKey(subject);
      if (!subject || seen.has(key)) return;
      seen.add(key);
      ordered.push(subject);
    });
    return [...ordered, ...sortSubjects(subjects.filter(subject => !seen.has(normalizeTextKey(subject))))];
  }, [
    appliedCourseSubjectOrder,
    canUseCourseOrganization,
    coursePlanSubjects,
    normalizeTextKey,
    sortSubjects,
  ]);

  return {
    appliedCourseSubjectOrder,
    appliedVideoaulasData,
    canUseCourseOrganization,
    courseOrgProposalUsesOriginalSubjects,
    displayCourseOrgProposal,
    effectiveCoursePlanLessonOrder,
    originalSubjectOptions,
    sortCourseSubjectsForDisplay,
  };
};
