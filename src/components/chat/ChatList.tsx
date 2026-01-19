'use client';

import { useEffect } from 'react';
import { Conversation } from '@/lib/api/messages';
import { useChatStore } from '@/lib/store/chat.store';

interface ChatListProps {
  sessionId: string;
}

export default function ChatList({ sessionId }: ChatListProps) {
  const {
    conversations,
    pictures,
    selectedConversation,
    loading,
    error,
    lastSync,
    setSelectedConversation,
    syncChats,
    loadConversations,
  } = useChatStore();

  useEffect(() => {
    if (sessionId) {
      // Carregar conversas se ainda não foram carregadas ou se passou muito tempo desde a última sincronização
      const shouldReload = !lastSync || (Date.now() - lastSync.getTime()) > 5000;
      
      if (shouldReload) {
        loadConversations(sessionId);
      }
      
      // Atualizar conversas a cada 5 segundos
      const interval = setInterval(() => {
        loadConversations(sessionId);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [sessionId, lastSync, loadConversations]);

  const handleSyncChats = async () => {
    await syncChats(sessionId);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ontem';
    } else if (days < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getContactName = (conversation: Conversation) => {
    const name = conversation.contact?.name || conversation.phoneNumber;
    // Garantir que seja string (pode vir como objeto para grupos)
    if (typeof name === 'string') {
      return name;
    } else if (typeof name === 'object' && name !== null) {
      return (name as any).name || (name as any).subject || (name as any).formattedName || String(name);
    }
    return String(name);
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Carregando conversas...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800">Conversas</h2>
          <button
            onClick={handleSyncChats}
            className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Sincronizar chats do WhatsApp"
            disabled={loading}
          >
            🔄 {loading ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
        {error && (
          <div className="text-xs text-red-500 mt-1">{error}</div>
        )}
      </div>

      {/* Lista de conversas */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <div className="text-4xl mb-2">💬</div>
            <div className="text-center">
              <p className="font-medium">Nenhuma conversa encontrada</p>
              <p className="text-sm mt-1">Clique em "Sincronizar" para buscar conversas do WhatsApp</p>
            </div>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className={`px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConversation?.id === conversation.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-lg overflow-hidden relative">
                  {pictures[conversation.id] || conversation.picture ? (
                    <img
                      src={pictures[conversation.id] || conversation.picture}
                      alt={getContactName(conversation)}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Se erro ao carregar foto, esconder e mostrar inicial
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-full h-full bg-green-500 flex items-center justify-center text-white ${(pictures[conversation.id] || conversation.picture) ? 'hidden' : ''}`}
                  >
                    {getContactName(conversation).charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {getContactName(conversation)}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatTime(conversation.updatedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {(() => {
                        const msg = conversation.lastMessage;
                        if (!msg) return 'Sem mensagens';
                        if (typeof msg === 'string') return msg;
                        if (typeof msg === 'object' && msg !== null) {
                          const msgObj = msg as any;
                          return msgObj.body || msgObj.text || msgObj.message || msgObj.content || '[Mensagem]';
                        }
                        return String(msg);
                      })()}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="flex-shrink-0 bg-green-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 ml-2">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
