'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { whatsappApi } from '@/lib/api/whatsapp';
import { useChatStore } from '@/lib/store/chat.store';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';

export default function ChatPage() {
  const router = useRouter();
  const {
    session,
    loading,
    setSession,
    loadConversations,
    clear,
  } = useChatStore();

  useEffect(() => {
    initializeSession();

    // Cleanup ao desmontar
    return () => {
      // Não limpar o store aqui, pois pode ser usado em outras páginas
      // clear();
    };
  }, []);

  const initializeSession = async () => {
    try {
      // Verificar autenticação
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Buscar sessões do usuário
      const sessions = await whatsappApi.getSessions();
      
      if (sessions.length === 0) {
        // Redirecionar para página de WhatsApp se não houver sessão
        router.push('/whatsapp');
        return;
      }

      // Buscar a sessão mais recente que está WORKING
      const workingSession = sessions.find(s => s.status === 'WORKING');
      
      if (!workingSession) {
        // Se não houver sessão WORKING, redirecionar para página de WhatsApp
        router.push('/whatsapp');
        return;
      }

      // Verificar status real no WAHA
      const realStatus = await whatsappApi.getStatus(workingSession.sessionId);
      
      if (realStatus.status !== 'WORKING') {
        router.push('/whatsapp');
        return;
      }

      // Definir sessão no store
      setSession(realStatus);

      // Carregar conversas e fotos automaticamente
      await loadConversations(realStatus.sessionId);
    } catch (err: any) {
      console.error('Erro ao inicializar sessão:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        router.push('/whatsapp');
      }
    }
  };

  if (loading && !session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="h-full flex">
      {/* Sidebar - Lista de conversas */}
      <div className="w-1/3 border-r border-gray-300 flex flex-col bg-white">
        <ChatList sessionId={session.sessionId} />
      </div>

      {/* Main - Área de chat */}
      <div className="flex-1 flex flex-col">
        <ChatWindow sessionId={session.sessionId} />
      </div>
    </div>
  );
}
