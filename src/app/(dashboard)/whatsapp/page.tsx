'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { whatsappApi, WhatsAppSession } from '@/lib/api/whatsapp';
import { messagesApi } from '@/lib/api/messages';
import QRCodeDisplay from '@/components/whatsapp/QRCodeDisplay';
import StatsCard from '@/components/dashboard/StatsCard';
import QuickActions from '@/components/dashboard/QuickActions';
import apiClient from '@/lib/api/client';

export default function WhatsAppDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [stats, setStats] = useState({
    conversations: 0,
    messages: 0,
    unread: 0,
  });

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          window.location.href = '/login';
          return;
        }
        
        // Buscar informações do usuário
        try {
          const userResponse = await apiClient.get('/auth/profile');
          if (userResponse.data) {
            setUser({
              email: userResponse.data.email,
              name: userResponse.data.name,
            });
          }
        } catch (err: any) {
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            router.push('/login');
            return;
          }
        }

        // Buscar sessões existentes
        const sessions = await whatsappApi.getSessions();
        
        if (sessions.length > 0) {
          const latestSession = sessions[0];
          
          // Verificar status real no WAHA
          try {
            const realStatus = await whatsappApi.getStatus(latestSession.sessionId);
            setSession(realStatus);
            
            if (realStatus.status === 'WORKING') {
              setIsPolling(false);
              setQrCode(null);
              
              // Carregar estatísticas
              loadStats(realStatus.sessionId);
            } else if (realStatus.status === 'QRCODE' || realStatus.status === 'SCAN_QR_CODE' || realStatus.status === 'STARTING') {
              setIsPolling(true);
              try {
                const qrResponse = await whatsappApi.getQrCode(realStatus.sessionId);
                if (qrResponse.qrCode) {
                  setQrCode(qrResponse.qrCode);
                }
              } catch (err: any) {
                console.log('QR code ainda não disponível');
              }
            }
          } catch (statusErr: any) {
            const activeSession = sessions.find(s => s.status === 'WORKING' || s.status === 'QRCODE' || s.status === 'SCAN_QR_CODE' || s.status === 'STARTING');
            if (activeSession) {
              setSession(activeSession);
              setIsPolling(activeSession.status !== 'WORKING');
            }
          }
        }
      } catch (err: any) {
        console.error('Erro ao inicializar:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [router]);

  const loadStats = async (sessionId: string) => {
    try {
      // Primeiro, sincronizar chats do WAHA para garantir que temos dados atualizados
      try {
        await messagesApi.syncChats(sessionId);
      } catch (syncErr) {
        console.log('Erro ao sincronizar chats (continuando mesmo assim):', syncErr);
      }
      
      // Buscar conversas do backend
      const conversations = await messagesApi.getConversations(sessionId);
      const unread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      
      // Tentar obter contagem de mensagens do WAHA
      let totalMessages = 0;
      try {
        const chats = await whatsappApi.getChats(sessionId);
        totalMessages = chats.reduce((sum: number, chat: any) => {
          return sum + (chat.messageCount || chat.messagesCount || 0);
        }, 0);
      } catch (chatsErr) {
        console.log('Não foi possível obter contagem de mensagens:', chatsErr);
      }
      
      setStats({
        conversations: conversations.length,
        messages: totalMessages,
        unread,
      });
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
      // Em caso de erro, tentar buscar do endpoint de contagem
      try {
        const countResponse = await whatsappApi.getChatsCount(sessionId);
        setStats({
          conversations: countResponse.count || 0,
          messages: 0,
          unread: 0,
        });
      } catch (countErr) {
        console.error('Erro ao carregar contagem de chats:', countErr);
      }
    }
  };

  // Polling para atualizar status da sessão
  useEffect(() => {
    if (!session || !isPolling) return;

    const interval = setInterval(async () => {
      try {
        const updatedSession = await whatsappApi.getStatus(session.sessionId);
        setSession(updatedSession);

        if (updatedSession.status === 'WORKING') {
          setIsPolling(false);
          setQrCode(null);
          loadStats(updatedSession.sessionId);
        } else if (updatedSession.status === 'QRCODE' || updatedSession.status === 'SCAN_QR_CODE') {
          try {
            const qrResponse = await whatsappApi.getQrCode(updatedSession.sessionId);
            if (qrResponse.qrCode) {
              setQrCode(qrResponse.qrCode);
            }
          } catch (err: any) {
            // QR code ainda não disponível
          }
        }
      } catch (err: any) {
        console.error('Erro ao atualizar status:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [session, isPolling]);

  const handleCreateSession = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newSession = await whatsappApi.createSession({
        name: 'Minha Sessão WhatsApp',
      });
      
      setSession(newSession);
      setIsPolling(true);
      
      setTimeout(async () => {
        if (newSession.status === 'QRCODE' || newSession.status === 'SCAN_QR_CODE' || newSession.status === 'STARTING') {
          try {
            const qrResponse = await whatsappApi.getQrCode(newSession.sessionId);
            if (qrResponse.qrCode) {
              setQrCode(qrResponse.qrCode);
            }
          } catch (err: any) {
            console.log('QR code ainda não disponível');
          }
        }
      }, 3000);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }
      setError(err.response?.data?.message || 'Erro ao criar sessão WhatsApp');
      console.error('Erro ao criar sessão:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopSession = async () => {
    if (!session) return;
    
    try {
      await whatsappApi.stopSession(session.sessionId);
      setSession(null);
      setQrCode(null);
      setIsPolling(false);
      setStats({ conversations: 0, messages: 0, unread: 0 });
    } catch (err: any) {
      console.error('Erro ao parar sessão:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Visão geral do seu CRM de WhatsApp</p>
      </div>

      {/* Stats Cards */}
      {session?.status === 'WORKING' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="Conversas"
              value={stats.conversations}
              icon="💬"
              color="green"
            />
            <StatsCard
              title="Mensagens"
              value={stats.messages}
              icon="📨"
              color="blue"
            />
            <StatsCard
              title="Não Lidas"
              value={stats.unread}
              icon="🔔"
              color="orange"
            />
          </div>
        )}

      {/* Quick Actions */}
      <div className="mb-8">
        <QuickActions />
      </div>

      {/* WhatsApp Session Card */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Sessão WhatsApp</h2>
            {session && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                session.status === 'WORKING' 
                  ? 'bg-green-100 text-green-800' 
                  : session.status === 'QRCODE' || session.status === 'SCAN_QR_CODE'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {session.status === 'WORKING' ? 'Conectado' : 
                 session.status === 'QRCODE' || session.status === 'SCAN_QR_CODE' ? 'Aguardando QR Code' :
                 session.status === 'STARTING' ? 'Iniciando' : 'Desconectado'}
              </span>
            )}
          </div>

          {!session ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Nenhuma sessão WhatsApp ativa
              </h3>
              <p className="text-gray-600 mb-6">
                Conecte seu WhatsApp para começar a usar o CRM
              </p>
              <button
                onClick={handleCreateSession}
                disabled={isLoading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
              >
                Conectar WhatsApp
              </button>
            </div>
          ) : session.status === 'WORKING' ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">✅</div>
                  <div className="flex-1">
                    <p className="text-green-800 font-semibold">WhatsApp conectado com sucesso!</p>
                    {session.phoneNumber && (
                      <p className="text-green-600 text-sm mt-1">📱 {session.phoneNumber}</p>
                    )}
                    {session.profileName && (
                      <p className="text-green-600 text-sm">👤 {session.profileName}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => router.push('/chat')}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  💬 Abrir Chat
                </button>
                <button
                  onClick={handleStopSession}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  Desconectar
                </button>
              </div>
            </div>
          ) : (session.status === 'QRCODE' || session.status === 'SCAN_QR_CODE' || session.status === 'STARTING') && qrCode ? (
            <div className="text-center py-4">
              <QRCodeDisplay qrCode={qrCode} />
              <p className="text-sm text-gray-600 mt-4">
                Escaneie o QR Code com seu WhatsApp para conectar
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-600">Aguardando QR Code...</p>
            </div>
          )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
