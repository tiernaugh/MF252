import { useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';

export function PersistentHighlight() {
  const attachments = useChatStore((state) => state.attachments);

  useEffect(() => {
    // Create a style element for highlights
    const styleId = 'persistent-highlights';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    // Generate CSS for highlighting attached text
    const highlights = attachments
      .map((attachment) => {
        if (!attachment.text) return '';
        
        // Create a unique class for this highlight
        return `
          .highlight-${attachment.id} {
            background-color: rgba(99, 102, 241, 0.15);
            border-bottom: 2px solid rgba(99, 102, 241, 0.3);
            transition: background-color 0.2s ease;
          }
          .highlight-${attachment.id}:hover {
            background-color: rgba(99, 102, 241, 0.25);
          }
        `;
      })
      .join('\n');

    styleElement.textContent = highlights;

    // Apply highlights to matching text in the episode content
    const contentElement = document.getElementById('episode-content');
    if (!contentElement) return;

    // Remove existing highlights
    const existingHighlights = contentElement.querySelectorAll('[data-highlight-id]');
    existingHighlights.forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
      }
    });

    // Apply new highlights
    attachments.forEach(attachment => {
      if (!attachment.text) return;
      
      const walker = document.createTreeWalker(
        contentElement,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Skip if this is already inside a highlight
            if (node.parentElement?.hasAttribute('data-highlight-id')) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      const textNodes: Text[] = [];
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node as Text);
      }

      textNodes.forEach(textNode => {
        const text = textNode.textContent || '';
        const index = text.indexOf(attachment.text);
        
        if (index !== -1) {
          const before = text.substring(0, index);
          const match = text.substring(index, index + attachment.text.length);
          const after = text.substring(index + attachment.text.length);

          const span = document.createElement('span');
          span.className = `highlight-${attachment.id}`;
          span.setAttribute('data-highlight-id', attachment.id);
          span.textContent = match;

          const parent = textNode.parentNode;
          if (parent) {
            if (before) {
              parent.insertBefore(document.createTextNode(before), textNode);
            }
            parent.insertBefore(span, textNode);
            if (after) {
              parent.insertBefore(document.createTextNode(after), textNode);
            }
            parent.removeChild(textNode);
          }
        }
      });
    });

    return () => {
      // Cleanup highlights when component unmounts
      const existingHighlights = contentElement.querySelectorAll('[data-highlight-id]');
      existingHighlights.forEach(el => {
        const parent = el.parentNode;
        if (parent) {
          while (el.firstChild) {
            parent.insertBefore(el.firstChild, el);
          }
          parent.removeChild(el);
        }
      });
    };
  }, [attachments]);

  return null;
}