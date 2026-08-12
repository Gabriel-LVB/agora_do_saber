# Produção de conteúdo FAMED pela Academia

A área FAMED usa o PPC 2018 e contempla somente S5, S6, S7 e S8. Dentro do S5 há um segundo seletor com três trilhas: **1ª metade · Cardio/Pneumo**, **2ª metade · Gastro/Endócrino** e **ABS · semestre inteiro**. A grade atual vem dos cronogramas oficiais da turma 2026.2 e inclui datas, horários, aulas teóricas e primeiras chamadas; práticas, feriados, segundas chamadas e AFs são excluídos. A segunda metade permanece selecionável, mas mostra um estado vazio até a chegada do cronograma correspondente.

## Fluxo atual

O conteúdo é criado dentro do site usando exatamente o mesmo fluxo da Academia. A FAMED não possui um editor paralelo. O destino dos dados é diferente: uma Academia iniciada pelo cronograma é salva no acervo compartilhado `famed_content`, e não na biblioteca pessoal do administrador.

1. Entre em **FAMED → S5**.
2. Na aula desejada, clique em **Criar**.
3. Preencha tema e materiais no criador normal da Academia.
4. Escolha formato da aula, profundidade e configurações das questões de fixação.
5. Gere e revise a estrutura.
6. Confirme para voltar à FAMED.
7. Abra os tópicos e use os mesmos controles da Academia para gerar ou regenerar aula, fixação e baterias extras. Para o aluno, a ação **Academia** abre primeiro um menu simplificado de tópicos, sem controles administrativos; ao escolher um tópico, ele pode ver as questões durante a aula, logo após cada capítulo, ou reuni-las ao final. Essa preferência é salva nas configurações do usuário.
8. Publique para os alunos somente depois de conferir todas as aulas, gabaritos e explicações.

## Questões antigas e flashcards essenciais

Cada card de aula pronta contém somente três ações de estudo: **Academia**, **Questões antigas** e **Flashcards**.

Cada aula pode manter blocos nomeados de questões antigas dentro do próprio conteúdo FAMED. O administrador abre **Questões antigas**, copia o prompt fornecido e o envia ao GPT junto da prova, do gabarito e das imagens originais. O GPT deve devolver um ZIP sem senha, com `questions.json` na raiz e as figuras necessárias dentro de `images/`. O contrato versionado é `agora-famed-question-package-v1`; o próprio prompt contém todos os campos, regras de fidelidade, gabarito, explicações e vínculos de imagem.

O site valida o pacote antes da publicação. Questões ficam em `famedStudy.pastQuestionSets`; imagens são gravadas separadamente em `famed_assets` e referenciadas por `assetId`, acompanhando o estado publicado da aula. Não há Firebase Storage. Ao abrir um bloco, o site hidrata as figuras e as mostra no cartão da questão. Excluir o bloco remove também seus assets; excluir toda a Academia remove todos os assets ligados ao conteúdo.

Os flashcards da FAMED são uma síntese seletiva, não uma conversão integral da aula. A ação de gerar permanece bloqueada até que:

1. todos os tópicos da Academia tenham aula efetivamente gerada;
2. exista pelo menos uma questão antiga importada.

A FAMED incorpora a mesma política versionada de `src/prompts/memoryCardPolicy.js` usada por todos os geradores de flashcards e clozes do site e acrescenta a ela a ponderação específica das questões antigas. Mudanças nas regras globais não devem ser copiadas manualmente para um prompt paralelo.

A geração cruza o conteúdo correto da aula com o padrão de cobrança observado nas provas antigas. Antes de aceitar cada cartão, o modelo precisa responder positivamente a duas perguntas distintas: “isto é realmente essencial para esta aula?” e “eu realmente preciso de um flashcard para aprender ou reter isto?”. Conteúdo dedutível por bom senso, lógica genérica, eliminação óbvia, conselho universal ou consequência direta de uma regra central já coberta deve ser descartado. Pontos mais bem aprendidos por explicação, raciocínio ou questão clínica também não devem virar cartões; somente o pré-requisito que precise estar disponível de memória pode ser selecionado. Distratores nunca são tratados como fonte factual.

Depois desse filtro, a IA aplica a regra 80/20 e mantém somente o núcleo de maior rendimento. Antes de dar peso de prova a uma questão antiga, classifica silenciosamente sua dificuldade: cobranças fáceis, elementares, óbvias, entregues pelo enunciado, resolvíveis por bom senso ou por distratores absurdos são ignoradas como evidência de prioridade, ainda que se repitam. O peso maior da prova vem apenas das questões médias, difíceis ou discriminativas — conhecimento necessário para o gabarito, alternativas plausíveis, integração de dados, critérios não óbvios e pegadinhas reais. Ignorar a questão não remove o conceito da medicina: ele ainda pode entrar por impacto clínico próprio. Essa entrada também tem limiar alto: esquecer o ponto deve poder causar erro relevante de diagnóstico, tratamento, reconhecimento de risco ou segurança; novidade, otimização modesta, opção complementar ou detalhe consultável não bastam. Todo detalhe periférico passa pelo teste contrafactual: se esquecê-lo não levar provavelmente a erro em questão média/difícil ou decisão clínica materialmente pior antes de uma consulta, ele fica fora. Proporções técnicas, metas populares, números isolados e manobras de nicho exigem evidência específica para entrar. O espaço liberado pelas cobranças triviais é usado para decisões, riscos e fundamentos importantes para a vida real. Os 20% definem importância, não uma quantidade fixa: não há teto, piso, faixa ou meta de cartões.

Os cartões da FAMED são diretos: frente em forma de pergunta e back em forma de resposta, sem lacunas ou sintaxe Anki. A atomização acontece somente depois da seleção rígida. Cada pergunta cobra uma relação definida e deve exigir um item curto por padrão. Dois itens curtos são aceitos apenas quando formam um par inseparável e a própria pergunta anuncia explicitamente que espera dois. Três ou mais itens são proibidos.

A IA não pode pedir listas de medicamentos, exames, achados, critérios, etapas, fatores ou condutas. Perguntas com “cite”, “liste”, “enumere”, “quais são”, “mencione” ou comandos equivalentes são proibidas. Questões antigas de inventário podem indicar que o tema geral importa, mas a lista oficial recebe peso zero como memória de flashcard. Mostrar parte da lista na frente e pedir os itens restantes também é proibido, inclusive construções “além de X, quais dois...?”. O par excepcional precisa ser o conjunto completo cobrado, nunca o restante de uma tríade ou lista parcialmente revelada. Medicamentos e exames só podem ser cobrados individualmente por um papel decisório bem definido — escolha em uma comorbidade, contraindicação, mecanismo, efeito adverso, confirmação/rastreamento específico ou achado que muda conduta. Mera pertença a uma classe ou rotina não basta. Pergunta singular exige um item sem alternativas; o par excepcional precisa ser anunciado explicitamente e conter exatamente dois. Back com “ou”/barra como alternativas de uma pergunta singular é proibido, exceto quando a barra faz parte de uma notação indivisível.

A IA também não pode contornar a regra quebrando automaticamente uma lista de baixo rendimento em vários cards: cada item precisa sobreviver sozinho ao filtro 20/80 e ter papel discriminativo próprio. A direção segue o núcleo semântico: se pistas, causas ou critérios W e Z identificam a entidade Y, a pergunta apresenta W e Z e pede Y. Perguntas vagas, respostas implícitas, recitação periférica e mais de uma resposta não equivalente são proibidas. Pergunta e Explicação devem preservar o mesmo grau de certeza; uma ressalva na explicação não pode corrigir uma afirmação absoluta na frente. A Explicação não é comentário nem apelo à autoridade: deve ensinar mecanismo, consequência decisória ou diferença para a alternativa plausível mais próxima. Um limiar só merece cartão quando a explicação mostra o que muda clinicamente naquele ponto.

O conjunto salvo recebe uma assinatura derivada da aula e das questões antigas. Se qualquer uma dessas fontes mudar, os flashcards ficam desatualizados: deixam de aparecer aos alunos e o administrador recebe a ação **Atualizar flashcards**. O administrador também pode usar **Apagar flashcards e refazer**. Questões antigas e flashcards usam o mesmo `QuestionView` já compartilhado pelas demais áreas da aplicação. **Refazer estrutura** preserva os blocos de questões antigas, mas a nova aula invalida naturalmente os flashcards até uma nova geração.

Esse compartilhamento inclui a experiência completa de revisão: Meus materiais e a Academia também isolam visualmente flashcards/clozes em uma sessão dedicada, com um cartão por vez, progresso, tela cheia e repetição dos erros. Em tópicos mistos, a separação é apenas de interface; questões e cartões permanecem íntegros no mesmo conteúdo persistido.

No card administrativo de Flashcards, **Exportar para revisar o prompt** baixa um JSON `agora-famed-flashcard-audit-v1`. Essa é uma ferramenta de auditoria, não uma quarta ação de estudo. O arquivo inclui os cartões exatamente como foram salvos, versão e assinatura da geração, checklist de revisão e os textos da aula e das questões antigas usados como evidência. Ele não altera, filtra nem exclui conteúdo. O administrador pode anexá-lo em uma conversa para diagnosticar erros de seleção, atomização, contexto e explicação antes de versionar outra política.

Enquanto estiver em preparação, o conteúdo fica como rascunho e aparece apenas para o administrador. **Refazer estrutura** reabre o criador da Academia para aquela aula do cronograma. **Apagar tudo** remove a estrutura, as aulas e as questões vinculadas.

O administrador também pode remover o conteúdo diretamente no card pelo ícone de lixeira ao lado do estado de publicação. Essa ação apaga somente o documento e a Academia da FAMED; preserva integralmente as videoaulas do Portal do Curso e mantém o item do cronograma disponível para uma criação futura.

O ZIP existe somente para questões antigas e suas imagens. A criação da aula continua interna, sem importador paralelo, script de banco ou Firebase Storage.

## Vínculo com as aulas do curso

Os atalhos exibidos nos cards da FAMED não são inferidos pelo título ou pela descrição das videoaulas. Cada item do cronograma só mostra aulas explicitamente ligadas por IDs estáveis em `src/features/famed/famedCourseLessonMap.js`, sempre na ordem efetiva do Portal do Curso (`courseIndex`).

O administrador pode usar **Exportar aulas do curso** no topo da lista. O JSON contém a ordem aplicada, matéria, tópico, títulos, duração e IDs estáveis, mas deliberadamente não inclui transcrições nem URLs. O snapshot conferido fica em `data/famed/course-catalog.snapshot.json`, e os vínculos aprovados ficam no mapa versionado do projeto. Se ainda não houver vínculo curado, o aluno não recebe uma conclusão automática de que o curso não cobre aquele assunto.

O snapshot de 1º de agosto de 2026 contém 488 aulas. O cronograma atual tem 32 itens de aula: 23 possuem um ou mais vínculos diretos e nove permanecem conscientemente sem substituto aproximado. O estado fica registrado em `FAMED_COURSE_LESSON_MAP.links`/`unmapped` e deve ser revisto quando o catálogo ganhar novas aulas. Como ABS é interdisciplinar, seus atalhos podem apontar para Obstetrícia, Pediatria, Ginecologia e Infectologia, sempre por IDs explicitamente curados.

Itens da turma anterior não são apagados. IDs equivalentes continuam canônicos; conteúdos já criados que saíram da grade aparecem em **Materiais preservados**, sem serem contados como aulas de 2026.2.

## Regras editoriais

- A aula deve ser fluida, em parágrafos conectados e numa sequência didática clara.
- Questões diretas devem ter alvo estreito e resposta inequívoca.
- Casos clínicos devem conter apenas dados úteis para a decisão cobrada.
- Em sequências clínicas, reutilize exatamente o mesmo caso compartilhado; o site o mostrará uma única vez antes das questões visíveis.
- Distratores devem partir da correta e alterar um componente decisivo. Preserve algum núcleo verdadeiro ou plausível, mas garanta que apenas uma alternativa seja integralmente correta.
- A explicação deve justificar a correta e apontar o erro conceitual de cada distrator.

## Escopo posterior

S6–S8 continuam visíveis, mas desativados até a definição de seus cronogramas. Não há produção planejada para S1–S4 nem para o internato.
