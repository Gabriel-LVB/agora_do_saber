# Associação automática de ECGs às questões

> Implementação vigente: `agora-ecg-question-matching-v2`.

O vínculo não exige curadoria manual. Ele usa os 150 casos próprios já importados, a ontologia técnica em `data/ecg/staging/v3/globals/concepts.json` e a matriz caso–conceito em `case-concept-matrix.json`.

## Fluxo

1. `npm run build:ecg-question-index` gera `public/ecg/v3/question-match-index.json`.
2. O índice contém somente IDs, ontologia, relações conceituais e o ECG principal da fase de pergunta. Respostas, diagnóstico do caso, achados e conduta não entram no objeto anexado à questão.
3. Ao carregar `vq_blocks`, `services/ecgQuestionMatcher.js` identifica questões que realmente pedem leitura de um ECG. Perguntas teóricas sobre como analisar um ECG não são tratadas como dependentes de imagem; é necessário haver um comando direto de interpretação ou uma referência concreta ao traçado apresentado.
4. A resposta correta ou resposta esperada é a evidência principal. Explicação e enunciado servem apenas como evidência secundária. Distratores nunca escolhem o traçado.
5. Termos normalizados são comparados à ontologia; o caso é escolhido entre relações estruturadas do conceito. A distribuição entre casos equivalentes é determinística e evita repetição enquanto houver alternativas.
6. O resultado é acrescentado a `question.images`, que já é consumido por Questões do Curso e Revisões.

## Segurança pedagógica

- Não existe associação por semelhança vaga, embeddings ou sorteio.
- Um `ecgAssetId` explícito, quando existir, vence a inferência.
- Correspondência ambígua ou abaixo do limiar vira `ecgMatch.status = 'unresolved'`.
- Uma questão que exige ECG e está sem imagem fica em `adaptiveState = 'awaiting-visual'`, com `dueDate = null`; não aparece nem conta como pendência.
- Somente a imagem ECG principal com `phase = 'question'` pode ser anexada. Imagens de resposta e campos clínicos do caso não são copiados.
- Imagens que já pertencem à questão são preservadas e não recebem duplicatas.

## Persistência e atualização

A associação é uma projeção derivada e versionada. Ela atualiza o estado e o cache local de `vq_blocks`, sem regravar o banco compartilhado ou criar uma migração destrutiva. Quando a versão publicada da aula muda, a projeção é recalculada. A reconciliação da revisão copia a questão enriquecida para o cartão e reativa automaticamente um item que estava em `awaiting-visual`.

O progresso do curso prático de ECG continua independente, hoje em `agora_ecg_practical_progress_v1`. Integrá-lo ao FSRS é outra etapa e não deve ser confundido com mostrar ECGs nas questões do curso.

## Validação

`npm run validate:ecg-staging` verifica os 150 vínculos do índice contra o dataset e a matriz canônicos, exige conceito primário, confere a URL do ECG principal e rejeita campos capazes de revelar o gabarito no registro de cada caso. Os testes unitários cobrem correspondência, diversificação, preservação de imagem, ausência de vazamento e estacionamento seguro da revisão.
