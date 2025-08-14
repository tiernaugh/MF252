"use client";

import { useState, useRef, useEffect } from 'react';

interface BriefCanvasProps {
  title: string;
  brief: string;
  onSave: (title: string, brief: string) => void;
  showTypewriter?: boolean;
  isLocked?: boolean;
  onTypewriterComplete?: () => void;
}

export function BriefCanvas({ 
  title: initialTitle, 
  brief: initialBrief, 
  onSave,
  showTypewriter = false, // Default to no typewriter for simplicity
  isLocked = false,
  onTypewriterComplete
}: BriefCanvasProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [brief, setBrief] = useState(initialBrief);
  const [displayedBrief, setDisplayedBrief] = useState(initialBrief); // Always show full text
  
  const briefRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  // SIMPLIFIED: Immediate display, no typewriter
  // (Keeping the prop interface for backward compatibility)
  useEffect(() => {
    setDisplayedBrief(initialBrief);
    if (onTypewriterComplete) {
      onTypewriterComplete();
    }
  }, [initialBrief, onTypewriterComplete]);

  const handleEdit = () => {
    // Don't allow editing if locked
    if (isLocked) return;
    
    setIsEditing(true);
    
    setTimeout(() => {
      // Focus on brief content
      if (briefRef.current) {
        briefRef.current.focus();
        // Place cursor at end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(briefRef.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 0);
  };

  const handleSave = () => {
    const newTitle = titleRef.current?.textContent || title;
    const newBrief = briefRef.current?.textContent || brief;
    
    setTitle(newTitle);
    setBrief(newBrief);
    setIsEditing(false);
    onSave(newTitle, newBrief);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      // Reset to original values
      if (titleRef.current) titleRef.current.textContent = title;
      if (briefRef.current) briefRef.current.textContent = brief;
      setIsEditing(false);
    }
  };

  const isTypewriterComplete = true; // Always complete in simplified version

  return (
    <div className="animate-fade-in-up mt-12">
      {/* Separator dot */}
      <div className="flex justify-center py-4">
        <div className="w-1 h-1 bg-stone-300 rounded-full" />
      </div>
      
      {/* Brief Canvas */}
      <div 
        className={`
          relative p-8 rounded-lg border transition-all duration-300 group
          ${isEditing 
            ? 'bg-white border-stone-400 shadow-lg' 
            : isLocked
            ? 'bg-stone-50 border-stone-200'
            : isTypewriterComplete
            ? 'bg-gradient-to-br from-stone-50 to-white border-stone-200 hover:shadow-md cursor-pointer'
            : 'bg-gradient-to-br from-stone-50 to-white border-stone-200'
          }
        `}
        onClick={() => {
          if (!isEditing && !isLocked && isTypewriterComplete) {
            handleEdit();
          }
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Label */}
        <div className="text-xs uppercase tracking-[0.2em] text-stone-500 font-medium mb-6">
          Project Brief
        </div>
        
        {/* Title */}
        <h2 
          ref={titleRef}
          className="font-serif text-3xl md:text-4xl font-bold text-stone-900 mb-6 outline-none"
          contentEditable={isEditing}
          suppressContentEditableWarning={true}
          onBlur={() => isEditing && handleSave()}
        >
          {title}
        </h2>
        
        {/* Brief Content */}
        <div 
          ref={briefRef}
          className="font-sans text-base md:text-lg text-stone-700 leading-relaxed outline-none whitespace-pre-wrap"
          contentEditable={isEditing}
          suppressContentEditableWarning={true}
          onBlur={() => isEditing && handleSave()}
        >
          {isEditing ? brief : displayedBrief}
        </div>
        
        {/* Edit hint */}
        {!isEditing && !isLocked && isTypewriterComplete && (
          <div className="absolute bottom-2 right-2 text-xs text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Click to edit
          </div>
        )}
        
        {/* Editing indicator */}
        {isEditing && (
          <div className="mt-6 text-xs text-stone-500">
            Click outside to save • Press Esc to cancel
          </div>
        )}
      </div>
      
      {/* Action hints (only show when not editing, not locked, and typewriter complete) */}
      {!isEditing && !isLocked && isTypewriterComplete && (
        <div className="mt-6 text-center text-sm text-stone-400 animate-fade-in">
          <span className="hidden md:inline">Click to edit</span>
          <span className="md:hidden">Tap to edit</span>
        </div>
      )}
    </div>
  );
}

