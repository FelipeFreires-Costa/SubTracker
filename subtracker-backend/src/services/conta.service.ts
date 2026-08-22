import ContaRepository from '../repositories/conta.repository';
import { AppError, validarAtualizarConta, validarAtualizarStatus, validarCriarConta, validarIdParam } from '../utils/validation';

const ContaService = {
  async listar() {
    return ContaRepository.listar();
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
    const conta = await ContaRepository.atualizarStatus(id, dados.pago);

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
