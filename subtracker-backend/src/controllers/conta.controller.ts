import type { NextFunction, Request, Response } from 'express';
import ContaService from '../services/conta.service';

const ContaController = {
  async listar(_req: Request, res: Response, next: NextFunction) {
    try {
      const contas = await ContaService.listar();
      res.json(contas);
    } catch (error) {
      next(error);
    }
  },

  async criar(req: Request, res: Response, next: NextFunction) {
    try {
      const conta = await ContaService.criar(req.body);
      res.status(201).json(conta);
    } catch (error) {
      next(error);
    }
  },

  async atualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const conta = await ContaService.atualizar(req.params.id, req.body);
      res.json(conta);
    } catch (error) {
      next(error);
    }
  },

  async atualizarStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const conta = await ContaService.atualizarStatus(req.params.id, req.body);
      res.json(conta);
    } catch (error) {
      next(error);
    }
  },

  async remover(req: Request, res: Response, next: NextFunction) {
    try {
      await ContaService.remover(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};

export default ContaController;
