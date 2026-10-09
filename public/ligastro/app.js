const MATERIAL_ID = 'ligastro-gastro-s2-2026';
const PROGRESS_KEY = 'ligastro-gastro-s2-progress-v1';
const THEME_KEY = 'ligastro-theme-v1';
const TOTAL_QUESTIONS = 160;

const emptyProgress = () => ({
  schemaVersion:1,
  materialId:MATERIAL_ID,
  exam:{ answers:{},graded:false },
  study:{ answers:{} },
});

const readProgress = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
    if (!parsed || parsed.materialId !== MATERIAL_ID) return emptyProgress();
    return {
      ...emptyProgress(),
      ...parsed,
      exam:{ answers:{ ...(parsed.exam?.answers || {}) },graded:!!parsed.exam?.graded },
      study:{ answers:{ ...(parsed.study?.answers || {}) } },
    };
  } catch {
    return emptyProgress();
  }
};

let progress = readProgress();
const saveProgress = () => {
  try { localStorage.setItem(PROGRESS_KEY,JSON.stringify(progress)); } catch {}
};

const applyTheme = theme => {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = nextTheme;
  document.querySelectorAll('[data-theme-toggle]').forEach(button => {
    const isDark = nextTheme === 'dark';
    button.textContent = isDark ? 'Tema claro' : 'Tema escuro';
    button.setAttribute('aria-pressed',String(isDark));
    button.setAttribute('aria-label',isDark ? 'Ativar tema claro' : 'Ativar tema escuro');
  });
};

applyTheme(document.documentElement.dataset.theme);
document.addEventListener('click',event => {
  if (!event.target.closest('[data-theme-toggle]')) return;
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  try { localStorage.setItem(THEME_KEY,nextTheme); } catch {}
});

const answerCount = mode => Object.keys(progress[mode]?.answers || {}).length;
const setProgressBar = (container,answered,total=TOTAL_QUESTIONS) => {
  const percentage = total ? Math.min(100,Math.round(answered * 100 / total)) : 0;
  const bar = container?.querySelector('[data-progress-bar]');
  if (bar) bar.style.width = `${percentage}%`;
};

const initializeLanding = () => {
  document.querySelectorAll('[data-progress-card]').forEach(card => {
    const mode = card.dataset.progressCard;
    const answered = answerCount(mode);
    const label = card.querySelector('[data-progress-label]');
    if (label) label.textContent = `${answered} de ${TOTAL_QUESTIONS}`;
    setProgressBar(card,answered);
  });
};

const optionLetter = option => option?.querySelector('.option-letter')?.textContent?.trim() || '';
const selectedOption = question => question.querySelector('[data-option].is-selected');
const feedbackFor = question => question.querySelector('[data-feedback]');
const answerFor = question => question.querySelector('[data-answer]');
const formatTopicTitle = title => String(title || '').replace(/^Fisiologia\s*-\s*/,'Fisiologia: ');

const gradeQuestion = question => {
  const selected = selectedOption(question);
  const options = Array.from(question.querySelectorAll('[data-option]'));
  options.forEach(option => {
    option.disabled = true;
    option.classList.toggle('is-correct',option.dataset.correct === 'true');
    option.classList.toggle('is-incorrect',option === selected && option.dataset.correct !== 'true');
  });
  const answer = answerFor(question);
  if (answer) answer.hidden = false;
  const feedback = feedbackFor(question);
  if (selected) {
    const correct = selected.dataset.correct === 'true';
    feedback.textContent = correct ? 'Resposta correta.' : 'Resposta incorreta. Confira a explicação abaixo.';
    feedback.className = `interactive-feedback ${correct ? 'correct' : 'incorrect'}`;
    question.dataset.result = correct ? 'correct' : 'incorrect';
  } else {
    feedback.textContent = 'Questão não respondida.';
    feedback.className = 'interactive-feedback';
    question.dataset.result = 'blank';
  }
  question.dataset.graded = 'true';
};

const restoreQuestion = (question,modeState) => {
  const saved = modeState.answers[question.dataset.questionId];
  if (saved?.letter) {
    const option = Array.from(question.querySelectorAll('[data-option]')).find(item => optionLetter(item) === saved.letter);
    if (option) {
      option.classList.add('is-selected');
      option.setAttribute('aria-pressed','true');
    }
  }
  if (question.dataset.mode === 'study' && saved?.letter) gradeQuestion(question);
  if (question.dataset.mode === 'exam' && modeState.graded) gradeQuestion(question);
};

const createQuestionElement = (questionData,displayNumber,modeState,mode) => {
  const article = document.createElement('article');
  article.className = 'question-card interactive-question';
  article.dataset.interactiveQuestion = '';
  article.dataset.questionId = questionData.id;
  article.dataset.mode = mode;
  article.id = `question-${questionData.id}`;
  article.innerHTML = questionData.html;
  const index = article.querySelector('.question-index');
  if (index) index.textContent = String(displayNumber);
  const answerTitle = article.querySelector('.answer-title');
  if (answerTitle) answerTitle.textContent = answerTitle.textContent.replace(/\d+\s*$/,String(displayNumber));
  restoreQuestion(article,modeState);
  return article;
};

const initializeQuestions = async () => {
  const params = new URLSearchParams(location.search);
  const pageMode = params.get('modo') === 'simulado' ? 'simulado' : 'temas';
  const storageMode = pageMode === 'simulado' ? 'exam' : 'study';
  const questionMode = pageMode === 'simulado' ? 'exam' : 'study';
  const modeState = () => progress[storageMode];
  const elements = {
    loading:document.querySelector('[data-loading]'),
    list:document.querySelector('[data-question-list]'),
    activeHeader:document.querySelector('[data-topic-active-header]'),
    topicTitle:document.querySelector('[data-topic-title]'),
    topicMeta:document.querySelector('[data-topic-meta]'),
    topicFooter:document.querySelector('[data-topic-footer]'),
    nextTopic:document.querySelector('[data-next-topic]'),
    grade:document.querySelector('[data-grade-exam]'),
    reset:document.querySelector('[data-reset-progress]'),
    score:document.querySelector('[data-score]'),
    toolbarTitle:document.querySelector('[data-toolbar-title]'),
    progressText:document.querySelector('[data-progress-text]'),
    toolbar:document.querySelector('.study-toolbar'),
  };
  let material;
  try {
    const response = await fetch('./data/questions.json',{ cache:'no-store' });
    if (!response.ok) throw new Error(`Falha ${response.status}`);
    material = await response.json();
    if (material.materialId !== MATERIAL_ID || material.total !== TOTAL_QUESTIONS) throw new Error('Versão do material incompatível.');
  } catch {
    elements.loading.className = 'error-panel';
    elements.loading.textContent = 'Não foi possível carregar as questões. Atualize a página e tente novamente.';
    return;
  }
  elements.loading.hidden = true;

  const title = document.querySelector('[data-mode-title]');
  const eyebrow = document.querySelector('[data-mode-eyebrow]');
  const description = document.querySelector('[data-mode-description]');
  if (pageMode === 'simulado') {
    document.title = 'Modo simulado — Digestório S2';
    eyebrow.hidden = false;
    eyebrow.textContent = 'Experiência de prova';
    title.textContent = 'Modo simulado';
    description.textContent = 'As 160 questões aparecem em sequência. Marque suas respostas e corrija o simulado quando terminar.';
    elements.grade.hidden = false;
  } else {
    document.title = 'Estudo por tema — Digestório S2';
    eyebrow.hidden = true;
    title.textContent = 'Estudo por tema';
    description.textContent = 'Escolha um bloco e receba a correção logo após responder cada questão.';
    elements.toolbarTitle.textContent = 'Progresso geral';
  }

  const updateProgressUi = () => {
    const answered = answerCount(storageMode);
    elements.progressText.textContent = `${answered} de ${material.total} respondidas`;
    setProgressBar(elements.toolbar,answered,material.total);
    if (pageMode === 'simulado' && modeState().graded) {
      const correct = Object.values(modeState().answers).filter(answer => answer?.correct).length;
      elements.score.textContent = `${correct} de ${material.total} corretas · ${answered} respondidas`;
      elements.grade.textContent = 'Simulado corrigido';
      elements.grade.disabled = true;
    } else {
      elements.score.textContent = '';
      if (pageMode === 'simulado') {
        elements.grade.textContent = 'Corrigir simulado';
        elements.grade.disabled = false;
      }
    }
  };

  const renderQuestions = (ids,displayNumberFor) => {
    const fragment = document.createDocumentFragment();
    ids.forEach((id,index) => {
      const questionData = material.questions[id];
      fragment.appendChild(createQuestionElement(questionData,displayNumberFor(questionData,index),modeState(),questionMode));
    });
    elements.list.replaceChildren(fragment);
    updateProgressUi();
  };

  const currentTopic = () => {
    const topicId = decodeURIComponent(location.hash.replace(/^#/,''));
    return material.topics.find(topic => topic.id === topicId) || null;
  };

  const renderTopic = topic => {
    elements.activeHeader.hidden = false;
    elements.topicFooter.hidden = false;
    elements.topicTitle.textContent = formatTopicTitle(topic.title);
    const answered = topic.questionIds.filter(id => modeState().answers[id]).length;
    elements.topicMeta.textContent = `${answered} de ${topic.questionIds.length} questões respondidas`;
    const topicIndex = material.topics.findIndex(item => item.id === topic.id);
    const next = material.topics[topicIndex+1];
    elements.nextTopic.hidden = !next;
    if (next) {
      elements.nextTopic.dataset.nextTopic = next.id;
      elements.nextTopic.textContent = `Próximo: ${formatTopicTitle(next.title)}`;
    }
    renderQuestions(topic.questionIds,question => question.number);
  };

  const renderTopicRoute = () => {
    const topic = currentTopic();
    if (!topic) {
      location.replace('/ligastro');
      return false;
    }
    renderTopic(topic);
    return true;
  };

  if (pageMode === 'simulado') renderQuestions(material.examOrder,(_,index) => index+1);
  else if (!renderTopicRoute()) return;

  elements.list.addEventListener('click',event => {
    const option = event.target.closest('[data-option]');
    if (!option) return;
    const question = option.closest('[data-interactive-question]');
    if (!question || question.dataset.graded === 'true') return;
    question.querySelectorAll('[data-option]').forEach(item => {
      item.classList.remove('is-selected');
      item.setAttribute('aria-pressed','false');
    });
    option.classList.add('is-selected');
    option.setAttribute('aria-pressed','true');
    const id = question.dataset.questionId;
    modeState().answers[id] = { letter:optionLetter(option),correct:option.dataset.correct === 'true' };
    saveProgress();
    if (questionMode === 'study') gradeQuestion(question);
    updateProgressUi();
    if (pageMode === 'temas') {
      const topic = currentTopic();
      if (topic) {
        const answered = topic.questionIds.filter(questionId => modeState().answers[questionId]).length;
        elements.topicMeta.textContent = `${answered} de ${topic.questionIds.length} questões respondidas`;
      }
    }
  });

  elements.grade.addEventListener('click',() => {
    if (pageMode !== 'simulado' || modeState().graded) return;
    modeState().graded = true;
    saveProgress();
    elements.list.querySelectorAll('[data-interactive-question]').forEach(gradeQuestion);
    updateProgressUi();
    window.scrollTo({ top:Math.max(0,elements.toolbar.offsetTop-12),behavior:'smooth' });
  });

  elements.reset.addEventListener('click',() => {
    const label = pageMode === 'simulado' ? 'do simulado' : 'do estudo por tema';
    if (!window.confirm(`Apagar todo o progresso ${label} salvo neste navegador?`)) return;
    progress[storageMode] = storageMode === 'exam' ? { answers:{},graded:false } : { answers:{} };
    saveProgress();
    if (pageMode === 'simulado') renderQuestions(material.examOrder,(_,index) => index+1);
    else renderTopicRoute();
  });

  if (pageMode === 'temas') {
    elements.nextTopic.addEventListener('click',() => {
      const topicId = elements.nextTopic.dataset.nextTopic;
      if (!topicId) return;
      history.pushState(null,'',`${location.pathname}${location.search}#${encodeURIComponent(topicId)}`);
      renderTopicRoute();
      window.scrollTo({ top:0,behavior:'smooth' });
    });
    window.addEventListener('popstate',renderTopicRoute);
  }
};

if (document.body.dataset.page === 'landing') initializeLanding();
if (document.body.dataset.page === 'questions') initializeQuestions();
