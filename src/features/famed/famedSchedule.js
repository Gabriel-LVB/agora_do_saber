export const FAMED_S5_SCHEDULE_META = {
  status:'current-class-schedule',
  label:'Cronogramas oficiais · turma 2026.2',
  sources:[
    {
      id:'cardio-current-class-docx',
      title:'Cronograma Cardiologia 2026.2.1.docx',
      role:'Datas, horários, ordem e professores de Cardiologia da turma atual.',
    },
    {
      id:'pneumo-current-class-docx',
      title:'Cronograma pneumologia AGO-SET 2026.2.docx',
      role:'Aulas teóricas e prova de Pneumologia; as práticas da turma A1 foram excluídas.',
    },
    {
      id:'abs-current-class-pdf',
      title:'OFICIAL CRONOGRAMA ABS5 2026.2.pdf',
      role:'Aulas teóricas e primeiras chamadas de ABS da Gestante e do RN.',
    },
  ],
  reviewNotes:[
    'Em Cardiologia, a fonte marca Valvopatias e Síncope em 14/09 das 16h às 18h. Valvopatias foi posicionada das 14h às 16h pelo padrão dos demais dias com duas aulas consecutivas.',
    'A fonte de Cardiologia registra a 2ª AP em 31/09/2026, quinta-feira. Como essa data não existe, foi adotado 01/10/2026, que é quinta-feira.',
    'Práticas, feriados, segunda chamada e avaliação final não entram na grade FAMED.',
  ],
  pneumologyCohort:'A1',
};

const item = ({ id, sequence, kind='lesson', title, discipline, date, time, instructor='', topics=[], sourceId, ...extra }) => ({
  id,
  sequence,
  kind,
  title,
  discipline,
  date,
  time,
  instructor,
  topics,
  sourceId,
  ...extra,
});

const cardiology = [
  item({ id:'cardio-estratificacao-risco', sequence:1, title:'Estratificação de risco cardiovascular', discipline:'Cardiologia', date:'2026-08-10', time:'14:00–16:00', instructor:'Dr. Cabeto', sourceId:'cardio-current-class-docx' }),
  item({ id:'cardio-has', sequence:2, title:'Hipertensão arterial sistêmica', discipline:'Cardiologia', date:'2026-08-10', time:'16:00–18:00', instructor:'Dr. Cabeto', sourceId:'cardio-current-class-docx' }),
  item({ id:'cardio-dor-toracica-emergencia', sequence:3, title:'Dor torácica na emergência', discipline:'Cardiologia', date:'2026-08-17', time:'14:00–16:00', instructor:'Dr. João Falcão', sourceId:'cardio-current-class-docx' }),
  item({ id:'cardio-doenca-coronaria-cronica', sequence:4, title:'Síndrome coronariana crônica', discipline:'Cardiologia', date:'2026-08-17', time:'16:00–18:00', instructor:'Dr. João Falcão', sourceId:'cardio-current-class-docx' }),
  item({ id:'cardio-sca-com-supra', sequence:5, title:'Síndrome coronariana aguda com supra de ST', discipline:'Cardiologia', date:'2026-08-24', time:'14:00–16:00', instructor:'Dra. Sandra Nívea', sourceId:'cardio-current-class-docx' }),
  item({ id:'cardio-sca-sem-supra', sequence:6, title:'Síndrome coronariana aguda sem supra de ST', discipline:'Cardiologia', date:'2026-08-24', time:'16:00–18:00', instructor:'Dra. Sandra Nívea', sourceId:'cardio-current-class-docx' }),
  item({ id:'cardio-ap1', sequence:7, kind:'exam', title:'1ª AP de Cardiologia', discipline:'Cardiologia', date:'2026-08-31', time:'14:00–16:00', instructor:'Dra. Isabela', sourceId:'cardio-current-class-docx' }),
  item({ id:'cardio-valvopatias', sequence:8, title:'Valvopatias e endocardite', discipline:'Cardiologia', date:'2026-09-14', time:'14:00–16:00', sourceTime:'16:00–18:00', dateNote:'Horário inferido pelo padrão do cronograma; a fonte repete 16–18h nas duas aulas do dia.', instructor:'Dra. Isabela', topics:['Valvopatias','Endocardite'], courseSubjects:['Cardiologia','Infectologia'], sourceId:'cardio-current-class-docx' }),
  item({ id:'cardio-sincope', sequence:9, title:'Abordagem da síncope', discipline:'Cardiologia', date:'2026-09-14', time:'16:00–18:00', instructor:'Dra. Isabela', sourceId:'cardio-current-class-docx' }),
  item({ id:'cardio-ic-cronica', sequence:10, title:'Insuficiência cardíaca crônica e miocardiopatias', discipline:'Cardiologia', date:'2026-09-21', time:'14:00–16:00', instructor:'Dr. Cabeto', topics:['Insuficiência cardíaca crônica','Miocardiopatias'], sourceId:'cardio-current-class-docx' }),
  item({ id:'cardio-ic-aguda', sequence:11, title:'Insuficiência cardíaca aguda', discipline:'Cardiologia', date:'2026-09-21', time:'16:00–18:00', instructor:'Dr. Cabeto', sourceId:'cardio-current-class-docx' }),
  item({ id:'cardio-ap2', sequence:12, kind:'exam', title:'2ª AP de Cardiologia', discipline:'Cardiologia', date:'2026-10-01', time:'09:00', sourceDate:'31/09/2026', dateNote:'A fonte informa 31/09 e quinta-feira; foi adotado 01/10, a quinta-feira correspondente.', instructor:'Dr. João Luiz', sourceId:'cardio-current-class-docx' }),
];

const pneumology = [
  item({ id:'pneumo-dpoc-asma', sequence:1, title:'Asma e DPOC', discipline:'Pneumologia', date:'2026-08-11', time:'14:00–18:00', instructor:'Prof. George e Profa. Eanes', topics:['Asma','DPOC'], sourceId:'pneumo-current-class-docx' }),
  item({ id:'pneumo-tuberculose', sequence:2, title:'Tuberculose', discipline:'Pneumologia', date:'2026-08-18', time:'14:00–18:00', instructor:'Prof. Gabriel', topics:['Tuberculose'], sourceId:'pneumo-current-class-docx' }),
  item({ id:'pneumo-intersticial-espirometria', sequence:3, title:'Pneumopatias intersticiais e espirometria', discipline:'Pneumologia', date:'2026-08-25', time:'14:00–18:00', instructor:'Profa. Mariana', topics:['Pneumopatias intersticiais','Espirometria'], sourceId:'pneumo-current-class-docx' }),
  item({ id:'pneumo-pneumonias-tep', sequence:4, title:'Pneumonias e tromboembolismo pulmonar', discipline:'Pneumologia', date:'2026-09-01', time:'14:00–18:00', instructor:'Prof. Ricardo', topics:['Pneumonias','Tromboembolismo pulmonar'], sourceId:'pneumo-current-class-docx' }),
  item({ id:'pneumo-tomografia-torax', sequence:5, title:'Tomografia do tórax', discipline:'Pneumologia', date:'2026-09-08', time:'14:00–18:00', instructor:'Prof. Daniel', topics:['Tomografia do tórax'], sourceId:'pneumo-current-class-docx' }),
  item({ id:'pneumo-neoplasia-nodulo', sequence:6, title:'Neoplasia de pulmão e nódulo pulmonar', discipline:'Pneumologia', date:'2026-09-15', time:'14:00–18:00', instructor:'Prof. Antero', topics:['Neoplasia pulmonar','Nódulo pulmonar'], sourceId:'pneumo-current-class-docx' }),
  item({ id:'pneumo-doencas-pleura', sequence:7, title:'Doenças da pleura', discipline:'Pneumologia', date:'2026-09-22', time:'14:00–18:00', instructor:'Prof. Antero', topics:['Doenças da pleura'], sourceId:'pneumo-current-class-docx' }),
  item({ id:'pneumo-prova', sequence:8, kind:'exam', title:'Prova de Pneumologia', discipline:'Pneumologia', date:'2026-09-29', time:'14:00–18:00', sourceId:'pneumo-current-class-docx' }),
];

const absGestanteRn = [
  item({ id:'abs-alojamento-semiologia-neonatal', sequence:1, title:'Alojamento conjunto e semiologia neonatal', discipline:'ABS', date:'2026-08-14', time:'08:15', sourceSequence:1, courseSubjects:['Pediatria'], sourceId:'abs-current-class-pdf' }),
  item({ id:'abs-comunicacao-direitos-gestante', sequence:2, title:'Habilidades de comunicação com a gestante e seus direitos', discipline:'ABS', date:'2026-08-14', time:'10:00', sourceSequence:2, topics:['Introdução ao estudo da gestante'], sourceId:'abs-current-class-pdf' }),
  item({ id:'abs-aleitamento-materno', sequence:3, title:'Aleitamento materno', discipline:'ABS', date:'2026-08-21', time:'08:00', sourceSequence:5, courseSubjects:['Pediatria'], sourceId:'abs-current-class-pdf' }),
  item({ id:'abs-desenvolvimento-emocional-primeirissima-infancia', sequence:4, title:'Desenvolvimento emocional na primeiríssima infância', discipline:'ABS', date:'2026-08-21', time:'10:00', sourceSequence:6, sourceId:'abs-current-class-pdf' }),
  item({ id:'abs-modificacoes-organismo-materno-intercorrencias', sequence:5, title:'Modificações do organismo materno e intercorrências comuns na gestação', discipline:'ABS', date:'2026-08-28', time:'08:00', sourceSequence:3, courseSubjects:['Obstetricia'], sourceId:'abs-current-class-pdf' }),
  item({ id:'abs-semiologia-obstetrica-pre-natal', sequence:6, title:'Semiologia obstétrica e assistência pré-natal', discipline:'ABS', date:'2026-08-28', time:'10:00', sourceSequence:4, courseSubjects:['Obstetricia'], sourceId:'abs-current-class-pdf' }),
  item({ id:'abs-parto-eutocico-partograma', sequence:7, title:'Assistência ao parto eutócico e partograma', discipline:'ABS', date:'2026-09-04', time:'10:00', sourceSequence:7, courseSubjects:['Obstetricia'], sourceId:'abs-current-class-pdf' }),
  item({ id:'abs-malformacoes-comuns-rn', sequence:8, title:'Malformações comuns no recém-nascido', discipline:'ABS', date:'2026-09-11', time:'10:00', sourceSequence:8, courseSubjects:['Pediatria'], sourceId:'abs-current-class-pdf' }),
  item({ id:'abs-puerperio', sequence:9, title:'Puerpério normal e patológico', discipline:'ABS', date:'2026-09-18', time:'10:00', sourceSequence:9, courseSubjects:['Obstetricia'], sourceId:'abs-current-class-pdf' }),
  item({ id:'abs-ap1', sequence:10, kind:'exam', title:'1ª AP de ABS', discipline:'ABS', date:'2026-09-30', time:'14:00', topics:['Teóricas 1 a 8'], sourceId:'abs-current-class-pdf' }),
  item({ id:'abs-infeccoes-gestante', sequence:11, title:'Infecções na gestante', discipline:'ABS', date:'2026-10-09', time:'08:00', sourceSequence:10, sourceId:'abs-current-class-pdf' }),
  item({ id:'abs-infeccoes-congenitas-rn', sequence:12, title:'Infecções congênitas no recém-nascido', discipline:'ABS', date:'2026-10-09', time:'10:00', sourceSequence:11, courseSubjects:['Pediatria'], sourceId:'abs-current-class-pdf' }),
  item({ id:'abs-triagem-neonatal', sequence:13, title:'Triagem neonatal', discipline:'ABS', date:'2026-10-23', time:'08:00', sourceSequence:12, courseSubjects:['Pediatria'], sourceId:'abs-current-class-pdf' }),
  item({ id:'abs-morbimortalidade-materna-perinatal', sequence:14, title:'Morbimortalidade materna e perinatal', discipline:'ABS', date:'2026-10-23', time:'10:00', sourceSequence:13, sourceId:'abs-current-class-pdf' }),
  item({ id:'abs-hiv-gestante-neonatal', sequence:15, title:'HIV na gestante e no recém-nascido', discipline:'ABS', date:'2026-10-30', time:'10:00', sourceSequence:14, courseSubjects:['Ginecologia','Pediatria','Infectologia'], sourceId:'abs-current-class-pdf' }),
  item({ id:'abs-sifilis-perinatal', sequence:16, title:'Sífilis perinatal: gestante e recém-nascido', discipline:'ABS', date:'2026-11-13', time:'10:00', sourceSequence:15, sourceId:'abs-current-class-pdf' }),
  item({ id:'abs-ap2', sequence:17, kind:'exam', title:'2ª AP de ABS', discipline:'ABS', date:'2026-11-18', time:'14:00', topics:['Teóricas 9 a 15'], sourceId:'abs-current-class-pdf' }),
];

export const FAMED_S5_DISCIPLINES = Object.freeze([
  { id:'Cardiologia', label:'Cardiologia' },
  { id:'Pneumologia', label:'Pneumologia' },
  { id:'ABS', label:'ABS · Gestante e RN' },
]);

export const FAMED_S5_SCHEDULE = Object.freeze([...cardiology, ...pneumology, ...absGestanteRn]);

// Estes IDs pertenciam ao cronograma anterior. Eles não entram na grade atual,
// mas continuam disponíveis quando já possuem uma Academia criada/publicada.
export const FAMED_S5_ARCHIVED_ITEMS = Object.freeze([
  { id:'cardio-cardiomiopatias', title:'Cardiomiopatias', discipline:'Cardiologia', sourceId:'cardio-previous-class-docx' },
  { id:'cardio-pericardiopatias', title:'Pericardiopatias', discipline:'Cardiologia', sourceId:'cardio-previous-class-docx' },
  { id:'cardio-cirurgia-cardiaca', title:'Cirurgia cardíaca', discipline:'Cardiologia', sourceId:'cardio-previous-class-docx' },
  { id:'cardio-cardiopatias-congenitas', title:'Cardiopatias congênitas', discipline:'Cardiologia', sourceId:'cardio-previous-class-docx' },
]);

export const FAMED_S5_ALL_ITEMS = Object.freeze([...FAMED_S5_SCHEDULE, ...FAMED_S5_ARCHIVED_ITEMS]);

export const FAMED_S5_SCHEDULE_STATS = FAMED_S5_SCHEDULE.reduce((stats,scheduleItem) => {
  if (scheduleItem.kind === 'lesson') stats.lessons += 1;
  else stats.assessments += 1;
  stats.byDiscipline[scheduleItem.discipline] = (stats.byDiscipline[scheduleItem.discipline] || 0) + 1;
  return stats;
}, { lessons:0, assessments:0, byDiscipline:{}, pending:FAMED_S5_SCHEDULE_META.reviewNotes.length });
