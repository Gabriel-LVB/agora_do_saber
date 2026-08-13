# Ágora do Saber — guia de contexto para IAs

> Última conferência manual: 10 de agosto de 2026.
>
> Este é o documento principal para dar contexto a uma IA antes de pedir análise ou alterações no projeto. Ele descreve o produto, a arquitetura, os dados, as permissões e as regras que não devem ser quebradas. O código continua sendo a fonte de verdade: se este guia divergir do código, confirme a implementação atual e atualize este arquivo.

## Como usar este documento

Em um novo chat, envie este arquivo e diga:

> Leia `AGENTS.md` por completo antes de responder. Trate-o como contexto do projeto, confira no código a área relacionada ao meu pedido e preserve as regras de negócio, segurança e persistência descritas nele.

Para tarefas de código, a IA também deve ler `docs/AI_WORKFLOW.md`. Para FAMED ou Gemini, deve abrir os documentos específicos listados no fim deste guia.

## Resumo em 30 segundos

O **Ágora do Saber** é uma plataforma privada de estudo médico. É uma SPA em React que reúne:

- criação de aulas e bancos de questões com Gemini;
- biblioteca pessoal organizada em pastas;
- biblioteca compartilhada derivada das videoaulas do curso;
- videoaulas hospedadas no Bunny e seus bancos de questões;
- plano de estudos semanal, metas diárias e revisão adaptativa;
- simulados, favoritos, caderno de erros e exportação para Anki;
- uma área acadêmica FAMED, atualmente focada no S5 de Cardiologia, Pneumologia e ABS da Gestante e do RN;
- ferramentas administrativas de publicação, auditoria, organização do curso e controle de acesso.

A aplicação não usa React Router. A “rota” atual é o estado `view` dentro de `src/App.jsx`. O backend de dados é Firebase Auth + Firestore. A geração de conteúdo usa Gemini 2.5 Flash, normalmente com as chaves dos próprios usuários no cliente.

O maior débito técnico é `src/App.jsx`, que ainda é um monolito muito grande. Ele contém a maior parte do estado, dos handlers e das regras de negócio, enquanto telas mais recentes foram extraídas para `src/features/` e consomem um `FeatureContext`.

## Vocabulário do produto

Não trate estes nomes como sinônimos:

| Nome na interface | Significado no código |
| --- | --- |
| **Início** | Home leve com progresso diário, próxima aula do plano e atalhos. `view === 'library'`; apesar do nome interno, não é a listagem da biblioteca pessoal. |
| **Meus materiais** | Biblioteca pessoal do usuário, armazenada em `users/{uid}/library`. Tem três origens: Academia, Gemini/Oráculo e importações externas. |
| **Academia** / **Criar Aula** | Fluxo que gera uma aula didática em Markdown e questões de fixação. Assuntos usam `source: 'academia'`. |
| **Oráculo** / **Criar Questões** | Fluxo que gera bancos de questões por assunto/tópico. Assuntos usam `source: 'gemini'`. |
| **Importar Questões** | Cola e interpreta questões criadas fora do app. Usa `source: 'external'`. |
| **Fábrica de Questões** | Área administrativa que produz, classifica, seleciona e audita o banco compartilhado baseado nas videoaulas. Mantém o nome interno `shared_library`; não confundir com Meus materiais. |
| **Portal do Curso** | Videoaulas, Plano de estudos e Revisões. O Plano de estudos é a evolução unificada do antigo Ciclo/Cronograma. |
| **Questões do Curso** | Blocos de questões ligados a uma videoaula. O conteúdo e as respostas vivem em estruturas `vq_blocks`. |
| **FAMED** | Área separada com conteúdo da faculdade. Reutiliza o formato e a experiência da Academia, mas persiste em `famed_content`. |
| **Dúvida Rápida** | Sessões curtas com aula, questões e/ou flashcards; internamente usa `source: 'quick'`. |
| **Caderno de erros** | Lista de questões erradas selecionadas para estudo e geração de novas baterias. |
| **Revisões** | Nova interface da antiga Revisão espaçada, exclusiva de alunos com acesso ao curso e do admin. A rota interna continua `spaced-review` e a persistência principal continua em `users/{uid}/vq_review`. |
| **Bizuário** | Recurso legado/compatível que hoje encaminha conteúdo do Oráculo para uma aula configurável da Academia. |

## Tecnologia e execução

### Stack

- React 17;
- Vite 8;
- JavaScript/JSX, sem TypeScript;
- Tailwind CSS 2 e estilos próprios em `src/brand.css`;
- Firebase 12: Authentication e Cloud Firestore;
- Playwright para smoke visual;
- deploy preparado para Vercel;
- regras do Firestore testadas localmente e, opcionalmente, no emulador.

Não há servidor Node próprio neste repositório. O frontend é estático. O backend Gemini é opcional e externo.

### Comandos

```bash
npm install
npm run dev
npm run check
npm run audit:moderate
npm run test:rules:emulator
```

`npm run check` é a validação mínima antes de entregar qualquer alteração. Ele roda:

1. `test:unit`: smoke tests e contratos arquiteturais;
2. `test:rules`: inspeção estática das regras do Firestore;
3. `build`: build Vite de produção;
4. `budget`: limites do bundle.

Com um servidor local ativo, também pode ser usado:

```bash
$env:UX_BASE_URL="http://127.0.0.1:3003/"
npm run ux:smoke
```

O `ux:smoke` verifica desktop/mobile, tema claro/escuro, fonte ampliada e overflow horizontal. As imagens são gravadas em `test-results/ux-smoke/`.

### Variáveis de ambiente

Consulte `.env.example`. As variáveis relevantes são:

- `VITE_FIREBASE_*`: configuração do projeto Firebase;
- `VITE_APP_ENV`: ambiente, com fallback para `production`;
- `VITE_ADMIN_EMAIL`: e-mail administrativo; existe fallback por compatibilidade;
- `VITE_GEMINI_BACKEND_URL`: endpoint opcional do proxy Gemini;
- flags `VITE_FEATURE_*`: estão documentadas no exemplo, mas antes de depender delas confirme se a implementação atual realmente as consome.

`src/config/environment.js` ainda contém fallbacks públicos do Firebase. Isso é normal para configuração web Firebase, mas não autoriza colocar segredos privados no frontend.

### Deploy

- `vercel.json` impede cache de `/` e `index.html`;
- assets com hash recebem cache imutável de um ano;
- `firebase.json` aponta para `firestore.rules` e configura o emulador na porta 8080;
- a CI em `.github/workflows/main.yml` instala com `npm ci` e executa auditoria/verificações.

Nunca edite `dist/` manualmente. Ele é saída do build.

## Acesso, autenticação e perfis

O login normal é Google via Firebase Auth, com persistência local. Em dispositivos/navegadores adequados usa popup; há fallback para redirect. A infraestrutura antiga de usuário anônimo ainda aparece em alguns caminhos, mas usuários anônimos são bloqueados pelo controle de acesso atual.

As permissões dependem de `config/access_whitelist`:

```js
{
  courseEmails: [...],   // acesso ao site e ao curso
  siteOnlyEmails: [...]  // acesso ao site, sem Portal do Curso/FAMED
}
```

Há fallback legado para `config/videoaulas_whitelist`.

### Três experiências

1. **Admin**
   - Identificado no frontend por `VITE_ADMIN_EMAIL`.
   - Nas regras, também pode ser reconhecido por custom claim `admin: true` ou pelo e-mail administrativo fixo.
   - Pode editar configurações globais, conteúdo compartilhado, FAMED, aulas e cronograma.
   - Pode alternar `adminHomeMode` entre visão admin, aluno com curso e aluno sem curso.

2. **Aluno com curso**
   - Está em `courseEmails`.
   - Vê Portal do Curso e FAMED.
   - Pode usar Meus materiais, Academia, Oráculo, importação, Dúvida Rápida, simulados e revisão.

3. **Aluno sem curso**
   - Está em `siteOnlyEmails`.
   - Usa os recursos pessoais, mas não vê Portal do Curso, FAMED nem Revisões.
   - Não deve receber atalhos ou ações de adicionar à revisão, abrir `spaced-review` por estado antigo nem carregar `vq_review` em segundo plano.

Quem não estiver em nenhuma lista recebe “Acesso negado”. A autorização deve ser confirmada remotamente em cada carregamento; cache serve somente como fallback de indisponibilidade, nunca como fonte definitiva após revogação.

O app registra acessos em `access_logs` e presença/dispositivo em `user_devices`. Não enfraqueça essa autorização apenas escondendo elementos na UI: a regra real precisa continuar protegida no Firestore.

## Navegação

O estado principal é:

```js
const [view, setView] = useState('library');
```

Não há URLs por tela nem histórico de rotas convencional. Back do navegador é interceptado para reproduzir a hierarquia interna. `viewReturnTarget` guarda o ponto de retorno de fluxos temporários como Configurações, Dúvida Rápida e Revisão.

### Valores importantes de `view`

| `view` | Tela |
| --- | --- |
| `library` | Início/Home |
| `shared-library` | Fábrica de Questões (admin) |
| `famed` | Portal FAMED |
| `sub-library` | Raiz/pasta de Meus materiais |
| `subject` | Lista de tópicos de um assunto pessoal |
| `topic` | Banco de questões de um tópico |
| `academia-topic` | Aula/tópico da Academia |
| `creator` | Criador do Oráculo |
| `academia-creator` | Criador da Academia, inclusive quando iniciado pela FAMED |
| `paste` | Importação de questões |
| `quick` / `quick-topic` | Dúvida Rápida e resultado |
| `favorites` | Favoritos |
| `spaced-review` | Revisão espaçada |
| `curso` | Portal do Curso |
| `videoaulas` | Player e catálogo de videoaulas |
| `videoquestions` | Questões ligadas às videoaulas |
| `exam` | Simulado em andamento |
| `settings` | Configurações e ferramentas administrativas |

Estados como `activeFolderId`, `activeSubjectId`, `activeTopicId`, `activeAula`, `vqAula` e `vqActiveBlockView` refinam a tela ativa.

Ao criar uma nova tela, considere:

- lógica de voltar em `handleAppBack` dentro de `App.jsx`;
- sidebar desktop, menu móvel e bottom navigation;
- `bottomNavEligibleView`, overlays e modo flashcard fullscreen;
- scroll da página e o scroll próprio de videoaulas;
- permissões `homeCan*` e `canUse*`;
- carregamento sob demanda descrito adiante.

## Arquitetura do código

### Entrada e orquestração

- `src/main.jsx`: monta `<App />` em modo estrito.
- `src/App.jsx`: estado global, autenticação, navegação, regras de negócio, parsers, geração, persistência e composição das telas.
- `src/features/FeatureContext.jsx`: ponte temporária entre o monolito e telas extraídas.

`featureContextValue` é muito grande de propósito: as telas extraídas chamam `useFeatureContext()` e recebem estado/handlers do `App.jsx`. Ao extrair uma tela, todos os identificadores usados precisam ser passados pelo contexto ou importados diretamente. O smoke unitário detecta identificadores livres em vários módulos.

### Telas e features

- `features/home/HomeView.jsx`: Home e jornada do curso.
- `features/library/SubLibraryView.jsx`: pastas, drag and drop e operações de Meus materiais.
- `features/questions/QuestionFeature.jsx`: `QuestionView`, `QuestionCard` e resposta aberta; é compartilhado por várias áreas.
- `features/academia/AcademiaTopicView.jsx`: apresentação e controles de uma aula da Academia.
- `features/shared-library/SharedLibraryView.jsx`: Fábrica de Questões, leitura do banco e automação.
- `features/course/`: Portal, player, questões e jornada/ciclo.
- `features/famed/`: catálogo, cronograma e portal FAMED.
- `features/quick/`: Dúvida Rápida; os prompts específicos ficam em `quickContent.js`.
- `features/review/SpacedReviewView.jsx`: fila e sessão de revisão.
- `features/favorites/FavoritesView.jsx`: favoritos agregados.
- `features/settings/SettingsView.jsx`: preferências e painéis admin.
- `features/admin/`: mapa de estudo e auditoria de questões.
- `features/exporting/`: exportações e integração com AnkiConnect.
- `features/modals/`, `features/bulk/`, `features/bizuario/`, `features/video-questions/`: fluxos raros carregados sob demanda.

Grande parte dessas features usa `React.lazy`. Preserve o carregamento lazy para não aumentar o bundle inicial.

### Hooks e serviços

Hooks:

- `useSharedLibrarySync`: consulta conteúdo compartilhado, hidrata chunks, carrega progresso quando necessário e mantém snapshot em tempo real.
- `useGeminiRuntime`: seleciona/rotaciona chaves e normaliza erros.
- `useCourseDerivedState`: aplica organização do curso e calcula ordenações derivadas.
- `useCourseHeroJourney`: nome legado do hook que monta as semanas e calcula a próxima aula do Plano de estudos.

Serviços:

- `firebase.js`: instâncias Auth e Firestore;
- `gemini.js`: chamadas REST e streaming ao Gemini;
- `libraryProgress.js`: patches pequenos de progresso dos tópicos pessoais;
- `sharedLibraryProgress.js`: respostas/progresso da Biblioteca;
- `sharedLibraryContent.js`: separação e recomposição de documentos grandes;
- `sharedLibraryRepair.js`: validação, retentativa individual e confirmação remota do reparo de questões incompletas;
- `courseProgress.js`: aulas assistidas e estatísticas diárias;
- `reviewQueue.js`: documentos da revisão espaçada;
- `vqBlocks.js`: patch granular de blocos de questões de videoaula;
- `famedContent.js`: assinatura, conversão, publicação e remoção de conteúdo FAMED;
- `questionAudit.js`: coleta e detecção de questões semelhantes/repetidas.

Utilitários:

- `cleanFirestoreData`: remove `undefined` antes de persistir; em arrays converte posições indefinidas em `null`;
- `deferInteractionWork`: espera o primeiro frame antes de trabalho secundário;
- `safeStorage`: wrappers tolerantes a falhas de `localStorage`.

### Prompts

`src/agora_prompts.js` contém builders grandes de prompts. Ele **não pode** voltar a ser importado estaticamente no `App.jsx`; existe um loader dinâmico para manter o bundle inicial menor.

Flashcards e clozes obedecem à política global versionada de `src/prompts/memoryCardPolicy.js`. Academia, Oráculo, importação externa, Questões do Curso, Dúvida Rápida, caderno de erros, reparo e FAMED devem incorporar essa fonte compartilhada, sem manter cópias divergentes. A IA decide a quantidade sem teto, piso, faixa ou meta; o filtro 20/80 representa importância, não contagem. Todo candidato precisa ser essencial, beneficiar-se realmente de recuperação ativa e não ser dedutível por bom senso. Flashcard direto exige um item curto por padrão e, excepcionalmente, dois itens inseparáveis anunciados na pergunta; listas e inventários são proibidos. Cloze usa exatamente um `{{c1::termo curto}}`, sem dica e sem múltiplos trechos ocultos. A seleção ocorre no prompt: parsers e UI preservam tudo que o modelo devolveu e não fazem descarte pedagógico posterior.

Tipos de memorização são exclusivos na configuração de geração: escolher **Flashcards** ou **Preencher lacunas** desmarca tipos comuns e o outro formato de memória. Em qualquer executor, uma configuração que contenha um tipo de memória é normalizada para esse único tipo antes do prompt. Estilos de questões clínicas, inclusive o modo híbrido de duas passadas, nunca podem acrescentar questões diretas ou clínicas a uma geração de cartões.

Na experiência de estudo, `QuestionView` separa apenas visualmente flashcards/clozes das questões comuns quando ambos estão armazenados no mesmo tópico. Nada é descartado ou movido: o aluno alterna entre **Questões** e **Flashcards**, e a segunda trilha usa o mesmo modo dedicado da FAMED — um cartão por vez, layout amplo, tela cheia, progresso e repetição dos erros. A aula da Academia não renderiza cartões de memória como questões corridas entre os capítulos; ela abre essa mesma sessão dedicada.

## Fluxo geral dos dados

```text
Firebase Auth
    ↓
config/access_whitelist ──→ decide admin / curso / somente site / bloqueado
    ↓
Home renderiza primeiro com dados leves
    ↓
prefetch em estágios (0,9 s → 2,2 s → 4,5 s)
    ├─ biblioteca pessoal + progresso
    ├─ curso + cronograma + revisão
    └─ blocos de questões do curso

Interação do aluno
    → estado React muda imediatamente
    → cache local é atualizado
    → persistência granular ocorre depois do primeiro frame
    → erro pode causar rollback visual/toast
```

Não faça a Home esperar todas as coleções. O app usa cache e `backgroundPrefetchStage` para aquecer dados gradualmente.

## Modelo da biblioteca pessoal

Coleção:

```text
users/{uid}/library/{itemId}
```

Ela guarda no mesmo nível pastas e assuntos. Não suponha que todo documento tenha `topics`.

### Pasta

Estrutura conceitual:

```js
{
  id,
  itemType: 'folder',      // contrato usado por isFolderItem
  title,
  source,                 // academia | gemini | external
  parentFolderId: null | id,
  sortOrder
}
```

Pastas só podem conter itens da mesma `source`. Existem raízes espelhadas/protegidas que não devem ser movidas ou removidas.

### Assunto

Estrutura comum:

```js
{
  id,
  title,
  source,                 // academia | gemini | external | quick
  folderId: null | id,
  sortOrder,
  fullSyllabus,
  sourceMaterials,
  focusAreas: [],
  topics: [...]
}
```

### Tópico do Oráculo/importação

```js
{
  id,
  title,
  subtopics: [],
  questions: [],
  summary: '',
  answers: {},            // questionId → alternativa ou resposta serializada
  favorites: [],          // ids
  errorNotebook: [],      // ids
  spacedReview: {},
  questionStyle,
  questionTypes
}
```

### Tópico da Academia

Além dos campos de progresso:

```js
{
  lessonSections: {},     // seção/subtópico → conteúdo Markdown
  fixationQuestions: {},  // seção/subtópico → questões
  lessonGenerated: false,
  extraBattery: []
}
```

Uma Academia pessoal pode manter um espelho de suas questões no Oráculo para reutilizar simulados, favoritos e revisão. Leia as funções de mirror/sync antes de alterar essa relação.

### Progresso separado

Respostas, favoritos, caderno de erros, revisão e bizuário não devem obrigar a regravar o documento inteiro do assunto:

```text
users/{uid}/library_progress/{subjectId}__{topicId}
```

Use `persistLibraryTopicProgressPatches`/`saveLibraryTopicProgressPatch`. Na leitura, `applyLibraryProgressEntries` sobrepõe o progresso separado sobre os campos embutidos legados.

Conteúdo estrutural — criação, título, tópicos, aula gerada — ainda usa o documento em `library`. `updateSubject` faz merge defensivo para reduzir perda de progresso concorrente.

## Modelo de questões

Há vários formatos legados, portanto use os helpers existentes em vez de reinventar a interpretação.

Questão objetiva típica:

```js
{
  id,
  statement,
  options: [
    { letter: 'A', text: '...', isCorrect: false, explanation: '...' }
  ],
  explanation,
  explanationParts,
  caseContext,
  libraryQuestionKind: 'direct' | 'clinical'
}
```

Variações usam marcadores como:

- `isOpen` / `isEssay` + `expectedAnswer`;
- `isFlashcard`;
- `isCloze`;
- verdadeiro/falso (`vof`);
- certo/errado (`cespe`);
- questões importadas (`old_exam`).

Tipos disponíveis no seletor:

- múltipla escolha;
- verdadeiro ou falso;
- certo ou errado;
- resposta curta;
- dissertativa;
- questão já existente, somente no fluxo de importação;
- flashcard, para usuários avançados;
- cloze, somente admin.

Nunca determine acerto apenas comparando letras sem olhar o helper `isAnswerCorrect` e a forma atual das opções. O parser embaralha distratores e letras de maneira determinística. Explicações legadas podem citar a letra anterior ao embaralhamento; a lista compartilhada de regex e os normalizadores de `src/lib/questionExplanation.js` corrigem referências como “A alternativa correta é a A”, “gabarito: B” e, na análise local de uma opção, “alternativa C”. A explicação geral só deve usar os padrões que declaram explicitamente o gabarito, para não trocar menções legítimas a distratores.

Ao alterar a experiência de questões, inspecione em conjunto:

- `QuestionView`;
- `QuestionCard`;
- `handleAnswer`;
- `handleFavorite`;
- `handleErrorNotebook`;
- os handlers de reset/regeneração;
- persistência do fluxo específico;
- estatísticas diárias e revisão.

## Fábrica de Questões e banco compartilhado

Conteúdo:

```text
shared_library/{lessonId}
shared_library/{lessonId}/chunks/{chunkId}
shared_library/{lessonId}/metadata_chunks/{manifest|batch_NNN}
```

Progresso individual:

```text
users/{uid}/shared_library_progress/{lessonId}
```

Cada item representa uma aula do curso:

```js
{
  lessonId,
  sourceLessonId,
  subject,
  topic,
  title,
  description,
  durationSeconds,
  source: 'course-transcript',
  published,
  summaryText,
  summaryBlocks: [{ title, subtopics: [] }],
  directQuestions: [],
  clinicalQuestions: [],
  learningSelection: {    // snapshot pedagógico calculado e publicado ao concluir a curadoria
    version,
    questionSignature,
    metadataCompletedAt,
    publishedAt,
    totals,
    questionPolicies: {}
  },
  // versões, flags de execução parcial e timestamps
}
```

A automação admin tem três etapas retomáveis:

1. sumário;
2. uma questão direta por subtópico;
3. prova clínica integradora.

A curadoria de metadados é uma quarta linha de processamento, separada da geração. Existe uma única aba **Curadoria**: o administrador escolhe uma matéria inteira ou uma aula, e cada aula preserva seu mapa conceitual e documentos próprios. As questões são classificadas em lotes retomáveis de até 30, salvos em `metadata_chunks`. O tamanho 30 reduz chamadas e repetição de contexto sem colocar a aula inteira em uma resposta frágil; uma aula de 62 questões usa normalmente uma chamada conceitual e três chamadas de metadados. Ao concluir todos os lotes de uma aula, a própria Curadoria calcula `selectLearningQuestions`, grava automaticamente o snapshot compacto `learningSelection` no item `shared_library` e mantém metadados e justificativas completos privados. Não recrie uma subaba manual de Seleção. A Curadoria oferece exportação JSON de auditoria por aula para calibrar prompts e regras sem editar milhares de questões manualmente. Ela também cruza `users/{uid}/videoaulas_progress/watched` com os manifestos, destaca aulas demandadas e possui uma única ação coletiva para analisar/publicar todas as pendentes. As leituras administrativas dos manifestos e da demanda são exclusivamente manuais pelos botões **Atualizar metadados** e **Atualizar prioridades**: não use polling, listener, efeito dependente do catálogo nem atualização automática ao concluir a fila.

A calibração vigente é `agora-question-metadata-v2`/`agora-learning-selection-v2`. Ela é deliberadamente conservadora: `importance=5`, `learningRole=core`, `qualityScore>=90` e `factualConfidence=high` devem ser minoritários e justificados; conceitos de fundo não devem ser anexados à questão. A seleção cobre os conceitos importantes com preferência por questões `core`, evita repetir clusters redundantes, diversifica conceitos primários e limita complementação automática a um núcleo enxuto. Alterar esses critérios exige nova versão de análise para não misturar lotes produzidos por prompts diferentes.

A aba administrativa **Dimensionar** calcula manualmente um retrato do banco para decidir seu futuro antes da migração de Revisões. Ela usa exclusivamente as questões já carregadas, o `learningSelection` publicado cuja assinatura ainda corresponde ao conjunto atual e a auditoria textual local; não lê `metadata_chunks` nem chama Gemini. O relatório separa total/diretas/clínicas, cobertura curada, tiers, importância, qualidade, papel e estilo cognitivo. O núcleo global do banco curado é a união, sem dupla contagem, de questões elegíveis que sejam `tier=essential`, tenham `importance=5` ou tenham simultaneamente `importance=4` e `qualityScore>=90`. O corte conservador reúne bloqueios objetivos, qualidade abaixo de 60 e reservas com outro sinal fraco; o cenário amplo histórico inclui toda reserva/desativada. Duplicatas prováveis são agrupadas por matéria e contadas como questões excedentes após preservar uma representante, nunca como quantidade bruta de pares. Questões sem curadoria válida entram no inventário e na similaridade, mas nunca no julgamento do corte global. O cálculo pesado só começa no botão e roda em Web Worker para não bloquear a interface.

O único write autorizado nessa aba é o botão administrativo confirmado **Inativar tudo fora do novo núcleo**. Ele materializa exatamente os IDs curados fora da regra no retrato parcial atual, ignora questões que já ficaram inativas e não cria uma política automática para curadorias futuras. O original não é apagado. Como milhares de entradas não cabem com segurança em um único documento, cada execução é auditável e atômica, dividida em documentos irmãos de até 250 entradas em `config/disabled_course_questions__batch__*`, identificados por `configType: 'disabled-course-question-batch'`; o motivo do lote é `question-bank-sizing-curated-high-yield-v1`, e o documento `config/disabled_course_questions` guarda também `lastBulkReason`. Esse formato reutiliza a autorização já existente da coleção `config`, sem depender da publicação de uma regra nova para subcoleção. Admin grava, alunos do curso apenas leem. O sucesso do botão é determinado pelo commit atômico. A filtragem local do banco, das revisões e dos caches é adiada para depois do primeiro frame e não pode converter um commit concluído em um falso aviso de falha. O runtime reúne raiz + lotes, deduplica e usa índice em memória, evitando busca linear por milhares de IDs. Dimensionamentos seguintes mostram somente o banco ativo nos cenários e informam separadamente quantas questões já estão inativas. Não converta isso em exclusão física.

O executor da Curadoria segue o padrão resiliente da criação: exibe logs com horário por aula, lote, tentativa, chave, validação, salvamento e publicação; permite pausar/continuar e parar após a requisição ativa; usa o mesmo pool administrativo deduplicado da criação — chaves atuais e backups encontrados nos perfis, sem registrar seus valores — e mantém um cursor rotativo entre chamadas; tenta outra chave em cota, chave inválida, timeout, sobrecarga, conexão, JSON truncado ou lote incompleto; valida exatamente os IDs esperados antes de salvar; e, se uma aula esgotar as tentativas, marca seu manifesto como pausado e continua a matéria. As chamadas mecânicas de curadoria desativam o thinking, pedem `application/json` nativo e admitem até 180 segundos nos lotes de 30. Lotes concluídos nunca são descartados. O resumo final separa publicadas, pendentes e não iniciadas.

FSRS é o motor ativo por cartão para questões essenciais do curso e para materiais pessoais, nunca um experimento exclusivo desta coleção. A integração usa `ts-fsrs@5.4.1`: `services/reviewMigration.js` considera somente questões de aulas explicitamente ativadas **com seleção pedagógica publicada** e distribui a primeira exposição de todas as elegíveis diariamente por até 30 dias, com carga, importância e qualidade não crescentes. Depois da resposta real, essenciais seguem longitudinalmente e `services/fsrsScheduler.js` grava `fsrs`; complementares e reservas passam a `adaptiveState: 'completed-once'`, sem novo vencimento. Aula sem curadoria e publicação não cria cartões novos. Se houver cartão legado, ele fica em `adaptiveState: 'awaiting-curation'`, `dueDate: null` e não conta nem aparece como pendência. Preserve o import dinâmico, `cardKey`, `parkedDueDate` e `legacyFallback`. A UI é uma fila única; a partição por aula em `vq_review` é apenas armazenamento. Leia `docs/LEARNING_ENGINE_ROADMAP.md` antes de mexer nessas áreas.

Durante a sessão de Revisões, o administrador recebe uma faixa de auditoria em cada questão do curso com `qualityScore`, importância e tier vindos do `learningPolicy` publicado pela Curadoria. A interface não recalcula essas notas. Políticas ausentes ou ainda em `awaiting_curation` aparecem como sem nota válida, nunca como qualidade zero; materiais pessoais não exibem essa faixa.

O cache local de `vq_review` serve somente para a primeira pintura e nunca pode impedir a confirmação remota. Quando a fila passa a ser necessária, o app mantém uma assinatura da coleção do usuário: localhost, produção, outras abas e dispositivos devem convergir para o Firestore. Controles que iniciam uma sessão permanecem bloqueados até o primeiro snapshot confirmado pelo servidor, e uma sessão já aberta remove itens ainda não respondidos que outra instância reagendou.

O administrador pode inativar globalmente uma questão do curso diretamente no cartão, inclusive pela Fábrica, Questões do Curso, Revisões e Favoritos. A lista autoritativa fica em `config/disabled_course_questions`; ela usa o ID da questão combinado com aliases estáveis da aula/item compartilhado. Esse mesmo documento pode ativar a política versionada `agora-non-content-course-question-v1`: ela reconhece, por regras textuais conservadoras, perguntas sobre a importância de estudar, o objetivo/finalidade da aula ou o aprendizado esperado, sem criar uma entrada por questão. A ativação é administrativa, precedida por contagem e confirmação, não usa Gemini e alcança também questões futuras que reproduzam esses padrões. Esse bloqueio prevalece sobre cópias antigas em `vq_blocks`, cartões já existentes em `vq_review`, sessões abertas e favoritos. Não apague o conteúdo original: preserve o registro para auditoria. A tela Favoritos agrega tanto a biblioteca pessoal quanto os favoritos persistidos nos blocos do curso. A busca da Fábrica indexa enunciados e alternativas; quando o texto encontra uma questão dentro de uma aula, abrir o resultado mostra somente as correspondências, permitindo recuperar e inativar um cartão mesmo sem favorito.

O responsável confirmou que o material ECG é próprio, autorizado e pode ser servido por URLs públicas; “Hampton”/“Hamptom” foi uma inferência incorreta de IA. O pacote original contém 150 casos clínicos e respostas completas. A entrada principal da aba administrativa Banco de ECG é um curso prático por famílias: traçado e caso antes do gabarito, autorreflexão, marcação de acerto/revisão e progresso local. O catálogo é um modo secundário de consulta. Não trate a flag `pending_independent_review` como bloqueio. Assets ficam em `public/ecg/v3/`, casos em `public/ecg/v3/cases.json` e metadados técnicos em lotes de 15. A associação automática às questões usa `services/ecgQuestionMatcher.js` e o índice gerado `public/ecg/v3/question-match-index.json`: a resposta correta/esperada identifica um conceito da ontologia, distratores são ignorados, somente o ECG principal de `phase: 'question'` é anexado e ambiguidades ficam em `awaiting-visual`, sem vencimento nem contagem. Não crie curadoria manual paralela nem use matching textual vago. O progresso do curso prático de ECG ainda não alimenta o FSRS. Leia `docs/ECG_QUESTION_MATCHING.md`.

Questões grandes são removidas do documento principal e gravadas em chunks de até cerca de 650 KB. Use obrigatoriamente `prepareSharedLibraryContentForWrite` e `mergeSharedLibraryQuestionChunks`.

`useSharedLibrarySync`:

- admin consulta tudo;
- não-admin só pode consultar `published == true`;
- progresso só é carregado quando a UI da Fábrica precisa dele;
- mantém `onSnapshot` do conteúdo;
- hidrata os chunks após a consulta.

Na interface atual, a Fábrica de Questões é exclusiva do administrador (`homeCanSeeSharedLibrary`) e não possui modo ou prévia de aluno. Os dados publicados alimentam questões prontas do curso por outros fluxos, mas a tela da Fábrica nunca deve ser aberta a alunos apenas porque as regras permitem ler documentos publicados.

Na subaba **Criar**, a entrada sem filtro mostra primeiro as matérias, não centenas de aulas simultâneas. Depois de escolher uma matéria ou pesquisar, as aulas são montadas progressivamente. O seletor de aula específica só enumera aulas quando uma matéria foi escolhida, e os cálculos pesados de reparo/fila da automação só rodam quando o painel é aberto. Preserve esse carregamento progressivo; um `<details>` fechado ainda monta seus filhos e não serve sozinho como lazy loading.

Ao responder, grave somente:

```js
answers: { [questionId]: letter }
```

por meio de `saveSharedLibraryAnswerPatch`. Não regrave o documento inteiro de progresso.

## Portal do Curso e videoaulas

### Catálogo

Fonte primária:

```text
lessons/{lessonId}
```

Campos usados:

```js
{
  subject,
  topic,
  title,
  embed_url,
  bunny_id,
  is_bonus,
  duration_seconds,
  duration_formatted,
  description,
  transcript,
  ai_catalog
}
```

O app transforma os documentos em:

```text
matéria → tópico → Aulas Principais/Bônus → aulas
```

Admin pode publicar uma cópia agregada em:

```text
config/videoaulas_catalog
```

O frontend tenta essa cópia antes de ler toda a coleção `lessons`.

### Player e progresso

O player é um iframe Bunny. Mensagens `timeupdate`/`ended` atualizam tempo assistido e podem marcar a aula automaticamente.

```text
users/{uid}/videoaulas_progress/watched
users/{uid}/daily_stats/{YYYY-MM-DD}
```

Use `saveWatchedAulas` e `saveDailyStats`; não grave esses caminhos diretamente no `App.jsx`.

### Organização e Plano de estudos

- `cronograma/{weekId}`: semanas globais;
- `config/curso_organization`: organização global publicada;
- `users/{uid}/curso_prefs/main`: matérias, ordem das aulas, início do curso, presets, número de semanas, preferências legadas do ciclo e proposta pessoal.

`useCourseDerivedState` aplica a proposta global/pessoal sobre o catálogo sem destruir os dados originais. Há correções manuais de classificação no `App.jsx`; leia as regras de aliases e overrides antes de reorganizar matérias.

O `useCourseHeroJourney` preserva o nome por compatibilidade, mas agora calcula um único Plano de estudos: ordena as aulas conforme as preferências, distribui-as por semana, mede o que foi assistido e expõe a próxima aula. Home e Portal devem consumir esse mesmo hook. Não volte a criar etapas paralelas de diretas/clínicas pares e ímpares; após a conclusão da aula, a seleção pedagógica publicada decide quais questões entram individualmente em Revisões.

O cálculo do plano usa os helpers puros de `services/courseSchedule.js`: a ordem do curso respeita a organização pedagógica publicada, o fallback interno preserva `courseIndex`, nomes de matérias são resolvidos sem depender de acentos exatos e a carga é balanceada pelo tempo estimado das aulas, não apenas pela quantidade. O usuário escolhe visão semanal ou diária; no modo diário, também escolhe os dias da semana. A visão geral diária inclui todas as datas do intervalo, inclusive descanso; esses dias têm carga zero e recebem na interface uma contagem sequencial desde o início do plano, sem alterar a distribuição feita apenas nos dias de estudo. A meta pode ser definida por quantidade de semanas, carga de horas por semana/dia de estudo ou data final. Essas preferências são `courseScheduleCadence`, `courseScheduleStudyDays`, `courseScheduleGoalMode`, `courseScheduleEffortHours` e `courseScheduleEndDate`; `courseScheduleWeeks` continua guardando a opção manual e serve de fallback para uma meta incompleta. Na Ordem UFC, Preventiva é longitudinal e fica distribuída ao longo do plano. O preset **Ordem de importância** usa `services/courseClinicalPriority.js` e a curadoria auditável `data/famed/course-clinical-priority.v3.json`: as 488 aulas são organizadas em unidades pedagógicas; partes permanecem consecutivas, fundamentos vêm antes das aplicações dependentes e a diversidade de matérias é apenas um critério suave, nunca uma rotação ou proibição de aulas consecutivas da mesma disciplina. Valide qualquer alteração contra o snapshot completo em `data/famed/course-catalog.snapshot.json`. Presets temáticos apenas reordenam, exceto Médico Bicho, cuja exclusão de Preventiva é intencional e explicitada na interface. Pendências anteriores aparecem antes do conteúdo futuro sem apagar progresso. A coleção `cronograma` permanece como estrutura legada/global, porém não é lida no carregamento do plano do aluno enquanto não participar do cálculo; preferências continuam em `users/{uid}/curso_prefs/main`.

### Questões de videoaula

```text
users/{uid}/vq_blocks/{aulaId}
```

Estrutura:

```js
{
  meta: {
    aulaTitle,
    subject,
    topic,
    totalQuestions,
    numBlocks,
    qPerBlock,
    questionStyle,
    questionTypes,
    createdAt
  },
  blocks: {
    block01: {
      title,
      subtopics: [],
      questions: [],
      answers: {},
      generating
    }
  }
}
```

O ID novo preferido é `bunny_id`; há fallbacks por título para compatibilidade. Use `aulaDocId`, `aulaVqKey` e os helpers existentes.

Conteúdo publicado da Biblioteca pode ser espelhado para `vq_blocks` com `meta.source === 'shared-library'`. Para patches de um único bloco, use `saveUserVqBlockPatch`. `saveVqBlock` serializa gravações para evitar colisões.

## Revisão espaçada, simulados e estatísticas

Fila de revisão:

```text
users/{uid}/vq_review/{aulaId}
```

Conceitualmente:

```js
{
  [blockId]: {
    [questionId]: { interval, dueDate, seed, ... }
  }
}
```

Use `persistReviewQueueChanges`; não persista `vq_review` diretamente no `App.jsx`.

Ao apagar todo o progresso do curso, remova também os cartões e os estados de revisão das videoaulas, mas preserve revisões de materiais pessoais em documentos `lib_*`. A limpeza remota é responsabilidade de `services/courseReviewReset.js`; o `App.jsx` apenas atualiza estado e cache com a fila pessoal restante.

As respostas da revisão atualizam a UI primeiro. Em cartões longitudinais, acerto avança o intervalo e erro reduz/reagenda; em complementares/reservas do curso, qualquer resultado conclui a exposição única. A fila pode apontar para questões do curso e da biblioteca pessoal, portanto qualquer remoção/regeneração deve executar a poda das referências órfãs.

Questões de aulas ativadas pelo aluno entram individualmente pela migração incremental, em
uma fila global. Marcar a aula como assistida e adicioná-la a Revisões são ações separadas.
O primeiro vencimento é o plano de introdução. Após a resposta de uma essencial,
`services/fsrsScheduler.js` atualiza o cartão FSRS-6 e `nextDue` decide o próximo
vencimento. Complementares e reservas encerram a primeira exposição em `completed-once`,
preservando resultado e histórico sem criar dívida futura. `legacyFallback` preserva o
resultado anterior para rollback e comparação das essenciais. Se o cálculo FSRS falhar,
a resposta e a persistência legadas devem continuar.

Quando existe uma seleção publicada, questões de aulas adicionadas já no fluxo progressivo
entram uma vez no plano de primeira exposição diária por até 30 dias. Com pelo menos 30
questões elegíveis, todos os dias recebem conteúdo; conjuntos menores ocupam dias consecutivos
enquanto houver itens. A quantidade é não crescente e a soma permanece exatamente igual ao
total da aula. Erros anteriores vêm primeiro; depois, metadados priorizam `essential`,
importância, qualidade, papel cognitivo, baixa redundância e diversidade de conceitos,
deixando complementares e reservas mais fracas para depois. A alocação `v10` também espalha questões irmãs entre dias diferentes
sempre que houver capacidade: primeiro por `redundancyClusterId`/`canonicalQuestionId`,
depois por `primaryConceptId` e sobreposição de `conceptIds`. As quantidades 35/30/20/10/5
foram aposentadas; a primeira representante de cada família preserva sua prioridade e as
variações são adiadas em favor de cobertura conceitual. Essa distribuição vale para cartões
novos e para cartões de planos anteriores que ainda não tiveram revisão real. A migração v10
reancora somente esses inéditos a partir do momento da migração e preserva integralmente
`FSRS`, `lastReview`, `reps`, resultados e datas do que já foi revisado. Ela mantém também as correções da matrícula retroativa defeituosa da v5/v6 e da reconstrução
superatrasada da v7: cartões do núcleo legado retomam o calendário gradual que já possuíam,
enquanto todo o backlog complementar/reserva legado inédito recebe datas entre amanhã e o
29º dia futuro. A alocação `legacy-backlog-balanced-v1` equilibra a carga já prevista nos
outros cartões, preserva a prioridade pedagógica e separa irmãs; assim, o horizonte de 30
dias contabiliza o backlog completo sem despejá-lo hoje. Cartões que já têm revisão real,
FSRS ou agendamento manual nunca têm a data
recalculada. Não reintroduza cotas globais ocultas de erradas/inéditas/acertadas
nem anexe questões de reforço ao fim de uma sessão por causa de um erro. Depois da
primeira resposta real, somente questões `essential` recebem nova data pelo FSRS. Questões
desativadas, `deprecated`, `review_required`, `reviewEligible: false` ou que exigem visual
ainda não resolvido não entram. Sem curadoria **e seleção publicada**, a aula não cria
cartões novos; cartões legados ficam em `awaiting-curation`, sem vencimento e fora da
contagem. A migração v10 aposenta vencimentos antigos de complementares/reservas já
respondidas sem apagar o histórico, remove ativações legadas de reforço e preserva
respostas, pausas e datas válidas das essenciais. O rollout progressivo é identificado pelo
marco de criação/primeiro planejamento; não confunda backlog anterior com aula recém-adicionada.

O banco completo da aula e a revisão longitudinal continuam com experiências diferentes.
Questões do Curso permite percorrer o banco diretamente; nas aulas adicionadas já no fluxo
progressivo, Revisões garante que toda questão curada e elegível seja vista pelo menos uma
vez no fluxo diário de até 30 dias. O backlog legado também aparece uma vez, distribuído pela janela de
30 dias da migração balanceada. Depois da primeira exposição, somente o núcleo essencial se transforma em
revisão longitudinal; complementares e reservas ampliam a cobertura inicial sem inflar a dívida futura.

Na tela de Revisões, 7/14/30 dias são somente horizontes do gráfico de próximos
vencimentos; nunca trate esses números como intervalos do agendador. Em 14 e 30 dias,
os rótulos usam dia e mês no formato `dd/mm`, inclusive na virada do ano. Os botões para
iniciar questões e flashcards ficam no topo; progresso e carga prevista aparecem depois
da ação principal. Mostre apenas estatísticas úteis ao estudo, sem adoção interna do FSRS,
estado de migração ou o comparativo “antes/igual/depois” com o motor legado.

Na tela da videoaula, o controle fica imediatamente abaixo de **Marcar assistida** e usa
somente os estados **Adicionar à Revisão**, **Remover da Revisão** e **Retomar Revisão**.
Sem curadoria publicada, Adicionar permanece pálido e desabilitado. Remover oferece
**Pausar Revisão**, que estaciona todos os cartões preservando FSRS, histórico e datas, ou
**Zerar Revisão**, que apaga somente a fila/histórico de revisão daquela aula e exige nova
adição explícita; não apague as respostas do banco de questões. A preferência por aula é
persistida em `users/{uid}/curso_prefs/main.courseReviewLessonStates` para impedir que a
migração automática recrie uma aula pausada ou zerada.

O Modo prova agrega questões da biblioteca pessoal. Questões carregam `_subjectId` e `_topicId` para que favoritos continuem funcionando durante o simulado. A correção pode ficar oculta até o final (`examBlind`), e o timer marca não respondidas como `SKIPPED`.

As metas diárias padrão são 120 questões e 90 minutos, configuráveis pelo usuário.

## FAMED

FAMED é um destino separado de Meus materiais. No S5, depois do seletor de semestre, a interface separa **1ª metade · Cardio/Pneumo**, **2ª metade · Gastro/Endócrino** e **ABS · semestre inteiro**; não apresente ABS como uma terceira disciplina empilhada abaixo da primeira metade:

```text
famed_content/{scheduleItemId}
```

O documento guarda metadados e um `academiaSubject` completo:

```js
{
  id,
  scheduleItemId,
  discipline,
  semester: 'S5',
  curriculum: 'PPC 2018',
  track: 'cardio-pneumo' | 'gastro-endocrino' | 'abs-gestante-rn',
  title,
  creationMode: 'academia',
  academiaSubject,
  published,
  updatedAt
}
```

Quando uma criação nasce do cronograma FAMED, o assunto recebe:

```js
{
  source: 'academia',
  storageTarget: 'famed',
  famedMeta: {...}
}
```

`persistAcademiaSubject` então delega a `saveFamedAcademiaSubject`, em vez de gravar na biblioteca do admin.

O `academiaSubject` também pode manter materiais de estudo próprios da aula:

```js
famedStudy: {
  pastQuestionSets: [{ id, title, importedAt, packageSchema, questions: [...] }],
  essentialFlashcards: [...],
  flashcardSourceSignature,
  flashcardGeneratedAt,
  flashcardGenerationVersion: 'famed-essential-direct-v9'
}
```

Cada card de aula publicado expõe exatamente três ações de estudo: **Academia**, **Questões antigas** e **Flashcards**. Para o aluno, Academia abre um menu simplificado de tópicos com numeração, título e progresso, sem controles administrativos nem objetivos expansíveis. Cada tópico leva à sua aula, com sumário quando necessário; a preferência persistida `settings.academiaQuestionPlacement` decide se as questões de fixação aparecem logo após cada capítulo (`inline`, padrão) ou reunidas depois do conteúdo (`end`).

Questões antigas são importadas por um ZIP versionado (`agora-famed-question-package-v1`) com `questions.json` na raiz e figuras em `images/`. A interface fornece um prompt completo para gerar esse pacote no GPT. Os dados estruturais ficam no conjunto de `famedStudy`; cada descritor de imagem guarda um `assetId`, enquanto o `dataUrl` correspondente fica em `famed_assets/{assetId}` para não inflar o documento principal. O site valida caminhos, formatos, tamanho, gabaritos e vínculos antes de salvar, hidrata as imagens ao abrir o bloco e continua usando o `QuestionView`.

Flashcards só podem ser gerados quando todos os tópicos possuem aula efetivamente gerada e existe ao menos uma questão antiga. A geração cruza a aula, como fonte factual, com as provas antigas, como evidência de prioridade, e aplica dois filtros obrigatórios antes de criar qualquer cartão: o conteúdo precisa ser essencial e também precisar genuinamente de recuperação por flashcard. Pontos dedutíveis por bom senso, lógica genérica, consequência óbvia de uma regra já coberta ou atitudes universais devem ser descartados, mesmo que sejam importantes. Antes de atribuir peso de prova, o modelo classifica silenciosamente a dificuldade das questões antigas: cobranças fáceis, elementares, óbvias, entregues pelo enunciado ou resolvíveis por bom senso/distratores absurdos recebem peso zero, ainda que recorrentes. O peso maior da prova vem das questões médias, difíceis e discriminativas; o espaço liberado pelas triviais deve favorecer decisões, riscos e fundamentos de alto impacto clínico. Ignorar uma questão fácil não proíbe seu conceito de entrar por relevância médica própria, mas essa entrada exige que esquecê-lo possa causar erro relevante de diagnóstico, tratamento, reconhecimento de risco ou segurança; novidade, otimização modesta, opção complementar e detalhe consultável não bastam. Depois dessa seleção, aplique a regra 80/20 sem transformar a proporção em teto, piso, faixa ou meta de cartões.

Os cartões da FAMED são diretos, sem cloze: a frente é uma pergunta curta e autossuficiente, e o back exige um item curto por padrão. Dois itens curtos só são permitidos quando formam um par inseparável e a pergunta anuncia explicitamente que espera dois; três ou mais itens são proibidos. Não peça listas de medicamentos, exames, achados, critérios, etapas, fatores ou condutas. Verbos de inventário como “cite”, “liste”, “enumere”, “quais são”, “mencione” e equivalentes são proibidos; questões antigas desse tipo podem priorizar o tema, mas sua lista recebe peso zero como memória. Também não mostre parte da lista para pedir o restante: construções “além de X” são proibidas, e o par excepcional deve constituir o conjunto completo, nunca o resto de uma tríade/lista. Pergunta no singular exige exatamente um item sem alternativas; o par precisa ser anunciado como “quais dois” e conter exatamente dois. Não use “ou”/barra para oferecer respostas alternativas a uma pergunta singular, salvo notação indivisível. Medicamentos e exames só podem ser cobrados individualmente por um papel decisório específico, nunca por mera pertença a uma classe ou rotina. Não fragmente automaticamente uma lista de baixo rendimento em vários cartões apenas para contornar o limite: cada item precisa sobreviver sozinho ao filtro 20/80 e ter papel discriminativo próprio. Detalhes periféricos passam pelo teste contrafactual: se esquecê-los não causar provavelmente erro em questão média/difícil ou decisão clínica materialmente pior antes de consulta, ficam fora. A direção segue o núcleo semântico: quando pistas/causas/critérios W e Z identificam a entidade Y, apresente W e Z na pergunta e peça Y na resposta. Pergunta e Explicação precisam preservar o mesmo grau de certeza; uma ressalva não pode corrigir uma generalização absoluta. A Explicação deve ensinar mecanismo, consequência decisória ou diferença para a alternativa plausível mais próxima; apelos vazios a diretrizes, evidência, gravidade ou importância não bastam. Um valor/limiar só merece cartão quando a Explicação esclarece o que muda clinicamente naquele ponto. Preserve a assinatura das fontes e a versão da política: se aula, questões antigas ou versão de geração mudarem, o conjunto fica desatualizado, deve sumir para alunos e aparecer ao admin como **Atualizar flashcards**. O admin também pode apagar o conjunto para gerá-lo novamente.

O card administrativo de Flashcards também oferece **Exportar para revisar o prompt**. A ação baixa `agora-famed-flashcard-audit-v1` com os flashcards salvos, metadados/assinaturas da geração, checklist e as fontes textuais da aula e das questões antigas. Trata-se de auditoria para calibrar versões futuras do prompt; não crie uma quarta ação de estudo, não filtre o resultado no cliente e não altere a persistência ao exportar.

Escopo vigente:

- currículo PPC 2018;
- semestres visíveis S5–S8;
- somente S5 ativo;
- prioridade atual: Cardiologia + Pneumologia + ABS da Gestante e do RN;
- S1–S4 e internato fora do escopo;
- usar datas, horários e professores somente dos cronogramas oficiais da turma 2026.2; práticas, segundas chamadas e AFs ficam fora.

Não crie editor paralelo, geração externa da aula em lote ou dependência de Firebase Storage. A única importação ZIP autorizada é o pacote versionado de questões antigas e suas figuras. O conteúdo da aula deve continuar reutilizando o fluxo da Academia. Alunos veem apenas itens e assets com `published == true`; rascunhos são admin-only.

Hoje respostas e favoritos específicos da UI FAMED são mantidos em `localStorage` (`agora_famed_answers` e `agora_famed_favorites`). Não presuma sincronização multi-dispositivo sem implementar explicitamente uma migração.

O admin pode remover uma Academia FAMED diretamente no card. Essa exclusão remove `famed_content/{id}` e os documentos `famed_assets` ligados a esse conteúdo — aulas, questões e figuras do pacote —, preserva as videoaulas do Portal do Curso e mantém o item estático do cronograma disponível para recriação. A confirmação deve explicitar essa separação.

Os cards do cronograma FAMED também podem mostrar videoaulas do Portal do Curso que cobrem o mesmo assunto. O vínculo é exclusivamente curado por IDs estáveis em `features/famed/famedCourseLessonMap.js`; nunca o infira por palavras do título, tópico ou descrição. A resolução sempre preserva `courseIndex`, a ordem real do catálogo aplicado. Somente o admin vê **Exportar aulas do curso**, que gera um JSON sem transcrições nem URLs com a ordem e os identificadores necessários para revisar e versionar esse mapa. O snapshot conferido fica em `data/famed/course-catalog.snapshot.json`; o atual foi exportado em 1º de agosto de 2026 e contém 488 aulas. A grade 2026.2 tem 32 aulas: 23 com vínculos diretos e nove conscientemente sem substituto aproximado. ABS é interdisciplinar e pode apontar para Obstetrícia, Pediatria, Ginecologia e Infectologia quando o vínculo for direto e explícito. Sem vínculo curado, o aluno não vê mensagem alegando que a aula não existe. Não confunda esse atalho com o conteúdo próprio da Academia FAMED.

O cronograma preserva IDs já usados. Conteúdos da turma anterior que não aparecem na grade 2026.2 não são apagados nem recebem novo ID: quando existentes, aparecem em **Materiais preservados**.

Leia obrigatoriamente:

- `docs/FAMED_CONTENT_WORKFLOW.md`;
- `docs/FAMED_S5_ORDEM_REFERENCIA.md`.

## Gemini e geração de conteúdo

Serviço: `src/services/gemini.js`.

Modelo atual:

```text
gemini-2.5-flash
```

Há duas chamadas:

- `callGemini`: não-streaming, timeout padrão de 55 s, configurável até 180 s;
- `callGeminiStream`: SSE direto no Google, timeout de 120 s.

Sem `VITE_GEMINI_BACKEND_URL`, ambas usam a chave do usuário no cabeçalho `x-goog-api-key`.

Com backend configurado:

- somente `callGemini` usa `POST {BACKEND}/generate`;
- a chave do usuário não é enviada ao backend;
- portanto o servidor precisa ter uma chave do site;
- streaming continua direto no cliente.

Leia `docs/GEMINI_BACKEND.md` antes de mudar esse contrato.

### Chaves

Configurações aceitam múltiplas chaves e formatos legados (`apiKey`, `apiKey1..3`, `geminiKeys`). `useGeminiRuntime` fornece:

- chave ativa;
- lista ordenada;
- rotação;
- opções de thinking;
- modais de erro.

Chaves são opacas: não valide apenas pelo prefixo. O teste local atual é de tamanho e ausência de espaços.

Não:

- crie novas coleções com chaves em texto puro;
- exponha chave do site no bundle;
- faça leitura ampla de `users` fora de ferramenta administrativa autorizada;
- remova compatibilidade legada sem plano de migração.

### Fluxos de geração

- **Oráculo:** material → mapa/ementa → tópicos → lotes de questões.
- **Academia:** material → mapa/ementa → tópicos → aula Markdown + fixação; baterias extras são opcionais.
- **Curso:** transcrição → sumário em blocos → questões por bloco.
- **Fábrica de Questões:** transcrição → sumário → diretas → clínicas; depois curadoria de metadados em lotes retomáveis de até 30.
- **Dúvida Rápida:** intenção curta → aula, questões e/ou flashcards.

Geração pode ser longa, parcial e retomável. Preserve flags `generating`, índices de lote, versões e conteúdo já salvo. Não troque toda a estratégia de parsing sem testar formatos legados.

## Firestore: mapa completo de alto nível

| Caminho | Uso | Leitura | Escrita |
| --- | --- | --- | --- |
| `users/{uid}` | perfil, username, settings e campos legados de API key | dono/admin | dono/admin |
| `users/{uid}/library/{id}` | estrutura dos materiais pessoais | dono/admin | dono/admin |
| `users/{uid}/library_progress/{subjectId}__{topicId}` | respostas, favoritos, erros e revisão pessoal | dono/admin | dono/admin |
| `users/{uid}/shared_library_progress/{lessonId}` | respostas da Biblioteca | dono/admin | dono/admin |
| `users/{uid}/vq_blocks/{aulaId}` | questões/respostas do curso | dono/admin | dono/admin |
| `users/{uid}/vq_review/{aulaId}` | revisão espaçada | dono/admin | dono/admin |
| `users/{uid}/videoaulas_progress/watched` | aulas assistidas | dono/admin | dono/admin |
| `users/{uid}/daily_stats/{date}` | questões e tempo do dia | dono/admin | dono/admin |
| `users/{uid}/curso_prefs/main` | plano, ordem, cronograma e ciclo | dono/admin | dono/admin |
| `config/{doc}` | whitelists, UI, catálogos, organização e automações | por modalidade de acesso | admin |
| `lessons/{id}` | catálogo, player e transcrição | acesso ao curso | admin |
| `cronograma/{weekId}` | semanas do curso | acesso ao curso | admin |
| `shared_library/{id}` + `chunks` | conteúdo global do curso | admin ou curso+publicado | admin |
| `shared_library/{id}/metadata_chunks/{id}` | metadados e progresso da curadoria | admin | admin |
| `famed_content/{id}` | aula FAMED | admin ou curso+publicado | admin |
| `famed_assets/{id}` | imagens de questões antigas FAMED | admin ou curso+publicado | admin |
| `access_logs/{id}` | auditoria de acesso | admin; criação pelo próprio usuário | próprio usuário/admin |
| `user_devices/{id}` | presença/dispositivos | admin; criação pelo próprio usuário | próprio usuário/admin |

As regras terminam em `deny all`. Qualquer nova coleção exige alteração explícita em `firestore.rules` e testes.

## Cache e carregamento

O app usa `localStorage` como aceleração e, em poucos fluxos, como armazenamento local real.

Caches principais:

- catálogo de videoaulas: 6 h;
- aulas assistidas: 10 min;
- config/whitelist: 5 min;
- biblioteca pessoal: 1 h;
- `vq_blocks`: 30 min;
- revisão: 30 min;
- cronograma, estatísticas diárias e painéis admin têm chaves próprias.

Regras:

- cache não substitui autorização remota;
- `vq_blocks` confirma o Firestore mesmo quando há cache, pois outro dispositivo pode ter respondido;
- a Home não força refresh pesado antes do primeiro respiro;
- ao gravar, mantenha cache e refs (`libraryRef`, `vqBlocksRef`, etc.) coerentes;
- falha de `localStorage` não deve derrubar a aplicação: use `safeStorage`.

## Regras de implementação que não podem ser quebradas

### Interações de questões

O clique de resposta deve:

1. atualizar a interface imediatamente;
2. adiar trabalho pesado até depois do primeiro frame;
3. persistir em background;
4. fazer rollback visual apenas se a gravação falhar.

Use `deferInteractionWork`. Não bloqueie o feedback esperando Firestore.

### Persistência

- Prefira patches pequenos de progresso.
- Passe dados pelo `cleanFirestoreData`.
- Não salve `undefined` no Firestore.
- Não regrave assunto/biblioteca inteiros por uma única resposta.
- Preserve merges defensivos para edições concorrentes e uso em vários dispositivos.
- Ao regenerar/remover questões, limpe ou pode referências de revisão relacionadas.

### Performance

- Não importe `agora_prompts.js` estaticamente.
- Mantenha telas/modais raros em lazy loading.
- Não transforme `FeatureContext` em desculpa para importar todo o monolito nos módulos.
- Não adicione dependência para algo já resolvido com utilitário pequeno.
- Respeite os limites em `scripts/build-budget.mjs`.
- Não faça a Home aguardar Biblioteca, curso e revisão.

### Segurança

- UI escondida não é autorização.
- Não amplie leitura de `users`.
- Não salve novos segredos no cliente ou Firestore.
- Toda nova coleção precisa de regra fechada.
- Operações administrativas destrutivas devem continuar exigindo confirmação explícita.
- `VITE_ADMIN_EMAIL` deve ser configurado em novos deploys; fallback é compatibilidade, não estratégia ideal.

### Escopo de mudanças

- Faça mudanças por fatias pequenas.
- Não misture redesign visual e mudança de persistência no mesmo patch.
- Não refatore várias áreas do `App.jsx` de uma só vez.
- Preserve alterações existentes no worktree.
- Antes de mover uma função, encontre todos os chamadores e efeitos.

## Onde mexer para cada pedido

| Pedido | Comece por |
| --- | --- |
| Home, atalhos ou metas | `features/home/HomeView.jsx`, `useCourseHeroJourney.js`, estado em `App.jsx` |
| Navegação/sidebar/mobile/back | seção de navegação e render final de `App.jsx`, `brand.css` |
| Biblioteca pessoal/pastas | `features/library/SubLibraryView.jsx` + helpers DB de `App.jsx` |
| Cartão ou experiência de questão | `features/questions/QuestionFeature.jsx` + handlers de `App.jsx` |
| Geração do Oráculo | `generateBatch` em `App.jsx` + `agora_prompts.js` |
| Academia | `AcademiaTopicView.jsx`, funções `generateAcademia*` e `ensureAcademiaOracle*` |
| Fábrica de Questões/banco compartilhado | `SharedLibraryView.jsx`, `features/question-factory/`, `questionMetadata*`, `useSharedLibrarySync.js`, serviços `sharedLibrary*` |
| Portal/ciclo/videoaulas | `features/course/`, `useCourseDerivedState.js`, `useCourseHeroJourney.js` |
| Questões do curso | `VideoQuestionsView.jsx`, `VqGenModal.jsx`, helpers `vq*` em `App.jsx` |
| Revisão espaçada | `SpacedReviewView.jsx`, `WorkflowModals.jsx`, `reviewQueue.js` |
| FAMED | `features/famed/`, `famedContent.js` e docs FAMED |
| Dúvida Rápida | `features/quick/` + handlers `createQuickSession` |
| Configurações/permissões | `SettingsView.jsx`, auth/whitelist em `App.jsx`, `firestore.rules` |
| Gemini/chaves/backend | `useGeminiRuntime.js`, `services/gemini.js`, `docs/GEMINI_BACKEND.md` |
| Exportação/Anki | `features/exporting/ExportModals.jsx` + helpers de exportação no `App.jsx` |
| Repetição/qualidade de questões | `features/admin/QuestionAuditReport.jsx`, `services/questionAudit.js` |
| Alunos e progresso do curso | `features/admin/CourseStudentsView.jsx`; somente admin, usando whitelist, `user_devices` e subcoleções individuais |
| Estilo visual/branding | `brand.css`, `BrandIdentity.jsx`, Tailwind e `public/brand/` |

## Débitos e armadilhas conhecidas

- `App.jsx` tem mais de 800 KB: buscas pontuais são melhores que leitura linear completa.
- Há dados e formatos legados; helpers frequentemente aceitam mais de uma forma.
- Nomes internos antigos nem sempre correspondem aos rótulos atuais (`library` é Home; Bizuário não é só um resumo).
- `FeatureContext` tem um contrato implícito muito grande, sem tipagem.
- O app não tem roteamento por URL.
- Alguns fluxos FAMED persistem progresso apenas localmente.
- O modo backend Gemini não cobre streaming nem chaves individuais por usuário.
- O e-mail admin existe tanto em configuração de frontend quanto nas regras; ao trocar, alinhe deploy, regras e testes.
- `famed_assets` guarda imagens compactadas dos pacotes de questões antigas; o campo `published` precisa acompanhar o conteúdo FAMED pai.
- Carregamento de PDF/DOCX injeta PDF.js e Mammoth a partir de CDN no navegador.
- A integração Anki depende de AnkiConnect local e das limitações de CORS do navegador.
- No Windows, algumas asserções de `scripts/unit-smoke.mjs` ainda presumem quebra de linha LF e podem falhar se `src/App.jsx` estiver em CRLF, mesmo sem alteração funcional.
- O README original do template é insuficiente; use este documento como visão principal do projeto.

## Checklist para uma IA antes de editar

1. Ler este arquivo inteiro.
2. Ler `docs/AI_WORKFLOW.md`.
3. Rodar `git status --short` e não apagar mudanças do usuário.
4. Localizar a tela, o handler e o serviço de persistência envolvidos.
5. Confirmar perfil de acesso afetado: admin, aluno com curso ou sem curso.
6. Confirmar se o dado é estrutural, progresso granular, cache ou apenas estado local.
7. Procurar compatibilidade legada e referências em testes.
8. Implementar a menor mudança coerente.
9. Rodar `npm run check`.
10. Se houver mudança visual relevante, executar o smoke UX quando possível.
11. Se houver dependência nova, executar `npm run audit:moderate`.
12. Atualizar este guia se arquitetura, coleção, permissão ou fluxo principal tiver mudado.

## Documentos complementares

- `docs/AI_WORKFLOW.md`: regras operacionais para alterações por IA.
- `docs/GEMINI_BACKEND.md`: contrato e riscos do backend opcional.
- `docs/FAMED_CONTENT_WORKFLOW.md`: produção e publicação FAMED.
- `docs/FAMED_S5_ORDEM_REFERENCIA.md`: escopo e ordem acadêmica de referência.
- `docs/LEARNING_ENGINE_ROADMAP.md`: decisões, fases e contratos da Fábrica, FSRS e banco de ECG.
- `docs/ECG_PACK_AUDIT.md`: auditoria técnica, clínica e de direitos do pacote ECG recebido.
- `docs/ECG_RIGHTS_DECLARATION.md`: confirmação do proprietário sobre origem própria, autorização e entrega pública dos traçados.
- `RELATORIO_MELHORIAS_PRODUTO.md`: relatório histórico de melhorias; use como contexto, não como fonte superior ao código atual.

## Modelo de pedido para economizar tokens

Depois que a IA ler este arquivo, o usuário pode pedir de forma curta:

> Contexto: use `AGENTS.md` como fonte inicial e confira a implementação atual.  
> Objetivo: [o que deve mudar].  
> Comportamento esperado: [resultado observável].  
> Restrições: [se houver].  
> Entrega: implemente, rode `npm run check` e diga quais arquivos mudou.

Não é necessário reexplicar autenticação, bibliotecas, FAMED, Gemini ou a arquitetura em todo chat, salvo quando o pedido pretende alterar justamente essas regras.
