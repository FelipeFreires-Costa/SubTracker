import type { NextFunction, Request, Response } from 'express';
import PluggyService from '../services/pluggy.service';
import ImportacaoService from '../services/importacao.service';

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

  async sincronizar(_req: Request, res: Response, next: NextFunction) {
    try {
      const resultado = await ImportacaoService.sincronizarSalva();
      res.json(resultado);
    } catch (error) {
      next(error);
    }
  },

  async statusConexao(_req: Request, res: Response, next: NextFunction) {
    try {
      const status = await ImportacaoService.statusConexao();
      res.json(status);
    } catch (error) {
      next(error);
    }
  },

  async desconectar(_req: Request, res: Response, next: NextFunction) {
    try {
      const status = await ImportacaoService.desconectar();
      res.json(status);
    } catch (error) {
      next(error);
    }
  },

  async faturaMesAtual(_req: Request, res: Response, next: NextFunction) {
    try {
      const fatura = await ImportacaoService.faturaMesAtual();
      res.json(fatura);
    } catch (error) {
      next(error);
    }
  },
};

export default PluggyController;
