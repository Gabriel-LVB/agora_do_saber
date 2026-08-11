import React from 'react';
import { useFeatureContext } from '../FeatureContext.jsx';
import { QuestionView } from '../questions/QuestionFeature.jsx';
import {
  deleteFamedQuestionAssets,
  deleteFamedContent,
  deleteLegacyFamedContent,
  famedContentToAcademiaSubject,
  loadFamedQuestionAssets,
  saveFamedAcademiaSubject,
  saveFamedQuestionAssets,
  setFamedContentPublished,
  subscribeFamedContent,
} from '../../services/famedContent.js';
import { FAMED_PROGRAM } from './famedCatalog.js';
import FamedScheduleView from './FamedScheduleView.jsx';
import { FAMED_S5_SCHEDULE } from './famedSchedule.js';
import {
  buildFamedCourseCatalogExport,
  resolveFamedCourseLessons,
} from './famedCourseLessonMap.js';
import {
  buildFamedFlashcardAuditExport,
  FAMED_FLASHCARD_GENERATION_VERSION,
  famedEssentialFlashcards,
  famedFlashcardSourceSignature,
  famedLessonSourceText,
  famedPastQuestionsSourceText,
  getFamedFlashcardState,
  getFamedStudyMaterials,
} from './famedStudyMaterials.js';

const AcademiaTopicView = React.lazy(() => import('../academia/AcademiaTopicView.jsx'));
const AdminStudyMapTopicList = React.lazy(() => import('../admin/AdminStudyMapTopicList.jsx'));
const FamedPastQuestionsView = React.lazy(() => import('./FamedPastQuestionsView.jsx'));

const readStoredObject = key => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch(error) {
    return {};
  }
};

const topicFixationQuestions = topic => Object.values(topic?.fixationQuestions || {}).flat();
const topicDisplayTitle = (title, index) => String(title || `Tópico ${index + 1}`)
  .replace(/^\s*(?:t[oó]pico|unidade|m[oó]dulo)\s*\d+\s*[:.\-–—]\s*/i, '')
  .trim() || `Tópico ${index + 1}`;
const hasCompletedAnswer = answer => answer != null && answer !== '' && answer !== 'SKIPPED';
const normalizeQuestions = questions => (questions || []).map(question => ({
  ...question,
  libraryQuestionKind:question.libraryQuestionKind || (question.isFlashcard ? 'flashcard' : question.caseContext ? 'clinical' : 'direct'),
}));
const safeDownloadName = value => String(value || 'aula')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'aula';

export default function FamedPortalView() {
  const {
    academiaExtraBusy,
    academiaGenProgress,
    academiaGenerating,
    academiaTopicAnswers,
    addToast,
    appliedVideoaulasData,
    bulkActionMenu,
    bulkGenerateModal,
    bulkGenerateRun,
    callWithRotation,
    ChevronDown,
    darkMode,
    findErrorNotebookReviewsForSource,
    flattenCourseLessons,
    generateAcademiaLesson,
    getBulkGenerateTargets,
    getKey,
    getTopicStudyPlan,
    isAdmin,
    openAcademiaRegenModal,
    openBulkGenerateModal,
    openErrorNotebookReviewResult,
    parseGeneratedQuestionsByTypes,
    parseHtmlText,
    PlusIcon,
    Printer,
    reviewQueue,
    RotateCcw,
    saveSettings,
    setAcademiaExportModal,
    setAcademiaExtraModal,
    setAcademiaTopicAnswers,
    setActiveAulaAndReset,
    setActiveSubjectVid,
    setActiveSubtopicVid,
    setBulkActionMenu,
    setOpenAnswerModal,
    setSettings,
    setSrModal,
    setView,
    settings,
    Spinner,
    startFamedAcademiaCreation,
    subjectProgress,
    trackQuestionAnswered,
    watchedAulas,
    Zap,
  } = useFeatureContext();
  const [contentItems, setContentItems] = React.useState([]);
  const [contentLoading, setContentLoading] = React.useState(true);
  const [contentError, setContentError] = React.useState('');
  const [activeContentId, setActiveContentId] = React.useState(null);
  const [activeTopicId, setActiveTopicId] = React.useState(null);
  const [activePanel, setActivePanel] = React.useState('schedule');
  const [activeQuestionSet, setActiveQuestionSet] = React.useState(null);
  const [answersByBlock, setAnswersByBlock] = React.useState(()=>readStoredObject('agora_famed_answers'));
  const [favoritesByBlock, setFavoritesByBlock] = React.useState(()=>readStoredObject('agora_famed_favorites'));
  const [cleaningLegacy, setCleaningLegacy] = React.useState(false);
  const [savingContent, setSavingContent] = React.useState(false);
  const [removingContentId, setRemovingContentId] = React.useState(null);
  const [generatingFlashcardsId, setGeneratingFlashcardsId] = React.useState(null);
  const [openingQuestionSetId, setOpeningQuestionSetId] = React.useState(null);
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('agora-famed-detail-layout', {
      detail:{ active:activePanel !== 'schedule' },
    }));
    return () => window.dispatchEvent(new CustomEvent('agora-famed-detail-layout', { detail:{ active:false } }));
  }, [activePanel]);
  React.useEffect(() => subscribeFamedContent({
    isAdmin,
    onData:items => {
      setContentItems(items);
      setContentLoading(false);
      setContentError('');
    },
    onError:error => {
      setContentLoading(false);
      setContentError(error?.message || 'Não foi possível carregar o conteúdo da FAMED.');
    },
  }), [isAdmin]);

  const contentByScheduleId = React.useMemo(() => Object.fromEntries(
    contentItems
      .filter(item => item.semester === 'S5' && item.creationMode === 'academia')
      .map(item => [item.scheduleItemId, item]),
  ), [contentItems]);
  const courseLessons = React.useMemo(
    () => flattenCourseLessons(appliedVideoaulasData || {}),
    [appliedVideoaulasData, flattenCourseLessons],
  );
  const courseLessonsByScheduleId = React.useMemo(() => Object.fromEntries(
    FAMED_S5_SCHEDULE
      .filter(item => item.kind === 'lesson')
      .map(item => [item.id, resolveFamedCourseLessons(item.id, courseLessons)]),
  ), [courseLessons]);
  const legacyContentItems = React.useMemo(() => contentItems.filter(item => item.creationMode !== 'academia'), [contentItems]);
  const activeContent = contentItems.find(item => item.id === activeContentId) || null;
  const activeSubject = React.useMemo(() => famedContentToAcademiaSubject(activeContent), [activeContent]);
  const activeSubjectWithProgress = React.useMemo(() => {
    if (!activeSubject) return null;
    const contentId = activeSubject.famedMeta.contentId;
    const legacyAnswers = answersByBlock[`${contentId}:academy:inline`] || {};
    const legacyFavorites = favoritesByBlock[`${contentId}:academy:inline`] || [];
    return {
      ...activeSubject,
      topics:(activeSubject.topics || []).map(topic => {
        const questionIds = new Set(topicFixationQuestions(topic).map(question => String(question.id)));
        const inheritedAnswers = Object.fromEntries(
          Object.entries(legacyAnswers).filter(([questionId]) => questionIds.has(String(questionId))),
        );
        const inheritedFavorites = legacyFavorites.filter(questionId => questionIds.has(String(questionId)));
        const blockKey = `${contentId}:${topic.id}:fixation:main`;
        return {
          ...topic,
          answers:{
            ...(topic.answers || {}),
            ...inheritedAnswers,
            ...(answersByBlock[blockKey] || {}),
          },
          favorites:Array.from(new Set([
            ...(topic.favorites || []),
            ...inheritedFavorites,
            ...(favoritesByBlock[blockKey] || []),
          ])),
        };
      }),
    };
  }, [activeSubject, answersByBlock, favoritesByBlock]);
  const activeTopicSource = isAdmin ? activeSubject : activeSubjectWithProgress;
  const activeTopic = activeTopicSource?.topics?.find(topic => String(topic.id) === String(activeTopicId)) || null;

  const returnToSchedule = () => {
    setActivePanel('schedule');
    setActiveContentId(null);
    setActiveTopicId(null);
    setActiveQuestionSet(null);
    window.scrollTo?.({ top:0, behavior:'smooth' });
  };
  const openSubject = content => {
    setActiveContentId(content.id);
    setActiveTopicId(null);
    setActivePanel(isAdmin ? 'subject' : 'student-topics');
    window.scrollTo?.({ top:0, behavior:'smooth' });
  };
  const openCourseLesson = lesson => {
    if (!lesson) return;
    setActiveSubjectVid(lesson.subject);
    setActiveSubtopicVid(`${lesson.topic}::${lesson.cat}`);
    setActiveAulaAndReset(lesson.aula);
    setView('videoaulas');
  };
  const exportCourseCatalog = () => {
    if (!courseLessons.length) {
      addToast?.('O catálogo do curso ainda não terminou de carregar.', 'warning', 4500);
      return;
    }
    const payload = buildFamedCourseCatalogExport({
      courseLessons,
      scheduleItems:FAMED_S5_SCHEDULE,
    });
    const blob = new Blob([JSON.stringify(payload,null,2)], { type:'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `agora-famed-catalogo-curso-${payload.exportedAt.slice(0,10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    addToast?.(`${payload.courseLessons.length} aulas exportadas na ordem do curso.`, 'success', 4500);
  };
  const saveAnswers = next => {
    setAnswersByBlock(next);
    localStorage.setItem('agora_famed_answers', JSON.stringify(next));
  };
  const saveFavorites = next => {
    setFavoritesByBlock(next);
    localStorage.setItem('agora_famed_favorites', JSON.stringify(next));
  };
  const persistSubject = async subject => {
    if (!isAdmin) return;
    await saveFamedAcademiaSubject(subject);
  };
  const persistStudentLessonProgress = subject => {
    if (isAdmin || !activeSubject?.famedMeta?.contentId) return;
    const topic = subject?.topics?.find(item => String(item.id) === String(activeTopicId));
    if (!topic) return;
    const blockKey = `${activeSubject.famedMeta.contentId}:${topic.id}:fixation:main`;
    saveAnswers({...answersByBlock,[blockKey]:topic.answers || {}});
    saveFavorites({...favoritesByBlock,[blockKey]:topic.favorites || []});
  };
  const openQuestions = (subject, topic, kind='fixation', block=null) => {
    const questions = kind === 'extra' ? (block?.questions || block || []) : topicFixationQuestions(topic);
    if (!questions.length) return;
    setActiveContentId(subject.famedMeta.contentId);
    setActiveTopicId(topic.id);
    setActiveQuestionSet({
      id:`${subject.famedMeta.contentId}:${topic.id}:${kind}:${block?.id || 'main'}`,
      title:kind === 'extra' ? (block?.title || 'Bateria extra') : 'Questões de fixação',
      questions:normalizeQuestions(questions),
    });
    setActivePanel('questions');
    window.scrollTo?.({ top:0, behavior:'smooth' });
  };
  const openPastQuestions = content => {
    if (!content) return;
    setActiveContentId(content.id);
    setActiveTopicId(null);
    setActiveQuestionSet(null);
    setActivePanel('past-questions');
    window.scrollTo?.({ top:0, behavior:'smooth' });
  };
  const openPastQuestionSet = async set => {
    if (!activeSubject || !set?.questions?.length) return;
    setOpeningQuestionSetId(set.id);
    try {
      const assetIds = (set.questions || []).flatMap(question => question.images || []).map(image => image?.assetId).filter(Boolean);
      const assetsById = assetIds.length ? await loadFamedQuestionAssets(assetIds) : {};
      const missingAsset = (set.questions || []).flatMap(question => question.images || []).find(image => image?.assetId && !assetsById[image.assetId]?.url);
      if (missingAsset) throw new Error('Uma imagem necessária deste bloco não está disponível. Peça ao administrador para importar o pacote novamente.');
      const hydratedQuestions = (set.questions || []).map(question => ({
        ...question,
        images:(question.images || []).map(image => ({
          ...image,
          id:image.assetId || image.id,
          url:image.url || assetsById[image.assetId]?.url || '',
        })).filter(image => image.url),
      }));
      setActiveQuestionSet({
        id:`${activeSubject.famedMeta.contentId}:past:${set.id}`,
        title:`${activeSubject.title} · ${set.title || 'Questões antigas'}`,
        questions:normalizeQuestions(hydratedQuestions),
        returnPanel:'past-questions',
        backLabel:'Questões antigas',
      });
      setActivePanel('questions');
      window.scrollTo?.({ top:0, behavior:'smooth' });
    } catch(error) {
      addToast?.(error?.message || 'Não foi possível carregar as imagens deste bloco.', 'error', 5500);
    } finally {
      setOpeningQuestionSetId(null);
    }
  };
  const importPastQuestions = async file => {
    if (!isAdmin || !activeSubject || savingContent) return false;
    const study = getFamedStudyMaterials(activeSubject);
    const setId = `past-${Date.now()}`;
    let savedAssets = [];
    setSavingContent(true);
    try {
      const { parseFamedQuestionPackage } = await import('./famedQuestionPackage.js');
      const parsed = await parseFamedQuestionPackage(file,`${activeSubject.famedMeta.contentId}-${setId}`);
      savedAssets = await saveFamedQuestionAssets({
        contentId:activeSubject.famedMeta.contentId,
        setId,
        assets:parsed.assets,
        published:activeSubject.famedMeta.published === true,
      });
      const assetIdByFile = Object.fromEntries(savedAssets.map(asset => [asset.file,asset.assetId]));
      const questions = parsed.questions.map(question => ({
        ...question,
        images:(question.images || []).map(image => ({
          assetId:assetIdByFile[image.file],
          altText:image.altText,
          credit:image.credit,
        })),
      }));
      const set = {
        id:setId,
        title:parsed.title || String(file?.name || '').replace(/\.zip$/i,'') || `Bloco ${study.pastQuestionSets.length + 1}`,
        importedAt:Date.now(),
        packageSchema:parsed.schema,
        questions:normalizeQuestions(questions),
      };
      await persistSubject({
        ...activeSubject,
        famedStudy:{
          ...study,
          pastQuestionSets:[...study.pastQuestionSets, set],
        },
      });
      addToast?.(`${set.questions.length} questões antigas adicionadas.`, 'success', 4500);
      return true;
    } catch(error) {
      if (savedAssets.length) {
        try { await deleteFamedQuestionAssets(savedAssets.map(asset => asset.assetId)); } catch(cleanupError) {}
      }
      addToast?.(error?.message || 'Não foi possível importar o pacote de questões.', 'error', 6500);
      return false;
    } finally {
      setSavingContent(false);
    }
  };
  const deletePastQuestionSet = async set => {
    if (!isAdmin || !activeSubject || !set?.id || savingContent) return;
    if (!window.confirm(`Excluir o bloco “${set.title || 'Questões antigas'}”?`)) return;
    const study = getFamedStudyMaterials(activeSubject);
    const assetIds = (set.questions || []).flatMap(question => question.images || []).map(image => image?.assetId).filter(Boolean);
    setSavingContent(true);
    try {
      await persistSubject({
        ...activeSubject,
        famedStudy:{
          ...study,
          pastQuestionSets:study.pastQuestionSets.filter(item => String(item.id) !== String(set.id)),
        },
      });
      if (assetIds.length) await deleteFamedQuestionAssets(assetIds);
      addToast?.('Bloco de questões antigas excluído.', 'success', 3500);
    } catch(error) {
      addToast?.(error?.message || 'Não foi possível excluir o bloco.', 'error', 5000);
    } finally {
      setSavingContent(false);
    }
  };
  const showEssentialFlashcards = (content, questions, returnPanel='schedule') => {
    const subject = famedContentToAcademiaSubject(content);
    if (!subject || !questions?.length) return;
    setActiveContentId(content.id);
    setActiveTopicId(null);
    setActiveQuestionSet({
      id:`${content.id}:essential-flashcards`,
      title:`${content.title} · Flashcards essenciais`,
      questions:normalizeQuestions(questions),
      returnPanel,
      backLabel:returnPanel === 'subject' ? content.title : 'FAMED · S5',
    });
    setActivePanel('questions');
    window.scrollTo?.({ top:0, behavior:'smooth' });
  };
  const openOrGenerateEssentialFlashcards = async (content, returnPanel='schedule') => {
    if (!content || generatingFlashcardsId) return;
    const subject = famedContentToAcademiaSubject(content);
    const state = getFamedFlashcardState(subject);
    const currentFlashcards = famedEssentialFlashcards(subject);
    if (state.fresh) {
      showEssentialFlashcards(content, currentFlashcards, returnPanel);
      return;
    }
    if (!isAdmin) return;
    if (!state.lessonReady) {
      addToast?.('Gere todas as aulas da Academia antes de criar os flashcards.', 'warning', 4500);
      return;
    }
    if (!state.pastQuestionCount) {
      addToast?.('Adicione as questões antigas antes de criar os flashcards.', 'warning', 4500);
      return;
    }
    setGeneratingFlashcardsId(content.id);
    try {
      const { buildFamedEssentialFlashcardsPrompt } = await import('../../agora_prompts.js');
      const prompt = buildFamedEssentialFlashcardsPrompt({
        title:subject.title,
        lessonText:famedLessonSourceText(subject),
        pastQuestionsText:famedPastQuestionsSourceText(subject),
      });
      const raw = await callWithRotation(
        prompt,
        'Você é professor de medicina e especialista em recuperação ativa. Escreva em português do Brasil, ignore cobranças antigas fáceis ou triviais, retenha o núcleo 20/80 priorizado por questões discriminativas e relevância clínica e crie flashcards diretos cujo back exija no máximo um ou dois itens curtos. Nunca peça listas, inventários de medicamentos/exames, “além de X” ou parte de uma lista. Faça singular/plural corresponder exatamente ao back e descarte detalhes periféricos pelo teste contrafactual.',
        { timeoutMs:180000, temperature:0.2 },
      );
      const parsed = parseGeneratedQuestionsByTypes(raw, `famed_flash_${content.id}_${Date.now()}`, ['flashcard']);
      const flashcards = normalizeQuestions(parsed.questions);
      if (!flashcards.length) throw new Error('A IA não devolveu flashcards diretos no formato esperado.');
      const study = getFamedStudyMaterials(subject);
      await persistSubject({
        ...subject,
        famedStudy:{
          ...study,
          essentialFlashcards:flashcards,
          flashcardSourceSignature:famedFlashcardSourceSignature(subject),
          flashcardGeneratedAt:Date.now(),
          flashcardGenerationVersion:FAMED_FLASHCARD_GENERATION_VERSION,
        },
      });
      addToast?.(`${flashcards.length} flashcards essenciais criados.`, 'success', 5000);
      showEssentialFlashcards(content, flashcards, returnPanel);
    } catch(error) {
      addToast?.(error?.message || 'Não foi possível criar os flashcards.', 'error', 6500);
    } finally {
      setGeneratingFlashcardsId(null);
    }
  };
  const deleteEssentialFlashcards = async content => {
    if (!isAdmin || !content || savingContent) return;
    const subject = famedContentToAcademiaSubject(content);
    const study = getFamedStudyMaterials(subject);
    if (!study.essentialFlashcards.length || !window.confirm(`Apagar os flashcards de “${content.title}” para poder gerá-los novamente?`)) return;
    setSavingContent(true);
    try {
      await persistSubject({
        ...subject,
        famedStudy:{
          ...study,
          essentialFlashcards:[],
          flashcardSourceSignature:null,
          flashcardGeneratedAt:null,
          flashcardGenerationVersion:null,
        },
      });
      addToast?.('Flashcards apagados. Você já pode gerar uma nova seleção.', 'success', 4000);
    } catch(error) {
      addToast?.(error?.message || 'Não foi possível apagar os flashcards.', 'error', 5500);
    } finally {
      setSavingContent(false);
    }
  };
  const exportEssentialFlashcardsAudit = content => {
    if (!isAdmin || !content) return;
    const subject = famedContentToAcademiaSubject(content);
    const study = getFamedStudyMaterials(subject);
    if (!study.essentialFlashcards.length) {
      addToast?.('Ainda não há flashcards para exportar.', 'warning', 3500);
      return;
    }
    const payload = buildFamedFlashcardAuditExport(subject, { content });
    const blob = new Blob([JSON.stringify(payload,null,2)], { type:'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `famed-flashcards-auditoria-${safeDownloadName(subject.title)}-${payload.exportedAt.slice(0,10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    addToast?.('Flashcards exportados para revisão do prompt.', 'success', 4000);
  };
  const handleAcademiaDelete = async payload => {
    if (payload?.type !== 'academia-extra-bloco' || !activeSubject) return;
    if (!window.confirm('Excluir esta bateria extra?')) return;
    const next = {
      ...activeSubject,
      topics:activeSubject.topics.map(topic => String(topic.id) === String(payload.topicId)
        ? {...topic, extraBattery:(topic.extraBattery || []).filter(block => String(block.id) !== String(payload.blocoId))}
        : topic),
    };
    await persistSubject(next);
  };
  const togglePublished = async () => {
    if (!activeContent || savingContent) return;
    setSavingContent(true);
    try {
      await setFamedContentPublished(activeContent, !activeContent.published);
      addToast?.(activeContent.published ? 'Aula retirada dos alunos.' : 'Aula publicada para os alunos.', 'success', 4500);
    } catch(error) {
      addToast?.(error?.message || 'Não foi possível alterar a publicação.', 'error', 5500);
    } finally {
      setSavingContent(false);
    }
  };
  const removeContent = async () => {
    if (!activeContent || !window.confirm(`Apagar toda a Academia “${activeContent.title}”?`)) return;
    setSavingContent(true);
    try {
      await deleteFamedContent(activeContent.id);
      addToast?.('Estrutura, aulas e questões apagadas.', 'success', 4500);
      returnToSchedule();
    } catch(error) {
      addToast?.(error?.message || 'Não foi possível apagar o conteúdo.', 'error', 5500);
    } finally {
      setSavingContent(false);
    }
  };
  const removeScheduleContent = async content => {
    if (!isAdmin || !content?.id || removingContentId) return;
    const confirmed = window.confirm(
      `Remover “${content.title}” da FAMED?\n\nIsso apagará a aula da Academia e suas questões. As videoaulas do Portal do Curso não serão alteradas, e o item continuará no cronograma para você poder criá-lo novamente.`
    );
    if (!confirmed) return;
    setRemovingContentId(content.id);
    try {
      await deleteFamedContent(content.id);
      addToast?.('Conteúdo removido da FAMED. As videoaulas do curso foram preservadas.', 'success', 5000);
    } catch(error) {
      addToast?.(error?.message || 'Não foi possível remover o conteúdo da FAMED.', 'error', 5500);
    } finally {
      setRemovingContentId(null);
    }
  };
  const cleanLegacyContent = async () => {
    if (cleaningLegacy || !window.confirm(`Apagar ${legacyContentItems.length} aula(s) do fluxo antigo e todas as imagens vinculadas? As Academias novas não serão afetadas.`)) return;
    setCleaningLegacy(true);
    try {
      const result = await deleteLegacyFamedContent(legacyContentItems);
      addToast?.(`${result.lessons} aula(s) antiga(s) e ${result.assets} imagem(ns) apagadas.`, 'success', 5500);
    } catch(error) {
      addToast?.(error?.message || 'Não foi possível limpar o conteúdo antigo.', 'error', 6500);
    } finally {
      setCleaningLegacy(false);
    }
  };
  const exportWholeSubject = () => {
    if (!activeSubject?.topics?.length) return;
    const boundaries = [];
    let offset = 0;
    activeSubject.topics.forEach(topic => {
      boundaries.push({ title:topic.title, start:offset, end:offset + (topic.subtopics || []).length });
      offset += (topic.subtopics || []).length;
    });
    const merged = {
      title:activeSubject.title,
      subtopics:activeSubject.topics.flatMap(topic => topic.subtopics || []),
      lessonSections:Object.assign({}, ...activeSubject.topics.map((topic, index) => {
        const topicOffset = boundaries[index].start;
        return Object.fromEntries(Object.entries(topic.lessonSections || {}).map(([key,value]) => [Number(key) + topicOffset, value]));
      })),
      fixationQuestions:Object.assign({}, ...activeSubject.topics.map((topic, index) => {
        const topicOffset = boundaries[index].start;
        return Object.fromEntries(Object.entries(topic.fixationQuestions || {}).map(([key,value]) => [Number(key) + topicOffset, value]));
      })),
      answers:Object.assign({}, ...activeSubject.topics.map(topic => topic.answers || {})),
      favorites:activeSubject.topics.flatMap(topic => topic.favorites || []),
      extraBattery:activeSubject.topics.flatMap(topic => topic.extraBattery || []),
      lessonGenerated:true,
      _topicBoundaries:boundaries,
    };
    setAcademiaExportModal({ topic:merged, subject:activeSubject });
  };

  if (activePanel === 'questions' && activeQuestionSet) {
    const blockAnswers = answersByBlock[activeQuestionSet.id] || {};
    const blockFavorites = favoritesByBlock[activeQuestionSet.id] || [];
    const returnPanel = activeQuestionSet.returnPanel || (activeTopic ? 'topic' : 'subject');
    return <div className="desktop-content-limit"><QuestionView
      title={activeQuestionSet.title}
      backLabel={activeQuestionSet.backLabel || (activeTopic ? activeTopic.title : 'FAMED · S5')}
      onBack={()=>{setActiveQuestionSet(null);setActivePanel(returnPanel);}}
      questions={activeQuestionSet.questions}
      answers={blockAnswers}
      favorites={blockFavorites}
      onAnswer={(questionId,answer)=>saveAnswers({...answersByBlock,[activeQuestionSet.id]:{...blockAnswers,[questionId]:answer}})}
      onToggleFavorite={questionId=>saveFavorites({...favoritesByBlock,[activeQuestionSet.id]:blockFavorites.includes(questionId)?blockFavorites.filter(id=>id!==questionId):[...blockFavorites,questionId]})}
      onReset={()=>saveAnswers({...answersByBlock,[activeQuestionSet.id]:{}})}
      darkMode={darkMode}
      displayMode={settings.questionDisplayMode || 'list'}
      onDisplayModeChange={mode=>{const next={...settings,questionDisplayMode:mode};setSettings(next);saveSettings(next);}}
      onGoToAula={()=>setActivePanel(activeTopic?'topic':isAdmin?'subject':'student-topics')}
      goToAulaLabel="Abrir aula da Academia"
    /></div>;
  }

  if (activePanel === 'past-questions' && activeSubject) return <React.Suspense fallback={<div className="py-20 text-center text-yellow-600">Abrindo questões antigas…</div>}><FamedPastQuestionsView
    subject={activeSubject}
    darkMode={darkMode}
    isAdmin={isAdmin}
    saving={savingContent}
    openingSetId={openingQuestionSetId}
    onBack={returnToSchedule}
    onDeleteSet={deletePastQuestionSet}
    onImport={importPastQuestions}
    onOpenSet={openPastQuestionSet}
    addToast={addToast}
  /></React.Suspense>;

  if (activePanel === 'student-topics' && activeContent && activeSubjectWithProgress) {
    const topics = activeSubjectWithProgress.topics || [];
    return <div className="desktop-content-limit famed-topic-menu">
      <button type="button" onClick={returnToSchedule} className="famed-topic-menu__back">← Voltar às aulas</button>
      <header className="mb-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-yellow-600">Academia · {activeContent.discipline}</p>
        <h1 className="mobile-title-lg mobile-wrap font-serif text-3xl font-bold leading-tight">{activeSubjectWithProgress.title}</h1>
        <p className="famed-topic-menu__help">Escolha um tópico. Dentro dele, leia a aula e responda às questões logo abaixo.</p>
      </header>
      <section aria-labelledby="famed-topic-menu-title">
        <h2 id="famed-topic-menu-title" className="mb-3 text-base font-bold">Tópicos da aula</h2>
        <div className="space-y-3">
          {topics.map((topic,index) => {
            const questions = topicFixationQuestions(topic);
            const answered = questions.filter(question => hasCompletedAnswer(topic.answers?.[question.id])).length;
            const completed = questions.length > 0 && answered === questions.length;
            const status = completed ? 'Concluído' : answered > 0 ? `${answered} de ${questions.length} respondidas` : 'Começar';
            return <button key={topic.id} type="button" onClick={()=>{setActiveTopicId(topic.id);setActivePanel('topic');window.scrollTo?.({top:0,behavior:'smooth'});}} className="famed-topic-row">
              <span className={`famed-topic-row__number${completed?' is-complete':''}`}>{String(index+1).padStart(2,'0')}</span>
              <span className="min-w-0 flex-1">
                <strong className="mobile-wrap block text-base leading-snug">{topicDisplayTitle(topic.title,index)}</strong>
                <span className={`famed-topic-row__status${completed?' is-complete':answered>0?' is-progress':''}`}>{status}</span>
              </span>
              <span className="famed-topic-row__action">Abrir →</span>
            </button>;
          })}
        </div>
      </section>
    </div>;
  }

  if (activePanel === 'topic' && activeSubject && activeTopic) return <div className="desktop-content-limit"><React.Suspense fallback={<div className="py-20 text-center text-yellow-600">Abrindo Academia…</div>}><AcademiaTopicView
    topic={activeTopic}
    subject={isAdmin?activeSubject:activeSubjectWithProgress}
    library={[isAdmin?activeSubject:activeSubjectWithProgress]}
    darkMode={darkMode}
    isAdmin={isAdmin}
    canCreateFlashcards={isAdmin}
    canUseAcademia={isAdmin}
    academiaGenerating={academiaGenerating}
    academiaGenProgress={academiaGenProgress}
    academiaTopicAnswers={academiaTopicAnswers}
    setAcademiaTopicAnswers={setAcademiaTopicAnswers}
    academiaExtraBusy={academiaExtraBusy}
    settings={settings}
    setSettings={setSettings}
    saveSettings={saveSettings}
    updateSubject={isAdmin?persistSubject:persistStudentLessonProgress}
    generateAcademiaLesson={generateAcademiaLesson}
    setAcademiaExtraModal={setAcademiaExtraModal}
    setAcademiaRegenModal={openAcademiaRegenModal}
    setAcademiaExportModal={setAcademiaExportModal}
    setDeleteId={handleAcademiaDelete}
    setOpenAnswerModal={setOpenAnswerModal}
    getKey={getKey}
    callWithRotation={callWithRotation}
    parseHtmlText={parseHtmlText}
    onBack={()=>setActivePanel(isAdmin?'subject':'student-topics')}
    reviewQueue={reviewQueue}
    setSrModal={setSrModal}
    trackQuestionAnswered={trackQuestionAnswered}
    onOpenAcademiaQuestions={openQuestions}
    findErrorNotebookReviewsForSource={findErrorNotebookReviewsForSource}
    openErrorNotebookReviewResult={openErrorNotebookReviewResult}
  /></React.Suspense></div>;

  if (activePanel === 'subject' && activeContent && activeSubject) {
    const allReady = activeSubject.topics.length > 0 && activeSubject.topics.every(topic => topic.lessonGenerated && topicFixationQuestions(topic).length > 0);
    const allGenerated = activeSubject.topics.length > 0 && activeSubject.topics.every(topic => topic.lessonGenerated);
    const pendingCount = activeSubject.topics.filter(topic => !topic.lessonGenerated).length;
    const runningHere = bulkGenerateRun.running && bulkGenerateModal?.subjectId === activeSubject.id;
    const bulkActions = [
      {mode:'generate', label:'Gerar tudo', icon:<Zap className="w-4 h-4"/>, count:getBulkGenerateTargets(activeSubject,'generate').length},
      {mode:'extra', label:'Gerar bateria extra de tudo', icon:<PlusIcon className="w-4 h-4"/>, count:getBulkGenerateTargets(activeSubject,'extra').length},
      {divider:true},
      {mode:'regenAll', label:'Regenerar tudo', icon:<RotateCcw className="w-4 h-4"/>, count:getBulkGenerateTargets(activeSubject,'regenAll').length, danger:true},
      {mode:'regenLesson', label:'Regenerar aula', icon:<RotateCcw className="w-4 h-4"/>, count:getBulkGenerateTargets(activeSubject,'regenLesson').length, danger:true},
      {mode:'regenQuestions', label:'Regenerar questões', icon:<RotateCcw className="w-4 h-4"/>, count:getBulkGenerateTargets(activeSubject,'regenQuestions').length, danger:true},
    ];
    const scheduleItem = FAMED_S5_SCHEDULE.find(item => item.id === activeContent.scheduleItemId);
    const progress = subjectProgress(activeSubjectWithProgress || activeSubject);
    const study = getFamedStudyMaterials(activeSubject);
    const flashcardState = getFamedFlashcardState(activeSubject);
    const pastQuestionCount = study.pastQuestionSets.reduce((total,set)=>total + (set.questions || []).length,0);
    return <div className="desktop-content-limit">
      <button type="button" onClick={returnToSchedule} className={`flex items-center gap-2 mb-6 font-bold ${darkMode?'text-gray-400 hover:text-yellow-500':'text-gray-500 hover:text-yellow-600'}`}>← Voltar às aulas</button>
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest opacity-45">FAMED · {activeContent.discipline}</p>
          <h2 className="text-3xl mobile-title-lg mobile-wrap font-serif font-bold text-yellow-600 leading-tight">{activeSubject.title}</h2>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 w-40 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"><div className="bg-yellow-500 h-full" style={{width:`${progress}%`}}/></div>
            <span className="text-sm font-bold text-yellow-600">{progress}% concluído</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isAdmin&&<div className="relative">
            <button type="button" onClick={()=>setBulkActionMenu(current=>current===activeSubject.id?null:activeSubject.id)} disabled={runningHere} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-all disabled:opacity-50 ${darkMode?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50'}`}>{runningHere?<Spinner className="w-4 h-4"/>:<Zap className="w-4 h-4"/>}{runningHere?'Rodando...':'Geração em lote'}<ChevronDown className="w-4 h-4 opacity-60"/></button>
            {bulkActionMenu===activeSubject.id&&<div className={`mobile-safe-action-menu absolute right-0 top-11 z-50 w-72 rounded-xl border shadow-xl overflow-hidden ${darkMode?'bg-gray-900 border-gray-700':'bg-white border-gray-200'}`}>{bulkActions.map((item,index)=>item.divider?<div key={`divider-${index}`} className={`my-1 border-t ${darkMode?'border-gray-700':'border-gray-100'}`}/>:<button type="button" key={item.mode} onClick={()=>openBulkGenerateModal(activeSubject,item.mode)} disabled={!item.count} className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${item.danger?(darkMode?'text-orange-300 hover:bg-orange-900/20':'text-orange-700 hover:bg-orange-50'):(darkMode?'text-gray-200 hover:bg-gray-800':'text-gray-700 hover:bg-gray-50')}`}>{item.icon}<span className="flex-1">{item.label}</span><span className={`rounded-full px-2 py-0.5 text-[10px] ${darkMode?'bg-gray-800 text-gray-400':'bg-gray-100 text-gray-500'}`}>{item.count}</span></button>)}</div>}
          </div>}
          <button type="button" onClick={allGenerated?exportWholeSubject:undefined} disabled={!allGenerated} title={allGenerated?'Exportar toda a pasta':`${pendingCount} aula(s) ainda não gerada(s)`} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-all ${allGenerated?(darkMode?'border-yellow-700 text-yellow-400 hover:bg-yellow-900/20':'border-yellow-400 text-yellow-700 hover:bg-yellow-50'):'opacity-40 cursor-not-allowed '+(darkMode?'border-gray-700 text-gray-500':'border-gray-200 text-gray-400')}`}><Printer className="w-4 h-4"/>{allGenerated?'Exportar pasta':`Exportar (${pendingCount} pendente${pendingCount!==1?'s':''})`}</button>
        </div>
      </div>
      {isAdmin&&<div className={`mb-6 rounded-xl border p-4 ${darkMode?'border-gray-700 bg-gray-900/30':'border-gray-200 bg-gray-50'}`}><div className="flex flex-wrap items-center gap-2"><button type="button" disabled={savingContent||(!activeContent.published&&!allReady)} onClick={togglePublished} className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40 ${activeContent.published?'bg-gray-600':'bg-green-600 hover:bg-green-700'}`}>{activeContent.published?'Retirar dos alunos':'Publicar para alunos'}</button><button type="button" onClick={()=>scheduleItem&&startFamedAcademiaCreation({...scheduleItem,famedStudy:activeSubject.famedStudy})} className="rounded-xl border border-yellow-500 px-4 py-2.5 text-sm font-bold text-yellow-600">Refazer estrutura</button><button type="button" disabled={savingContent} onClick={removeContent} className="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-bold text-red-600">Apagar tudo</button></div>{!allReady&&<p className="mt-3 text-xs text-yellow-600">Gere a aula e as questões de fixação de todos os tópicos antes de publicar.</p>}</div>}
      {(isAdmin||pastQuestionCount>0||flashcardState.fresh)&&<section className="mb-7 grid gap-3 md:grid-cols-2">
        {(isAdmin||pastQuestionCount>0)&&<button type="button" onClick={()=>openPastQuestions(activeContent)} className={`rounded-2xl border p-5 text-left transition-colors ${darkMode?'border-gray-700 bg-gray-900/40 hover:border-yellow-700':'border-gray-200 bg-white hover:border-yellow-400'}`}>
          <span className="text-xs font-bold uppercase tracking-widest text-yellow-600">Provas anteriores</span>
          <strong className="mt-2 block font-serif text-lg">Questões antigas</strong>
          <span className="mt-1 block text-sm opacity-55">{pastQuestionCount ? `${pastQuestionCount} questões importadas` : 'Adicione o primeiro bloco de questões'}</span>
        </button>}
        {(isAdmin||flashcardState.fresh)&&<div className={`overflow-hidden rounded-2xl border ${darkMode?'border-gray-700 bg-gray-900/40':'border-gray-200 bg-white'}`}>
          <button type="button" disabled={generatingFlashcardsId===activeContent.id||(!flashcardState.prerequisitesMet&&!flashcardState.fresh)} onClick={()=>openOrGenerateEssentialFlashcards(activeContent,'subject')} className={`w-full p-5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${darkMode?'hover:bg-gray-900/70':'hover:bg-yellow-50/40'}`}>
            <span className="text-xs font-bold uppercase tracking-widest text-yellow-600">Revisão ativa</span>
            <strong className="mt-2 block font-serif text-lg">{generatingFlashcardsId===activeContent.id?'Criando flashcards…':flashcardState.stale?'Atualizar flashcards':flashcardState.fresh?`${flashcardState.flashcardCount} flashcards essenciais`:'Criar flashcards essenciais'}</strong>
            <span className="mt-1 block text-sm opacity-55">{!flashcardState.lessonReady?'Disponível após gerar todas as aulas':!flashcardState.pastQuestionCount?'Disponível após adicionar questões antigas':flashcardState.stale?'A aula ou as questões mudaram; gere uma seleção atualizada':flashcardState.fresh?'Selecionados a partir da aula e das provas antigas':'A IA decidirá quantos cartões essenciais este material exige'}</span>
          </button>
          {isAdmin&&study.essentialFlashcards.length>0&&<div>
            <button type="button" onClick={()=>exportEssentialFlashcardsAudit(activeContent)} className={`w-full border-t px-5 py-2.5 text-left text-xs font-bold text-yellow-600 ${darkMode?'border-gray-700 hover:bg-yellow-950/20':'border-gray-100 hover:bg-yellow-50'}`}>Exportar para revisar o prompt</button>
            <button type="button" disabled={savingContent} onClick={()=>deleteEssentialFlashcards(activeContent)} className={`w-full border-t px-5 py-2.5 text-left text-xs font-bold text-red-600 disabled:opacity-40 ${darkMode?'border-gray-700 hover:bg-red-950/25':'border-gray-100 hover:bg-red-50'}`}>Apagar flashcards e refazer</button>
          </div>}
        </div>}
      </section>}
      <React.Suspense fallback={<div className="py-12 text-center text-yellow-600">Abrindo tópicos…</div>}><AdminStudyMapTopicList subject={activeSubjectWithProgress || activeSubject} darkMode={darkMode} getTopicStudyPlan={getTopicStudyPlan} onOpenTopic={topic=>{setActiveTopicId(topic.id);setActivePanel('topic');window.scrollTo?.({top:0,behavior:'smooth'});}}/></React.Suspense>
    </div>;
  }

  return <div className="desktop-content-limit famed-portal space-y-5 md:space-y-6">
    <button type="button" onClick={()=>setView('library')} className={`famed-back inline-flex min-h-[44px] items-center gap-2 text-sm font-bold ${darkMode?'text-gray-400 hover:text-yellow-400':'text-gray-600 hover:text-yellow-700'}`}>← Início</button>
    <section className="app-hero famed-hero rounded-2xl px-5 py-5 md:px-8 md:py-7">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-yellow-600">FAMED · {FAMED_PROGRAM.curriculum}</p>
      <h1 className="mt-2 font-serif text-3xl font-bold leading-tight md:text-4xl">Semestre 5</h1>
      <p className={`mt-2 text-sm md:text-base ${darkMode?'text-gray-400':'text-gray-600'}`}>Cardiologia e Pneumologia</p>
    </section>
    <section aria-label="Semestres" className="app-card famed-semesters rounded-2xl p-2 md:p-3"><div className="grid grid-cols-4 gap-2">{FAMED_PROGRAM.semesters.map(semester=><button key={semester.id} type="button" disabled={!semester.available} aria-current={semester.available?'page':undefined} className={`famed-semester flex min-h-[60px] w-full flex-col items-center justify-center rounded-xl border px-2 text-center md:min-h-[68px] ${semester.available?(darkMode?'border-yellow-800 bg-yellow-900/10 text-yellow-300':'border-yellow-400 bg-yellow-50 text-yellow-800'):(darkMode?'border-gray-800 bg-transparent text-gray-600':'border-gray-100 bg-gray-50 text-gray-300')} disabled:cursor-not-allowed`}><strong className="text-base md:text-lg">{semester.label}</strong><span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide">{semester.available?'Atual':'Em breve'}</span></button>)}</div></section>
    {contentError&&isAdmin&&<p className={`rounded-xl border px-4 py-3 text-sm ${darkMode?'border-red-900 bg-red-900 bg-opacity-20 text-red-200':'border-red-200 bg-red-50 text-red-800'}`}>{contentError}</p>}
    {isAdmin&&legacyContentItems.length>0&&<section className={`rounded-2xl border p-4 md:p-5 ${darkMode?'border-red-900 bg-red-950/20':'border-red-200 bg-red-50'}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-red-600">Limpeza do fluxo antigo</p><p className={`mt-1 text-sm ${darkMode?'text-gray-300':'text-gray-700'}`}>{legacyContentItems.length} conteúdo(s) antigo(s) estão ocultos e prontos para exclusão.</p></div><button type="button" disabled={cleaningLegacy} onClick={cleanLegacyContent} className="min-h-[44px] rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40">{cleaningLegacy?'Apagando…':'Apagar conteúdo antigo'}</button></div></section>}
    <FamedScheduleView darkMode={darkMode} isAdmin={isAdmin} contentByScheduleId={contentByScheduleId} contentLoading={contentLoading}
      courseCatalogReady={!!appliedVideoaulasData} courseLessonsByScheduleId={courseLessonsByScheduleId} watchedAulas={watchedAulas} onOpenCourseLesson={openCourseLesson}
      onExportCourseCatalog={exportCourseCatalog}
      removingContentId={removingContentId} onRemoveContent={removeScheduleContent}
      generatingFlashcardsId={generatingFlashcardsId}
      onOpenLesson={openSubject} onOpenPastQuestions={openPastQuestions}
      onOpenFlashcards={content=>openOrGenerateEssentialFlashcards(content,'schedule')} onCreate={startFamedAcademiaCreation}/>
  </div>;
}
