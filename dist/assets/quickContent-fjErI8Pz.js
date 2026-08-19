import{n as e,r as t}from"./memoryCardPolicy-BxEz3PNB.js";var n=(e=``)=>String(e||``).replace(/\*/g,``),r=(e=``,t=``)=>{let n=String(e||``).replace(/\r\n/g,`
`),r=t.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=RegExp(`(?:^|\\n)#{2,4}\\s*${r}\\s*\\n([\\s\\S]*?)(?=(?:^|\\n)#{2,4}\\s*(?:Aula\\s+r[aá]pida|Explica[çc][aã]o|Quest[õo]es|Flashcards)\\b|$)`,`i`);return(n.match(i)?.[1]||``).trim()},i=(e=``)=>{let t=String(e||``).replace(/\r\n/g,`
`);return n(((t.match(/(?:^|\n)##\s*Aula\s+r[aá]pida\s*\n([\s\S]*?)(?=(?:^|\n)##\s*(?:Quest[õo]es|Flashcards)\b|$)/i)||t.match(/(?:^|\n)##\s*Explica[çc][aã]o\s*\n([\s\S]*?)(?=(?:^|\n)##\s*(?:Quest[õo]es|Flashcards)\b|$)/i))?.[1]||r(t,`Aula rápida`)||``).trim().replace(/:\*/g,`:`)).replace(/\n{3,}/g,`

`).trim()},a=(e=``,t=``)=>n((String(e||``).replace(/\r\n/g,`
`).match(/(?:^|\n)##\s*T[íi]tulo\s*\n([\s\S]*?)(?=(?:^|\n)##\s*(?:Foco|Aula\s+r[aá]pida|Explica[çc][aã]o)\b|$)/i)?.[1]||t||``).trim().split(`
`)[0]||``).replace(/^["'“”]+|["'“”]+$/g,``).trim(),o=(e=``,t=``)=>n((String(e||``).replace(/\r\n/g,`
`).match(/(?:^|\n)##\s*Foco\s*\n([\s\S]*?)(?=(?:^|\n)##\s*(?:Aula\s+r[aá]pida|Explica[çc][aã]o)\b|$)/i)?.[1]||t||``).trim()).replace(/\n{3,}/g,`

`).trim(),s=({context:e=``,explanationLength:t=`essential`})=>{let n={essential:`PROFUNDIDADE: Nível 1 — resposta curta e ultra-direta.
- Alvo: 120 a 220 palavras.
- Foque no mecanismo/ideia que resolve a dúvida e em 2 a 4 pontos essenciais.
- Use no máximo 1 subtítulo "###" além do texto principal.
- Corte exemplos longos, contexto histórico e rodeios.`,balanced:`PROFUNDIDADE: Nível 2 — explicação enxuta com raciocínio.
- Alvo: 220 a 380 palavras.
- Explique o mecanismo e traga exemplos/pegadinhas apenas quando ajudarem.
- Use subtítulos "###" quando organizar melhor.`,complete:`PROFUNDIDADE: Nível 3 — mini-aula mais completa.
- Alvo: 380 a 650 palavras.
- Inclua contexto, mecanismo, implicações clínicas e exceções importantes.
- Ainda assim, não transforme a dúvida em aula genérica.`}[t]||``;return`
Você vai criar uma aula para a ferramenta Dúvida Rápida em português brasileiro.

DÚVIDA/MATERIAL DO USUÁRIO:
${e||`Sem contexto. Peça mais contexto implicitamente criando uma explicação curta do tema provável.`}

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

${n}

FORMATO OBRIGATÓRIO:
## Título
[título curto, sem aspas]

## Foco
[uma frase dizendo exatamente o que o usuário queria entender]

## Aula rápida
[mini-aula em markdown]
`.trim()},c=({title:n=``,context:r=``,lesson:i=``,intent:a=``,settings:o={},outputs:s=[`questions`,`flashcards`],alternativeCount:c=5,vofRule:l=``,distractorRule:u=``})=>{let d=Array.isArray(s)?s.filter(e=>[`questions`,`flashcards`].includes(e)):[`questions`,`flashcards`],f=d.includes(`questions`),p=d.includes(`flashcards`),m=[f?`questões`:null,p?`flashcards`:null].filter(Boolean).join(` e `),h=c===4?`A) [alternativa]
B) [alternativa]
C) [alternativa]
D) [alternativa]`:`A) [alternativa]
B) [alternativa]
C) [alternativa]
D) [alternativa]
E) [alternativa]`,g={clinical:`Prefira vinhetas clínicas curtas e cobráveis, com dado discriminativo real e sem entregar diagnóstico/conduta no enunciado.`,direct:`Prefira perguntas diretas com alvo estreito: mecanismo, critério, exceção, comparação ou consequência prática.`,mixed:`Organize a prática em poucos casos encadeados. Cada caso deve gerar perguntas progressivas e diferentes. Em toda questão use "Caso-base: Caso N — [vinheta original completa]" e depois "Enunciado: [pergunta específica]"; repita integralmente o mesmo caso-base na sequência.`}[o.questionStyle||`mixed`],_=o.adminQuestionExplanations?`
FORMATO ADMIN PARA EXPLICAÇÕES DAS QUESTÕES:
- Separe a explicação em "Aula:" e "Alternativas:".
- Aula: explique o conceito de modo suficiente para o aluno entender e acertar a questão.
- Alternativas: use [[ALT:A]], [[ALT:B]], [[ALT:C]], [[ALT:D]] e [[ALT:E]] quando houver E.
- Em [[ALT:A]], explique por que a correta está certa. Nas demais, explique o erro específico em poucas palavras.
- A explicação da alternativa precisa ficar presa ao conteúdo dela, pois o site embaralha alternativa + explicação juntas.`:``;return`
Você vai criar conteúdo de estudo para uma Dúvida Rápida em português brasileiro.

TEMA:
${n}

FOCO IDENTIFICADO:
${a||n}

CONTEXTO DO USUÁRIO:
${r||`Sem contexto adicional. Explique o tema do zero, mas sem fugir do foco.`}

AULA JÁ GERADA:
${i||`Sem aula enviada. Use o contexto e o foco acima.`}

OBJETIVO:
- Gere somente: ${m||`nenhum conteúdo ativo`}.
- ${f?`Crie uma quantidade compacta de questões de fixação que testem se o usuário realmente entendeu essa lacuna.`:`Não gere questões nem a seção "Questões".`}
- ${p?`Crie flashcards atômicos e exportáveis ao Anki para impedir que a lacuna volte.`:`Não gere flashcards nem a seção "Flashcards".`}
- Não reescreva a aula. Gere apenas os tipos selecionados acima.
- Ignore as regras e os exemplos de formato abaixo referentes a um tipo que não foi selecionado.

REGRAS DAS QUESTÕES:
- ${g}
- Gere de 4 a 6 questões. A IA decide a quantidade ideal conforme a complexidade da lacuna.
- Cada questão deve voltar ao problema central do usuário. Não cobre curiosidades periféricas só porque apareceram na explicação.
- Priorize mecanismos causais, decisões práticas, pegadinhas diretamente relacionadas e reconstrução ativa do raciocínio.
- Evite perguntas óbvias, decorebas inúteis e alternativas absurdas.
- Em casos clínicos, inclua apenas dados que mudam o raciocínio: contexto, tempo de evolução, achados positivos e negativos úteis. Não use "clássico", "característico", "destacando-se por" ou frases que entreguem a resposta.
- O caso deve terminar em uma decisão clara: diagnóstico, próxima conduta, fármaco, efeito adverso, mecanismo, exame ou contraindicação.
- Em perguntas diretas, evite "O que é X?", "qual a principal característica?" ou "qual conduta?" sem escopo. A pergunta deve dizer exatamente que tipo de resposta espera.
- Pergunta direta boa deve diferenciar algo: mecanismo vs efeito, regra vs exceção, critério obrigatório vs achado inespecífico, ou fármacos/diagnósticos próximos.
- Questões com alternativas devem ter exatamente ${c} alternativas no formato:
${h}
${l}
${u}
- Depois de cada questão inclua "Gabarito: X" e "Explicação:".
${_}

REGRAS DOS FLASHCARDS:
${t}
${e}

FORMATO FINAL OBRIGATÓRIO:
- Inclua apenas as seções selecionadas no objetivo.
## Questões
## Questão 1
[enunciado]
${h}
Gabarito: A
Explicação:${o.adminQuestionExplanations?`
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
[por que a alternativa E está errada, se existir]`:` [explicação]`}

## Flashcards
## Flashcard 1
Pergunta: [pergunta objetiva e específica?]
Resposta: [resposta curta, poucas palavras]
Explicação: [explique o mecanismo, a justificativa clínica ou o critério que torna a resposta correta]
---
`.trim()};export{s as buildQuickLessonPrompt,c as buildQuickPracticePrompt,o as extractQuickIntent,i as extractQuickLesson,r as extractQuickSection,a as extractQuickTitle};