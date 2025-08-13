import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';

export const FloatingChatToggle = () => {
  const { isFloatingButtonVisible, openPanel, showFloatingButton } = useChatStore();

  // Show floating button on component mount if panel is closed
  useEffect(() => {
    showFloatingButton();
  }, [showFloatingButton]);

  // Only show if visible flag is set
  if (!isFloatingButtonVisible) return null;

  return (
    <button
      onClick={openPanel}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-full hover:border-gray-300 hover:bg-gray-50 transform transition-all duration-300 ease-out hover:scale-105 group"
      aria-label="Chat with Futura"
    >
      {/* Futura Avatar */}
      <div className="relative w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-white" />
        {/* Animated glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300" />
      </div>
      
      {/* Text */}
      <span className="text-gray-700 font-medium">Chat with Futura</span>
    </button>
  );
};