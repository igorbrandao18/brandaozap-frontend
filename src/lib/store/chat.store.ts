import { create } from 'zustand';
import { Conversation } from '@/lib/api/messages';
import { WhatsAppSession } from '@/lib/api/whatsapp';
import { messagesApi } from '@/lib/api/messages';
import { whatsappApi } from '@/lib/api/whatsapp';

interface ChatState {
  // Estado
  session: WhatsAppSession | null;
  conversations: Conversation[];
  pictures: Record<string, string>; // conversationId -> picture URL
  selectedConversation: Conversation | null;
  loading: boolean;
  error: string | null;
  lastSync: Date | null;

  // Actions
  setSession: (session: WhatsAppSession | null) => void;
  setSelectedConversation: (conversation: Conversation | null) => void;
  loadConversations: (sessionId: string) => Promise<void>;
  syncChats: (sessionId: string) => Promise<void>;
  loadPictures: (sessionId: string, conversations: Conversation[]) => Promise<void>;
  updateConversation: (conversation: Conversation) => void;
  clear: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Estado inicial
  session: null,
  conversations: [],
  pictures: {},
  selectedConversation: null,
  loading: false,
  error: null,
  lastSync: null,

  // Actions
  setSession: (session) => set({ session }),

  setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),

  loadConversations: async (sessionId: string) => {
    try {
      set({ loading: true, error: null });
      
      // Primeiro sincronizar com WAHA para garantir dados atualizados
      await get().syncChats(sessionId);
      
      // Depois carregar conversas do banco local
      const conversations = await messagesApi.getConversations(sessionId);
      
      // Carregar fotos automaticamente
      await get().loadPictures(sessionId, conversations);
      
      set({ 
        conversations, 
        loading: false,
        lastSync: new Date(),
      });
    } catch (err: any) {
      console.error('Erro ao carregar conversas:', err);
      set({ 
        error: err.response?.data?.message || 'Erro ao carregar conversas',
        loading: false,
      });
    }
  },

  syncChats: async (sessionId: string) => {
    try {
      set({ loading: true, error: null });
      
      // Sincronizar chats do WAHA
      const syncedConversations = await messagesApi.syncChats(sessionId);
      
      // Carregar fotos das conversas sincronizadas
      await get().loadPictures(sessionId, syncedConversations);
      
      set({ 
        conversations: syncedConversations,
        loading: false,
        lastSync: new Date(),
      });
    } catch (err: any) {
      console.error('Erro ao sincronizar chats:', err);
      set({ 
        error: err.response?.data?.message || 'Erro ao sincronizar chats',
        loading: false,
      });
      throw err;
    }
  },

  loadPictures: async (sessionId: string, conversations: Conversation[]) => {
    try {
      const picturesToLoad: Record<string, string> = {};
      
      // Buscar fotos em paralelo para todas as conversas que não têm foto ainda
      await Promise.all(
        conversations.map(async (conv) => {
          // Se já tem foto no objeto, usar ela
          if (conv.picture) {
            picturesToLoad[conv.id] = conv.picture;
            return;
          }
          
          // Se tem chatId, tentar buscar foto do WAHA
          if (conv.chatId) {
            try {
              const picture = await whatsappApi.getChatPicture(sessionId, conv.chatId);
              if (picture) {
                picturesToLoad[conv.id] = picture;
              }
            } catch (err) {
              // Ignorar erros ao buscar foto individual
              console.log(`Não foi possível carregar foto para chat ${conv.chatId}`);
            }
          }
        })
      );
      
      // Atualizar estado com todas as fotos carregadas
      set((state) => ({
        pictures: { ...state.pictures, ...picturesToLoad },
      }));
    } catch (err) {
      console.error('Erro ao carregar fotos:', err);
      // Não lançar erro, apenas logar
    }
  },

  updateConversation: (conversation) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversation.id ? conversation : c
      ),
    }));
  },

  clear: () => {
    set({
      session: null,
      conversations: [],
      pictures: {},
      selectedConversation: null,
      loading: false,
      error: null,
      lastSync: null,
    });
  },
}));
