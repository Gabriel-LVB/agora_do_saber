const stripLooseMarkdownAsterisks = (text = '') => String(text || '').replace(/\*/g, '');

export const extractQuickSection = (text = '', heading = '') => {
  const raw = String(text || '').replace(/\r\n/g, '\n');
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|\\n)#{2,4}\\s*${escaped}\\s*\\n([\\s\\S]*?)(?=(?:^|\\n)#{2,4}\\s*(?:Aula\\s+r[aá]pida|Explica[çc][aã]o|Quest[õo]es|Flashcards)\\b|$)`, 'i');
  return (raw.match(re)?.[1] || '').trim();
};

export const extractQuickLesson = (text = '') => {
  const raw = String(text || '').replace(/\r\n/g, '\n');
  const match = raw.match(/(?:^|\n)##\s*Aula\s+r[aá]pida\s*\n([\s\S]*?)(?=(?:^|\n)##\s*(?:Quest[õo]es|Flashcards)\b|$)/i)
    || raw.match(/(?:^|\n)##\s*Explica[çc][aã]o\s*\n([\s\S]*?)(?=(?:^|\n)##\s*(?:Quest[õo]es|Flashcards)\b|$)/i);
  const lesson = (match?.[1] || extractQuickSection(raw, 'Aula rápida') || '').trim();
  return stripLooseMarkdownAsterisks(lesson.replace(/:\*/g, ':')).replace(/\n{3,}/g, '\n\n').trim();
};

export const extractQuickTitle = (text = '', fallback = '') => {
  const raw = String(text || '').replace(/\r\n/g, '\n');
  const match = raw.match(/(?:^|\n)##\s*T[íi]tulo\s*\n([\s\S]*?)(?=(?:^|\n)##\s*(?:Foco|Aula\s+r[aá]pida|Explica[çc][aã]o)\b|$)/i);
  return stripLooseMarkdownAsterisks((match?.[1] || fallback || '').trim().split('\n')[0] || '').replace(/^["'“”]+|["'“”]+$/g, '').trim();
};

export const extractQuickIntent = (text = '', fallback = '') => {
  const raw = String(text || '').replace(/\r\n/g, '\n');
  const match = raw.match(/(?:^|\n)##\s*Foco\s*\n([\s\S]*?)(?=(?:^|\n)##\s*(?:Aula\s+r[aá]pida|Explica[çc][aã]o)\b|$)/i);
  return stripLooseMarkdownAsterisks((match?.[1] || fallback || '').trim()).replace(/\n{3,}/g, '\n\n').trim();
};

export const buildQuickLessonPrompt = ({ context='', explanationLength='essential' }) => {
  const lengthRule = {
    essential: `PROFUNDIDADE: Nível 1 — resposta curta e ultra-direta.
- Alvo: 120 a 220 palavras.
- Foque no mecanismo/ideia que resolve a dúvida e em 2 a 4 pontos essenciais.
- Use no máximo 1 subtítulo "###" além do texto principal.
- Corte exemplos longos, contexto histórico e rodeios.`,
    balanced: `PROFUNDIDADE: Nível 2 — explicação enxuta com raciocínio.
- Alvo: 220 a 380 palavras.
- Explique o mecanismo e traga exemplos/pegadinhas apenas quando ajudarem.
- Use subtítulos "###" quando organizar melhor.`,
    complete: `PROFUNDIDADE: Nível 3 — mini-aula mais completa.
- Alvo: 380 a 650 palavras.
- Inclua contexto, mecanismo, implicações clínicas e exceções importantes.
- Ainda assim, não transforme a dúvida em aula genérica.`
  }[explanationLength] || '';
  return `
Você vai criar uma aula para a ferramenta Dúvida Rápida em português brasileiro.

DÚVIDA/MATERIAL DO USUÁRIO:
${context || 'Sem contexto. Peça mais contexto implicitamente criando uma explicação curta do tema provável.'}

OBJETIVO:
- Entender exatamente qual lacuna o usuário quer resolver.
- Definir um título curto e específico.
- Explicar a lacuna em uma mini-aula objetiva, clínica e high-yield.

REGRAS:
- Não gere questões e não gere flashcards neste request.
- Não transforme a dúvida em uma aula genérica.
- Seja didático, mas respeite rigorosamente o nível escolhido.
- Use parágrafos curtos.
- Use subtítulos de nível 3 com "###" quando ajudar.
- Use tópicos com hífen quando necessário.
- Não use asteriscos, negrito ou itálico.
- Se a dúvida veio de conversa leiga, inclua uma forma simples de explicar sem perder precisão.

${lengthRule}

FORMATO OBRIGATÓRIO:
## Título
[título curto, sem aspas]

## Foco
[uma frase dizendo exatamente o que o usuário queria entender]

## Aula rápida
[mini-aula em markdown]
`.trim();
};

export const buildQuickPracticePrompt = ({
  title='',
  context='',
  lesson='',
  intent='',
  settings={},
  outputs=['questions','flashcards'],
  alternativeCount=5,
  vofRule='',
  distractorRule='',
}) => {
  const requestedOutputs = Array.isArray(outputs) ? outputs.filter(output=>['questions','flashcards'].includes(output)) : ['questions','flashcards'];
  const wantsQuestions = requestedOutputs.includes('questions');
  const wantsFlashcards = requestedOutputs.includes('flashcards');
  const requestedLabels = [wantsQuestions?'questões':null, wantsFlashcards?'flashcards':null].filter(Boolean).join(' e ');
  const alts = alternativeCount === 4
    ? 'A) [alternativa]\nB) [alternativa]\nC) [alternativa]\nD) [alternativa]'
    : 'A) [alternativa]\nB) [alternativa]\nC) [alternativa]\nD) [alternativa]\nE) [alternativa]';
  const styleInst = {
    clinical:'Prefira vinhetas clínicas curtas e cobráveis, com dado discriminativo real e sem entregar diagnóstico/conduta no enunciado.',
    direct:'Prefira perguntas diretas com alvo estreito: mecanismo, critério, exceção, comparação ou consequência prática.',
    mixed:'Organize a prática em poucos casos encadeados. Cada caso deve gerar perguntas progressivas e diferentes. Em toda questão use "Caso-base: Caso N — [vinheta original completa]" e depois "Enunciado: [pergunta específica]"; repita integralmente o mesmo caso-base na sequência.',
  }[settings.questionStyle || 'mixed'];
  const adminExplanationFormat = settings.adminQuestionExplanations ? `
FORMATO ADMIN PARA EXPLICAÇÕES DAS QUESTÕES:
- Separe a explicação em "Aula:" e "Alternativas:".
- Aula: explique o conceito de modo suficiente para o aluno entender e acertar a questão.
- Alternativas: use [[ALT:A]], [[ALT:B]], [[ALT:C]], [[ALT:D]] e [[ALT:E]] quando houver E.
- Em [[ALT:A]], explique por que a correta está certa. Nas demais, explique o erro específico em poucas palavras.
- A explicação da alternativa precisa ficar presa ao conteúdo dela, pois o site embaralha alternativa + explicação juntas.` : '';
  return `
Você vai criar conteúdo de estudo para uma Dúvida Rápida em português brasileiro.

TEMA:
${title}

FOCO IDENTIFICADO:
${intent || title}

CONTEXTO DO USUÁRIO:
${context || 'Sem contexto adicional. Explique o tema do zero, mas sem fugir do foco.'}

AULA JÁ GERADA:
${lesson || 'Sem aula enviada. Use o contexto e o foco acima.'}

OBJETIVO:
- Gere somente: ${requestedLabels || 'nenhum conteúdo ativo'}.
- ${wantsQuestions?'Crie uma quantidade compacta de questões de fixação que testem se o usuário realmente entendeu essa lacuna.':'Não gere questões nem a seção "Questões".'}
- ${wantsFlashcards?'Crie flashcards atômicos e exportáveis ao Anki para impedir que a lacuna volte.':'Não gere flashcards nem a seção "Flashcards".'}
- Não reescreva a aula. Gere apenas os tipos selecionados acima.
- Ignore as regras e os exemplos de formato abaixo referentes a um tipo que não foi selecionado.

REGRAS DAS QUESTÕES:
- ${styleInst}
- Gere de 4 a 6 questões. A IA decide a quantidade ideal conforme a complexidade da lacuna.
- Cada questão deve voltar ao problema central do usuário. Não cobre curiosidades periféricas só porque apareceram na explicação.
- Priorize mecanismos causais, decisões práticas, pegadinhas diretamente relacionadas e reconstrução ativa do raciocínio.
- Evite perguntas óbvias, decorebas inúteis e alternativas absurdas.
- Em casos clínicos, inclua apenas dados que mudam o raciocínio: contexto, tempo de evolução, achados positivos e negativos úteis. Não use "clássico", "característico", "destacando-se por" ou frases que entreguem a resposta.
- O caso deve terminar em uma decisão clara: diagnóstico, próxima conduta, fármaco, efeito adverso, mecanismo, exame ou contraindicação.
- Em perguntas diretas, evite "O que é X?", "qual a principal característica?" ou "qual conduta?" sem escopo. A pergunta deve dizer exatamente que tipo de resposta espera.
- Pergunta direta boa deve diferenciar algo: mecanismo vs efeito, regra vs exceção, critério obrigatório vs achado inespecífico, ou fármacos/diagnósticos próximos.
- Questões com alternativas devem ter exatamente ${alternativeCount} alternativas no formato:
${alts}
${vofRule}
${distractorRule}
- Depois de cada questão inclua "Gabarito: X" e "Explicação:".
${adminExplanationFormat}

REGRAS DOS FLASHCARDS:
- Gere de 5 a 8 flashcards. Nunca gere menos de 5.
- Crie somente a quantidade útil para memorizar a lacuna, sem pilha excessiva.
- Cada flashcard deve ter um alvo claro de recuperação, ser autossuficiente e não redundante.
- "Atômico" não significa separar tudo: agrupe 2 a 4 itens quando eles formam uma unidade natural, como principais efeitos adversos, monitorização obrigatória, tríade ou fármacos que compartilham uma interação.
- Separe em cards diferentes quando os itens têm mecanismos, decisões ou explicações diferentes.
- Se a pergunta disser "dois", "três", "(2)" ou "(3)", a resposta deve ter exatamente essa quantidade.
- Não use "cite um" com resposta contendo várias opções. Se quer conjunto, pergunte o conjunto; se quer um exemplo, responda um exemplo.
- Use dificuldade desejável: a pergunta deve exigir recuperação ativa, não reconhecimento passivo.
- Zero ambiguidade: a pergunta deve ter contexto suficiente para uma única resposta justa.
- Teste de previsibilidade: se uma pessoa que entendeu o tema não conseguir adivinhar o tipo exato de resposta esperada, reescreva a pergunta. Proibido fazer perguntas abertas genéricas como "O que é X?" quando a resposta seria "doença autoimune", "condição crônica" ou outra definição ampla.
- Evite perguntas de sim/não; transforme em uma pergunta que peça a informação substantiva.
- Toda pergunta deve terminar com ponto de interrogação.
- Resposta curta: 1 a 6 palavras ou, em conjuntos naturais, 2 a 4 itens curtos.
- Depois da resposta curta, a explicação deve ensinar por que aquela resposta é correta ou como ela acontece. Ela não pode repetir a resposta com mais palavras nem virar curso.
- Se o card perguntar efeitos colaterais, a resposta lista os efeitos e a explicação diz por que eles ocorrem ou por que importam. Se perguntar uma escolha/conduta, a explicação diz qual propriedade do fármaco ou do quadro clínico justifica aquela opção.
- Explicação ruim: "é usado porque é eficaz/primeira linha/indicado". Explicação boa: conecta fármaco/quadro clínico → propriedade relevante → motivo da resposta.
- Não faça cartões que cobrem detalhes inúteis; faça cartões que, juntos, permitam revisar a dúvida inteira depois.

FORMATO FINAL OBRIGATÓRIO:
- Inclua apenas as seções selecionadas no objetivo.
## Questões
## Questão 1
[enunciado]
${alts}
Gabarito: A
Explicação:${settings.adminQuestionExplanations ? `
Aula:
[aula curta e completa sobre o tema]

Alternativas:
[[ALT:A]]
[por que a alternativa A está correta]

[[ALT:B]]
[por que a alternativa B está errada]

[[ALT:C]]
[por que a alternativa C está errada]

[[ALT:D]]
[por que a alternativa D está errada]

[[ALT:E]]
[por que a alternativa E está errada, se existir]` : ' [explicação]'}

## Flashcards
## Flashcard 1
Pergunta: [pergunta objetiva e específica?]
Resposta: [resposta curta, poucas palavras]
Explicação: [explicação curta do porquê/como da resposta]
---
`.trim();
};
