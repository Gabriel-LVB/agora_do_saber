# Catálogo do curso para vínculos FAMED

O botão administrativo **Exportar aulas do curso** gera o catálogo efetivamente aplicado no Portal do Curso, em ordem, sem transcrições nem URLs.

O snapshot atual é `course-catalog.snapshot.json`, exportado em 1º de agosto de 2026, com 488 aulas. Os vínculos aprovados e os quatro itens deliberadamente não mapeados estão em `src/features/famed/famedCourseLessonMap.js`; a justificativa clínica de cada decisão está em `course-lesson-map.audit.md`.

Quando o catálogo mudar, substitua o snapshot somente depois de conferi-lo e atualize o mapa na mesma alteração. O aplicativo usa apenas IDs estáveis; não faça associação automática por palavras de títulos, tópicos ou descrições. Os testes verificam se todos os IDs do mapa existem no snapshot, se respeitam a matéria da FAMED e se cada aula do cronograma está classificada como vinculada ou deliberadamente não mapeada.

`course-clinical-priority.v3.json` é a fonte auditável do preset **Ordem de importância**. Suas unidades cobrem as 488 aulas exatamente uma vez, preservam aulas divididas em partes e registram pré-requisitos que os testes devem manter. A versão compactada usada no navegador fica em `src/services/courseClinicalPriority.js`.
