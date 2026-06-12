# Ágora 2.0: plano mestre

## Objetivo

Construir a Ágora 2.0 em paralelo, acessível apenas ao Gabriel durante o desenvolvimento, sem quebrar ou alterar o site atual. A versão atual continua saindo da branch `main`; todo o trabalho da 2.0 acontece na branch `agora-2.0` e em um projeto Vercel separado.

## Restrições assumidas

- Firebase no plano gratuito Spark.
- Vercel no plano gratuito.
- Cada usuário cadastra suas próprias chaves gratuitas do Gemini.
- Não há objetivo de captar novos usuários.
- Privacidade institucional e auditoria automática de questões não são prioridades agora.
- Mudanças incompletas não podem chegar aos usuários atuais.

## Decisão de isolamento

### Código

- Produção atual: branch `main`.
- Desenvolvimento 2.0: branch `agora-2.0`.
- Projeto Vercel atual continua ligado à `main`.
- Novo projeto Vercel deve ser ligado somente à `agora-2.0`.

### Dados

Usar **outro projeto Firebase gratuito** para a 2.0 durante o desenvolvimento.

Isso evita que uma mudança de formato, exclusão ou teste da 2.0 altere dados usados pelo site atual. A 2.0 começa com dados de teste. A migração dos dados reais acontece somente perto do lançamento.

### Chaves Gemini

Manter BYOK: chamadas diretas do navegador para o Gemini usando as chaves gratuitas de cada usuário.

Na 2.0, as chaves continuam sincronizadas automaticamente pelo Firestore. Depois do cadastro, elas devem estar disponíveis em qualquer dispositivo no qual o usuário entrar.

## Limites dos planos gratuitos

### Firestore Spark

- Evitar listeners globais e leituras repetidas.
- Paginar listas administrativas.
- Salvar alterações em lote e com debounce.
- Não registrar presença a cada minuto sem necessidade.
- Não duplicar grandes objetos em várias coleções.
- Medir leituras e escritas por fluxo antes do lançamento.

### Gemini gratuito

- Não prometer tempo fixo de geração.
- Detectar cota esgotada e alternar chave quando configurado.
- Mostrar quantas chamadas uma operação provavelmente fará.
- Salvar resultados parciais e permitir retry.
- Evitar auditorias ou chamadas duplicadas automáticas.

### Vercel gratuito

- Manter a aplicação estática sempre que possível.
- Evitar depender de funções serverless para o fluxo principal.
- Dividir o bundle e carregar recursos pesados sob demanda.

## Estratégia de implementação

### Regra principal

Cada etapa precisa terminar em um estado utilizável dentro do ambiente 2.0. Funcionalidades incompletas ficam escondidas por feature flags e nunca entram no fluxo principal.

### Fase 0: fundação isolada

- Branch `agora-2.0`.
- Projeto Vercel separado.
- Projeto Firebase separado.
- Configuração Firebase por variáveis de ambiente.
- Identificação visual “Ágora 2.0 - ambiente privado”.
- Error Boundary e smoke test confiável.

### Fase 1: organização técnica

- Separar autenticação e configuração Firebase.
- Separar shell, navegação e telas principais.
- Criar camada única para Firestore.
- Criar camada única para Gemini/BYOK.
- Preservar e testar a sincronização automática das chaves Gemini.
- Adicionar testes dos fluxos atuais antes de grandes mudanças.

### Fase 2: experiência principal

- Home “Hoje” com continuar estudando.
- Navegação simplificada.
- Busca global local.
- Status de sincronização.
- Presets de geração.
- Melhorias mobile e acessibilidade.

### Fase 3: diferenciais

- Sessões recomendadas por tempo disponível.
- Mapa de domínio.
- Retomada de gerações.
- Modo offline parcial.

### Fase 4: lançamento

- Congelar alterações estruturais.
- Migrar uma cópia dos dados reais para o Firebase 2.0.
- Testar com Gabriel.
- Testar com poucos amigos.
- Corrigir regressões.
- Trocar o domínio/projeto de produção somente após aprovação.

## Feature flags

Usar flags simples para recursos ainda não prontos:

```text
VITE_FEATURE_GLOBAL_SEARCH
VITE_FEATURE_NEW_NAVIGATION
```

Flags devem ocultar completamente fluxos incompletos, não apenas desabilitar botões.

## Critérios para lançar a 2.0

- Nenhuma escrita da 2.0 alcança o Firebase atual durante desenvolvimento.
- Login, biblioteca, geração, resposta, progresso e revisão funcionam.
- Dados reais foram migrados e conferidos.
- Não há vulnerabilidade crítica conhecida.
- Fluxos principais passam em desktop e mobile.
- Chaves Gemini cadastradas são recuperadas corretamente em outros dispositivos.
- Existe caminho simples para voltar à versão anterior durante o lançamento.

## Ordem recomendada das próximas entregas

1. Criar Firebase e Vercel privados.
2. Confirmar login isolado.
3. Criar testes de proteção dos fluxos atuais.
4. Separar o `App.jsx` gradualmente.
5. Construir a nova navegação e home.
6. Melhorar criação, estudo e revisão uma área por vez.
