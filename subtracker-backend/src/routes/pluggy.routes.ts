import { Router } from 'express';
import PluggyController from '../controllers/pluggy.controller';

const router = Router();

router.get('/connect-token', PluggyController.getConnectToken);
router.get('/transactions/:itemId', PluggyController.getTransactions);
router.post('/pluggy/importar/:itemId', PluggyController.importarAssinaturas);

export default router;
