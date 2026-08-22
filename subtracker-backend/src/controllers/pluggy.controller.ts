import type { NextFunction, Request, Response } from 'express';
import PluggyService from '../services/pluggy.service';
import ImportacaoService from '../services/importacao.service';
import PluggyAssinaturaService from '../services/pluggyAssinatura.service';

function obterItemId(params: Request['params']): string | null {
  const itemId = params.itemId;
  return typeof itemId === 'string' ? itemId : null;
}

const PluggyController = {
  async getConnectToken(_req: Request, res: Response) {
    try {
      const token = await PluggyService.generateConnectToken();

      res.json({
        mensagem: 'Token gerado com sucesso!',
        accessToken: token,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[PLUGGY] Erro ao gerar connect token:', message);
      res.status(500).json({ erro: 'Falha ao gerar o token', detalhes: message });
    }
  },

  async getTransactions(req: Request, res: Response) {
    try {
      const itemId = obterItemId(req.params);

      if (!itemId) {
        res.status(400).json({ erro: 'itemId é obrigatório' });
        return;
      }

      const extratoFiltrado = await PluggyAssinaturaService.buscarExtratoFiltrado(itemId);

      res.json({
        mensagem: 'Assinaturas encontradas com sucesso!',
        totalAssinaturasEncontradas: extratoFiltrado.length,
        extratoFiltrado,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[PLUGGY] Erro ao processar transações:', error);
      res.status(500).json({ erro: 'Falha ao processar transações', detalhes: message });
    }
  },

  async importarAssinaturas(req: Request, res: Response, next: NextFunction) {
    try {
      const itemId = obterItemId(req.params);

      if (!itemId) {
        res.status(400).json({ erro: 'itemId é obrigatório' });
        return;
      }

      const resultado = await ImportacaoService.importarAssinaturas(itemId);
      res.status(201).json(resultado);
    } catch (error) {
      next(error);
    }
  },
};

export default PluggyController;
