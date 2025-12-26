import React, { useEffect, useState, useRef } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TranslationSettings } from './TranslationSettings';
import { useAuth } from '../../contexts/AuthContext';
import { User, Message } from '../../types';
import {
  getChatMessages,
  sendMessage,
  updateTranslationSettings,
} from '../../services/chatService';
import { translateText } from '../../services/translationService';
import { uploadMedia, validateMediaFile } from '../../services/storageService';

interface ChatWindowProps {
  chatId: string;
  otherUser: User;
  onBack: () => void;
  translationEnabled: boolean;
  targetLanguage: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  chatId,
  otherUser,
  onBack,
  translationEnabled: initialTranslationEnabled,
  targetLanguage: initialTargetLanguage,
}) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [translationEnabled, setTranslationEnabled] = useState(initialTranslationEnabled);
  const [targetLanguage, setTargetLanguage] = useState(initialTargetLanguage);
  const [showSettings, setShowSettings] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = getChatMessages(chatId, async (fetchedMessages) => {
      if (translationEnabled && currentUser) {
        const translatedMessages = await Promise.all(
          fetchedMessages.map(async (msg) => {
            if (msg.senderId !== currentUser.uid && msg.originalText && !msg.translatedText) {
              const translated = await translateText(msg.originalText, targetLanguage);
              return { ...msg, translatedText: translated };
            }
            return msg;
          })
        );
        setMessages(translatedMessages);
      } else {
        setMessages(fetchedMessages.map(msg => ({ ...msg, translatedText: '' })));
      }
    });

    return () => unsubscribe();
  }, [chatId, translationEnabled, targetLanguage, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!currentUser || !text.trim()) return;

    await sendMessage(chatId, currentUser.uid, otherUser.uid, text);
  };

  const handleSendMedia = async (file: File) => {
    if (!currentUser) return;

    const validation = validateMediaFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploading(true);
    try {
      const mediaUrl = await uploadMedia(file, currentUser.uid, chatId);
      const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
      await sendMessage(chatId, currentUser.uid, otherUser.uid, undefined, mediaUrl, mediaType);
    } catch (error) {
      console.error('Media upload error:', error);
      alert('Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleTranslation = () => {
    if (!translationEnabled) {
      setShowSettings(true);
    } else {
      setTranslationEnabled(false);
      if (currentUser) {
        updateTranslationSettings(chatId, currentUser.uid, false, targetLanguage);
      }
    }
  };

  const handleSaveTranslationSettings = async (enabled: boolean, language: string) => {
    if (!currentUser) return;

    setTranslationEnabled(enabled);
    setTargetLanguage(language);
    await updateTranslationSettings(chatId, currentUser.uid, enabled, language);
    setShowSettings(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <ChatHeader
        user={otherUser}
        onBack={onBack}
        onToggleTranslation={handleToggleTranslation}
        translationEnabled={translationEnabled}
      />

      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <MessageInput
        onSendMessage={handleSendMessage}
        onSendMedia={handleSendMedia}
        disabled={uploading}
      />

      {showSettings && (
        <TranslationSettings
          currentLanguage={targetLanguage}
          onSave={handleSaveTranslationSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};
