import type { NextFunction, Request, Response } from 'express';
import ImportacaoService from '../services/importacao.service';
import { avaliarSandbox } from '../sandbox/cenarios.sandbox';

const SandboxController = {
  cenarios(_req: Request, res: Response) {
    res.json(avaliarSandbox());
  },

  async importar(_req: Request, res: Response, next: NextFunction) {
    try {
      const resultado = await ImportacaoService.importarSandbox();
      res.status(201).json(resultado);
    } catch (error) {
      next(error);
    }
  },
};

export default SandboxController;
