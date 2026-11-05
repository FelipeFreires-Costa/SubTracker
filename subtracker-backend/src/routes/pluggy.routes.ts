import { Router } from 'express';
import PluggyController from '../controllers/pluggy.controller';

const router = Router();

router.get('/connect-token', PluggyController.getConnectToken);
router.get('/pluggy/conexao', PluggyController.statusConexao);
router.get('/pluggy/fatura', PluggyController.faturaMesAtual);
router.get('/pluggy/extrato.csv', PluggyController.exportarExtrato);
router.post('/pluggy/importar/:itemId', PluggyController.importarAssinaturas);
router.post('/pluggy/sincronizar', PluggyController.sincronizar);
router.delete('/pluggy/conexao', PluggyController.desconectar);

export default router;
