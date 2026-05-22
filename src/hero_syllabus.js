export const HERO_WEIGHT_FIELDS = [
  { key:'practicalRelevance', label:'Relevância prática' },
  { key:'prevalence', label:'Frequência' },
  { key:'clinicalRisk', label:'Risco se errar' },
  { key:'examYield', label:'Cobrança em prova' },
  { key:'structuralValue', label:'Valor estrutural' },
  { key:'difficulty', label:'Dificuldade' },
];

export const HERO_SYLLABUS_VERSION = 'topic-map-v3';

const w = (practicalRelevance, prevalence, clinicalRisk, examYield, structuralValue, difficulty) => ({
  practicalRelevance,
  prevalence,
  clinicalRisk,
  examYield,
  structuralValue,
  difficulty,
});

const topic = (id, title, weights, order, prerequisites = []) => ({
  id,
  title,
  weights,
  order,
  prerequisites,
});

export const HERO_SYLLABUS = [
  {
    id:'fundamentos_clinicos',
    title:'Fundamentos do médico bom de verdade',
    topics:[
      topic('raciocinio_clinico', 'Raciocínio clínico e tomada de decisão', w(5,5,5,5,5,3), 1),
      topic('anamnese_exame_fisico', 'Anamnese, exame físico e sinais vitais', w(5,5,5,5,5,2), 2),
      topic('exames_basicos', 'Interpretação de exames básicos', w(5,5,4,5,5,3), 3),
      topic('prescricao_segura', 'Prescrição segura e iatrogenia comum', w(5,5,5,4,5,3), 4),
      topic('urgencia_abordagem_inicial', 'Abordagem inicial do paciente grave', w(5,4,5,5,5,4), 5),
    ],
  },
  {
    id:'atencao_primaria',
    title:'Atenção primária e vida real',
    topics:[
      topic('has', 'Hipertensão arterial sistêmica', w(5,5,4,5,5,3), 6, ['anamnese_exame_fisico']),
      topic('diabetes', 'Diabetes mellitus', w(5,5,4,5,5,3), 7, ['exames_basicos']),
      topic('queixas_comuns_adulto', 'Queixas comuns do adulto', w(5,5,4,4,4,3), 8, ['anamnese_exame_fisico']),
      topic('rastreamento_prevencao', 'Rastreamento, prevenção e vacinação do adulto', w(5,5,4,5,4,3), 9),
      topic('saude_mental_basica', 'Saúde mental comum e risco suicida', w(5,5,5,5,4,3), 10),
    ],
  },
  {
    id:'infectologia',
    title:'Infectologia prática',
    topics:[
      topic('febre_infeccao_comum', 'Febre e infecções comuns', w(5,5,4,5,5,3), 11, ['exames_basicos']),
      topic('antibioticos_praticos', 'Antibióticos na prática clínica', w(5,5,4,5,5,4), 12, ['febre_infeccao_comum']),
      topic('itu_pneumonia_pele', 'ITU, pneumonia e infecções de pele', w(5,5,4,5,4,3), 13, ['antibioticos_praticos']),
      topic('sepse', 'Sepse', w(5,4,5,5,5,4), 14, ['urgencia_abordagem_inicial','febre_infeccao_comum']),
      topic('arboviroses_tb_hiv', 'Arboviroses, tuberculose e HIV', w(5,4,5,5,4,4), 28, ['febre_infeccao_comum']),
    ],
  },
  {
    id:'cardiologia',
    title:'Cardiologia',
    topics:[
      topic('dor_toracica_sca', 'Dor torácica e síndrome coronariana', w(5,4,5,5,5,4), 15, ['urgencia_abordagem_inicial']),
      topic('insuficiencia_cardiaca', 'Insuficiência cardíaca', w(5,4,5,5,5,4), 16, ['exames_basicos']),
      topic('arritmias', 'Arritmias frequentes e instáveis', w(5,4,5,5,4,4), 22, ['urgencia_abordagem_inicial']),
      topic('risco_cardiovascular', 'Risco cardiovascular e prevenção', w(5,5,4,5,4,3), 24, ['has','diabetes']),
    ],
  },
  {
    id:'pneumologia',
    title:'Pneumologia',
    topics:[
      topic('asma_dpoc', 'Asma e DPOC', w(5,5,5,5,4,3), 17, ['anamnese_exame_fisico']),
      topic('pneumonia', 'Pneumonia', w(5,5,4,5,4,3), 18, ['antibioticos_praticos']),
      topic('dispneia_insuficiencia_respiratoria', 'Dispneia e insuficiência respiratória', w(5,4,5,5,5,4), 25, ['urgencia_abordagem_inicial']),
      topic('gasometria_disturbios_acido_base', 'Gasometria e distúrbios ácido-base', w(5,4,5,5,5,5), 45, ['exames_basicos','dispneia_insuficiencia_respiratoria']),
    ],
  },
  {
    id:'gastro_hepato',
    title:'Gastroenterologia e hepatologia',
    topics:[
      topic('dor_abdominal', 'Dor abdominal e abdome agudo', w(5,5,5,5,5,4), 19, ['anamnese_exame_fisico']),
      topic('diarreia_vomitos_desidratacao', 'Diarreia, vômitos e desidratação', w(5,5,4,5,4,3), 20, ['exames_basicos']),
      topic('hemorragia_digestiva', 'Hemorragia digestiva', w(5,3,5,5,4,4), 30, ['urgencia_abordagem_inicial']),
      topic('hepatites_cirrose', 'Hepatites e cirrose', w(5,3,5,5,4,4), 36, ['exames_basicos']),
    ],
  },
  {
    id:'nefrologia',
    title:'Nefrologia',
    topics:[
      topic('funcao_renal_ira_drc', 'Função renal, injúria renal aguda e DRC', w(5,4,5,5,5,4), 21, ['exames_basicos']),
      topic('disturbios_hidroeletroliticos', 'Distúrbios hidroeletrolíticos', w(5,4,5,5,5,5), 34, ['funcao_renal_ira_drc']),
      topic('drc_complicacoes', 'Complicações da doença renal crônica', w(5,3,4,5,4,4), 40, ['funcao_renal_ira_drc']),
    ],
  },
  {
    id:'neurologia',
    title:'Neurologia',
    topics:[
      topic('cefaleia_tontura', 'Cefaleia, tontura e sinais de alarme', w(5,5,5,5,4,3), 23, ['anamnese_exame_fisico']),
      topic('avc', 'AVC', w(5,4,5,5,5,4), 26, ['urgencia_abordagem_inicial']),
      topic('convulsoes', 'Crises convulsivas', w(5,3,5,5,4,4), 31, ['urgencia_abordagem_inicial']),
    ],
  },
  {
    id:'gineco_obstetricia',
    title:'Ginecologia e obstetrícia',
    topics:[
      topic('contracepcao', 'Contracepção e saúde sexual', w(5,5,3,5,4,3), 27),
      topic('pre_natal', 'Pré-natal e gestação de baixo risco', w(5,5,4,5,4,3), 29, ['exames_basicos']),
      topic('sangramento_gineco_obstetrico', 'Sangramentos ginecológicos e obstétricos', w(5,4,5,5,4,4), 35, ['urgencia_abordagem_inicial']),
      topic('infeccoes_ginecologicas', 'Infecções ginecológicas comuns', w(5,5,3,5,3,3), 38, ['antibioticos_praticos']),
    ],
  },
  {
    id:'pediatria',
    title:'Pediatria',
    topics:[
      topic('puericultura_vacinas', 'Puericultura, crescimento e vacinas', w(5,5,4,5,4,3), 32),
      topic('febre_pediatrica', 'Febre e urgências pediátricas comuns', w(5,4,5,5,4,4), 33, ['febre_infeccao_comum']),
      topic('aleitamento_alimentacao', 'Aleitamento e alimentação infantil', w(5,5,3,5,3,3), 41),
    ],
  },
  {
    id:'hematologia',
    title:'Hematologia',
    topics:[
      topic('anemias', 'Anemias', w(5,4,4,5,5,4), 37, ['exames_basicos']),
      topic('sangramentos_trombose', 'Sangramentos, trombose e anticoagulação', w(5,4,5,5,4,4), 42, ['exames_basicos']),
      topic('neutropenia_febril_onco', 'Neutropenia febril e urgências onco-hematológicas', w(5,2,5,5,4,4), 50, ['febre_infeccao_comum']),
    ],
  },
  {
    id:'cirurgia_trauma',
    title:'Cirurgia e trauma',
    topics:[
      topic('trauma', 'Trauma e abordagem ABCDE', w(5,3,5,5,5,4), 39, ['urgencia_abordagem_inicial']),
      topic('perioperatorio', 'Perioperatório e risco cirúrgico', w(5,3,4,4,4,4), 46, ['exames_basicos']),
      topic('infeccao_cirurgica', 'Infecção cirúrgica e feridas', w(5,3,4,4,3,3), 48, ['antibioticos_praticos']),
    ],
  },
  {
    id:'musculoesqueletico_reumato_dermato',
    title:'Musculoesquelético, reumato e dermato',
    topics:[
      topic('dor_lombar_articular', 'Dor lombar, artralgia e queixas musculoesqueléticas', w(5,5,4,5,4,3), 43, ['anamnese_exame_fisico']),
      topic('artrites_colagenoses', 'Artrites, lúpus e doenças autoimunes', w(4,3,4,5,4,4), 47, ['exames_basicos']),
      topic('pele_lesoes_comuns', 'Lesões comuns de pele', w(4,5,3,4,3,3), 49, ['anamnese_exame_fisico']),
    ],
  },
  {
    id:'preventiva_epidemiologia',
    title:'Preventiva e epidemiologia',
    topics:[
      topic('sus_aps', 'SUS, APS e organização do cuidado', w(5,4,2,5,3,3), 44),
      topic('epidemiologia_bioestatistica', 'Epidemiologia e bioestatística', w(4,3,2,5,5,4), 51),
    ],
  },
];

export const flattenHeroSyllabus = (syllabus = HERO_SYLLABUS) => syllabus.flatMap(area =>
  (area.topics || []).map(item => ({
    ...item,
    areaId: area.id,
    areaTitle: area.title,
    topicId: item.id,
    topicTitle: item.title,
    targetType:'topic',
  }))
);

export const getHeroSyllabusStats = (syllabus = HERO_SYLLABUS) => {
  const topics = flattenHeroSyllabus(syllabus);
  return {
    areaCount: syllabus.length,
    topicCount: topics.length,
    conceptCount: topics.length,
  };
};

export const scoreHeroConcept = (concept, progress = {}, now = Date.now()) => {
  const weights = concept.weights || {};
  const state = progress?.concepts?.[concept.id] || {};
  const prerequisiteStates = (concept.prerequisites || []).map(id => progress?.concepts?.[id] || {});
  const hasWeakPrerequisite = prerequisiteStates.some(s => (Number(s.mastery) || 0) < 35 && !s.lastCompletedAt);
  const base =
    (Number(weights.practicalRelevance) || 0) * 2.2 +
    (Number(weights.prevalence) || 0) * 1.8 +
    (Number(weights.structuralValue) || 0) * 1.6 +
    (Number(weights.clinicalRisk) || 0) * 1.4 +
    (Number(weights.examYield) || 0) * 1.0 +
    (Number(weights.difficulty) || 0) * 0.2;
  const orderPenalty = Math.max(0, (Number(concept.order) || 99) - 1) * 0.42;
  const mastery = Math.max(0, Math.min(100, Number(state.mastery) || 0));
  const misses = Number(state.misses) || 0;
  const uncertainty = Number(state.uncertainty) || 0;
  const lastSeenAt = Number(state.lastSeenAt) || 0;
  const packagesCompleted = Number(state.packagesCompleted) || 0;
  const daysIdle = lastSeenAt ? (now - lastSeenAt) / 86400000 : 999;
  const unseenBoost = lastSeenAt ? 0 : 5;
  const dueBoost = state.reviewDueAt && Number(state.reviewDueAt) <= now ? 9 : 0;
  const weakBoost = misses * 2.4 + uncertainty * 1.3;
  const recencyPenalty = daysIdle < 2 ? 5 : daysIdle < 5 ? 2 : 0;
  const cooldownPenalty = state.cooldownUntil && Number(state.cooldownUntil) > now ? 40 : 0;
  const masteryPenalty = mastery * 0.08 + packagesCompleted * 3;
  const prerequisitePenalty = hasWeakPrerequisite ? 18 : 0;
  return Math.max(0, Math.round((base + unseenBoost + dueBoost + weakBoost - orderPenalty - recencyPenalty - cooldownPenalty - masteryPenalty - prerequisitePenalty) * 10) / 10);
};

export const buildHeroQueue = (progress = {}, options = {}) => {
  const now = options.now || Date.now();
  const limit = options.limit || 24;
  return flattenHeroSyllabus(options.syllabus || HERO_SYLLABUS)
    .map(concept => {
      const score = scoreHeroConcept(concept, progress, now);
      const state = progress?.concepts?.[concept.id] || {};
      const reason = state.misses > 0
        ? 'lacuna detectada'
        : state.uncertainty > 0
          ? 'incerteza prévia'
          : state.lastSeenAt
            ? 'revisão por intervalo'
            : 'ordem de formação';
      return { ...concept, score, reason };
    })
    .sort((a, b) => b.score - a.score || (a.order || 99) - (b.order || 99) || a.title.localeCompare(b.title, 'pt'))
    .slice(0, limit);
};
