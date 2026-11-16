import fs from 'fs';
import path from 'path';
import { avaliarConjuntoTeste } from '../src/avaliacao/avaliar.teste';

const relatorio = avaliarConjuntoTeste();
const destino = path.join(__dirname, '..', 'avaliacao', 'resultado-teste.json');

fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, `${JSON.stringify(relatorio, null, 2)}\n`, 'utf8');

function pad(valor: string | number, tamanho: number) {
  return String(valor).padEnd(tamanho, ' ');
}

function linhaResumo(rotulo: string, r: typeof relatorio.heuristica) {
  return `${pad(rotulo, 14)}VP ${pad(r.verdadeirosPositivos, 4)}VN ${pad(r.verdadeirosNegativos, 4)}FP ${pad(r.falsosPositivos, 4)}FN ${pad(r.falsosNegativos, 4)}Acurácia ${pad(`${r.acuracia}%`, 8)}Precisão ${pad(`${r.precisao}%`, 8)}Recall ${pad(`${r.recall}%`, 8)}F1 ${r.f1}%`;
}

console.log('Avaliação no conjunto de teste (sintético, separado do gabarito de desenvolvimento)\n');
console.log(`Semente ${relatorio.semente} | ${relatorio.perfis} perfis × ${relatorio.mesesPorPerfil} meses`);
console.log(`Casos: ${relatorio.totalCasos} | Transações nos casos: ${relatorio.totalTransacoes}\n`);
console.log(linhaResumo('Heurística', relatorio.heuristica));
console.log(linhaResumo('Linha de base', relatorio.linhaDeBase));
if (relatorio.acertoDeCicloEntreRecorrentes !== null) {
  console.log(`\nAcerto do ciclo (recorrentes detectados): ${relatorio.acertoDeCicloEntreRecorrentes}%`);
}

console.log('\nPor cenário (heurística | linha de base)');
console.log('-'.repeat(80));
for (const item of relatorio.porCenario) {
  const h = item.heuristica;
  const b = item.linhaDeBase;
  console.log(
    `${pad(item.cenario, 36)}${pad(item.casos, 4)}acertos ${pad(h.verdadeirosPositivos + h.verdadeirosNegativos, 3)}| ${b.verdadeirosPositivos + b.verdadeirosNegativos}`,
  );
}

const erros = relatorio.linhas.filter((linha) => linha.veredito === 'FP' || linha.veredito === 'FN');
if (erros.length > 0) {
  console.log('\nErros da heurística');
  for (const linha of erros) {
    console.log(`${pad(linha.veredito, 4)}${pad(linha.perfil, 11)}${pad(linha.cenario, 36)}${linha.nome}`);
  }
}

console.log(`\n${relatorio.observacao}`);
