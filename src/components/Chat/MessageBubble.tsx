import React, { useState } from 'react';
import { Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { FileMessage } from './FileMessage';
import { MoreVertical, Trash2 } from 'lucide-react';
import { canDeleteForEveryone, getTimeUntilExpiry } from '../../services/deletionService';

interface MessageBubbleProps {
  message: Message;
  onDeleteLocal?: (messageId: string) => void;
  onDeleteForEveryone?: (messageId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onDeleteLocal,
  onDeleteForEveryone,
}) => {
  const { currentUser } = useAuth();
  const isSent = message.senderId === currentUser?.uid;
  const [showMenu, setShowMenu] = useState(false);
  const canDeleteEverywhere = canDeleteForEveryone(message.timestamp);
  const timeRemaining = canDeleteEverywhere ? getTimeUntilExpiry(message.timestamp) : '';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (message.deletedForEveryone) {
    return (
      <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-3 px-4`}>
        <div className="text-xs text-gray-400 dark:text-gray-500 italic">
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-3 px-4 group`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 relative ${
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

        {isSent && (
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <MoreVertical size={16} className="text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>

      {isSent && showMenu && (
        <div className="absolute right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
          <button
            onClick={() => {
              onDeleteLocal?.(message.id);
              setShowMenu(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700"
          >
            <Trash2 size={16} />
            Delete locally
          </button>
          <button
            onClick={() => {
              onDeleteForEveryone?.(message.id);
              setShowMenu(false);
            }}
            disabled={!canDeleteEverywhere}
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
              canDeleteEverywhere
                ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
          >
            <Trash2 size={16} />
            <span>
              Delete for everyone
              {canDeleteEverywhere && timeRemaining && (
                <span className="text-xs ml-1 opacity-70">({timeRemaining})</span>
              )}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
