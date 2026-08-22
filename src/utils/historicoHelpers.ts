import type { Conta } from '../types/Conta';

export const NOMES_MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const SIGLAS_MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export function partesData(data: string) {
  const [ano, mes] = data.split('-');
  return {
    ano: Number(ano),
    mes: Number(mes),
  };
}

export function formatarReal(valor: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function somarContas(contas: Conta[]) {
  const total = contas.reduce((acc, conta) => acc + Number(conta.preco), 0);
  const pago = contas
    .filter((conta) => conta.pago)
    .reduce((acc, conta) => acc + Number(conta.preco), 0);

  return {
    total,
    pago,
    aberto: total - pago,
    quantidade: contas.length,
  };
}

export function contasDoPeriodo(contas: Conta[], ano: number, mes: number | 'todos') {
  return contas.filter((conta) => {
    const partes = partesData(conta.data);
    if (partes.ano !== ano) return false;
    if (mes === 'todos') return true;
    return partes.mes === mes;
  });
}

export function gastosPorMes(contas: Conta[], ano: number) {
  return NOMES_MESES.map((nome, index) => {
    const mes = index + 1;
    const doMes = contasDoPeriodo(contas, ano, mes);
    return {
      mes,
      nome,
      sigla: SIGLAS_MESES[index] ?? nome,
      valor: somarContas(doMes).total,
    };
  });
}

export function anosDisponiveis(contas: Conta[]) {
  const anos = new Set(contas.map((conta) => partesData(conta.data).ano).filter(Boolean));
  const atual = new Date().getFullYear();
  anos.add(atual);
  return Array.from(anos).sort((a, b) => b - a);
}
