import{n as e,r as t,t as n}from"./memoryCardPolicy-BxEz3PNB.js";var r={oracle:{minTopics:2,targetMaxTopics:10,minSubtopicsPerTopic:2,targetMaxSubtopicsPerTopic:20,targetMaxTotalSubtopics:120},academia:{minTopics:2,targetMaxTopics:12,minSubtopicsPerTopic:2,targetMaxSubtopicsPerTopic:20,targetMaxTotalSubtopics:140},videoaulas:{minSubtopicsPerBlock:4,maxSubtopicsPerBlock:12}},i={direct:``,vof:`
TIPO: VERDADEIRO OU FALSO
Cada questão deve conter a quantidade de assertivas indicada nas regras específicas da geração, identificadas por numerais romanos, que o aluno classifica como V ou F.
REGRAS CRÍTICAS das assertivas:
- Todas devem ter tamanho similar (±15 caracteres) para não dar pista por tamanho
- Misture verdadeiras e falsas (nunca todas V ou todas F)
- Use a alternativa correta como o gabarito da combinação (ex: "V, F, V, F")
- As alternativas devem ser combinações plausíveis das assertivas
FORMATO especial do enunciado: "Analise as assertivas abaixo e marque a opção correta:
I. [assertiva]
II. [assertiva]
III. [assertiva]..."`,cespe:`
TIPO: CERTO OU ERRADO (estilo CESPE/CEBRASPE)
Cada questão é uma única afirmação que o aluno julga como CERTO ou ERRADO.
Não use alternativas A/B/C/D — as únicas alternativas são:
A) Certo
B) Errado
REGRAS:
- A afirmação deve ser tecnicamente precisa ou conter um erro sutil e clinicamente relevante
- Evite afirmações óbvias demais ou ambíguas
- Distribua equilibradamente entre certas e erradas`,open:`
TIPO: RESPOSTA CURTA
Cada questão deve pedir uma resposta objetiva de 1 a 3 linhas.
FORMATO OBRIGATÓRIO (siga à risca, sem variações):
## Questão N
[Enunciado — pergunta direta sobre um conceito]
Resposta esperada: [resposta em 1-2 frases]
Explicação: [explicação didática em 2-3 frases]
---
NÃO inclua alternativas A/B/C/D. NÃO coloque "Gabarito:" nem "Alternativa correta:". Apenas o formato acima.`,essay:`
TIPO: DISSERTATIVA
Cada questão deve pedir uma resposta de 1 parágrafo (5-8 linhas).
FORMATO OBRIGATÓRIO (siga à risca, sem variações):
## Questão N
[Enunciado — pede para explicar, discutir ou relacionar conceitos]
Resposta esperada: [resposta completa cobrindo os pontos principais, em 4-6 frases]
Explicação: [feedback sobre o que uma boa resposta deve conter]
---
NÃO inclua alternativas A/B/C/D. NÃO coloque "Gabarito:" nem "Alternativa correta:". Apenas o formato acima.`,flashcard:`
TIPO: FLASHCARD
Crie flashcards em português do Brasil para recuperação ativa eficiente.
${t}
${e}
FORMATO OBRIGATÓRIO (siga à risca, sem alternativas):
## Flashcard N
Pergunta: [pergunta direta, autossuficiente e inequívoca?]
Resposta: [um item curto; excepcionalmente dois itens curtos se a pergunta pedir explicitamente o par]
Explicação: [explique o mecanismo, a justificativa clínica ou o critério que torna a resposta correta]
---`,cloze:`
TIPO: FLASHCARD CLOZE DELETION
Crie flashcards cloze deletion em português do Brasil para recuperação rápida de termos essenciais.
${t}
${n}
FORMATO OBRIGATÓRIO (siga à risca, sem alternativas):
## Cloze N
Texto: [frase curta com {{c1::termo oculto}}]
Extra: [explique o mecanismo, a justificativa clínica ou o critério que torna a lacuna correta]
---`},a=(e=[`direct`])=>((!e||e.length===0)&&(e=[`direct`]),e.length===1?i[e[0]]||``:`MISTURE os seguintes tipos de questão ao longo das questões:\n${e.map(e=>`- ${o[e]||e}`).join(`
`)}\n\n${e.map(e=>i[e]).filter(Boolean).join(`

`)}`),o={direct:`Direta (múltipla escolha)`,vof:`Verdadeiro ou Falso`,cespe:`Certo ou Errado (CESPE)`,open:`Resposta Curta (aberta)`,essay:`Dissertativa`,old_exam:`Provas antigas`,flashcard:`Flashcards`,cloze:`Flashcards Cloze`},s=e=>e===`flashcard`||e===`cloze`,c=(e=[])=>e.length===1&&s(e[0]),l=(e=[])=>e.length===1&&e[0]===`cloze`,u=(e=[])=>l(e)?`clozes`:`flashcards`,d=(e={})=>Math.max(3,Math.min(5,Number(e.vofStatementCount)||5)),f=(e={})=>(e.questionTypes||[]).includes(`vof`)?5:Number(e.numAlternatives||5),p=(e={})=>(e.questionTypes||[]).includes(`vof`)?`\nREGRA ESPECÍFICA PARA VERDADEIRO OU FALSO:\n- Cada questão deve ter EXATAMENTE ${d(e)} afirmações.\n- Use SEMPRE 5 alternativas (A-E), cada uma com uma combinação plausível de V/F.\n- O gabarito deve ser uma dessas 5 alternativas e corresponder exatamente à sequência correta das afirmações.`:``,m=(e=[])=>l(e)?`
FORMATO OBRIGATÓRIO:
## Cloze 1
Texto: [frase curta com {{c1::termo oculto}}]
Extra: [explicação causal ou discriminativa que ensine por que a lacuna é correta]
---`:`
FORMATO OBRIGATÓRIO:
## Flashcard 1
Pergunta: [pergunta objetiva?]
Resposta: [resposta curta]
Explicação: [explicação causal ou discriminativa que ensine por que a resposta é correta]
---`,h={hybrid:`Modo misto: quando o fluxo suportar duas passadas, gere primeiro fixação direta e depois casos clínicos integradores. Em prompts de passada única, trate esta etapa como questões diretas de alto rendimento, sem vinheta clínica.`,clinical:`Use EXCLUSIVAMENTE vinhetas clínicas reais e bem construídas: paciente + contexto + evolução + achados relevantes + ponto de decisão. O caso deve exigir raciocínio clínico, não ser uma pergunta direta fantasiada de caso.`,direct:`Use EXCLUSIVAMENTE questões diretas de alto rendimento: alvo de cobrança estreito, resposta previsível e distratores próximos. A pergunta deve testar mecanismo, critério, classificação, conduta, exceção, comparação ou consequência prática — nunca curiosidade solta. PROIBIDO usar paciente, história clínica, vinheta, Caso-base, idade/sexo ou cenário narrativo. Pergunte o conceito diretamente; casos clínicos serão gerados em outra etapa.`,mixed:`ESTILO: CASOS ENCADEADOS
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

Antes de finalizar, revise a bateria: a quantidade de casos é adequada? cada caso aprofunda de verdade? cada questão exige uma decisão distinta? o conjunto cobre o conteúdo sem repetição?`},g=`
REGRAS DO ENUNCIADO:
- Jamais mencione a aula, o professor, o assunto ou qualquer referência ao contexto didático
- PROIBIDO perguntar por que estudar, aprender, conhecer ou compreender o tema; qual é a importância de estudá-lo; qual é o objetivo/finalidade da aula; ou o que o aluno deverá aprender. A questão deve cobrar diretamente um conhecimento médico.
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
- Tamanho ideal: suficiente para contextualizar sem ser prolixo`,_=`
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
- Parta sempre da alternativa A correta. Preserve nos distratores a categoria, a estrutura e o máximo possível dos componentes verdadeiros de A; corrompa apenas um elemento decisivo por vez, como direção do efeito, estrutura anatômica, mecanismo, momento, valor, indicação ou contraindicação.
- Toda alternativa deve conter algum núcleo plausível ou verdadeiro. Em alternativas com duas ou mais afirmações, mantenha uma ou mais partes verdadeiras e altere uma parte decisiva, de modo que a proposição completa fique inequivocamente errada para aquela pergunta.
- A corrupção deve ser conceitual e sutil, não apenas uma troca cosmética de palavras. Quem domina o conteúdo deve conseguir apontar exatamente qual componente tornou o distrator falso.
- Depois de criar cada distrator, confira duas coisas: ele parece correto à primeira leitura? ainda existe apenas uma alternativa integralmente correta? Se qualquer resposta for não, reescreva.
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
Antes de finalizar cada questão, faça este teste mental: "dá para acertar por eliminação grosseira, tamanho da alternativa, categoria absurda ou bom senso leigo?". Se sim, refaça alternativas e/ou enunciado.`,v=`
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
Refira-se SEMPRE pelo conteúdo: "a opção que menciona X", "confundir Y com Z é um erro comum pois..."`,y=`
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
[por que a alternativa E está errada, se existir]`,b=(e={})=>e.adminQuestionExplanations?y:v,x={essential:`
PROFUNDIDADE DA AULA: Nível 1
- MODO RESUMO DE PROVA: preserve apenas o necessário para lembrar, diferenciar e decidir, sem virar texto telegráfico.
- Cada seção do Nível 1 deve começar com uma linha de título curto em negrito, sem marcador e sem ##, resumindo o bloco em 2 a 5 palavras. Exemplos: "**Tipos de hérnias**", "**Fisiopatologia das hérnias**", "**Causas de aderências**".
- Use, em regra, no máximo 80 palavras por seção.
- Se um fato não muda diagnóstico, mecanismo, conduta, prognóstico ou desempenho em prova, corte-o do Nível 1.
- Priorize definição operacional, mecanismo-chave, achado/conduta cobrável e pegadinha, conectando causa → mecanismo → consequência quando fizer sentido.
- Corte rodeios, aberturas genéricas e repetição literal do subtópico, mas não sacrifique clareza para economizar palavras.`,balanced:`
PROFUNDIDADE DA AULA: Nível 2
- Cada seção deve começar com uma linha de título curto em negrito, sem marcador e sem ##, resumindo o bloco em 2 a 5 palavras.
- Cada subtópico deve ter 1 parágrafo curto; use 2 apenas se houver critério/lista importante.
- Preserve exemplos, mecanismos e critérios cobrados em prova, mas retire aberturas longas e repetição.`,complete:`
PROFUNDIDADE DA AULA: Nível 3
- Cada seção deve começar com uma linha de título curto em negrito, sem marcador e sem ##, resumindo o bloco em 2 a 5 palavras.
- Cada subtópico deve ter 1 a 2 parágrafos fortes; use 3 apenas se o subtópico for realmente denso.
- Contextualize melhor o raciocínio, conectando mecanismo, clínica, critérios e exemplos quando isso ajudar o aprendizado.`},S={essential:`
OBJETIVO DE LEITURA:
Escreva como revisão rápida de prova, curta, densa e fácil de escanear.
O aluno deve bater o olho no título curto do bloco e capturar rapidamente o que mais importa.
Os títulos com ## existem só para o sistema separar as seções; dentro de cada seção, crie um título curto em negrito para orientar a leitura quando o ## estiver oculto.`,balanced:`
OBJETIVO DE LEITURA:
Escreva como uma aula enxuta, com raciocínio suficiente para o aluno entender e revisar sem excesso.
Os títulos com ## existem só para o sistema separar as seções; dentro de cada seção, crie um título curto em negrito para orientar a leitura quando o ## estiver oculto.`,complete:`
OBJETIVO DE LEITURA:
Escreva como uma aula/apostila contínua, não como flashcards ou verbetes isolados.
Os títulos com ## existem só para o sistema separar as seções; dentro de cada seção, crie um título curto em negrito para orientar a leitura quando o ## estiver oculto.`},C=`
OBJETIVO DE LEITURA — AULA EM PARÁGRAFOS:
Escreva como uma aula contínua, em que cada parágrafo prepara naturalmente o seguinte.
Os marcadores com ## existem somente para o sistema distribuir internamente o conteúdo e não serão mostrados ao aluno.
O texto final precisa continuar perfeitamente compreensível quando todos esses marcadores forem removidos e os parágrafos forem exibidos em sequência.`,w={essential:`
PROFUNDIDADE DA AULA: Nível 1
- Faça uma revisão curta e fluida, preservando apenas o necessário para lembrar, diferenciar e decidir.
- Use, em regra, no máximo 80 palavras por seção técnica.
- Conecte causa, mecanismo e consequência em frases completas; não use texto telegráfico.`,balanced:`
PROFUNDIDADE DA AULA: Nível 2
- Dedique em regra um parágrafo curto a cada subtópico; use dois apenas se houver critério ou comparação importante.
- Preserve mecanismos, exemplos e critérios cobrados em prova, sempre fazendo a transição para o parágrafo seguinte.`,complete:`
PROFUNDIDADE DA AULA: Nível 3
- Dedique de um a dois parágrafos fortes a cada subtópico; use três apenas quando ele for realmente denso.
- Contextualize mecanismo, clínica, critérios e exemplos como partes de um único raciocínio progressivo.`},T=(e,t=!1,n=!1)=>`
FORMATO OBRIGATÓRIO (uma questão por bloco ---):
## Questão 1.1.1
${n?`Caso-base: Caso 1 — [vinheta clínica original completa; repita-a integralmente em cada questão da sequência]
Enunciado: [pergunta específica desta questão e eventual evolução nova]`:`[Enunciado]`}
${e}
Alternativa correta: [Letra]
Explicação:
${t?`Aula:
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
[por que a alternativa E está errada, se existir]`:`[Explicação]`}
---

INSTRUÇÃO CRÍTICA SOBRE AS ALTERNATIVAS:
Coloque SEMPRE a alternativa CORRETA como alternativa A.
Depois crie os distratores (B, C, D e E se houver) baseando-se na alternativa A:
- Use a alternativa A como referência de formato compacto — os distratores devem ter comprimento e estrutura similares
- Se a pergunta pedir um nome/termo, escreva apenas nomes/termos nas alternativas; não anexe resumos explicativos
- Crie distratores alterando elementos específicos da alternativa A: troque doses, mecanismos, órgãos, fármacos por versões plausíveis mas incorretas
- Preserve em cada distrator os componentes verdadeiros de A e corrompa somente um ponto decisivo; em alternativas compostas, mantenha parte das afirmações verdadeiras, mas garanta que o conjunto seja inequivocamente falso
- Distratores devem parecer igualmente corretos para quem não domina o assunto
- O site embaralha as alternativas automaticamente antes de exibir — você não precisa se preocupar com isso
Resultado esperado: 5 alternativas com comprimento quase idêntico, onde só quem domina o conteúdo consegue identificar a correta.`,E=[`Aderência ao material base e à intenção explícita do usuário`,`Alta utilidade: cada item precisa ser testável em prova ou útil na vida real, não apenas correto`,`Cobertura suficiente dos tópicos/subtópicos sem lacunas importantes`,`Sem redundância conceitual entre questões ou flashcards`,`Enunciado sem pistas semânticas, gramaticais, de tamanho ou de categoria`,`Alternativa correta tecnicamente verdadeira, atual e sem ambiguidade`,`Distratores plausíveis, da mesma categoria semântica e com nível de especificidade semelhante`,`Distratores derivados da correta por uma corrupção conceitual decisiva, preservando algum núcleo verdadeiro sem criar uma segunda resposta correta`,`Alternativas no menor texto suficiente para responder ao alvo, sem resumos explicativos que deem pistas`,`Explicação ensina o porquê e o como do conceito, sem parafrasear a resposta`,`Explicação sem referência fixa a letras, pois o site embaralha alternativas`,`Coerência do formato obrigatório para o parser do site`],D=({subjectTitle:e=``,topicTitle:t=``,subtopics:n=[],sourceMaterials:r=``,generatedText:i=``,expectedQuestionCount:o=0,settings:s={}})=>{let l=s.questionTypes||[`direct`],u=c(l),d=l.every(e=>[`open`,`essay`].includes(e)),h=!u&&s.questionStyle===`mixed`,v=f(s)===4?`A) [alternativa]
B) [alternativa]
C) [alternativa]
D) [alternativa]`:`A) [alternativa]
B) [alternativa]
C) [alternativa]
D) [alternativa]
E) [alternativa]`,y=a(l),x=!!s.adminQuestionExplanations,S=u?`
FORMATO DE SAÍDA OBRIGATÓRIO:
${m(l).trim().replace(`## Flashcard 1`,`## Flashcard N`).replace(`## Cloze 1`,`## Cloze N`)}`:d?`
FORMATO DE SAÍDA OBRIGATÓRIO:
## Questão N
${h?`Caso-base: Caso 1 — [vinheta clínica original completa]
Enunciado: [pergunta específica desta questão e eventual evolução nova]`:`[Enunciado]`}
Resposta esperada: [resposta objetiva]
Explicação: [explicação didática]
---`:`
FORMATO DE SAÍDA OBRIGATÓRIO:
## Questão N
${h?`Caso-base: Caso 1 — [vinheta clínica original completa]
Enunciado: [pergunta específica desta questão e eventual evolução nova]`:`[Enunciado]`}
${v}
Alternativa correta: A
Explicação:
${x?`Aula:
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
[por que a alternativa E está errada, se existir]`:`[Explicação didática sem referir letras]`}
---`;return`Você é revisor sênior de questões médicas da Ágora do Saber. Sua tarefa é fazer um passe rigoroso sobre uma bateria recém-criada e devolver apenas a versão final corrigida.

CONTEXTO:
- Assunto: ${e||`Não informado`}
- Tópico/bloco: ${t||`Não informado`}
${n?.length?`- Subtópicos obrigatórios:\n${n.map((e,t)=>`${t+1}. ${e}`).join(`
`)}`:``}

MATERIAL BASE / INTENÇÃO DO USUÁRIO:
${r?r.substring(0,14e3):`Não informado. Use apenas o contexto das questões e subtópicos.`}

CHECKLIST DE REPARO OBRIGATÓRIO:
${E.map(e=>`- ${e}`).join(`
`)}

REGRAS DE CORREÇÃO:
- Não comente a revisão. Não entregue relatório. Entregue somente as questões/flashcards finais.
- Devolva EXATAMENTE ${Math.max(1,Number(o)||1)} item(ns), na mesma ordem da bateria recebida; nunca omita uma questão problemática.
- Corrija erros factuais, ambiguidade, pistas, lacunas e explicações fracas.
- Exclua ou substitua itens inúteis, óbvios, genéricos, redundantes ou desalinhados com o material base.
- Para questões fechadas, coloque SEMPRE a correta como A porque o site embaralha depois.
- Para flashcards/clozes, mantenha cobranças específicas, atômicas, respostas/lacunas curtas e explicações que ensinem o porquê/como daquela resposta.
- Preserve o idioma em português do Brasil.

${y?`${y}\n`:``}
${p(s)}
${g}
${u?``:_}
${u?``:b(s)}
${S}

BATERIA A REPARAR:
${i}

Agora devolva APENAS a bateria final reparada, no formato obrigatório.`},O=(e,t=``,n=!1)=>{let r=f(e)===4?`A) [alternativa]
B) [alternativa]
C) [alternativa]
D) [alternativa]`:`A) [alternativa]
B) [alternativa]
C) [alternativa]
D) [alternativa]
E) [alternativa]`,i=h[e.questionStyle||`mixed`],o=Math.max(1,Number(e.numSubtopics)||1),s=Math.max(1,Number(e.qPerSub)||1),d=o*s,v=e.questionTypes||[`direct`],y=c(v),x=!!e.qPerSubAuto&&!y,S=!y&&e.questionStyle===`mixed`,C=y?`
ESTRUTURA PARA ${l(v)?`CLOZES`:`FLASHCARDS`}:
- Use os subtópicos/conceitos fornecidos como fontes de candidatos, sem obrigação de criar cartão para cada um.
- Não use meta numérica fixa. Crie apenas ${u(v)} de alto rendimento, sem redundância.
- Priorize somente conceitos cobrados, esquecíveis e diferenciadores que realmente precisem estar disponíveis de memória.
- Não tente substituir a aula nem cobrir cada detalhe: retenha só o núcleo que passar pela política global de cartões.`:x?`
ESTRUTURA (quantidade de questões automática):
Quando uma lista de subtópicos obrigatórios for fornecida, cubra TODOS eles.
Se NÃO houver lista obrigatória, defina mentalmente ${o} eixos/subtópicos de cobrança para este tópico.
NÃO use quantidade fixa por subtópico:
- Para cada subtópico/eixo, atomize o conteúdo em perguntas independentes de alto rendimento.
- Gere o menor conjunto que cubra tudo que é relevante, cobrável e ainda não repetido.
- Não existe piso, meta habitual nem obrigação de explorar vários ângulos. Uma cobrança forte basta quando recupera o objetivo inteiro com justiça.
- Acrescente outra questão somente quando ela exigir um mecanismo, diagnóstico diferencial, critério, conduta, complicação ou pegadinha realmente independente.
- Checklist obrigatório antes de finalizar cada subtópico: ideia central/definição; mecanismo ou fisiopatologia; achados/diagnóstico; conduta, complicação, diferencial ou pegadinha quando aplicável.
- Não crie questões para encher volume. Não pergunte trivia inútil.
- Não crie questões de bom senso para completar quantidade. Se a cobrança seria "psicoeducação", "simplificar regime", "revisar medicações", "avaliar risco-benefício" ou equivalente genérico, substitua por um eixo técnico realmente cobrável.
- Só pare depois de verificar que os eixos importantes foram cobrados sem lacunas e sem redundância.`:n?`
ESTRUTURA (modo automático):
Quando uma lista de subtópicos obrigatórios for fornecida, ela substitui esta seção.
Se NÃO houver lista obrigatória, defina mentalmente ${o} eixos/subtópicos de cobrança para este tópico.
MODO AUTOMÁTICO NÃO SIGNIFICA QUANTIDADE LIVRE:
- Gere EXATAMENTE ${d} questões no total
- Distribua como ${s} questão(ões) por eixo/subtópico
- NÃO gere apenas uma questão e NÃO pare antes de completar ${d}
Critérios:
- Use subtópicos suficientes para cobrir os blocos reais de estudo
- Quantidade ideal: a necessária para cobrir o essencial sem repetição
- Cada subtópico deve ser um conceito distinto e testável — não uma variação do anterior
- Cada subtópico deve render uma cobrança testável em prova ou uma decisão útil na vida real. Subtópicos que só geram conselhos genéricos devem ser fundidos, removidos ou reescritos.
- Organize do conceito mais fundamental ao mais específico dentro de cada tópico`:`
ESTRUTURA OBRIGATÓRIA:
- EXATAMENTE ${o} subtópicos
- EXATAMENTE ${s} questão por subtópico
- Total: EXATAMENTE ${d} questões
- Ordem: do conceito mais fundamental ao mais específico`,w=a(e.questionTypes||[`direct`]),E=v.every(e=>[`open`,`essay`].includes(e)),D=b(e),O=S?`
ORGANIZAÇÃO ESPECIAL PARA CASOS ENCADEADOS:
- As metas por subtópico/eixo garantem cobertura; elas NÃO significam um caso separado para cada item.
- Decida a quantidade ideal de casos para o tópico inteiro. Um caso pode integrar vários subtópicos relacionados.
- Organize a ordem final por caso e conclua sua sequência antes de iniciar o próximo, mesmo que isso altere a ordem dos subtópicos.
- Preserve a quantidade total pedida e cubra todos os eixos obrigatórios sem divisão artificial.`:``,k=y?`
FORMATO OBRIGATÓRIO para cada ${l(v)?`cloze`:`flashcard`} (separe com ---):
${m(v).trim()}

REGRA DE QUANTIDADE:
- Ignore qualquer quantidade fixa citada em outras seções.
- Gere a quantidade ideal de ${u(v)} para o núcleo de maior rendimento, sem redundância e sem cota por subtópico.
- Faça cobranças específicas, de recuperação ativa, com resposta/lacuna curta e explicação real do porquê/como da resposta.
- Não aceite cartão que só ensine conduta óbvia, conselho geral ou princípio administrativo.`:E?`
FORMATO OBRIGATÓRIO para cada questão (separe com ---):
## Questão 1.1.1
${S?`Caso-base: Caso 1 — [vinheta clínica original completa; repita-a integralmente em cada questão da sequência]
Enunciado: [pergunta específica desta questão e eventual evolução nova]`:`[Enunciado]`}
Resposta esperada: [resposta objetiva]
Explicação: [explicação didática]
---`:`${_}\n${D}\n${T(r,!!e.adminQuestionExplanations,S)}`;return`Você é o Oráculo de Medicina da Ágora do Saber. Sua missão é criar questões médicas de altíssima qualidade para residência médica.

${t?t+`
`:``}
ESTILO DE ENUNCIADO: ${i}
${w?w+`
`:``}${p(e)}
${C}
${O}
${g}
${k}

${y?`Use o ID no formato sequencial simples (ex: ## ${l(v)?`Cloze`:`Flashcard`} 1, ## ${l(v)?`Cloze`:`Flashcard`} 2).`:`Use o ID no formato TOPICO.SUBTOPICO.QUESTAO, sem colchetes (ex: ## Questão 3.2.1).`}
${y?`Gere os ${u(v)} sem interromper. Não resuma, não pergunte, não comente — apenas ${u(v)}.`:`Gere TODAS as questões sem interromper. Não resuma, não pergunte, não comente — apenas questões.`}`},k=`PRINCÍPIO DE EFICIÊNCIA E ALTO RENDIMENTO:
A liberdade para escolher a quantidade não é um convite para produzir o maior sumário possível. Construa o menor mapa de estudo que preserve tudo o que realmente sustenta compreensão, diferenciação e decisão.
Priorize conceitos que destravam vários outros, são recorrentes em avaliação, mudam diagnóstico ou conduta, evitam erros previsíveis ou distinguem alternativas próximas.
Cada tópico, subtópico e questão planejada precisa acrescentar um ganho de aprendizagem próprio. Quando o ganho marginal for pequeno, repetido ou meramente contextual, incorpore a informação a uma unidade mais forte ou elimine-a.
O objetivo é maximizar domínio relevante por tempo de estudo: cobertura essencial sem superficialidade, redundância ou expansão por completude aparente.`,A=(e,t,n=!1)=>`Você é o Arquiteto de Alexandria. Crie um sumário para "${e}" baseado no material do usuário.

${n?`Defina a quantidade ideal de tópicos e subtópicos para cobrir "${e}" com base no material fornecido.
OBJETIVO: criar um roteiro de estudo completo e utilizável, não um índice enciclopédico.
O sumário será usado assim: cada subtópico vira um eixo de cobrança para questões/flashcards. Portanto, cada subtópico deve ter uma fronteira de cobrança clara e não pode ser apenas variação redundante de outro subtópico.
CALIBRAÇÃO SEM META NUMÉRICA:
- Os tópicos devem emergir naturalmente do material, sem divisões genéricas fixas.
- Materiais longos devem ser organizados por blocos didáticos coerentes, em vez de concentrados em tópicos gigantes.
- Só crie um novo subtópico quando ele exigir compreensão ou recuperação própria e não estiver coberto por um eixo vizinho.
- Cada subtópico precisa ser testável em prova ou útil na vida real. Se só render pergunta de bom senso, não o crie.
Crie subtópicos como UNIDADES DE COBRANÇA: cada um deve permitir uma questão/flashcard próprio, com resposta ou explicação diferente dos vizinhos.
Não atomize por frase, item de lista, exemplo isolado ou microdetalhe.
Não crie subtópicos guarda-chuva que misturem definição, diagnóstico, classificação, complicações, exames e tratamento quando esses blocos renderem cobranças próprias.`:`Crie exatamente ${t.numTopics} Tópicos com exatamente ${t.numSubtopics} Subtópicos cada.`}

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
${k}
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
- Obrigatório revisar tópicos excessivamente grandes e dividi-los por fronteiras didáticas reais
- Obrigatório fazer uma checagem final contra o material: remova qualquer tópico proibido pelo usuário e confirme que todas as etapas/blocos solicitados aparecem.
- Em pedidos clínicos orientados a decisão, prefira títulos que explicitem o contraste ou cenário: "X versus Y em paciente com...", "troca de X após...", "escolha em...", "quando evitar X". Evite objetivos vagos como apenas "indicações", "efeitos adversos" ou "primeira linha" quando o contexto discriminativo puder ser explicitado.
- A seção de casos/patologias não pode ser uma recapitulação genérica dos fármacos. Ela deve transformar o conteúdo anterior em cenários de decisão plausíveis, com fatores do paciente que mudam a escolha.

PLANO DE ESTUDO GUIADO:
Para CADA subtópico, faça também um planejamento individual:
- Q mede o número de QUESTÕES DISTINTAS recomendadas para revisar o objetivo:
  - Escolha a menor quantidade que permita recuperar o objetivo com segurança, sem meta padrão, piso artificial ou incentivo para preencher volume.
  - Aumente Q somente quando cada questão adicional testar uma decisão, contraste, mecanismo ou aplicação realmente independente.
  - Se várias perguntas seriam paráfrases ou cobrariam o mesmo raciocínio, mantenha apenas a cobrança mais forte.
- OBJ: objetivo de aprendizagem curto, específico e verificável. Ele deve dizer o que o estudante precisará compreender, diferenciar, reconhecer ou decidir.
- Quando o pedido for clínico/prático, prefira verbos de decisão: selecionar, comparar, trocar, evitar, priorizar, diferenciar ou justificar. Use "listar/descrever/identificar" apenas quando recuperação factual for realmente o objetivo final.
- Q deve contar cobranças distintas, não paráfrases da mesma pergunta.

FORMATO OBRIGATÓRIO DE CADA SUBTÓPICO:
  - [Q:NÚMERO] [OBJ:Diferenciar X de Y pelo achado que muda a conduta] Nome do subtópico
- Substitua NÚMERO pela quantidade calculada segundo o ganho de aprendizagem daquele objetivo; o marcador demonstra sintaxe, não uma meta.
- Use exatamente linhas "Tópico N: nome" e bullets iniciados por "- [Q:".
- NÃO use tabelas, JSON, blocos de código, títulos "Eixo/Trilha/Módulo" nem comentários antes ou depois do mapa.

FORMATO:
Tópico 1: [Nome]
  - [Q:NÚMERO] [OBJ:objetivo verificável] [Subtópico]
  - [Q:NÚMERO] [OBJ:objetivo verificável] [Subtópico]
Tópico 2: [Nome]
  - [Q:NÚMERO] [OBJ:objetivo verificável] [Subtópico]

Responda APENAS o sumário.`,j=(e,t,n)=>`Você é o Arquiteto de Alexandria. Ajuste o sumário abaixo conforme a instrução do usuário.

SUMÁRIO ATUAL:
${e}

INSTRUÇÃO DO USUÁRIO:
${t}

REGRAS:
- Mantenha a estrutura de Tópicos e Subtópicos
- Preserve a ordem didática (geral → específico, mecanismo → aplicação)
- Cada subtópico deve ser um conceito testável independente
- Cada subtópico deve render cobrança de prova ou utilidade real; não mantenha subtópico que só gere conselho genérico.
- Mantenha o sumário completo e fiel: use mais tópicos/subtópicos quando o material ou o usuário pedir
- Não junte tópicos apenas para reduzir tamanho; preserve blocos independentes
- Preserve ou recalcule [Q:n] e [OBJ:objetivo verificável] em CADA subtópico. Em Q, use a menor quantidade suficiente para cobrir cobranças realmente distintas, sem meta padrão e sem perguntas de preenchimento.
- Aplique o princípio de alto rendimento: maximize domínio relevante por tempo de estudo e remova tudo cujo ganho de aprendizagem seja redundante ou marginal.
- Responda APENAS o sumário revisado, sem comentários adicionais`,M=e=>{let t=f(e),n=Math.max(1,Number(e.qPerSub)||1),r=e.questionTypes?.[0]||`direct`,i=[r];if(r===`old_exam`)return`[INSTRUÇÕES PARA TRANSCREVER PROVAS ANTIGAS — ÁGORA DO SABER]

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
- Aguarde eu enviar a prova antes de responder.`;let s=i.some(e=>[`direct`,`vof`,`cespe`].includes(e)),l=c(i),m=a(i),v=b(e),y=t===4?`A) [alternativa]
B) [alternativa]
C) [alternativa]
D) [alternativa]`:`A) [alternativa]
B) [alternativa]
C) [alternativa]
D) [alternativa]
E) [alternativa]`,x=e.autoMode?`*** PARTE 1: ESTRUTURA (modo automático) ***
A IA deve definir a estrutura mais eficiente para estudo, sem meta numérica de tópicos ou subtópicos.
Use o menor mapa que preserve o conteúdo essencial: tópicos emergem do material, seguem ordem didática e cada subtópico acrescenta um bloco testável independente.
Priorize o que destrava compreensão, diferencia alternativas ou muda decisão; funda ou elimine unidades cujo ganho de aprendizagem seja repetido ou marginal.
Responda APENAS o sumário. Aguarde confirmação antes de gerar questões.`:`*** PARTE 1: ESTRUTURA ***
Crie um sumário sobre [INSERIR TEMA] com ${e.numTopics} tópicos e ${e.numSubtopics} subtópicos cada.
Organize do conceito mais fundamental ao mais específico.
Responda APENAS o sumário. Aguarde a confirmação antes de gerar questões.`,S=e.autoMode?`*** PARTE 2: GERAÇÃO (um tópico por vez) ***
Para cada tópico gere ${l?`a quantidade ideal de ${u(i)}, sem meta fixa`:`${n} item(ns) por subtópico (total = subtópicos daquele tópico × ${n})`}.`:`*** PARTE 2: GERAÇÃO (um tópico por vez) ***
Para cada tópico gere ${l?`a quantidade ideal de ${u(i)}, sem meta fixa`:`${e.numSubtopics*n} item(ns) (${e.numSubtopics} subtópicos × ${n} por subtópico)`}.`,C=s?`
FORMATO PARA QUESTÕES COM ALTERNATIVAS:
${T(y,!!e.adminQuestionExplanations,e.questionStyle===`mixed`)}`:``,w=r===`direct`?`Use exclusivamente blocos "## Questão N" com ${t} alternativas, "Alternativa correta: [letra]" e "Explicação:".`:r===`vof`?`Use exclusivamente blocos "## Questão N" com exatamente ${d(e)} assertivas em numerais romanos, 5 alternativas A-E com combinações V/F, "Alternativa correta: [letra]" e "Explicação:".`:r===`cespe`?`Use exclusivamente blocos "## Questão N" com A) Certo, B) Errado, "Alternativa correta: [letra]" e "Explicação:".`:r===`open`?`Use exclusivamente blocos "## Questão N" com "Resposta esperada:" e "Explicação:", sem alternativas.`:r===`essay`?`Use exclusivamente blocos "## Questão N", "Tipo: Dissertativa", "Resposta esperada:" e "Explicação:", sem alternativas.`:r===`flashcard`?`Use exclusivamente blocos "## Flashcard N" com "Pergunta:", "Resposta:" e "Explicação:".`:`Use exclusivamente blocos "## Cloze N" com "Texto:" contendo {{c1::...}} e "Extra:".`;return`[INSTRUÇÕES PARA IA EXTERNA — ÁGORA DO SABER]

${x}

${S}

TIPO DE ITEM A GERAR:
${o[r]||r}

${m?`${m}\n`:``}
${p(e)}
ESTILO: ${h[e.questionStyle||`mixed`]}
${g}
${s?_:``}
${s?v:``}
${C}

REGRAS DE IMPORTAÇÃO NO ÁGORA:
- Entregue os itens finais em blocos separados por "---".
- ${w}
- Não use nenhum outro tipo ou formato de item.
- Não coloque comentários fora dos blocos de itens, porque vou colar a resposta diretamente no importador do Ágora.`},N=(e,t,n,i,a=``,o={})=>{let s=r.videoaulas.minSubtopicsPerBlock,c=Math.max(s,Math.min(30,o.maxSubtopicsPerBlock||r.videoaulas.maxSubtopicsPerBlock)),l=Math.max(s,Math.min(c,n||6)),u=!!o.fullCoverage,d=o.openStructure?`ESTRUTURA ABERTA E COMPLETA:
- Cubra TODA a aula/transcrição, do início ao fim, seguindo a ordem em que o professor apresentou o conteúdo.
- Você decide livremente quantos blocos e quantos subtópicos são necessários. NÃO existe meta, piso, teto ou quantidade esperada de questões.
- Um bloco deve apenas agrupar subtópicos de um mesmo eixo temático; crie um novo bloco quando o eixo mudar.
- Não compacte conteúdos diferentes para reduzir o sumário e não multiplique subtópicos apenas para aumentar volume.
- Inclua todo conceito com cobrança técnica própria: mecanismos, critérios, classificações, diferenciais, achados, condutas, contraindicações, complicações, exceções e pegadinhas relevantes.`:u?`ESTRUTURA OBRIGATÓRIA:
- Cubra TODA a aula/transcrição, do início ao fim, seguindo a ordem em que o professor apresentou o conteúdo.
- Crie quantos blocos forem necessários para representar a aula inteira. NÃO há limite total de blocos, subtópicos ou questões por aula.
- Cada bloco/tópico deve corresponder a um trecho coerente da aula e ter entre ${s} e ${c} subtópicos.
- Se um trecho passaria de ${c} subtópicos, divida em blocos consecutivos menores sem pular conteúdo.
- Não compacte a aula para economizar geração: detalhes cobraveis, exceções, critérios, condutas, classificações e pegadinhas devem virar subtópicos próprios quando forem testáveis.`:`ESTRUTURA OBRIGATÓRIA:
- ${t} bloco(s) de questões
- Entre ${s} e ${c} subtópicos por bloco (ideal: ${l})
- Ordem OBRIGATORIAMENTE didática dentro de cada bloco: conceitos gerais → específicos, mecanismo → clínica → tratamento
- Nunca coloque um detalhe, exceção ou efeito adverso antes de ter coberto o conceito principal`;return`Você é um professor de Medicina e editor de material didático. Sua tarefa é criar o sumário completo da aula "${e.title}".

FINALIDADE DO SUMÁRIO:
- Servir como mapa fiel da aula para estudo, geração de questões, aulas escritas e futuras apostilas.
- Ter organização didática suficiente para que cada subtópico possa depois virar uma seção explicativa de uma apostila.
- Não escreva a apostila agora: entregue apenas a estrutura completa, clara e autossuficiente do conteúdo.

${d}

REGRAS DOS SUBTÓPICOS:
- Cada subtópico = 1 conceito médico específico, relevante e com conteúdo próprio.
- Ignore falas metadidáticas da transcrição: apresentação da aula, agenda, objetivos declarados, motivação, importância de estudar o tema, comentários sobre o curso/professor e encerramento. Elas não são conteúdo médico e nunca devem virar subtópico.
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

${a?`FOCO SOLICITADO PELO USUÁRIO: ${a}\n`:``}

FORMATO OBRIGATÓRIO:
## Bloco 1: [Título temático do bloco]
- [Subtópico testável]
- [Subtópico testável]
...
## Bloco 2: [Título temático do bloco]
- [Subtópico testável]
...

${i?`TRANSCRIÇÃO DA AULA (use como base para os subtópicos):\n${o.fullTranscript?i:i.substring(0,25e3)}`:`[Sem transcrição disponível — baseie-se no título: "${e.title}"]`}`},P=(e,t,n,r,i)=>{let o=h[t.questionStyle||`mixed`],s=n.length||t.qPerBlock||5,d=t.questionTypes||[`direct`],f=c(d),v=!f&&t.questionStyle===`mixed`,y=a(d),x=b(t);return`Você é um examinador de residência médica criando questões sobre "${e.title}" (aula: ${t.aulaTitle}).

ESTILO: ${o}
${y?`${y}\n`:``}
${p(t)}

SUBTÓPICOS (${f?`fontes de candidatos; não há cota de cartões por subtópico`:v?`cubra todos; os casos podem integrar vários subtópicos relacionados`:`gere 1 questão por subtópico, nesta ordem exata`}):
${n.map((e,t)=>`${t+1}. ${e}`).join(`
`)}

${f?`QUANTIDADE: a IA deve decidir a quantidade ideal de ${u(d)}. Não tente substituir a aula nem cobrir todo o bloco; retenha somente as memórias que passarem pela política global, com cobranças específicas e explicações que ensinem o porquê/como da resposta.`:`TOTAL: EXATAMENTE ${s} questões.`}
${v?`ORGANIZAÇÃO: decida a quantidade ideal de casos para o bloco inteiro. Não crie um caso por subtópico; um caso pode integrar vários subtópicos. Organize a bateria por caso e cubra todos os subtópicos ao longo dela.`:``}
${g}
${f?m(d):`${_}
${x}
${T(i,!!t.adminQuestionExplanations,v)}`}

Use o ID como número sequencial simples (${f?`${l(d)?`Cloze`:`Flashcard`} 1, ${l(d)?`Cloze`:`Flashcard`} 2...`:`1, 2, 3...`}).

${r?`REFERÊNCIA DO CONTEÚDO (trecho da aula):\n${r.substring(0,4e4)}`:`[Sem transcrição — baseie-se nos subtópicos e no título da aula]`}

${f?`Gere os ${u(d)} sem interromper ou comentar.`:`Gere TODAS as ${s} questões sem interromper ou comentar.`}`},F=({lessonTitle:e=``,batchTitle:t=``,subtopics:n=[],transcript:r=``,alts:i=``,meta:a={}})=>{let o=b({...a,questionStyle:`direct`,questionTypes:[`direct`]});return`Você é um examinador de residência médica criando uma bateria de FIXAÇÃO DIRETA sobre a aula "${e}".

TIPO ÚNICO: QUESTÕES DIRETAS.
- Crie exatamente uma questão para cada subtópico, na ordem recebida.
- Cada questão deve cobrar diretamente conteúdo médico. É proibido perguntar por que estudar/conhecer o tema, qual é a importância do estudo, qual é o objetivo/finalidade da aula ou o que o aluno aprenderá.
- Se um subtópico recebido for apenas apresentação, motivação ou comentário sobre a aula, não reproduza esse enfoque: cobre o primeiro conhecimento médico concreto correspondente na referência.
- Pergunte o conceito de forma objetiva, com alvo estreito e resposta previsível.
- Teste mecanismo, critério, classificação, comparação, exceção, contraindicação ou consequência prática.
- PROIBIDO criar paciente, caso, história clínica, vinheta, cenário narrativo, idade, sexo, sintomas, evolução ou achados de exame.
- PROIBIDO usar os campos "Caso-base" ou "Enunciado" como sequência clínica.
- Uma questão direta pode cobrar conduta ou diagnóstico, mas deve perguntar o critério/conceito diretamente, sem inventar um paciente.
- Não transforme a pergunta direta em caso clínico. Os casos serão criados em outra etapa.
- Escreva tudo obrigatoriamente em português do Brasil.

LOTE: ${t||`Fixação`}
SUBTÓPICOS (${n.length}):
${n.map((e,t)=>`${t+1}. ${e}`).join(`
`)}

${_}
${o}
${T(i,!0,!1)}

Use números sequenciais simples. Entregue EXATAMENTE ${n.length} questões, sem comentários fora dos blocos.

REFERÊNCIA DA AULA:
${String(r||``).substring(0,4e4)}`},I=({lessonTitle:e,focusBlock:t,allBlocks:n=[],transcript:r=``,alts:i})=>{let a=t?.subtopics||[],o=n.map((e,t)=>`TÓPICO ${t+1}: ${e.title}\n${(e.subtopics||[]).map(e=>`- ${e}`).join(`
`)}`).join(`

`);return`Você é o examinador final de uma formação médica. Crie o teste clínico de verdade da aula "${e}".

TÓPICO-EIXO DESTE REQUEST: ${t?.title||`Aplicação clínica`}
SUBTÓPICOS DO EIXO:
${a.map(e=>`- ${e}`).join(`
`)}

MAPA COMPLETO DA AULA — use livremente conexões com subtópicos não adjacentes:
${o}

OBJETIVO:
- Avaliar compreensão, integração e raciocínio clínico; não repetir as perguntas diretas com um enunciado maior.
- Cobrar somente conhecimento médico. Nunca pergunte sobre a importância de estudar o tema, a finalidade/objetivo da aula, o professor, o curso ou o aprendizado esperado do aluno.
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
${T(i,!0,!0)}

Use números sequenciais simples. Não informe quantas questões decidiu criar, não explique o processo e não escreva nada fora dos blocos de questões.

TRANSCRIÇÃO COMPLETA DA AULA:
${r}`},L=(e,t,n=!1)=>`Você é o Arquiteto de Alexandria, construindo o sumário de um curso sobre "${e}".
${n?`Defina uma estrutura completa para uma aula eficiente.
O sumário será usado assim: cada subtópico vira uma seção explicada pelo professor, e depois o sistema cria questões de fixação para o tópico como um todo. Portanto, os subtópicos devem ter fronteiras conceituais claras e não devem ser variações redundantes do mesmo eixo de cobrança.
CALIBRAÇÃO SEM META NUMÉRICA:
- Deixe a estrutura emergir do material e do desempenho que o aluno precisa treinar.
- Para materiais longos, distribua o conteúdo em blocos didáticos coerentes em vez de inchar um único tópico.
- Só crie um novo subtópico quando ele exigir compreensão ou recuperação própria e não estiver coberto por um eixo vizinho.
- Não use a liberdade de quantidade para maximizar volume.
Crie subtópicos como UNIDADES ENSINÁVEIS: cada um deve render uma explicação curta, coesa e suficiente.
Cada subtópico deve ser testável em prova ou útil na vida real. Se só render conselho genérico, orientação vaga ou princípio administrativo, não crie o subtópico.
Não atomize por frase, item de lista, exemplo isolado ou microdetalhe.
Não crie subtópicos guarda-chuva que misturem definição, diagnóstico, classificação, complicações, exames e tratamento quando esses blocos renderem cobranças próprias.
Se um bloco exigir uma explicação extensa com objetivos independentes, divida-o segundo essas fronteiras conceituais.`:`Crie exatamente ${t.numTopics} Tópicos com exatamente ${t.numSubtopics} Subtópicos cada.`}

FONTE OBRIGATÓRIA — SIGA O MATERIAL:
O sumário deve ser um índice fiel do material fornecido. Siga a ordem do material.
Não reordene, não generalize, não extrapole. Não junte tópicos vizinhos apenas para economizar geração.

HIERARQUIA DA INTENÇÃO DO USUÁRIO — REGRA CRÍTICA:
Antes de montar o sumário, extraia mentalmente: o que deve ser aprendido, o que foi proibido, a ordem solicitada e qual desempenho o aluno precisa treinar.
- Proibições explícitas vencem qualquer currículo genérico. "Não inclua doses" também proíbe criar seções próprias de dose, posologia, ajuste posológico ou titulação. "Sem introdução/generalidades" também proíbe blocos disfarçados como princípios, fundamentos, panorama ou considerações iniciais.
- Respeite o enquadramento do pedido. Não transforme um recorte específico, como psicofarmacologia, em um curso geral da classe farmacológica.
- Respeite ordens explícitas como "primeiro por medicamentos; depois por patologias/casos".
- Se o usuário precisa escolher, comparar, evitar ou trocar tratamentos em casos clínicos, organize a aula para ensinar essas decisões. Não substitua isso por listas genéricas de indicações e efeitos adversos.
- Faça uma checagem final removendo qualquer seção que viole o pedido, mesmo que seja importante em um curso convencional.

MODO DE ESTUDO RÁPIDO E ENXUTO:
Monte o sumário para estudo eficiente, não para uma apostila enciclopédica.
${k}
Evite tópicos ou subtópicos de "introdução", "epidemiologia", "histórico", "conceitos gerais" ou "aspectos gerais" quando eles não forem diretamente úteis para prova, diagnóstico, conduta, mecanismo, classificação, fator de risco, complicação ou pegadinha.
Evite também subtópicos de "adesão", "polifarmácia", "risco-benefício", "otimização do tratamento" ou "medidas gerais" se eles não trouxerem conhecimento técnico específico.
Se uma informação contextual puder ser explicada em 1 ou 2 frases dentro de outro subtópico, NÃO crie um subtópico próprio para ela.
Prefira menos subtópicos, porém mais fortes e cobradores, a muitos subtópicos pequenos.
Só mantenha epidemiologia, definição ampla ou introdução quando isso gerar cobrança real de prova ou mudar conduta/raciocínio.

COMO CALIBRAR O TAMANHO DE UM SUBTÓPICO:
Cada subtópico deve reunir uma unidade ensinável e testável. Não o fragmente por tamanho visual do material; separe apenas quando surgirem objetivos de aprendizagem realmente independentes.

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
Obrigatório: antes de responder, revise tópicos excessivamente grandes e divida-os por fronteiras didáticas reais.
Obrigatório: em pedidos clínicos orientados a decisão, a parte de patologias/casos deve conter cenários que mudem escolha, troca, contraindicação ou linha terapêutica; não pode ser apenas uma recapitulação genérica.
PLANO DE ESTUDO GUIADO:
Para CADA subtópico, planeje:
- Q mede quantas QUESTÕES DISTINTAS são recomendadas para revisar o objetivo:
  - Escolha a menor quantidade que permita recuperar o objetivo com segurança, sem meta padrão, piso artificial ou incentivo para preencher volume.
  - Aumente Q somente quando cada questão adicional testar uma decisão, contraste, mecanismo ou aplicação realmente independente.
  - Se várias perguntas seriam paráfrases ou cobrariam o mesmo raciocínio, mantenha apenas a cobrança mais forte.
- OBJ: objetivo de aprendizagem curto, específico e verificável.
- Em pedidos clínicos/práticos, prefira objetivos com selecionar, comparar, trocar, evitar, priorizar, diferenciar ou justificar. Use listar/descrever apenas quando a recuperação factual for o objetivo final.
- Q deve contar cobranças diferentes, não paráfrases da mesma pergunta.

FORMATO OBRIGATÓRIO DE CADA SUBTÓPICO:
  - [Q:NÚMERO] [OBJ:Explicar por que X produz Y e reconhecer sua consequência] Nome do subtópico
- Substitua NÚMERO pela quantidade calculada segundo o ganho de aprendizagem daquele objetivo; o marcador demonstra sintaxe, não uma meta.
- Use exatamente linhas "Tópico N: nome" e bullets iniciados por "- [Q:".
- NÃO use tabelas, JSON, blocos de código, títulos "Eixo/Trilha/Módulo" nem comentários antes ou depois do mapa.

FORMATO:
Tópico 1: [Nome]
  - [Q:NÚMERO] [OBJ:objetivo verificável] [Subtópico]
  - [Q:NÚMERO] [OBJ:objetivo verificável] [Subtópico]
Tópico 2: [Nome]
  - [Q:NÚMERO] [OBJ:objetivo verificável] [Subtópico]

Responda APENAS o sumário.`,R=(e,t,n=``,r=``,i=`complete`,a=``,o=`outline`)=>{let s=x[i]?i:`complete`,c=o!==`narrative`,l=t.slice(0,2).map((e,t)=>c?`## ${e}\n**[título curto do bloco]**\n- **[item principal]:** [frase clara]\n- **[grupo, sequência ou mnemônico]:**\n  - [componente subordinado]\n  - [componente subordinado]\n- **[outro item principal]:** [consequência ou conduta]`:`## ${e}\n[parágrafo que continua o raciocínio anterior e prepara o próximo]`).join(`

`);return`Você é um professor de medicina da Ágora do Saber, criando uma aula sobre "${e}"${r?` (${r})`:``}.

SUBTÓPICOS A COBRIR — gere EXATAMENTE ${t.length} seções, uma por subtópico, nesta ordem:
${t.map((e,t)=>`${t+1}. ${e}`).join(`
`)}

${c?S[s]:C}

FORMATO DE SAÍDA OBRIGATÓRIO:
Cada seção DEVE começar com ## seguido do título do subtópico, exatamente assim:

## [título do subtópico 1]
[explicação]

## [título do subtópico 2]
[explicação]

... e assim por diante até o subtópico ${t.length}.

EXEMPLO COM SEUS SUBTÓPICOS:
${l}
... (continue para todos os ${t.length} subtópicos)

REGRAS DE CONTEÚDO:
${c?x[s]:w[s]}
- Cada seção cobre APENAS o conceito do seu subtópico — não misture com outros.
- ${c?`Logo após o ## obrigatório, crie um título curto em negrito que sintetize o subtópico sem copiar tudo. Errado: repetir "Tipos especiais de hérnias: incisionais, umbilicais e inguinais". Certo: "**Tipos de hérnias**".`:`Depois do ##, comece diretamente o parágrafo. PROIBIDO criar título, rótulo, cabeçalho, linha isolada em negrito ou repetir o nome do subtópico.`}
- ${c?`FORMATO EM TÓPICOS: escreva em outline de revisão, com bullets densos e frases completas.`:`FORMATO EM PARÁGRAFOS: escreva em fluxo narrativo e conectado. Cada novo parágrafo deve retomar ou desenvolver a ideia anterior com conectores naturais, sem parecer um verbete independente. Não transforme a seção em uma lista apenas porque a profundidade escolhida é Essencial.`}
- ${c?`Quando um bullet-pai introduzir classificação, componentes de mnemônico, sequência ou exemplos, coloque cada componente em sub-bullets indentados com dois espaços antes de "-". Nunca deixe filhos visuais no mesmo nível do pai.`:`Use listas somente quando uma classificação ou sequência perderia clareza em prosa; fora desses casos, mantenha parágrafos.`}
- ${c?`Não use letras ou números como marcadores internos. Use "- " para bullets principais e "  - " para sub-bullets.`:`A profundidade controla o tamanho do texto, não o transforma em tópicos. O resultado deve ter uma sequência didática clara mesmo sem qualquer título visível.`}
- ${s===`essential`?`Não use fragmentos soltos como "dor, distensão, vômitos". Transforme-os em uma frase útil, por exemplo: "A hérnia obstrutiva costuma causar dor, distensão, vômitos e constipação."`:`Evite começar toda seção com "[subtópico] é..." ou "[subtópico] refere-se...". Varie a abertura e dê continuidade ao raciocínio.`}
- ${s===`essential`?`Não use frases como "é fundamental observar", "desempenha papéis cruciais" ou similares; elas inflam o texto.`:`Comece pelo papel daquele conceito dentro do assunto maior, depois explique mecanismo, critério ou consequência relevante.`}
- ${s===`essential`?`Evite repetir literalmente o título do subtópico como abertura. Reescreva a ideia de forma compacta, usando negrito para rótulos clínicos quando ajudar.`:`Não transforme cada subtópico em um fato isolado. Mostre como as ideias se encadeiam.`}
- Use **negrito** para termos-chave, valores críticos e critérios diagnósticos.
- ${c?`Use listas para organizar o conteúdo e preserve a hierarquia entre bullets e sub-bullets.`:`Não use listas por padrão; use-as apenas quando forem claramente melhores que um parágrafo curto.`}
- Tabelas markdown (| col | col |) são aceitas e encorajadas para comparações.
- Linguagem didática e densa. Português brasileiro.

IMPORTANTE: NÃO use ###, ####, numeração (1.) ou qualquer outro marcador de seção.
Use APENAS ## para separar os subtópicos. O sistema depende disso para funcionar corretamente.

${a?`PEDIDO ESPECÍFICO DO USUÁRIO PARA ESTA GERAÇÃO:\n${a}\n`:``}

${n?`MATERIAL BASE:\n${n.substring(0,12e4)}`:`[Sem material — baseie-se no título e subtópicos]`}

Gere a aula no Nível ${s===`essential`?`1`:s===`balanced`?`2`:`3`} para todos os ${t.length} subtópicos, começando pelo ## do primeiro.
Antes de responder, confira se cada seção respeita o limite do nível escolhido.`},z=(e,t,n,r=``,i=null,o=``)=>{let s=f(n)===4?`A) [alternativa]
B) [alternativa]
C) [alternativa]
D) [alternativa]`:`A) [alternativa]
B) [alternativa]
C) [alternativa]
D) [alternativa]
E) [alternativa]`,d=h[n.questionStyle||`mixed`],v=a(n.questionTypes||[`direct`]),y=n.questionTypes||[`direct`],x=c(y),S=!x&&n.questionStyle===`mixed`,C=b(n),w=Array.isArray(e)?e:[e],E=Array.isArray(i)&&i.length?i.map(e=>Math.max(1,Math.min(30,Number(e)||1))):w.map(()=>2),D=E.reduce((e,t)=>e+t,0);return`Você é um examinador de residência médica criando questões de fixação para "${t}".

ESTILO: ${d}
${v?v+`
`:``}${p(n)}
SUBTÓPICOS DA AULA${x?` (fontes de candidatos, sem cota de cartões)`:` E QUANTIDADE OBRIGATÓRIA`}:
${w.map((e,t)=>x?`${t+1}. ${e}`:`${t+1}. ${e} → ${E[t]||2} questões`).join(`
`)}

${x?`QUANTIDADE: gere a quantidade ideal de ${u(y)} para o núcleo de maior rendimento, sem redundância. Não tente reconstruir toda a aula por cartões.`:`TOTAL OBRIGATÓRIO: EXATAMENTE ${D} questões.`}

REGRA DE FIXAÇÃO (CRÍTICA):
- ${x?`Não use mínimo fixo por subtópico. Retenha somente o núcleo 20/80 que realmente precise de memorização por cartões; 20/80 é importância, não quantidade.`:S?`Use a quantidade individual indicada como meta de COBERTURA de cada subtópico, mas organize a bateria pelos casos. Um caso pode integrar vários subtópicos relacionados; não crie um caso por subtópico.`:`Siga exatamente a quantidade individual indicada acima. Quando o plano pedir 1, faça uma única questão forte e suficiente.`}
- A bateria será usada pelo aluno como revisão ativa da aula: ela deve ${x?`priorizar prova e decisões clínicas relevantes sem tentar reproduzir todo o conteúdo`:`cobrir os 80% mais importantes, cobrados e esquecíveis do conteúdo`}.
- Distribua a bateria entre os conceitos centrais da aula, sem concentrar questões demais em uma única frase ou seção.
- ${x?`Use a regra do menor esforço: gere cartões suficientes para revisar o essencial, mas corte redundância, pistas óbvias e detalhes de baixo rendimento.`:`Não seja econômico demais. Gere quantidade suficiente para que um aluno que leu a aula consiga revisar os conceitos centrais pelas questões sem precisar reler tudo.`}
- ${x?`Subtópicos maiores, mais importantes ou mais densos podem receber mais cartões, desde que cada cartão cobre uma ideia diferente.`:`A quantidade já reflete a densidade do objetivo; não aumente nem reduza o plano.`}
- ${x?`Um subtópico pode não receber cartão quando nenhum candidato sobreviver ao filtro global; isso é preferível a fabricar cobertura.`:`Cada subtópico deve ter questões suficientes para revisar seus conceitos centrais sem virar repetição.`}
- Cada questão deve ter um eixo de cobrança próprio: definição, mecanismo, diagnóstico, achado, classificação, conduta, complicação, diferencial ou pegadinha.
- Cada questão/flashcard deve ser testável em prova ou útil na vida real. Não use bom senso, adesão genérica, revisão de medicação, psicoeducação, simplificação de regime ou risco-benefício genérico para completar quantidade.
- É proibido criar duas questões que testem praticamente a mesma ideia, mesmo com enunciados, casos ou alternativas diferentes.
- Se subtópicos vizinhos falarem do mesmo fenômeno, una mentalmente a cobrança e varie o eixo; não repita a pergunta.
- Não crie questão sobre conteúdo que não apareceu na aula/material.
- Antes de finalizar, ${x?`confira se cada cartão passou individualmente pelos filtros de essencialidade, necessidade e cardinalidade`:`confira se cada subtópico recebeu exatamente a quantidade pedida e se não há repetição conceitual`}.${S?` Confira também se a quantidade de casos foi decidida para o tópico inteiro e se cada sequência aprofunda o caso de verdade.`:``}

${g}
${x?``:_}
${x?`REGRAS DA EXPLICAÇÃO:
- Explique o porquê/como da resposta ou lacuna com raciocínio causal, funcional ou discriminativo, como numa boa explicação de questão direta ou clínica.
- Não repita o gabarito com mais palavras e não use comentários vazios como "isso é importante", "cai em prova" ou "vale lembrar".`:C}
${x?m(y):T(s,!!n.adminQuestionExplanations,S)}

${x?`Use IDs sequenciais simples: ## ${l(y)?`Cloze`:`Flashcard`} 1, ## ${l(y)?`Cloze`:`Flashcard`} 2...`:`Use IDs no formato SUBTOPICO.QUESTAO, sem colchetes, apenas para indicar o subtópico MAIS RELACIONADO à questão:
## Questão 1.1
## Questão 1.2
## Questão 1.3
## Questão 2.1
${S?`A ordem dos IDs pode alternar entre subtópicos para preservar a sequência do caso.`:`Não pule subtópicos.`} Não crie IDs fora do plano.`}

${r?`CONTEXTO DA AULA:\n${r.substring(0,12e3)}`:``}

${o?`QUESTÕES JÁ EXISTENTES SOBRE ESTA AULA (não copie; varie foco, cenário e distratores):\n${o.substring(0,8e3)}`:``}

${x?`Gere a bateria de ${u(y)} sem interromper.`:`Gere a bateria de fixação completa sem interromper.`}`},B=({title:n,lessonText:r,pastQuestionsText:i}={})=>`Você é um professor de medicina criando flashcards diretos essenciais para a aula "${n||`Aula FAMED`}".

OBJETIVO:
Crie somente flashcards realmente essenciais, cruzando duas fontes:
1. a aula da Academia, que define o conteúdo médico correto e importante para a prática;
2. as questões antigas, que mostram como a disciplina costuma cobrar esse conteúdo em prova.

${t}
${e}

FILTRO OBRIGATÓRIO EM CASCATA:
Antes de incluir cada cartão, faça silenciosamente todas estas perguntas:
- "Isto é realmente essencial para esta aula?"
- "Eu preciso de um flashcard para aprender ou reter isto?"
- "A recuperação ativa deste ponto realmente me ajudaria a lembrá-lo quando necessário?"
- "Isto não pode ser deduzido por bom senso ou lógica genérica no momento da prova ou da prática?"

O cartão só pode existir se passar claramente por TODOS os filtros. Rejeite qualquer candidato que seja importante, mas não precise ser memorizado por flashcard.

Para passar pelo filtro de essencialidade, o conteúdo deve atender a pelo menos um destes critérios:
- muda diagnóstico, conduta, prognóstico, segurança ou raciocínio clínico na vida real;
- representa um fundamento sem o qual os demais conceitos da aula não podem ser entendidos;
- corresponde a uma cobrança central ou recorrente evidenciada pelas questões antigas;
- resolve uma diferenciação ou pegadinha de alto rendimento necessária para acertar a maioria da prova.

FILTRO DE UTILIDADE DO FLASHCARD:
- Flashcard serve para recuperar uma informação que precisa estar disponível de memória. Não o use para ensinar pela primeira vez um raciocínio longo, uma interpretação complexa ou uma conclusão que nasce naturalmente de dados apresentados.
- Se o aluno consegue chegar à resposta por bom senso, lógica cotidiana, eliminação óbvia ou conselho genérico, não crie o cartão.
- Se uma conclusão é consequência óbvia de uma regra central já transformada em cartão, mantenha apenas a regra central; não crie outro cartão para cada consequência dedutível.
- Se o conteúdo é melhor aprendido resolvendo uma questão clínica, acompanhando uma explicação ou entendendo um mecanismo, não force um flashcard. Transforme em cartão apenas o pré-requisito essencial que realmente precise ser lembrado.
- Não crie cartões sobre atitudes universais como monitorar, individualizar, orientar, avaliar risco-benefício, tratar a causa ou encaminhar casos graves, salvo quando houver um critério médico específico e não dedutível que precise ser memorizado.

REGRAS DE SELEÇÃO:
- Trabalhe pela regra 80/20: depois de levantar os candidatos, ordene-os por rendimento e retenha SOMENTE os 20% mais importantes para acertar a prova e atuar com segurança na vida real.
- Dê peso maior à prova somente depois de filtrar a qualidade da cobrança. Questões antigas médias, difíceis ou realmente discriminativas são a principal evidência de quais conceitos, distinções, critérios, valores e condutas têm maior probabilidade de cobrança relevante.
- Antes de usar uma questão antiga como evidência, classifique silenciosamente sua dificuldade real. Ignore como sinal de prioridade toda questão fácil, elementar, óbvia, respondível por bom senso, resolvida por eliminação de distratores absurdos, entregue pelo próprio enunciado ou que cobre uma recordação básica sem poder discriminativo.
- A dificuldade depende do raciocínio necessário e da plausibilidade dos erros, não do tamanho do enunciado. Uma vinheta longa com resposta evidente continua fácil; uma pergunta curta que exige diferenciação não óbvia pode ser difícil.
- Questão classificada como fácil fornece ZERO peso de prova: não crie um cartão para cobri-la, não preserve seu detalhe só porque apareceu no gabarito e não a use para completar a seleção.
- Uma questão aparecer na prova ou se repetir não basta para torná-la high-yield: recorrência de cobrança trivial continua sendo trivial e não merece flashcard.
- Nas questões médias e difíceis, priorize o conhecimento necessário para chegar ao gabarito, as diferenças entre alternativas plausíveis, integração de dados, critérios não óbvios, valores decisivos, exceções relevantes e pegadinhas que realmente mudam a resposta.
- Ignorar uma questão fácil como evidência de prova não apaga o conceito correspondente da medicina. Ele só pode voltar à seleção se, independentemente daquela questão, for indispensável para diagnóstico, conduta, prognóstico ou segurança na vida real e também precisar genuinamente de memorização.
- Use o espaço liberado pelas cobranças triviais para valorizar conhecimentos de maior utilidade clínica. Se a evidência de prova útil for pequena, não a complete com questões fáceis: componha o núcleo 20/80 com decisões, riscos e fundamentos de alto impacto na vida real.
- A barra de entrada pelo eixo “vida real” também é alta: esquecer o ponto deve poder causar erro relevante de diagnóstico, escolha terapêutica, reconhecimento de risco ou segurança. Ser interessante, moderno, complementar, “potencialmente eficaz”, uma otimização modesta ou um detalhe que pode ser consultado não basta.
- Manobras de nicho, cortes etários isolados, listas de rotina e opções complementares só entram sem apoio de questão média/difícil quando mudarem uma decisão clínica importante e não dedutível.
- Aplique o teste contrafactual da relevância: “Se o aluno esquecer este dado, ele provavelmente errará uma questão média/difícil ou tomará uma decisão clínica materialmente pior antes de poder consultar a informação?”. Se a resposta for não, descarte o candidato.
- Proporções técnicas de procedimento, metas gerais já conhecidas pelo público, números isolados sem consequência decisória, manobras de nicho e detalhes fáceis de consultar não pertencem ao núcleo 20/80 por serem específicos. Exija evidência clara de cobrança discriminativa ou impacto clínico antes de incluí-los.
- Não confunda facilidade de formular uma pergunta com importância de memorizar a resposta. Um fato que produz um card bonito, curto e objetivo ainda deve ser excluído se for periférico.
- Não transforme cada parágrafo, alternativa ou detalhe da aula em cartão. Estar na aula não torna um fato high-yield.
- Não crie um cartão para cada questão antiga. Use as questões para ranquear conceitos, agrupar cobranças equivalentes e identificar o pequeno núcleo que explica a maior parte do desempenho.
- Questões antigas que mandam citar, listar, enumerar ou nomear uma coleção não autorizam um flashcard de lista, mesmo quando essa era a resposta oficial. Elas podem indicar que o tema geral é relevante, mas o inventário pedido recebe ZERO peso como memória de flashcard.
- Não copie a forma da questão antiga. Extraia apenas uma decisão ou diferenciação clinicamente útil que possa ser testada isoladamente; se a cobrança se resume a reproduzir a lista, não crie cartão a partir dela.
- Distratores das questões antigas não são fatos verdadeiros. A aula é a referência para validar o conteúdo.
- Corte curiosidades, exceções raras, números de baixo rendimento, listas periféricas, conselhos genéricos e detalhes que podem ser consultados quando necessários.
- Elimine cartões redundantes e sobrepostos.
- Os 20% são um filtro de importância, não uma quantidade fixa de cartões. A quantidade final deve ser consequência de quantas memórias atômicas sobreviverem ao filtro, sem teto, piso, faixa ou meta de cartões.

FORMATO DIRETO E ATOMIZAÇÃO:
- Depois da seleção, transforme cada memória aprovada em uma pergunta direta, curta e autossuficiente com resposta igualmente curta. Não use lacunas, frases para completar nem sintaxe do Anki.
- Cada pergunta deve testar uma única relação: diagnóstico a partir de pistas, exame de escolha, conduta prioritária, fármaco/classe preferencial, efeito adverso decisivo, contraindicação específica, mecanismo central, limiar que muda decisão ou diferenciação entre conceitos próximos.
- Não coloque diagnóstico, exame, mecanismo, conduta e prognóstico na mesma pergunta apenas porque pertencem à mesma doença.
- A pergunta precisa deixar inequívoco O QUE deve ser recuperado e qual é o recorte. Prefira formulações como “Qual diagnóstico...?”, “Qual exame...?”, “Qual conduta...?”, “Qual fármaco...?” ou “Qual limiar...?” quando elas eliminarem ambiguidade.
- Evite perguntas vagas como “O que você sabe sobre...?”, “Explique...”, “Quais são as características...?”, “Como manejar...?” ou “O que inclui...?”. Elas escondem vários alvos e produzem backs grandes.

REGRA RÍGIDA DO BACK — NO MÁXIMO DOIS ITENS:
- A Resposta deve exigir UM item por padrão e pode exigir DOIS somente quando ambos forem necessários para formar um par curto, inseparável e naturalmente recuperado junto.
- Nunca exija três ou mais itens. Não peça listas de medicamentos, exames, achados, critérios, etapas, fatores de risco, indicações ou contraindicações.
- “Item” significa uma unidade independente que o aluno precisaria conferir para decidir se acertou. Uma frase com três adjetivos, três critérios separados por vírgula, duas classes acompanhadas de alternativas ou uma enumeração disfarçada continua tendo vários itens.
- Cada item deve ser curto: nome, diagnóstico, achado, exame, fármaco, classe, conduta, valor ou expressão médica compacta. A explicação e as ressalvas pertencem ao campo Explicação, não à Resposta.
- Se o conteúdo essencial originalmente for uma lista longa, NÃO faça uma pergunta pedindo a lista inteira e NÃO fabrique automaticamente um cartão para cada item. Selecione apenas o item ou par com papel discriminativo próprio que também sobreviva ao filtro 20/80; se nenhum tiver valor isolado, não crie flashcard sobre a lista.
- Se dois itens forem aceitos, a pergunta deve anunciar explicitamente que pede dois e a resposta deve conter somente esse par. Nunca faça o aluno descobrir quantos itens o avaliador esperava.
- Faça a concordância de cardinalidade: pergunta no singular (“qual”, “que exame”, “que fármaco”, “qual conduta”) exige exatamente um item sem alternativas; pergunta que aceita o par excepcional precisa dizer explicitamente “quais dois” e o back precisa conter exatamente dois itens.
- Nunca responda a uma pergunta no singular com alternativas unidas por “ou”, barra ou parênteses. Escolha uma resposta única adequada ao contexto ou reformule a pergunta para cobrar o conceito comum que engloba as alternativas. Barra permanece aceitável apenas dentro de notações indivisíveis, como uma razão ou medida padronizada, nunca como separador de respostas.

FLASHCARD NÃO É INVENTÁRIO:
- São proibidas perguntas iniciadas ou estruturadas como “cite”, “liste”, “enumere”, “quais são”, “mencione”, “nomeie as classes”, “quais exames” ou qualquer comando para recuperar uma coleção.
- Também é proibido mostrar parte de uma lista na Pergunta e pedir os itens restantes. Citar três exames e perguntar pelos outros dois continua sendo memorização de lista e não se torna um bom card por reduzir o back.
- Rejeite qualquer pergunta que use “além de X” para pedir outros membros do mesmo conjunto. Os dois itens permitidos precisam constituir o conjunto completo cobrado; não podem ser o restante de uma tríade, lista de sintomas, rotina, classificação ou relação maior parcialmente revelada na frente.
- Não pergunte pelo conjunto de classes de medicamentos de primeira escolha, pela rotina de exames, por todos os critérios diagnósticos, por todos os efeitos adversos ou por todas as opções terapêuticas.
- Para medicamentos, pergunte no máximo qual fármaco ou classe possui um papel ÚNICO em um cenário definido: preferência por determinada comorbidade, contraindicação decisiva, mecanismo discriminativo ou efeito adverso que muda a escolha.
- Para exames, pergunte no máximo qual exame possui uma finalidade ÚNICA em um cenário definido: confirmação de uma hipótese, rastreamento de uma causa específica, avaliação inicial prioritária ou achado que muda estratificação/conduta.
- A mera pertença de um medicamento a uma classe ou de um exame a uma rotina não é uma memória suficientemente útil. Se não houver papel individual e decisório, descarte o candidato.
- O par excepcional de dois itens não pode ser usado para começar uma lista. Ele precisa constituir uma unidade consagrada e indivisível; caso contrário, mantenha apenas o item decisivo ou não crie o cartão.

DIREÇÃO DA PERGUNTA — NÚCLEO SEMÂNTICO:
- Antes de escrever, identifique: (a) a entidade central a ser reconhecida ou decidida; (b) as pistas, causas, critérios ou consequências que permitem reconhecê-la; e (c) a relação entre elas.
- Quando pistas W e Z identificam a entidade Y, apresente W e Z na Pergunta e peça Y na Resposta. Não pergunte por uma pista periférica apenas porque ela aparecia no fim da frase original.
- Direções adequadas: um padrão pressórico pergunta qual é o diagnóstico; uma tríade discriminativa pergunta qual doença ela sugere; uma quantidade de classes em uso pergunta como a hipertensão é classificada.
- Pergunte por um atributo, exame, fármaco, valor ou conduta somente quando ele for o alvo pedagógico central e houver uma única resposta relevante — ou um par explicitamente solicitado e inseparável.
- Faça o teste de direção: “Minha pergunta cobra aquilo que as pistas identificam ou apenas pede para recitar uma das próprias pistas?”. Se for apenas recitação periférica, inverta a pergunta ou descarte o cartão.

TESTES DE QUALIDADE DA PERGUNTA:
- Resposta única: se mais de uma resposta não equivalente puder ser considerada correta, especifique melhor o contexto ou descarte o cartão.
- Cardinalidade verificável: conte os itens independentes do back e compare com o comando da pergunta. Singular com duas respostas, plural sem quantidade definida ou “quais dois” com mais/menos de dois são erros e o cartão deve ser reescrito ou descartado.
- Granularidade: se o aluno puder lembrar o conceito principal, mas ainda assim “errar” por esquecer o terceiro item de uma lista, o card está mal formulado.
- Utilidade: se a resposta estiver praticamente escrita na pergunta, for dedutível pelos danos enumerados ou apenas completar uma frase óbvia, não crie o cartão.
- Não transforme uma lista antiga em “qual item falta?” e não pergunte “quais são” quando o back ultrapassaria dois itens.
- Antes de aprovar, procure verbos de inventário na Pergunta e enumerações explícitas ou implícitas na Resposta. Se encontrar, descarte o cartão; não tente consertá-lo repartindo a lista.
- Pergunta e Explicação precisam afirmar a mesma coisa com o mesmo grau de certeza. Se a Explicação precisa corrigir a pergunta com “embora”, “principalmente”, “em geral”, “nos não seletivos” ou outra ressalva, reescreva a pergunta para não transformar cautela em contraindicação absoluta nem associação em regra universal.

EXPLICAÇÃO OBRIGATÓRIA:
- O campo Explicação deve ensinar quem errou: explique por que a resposta é verdadeira, como o mecanismo funciona, qual achado a diferencia de alternativas próximas ou por que ela muda a conduta.
- Não repita apenas a resposta e não escreva comentários metalinguísticos como "isso é importante", "cai em prova" ou "vale lembrar" sem explicar a razão médica.
- Frases como “as diretrizes recomendam”, “há boa evidência”, “esta definição é crucial”, “é uma forma grave” ou “exige avaliação especializada” não constituem explicação por si mesmas. Diga o mecanismo, a consequência decisória ou a diferença para o concorrente mais próximo.
- Quando a pergunta apresenta pistas para recuperar um diagnóstico ou conceito, a Explicação deve mostrar por que essas pistas apontam para ele e como o distinguem da alternativa plausível mais próxima.
- Quando a Resposta cobra um valor ou limiar, explique o que muda clinicamente nesse ponto. Se não houver consequência relevante além de decorar o número, o cartão provavelmente não passou pelo filtro de essencialidade.
- Use a mesma qualidade causal e discriminativa esperada na explicação de uma questão direta ou clínica.
- Seja conciso: encerre a explicação assim que o motivo daquele alvo estiver claro. Não transforme a Explicação em resumo da aula nem acrescente fatos periféricos.

FORMATO OBRIGATÓRIO (repita para cada cartão aprovado):
## Flashcard N
Pergunta: [pergunta direta, curta, autossuficiente e inequívoca]
Resposta: [um item curto; excepcionalmente dois itens curtos se a pergunta pedir explicitamente o par]
Explicação: [explicação causal, funcional ou discriminativa que realmente ensine o porquê ou o como]
---

AULA DA ACADEMIA:
${String(r||``)}

QUESTÕES ANTIGAS:
${String(i||``)}

Antes de responder, revise silenciosamente cada cartão nesta ordem: dificuldade e rendimento do conteúdo; teste contrafactual de relevância; necessidade real de flashcard; direção do núcleo semântico; ausência de lista parcial; concordância singular/plural; quantidade de itens no back; resposta única; qualidade da Explicação. Entregue somente os flashcards diretos aprovados. Não entregue relatório, justificativa da seleção, categorias ou conteúdo fora do formato.`,V=({title:e}={})=>`Vou anexar uma prova antiga, gabarito e, quando existirem, páginas ou imagens complementares. Converta esse material em um pacote importável pela área FAMED da Ágora do Saber para a aula "${e||`Aula FAMED`}".

ENTREGA OBRIGATÓRIA:
- Sua resposta final deve ser um arquivo ZIP baixável, não texto, Markdown, bloco de código, link fictício nem conteúdo em base64.
- O ZIP não pode ter senha e deve conter questions.json na raiz e, somente quando necessário, uma pasta images/.
- Não inclua relatório, README, arquivos temporários ou qualquer item fora dessa estrutura.

FIDELIDADE À PROVA:
- Transcreva integralmente todos os enunciados, casos, comandos e alternativas, preservando conteúdo, ordem e sentido. Corrija apenas ruído inequívoco de OCR e formatação quebrada.
- Nunca resuma, modernize, complete ou reescreva uma questão antiga.
- Use o gabarito oficial anexado. Não invente resposta. Se uma questão estiver ilegível ou não tiver gabarito confiável, não a fabrique: registre o problema antes de gerar o ZIP e peça o arquivo faltante.
- Em explanation, produza uma explicação médica útil: explique por que o gabarito está correto e, nas objetivas, por que os distratores estão errados. Não use comentários vazios como "é a correta", "cai em prova" ou "vale lembrar".
- Em options[].explanation, explique especificamente o acerto ou o erro daquela alternativa, com raciocínio causal, clínico ou discriminativo.

IMAGENS:
- Toda figura necessária para compreender ou responder a uma questão deve ser extraída para um arquivo próprio dentro de images/ e vinculada à questão correspondente.
- Recorte apenas a figura relevante; não use uma captura da página inteira quando for possível isolar a imagem.
- Preserve letras, setas, escalas e legendas que façam parte da figura. Não redesenhe nem gere uma imagem nova.
- Use PNG, JPG, JPEG, WEBP ou GIF. Comprima cada imagem para ficar abaixo de 600 KB sem perder informação diagnóstica.
- Use nomes únicos, minúsculos, sem acentos nem espaços, por exemplo images/q12-radiografia.png.
- altText deve descrever o tipo de figura sem revelar o diagnóstico nem a resposta.
- Se a questão não depende de imagem, use images: [].

CONTRATO EXATO DE questions.json:
{
  "schema": "agora-famed-question-package-v1",
  "title": "nome da prova ou avaliação",
  "questions": [
    {
      "id": "q1",
      "statement": "enunciado da questão",
      "caseContext": "caso clínico separado, ou string vazia",
      "options": [
        {
          "letter": "A",
          "text": "texto integral da alternativa",
          "isCorrect": false,
          "explanation": "por que esta alternativa está correta ou errada"
        }
      ],
      "explanation": "explicação didática completa do gabarito",
      "expectedAnswer": "resposta esperada apenas para questão aberta",
      "isOpen": false,
      "isEssay": false,
      "images": [
        {
          "file": "images/q1-figura.png",
          "altText": "descrição neutra da figura",
          "credit": "fonte, quando constar no original"
        }
      ]
    }
  ]
}

REGRAS DO JSON:
- JSON UTF-8 válido, sem comentários, vírgulas finais ou campos fora do contrato.
- IDs de questões devem ser únicos e estáveis.
- Em questão objetiva, options deve preservar todas as alternativas e exatamente uma deve ter isCorrect: true.
- Em questão aberta/dissertativa, use options: [], isOpen: true e preencha expectedAnswer com base no gabarito oficial.
- Use quebras de linha escapadas como \\n dentro de strings quando necessário.
- Cada caminho images[].file deve corresponder exatamente a um arquivo existente no ZIP; não deixe imagem sem vínculo nem vínculo sem arquivo.

Antes de entregar, valide silenciosamente o JSON, confira todos os gabaritos, abra cada imagem e confirme que o ZIP contém tudo de que o site precisa. Depois devolva somente o arquivo ZIP.`,H=(e,t,n,r=``,i=``,o=null)=>{let s=f(n)===4?`A) [alternativa]
B) [alternativa]
C) [alternativa]
D) [alternativa]`:`A) [alternativa]
B) [alternativa]
C) [alternativa]
D) [alternativa]
E) [alternativa]`,d=h[n.questionStyle||`mixed`],v=a(n.questionTypes||[`direct`]),y=n.questionTypes||[`direct`],x=c(y),S=!x&&n.questionStyle===`mixed`,C=b(n),w=Array.isArray(t)?t:[t],E=Array.isArray(o)&&o.length?o.map(e=>Math.max(1,Math.min(30,Number(e)||1))):w.map(()=>2),D=E.reduce((e,t)=>e+t,0);return`Você é o Oráculo de Medicina da Ágora do Saber, gerando uma bateria de revisão sobre "${e}".

ESTILO: ${d}
${v?v+`
`:``}${p(n)}
ESTRUTURA${x?``:` E QUANTIDADE OBRIGATÓRIA`}:
${w.map((e,t)=>x?`- Subtópico ${t+1}: "${e}"`:`- Subtópico ${t+1}: "${e}" → ${E[t]||2} questões`).join(`
`)}
${x?`Quantidade: gere a quantidade ideal de ${u(y)} para o núcleo de maior rendimento, sem repetição e sem tentar substituir a aula.`:`Total: EXATAMENTE ${D} questões, na ordem acima.`}

REGRA DA BATERIA EXTRA:
- ${x?`Use a mesma política global dos cartões de fixação: essencialidade, necessidade real de memorização, alto rendimento, zero ambiguidade e cardinalidade rigorosa.`:S?`Use as quantidades por subtópico como metas de cobertura, mas decida a quantidade ideal de casos para o tópico inteiro. Um caso pode integrar vários subtópicos relacionados; não crie um caso por subtópico.`:`Siga exatamente a quantidade indicada para cada subtópico, inclusive quando for 1.`}
- ${x?`Subtópicos maiores, mais densos, mais importantes ou com mais contrastes podem receber mais cartões, se cada um cobrar uma ideia diferente.`:`Não aumente a quantidade para preencher volume; cada questão precisa ter cobrança própria.`}
- Priorize conteúdo relevante ainda não cobrado e amplie a cobertura para além da bateria de fixação.
- A bateria extra deve variar cenário, foco e distratores em relação às questões anteriores.
- Não repita a mesma cobrança com palavras diferentes.
- Cada questão/flashcard deve ser testável em prova ou útil na vida real. Não use bom senso, adesão genérica, revisão de medicação, psicoeducação, simplificação de regime ou risco-benefício genérico para preencher volume.
- ${x?`Use todos os subtópicos como fontes, mas não crie cartão para os que não tiverem memória aprovada pelo filtro global.`:`Cubra todos os subtópicos e não crie questões fora do plano.`}${S?` Organize a ordem final pelas sequências dos casos, não pela lista de subtópicos.`:``}

${g}
${x?``:`${_}
${C}
${T(s,!!n.adminQuestionExplanations,S)}`}
${x?m(y):``}

${x?`Use IDs sequenciais simples: ## ${l(y)?`Cloze`:`Flashcard`} 1, ## ${l(y)?`Cloze`:`Flashcard`} 2...`:`Use o ID no formato SUBTOPICO.QUESTAO, sem colchetes (ex: ## Questão 1.1, ## Questão 1.2, ## Questão 2.1...).`}
${r?`\nCONTEXTO DA AULA/EXPLICAÇÕES (base obrigatória das questões):\n${r.substring(0,12e3)}`:``}
${i?`\nQUESTÕES ANTERIORES (faça algo ligeiramente diferente, sem repetir a mesma ideia):\n${i.substring(0,8e3)}`:``}
${x?`Gere os ${u(y)} sem interromper.`:`Gere TODAS as questões sem interromper.`}`};export{E as QUESTION_REPAIR_CHECKLIST,h as STYLE_INST,r as SYLLABUS_LIMITS,i as TYPE_INST,H as buildAcademiaExtraBatteryPrompt,z as buildAcademiaFixationPrompt,R as buildAcademiaLessonPrompt,L as buildAcademiaSyllabusPrompt,M as buildExternalPrompt,B as buildFamedEssentialFlashcardsPrompt,V as buildFamedQuestionPackagePrompt,O as buildOracleQuestionPrompt,A as buildOracleSyllabusPrompt,j as buildOracleSyllabusRevisePrompt,D as buildQuestionRepairPrompt,I as buildSharedLibraryClinicalPrompt,F as buildSharedLibraryDirectPrompt,a as buildTypeInst,P as buildVqBlockPrompt,N as buildVqSyllabusPrompt};