# AI workflow

Este projeto ainda tem um monolito grande em `src/App.jsx`. A regra principal para qualquer IA trabalhando aqui e melhorar por fatias pequenas, com build passando, sem refatorar varias areas ao mesmo tempo.

## Antes de mexer

1. Rode `git status --short` e preserve mudancas existentes.
2. Leia a area exata antes de editar. Use `rg` para achar chamadas e efeitos colaterais.
3. Se a mudanca tocar fluxo de questoes, leia tambem `QuestionView`, `QuestionCard`, `saveVqBlock`, `updateSubject` e os handlers de resposta.
4. Evite mover codigo grande sem uma razao objetiva.

## Ordem preferida de trabalho

1. Performance percebida em respostas e navegacao.
2. Persistencia Firestore mais granular.
3. Regras e seguranca.
4. Scripts de qualidade e testes.
5. Extracao de componentes e servicos.
6. Polimento visual.

## Como validar

Use pelo menos:

```bash
npm run check
```

O `check` roda smoke unitario, build e budget de bundle. Se o budget falhar, reduza peso ou ajuste o limite somente com justificativa no relatorio.

Quando houver servidor local rodando, use tambem:

```bash
UX_BASE_URL=http://127.0.0.1:3003/ npm run ux:smoke
```

Para seguranca de dependencias:

```bash
npm run audit:moderate
```

O audit deve passar limpo. Se voltar a falhar, trate como regressao de workflow e investigue antes de adicionar novas dependencias.

## Cuidados especificos

- Nao salve chaves sensiveis novas no cliente ou em Firestore.
- Nao adicione novas leituras amplas de `users`.
- Nao bloqueie o clique de responder questao esperando Firestore.
- Use `deferInteractionWork` para persistencias que podem esperar o primeiro frame.
- Para progresso da Biblioteca compartilhada, use `src/services/sharedLibraryProgress.js`; respostas devem salvar patch pequeno em `answers.{questionId}`, nao o documento inteiro.
- Para progresso da Biblioteca pessoal/Oraculo, use `src/services/libraryProgress.js` e `persistLibraryTopicProgressPatches`; respostas, favoritos, caderno de erros e revisao espacada nao devem regravar o documento grande do assunto.
- Para sincronizacao/listagem da Biblioteca compartilhada, use `src/hooks/useSharedLibrarySync.js`; nao recrie leituras `shared_library` diretamente no `App.jsx` e mantenha a leitura condicionada a `needsSharedLibraryData`.
- Para a Curadoria da Fábrica, use `src/services/questionMetadata.js`, `questionMetadataStore.js` e `features/question-factory/QuestionCurationView.jsx`. Não há subaba manual de Seleção: ao terminar os lotes de uma aula, a Curadoria calcula e publica automaticamente `learningSelection`. Preserve lotes retomáveis de até 30, cobertura separada por aula, assinatura do conjunto, exportação JSON de auditoria e `manualOverrides`; metadados nunca devem reescrever questões silenciosamente. A fila de aulas assistidas tem uma única ação coletiva, não um botão por aula. As leituras dos manifestos e da fila devem acontecer somente quando o admin clicar em **Atualizar metadados** ou **Atualizar prioridades**; não use `useEffect`, polling, listener nem atualização automática ao concluir a curadoria para repetir leituras de `metadata_chunks`, `user_devices` ou `videoaulas_progress`. A versão v2 deve manter notas máximas e papel `core` seletivos, evitar conceitos apenas incidentais, preferir uma cobertura diversa e não repetir clusters redundantes no núcleo. Qualquer mudança semântica de prompt precisa incrementar `QUESTION_METADATA_ANALYSIS_VERSION`. Mudanças apenas operacionais de tamanho de lote podem reutilizar o mapa conceitual, mas o loader deve ignorar documentos de lotes antigos que não pertençam ao manifesto atual.
- A Curadoria usa `executeGeminiRotation` por meio de `callWithRotation`. Ela deve receber de `collectLikelySiteGeminiKeys` o mesmo pool administrativo deduplicado da criação, manter `keyCursorRef` entre requests e nunca expor o valor de uma chave nos logs. Preserve callbacks de log, JSON nativo com `responseMimeType: 'application/json'`, `thinkingBudget: 0`, timeout de até 180 s, validação anterior à persistência, backoff curto, tentativa em todas as chaves do pool e segunda tentativa com chave única para erros transitórios. Uma falha esgotada deve pausar somente a aula atual e deixar a fila avançar; erro de publicação também não interrompe as demais. Pausar aguarda a requisição atual; parar preserva o lote validado que acabou de retornar.
- O fluxo de curso começa em `VideoaulasView`: concluir uma aula só libera questões individualmente para **Revisões** quando a respectiva seleção pedagógica estiver publicada. Aulas adicionadas já no fluxo progressivo recebem uma primeira exposição nas ondas 35% hoje, 30% amanhã, 20% no dia 4, 10% no dia 8 e 5% no dia 15; a soma por aula deve ser exata pelo método dos maiores restos. Priorize erros anteriores e depois ordene por tier, importância, qualidade, papel cognitivo, redundância e diversidade conceitual. A distribuição v9 deve evitar colocar questões irmãs novas na mesma onda sempre que houver vaga, usando nesta ordem `redundancyClusterId`/`canonicalQuestionId`, `primaryConceptId` e sobreposição de `conceptIds`; isso não altera os totais de cada onda. Nunca matricule retroativamente todo o backlog complementar de aulas antigas no mesmo dia: a recuperação v9 restaura o calendário gradual do núcleo legado e agenda todas as complementares/reservas inéditas entre amanhã e o 29º dia futuro com `legacy-backlog-balanced-v1`. O balanceamento considera a carga válida já prevista em cada dia, mantém questões melhores primeiro e separa irmãs; o gráfico de 30 dias deve, portanto, contabilizar o backlog completo. Preserve sempre FSRS, `lastReview`, `reps`, pausas e agendamentos manuais. Não anexe reforços ao fim da sessão por causa de um erro. Desativadas, `review_required`, `reviewEligible: false` e visuais não resolvidas não entram. Sem seleção publicada, não crie cartões novos; cartões legados ficam em `awaiting-curation`, com `dueDate: null` e fora da contagem. A UI deve continuar como fila global, sem sessões separadas por aula; `vq_review/{aulaId}` é somente a partição física. Depois da primeira resposta real, somente `essential` segue longitudinalmente: `services/fsrsScheduler.js` usa `ts-fsrs@5.4.1`, grava `fsrs` e aplica `nextDue`. Complementares e reservas passam a `completed-once`, sem novo vencimento; preserve seu resultado e qualquer histórico FSRS legado. Preserve `legacyFallback`, `parkedDueDate`, import dinâmico, `schedulerVersion`, `reps` e `lapses`; a reconciliação no carregamento é silenciosa. Inativação administrativa global usa `config/disabled_course_questions` e deve filtrar Fábrica, Questões do Curso, Revisões, sessões abertas e Favoritos sem apagar a fonte. A política compacta `agora-non-content-course-question-v1` bloqueia perguntas metadidáticas por texto depois de uma única confirmação administrativa, sem Gemini e sem registrar milhares de IDs; mantenha os padrões conservadores para não confundir finalidade de uma aula com finalidade clínica de exame, tratamento ou estrutura anatômica. Favoritos agrega biblioteca pessoal e `vq_blocks` do curso.
- O Plano de estudos é calculado por `useCourseHeroJourney` com helpers puros de `services/courseSchedule.js`. Preserve a ordem publicada dos módulos como padrão, o fallback estável por `courseIndex`, a resolução de matérias tolerante a acentos e o balanceamento pela duração das aulas. Ele pode operar por semanas ou pelos dias da semana escolhidos pelo usuário. A meta aceita semanas, horas por semana/dia de estudo ou uma data final; persista `courseScheduleCadence`, `courseScheduleStudyDays`, `courseScheduleGoalMode`, `courseScheduleEffortHours` e `courseScheduleEndDate` em `curso_prefs/main`, mantendo `courseScheduleWeeks` como valor manual e fallback. Na Ordem UFC, Preventiva é longitudinal e deve ser distribuída ao longo do plano. Trilhas temáticas apenas reordenam, com uma exceção intencional e explícita: Médico Bicho não inclui Preventiva. A coleção global `cronograma` é legado e não deve voltar a ser lida no carregamento do plano do aluno enquanto não participar do cálculo. Home e Portal devem continuar consumindo o mesmo resultado, inclusive pendências anteriores e a próxima aula.
- Revisões é parte do curso: condicione navegação, renderização, ações de adicionar à fila e carregamento/prefetch de `vq_review` a `canSeeVideoaulas`. Usuários de `siteOnlyEmails` devem permanecer na Home se um estado antigo tentar abrir `spaced-review`; preserve os dados existentes em vez de apagá-los.
- Em Questões do Curso, o banco completo continua acessível como fixação direta. Para aulas adicionadas já no fluxo progressivo, Revisões garante uma primeira passagem por toda questão curada e elegível nas cinco ondas; o backlog anterior ao rollout é distribuído integralmente pelos próximos 29 dias. A ordem pedagógica usa os metadados, e o FSRS só controla retornos depois da primeira resposta real de cada cartão.
- Na videoaula, assistir e ativar Revisões são ações separadas. O botão abaixo de **Marcar assistida** deve refletir `courseReviewLessonStates`: adicionar ativa a aula; pausar define `adaptiveState: 'paused'`, estaciona datas e preserva FSRS; retomar restaura os cartões; zerar remove o documento `vq_review` da aula sem apagar respostas do banco. Aulas zeradas não podem ser recriadas pela migração até uma nova adição explícita.
- Em `SpacedReviewView`, os controles 7/14/30 alteram apenas quantos dias do gráfico são mostrados. O FSRS continua calculando datas livres por cartão. Em 14 e 30 dias, os rótulos devem usar `dd/mm`, inclusive quando atravessarem o ano. Mantenha os botões de questões e flashcards no topo, a sessão em largura compatível com o conteúdo principal e estatísticas abaixo da ação. Preserve carga prevista, progresso e `dailyStats.reviewEvents`, mas não exponha adoção do FSRS, estado de migração nem o comparativo abstrato “antes/igual/depois”.
- Antes de alterar FSRS, seleção adaptativa ou ECG, leia `docs/LEARNING_ENGINE_ROADMAP.md`, `docs/ECG_PACK_AUDIT.md` e `docs/ECG_RIGHTS_DECLARATION.md`. O pacote original de ECG é a fonte canônica. A experiência principal é o curso prático em `EcgCaseBankView`: nunca revele o título/diagnóstico antes da ação do usuário; preserve raciocínio próprio, gabarito, acertei/rever, módulos e progresso. O catálogo é secundário. Não reintroduza como bloqueio a flag artificial de “revisão independente” nem crie editor manual paralelo.
- A associação de ECG às questões é derivada e versionada por `services/ecgQuestionMatcher.js`; leia `docs/ECG_QUESTION_MATCHING.md`. Preserve o carregamento dinâmico, o índice compacto sem gabarito, a precedência de `ecgAssetId`, o uso da resposta correta em vez dos distratores, a diversificação determinística e `awaiting-visual` para ambiguidades. Não persista a projeção no banco compartilhado nem reduza o limiar para aumentar cobertura artificialmente.
- Para revisão espaçada, use `src/services/reviewQueue.js`; o `App.jsx` deve atualizar estado/cache e delegar persistencia dos docs `vq_review` ao serviço.
- Para progresso do curso, use `src/services/courseProgress.js`; aulas assistidas e estatisticas diarias nao devem ser gravadas diretamente no `App.jsx`.
- Nao importe `src/agora_prompts.js` estaticamente em `App.jsx`; use o loader lazy existente para nao inflar o bundle inicial.
- Nao bloqueie a Home esperando dados pesados. Use o modelo em camadas: render inicial leve, depois `backgroundPrefetchStage` aquece Biblioteca pessoal, curso/revisao e questoes do curso em background.
- A Biblioteca pessoal nao deve forcar refresh remoto antes do primeiro respiro da Home. Use cache local na entrada e deixe `backgroundPrefetchStage`/`needsPersonalLibraryData` aquecer a colecao logo depois.
- Modais/fluxos raros devem sair do `App.jsx` como feature lazy quando possivel. Bizuario e preview de plano guiado ja estao em `src/features/` via `React.lazy`.
- A Fábrica de Questões (`shared-library`) é exclusiva do admin e não possui modo ou prévia de aluno. Use `homeCanSeeSharedLibrary` para esconder tela/nav e `needsSharedLibraryData` para permitir leitura Firestore apenas quando necessária. Não reintroduza alternância de audiência nessa tela.
- A area FAMED (`famed`) e um destino separado da Biblioteca e acompanha o acesso ao curso por `homeCanSeeFamed`. Preserve o recorte S5-S8/PPC 2018 e o foco inicial Cardio/Pneumo descritos em `docs/FAMED_CONTENT_WORKFLOW.md`. A criacao e a leitura reutilizam o fluxo e os componentes da Academia, mas persistem o assunto compartilhado em `famed_content`; nao crie um editor paralelo nem reintroduza importacao por ZIP, geracao externa em lote ou Firebase Storage.
- O atalho da FAMED para videoaulas do curso usa apenas o mapa curado de IDs em `features/famed/famedCourseLessonMap.js`. Não faça matching por termos nem procure correspondências em descrições. Preserve a ordem por `courseIndex`; o botão administrativo de exportação fornece o catálogo aplicado, sem transcrições e URLs, para revisar e versionar os vínculos.
- Para migrar Gemini com seguranca, siga `docs/GEMINI_BACKEND.md`. So configure `VITE_GEMINI_BACKEND_URL` quando houver backend publicado; no contrato atual isso presume chave do site no servidor. Se a decisao for manter chaves gratis por usuario, primeiro implemente proxy/cofre por usuario.
- O localhost usa as variaveis `VITE_FIREBASE_*` de `.env.local` quando esse arquivo existe. Se a Biblioteca passar a dar `permission-denied` para o admin, confira primeiro se `VITE_FIREBASE_PROJECT_ID` aponta para o projeto Firebase esperado.
- Nao misture redesenho visual com mudanca de persistencia no mesmo patch.
- Nao edite `dist/` manualmente. O build recria hashes; restaure ou remova residuos antes de finalizar.
- Prefira componentes pequenos e servicos puros quando extrair codigo de `App.jsx`.
- Configure `VITE_ADMIN_EMAIL` em deploys novos; o fallback existe apenas por compatibilidade.

## Padrao para respostas de questoes

O clique deve:

1. Atualizar a UI imediatamente.
2. Adiar persistencia pesada para depois do primeiro frame.
3. Salvar em background.
4. Fazer rollback visual apenas se a persistencia falhar.

Esse padrao evita que merges grandes, cache local e Firestore segurem o feedback da alternativa selecionada.
