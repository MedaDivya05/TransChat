import React, { useEffect, useState } from 'react';
import { LogOut, Moon, Sun, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getUserChats, getUser } from '../../services/chatService';
import { signOut } from '../../services/authService';
import { Chat, ChatWithUser } from '../../types';

interface ChatListProps {
  onSelectChat: (chat: ChatWithUser) => void;
  selectedChatId: string | null;
  onNewChat: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  onSelectChat,
  selectedChatId,
  onNewChat,
}) => {
  const { currentUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [chats, setChats] = useState<ChatWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = getUserChats(currentUser.uid, async (fetchedChats: Chat[]) => {
      const chatsWithUsers = await Promise.all(
        fetchedChats.map(async (chat) => {
          const otherUserId = chat.participants.find((id) => id !== currentUser.uid);
          if (!otherUserId) return null;

          const otherUser = await getUser(otherUserId);
          if (!otherUser) return null;

          return {
            ...chat,
            otherUser,
          } as ChatWithUser;
        })
      );

      setChats(chatsWithUsers.filter((chat): chat is ChatWithUser => chat !== null));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="bg-gray-100 dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Chats</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            title="Toggle theme"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={onNewChat}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            title="New chat"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            title="Sign out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500 dark:text-gray-400">Loading chats...</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
            <p className="text-gray-500 dark:text-gray-400">No chats yet</p>
            <button
              onClick={onNewChat}
              className="mt-2 text-teal-600 dark:text-teal-400 font-semibold hover:underline"
            >
              Start a new chat
            </button>
          </div>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className={`w-full px-4 py-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                selectedChatId === chat.id
                  ? 'bg-gray-100 dark:bg-gray-700'
                  : ''
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {chat.otherUser.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3 flex-1 text-left overflow-hidden">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {chat.otherUser.displayName}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                    {formatTime(chat.lastMessageTime)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {chat.lastMessage || 'No messages yet'}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
