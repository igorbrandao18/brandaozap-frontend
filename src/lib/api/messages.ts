import apiClient from './client';

export interface Conversation {
  id: string;
  phoneNumber: string;
  lastMessage?: string;
  lastMessageType?: string;
  unreadCount: number;
  picture?: string; // URL da foto do chat (data URL ou URL)
  chatId?: string; // Chat ID original do WAHA para buscar foto
  contact?: {
    id: string;
    name: string;
    phoneNumber: string;
    avatar?: string;
  };
  updatedAt: string;
  createdAt: string;
}

export interface Message {
  id: string;
  messageId: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  direction: 'INCOMING' | 'OUTGOING';
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  text?: string;
  mediaUrl?: string;
  from: string;
  to: string;
  createdAt: string;
  contact?: {
    id: string;
    name: string;
    phoneNumber: string;
  };
}

export interface SendMessageDto {
  to: string;
  text?: string;
  type: 'TEXT' | 'IMAGE';
  mediaUrl?: string;
  caption?: string;
}

export const messagesApi = {
  // Obter lista de conversas
  getConversations: async (sessionId?: string): Promise<Conversation[]> => {
    const params = sessionId ? `?sessionId=${sessionId}` : '';
    const response = await apiClient.get(`/messages/conversations${params}`);
    return response.data;
  },

  // Obter mensagens de uma conversa
  getConversationMessages: async (
    phoneNumber: string,
    sessionId: string
  ): Promise<Message[]> => {
    const response = await apiClient.get(
      `/messages/conversations/${phoneNumber}?sessionId=${sessionId}`
    );
    return response.data;
  },

  // Enviar mensagem
  sendMessage: async (
    sessionId: string,
    data: SendMessageDto
  ): Promise<Message> => {
    const response = await apiClient.post(
      `/messages/send?sessionId=${sessionId}`,
      data
    );
    return response.data;
  },

  // Marcar conversa como lida
  markAsRead: async (
    phoneNumber: string,
    sessionId: string
  ): Promise<void> => {
    await apiClient.post(
      `/messages/conversations/${phoneNumber}/read?sessionId=${sessionId}`
    );
  },

  // Sincronizar chats do WAHA
  syncChats: async (sessionId: string): Promise<Conversation[]> => {
    const response = await apiClient.get(
      `/whatsapp/sessions/${sessionId}/chats/sync`
    );
    return response.data;
  },
};
