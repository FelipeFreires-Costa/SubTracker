export type Periodicidade = 'mensal' | 'bimestral' | 'anual' | 'indefinida';
export type Classificacao = 'recorrente' | 'eventual';
/** ativa: cobrou no ciclo atual. pendente: a cobrança esperada passou há pouco. encerrada: parou de cobrar. */
export type Situacao = 'ativa' | 'pendente' | 'encerrada';

export interface TransacaoAnalise {
  description: string;
  amount: number;
  date: string;
  category: string;
  tipoConta?: string;
  status?: string;
  parcelaAtual?: number;
  parcelaTotal?: number;
  merchantName?: string;
}

export interface RecorrenciaDetectada {
  chave: string;
  nome: string;
  preco: number;
  ultimaCobranca: string;
  proximaCobranca: string;
  primeiraCobranca: string;
  totalGasto: number;
  periodicidade: Periodicidade;
  categoria: string;
  ocorrencias: number;
  classificacao: Classificacao;
  situacao: Situacao;
  pago: boolean;
  parcelaAtual: number | null;
  parcelaTotal: number | null;
}

function parseData(valor: string): Date {
  return new Date(`${valor.split('T')[0]}T00:00:00`);
}

function formatarDataIso(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function mediana(numeros: number[]): number {
  const ordenados = [...numeros].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  const valorMeio = ordenados[meio];

  if (valorMeio === undefined) {
    return 0;
  }

  if (ordenados.length % 2 === 0) {
    const anterior = ordenados[meio - 1];
    return ((anterior ?? valorMeio) + valorMeio) / 2;
  }

  return valorMeio;
}

export function ehDespesa(valor: number, tipoConta?: string): boolean {
  if ((tipoConta ?? '').toUpperCase() === 'CREDIT') {
    return valor > 0;
  }

  return valor < 0;
}

function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function palavrasDaDescricao(descricao: string): string[] {
  return semAcento(descricao)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function chaveDescricao(descricao: string): string {
  return semAcento(descricao)
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/^www\./, '')
    .replace(/\.(com|br|net|org)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .replace(/\d+$/g, '');
}

export function ehRuidoBancario(chave: string): boolean {
  return (
    chave.includes('pagamentofatura') ||
    chave.includes('faturacartao') ||
    chave.includes('pagamentocartao') ||
    chave.includes('pagamentodeboleto')
  );
}

/** Descrições de PIX/TED que ainda são conta (aluguel, condomínio, operadora). */
const INDICADORES_CONTA_NO_PIX = [
  'aluguel',
  'condominio',
  'sindico',
  'energia',
  'cemig',
  'copel',
  'enel',
  'sabesp',
  'internet',
  'fibra',
  'vivo',
  'claro',
  'netflix',
  'spotify',
  'mensalidade',
  'escola',
  'faculdade',
  'unimed',
  'seguro',
  'academia',
  'smartfit',
];

function categoriaDeTransferencia(categoria: string): boolean {
  const valor = categoria.toLowerCase();
  return valor.includes('transfer') || valor === 'pix';
}

function descricaoDeTransferencia(chave: string): boolean {
  return (
    chave.startsWith('pix') ||
    chave.startsWith('transferencia') ||
    chave.startsWith('transf') ||
    chave === 'ted' ||
    chave.startsWith('tedtransf') ||
    chave.startsWith('tedenviado') ||
    /^ted\d/.test(chave) ||
    chave === 'doc' ||
    /^doc\d/.test(chave)
  );
}

/** Compara por palavra (e pares de palavras), para "Irene Lopes" não casar com "enel". */
function temIndicadorDeConta(descricao: string): boolean {
  const palavras = palavrasDaDescricao(descricao);
  const termos = [...palavras];
  for (let i = 1; i < palavras.length; i += 1) {
    termos.push(`${palavras[i - 1]}${palavras[i]}`);
  }

  return INDICADORES_CONTA_NO_PIX.some((indicador) =>
    termos.some((termo) => termo === indicador || (termo.startsWith(indicador) && indicador.length >= 5)),
  );
}

/** PIX/TED pessoa a pessoa: movimento, não assinatura. Contas nomeadas no PIX passam. */
export function ehTransferenciaPessoa(descricao: string, categoria = ''): boolean {
  const chave = chaveDescricao(descricao);
  if (!categoriaDeTransferencia(categoria) && !descricaoDeTransferencia(chave)) {
    return false;
  }

  return !temIndicadorDeConta(descricao);
}

export function extrairParcela(
  descricao: string,
  meta?: { parcelaAtual?: number; parcelaTotal?: number },
): { atual: number; total: number } | null {
  if (
    meta?.parcelaAtual &&
    meta.parcelaTotal &&
    meta.parcelaTotal > 1 &&
    meta.parcelaAtual >= 1 &&
    meta.parcelaAtual <= meta.parcelaTotal
  ) {
    return { atual: meta.parcelaAtual, total: meta.parcelaTotal };
  }

  const noFim = descricao.trim().match(/\b(\d{1,2})\s*\/\s*(\d{1,2})\s*$/);
  const noTexto = descricao.match(/parcela\s*(\d{1,2})\s*\/\s*(\d{1,2})/i);
  const match = noFim ?? noTexto;
  if (!match) return null;

  const atual = Number(match[1]);
  const total = Number(match[2]);
  if (!Number.isFinite(atual) || !Number.isFinite(total) || total < 2 || atual < 1 || atual > total) {
    return null;
  }

  return { atual, total };
}

export function nomeSemParcela(descricao: string): string {
  return descricao
    .replace(/\s*parcela\s*\d{1,2}\s*\/\s*\d{1,2}/i, '')
    .replace(/\s*\d{1,2}\s*\/\s*\d{1,2}\s*$/, '')
    .trim();
}

function pontuacaoNomeLegivel(texto: string): number {
  const espacos = (texto.match(/\s/g) ?? []).length;
  const digitos = (texto.match(/\d/g) ?? []).length;
  const longo = texto.length > 42 ? 8 : 0;
  return espacos * 12 - digitos - longo;
}

function escolherDescricaoGrupo(lista: TransacaoAnalise[]): string {
  const candidatos = lista
    .flatMap((item) => [item.merchantName, item.description])
    .filter((valor): valor is string => Boolean(valor && valor.trim()));

  if (candidatos.length === 0) return lista[lista.length - 1]?.description ?? '';

  return [...candidatos].sort((a, b) => pontuacaoNomeLegivel(b) - pontuacaoNomeLegivel(a))[0] ?? candidatos[0];
}

export function hojeIso(referencia = new Date()): string {
  const ano = referencia.getFullYear();
  const mes = String(referencia.getMonth() + 1).padStart(2, '0');
  const dia = String(referencia.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Compra parcelada no cartão (3/12, 7/7). */
export function ehParcelaCartao(descricao: string, meta?: { parcelaAtual?: number; parcelaTotal?: number }): boolean {
  return extrairParcela(descricao, meta) !== null;
}

const TOLERANCIA_VALOR_PADRAO = 0.15;
/** Luz, água e gás variam com o consumo; a tolerância de valor é maior. */
const TOLERANCIA_VALOR_CONSUMO = 0.35;
const CATEGORIAS_DE_CONSUMO = ['electricity', 'water', 'gas', 'utilities', 'energia', 'agua'];

export function toleranciaDeValor(categoria = ''): number {
  const valor = semAcento(categoria).toLowerCase();
  return CATEGORIAS_DE_CONSUMO.some((item) => valor.includes(item))
    ? TOLERANCIA_VALOR_CONSUMO
    : TOLERANCIA_VALOR_PADRAO;
}

function valorEstavelContra(valor: number, referencia: number, tolerancia: number): boolean {
  if (referencia === 0) return valor === 0;
  return Math.abs(valor - referencia) / referencia <= tolerancia || Math.abs(valor - referencia) <= 2;
}

function valoresEstaveis(absolutos: number[], tolerancia: number): boolean {
  const referencia = mediana(absolutos);
  return absolutos.every((valor) => valorEstavelContra(valor, referencia, tolerancia));
}

/**
 * Valores estáveis no grupo todo, ou com um único mês fora (promoção),
 * ou estáveis nas três últimas cobranças (reajuste de preço).
 */
export function valoresProximos(valores: number[], tolerancia = TOLERANCIA_VALOR_PADRAO): boolean {
  const absolutos = valores.map((valor) => Math.abs(valor));

  if (valoresEstaveis(absolutos, tolerancia)) {
    return true;
  }

  if (absolutos.length < 3) {
    return false;
  }

  const referencia = mediana(absolutos);
  let pior = 0;
  let maiorDistancia = -1;
  for (let i = 0; i < absolutos.length; i += 1) {
    const distancia = Math.abs((absolutos[i] ?? 0) - referencia);
    if (distancia > maiorDistancia) {
      maiorDistancia = distancia;
      pior = i;
    }
  }

  if (valoresEstaveis(absolutos.filter((_, indice) => indice !== pior), tolerancia)) {
    return true;
  }

  return valoresEstaveis(absolutos.slice(-3), tolerancia);
}

export function classificarPeriodicidade(dias: number): Periodicidade {
  if (dias >= 25 && dias <= 36) return 'mensal';
  if (dias >= 55 && dias <= 75) return 'bimestral';
  if (dias >= 340 && dias <= 390) return 'anual';
  return 'indefinida';
}

function ultimoDiaDoMes(data: Date): number {
  return new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate();
}

function diaDoCiclo(data: Date): number {
  const dia = data.getDate();
  const ultimo = ultimoDiaDoMes(data);
  return dia >= ultimo - 1 ? 31 : dia;
}

function diasDoMesCompativeis(datas: Date[], tolerancia = 3): boolean {
  const dias = datas.map(diaDoCiclo);
  const referencia = mediana(dias);
  return dias.every((dia) => Math.abs(dia - referencia) <= tolerancia);
}

/** Todo intervalo precisa caber no ciclo; no mensal, aceita um único mês pulado (55–75 dias). */
function periodicidadePorIntervalos(intervalos: number[]): Periodicidade {
  if (intervalos.length === 0) return 'indefinida';

  const candidata = classificarPeriodicidade(mediana(intervalos));
  if (candidata === 'indefinida') return 'indefinida';

  let pulos = 0;
  for (const dias of intervalos) {
    if (classificarPeriodicidade(dias) === candidata) continue;
    if (candidata === 'mensal' && dias >= 55 && dias <= 75 && pulos === 0) {
      pulos += 1;
      continue;
    }
    return 'indefinida';
  }

  return candidata;
}

function mesesEntre(anterior: Date, atual: Date): number {
  return (atual.getFullYear() - anterior.getFullYear()) * 12 + (atual.getMonth() - anterior.getMonth());
}

export function classificarPeriodicidadePorDatas(datas: Date[]): Periodicidade {
  if (datas.length < 2) return 'indefinida';

  const ordenadas = [...datas].sort((a, b) => a.getTime() - b.getTime());
  const gapsMeses: number[] = [];

  for (let i = 1; i < ordenadas.length; i += 1) {
    const atual = ordenadas[i];
    const anterior = ordenadas[i - 1];
    if (!atual || !anterior) continue;
    gapsMeses.push(mesesEntre(anterior, atual));
  }

  const peloDias = periodicidadePorIntervalos(intervalosEmDias(ordenadas));

  if (gapsMeses.length === 0 || gapsMeses.some((gap) => gap === 0) || !diasDoMesCompativeis(ordenadas)) {
    return peloDias;
  }

  if (gapsMeses.every((gap) => gap === 1)) return 'mensal';
  if (gapsMeses.every((gap) => gap === 2)) return 'bimestral';
  if (gapsMeses.every((gap) => gap === 12)) return 'anual';

  const temMensal = gapsMeses.some((gap) => gap === 1);
  const soMensalOuPulo = gapsMeses.every((gap) => gap === 1 || gap === 2);
  if (temMensal && soMensalOuPulo && gapsMeses.filter((gap) => gap === 2).length <= 1) {
    return 'mensal';
  }

  return peloDias;
}

export function aplicarPeriodo(iso: string, meses: number): string {
  const data = parseData(iso);
  const diaOriginal = data.getDate();
  const eraFim = diaOriginal >= ultimoDiaDoMes(data);
  data.setDate(1);
  data.setMonth(data.getMonth() + meses);
  const ultimo = ultimoDiaDoMes(data);
  data.setDate(eraFim ? ultimo : Math.min(diaOriginal, ultimo));
  return formatarDataIso(data);
}

export function projetarProximaCobranca(
  ultimaCobranca: string,
  periodicidade: Periodicidade,
  intervaloMedioDias: number,
): string {
  if (periodicidade === 'mensal') return aplicarPeriodo(ultimaCobranca, 1);
  if (periodicidade === 'bimestral') return aplicarPeriodo(ultimaCobranca, 2);
  if (periodicidade === 'anual') return aplicarPeriodo(ultimaCobranca, 12);

  const data = parseData(ultimaCobranca);
  const dias = intervaloMedioDias > 0 ? Math.round(intervaloMedioDias) : 30;
  data.setDate(data.getDate() + dias);
  return formatarDataIso(data);
}

/** Dias de atraso tolerados depois da data esperada antes de considerar a assinatura encerrada. */
const TOLERANCIA_ATRASO_DIAS: Record<Periodicidade, number> = {
  mensal: 10,
  bimestral: 15,
  anual: 30,
  indefinida: 10,
};

function diasEntre(inicio: string, fim: string): number {
  return Math.round((parseData(fim).getTime() - parseData(inicio).getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Situação da assinatura em relação a hoje, a partir da última cobrança vista no extrato.
 * Não projeta ciclos que o extrato não mostrou: se parou de cobrar, é encerrada.
 */
export function avaliarSituacao(
  ultimaCobranca: string,
  periodicidade: Periodicidade,
  hoje = hojeIso(),
  intervaloMedioDias = 30,
): { situacao: Situacao; pago: boolean; proximaCobranca: string } {
  const esperada = projetarProximaCobranca(ultimaCobranca, periodicidade, intervaloMedioDias);

  if (hoje < esperada) {
    return { situacao: 'ativa', pago: true, proximaCobranca: esperada };
  }

  if (diasEntre(esperada, hoje) <= TOLERANCIA_ATRASO_DIAS[periodicidade]) {
    return { situacao: 'pendente', pago: false, proximaCobranca: esperada };
  }

  return { situacao: 'encerrada', pago: false, proximaCobranca: esperada };
}

function intervalosEmDias(datas: Date[]): number[] {
  const ordenadas = [...datas].sort((a, b) => a.getTime() - b.getTime());
  const intervalos: number[] = [];

  for (let i = 1; i < ordenadas.length; i += 1) {
    const atual = ordenadas[i];
    const anterior = ordenadas[i - 1];
    if (!atual || !anterior) continue;
    intervalos.push(Math.round((atual.getTime() - anterior.getTime()) / (1000 * 60 * 60 * 24)));
  }

  return intervalos;
}

/**
 * Critérios obrigatórios: ciclo reconhecido (mensal, bimestral ou anual) e valor estável.
 * Ocorrências mínimas: 3; basta 2 para ciclo anual ou quando a categoria é Subscriptions.
 */
function ehPadraoRecorrente(params: {
  ocorrencias: number;
  valoresOk: boolean;
  periodicidade: Periodicidade;
  categoriaAssinatura: boolean;
}): boolean {
  if (params.periodicidade === 'indefinida' || !params.valoresOk) return false;
  if (params.ocorrencias >= 3) return true;
  return params.ocorrencias >= 2 && (params.periodicidade === 'anual' || params.categoriaAssinatura);
}

export function identificarRecorrencias(
  transacoes: TransacaoAnalise[],
  hoje = hojeIso(),
): RecorrenciaDetectada[] {
  const despesas = transacoes.filter((item) => ehDespesa(item.amount, item.tipoConta));
  const grupos = new Map<string, TransacaoAnalise[]>();

  for (const transacao of despesas) {
    const chave = chaveDescricao(transacao.description);
    if (!chave || ehRuidoBancario(chave) || ehTransferenciaPessoa(transacao.description, transacao.category)) {
      continue;
    }

    const lista = grupos.get(chave) ?? [];
    lista.push(transacao);
    grupos.set(chave, lista);
  }

  const resultado: RecorrenciaDetectada[] = [];

  for (const [chave, lista] of grupos) {
    const ordenada = [...lista].sort(
      (a, b) => parseData(a.date).getTime() - parseData(b.date).getTime(),
    );
    const ultima = ordenada[ordenada.length - 1];
    if (!ultima) continue;

    const datas = ordenada.map((item) => parseData(item.date));
    const gaps = intervalosEmDias(datas);
    const intervaloMedio = gaps.length > 0 ? mediana(gaps) : 0;
    const periodicidadeDetectada = classificarPeriodicidadePorDatas(datas);
    const categoria = ordenada.find((item) => item.category)?.category || 'Assinatura';
    const valores = ordenada.map((item) => item.amount);
    const valoresOk = valoresProximos(valores, toleranciaDeValor(categoria));
    const categoriaAssinatura = ordenada.some(
      (item) => item.category?.toLowerCase() === 'subscriptions',
    );

    const parcelas = ordenada
      .map((item) => extrairParcela(item.description, item))
      .filter((item): item is { atual: number; total: number } => item !== null);
    const ehParcela = parcelas.length > 0;
    const parcelaAtual = ehParcela ? Math.max(...parcelas.map((item) => item.atual)) : null;
    const parcelaTotal = ehParcela ? Math.max(...parcelas.map((item) => item.total)) : null;

    const recorrente =
      !ehParcela &&
      ehPadraoRecorrente({
        ocorrencias: ordenada.length,
        valoresOk,
        periodicidade: periodicidadeDetectada,
        categoriaAssinatura,
      });
    const periodicidade: Periodicidade = ehParcela ? 'mensal' : periodicidadeDetectada;
    const preco = Math.abs(mediana(valores.slice(-3)));
    const primeira = ordenada[0];
    const primeiraCobranca = (primeira?.date.split('T')[0] ?? primeira?.date) || '';
    const ultimaCobranca = ultima.date.split('T')[0] ?? ultima.date;
    const totalGasto = Number(
      valores.reduce((soma, valor) => soma + Math.abs(valor), 0).toFixed(2),
    );
    const planoQuitado = ehParcela && parcelaAtual !== null && parcelaTotal !== null && parcelaAtual >= parcelaTotal;
    const ciclo = planoQuitado
      ? { situacao: 'encerrada' as const, pago: true, proximaCobranca: ultimaCobranca }
      : avaliarSituacao(ultimaCobranca, periodicidade, hoje, intervaloMedio);
    const bruto = escolherDescricaoGrupo(ordenada);

    resultado.push({
      chave,
      nome: ehParcela ? nomeSemParcela(bruto) : bruto.trim(),
      preco,
      ultimaCobranca,
      proximaCobranca: ciclo.proximaCobranca,
      primeiraCobranca,
      totalGasto,
      periodicidade,
      categoria,
      ocorrencias: ordenada.length,
      classificacao: recorrente ? 'recorrente' : 'eventual',
      situacao: ciclo.situacao,
      pago: ciclo.pago,
      parcelaAtual,
      parcelaTotal,
    });
  }

  return resultado;
}
