import type { Conta, Periodicidade } from '../types/Conta';

export function formatarDinheiro(valor: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

function hojeIso() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

type CamposCiclo = Pick<Conta, 'data' | 'proximaCobranca' | 'pago'>;

/** A tela mostra o que o backend calculou; não projeta ciclos que o extrato não mostrou. */
export function dataDeAlerta(conta: CamposCiclo) {
  return conta.proximaCobranca || conta.data;
}

export function contaEstaPaga(conta: CamposCiclo) {
  return conta.pago;
}

const MARCAS: Array<{ trecho: string; nome: string }> = [
  { trecho: 'amazonprime', nome: 'Amazon Prime' },
  { trecho: 'primevideo', nome: 'Prime Video' },
  { trecho: 'disneyplus', nome: 'Disney+' },
  { trecho: 'youtube', nome: 'YouTube' },
  { trecho: 'netflix', nome: 'Netflix' },
  { trecho: 'spotify', nome: 'Spotify' },
  { trecho: 'hbo', nome: 'HBO' },
  { trecho: 'adobe', nome: 'Adobe' },
  { trecho: 'smartfit', nome: 'Smart Fit' },
  { trecho: 'gympass', nome: 'Gympass' },
  { trecho: 'ifood', nome: 'iFood' },
  { trecho: 'vivofibra', nome: 'Vivo Fibra' },
  { trecho: 'vivo', nome: 'Vivo' },
  { trecho: 'claro', nome: 'Claro' },
  { trecho: 'portoseguro', nome: 'Porto Seguro' },
];

export function nomeParaExibicao(nome: string): string {
  const chave = nome.toLowerCase().replace(/[^a-z0-9]/g, '');
  const marca = MARCAS.find((item) => chave.includes(item.trecho));
  if (marca) return marca.nome;

  let texto = nome.trim();
  texto = texto.replace(/^pix\s+(transf(erencia)?\s+)?/i, '');
  texto = texto.replace(/\.(com|br|net|org)\b/gi, ' ');
  texto = texto.replace(/\*+\S+/g, ' ');
  texto = texto.replace(/[_/\-]+/g, ' ');
  texto = texto.replace(/\d{3,}/g, ' ');
  texto = texto.replace(/\s+/g, ' ').trim();
  if (!texto) return nome;

  return texto
    .split(' ')
    .filter(Boolean)
    .map((palavra, indice) => {
      const minuscula = palavra.toLowerCase();
      if (indice > 0 && ['de', 'da', 'do', 'e'].includes(minuscula)) return minuscula;
      if (minuscula.length <= 3) return minuscula.toUpperCase();
      return minuscula.charAt(0).toUpperCase() + minuscula.slice(1);
    })
    .join(' ');
}

export function ehParcela(conta: Pick<Conta, 'parcelaTotal'>) {
  return conta.parcelaTotal != null && conta.parcelaTotal > 1;
}

export function rotuloPeriodicidade(periodicidade?: Periodicidade | null) {
  if (periodicidade === 'mensal') return 'Mensal';
  if (periodicidade === 'bimestral') return 'Bimestral';
  if (periodicidade === 'anual') return 'Anual';
  return null;
}

export function formatarData(dataAmericana: string) {
  if (!dataAmericana) return '';
  const partes = dataAmericana.split('-');
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export function verificarSituacao(dataVencimento: string) {
  if (!dataVencimento) return '';

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataConta = new Date(`${dataVencimento}T00:00:00`);
  const diferenciaTime = dataConta.getTime() - hoje.getTime();
  const dias = Math.ceil(diferenciaTime / (1000 * 60 * 60 * 24));

  if (dias < 0) return 'vencida';
  if (dias === 0) return 'hoje';
  if (dias <= 3) return 'perto';
  return 'tranquilo';
}

export function diasRestantes(dataVencimento: string) {
  if (!dataVencimento) return '';

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataConta = new Date(`${dataVencimento}T00:00:00`);

  const diferenciaTime = dataConta.getTime() - hoje.getTime();
  const dias = Math.ceil(diferenciaTime / (1000 * 60 * 60 * 24));

  if (dias < 0) return `Venceu há ${Math.abs(dias)} dias`;
  if (dias === 0) return 'Vence hoje!';
  if (dias === 1) return 'Falta 1 dia';
  return `Faltam ${dias} dias`;
}

export function proximaContaAberta(contas: Conta[]) {
  const abertas = contas.filter((conta) => !contaEstaPaga(conta));
  if (abertas.length === 0) return null;

  return [...abertas].sort((a, b) => dataDeAlerta(a).localeCompare(dataDeAlerta(b)))[0] ?? null;
}

export function resumoAlertas(contas: Conta[]) {
  let atrasadas = 0;
  let hoje = 0;
  let proximas = 0;

  for (const conta of contas) {
    if (contaEstaPaga(conta)) continue;
    const situacao = verificarSituacao(dataDeAlerta(conta));
    if (situacao === 'vencida') atrasadas += 1;
    else if (situacao === 'hoje') hoje += 1;
    else if (situacao === 'perto') proximas += 1;
  }

  return { atrasadas, hoje, proximas };
}

function mesesDoCiclo(periodicidade?: Periodicidade | null) {
  if (periodicidade === 'anual') return 12;
  if (periodicidade === 'bimestral') return 2;
  return 1;
}

/** Quanto a conta pesa por mês: anual ÷ 12, bimestral ÷ 2. */
export function custoMensal(conta: Pick<Conta, 'preco' | 'periodicidade'>) {
  return Number(conta.preco) / mesesDoCiclo(conta.periodicidade);
}

export function custoAnual(conta: Pick<Conta, 'preco' | 'periodicidade'>) {
  return custoMensal(conta) * 12;
}

function fimDoMes(hoje: string) {
  const [ano, mes] = hoje.split('-').map(Number);
  const ultimo = new Date(ano || 1970, mes || 1, 0).getDate();
  return `${hoje.slice(0, 7)}-${String(ultimo).padStart(2, '0')}`;
}

/** Gasto recorrente: equivalente mensal/anual e o que cai de fato neste mês. */
export function resumoDeGastos(contas: Conta[], hoje = hojeIso()) {
  const porMes = contas.reduce((total, conta) => total + custoMensal(conta), 0);
  const mesAtual = hoje.slice(0, 7);
  const ultimoDia = fimDoMes(hoje);

  const pagoNoMes = contas
    .filter((conta) => conta.pago && conta.data.slice(0, 7) === mesAtual)
    .reduce((total, conta) => total + Number(conta.preco), 0);
  const aPagarNoMes = contas
    .filter((conta) => !conta.pago && dataDeAlerta(conta) <= ultimoDia)
    .reduce((total, conta) => total + Number(conta.preco), 0);

  return {
    porMes,
    porAno: porMes * 12,
    pagoNoMes,
    aPagarNoMes,
    noMes: pagoNoMes + aPagarNoMes,
  };
}

/** Cobranças que ainda vão cair nos próximos dias (inclui atrasadas em aberto). */
export function proximasCobrancas(contas: Conta[], dias = 30, hoje = hojeIso()) {
  const limite = new Date(`${hoje}T00:00:00`);
  limite.setDate(limite.getDate() + dias);
  const limiteIso = `${limite.getFullYear()}-${String(limite.getMonth() + 1).padStart(2, '0')}-${String(limite.getDate()).padStart(2, '0')}`;

  return contas
    .filter((conta) => {
      const vencimento = dataDeAlerta(conta);
      if (!conta.pago && vencimento < hoje) return true;
      return vencimento >= hoje && vencimento <= limiteIso;
    })
    .sort((a, b) => dataDeAlerta(a).localeCompare(dataDeAlerta(b)));
}

export function formatarPercentual(parte: number, total: number) {
  if (total <= 0) return '0%';
  return `${Math.round((parte / total) * 100)}%`;
}

export function cabecalhoDoMes(isoMes: string) {
  const [ano, mes] = isoMes.split('-').map(Number);
  const data = new Date(ano || 1970, (mes || 1) - 1, 1);
  const rotulo = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
}

/** Paga neste mês fica no mês em que foi cobrada; o resto fica no mês do vencimento. */
export function mesDeAgrupamento(conta: CamposCiclo, hoje = hojeIso()) {
  if (conta.pago && conta.data && conta.data.slice(0, 7) === hoje.slice(0, 7)) {
    return conta.data.slice(0, 7);
  }
  return (dataDeAlerta(conta) || hoje).slice(0, 7) || 'sem-data';
}

export function agruparPorMes(contas: Conta[]) {
  const grupos = new Map<string, Conta[]>();

  for (const conta of contas) {
    const chave = mesDeAgrupamento(conta) || 'sem-data';
    const lista = grupos.get(chave) ?? [];
    lista.push(conta);
    grupos.set(chave, lista);
  }

  return Array.from(grupos.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, itens]) => ({
      chave,
      rotulo: chave === 'sem-data' ? 'Sem data' : cabecalhoDoMes(chave),
      total: itens.reduce((soma, conta) => soma + Number(conta.preco), 0),
      contas: itens,
    }));
}