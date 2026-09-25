# Área USMLE

Acesso atual: somente administrador, na interface e nas regras do Firestore.
A área é independente do curso, da FAMED e dos materiais pessoais.

## Usar

1. Abra **USMLE** pela sidebar ou pelo menu **Mais** no celular.
2. Em **Importar pacotes**, escolha Step 1 ou Step 2 CK e envie o `.zip`.
3. Confira contagem, bancos e avisos. Clique em **Importar questões**.
4. Em **Montar bloco**, selecione as matérias, filtros, quantidade e modo.

O ZIP não fica embutido no frontend. O arquivo enviado nesta conversa foi usado apenas
como referência e fixture externa de teste; nenhum banco real foi publicado pelo agente.

O modo **Estudo** revela a explicação após confirmar a resposta. **Prova** preserva o
gabarito até encerrar. Ambos permitem cronômetro opcional, pausa, retomada, favoritos,
sinalizações, anotações, destaques, alternativas riscadas, imagens ampliadas e atalhos
de teclado. O cronômetro usa tempo de relógio e funciona também após voltar de outra aba.
Tempo zerado encerra o bloco; uma pausa explícita suspende a contagem.

O resultado separa corretas, incorretas e omissões, permite revisar a sessão e refazer
os erros. A pontuação não estima nota de prova. **Desempenho** agrupa por matéria,
disciplina, assunto e banco, e exporta CSV. Os filtros de favoritos e notas são internos
ao USMLE, sem agregar os Favoritos legados do restante do site.

## Pacotes aceitos

ZIP com `questions.json` na raiz; arquivos de imagem em `images/` e áudio em `audio/`.
Schemas aceitos: `agora-famed-usmle-question-package-v1` (pacote de referência) e
`agora-usmle-question-package-v1`. O campo `questionBank` é livre e aceita Mehlman,
além dos bancos presentes no arquivo de Cardiologia. A etapa é escolhida no upload.

Exemplo mínimo de estrutura, com conteúdo fictício:

```json
{
  "schema": "agora-usmle-question-package-v1",
  "title": "Meu banco - Matéria",
  "subject": "Matéria",
  "questions": [{
    "id": "questao-001",
    "questionBank": "Mehlman",
    "subject": "Matéria",
    "system": "Sistema",
    "discipline": "Disciplina",
    "topic": "Assunto",
    "statement": "Enunciado original",
    "options": [
      {"letter": "A", "text": "Alternativa A", "explanation": "Comentário A"},
      {"letter": "B", "text": "Alternativa B", "explanation": "Comentário B"}
    ],
    "correctAnswer": "B",
    "explanation": "Comentário geral original",
    "educationalObjective": "Objetivo original",
    "images": [],
    "audio": [],
    "references": []
  }]
}
```

Figuras: `{ "file":"images/figura.jpg", "placement":"front", "altText":"", "credit":"Banco" }`.
Use `back` para figuras do comentário. Áudio: `{ "file":"audio/arquivo.mp3", "label":"Áudio" }`.
Os caminhos são relativos e validados; não são aceitas URLs externas ou SVG/HTML executável.
Enunciados, comentários, estatísticas e referências não são reescritos ou traduzidos.
Na exibição, enunciados que vieram inteiramente sem quebras recebem separações visuais
em aberturas explícitas de frases clínicas e na pergunta final. Quebras existentes têm
prioridade. Esse ajuste não insere pontuação nem altera o texto persistido, e vale
também para pacotes já importados.

Limites: ZIP até 90 MB, conteúdo descompactado até 180 MB, até 10.000 questões por
pacote, mídia individual até 650 KB. Questões ficam em chunks de até 30 itens e 500 KB.
Cada bloco de estudo admite até 80 questões. Os limites de mídia decorrem dos documentos
Firestore; áudios maiores precisam ser comprimidos ou o armazenamento deve ser revisto
explicitamente antes de ampliar o suporte.

O importador rejeita IDs repetidos, caminhos inseguros, arquivos referenciados ausentes,
gabaritos incompatíveis e imagens inválidas. Algumas inconsistências da origem são
identificadas sem apagar questões: áudio não fornecido e alternativas visuais sem figura
de enunciado. Estas últimas ficam indisponíveis para blocos até um pacote corrigido.

Inventário conferido no arquivo de referência externo:

- 1.239 questões: UWorld 382, USMLE-Rx 149, AMBOSS 251, Boards and Beyond 457;
- 1.235 arquivos de imagem (a entrada de diretório `images/` não é uma imagem);
- 55 questões com alternativas visuais, incluindo 31 sem figura marcada `front`;
- 14 questões cujo áudio original não foi fornecido;
- 1.194 questões disponíveis com os filtros padrão de integridade/mídia.

## Persistência e atualizações

O catálogo é carregado ao abrir USMLE. Questões entram por matéria selecionada, com até
três leituras de chunks simultâneas; imagens/áudios entram ao abrir a questão. Nenhuma
leitura de USMLE é adicionada à Home. Tela, CSS e importador permanecem lazy.

Conteúdo fica em `usmle_packages/{id}/releases/{hash}`. O hash identifica o ZIP e a
publicação troca apenas o ponteiro do catálogo depois de concluir todas as gravações.
Uma falha mantém a versão anterior e permite retentar. Mesmo ZIP já importado é reconhecido.
Use o mesmo título e os mesmos IDs para atualizar um pacote mantendo seu progresso.
Blocos históricos usam as versões originais, preservadas após atualização do catálogo.

Progresso e sessões ficam em `usmle_users/{uid}`. Notas/favoritos usam patches por
questão. Resposta e bloco são salvos juntos em transação, com versão e marcador de
contabilização. Atualizações concorrentes não sobrescrevem silenciosamente outra sessão.
Uma falha de salvamento é exibida com retry e mantém o rascunho local separado por UID.
Em conflito de versões, reabra pelo histórico. Confirmação remota inicial é necessária
para iniciar/retomar blocos. O armazenamento local pode falhar em navegadores com
armazenamento restrito; a confirmação de gravação depende do Firestore.

Não há integração com FSRS nesta área. Refazer erros gera outro bloco e não altera
a taxa de primeira tentativa.

Em **Importar pacotes**, **Excluir todas as questões** é uma ação administrativa destrutiva
com confirmação explícita. Ela remove os catálogos e todas as versões, chunks, imagens e
áudios conhecidos em `usmle_packages`; versões antigas referenciadas por sessões também
entram na limpeza. `usmle_users/{uid}` é preservado, portanto histórico, desempenho,
favoritos e notas pessoais não são apagados. Como esse histórico passa a apontar para um
conteúdo removido, blocos antigos deixam de poder ser reabertos até que uma versão com os
mesmos pacotes e IDs seja importada novamente. A operação pode ser repetida com segurança
se uma falha de rede interromper a limpeza.

## Publicar e verificar

É necessário publicar **frontend e `firestore.rules`** no projeto Firebase correspondente.
Sem as novas regras, o servidor corretamente nega as novas coleções. Esta implementação
não altera autorizações existentes nem publica regras automaticamente.

```powershell
npm run check
$env:USMLE_TEST_ZIP = 'C:\caminho\externo\USMLE_Cardiology_QuestionPackage.zip'
node --no-warnings scripts/usmle-smoke.mjs
$env:UX_BASE_URL = 'http://127.0.0.1:3003'
$env:UX_BROWSER_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run ux:usmle
npm run ux:smoke
```

O smoke USMLE injeta um armazenamento simulado apenas no navegador de teste: não acessa
Firebase nem publica o pacote real. Valida upload, modos de resposta, gabarito oculto,
favoritos/notas, zoom, destaques, pausa/retomada, expiração do tempo, alternativas apenas
em imagem, retry, resultados, acesso e responsividade. Capturas em `test-results/usmle/`.
Os testes puros validam parsing, filtros, identificação, tempo e contabilização idempotente.

`scripts/firestore-emulator-rules-test.mjs` inclui casos USMLE para administrador, alunos
com/sem curso e visitante. Rode `npm run test:rules:emulator` em ambiente com Java e
Firebase Emulator disponíveis. Na implementação inicial, o ambiente local não tinha Java;
a verificação executada das regras foi a estática, sem alegar teste remoto de produção.

Budget: reserva própria de 20 KiB gzip para USMLE. O descompactador assíncrono compartilha
fflate com FAMED/APKG e acrescenta cerca de 1,2 KiB ao conjunto medido; sua reserva passou
de 31 para 33 KiB. Os budgets de entrada e do núcleo não foram aumentados.
