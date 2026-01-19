'use client';

import { useState, useEffect, useRef } from 'react';
import { Message } from '@/lib/api/messages';
import { messagesApi } from '@/lib/api/messages';
import { useChatStore } from '@/lib/store/chat.store';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

interface ChatWindowProps {
  sessionId: string;
}

export default function ChatWindow({ sessionId }: ChatWindowProps) {
  const { selectedConversation, pictures } = useChatStore();
  const conversation = selectedConversation;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Obter foto do contato do store
  const contactPicture = conversation ? (pictures[conversation.id] || conversation.picture || null) : null;

  useEffect(() => {
    if (conversation) {
      loadMessages();
      // Marcar como lida quando abrir
      messagesApi.markAsRead(conversation.phoneNumber, sessionId).catch(console.error);
      
      // Atualizar mensagens a cada 3 segundos
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [conversation, sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!conversation) return;
    
    try {
      setLoading(true);
      const data = await messagesApi.getConversationMessages(
        conversation.phoneNumber,
        sessionId
      );
      setMessages(data);
    } catch (err: any) {
      console.error('Erro ao carregar mensagens:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!conversation || !text.trim() || sending) return;

    try {
      setSending(true);
      const newMessage = await messagesApi.sendMessage(sessionId, {
        to: conversation.phoneNumber,
        text: text.trim(),
        type: 'TEXT',
      });
      
      setMessages((prev) => [...prev, newMessage]);
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err);
      alert('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-lg font-medium">Selecione uma conversa</p>
          <p className="text-sm mt-2">Escolha uma conversa da lista para começar a conversar</p>
        </div>
      </div>
    );
  }

  const contactName = (() => {
    const name = conversation.contact?.name || conversation.phoneNumber;
    // Garantir que seja string (pode vir como objeto para grupos)
    if (typeof name === 'string') {
      return name;
    } else if (typeof name === 'object' && name !== null) {
      return (name as any).name || (name as any).subject || (name as any).formattedName || String(name);
    }
    return String(name);
  })();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          {contactPicture ? (
            <img
              src={contactPicture}
              alt={contactName}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold ${contactPicture ? 'hidden' : ''}`}
          >
            {contactName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{contactName}</h3>
            <p className="text-xs text-gray-500">{conversation.phoneNumber}</p>
          </div>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Carregando mensagens...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm mt-1">Envie uma mensagem para começar a conversa</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={sending} />
    </div>
  );
}
