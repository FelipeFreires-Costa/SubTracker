import ContaRepository from '../repositories/conta.repository';
import PluggyAssinaturaService from './pluggyAssinatura.service';
import { inferirCategoria, normalizarNome } from '../utils/categoria.mapper';
import { deduplicarTransacoes } from '../utils/pluggy.deduplicar';
import { normalizarData } from '../utils/date.utils';
import { AppError } from '../utils/validation';

const ImportacaoService = {
  async importarAssinaturas(itemId: string) {
    if (!itemId.trim()) {
      throw new AppError('itemId é obrigatório.');
    }

    const extrato = await PluggyAssinaturaService.buscarExtratoFiltrado(itemId);
    const assinaturasUnicas = deduplicarTransacoes(extrato);

    const contasExistentes = await ContaRepository.listar();
    const nomesExistentes = new Set(contasExistentes.map((conta) => normalizarNome(conta.nome)));

    const importadas = [];
    let ignoradas = 0;

    for (const assinatura of assinaturasUnicas) {
      const chave = normalizarNome(assinatura.description);

      if (nomesExistentes.has(chave)) {
        ignoradas += 1;
        continue;
      }

      const conta = await ContaRepository.criar({
        nome: assinatura.description,
        preco: Math.abs(assinatura.amount),
        data: normalizarData(assinatura.date),
        pago: false,
        categoria: inferirCategoria(assinatura.description),
      });

      importadas.push(conta);
      nomesExistentes.add(chave);
    }

    return {
      mensagem:
        importadas.length > 0
          ? `${importadas.length} assinatura(s) importada(s) com sucesso.`
          : 'Nenhuma assinatura nova para importar.',
      totalEncontradas: assinaturasUnicas.length,
      totalImportadas: importadas.length,
      totalIgnoradas: ignoradas,
      contas: importadas,
    };
  },
};

export default ImportacaoService;
