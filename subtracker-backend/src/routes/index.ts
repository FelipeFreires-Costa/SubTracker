import { Router } from 'express';
import contaRoutes from './conta.routes';
import pluggyRoutes from './pluggy.routes';
import avaliacaoRoutes from './avaliacao.routes';
import sandboxRoutes from './sandbox.routes';
import demoAcademicaRoutes from './demoAcademica.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'subtracker-api' });
});

router.use(contaRoutes);
router.use(pluggyRoutes);
router.use(avaliacaoRoutes);
router.use(sandboxRoutes);
router.use(demoAcademicaRoutes);

export default router;
