import { Router } from 'express';
import DemoAcademicaController from '../controllers/demoAcademica.controller';

const router = Router();

router.get('/demo-academica/dataset', DemoAcademicaController.dataset);
router.post('/demo-academica/executar', DemoAcademicaController.executar);
router.get('/demo-academica/metricas', DemoAcademicaController.metricas);

export default router;
