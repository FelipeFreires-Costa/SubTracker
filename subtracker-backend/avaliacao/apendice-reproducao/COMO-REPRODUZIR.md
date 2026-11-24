# Como reproduzir as métricas do SubTracker

## Papéis dos conjuntos

| Conjunto | Semente / origem | Papel | É evidência independente? |
|----------|------------------|-------|---------------------------|
| Desenvolvimento | gabarito manual N=21 | construção/ajuste de regras | **Não** |
| Exploração 2026 (histórico) | semente **2026**, gerador antigo | exploração / refinamento | **Não** |
| **Teste oficial** | semente **2027**, gerador v2 | held-out com regras congeladas | **Sim** |
| Estabilidade | 15 sementes × 120 | sensibilidade ao sorteio | Complementar (citar) |

## Pré-requisitos

```bash
cd subtracker-backend
npm install
```

## Comandos

```bash
npm run avaliar                 # N=21 desenvolvimento
npm run avaliar:teste           # N=120 semente 2026 (não usar como prova oficial)
npm run avaliar:teste:oficial   # N=120 semente 2027 — TESTE OFICIAL
npm run avaliar:estabilidade    # 15 sementes — média / mín / máx
```

## Protocolo

1. Congelar `heuristica.recorrencia.ts` (limiares/filtros).
2. Gerador v2-validade: R8 só `Subscriptions`; R4 deriva ±2; E1 com gaps irregulares.
3. Rodar oficial **2027** uma vez; não retunar regras com o resultado.
4. Rodar estabilidade para reportar média (não cherry-pick de semente).

## Arquivos

- `REGRAS-CONGELADAS.md`, `heuristica.recorrencia.CONGELADA.ts`
- `dataset.teste.CONGELADO.ts` — gerador v2
- `METRICAS.md`, `PARECER-VALIDADE.md`
- `../resultado-teste-oficial-2027.json`, `../resumo-oficial-2027.json`
- `../analise-estabilidade-sementes.json`
- `../resultado-teste-exploracao-2026-historico.json`
- `../resultado-desenvolvimento-N21.json`

## Observação

Métricas = acordo com gabarito sintético controlado. **Não** medem acurácia em extratos bancários reais.
