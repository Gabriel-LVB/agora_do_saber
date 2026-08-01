// Vínculos revisados entre cada item da FAMED e as aulas reais do curso.
// Preencha apenas com IDs estáveis obtidos pelo export administrativo da FAMED.
// O mapa vazio é intencional: a interface nunca deve inferir cobertura por palavras.
export const FAMED_COURSE_LESSON_MAP = Object.freeze({
  schemaVersion:1,
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
    'cardio-cardiomiopatias':[
      'a46a260e-0668-4338-a1da-ebf2f4328e7e',
      'b583b5bc-0f56-45a0-b0c2-7359a6c9f2c6',
      '10136d75-9fbb-4ba1-953a-a7a9c852fd29',
      '3ce07b2e-2c19-4122-9bc1-477fe1242cfd',
    ],
    'cardio-pericardiopatias':[
      '6959914a-c0dd-4136-9573-9f2b45b1fc89',
    ],
    'cardio-ic-cronica':[
      'efcbd5c4-20cc-432c-b50f-9271c57f7a11',
      'ddd47bd6-2553-4387-9ed7-6525fc754457',
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
  }),
  // Sem uma cobertura direta no catálogo exportado; não exibir substitutos aproximados.
  unmapped:Object.freeze({
    'cardio-estratificacao-risco':'A aula de dislipidemia apenas introduz risco cardiovascular; não ensina a estratificação completa.',
    'cardio-cirurgia-cardiaca':'Não há aula de cirurgia cardíaca ou revascularização no catálogo.',
    'cardio-cardiopatias-congenitas':'Não há aula dedicada a cardiopatias congênitas no catálogo.',
    'pneumo-tomografia-torax':'Não há aula dedicada à interpretação de tomografia do tórax no catálogo.',
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
  const selectedIds = new Set((mapping?.links?.[scheduleItemId] || []).map(String));
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
