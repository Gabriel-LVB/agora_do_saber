# Produção de conteúdo FAMED pela Academia

A área FAMED usa o PPC 2018 e contempla somente S5, S6, S7 e S8. O foco atual é S5 Cardio/Pneumo. A ordem exibida veio da turma anterior e serve apenas como referência; datas, horários, professores, segundas chamadas e AFs não entram no site.

## Fluxo atual

O conteúdo é criado dentro do site usando exatamente o mesmo fluxo da Academia. A FAMED não possui um editor paralelo. O destino dos dados é diferente: uma Academia iniciada pelo cronograma é salva no acervo compartilhado `famed_content`, e não na biblioteca pessoal do administrador.

1. Entre em **FAMED → S5**.
2. Na aula desejada, clique em **Criar**.
3. Preencha tema e materiais no criador normal da Academia.
4. Escolha formato da aula, profundidade e configurações das questões de fixação.
5. Gere e revise a estrutura.
6. Confirme para voltar à FAMED.
7. Abra os tópicos e use os mesmos controles da Academia para gerar ou regenerar aula, fixação e baterias extras.
8. Publique para os alunos somente depois de conferir todas as aulas, gabaritos e explicações.

Enquanto estiver em preparação, o conteúdo fica como rascunho e aparece apenas para o administrador. **Refazer estrutura** reabre o criador da Academia para aquela aula do cronograma. **Apagar tudo** remove a estrutura, as aulas e as questões vinculadas.

O administrador também pode remover o conteúdo diretamente no card pelo ícone de lixeira ao lado do estado de publicação. Essa ação apaga somente o documento e a Academia da FAMED; preserva integralmente as videoaulas do Portal do Curso e mantém o item do cronograma disponível para uma criação futura.

Não há ZIP, importador externo, script de banco nem dependência do Firebase Storage nesse fluxo.

## Vínculo com as aulas do curso

Os atalhos exibidos nos cards da FAMED não são inferidos pelo título ou pela descrição das videoaulas. Cada item do cronograma só mostra aulas explicitamente ligadas por IDs estáveis em `src/features/famed/famedCourseLessonMap.js`, sempre na ordem efetiva do Portal do Curso (`courseIndex`).

O administrador pode usar **Exportar aulas do curso** no topo da lista. O JSON contém a ordem aplicada, matéria, tópico, títulos, duração e IDs estáveis, mas deliberadamente não inclui transcrições nem URLs. O snapshot conferido fica em `data/famed/course-catalog.snapshot.json`, e os vínculos aprovados ficam no mapa versionado do projeto. Se ainda não houver vínculo curado, o aluno não recebe uma conclusão automática de que o curso não cobre aquele assunto.

O snapshot de 1º de agosto de 2026 contém 488 aulas. A curadoria atual cobre diretamente 15 dos 19 itens de aula do cronograma FAMED. Quatro permanecem conscientemente sem substituto aproximado: estratificação de risco cardiovascular, cirurgia cardíaca, cardiopatias congênitas e tomografia do tórax. Esse estado está registrado em `FAMED_COURSE_LESSON_MAP.unmapped` e deve ser revisto quando o catálogo ganhar novas aulas.

## Regras editoriais

- A aula deve ser fluida, em parágrafos conectados e numa sequência didática clara.
- Questões diretas devem ter alvo estreito e resposta inequívoca.
- Casos clínicos devem conter apenas dados úteis para a decisão cobrada.
- Em sequências clínicas, reutilize exatamente o mesmo caso compartilhado; o site o mostrará uma única vez antes das questões visíveis.
- Distratores devem partir da correta e alterar um componente decisivo. Preserve algum núcleo verdadeiro ou plausível, mas garanta que apenas uma alternativa seja integralmente correta.
- A explicação deve justificar a correta e apontar o erro conceitual de cada distrator.

## Escopo posterior

S6–S8 continuam visíveis, mas desativados até a definição de seus cronogramas. Não há produção planejada para S1–S4 nem para o internato.
