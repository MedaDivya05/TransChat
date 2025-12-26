import React from 'react';
import { ArrowLeft, Languages } from 'lucide-react';
import { User } from '../../types';

interface ChatHeaderProps {
  user: User;
  onBack: () => void;
  onToggleTranslation: () => void;
  translationEnabled: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  user,
  onBack,
  onToggleTranslation,
  translationEnabled,
}) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <button
          onClick={onBack}
          className="mr-3 md:hidden text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold">
          {user.displayName.charAt(0).toUpperCase()}
        </div>
        <div className="ml-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">{user.displayName}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
        </div>
      </div>

      <button
        onClick={onToggleTranslation}
        className={`p-2 rounded-full transition-colors ${
          translationEnabled
            ? 'bg-teal-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        }`}
        title="Toggle Translation"
      >
        <Languages size={20} />
      </button>
    </div>
  );
};
