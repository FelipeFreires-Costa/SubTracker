# Regras congeladas da heurística (versão oficial)

**Status:** CONGELADAS em 2026-11-16 (após definição do protocolo de teste independente).  
**Arquivo de código:** `src/utils/heuristica.recorrencia.ts`  
**Cópia imutável deste snapshot:** `heuristica.recorrencia.CONGELADA.ts` (nesta pasta).

Não alterar limiares, faixas de periodicidade nem filtros para “melhorar” o resultado do teste oficial (semente 2027).

## Limiares de valor

| Parâmetro | Valor | Onde |
|-----------|-------|------|
| Tolerância padrão | 15% (`0.15`) | `TOLERANCIA_VALOR_PADRAO` |
| Tolerância consumo (luz/água/gás/utilities) | 35% (`0.35`) | `TOLERANCIA_VALOR_CONSUMO` |
| Folga absoluta | R$ 2,00 | `valorEstavelContra` |
| Outlier único removível | 1 mês fora + ≥3 ocorrências | `valoresProximos` |
| Janela pós-reajuste | últimas 3 cobranças | `valoresProximos` |

## Periodicidade (intervalos em dias)

| Ciclo | Faixa |
|-------|-------|
| Mensal | 25–36 dias |
| Bimestral | 55–75 dias |
| Anual | 340–390 dias |
| Compatibilidade de dia do mês | mediana ± 3 dias (`diasDoMesCompativeis`) |

## Filtros de exclusão (não recorrente)

- Transferência a pessoa (PIX/TED) sem indicador de compromisso/conta
- Pagamento de fatura/boleto
- Parcelamento (metadado ou padrão textual `N/M`)

## Agrupamento

- Chave = descrição normalizada (caixa baixa, remoção de ruído/dígitos finais)
- Similaridade léxica por chave idêntica (sem embedding / NLP)

## Decisão

- Recorrente se passar estabilidade + periodicidade válida (e regras de ocorrências/categoria assinatura quando aplicável)
- Situação UI (ativa/pendente/encerrada) **não** entra nas métricas de classificação
