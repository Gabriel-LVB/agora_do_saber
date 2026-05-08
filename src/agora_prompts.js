/**
 * ÁGORA DO SABER — PROMPTS
 *
 * Este arquivo contém TODOS os prompts usados pelo site.
 * Edite aqui para ajustar o comportamento das IAs sem mexer no App.jsx.
 *
 * FUNÇÕES EXPORTADAS:
 *   buildOracleQuestionPrompt(s, focusBlock, autoMode)   → prompt de geração do Oráculo
 *   buildOracleSyllabusPrompt(subjectName, s, autoMode)  → prompt de sumário do Oráculo
 *   buildOracleSyllabusRevisePrompt(current, feedback, s)→ prompt de revisão de sumário
 *   buildExternalPrompt(s)                               → prompt para IA externa
 *   buildVqSyllabusPrompt(aula, numBlocks, qPerBlock, transcript, extraPrompt) → sumário das aulas
 *   buildVqBlockPrompt(block, meta, subtopicsArr, transcriptSlice, alts) → questões de bloco
 */

// ─── INSTRUÇÕES POR TIPO DE QUESTÃO ─────────────────────────────────────────

export const TYPE_INST = {
  direct: '',  // padrão — sem instrução adicional
  vof: `
TIPO: VERDADEIRO OU FALSO
Cada questão deve conter 4 assertivas (I, II, III, IV) que o aluno classifica como V ou F.
REGRAS CRÍTICAS das assertivas:
- Todas devem ter tamanho similar (±15 caracteres) para não dar pista por tamanho
- Misture verdadeiras e falsas (nunca todas V ou todas F)
- Use a alternativa correta como o gabarito da combinação (ex: "V, F, V, F")
- As alternativas devem ser combinações plausíveis das assertivas
FORMATO especial do enunciado: "Analise as assertivas abaixo e marque a opção correta:\nI. [assertiva]\nII. [assertiva]\nIII. [assertiva]\nIV. [assertiva]"`,

  cespe: `
TIPO: CERTO OU ERRADO (estilo CESPE/CEBRASPE)
Cada questão é uma única afirmação que o aluno julga como CERTO ou ERRADO.
Não use alternativas A/B/C/D — as únicas alternativas são:
A) Certo
B) Errado
REGRAS:
- A afirmação deve ser tecnicamente precisa ou conter um erro sutil e clinicamente relevante
- Evite afirmações óbvias demais ou ambíguas
- Distribua equilibradamente entre certas e erradas`,

  open: `
TIPO: RESPOSTA CURTA (questão aberta)
O aluno deve responder em 1 a 3 linhas. NÃO use alternativas A/B/C/D.
Use este formato especial:
## Questão [ID]
[Enunciado da questão]
Resposta esperada: [resposta direta e objetiva em 1-2 linhas — ESTA LINHA NÃO APARECE AO ALUNO]
Alternativa correta: A
A) [resposta esperada completa]
Explicação:
[explicação didática]
---`,

  essay: `
TIPO: DISSERTATIVA (resposta longa)
O aluno deve responder em 1 parágrafo (5-10 linhas). NÃO use alternativas A/B/C/D.
Use o mesmo formato da questão aberta mas com resposta esperada mais detalhada.
A resposta esperada deve cobrir os pontos principais que um aluno deve mencionar.`,
};

// Constrói a instrução de tipo combinada para múltiplos tipos selecionados
export const buildTypeInst = (types = ['direct']) => {
  if (!types || types.length === 0) types = ['direct'];
  if (types.length === 1) return TYPE_INST[types[0]] || '';
  return `MISTURE os seguintes tipos de questão ao longo das questões:\n${types.map(t => `- ${QUESTION_TYPE_LABELS[t] || t}`).join('\n')}\n\n${types.map(t => TYPE_INST[t]).filter(Boolean).join('\n\n')}`;
};

const QUESTION_TYPE_LABELS = {
  direct: 'Direta (múltipla escolha)',
  vof: 'Verdadeiro ou Falso',
  cespe: 'Certo ou Errado (CESPE)',
  open: 'Resposta Curta (aberta)',
  essay: 'Dissertativa',
};

export const STYLE_INST = {
  clinical: 'Use EXCLUSIVAMENTE casos clínicos reais: paciente com idade/sexo/contexto apresenta sinais e sintomas específicos. Nunca mencione exames ou diagnóstico no enunciado se a questão pede justamente isso.',
  direct:   'Use EXCLUSIVAMENTE questões diretas sobre conceitos: mecanismo, critério diagnóstico, classificação, dose, indicação, contraindicação. O enunciado deve ser objetivo e sem caso clínico.',
  mixed:    'Siga esta ordem ao longo das questões: as primeiras questões (mais fundamentais, conceituais) devem ser DIRETAS — perguntando sobre definição, mecanismo, classificação ou critério. As últimas questões (mais avançadas, de aplicação) devem ser CLÍNICAS — casos com paciente, contexto, decisão terapêutica ou diagnóstica. A transição deve ser gradual e natural, como uma aula que vai do conceito à prática.',
};

// ─── REGRAS COMPARTILHADAS ────────────────────────────────────────────────────

const REGRAS_ENUNCIADO = `
REGRAS DO ENUNCIADO:
- Jamais mencione a aula, o professor, a importância de estudar o assunto ou qualquer referência ao contexto didático
- Nos casos clínicos: inclua dados como idade, sexo, tempo de evolução, sintomas principais e achados relevantes de exame — sem entregar o diagnóstico ou o tratamento se eles forem a resposta
- Nas questões diretas: vá direto ao conceito, sem introduções desnecessárias
- O enunciado deve conter APENAS o que é necessário para resolver a questão
- Tamanho ideal: suficiente para contextualizar sem ser prolixo — evite enunciados de uma linha e evite romances clínicos desnecessários`;

const REGRAS_ALTERNATIVAS = `
REGRAS DAS ALTERNATIVAS (CRÍTICO):
- Todas as alternativas devem ser plausíveis para quem não domina o assunto: sem alternativas absurdas, óbvias ou que possam ser eliminadas por bom senso
- Todas as alternativas devem ter comprimento similar: a alternativa correta NÃO pode ser reconhecida pelo tamanho
- Use distratores sofisticados: condições parecidas, tratamentos do mesmo grupo, mecanismos semelhantes, exceções da regra
- Nunca use palavras do enunciado como dica direta para a alternativa correta
- A dificuldade de cada questão deve exigir conhecimento real — quem não estudou não deve conseguir chutar`;

const REGRAS_EXPLICACAO = `
REGRAS DA EXPLICAÇÃO:
- Comece explicando o CONCEITO central que a questão testa (o subtópico em si), não apenas o gabarito
- Depois conecte esse conceito ao enunciado específico da questão
- Explique por que cada distrator está errado usando o raciocínio clínico correto — pelo conteúdo, nunca pela letra
- A explicação deve ser suficiente para que o aluno entenda o assunto, não apenas decore a resposta
- Inclua: mecanismo fisiopatológico, critérios relevantes, comparações com os distratores
- Tamanho ideal: 3 a 6 parágrafos curtos — nem uma frase solta nem um artigo. Seja denso e objetivo

PROIBIDO ABSOLUTO — LETRAS DAS ALTERNATIVAS:
As alternativas serão EMBARALHADAS antes de serem exibidas ao aluno, portanto as letras A, B, C, D, E NÃO têm significado fixo.
JAMAIS escreva "a alternativa A", "a opção B", "a letra C", ou qualquer referência a letras na explicação.
Refira-se sempre pelo CONTEÚDO: "a opção que menciona X", "o uso de Y está incorreto porque...", "confundir Z com W é um erro comum pois..."
ERRADO: "A alternativa B está correta pois o cálcio é o íon responsável..."
CERTO: "O cálcio é o íon responsável pela contração muscular porque..."
ERRADO: "A opção D está errada pois o potássio não..."
CERTO: "O potássio não participa desse mecanismo porque..."`;


const TEMPLATE_QUESTAO = (alts) => `
FORMATO OBRIGATÓRIO (uma questão por bloco ---):
## Questão [ID]
[Enunciado]
${alts}
Alternativa correta: [Letra]
Explicação:
[Explicação]
---`;

// ─── PROMPT: GERAÇÃO DE QUESTÕES DO ORÁCULO ──────────────────────────────────

/**
 * @param {object} s           - settings do usuário (numSubtopics, qPerSub, numAlternatives, questionStyle, customPrompt)
 * @param {string} focusBlock  - instruções de ênfase opcionais
 * @param {boolean} autoMode   - se true, o Oráculo escolhe a estrutura ideal
 */
export const buildOracleQuestionPrompt = (s, focusBlock = '', autoMode = false) => {
  const na   = s.numAlternatives || 5;
  const alts = na === 4
    ? 'A) [alternativa]\nB) [alternativa]\nC) [alternativa]\nD) [alternativa]'
    : 'A) [alternativa]\nB) [alternativa]\nC) [alternativa]\nD) [alternativa]\nE) [alternativa]';

  const styleInst = STYLE_INST[s.questionStyle || 'mixed'];

  const estruturaInst = autoMode
    ? `
ESTRUTURA (modo automático):
Você define a quantidade ideal de subtópicos por tópico.
LIMITES ABSOLUTOS: mínimo 5 e máximo 20 subtópicos por tópico — nunca fora dessa faixa.
Critérios:
- Tópicos mais amplos podem ter mais subtópicos (15-30); tópicos pontuais, menos (5-15)
- Quantidade ideal: suficiente para cobrir o assunto sem repetição nem superficialidade
- Cada subtópico deve ser um conceito distinto e testável — não uma variação do anterior
- Organize do conceito mais fundamental ao mais específico dentro de cada tópico`
    : `
ESTRUTURA OBRIGATÓRIA:
- EXATAMENTE ${s.numSubtopics} subtópicos
- EXATAMENTE ${s.qPerSub} questão por subtópico
- Total: EXATAMENTE ${s.numSubtopics * s.qPerSub} questões
- Ordem: do conceito mais fundamental ao mais específico`;

  const typeInst = buildTypeInst(s.questionTypes || ['direct']);

  return `Você é o Oráculo de Medicina da Ágora do Saber. Sua missão é criar questões médicas de altíssima qualidade para residência médica.

${focusBlock ? focusBlock + '\n' : ''}
ESTILO DE ENUNCIADO: ${styleInst}
${typeInst ? typeInst + '\n' : ''}${estruturaInst}
${REGRAS_ENUNCIADO}
${REGRAS_ALTERNATIVAS}
${REGRAS_EXPLICACAO}
${TEMPLATE_QUESTAO(alts)}

Use o ID no formato [TOPICO.SUBTOPICO.QUESTAO] (ex: 3.2.1).
${s.customPrompt ? `\nINSTRUÇÕES ADICIONAIS DO USUÁRIO:\n${s.customPrompt}` : ''}
Gere TODAS as questões sem interromper. Não resuma, não pergunte, não comente — apenas questões.`;
};

// ─── PROMPT: SUMÁRIO DO ORÁCULO ───────────────────────────────────────────────

/**
 * @param {string} subjectName - nome do assunto
 * @param {object} s           - settings
 * @param {boolean} autoMode   - se true, o Oráculo escolhe tópicos e subtópicos
 */
export const buildOracleSyllabusPrompt = (subjectName, s, autoMode = false) => {
  const estrutura = autoMode
    ? `Defina a quantidade ideal de tópicos e subtópicos para cobrir "${subjectName}" com base no material fornecido.
LIMITES: mínimo 5 e máximo 20 subtópicos por tópico — nunca fora dessa faixa.
- Os tópicos devem emergir naturalmente do material — não use divisões genéricas fixas
- Quantidade por tópico: o necessário para cobrir bem aquele tema (entre 5 e 20)
- Cada subtópico = 1 conceito específico e testável, sem sobreposição com outros`
    : `Crie exatamente ${s.numTopics} Tópicos com exatamente ${s.numSubtopics} Subtópicos cada.`;

  return `Você é o Arquiteto de Alexandria. Crie um sumário para "${subjectName}" baseado no material do usuário.

${estrutura}

REGRAS:
- Baseie os subtópicos no material fornecido — não extrapole para fora do que foi pedido
- Ordem obrigatória dentro de cada tópico: fundamentos antes de detalhes, mecanismo antes da aplicação clínica, regra antes da exceção
- Subtópicos concretos e objetivos — nada de "Generalidades", "Introdução" ou "Aspectos gerais"

FORMATO:
Tópico 1: [Nome]
  - [Subtópico]
  - [Subtópico]
Tópico 2: [Nome]
  - [Subtópico]

Responda APENAS o sumário.`;
};

// ─── PROMPT: REVISÃO DE SUMÁRIO ───────────────────────────────────────────────

export const buildOracleSyllabusRevisePrompt = (currentSyllabus, feedback, s) => {
  return `Você é o Arquiteto de Alexandria. Ajuste o sumário abaixo conforme a instrução do usuário.

SUMÁRIO ATUAL:
${currentSyllabus}

INSTRUÇÃO DO USUÁRIO:
${feedback}

REGRAS:
- Mantenha a estrutura de Tópicos e Subtópicos
- Preserve a ordem didática (geral → específico, mecanismo → aplicação)
- Cada subtópico deve ser um conceito testável independente
- Responda APENAS o sumário revisado, sem comentários adicionais`;
};

// ─── PROMPT: IA EXTERNA ───────────────────────────────────────────────────────

export const buildExternalPrompt = (s) => {
  const na   = s.numAlternatives || 5;
  const alts = na === 4
    ? 'A) [alternativa]\nB) [alternativa]\nC) [alternativa]\nD) [alternativa]'
    : 'A) [alternativa]\nB) [alternativa]\nC) [alternativa]\nD) [alternativa]\nE) [alternativa]';

  const parte1 = s.autoMode
    ? `*** PARTE 1: ESTRUTURA (modo automático) ***
A IA deve definir a quantidade ideal de tópicos e subtópicos por tópico.
LIMITES OBRIGATÓRIOS: mínimo 5 e máximo 20 subtópicos por tópico.
Critérios: tópicos emergem do material, ordem didática (geral → específico), cada subtópico = 1 conceito testável único.
Responda APENAS o sumário. Aguarde confirmação antes de gerar questões.`
    : `*** PARTE 1: ESTRUTURA ***
Crie um sumário sobre [INSERIR TEMA] com ${s.numTopics} tópicos e ${s.numSubtopics} subtópicos cada.
Organize do conceito mais fundamental ao mais específico.
Responda APENAS o sumário. Aguarde a confirmação antes de gerar questões.`;

  const parte2 = s.autoMode
    ? `*** PARTE 2: GERAÇÃO (um tópico por vez) ***
Para cada tópico gere 1 questão por subtópico (total = número de subtópicos daquele tópico).`
    : `*** PARTE 2: GERAÇÃO (um tópico por vez) ***
Para cada tópico gere ${s.numSubtopics * s.qPerSub} questões (${s.numSubtopics} subtópicos × ${s.qPerSub} por subtópico).`;

  return `[INSTRUÇÕES PARA IA EXTERNA — ÁGORA DO SABER]

${parte1}

${parte2}

ESTILO: ${STYLE_INST[s.questionStyle || 'mixed']}
${REGRAS_ENUNCIADO}
${REGRAS_ALTERNATIVAS}
${REGRAS_EXPLICACAO}
${TEMPLATE_QUESTAO(alts)}`;
};

// ─── PROMPT: SUMÁRIO DAS AULAS (VIDEOAULAS) ──────────────────────────────────

/**
 * @param {object} aula        - objeto da aula
 * @param {number} numBlocks   - número de blocos
 * @param {number} qPerBlock   - questões por bloco (= subtópicos por bloco)
 * @param {string} transcript  - transcrição da aula (pode ser vazia)
 * @param {string} extraPrompt - instrução extra do usuário
 */
export const buildVqSyllabusPrompt = (aula, numBlocks, qPerBlock, transcript, extraPrompt = '') => {
  return `Você é um especialista em avaliações médicas. Sua tarefa é criar um guia de questões para a aula "${aula.title}".

ESTRUTURA OBRIGATÓRIA:
- ${numBlocks} bloco(s) de questões
- Entre 5 e 20 subtópicos por bloco (ideal: ${qPerBlock})
- Ordem OBRIGATORIAMENTE didática dentro de cada bloco: conceitos gerais → específicos, mecanismo → clínica → tratamento
- Nunca coloque um detalhe, exceção ou efeito adverso antes de ter coberto o conceito principal

REGRAS DOS SUBTÓPICOS:
- Cada subtópico = 1 conceito médico específico e testável
- RUIM: "Introdução", "Generalidades", "Aspectos gerais do tratamento"
- BOM: "Critérios diagnósticos da Síndrome Nefrótica", "Mecanismo de ação dos IECA na DRC"
- Não repita conceitos entre subtópicos
- Não coloque exceções ou complicações antes de cobrir o conceito principal
- Priorize o que é cobrado em provas de residência médica

${extraPrompt ? `FOCO SOLICITADO PELO USUÁRIO: ${extraPrompt}\n` : ''}

FORMATO OBRIGATÓRIO:
## Bloco 1: [Título temático do bloco]
- [Subtópico testável]
- [Subtópico testável]
...
## Bloco 2: [Título temático do bloco]
- [Subtópico testável]
...

${transcript
  ? `TRANSCRIÇÃO DA AULA (use como base para os subtópicos):\n${transcript.substring(0, 25000)}`
  : `[Sem transcrição disponível — baseie-se no título: "${aula.title}"]`}`;
};

// ─── PROMPT: GERAÇÃO DE QUESTÕES DE BLOCO (VIDEOAULAS) ───────────────────────

/**
 * @param {object} block         - bloco com title e subtopics
 * @param {object} meta          - meta da aula (aulaTitle, questionStyle, numAlternatives)
 * @param {string[]} subtopicsArr- array de subtópicos do bloco
 * @param {string} transcriptSlice - trecho da transcrição para este bloco
 * @param {string} alts          - template de alternativas
 */
export const buildVqBlockPrompt = (block, meta, subtopicsArr, transcriptSlice, alts) => {
  const styleInst = STYLE_INST[meta.questionStyle || 'mixed'];
  const total = subtopicsArr.length || meta.qPerBlock || 5;

  return `Você é um examinador de residência médica criando questões sobre "${block.title}" (aula: ${meta.aulaTitle}).

ESTILO: ${styleInst}

SUBTÓPICOS (gere 1 questão por subtópico, nesta ordem exata):
${subtopicsArr.map((s, i) => `${i + 1}. ${s}`).join('\n')}

TOTAL: EXATAMENTE ${total} questões.
${REGRAS_ENUNCIADO}
${REGRAS_ALTERNATIVAS}
${REGRAS_EXPLICACAO}
${TEMPLATE_QUESTAO(alts)}

Use o ID como número sequencial simples (1, 2, 3...).

${transcriptSlice
  ? `REFERÊNCIA DO CONTEÚDO (trecho da aula):\n${transcriptSlice.substring(0, 40000)}`
  : '[Sem transcrição — baseie-se nos subtópicos e no título da aula]'}

Gere TODAS as ${total} questões sem interromper ou comentar.`;
};