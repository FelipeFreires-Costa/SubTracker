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

// 🚀 2. Rota de Teste: Vamos perguntar para a Pluggy quais bancos existem no Sandbox
app.get('/api/test-pluggy', async (req, res) => {
  try {
    // fetchConnectors busca a lista de instituições financeiras suportadas
    const connectors = await pluggyClient.fetchConnectors();

    res.json({
      mensagem: "Conexão com Pluggy realizada com sucesso! 🚀",
      bancosDisponiveis: connectors.total
    });
  } catch (error) {
    console.error("Erro na Pluggy:", error.message);
    res.status(500).json({ erro: "Falha ao conectar na Pluggy", detalhes: error.message });
  }
});

app.get('/api/connect-token', async (req, res) => {
  try {
    const tokenResponse = await pluggyClient.createConnectToken()

    res.json({
      mensagem: "Token gerado com sucesso!",
      accessToken: tokenResponse.accessToken
    })
  } catch (error) {
    console.error("Erro ao gerar Connect Token: ", error.menssage);
    res.status(500).json({ erro: 'Falha ap gerar o token para Widget', detalhes: error.messsage })
  }
})

// 🚀 3. Liga o servidor
// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor do SubTracker rodando na porta ${PORT} 🚀`);
  console.log(`Teste a API em: http://localhost:${PORT}/api/test-pluggy`);
});