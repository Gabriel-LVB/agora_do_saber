/**
 * ÁGORA DO SABER — PROMPTS
 */

export const SYLLABUS_LIMITS = {
  oracle: {
    minTopics: 2,
    targetMaxTopics: 10,
    minSubtopicsPerTopic: 2,
    targetMaxSubtopicsPerTopic: 20,
    targetMaxTotalSubtopics: 120,
  },
  academia: {
    minTopics: 2,
    targetMaxTopics: 12,
    minSubtopicsPerTopic: 2,
    targetMaxSubtopicsPerTopic: 20,
    targetMaxTotalSubtopics: 140,
  },
  videoaulas: {
    minSubtopicsPerBlock: 4,
    maxSubtopicsPerBlock: 12,
  },
};

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
## Questão N
[Enunciado — pergunta direta sobre um conceito]
Resposta esperada: [resposta em 1-2 frases]
Explicação: [explicação didática em 2-3 frases]
---
NÃO inclua alternativas A/B/C/D. NÃO coloque "Gabarito:" nem "Alternativa correta:". Apenas o formato acima.`,

  essay: `
TIPO: DISSERTATIVA
Cada questão deve pedir uma resposta de 1 parágrafo (5-8 linhas).
FORMATO OBRIGATÓRIO (siga à risca, sem variações):
## Questão N
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
- Não tente variar a letra correta: escreva a correta em A, pois o site embaralha antes de exibir

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

const ACADEMIA_LESSON_LENGTH_RULES = {
  essential: `
PROFUNDIDADE DA AULA: Nível 1
- MODO RESUMO DE PROVA: escreva em outline de revisão, como Pathoma/First Aid em português, sem virar texto telegráfico.
- Cada seção do Nível 1 deve começar com uma linha de título curto em negrito, sem marcador e sem ##, resumindo o bloco em 2 a 5 palavras. Exemplos: "**Tipos de hérnias**", "**Fisiopatologia das hérnias**", "**Causas de aderências**".
- Use 3 a 5 bullets principais por subtópico; use sub-bullets apenas quando houver classificação, sequência fisiopatológica ou contraste importante.
- O título curto deve dar o contexto geral; os bullets abaixo detalham itens, etapas ou consequências daquele bloco.
- Cada bullet deve ser uma frase curta, clara e cobrável. Depois do título curto, rótulos simples como "**Incisionais:**", "**Umbilicais:**", "**Aprisionamento venoso:**" e "**Infarto intestinal:**" são adequados.
- Não use letras ou números como marcadores internos (A., B., 1., i.). Use apenas "- " e, se necessário, sub-bullets indentados.
- Priorize definição operacional, mecanismo-chave, achado/conduta cobrável e pegadinha, conectando causa → mecanismo → consequência quando fizer sentido.
- Corte rodeios, aberturas genéricas e repetição literal do subtópico, mas não sacrifique clareza para economizar palavras.`,
  balanced: `
PROFUNDIDADE DA AULA: Nível 2
- Cada seção deve começar com uma linha de título curto em negrito, sem marcador e sem ##, resumindo o bloco em 2 a 5 palavras.
- Cada subtópico deve ter 1 parágrafo curto; use 2 apenas se houver critério/lista importante.
- Preserve exemplos, mecanismos e critérios cobrados em prova, mas retire aberturas longas e repetição.`,
  complete: `
PROFUNDIDADE DA AULA: Nível 3
- Cada seção deve começar com uma linha de título curto em negrito, sem marcador e sem ##, resumindo o bloco em 2 a 5 palavras.
- Cada subtópico deve ter 1 a 2 parágrafos fortes; use 3 apenas se o subtópico for realmente denso.
- Contextualize melhor o raciocínio, conectando mecanismo, clínica, critérios e exemplos quando isso ajudar o aprendizado.`
};

const ACADEMIA_LESSON_OBJECTIVE = {
  essential: `
OBJETIVO DE LEITURA:
Escreva como revisão rápida de prova, no estilo "First Aid/Pathoma em português": outline limpo, denso, hierárquico e fácil de escanear.
O aluno deve bater o olho, ler o título curto do bloco e capturar o que cai nos bullets.
Os títulos com ## existem só para o sistema separar as seções; dentro de cada seção, crie um título curto em negrito para orientar a leitura quando o ## estiver oculto.`,
  balanced: `
OBJETIVO DE LEITURA:
Escreva como uma aula enxuta, com raciocínio suficiente para o aluno entender e revisar sem excesso.
Os títulos com ## existem só para o sistema separar as seções; dentro de cada seção, crie um título curto em negrito para orientar a leitura quando o ## estiver oculto.`,
  complete: `
OBJETIVO DE LEITURA:
Escreva como uma aula/apostila contínua, não como flashcards ou verbetes isolados.
Os títulos com ## existem só para o sistema separar as seções; dentro de cada seção, crie um título curto em negrito para orientar a leitura quando o ## estiver oculto.`
};

const TEMPLATE_QUESTAO = (alts) => `
FORMATO OBRIGATÓRIO (uma questão por bloco ---):
## Questão 1.1.1
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
Quando uma lista de subtópicos obrigatórios for fornecida, ela substitui esta seção.
Se NÃO houver lista obrigatória, defina uma estrutura completa para revisão.
FAIXA DE REFERÊNCIA: ${SYLLABUS_LIMITS.oracle.minSubtopicsPerTopic} a ${SYLLABUS_LIMITS.oracle.targetMaxSubtopicsPerTopic} subtópicos por tópico.
Critérios:
- Use subtópicos suficientes para cobrir os blocos reais de estudo
- Quantidade ideal: a necessária para cobrir o essencial sem repetição
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
## Questão 1.1.1
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

Use o ID no formato TOPICO.SUBTOPICO.QUESTAO, sem colchetes (ex: ## Questão 3.2.1).
${s.customPrompt ? `\nINSTRUÇÕES ADICIONAIS DO USUÁRIO:\n${s.customPrompt}` : ''}
Gere TODAS as questões sem interromper. Não resuma, não pergunte, não comente — apenas questões.`;
};

// ─── PROMPT: SUMÁRIO DO ORÁCULO ───────────────────────────────────────────────

export const buildOracleSyllabusPrompt = (subjectName, s, autoMode = false) => {
  const l = SYLLABUS_LIMITS.oracle;
  const estrutura = autoMode
    ? `Defina a quantidade ideal de tópicos e subtópicos para cobrir "${subjectName}" com base no material fornecido.
OBJETIVO: criar um roteiro de estudo completo e utilizável, não um índice enciclopédico.
FAIXA DE REFERÊNCIA:
- Assunto comum: ${l.minTopics} a ${l.targetMaxTopics} tópicos no total
- ${l.minSubtopicsPerTopic} a ${l.targetMaxSubtopicsPerTopic} subtópicos por tópico costuma ser suficiente
- Materiais longos devem virar MAIS TÓPICOS, não tópicos gigantes
- Use mais subtópicos quando o material realmente exigir cobertura própria
- Os tópicos devem emergir naturalmente do material — não use divisões genéricas fixas
- Cada subtópico = 1 bloco específico e testável, sem sobreposição com outros
- PROIBIDO: um único tópico com dezenas de subtópicos. Se um tópico passar de 30 subtópicos, divida em tópicos menores.`
    : `Crie exatamente ${s.numTopics} Tópicos com exatamente ${s.numSubtopics} Subtópicos cada.`;

  return `Você é o Arquiteto de Alexandria. Crie um sumário para "${subjectName}" baseado no material do usuário.

${estrutura}

REGRAS:
- Baseie os subtópicos no material fornecido — não extrapole para fora do que foi pedido
- Ordem obrigatória dentro de cada tópico: fundamentos antes de detalhes, mecanismo antes da aplicação clínica, regra antes da exceção
- Subtópicos concretos e objetivos — nada de "Generalidades", "Introdução" ou "Aspectos gerais"
- Se o material for muito grande, preserve a cobertura por importância de prova e crie mais tópicos/subtópicos quando necessário

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
  const l = s?.source === 'academia' ? SYLLABUS_LIMITS.academia : SYLLABUS_LIMITS.oracle;
  return `Você é o Arquiteto de Alexandria. Ajuste o sumário abaixo conforme a instrução do usuário.

SUMÁRIO ATUAL:
${currentSyllabus}

INSTRUÇÃO DO USUÁRIO:
${feedback}

REGRAS:
- Mantenha a estrutura de Tópicos e Subtópicos
- Preserve a ordem didática (geral → específico, mecanismo → aplicação)
- Cada subtópico deve ser um conceito testável independente
- Mantenha o sumário completo e fiel: use mais tópicos/subtópicos quando o material ou o usuário pedir
- Não junte tópicos apenas para reduzir tamanho; preserve blocos independentes
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
A IA deve definir uma estrutura completa para estudo.
FAIXA DE REFERÊNCIA: ${SYLLABUS_LIMITS.oracle.minTopics} a ${SYLLABUS_LIMITS.oracle.targetMaxTopics} tópicos no total; ${SYLLABUS_LIMITS.oracle.minSubtopicsPerTopic} a ${SYLLABUS_LIMITS.oracle.targetMaxSubtopicsPerTopic} subtópicos por tópico, ampliando quando o material exigir.
Critérios: tópicos emergem do material, ordem didática (geral → específico), cada subtópico = 1 bloco testável independente.
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
  const minPerBlock = SYLLABUS_LIMITS.videoaulas.minSubtopicsPerBlock;
  const maxPerBlock = SYLLABUS_LIMITS.videoaulas.maxSubtopicsPerBlock;
  const idealPerBlock = Math.max(minPerBlock, Math.min(maxPerBlock, qPerBlock || 6));
  return `Você é um especialista em avaliações médicas. Sua tarefa é criar um guia de questões para a aula "${aula.title}".

ESTRUTURA OBRIGATÓRIA:
- ${numBlocks} bloco(s) de questões
- Entre ${minPerBlock} e ${maxPerBlock} subtópicos por bloco (ideal: ${idealPerBlock})
- Ordem OBRIGATORIAMENTE didática dentro de cada bloco: conceitos gerais → específicos, mecanismo → clínica → tratamento
- Nunca coloque um detalhe, exceção ou efeito adverso antes de ter coberto o conceito principal

REGRAS DOS SUBTÓPICOS:
- Cada subtópico = 1 conceito médico específico e testável
- RUIM: "Introdução", "Generalidades", "Aspectos gerais do tratamento"
- BOM: "Critérios diagnósticos da Síndrome Nefrótica", "Mecanismo de ação dos IECA na DRC"
- Não repita conceitos entre subtópicos
- Não coloque exceções ou complicações antes de cobrir o conceito principal
- Priorize o que é cobrado em provas de residência médica
- Separe detalhes com potencial de cobrança própria; evite apenas repetir frases da aula sem transformar em conceito testável

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
  const l = SYLLABUS_LIMITS.academia;
  const estrutura = autoMode
    ? `Defina uma estrutura completa para uma aula eficiente.
O sumário será usado assim: cada subtópico vira uma seção explicada pelo professor, e depois o sistema cria questões de fixação para o tópico como um todo. Portanto, os subtópicos devem ter fronteiras conceituais claras e não devem ser variações redundantes do mesmo eixo de cobrança.
FAIXA DE REFERÊNCIA:
- ${l.minTopics} a ${l.targetMaxTopics} tópicos costuma funcionar bem
- ${l.minSubtopicsPerTopic} a ${l.targetMaxSubtopicsPerTopic} subtópicos por tópico costuma funcionar bem
- Para materiais longos, crie mais tópicos em vez de inchar um único tópico
- Use mais subtópicos quando o material trouxer blocos independentes
- PROIBIDO: tópico com dezenas de subtópicos. Se um tópico passaria de 30 subtópicos, divida esse bloco em tópicos menores.
Crie subtópicos como UNIDADES ENSINÁVEIS: cada um deve render cerca de 1 a 2 parágrafos fortes de explicação.
Não atomize por frase, item de lista, exemplo isolado ou microdetalhe.
Não crie subtópicos guarda-chuva que misturem definição, diagnóstico, classificação, complicações, exames e tratamento quando esses blocos renderem cobranças próprias.
Se um bloco exigiria 4 ou mais parágrafos para explicar bem, divida em 2 ou mais subtópicos.`
    : `Crie exatamente ${s.numTopics} Tópicos com exatamente ${s.numSubtopics} Subtópicos cada.`;

  return `Você é o Arquiteto de Alexandria, construindo o sumário de um curso sobre "${subjectName}".
${estrutura}

FONTE OBRIGATÓRIA — SIGA O MATERIAL:
O sumário deve ser um índice fiel do material fornecido. Siga a ordem do material.
Não reordene, não generalize, não extrapole. Não junte tópicos vizinhos apenas para economizar geração.

COMO CALIBRAR O TAMANHO DE UM SUBTÓPICO:
Cada subtópico deve corresponder a um bloco de conteúdo que, no material original, ocupa
aproximadamente 3 a 10 linhas (ou 1 a 2 parágrafos curtos).

REGRA DE FRONTEIRA DE COBRANÇA:
Antes de finalizar o sumário, pergunte para cada subtópico: "que tipo de questão diferente este subtópico permite gerar?".
Mantenha o subtópico apenas se a resposta for clara e diferente dos subtópicos vizinhos.
Se dois subtópicos gerariam praticamente a mesma pergunta, funda-os ou reescreva-os para separar eixos diferentes de cobrança.
Evite repetir a mesma entidade em vários tópicos. Se a repetição for inevitável, o título deve explicitar um eixo novo, como anatomia, mecanismo, clínica, morfologia, fator de risco, diagnóstico, tratamento, complicação ou prognóstico.
Não separe artificialmente "patogenia", "fatores", "mecanismos" e "consequências" quando isso só produziria variações da mesma questão.
Não coloque exemplos específicos em tópicos errados só porque apareceram cedo no material; mantenha cada doença, síndrome ou tumor no bloco temático onde ela será cobrada.

EXEMPLOS DE CALIBRAÇÃO (use como referência de tamanho):

ERRADO — granularidade excessiva sem conceito próprio (cada item é apenas uma frase solta do material):
  - Hérnias: distinção entre hérnia e evisceração
  - Hérnias: fisiopatologia do aprisionamento venoso
  - Hérnias: comprometimento arterial e venoso
  - Hérnias: incidência de hérnias incisionais
  - Hérnias: risco em cirurgias contaminadas

CERTO — unidade ensinável, específica e suficiente para uma seção:
  - Hérnias: fisiopatologia do encarceramento e estrangulamento
  - Hérnias incisionais: fatores de risco e prevenção
  - Hérnias inguinais congênitas: fisiopatologia e conduta

ERRADO — mesma entidade repetida em blocos diferentes sem eixo novo:
  - Anatomia: hérnias de hiato
  - Esofagites: hérnia de hiato e refluxo
  - Complicações: hérnia de hiato por deslizamento

CERTO — entidade localizada uma vez ou retomada com eixo explícito:
  - Hérnias de hiato: deslizamento versus paraesofágica
  - Doença do refluxo: barreira anti-refluxo, esofagite e fatores predisponentes

ERRADO — facetamento que tende a gerar perguntas repetidas:
  - Gastrite aguda: mecanismos de proteção
  - Gastrite aguda: fatores que rompem a proteção
  - Úlcera aguda: isquemia e AINEs
  - Úlcera aguda: hipóxia e lesão intracraniana

CERTO — bloco com fronteira de cobrança mais limpa:
  - Gastrite aguda e úlceras de estresse: barreira mucosa, AINEs, isquemia, Curling e Cushing

REGRA GERAL: separe blocos independentes sempre que eles renderem uma explicação própria.
Não una temas independentes apenas porque a soma ficaria abaixo de um limite de subtópicos; una apenas quando a separação criaria cobrança repetida.

Proibido: títulos vagos como "Introdução", "Generalidades", "Aspectos gerais".
Proibido: subtópico que descreve apenas 1 frase do material.
Proibido: sumário enciclopédico que transforma cada bullet do material em um subtópico.
Proibido: repetir a mesma síndrome/doença em tópicos diferentes sem eixo de cobrança explicitamente novo.
Obrigatório: cobrir todo o material relevante, sem cortar conteúdo para caber em uma quantidade fixa.
Obrigatório: revisar o sumário final removendo duplicidades e subtópicos que só mudam palavras, não o conceito cobrado.
Obrigatório: antes de responder, revise tópicos gigantes e divida qualquer tópico que passe de 30 subtópicos.
FORMATO:
Tópico 1: [Nome]
  - [Subtópico]
  - [Subtópico]
Tópico 2: [Nome]
  - [Subtópico]

Responda APENAS o sumário.`;
};

// ─── PROMPT: AULA DA ACADEMIA ─────────────────────────────────────────────────

export const buildAcademiaLessonPrompt = (topicTitle, subtopics, material = '', subjectName = '', explanationLength = 'complete', extraInstruction = '') => {
  const lengthMode = ACADEMIA_LESSON_LENGTH_RULES[explanationLength] ? explanationLength : 'complete';
  // Gera exemplo de saída esperada com os 2 primeiros subtópicos para a IA imitar o padrão
  const exampleOutput = subtopics.slice(0, 2).map((s, i) =>
    lengthMode === 'essential'
      ? `## ${s}\n**[título curto do bloco]**\n- **[item/etapa principal]:** [frase curta e cobrável]\n- **[item/etapa principal]:** [relação de causa e consequência em linguagem direta]\n- **[ponto de prova]:** [exceção, associação ou conduta quando houver]`
      : `## ${s}\n**[título curto do bloco]**\n[explicação aqui]`
  ).join('\n\n');

  return `Você é um professor de medicina da Ágora do Saber, criando uma aula sobre "${topicTitle}"${subjectName ? ` (${subjectName})` : ''}.

SUBTÓPICOS A COBRIR — gere EXATAMENTE ${subtopics.length} seções, uma por subtópico, nesta ordem:
${subtopics.map((s, i) => `${i + 1}. ${s}`).join('\n')}

${ACADEMIA_LESSON_OBJECTIVE[lengthMode]}

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
${ACADEMIA_LESSON_LENGTH_RULES[lengthMode]}
- Cada seção cobre APENAS o conceito do seu subtópico — não misture com outros.
- Logo após o ## obrigatório, crie um título curto em negrito que sintetize o subtópico sem copiar tudo. Errado: repetir "Tipos especiais de hérnias: incisionais, umbilicais e inguinais". Certo: "**Tipos de hérnias**".
- ${lengthMode === 'essential'
    ? 'Escreva em outline de revisão, com bullets densos e frases completas; não escreva como parágrafo acadêmico.'
    : 'Escreva em fluxo narrativo: conecte a seção atual à anterior quando fizer sentido, usando transições naturais.'}
- ${lengthMode === 'essential'
    ? 'Não comece com fragmentos soltos como "dor, distensão, vômitos". Transforme isso em bullet útil, por exemplo: "A hérnia obstrutiva costuma causar dor, distensão, vômitos e constipação."'
    : 'Evite começar toda seção com "[subtópico] é..." ou "[subtópico] refere-se...". Varie a abertura e dê continuidade ao raciocínio.'}
- ${lengthMode === 'essential'
    ? 'Não use frases como "é fundamental observar", "desempenha papéis cruciais" ou similares; elas inflam o texto.'
    : 'Comece pelo papel daquele conceito dentro do assunto maior, depois explique mecanismo, critério ou consequência relevante.'}
- ${lengthMode === 'essential'
    ? 'Evite repetir literalmente o título do subtópico como abertura. Reescreva a ideia em formato de anotação de prova, usando negrito para rótulos clínicos quando ajudar.'
    : 'Não transforme cada subtópico em um fato isolado. Mostre como as ideias se encadeiam.'}
- Use **negrito** para termos-chave, valores críticos e critérios diagnósticos.
- Use listas (- item) para enumerações, classificações e doses.
- Tabelas markdown (| col | col |) são aceitas e encorajadas para comparações.
- Linguagem didática e densa. Português brasileiro.

IMPORTANTE: NÃO use ###, ####, numeração (1.) ou qualquer outro marcador de seção.
Use APENAS ## para separar os subtópicos. O sistema depende disso para funcionar corretamente.

${extraInstruction ? `PEDIDO ESPECÍFICO DO USUÁRIO PARA ESTA GERAÇÃO:\n${extraInstruction}\n` : ''}

${material ? `MATERIAL BASE:\n${material.substring(0, 120000)}` : '[Sem material — baseie-se no título e subtópicos]'}

Gere a aula no Nível ${lengthMode === 'essential' ? '1' : lengthMode === 'balanced' ? '2' : '3'} para todos os ${subtopics.length} subtópicos, começando pelo ## do primeiro.
Antes de responder, confira se cada seção respeita o limite do nível escolhido.`;
};

// ─── PROMPT: QUESTÕES DE FIXAÇÃO DA ACADEMIA ──────────────────────────────────

export const buildAcademiaFixationPrompt = (subtopics, topicTitle, s, lessonText = '', questionPlan = null, previousQuestions = '') => {
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
SUBTÓPICOS DA AULA (use como mapa de cobertura, não como lista mecânica de tarefas):
${subtopicsArr.map((s, i) => `${i + 1}. ${s}`).join('\n')}

REGRA DE FIXAÇÃO (CRÍTICA):
- Gere questões para a AULA COMO UM TODO, usando os subtópicos apenas como referência de organização.
- A bateria será usada pelo aluno como principal revisão ativa da aula: ela deve cobrir os 80% mais importantes, cobrados e esquecíveis do conteúdo.
- Não seja econômico demais. Gere quantidade suficiente para que um aluno que leu a aula consiga revisar os conceitos centrais pelas questões sem precisar reler tudo.
- Dê mais questões aos blocos de maior peso, maior densidade, maior chance de prova, maior risco de confusão ou maior número de contrastes importantes.
- NÃO force o mesmo número de questões por subtópico.
- NÃO há mínimo obrigatório por subtópico; um subtópico pode ficar sem questão se a cobrança seria redundante.
- Um subtópico pode ter mais de uma questão quando houver ângulos realmente diferentes e úteis.
- Cada questão deve ter um eixo de cobrança próprio: definição, mecanismo, diagnóstico, achado, classificação, conduta, complicação, diferencial ou pegadinha.
- É proibido criar duas questões que testem praticamente a mesma ideia, mesmo com enunciados, casos ou alternativas diferentes.
- Se subtópicos vizinhos falarem do mesmo fenômeno, una mentalmente a cobrança e varie o eixo; não repita a pergunta.
- Não crie questão sobre conteúdo que não apareceu na aula/material.
- Escolha livremente a quantidade final de questões com foco em cobertura de alto rendimento e retenção, sem teto, piso fixo ou quota por subtópico.
- Antes de finalizar, faça uma revisão mental: se a bateria ficou curta demais para revisar bem a aula, acrescente questões sobre eixos ainda descobertos; se houver repetição conceitual, remova ou reformule.

${REGRAS_ENUNCIADO}
${REGRAS_ALTERNATIVAS}
REGRAS DA EXPLICAÇÃO (fixação — a aula completa está acima):
- 1 a 2 parágrafos curtos
- Por que a correta está certa e por que cada distrator está errado — pelo conteúdo
- Não aprofunde teoria além do necessário
- PROIBIDO: referir-se a letras A, B, C, D, E
${TEMPLATE_QUESTAO(alts)}

Use IDs no formato SUBTOPICO.QUESTAO, sem colchetes, apenas para indicar o subtópico MAIS RELACIONADO à questão:
## Questão 1.1
## Questão 1.2
## Questão 2.1
Pode haver saltos, subtópicos sem questão e subtópicos com várias questões.

${lessonText ? `CONTEXTO DA AULA:\n${lessonText.substring(0, 12000)}` : ''}

${previousQuestions ? `QUESTÕES JÁ EXISTENTES SOBRE ESTA AULA (não copie; varie foco, cenário e distratores):\n${previousQuestions.substring(0, 8000)}` : ''}

Gere a bateria de fixação completa sem interromper.`;
};

// ─── PROMPT: BATERIA EXTRA DA ACADEMIA ────────────────────────────────────────

export const buildAcademiaExtraBatteryPrompt = (topicTitle, subtopics, s, lessonText = '', previousQuestions = '') => {
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

Use o ID no formato SUBTOPICO.QUESTAO, sem colchetes (ex: ## Questão 1.1, ## Questão 2.1...).
${lessonText ? `\nCONTEXTO DA AULA/EXPLICAÇÕES (base obrigatória das questões):\n${lessonText.substring(0, 12000)}` : ''}
${previousQuestions ? `\nQUESTÕES ANTERIORES (faça algo ligeiramente diferente, sem repetir a mesma ideia):\n${previousQuestions.substring(0, 8000)}` : ''}
Gere TODAS as questões sem interromper.`;
};
