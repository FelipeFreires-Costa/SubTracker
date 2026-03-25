/* eslint-disable no-undef */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PluggyClient } = require('pluggy-sdk');

const app = express();
app.use(cors());
app.use(express.json());

// inicializa o cliente da Pluggy usando as chaves secretas do .env
const pluggyClient = new PluggyClient({
  // eslint-disable-next-line no-undef
  clientId: process.env.PLUGGY_CLIENT_ID,
  // eslint-disable-next-line no-undef
  clientSecret: process.env.PLUGGY_CLIENT_SECRET,
});

// 🚀 2. Rota de Teste:
app.get('/api/connect-token', async (req, res) => {
  try {
    const tokenResponse = await pluggyClient.createConnectToken();

    res.json({
      mensagem: "Token gerado com sucesso!",
      accessToken: tokenResponse.accessToken
    });
  } catch (error) {
    console.error("Erro ao gerar Connect Token: ", error.message);
    res.status(500).json({ erro: 'Falha ao gerar o token para Widget', detalhes: error.message });
  }
});

// 🚀 3. Rota de Busca e Filtragem de Transações:
app.get('/api/transactions/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    const accounts = await pluggyClient.fetchAccounts(itemId);

    if (accounts.results.length === 0) {
      return res.status(404).json({ erro: "Nenhuma conta encontrada para esta conexão" });
    }

    const accountId = accounts.results[0].id;
    const transactions = await pluggyClient.fetchTransactions(accountId);

    // 👇 --- INÍCIO DO FILTRO DE ASSINATURAS DO SUBTRACKER --- 👇
    const palavrasChave = ['netflix', 'spotify', 'amazon', 'prime', 'hbo', 'disney', 'gympass', 'smartfit', 'adobe', 'apple'];
    
    // As transações brutas da Pluggy ficam aqui dentro:
    const extratoCompleto = transactions.results;
    console.log("A COMPRA MISTERIOSA FOI:", extratoCompleto);

    

    const assinaturasFiltradas = extratoCompleto.filter(transacao => {
      // Pega a descrição (se existir) e passa para minúsculo
      const descricao = transacao.description ? transacao.description.toLowerCase() : '';
      
      const temPalavraChave = palavrasChave.some(palavra => descricao.includes(palavra));
      const ehCategoriaAssinatura = transacao.category === 'Subscriptions';

      // Retorna a transação apenas se for uma assinatura
      return temPalavraChave || ehCategoriaAssinatura;
    });
    // 👆 --- FIM DO FILTRO --- 👆

    res.json({
      mensagem: "Assinaturas filtradas com sucesso!",
      contaId: accountId,
      totalTransacoesBrutas: transactions.total,
      totalAssinaturasEncontradas: assinaturasFiltradas.length,
      extratoFiltrado: assinaturasFiltradas
    });
    
  } catch (error) {
    console.error("Erro ao buscar transações: ", error.message);
    res.status(500).json({ erro: 'Falha ao buscar transações na Pluggy', detalhes: error.message });
  }
});

// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor do SubTracker rodando na porta ${PORT} 🚀`);
  console.log(`Teste a API em: http://localhost:${PORT}/api/connect-token`);
});