import { useState, useEffect, useRef } from 'react';

interface TextSelectionState {
  text: string;
  clientRect: DOMRect | null;
  isCollapsed: boolean;
  showToolbar: boolean;
}

export function useTextSelection(targetElement?: HTMLElement | null): TextSelectionState {
  const [selection, setSelection] = useState<TextSelectionState>({
    text: '',
    clientRect: null,
    isCollapsed: true,
    showToolbar: false,
  });
  
  const [_isSelecting, setIsSelecting] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  
  // Constants
  const TOOLBAR_DELAY = 150; // ms

  useEffect(() => {
    // Mouse event handlers for timing control
    const handleMouseDown = () => {
      setIsSelecting(true);
      setSelection(prev => ({ ...prev, showToolbar: false }));
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const handleMouseUp = () => {
      setIsSelecting(false);
      // Start stabilization timer
      timeoutRef.current = window.setTimeout(() => {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && sel.toString().trim()) {
          // Only show toolbar if we have valid selection
          setSelection(prev => ({ ...prev, showToolbar: true }));
        }
      }, TOOLBAR_DELAY);
    };

    const updateSelection = () => {
      const sel = window.getSelection();
      
      if (!sel || sel.rangeCount === 0) {
        setSelection({
          text: '',
          clientRect: null,
          isCollapsed: true,
          showToolbar: false,
        });
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        return;
      }

      const range = sel.getRangeAt(0);
      const text = sel.toString().trim();
      
      // If we have a target element, check if the selection is within it
      if (targetElement) {
        const selectionContainer = range.commonAncestorContainer;
        const isWithinTarget = targetElement.contains(
          selectionContainer.nodeType === Node.TEXT_NODE 
            ? selectionContainer.parentNode 
            : selectionContainer
        );
        
        if (!isWithinTarget) {
          setSelection({
            text: '',
            clientRect: null,
            isCollapsed: true,
            showToolbar: false,
          });
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          return;
        }
      }

      // Always update text and position, but don't control toolbar visibility here
      if (text.length > 0 && !sel.isCollapsed) {
        const rect = range.getBoundingClientRect();
        setSelection(prev => ({
          text,
          clientRect: rect,
          isCollapsed: sel.isCollapsed,
          showToolbar: prev.showToolbar, // Preserve existing toolbar state
        }));
      } else {
        setSelection({
          text: '',
          clientRect: null,
          isCollapsed: true,
          showToolbar: false,
        });
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    };

    // Add mouse event listeners for timing control
    if (targetElement) {
      targetElement.addEventListener('mousedown', handleMouseDown);
    } else {
      document.addEventListener('mousedown', handleMouseDown);
    }
    document.addEventListener('mouseup', handleMouseUp);
    
    // Add touch event listeners for mobile support
    if (targetElement) {
      targetElement.addEventListener('touchstart', handleMouseDown);
    } else {
      document.addEventListener('touchstart', handleMouseDown);
    }
    document.addEventListener('touchend', handleMouseUp);

    // Listen for selection changes (but don't control toolbar visibility here)
    document.addEventListener('selectionchange', updateSelection);

    // Clean up on unmount
    return () => {
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Remove event listeners
      if (targetElement) {
        targetElement.removeEventListener('mousedown', handleMouseDown);
        targetElement.removeEventListener('touchstart', handleMouseDown);
      } else {
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('touchstart', handleMouseDown);
      }
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
      document.removeEventListener('selectionchange', updateSelection);
    };
  }, [targetElement]);

  // Additional cleanup effect for timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return selection;
}