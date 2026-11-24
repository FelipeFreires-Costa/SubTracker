/**
 * Teste INDEPENDENTE (oficial).
 * - Regras da heurística: CONGELADAS (não alterar limiares/filtros ao rodar isto).
 * - Semente 2027: conjunto held-out, distinto do 2026 (exploração/ajuste).
 * - Rodar UMA vez e guardar o JSON. Não recalibrar regras com base neste resultado.
 */
import fs from 'fs';
import path from 'path';
import { avaliarConjuntoTeste } from '../src/avaliacao/avaliar.teste';

export const SEMENTE_OFICIAL = 2027;

const relatorio = avaliarConjuntoTeste(SEMENTE_OFICIAL);
relatorio.observacao =
  'TESTE OFICIAL INDEPENDENTE (semente 2027). Regras congeladas antes desta execução. ' +
  'O conjunto semente 2026 permanece apenas como exploração/ajuste e NÃO é evidência independente. ' +
  'N=21 (desenvolvimento) também não é evidência independente. ' +
  'Rótulos vêm do tipo de cenário, não da saída do algoritmo. Não mede acurácia em extratos reais.';

const pasta = path.join(__dirname, '..', 'avaliacao');
const destino = path.join(pasta, 'resultado-teste-oficial-2027.json');
const resumo = path.join(pasta, 'resumo-oficial-2027.json');

fs.mkdirSync(pasta, { recursive: true });
fs.writeFileSync(destino, `${JSON.stringify(relatorio, null, 2)}\n`, 'utf8');

const resumoObj = {
  papel: 'teste-independente-oficial',
  geradoEm: relatorio.geradoEm,
  semente: relatorio.semente,
  totalCasos: relatorio.totalCasos,
  totalTransacoes: relatorio.totalTransacoes,
  perfis: relatorio.perfis,
  mesesPorPerfil: relatorio.mesesPorPerfil,
  heuristica: relatorio.heuristica,
  linhaDeBase: relatorio.linhaDeBase,
  acertoDeCicloEntreRecorrentes: relatorio.acertoDeCicloEntreRecorrentes,
  errosHeuristica: relatorio.linhas
    .filter((l) => l.veredito === 'FP' || l.veredito === 'FN')
    .map((l) => ({
      veredito: l.veredito,
      perfil: l.perfil,
      cenario: l.cenario,
      nome: l.nome,
      esperado: l.esperado,
      obtido: l.obtido,
    })),
  observacao: relatorio.observacao,
};
fs.writeFileSync(resumo, `${JSON.stringify(resumoObj, null, 2)}\n`, 'utf8');

function pad(valor: string | number, tamanho: number) {
  return String(valor).padEnd(tamanho, ' ');
}

function linhaResumo(rotulo: string, r: typeof relatorio.heuristica) {
  return `${pad(rotulo, 14)}VP ${pad(r.verdadeirosPositivos, 4)}VN ${pad(r.verdadeirosNegativos, 4)}FP ${pad(r.falsosPositivos, 4)}FN ${pad(r.falsosNegativos, 4)}Acurácia ${pad(`${r.acuracia}%`, 8)}Precisão ${pad(`${r.precisao}%`, 8)}Recall ${pad(`${r.recall}%`, 8)}F1 ${r.f1}%`;
}

console.log('=== AVALIAÇÃO OFICIAL (teste independente) ===\n');
console.log(`Semente ${relatorio.semente} | ${relatorio.perfis} perfis × ${relatorio.mesesPorPerfil} meses`);
console.log(`Casos: ${relatorio.totalCasos} | Transações nos casos: ${relatorio.totalTransacoes}\n`);
console.log(linhaResumo('Heurística', relatorio.heuristica));
console.log(linhaResumo('Linha de base', relatorio.linhaDeBase));
if (relatorio.acertoDeCicloEntreRecorrentes !== null) {
  console.log(`\nAcerto do ciclo (recorrentes detectados): ${relatorio.acertoDeCicloEntreRecorrentes}%`);
}

const erros = relatorio.linhas.filter((linha) => linha.veredito === 'FP' || linha.veredito === 'FN');
if (erros.length > 0) {
  console.log('\nErros da heurística');
  for (const linha of erros) {
    console.log(`${pad(linha.veredito, 4)}${pad(linha.perfil, 11)}${pad(linha.cenario, 36)}${linha.nome}`);
  }
} else {
  console.log('\nNenhum FP/FN da heurística neste conjunto.');
}

console.log(`\nSalvo: ${destino}`);
console.log(`Resumo: ${resumo}`);
console.log(`\n${relatorio.observacao}`);
