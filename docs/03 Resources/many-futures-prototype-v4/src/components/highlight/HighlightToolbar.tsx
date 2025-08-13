import React from 'react';

interface HighlightToolbarProps {
  clientRect: DOMRect;
  selectedText: string;
  onAddToChat: (text: string) => void;
  onDismiss: () => void;
}

interface ToolbarPosition {
  left: number | string;
  top: number;
  placement: 'below' | 'above' | 'center';
  transform?: string;
}

export function HighlightToolbar({ 
  clientRect, 
  selectedText, 
  onAddToChat, 
  onDismiss 
}: HighlightToolbarProps) {
  const [position, setPosition] = React.useState<ToolbarPosition | null>(null);
  
  // Constants
  const TOOLBAR_HEIGHT = 50; // Estimated height of toolbar
  const TOOLBAR_MARGIN = 8;  // Gap between selection and toolbar

  // Enhanced position calculation function
  const calculateOptimalPosition = React.useCallback((clientRect: DOMRect): ToolbarPosition => {
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - clientRect.bottom;
    const spaceAbove = clientRect.top;
    
    // Prefer below positioning
    if (spaceBelow >= TOOLBAR_HEIGHT + TOOLBAR_MARGIN) {
      return {
        left: clientRect.left + clientRect.width / 2,
        top: clientRect.bottom + TOOLBAR_MARGIN,
        placement: 'below'
      };
    }
    
    // Fallback to above if insufficient space below
    if (spaceAbove >= TOOLBAR_HEIGHT + TOOLBAR_MARGIN) {
      return {
        left: clientRect.left + clientRect.width / 2,
        top: clientRect.top - TOOLBAR_HEIGHT - TOOLBAR_MARGIN,
        placement: 'above'
      };
    }
    
    // Last resort: center viewport (very rare edge case)
    return {
      left: '50%',
      top: Math.max(80, viewportHeight / 2), // Below header
      placement: 'center',
      transform: 'translateX(-50%)'
    };
  }, [TOOLBAR_HEIGHT, TOOLBAR_MARGIN]);

  // Calculate initial position
  React.useEffect(() => {
    if (clientRect) {
      const optimalPosition = calculateOptimalPosition(clientRect);
      console.log('Toolbar positioning:', {
        clientRect: { top: clientRect.top, bottom: clientRect.bottom, height: clientRect.height },
        spaceAbove: clientRect.top,
        spaceBelow: window.innerHeight - clientRect.bottom,
        chosenPlacement: optimalPosition.placement,
        toolbarTop: optimalPosition.top
      });
      setPosition(optimalPosition);
    }
  }, [clientRect, calculateOptimalPosition]);

  // Dismiss on escape key
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  // Dismiss on scroll
  React.useEffect(() => {
    const handleScroll = () => {
      onDismiss();
    };
    
    // Listen for scroll on window and capture all scroll events
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onDismiss]);

  const handleAddToChat = () => {
    onAddToChat(selectedText);
    onDismiss();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
      console.log('Text copied to clipboard:', selectedText);
      onDismiss();
    } catch (err) {
      console.error('Failed to copy text:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = selectedText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      onDismiss();
    }
  };

  // Dynamic style calculation based on placement
  const getToolbarStyle = React.useCallback((position: ToolbarPosition) => {
    const baseStyle = {
      left: position.left,
      top: position.top,
    };
    
    // Handle different placement scenarios
    if (position.placement === 'center') {
      return {
        ...baseStyle,
        left: '50%',
        transform: 'translateX(-50%)',
      };
    }
    
    // Default: 'below' or 'above' positioning
    return {
      ...baseStyle,
      transform: 'translateX(-50%)',
    };
  }, []);

  if (!position) {
    return null;
  }

  return (
    <div
      className="fixed z-50 bg-white/90 backdrop-blur-sm shadow-lg rounded-md border border-gray-200 px-2 py-1.5 flex items-center gap-1"
      style={getToolbarStyle(position)}
    >
      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors duration-150 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
          />
        </svg>
        Copy
      </button>

      {/* Add to Chat Button */}
      <button
        onClick={handleAddToChat}
        className="px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-150 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
          />
        </svg>
        Add to chat
      </button>
    </div>
  );
}