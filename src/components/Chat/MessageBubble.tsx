import React from 'react';
import { Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { FileMessage } from './FileMessage';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { currentUser } = useAuth();
  const isSent = message.senderId === currentUser?.uid;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-3 px-4`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isSent
            ? 'bg-teal-500 text-white rounded-br-none'
            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none shadow-md'
        }`}
      >
        {message.mediaUrl && (
          <div className="mb-2">
            {message.mediaType === 'image' ? (
              <img
                src={message.mediaUrl}
                alt="Shared media"
                className="rounded-lg max-w-full h-auto"
              />
            ) : message.mediaType === 'video' ? (
              <video
                src={message.mediaUrl}
                controls
                className="rounded-lg max-w-full h-auto"
              />
            ) : (
              <FileMessage
                fileName={message.fileName || 'Download'}
                fileSize={message.fileSize}
                mediaUrl={message.mediaUrl}
              />
            )}
          </div>
        )}

        {message.translatedText ? (
          <div>
            <p className="text-sm mb-1">{message.translatedText}</p>
            <p className="text-xs opacity-70 italic border-t border-white/20 dark:border-gray-600 pt-1 mt-1">
              Original: {message.originalText}
            </p>
          </div>
        ) : (
          message.originalText && <p className="text-sm">{message.originalText}</p>
        )}

        <p
          className={`text-xs mt-1 ${
            isSent ? 'text-teal-100' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
};
