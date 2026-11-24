# Parecer de validade da avaliação (SubTracker)

Data: 2026-11-16

## Veredito

**Sim — a avaliação pode constar no TCC como evidência metodologicamente válida**, desde que o texto deixe explícito o protocolo (held-out + regras congeladas + estabilidade) e as limitações (sintético; não extrato real).

**Não** dá para garantir “zero comentário” da banca: o desenho sintético ainda é atacável. O que esta auditoria remove é o ataque de **contaminação / semente de ajuste como prova** e o de **rótulos injustos no gerador**.

## O que está correto

| Critério | Status |
|----------|--------|
| Rótulos independentes da saída do algoritmo | OK (`ROTULO_DO_CENARIO`) |
| Separação desenvolvimento (N=21) × teste (N=120) | OK |
| Semente oficial **2027** escolhida *a priori* (não após ver o score) | OK |
| Regras da heurística congeladas (sem retune pós-2027) | OK |
| Linha de base fraca (F1 ~70,6%) mostrando ganho dos filtros | OK |
| Reprodução scriptável (`avaliar:teste:oficial`, `avaliar:estabilidade`) | OK |

## O que a auditoria encontrou (e corrigiu)

1. **100% só na 2027 era enganoso** no gerador antigo: em 15 sementes a média era ~98,6%; FN reais em R4/R8.
2. **R8 injusto:** academia/telecom com só 2 cobranças e categoria ≠ `Subscriptions` — a própria regra documentada não cobre esse caso; gerava FN “falsos” de validade.
3. **R4 misturava calendário e valor:** deriva ±4 dias quebrava periodicidade sem testar só a tolerância 35%.
4. **E1 podia virar FP por sorte:** datas aleatórias ocasionalmente caíam em faixa mensal.

Correções aplicadas **só no gerador**; `heuristica.recorrencia.ts` **não** foi alterada.

## Resultado após correção

- Oficial 2027: Acc/F1 **100%**, FP=0, FN=0, ciclo 100%.
- 15 sementes: média Acc **99,83%** (mín 98,3%), **FP=0**, 3 FN só em R4 (estresse legítimo da tolerância de valor).

## Riscos residuais (admitir no TCC)

1. **Sintético ≠ real** — Open Finance real tem ruído, categorias erradas, descritores sujos.
2. **Espelhamento parcial** — eventuais como PIX-pessoa, fatura e parcela são rejeitados por filtros que o gerador dispara de propósito; a linha de base (sem esses filtros) fica em F1 ~70%, o que documenta o efeito.
3. **Teto alto** — em distribuição sintética alinhada aos critérios, scores próximos de 100% são esperados; por isso citar a **estabilidade** e não só o 100% da 2027.
4. **Texto Overleaf** ainda pode estar desatualizado (97,5% / semente 2026 como se fosse oficial) — alinhar quando for editar o PDF.

## O que NÃO fazer

- Não recalibrar limiares (15%/35%, faixas de dias, lista de PIX-conta) com base nos erros da 2027 ou da estabilidade.
- Não trocar a semente oficial só porque outra deu score “mais bonito” ou “mais humilde”.
- Não apresentar N=21 ou 2026 histórica como prova independente.
