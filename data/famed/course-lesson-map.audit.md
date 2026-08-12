# Auditoria dos vínculos FAMED → Portal do Curso

Fonte das videoaulas: `course-catalog.snapshot.json`, exportado em 1º de agosto de 2026, com 488 aulas. A grade FAMED é a da turma 2026.2. Os vínculos são manuais; a interface sempre reaplica `courseIndex`.

## Cardiologia

| Aula FAMED | Videoaulas vinculadas | Decisão |
| --- | --- | --- |
| Estratificação de risco cardiovascular | — | Dislipidemia apenas introduz o risco e não substitui a estratificação completa |
| Hipertensão arterial sistêmica | Diagnóstico e classificação; Hipertensão secundária; Crise hipertensiva | Cobertura direta |
| Dor torácica na emergência | — | Não existe aula dedicada à abordagem diferencial da dor torácica |
| Síndrome coronariana crônica | Síndromes Coronarianas Crônicas e Agudas | Cobertura direta da parte crônica |
| SCA com supra de ST | Oclusão e Suboclusão Coronariana | A mesma videoaula cobre com e sem supra |
| SCA sem supra de ST | Oclusão e Suboclusão Coronariana | Mesma decisão acima |
| Valvopatias e endocardite | Cinco aulas de valvopatias; Endocardite Infecciosa | Cobertura direta dos dois componentes; Endocardite vem de Infectologia |
| Abordagem da síncope | — | Menções dentro de Estenose Aórtica não substituem uma aula de abordagem da síncope |
| IC crônica e miocardiopatias | Duas aulas de IC crônica; Dilatada; Restritiva; Takotsubo; Hipertrófica | Cobertura direta da aula combinada |
| IC aguda | Perfis Hemodinâmicos e Tratamento — Partes 1 e 2 | Cobertura direta |

## Pneumologia

| Aula FAMED | Videoaulas vinculadas | Decisão |
| --- | --- | --- |
| Asma e DPOC | Noções de Espirometria e Asma; DPOC | Cobertura direta |
| Tuberculose | História natural; Clínica e diagnóstico; Extrapulmonar; Tratamento; Controle no Brasil | Trilha completa |
| Pneumopatias intersticiais e espirometria | Noções de Espirometria e Asma; Pneumopatias Intersticiais Difusas | Cobertura dos dois componentes |
| Pneumonias e TEP | Pneumonia comunitária/hospitalar; Pneumonia hospitalar; TEP e TVP | Cobertura direta |
| Tomografia do tórax | — | Não há aula dedicada à interpretação de tomografia torácica |
| Neoplasia de pulmão e nódulo | Nódulo Pulmonar Solitário; Câncer de Pulmão | Cobertura direta |
| Doenças da pleura | Derrame Pleural | Cobertura diretamente dedicada à pleura |

## ABS da Gestante e do RN

| Aula FAMED | Videoaulas vinculadas | Decisão |
| --- | --- | --- |
| Alojamento conjunto e semiologia neonatal | Classificação do RN; Exame Físico Neonatal | Cobertura direta da avaliação/semiologia neonatal |
| Comunicação, direitos e introdução à gestante | — | Não há equivalente direto |
| Aleitamento materno | Definições e composição; Aspectos práticos; Queixas e contraindicações | Trilha direta de Pediatria |
| Desenvolvimento emocional na primeiríssima infância | — | Desenvolvimento neuropsicomotor não substitui o foco emocional |
| Modificações maternas e intercorrências | Modificações Fisiológicas; Outras Doenças Intercorrentes | Cobertura direta dos dois componentes |
| Semiologia obstétrica e pré-natal | Diagnóstico de Gravidez; Assistência Pré-Natal | Correspondência direta |
| Parto eutócico e partograma | Introdução ao parto; Trajeto/estática; Contração; Mecanismo; Fases clínicas/assistência | Trilha direta de assistência ao parto |
| Malformações comuns no RN | Doenças do Trato Gastrointestinal Neonatal | Cobertura direta, porém parcial, de malformações gastrointestinais |
| Puerpério normal e patológico | Puerpério: Fisiológico, Complicações e Hemorragia | Correspondência direta |
| Infecções na gestante | — | Não há aula geral equivalente |
| Infecções congênitas no RN | Rubéola e Toxoplasmose Congênitas | Cobertura direta, embora não esgote o tema |
| Triagem neonatal | Triagem Neonatal | Correspondência exata |
| Morbimortalidade materna e perinatal | — | Indicadores gerais de mortalidade não substituem a aula da ABS |
| HIV na gestante e no RN | HIV e Gestação — Partes 1 e 2; Exposição Perinatal; Transmissão Vertical | Cobertura direta interdisciplinar |
| Sífilis perinatal | — | Úlceras genitais aborda sífilis geral, mas não o manejo materno-neonatal |

## Conteúdo anterior preservado

Os vínculos antigos de Cardiomiopatias e Pericardiopatias permanecem em `legacyLinks`. Eles só aparecem na seção **Materiais preservados** quando o respectivo conteúdo FAMED existe. Cirurgia cardíaca e Cardiopatias congênitas também preservam seus conteúdos antigos, mas não têm atalho direto no catálogo.

## Regras

- Nenhum vínculo é inferido em tempo de execução por título ou descrição.
- Outra matéria do curso só pode ser usada quando cobre diretamente o conteúdo interdisciplinar, nunca como substituto vago.
- A ausência de vínculo não produz uma mensagem afirmando que o curso não possui o assunto.
- Testes conferem existência dos UUIDs, matérias permitidas por item e ordem no catálogo.
