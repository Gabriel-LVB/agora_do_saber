# Fábrica de Questões e motor adaptativo

> Decisões confirmadas em 30 de julho de 2026. Este documento separa o objetivo final das etapas seguras de implantação. Não trate itens futuros como funcionalidade já publicada.

## Objetivo

Transformar o banco de questões em um sistema de aprendizagem que:

- produz questões sem perder o conteúdo já existente;
- descreve cada questão por conceitos e metadados;
- seleciona o que realmente vale a pena estudar;
- agenda revisões adaptativas para questões do curso e dos materiais pessoais;
- incorpora 150 ECGs por importação em massa, com metadados fornecidos pelo administrador;
- mantém conteúdo global separado de respostas, histórico e estado cognitivo de cada aluno.

Ao ativar uma aula curada em Revisões, o sistema garante uma primeira passagem por toda
questão elegível, sem despejar o banco inteiro no mesmo dia. Produção e curadoria continuam
separadas: questões desativadas, inseguras ou sem visual obrigatório resolvido não entram.

## Decisões que não devem ser reinterpretadas

1. **Metadados são processados em lotes retomáveis de até 30.** A interface seleciona a matéria inteira e percorre suas aulas; cada aula e lote continua persistido separadamente. O lote maior reduz chamadas e contexto repetido, enquanto preserva retomada melhor do que enviar toda a aula de uma vez. Falha, pausa ou fechamento do navegador não deve descartar lotes concluídos.
2. **FSRS é infraestrutura comum.** Não é um experimento exclusivo de uma aula ou de um conjunto minúsculo “perfeito”. Toda questão com ID estável e elegível poderá entrar no mesmo motor: curso, Fábrica e materiais pessoais.
3. **A migração para FSRS é progressiva por cartão, não por usuário.** Questões de aulas ativadas pelo aluno entram numa fila individual gradual; depois da primeira resposta real, o FSRS passa a controlar a próxima data daquele cartão. O estado legado permanece como fallback.
4. **Não haverá editor manual de ECG nesta fase.** O administrador fornecerá os 150 arquivos e os metadados. A implementação correta será um importador validado e idempotente.
5. **IA sem fontes externas não faz verificação factual.** Gemini pode detectar sinais de ambiguidade e marcar `review_required`; não pode registrar uma questão como “verificada em diretriz” sem uma fonte real e rastreável.
6. **IDs e progresso são preservados.** Curadoria não regenera nem reescreve uma questão silenciosamente. Correções futuras precisam de versão, histórico e migração explícita quando afetarem a resposta correta.
7. **Uma ideia incerta não entra direto em produção.** Mudanças de alto impacto passam por prévia, modo sombra ou confirmação do usuário.

## Arquitetura da primeira etapa

### Conteúdo global

As questões continuam em:

```text
shared_library/{lessonId}
shared_library/{lessonId}/chunks/{chunkId}
```

Os metadados internos ficam separados:

```text
shared_library/{lessonId}/metadata_chunks/manifest
shared_library/{lessonId}/metadata_chunks/batch_000
shared_library/{lessonId}/metadata_chunks/batch_001
...
```

O manifesto contém assinatura do conjunto de questões, versão do analisador, conceitos da aula, total de lotes e progresso. Cada `batch_NNN` contém no máximo 30 questões. Essa subcoleção é somente administrativa. Ao mudar o particionamento, lotes excedentes antigos podem permanecer fisicamente no Firestore, mas a leitura deve aceitar somente documentos compatíveis com a versão, assinatura e `batchCount` do manifesto atual.

A fila de Curadoria não é fail-fast por matéria. Cada request registra tentativa e chave, valida JSON e cobertura exata dos IDs antes de persistir e rotaciona automaticamente em erros recuperáveis. Se todas as tentativas de uma aula falharem, o manifesto fica `paused`, os lotes anteriores permanecem salvos e a fila segue para a aula seguinte. A interface possui pausar, continuar, parar, log cronológico e resumo de publicadas/pendentes/não iniciadas.

### Metadados por questão

O contrato inicial inclui:

```js
{
  metadataVersion,
  analysisVersion,
  questionId,
  conceptIds,
  primaryConceptId,
  importance,          // 1..5
  difficulty,          // 1..5
  cognitiveLevel,      // recognition | understanding | application | reasoning
  learningRole,        // core | reinforcement | variation | exam_only
  clinicalDepth,       // none | contextualized | integrated
  longevity,           // evergreen | guideline_sensitive | course_specific
  redundancyClusterId,
  redundancyScore,     // 0..1
  canonicalQuestionId,
  qualityScore,        // 0..100
  factualConfidence,   // high | medium | review_required
  reviewEligible,
  needsVisual,
  visualType,          // ecg | other | null
  ecgAssetId,
  status,              // active | reserve | deprecated | review_required
  rationale,
  manualOverrides
}
```

`manualOverrides` sempre vence uma nova análise automática. O analisador só pode usar IDs de conceito do mapa da aula.

### Seleção automática dentro da Curadoria

A seleção é determinística e explicável. Ela:

- usa o mesmo recorte da Curadoria: matéria inteira ou aula específica;
- quando a matéria inteira é escolhida, calcula a cobertura de cada aula separadamente antes de reunir os resultados;

- cobre primeiro conceitos importantes;
- favorece papel essencial, qualidade, aplicação e raciocínio;
- penaliza redundância e cópias não canônicas;
- separa essenciais, complementares, reserva e desativadas;
- nunca usa questão `deprecated` ou `review_required` como essencial;
- não impõe um total arbitrário igual para todas as aulas.

Não existe uma segunda aba para revisar milhares de decisões manualmente. Quando a análise de uma aula termina, a Curadoria calcula a seleção e publica automaticamente um snapshot compacto no próprio item `shared_library`; lotes e justificativas completos continuam privados em `metadata_chunks`. A exportação `agora-question-curation-audit-v1` permite auditar uma aula real e iterar o prompt antes do processamento em massa.

A primeira auditoria real mostrou inflação de notas máximas, uso excessivo de `core` e um núcleo maior que o desejado. A calibração v2 passou a reservar extremos para casos realmente discriminantes, exigir conceitos diretamente cobrados, comparar redundância dentro do lote e selecionar um núcleo diverso por conceito e cluster. Manifestos v1 não são tratados como curadoria atual: a aula precisa ser reprocessada para publicar o snapshot v2.

### Dimensionamento do banco antes de mudanças destrutivas

A Fábrica possui um diagnóstico manual, local e somente de leitura para estimar a redução do banco antes de alterar a fila ou excluir conteúdo. Ele cobre:

- inventário total, diretas, clínicas, aulas e cobertura válida da curadoria;
- tiers, importância, qualidade, papel de aprendizagem, nível cognitivo e status;
- núcleo forte atual para revisão longitudinal, definido pelo tier `essential` elegível;
- corte conservador por metadados, cenário amplo de reserva/desativadas e as uniões sem dupla contagem;
- duplicatas textuais prováveis por matéria, agrupadas para contar somente as questões excedentes depois de preservar a melhor representante;
- totais equivalentes por matéria, sem expor enunciados.

O diagnóstico não lê a subcoleção privada de metadados: usa apenas o snapshot publicado quando sua versão e assinatura ainda correspondem às questões. O conteúdo sem curadoria válida permanece visível como pendente e participa da similaridade, mas não recebe uma classificação artificial. A varredura começa apenas por ação do administrador e roda fora da thread da interface.

Depois de conferir o retrato, o administrador pode confirmar a inativação do cenário amplo parcial. A ação não cria uma regra futura: ela materializa somente os IDs atualmente candidatos, ignora os já inativos e preserva as fontes. Cada execução é atômica e auditável em documentos irmãos de até 250 entradas sob `config/disabled_course_questions__batch__*`, marcados com `configType: 'disabled-course-question-batch'`, evitando o limite de tamanho do documento pai e reutilizando a autorização já publicada para `config`. O runtime combina as entradas manuais/políticas da raiz com os lotes, deduplica e indexa a consulta. O próximo retrato retira essas questões do banco ativo e as informa como já inativas. Não há exclusão física.

### Uso adaptativo da seleção, implementado

- essenciais e questões de maior importância/qualidade ocupam as primeiras ondas das aulas ativadas;
- questões irmãs são distribuídas entre ondas diferentes sempre que houver vaga: clusters redundantes e relações canônicas têm precedência, seguidos por conceito principal e conceitos compartilhados;
- questões já erradas entram como remediação prioritária mesmo quando são complementares ou reserva;
- toda complementar e reserva elegível recebe uma primeira data nas ondas 35/30/20/10/5;
- erros não anexam nem antecipam novas questões no fim da sessão; as ondas permanecem estáveis;
- depois da primeira resposta, somente essenciais continuam longitudinalmente pelo FSRS;
- complementares e reservas passam a `completed-once`, preservam o resultado e deixam de contar como vencimento futuro;
- `disabled`, `deprecated`, `review_required` e `reviewEligible: false` não entram;
- sem seleção publicada, a aula não cria cartões novos e cartões legados aguardam curadoria sem vencimento nem obrigação;
- FSRS continua responsável pela próxima data das essenciais somente depois da primeira resposta real.

O aluno pode usar o banco completo da aula como fixação direta. Nas aulas adicionadas já
no fluxo progressivo, todas as questões curadas e elegíveis aparecem ao menos uma vez em
Revisões, em ordem pedagógica e divididas nas cinco ondas. O backlog legado é reintroduzido
integralmente entre amanhã e o 29º dia futuro. Essa primeira exposição não é uma repetição FSRS: somente essenciais
passam a ter retornos longitudinais governados por `nextDue`.

## FSRS: escopo e implantação

O motor será um serviço comum e não ficará acoplado a `SpacedReviewView`.

### Recorte de experiência já implementado

- a interface pública chama a antiga Revisão espaçada de **Revisões**, mantendo `view === 'spaced-review'` por compatibilidade;
- a tela da videoaula separa **Marcar assistida** de **Adicionar à Revisão**; sem curadoria, o segundo controle permanece desabilitado;
- uma aula ativa pode ser pausada sem perder histórico/FSRS e retomada depois, ou zerada para apagar somente sua fila de revisão até uma nova adição explícita;
- toda questão de aula adicionada no fluxo progressivo passa a ser elegível individualmente; o plano distribui a entrada ao longo dos dias em vez de exigir refazer uma aula inteira;
- a migração lê as respostas atuais e o caderno de erros: erros anteriores têm prioridade; entre as demais, os metadados ordenam importância, qualidade, papel cognitivo, redundância e diversidade conceitual;
- a fila diária mistura aulas e matérias. A separação por aula existe apenas nos documentos do Firestore, para evitar documentos gigantes;
- novas entradas recebem `cardKey`, `schedulerVersion`, `state`, `reps`, `lapses`, `addedAt` e `lastReview` por `services/reviewScheduler.js`;
- a Home prioriza revisões vencidas antes do próximo passo do curso;
- questões ainda não apresentadas usam o plano gradual somente para definir sua primeira aparição;
- depois da primeira resposta real, o pacote oficial `ts-fsrs@5.4.1` grava `fsrs` e seu `nextDue` passa a controlar a fila;
- o cálculo legado continua salvo em `legacyFallback`, permitindo comparação e reversão;
- a comparação acumulada entre as duas datas aparece para admin na tela de Revisões;
- a biblioteca FSRS fica em chunks lazy próprios e só é baixada na primeira resposta de revisão.

### FSRS ativo por cartão

O serviço `services/fsrsScheduler.js` usa FSRS-6 com perfil versionado
`ts-fsrs-5.4.1-fsrs6-active-v1`:

```js
{
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzz: false,
  enable_short_term: false
}
```

A interface atual registra apenas resultado binário. Por isso, durante esta etapa,
erro é mapeado para `Again` e acerto para `Good`; `Hard` e `Easy` só devem entrar
quando a UX permitir que o estudante dê essa informação explicitamente.

Cada item mantém um fallback legado e acrescenta `fsrs`, com cartão
serializado, último log, versão, próxima data calculada e métricas acumuladas de
comparação. Datas são timestamps para permanecerem compatíveis com o Firestore.
Uma falha ao carregar ou calcular FSRS não bloqueia a resposta nem o agendamento
legado.

Não foi inventado histórico retroativo. Para cartões existentes, a primeira
resposta observada cria o baseline `first-observed-review`; as respostas seguintes
evoluem o mesmo cartão FSRS. Essa escolha é conservadora e reversível: `legacyFallback`
mantém a data, o intervalo e a versão que o motor anterior teria produzido.

### Entrada das aulas já assistidas

`services/reviewMigration.js` varre somente as aulas marcadas como assistidas e
classifica cada questão disponível:

- `wrong`: resposta atual errada ou questão presente no caderno de erros;
- `unseen`: questão ainda não respondida;
- `correct`: resposta atual correta e sem erro anterior registrado.

A introdução ativa é calculada separadamente para cada aula: 35% das questões elegíveis
no dia da ativação, 30% no dia seguinte, 20% no quarto dia, 10% no oitavo e 5% no décimo
quinto. Arredondamentos usam maiores restos e sempre somam exatamente o total elegível.
Não há cota global oculta por errada/inédita/acertada. Aulas ainda não selecionadas não
criam cartões novos; registros legados ficam em `awaiting-curation`, com `dueDate: null`.
A versão `curated-progressive-essential-fsrs-v9` distribui todas as complementares e reservas
inéditas do backlog legado pelos 29 dias futuros usando `legacy-backlog-balanced-v1`; nenhuma
entra hoje, e todas aparecem no horizonte de 30 dias. A capacidade diária é calculada para
equilibrar a carga já agendada, sem um limite que descarte cartões. Se já foram respondidas ou têm FSRS legado, passam a
`completed-once`: o histórico é preservado, mas o vencimento é retirado. Novos cartões de
aulas adicionadas no fluxo progressivo são distribuídos entre as ondas usando
`redundancyClusterId`, `canonicalQuestionId`, `primaryConceptId` e sobreposição de
`conceptIds`. A v9 corrige tanto o replanejamento coletivo da v6 quanto a reconstrução
superatrasada da v7: o núcleo legado inédito volta à distribuição diária anterior, enquanto
o complemento recebe datas futuras balanceadas. Cartões com revisão real, FSRS ou agendamento manual mantêm suas datas.
Ativações antigas de reforço voltam à onda original. Novas aulas
e questões publicadas são incorporadas de forma
incremental; `cardKey` impede duplicatas. A classificação histórica prioriza a ordem,
mas não inventa avaliações antigas. Questões bloqueadas pela curadoria ou pelo requisito
visual permanecem fora da carga.

### Estatísticas úteis da fila

A tela de Revisões não exibe mais a diferença abstrata entre a data FSRS e a data
legada. Ela mostra:

- concluídas e restantes hoje, progresso percentual e acurácia registrada;
- atrasadas incluídas explicitamente na carga atual;
- total previsto para os próximos sete dias e total no plano;
- gráfico diário de próximos vencimentos, separando inéditas de revisões;
- distribuição entre inéditas e revisões nos próximos dias.

Os seletores 7, 14 e 30 dias alteram somente o horizonte visual do gráfico. Eles
jamais representam intervalos fixos de agendamento. A previsão contém apenas o
próximo vencimento conhecido de cada cartão e muda em tempo real conforme o FSRS
processa novas respostas. Resultados diários de revisão passam a ser registrados em
`daily_stats/{date}.reviewEvents` para sustentar estatísticas históricas futuras.

### Inativação administrativa global

Questões problemáticas do curso podem ser inativadas pelo administrador diretamente no
cartão. `config/disabled_course_questions` guarda a combinação de `questionId` com aliases
da aula e do item compartilhado; o conteúdo original não é apagado. O bloqueio filtra a
Fábrica, Questões do Curso, Favoritos, sessões abertas e cartões antigos em `vq_review`,
inclusive em cópias já persistidas nos usuários. Favoritos do curso são lidos de
`vq_blocks` e aparecem junto dos favoritos pessoais para que uma questão marcada possa
ser reencontrada depois do recarregamento antes de ser inativada.

O mesmo documento pode conter a política compacta `agora-non-content-course-question-v1`.
Ela é ativada uma única vez pelo admin, após o site contar e pedir confirmação, e bloqueia
por padrões textuais conservadores perguntas sobre a importância de estudar o tema,
objetivo/finalidade da aula e aprendizado esperado. Isso evita uma entrada por questão,
não consome requests do Gemini e também protege contra novas questões com esses padrões.
Finalidades médicas reais — de um exame, procedimento, fármaco ou estrutura — não devem
ser confundidas com metacomentários sobre a aula. Os prompts de sumário e geração também
ignoram apresentação, agenda, motivação, comentários do professor e encerramento.

### Identidade

Cada cartão adaptativo precisa de uma chave global estável:

```text
sourceType/sourceContainerId/questionId
```

Exemplos:

```text
course/aula_123/q_8
shared/lesson_123/direct_4
personal/subject_9/topic_2/q_17
```

Uma questão não deve perder o histórico porque mudou de tela ou de bloco visual.

### Estado por aluno e questão

O estado futuro deve registrar, no mínimo:

```js
{
  cardKey,
  state,
  due,
  stability,
  difficulty,
  elapsedDays,
  scheduledDays,
  reps,
  lapses,
  lastReview,
  schedulerVersion,
  source
}
```

O histórico de resposta e o estado do agendador são pessoais. Metadados e parâmetros globais são conteúdo administrativo.

### Ordem segura

1. Definir `cardKey` e adaptadores para curso, Fábrica e materiais pessoais. **Iniciado na fila atual.**
2. Adicionar testes vetoriais do agendador escolhido. **Implementado para a integração atual.**
3. Preservar o estado legado e criar baseline FSRS somente na primeira resposta observada. **Implementado.**
4. Calcular os dois modelos e guardar fallback/comparação. **Implementado.**
5. Usar FSRS para a próxima data após cada resposta real. **Implementado.**
6. Coletar histórico suficiente para futuramente personalizar parâmetros por população ou usuário.
7. Substituir o ciclo rígido do curso pelo Plano de estudos semanal e liberar questões pela seleção publicada. **Implementado.**

Ao implementar, preferir a biblioteca TypeScript/JavaScript oficial do ecossistema FSRS, fixar versão e registrar `schedulerVersion`. Não criar uma imitação “parecida com FSRS”.

## ECG: importação e associação automática

Os 150 casos próprios foram recebidos e importados. O pacote contém:

- um arquivo de manifesto JSON ou CSV;
- um identificador imutável por ECG;
- caminho/nome exato do arquivo;
- diagnóstico e achados;
- dificuldade, conceitos e tags;
- proveniência e licença de uso;
- texto alternativo;
- uma ontologia e uma matriz estruturada caso–conceito.

O importador deverá:

- validar esquema, extensões, duplicatas, arquivos ausentes e hashes;
- gerar uma prévia de erros antes de gravar;
- ser idempotente;
- importar em lotes;
- produzir relatório final;
- gerar um índice compacto e versionado somente com a imagem principal da fase de pergunta;
- associar automaticamente somente quando a resposta correta ou esperada sustentar um conceito da ontologia com confiança suficiente;
- estacionar questões ambíguas em `awaiting-visual`, fora da fila e da contagem, em vez de anexar um ECG por semelhança vaga.

A Fábrica pode marcar `needsVisual: true` e `visualType: 'ecg'`. Um `ecgAssetId` explícito tem precedência, mas não é necessário: `services/ecgQuestionMatcher.js` usa o índice `public/ecg/v3/question-match-index.json` e preenche `question.images` de forma determinística. Consulte `docs/ECG_QUESTION_MATCHING.md`.

## Segurança

- `lessons`, `cronograma`, `shared_library` e `famed_content` exigem acesso ao curso, além de autenticação.
- `metadata_chunks` é somente admin.
- UI escondida não substitui regra Firestore.
- O documento atual de whitelist ainda expõe a lista completa a um membro que precisa comprovar o próprio acesso. Uma etapa futura deve migrar essa decisão para custom claims ou documentos por UID para minimizar essa exposição.
- Nenhuma chave Gemini nova deve ser gravada nos metadados.

## Fases de entrega

### Fase A — fundação, implementada

- nome e navegação da Fábrica de Questões;
- metadados retomáveis em lotes de até 30;
- mapa conceitual por aula;
- seleção determinística integrada à Curadoria;
- preservação de sobrescritas manuais no contrato;
- regras Firestore para metadados e acesso ao curso;
- testes de lote, normalização, seleção e regras.

### Fase B — operação de curadoria, em andamento

- editor de `manualOverrides`;
- visão agregada por matéria e fila de `review_required`;
- comparação de versões do analisador;
- publicação automática da seleção ao concluir cada aula; **implementada**
- exportação de auditoria por aula para calibração iterativa; **implementada**
- mesmo pool administrativo rotativo da criação, JSON nativo e execução sem thinking; **implementada**
- trilha de auditoria de alterações.

### Fase C — FSRS individual ativo, implementada

- serviço oficial versionado, IDs estáveis e adaptador da fila atual;
- reconciliação automática das aulas já ativadas com seleção publicada, sem matricular coletivamente o backlog legado;
- fila global por questão, com primeira exposição nas ondas 35/30/20/10/5 e prioridade orientada pelos metadados;
- FSRS controlando a próxima data das essenciais depois da resposta real;
- fallback e comparação acumulada com o motor anterior;
- ampliar a telemetria para carga diária, retenção e exportação de eventos;
- conectar progressivamente todas as origens elegíveis sem perder identidade;
- nenhuma remoção destrutiva do estado legado.

### Fase D — personalização e telemetria FSRS

- registrar eventos completos de revisão para análise longitudinal;
- medir retenção real e carga diária;
- avaliar parâmetros personalizados quando houver histórico suficiente;
- ampliar o mesmo contrato para materiais pessoais e ECG;
- manter rollback e reprocessamento versionado.

### Fase E — banco de ECG e questões, implementada parcialmente

- arquivos, casos e metadados importados em lotes de 15; **implementado**
- curso prático e catálogo secundário, sem tela de digitação manual; **implementado**
- índice compacto derivado da ontologia e associação automática nas questões do curso; **implementado**
- bloqueio seguro de questões visuais sem correspondência confiável; **implementado**
- sincronização multi-dispositivo e integração do progresso do curso prático ao FSRS; pendentes.

O responsável confirmou que o material é próprio, autorizado e pode usar URLs públicas. O pacote original contém 150 casos clínicos e respostas completas. A aba Banco de ECG funciona primeiro como curso prático: módulos por família, um caso por vez, diagnóstico oculto antes do gabarito, comparação do raciocínio e marcação acertei/rever. O catálogo é secundário. O progresso inicial usa `agora_ecg_practical_progress_v1` no armazenamento local; uma futura integração multi-dispositivo deve migrá-lo explicitamente. A associação automática às questões já está ativa e não equivale a integrar o progresso desse curso prático ao FSRS.

## Critérios para pausar e confirmar

Peça confirmação antes de:

- remover ou substituir o ciclo atual;
- mudar respostas corretas em massa;
- reduzir o limiar do matching de ECG, adotar correspondência vaga ou passar a usar distratores como evidência;
- apagar questões redundantes em vez de reservá-las;
- instalar uma dependência de agendamento sem avaliar licença, bundle, manutenção e migração;
- executar migração irreversível de dados.
