const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pluggyRoutes = require('./routes/pluggy.routes');

// Carrega as variáveis de segurança do arquivo .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança e formato de dados
app.use(cors());
app.use(express.json());

// Acoplando as rotas modulares da Pluggy na API
app.use('/api', pluggyRoutes);

// Inicialização do Servidor
app.listen(PORT, () => {
  console.log(`[SERVER] API do SubTracker rodando na porta ${PORT} 🚀`);
  console.log(`[TESTE] Acesse no navegador: http://localhost:${PORT}/api/connect-token`);
});