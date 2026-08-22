import type { ConnectTokenResponse, ImportarPluggyResponse } from '../types/Conta';
import { apiRequest } from './apiClient';

export const pluggyService = {
  obterConnectToken(): Promise<ConnectTokenResponse> {
    return apiRequest<ConnectTokenResponse>('/connect-token');
  },

  importarAssinaturas(itemId: string): Promise<ImportarPluggyResponse> {
    return apiRequest<ImportarPluggyResponse>(`/pluggy/importar/${itemId}`, {
      method: 'POST',
    });
  },
};
