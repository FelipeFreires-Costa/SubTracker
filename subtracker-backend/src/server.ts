const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pluggyRoutes = require('./routes/pluggy.routes');

//carregar as variáveis de segurança do arquivo .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', pluggyRoutes);

// inicialização do Servidor
app.listen(PORT, () => {
  console.log(`[SERVER] API do SubTracker rodando na porta ${PORT}`);
  console.log(`[TESTE]: http://localhost:${PORT}/api/connect-token`);
});