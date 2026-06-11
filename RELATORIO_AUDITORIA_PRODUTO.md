# Auditoria completa de produto, UX e engenharia

## Ágora do Saber

**Data da auditoria:** 11 de junho de 2026
**Escopo:** layout, navegação, fluxos, explicações, responsividade, acessibilidade, desempenho, confiabilidade, segurança, arquitetura e oportunidades de diferenciação.

---

## 1. Resumo executivo

O Ágora do Saber já tem uma base funcional muito acima de um MVP comum. O produto reúne geração de questões com IA, aulas, flashcards, clozes, simulados, caderno de erros, revisão espaçada, exportação, videoaulas, cronograma e métricas de estudo. A profundidade é o maior ativo do produto.

O principal problema não é falta de recursos. É que a capacidade existente ainda não é apresentada, organizada e protegida como um produto profissional. O usuário precisa compreender muitos nomes, modos, menus e configurações antes de perceber todo o valor. Ao mesmo tempo, a base técnica concentra quase toda a aplicação em um único arquivo, carrega muito código de uma vez e não possui a cobertura de testes, segurança, observabilidade e acessibilidade esperadas de uma plataforma educacional madura.

**Diagnóstico central:** hoje o produto impressiona pela quantidade de funções depois que a pessoa aprende a usá-lo. Para superar concorrentes, ele precisa impressionar pela clareza nos primeiros minutos, pela confiança durante o uso e pela sensação de que sempre sabe qual é o próximo passo.

### Nota geral estimada

| Área | Nota | Leitura |
|---|---:|---|
| Profundidade funcional | 8,5/10 | Muitos recursos valiosos e conectados |
| Clareza da entrada | 5,0/10 | Funciona para o grupo atual, mas pode orientar melhor |
| Onboarding e descoberta | 3,5/10 | Recursos dependem de aprendizado informal |
| Navegação e arquitetura da informação | 5,0/10 | Funciona, mas conceitos e caminhos competem entre si |
| Qualidade visual | 6,5/10 | Coerente e agradável, ainda com aparência de ferramenta interna |
| Responsividade | 6,5/10 | Há tratamento mobile, mas a densidade continua alta |
| Acessibilidade | 3,0/10 | Existem boas iniciativas pontuais, porém faltam fundamentos |
| Desempenho percebido | 4,5/10 | Entrada lenta e aplicação entregue em um pacote muito grande |
| Segurança e confiabilidade | 3,0/10 | Há riscos críticos envolvendo chaves, dados e dependências |
| Manutenibilidade | 2,5/10 | Arquivo principal de mais de 20 mil linhas e ausência de testes |
| Prontidão profissional | **5,1/10** | Produto potente, mas ainda precisa de fundação e polimento |

---

## 2. Como a auditoria foi feita

### Validado em execução

- Build de produção.
- Tela pública de autenticação em desktop e mobile.
- Ausência de overflow horizontal na tela pública em `1440x900` e `390x844`.
- Tempo de resposta do servidor local.
- Comportamento de carregamento e timeout da interface pública.
- Smoke test existente.
- Auditoria atual de dependências com `npm audit`.

### Validado por inspeção do código

- Todos os modos, telas, estados, integrações e fluxos autenticados.
- Navegação, tratamento de erros, persistência, chamadas ao Gemini e Firestore.
- Componentes, modais, formulários, atalhos, responsividade e estilos.
- Estratégia de segurança, testes e observabilidade.

### Limitação

Os fluxos autenticados dependem de uma conta Google presente na whitelist do Firestore. Por isso, eles foram auditados em profundidade pelo código, mas não foram percorridos visualmente com dados reais nesta rodada. Antes de um lançamento amplo, é necessário repetir a auditoria dinâmica com contas de aluno, aluno com curso e administrador.

---

## 3. O que o produto já faz bem

### Profundidade de estudo

- Integra aulas, questões, flashcards, clozes, simulados e revisão espaçada.
- Mantém caderno de erros, favoritos, progresso e metas diárias.
- Permite estudar em lista ou questão individual.
- Possui modos específicos para conteúdo rápido, acervo gerado, conteúdo externo e curso.
- Oferece exportação para Anki, PDF e Word.
- Traz geração em lote, auditoria de questões e regeneração configurável.

### Boas decisões de experiência

- Tema claro/escuro e escala de fonte configurável.
- Feedback por toast, skeletons, empty states e mensagens de carregamento.
- Confirmação para ações destrutivas.
- Navegação de retorno tratada, inclusive com botão voltar do navegador.
- Indicadores de progresso em várias áreas.
- Algumas ações importantes têm `aria-label`, foco visível e suporte a teclado.
- Há preocupação explícita com mobile em vários layouts.

### Identidade

- A identidade visual de “Ágora”, “Oráculo” e “Academia” é memorável.
- A paleta quente e a tipografia serifada ajudam a diferenciar o produto de dashboards genéricos.
- O tom de escrita tem personalidade.

Esses pontos devem ser preservados. A evolução ideal reduz atrito sem transformar o produto em mais uma plataforma educacional sem identidade.

---

## 4. Problemas críticos: corrigir antes de crescer

## P0. Segurança e confiabilidade

### 4.1 Chaves Gemini armazenadas em texto puro

As chaves gratuitas cadastradas pelos próprios usuários são enviadas diretamente pelo navegador ao Gemini e persistidas em `localStorage` e em documentos do usuário no Firestore. Isso aparece em `src/App.jsx:989`, `src/App.jsx:1019`, `src/App.jsx:9056` e `src/App.jsx:13010`.

**Risco:** qualquer XSS, extensão maliciosa, regra Firestore permissiva ou acesso ao dispositivo pode expor as chaves. O risco principal evitável é sincronizar as chaves com o Firestore.

**Recomendação:**

1. Preservar o modelo BYOK gratuito e as chamadas diretas ao Gemini.
2. Parar de sincronizar chaves Gemini com o Firestore; mantê-las somente no dispositivo.
3. Criar exportação/importação manual das preferências para troca de dispositivo.
4. Reforçar proteção contra XSS e evitar scripts externos desnecessários.
5. Implementar rotação, retry e limites no cliente sem depender de backend pago.

### 4.2 Autorização depende fortemente do cliente

A whitelist e as decisões de acesso são carregadas e aplicadas no cliente. As regras do Firestore não estão versionadas no repositório, então não é possível confirmar se o backend impede acessos indevidos.

**Risco:** esconder uma tela no React não protege dados. Toda autorização precisa ser garantida nas regras/servidor.

**Recomendação:** versionar e testar `firestore.rules`, usar custom claims para papéis e criar testes automatizados de permissão.

### 4.3 Dependências com vulnerabilidades conhecidas

Em 11 de junho de 2026, `npm audit --omit=dev` encontrou:

- 1 vulnerabilidade crítica em `protobufjs`.
- 1 vulnerabilidade alta em `@grpc/grpc-js`.
- 1 vulnerabilidade moderada em `@protobufjs/utf8`.

Todas indicaram correção disponível.

**Recomendação:** atualizar dependências imediatamente, rodar auditoria no CI e bloquear deploy em vulnerabilidades críticas/altas.

---

## 5. Entrada e onboarding

### 5.1 A entrada pode orientar melhor o grupo atual

A tela pública mostra apenas logo, “Acesse sua conta” e “Entrar com Google”. Como o produto é privado e usado por amigos convidados, ela não precisa funcionar como landing page ou captar novos usuários. Ainda assim, pode responder rapidamente:

- Estou no site certo?
- Qual conta devo usar?
- O que fazer se meu acesso for negado?
- Onde pedir ajuda ao Gabriel?

**Impacto:** reduz mensagens de suporte e confusão no primeiro acesso.

**Recomendação:** manter a entrada enxuta e adicionar:

- Subtítulo curto explicando que é a plataforma privada de estudos do grupo.
- Instrução para usar a conta autorizada.
- Contato simples em caso de acesso negado.
- Identificação visual clara da versão 2.0 enquanto ela estiver em testes.

### 5.2 Falta onboarding guiado

Depois do login, o produto apresenta muitos ambientes e nomes próprios. Não existe um fluxo guiado que leve ao primeiro resultado.

**Recomendação:** onboarding progressivo:

1. Perguntar objetivo: prova, residência, faculdade ou revisão.
2. Perguntar fonte principal: material próprio, curso ou geração rápida.
3. Criar a primeira sessão em menos de 2 minutos.
4. Mostrar apenas as próximas ações relevantes.
5. Revelar recursos avançados depois que o usuário obtiver valor.

### 5.3 Cadastro da chave Gemini precisa ser mais claro

O modelo BYOK é adequado ao projeto porque mantém o uso gratuito e cada usuário administra sua própria cota. O problema atual é a experiência de configuração e recuperação.

**Recomendação:** criar um assistente curto para cadastrar, testar, nomear e trocar chaves; explicar limites gratuitos; manter as chaves somente no dispositivo; e mostrar claramente quando uma cota acabou.

---

## 6. Arquitetura da informação e navegação

### 6.1 Muitos modelos mentais competem

O usuário precisa diferenciar “Acervo do Oráculo”, “Academia do Saber”, “Centelha do Saber”, “Acervo Externo”, “Portal do Curso”, “Caderno de erros”, “Favoritos” e “Revisão espaçada”.

Os nomes têm personalidade, mas não deixam a finalidade imediatamente óbvia.

**Recomendação:** manter os nomes como marca secundária e usar rótulos funcionais como principal:

- **Criar questões** — Oráculo
- **Criar aula completa** — Academia
- **Estudo rápido** — Centelha
- **Meus materiais**
- **Meu curso**
- **Revisar erros**
- **Revisão espaçada**

### 6.2 Navegação depende de estado, não de URLs reais

O botão voltar é simulado com `history.pushState`, mas a URL não representa a tela atual (`src/App.jsx:7897`). Não há links profundos compartilháveis, favoritos do navegador ou restauração robusta após recarregar.

**Recomendação:** adotar roteamento real:

```text
/inicio
/biblioteca/:acervo
/assunto/:subjectId
/topico/:topicId
/curso/aula/:lessonId
/revisao
/configuracoes
```

### 6.3 Falta busca global

Com muitos assuntos, tópicos, aulas e questões, navegar apenas por árvores, pastas e cartões não escala.

**Recomendação:** busca global com atalho, filtros e ações rápidas. Deve encontrar aulas, questões, assuntos, favoritos e erros.

### 6.4 Ações importantes ficam escondidas

Muitos recursos aparecem em menus de três pontos, hover, configurações ou dentro de um contexto específico.

**Recomendação:** definir uma ação primária por tela, até três ações secundárias visíveis e mover o restante para “Mais ações”. Em mobile, nunca depender de hover.

### 6.5 Falta um “Hoje” realmente orientador

A home exibe progresso diário, mas pode se tornar o centro de decisão do aluno.

**Recomendação:** criar um painel “Estudar agora” com:

- Próxima aula.
- Revisões vencidas.
- Erros recentes.
- Meta diária restante.
- Sessão recomendada de 15, 30 ou 60 minutos.
- Botão único para continuar de onde parou.

---

## 7. Fluxos de criação e IA

### 7.1 Configuração demais antes do valor

O produto oferece muitas escolhas: quantidade, estilo, tipos, alternativas, thinking, foco, estrutura, revisão e regeneração.

**Impacto:** poder para usuários avançados, ansiedade para iniciantes.

**Recomendação:** oferecer três presets:

- **Rápido:** melhores padrões, poucas perguntas.
- **Completo:** cobertura ampla.
- **Personalizado:** todas as opções atuais.

### 7.2 Tempos longos sem controle suficiente

As chamadas têm timeout de `55s` e streams de até `120s`. Há mensagens e contagem parcial, mas o usuário não tem cancelamento real, estimativa confiável, execução em segundo plano ou retomada.

**Recomendação:**

- Mostrar etapas: enviando, estruturando, gerando, auditando e salvando.
- Exibir estimativa e quantidade de chamadas antes de começar.
- Permitir cancelar, sair da tela e receber notificação quando terminar.
- Salvar resultados parciais.
- Persistir o estado local da geração e implementar retry no cliente.

### 7.3 Falhas silenciosas

Há vários blocos `catch(e) {}` e operações Firestore que apenas enviam erro ao console. O usuário pode acreditar que algo foi salvo quando não foi.

**Recomendação:** estado de sincronização visível: “salvo”, “salvando”, “offline” ou “erro ao sincronizar”, com retry.

### 7.4 Falta rastreabilidade do conteúdo gerado

Não está claro para o usuário qual material originou cada resposta, qual prompt/modelo foi usado e quando ocorreu a geração.

**Recomendação:** painel de proveniência por conteúdo:

- Material de origem.
- Data de geração.
- Modelo e configurações.
- Histórico de versões.
- Reportes/correções.

---

## 8. Layout e qualidade visual

### O que funciona

- Paleta coerente e reconhecível.
- Cartões, bordas e espaços seguem um padrão razoável.
- Tema escuro parece ser uma consideração real, não um extra.
- Estados de loading e vazio já possuem componentes reutilizáveis.

### O que reduz a percepção profissional

- Muitas telas são visualmente densas e usam cartões dentro de cartões.
- Há excesso de tamanhos pequenos, textos em caixa alta e opacidade baixa.
- Cores diferentes representam muitos tipos de ação sem uma semântica global clara.
- Ícones e emojis convivem sem uma regra consistente.
- A identidade visual não possui um sistema documentado de componentes e tokens.
- A tela pública parece isolada do visual mais rico da aplicação.

### Recomendação de sistema visual

Criar um design system simples com:

- Escala tipográfica com no mínimo `16px` para texto principal.
- Tokens de cor semânticos: primário, sucesso, alerta, erro, informação.
- Componentes oficiais para botão, campo, modal, card, menu, tooltip e tabela.
- Regras de densidade para desktop e mobile.
- Padrão de ícones único.
- Contraste WCAG AA.
- Biblioteca visual documentada em Storybook.

---

## 9. Mobile e responsividade

### Pontos positivos

- A tela pública encaixa bem em `390x844`.
- Não foi detectado overflow horizontal na entrada.
- Existem layouts específicos, menus móveis e uso de `100dvh`.
- Ações de imagens são mantidas visíveis no mobile.

### Problemas prováveis nos fluxos autenticados

- A densidade funcional é alta para telas pequenas.
- Arrastar pastas/assuntos por touch é uma interação difícil e pouco descobrível.
- Muitos modais usam grandes quantidades de conteúdo e rolagem interna.
- Alvos de toque de `32px` aparecem em diversos pontos; o ideal é pelo menos `44px`.
- Algumas tabelas e menus dependem de rolagem horizontal ou truncamento.
- Ações avançadas competem com a tarefa principal.

### Recomendação

- Tratar mobile como modo de estudo e consumo prioritário.
- Deixar criação e administração avançada progressivamente recolhidas.
- Usar navegação inferior com 4 destinos: Hoje, Biblioteca, Revisar e Perfil.
- Trocar drag-and-drop mobile por “Mover para...” explícito.
- Usar bottom sheets semânticos e com foco controlado.
- Testar em `320px`, `390px`, `768px` e com fonte a `200%`.

---

## 10. Acessibilidade

### Achados objetivos

- O documento declara `lang="en"` apesar de o conteúdo estar em português (`index.html`).
- Existem aproximadamente `364` botões e apenas `45` ocorrências explícitas de `aria-label`.
- Há `44` inputs e `15` textareas, mas apenas `48` elementos `label` no arquivo inteiro.
- Nenhum modal usa `role="dialog"` ou `aria-modal`.
- Não há gerenciamento consistente de foco, focus trap ou retorno de foco.
- Várias interações dependem de `div onClick`, hover, opacidade ou drag.
- O CSS de redução de movimento existe, o que é positivo.

### Recomendação prioritária

1. Corrigir idioma para `pt-BR`.
2. Dar nome acessível a todos os controles.
3. Associar labels reais a campos.
4. Criar componente de modal acessível com foco, Escape e `aria-modal`.
5. Garantir navegação completa por teclado.
6. Testar contraste, zoom de 200% e leitores de tela.
7. Adicionar testes automáticos com Axe.

---

## 11. Desempenho e tempo de resposta

### Medições

- HTML local: aproximadamente `5ms`.
- Arquivo `App.jsx` transformado no modo desenvolvimento: aproximadamente `5,9 MB`.
- Bundle principal de produção: aproximadamente `816 KB` minificado, `214 KB` gzip.
- O build alerta que o chunk principal ultrapassa `500 KB`.
- A primeira navegação do smoke test não atingiu `domcontentloaded` dentro do limite de `8s`.
- Em uma segunda inspeção, após o servidor de desenvolvimento estar aquecido, a navegação iniciou imediatamente e a tela pública foi renderizada sem erros visíveis.

### Causas principais

- `src/App.jsx` possui cerca de `20.063` linhas e `1,2 MB`.
- Todas as áreas do produto são importadas e processadas juntas.
- Não há lazy loading por rota/feature.
- Firebase, exportadores, parsers e funções administrativas convivem no mesmo módulo.
- PDF.js e Mammoth são carregados de CDN em tempo de execução, sem estratégia clara de integridade/fallback.

### Recomendação

- Dividir por domínio: auth, biblioteca, criação, estudo, revisão, curso e admin.
- Lazy load de rotas e modais pesados.
- Carregar ferramentas de exportação/importação apenas quando usadas.
- Medir Core Web Vitals em produção.
- Definir orçamento: entrada pública abaixo de `150 KB` gzip e interação inicial abaixo de `2,5s` em mobile médio.
- Criar skeleton imediato enquanto autenticação e permissões carregam em paralelo.
- Evitar bloquear a entrada pública aguardando leituras do Firestore.

---

## 12. Arquitetura e qualidade de engenharia

### 12.1 Componente principal excessivamente grande

`src/App.jsx` possui cerca de `20 mil` linhas e concentra interface, domínio, API, persistência, autorização, exportação, parsing e administração.

**Impacto:** qualquer mudança tem alto risco de regressão, revisão difícil e desenvolvimento lento.

### 12.2 Ausência de testes

O projeto possui apenas um smoke test visual básico. Não há testes unitários, de integração, de acessibilidade ou end-to-end dos fluxos essenciais.

**Recomendação mínima:**

- Unitários para parsers, revisão espaçada, permissões e prompts.
- Integração para Firestore e persistência.
- E2E para login, criar conteúdo, responder, revisar e exportar.
- Testes de regras Firestore.
- Screenshots de regressão em desktop/mobile.

### 12.3 Stack envelhecida

O projeto usa React 17, Vite 2 e Tailwind 2. Isso aumenta dívida técnica, reduz acesso a melhorias recentes e torna atualizações futuras mais arriscadas.

**Recomendação:** modernizar de forma incremental depois de criar testes e separar módulos.

### 12.4 Falta observabilidade

Não há Error Boundary, monitoramento de erros, analytics de produto, Web Vitals ou rastreamento de operações de IA.

**Recomendação:**

- Error Boundary com tela recuperável.
- Sentry ou equivalente.
- Eventos de funil e retenção.
- Logs estruturados de geração.
- Painel de latência, falhas, custo e qualidade.

### 12.5 Documentação insuficiente

O README ainda descreve o template Vite original e não explica arquitetura, configuração, deploy, segurança ou fluxos.

**Recomendação:** criar documentação real do produto, setup, ambientes, dados, papéis, deploy e runbooks.

---

## 13. Oportunidades para superar concorrentes

Mais recursos isolados não serão o melhor diferencial. O diferencial forte é transformar toda a profundidade atual em um **sistema de estudo que decide junto com o aluno**.

### 13.1 Tutor adaptativo de verdade

Criar uma fila inteligente que combine:

- Conteúdo novo.
- Revisões vencidas.
- Questões erradas.
- Fraquezas por tema.
- Tempo disponível hoje.
- Proximidade da prova.

O usuário escolhe “Tenho 30 minutos” e o produto monta a melhor sessão possível.

### 13.2 Mapa de domínio

Mostrar domínio por assunto e subtópico, não apenas contagem de respostas:

- Nunca estudado.
- Em aprendizado.
- Instável.
- Dominado.
- Em risco de esquecimento.

### 13.3 Explicações mais úteis

Cada explicação pode ter:

- Resposta curta.
- Raciocínio passo a passo.
- Por que as alternativas estão erradas.
- “O que faria essa resposta mudar?”
- Questão irmã para confirmar domínio.

### 13.4 Experiência contínua

O usuário deve sempre poder:

- Continuar exatamente de onde parou.
- Trocar de dispositivo sem perder estado.
- Estudar offline.
- Receber uma sessão recomendada.
- Ver claramente o impacto do estudo de hoje.

---

## 14. Roadmap recomendado

## Fase 1: estabilizar e profissionalizar, 0 a 30 dias

- Corrigir vulnerabilidades npm.
- Parar de sincronizar chaves Gemini com o Firestore e preservar BYOK local.
- Versionar e testar regras Firestore.
- Corrigir `lang`, modais e acessibilidade básica.
- Criar Error Boundary e monitoramento de erros.
- Identificar claramente o ambiente 2.0 privado.
- Corrigir smoke test e criar E2E de login.
- Documentar arquitetura e setup.

## Fase 2: reduzir atrito, 30 a 60 dias

- Criar onboarding guiado e primeira sessão rápida.
- Simplificar nomes e navegação.
- Criar painel “Hoje / Estudar agora”.
- Implementar busca global.
- Criar presets Rápido, Completo e Personalizado.
- Exibir sincronização, progresso de geração, cancelamento e retry.
- Adotar rotas reais e links profundos.

## Fase 3: melhorar velocidade e manutenção, 60 a 90 dias

- Separar `App.jsx` por domínios.
- Adicionar lazy loading e reduzir bundle.
- Criar design system e Storybook.
- Ampliar testes unitários, integração, E2E e acessibilidade.
- Atualizar React/Vite/Tailwind com segurança.
- Melhorar fila, retomada e observabilidade das chamadas diretas ao Gemini.

## Fase 4: criar vantagem competitiva, 90 a 180 dias

- Tutor adaptativo por tempo disponível.
- Mapa de domínio por subtópico.
- Sessões recomendadas e retenção inteligente.
- Modo offline/PWA.

---

## 15. Ganhos rápidos de alto impacto

Estas mudanças têm boa relação impacto/esforço:

1. Identificar claramente a Ágora 2.0 e orientar contas autorizadas na entrada.
2. Corrigir `lang="pt-BR"`.
3. Adicionar “Continuar estudando” como CTA principal da home.
4. Renomear ambientes com rótulo funcional + nome de marca.
5. Criar busca global simples.
6. Exibir status “salvando/salvo/erro”.
7. Remover ações administrativas da experiência normal.
8. Padronizar modais e botões.
9. Corrigir vulnerabilidades e documentar segurança.
10. Parar de salvar chaves Gemini no Firestore.

---

## 16. Métricas que devem orientar a evolução

### Ativação

- Tempo até o primeiro conteúdo útil.
- Percentual que completa a primeira sessão.
- Abandono por etapa do criador.

### Engajamento

- Sessões de estudo por semana.
- Questões respondidas por sessão.
- Revisões concluídas no prazo.
- Percentual que usa “Continuar estudando”.

### Qualidade

- Taxa de questões reportadas.
- Taxa de geração/regeneração.
- Falhas por operação de IA.
- Tempo médio e p95 de geração.

### Retenção e aprendizado

- Retenção D1, D7 e D30.
- Evolução de acerto por subtópico.
- Redução de erros repetidos.
- Tempo até domínio.

---

## 17. Critério de “produto profissional”

O site estará pronto para causar uma impressão realmente profissional quando:

- Um novo usuário entender o valor em menos de 10 segundos.
- Conseguir iniciar a primeira sessão em menos de 2 minutos.
- Nunca ficar em dúvida sobre o próximo passo.
- Nunca perder conteúdo ou progresso silenciosamente.
- Conseguir usar os fluxos principais apenas com teclado e leitor de tela.
- A entrada interativa ocorrer em menos de 2,5 segundos em mobile médio.
- Chaves Gemini não forem sincronizadas com o Firestore.
- Fluxos críticos tiverem testes automatizados.
- Conteúdo médico tiver proveniência e mecanismo de correção.
- A equipe conseguir evoluir uma área sem editar um arquivo de 20 mil linhas.

---

## Conclusão

O Ágora do Saber não precisa de uma explosão de novas funcionalidades. Ele precisa tornar evidente, confiável e simples o poder que já possui.

A rota para “moggar” a concorrência é combinar três coisas que raramente aparecem juntas: **profundidade de estudo**, **orientação adaptativa** e **confiança verificável**. A base funcional já aponta nessa direção. O próximo salto vem de simplificar a experiência, proteger a plataforma e transformar qualidade em parte visível da marca.
