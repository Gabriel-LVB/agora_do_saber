const jsonContract = `
Responda apenas JSON valido, sem markdown.
Use portugues do Brasil, linguagem medica precisa e foco em ciclo clinico, pronto atendimento, UBS e raciocinio de prova.
Nao invente diretrizes numericas duvidosas: se houver controversia, formule de modo seguro e geral.
`;

export const buildSubtopicsPrompt = ({ area, topic }) => `${jsonContract}
Crie a expansao inicial de um topico da Jornada do Heroi.

Area: ${area}
Topico: ${topic}

Objetivo:
- Dividir o topico em subtópicos ensináveis, em ordem pedagogica.
- Comecar por bases necessarias antes de condutas avancadas.
- Evitar subtópicos minusculos ou redundantes.
- Cada subtópico deve ser suficiente para gerar 15 a 25 questoes curtas, progressivas e diretas.

Formato:
{
  "subtopics": [
    {
      "id": "slug-curto",
      "title": "Nome do subtópico",
      "why_now": "Por que este subtópico vem nesta posição",
      "scope": ["o que precisa ser cobrado", "limites do subtópico"]
    }
  ]
}`;

export const buildMasterQuestionsPrompt = ({ area, topic, subtopic }) => `${jsonContract}
Crie uma bateria progressiva de questoes curtas para um subtópico da Jornada do Heroi.

Area: ${area}
Topico: ${topic}
Subtopico: ${subtopic.title || subtopic}

Objetivo:
- Gerar de 15 a 25 questoes menores, diretas e progressivas.
- Cobrir o subtópico inteiro ponto a ponto, construindo raciocinio do basico ao clinico.
- Ignorar epidemiologia, incidencia, prevalencia e fatores de risco populacionais, exceto quando forem absolutamente indispensaveis para uma decisao clinica.
- Evitar questoes gigantes. Cada questao deve cobrar um passo claro do raciocinio.
- Variar entre reconhecimento clinico, diagnostico, conduta, exames, interpretacao de achados, criterios e armadilhas.
- Cada questao deve ter alternativas A-D ou A-E.
- Cada alternativa deve ter uma explicacao objetiva dizendo por que esta certa ou errada.
- A explicacao geral deve funcionar como correcao estilo UWorld: didatica, com raciocinio clinico passo a passo, explicando o conceito central e a armadilha da questao. Pode ter 3 a 5 paragrafos curtos se isso melhorar o aprendizado.
- Nao gere habilidades, flashcards ou perguntas de metacognicao.

Formato:
{
  "questions": [
    {
      "id": "slug-curto",
      "stem": "Caso clinico e pergunta",
      "alternatives": [
        {"letter": "A", "text": "...", "explanation": "Por que esta alternativa esta certa ou errada."},
        {"letter": "B", "text": "...", "explanation": "Por que esta alternativa esta certa ou errada."}
      ],
      "answer": "A",
      "explanation": "Correcao clara, objetiva e suficiente."
    }
  ]
}`;

export const buildSkillReviewQuestionPrompt = ({ area, topic, subtopic, prompt, focus }) => `${jsonContract}
Crie uma miniquestao de revisao para uma questao previamente estudada.

Area: ${area}
Topico: ${topic}
Subtopico: ${subtopic}
Questao/base que precisa ser revisada: ${prompt}
Foco da revisao: ${focus || 'cobrar o mesmo raciocinio por um cenario curto diferente'}

Objetivo:
- Fazer uma questao menor que a questao original, mas ainda clinica e respondível.
- Cobrar o mesmo ponto de raciocinio, sem repetir literalmente a questao original.
- Usar alternativas A-D ou A-E.
- Cada alternativa deve ter uma explicacao objetiva dizendo por que esta certa ou errada.
- Explicacao geral estilo UWorld, suficiente para reconstruir o raciocinio e entender por que o erro aconteceu, sem virar aula longa.

Formato:
{
  "question": {
    "id": "slug-curto",
    "stem": "Enunciado da miniquestao",
    "alternatives": [
      {"letter": "A", "text": "...", "explanation": "Por que esta alternativa esta certa ou errada."},
      {"letter": "B", "text": "...", "explanation": "Por que esta alternativa esta certa ou errada."}
    ],
    "answer": "A",
    "explanation": "Correcao objetiva e didatica."
  }
}`;
