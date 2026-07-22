export const FAMED_S5_SCHEDULE_META = {
  status:'previous-class-reference',
  label:'Ordem de referência · turma anterior',
  sources:[
    {
      id:'s5-general-previous-class-pdf',
      title:'CronogramaS5.pdf',
      role:'Confirma a divisão do S5 em dois módulos e a transição para Cardio/Pneumo.',
    },
    {
      id:'cardio-previous-class-docx',
      title:'Cronograma Cardiologia 2026.1.docx.docx',
      role:'Referência para a ordem das aulas e provas de Cardiologia.',
    },
    {
      id:'pneumo-previous-class-docx',
      title:'Cronograma pneumologia MAI-JUN 2026.cocx.docx',
      role:'Referência para a ordem das aulas, prova e modelo de avaliação de Pneumologia.',
    },
  ],
  reviewNotes:[
    'Esta sequência veio da turma anterior e não define datas, horários ou professores da turma atual.',
    'A ordem deverá ser comparada com o cronograma da turma atual antes da publicação definitiva.',
    'Pneumologia informa AP e slide test, mas a fonte não esclarece se são aplicados juntos.',
  ],
  pneumologyAssessmentNotes:[
    'AP: questões de múltipla escolha.',
    'Slide test: casos clínicos com imagens de tórax, dispositivos inalatórios e exames de espirometria.',
    'Nota descrita na fonte anterior: média de AP e slide test, com participação em práticas e seminários acrescentada ao slide test.',
  ],
};

const cardiology = [
  ['cardio-valvopatias',1,'lesson','Valvopatias'],
  ['cardio-doenca-coronaria-cronica',2,'lesson','Doença coronária crônica'],
  ['cardio-has',3,'lesson','Hipertensão arterial sistêmica'],
  ['cardio-estratificacao-risco',4,'lesson','Estratificação de risco cardiovascular'],
  ['cardio-sca-com-supra',5,'lesson','Síndrome coronariana aguda com supra de ST'],
  ['cardio-sca-sem-supra',6,'lesson','Síndrome coronariana aguda sem supra de ST'],
  ['cardio-ap1',7,'exam','1ª AP de Cardiologia'],
  ['cardio-cardiomiopatias',8,'lesson','Cardiomiopatias'],
  ['cardio-pericardiopatias',9,'lesson','Pericardiopatias'],
  ['cardio-ic-cronica',10,'lesson','Insuficiência cardíaca crônica'],
  ['cardio-ic-aguda',11,'lesson','Insuficiência cardíaca aguda'],
  ['cardio-cirurgia-cardiaca',12,'lesson','Cirurgia cardíaca'],
  ['cardio-cardiopatias-congenitas',13,'lesson','Cardiopatias congênitas'],
  ['cardio-ap2',14,'exam','2ª AP de Cardiologia'],
].map(([id,sequence,kind,title]) => ({
  id,
  sequence,
  kind,
  title,
  discipline:'Cardiologia',
  sourceId:'cardio-previous-class-docx',
}));

const pneumology = [
  ['pneumo-dpoc-asma',1,'lesson','DPOC e asma',['DPOC','Asma']],
  ['pneumo-tuberculose',2,'lesson','Tuberculose',['Tuberculose']],
  ['pneumo-pneumonias-tep',3,'lesson','Pneumonias e tromboembolismo pulmonar',['Pneumonias','Tromboembolismo pulmonar']],
  ['pneumo-intersticial-espirometria',4,'lesson','Pneumopatias intersticiais e espirometria',['Pneumopatias intersticiais','Espirometria']],
  ['pneumo-tomografia-torax',5,'lesson','Tomografia do tórax',['Tomografia do tórax']],
  ['pneumo-neoplasia-nodulo',6,'lesson','Neoplasia pulmonar e nódulo pulmonar',['Neoplasia pulmonar','Nódulo pulmonar']],
  ['pneumo-doencas-pleura',7,'lesson','Doenças da pleura',['Doenças da pleura']],
  ['pneumo-prova',8,'exam','Prova de Pneumologia',[]],
].map(([id,sequence,kind,title,topics]) => ({
  id,
  sequence,
  kind,
  title,
  topics,
  discipline:'Pneumologia',
  sourceId:'pneumo-previous-class-docx',
}));

export const FAMED_S5_SCHEDULE = [...cardiology, ...pneumology];

export const FAMED_S5_SCHEDULE_STATS = FAMED_S5_SCHEDULE.reduce((stats,item) => {
  if (item.kind === 'lesson') stats.lessons += 1;
  else stats.assessments += 1;
  stats[item.discipline === 'Cardiologia' ? 'cardiology' : 'pneumology'] += 1;
  return stats;
}, { lessons:0, assessments:0, cardiology:0, pneumology:0, pending:FAMED_S5_SCHEDULE_META.reviewNotes.length });
