import apiClient from './client';
import { API_ENDPOINTS } from './endpoints';

export interface CreateSessionDto {
  name: string;
  sessionId?: string;
}

export interface WhatsAppSession {
  id: string;
  name: string;
  sessionId: string;
  status: 'STARTING' | 'QRCODE' | 'SCAN_QR_CODE' | 'WORKING' | 'FAILED' | 'STOPPED';
  qrCode?: string;
  phoneNumber?: string;
  profileName?: string;
  createdAt: string;
  updatedAt: string;
}

export const whatsappApi = {
  // Criar nova sessão
  createSession: async (data: CreateSessionDto): Promise<WhatsAppSession> => {
    const response = await apiClient.post(API_ENDPOINTS.whatsapp.sessions, data);
    return response.data;
  },

  // Listar sessões do usuário
  getSessions: async (): Promise<WhatsAppSession[]> => {
    const response = await apiClient.get(API_ENDPOINTS.whatsapp.sessions);
    return response.data;
  },

  // Obter sessão específica
  getSession: async (sessionId: string): Promise<WhatsAppSession> => {
    const response = await apiClient.get(`${API_ENDPOINTS.whatsapp.sessions}/${sessionId}`);
    return response.data;
  },

  // Obter QR Code
  getQrCode: async (sessionId: string): Promise<{ qrCode: string }> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.whatsapp.sessions}/${sessionId}/qr`
    );
    return response.data;
  },

  // Obter status da sessão
  getStatus: async (sessionId: string): Promise<WhatsAppSession> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.whatsapp.sessions}/${sessionId}/status`
    );
    return response.data;
  },

  // Parar sessão
  stopSession: async (sessionId: string): Promise<void> => {
    await apiClient.post(`${API_ENDPOINTS.whatsapp.sessions}/${sessionId}/stop`);
  },

  // Deletar sessão
  deleteSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.whatsapp.sessions}/${sessionId}`);
  },

  // Obter quantidade de conversas
  getChatsCount: async (sessionId: string): Promise<{ count: number }> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.whatsapp.sessions}/${sessionId}/chats/count`
    );
    return response.data;
  },
};
