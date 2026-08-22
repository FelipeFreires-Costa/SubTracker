import AssinaturaRepository from '../repositories/assinatura.repository';
import PluggyService from './pluggy.service';
import { bancoParaResposta, pluggyParaResposta, type TransacaoResposta } from '../utils/transacao.mapper';

function bancoIndisponivel(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error.code === 'ECONNREFUSED' || error.code === '42P01')
  );
}

const PluggyAssinaturaService = {
  async buscarExtratoFiltrado(itemId: string): Promise<TransacaoResposta[]> {
    let bancoAtivo = true;

    try {
      const assinaturasSalvas = await AssinaturaRepository.buscarPorItemId(itemId);

      if (assinaturasSalvas.length > 0) {
        return assinaturasSalvas.map(bancoParaResposta);
      }
    } catch (error) {
      if (!bancoIndisponivel(error)) {
        throw error;
      }
      bancoAtivo = false;
    }

    const result = await PluggyService.getFilteredTransactions(itemId);
    const extratoFiltrado = result.extratoFiltrado.map(pluggyParaResposta);

    if (!bancoAtivo) {
      return extratoFiltrado;
    }

    for (const transacao of extratoFiltrado) {
      await AssinaturaRepository.salvar(
        itemId,
        transacao.description,
        transacao.amount,
        transacao.date,
        transacao.category,
      );
    }

    const assinaturasAtualizadas = await AssinaturaRepository.buscarPorItemId(itemId);
    return assinaturasAtualizadas.map(bancoParaResposta);
  },
};

export default PluggyAssinaturaService;
