/**
 * Estabilidade multi-semente com regras CONGELADAS.
 * Não altera limiares. Complementa o teste oficial (2027); não o substitui.
 */
import fs from 'fs';
import path from 'path';
import { avaliarConjuntoTeste } from '../src/avaliacao/avaliar.teste';

const SEMENTES = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2040, 2100, 9999, 42, 7];

const linhas: Array<Record<string, unknown>> = [];
const porCenario: Record<string, { casos: number; fn: number; fp: number }> = {};
let totalFN = 0;
let totalFP = 0;
let totalCasos = 0;

for (const semente of SEMENTES) {
  const relatorio = avaliarConjuntoTeste(semente);
  const h = relatorio.heuristica;
  const erros = relatorio.linhas.filter((l) => l.veredito === 'FP' || l.veredito === 'FN');
  const errosPorCenario: Record<string, number> = {};
  for (const e of erros) {
    errosPorCenario[e.cenario] = (errosPorCenario[e.cenario] ?? 0) + 1;
  }
  for (const l of relatorio.linhas) {
    const bucket = porCenario[l.cenario] ?? { casos: 0, fn: 0, fp: 0 };
    bucket.casos += 1;
    if (l.veredito === 'FN') {
      bucket.fn += 1;
      totalFN += 1;
    }
    if (l.veredito === 'FP') {
      bucket.fp += 1;
      totalFP += 1;
    }
    porCenario[l.cenario] = bucket;
    totalCasos += 1;
  }
  linhas.push({
    semente,
    acc: h.acuracia,
    prec: h.precisao,
    rec: h.recall,
    f1: h.f1,
    vp: h.verdadeirosPositivos,
    vn: h.verdadeirosNegativos,
    fp: h.falsosPositivos,
    fn: h.falsosNegativos,
    ciclo: relatorio.acertoDeCicloEntreRecorrentes,
    erros: erros.length,
    porCenario: errosPorCenario,
    baseF1: relatorio.linhaDeBase.f1,
  });
  const extra = erros.length ? ` ${JSON.stringify(errosPorCenario)}` : '';
  console.log(`s=${semente} acc=${h.acuracia} FP=${h.falsosPositivos} FN=${h.falsosNegativos}${extra}`);
}

const accs = linhas.map((l) => l.acc as number);
const f1s = linhas.map((l) => l.f1 as number);
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

const out = {
  geradoEm: new Date().toISOString(),
  regras: 'congeladas (heuristica.recorrencia.ts inalterada)',
  gerador: 'v2-validade: R8=Subscriptions, R4=deriva±2, E1=gaps irregulares',
  nPorSemente: 120,
  sementes: linhas,
  resumo: {
    meanAcc: Number(mean(accs).toFixed(2)),
    minAcc: Math.min(...accs),
    maxAcc: Math.max(...accs),
    meanF1: Number(mean(f1s).toFixed(2)),
    totalFP,
    totalFN,
    totalCasos,
    nSementes: SEMENTES.length,
  },
  porCenario,
};

const destino = path.join(__dirname, '..', 'avaliacao', 'analise-estabilidade-sementes.json');
fs.writeFileSync(destino, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
console.log('\nResumo:', JSON.stringify(out.resumo));
console.log(`Salvo: ${destino}`);
