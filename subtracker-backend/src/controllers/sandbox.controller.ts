import type { NextFunction, Request, Response } from 'express';
import ImportacaoService from '../services/importacao.service';
import { avaliarSandbox } from '../sandbox/cenarios.sandbox';
import { sandboxApiAtiva } from '../utils/ambiente';

function recusarSeDesligado(res: Response): boolean {
  if (sandboxApiAtiva()) return false;
  res.status(404).json({ erro: 'Sandbox desativado neste ambiente.' });
  return true;
}

const SandboxController = {
  cenarios(_req: Request, res: Response) {
    if (recusarSeDesligado(res)) return;
    res.json(avaliarSandbox());
  },

  async importar(_req: Request, res: Response, next: NextFunction) {
    try {
      if (recusarSeDesligado(res)) return;
      const resultado = await ImportacaoService.importarSandbox();
      res.status(201).json(resultado);
    } catch (error) {
      next(error);
    }
  },
};

export default SandboxController;
