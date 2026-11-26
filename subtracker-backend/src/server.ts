import './config/env';
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/index';
import { getCorsOptions } from './config/cors';
import { garantirSchema } from './config/initDb';
import { exigirAcesso } from './middleware/acesso';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 3000;

// Só a própria máquina acessa a API. Para liberar a rede local, defina HOST=0.0.0.0 no .env.
const HOST = process.env.HOST ?? '127.0.0.1';

app.use(cors(getCorsOptions()));
app.use(express.json({ limit: '1mb' }));

app.use('/api', exigirAcesso, apiRoutes);
app.use(errorHandler);

app.listen(Number(PORT), HOST, () => {
  console.log(`[SERVER] API do SubTracker rodando em ${HOST}:${PORT}`);
  console.log(`[SERVER] Health check: http://localhost:${PORT}/api/health`);
  console.log(`[SERVER] Contas: http://localhost:${PORT}/api/contas`);
  console.log(`[SERVER] Pluggy token: http://localhost:${PORT}/api/connect-token`);
  if (process.env.ACCESS_TOKEN) {
    console.log('[SERVER] Código de acesso (ACCESS_TOKEN) ativo.');
  } else if (HOST !== '127.0.0.1' && HOST !== 'localhost') {
    console.warn('[SERVER] ATENÇÃO: API exposta sem ACCESS_TOKEN. Defina ACCESS_TOKEN no ambiente.');
  }

  garantirSchema().catch((erro) => {
    console.error('[DB] Não foi possível verificar o schema:', erro);
  });
});
