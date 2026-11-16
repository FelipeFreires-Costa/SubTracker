import ContaRepository from '../repositories/conta.repository';
import { avancarPorPeriodicidade } from '../utils/date.utils';
import { hojeIso } from '../utils/heuristica.recorrencia';
import { AppError, validarAtualizarConta, validarAtualizarStatus, validarCriarConta, validarIdParam } from '../utils/validation';
import type { Conta } from '../types/conta.types';

/**
 * Conta paga cuja próxima cobrança já passou: avança ciclos até chegar no atual.
 * Ciclos totalmente vencidos são só pulados; o ciclo vigente reabre como não pago.
 */
async function abrirCiclosVencidos(contas: Conta[]): Promise<Conta[]> {
  const hoje = hojeIso();
  const atualizadas: Conta[] = [];

  for (const conta of contas) {
    if (!conta.pago || conta.recorrente === false || !conta.proximaCobranca || conta.proximaCobranca > hoje) {
      atualizadas.push(conta);
      continue;
    }

    let data = conta.proximaCobranca;
    let proxima = avancarPorPeriodicidade(data, conta.periodicidade);
    let guard = 0;

    while (proxima <= hoje && guard < 36) {
      data = proxima;
      proxima = avancarPorPeriodicidade(data, conta.periodicidade);
      guard += 1;
    }

    const aberta = await ContaRepository.atualizarStatus(conta.id, {
      pago: false,
      data,
      proximaCobranca: proxima,
    });

    atualizadas.push(aberta ?? { ...conta, pago: false, data, proximaCobranca: proxima });
  }

  return atualizadas;
}

/**
 * Ao marcar paga: mantém a data do ciclo atual e garante próxima cobrança à frente.
 * Ao desfazer: volta a cobrar no vencimento atual (data).
 */
function datasAoAlternarPago(conta: Conta, pago: boolean): { data?: string; proximaCobranca?: string } {
  if (!pago) {
    return { proximaCobranca: conta.data };
  }

  if (conta.recorrente === false) {
    return {};
  }

  const proximaAtual = conta.proximaCobranca;
  if (proximaAtual && proximaAtual > conta.data) {
    return { proximaCobranca: proximaAtual };
  }

  return { proximaCobranca: avancarPorPeriodicidade(conta.data, conta.periodicidade) };
}

const ContaService = {
  async listar() {
    const contas = await ContaRepository.listar();
    return abrirCiclosVencidos(contas);
  },

  async criar(body: unknown) {
    const dados = validarCriarConta(body);
    return ContaRepository.criar(dados);
  },

  async atualizar(idParam: unknown, body: unknown) {
    const id = validarIdParam(idParam);
    const dados = validarAtualizarConta(body);
    const conta = await ContaRepository.atualizar(id, dados);

    if (!conta) {
      throw new AppError('Conta não encontrada.', 404);
    }

    return conta;
  },

  async atualizarStatus(idParam: unknown, body: unknown) {
    const id = validarIdParam(idParam);
    const dados = validarAtualizarStatus(body);
    const atual = await ContaRepository.buscarPorId(id);

    if (!atual) {
      throw new AppError('Conta não encontrada.', 404);
    }

    const extras = datasAoAlternarPago(atual, dados.pago);
    const conta = await ContaRepository.atualizarStatus(id, {
      pago: dados.pago,
      ...extras,
    });

    if (!conta) {
      throw new AppError('Conta não encontrada.', 404);
    }

    return conta;
  },

  async remover(idParam: unknown) {
    const id = validarIdParam(idParam);
    const removida = await ContaRepository.remover(id);

    if (!removida) {
      throw new AppError('Conta não encontrada.', 404);
    }
  },
};

export default ContaService;
