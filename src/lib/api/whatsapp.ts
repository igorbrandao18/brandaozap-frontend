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

  // Sincronizar chats do WAHA
  syncChats: async (sessionId: string): Promise<any[]> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.whatsapp.sessions}/${sessionId}/chats/sync`
    );
    return response.data;
  },

  // ========== CHATS PROXY ENDPOINTS ==========
  getChats: async (sessionId: string): Promise<any[]> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.whatsapp.sessions}/${sessionId}/chats`
    );
    return response.data;
  },

  getChatPicture: async (sessionId: string, chatId: string): Promise<string> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.whatsapp.sessions}/${sessionId}/chats/${encodeURIComponent(chatId)}/picture`
    );
    return response.data;
  },

  archiveChat: async (sessionId: string, chatId: string): Promise<void> => {
    await apiClient.post(
      `${API_ENDPOINTS.whatsapp.sessions}/${sessionId}/chats/${encodeURIComponent(chatId)}/archive`
    );
  },

  unarchiveChat: async (sessionId: string, chatId: string): Promise<void> => {
    await apiClient.post(
      `${API_ENDPOINTS.whatsapp.sessions}/${sessionId}/chats/${encodeURIComponent(chatId)}/unarchive`
    );
  },

  deleteChat: async (sessionId: string, chatId: string): Promise<void> => {
    await apiClient.delete(
      `${API_ENDPOINTS.whatsapp.sessions}/${sessionId}/chats/${encodeURIComponent(chatId)}`
    );
  },

  // ========== MESSAGES PROXY ENDPOINTS ==========
  getChatMessages: async (
    sessionId: string,
    chatId: string,
    limit?: number,
    page?: number
  ): Promise<any[]> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (page) params.append('page', page.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    const response = await apiClient.get(
      `${API_ENDPOINTS.whatsapp.sessions}/${sessionId}/chats/${encodeURIComponent(chatId)}/messages${queryString}`
    );
    return response.data;
  },

  markMessagesAsRead: async (sessionId: string, chatId: string): Promise<void> => {
    await apiClient.post(
      `${API_ENDPOINTS.whatsapp.sessions}/${sessionId}/chats/${encodeURIComponent(chatId)}/messages/read`
    );
  },

  // ========== CONTACTS PROXY ENDPOINTS ==========
  getContacts: async (sessionId: string): Promise<any[]> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.whatsapp.sessions}/${sessionId}/contacts`
    );
    return response.data;
  },

  getContact: async (sessionId: string, contactId: string): Promise<any> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.whatsapp.sessions}/${sessionId}/contacts/${encodeURIComponent(contactId)}`
    );
    return response.data;
  },

  // ========== STATUS PROXY ENDPOINTS ==========
  getMe: async (sessionId: string): Promise<any> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.whatsapp.sessions}/${sessionId}/me`
    );
    return response.data;
  },
};
