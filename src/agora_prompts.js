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

  flashcard: `
TIPO: FLASHCARD
Crie flashcards em português do Brasil como especialista em educação médica, residência e neurociência da aprendizagem.
OBJETIVO: os cartões devem ensinar por recuperação ativa. O aluno deve tentar responder, errar se não souber, ler a explicação e pensar "agora entendi"; na próxima revisão, deve conseguir responder.
QUANTIDADE: não use quantidade fixa. Gere o menor conjunto útil que preserve cobertura de alto rendimento. Para caderno de erros, lacunas declaradas pelo usuário ou conteúdo explicitamente marcado como crítico, trate tudo como lacuna importante e não omita pontos acionáveis.
PRINCÍPIO DE GRANULARIDADE:
- "Atômico" não significa separar tudo em cards minúsculos. Significa que o aluno sabe exatamente o que precisa recuperar.
- Agrupe itens quando eles formam uma unidade natural de prova ou prática, como "3 efeitos adversos que mais limitam o uso", "monitorização obrigatória", "tríade clássica" ou "fármacos que aumentam lítio". Nesses casos, o conjunto curto é uma única memória.
- Separe em cards diferentes quando os itens têm usos, mecanismos, decisões ou explicações diferentes e seriam estudados melhor isoladamente.
- Não crie três cards fracos para três efeitos adversos se um card bom perguntando "quais 3 principais efeitos adversos?" resolve melhor. Crie cards separados apenas para efeitos que exigem mecanismo, conduta ou pegadinha própria.
- Listas são permitidas se forem curtas, fechadas e úteis. Limite normal: 2 a 4 itens. Nunca peça lista aberta.

REGRAS DA PERGUNTA:
- Frente curta, direta e previsível. Prefira 6 a 18 palavras, mas inclua contexto suficiente para uma única resposta justa.
- Toda pergunta deve terminar com ponto de interrogação.
- Evite começar muitos cartões com "Qual a principal indicação/característica/conduta". Varie a formulação e deixe claro o alvo da memória.
- Evite perguntas abertas genéricas como "O que é X?", "Defina X" ou "Qual a principal característica de X?" quando a resposta puder ser ampla demais.
- Evite perguntas de sim/não. Em vez de "Lamotrigina trata mania aguda?", prefira "Lamotrigina: em qual fase bipolar ela é fraca/ineficaz?".
- PROIBIDO "cite um efeito adverso" com resposta contendo várias opções. Se quer um exemplo, a resposta deve ter um exemplo; se quer o conjunto, pergunte o conjunto.
- Se a pergunta disser "dois", "três", "(2)" ou "(3)", a resposta deve ter exatamente essa quantidade. Nunca peça 2 e responda 3.
- Não use "ou" na resposta salvo quando a pergunta pedir explicitamente alternativas equivalentes. Preferencialmente escolha um conjunto fixo ou divida o card.
- Use dificuldade desejável: force recuperação ativa sem entregar a resposta por familiaridade, gramática, tamanho ou pista semântica.
- Zero ambiguidade: a falha deve ser de memória/raciocínio, nunca de interpretação.

REGRAS DA RESPOSTA:
- A resposta deve ser o alvo de memória, não uma explicação.
- Ideal: 1 a 6 palavras. Para conjuntos naturais, use 2 a 4 itens curtos separados por vírgula.
- Respostas genéricas como "conduta adequada", "monitorar", "avaliar risco-benefício", "doença crônica" ou "processo multifatorial" são proibidas, salvo se a pergunta pedir exatamente essa classificação com contexto técnico.
- PROIBIDO cartão de bom senso genérico que qualquer pessoa acertaria sem estudar, como "reavaliar necessidade", "monitorar paciente", "tratar a causa", "orientar adesão", "psicoeducação", "simplificar o regime", "revisar medicamentos", "desprescrever fármacos desnecessários" ou "encaminhar se grave", salvo se exigir conhecimento técnico específico.
- PROIBIDO cartão cujo enunciado pergunte "qual princípio", "qual estratégia geral", "como otimizar", "qual medida inicial para reduzir riscos" ou variações, quando a resposta for conselho universal aplicável a quase qualquer paciente.

REGRAS DA EXPLICAÇÃO:
- O campo Explicação existe para quando o aluno não sabe a resposta. Ele deve explicar por que a resposta é aquela ou como ela acontece, sem virar aula completa.
- A Explicação NÃO pode repetir a resposta com mais palavras. Ela deve acrescentar entendimento causal, funcional ou discriminativo diretamente ligado à pergunta.
- Se o card pergunta efeitos colaterais, a resposta lista os efeitos e a explicação diz por que eles ocorrem ou por que importam.
- Se o card pergunta uma conduta, indicação ou escolha de fármaco, a explicação diz qual propriedade do fármaco ou do quadro clínico justifica a escolha. Não basta dizer que é "primeira linha", "eficaz", "preferido" ou "indicado".
- Se o card pergunta uma interação, contraindicação ou risco, a explicação mostra a cadeia causal do problema.
- Se o card pergunta uma definição/classificação, a explicação mostra o critério que diferencia isso de algo parecido.
- Não use a explicação para despejar teoria, histórico, listas, "curso" ou informações que não ajudem a entender a resposta daquele card.
- Tamanho da explicação: normalmente 2 a 4 frases curtas. Pode ser 1 frase se ela realmente explicar; pode passar disso apenas se for necessário para entender a resposta.
- Teste de reprovação: se a explicação só trocar a resposta por sinônimos, listar a resposta de novo, ou disser apenas "é usado porque é eficaz/primeira linha", ela está ruim.
- Exemplo ruim:
Pergunta: Quais indicações do valproato no bipolar I?
Resposta: Mania aguda, episódios mistos, ciclagem rápida.
Explicação: O valproato é primeira linha para mania e episódios mistos, sendo útil na ciclagem rápida.
- Exemplo bom:
Pergunta: Valproato no bipolar I: em quais quadros ele é especialmente útil?
Resposta: Mania, episódios mistos, ciclagem rápida.
Explicação: O valproato tem efeito antimaníaco robusto e costuma funcionar melhor que opções mais "limpas" quando há quadro misto ou instabilidade frequente. A utilidade vem do perfil amplo de estabilização, não apenas de ser um anticonvulsivante.

REGRAS DE COBERTURA E QUALIDADE:
- Teste de serventia: se acertar o cartão não melhora desempenho em prova, decisão prática real ou compreensão causal de outro conceito, exclua ou reescreva.
- Quando o material do usuário pedir um foco específico, obedeça esse foco de forma literal. Não substitua uma solicitação específica por princípios amplos, conselhos gerais ou tópicos administrativos.
- Não repita a mesma memória com outra frase. Exemplo ruim: um card "lítio reduz suicídio" e outro "benefício único do lítio: redução do suicídio".
- Cubra o essencial antes de detalhes. Não faça card sobre detalhe periférico enquanto faltam escolhas, riscos, mecanismos, apresentações ou comparações centrais do tópico.
- Antes de finalizar, audite: há pergunta pedindo N e resposta com quantidade diferente? há resposta com "ou" vago? há duplicação? há atomização burra? há card genérico? corrija.
FORMATO OBRIGATÓRIO (siga à risca, sem alternativas):
## Flashcard N
Pergunta: [pergunta curta e objetiva?]
Resposta: [resposta curta, poucas palavras]
Explicação: [explicação curta do porquê/como da resposta, sem virar aula]
---`,

  cloze: `
TIPO: FLASHCARD CLOZE DELETION
Crie flashcards cloze deletion em português do Brasil, no estilo AnKing.
OBJETIVO: transformar fatos de alto rendimento em frases curtas com uma lacuna testável, usando o formato nativo do Anki. O aluno deve recuperar o termo oculto e, no Extra, entender por que ele é a resposta.
REGRAS CRÍTICAS:
- Use sintaxe Anki real: {{c1::resposta}} ou, quando ajudar, {{c1::resposta::dica curta}}.
- Cada bloco deve ter um alvo claro de recuperação. Se houver duas lacunas independentes com raciocínios diferentes, crie dois Clozes separados.
- Se o fato é uma lista curta que funciona como unidade natural, use uma lacuna única com o conjunto completo: {{c1::item A, item B e item C}}.
- Preferência forte: use sempre c1 em cada nota, para manter um cartão por nota e evitar cartões irmãos desnecessários.
- A frase deve ser curta, natural e autossuficiente. O aluno deve entender o contexto sem ler uma explicação antes.
- Cloze bom não é frase copiada do material: reescreva como afirmação testável, curta e com contexto suficiente.
- A parte ocultada deve ser pequena: 1 a 6 palavras. Não oculte parágrafos, listas longas ou frases inteiras.
- Para conjuntos naturais, a parte ocultada pode ter 2 a 4 itens curtos. Não crie c1, c2 e c3 para uma lista que deve ser lembrada como bloco.
- Evite lacunas óbvias por gramática. A frase não pode entregar a resposta por concordância, tamanho, oposição simplória ou pistas semânticas.
- Proibido cartão de bom senso genérico: adesão, psicoeducação, revisar medicação, desprescrever, monitorar, avaliar risco-benefício, otimizar tratamento ou condutas universais, salvo se houver critério/fármaco/mecanismo específico.
- Cada cloze deve ser testável em prova ou útil na vida real. Se não muda desempenho em prova, decisão clínica ou compreensão causal, exclua.
- O campo Extra é explicação, não curso: explique por que o termo oculto pertence ali ou como ele produz o efeito perguntado.
- O Extra NÃO pode apenas repetir a frase cloze com mais palavras. Se o cloze cobra efeito colateral, explique o motivo do efeito; se cobra escolha/conduta, explique a propriedade que justifica a escolha; se cobra risco/interação, explique a cadeia causal.
- Tamanho do Extra: normalmente 2 a 4 frases curtas, só o necessário para a resposta fazer sentido.
- Antes de finalizar, audite: lacuna previsível? quantidade exata? lista curta agrupada quando deveria? lista longa dividida quando deveria? duplicação? card óbvio? corrija.
FORMATO OBRIGATÓRIO (siga à risca, sem alternativas):
## Cloze N
Texto: [frase curta com {{c1::termo oculto}}]
Extra: [explicação curta do porquê/como do termo oculto, sem virar aula]
---`,
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
  old_exam: 'Provas antigas',
  flashcard: 'Flashcards',
  cloze: 'Flashcards Cloze',
};

const isFlashcardType = (type) => type === 'flashcard' || type === 'cloze';
const onlyMemoryCards = (types = []) => types.length === 1 && isFlashcardType(types[0]);
const onlyClozeCards = (types = []) => types.length === 1 && types[0] === 'cloze';
const memoryCardName = (types = []) => onlyClozeCards(types) ? 'clozes' : 'flashcards';
const memoryCardFormat = (types = []) => onlyClozeCards(types) ? `
FORMATO OBRIGATÓRIO:
## Cloze 1
Texto: [frase curta com {{c1::termo oculto}}]
Extra: [explicação curta do porquê/como do termo oculto]
---` : `
FORMATO OBRIGATÓRIO:
## Flashcard 1
Pergunta: [pergunta objetiva?]
Resposta: [resposta curta]
Explicação: [explicação curta do porquê/como da resposta]
---`;

export const STYLE_INST = {
  hybrid:  'Modo misto: quando o fluxo suportar duas passadas, gere primeiro fixação direta e depois casos clínicos integradores. Em prompts de passada única, trate esta etapa como questões diretas de alto rendimento, sem vinheta clínica.',
  clinical: 'Use EXCLUSIVAMENTE vinhetas clínicas reais e bem construídas: paciente + contexto + evolução + achados relevantes + ponto de decisão. O caso deve exigir raciocínio clínico, não ser uma pergunta direta fantasiada de caso.',
  direct:   'Use EXCLUSIVAMENTE questões diretas de alto rendimento: alvo de cobrança estreito, resposta previsível e distratores próximos. A pergunta deve testar mecanismo, critério, classificação, conduta, exceção, comparação ou consequência prática — nunca curiosidade solta. PROIBIDO usar paciente, história clínica, vinheta, Caso-base, idade/sexo ou cenário narrativo. Pergunte o conceito diretamente; casos clínicos serão gerados em outra etapa.',
  mixed:    `ESTILO: CASOS ENCADEADOS
Organize a bateria em uma quantidade IDEAL de casos clínicos, escolhida por você conforme a amplitude, densidade e diversidade do conteúdo. Não crie automaticamente um caso por tópico ou subtópico e não force uma quantidade fixa.

Cada caso deve sustentar uma sequência de 2 a 5 questões progressivas, cada uma cobrando uma decisão ou conceito diferente. Primeiro apresente o cenário clínico com dados realmente discriminativos; nas questões seguintes, aprofunde o mesmo caso por novos ângulos úteis, como hipótese, interpretação de achado, mecanismo, próxima conduta, escolha entre opções próximas, contraindicação, troca após evento adverso, complicação, prognóstico ou mudança diante de nova informação.

REGRAS DOS CASOS ENCADEADOS:
- Respeite a quantidade total solicitada. Se ela não comportar ao menos duas questões sobre um caso, crie uma questão clínica independente em vez de forçar um encadeamento artificial.
- Agrupe questões pelo caso e conclua a sequência antes de iniciar o próximo.
- Em TODAS as questões da sequência, use exatamente dois campos separados antes das alternativas:
  Caso-base: Caso 1 — [vinheta clínica original completa, repetida sem abreviar]
  Enunciado: [pergunta específica desta questão; inclua aqui qualquer evolução nova necessária]
- Repita o mesmo Caso-base integralmente em todas as questões ligadas a ele. Nunca escreva "paciente do caso anterior", "conforme o caso anterior" ou qualquer referência que obrigue o aluno a procurar outra questão.
- O Caso-base apresenta apenas a vinheta compartilhada. O Enunciado apresenta somente a pergunta daquela questão e eventual evolução nova, sem recontar a vinheta.
- Cada questão deve continuar compreensível isoladamente em revisão, exportação e Modo Prova.
- Faça o caso evoluir quando isso criar uma nova decisão legítima. Não invente evolução apenas para preencher quantidade.
- Cada questão da sequência deve testar um eixo diferente. É proibido perguntar a mesma ideia com outras palavras.
- Use casos suficientes para cobrir perspectivas importantes e populações/situações distintas, sem pulverizar o conteúdo em muitos casos rasos.
- O caso deve nascer do material e do tópico fornecidos. Não presuma que a prova é de farmacologia, semiologia, cirurgia ou qualquer disciplina específica.
- Quando o material trouxer preferências de professor, padrões de prova ou focos específicos, incorpore-os. Sem essa informação, use critérios médicos gerais de alto rendimento.
- Preserve integralmente todas as regras compartilhadas de enunciado, alternativas, distratores, explicação, dificuldade e utilidade.

Antes de finalizar, audite a bateria: a quantidade de casos é adequada? cada caso aprofunda de verdade? cada questão exige uma decisão distinta? o conjunto cobre o conteúdo sem repetição?`,
};

// ─── REGRAS COMPARTILHADAS ────────────────────────────────────────────────────

const REGRAS_ENUNCIADO = `
REGRAS DO ENUNCIADO:
- Jamais mencione a aula, o professor, o assunto ou qualquer referência ao contexto didático
- O enunciado NUNCA deve conter palavras que sejam sinônimos diretos da resposta correta. Se a resposta é "inibição da bomba de prótons", o enunciado não pode dizer "supressão ácida" ou "bomba de prótons"
- Nos casos clínicos: inclua idade, sexo, contexto relevante, tempo de evolução, sintomas e achados de exame — nunca entregue o diagnóstico ou tratamento que é a resposta
- Vinheta clínica boa precisa ter um "dado discriminativo": algo que diferencie a correta dos distratores. Sem esse dado, a questão vira decoreba ou chute.
- Use 2 a 4 achados positivos relevantes e, quando ajudar, 1 a 2 achados negativos úteis para afastar uma alternativa plausível. Não encha o caso com dados decorativos.
- Só inclua exame, dose, medicamento em uso, comorbidade, gestação, função renal/hepática, idade ou antecedente se isso mudar a resposta ou diferenciar alternativas.
- O final do caso deve pedir uma decisão clara: diagnóstico mais provável, próxima conduta, fármaco mais adequado, efeito adverso provável, mecanismo do quadro, exame confirmatório ou contraindicação relevante.
- PROIBIDO usar pistas no enunciado como "destacando-se por", "frequentemente escolhido por", "com perfil típico de", "clássico de", "característico de" quando isso entrega a resposta.
- PROIBIDO criar caso clínico que só diz "paciente tem X; qual é X?". O caso deve obrigar o aluno a inferir X a partir dos dados.
- Em farmacologia clínica, o caso deve trazer o motivo da escolha entre alternativas próximas: fase da doença, comorbidade, efeito adverso prévio, interação, gestação, risco metabólico, função renal/hepática ou contraindicação específica. Não pergunte apenas "qual fármaco é primeira linha?" em forma de caso.
- Em questões de conduta, não pergunte conduta genérica. Traga gravidade, estabilidade, contraindicações e objetivo terapêutico quando forem necessários para decidir.
- Nas questões diretas: enunciado objetivo, sem introduções desnecessárias, com escopo claro e tipo de resposta previsível.
- Questão direta boa não é "fácil": ela deve cobrar um ponto que diferencie conceitos próximos, como mecanismo versus efeito, critério versus achado inespecífico, exceção versus regra, primeira escolha versus contraindicação, ou causa versus consequência.
- PROIBIDO pergunta direta ampla demais como "O que é X?", "Qual a principal característica de X?", "Qual o tratamento de X?" ou "Qual a conduta em X?" quando a resposta poderia ter várias camadas. Reescreva para um alvo específico.
- PROIBIDO pergunta direta de trivia sem consequência prática/de prova, como ano, epônimo isolado, detalhe raro sem utilidade, ou informação que não muda diagnóstico, conduta, mecanismo ou diferenciação.
- Em farmacologia direta, pergunte o que diferencia fármacos próximos: mecanismo que explica uso/risco, interação relevante, contraindicação, efeito adverso que muda escolha, fase da doença, ajuste em órgão-alvo ou comparação dentro da classe.
- Em perguntas diretas sobre diagnóstico/critério, especifique o nível de cobrança: achado mais discriminativo, critério obrigatório, exame confirmatório, diagnóstico diferencial que muda conduta ou pegadinha comum.
- Antes de aceitar uma questão direta, confira: "um aluno que sabe o tema entende exatamente que tipo de resposta está sendo pedido?". Se não, reescreva.
- PROIBIDO no enunciado: qualquer dica semântica que permita eliminar distratores sem conhecimento do tema
- PROIBIDO cobrar detalhe inútil, trivia solta ou fato sem consequência diagnóstica, terapêutica, fisiopatológica, prognóstica ou de prova
- PROIBIDO criar questão cuja resposta seja apenas bom senso geral, conduta vaga ou conselho universal: "avaliar necessidade", "suspender medicamentos desnecessários", "acompanhar", "orientar", "monitorar", "tratar causa", "encaminhar se piorar", "psicoeducação", "simplificar o regime", "revisar medicações", "desprescrever fármacos desnecessários", "avaliar risco-benefício". Só aceite se houver uma decisão específica e cobrável.
- PROIBIDO criar enunciados genéricos como "qual princípio fundamental", "qual estratégia terapêutica frequentemente empregada", "como otimizar o tratamento", "qual medida inicial para reduzir riscos" quando a resposta for uma recomendação ampla que qualquer pessoa acertaria.
- PROIBIDO fugir da intenção do material base. Se o usuário pediu um foco específico, não transforme isso em perguntas genéricas sobre princípios amplos, adesão, polifarmácia, acompanhamento ou medidas administrativas.
- Toda questão precisa passar no teste de utilidade: ela deve testar algo TESTÁVEL EM PROVA ou ÚTIL NA VIDA REAL. Precisa ensinar decisão, mecanismo, diferenciação entre alternativas próximas, exceção, critério objetivo, consequência prática ou memorização durável.
- Cada questão deve testar uma decisão/conceito que diferencie quem sabe de quem reconhece palavras do tema
- Tamanho ideal: suficiente para contextualizar sem ser prolixo`;

const REGRAS_ALTERNATIVAS = `
REGRAS DAS ALTERNATIVAS — AS MAIS IMPORTANTES DESTE PROMPT:

REGRA 1 — ALTERNATIVA A É SEMPRE A CORRETA (CRÍTICO):
Coloque a resposta correta como alternativa A, sempre. O site embaralha automaticamente.
Isso permite que você use a alternativa A como âncora para calibrar os distratores:
- Escreva A (correta) no MENOR formato que responda integralmente ao que foi perguntado
- Escreva B, C, D (e E) no mesmo formato compacto de A, alterando apenas o elemento que torna cada um incorreto
- Distratores devem parecer tão plausíveis quanto A para quem estudou superficialmente
EXEMPLO PROIBIDO: A) Sim, pela inibição da bomba de Na/K e ação sobre canais de Ca²⁺ / B) Não / C) Sim / D) Nunca
EXEMPLO CORRETO: A) [resposta correta, 12 palavras] / B) [mesmo comprimento, mecanismo errado] / C) [mesmo comprimento, órgão errado] / D) [mesmo comprimento, dose/classe errada]

REGRA 2 — ALTERNATIVAS COMPACTAS E ALINHADAS AO ALVO (CRÍTICO):
Alternativas não são explicações. Elas devem conter somente a informação necessária para responder ao alvo exato do enunciado.
- Se a pergunta pede "qual fármaco?", coloque apenas nomes de fármacos. Não acrescente mecanismo, indicação, efeito adverso ou resumo após cada nome.
- Se pede "qual manobra?", coloque apenas nomes das manobras.
- Se pede "qual diagnóstico?", coloque apenas os diagnósticos.
- Se pede "qual estrutura/agente/exame?", coloque apenas os nomes correspondentes.
- Se pede mecanismo, fisiopatologia, conduta ou sequência, use frases curtas paralelas contendo somente a diferença necessária entre as opções.
- Nunca acrescente detalhes às alternativas apenas para torná-las sofisticadas, longas ou autossuficientes. O contexto pertence ao enunciado; o ensino pertence à explicação.
- Detalhes extras são proibidos quando permitem acertar sem recordar o alvo principal, por eliminação ou raciocínio sobre os resumos anexados.
- Antes de finalizar, pergunte: "se eu remover esta oração/detalhe, a alternativa ainda identifica de forma única a opção?". Se sim, remova.
- Prefira alternativas de 1 a 6 palavras quando o alvo for um nome/termo. Use alternativas maiores somente quando o próprio alvo exigir uma proposição.
EXEMPLO RUIM — alvo é reconhecer o fármaco:
A) Lamotrigina, estabilizador com baixo risco metabólico e ação em canais de sódio
B) Valproato, estabilizador eficaz em mania e associado a teratogenicidade
EXEMPLO BOM:
A) Lamotrigina
B) Valproato

REGRA 3 — DISTRATORES SOFISTICADOS (CRÍTICO):
Cada distrator deve ser uma afirmação que um estudante que estudou superficialmente poderia confundir com a resposta correta.
Use: condições do mesmo grupo nosológico, fármacos da mesma classe, mecanismos parecidos, exceções da regra, valores próximos mas incorretos, inversões de causa/efeito, confusões clássicas do tema.
PROIBIDO: distratores obviamente absurdos, anatomicamente impossíveis, ou que qualquer pessoa sem conhecimento médico eliminaria por bom senso.
PROIBIDO: distratores que são apenas a negação direta do enunciado.
PROIBIDO: misturar categorias semânticas. Se a pergunta pede uma reação oftalmológica, todos os distratores devem ser reações/achados oftalmológicos plausíveis ou diagnósticos diferenciais oculares — nunca pancreatite, nefrolitíase, enjoo etc.
Se você não conseguir criar distratores plausíveis dentro da mesma categoria, REESCREVA a questão.

REGRA 4 — SEM PISTAS SINTÁTICAS:
- A alternativa correta não pode ter estrutura gramatical diferente das erradas
- A alternativa correta não pode ser sistematicamente a maior, mais detalhada, mais específica ou mais "bonita"
- Todas as alternativas devem responder exatamente à mesma pergunta, no mesmo nível de especificidade e com comprimento visual parecido
- Não use "todas as anteriores" ou "nenhuma das anteriores"
- Não tente variar a letra correta: escreva a correta em A, pois o site embaralha antes de exibir

REGRA 5 — DIFICULDADE REAL:
Um estudante que nunca viu o tema deve errar. Um que estudou superficialmente deve hesitar. Só quem domina o conteúdo deve acertar com segurança.
Antes de finalizar cada questão, faça este teste mental: "dá para acertar por eliminação grosseira, tamanho da alternativa, categoria absurda ou bom senso leigo?". Se sim, refaça alternativas e/ou enunciado.`;

const REGRAS_EXPLICACAO = `
REGRAS DA EXPLICAÇÃO:
- Comece pelo CONCEITO central que a questão testa, não pelo gabarito
- Explique por que a alternativa correta está certa usando raciocínio fisiopatológico ou clínico
- Para cada distrator: explique por que está errado pelo conteúdo (nunca pela letra)
- A explicação deve ensinar o assunto, não apenas confirmar o gabarito
- PROIBIDO explicar repetindo a pergunta/resposta com palavras diferentes. A explicação deve responder pelo menos uma destas perguntas: por que isso acontece? como o mecanismo leva ao achado/conduta? quando essa regra muda? qual confusão próxima isso evita? qual consequência prática ou de prova decorre disso?
- Se não existe uma explicação causal, mecanística, clínica ou comparativa além de uma paráfrase, a questão provavelmente é fraca e deve ser substituída.
- Tamanho: 3 a 5 parágrafos objetivos

PROIBIDO ABSOLUTO — LETRAS DAS ALTERNATIVAS:
As alternativas serão EMBARALHADAS antes de serem exibidas ao aluno — as letras A, B, C, D, E NÃO têm significado fixo.
JAMAIS escreva "a alternativa A", "a opção B", "a letra C" na explicação.
Refira-se SEMPRE pelo conteúdo: "a opção que menciona X", "confundir Y com Z é um erro comum pois..."`;

const REGRAS_EXPLICACAO_ADMIN = `
REGRAS DA EXPLICAÇÃO — FORMATO ADMIN EXPERIMENTAL:
- Separe a explicação em duas partes obrigatórias: "Aula:" e "Alternativas:".
- "Aula:" deve ensinar o assunto da questão antes de falar do gabarito. Se o aluno lesse essa aula antes da questão, deveria entender o conceito e conseguir acertar.
- A aula deve explicar mecanismo, raciocínio clínico, critério, exceção ou comparação central. Não repita o enunciado nem diga apenas que a alternativa correta está certa.
- "Alternativas:" deve explicar cada alternativa em poucas palavras, uma por bloco, usando a marcação exata [[ALT:A]], [[ALT:B]], [[ALT:C]], [[ALT:D]] e [[ALT:E]] quando houver E.
- Em [[ALT:A]], explique por que a alternativa correta está certa.
- Em cada alternativa errada, explique o erro conceitual específico: por que aquilo parece plausível e por que não responde à questão.
- A explicação de cada alternativa deve ficar presa ao conteúdo daquela alternativa, porque o site vai embaralhar alternativa + explicação juntas.
- Como a alternativa A é sempre a correta no texto bruto, [[ALT:A]] deve ser a explicação da correta antes do embaralhamento.
- Não use parágrafos genéricos como "está errada porque não é a conduta correta". Diga o erro de conteúdo.
- Tamanho: Aula com 2 a 5 parágrafos objetivos; cada [[ALT:X]] com 1 a 3 frases curtas.

FORMATO OBRIGATÓRIO DA EXPLICAÇÃO:
Explicação:
Aula:
[aula curta e completa sobre o tema da questão]

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
[por que a alternativa E está errada, se existir]`;

const questionExplanationRules = (settings = {}) => settings.adminQuestionExplanations ? REGRAS_EXPLICACAO_ADMIN : REGRAS_EXPLICACAO;

const ACADEMIA_LESSON_LENGTH_RULES = {
  essential: `
PROFUNDIDADE DA AULA: Nível 1
- MODO RESUMO DE PROVA: preserve apenas o necessário para lembrar, diferenciar e decidir, sem virar texto telegráfico.
- Cada seção do Nível 1 deve começar com uma linha de título curto em negrito, sem marcador e sem ##, resumindo o bloco em 2 a 5 palavras. Exemplos: "**Tipos de hérnias**", "**Fisiopatologia das hérnias**", "**Causas de aderências**".
- Use, em regra, no máximo 80 palavras por seção.
- Se um fato não muda diagnóstico, mecanismo, conduta, prognóstico ou desempenho em prova, corte-o do Nível 1.
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
Escreva como revisão rápida de prova, curta, densa e fácil de escanear.
O aluno deve bater o olho no título curto do bloco e capturar rapidamente o que mais importa.
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

const TEMPLATE_QUESTAO = (alts, adminQuestionExplanations = false, caseSeries = false) => `
FORMATO OBRIGATÓRIO (uma questão por bloco ---):
## Questão 1.1.1
${caseSeries ? `Caso-base: Caso 1 — [vinheta clínica original completa; repita-a integralmente em cada questão da sequência]
Enunciado: [pergunta específica desta questão e eventual evolução nova]` : '[Enunciado]'}
${alts}
Alternativa correta: [Letra]
Explicação:
${adminQuestionExplanations ? `Aula:
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
[por que a alternativa E está errada, se existir]` : '[Explicação]'}
---

INSTRUÇÃO CRÍTICA SOBRE AS ALTERNATIVAS:
Coloque SEMPRE a alternativa CORRETA como alternativa A.
Depois crie os distratores (B, C, D e E se houver) baseando-se na alternativa A:
- Use a alternativa A como referência de formato compacto — os distratores devem ter comprimento e estrutura similares
- Se a pergunta pedir um nome/termo, escreva apenas nomes/termos nas alternativas; não anexe resumos explicativos
- Crie distratores alterando elementos específicos da alternativa A: troque doses, mecanismos, órgãos, fármacos por versões plausíveis mas incorretas
- Distratores devem parecer igualmente corretos para quem não domina o assunto
- O site embaralha as alternativas automaticamente antes de exibir — você não precisa se preocupar com isso
Resultado esperado: 5 alternativas com comprimento quase idêntico, onde só quem domina o conteúdo consegue identificar a correta.`;

export const QUESTION_AUDIT_CHECKLIST = [
  'Aderência ao material base e à intenção explícita do usuário',
  'Alta utilidade: cada item precisa ser testável em prova ou útil na vida real, não apenas correto',
  'Exclusão de questões de bom senso, vagas, genéricas ou sem consequência médica específica',
  'Exclusão de itens sobre adesão, polifarmácia, risco-benefício, otimização ou revisão terapêutica quando a resposta for conselho universal',
  'Cobertura suficiente dos tópicos/subtópicos sem lacunas importantes',
  'Sem redundância conceitual entre questões ou flashcards',
  'Enunciado sem pistas semânticas, gramaticais, de tamanho ou de categoria',
  'Enunciado com contexto suficiente para uma resposta justa e única',
  'Vinheta clínica com dado discriminativo real, sem pistas óbvias e sem dados decorativos',
  'Casos clínicos testam decisão/inferência clínica, não pergunta direta fantasiada de história',
  'Questões diretas com alvo estreito, resposta previsível e valor real de prova/vida prática',
  'Questões diretas não amplas, não triviais e não baseadas em curiosidade solta',
  'Dificuldade desejável: não acertável por eliminação grosseira ou conhecimento leigo',
  'Alternativa correta tecnicamente verdadeira, atual e sem ambiguidade',
  'Distratores plausíveis, da mesma categoria semântica e com nível de especificidade semelhante',
  'Alternativas no menor texto suficiente para responder ao alvo, sem resumos explicativos que deem pistas',
  'Quando o alvo for identificar fármaco, diagnóstico, manobra, estrutura, agente ou exame, alternativas contêm apenas os nomes correspondentes',
  'Alternativa correta não maior, mais detalhada, mais específica ou mais bem escrita que as erradas',
  'Todas as alternativas com comprimento visual parecido e mesma estrutura gramatical',
  'Sem "todas", "nenhuma", negações óbvias ou distratores absurdos',
  'Explicação ensina o porquê e o como do conceito, sem parafrasear a resposta',
  'Explicação sem referência fixa a letras, pois o site embaralha alternativas',
  'Respeito literal ao foco solicitado pelo usuário, sem trocar foco específico por princípios amplos',
  'Flashcards atômicos, autossuficientes, com resposta curta e explicação útil',
  'Flashcards sem perguntas abertas genéricas, sem sim/não e sem listas longas',
  'Questões abertas com resposta esperada objetiva, avaliável e não ambígua',
  'Coerência do formato obrigatório para o parser do site',
];

export const buildQuestionAuditPrompt = ({
  subjectTitle = '',
  topicTitle = '',
  subtopics = [],
  sourceMaterials = '',
  generatedText = '',
  settings = {},
}) => {
  const types = settings.questionTypes || ['direct'];
  const onlyFlashcards = onlyMemoryCards(types);
  const onlyOpen = types.every(t => ['open', 'essay'].includes(t));
  const caseSeries = !onlyFlashcards && settings.questionStyle === 'mixed';
  const na = settings.numAlternatives || 5;
  const alts = na === 4
    ? 'A) [alternativa]\nB) [alternativa]\nC) [alternativa]\nD) [alternativa]'
    : 'A) [alternativa]\nB) [alternativa]\nC) [alternativa]\nD) [alternativa]\nE) [alternativa]';
  const typeInst = buildTypeInst(types);
  const adminExplanations = !!settings.adminQuestionExplanations;
  const outputFormat = onlyFlashcards ? `
FORMATO DE SAÍDA OBRIGATÓRIO:
${memoryCardFormat(types).trim().replace('## Flashcard 1', '## Flashcard N').replace('## Cloze 1', '## Cloze N')}` : onlyOpen ? `
FORMATO DE SAÍDA OBRIGATÓRIO:
## Questão N
${caseSeries ? `Caso-base: Caso 1 — [vinheta clínica original completa]
Enunciado: [pergunta específica desta questão e eventual evolução nova]` : '[Enunciado]'}
Resposta esperada: [resposta objetiva]
Explicação: [explicação didática]
---` : `
FORMATO DE SAÍDA OBRIGATÓRIO:
## Questão N
${caseSeries ? `Caso-base: Caso 1 — [vinheta clínica original completa]
Enunciado: [pergunta específica desta questão e eventual evolução nova]` : '[Enunciado]'}
${alts}
Alternativa correta: A
Explicação:
${adminExplanations ? `Aula:
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
[por que a alternativa E está errada, se existir]` : '[Explicação didática sem referir letras]'}
---`;

  return `Você é o auditor sênior de questões médicas da Ágora do Saber. Sua tarefa é fazer um SEGUNDO PASSE rigoroso sobre uma bateria recém-criada e devolver apenas a versão final corrigida.

CONTEXTO:
- Assunto: ${subjectTitle || 'Não informado'}
- Tópico/bloco: ${topicTitle || 'Não informado'}
${subtopics?.length ? `- Subtópicos obrigatórios:\n${subtopics.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : ''}

MATERIAL BASE / INTENÇÃO DO USUÁRIO:
${sourceMaterials ? sourceMaterials.substring(0, 14000) : 'Não informado. Use apenas o contexto das questões e subtópicos.'}

CHECKLIST DE AUDITORIA OBRIGATÓRIO:
${QUESTION_AUDIT_CHECKLIST.map(item => `- ${item}`).join('\n')}

REGRAS DE CORREÇÃO:
- Não comente a auditoria. Não entregue relatório. Entregue somente as questões/flashcards finais.
- Faça primeiro uma triagem de descarte: todo item que falhe no teste de prova/vida real deve ser excluído ou substituído, mesmo que esteja factualmente correto.
- Corrija erros factuais, ambiguidade, pistas e explicações fracas.
- Exclua sem dó itens inúteis, óbvios, genéricos, redundantes ou desalinhados com o material base.
- Exclua sem dó itens cujo gabarito seja "psicoeducação", "simplificação do regime", "revisão de medicamentos", "desprescrição de fármacos desnecessários", "avaliar risco-benefício", "monitorar", "orientar adesão" ou condutas equivalentes, salvo quando houver um critério técnico concreto que torne a pergunta não óbvia.
- Exclua questões do tipo "qual princípio fundamental", "qual estratégia geral", "qual medida inicial para reduzir riscos" quando o aluno conseguir responder por bom senso sem dominar o conteúdo.
- Substitua itens excluídos por cobranças realmente úteis quando houver lacuna importante.
- Adicione itens somente se a cobertura do tópico/subtópicos estiver insuficiente. Não adicione para inflar volume.
- Se o usuário pediu foco específico, toda a bateria deve respeitar esse foco. Não troque o pedido por princípios amplos, adesão, polifarmácia, revisão de medicação ou recomendações administrativas.
- Para questões fechadas, coloque SEMPRE a correta como A porque o site embaralha depois. Faça B/C/D/E plausíveis, parecidas em tamanho e categoria.
- Enxugue alternativas que funcionem como mini-explicações. Se o enunciado pede identificar um fármaco, diagnóstico, manobra, estrutura, agente ou exame, deixe apenas os nomes nas alternativas. Preserve frases maiores somente quando o próprio alvo for mecanismo, conduta, fisiopatologia ou outra proposição.
- Remova de todas as alternativas qualquer detalhe que permita acertar por eliminação sem recordar o alvo principal. O contexto fica no enunciado e o ensino fica na explicação.
- Para flashcards/clozes, mantenha cobranças específicas, atômicas, respostas/lacunas curtas e explicações que ensinem o porquê/como daquela resposta.
- Reescreva explicações que apenas repitam o gabarito. A explicação deve fazer a resposta ficar compreensível para quem errou, sem virar aula.
- Reprove explicações que digam apenas "é primeira linha", "é eficaz", "é preferido" ou "é indicado" sem explicar a propriedade, mecanismo, perfil clínico ou razão prática que justifica isso.
- Em cards de indicação/conduta farmacológica, a explicação deve conectar fármaco/quadro clínico → propriedade relevante → por que isso responde à pergunta.
- Corrija qualquer flashcard que peça "dois/três/(2)/(3)" e entregue quantidade diferente na resposta.
- Corrija respostas com "X, Y ou Z" quando a pergunta não pedir explicitamente opções equivalentes; escolha um conjunto fechado ou divida o card.
- Corrija atomização burra: efeitos adversos, sintomas, monitorização ou interações que formam um conjunto curto e natural devem virar um card de lista curta, não vários cards fracos.
- Corrija listas abertas: "cite um" não pode ter várias respostas; "quais" deve indicar uma lista curta, fechada e realmente útil.
- Remova duplicações semânticas, mesmo quando a redação muda. Se dois cards cobram o mesmo fato, preserve o melhor e exclua o outro.
- Reescreva perguntas de sim/não como perguntas de recuperação ativa com resposta substantiva.
- Preserve o idioma em português do Brasil.

${typeInst ? `${typeInst}\n` : ''}
${REGRAS_ENUNCIADO}
${onlyFlashcards ? '' : REGRAS_ALTERNATIVAS}
${onlyFlashcards ? '' : questionExplanationRules(settings)}
${outputFormat}

BATERIA A AUDITAR:
${generatedText}

Agora devolva APENAS a bateria final auditada, no formato obrigatório.`;
};

// ─── PROMPT: GERAÇÃO DE QUESTÕES DO ORÁCULO ──────────────────────────────────

export const buildOracleQuestionPrompt = (s, focusBlock = '', autoMode = false) => {
  const na   = s.numAlternatives || 5;
  const alts = na === 4
    ? 'A) [alternativa]\nB) [alternativa]\nC) [alternativa]\nD) [alternativa]'
    : 'A) [alternativa]\nB) [alternativa]\nC) [alternativa]\nD) [alternativa]\nE) [alternativa]';

  const styleInst = STYLE_INST[s.questionStyle || 'mixed'];
  const expectedSubtopics = Math.max(1, Number(s.numSubtopics) || 1);
  const expectedQPerSub = Math.max(1, Number(s.qPerSub) || 1);
  const expectedTotal = expectedSubtopics * expectedQPerSub;
  const types = s.questionTypes || ['direct'];
  const onlyFlashcards = onlyMemoryCards(types);
  const autoQuestionCount = !!s.qPerSubAuto && !onlyFlashcards;
  const caseSeries = !onlyFlashcards && s.questionStyle === 'mixed';

  const estruturaInst = onlyFlashcards
    ? `
ESTRUTURA PARA ${onlyClozeCards(types) ? 'CLOZES' : 'FLASHCARDS'}:
- Cubra os subtópicos/conceitos obrigatórios quando eles forem fornecidos.
- Não use meta numérica fixa. Crie apenas ${memoryCardName(types)} de alto rendimento, sem redundância.
- Priorize conceitos cobrados, esquecíveis, diferenciadores, testáveis em prova ou úteis na vida real.
- Corte cartões de conselho geral, adesão, polifarmácia, risco-benefício, "otimização" e "revisão terapêutica" quando a resposta não exigir conhecimento técnico específico.
- O conjunto final deve permitir revisar o conteúdo essencial sem reler o material. Não omita mecanismo, conduta, diagnóstico, diferencial ou pegadinha central quando forem parte do tópico.`
    : autoQuestionCount
    ? `
ESTRUTURA (quantidade de questões automática):
Quando uma lista de subtópicos obrigatórios for fornecida, cubra TODOS eles.
Se NÃO houver lista obrigatória, defina mentalmente ${expectedSubtopics} eixos/subtópicos de cobrança para este tópico.
NÃO use quantidade fixa por subtópico:
- Para cada subtópico/eixo, atomize o conteúdo em perguntas independentes de alto rendimento.
- Gere a quantidade necessária para cobrir tudo que é relevante, cobrável e ainda não repetido.
- Piso prático: gere pelo menos 2 questões por subtópico/eixo. Não encerre um subtópico com uma única cobrança óbvia.
- Referência: 2 a 4 questões por subtópico costuma bastar; use 5 ou 6 quando houver muitos mecanismos, diagnósticos diferenciais, critérios, condutas, complicações ou pegadinhas realmente distintos.
- Checklist obrigatório antes de finalizar cada subtópico: ideia central/definição; mecanismo ou fisiopatologia; achados/diagnóstico; conduta, complicação, diferencial ou pegadinha quando aplicável.
- Não crie questões para encher volume. Não pergunte trivia inútil.
- Não crie questões de bom senso para completar quantidade. Se a cobrança seria "psicoeducação", "simplificar regime", "revisar medicações", "avaliar risco-benefício" ou equivalente genérico, substitua por um eixo técnico realmente cobrável.
- Só pare depois de auditar que os eixos importantes foram cobrados sem lacunas e sem redundância.`
    : autoMode
    ? `
ESTRUTURA (modo automático):
Quando uma lista de subtópicos obrigatórios for fornecida, ela substitui esta seção.
Se NÃO houver lista obrigatória, defina mentalmente ${expectedSubtopics} eixos/subtópicos de cobrança para este tópico.
MODO AUTOMÁTICO NÃO SIGNIFICA QUANTIDADE LIVRE:
- Gere EXATAMENTE ${expectedTotal} questões no total
- Distribua como ${expectedQPerSub} questão(ões) por eixo/subtópico
- NÃO gere apenas uma questão e NÃO pare antes de completar ${expectedTotal}
FAIXA DE REFERÊNCIA: ${SYLLABUS_LIMITS.oracle.minSubtopicsPerTopic} a ${SYLLABUS_LIMITS.oracle.targetMaxSubtopicsPerTopic} subtópicos por tópico.
Critérios:
- Use subtópicos suficientes para cobrir os blocos reais de estudo
- Quantidade ideal: a necessária para cobrir o essencial sem repetição
- Cada subtópico deve ser um conceito distinto e testável — não uma variação do anterior
- Cada subtópico deve render uma cobrança testável em prova ou uma decisão útil na vida real. Subtópicos que só geram conselhos genéricos devem ser fundidos, removidos ou reescritos.
- Organize do conceito mais fundamental ao mais específico dentro de cada tópico`
    : `
ESTRUTURA OBRIGATÓRIA:
- EXATAMENTE ${expectedSubtopics} subtópicos
- EXATAMENTE ${expectedQPerSub} questão por subtópico
- Total: EXATAMENTE ${expectedTotal} questões
- Ordem: do conceito mais fundamental ao mais específico`;

  const typeInst = buildTypeInst(s.questionTypes || ['direct']);
  const onlyOpen = types.every(t => ['open','essay'].includes(t));
  const explanationInst = questionExplanationRules(s);
  const caseSeriesStructure = caseSeries ? `
ORGANIZAÇÃO ESPECIAL PARA CASOS ENCADEADOS:
- As metas por subtópico/eixo garantem cobertura; elas NÃO significam um caso separado para cada item.
- Decida a quantidade ideal de casos para o tópico inteiro. Um caso pode integrar vários subtópicos relacionados.
- Organize a ordem final por caso e conclua sua sequência antes de iniciar o próximo, mesmo que isso altere a ordem dos subtópicos.
- Preserve a quantidade total pedida e cubra todos os eixos obrigatórios sem divisão artificial.` : '';

  const templateBlock = onlyFlashcards ? `
FORMATO OBRIGATÓRIO para cada ${onlyClozeCards(types) ? 'cloze' : 'flashcard'} (separe com ---):
${memoryCardFormat(types).trim()}

REGRA DE QUANTIDADE:
- Ignore qualquer quantidade fixa citada em outras seções.
- Gere a quantidade ideal de ${memoryCardName(types)} para cobrir os conceitos essenciais do tópico e dos subtópicos, sem redundância.
- Faça cobranças específicas, de recuperação ativa, com resposta/lacuna curta e explicação real do porquê/como da resposta.
- Não aceite cartão que só ensine conduta óbvia, conselho geral ou princípio administrativo.` : onlyOpen ? `
FORMATO OBRIGATÓRIO para cada questão (separe com ---):
## Questão 1.1.1
${caseSeries ? `Caso-base: Caso 1 — [vinheta clínica original completa; repita-a integralmente em cada questão da sequência]
Enunciado: [pergunta específica desta questão e eventual evolução nova]` : '[Enunciado]'}
Resposta esperada: [resposta objetiva]
Explicação: [explicação didática]
---` : `${REGRAS_ALTERNATIVAS}\n${explanationInst}\n${TEMPLATE_QUESTAO(alts, !!s.adminQuestionExplanations, caseSeries)}`;

  return `Você é o Oráculo de Medicina da Ágora do Saber. Sua missão é criar questões médicas de altíssima qualidade para residência médica.

${focusBlock ? focusBlock + '\n' : ''}
ESTILO DE ENUNCIADO: ${styleInst}
${typeInst ? typeInst + '\n' : ''}${estruturaInst}
${caseSeriesStructure}
${REGRAS_ENUNCIADO}
${templateBlock}

${onlyFlashcards ? `Use o ID no formato sequencial simples (ex: ## ${onlyClozeCards(types) ? 'Cloze' : 'Flashcard'} 1, ## ${onlyClozeCards(types) ? 'Cloze' : 'Flashcard'} 2).` : 'Use o ID no formato TOPICO.SUBTOPICO.QUESTAO, sem colchetes (ex: ## Questão 3.2.1).'}
${s.customPrompt ? `\nINSTRUÇÕES ADICIONAIS DO USUÁRIO:\n${s.customPrompt}` : ''}
${onlyFlashcards ? `Gere os ${memoryCardName(types)} sem interromper. Não resuma, não pergunte, não comente — apenas ${memoryCardName(types)}.` : 'Gere TODAS as questões sem interromper. Não resuma, não pergunte, não comente — apenas questões.'}`;
};

// ─── PROMPT: SUMÁRIO DO ORÁCULO ───────────────────────────────────────────────

export const buildOracleSyllabusPrompt = (subjectName, s, autoMode = false) => {
  const l = SYLLABUS_LIMITS.oracle;
  const studyMap = !!s.adminStudyMap;
  const estrutura = autoMode
    ? `Defina a quantidade ideal de tópicos e subtópicos para cobrir "${subjectName}" com base no material fornecido.
OBJETIVO: criar um roteiro de estudo completo e utilizável, não um índice enciclopédico.
O sumário será usado assim: cada subtópico vira um eixo de cobrança para questões/flashcards. Portanto, cada subtópico deve ter uma fronteira de cobrança clara e não pode ser apenas variação redundante de outro subtópico.
FAIXA DE REFERÊNCIA:
- Assunto comum: ${l.minTopics} a ${l.targetMaxTopics} tópicos no total
- ${l.minSubtopicsPerTopic} a ${l.targetMaxSubtopicsPerTopic} subtópicos por tópico costuma ser suficiente
- Materiais longos devem virar MAIS TÓPICOS, não tópicos gigantes
- Use mais subtópicos quando o material realmente exigir cobertura própria
- Os tópicos devem emergir naturalmente do material — não use divisões genéricas fixas
- Cada subtópico = 1 bloco específico e testável, sem sobreposição com outros
- Cada subtópico precisa ser testável em prova ou útil na vida real. Se só render pergunta de bom senso, não crie o subtópico.
- PROIBIDO: um único tópico com dezenas de subtópicos. Se um tópico passar de 30 subtópicos, divida em tópicos menores.
Crie subtópicos como UNIDADES DE COBRANÇA: cada um deve permitir uma questão/flashcard próprio, com resposta ou explicação diferente dos vizinhos.
Não atomize por frase, item de lista, exemplo isolado ou microdetalhe.
Não crie subtópicos guarda-chuva que misturem definição, diagnóstico, classificação, complicações, exames e tratamento quando esses blocos renderem cobranças próprias.`
    : `Crie exatamente ${s.numTopics} Tópicos com exatamente ${s.numSubtopics} Subtópicos cada.`;

  return `Você é o Arquiteto de Alexandria. Crie um sumário para "${subjectName}" baseado no material do usuário.

${estrutura}

FONTE OBRIGATÓRIA — SIGA O MATERIAL:
O sumário deve ser um índice fiel do material fornecido.
Siga a ordem do material sempre que ela fizer sentido didático.
Não extrapole para fora do que foi pedido. Não junte tópicos vizinhos apenas para economizar geração.

HIERARQUIA DA INTENÇÃO DO USUÁRIO — REGRA CRÍTICA:
Antes de montar o sumário, extraia mentalmente do material quatro listas: (1) o que o usuário quer dominar; (2) o que ele proibiu; (3) qual ordem/organização ele pediu; (4) qual tipo de decisão ou desempenho ele precisa treinar.
- Restrições explícitas do usuário vencem qualquer modelo genérico de currículo. Se ele disser "não inclua doses", não crie dose, posologia, ajuste posológico ou titulação como objetivo próprio. Se disser "sem introdução/generalidades", não crie um bloco geral disfarçado com nome como princípios, fundamentos, panorama, considerações iniciais ou visão integrada.
- Respeite qualificadores do pedido. Exemplo: "psicofarmacologia com foco em anticonvulsivantes" não significa um curso genérico de epilepsia; o enquadramento psicofarmacológico deve orientar seleção e peso dos conteúdos.
- Respeite sequências explícitas como "primeiro por medicamentos; depois por patologias/casos". A estrutura final precisa tornar essa ordem visível.
- Quando o usuário descreve como será avaliado, organize o sumário para treinar exatamente esse desempenho. Se a prova exige escolher entre fármacos parecidos, trocar após efeito adverso, reconhecer contraindicação ou definir linha terapêutica, a maior parte dos objetivos deve exigir essas decisões, não apenas listar ou identificar fatos isolados.
- Não inclua um conteúdo só porque é importante em geral. Inclua-o apenas se servir ao objetivo específico descrito no material.

MODO DE ESTUDO RÁPIDO E ENXUTO:
Monte o sumário para revisão e criação de questões de alto rendimento, não para uma apostila enciclopédica.
Evite tópicos ou subtópicos de "introdução", "epidemiologia", "histórico", "conceitos gerais" ou "aspectos gerais" quando eles não forem diretamente úteis para prova, diagnóstico, conduta, mecanismo, classificação, fator de risco, complicação ou pegadinha.
Evite também subtópicos de "adesão", "polifarmácia", "risco-benefício", "otimização do tratamento" ou "medidas gerais" quando eles só gerariam respostas como orientar, revisar, simplificar, monitorar ou desprescrever.
Se uma informação contextual puder ser explicada em 1 ou 2 frases dentro de outro subtópico, NÃO crie um subtópico próprio para ela.
Prefira menos subtópicos, porém mais fortes e cobradores, a muitos subtópicos pequenos.
Só mantenha epidemiologia, definição ampla ou introdução quando isso gerar cobrança real de prova ou mudar conduta/raciocínio.

REGRA DE FRONTEIRA DE COBRANÇA:
Antes de finalizar o sumário, pergunte para cada subtópico: "que tipo de questão ou flashcard diferente este subtópico permite gerar?".
Mantenha o subtópico apenas se a resposta for clara e diferente dos subtópicos vizinhos.
Se a pergunta provável tiver resposta óbvia para quem não estudou, elimine ou reescreva o subtópico.
Se dois subtópicos gerariam praticamente a mesma pergunta, funda-os ou reescreva-os para separar eixos diferentes de cobrança.
Evite repetir a mesma entidade em vários tópicos. Se a repetição for inevitável, o título deve explicitar um eixo novo, como anatomia, mecanismo, clínica, morfologia, fator de risco, diagnóstico, tratamento, complicação ou prognóstico.
Não separe artificialmente "patogenia", "fatores", "mecanismos" e "consequências" quando isso só produziria variações da mesma questão.
Não coloque exemplos específicos em tópicos errados só porque apareceram cedo no material; mantenha cada doença, síndrome ou tema no bloco temático onde será cobrado.

EXEMPLOS DE CALIBRAÇÃO:

ERRADO — granularidade excessiva sem conceito próprio:
  - Hérnias: distinção entre hérnia e evisceração
  - Hérnias: fisiopatologia do aprisionamento venoso
  - Hérnias: comprometimento arterial e venoso
  - Hérnias: incidência de hérnias incisionais
  - Hérnias: risco em cirurgias contaminadas

CERTO — unidade de cobrança específica:
  - Hérnias: encarceramento, estrangulamento e conduta inicial
  - Hérnias incisionais: fatores de risco e prevenção
  - Hérnias inguinais congênitas: fisiopatologia e conduta

ERRADO — mesma entidade repetida sem eixo novo:
  - Anatomia: hérnias de hiato
  - Esofagites: hérnia de hiato e refluxo
  - Complicações: hérnia de hiato por deslizamento

CERTO — entidade localizada uma vez ou retomada com eixo explícito:
  - Hérnias de hiato: deslizamento versus paraesofágica
  - Doença do refluxo: barreira anti-refluxo, esofagite e fatores predisponentes

REGRAS FINAIS:
- Ordem obrigatória dentro de cada tópico: fundamentos antes de detalhes, mecanismo antes da aplicação clínica, regra antes da exceção
- Subtópicos concretos e objetivos — nada de "Generalidades", "Introdução" ou "Aspectos gerais"
- Proibido transformar cada bullet do material em um subtópico
- Proibido repetir a mesma síndrome/doença/tema em tópicos diferentes sem eixo de cobrança explicitamente novo
- Obrigatório cobrir todo o material relevante, sem cortar conteúdo importante para caber em uma quantidade fixa
- Obrigatório revisar o sumário final removendo duplicidades e subtópicos que só mudam palavras, não o conceito cobrado
- Obrigatório revisar tópicos gigantes e dividir qualquer tópico que passe de 30 subtópicos
- Obrigatório fazer uma auditoria final contra o material: remova qualquer tópico proibido pelo usuário e confirme que todas as etapas/blocos solicitados aparecem.
- Em pedidos clínicos orientados a decisão, prefira títulos que explicitem o contraste ou cenário: "X versus Y em paciente com...", "troca de X após...", "escolha em...", "quando evitar X". Evite objetivos vagos como apenas "indicações", "efeitos adversos" ou "primeira linha" quando o contexto discriminativo puder ser explicitado.
- A seção de casos/patologias não pode ser uma recapitulação genérica dos fármacos. Ela deve transformar o conteúdo anterior em cenários de decisão plausíveis, com fatores do paciente que mudam a escolha.

${studyMap ? `PLANO DE ESTUDO GUIADO:
Para CADA subtópico, faça também um planejamento individual:
- Q mede o número de QUESTÕES DISTINTAS recomendadas para revisar o objetivo:
  - Use normalmente Q:2 a Q:4 para permitir recuperação por ângulos diferentes.
  - Use Q:1 apenas para um objetivo realmente estreito e atômico, coberto com justiça por uma única pergunta.
  - Use Q:5 ou Q:6 quando houver vários conceitos, decisões ou contrastes independentes; divida o subtópico se precisar de mais.
- OBJ: objetivo de aprendizagem curto, específico e verificável. Ele deve dizer o que o estudante precisará compreender, diferenciar, reconhecer ou decidir.
- Quando o pedido for clínico/prático, prefira verbos de decisão: selecionar, comparar, trocar, evitar, priorizar, diferenciar ou justificar. Use "listar/descrever/identificar" apenas quando recuperação factual for realmente o objetivo final.
- Q deve contar cobranças distintas, não paráfrases da mesma pergunta.

FORMATO OBRIGATÓRIO DE CADA SUBTÓPICO:
  - [Q:3] [OBJ:Diferenciar X de Y pelo achado que muda a conduta] Nome do subtópico
- Use exatamente linhas "Tópico N: nome" e bullets iniciados por "- [Q:".
- NÃO use tabelas, JSON, blocos de código, títulos "Eixo/Trilha/Módulo" nem comentários antes ou depois do mapa.
` : ''}
FORMATO:
Tópico 1: [Nome]
  - ${studyMap ? '[Q:3] [OBJ:objetivo verificável] ' : ''}[Subtópico]
  - ${studyMap ? '[Q:2] [OBJ:objetivo verificável] ' : ''}[Subtópico]
Tópico 2: [Nome]
  - ${studyMap ? '[Q:4] [OBJ:objetivo verificável] ' : ''}[Subtópico]

Responda APENAS o sumário.`;
};

// ─── PROMPT: REVISÃO DE SUMÁRIO ───────────────────────────────────────────────

export const buildOracleSyllabusRevisePrompt = (currentSyllabus, feedback, s) => {
  const l = s?.source === 'academia' ? SYLLABUS_LIMITS.academia : SYLLABUS_LIMITS.oracle;
  const studyMap = !!s?.adminStudyMap;
  return `Você é o Arquiteto de Alexandria. Ajuste o sumário abaixo conforme a instrução do usuário.

SUMÁRIO ATUAL:
${currentSyllabus}

INSTRUÇÃO DO USUÁRIO:
${feedback}

REGRAS:
- Mantenha a estrutura de Tópicos e Subtópicos
- Preserve a ordem didática (geral → específico, mecanismo → aplicação)
- Cada subtópico deve ser um conceito testável independente
- Cada subtópico deve render cobrança de prova ou utilidade real; não mantenha subtópico que só gere conselho genérico.
- Mantenha o sumário completo e fiel: use mais tópicos/subtópicos quando o material ou o usuário pedir
- Não junte tópicos apenas para reduzir tamanho; preserve blocos independentes
${studyMap ? '- Preserve ou recalcule [Q:n] e [OBJ:objetivo verificável] em CADA subtópico. Use normalmente Q:2 a Q:4; reserve Q:1 para objetivos realmente estreitos.' : ''}
- Responda APENAS o sumário revisado, sem comentários adicionais`;
};

// ─── PROMPT: IA EXTERNA ───────────────────────────────────────────────────────

export const buildExternalPrompt = (s) => {
  const na   = s.numAlternatives || 5;
  const qPerSub = Math.max(1, Number(s.qPerSub) || 1);
  const selectedType = s.questionTypes?.[0] || 'direct';
  const types = [selectedType];
  if (selectedType === 'old_exam') {
    return `[INSTRUÇÕES PARA TRANSCREVER PROVAS ANTIGAS — ÁGORA DO SABER]

TAREFA:
Depois destas instruções, enviarei questões antigas de prova em texto, imagem, PDF ou OCR. Transcreva TODAS as questões válidas e devolva-as prontas para importação no Ágora do Saber.

REGRA CENTRAL — PRESERVAÇÃO VERBATIM:
- Preserve integralmente o conteúdo original de cada enunciado e de cada alternativa.
- Preserve a ordem das questões e a ordem original das alternativas.
- NÃO resuma, modernize, simplifique, complete, melhore, adapte ou reescreva o conteúdo das questões.
- NÃO transforme a questão em outra questão e NÃO crie questões novas.
- As únicas alterações permitidas no texto original são correções inequívocas de OCR, caracteres corrompidos, palavras partidas, hifenização acidental, espaços duplicados e quebras de linha inadequadas.
- Se uma palavra estiver duvidosa, preserve-a como recebida. Não invente uma correção.

EXCEÇÃO — ALTERNATIVAS AUSENTES OU ILEGÍVEIS:
- Se uma questão objetiva estiver claramente incompleta porque uma ou mais alternativas não aparecem, foram cortadas, estão totalmente ilegíveis ou se perderam no OCR, crie apenas as alternativas faltantes necessárias para completar a questão.
- Nunca altere alternativas que estejam presentes e legíveis. Preserve-as verbatim e mantenha suas letras/ordem originais.
- Analise a questão antes de completar: a resposta correta pode estar justamente entre as alternativas ausentes. Não presuma que uma alternativa sobrevivente precisa ser a correta.
- As alternativas reconstruídas devem ser tecnicamente plausíveis, pertencer à mesma categoria das originais, ter tamanho semelhante e não entregar o gabarito.
- Determine o gabarito considerando conjuntamente as alternativas originais e reconstruídas.
- Na explicação da alternativa reconstruída, comece com "[ALTERNATIVA RECONSTRUÍDA]" para deixar claro que ela não estava integralmente disponível no material.
- Não reconstrua alternativa por mera dúvida de leitura parcial: tente primeiro corrigir somente o OCR. Reconstrua apenas quando realmente faltar conteúdo suficiente para formar uma alternativa utilizável.

LIMPEZA DO MATERIAL:
- Ignore cabeçalhos e rodapés de prova, nome da instituição, disciplina, professor, aluno, turma, data, paginação, instruções gerais e campos de identificação.
- Ignore rabiscos, anotações manuscritas, marca-texto, círculos, setas, respostas marcadas pelo aluno e qualquer conteúdo que não faça parte da impressão original da questão.
- Remova números de página e elementos repetidos entre páginas.
- Não trate comentários, gabaritos rabiscados ou resoluções manuscritas como parte do enunciado.

GABARITO E EXPLICAÇÕES:
- Se houver gabarito oficial confiável no material, use-o.
- Se não houver gabarito oficial, resolva a questão e determine a resposta correta sem alterar o enunciado ou as alternativas.
- Para questões objetivas, escreva uma aula curta que ensine o conhecimento necessário para acertar e explique separadamente por que cada alternativa está certa ou errada.
- Para questões abertas, acrescente somente a resposta esperada e uma explicação didática.
- Se a questão original estiver anulada, tecnicamente errada ou sem alternativa defensável, preserve-a e informe isso claramente na explicação; não conserte silenciosamente a questão.

FORMATO OBRIGATÓRIO PARA QUESTÃO OBJETIVA:
## Questão N
[enunciado original limpo]
A) [alternativa original limpa]
B) [alternativa original limpa]
C) [alternativa original limpa]
D) [alternativa original limpa]
[E), se existir na questão original]
Alternativa correta: [letra]
Explicação:
Aula:
[explicação do tema necessária para compreender e acertar a questão]

Alternativas:
[[ALT:A]]
[por que A está certa ou errada]

[[ALT:B]]
[por que B está certa ou errada]

[[ALT:C]]
[por que C está certa ou errada]

[[ALT:D]]
[por que D está certa ou errada]

[[ALT:E]]
[por que E está certa ou errada, somente se existir]
---

FORMATO OBRIGATÓRIO PARA QUESTÃO ABERTA:
## Questão N
[enunciado original limpo]
Resposta esperada: [resposta]
Explicação: [explicação didática]
---

REGRAS FINAIS:
- Use o formato correspondente à estrutura original de cada questão; não converta questões abertas em objetivas nem objetivas em abertas.
- Não inclua comentários antes ou depois dos blocos.
- Não omita questões válidas.
- Aguarde eu enviar a prova antes de responder.${s.customPrompt ? `\n\nINSTRUÇÕES ADICIONAIS:\n${s.customPrompt}` : ''}`;
  }
  const hasClosed = types.some(t => ['direct','vof','cespe'].includes(t));
  const onlyFlashcards = onlyMemoryCards(types);
  const typeInst = buildTypeInst(types);
  const explanationInst = questionExplanationRules(s);
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
Para cada tópico gere ${onlyFlashcards ? `a quantidade ideal de ${memoryCardName(types)}, sem meta fixa` : `${qPerSub} item(ns) por subtópico (total = subtópicos daquele tópico × ${qPerSub})`}.`
    : `*** PARTE 2: GERAÇÃO (um tópico por vez) ***
Para cada tópico gere ${onlyFlashcards ? `a quantidade ideal de ${memoryCardName(types)}, sem meta fixa` : `${s.numSubtopics * qPerSub} item(ns) (${s.numSubtopics} subtópicos × ${qPerSub} por subtópico)`}.`;

  const closedBlock = hasClosed ? `
FORMATO PARA QUESTÕES COM ALTERNATIVAS:
${TEMPLATE_QUESTAO(alts, !!s.adminQuestionExplanations, s.questionStyle === 'mixed')}` : '';
  const importRule = selectedType === 'direct'
    ? `Use exclusivamente blocos "## Questão N" com ${na} alternativas, "Alternativa correta: [letra]" e "Explicação:".`
    : selectedType === 'vof'
      ? 'Use exclusivamente blocos "## Questão N" com quatro assertivas I-IV, alternativas com combinações V/F, "Alternativa correta: [letra]" e "Explicação:".'
      : selectedType === 'cespe'
        ? 'Use exclusivamente blocos "## Questão N" com A) Certo, B) Errado, "Alternativa correta: [letra]" e "Explicação:".'
        : selectedType === 'open'
          ? 'Use exclusivamente blocos "## Questão N" com "Resposta esperada:" e "Explicação:", sem alternativas.'
          : selectedType === 'essay'
            ? 'Use exclusivamente blocos "## Questão N", "Tipo: Dissertativa", "Resposta esperada:" e "Explicação:", sem alternativas.'
            : selectedType === 'flashcard'
              ? 'Use exclusivamente blocos "## Flashcard N" com "Pergunta:", "Resposta:" e "Explicação:".'
              : 'Use exclusivamente blocos "## Cloze N" com "Texto:" contendo {{c1::...}} e "Extra:".';

  return `[INSTRUÇÕES PARA IA EXTERNA — ÁGORA DO SABER]

${parte1}

${parte2}

TIPO DE ITEM A GERAR:
${QUESTION_TYPE_LABELS[selectedType] || selectedType}

${typeInst ? `${typeInst}\n` : ''}
ESTILO: ${STYLE_INST[s.questionStyle || 'mixed']}
${REGRAS_ENUNCIADO}
${hasClosed ? REGRAS_ALTERNATIVAS : ''}
${hasClosed ? explanationInst : ''}
${closedBlock}

REGRAS DE IMPORTAÇÃO NO ÁGORA:
- Entregue os itens finais em blocos separados por "---".
- ${importRule}
- Não use nenhum outro tipo ou formato de item.
- Não coloque comentários fora dos blocos de itens, porque vou colar a resposta diretamente no importador do Ágora.`;
};

// ─── PROMPT: SUMÁRIO DAS AULAS (VIDEOAULAS) ──────────────────────────────────

export const buildVqSyllabusPrompt = (aula, numBlocks, qPerBlock, transcript, extraPrompt = '', options = {}) => {
  const minPerBlock = SYLLABUS_LIMITS.videoaulas.minSubtopicsPerBlock;
  const maxPerBlock = Math.max(minPerBlock, Math.min(30, options.maxSubtopicsPerBlock || SYLLABUS_LIMITS.videoaulas.maxSubtopicsPerBlock));
  const idealPerBlock = Math.max(minPerBlock, Math.min(maxPerBlock, qPerBlock || 6));
  const fullCoverage = !!options.fullCoverage;
  const structureBlock = options.openStructure
    ? `ESTRUTURA ABERTA E COMPLETA:
- Cubra TODA a aula/transcrição, do início ao fim, seguindo a ordem em que o professor apresentou o conteúdo.
- Você decide livremente quantos blocos e quantos subtópicos são necessários. NÃO existe meta, piso, teto ou quantidade esperada de questões.
- Um bloco deve apenas agrupar subtópicos de um mesmo eixo temático; crie um novo bloco quando o eixo mudar.
- Não compacte conteúdos diferentes para reduzir o sumário e não multiplique subtópicos apenas para aumentar volume.
- Inclua todo conceito com cobrança técnica própria: mecanismos, critérios, classificações, diferenciais, achados, condutas, contraindicações, complicações, exceções e pegadinhas relevantes.`
    : fullCoverage
    ? `ESTRUTURA OBRIGATÓRIA:
- Cubra TODA a aula/transcrição, do início ao fim, seguindo a ordem em que o professor apresentou o conteúdo.
- Crie quantos blocos forem necessários para representar a aula inteira. NÃO há limite total de blocos, subtópicos ou questões por aula.
- Cada bloco/tópico deve corresponder a um trecho coerente da aula e ter entre ${minPerBlock} e ${maxPerBlock} subtópicos.
- Se um trecho passaria de ${maxPerBlock} subtópicos, divida em blocos consecutivos menores sem pular conteúdo.
- Não compacte a aula para economizar geração: detalhes cobraveis, exceções, critérios, condutas, classificações e pegadinhas devem virar subtópicos próprios quando forem testáveis.`
    : `ESTRUTURA OBRIGATÓRIA:
- ${numBlocks} bloco(s) de questões
- Entre ${minPerBlock} e ${maxPerBlock} subtópicos por bloco (ideal: ${idealPerBlock})
- Ordem OBRIGATORIAMENTE didática dentro de cada bloco: conceitos gerais → específicos, mecanismo → clínica → tratamento
- Nunca coloque um detalhe, exceção ou efeito adverso antes de ter coberto o conceito principal`;
  return `Você é um professor de Medicina e editor de material didático. Sua tarefa é criar o sumário completo da aula "${aula.title}".

FINALIDADE DO SUMÁRIO:
- Servir como mapa fiel da aula para estudo, geração de questões, aulas escritas e futuras apostilas.
- Ter organização didática suficiente para que cada subtópico possa depois virar uma seção explicativa de uma apostila.
- Não escreva a apostila agora: entregue apenas a estrutura completa, clara e autossuficiente do conteúdo.

${structureBlock}

REGRAS DOS SUBTÓPICOS:
- Cada subtópico = 1 conceito médico específico, relevante e com conteúdo próprio.
- Todo subtópico deve sustentar uma pergunta direta própria ou ter relevância didática real para compreender a aula; na prática, preserve todos os conhecimentos técnicos apresentados e elimine apenas repetições sem conteúdo novo.
- O título precisa declarar uma única fronteira de cobrança. Se ele mistura dois conhecimentos que poderiam gerar respostas diferentes, divida-o.
- Se dois subtópicos produziriam essencialmente a mesma pergunta, funda-os ou reescreva-os para separar claramente as cobranças.
- Não classifique, marque ou rotule subtópicos como "cobrável", "relevante", "para apostila" ou qualquer categoria semelhante: todos os itens da estrutura final já devem merecer estar nela.
- RUIM: "Introdução", "Generalidades", "Aspectos gerais do tratamento"
- BOM: "Critérios diagnósticos da Síndrome Nefrótica", "Mecanismo de ação dos IECA na DRC"
- Não repita conceitos entre subtópicos
- Não coloque exceções ou complicações antes de cobrir o conceito principal
- Priorize o que é cobrado em provas de residência médica
- Separe detalhes com potencial de cobrança própria; evite apenas repetir frases da aula sem transformar em conceito testável
- Evite subtópicos de adesão, medidas gerais, otimização, polifarmácia ou risco-benefício quando eles não exigirem critério técnico específico.

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
  ? `TRANSCRIÇÃO DA AULA (use como base para os subtópicos):\n${options.fullTranscript ? transcript : transcript.substring(0, 25000)}`
  : `[Sem transcrição disponível — baseie-se no título: "${aula.title}"]`}`;
};

// ─── PROMPT: GERAÇÃO DE QUESTÕES DE BLOCO (VIDEOAULAS) ───────────────────────

export const buildVqBlockPrompt = (block, meta, subtopicsArr, transcriptSlice, alts) => {
  const styleInst = STYLE_INST[meta.questionStyle || 'mixed'];
  const total = subtopicsArr.length || meta.qPerBlock || 5;
  const types = meta.questionTypes || ['direct'];
  const onlyFlashcards = onlyMemoryCards(types);
  const caseSeries = !onlyFlashcards && meta.questionStyle === 'mixed';
  const typeInst = buildTypeInst(types);
  const explanationInst = questionExplanationRules(meta);

  return `Você é um examinador de residência médica criando questões sobre "${block.title}" (aula: ${meta.aulaTitle}).

ESTILO: ${styleInst}
${typeInst ? `${typeInst}\n` : ''}

SUBTÓPICOS (${onlyFlashcards ? 'cubra os conceitos essenciais, sem quantidade fixa' : caseSeries ? 'cubra todos; os casos podem integrar vários subtópicos relacionados' : 'gere 1 questão por subtópico, nesta ordem exata'}):
${subtopicsArr.map((s, i) => `${i + 1}. ${s}`).join('\n')}

${onlyFlashcards ? `QUANTIDADE: a IA deve decidir a quantidade ideal de ${memoryCardName(types)}, cobrindo alto rendimento sem repetição. O conjunto deve permitir revisar a aula/bloco sem reler a transcrição, com cobranças específicas e explicações que ensinem o porquê/como da resposta. Corte cartões de conselho geral e mantenha só itens testáveis em prova ou úteis na vida real.` : `TOTAL: EXATAMENTE ${total} questões.`}
${caseSeries ? 'ORGANIZAÇÃO: decida a quantidade ideal de casos para o bloco inteiro. Não crie um caso por subtópico; um caso pode integrar vários subtópicos. Organize a bateria por caso e cubra todos os subtópicos ao longo dela.' : ''}
${REGRAS_ENUNCIADO}
${onlyFlashcards ? memoryCardFormat(types) : `${REGRAS_ALTERNATIVAS}
${explanationInst}
${TEMPLATE_QUESTAO(alts, !!meta.adminQuestionExplanations, caseSeries)}`}

Use o ID como número sequencial simples (${onlyFlashcards ? `${onlyClozeCards(types) ? 'Cloze' : 'Flashcard'} 1, ${onlyClozeCards(types) ? 'Cloze' : 'Flashcard'} 2...` : '1, 2, 3...'}).

${transcriptSlice
  ? `REFERÊNCIA DO CONTEÚDO (trecho da aula):\n${transcriptSlice.substring(0, 40000)}`
  : '[Sem transcrição — baseie-se nos subtópicos e no título da aula]'}

${onlyFlashcards ? `Gere os ${memoryCardName(types)} sem interromper ou comentar.` : `Gere TODAS as ${total} questões sem interromper ou comentar.`}`;
};

// Prompt exclusivo da bateria de fixação da Biblioteca. Não reutiliza
// REGRAS_ENUNCIADO porque esse bloco também contém instruções de vinheta clínica.
export const buildSharedLibraryDirectPrompt = ({ lessonTitle='', batchTitle='', subtopics=[], transcript='', alts='', meta={} }) => {
  const explanationInst = questionExplanationRules({ ...meta, questionStyle:'direct', questionTypes:['direct'] });
  return `Você é um examinador de residência médica criando uma bateria de FIXAÇÃO DIRETA sobre a aula "${lessonTitle}".

TIPO ÚNICO: QUESTÕES DIRETAS.
- Crie exatamente uma questão para cada subtópico, na ordem recebida.
- Pergunte o conceito de forma objetiva, com alvo estreito e resposta previsível.
- Teste mecanismo, critério, classificação, comparação, exceção, contraindicação ou consequência prática.
- PROIBIDO criar paciente, caso, história clínica, vinheta, cenário narrativo, idade, sexo, sintomas, evolução ou achados de exame.
- PROIBIDO usar os campos "Caso-base" ou "Enunciado" como sequência clínica.
- Uma questão direta pode cobrar conduta ou diagnóstico, mas deve perguntar o critério/conceito diretamente, sem inventar um paciente.
- Não transforme a pergunta direta em caso clínico. Os casos serão criados em outra etapa.
- Escreva tudo obrigatoriamente em português do Brasil.

LOTE: ${batchTitle || 'Fixação'}
SUBTÓPICOS (${subtopics.length}):
${subtopics.map((item, index)=>`${index + 1}. ${item}`).join('\n')}

${REGRAS_ALTERNATIVAS}
${explanationInst}
${TEMPLATE_QUESTAO(alts, true, false)}

Use números sequenciais simples. Entregue EXATAMENTE ${subtopics.length} questões, sem comentários fora dos blocos.

REFERÊNCIA DA AULA:
${String(transcript || '').substring(0, 40000)}`;
};

// ─── PROMPT: PROVA CLÍNICA INTEGRADORA DA BIBLIOTECA ────────────────────────

export const buildSharedLibraryClinicalPrompt = ({ lessonTitle, focusBlock, allBlocks = [], transcript = '', alts }) => {
  const focusSubtopics = focusBlock?.subtopics || [];
  const fullMap = allBlocks.map((block, blockIndex) => `TÓPICO ${blockIndex + 1}: ${block.title}\n${(block.subtopics || []).map(item=>`- ${item}`).join('\n')}`).join('\n\n');
  return `Você é o examinador final de uma formação médica. Crie o teste clínico de verdade da aula "${lessonTitle}".

TÓPICO-EIXO DESTE REQUEST: ${focusBlock?.title || 'Aplicação clínica'}
SUBTÓPICOS DO EIXO:
${focusSubtopics.map(item=>`- ${item}`).join('\n')}

MAPA COMPLETO DA AULA — use livremente conexões com subtópicos não adjacentes:
${fullMap}

OBJETIVO:
- Avaliar compreensão, integração e raciocínio clínico; não repetir as perguntas diretas com um enunciado maior.
- Crie o MENOR conjunto de questões fortes que realmente teste este tópico-eixo. A quantidade é decidida por você e deve ser claramente menor que uma questão por subtópico.
- Selecione apenas conteúdos que mudem hipótese, interpretação, diagnóstico diferencial, exame, conduta, contraindicação, prognóstico ou resposta diante de uma evolução clínica.
- Ignore subtópicos inúteis para aplicação clínica, trivia, definições isoladas e detalhes que só permitem decoreba. Se este tópico-eixo não sustentar nenhuma cobrança clínica honesta, responda somente SEM_QUESTOES_CLINICAS.
- Cada caso deve integrar vários conhecimentos. Você pode combinar subtópicos distantes do mapa completo quando a conexão for clinicamente natural.

CASOS CLÍNICOS:
- Use casos plausíveis com idade, sexo quando relevante, contexto, tempo de evolução, achados discriminativos e uma decisão real.
- O aluno deve precisar extrair dados, priorizar hipóteses, comparar caminhos e aplicar mecanismos; reconhecer uma palavra-chave não basta.
- Prefira sequências progressivas de 2 a 4 questões sobre um mesmo caso quando novas informações mudarem o raciocínio. Use outro caso apenas se ele testar uma competência clínica realmente diferente.
- Não revele no caso o diagnóstico ou a conduta perguntada.
- Não transforme "qual é X?" em "um paciente tem X; qual é X?".

ALTERNATIVAS:
- Todas devem representar hipóteses, exames ou condutas clinicamente plausíveis e qualitativamente diferentes.
- Proibido criar alternativas que sejam quase a mesma frase, sinônimos, variações cosméticas, doses aleatórias ou uma correta cercada por absurdos.
- Cada distrator deve corresponder a um erro de raciocínio reconhecível e a explicação deve dizer qual dado do caso o derrota.

FORMATO OBRIGATÓRIO:
${TEMPLATE_QUESTAO(alts, true, true)}

Use números sequenciais simples. Não informe quantas questões decidiu criar, não explique o processo e não escreva nada fora dos blocos de questões.

TRANSCRIÇÃO COMPLETA DA AULA:
${transcript}`;
};

// ─── PROMPT: SUMÁRIO DA ACADEMIA ─────────────────────────────────────────────

export const buildAcademiaSyllabusPrompt = (subjectName, s, autoMode = false) => {
  const l = SYLLABUS_LIMITS.academia;
  const studyMap = !!s.adminStudyMap;
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
Cada subtópico deve ser testável em prova ou útil na vida real. Se só render conselho genérico, orientação vaga ou princípio administrativo, não crie o subtópico.
Não atomize por frase, item de lista, exemplo isolado ou microdetalhe.
Não crie subtópicos guarda-chuva que misturem definição, diagnóstico, classificação, complicações, exames e tratamento quando esses blocos renderem cobranças próprias.
Se um bloco exigiria 4 ou mais parágrafos para explicar bem, divida em 2 ou mais subtópicos.`
    : `Crie exatamente ${s.numTopics} Tópicos com exatamente ${s.numSubtopics} Subtópicos cada.`;

  return `Você é o Arquiteto de Alexandria, construindo o sumário de um curso sobre "${subjectName}".
${estrutura}

FONTE OBRIGATÓRIA — SIGA O MATERIAL:
O sumário deve ser um índice fiel do material fornecido. Siga a ordem do material.
Não reordene, não generalize, não extrapole. Não junte tópicos vizinhos apenas para economizar geração.

HIERARQUIA DA INTENÇÃO DO USUÁRIO — REGRA CRÍTICA:
Antes de montar o sumário, extraia mentalmente: o que deve ser aprendido, o que foi proibido, a ordem solicitada e qual desempenho o aluno precisa treinar.
- Proibições explícitas vencem qualquer currículo genérico. "Não inclua doses" também proíbe criar seções próprias de dose, posologia, ajuste posológico ou titulação. "Sem introdução/generalidades" também proíbe blocos disfarçados como princípios, fundamentos, panorama ou considerações iniciais.
- Respeite o enquadramento do pedido. Não transforme um recorte específico, como psicofarmacologia, em um curso geral da classe farmacológica.
- Respeite ordens explícitas como "primeiro por medicamentos; depois por patologias/casos".
- Se o usuário precisa escolher, comparar, evitar ou trocar tratamentos em casos clínicos, organize a aula para ensinar essas decisões. Não substitua isso por listas genéricas de indicações e efeitos adversos.
- Faça uma auditoria final removendo qualquer seção que viole o pedido, mesmo que seja importante em um curso convencional.

MODO DE ESTUDO RÁPIDO E ENXUTO:
Monte o sumário para estudo eficiente, não para uma apostila enciclopédica.
Evite tópicos ou subtópicos de "introdução", "epidemiologia", "histórico", "conceitos gerais" ou "aspectos gerais" quando eles não forem diretamente úteis para prova, diagnóstico, conduta, mecanismo, classificação, fator de risco, complicação ou pegadinha.
Evite também subtópicos de "adesão", "polifarmácia", "risco-benefício", "otimização do tratamento" ou "medidas gerais" se eles não trouxerem conhecimento técnico específico.
Se uma informação contextual puder ser explicada em 1 ou 2 frases dentro de outro subtópico, NÃO crie um subtópico próprio para ela.
Prefira menos subtópicos, porém mais fortes e cobradores, a muitos subtópicos pequenos.
Só mantenha epidemiologia, definição ampla ou introdução quando isso gerar cobrança real de prova ou mudar conduta/raciocínio.

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
Obrigatório: em pedidos clínicos orientados a decisão, a parte de patologias/casos deve conter cenários que mudem escolha, troca, contraindicação ou linha terapêutica; não pode ser apenas uma recapitulação genérica.
${studyMap ? `PLANO DE ESTUDO GUIADO:
Para CADA subtópico, planeje:
- Q mede quantas QUESTÕES DISTINTAS são recomendadas para revisar o objetivo:
  - Use normalmente Q:2 a Q:4 para permitir recuperação por ângulos diferentes.
  - Use Q:1 apenas para um objetivo realmente estreito e atômico.
  - Use Q:5 ou Q:6 quando houver vários conceitos, decisões ou contrastes independentes; divida o subtópico se precisar de mais.
- OBJ: objetivo de aprendizagem curto, específico e verificável.
- Em pedidos clínicos/práticos, prefira objetivos com selecionar, comparar, trocar, evitar, priorizar, diferenciar ou justificar. Use listar/descrever apenas quando a recuperação factual for o objetivo final.
- Q deve contar cobranças diferentes, não paráfrases da mesma pergunta.

FORMATO OBRIGATÓRIO DE CADA SUBTÓPICO:
  - [Q:3] [OBJ:Explicar por que X produz Y e reconhecer sua consequência] Nome do subtópico
- Use exatamente linhas "Tópico N: nome" e bullets iniciados por "- [Q:".
- NÃO use tabelas, JSON, blocos de código, títulos "Eixo/Trilha/Módulo" nem comentários antes ou depois do mapa.
` : ''}
FORMATO:
Tópico 1: [Nome]
  - ${studyMap ? '[Q:3] [OBJ:objetivo verificável] ' : ''}[Subtópico]
  - ${studyMap ? '[Q:2] [OBJ:objetivo verificável] ' : ''}[Subtópico]
Tópico 2: [Nome]
  - ${studyMap ? '[Q:4] [OBJ:objetivo verificável] ' : ''}[Subtópico]

Responda APENAS o sumário.`;
};

// ─── PROMPT: AULA DA ACADEMIA ─────────────────────────────────────────────────

export const buildAcademiaLessonPrompt = (topicTitle, subtopics, material = '', subjectName = '', explanationLength = 'complete', extraInstruction = '', lessonFormat = 'outline') => {
  const lengthMode = ACADEMIA_LESSON_LENGTH_RULES[explanationLength] ? explanationLength : 'complete';
  const useOutline = lessonFormat !== 'narrative';
  // Gera exemplo de saída esperada com os 2 primeiros subtópicos para a IA imitar o padrão
  const exampleOutput = subtopics.slice(0, 2).map((s, i) =>
    useOutline
      ? `## ${s}\n**[título curto do bloco]**\n- **[item principal]:** [frase clara]\n- **[grupo, sequência ou mnemônico]:**\n  - [componente subordinado]\n  - [componente subordinado]\n- **[outro item principal]:** [consequência ou conduta]`
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
- ${useOutline
    ? 'FORMATO EM TÓPICOS: escreva em outline de revisão, com bullets densos e frases completas.'
    : 'FORMATO EM PARÁGRAFOS: escreva em fluxo narrativo e conectado. Não transforme a seção em uma lista apenas porque a profundidade escolhida é Essencial.'}
- ${useOutline
    ? 'Quando um bullet-pai introduzir classificação, componentes de mnemônico, sequência ou exemplos, coloque cada componente em sub-bullets indentados com dois espaços antes de "-". Nunca deixe filhos visuais no mesmo nível do pai.'
    : 'Use listas somente quando uma classificação ou sequência perderia clareza em prosa; fora desses casos, mantenha parágrafos.'}
- ${useOutline
    ? 'Não use letras ou números como marcadores internos. Use "- " para bullets principais e "  - " para sub-bullets.'
    : 'A profundidade controla o tamanho do texto, não o transforma em tópicos.'}
- ${lengthMode === 'essential'
    ? 'Não use fragmentos soltos como "dor, distensão, vômitos". Transforme-os em uma frase útil, por exemplo: "A hérnia obstrutiva costuma causar dor, distensão, vômitos e constipação."'
    : 'Evite começar toda seção com "[subtópico] é..." ou "[subtópico] refere-se...". Varie a abertura e dê continuidade ao raciocínio.'}
- ${lengthMode === 'essential'
    ? 'Não use frases como "é fundamental observar", "desempenha papéis cruciais" ou similares; elas inflam o texto.'
    : 'Comece pelo papel daquele conceito dentro do assunto maior, depois explique mecanismo, critério ou consequência relevante.'}
- ${lengthMode === 'essential'
    ? 'Evite repetir literalmente o título do subtópico como abertura. Reescreva a ideia de forma compacta, usando negrito para rótulos clínicos quando ajudar.'
    : 'Não transforme cada subtópico em um fato isolado. Mostre como as ideias se encadeiam.'}
- Use **negrito** para termos-chave, valores críticos e critérios diagnósticos.
- ${useOutline ? 'Use listas para organizar o conteúdo e preserve a hierarquia entre bullets e sub-bullets.' : 'Não use listas por padrão; use-as apenas quando forem claramente melhores que um parágrafo curto.'}
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
  const types = s.questionTypes || ['direct'];
  const onlyFlashcards = onlyMemoryCards(types);
  const caseSeries = !onlyFlashcards && s.questionStyle === 'mixed';
  const explanationInst = questionExplanationRules(s);
  const subtopicsArr = Array.isArray(subtopics) ? subtopics : [subtopics];
  const plan = Array.isArray(questionPlan) && questionPlan.length
    ? questionPlan.map(n => Math.max(1, Math.min(30, Number(n) || 1)))
    : subtopicsArr.map(() => 2);
  const totalQuestions = plan.reduce((acc, n) => acc + n, 0);

  return `Você é um examinador de residência médica criando questões de fixação para "${topicTitle}".

ESTILO: ${styleInst}
${typeInst ? typeInst + '\n' : ''}
SUBTÓPICOS DA AULA${onlyFlashcards ? ' (cubra alto rendimento, sem quantidade fixa)' : ' E QUANTIDADE OBRIGATÓRIA'}:
${subtopicsArr.map((s, i) => onlyFlashcards ? `${i + 1}. ${s}` : `${i + 1}. ${s} → ${plan[i] || 2} questões`).join('\n')}

${onlyFlashcards ? `QUANTIDADE: gere a quantidade ideal de ${memoryCardName(types)} para revisar o essencial da aula, sem redundância. O conjunto deve permitir reconstruir a aula ativa e clinicamente, como uma revisão AnKing-like.` : `TOTAL OBRIGATÓRIO: EXATAMENTE ${totalQuestions} questões.`}

REGRA DE FIXAÇÃO (CRÍTICA):
- ${onlyFlashcards ? 'Não use mínimo fixo por subtópico; use o menor conjunto de cartões que preserve cobertura de alto rendimento.' : caseSeries ? 'Use a quantidade individual indicada como meta de COBERTURA de cada subtópico, mas organize a bateria pelos casos. Um caso pode integrar vários subtópicos relacionados; não crie um caso por subtópico.' : 'Siga exatamente a quantidade individual indicada acima. Quando o plano pedir 1, faça uma única questão forte e suficiente.'}
- A bateria será usada pelo aluno como principal revisão ativa da aula: ela deve cobrir os 80% mais importantes, cobrados e esquecíveis do conteúdo.
- Distribua a bateria entre os conceitos centrais da aula, sem concentrar questões demais em uma única frase ou seção.
- ${onlyFlashcards ? 'Use a regra do menor esforço: gere cartões suficientes para revisar o essencial, mas corte redundância, pistas óbvias e detalhes de baixo rendimento.' : 'Não seja econômico demais. Gere quantidade suficiente para que um aluno que leu a aula consiga revisar os conceitos centrais pelas questões sem precisar reler tudo.'}
- ${onlyFlashcards ? 'Subtópicos maiores, mais importantes ou mais densos podem receber mais cartões, desde que cada cartão cobre uma ideia diferente.' : 'A quantidade já reflete a densidade do objetivo; não aumente nem reduza o plano.'}
- Cada subtópico deve ter ${onlyFlashcards ? 'cartões' : 'questões'} suficientes para revisar seus conceitos centrais sem virar repetição.
- Cada questão deve ter um eixo de cobrança próprio: definição, mecanismo, diagnóstico, achado, classificação, conduta, complicação, diferencial ou pegadinha.
- Cada questão/flashcard deve ser testável em prova ou útil na vida real. Não use bom senso, adesão genérica, revisão de medicação, psicoeducação, simplificação de regime ou risco-benefício genérico para completar quantidade.
- É proibido criar duas questões que testem praticamente a mesma ideia, mesmo com enunciados, casos ou alternativas diferentes.
- Se subtópicos vizinhos falarem do mesmo fenômeno, una mentalmente a cobrança e varie o eixo; não repita a pergunta.
- Não crie questão sobre conteúdo que não apareceu na aula/material.
- Antes de finalizar, confira se cada subtópico recebeu exatamente a quantidade pedida e se não há repetição conceitual.${caseSeries ? ' Confira também se a quantidade de casos foi decidida para o tópico inteiro e se cada sequência aprofunda o caso de verdade.' : ''}

${REGRAS_ENUNCIADO}
${onlyFlashcards ? '' : REGRAS_ALTERNATIVAS}
${onlyFlashcards ? `REGRAS DA EXPLICAÇÃO:
- Explique o porquê/como da resposta ou lacuna. A explicação deve ajudar quem errou a entender a resposta, sem virar aula.
- Não repita o gabarito com mais palavras.` : explanationInst}
${onlyFlashcards ? memoryCardFormat(types) : TEMPLATE_QUESTAO(alts, !!s.adminQuestionExplanations, caseSeries)}

${onlyFlashcards ? `Use IDs sequenciais simples: ## ${onlyClozeCards(types) ? 'Cloze' : 'Flashcard'} 1, ## ${onlyClozeCards(types) ? 'Cloze' : 'Flashcard'} 2...` : `Use IDs no formato SUBTOPICO.QUESTAO, sem colchetes, apenas para indicar o subtópico MAIS RELACIONADO à questão:
## Questão 1.1
## Questão 1.2
## Questão 1.3
## Questão 2.1
${caseSeries ? 'A ordem dos IDs pode alternar entre subtópicos para preservar a sequência do caso.' : 'Não pule subtópicos.'} Não crie IDs fora do plano.`}

${lessonText ? `CONTEXTO DA AULA:\n${lessonText.substring(0, 12000)}` : ''}

${previousQuestions ? `QUESTÕES JÁ EXISTENTES SOBRE ESTA AULA (não copie; varie foco, cenário e distratores):\n${previousQuestions.substring(0, 8000)}` : ''}

${onlyFlashcards ? `Gere a bateria de ${memoryCardName(types)} sem interromper.` : 'Gere a bateria de fixação completa sem interromper.'}`;
};

// ─── PROMPT: BATERIA EXTRA DA ACADEMIA ────────────────────────────────────────

export const buildAcademiaExtraBatteryPrompt = (topicTitle, subtopics, s, lessonText = '', previousQuestions = '', questionPlan = null) => {
  const na = s.numAlternatives || 5;
  const alts = na === 4
    ? 'A) [alternativa]\nB) [alternativa]\nC) [alternativa]\nD) [alternativa]'
    : 'A) [alternativa]\nB) [alternativa]\nC) [alternativa]\nD) [alternativa]\nE) [alternativa]';

  const styleInst = STYLE_INST[s.questionStyle || 'mixed'];
  const typeInst = buildTypeInst(s.questionTypes || ['direct']);
  const types = s.questionTypes || ['direct'];
  const onlyFlashcards = onlyMemoryCards(types);
  const caseSeries = !onlyFlashcards && s.questionStyle === 'mixed';
  const explanationInst = questionExplanationRules(s);
  const subtopicsArr = Array.isArray(subtopics) ? subtopics : [subtopics];
  const plan = Array.isArray(questionPlan) && questionPlan.length
    ? questionPlan.map(n => Math.max(1, Math.min(30, Number(n) || 1)))
    : subtopicsArr.map(() => 2);
  const totalQuestions = plan.reduce((acc, n) => acc + n, 0);

  return `Você é o Oráculo de Medicina da Ágora do Saber, gerando uma bateria de revisão sobre "${topicTitle}".

ESTILO: ${styleInst}
${typeInst ? typeInst + '\n' : ''}
ESTRUTURA${onlyFlashcards ? '' : ' E QUANTIDADE OBRIGATÓRIA'}:
${subtopicsArr.map((sub, i) => onlyFlashcards ? `- Subtópico ${i + 1}: "${sub}"` : `- Subtópico ${i + 1}: "${sub}" → ${plan[i] || 2} questões`).join('\n')}
${onlyFlashcards ? `Quantidade: gere a quantidade ideal de ${memoryCardName(types)}, cobrindo alto rendimento sem repetição. O conjunto deve permitir revisar ativamente o essencial sem reler a aula.` : `Total: EXATAMENTE ${totalQuestions} questões, na ordem acima.`}

REGRA DA BATERIA EXTRA:
- ${onlyFlashcards ? 'Use a mesma lógica dos flashcards de fixação: atomização, alto rendimento, zero ambiguidade, recuperação ativa e menor número útil de cartões.' : caseSeries ? 'Use as quantidades por subtópico como metas de cobertura, mas decida a quantidade ideal de casos para o tópico inteiro. Um caso pode integrar vários subtópicos relacionados; não crie um caso por subtópico.' : 'Siga exatamente a quantidade indicada para cada subtópico, inclusive quando for 1.'}
- ${onlyFlashcards ? 'Subtópicos maiores, mais densos, mais importantes ou com mais contrastes podem receber mais cartões, se cada um cobrar uma ideia diferente.' : 'Não aumente a quantidade para preencher volume; cada questão precisa ter cobrança própria.'}
- Priorize conteúdo relevante ainda não cobrado e amplie a cobertura para além da bateria de fixação.
- A bateria extra deve variar cenário, foco e distratores em relação às questões anteriores.
- Não repita a mesma cobrança com palavras diferentes.
- Cada questão/flashcard deve ser testável em prova ou útil na vida real. Não use bom senso, adesão genérica, revisão de medicação, psicoeducação, simplificação de regime ou risco-benefício genérico para preencher volume.
- Cubra todos os subtópicos e não crie questões fora do plano.${caseSeries ? ' Organize a ordem final pelas sequências dos casos, não pela lista de subtópicos.' : ''}

${REGRAS_ENUNCIADO}
${onlyFlashcards ? '' : `${REGRAS_ALTERNATIVAS}
${explanationInst}
${TEMPLATE_QUESTAO(alts, !!s.adminQuestionExplanations, caseSeries)}`}
${onlyFlashcards ? memoryCardFormat(types) : ''}

${onlyFlashcards ? `Use IDs sequenciais simples: ## ${onlyClozeCards(types) ? 'Cloze' : 'Flashcard'} 1, ## ${onlyClozeCards(types) ? 'Cloze' : 'Flashcard'} 2...` : 'Use o ID no formato SUBTOPICO.QUESTAO, sem colchetes (ex: ## Questão 1.1, ## Questão 1.2, ## Questão 2.1...).'}
${lessonText ? `\nCONTEXTO DA AULA/EXPLICAÇÕES (base obrigatória das questões):\n${lessonText.substring(0, 12000)}` : ''}
${previousQuestions ? `\nQUESTÕES ANTERIORES (faça algo ligeiramente diferente, sem repetir a mesma ideia):\n${previousQuestions.substring(0, 8000)}` : ''}
${onlyFlashcards ? `Gere os ${memoryCardName(types)} sem interromper.` : 'Gere TODAS as questões sem interromper.'}`;
};
