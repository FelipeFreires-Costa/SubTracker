import fs from 'fs';
import path from 'path';
import { avaliarHeuristica } from '../src/avaliacao/avaliar.heuristica';

const relatorio = avaliarHeuristica();
const destino = path.join(__dirname, '..', 'avaliacao', 'resultado.json');

fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, `${JSON.stringify(relatorio, null, 2)}\n`, 'utf8');

function pad(valor: string | number, tamanho: number) {
  return String(valor).padEnd(tamanho, ' ');
}

console.log('Avaliação da heurística de recorrência (dataset sintético)\n');
console.log(`Casos: ${relatorio.totalCasos}`);
console.log(`VP ${relatorio.verdadeirosPositivos} | VN ${relatorio.verdadeirosNegativos} | FP ${relatorio.falsosPositivos} | FN ${relatorio.falsosNegativos}`);
console.log(`Acurácia ${relatorio.acuracia}% | Precisão ${relatorio.precisao}% | Recall ${relatorio.recall}% | F1 ${relatorio.f1}%`);
if (relatorio.acertoDeCicloEntreRecorrentes !== null) {
  console.log(`Acerto do ciclo (entre recorrentes esperados): ${relatorio.acertoDeCicloEntreRecorrentes}%`);
}
console.log(`\n${relatorio.observacao}\n`);
console.log(`${pad('Caso', 24)}${pad('Esperado', 12)}${pad('Obtido', 12)}${pad('Veredito', 10)}Ciclo`);
console.log('-'.repeat(70));

for (const linha of relatorio.linhas) {
  const ciclo =
    linha.cicloCorreto === null ? '-' : linha.cicloCorreto ? 'ok' : `${linha.periodicidadeObtida ?? '?'}`;
  console.log(
    `${pad(linha.nome, 24)}${pad(linha.esperado, 12)}${pad(linha.obtido, 12)}${pad(linha.veredito, 10)}${ciclo}`,
  );
}

console.log(`\nLinha de base (${relatorio.linhaDeBase.nome})`);
console.log(`Acurácia ${relatorio.linhaDeBase.acuracia}% | FP ${relatorio.linhaDeBase.falsosPositivos} | FN ${relatorio.linhaDeBase.falsosNegativos}`);
if (relatorio.linhaDeBase.casosCorrigidos.length > 0) {
  console.log(`Heurística corrige a regra ingênua em: ${relatorio.linhaDeBase.casosCorrigidos.join(', ')}`);
}

if (relatorio.falsosPositivos > 0 || relatorio.falsosNegativos > 0) {
  process.exitCode = 1;
}
