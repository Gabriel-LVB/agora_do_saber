// Vínculos revisados entre cada item da FAMED e as aulas reais do curso.
// Preencha apenas com IDs estáveis obtidos pelo export administrativo da FAMED.
// O mapa vazio é intencional: a interface nunca deve inferir cobertura por palavras.
export const FAMED_COURSE_LESSON_MAP = Object.freeze({
  schemaVersion:2,
  catalogSnapshot:Object.freeze({
    exportedAt:'2026-08-01T20:53:55.857Z',
    file:'data/famed/course-catalog.snapshot.json',
    lessons:488,
  }),
  links:Object.freeze({
    'cardio-valvopatias':[
      '58aaf6c5-53a0-4197-af95-b6de18262df6',
      'ba84f94a-9100-4e46-a9ee-453d58be0d95',
      '46d27f87-5340-4dd2-8d4e-558cb72c5b52',
      '92155e66-2c62-4247-ae5a-8a042eccc662',
      '2222b29e-a610-45bf-b4d4-a77cac748d3f',
      '65d13056-0f35-472c-a55c-bcc4fa0a18bc',
    ],
    'cardio-doenca-coronaria-cronica':[
      'b0536e19-99b7-4df4-afc4-2057aa01040a',
    ],
    'cardio-has':[
      'c8598a59-62ef-4e2a-b1bb-20a82849b64a',
      '395cedd8-ab11-4082-9d74-24663c9cd544',
      'aeca635a-280a-4006-9a5e-5608bb572b86',
    ],
    // A mesma aula do curso cobre oclusão (com supra) e suboclusão (sem supra).
    'cardio-sca-com-supra':[
      '0dd02535-8c10-4ab4-84a5-c957f7659b55',
    ],
    'cardio-sca-sem-supra':[
      '0dd02535-8c10-4ab4-84a5-c957f7659b55',
    ],
    'cardio-ic-cronica':[
      'efcbd5c4-20cc-432c-b50f-9271c57f7a11',
      'ddd47bd6-2553-4387-9ed7-6525fc754457',
      'a46a260e-0668-4338-a1da-ebf2f4328e7e',
      'b583b5bc-0f56-45a0-b0c2-7359a6c9f2c6',
      '10136d75-9fbb-4ba1-953a-a7a9c852fd29',
      '3ce07b2e-2c19-4122-9bc1-477fe1242cfd',
    ],
    'cardio-ic-aguda':[
      '4119e4b5-c068-453e-ba4a-60d6e65f3b61',
      'f8802165-c87a-4d4c-9aea-0cbc90000bc2',
    ],
    'pneumo-dpoc-asma':[
      '432ff5aa-ff14-428e-a4b3-0d697e706afa',
      'ea94d27a-44bf-49a8-aab6-d5cb33ad77c1',
    ],
    'pneumo-tuberculose':[
      '188304eb-1de5-4960-a13d-8edc41e106d8',
      '26455c04-fdad-447d-bdf7-ca073365716c',
      '6b51fa5f-85ec-4436-befd-8e8483296447',
      'fc28a26a-3ec0-4166-b773-a023ef2c0ebd',
      '01d066d6-5c6e-4900-bc3c-887fbf760108',
    ],
    'pneumo-pneumonias-tep':[
      'cacc6260-9664-4108-a94e-f97914875611',
      '8d255d4e-e065-4d8d-96c5-2427711c5074',
      '96792db4-66ef-4bf6-ad35-b491f110089e',
    ],
    'pneumo-intersticial-espirometria':[
      '432ff5aa-ff14-428e-a4b3-0d697e706afa',
      'b10d8101-ce8c-4234-989c-746ef405077a',
    ],
    'pneumo-neoplasia-nodulo':[
      '185833b6-9925-4483-9e9b-10dc7e76a675',
      '234d70fd-a3ae-45b4-b8b4-e7262c24e826',
    ],
    'pneumo-doencas-pleura':[
      '57646f0a-b9c7-4795-80ef-81680e51a265',
    ],
    'abs-alojamento-semiologia-neonatal':[
      'c39f324a-ac79-4c87-9e42-c2ce3bb3e00d',
      '6cf35a68-3799-4274-91db-e5afd67dd203',
    ],
    'abs-aleitamento-materno':[
      '887889a4-15a2-4657-9fdc-48db2c9e970a',
      'eae36754-e9e5-4285-9b86-1d98355479c4',
      '223dd1f8-1ed5-40c6-a624-324ccc299aac',
    ],
    'abs-modificacoes-organismo-materno-intercorrencias':[
      '527a05be-657a-4550-a346-ebae28a2decd',
      '29f2f254-1d03-4203-a78b-72dd469a2486',
    ],
    'abs-semiologia-obstetrica-pre-natal':[
      '6e87409a-dcd0-49fc-ac37-7b04951f742e',
      '33f4d9a6-bb7e-4372-aa15-59554d15097d',
    ],
    'abs-parto-eutocico-partograma':[
      '6317f6a9-0607-4be1-b38c-880fe8ed8a0c',
      'd48b4d27-98d7-4f90-9e35-cb73a593aa12',
      'd220887c-da2b-45bd-8d80-70cf005b5712',
      '27bab0df-8f9d-48ca-a0b5-ba1002a4789d',
      '58ec9007-67c6-479e-8426-9c86b4987b8e',
    ],
    'abs-malformacoes-comuns-rn':[
      '9191c968-ae3d-4829-a167-c4b846f532a4',
    ],
    'abs-puerperio':[
      '0ef6d991-903f-420d-b8ec-7c097a8f3ae2',
    ],
    'abs-infeccoes-congenitas-rn':[
      '1fb4c37e-e6ec-4149-8026-5bc793c4c73a',
    ],
    'abs-triagem-neonatal':[
      '5a251e85-eff2-4f2d-945c-1253203bd5c0',
    ],
    'abs-hiv-gestante-neonatal':[
      '7c36c74d-d714-434d-bd9f-4ef095d2ace6',
      'ae774588-b056-4af6-901f-68c4de66de19',
      '2959bc6d-9328-46c9-9d9c-5f0f57317e9a',
      'f4e4cb11-eab3-427c-8150-80f0cf9ac087',
    ],
  }),
  // Sem uma cobertura direta no catálogo exportado; não exibir substitutos aproximados.
  unmapped:Object.freeze({
    'cardio-estratificacao-risco':'A aula de dislipidemia apenas introduz risco cardiovascular; não ensina a estratificação completa.',
    'cardio-dor-toracica-emergencia':'Não há aula dedicada à abordagem diferencial da dor torácica na emergência.',
    'cardio-sincope':'Não há aula dedicada à abordagem da síncope; menções dentro de Valvopatias não substituem a aula.',
    'pneumo-tomografia-torax':'Não há aula dedicada à interpretação de tomografia do tórax no catálogo.',
    'abs-comunicacao-direitos-gestante':'Não há aula dedicada à comunicação, aos direitos da gestante e à introdução correspondente.',
    'abs-desenvolvimento-emocional-primeirissima-infancia':'A aula de desenvolvimento neuropsicomotor não substitui o foco em desenvolvimento emocional.',
    'abs-infeccoes-gestante':'Não há aula geral equivalente sobre infecções na gestante.',
    'abs-morbimortalidade-materna-perinatal':'A aula de indicadores de mortalidade não substitui o conteúdo materno e perinatal da ABS.',
    'abs-sifilis-perinatal':'A aula geral de úlceras genitais não cobre diretamente sífilis na gestante e no recém-nascido.',
  }),
  legacyLinks:Object.freeze({
    'cardio-cardiomiopatias':[
      'a46a260e-0668-4338-a1da-ebf2f4328e7e',
      'b583b5bc-0f56-45a0-b0c2-7359a6c9f2c6',
      '10136d75-9fbb-4ba1-953a-a7a9c852fd29',
      '3ce07b2e-2c19-4122-9bc1-477fe1242cfd',
    ],
    'cardio-pericardiopatias':[
      '6959914a-c0dd-4136-9573-9f2b45b1fc89',
    ],
  }),
});

const uniqueStrings = values => [...new Set(values
  .filter(value => value !== null && value !== undefined && String(value).trim())
  .map(value => String(value)))];

export const courseLessonStableIds = lesson => uniqueStrings([
  lesson?.docId,
  lesson?.id,
  lesson?.aula?.doc_id,
  lesson?.aula?.id,
  lesson?.aula?.bunny_id,
  lesson?.aula?.bunnyId,
]);

export const resolveFamedCourseLessons = (
  scheduleItemId,
  courseLessons = [],
  mapping = FAMED_COURSE_LESSON_MAP,
) => {
  const selectedIds = new Set((mapping?.links?.[scheduleItemId] || mapping?.legacyLinks?.[scheduleItemId] || []).map(String));
  if (!selectedIds.size) return [];
  return courseLessons
    .filter(lesson => courseLessonStableIds(lesson).some(id => selectedIds.has(id)))
    .sort((left,right) => (left.courseIndex ?? Number.MAX_SAFE_INTEGER) - (right.courseIndex ?? Number.MAX_SAFE_INTEGER));
};

const compactText = value => String(value || '').trim() || null;

export const buildFamedCourseCatalogExport = ({
  courseLessons = [],
  scheduleItems = [],
  exportedAt = new Date().toISOString(),
} = {}) => ({
  schema:'agora-famed-course-catalog-v1',
  exportedAt,
  instructions:'Use os IDs estáveis para vincular manualmente cada item FAMED às aulas corretas. A ordem deste arquivo é a ordem efetiva do Portal do Curso. Transcrições e URLs não são exportadas.',
  famedSchedule:scheduleItems.map(item => ({
    scheduleItemId:item.id,
    discipline:item.discipline,
    sequence:item.sequence,
    kind:item.kind,
    title:item.title,
    topics:item.topics || [],
    date:compactText(item.date),
    time:compactText(item.time),
    instructor:compactText(item.instructor),
    courseSubjects:item.courseSubjects || [item.discipline],
  })),
  courseLessons:[...courseLessons]
    .sort((left,right) => (left.courseIndex ?? Number.MAX_SAFE_INTEGER) - (right.courseIndex ?? Number.MAX_SAFE_INTEGER))
    .map((lesson,index) => ({
      courseOrder:index + 1,
      courseIndex:lesson.courseIndex ?? index,
      stableIds:courseLessonStableIds(lesson),
      subject:compactText(lesson.subject),
      topicKey:compactText(lesson.topic),
      topicTitle:compactText(lesson.topicTitle),
      category:compactText(lesson.cat),
      title:compactText(lesson.title),
      sourceTitle:compactText(lesson.aula?.title),
      catalogTitle:compactText(lesson.aula?.ai_catalog?.cleanTitle),
      durationSeconds:Number(lesson.durationSeconds || lesson.aula?.duration_seconds || 0),
      duration:compactText(lesson.duration || lesson.aula?.duration_formatted),
      description:compactText(lesson.aula?.description || lesson.aula?.ai_catalog?.description),
    })),
});
