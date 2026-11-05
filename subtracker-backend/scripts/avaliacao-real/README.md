# Avaliação com extrato real

Rotina **descartável**, isolada da aplicação. Serve para medir o algoritmo **já congelado** contra um gabarito que **você** monta à mão.

O detector de recorrência (`src/utils/heuristica.recorrencia.ts`) **não é alterado** por estes scripts. Eles só importam `identificarRecorrencias` na última etapa.

Não versionar extrato, gabarito nem resultados. Esses arquivos estão no `.gitignore`.

## 1. Arquivo de entrada

No SubTracker, tela **Contas**: conecte o banco e clique em **Baixar extrato**. O CSV vai para a pasta de downloads (o extrato **não** fica salvo no sistema). O botão só aparece com `EXTRATO_EXPORT=true` no `.env` do backend; reinicie a API depois de mudar.

Também serve um CSV, XLSX ou OFX exportado pelo próprio banco.

Coloque **um** arquivo em:

`scripts/avaliacao-real/entrada/`

Ou passe o caminho no comando.

Não há nomes de coluna fixos. O script inspeciona o arquivo e tenta achar data, descrição, valor, tipo de conta e categoria.

Opcional: copie `config.example.json` para `config.json`.

- `account_type_default`: use `"CREDIT"` se o arquivo for fatura de cartão (compras positivas).
- `inverter_sinal`: `true` se as despesas vieram com o sinal invertido.
- `redact_extra`: termos a mascarar (seu nome, por exemplo).

Também pode criar `redact_extra.txt`, um termo por linha.

## 2. Anonimização

Na pasta `subtracker-backend`:

```powershell
npx ts-node --transpile-only scripts/avaliacao-real/cli.ts inspecionar
npx ts-node --transpile-only scripts/avaliacao-real/cli.ts anonimizar
```

`inspecionar` só lê o extrato e mostra o mapeamento. **Não** chama o algoritmo.

`anonimizar` gera:

- `algoritmo_congelado.json` — commit Git + SHA-256 da heurística
- `transacoes_reais_anonimizadas.csv`
- `gabarito_manual.csv` (rótulos **vazios**)
- `distribuicao_mensal.csv`

Datas, valores, frequência e ordem cronológica são preservados. Nomes comerciais úteis (NETFLIX, ENEL, etc.) permanecem. Nome de pessoa vira `PESSOA_001`. CPF, e-mail, telefone, cartão, agência e conta são removidos.

## 3. Gabarito manual

Abra `gabarito_manual.csv` **antes** de rodar a avaliação. Preencha, por transação:

| campo | o que colocar |
| --- | --- |
| `case_id` | mesmo id para o mesmo compromisso (`C001`, `C002`, …) |
| `expected_label` | `recorrente` ou `nao_recorrente` |
| `expected_cycle` | `mensal`, `bimestral`, `anual` ou vazio |
| `notes` | opcional |

Não use a saída do algoritmo para decidir esses campos. O gabarito existe para ser anterior à execução.

## 4. Avaliação

```powershell
npx ts-node --transpile-only scripts/avaliacao-real/cli.ts avaliar
```

O comando não bloqueia. Ele avisa e registra em `metricas_reais.json` quando:

- há linhas sem `case_id` ou `expected_label`: elas ficam fora da pontuação e o resultado sai como **parcial** (`gabarito_completo: false`);
- `heuristica.recorrencia.ts` mudou depois do congelamento (`algoritmo_alterado_desde_congelamento: true`).

Só use as métricas no texto quando `gabarito_completo` for `true` e o algoritmo não tiver sido alterado.

Nesta etapa o script chama **direto** `identificarRecorrencias` do código atual, com o extrato inteiro.

## 5. Arquivos gerados

| arquivo | quando | git |
| --- | --- | --- |
| `algoritmo_congelado.json` | anonimizar | ignorado |
| `transacoes_reais_anonimizadas.csv` | anonimizar | ignorado |
| `gabarito_manual.csv` | anonimizar; você completa | ignorado |
| `distribuicao_mensal.csv` | anonimizar e avaliar | ignorado |
| `resultado_casos_reais.csv` | avaliar | ignorado |
| `metricas_reais.json` | avaliar | ignorado |

Métricas em `metricas_reais.json`: VP, VN, FP, FN, acurácia, precisão, revocação, F1 (0 a 1). Divisão por zero vira 0. O arquivo também traz `gabarito_completo`, `transactions_labeled`, `transactions_unlabeled`, `heuristica_sha256` e `algoritmo_alterado_desde_congelamento`.

## 6. Congelamento

`anonimizar` grava o commit e o hash da heurística. Se o algoritmo for alterado depois disso, a avaliação roda, mas marca o resultado como alterado. Para um experimento limpo, rode `anonimizar` de novo e refaça o gabarito.
