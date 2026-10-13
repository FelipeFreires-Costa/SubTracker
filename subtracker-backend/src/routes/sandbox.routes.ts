import { Router } from 'express';
import SandboxController from '../controllers/sandbox.controller';

const router = Router();

router.get('/sandbox/cenarios', SandboxController.cenarios);
router.post('/sandbox/importar', SandboxController.importar);

export default router;
