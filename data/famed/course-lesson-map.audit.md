# Auditoria dos vínculos FAMED → Portal do Curso

Fonte: `course-catalog.snapshot.json`, exportado em 1º de agosto de 2026. A ordem abaixo segue o cronograma FAMED; dentro de cada vínculo, a interface reordena as videoaulas por `courseIndex`.

## Cardiologia

| Aula FAMED | Videoaulas vinculadas | Decisão |
| --- | --- | --- |
| Valvopatias | Conceitos Iniciais; Estenose Aórtica; Insuficiência Aórtica; Estenose Mitral; Insuficiência Mitral | Cobertura direta do conjunto |
| Doença coronária crônica | Síndromes Coronarianas Crônicas e Agudas | A primeira parte cobre diretamente angina estável/doença crônica |
| Hipertensão arterial sistêmica | Diagnóstico e Classificação; Hipertensão Secundária; Crise Hipertensiva | Cobertura do tema e de suas principais extensões clínicas |
| Estratificação de risco cardiovascular | — | A aula de dislipidemia apenas prepara para o tema; não substitui uma aula de estratificação |
| SCA com supra de ST | Síndromes Coronarianas Agudas — Oclusão e Suboclusão | A videoaula única cobre oclusão/com supra e suboclusão/sem supra |
| SCA sem supra de ST | Síndromes Coronarianas Agudas — Oclusão e Suboclusão | Mesma decisão acima |
| Cardiomiopatias | Dilatada; Restritiva; Takotsubo; Hipertrófica | Cobertura direta do conjunto disponível |
| Pericardiopatias | Pericardite, Tamponamento e Constrição | Cobertura direta |
| Insuficiência cardíaca crônica | Definição, Tipos e Causas; Tratamento Medicamentoso | Cobertura direta em sequência |
| Insuficiência cardíaca aguda | Perfis Hemodinâmicos e Tratamento — Partes 1 e 2 | Cobertura direta em sequência |
| Cirurgia cardíaca | — | Não há aula de cirurgia cardíaca ou revascularização no catálogo |
| Cardiopatias congênitas | — | Não há aula dedicada no catálogo |

## Pneumologia

| Aula FAMED | Videoaulas vinculadas | Decisão |
| --- | --- | --- |
| DPOC e asma | Noções de Espirometria e Asma; DPOC | Cobertura direta dos dois componentes |
| Tuberculose | História Natural; Clínica e Diagnóstico; Extrapulmonar; Tratamento; Controle no Brasil | Trilha completa disponível no curso |
| Pneumonias e TEP | Pneumonia Adquirida na Comunidade e Hospitalar; Pneumonia Hospitalar; TEP e TVP | Cobertura direta dos dois componentes |
| Pneumopatias intersticiais e espirometria | Noções de Espirometria e Asma; Pneumopatias Intersticiais Difusas | A primeira cobre o método; a segunda cobre o grupo de doenças |
| Tomografia do tórax | — | Não há aula dedicada à interpretação de tomografia torácica |
| Neoplasia pulmonar e nódulo pulmonar | Nódulo Pulmonar Solitário; Câncer de Pulmão | Cobertura direta em sequência |
| Doenças da pleura | Derrame Pleural | Única aula diretamente dedicada à pleura; tuberculose pleural permanece na trilha de tuberculose |

## Regras preservadas

- Nenhum vínculo foi produzido por busca de palavras em descrições.
- Aulas de outra matéria não foram usadas como substitutos aproximados.
- A ausência de vínculo não gera para o aluno a mensagem de que o curso não possui conteúdo.
- O mapa executável usa os UUIDs do catálogo, e os testes conferem existência, matéria e ordem desses IDs.
