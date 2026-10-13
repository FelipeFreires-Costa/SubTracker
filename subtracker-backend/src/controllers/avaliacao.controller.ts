import type { Request, Response } from 'express';
import { avaliarHeuristica } from '../avaliacao/avaliar.heuristica';

const AvaliacaoController = {
  obter(_req: Request, res: Response) {
    res.json(avaliarHeuristica());
  },
};

export default AvaliacaoController;
