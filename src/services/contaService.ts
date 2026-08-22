import type {
  AtualizarContaPayload,
  Conta,
  CriarContaPayload,
} from '../types/Conta';
import { apiRequest } from './apiClient';

export const contaService = {
  listar(): Promise<Conta[]> {
    return apiRequest<Conta[]>('/contas');
  },

  criar(payload: CriarContaPayload): Promise<Conta> {
    return apiRequest<Conta>('/contas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  atualizar(id: number, payload: AtualizarContaPayload): Promise<Conta> {
    return apiRequest<Conta>(`/contas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  atualizarStatus(id: number, pago: boolean): Promise<Conta> {
    return apiRequest<Conta>(`/contas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ pago }),
    });
  },

  remover(id: number): Promise<void> {
    return apiRequest<void>(`/contas/${id}`, {
      method: 'DELETE',
    });
  },
};
