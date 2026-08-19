var e=`
POLÍTICA GLOBAL DE CARTÕES DE MEMÓRIA (agora-memory-card-policy-v1):
- A IA decide a quantidade final. Não existe teto, piso, faixa, meta nem sugestão numérica de cartões.
- A regra 80/20 é um filtro de importância, não uma quantidade: retenha somente o pequeno núcleo de memórias de maior rendimento, com prioridade para prova e, em seguida, para decisões relevantes na vida clínica.
- Antes de criar cada cartão, pergunte silenciosamente: “Isto é realmente essencial?”, “Eu preciso de um flashcard para aprender ou reter isto?”, “Flashcard realmente ajudará a recuperar isto quando necessário?” e “Isto não pode ser deduzido por bom senso ou lógica genérica?”. O candidato só entra se passar claramente por todos os filtros.
- Flashcard serve para recuperar uma informação que precisa estar disponível de memória. Não o use para ensinar pela primeira vez um raciocínio longo, uma interpretação complexa ou uma conclusão que nasce naturalmente dos dados apresentados.
- Não transforme cada linha, subtópico, alternativa ou detalhe do material em cartão. Os subtópicos são fontes de candidatos, não cotas de cobertura; um subtópico pode ficar sem cartão quando nada nele passar pelo filtro.
- Exclua trivia, conselhos universais, afirmações óbvias, detalhes periféricos ou facilmente consultáveis e consequências dedutíveis de uma regra central já cobrada.
- Se houver questões antigas, use somente questões médias, difíceis ou realmente discriminativas como sinal de prioridade. Questão fácil, elementar, entregue pelo enunciado, resolvida por bom senso ou por eliminação óbvia fornece zero peso de prova, mesmo quando se repete.
- Questões antigas que pedem uma lista não autorizam um cartão de lista. Extraia apenas uma decisão ou diferenciação individual de alto rendimento; se a cobrança for apenas reproduzir o inventário, não crie cartão a partir dela.
- Não crie cartões redundantes nem divida uma lista de baixo rendimento em vários cartões apenas para contornar as regras de cardinalidade.
- Cada frente deve ser autossuficiente e deixar claro qual conceito precisa ser recuperado, sem entregar a resposta. A falha do aluno deve ser de memória ou raciocínio, nunca de interpretação do comando.
- Identifique o núcleo semântico antes de escrever: se pistas, causas ou consequências W e Z identificam a entidade Y, mostre W e Z e peça Y. Não esconda nem cobre uma pista periférica quando o verdadeiro alvo pedagógico é Y.
- A explicação deve ensinar por que a resposta é correta, como o mecanismo funciona ou o que a diferencia da alternativa plausível mais próxima. Não repita o gabarito com mais palavras e não use comentários vazios como “isso é importante”, “cai em prova”, “vale lembrar”, “é primeira linha” ou “é eficaz” sem explicar a razão.
- Faça a seleção dentro do próprio raciocínio e entregue somente os candidatos aprovados. O aplicativo preservará todos os cartões retornados; não conte com filtragem posterior pelo site.`,t=`
REGRAS GLOBAIS DO FLASHCARD DIRETO:
- Cada pergunta testa uma única relação e exige UM item curto por padrão.
- Excepcionalmente, pode exigir exatamente DOIS itens curtos somente quando eles formarem um par completo, inseparável e naturalmente recuperado junto; a pergunta deve dizer explicitamente que pede dois.
- Nunca exija três ou mais itens. Não peça listas ou inventários de medicamentos, classes, exames, achados, critérios, etapas, fatores de risco, indicações, contraindicações ou condutas.
- São proibidos comandos como “cite”, “liste”, “enumere”, “mencione”, “nomeie”, “quais são”, “quais exames” e equivalentes quando pedem uma coleção.
- Também é proibido mostrar parte de uma lista e pedir o restante. Não use “além de X”, não cite alguns exames ou fármacos para perguntar pelos outros e não transforme uma lista em “qual item falta?”.
- Medicamento, classe ou exame só merece cartão individual quando possui papel único e decisivo em um cenário definido, como preferência, contraindicação, mecanismo, efeito adverso ou finalidade que muda a resposta.
- Pergunta no singular exige exatamente uma resposta, sem alternativas unidas por “ou”, barra ou parênteses. Se aceitar o par excepcional, use “quais dois” e devolva somente os dois itens.
- A resposta contém apenas o alvo curto de memória. Explicações, ressalvas, mecanismo e contexto pertencem ao campo Explicação.
- Revise silenciosamente a cardinalidade antes de responder. Se o back ainda contiver uma enumeração explícita ou implícita, reescreva ou rejeite o cartão; não pulverize a lista em cards fracos.`,n=`
REGRAS GLOBAIS DO CLOZE:
- Use somente a sintaxe {{c1::termo curto}}. Qualquer terceiro campo de dica dentro do marcador é proibido.
- Cada nota deve conter EXATAMENTE UM marcador cloze e ocultar somente UM termo curto, indivisível e de alto rendimento.
- Não oculte várias palavras independentes, uma frase, uma enumeração, uma sequência, uma comparação inteira nem uma lista. Não use vários trechos c1 na mesma nota e não use c2, c3 ou outros índices.
- O texto visível deve indicar inequivocamente qual conceito está sendo pedido, mas não pode permitir inferir a resposta por gramática, concordância, tamanho, oposição óbvia ou pista semântica.
- Oculte o núcleo semântico. Se W e Z identificam Y, deixe W e Z visíveis e marque somente Y como cloze; não esconda as próprias pistas.
- Cloze não é licença para atomizar tudo. Crie uma nota apenas quando o termo oculto passar pelo filtro global de essencialidade e realmente se beneficiar de recuperação literal.
- O campo Extra deve explicar o mecanismo, a justificativa clínica ou o critério discriminativo que torna aquele termo correto. Não pode ser um comentário, uma paráfrase da frase ou um despejo de informações periféricas.`;export{t as n,e as r,n as t};