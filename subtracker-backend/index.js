/* eslint-disable no-undef */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PluggyClient } = require('pluggy-sdk');

const app = express();
app.use(cors());
app.use(express.json());

//inicializa o cliente da Pluggy usando as chaves secretas do .env
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

app.get('/api/transactions/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    const accounts = await pluggyClient.fetchAccounts(itemId);

    if (accounts.results.length === 0) {
      return res.status(404).json({ erro: "Nenhuma conta encontrada para esta conexão" });
    }

    const accountId = accounts.results[0].id;
    const transactions = await pluggyClient.fetchTransactions(accountId);

    res.json({
      mensagem: "Extrato recuperado com sucesso!",
      contaId: accountId,
      totalTransacoes: transactions.total,
      extrato: transactions.results
    });
  } catch (error) {
    console.error("Erro ao buscar transações: ", error.message);
    res.status(500).json({ erro: 'Falha ao buscar transações na Pluggy', detalhes: error.message });
  }
});

// 🚀 3. Liga o servidor
// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor do SubTracker rodando na porta ${PORT} 🚀`);
  console.log(`Teste a API em: http://localhost:${PORT}/api/test-pluggy`);
});