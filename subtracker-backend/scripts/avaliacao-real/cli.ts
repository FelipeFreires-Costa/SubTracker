import fs from 'fs';
import path from 'path';
import { anonimizarTransacoes, type TransacaoAnonimizada } from './lib/anonimizar';
import {
  ARQUIVO_ANONIMIZADO,
  ARQUIVO_CONFIG_EXEMPLO,
  ARQUIVO_CONGELADO,
  ARQUIVO_DISTRIBUICAO,
  ARQUIVO_GABARITO,
  PASTA_BACKUP,
  PASTA_ENTRADA,
  garantirPastas,
  lerConfig,
  resolverArquivoEntrada,
} from './lib/caminhos';
import { congelarAlgoritmo } from './lib/congelar';
import { escreverCsv } from './lib/csv';
import { importarExtrato, type RelatorioImportacao } from './lib/importar';
import { formatarValorCsv } from './lib/valores';

function main() {
  const comando = process.argv[2];
  const arquivo = process.argv[3];

  try {
    if (comando === 'inspecionar') inspecionar(arquivo);
    else if (comando === 'anonimizar') anonimizar(arquivo);
    else if (comando === 'avaliar') {
      const { executarAvaliacao } = require('./lib/avaliar');
      executarAvaliacao();
    } else {
      imprimirAjuda();
      process.exit(comando ? 1 : 0);
    }
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    console.error(mensagem);
    process.exit(1);
  }
}

function inspecionar(arquivoOpcional?: string) {
  garantirPastas();
  const relatorio = importarExtrato(resolverArquivoEntrada(arquivoOpcional));
  imprimirRelatorio(relatorio);
  console.log('\nNenhum algoritmo de recorrência foi executado nesta etapa.');
}

function anonimizar(arquivoOpcional?: string) {
  garantirPastas();
  const config = lerConfig();
  const relatorio = importarExtrato(resolverArquivoEntrada(arquivoOpcional));
  imprimirRelatorio(relatorio);

  if (relatorio.transacoes.length === 0) {
    throw new Error('Não há transações para anonimizar. Ajuste o arquivo ou o mapeamento e tente de novo.');
  }

  const transacoes = relatorio.transacoes.map((item) => ({
    ...item,
    amount: config.inverter_sinal ? -item.amount : item.amount,
    account_type: item.account_type || config.account_type_default,
  }));

  const anonimizadas = anonimizarTransacoes(transacoes, config.redact_extra);
  guardarCopiaDoQueSeraSobrescrito();
  const congelado = congelarAlgoritmo();

  escreverCsv(
    ARQUIVO_ANONIMIZADO,
    ['transaction_id', 'date', 'description_anonymized', 'amount', 'account_type', 'original_category'],
    anonimizadas.map((item) => ({ ...item, amount: formatarValorCsv(item.amount) })),
  );

  escreverCsv(
    ARQUIVO_GABARITO,
    ['transaction_id', 'date', 'description_anonymized', 'amount', 'case_id', 'expected_label', 'expected_cycle', 'notes'],
    anonimizadas.map((item) => ({
      transaction_id: item.transaction_id,
      date: item.date,
      description_anonymized: item.description_anonymized,
      amount: formatarValorCsv(item.amount),
      case_id: '',
      expected_label: '',
      expected_cycle: '',
      notes: '',
    })),
  );

  escreverDistribuicao(anonimizadas);

  console.log('\nAlgoritmo congelado (não altere a heurística a partir daqui):');
  console.log(`  commit  ${congelado.git_commit}`);
  console.log(`  arquivo ${congelado.heuristica_arquivo}`);
  console.log(`  sha256  ${congelado.heuristica_sha256}`);
  console.log(`  gravado ${ARQUIVO_CONGELADO}`);
  console.log('\nArquivos gerados (rótulos vazios de propósito):');
  console.log(`  ${ARQUIVO_ANONIMIZADO}`);
  console.log(`  ${ARQUIVO_GABARITO}`);
  console.log(`  ${ARQUIVO_DISTRIBUICAO}`);
  console.log('\nPreencha case_id e expected_label no gabarito. Só depois rode: avaliar');
  console.log('Nenhum algoritmo de recorrência foi executado nesta etapa.');
}

/** Rodar anonimizar de novo recria o gabarito vazio. Antes disso, guarda o que já existe. */
function guardarCopiaDoQueSeraSobrescrito() {
  const existentes = [ARQUIVO_GABARITO, ARQUIVO_ANONIMIZADO, ARQUIVO_DISTRIBUICAO, ARQUIVO_CONGELADO].filter(
    (arquivo) => fs.existsSync(arquivo),
  );
  if (existentes.length === 0) return;

  const carimbo = new Date().toISOString().replace(/[:.]/g, '-');
  const destino = path.join(PASTA_BACKUP, carimbo);
  fs.mkdirSync(destino, { recursive: true });
  for (const arquivo of existentes) {
    fs.copyFileSync(arquivo, path.join(destino, path.basename(arquivo)));
  }
  console.log(`\nCópia do que já existia guardada em: ${destino}`);
}

function escreverDistribuicao(transacoes: TransacaoAnonimizada[]) {
  const meses = new Map<string, number>();
  for (const item of transacoes) {
    const mes = item.date.slice(0, 7);
    meses.set(mes, (meses.get(mes) ?? 0) + 1);
  }
  const linhas = [...meses.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year_month, transaction_count]) => ({ year_month, transaction_count }));
  escreverCsv(ARQUIVO_DISTRIBUICAO, ['year_month', 'transaction_count'], linhas);

  const datas = transacoes.map((item) => item.date).sort();
  console.log('\nDistribuição temporal:');
  console.log(`  primeira data: ${datas[0]}`);
  console.log(`  última data:   ${datas[datas.length - 1]}`);
  console.log(`  meses cobertos: ${linhas.length}`);
  for (const linha of linhas) {
    console.log(`  ${linha.year_month}  ${linha.transaction_count}`);
  }
}

function imprimirRelatorio(relatorio: RelatorioImportacao) {
  console.log(`Arquivo:   ${relatorio.arquivo}`);
  console.log(`Formato:   ${relatorio.formato.toUpperCase()}`);
  console.log(`Colunas:   ${relatorio.colunas.join(' | ') || '(sem cabeçalho)'}`);
  console.log('Mapeamento detectado:');
  console.log(`  data         ← ${relatorio.mapeamento.date || '(não encontrado)'}`);
  console.log(`  descrição    ← ${relatorio.mapeamento.description || '(não encontrado)'}`);
  console.log(`  valor        ← ${relatorio.mapeamento.amount || '(não encontrado)'}`);
  console.log(`  tipo conta   ← ${relatorio.mapeamento.account_type || '(não encontrado)'}`);
  console.log(`  categoria    ← ${relatorio.mapeamento.original_category || '(não encontrado)'}`);
  console.log(
    `Transações válidas: ${relatorio.transacoes.length}  (negativos ${relatorio.negativos}, positivos ${relatorio.positivos}, zero ${relatorio.zeros})`,
  );
  if (relatorio.amostras.length > 0) {
    console.log('Amostra (ainda sem anonimizar — só no terminal, não é gravada):');
    for (const item of relatorio.amostras) {
      console.log(`  ${item.date}  ${formatarValorCsv(item.amount)}  ${resumir(item.description)}`);
    }
  }
  for (const aviso of relatorio.avisos) {
    console.log(`Aviso: ${aviso}`);
  }
}

function resumir(texto: string): string {
  const limpo = texto.replace(/\s+/g, ' ').trim();
  return limpo.length > 72 ? `${limpo.slice(0, 69)}...` : limpo;
}

function imprimirAjuda() {
  console.log(`Avaliação descartável com extrato real (isolada da aplicação).

Uso, a partir de subtracker-backend:

  npx ts-node --transpile-only scripts/avaliacao-real/cli.ts inspecionar
  npx ts-node --transpile-only scripts/avaliacao-real/cli.ts anonimizar
  npx ts-node --transpile-only scripts/avaliacao-real/cli.ts avaliar

Coloque o CSV, XLSX ou OFX em:
  ${PASTA_ENTRADA}

Ou passe o caminho:
  ... inspecionar "C:\\caminho\\extrato.ofx"

Opcional: copie ${path.basename(ARQUIVO_CONFIG_EXEMPLO)} para config.json
e/ou crie redact_extra.txt com o seu nome (uma linha por termo).

O comando avaliar não bloqueia. Se o gabarito estiver incompleto ou a
heurística tiver mudado depois do congelamento, ele avisa e registra isso
em metricas_reais.json.
`);
}

if (!fs.existsSync(PASTA_ENTRADA)) {
  garantirPastas();
}

main();
