'use client';

import { Message } from '@/lib/api/messages';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isOutgoing = message.direction === 'OUTGOING';
  const isIncoming = message.direction === 'INCOMING';

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = () => {
    if (!isOutgoing) return null;
    
    switch (message.status) {
      case 'SENT':
        return '✓';
      case 'DELIVERED':
        return '✓✓';
      case 'READ':
        return '✓✓';
      case 'FAILED':
        return '✗';
      default:
        return '⏳';
    }
  };

  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isOutgoing
            ? 'bg-green-500 text-white'
            : 'bg-white text-gray-800 border border-gray-200'
        }`}
      >
        {message.text && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        )}
        
        {message.mediaUrl && (
          <div className="mt-2">
            <img
              src={message.mediaUrl}
              alt="Mídia"
              className="max-w-full rounded"
            />
            {message.text && (
              <p className="text-sm mt-2 whitespace-pre-wrap break-words">
                {message.text}
              </p>
            )}
          </div>
        )}

        <div
          className={`flex items-center justify-end gap-1 mt-1 text-xs ${
            isOutgoing ? 'text-green-100' : 'text-gray-500'
          }`}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isOutgoing && (
            <span className="ml-1">{getStatusIcon()}</span>
          )}
        </div>
      </div>
    </div>
  );
}
