import { Router } from 'express';
import AvaliacaoController from '../controllers/avaliacao.controller';

const router = Router();

router.get('/heuristica/avaliacao', AvaliacaoController.obter);

export default router;
