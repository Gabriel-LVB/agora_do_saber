export const FAMED_PROGRAM = {
  institution:'FAMED',
  curriculum:'PPC 2018',
  activeSemester:'s5',
  semesters:[5, 6, 7, 8].map(number => ({
    id:`s${number}`,
    label:`S${number}`,
    available:number === 5,
  })),
  tracks:[
    {
      id:'cardio-pneumo',
      title:'Cardio + Pneumo',
      subtitle:'Primeira metade em produção',
      subjects:['Cardiologia', 'Pneumologia'],
      priority:true,
      status:'Cronograma-base 2026.1 carregado',
    },
    {
      id:'endocrino-nutro-gastro',
      title:'Endócrino + Nutro + Gastro',
      subtitle:'Segunda metade do semestre',
      subjects:['Endocrinologia', 'Nutrologia', 'Gastroenterologia'],
      priority:false,
      status:'Planejado para depois',
    },
  ],
};
