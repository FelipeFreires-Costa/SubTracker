export function formatarDinheiro(valor: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
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

export function calcularResumoFinanceiro(contas: Array<{ preco: number; pago: boolean }>) {
  const totalMensal = contas.reduce((total, conta) => total + conta.preco, 0);
  const totalPago = contas
    .filter((conta) => conta.pago)
    .reduce((total, conta) => total + conta.preco, 0);
  const faltaPagar = contas
    .filter((conta) => !conta.pago)
    .reduce((total, conta) => total + conta.preco, 0);

  return { totalMensal, totalPago, faltaPagar };
}
