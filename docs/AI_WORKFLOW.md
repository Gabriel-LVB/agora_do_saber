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
- Para revisão espaçada, use `src/services/reviewQueue.js`; o `App.jsx` deve atualizar estado/cache e delegar persistencia dos docs `vq_review` ao serviço.
- Para progresso do curso, use `src/services/courseProgress.js`; aulas assistidas e estatisticas diarias nao devem ser gravadas diretamente no `App.jsx`.
- Nao importe `src/agora_prompts.js` estaticamente em `App.jsx`; use o loader lazy existente para nao inflar o bundle inicial.
- Nao bloqueie a Home esperando dados pesados. Use o modelo em camadas: render inicial leve, depois `backgroundPrefetchStage` aquece Biblioteca pessoal, curso/revisao e questoes do curso em background.
- A Biblioteca pessoal nao deve forcar refresh remoto antes do primeiro respiro da Home. Use cache local na entrada e deixe `backgroundPrefetchStage`/`needsPersonalLibraryData` aquecer a colecao logo depois.
- Modais/fluxos raros devem sair do `App.jsx` como feature lazy quando possivel. Bizuario e preview de plano guiado ja estao em `src/features/` via `React.lazy`.
- A Biblioteca compartilhada (`shared-library`) e admin-only. Use `homeCanSeeSharedLibrary` para esconder tela/nav, mas use `needsSharedLibraryData` para permitir leitura Firestore apenas quando a aba estiver aberta; use `showSharedLibraryAdminTools` apenas para alternar ferramentas administrativas dentro da tela.
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
