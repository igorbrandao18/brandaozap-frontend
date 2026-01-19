'use client';

import { useEffect, useState } from 'react';
// @ts-ignore - qrcode.react types
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  qrCode: string | null;
  isLoading?: boolean;
}

export default function QRCodeDisplay({ qrCode, isLoading }: QRCodeDisplayProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (qrCode) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [qrCode]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="relative w-72 h-72">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-green-400 rounded-2xl opacity-20 animate-pulse"></div>
          <div className="absolute inset-2 bg-white rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <span className="text-gray-500 font-medium">Gerando QR Code...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!qrCode) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-72 h-72 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center">
            <div className="text-4xl mb-2">📱</div>
            <span className="text-gray-400 font-medium">QR Code não disponível</span>
          </div>
        </div>
      </div>
    );
  }

  // Verificar se o QR code é uma data URL (imagem) ou texto
  const isImageDataUrl = qrCode && qrCode.startsWith('data:image');

  return (
    <div className="flex flex-col items-center justify-center">
      <h3 className="text-2xl font-bold text-gray-800 mb-2">
        Escaneie o QR Code
      </h3>
      <p className="text-gray-600 mb-4 text-center max-w-md">
        Abra o WhatsApp no seu celular e escaneie este código para conectar
      </p>
      <p className="text-sm text-yellow-600 mb-6 text-center max-w-md bg-yellow-50 px-4 py-2 rounded-lg">
        ⚠️ O QR code expira em alguns segundos. Se não funcionar, aguarde um novo ser gerado automaticamente.
      </p>
      
      <div className={`relative transition-all duration-500 ${isAnimating ? 'scale-105' : 'scale-100'}`}>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-green-400 to-blue-400 rounded-3xl opacity-30 blur-xl animate-pulse"></div>
        
        {/* QR Code container */}
        <div className="relative bg-white p-6 rounded-2xl shadow-2xl border-4 border-gray-100">
          {isImageDataUrl ? (
            // Se for imagem (data URL), renderizar diretamente
            <img 
              src={qrCode} 
              alt="QR Code" 
              className="w-80 h-80 object-contain"
              style={{ 
                imageRendering: 'crisp-edges',
                maxWidth: '320px',
                maxHeight: '320px',
                width: 'auto',
                height: 'auto'
              }}
              onError={(e) => {
                console.error('Erro ao carregar imagem do QR code');
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            // Se for texto, usar QRCodeSVG para gerar
            <QRCodeSVG 
              value={qrCode} 
              size={320} 
              level="H"
              includeMargin={true}
              fgColor="#000000"
              bgColor="#ffffff"
            />
          )}
        </div>
      </div>

      {/* Animated border */}
      <div className="mt-6 w-72 h-1 bg-gradient-to-r from-blue-500 via-green-500 to-blue-500 rounded-full animate-pulse"></div>
    </div>
  );
}
