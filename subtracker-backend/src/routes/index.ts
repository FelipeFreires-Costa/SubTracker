import { Router } from 'express';
import contaRoutes from './conta.routes';
import pluggyRoutes from './pluggy.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'subtracker-api' });
});

router.use(contaRoutes);
router.use(pluggyRoutes);

export default router;
