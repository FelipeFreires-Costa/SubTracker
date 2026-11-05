import fs from 'fs';
import {
  chaveDescricao,
  identificarRecorrencias,
  type Classificacao,
  type TransacaoAnalise,
} from '../../../src/utils/heuristica.recorrencia';
import { vereditoDe, type Veredito } from '../../../src/avaliacao/avaliar.heuristica';
import {
  ARQUIVO_ANONIMIZADO,
  ARQUIVO_DISTRIBUICAO,
  ARQUIVO_GABARITO,
  ARQUIVO_METRICAS,
  ARQUIVO_RESULTADO,
} from './caminhos';
import { situacaoDoAlgoritmo } from './congelar';
import { escreverCsv, lerCsvArquivo } from './csv';

type Rotulo = 'recorrente' | 'nao_recorrente';

interface TransacaoGabarito {
  transaction_id: string;
  date: string;
  description_anonymized: string;
  amount: number;
  account_type: string;
  original_category: string;
  case_id: string;
  expected_label: Rotulo | null;
  expected_cycle: string;
}

interface TransacaoRotulada extends TransacaoGabarito {
  expected_label: Rotulo;
}

export function executarAvaliacao() {
  const algoritmo = situacaoDoAlgoritmo();
  if (!fs.existsSync(ARQUIVO_GABARITO)) {
    throw new Error(`Gabarito não encontrado: ${ARQUIVO_GABARITO}`);
  }
  if (!fs.existsSync(ARQUIVO_ANONIMIZADO)) {
    throw new Error(`Arquivo anonimizado não encontrado: ${ARQUIVO_ANONIMIZADO}`);
  }

  const gabarito = lerCsvArquivo(ARQUIVO_GABARITO).linhas;
  const anonimizadas = new Map(
    lerCsvArquivo(ARQUIVO_ANONIMIZADO).linhas.map((linha) => [linha.transaction_id, linha]),
  );

  if (gabarito.length === 0) {
    throw new Error('Gabarito vazio.');
  }

  const transacoes = gabarito.map((linha) => juntar(linha, anonimizadas.get(linha.transaction_id)));
  const rotuladas = transacoes.filter(ehRotulada);
  const semRotulo = transacoes.length - rotuladas.length;
  const gabaritoCompleto = semRotulo === 0;

  if (rotuladas.length === 0) {
    throw new Error('Nenhuma linha rotulada. Preencha case_id e expected_label em ao menos um caso do gabarito.');
  }

  // O algoritmo recebe o extrato inteiro, como na aplicação. Só a pontuação usa os casos rotulados.
  const paraAlgoritmo: TransacaoAnalise[] = transacoes.map((item) => ({
    description: item.description_anonymized,
    amount: item.amount,
    date: item.date,
    category: item.original_category,
    tipoConta: normalizarTipoConta(item.account_type),
  }));

  const casos = agruparCasos(rotuladas);
  const detectadas = identificarRecorrencias(paraAlgoritmo);
  const porChave = new Map(detectadas.map((item) => [item.chave, item]));

  const linhas = casos.map((caso) => {
    const chave = chaveMaisFrequente(caso.transacoes);
    const obtido = chave ? porChave.get(chave) : undefined;
    const predicted_label: Rotulo = obtido?.classificacao === 'recorrente' ? 'recorrente' : 'nao_recorrente';
    const expected: Classificacao = caso.expected_label === 'recorrente' ? 'recorrente' : 'eventual';
    const predicted: Classificacao = predicted_label === 'recorrente' ? 'recorrente' : 'eventual';
    const classification_result: Veredito = vereditoDe(expected, predicted);

    return {
      case_id: caso.case_id,
      expected_label: caso.expected_label,
      predicted_label,
      expected_cycle: caso.expected_cycle,
      predicted_cycle: predicted_label === 'recorrente' ? obtido?.periodicidade ?? '' : '',
      classification_result,
    };
  });

  const vp = linhas.filter((item) => item.classification_result === 'VP').length;
  const vn = linhas.filter((item) => item.classification_result === 'VN').length;
  const fp = linhas.filter((item) => item.classification_result === 'FP').length;
  const fn = linhas.filter((item) => item.classification_result === 'FN').length;
  const total = vp + vn + fp + fn;
  const accuracy = total === 0 ? 0 : (vp + vn) / total;
  const precision = vp + fp === 0 ? 0 : vp / (vp + fp);
  const recall = vp + fn === 0 ? 0 : vp / (vp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  const datas = transacoes.map((item) => item.date).sort();
  const period_start = datas[0] ?? '';
  const period_end = datas[datas.length - 1] ?? '';
  const recorrentes = casos.filter((item) => item.expected_label === 'recorrente').length;

  const metricas = {
    git_commit: algoritmo.atual.git_commit,
    evaluation_date: new Date().toISOString(),
    period_start,
    period_end,
    transaction_count: transacoes.length,
    case_count: casos.length,
    recurring_cases: recorrentes,
    non_recurring_cases: casos.length - recorrentes,
    VP: vp,
    VN: vn,
    FP: fp,
    FN: fn,
    accuracy: arredondar(accuracy),
    precision: arredondar(precision),
    recall: arredondar(recall),
    f1: arredondar(f1),
    // Avisos de método: deixam claro quando o resultado não é o final.
    gabarito_completo: gabaritoCompleto,
    transactions_labeled: rotuladas.length,
    transactions_unlabeled: semRotulo,
    heuristica_sha256: algoritmo.atual.heuristica_sha256,
    git_commit_congelado: algoritmo.congelado?.git_commit ?? null,
    algoritmo_alterado_desde_congelamento: algoritmo.alterado,
  };

  escreverCsv(
    ARQUIVO_RESULTADO,
    ['case_id', 'expected_label', 'predicted_label', 'expected_cycle', 'predicted_cycle', 'classification_result'],
    linhas,
  );
  fs.writeFileSync(ARQUIVO_METRICAS, `${JSON.stringify(metricas, null, 2)}\n`, 'utf8');
  escreverDistribuicao(transacoes);

  console.log(gabaritoCompleto ? 'Avaliação sobre o gabarito manual\n' : 'AVALIAÇÃO PARCIAL sobre o gabarito manual\n');
  console.log(`Commit: ${algoritmo.atual.git_commit_short}  ${algoritmo.atual.git_subject}`);
  console.log(`Transações: ${transacoes.length}  |  Casos avaliados: ${casos.length}`);
  console.log(`Período: ${period_start} → ${period_end}`);
  console.log(`Esperados recorrentes: ${recorrentes}  |  não recorrentes: ${casos.length - recorrentes}`);
  console.log(`\nVP ${vp} | VN ${vn} | FP ${fp} | FN ${fn}`);
  console.log(
    `Acurácia ${pct(accuracy)} | Precisão ${pct(precision)} | Revocação ${pct(recall)} | F1 ${pct(f1)}`,
  );

  if (!gabaritoCompleto) {
    console.log(
      `\nAviso: ${semRotulo} de ${transacoes.length} transações estão sem case_id ou expected_label e ficaram fora da pontuação. ` +
        'Este não é o resultado final. A informação foi gravada em metricas_reais.json.',
    );
  }
  if (algoritmo.alterado) {
    console.log(
      '\nAviso: a heurística mudou depois do congelamento. As métricas valem para a versão atual, não para a congelada.',
    );
  }
  if (!algoritmo.congelado) {
    console.log('\nAviso: não há algoritmo_congelado.json. O commit registrado é o atual.');
  }

  console.log('\nArquivos:');
  console.log(`- ${ARQUIVO_RESULTADO}`);
  console.log(`- ${ARQUIVO_METRICAS}`);
  console.log(`- ${ARQUIVO_DISTRIBUICAO}`);
}

function ehRotulada(item: TransacaoGabarito): item is TransacaoRotulada {
  return item.case_id !== '' && item.expected_label !== null;
}

function juntar(gabarito: Record<string, string>, anonimizada?: Record<string, string>): TransacaoGabarito {
  if (!anonimizada) {
    throw new Error(`transaction_id ${gabarito.transaction_id} está no gabarito, mas não no arquivo anonimizado.`);
  }

  const rotuloTexto = String(gabarito.expected_label ?? '').trim();
  const expected_label = rotuloTexto === '' ? null : normalizarRotulo(rotuloTexto);
  if (rotuloTexto !== '' && !expected_label) {
    throw new Error(
      `expected_label inválido em ${gabarito.transaction_id}: "${rotuloTexto}". Use recorrente ou nao_recorrente.`,
    );
  }

  return {
    transaction_id: gabarito.transaction_id,
    date: anonimizada.date,
    description_anonymized: anonimizada.description_anonymized,
    amount: Number(String(anonimizada.amount).replace(',', '.')),
    account_type: anonimizada.account_type ?? '',
    original_category: anonimizada.original_category ?? '',
    case_id: String(gabarito.case_id ?? '').trim(),
    expected_label,
    expected_cycle: String(gabarito.expected_cycle ?? '').trim().toLowerCase(),
  };
}

function normalizarRotulo(valor: string): Rotulo | null {
  const t = valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
  if (t === 'recorrente') return 'recorrente';
  if (t === 'nao_recorrente' || t === 'naorecorrente' || t === 'eventual') return 'nao_recorrente';
  return null;
}

function agruparCasos(transacoes: TransacaoRotulada[]) {
  const grupos = new Map<string, TransacaoRotulada[]>();
  for (const item of transacoes) {
    const lista = grupos.get(item.case_id) ?? [];
    lista.push(item);
    grupos.set(item.case_id, lista);
  }

  return [...grupos.entries()].map(([case_id, itens]) => {
    const rotulos = new Set(itens.map((item) => item.expected_label));
    if (rotulos.size !== 1) {
      throw new Error(`O caso ${case_id} tem expected_label misturado. Unifique o gabarito desse case_id.`);
    }
    const ciclos = [...new Set(itens.map((item) => item.expected_cycle).filter(Boolean))];
    if (ciclos.length > 1) {
      throw new Error(`O caso ${case_id} tem expected_cycle conflitante: ${ciclos.join(', ')}.`);
    }
    return {
      case_id,
      expected_label: itens[0]!.expected_label,
      expected_cycle: ciclos[0] ?? '',
      transacoes: itens,
    };
  });
}

function chaveMaisFrequente(transacoes: TransacaoGabarito[]): string | null {
  const contagem = new Map<string, number>();
  for (const item of transacoes) {
    const chave = chaveDescricao(item.description_anonymized);
    if (!chave) continue;
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }
  let melhor: string | null = null;
  let max = -1;
  for (const [chave, n] of contagem) {
    if (n > max) {
      melhor = chave;
      max = n;
    }
  }
  return melhor;
}

function normalizarTipoConta(valor: string): string | undefined {
  const t = valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (/(credit|cartao|fatura)/.test(t)) return 'CREDIT';
  if (/(check|corrente|debito|poupanca)/.test(t)) return 'CHECKING';
  return valor || undefined;
}

function escreverDistribuicao(transacoes: TransacaoGabarito[]) {
  const meses = new Map<string, number>();
  for (const item of transacoes) {
    const mes = item.date.slice(0, 7);
    meses.set(mes, (meses.get(mes) ?? 0) + 1);
  }
  const linhas = [...meses.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year_month, transaction_count]) => ({ year_month, transaction_count }));
  escreverCsv(ARQUIVO_DISTRIBUICAO, ['year_month', 'transaction_count'], linhas);
}

function arredondar(valor: number): number {
  return Number(valor.toFixed(4));
}

function pct(valor: number): string {
  return `${(valor * 100).toFixed(1)}%`;
}
