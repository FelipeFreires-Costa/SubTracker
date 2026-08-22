import { Router } from 'express';
import ContaController from '../controllers/conta.controller';

const router = Router();

router.get('/contas', ContaController.listar);
router.post('/contas', ContaController.criar);
router.put('/contas/:id', ContaController.atualizar);
router.patch('/contas/:id', ContaController.atualizarStatus);
router.delete('/contas/:id', ContaController.remover);

export default router;
