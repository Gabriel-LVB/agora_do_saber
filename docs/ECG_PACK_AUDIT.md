# Auditoria dos pacotes de ECG

> Atualizado em 30 de julho de 2026. Estado atual: **pacote original completo e autorizado para uso na aba administrativa Banco de ECG**.

## Pacote atual

- Arquivo: `Agora_ECG_import_staging_v3.zip`
- SHA-256: `BEBFEDD81026596CDDF8FEC771A56432855F2A31ADC8B06A88CB7D65C5E127A2`
- Tamanho: 33.951.451 bytes
- Entradas no ZIP: 182
- Caminhos absolutos, travessia `..` ou caminhos duplicados: 0
- Modo declarado: `staging`
- Ativação de runtime declarada: desabilitada

## Resultado técnico da v3

O comando abaixo termina com `ok: true`:

```bash
npm run validate:ecg -- <diretorio-extraido-da-v3>
```

| Item | Total |
| --- | ---: |
| Casos contínuos `ECG001`–`ECG150` | 150 |
| ECGs principais | 150 |
| Assets ECG totais | 158 |
| Conceitos | 89 |
| Relações pedagógicas | 110 |
| Clusters | 54 |
| Casos de revisão prioritária | 25 |
| ECGs com hash duplicado | 0 |
| Casos completos no pacote original | 150 |
| Casos com achados textuais residuais de radiografia | 21 |

Todos os assets inventariados existem. Os hashes SHA-256, dimensões JPEG e referências internas conferem. O dataset de uso reúne as 189 imagens do pacote original e classifica cada uma como material de questão ou de resposta. Na experiência prática, diagnóstico, interpretação e conduta aparecem somente depois de revelar o gabarito.

## Correção da conclusão sobre ECG047 e ECG109

A auditoria inicial da v2 interpretou incorretamente o único hash duplicado como se os ECGs principais de `ECG047` e `ECG109` fossem iguais.

A v3 documenta, e a inspeção dos arquivos confirma, que o duplicado era uma **radiografia auxiliar** ligada aos dois casos. Os ECGs principais são diferentes:

```text
ECG047  f6219260cc89e2b5a301c307274273769d39268add7949884d1ddb83c249b184
ECG109  c2dc360ae80c837a1d6d751f0b8480d59aee8e7e321ebae1cbaad932611b03f2
```

A v3 excluiu radiografias e imagens de resposta do inventário utilizável. Portanto, **não existe conflito entre os traçados principais 47 e 109**.

## Origem e autorização confirmadas

O responsável pelo Ágora confirmou pessoalmente em 30 de julho de 2026 que o material é próprio, que o site está autorizado a utilizá-lo e que os traçados podem ser entregues por URLs públicas. Também esclareceu que “Hampton”/“Hamptom” foi uma inferência incorreta de IA, não a fonte do conteúdo.

O registro operacional está em `docs/ECG_RIGHTS_DECLARATION.md`. A v3 não contém essa referência incorreta nos dados importáveis.

## Esclarecimento sobre a suposta “revisão clínica”

O pacote intermediário v3 marcou os registros como `pending_independent_review`. Essa flag foi uma cautela adicionada pela IA que reempacotou o conteúdo; não significa que faltavam casos ou respostas.

O pacote original `Casos_ECG_site_pack.zip` contém 150 enunciados, 150 perguntas sugeridas, 150 interpretações clínicas e 150 respostas completas. O responsável definiu esse material como fonte canônica do site. Portanto, uma nova revisão independente não é requisito para a aba aparecer nem para exibir o conteúdo fornecido.

O material original também contém as radiografias citadas nos casos. Elas são mostradas na fase correta da experiência, em vez de terem seus achados removidos.

## O que a v3 permite agora

- validar e versionar o contrato de staging;
- copiar os 158 assets ECG para `public/ecg/v3/`;
- preparar metadados administrativos em 10 lotes idempotentes de 15;
- disponibilizar os 150 casos completos em `public/ecg/v3/cases.json`;
- exibir a aba administrativa Banco de ECG com resposta sob revelação;
- exibir uma prévia exclusivamente administrativa dos erros de importação;
- manter os candidatos brutos de staging desativados;
- gerar uma projeção pública compacta para associação automática com as questões do curso;
- anexar somente o ECG principal da fase de pergunta, sem copiar diagnóstico ou gabarito para a questão.

A associação automática com questões está implementada em `agora-ecg-question-matching-v1`. O progresso do curso prático de ECG e sua futura integração ao FSRS continuam etapas separadas.

## Contrato recomendado de importação

1. Validar e preparar com:

   ```bash
   npm run import:ecg-staging -- <diretorio-extraido-da-v3>
   ```

2. Exigir resultado `ok: true`.
3. Manter o gabarito oculto na experiência até a revelação explícita; o responsável autorizou os arquivos em URLs públicas.
4. Preservar as flags dos registros brutos de staging como `false`; o runtime consome projeções próprias e versionadas.
5. Excluir achados de radiografia da experiência ECG-only.
6. Registrar revisor, versão, data e decisão por caso.
7. Validar o índice derivado e manter questões sem correspondência segura fora da fila.
8. Vincular questões por conceito e evidência revisados, nunca por semelhança textual isolada.

## Histórico da v2

O pacote `Casos_ECG_site_pack_v2_agora.zip` tinha 373 entradas, 150 ECGs principais e 189 assets. A v3 intermediária foi útil para validar hashes e staging, mas removeu recursos que pertenciam aos casos. O dataset final voltou a usar o pacote original completo: radiografias de questão aparecem antes do gabarito e imagens ligadas à resposta aparecem depois da revelação.

A conclusão histórica sobre a duplicidade e a origem foi corrigida nesta versão do documento. O pacote original completo passou a ser a fonte de conteúdo da interface.
