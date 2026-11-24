# Métricas — protocolo corrigido (atualizado 2026-11-16)

## Resultado oficial (usar no TCC)

**Semente 2027 | N = 120 | 60 recorrentes / 60 não | gerador v2-validade | regras congeladas**

| Método | VP | VN | FP | FN | Acurácia | Precisão | Revocação | F1 |
|--------|----|----|----|----|----------|----------|-----------|-----|
| **Heurística (oficial)** | 60 | 60 | 0 | 0 | **100%** | **100%** | **100%** | **100%** |
| Linha de base (repetição textual) | 60 | 10 | 50 | 0 | 58,3% | 54,5% | 100% | 70,6% |

- Acerto de ciclo (recorrentes detectados): 100%
- Arquivo: `../resultado-teste-oficial-2027.json`
- Regras: **inalteradas** nesta rodada (só o gerador de cenários foi corrigido por validade de rótulo)

## Estabilidade multi-semente (complementar — recomendado citar)

**15 sementes × N=120 = 1.800 casos | mesmas regras congeladas | gerador v2**

| | Acurácia | F1 | FP total | FN total |
|--|----------|-----|----------|----------|
| Média | **99,83%** | **99,83%** | 0 | 3 |
| Mín–máx | 98,3% – 100% | — | — | — |

- Os 3 FN restantes concentram-se só em `R4_consumo_valor_variavel` (tolerância de valor 35% sob amostragem extrema).
- FP = 0 em todas as sementes.
- Comando: `npm run avaliar:estabilidade`
- Arquivo: `../analise-estabilidade-sementes.json`

## Exploração histórica (NÃO é teste independente)

**Semente 2026 | gerador antigo | Acc 97,5% (3 FN: R4×2, R8×1)**

Arquivo: `../resultado-teste-exploracao-2026-historico.json`

## Desenvolvimento (NÃO é evidência independente)

**N = 21** — Acc 100% no gabarito de construção.

Arquivo: `../resultado-desenvolvimento-N21.json`

## Correções de validade do gerador (não são recalibração de regras)

1. **R8** só usa categoria `Subscriptions` (alinhado ao critério “2 ocorrências + Subscriptions”).
2. **R4** deriva de dia ±2 (antes ±4 misturava falha de calendário com teste de valor).
3. **E1** gaps fora das faixas mensal/bimestral (evita FP por sorteio de datas).

## Como citar no texto

1. Desenvolvimento = N=21 (ajuste).
2. Semente 2026 histórica = exploração / não independente.
3. **Evidência formal:** semente **2027** (tabela oficial) + **estabilidade** (média 99,83% em 15 sementes).
4. Limitações obrigatórias: dados sintéticos; métricas = acordo com gabarito controlado; **não** acurácia em extratos reais; parte dos eventuais é coberta por filtros explícitos (PIX pessoa, fatura, parcela).
