import { avaliarSandbox } from '../src/sandbox/cenarios.sandbox';

const hoje = process.argv[2];
const relatorio = avaliarSandbox(hoje || undefined);

function pad(valor: string | number | null, tamanho: number) {
  return String(valor ?? '-').padEnd(tamanho, ' ');
}

console.log(`Cenários do sandbox local (hoje = ${relatorio.hoje})\n`);
console.log(`${pad('Cenário', 36)}${pad('Esperado', 11)}${pad('Obtido', 11)}${pad('Ciclo', 11)}${pad('Última', 12)}${pad('Próxima', 12)}Pago`);
console.log('-'.repeat(106));

for (const linha of relatorio.linhas) {
  const marca = linha.acertou ? ' ' : '✗';
  console.log(
    `${marca}${pad(linha.nome, 35)}${pad(linha.esperado, 11)}${pad(linha.obtido, 11)}${pad(linha.periodicidade, 11)}${pad(linha.ultimaCobranca, 12)}${pad(linha.proximaCobranca, 12)}${linha.pago === null ? '-' : linha.pago ? 'sim' : 'não'}`,
  );
}

console.log(`\n${relatorio.acertos}/${relatorio.totalCenarios} cenários como esperado.`);

const erros = relatorio.linhas.filter((linha) => !linha.acertou);
for (const linha of erros) {
  console.log(`✗ ${linha.nome}: esperado ${linha.esperado}, obtido ${linha.obtido}. ${linha.motivo}`);
}

if (erros.length > 0) {
  process.exitCode = 1;
}
