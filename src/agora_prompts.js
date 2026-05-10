/**
 * ÁGORA DO SABER — PROMPTS
 */

// ─── INSTRUÇÕES POR TIPO DE QUESTÃO ─────────────────────────────────────────

export const TYPE_INST = {
  direct: '',
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
TIPO: RESPOSTA CURTA
Cada questão deve pedir uma resposta objetiva de 1 a 3 linhas.
FORMATO OBRIGATÓRIO (siga à risca, sem variações):
## Questão [N]
[Enunciado — pergunta direta sobre um conceito]
Resposta esperada: [resposta em 1-2 frases]
Explicação: [explicação didática em 2-3 frases]
---
NÃO inclua alternativas A/B/C/D. NÃO coloque "Gabarito:" nem "Alternativa correta:". Apenas o formato acima.`,

  essay: `
TIPO: DISSERTATIVA
Cada questão deve pedir uma resposta de 1 parágrafo (5-8 linhas).
FORMATO OBRIGATÓRIO (siga à risca, sem variações):
## Questão [N]
[Enunciado — pede para explicar, discutir ou relacionar conceitos]
Resposta esperada: [resposta completa cobrindo os pontos principais, em 4-6 frases]
Explicação: [feedback sobre o que uma boa resposta deve conter]
---
NÃO inclua alternativas A/B/C/D. NÃO coloque "Gabarito:" nem "Alternativa correta:". Apenas o formato acima.`,
};

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
- Jamais mencione a aula, o professor, o assunto ou qualquer referência ao contexto didático
- O enunciado NUNCA deve conter palavras que sejam sinônimos diretos da resposta correta. Se a resposta é "inibição da bomba de prótons", o enunciado não pode dizer "supressão ácida" ou "bomba de prótons"
- Nos casos clínicos: inclua idade, sexo, tempo de evolução, sintomas e achados de exame — nunca entregue o diagnóstico ou tratamento que é a resposta
- Nas questões diretas: enunciado objetivo, sem introduções desnecessárias
- PROIBIDO no enunciado: qualquer dica semântica que permita eliminar distratores sem conhecimento do tema
- Tamanho ideal: suficiente para contextualizar sem ser prolixo`;

const REGRAS_ALTERNATIVAS = `
REGRAS DAS ALTERNATIVAS — AS MAIS IMPORTANTES DESTE PROMPT:

REGRA 1 — ALTERNATIVA A É SEMPRE A CORRETA (CRÍTICO):
Coloque a resposta correta como alternativa A, sempre. O site embaralha automaticamente.
Isso permite que você use a alternativa A como âncora para calibrar os distratores:
- Escreva A (correta) com o nível de detalhe ideal
- Escreva B, C, D (e E) com comprimento similar ao de A (±10 palavras), alterando apenas o elemento que torna cada um incorreto
- Distratores devem parecer tão plausíveis quanto A para quem estudou superficialmente
EXEMPLO PROIBIDO: A) Sim, pela inibição da bomba de Na/K e ação sobre canais de Ca²⁺ / B) Não / C) Sim / D) Nunca
EXEMPLO CORRETO: A) [resposta correta, 12 palavras] / B) [mesmo comprimento, mecanismo errado] / C) [mesmo comprimento, órgão errado] / D) [mesmo comprimento, dose/classe errada]

REGRA 2 — DISTRATORES SOFISTICADOS (CRÍTICO):
Cada distrator deve ser uma afirmação que um estudante que estudou superficialmente poderia confundir com a resposta correta.
Use: condições do mesmo grupo nosológico, fármacos da mesma classe, mecanismos parecidos, exceções da regra, valores próximos mas incorretos, inversões de causa/efeito, confusões clássicas do tema.
PROIBIDO: distratores obviamente absurdos, anatomicamente impossíveis, ou que qualquer pessoa sem conhecimento médico eliminaria por bom senso.
PROIBIDO: distratores que são apenas a negação direta do enunciado.

REGRA 3 — SEM PISTAS SINTÁTICAS:
- A alternativa correta não pode ter estrutura gramatical diferente das erradas
- Não use "todas as anteriores" ou "nenhuma das anteriores"
- Distribua a posição da alternativa correta aleatoriamente (não sempre B ou C)

REGRA 4 — DIFICULDADE REAL:
Um estudante que nunca viu o tema deve errar. Um que estudou superficialmente deve hesitar. Só quem domina o conteúdo deve acertar com segurança.`;

const REGRAS_EXPLICACAO = `
REGRAS DA EXPLICAÇÃO:
- Comece pelo CONCEITO central que a questão testa, não pelo gabarito
- Explique por que a alternativa correta está certa usando raciocínio fisiopatológico ou clínico
- Para cada distrator: explique por que está errado pelo conteúdo (nunca pela letra)
- A explicação deve ensinar o assunto, não apenas confirmar o gabarito
- Tamanho: 3 a 5 parágrafos objetivos

PROIBIDO ABSOLUTO — LETRAS DAS ALTERNATIVAS:
As alternativas serão EMBARALHADAS antes de serem exibidas ao aluno — as letras A, B, C, D, E NÃO têm significado fixo.
JAMAIS escreva "a alternativa A", "a opção B", "a letra C" na explicação.
Refira-se SEMPRE pelo conteúdo: "a opção que menciona X", "confundir Y com Z é um erro comum pois..."`;

const TEMPLATE_QUESTAO = (alts) => `
FORMATO OBRIGATÓRIO (uma questão por bloco ---):
## Questão [ID]
[Enunciado]
${alts}
Alternativa correta: [Letra]
Explicação:
[Explicação]
---

INSTRUÇÃO CRÍTICA SOBRE AS ALTERNATIVAS:
Coloque SEMPRE a alternativa CORRETA como alternativa A.
Depois crie os distratores (B, C, D e E se houver) baseando-se na alternativa A:
- Use a alternativa A como referência de comprimento — os distratores devem ter comprimento similar (±10 palavras)
- Crie distratores alterando elementos específicos da alternativa A: troque doses, mecanismos, órgãos, fármacos por versões plausíveis mas incorretas
- Distratores devem parecer igualmente corretos para quem não domina o assunto
- O site embaralha as alternativas automaticamente antes de exibir — você não precisa se preocupar com isso
Resultado esperado: 5 alternativas com comprimento quase idêntico, onde só quem domina o conteúdo consegue identificar a correta.`;

// ─── PROMPT: GERAÇÃO DE QUESTÕES DO ORÁCULO ──────────────────────────────────

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
- Tópicos mais amplos podem ter mais subtópicos (15-20); tópicos pontuais, menos (5-10)
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
  const types = s.questionTypes || ['direct'];
  const onlyOpen = types.every(t => ['open','essay'].includes(t));

  const templateBlock = onlyOpen ? `
FORMATO OBRIGATÓRIO para cada questão (separe com ---):
## Questão [N]
[Enunciado]
Resposta esperada: [resposta objetiva]
Explicação: [explicação didática]
---` : `${REGRAS_ALTERNATIVAS}\n${REGRAS_EXPLICACAO}\n${TEMPLATE_QUESTAO(alts)}`;

  return `Você é o Oráculo de Medicina da Ágora do Saber. Sua missão é criar questões médicas de altíssima qualidade para residência médica.

${focusBlock ? focusBlock + '\n' : ''}
ESTILO DE ENUNCIADO: ${styleInst}
${typeInst ? typeInst + '\n' : ''}${estruturaInst}
${REGRAS_ENUNCIADO}
${templateBlock}

Use o ID no formato [TOPICO.SUBTOPICO.QUESTAO] (ex: 3.2.1).
${s.customPrompt ? `\nINSTRUÇÕES ADICIONAIS DO USUÁRIO:\n${s.customPrompt}` : ''}
Gere TODAS as questões sem interromper. Não resuma, não pergunte, não comente — apenas questões.`;
};

// ─── PROMPT: SUMÁRIO DO ORÁCULO ───────────────────────────────────────────────

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

// ─── PROMPT: SUMÁRIO DA ACADEMIA ─────────────────────────────────────────────

export const buildAcademiaSyllabusPrompt = (subjectName, s, autoMode = false) => {
  const estrutura = autoMode
    ? `Você tem liberdade para definir a quantidade de tópicos e subtópicos.
LIMITES: mínimo 6 e máximo 20 subtópicos por tópico.
Prefira MAIS subtópicos menores a MENOS subtópicos maiores.`
    : `Crie exatamente ${s.numTopics} Tópicos com exatamente ${s.numSubtopics} Subtópicos cada.`;

  return `Você é o Arquiteto de Alexandria, construindo o esqueleto de um curso sobre "${subjectName}".

${estrutura}

PRINCÍPIO FUNDAMENTAL — GRANULARIDADE DE QUESTÃO:
Cada subtópico deve ser tão específico que possa ser coberto por:
  1. UM parágrafo de explicação (não um capítulo)
  2. UMA questão de múltipla escolha

TESTE MENTAL que você deve aplicar a cada subtópico:
"Consigo escrever 1 parágrafo sobre isso e criar 1 questão de múltipla escolha sobre apenas isso?"
Se precisaria de 3 parágrafos → o subtópico é um guarda-chuva → quebre-o em 3 subtópicos.

EXEMPLOS DE GRANULARIDADE ERRADA vs CERTA:
ERRADO: "Organização Macroscópica, Segmentação e Sistema Porta do Fígado"
  (cobre 3 conceitos distintos, renderia 4 questões)
CERTO — quebre em:
  - "Lobos hepáticos: direito, esquerdo, quadrado e caudado"
  - "Segmentação de Couinaud: 8 segmentos e relevância cirúrgica"
  - "Sistema porta: origem, tributárias e composição do fluxo"
  - "Dupla irrigação hepática: proporções de volume e oxigênio"

ERRADO: "Tratamento da Hipertensão Portal"
CERTO — quebre em:
  - "Profilaxia primária do sangramento varicoso: betabloqueadores vs ligadura"
  - "Manejo agudo da hemorragia varicosa: vasoconstritores e endoscopia"
  - "TIPS: indicações e contraindicações na hipertensão portal"

REGRAS ADICIONAIS:
- Títulos descritivos: deixe claro O QUE especificamente será ensinado
- Ordem didática: definição → mecanismo → diagnóstico → tratamento → complicações
- Baseie-se no material fornecido quando disponível
- Nada de "Introdução", "Generalidades" ou títulos com vírgulas separando conceitos distintos

FORMATO:
Tópico 1: [Nome]
  - [Subtópico específico]
  - [Subtópico específico]
Tópico 2: [Nome]
  - [Subtópico específico]

Responda APENAS o sumário.`;
};

// ─── PROMPT: AULA DA ACADEMIA ─────────────────────────────────────────────────

export const buildAcademiaLessonPrompt = (topicTitle, subtopics, material = '', subjectName = '') => {
  // Gera exemplo de saída esperada com os 2 primeiros subtópicos para a IA imitar o padrão
  const exampleOutput = subtopics.slice(0, 2).map((s, i) =>
    `## ${s}\n[explicação aqui]`
  ).join('\n\n');

  return `Você é um professor de medicina da Ágora do Saber, criando uma aula sobre "${topicTitle}"${subjectName ? ` (${subjectName})` : ''}.

SUBTÓPICOS A COBRIR — gere EXATAMENTE ${subtopics.length} seções, uma por subtópico, nesta ordem:
${subtopics.map((s, i) => `${i + 1}. ${s}`).join('\n')}

FORMATO DE SAÍDA OBRIGATÓRIO:
Cada seção DEVE começar com ## seguido do título do subtópico, exatamente assim:

## [título do subtópico 1]
[explicação]

## [título do subtópico 2]
[explicação]

... e assim por diante até o subtópico ${subtopics.length}.

EXEMPLO COM SEUS SUBTÓPICOS:
${exampleOutput}
... (continue para todos os ${subtopics.length} subtópicos)

REGRAS DE CONTEÚDO:
- Tamanho por seção: 1 a 2 parágrafos. NÃO escreva 4+ parágrafos por subtópico atômico.
- Cada seção cobre APENAS o conceito do seu subtópico — não misture com outros.
- Comece com o conceito central, depois mecanismo ou critério relevante.
- Use **negrito** para termos-chave, valores críticos e critérios diagnósticos.
- Use listas (- item) para enumerações, classificações e doses.
- Tabelas markdown (| col | col |) são aceitas e encorajadas para comparações.
- Linguagem didática e densa. Português brasileiro.

IMPORTANTE: NÃO use ###, ####, numeração (1.) ou qualquer outro marcador de seção.
Use APENAS ## para separar os subtópicos. O sistema depende disso para funcionar corretamente.

${material ? `MATERIAL BASE:\n${material.substring(0, 40000)}` : '[Sem material — baseie-se no título e subtópicos]'}

Gere a aula COMPLETA para todos os ${subtopics.length} subtópicos, começando pelo ## do primeiro.`;
};

// ─── PROMPT: QUESTÕES DE FIXAÇÃO DA ACADEMIA ──────────────────────────────────

export const buildAcademiaFixationPrompt = (subtopics, topicTitle, s, lessonText = '') => {
  const na = s.numAlternatives || 5;
  const alts = na === 4
    ? 'A) [alternativa]\nB) [alternativa]\nC) [alternativa]\nD) [alternativa]'
    : 'A) [alternativa]\nB) [alternativa]\nC) [alternativa]\nD) [alternativa]\nE) [alternativa]';

  const styleInst = STYLE_INST[s.questionStyle || 'mixed'];
  const typeInst = buildTypeInst(s.questionTypes || ['direct']);
  const subtopicsArr = Array.isArray(subtopics) ? subtopics : [subtopics];

  return `Você é um examinador de residência médica criando questões de fixação para "${topicTitle}".

ESTILO: ${styleInst}
${typeInst ? typeInst + '\n' : ''}
ESTRUTURA — EXATAMENTE 1 questão por subtópico, nesta ordem:
${subtopicsArr.map((s, i) => `${i + 1}. "${s}"`).join('\n')}
Total: EXATAMENTE ${subtopicsArr.length} questões.

REGRA DE ESCOPO (CRÍTICA): cada questão cobre APENAS o conceito do subtópico mapeado para ela.
A questão 2 não pode abordar conteúdo da questão 1, 3 ou qualquer outro.

${REGRAS_ENUNCIADO}
${REGRAS_ALTERNATIVAS}
REGRAS DA EXPLICAÇÃO (fixação — a aula completa está acima):
- 1 a 2 parágrafos curtos
- Por que a correta está certa e por que cada distrator está errado — pelo conteúdo
- Não aprofunde teoria além do necessário
- PROIBIDO: referir-se a letras A, B, C, D, E
${TEMPLATE_QUESTAO(alts)}

Use IDs sequenciais simples (1, 2, 3...).

${lessonText ? `CONTEXTO DA AULA:\n${lessonText.substring(0, 12000)}` : ''}

Gere TODAS as ${subtopicsArr.length} questões sem interromper.`;
};

// ─── PROMPT: BATERIA EXTRA DA ACADEMIA ────────────────────────────────────────

export const buildAcademiaExtraBatteryPrompt = (topicTitle, subtopics, s) => {
  const na = s.numAlternatives || 5;
  const alts = na === 4
    ? 'A) [alternativa]\nB) [alternativa]\nC) [alternativa]\nD) [alternativa]'
    : 'A) [alternativa]\nB) [alternativa]\nC) [alternativa]\nD) [alternativa]\nE) [alternativa]';

  const styleInst = STYLE_INST[s.questionStyle || 'mixed'];
  const typeInst = buildTypeInst(s.questionTypes || ['direct']);

  return `Você é o Oráculo de Medicina da Ágora do Saber, gerando uma bateria de revisão sobre "${topicTitle}".

ESTILO: ${styleInst}
${typeInst ? typeInst + '\n' : ''}
ESTRUTURA:
${subtopics.map((sub, i) => `- Subtópico ${i + 1}: "${sub}" → 1 questão`).join('\n')}
Total: EXATAMENTE ${subtopics.length} questões, uma por subtópico, na ordem acima.

${REGRAS_ENUNCIADO}
${REGRAS_ALTERNATIVAS}
${REGRAS_EXPLICACAO}
${TEMPLATE_QUESTAO(alts)}

Use o ID no formato [SUBTOPICO.QUESTAO] (ex: 1.1, 2.1...).
Gere TODAS as questões sem interromper.`;
};