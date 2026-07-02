# Relatorio de melhorias do Agora do Saber

Data da auditoria: 2026-07-01

## Resumo executivo

O site tem bons sinais de produto vivo: muitas funcoes, fluxo de estudo, curso, revisao, biblioteca, flashcards, exportacoes e automacoes. O problema principal e que ele cresceu quase inteiro dentro de um unico arquivo (`src/App.jsx`) e mistura UI, regras de negocio, persistencia, chamadas de IA, cache, navegacao, estilos globais e administracao no mesmo lugar.

Isso gera tres sintomas que batem com a percepcao atual:

1. Lentidao e delay em interacoes simples, especialmente respostas de questoes.
2. Sensacao visual irregular, porque o design system e aplicado por classes soltas e um grande bloco de CSS injetado no componente.
3. Risco de seguranca/manutencao, porque chaves e regras sensiveis ficam muito perto do cliente e a estrutura de dados depende demais de documentos grandes.

Minha recomendacao: nao tentar "embelezar tudo" de uma vez. Primeiro precisamos estabilizar arquitetura, performance e seguranca. Depois o polimento visual vai render muito mais.

## Evidencias encontradas

### Build e tamanho

- `src/App.jsx` tem 23.654 linhas e 1,4 MB.
- `src/agora_prompts.js` tem 108 KB.
- O build gerou `dist/assets/index...js` com 953,75 KiB minificado, 251,63 KiB gzip.
- O Vite avisou que alguns chunks passam de 500 KiB.
- O Babel avisou que desotimizou `src/App.jsx` por exceder 500 KB.

Impacto: o usuario baixa, parseia e executa muito codigo antes de usar uma tela especifica. O app tambem tende a rerenderizar muito quando qualquer estado global muda.

### Dependencias e workflow

- Stack ainda tem React 17 e Tailwind 2, mas o toolchain de build foi modernizado para Vite 8 e `@vitejs/plugin-react` 5.
- Antes das correcoes, `npm audit --audit-level=moderate` encontrou 22 vulnerabilidades: 3 criticas, 10 altas, 8 moderadas e 1 baixa. Depois de remover dependencias mortas, rodar `npm audit fix` e migrar Vite/plugin React, o audit ficou em 0 vulnerabilidades.
- Workflow do GitHub usa `npm install` em vez de `npm ci`.
- Workflow usa actions antigas (`actions/checkout@v2`) e deploy action antiga.
- Nao ha scripts formais de lint, typecheck, testes unitarios ou preflight completo no `package.json`.

Impacto: uma IA mexendo no projeto sem guardrails pode melhorar uma tela e quebrar outra sem perceber. O build passa, mas isso nao garante qualidade.

### Banco de dados e delay nas respostas

O delay ao responder questoes parece vir principalmente da persistencia.

Exemplo do curso:

- `handleVqAnswer` monta um objeto grande com a aula/blocos/respostas e chama `saveVqBlock`.
- `saveVqBlock` atualiza estado global, salva cache local, depois faz `getDoc` para merge e `setDoc` do documento do bloco inteiro.
- Esse padrao acontece para respostas, favoritos, caderno de erros e progresso.

Impacto: uma acao pequena vira leitura remota + merge + escrita de documento grande + rerender global. Mesmo com estado otimista, isso aumenta latencia percebida e custo no Firestore.

Recomendacao tecnica:

- Separar respostas de conteudo gerado.
- Salvar respostas em documentos pequenos por usuario/bloco ou por questao.
- Usar `updateDoc` com paths especificos quando possivel.
- Enfileirar escrita em background sem bloquear a UI.
- Manter cache local, mas com uma camada unica de persistencia, nao espalhada no componente.

### Seguranca

Pontos criticos:

- Config Firebase esta hardcoded em `src/App.jsx`.
- A chamada ao Gemini e feita diretamente do navegador usando `x-goog-api-key`.
- Chaves Gemini aparecem em `settings`, `apiKey`, backups e documentos de usuario.
- Codigo admin coleta chaves de usuarios via leitura de `users`.
- Nao encontrei `firestore.rules`, `firebase.json` ou arquivo de indexes no repo.
- Existe `.env.local` local, mas ele nao esta versionado. O problema maior e o app ainda ter config hardcoded e chaves de IA persistidas no cliente/Firestore.

Observacao: a apiKey do Firebase em cliente nao e segredo por si so, mas sem regras fortes de Firestore ela nao protege dados. O risco real esta nas regras ausentes do repo, nas chaves Gemini no cliente e nas leituras administrativas amplas.

Recomendacao tecnica:

- Criar `firestore.rules` versionado e testavel.
- Mover Gemini para Cloud Functions/Cloud Run ou API backend.
- Nunca salvar chaves de usuarios em texto puro no Firestore.
- Usar custom claims para admin em vez de confiar so em email hardcoded no cliente.
- Revisar todas as leituras de colecao `users`.
- Criar App Check, rate limit e auditoria de operacoes admin.

### UI e visual profissional

O visual atual nao esta condenado, mas esta dificil de manter:

- Ha classes Tailwind enormes e repetidas.
- Existe um grande bloco `<style>` dentro do render principal.
- Muitas telas usam `rounded-2xl`, sombras, bordas e menus de forma inconsistente.
- Ha muitas transicoes globais e `transition-all`, que podem causar custo visual e comportamento irregular.
- O app tenta corrigir mobile com muitos overrides, em vez de ter componentes responsivos pequenos e previsiveis.

Recomendacao:

- Definir um design system enxuto: tokens de cor, raio, espacamento, tipografia, botoes, cards, modais, listas, nav.
- Criar componentes base: `Button`, `IconButton`, `Card`, `Modal`, `Tabs`, `SegmentedControl`, `QuestionOption`, `PageShell`.
- Remover CSS global injetado gradualmente e migrar para classes/componentes.
- Reduzir animacoes a microinteracoes realmente uteis.
- Usar `prefers-reduced-motion` e evitar animar layout/height/margins.

### Arquitetura

O arquivo principal concentra responsabilidades demais:

- Auth.
- Whitelist/acesso.
- Firestore.
- IA/Gemini.
- Biblioteca.
- Curso.
- Revisao espacada.
- UI completa.
- Estilos globais.
- Exportacoes.
- Admin.

Recomendacao de modularizacao:

- `src/app/` para shell, rotas/views e providers.
- `src/features/questions/` para QuestionView, QuestionCard, respostas e revisao.
- `src/features/course/` para videoaulas, vq_blocks, jornada e progresso.
- `src/features/library/` para biblioteca pessoal/compartilhada.
- `src/features/ai/` para cliente de IA e prompts.
- `src/services/firebase/` para db/auth/persistencia.
- `src/design-system/` para componentes visuais.

Meta: reduzir `App.jsx` para orquestracao, nao para conter o produto inteiro.

## Plano recomendado

### Fase 1 - Estabilizar e ganhar velocidade perceptivel

Objetivo: melhorar o que o usuario sente sem reescrever tudo.

- Criar uma camada `services/firestoreProgress` para salvar respostas/favoritos/caderno.
- Trocar escrita de documento inteiro por updates pequenos onde for seguro.
- Fazer resposta de questao ser 100% otimista: UI responde imediatamente e escrita roda em background.
- Debounce/batch de estatisticas diarias e progresso.
- Memoizar `QuestionCard` e dividir `QuestionView`.
- Evitar recomputar listas grandes em todo render.
- Remover `transition-all` de componentes de questao e listas longas.
- Criar script `npm run check` com build + ux smoke + audit leve.

Resultado esperado: responder questao deve parecer instantaneo; menos travadas em celular; menos custo Firestore.

### Fase 2 - Seguranca minima de produto real

Objetivo: fechar os maiores riscos antes de escalar usuarios.

- Versionar `firebase.json`, `firestore.rules` e indexes.
- Criar regras por colecao: usuario so acessa seus dados; admin por custom claim; leitura publica minima.
- Tirar chamadas Gemini do cliente e mover para backend.
- Remover armazenamento de chaves Gemini em Firestore.
- Adicionar App Check.
- Adicionar logs admin mais controlados.
- Revisar colecoes globais (`users`, `shared_library`, `config`, `lessons`, `access_logs`, `user_devices`).

Resultado esperado: produto mais dificil de abusar, auditar e vazar dados/chaves.

### Fase 3 - Modernizar stack e workflow para IA mexer com seguranca

Objetivo: fazer o projeto aguentar manutencao por IA.

- Atualizar React/Tailwind com etapas pequenas.
- Trocar `npm install` por `npm ci` no CI.
- Atualizar GitHub Actions.
- Adicionar ESLint e Prettier com regras simples.
- Adicionar testes unitarios para parsers, merge de progresso e regras de acesso.
- Adicionar testes Playwright dos fluxos principais:
  - login bloqueado/autorizado;
  - responder questao;
  - gerar/salvar bloco;
  - mobile sem overflow;
  - navegacao voltar;
  - caderno de erros/revisao.
- Criar `docs/AI_WORKFLOW.md` com instrucoes para futuras IAs: onde mexer, como testar, o que nao tocar.

Resultado esperado: cada alteracao futura fica menos arriscada.

### Fase 4 - Refatorar produto por dominios

Objetivo: quebrar o monolito sem parar desenvolvimento.

Ordem segura:

1. Extrair clientes e helpers puros.
2. Extrair componentes de questoes.
3. Extrair curso/videoaulas.
4. Extrair biblioteca.
5. Extrair admin/config.
6. Transformar `App.jsx` em shell.

Regra: cada extracao deve ter build e smoke test passando.

Resultado esperado: menos bugs cruzados, mais facilidade de design e performance.

### Fase 5 - Polimento visual de site profissional

Objetivo: deixar o produto bonito, consistente e confiavel.

- Redesenhar home como dashboard real, nao vitrine.
- Criar navegacao desktop/mobile consistente.
- Padronizar cards, toolbars, modais e estados vazios.
- Melhorar densidade em desktop e toque em mobile.
- Revisar tipografia e hierarquia visual.
- Reduzir bordas/sombras e usar contraste com intencao.
- Criar tela de questoes como experiencia principal: foco, velocidade, leitura, feedback.
- Criar loading states de IA mais honestos e com progresso real.

Resultado esperado: menos cara de prototipo, mais cara de plataforma educacional premium.

## Prioridades imediatas

Se eu fosse continuar agora, eu atacaria nesta ordem:

1. Corrigir delay de respostas do curso (`handleVqAnswer` + `saveVqBlock`).
2. Criar scripts de qualidade (`check`, `audit`, `ux:smoke`) e atualizar CI para `npm ci`.
3. Criar `docs/AI_WORKFLOW.md`.
4. Criar `firestore.rules` inicial e mapear colecoes.
5. Extrair `QuestionView` e `QuestionCard` para arquivos separados.
6. Extrair `firebaseConfig` para config de ambiente.
7. Iniciar backend para Gemini.
8. Fazer primeira passada visual nos componentes base.

## Progresso iniciado

Implementado nesta primeira rodada:

- Respostas de questoes agora adiam persistencia pesada para depois do primeiro frame, preservando feedback visual imediato e rollback em erro.
- Scripts `check`, `test:preflight` e `audit:moderate` adicionados ao `package.json`.
- CI atualizado para Node 20, `npm ci` e actions mais recentes.
- Guia `docs/AI_WORKFLOW.md` criado para futuras IAs trabalharem em fatias pequenas.
- `firebase.json` e `firestore.rules` iniciais criados com base owner/admin e deny-by-default.
- Configuracao Firebase extraida para `src/config/environment.js` e `src/services/firebase.js`, com `.env.example`.
- Cliente Gemini extraido para `src/services/gemini.js`, preparando a futura migracao para backend.
- Interacoes frequentes de `vq_blocks` no curso (responder, favoritar e caderno) passaram a usar escrita parcial com rollback, evitando `getDoc` remoto e `setDoc` do documento inteiro nesses cliques.
- Escrita parcial de `vq_blocks` movida para `src/services/vqBlocks.js` e sanitizacao Firestore para `src/lib/firestoreData.js`.
- Primeiro teste unitario leve criado em `scripts/unit-smoke.mjs`; `npm run check` agora roda teste unitario e build.
- O smoke unitario cobre sanitizacao Firestore e uma verificacao estatica minima de `firebase.json`/`firestore.rules`.
- Email admin parametrizado via `VITE_ADMIN_EMAIL`, com fallback atual.
- Padrao de adiar trabalho pesado pos-interacao extraido para `src/lib/interaction.js` e coberto no smoke unitario.
- Dependencias nao usadas (`@heroicons/react`, `framer-motion`, `lucide-react`) removidas do projeto.
- `npm audit fix` aplicado sem `--force`: reduziu o audit de 22 vulnerabilidades para 3 e manteve o build passando.
- Em seguida, o toolchain foi migrado de forma explicita para Vite 8/plugin React 5, eliminando as 3 vulnerabilidades restantes sem usar `npm audit fix --force`.
- `QuestionView` passou a memoizar mapa/set de questoes, favoritos e caderno de erros, reduzindo buscas repetidas em arrays durante render de listas grandes.
- Alternativas e botoes frequentes de questoes trocaram `transition-all`/micro-transforms por transicoes mais leves e previsiveis.
- Respostas de fixacao da Academia e respostas feitas pela tela de favoritos tambem passaram a adiar `updateSubject` para depois do primeiro frame.
- Toolchain modernizado para `vite@8.1.2` e `@vitejs/plugin-react@5.2.0`; `npm audit --audit-level=moderate` agora retorna 0 vulnerabilidades.
- Smoke unitario reforcado para conferir scripts de qualidade, ausencia de dependencias removidas e Vite em major moderno.
- Criado `scripts/build-budget.mjs`; `npm run check` e o CI agora falham se o bundle principal ou o JS total gzip passarem do budget definido.
- `src/agora_prompts.js` saiu do bundle inicial e passou a ser carregado sob demanda quando o usuario aciona geracao/auditoria. O bundle principal caiu de ~221,5 KiB gzip para ~193,5 KiB gzip.
- Budget do bundle principal apertado para 220 KiB gzip e smoke unitario passou a bloquear import estatico de `agora_prompts.js`.
- Corrigido o acesso da Biblioteca no localhost: `shared-library` voltou a ser admin-only, usando `homeCanSeeSharedLibrary` para esconder a tela/nav e tambem para impedir leituras Firestore quando o usuario nao e admin.
- Biblioteca pessoal e compartilhada ganharam estados visiveis de sincronizacao/erro, evitando falha silenciosa ou aparencia de tela vazia quando Firestore, login ou regras locais impedirem o carregamento.
- Smoke unitario reforcado para impedir regressao da Biblioteca: ele exige acesso admin-only e bloqueia sincronizacao Firestore quando `homeCanSeeSharedLibrary` for falso.
- Causa do `permission-denied` local identificada: apos extrair Firebase para variaveis de ambiente, o Vite passou a obedecer `.env.local`, que apontava para outro projeto Firebase. O `.env.local` local foi realinhado ao projeto principal usado antes.
- Progresso da Biblioteca ganhou `src/services/sharedLibraryProgress.js`; responder questao agora grava apenas o patch `answers.{questionId}` com rollback visual se a sincronizacao falhar, em vez de regravar o documento inteiro de progresso.
- Persistencia da revisão espaçada foi extraida para `src/services/reviewQueue.js`; `App.jsx` nao escreve mais `vq_review` diretamente, as alteracoes/remocoes de documentos sao sincronizadas em paralelo e falhas fazem rollback do estado/cache local.
- Progresso do curso ganhou `src/services/courseProgress.js`; aulas assistidas e estatisticas diarias sairam do monolito, e estatisticas salvas imediatamente agora sao adiadas para depois do primeiro frame para nao competir com o clique de resposta.
- CI passou a rodar `npm run audit:moderate` antes do build, fazendo vulnerabilidades moderadas ou superiores quebrarem o pipeline automaticamente.
- Primeira quebra real de feature iniciada: `BizuarioModal` saiu do `App.jsx` para `src/features/bizuario/BizuarioModal.jsx` e passou a ser carregado via `React.lazy`, reduzindo o bundle inicial e abrindo o caminho para extrair `QuestionView` em seguida.
- `StudyMapPreview` tambem saiu do `App.jsx` para `src/features/study-map/StudyMapPreview.jsx` com carregamento lazy, removendo UI de fluxo raro do bundle inicial.
- `QuestionView`, `QuestionCard`, `OpenAnswerModal`, chat do Oraculo e UI de flashcards foram movidos para `src/features/questions/QuestionFeature.jsx` com carregamento lazy. O `App.jsx` perdeu cerca de 1.500 linhas e o bundle principal caiu para 749,87 kB raw / 183,35 kB gzip no build do Vite; o novo chunk de questoes ficou com 76,02 kB raw / 20,62 kB gzip.
- Smoke unitario passou a bloquear regressao dessa atomizacao, exigindo o lazy import de `QuestionFeature.jsx` e impedindo que `QuestionView/QuestionCard/OpenAnswerModal` voltem como componentes inline no `App.jsx`.
- Modais de exportacao PDF/Word da Academia e das questoes foram movidos para `src/features/exporting/ExportModals.jsx`, retirando helpers DOCX/ZIP do bundle inicial.
- Modais raros de prompt externo e revisao espacada foram movidos para `src/features/modals/WorkflowModals.jsx`.
- Modal de geracao de questoes das videoaulas foi movido para `src/features/video-questions/VqGenModal.jsx`.
- Lista admin do mapa de estudo foi movida para `src/features/admin/AdminStudyMapTopicList.jsx`.
- Apos esses cortes, o bundle principal ficou em 697,07 kB raw / 170,35 kB gzip; ainda ha aviso do Vite por passar de 500 kB raw, mas o budget gzip continua aprovado.
- Smoke unitario reforcado para exigir os chunks `ExportModals`, `WorkflowModals`, `VqGenModal` e `AdminStudyMapTopicList`, bloqueando retorno desses blocos ao `App.jsx`.
- Segunda leva de atomizacao: `AcademiaTopicView`, modal de geracao em massa, Biblioteca compartilhada, Home, Sub-biblioteca, Portal do Curso, Videoaulas, Questoes do Curso, Configuracoes, Favoritos, Revisao Espacada e Centelha foram movidos para `src/features/*` com `React.lazy`.
- O bundle principal caiu para 485,79 kB raw / 131,54 kB gzip; o aviso do Vite de chunk acima de 500 kB sumiu.
- `scripts/build-budget.mjs` agora bloqueia explicitamente o bundle principal acima de 500 KiB raw, alem de manter limite gzip do entry e limite total gzip ajustado para o novo desenho em chunks.
- Criado `src/features/FeatureContext.jsx` para reduzir props gigantes nos wrappers lazy. Home, Sub-biblioteca, Portal do Curso, Videoaulas, Questoes do Curso, Configuracoes, Favoritos, Revisao Espacada, Centelha, Biblioteca compartilhada e modal de geracao em massa agora consomem dependencias por `useFeatureContext()`, deixando o `App.jsx` menos ruidoso sem desfazer o code splitting.
- Smoke unitario reforcado para exigir `FeatureProvider` no render principal e `useFeatureContext()` nas features migradas, evitando que futuras IAs voltem a empilhar props extensas nos wrappers.
- Apos a limpeza de props, `npm run check` passou e o bundle principal ficou em 481,11 kB raw / 130,17 kB gzip; JS total ficou em 417,0 KiB gzip.

Ainda pendente:

- Testar regras Firestore em emulador/console antes de publicar.
- Expandir persistencia granular para outros fluxos alem de `vq_blocks`.
- Migrar Gemini para backend seguro.

## Conclusao

O site nao esta "sem salvacao"; ele esta no ponto comum de produto que cresceu rapido demais. A base funcional existe, mas precisa virar sistema: arquitetura menor, dados mais granulares, seguranca fora do cliente, workflow com testes e design system consistente.

O melhor caminho e evoluir por fases curtas, cada uma deixando o produto mais rapido e mais confiavel. Tentar redesenhar tudo antes de arrumar persistencia, seguranca e arquitetura provavelmente vai so trocar a maquiagem de um sistema ainda instavel.
