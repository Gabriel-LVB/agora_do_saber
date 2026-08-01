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

O sistema não deve obrigar o aluno a responder toda questão gerada. Produção e seleção são etapas diferentes.

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

### Uso adaptativo da seleção, implementado

- essenciais formam o núcleo automático das aulas ativadas;
- questões já erradas entram como remediação mesmo quando são complementares ou reserva;
- complementares e reserva ainda não necessárias ficam persistidas como adormecidas, sem vencimento e sem contar como carga;
- um erro libera no máximo um reforço da mesma aula que compartilhe conceito, favorecendo complementar antes de reserva;
- o reforço liberado entra uma única vez no fim da sessão já aberta da mesma modalidade, sem exigir sair e entrar novamente;
- `disabled`, `deprecated`, `review_required` e `reviewEligible: false` não entram;
- sem seleção publicada, a aula não cria cartões novos e cartões legados aguardam curadoria sem vencimento nem obrigação;
- FSRS continua responsável pela próxima data somente depois da primeira resposta real do cartão ativo.

O aluno pode usar o banco completo da aula como fixação inicial. A rotina longitudinal
não exige que ele revise tudo: essenciais e erros entram, enquanto complementares e
reservas acertadas ficam fora até surgir evidência de dificuldade no mesmo conceito.
Se o banco inicial não for concluído, essenciais inéditas ainda podem entrar gradualmente.

## FSRS: escopo e implantação

O motor será um serviço comum e não ficará acoplado a `SpacedReviewView`.

### Recorte de experiência já implementado

- a interface pública chama a antiga Revisão espaçada de **Revisões**, mantendo `view === 'spaced-review'` por compatibilidade;
- a tela da videoaula separa **Marcar assistida** de **Adicionar à Revisão**; sem curadoria, o segundo controle permanece desabilitado;
- uma aula ativa pode ser pausada sem perder histórico/FSRS e retomada depois, ou zerada para apagar somente sua fila de revisão até uma nova adição explícita;
- toda questão de aula ativada passa a ser elegível individualmente; o plano distribui a entrada ao longo dos dias em vez de exigir refazer uma aula inteira;
- a migração lê as respostas atuais e o caderno de erros: erros anteriores têm prioridade, inéditas começam aos poucos e acertadas entram em menor volume a partir do dia seguinte;
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

A introdução ativa distribui por dia até 8 erradas, 10 inéditas e 6 acertadas. Somente
com seleção publicada esses limites se aplicam ao núcleo essencial e às remediações;
complementares e reservas sem evidência de necessidade permanecem adormecidas e não
contam como carga. Aulas ainda não selecionadas não criam cartões novos; registros
legados ficam em `awaiting-curation`, com `dueDate: null`. A publicação posterior restaura apenas cartões elegíveis e preserva
datas estacionadas em `parkedDueDate`. Novas aulas ativadas e novas questões publicadas
são incorporadas de forma incremental; `cardKey` impede duplicatas. A classificação histórica é usada
para priorizar a primeira aparição, mas não inventa datas ou avaliações antigas que o
site nunca registrou.

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
- reconciliação automática das aulas já ativadas com seleção publicada, sem importar o banco inteiro;
- fila global por questão, com entrada gradual baseada em erro/inédita/acerto;
- FSRS controlando a próxima data depois da resposta real;
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
