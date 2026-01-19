'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { whatsappApi, WhatsAppSession } from '@/lib/api/whatsapp';
import QRCodeDisplay from '@/components/whatsapp/QRCodeDisplay';
import apiClient from '@/lib/api/client';

export default function WhatsAppPage() {
  const router = useRouter();
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [chatsCount, setChatsCount] = useState<number | null>(null);

  // Debug: logar estado da sessão
  useEffect(() => {
    if (session) {
      console.log('📊 Estado da sessão atualizado:', {
        sessionId: session.sessionId,
        status: session.status,
        name: session.name,
        phoneNumber: session.phoneNumber,
        profileName: session.profileName,
        isPolling,
        chatsCount,
      });
    } else {
      console.log('📊 Nenhuma sessão no estado');
    }
  }, [session, isPolling, chatsCount]);

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Verificar se já tem token
        const token = localStorage.getItem('token');
        
        // Se não tem token, redirecionar para login
        if (!token) {
          window.location.href = '/login';
          return;
        }
        
        // Buscar informações do usuário (opcional)
        try {
          const userResponse = await apiClient.get('/auth/profile');
          if (userResponse.data) {
            setUser({
              email: userResponse.data.email,
              name: userResponse.data.name,
            });
          }
        } catch (err: any) {
          // Se erro 404, o endpoint pode não existir ainda - apenas logar e continuar
          if (err.response?.status === 404) {
            console.log('Endpoint /auth/profile não encontrado - continuando sem informações do usuário');
          } else if (err.response?.status === 401) {
            // Token inválido - redirecionar para login
            console.error('Token inválido:', err);
            localStorage.removeItem('token');
            router.push('/login');
            return;
          } else {
            console.error('Erro ao buscar perfil:', err);
          }
        }

        // Tentar buscar sessões existentes e verificar status real no WAHA
        try {
          const sessions = await whatsappApi.getSessions();
          if (sessions.length > 0) {
            // Buscar a sessão mais recente (não deletada)
            const latestSession = sessions[0];
            
            // SEMPRE verificar o status real no WAHA, mesmo se o banco diz STOPPED/FAILED
            // Isso resolve o problema de sincronização após reiniciar o Docker
            try {
              console.log('🔄 Verificando status real da sessão no WAHA...', {
                sessionId: latestSession.sessionId,
                statusNoBanco: latestSession.status,
              });
              
              // Forçar atualização do status chamando o endpoint que verifica WAHA
              const realStatus = await whatsappApi.getStatus(latestSession.sessionId);
              
              console.log('✅ Status real retornado do backend:', {
                sessionId: realStatus.sessionId,
                status: realStatus.status,
                phoneNumber: realStatus.phoneNumber,
                profileName: realStatus.profileName,
              });
              
              // Atualizar sessão com status real
              setSession(realStatus);
              
              // Se o status real for WORKING, iniciar polling e buscar conversas
              if (realStatus.status === 'WORKING') {
                console.log('✅ Sessão está WORKING! Atualizando UI...');
                setIsPolling(false); // Não precisa fazer polling se já está WORKING
                setQrCode(null);
                
                try {
                  const chatsResponse = await whatsappApi.getChatsCount(realStatus.sessionId);
                  setChatsCount(chatsResponse.count);
                  console.log(`✅ Encontradas ${chatsResponse.count} conversas`);
                } catch (err: any) {
                  console.warn('Erro ao buscar quantidade de conversas:', err.response?.data?.message || err.message);
                }
              } 
              // Se o status real for QRCODE/SCAN_QR_CODE, iniciar polling e buscar QR Code
              else if (realStatus.status === 'QRCODE' || realStatus.status === 'SCAN_QR_CODE' || realStatus.status === 'STARTING') {
                console.log('📱 Sessão está em QRCODE/STARTING, iniciando polling...');
                setIsPolling(true);
                
                try {
                  const qrResponse = await whatsappApi.getQrCode(realStatus.sessionId);
                  if (qrResponse.qrCode) {
                    setQrCode(qrResponse.qrCode);
                  }
                } catch (err: any) {
                  // Network Error ou 404/422 significa que QR code ainda não está disponível
                  if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
                    console.log('Backend não acessível ou QR code ainda não disponível');
                  } else {
                    console.error('Erro ao buscar QR Code:', err);
                  }
                }
              }
              // Se o status real for STOPPED/FAILED, não fazer nada (usuário pode iniciar nova sessão)
              else {
                console.log('⚠️ Sessão está desconectada no WAHA. Status:', realStatus.status);
                console.log('💡 Se você acredita que está conectado, verifique os logs do backend');
                setIsPolling(false);
                setQrCode(null);
                // Manter a sessão no estado para mostrar que existe mas está desconectada
                // Não limpar session aqui, apenas parar polling
              }
            } catch (statusErr: any) {
              // Se não conseguir verificar status no WAHA, usar o status do banco
              console.warn('Não foi possível verificar status no WAHA, usando status do banco:', statusErr.response?.data?.message || statusErr.message);
              
              const activeSession = sessions.find(s => s.status === 'WORKING' || s.status === 'QRCODE' || s.status === 'SCAN_QR_CODE' || s.status === 'STARTING');
              if (activeSession) {
                setSession(activeSession);
                setIsPolling(activeSession.status !== 'WORKING');
                
                if (activeSession.status === 'WORKING') {
                  try {
                    const chatsResponse = await whatsappApi.getChatsCount(activeSession.sessionId);
                    setChatsCount(chatsResponse.count);
                  } catch (err: any) {
                    console.warn('Erro ao buscar quantidade de conversas:', err.response?.data?.message || err.message);
                  }
                } else if (activeSession.status === 'QRCODE' || activeSession.status === 'SCAN_QR_CODE' || activeSession.status === 'STARTING') {
                  try {
                    const qrResponse = await whatsappApi.getQrCode(activeSession.sessionId);
                    if (qrResponse.qrCode) {
                      setQrCode(qrResponse.qrCode);
                    }
                  } catch (err: any) {
                    // Silencioso - QR code ainda não disponível
                  }
                }
              }
            }
          }
        } catch (err: any) {
          // Se erro 401, token inválido - redirecionar para login
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            router.push('/login');
            return;
          }
          // Para outros erros, apenas logar e continuar
          console.log('Nenhuma sessão existente encontrada');
        }
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 404) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        console.error('Erro ao inicializar:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Função para iniciar WhatsApp
  const handleStartWhatsApp = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Criar sessão única para este usuário
      // O backend vai gerar um sessionId único baseado no userId
      // No WAHA, será usado "default" (limitação do WAHA Core)
      const newSession = await whatsappApi.createSession({
        name: 'Minha Sessão WhatsApp',
        // Não enviar sessionId - o backend vai gerar um único para este usuário
      });
      
      setSession(newSession);
      setIsPolling(true);
      
      // Buscar QR Code após um delay
      setTimeout(async () => {
        if (newSession.status === 'QRCODE' || newSession.status === 'SCAN_QR_CODE' || newSession.status === 'STARTING') {
          try {
            const qrResponse = await whatsappApi.getQrCode(newSession.sessionId);
            if (qrResponse.qrCode) {
              setQrCode(qrResponse.qrCode);
            }
          } catch (err: any) {
            // Network Error ou 404/422 significa que QR code ainda não está disponível
            if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
              console.log('Backend não acessível ou QR code ainda não disponível - continuando polling...');
            } else {
              console.error('Erro ao buscar QR Code:', err);
            }
          }
        }
      }, 3000); // Aumentar delay para 3 segundos
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

  // Polling para atualizar status da sessão
  useEffect(() => {
    if (!session || !isPolling) return;

    let networkErrorCount = 0;
    const maxNetworkErrors = 3; // Limitar logs de erro de rede

    const interval = setInterval(async () => {
      try {
        const updatedSession = await whatsappApi.getStatus(session.sessionId);
        setSession(updatedSession);
        networkErrorCount = 0; // Reset contador em caso de sucesso

        // Se status mudou para WORKING, parar polling e buscar conversas
        if (updatedSession.status === 'WORKING') {
          setIsPolling(false);
          setQrCode(null);
          
          // Buscar quantidade de conversas após conectar
          try {
            const chatsResponse = await whatsappApi.getChatsCount(updatedSession.sessionId);
            setChatsCount(chatsResponse.count);
          } catch (err: any) {
            console.warn('Erro ao buscar quantidade de conversas:', err.response?.data?.message || err.message);
          }
        } else if (updatedSession.status === 'QRCODE' || updatedSession.status === 'SCAN_QR_CODE') {
          // Buscar QR Code atualizado sempre (QR codes expiram)
          // Não usar cache, sempre buscar do backend para ter o QR code mais recente
          try {
            const qrResponse = await whatsappApi.getQrCode(updatedSession.sessionId);
            if (qrResponse.qrCode && qrResponse.qrCode.trim() !== '') {
              // Verificar se é uma data URL válida
              if (qrResponse.qrCode.startsWith('data:image')) {
                setQrCode(qrResponse.qrCode);
              } else {
                console.warn('QR code recebido em formato inválido:', qrResponse.qrCode.substring(0, 50));
              }
            }
          } catch (err: any) {
            // Network Error ou 404/422 significa que QR code ainda não está disponível
            // Não logar esses erros para não poluir o console
            if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
              // Silencioso - QR code ainda não disponível
            } else if (err.response?.status === 404 || err.response?.status === 422) {
              // Silencioso - QR code ainda não disponível
            } else {
              // Apenas logar erros inesperados
              console.warn('Erro ao buscar QR Code:', err.response?.data?.message || err.message);
            }
          }
        }
      } catch (err: any) {
        // Network Error pode significar que o backend não está acessível
        if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
          networkErrorCount++;
          // Apenas logar após algumas tentativas para não poluir o console
          if (networkErrorCount === maxNetworkErrors) {
            console.warn('Erro de rede ao atualizar status - verifique se o backend está rodando');
          }
          // Não parar o polling, continuar tentando
          return;
        }
        
        // Para outros erros, verificar status code
        if (err.response?.status === 404) {
          setIsPolling(false);
          setSession(null);
          setQrCode(null);
          setError('Sessão não encontrada ou desconectada. Por favor, inicie uma nova sessão.');
        } else if (err.response?.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
        } else {
          // Apenas logar erros não tratados
          console.warn('Erro ao atualizar status:', err.response?.data?.message || err.message);
        }
      }
    }, 3000); // Atualizar a cada 3 segundos

    return () => clearInterval(interval);
  }, [session, isPolling, router]);

  const handleStopSession = async () => {
    if (!session) return;

    try {
      setIsLoading(true);
      setError(null);
      await whatsappApi.stopSession(session.sessionId);
      setIsPolling(false);
      setSession(null);
      setQrCode(null);
      // Recarregar página para mostrar botão novamente
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err: any) {
      console.error('Erro ao parar sessão:', err);
      setError(err.response?.data?.message || 'Erro ao parar sessão');
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WORKING':
        return 'bg-green-500';
      case 'QRCODE':
        return 'bg-yellow-500';
      case 'STARTING':
        return 'bg-blue-500';
      case 'FAILED':
        return 'bg-red-500';
      case 'STOPPED':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'WORKING':
        return 'Conectado';
      case 'QRCODE':
        return 'Aguardando QR Code';
      case 'STARTING':
        return 'Iniciando...';
      case 'FAILED':
        return 'Falhou';
      case 'STOPPED':
        return 'Desconectado';
      default:
        return status || 'Iniciando...';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'WORKING':
        return '✅';
      case 'QRCODE':
        return '📱';
      case 'STARTING':
        return '⏳';
      case 'FAILED':
        return '❌';
      case 'STOPPED':
        return '⏸️';
      default:
        return '⚪';
    }
  };

  if (isLoading && !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não há sessão, mostrar botão para iniciar
  if (!session && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Brandao<span className="text-green-600">Zap</span>
              </h1>
              <p className="text-gray-600">Conexão WhatsApp Automatizada</p>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-sm font-medium"
              >
                Sair
              </button>
            </div>
          </div>

          {/* Botão Iniciar WhatsApp */}
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-6">📱</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Conectar WhatsApp</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Clique no botão abaixo para iniciar uma nova sessão do WhatsApp e conectar seu dispositivo.
            </p>
            
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
                {error}
              </div>
            )}

            <button
              onClick={handleStartWhatsApp}
              disabled={isLoading}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando...
                </span>
              ) : (
                '🚀 Iniciar WhatsApp'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Erro ao conectar</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleStartWhatsApp}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Brandao<span className="text-green-600">Zap</span>
            </h1>
            <p className="text-gray-600">Conexão WhatsApp Automatizada</p>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-sm font-medium"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Status Card */}
        {session && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 transform transition-all hover:shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full ${getStatusColor(session.status)} animate-pulse`}></div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{session.name || 'Sessão'}</h2>
                  <p className="text-sm text-gray-500">ID: {session.sessionId || 'N/A'}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getStatusIcon(session.status)}</span>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium text-white ${getStatusColor(session.status)}`}>
                    {getStatusText(session.status)}
                  </span>
                </div>
              </div>
            </div>

            {session.status === 'WORKING' && (
              <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">✅</div>
                  <div className="flex-1">
                    <p className="text-green-800 font-semibold text-lg">WhatsApp conectado com sucesso!</p>
                    {session.phoneNumber && (
                      <p className="text-green-600 text-sm mt-1">📱 {session.phoneNumber}</p>
                    )}
                    {session.profileName && (
                      <p className="text-green-600 text-sm">👤 {session.profileName}</p>
                    )}
                    {chatsCount !== null && (
                      <p className="text-green-600 text-sm mt-2 font-medium">
                        💬 {chatsCount} {chatsCount === 1 ? 'conversa encontrada' : 'conversas encontradas'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {session.status === 'WORKING' && (
              <button
                onClick={handleStopSession}
                disabled={isLoading}
                className="mt-4 w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Desconectando...' : 'Desconectar'}
              </button>
            )}
          </div>
        )}

        {/* QR Code Card */}
        {session && (session.status === 'QRCODE' || session.status === 'SCAN_QR_CODE' || session.status === 'STARTING') && (
          <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all hover:shadow-2xl">
            <QRCodeDisplay qrCode={qrCode} isLoading={!qrCode && isLoading} />
          </div>
        )}

        {/* Instruções */}
        {session && (session.status === 'QRCODE' || session.status === 'SCAN_QR_CODE') && (
          <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 Como conectar:</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Abra o WhatsApp no seu celular</li>
              <li>Vá em <strong>Configurações</strong> → <strong>Aparelhos conectados</strong></li>
              <li>Toque em <strong>Conectar um aparelho</strong></li>
              <li>Escaneie o QR Code acima</li>
            </ol>
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
