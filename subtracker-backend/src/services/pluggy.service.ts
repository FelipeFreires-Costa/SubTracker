const { PluggyClient } = require('pluggy-sdk');
const dotenv = require('dotenv');

// Carrega as variáveis do arquivo .env
dotenv.config();

// Inicializa o cliente da Pluggy
const pluggyClient = new PluggyClient({
  clientId: process.env.PLUGGY_CLIENT_ID || '',
  clientSecret: process.env.PLUGGY_CLIENT_SECRET || '',
});

const PluggyService = {
  // Função 1: Gerar o Connect Token para o Front-end
  async generateConnectToken() {
    const tokenResponse = await pluggyClient.createConnectToken();
    return tokenResponse.accessToken;
  },
  // Função 2: Buscar e Filtrar Transações (O Algoritmo do seu TCC)
  async getFilteredTransactions(itemId: string) {
    const accounts = await pluggyClient.fetchAccounts(itemId);

    if (accounts.results.length === 0) {
      throw new Error("Nenhuma conta encontrada para esta conexão");
    }

    let extratoCompleto: any[] = [];

    for (const conta of accounts.results) {
      const transactions = await pluggyClient.fetchTransactions(conta.id, {
  from: '2022-01-01'
});
      extratoCompleto = extratoCompleto.concat(transactions.results);
    }
    console.log("\n[LOG ESTRATÉGICO] Transações que vieram do Sandbox:", JSON.stringify(extratoCompleto, null, 2));
    // O algoritmo de filtragem
    const palavrasChave = [
      'netflix', 'spotify', 'amazon', 'prime', 'hbo', 
      'disney', 'gympass', 'smartfit', 'adobe', 'apple', 'boleto'
    ];
    
    const assinaturasFiltradas = extratoCompleto.filter((transacao: any) => {
      const descricao = transacao.description ? transacao.description.toLowerCase() : '';
      const temPalavraChave = palavrasChave.some((palavra: string) => descricao.includes(palavra));
      const ehCategoriaAssinatura = transacao.category === 'Subscriptions';

    return temPalavraChave || ehCategoriaAssinatura; 

    });

    return {
      totalContasAnalisadas: accounts.results.length,
      totalTransacoesBrutas: extratoCompleto.length,
      totalAssinaturasEncontradas: assinaturasFiltradas.length,
      extratoFiltrado: assinaturasFiltradas
    };
  }
};
module.exports = PluggyService;