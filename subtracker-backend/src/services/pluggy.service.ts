import '../config/env';
import { PluggyClient } from 'pluggy-sdk';

import type { TransacaoPluggy } from '../utils/transacao.mapper';

const pluggyClient = new PluggyClient({
  clientId: process.env.PLUGGY_CLIENT_ID ?? '',
  clientSecret: process.env.PLUGGY_CLIENT_SECRET ?? '',
});

const PALAVRAS_CHAVE = [
  'netflix',
  'spotify',
  'amazon',
  'prime',
  'hbo',
  'disney',
  'gympass',
  'smartfit',
  'adobe',
  'apple',
];

const PluggyService = {
  async generateConnectToken() {
    const tokenResponse = await pluggyClient.createConnectToken();
    return tokenResponse.accessToken;
  },

  async getFilteredTransactions(itemId: string) {
    const accounts = await pluggyClient.fetchAccounts(itemId);

    if (accounts.results.length === 0) {
      throw new Error('Nenhuma conta encontrada para esta conexão');
    }

    let extratoCompleto: TransacaoPluggy[] = [];

    for (const conta of accounts.results) {
      const transactions = await pluggyClient.fetchTransactions(conta.id, {
        from: '2022-01-01',
      });
      extratoCompleto = extratoCompleto.concat(transactions.results);
    }

    console.log(
      `[PLUGGY] ${extratoCompleto.length} transações recebidas de ${accounts.results.length} conta(s)`,
    );

    const extratoFiltrado = extratoCompleto.filter((transacao) => {
      const descricao = transacao.description?.toLowerCase() ?? '';
      const temPalavraChave = PALAVRAS_CHAVE.some((palavra) => descricao.includes(palavra));
      const ehCategoriaAssinatura = transacao.category === 'Subscriptions';

      return temPalavraChave || ehCategoriaAssinatura;
    });

    return {
      totalContasAnalisadas: accounts.results.length,
      totalTransacoesBrutas: extratoCompleto.length,
      totalAssinaturasEncontradas: extratoFiltrado.length,
      extratoFiltrado,
    };
  },
};

export default PluggyService;
