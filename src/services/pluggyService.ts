import type {
  ConexaoPluggyStatus,
  ConnectTokenResponse,
  FaturaMesAtual,
  ImportarPluggyResponse,
  RelatorioAvaliacaoHeuristica,
} from '../types/Conta';
import { apiRequest } from './apiClient';

export const pluggyService = {
  obterConnectToken(): Promise<ConnectTokenResponse> {
    return apiRequest<ConnectTokenResponse>('/connect-token');
  },

  statusConexao(): Promise<ConexaoPluggyStatus> {
    return apiRequest<ConexaoPluggyStatus>('/pluggy/conexao');
  },

  importarAssinaturas(itemId: string): Promise<ImportarPluggyResponse> {
    return apiRequest<ImportarPluggyResponse>(`/pluggy/importar/${itemId}`, {
      method: 'POST',
    });
  },

  sincronizar(): Promise<ImportarPluggyResponse> {
    return apiRequest<ImportarPluggyResponse>('/pluggy/sincronizar', {
      method: 'POST',
    });
  },

  desconectar(): Promise<ConexaoPluggyStatus> {
    return apiRequest<ConexaoPluggyStatus>('/pluggy/conexao', {
      method: 'DELETE',
    });
  },

  avaliacaoHeuristica(): Promise<RelatorioAvaliacaoHeuristica> {
    return apiRequest<RelatorioAvaliacaoHeuristica>('/heuristica/avaliacao');
  },

  faturaMesAtual(): Promise<FaturaMesAtual> {
    return apiRequest<FaturaMesAtual>('/pluggy/fatura');
  },

  importarSandbox(): Promise<ImportarPluggyResponse> {
    return apiRequest<ImportarPluggyResponse>('/sandbox/importar', {
      method: 'POST',
    });
  },
};
