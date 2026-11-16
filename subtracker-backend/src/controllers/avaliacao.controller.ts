import type { Request, Response } from 'express';
import { avaliarHeuristica } from '../avaliacao/avaliar.heuristica';
import { avaliacaoApiAtiva } from '../utils/ambiente';

const AvaliacaoController = {
  obter(_req: Request, res: Response) {
    if (!avaliacaoApiAtiva()) {
      res.status(404).json({ erro: 'Avaliação desativada neste ambiente.' });
      return;
    }
    res.json(avaliarHeuristica());
  },
};

export default AvaliacaoController;
