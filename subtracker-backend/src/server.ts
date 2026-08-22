import './config/env';
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/index';
import { getCorsOptions } from './config/cors';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors(getCorsOptions()));
app.use(express.json({ limit: '1mb' }));

app.use('/api', apiRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[SERVER] API do SubTracker rodando na porta ${PORT}`);
  console.log(`[SERVER] Health check: http://localhost:${PORT}/api/health`);
  console.log(`[SERVER] Contas: http://localhost:${PORT}/api/contas`);
  console.log(`[SERVER] Pluggy token: http://localhost:${PORT}/api/connect-token`);
});
