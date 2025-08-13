import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';

interface BriefCanvasProps {
  title: string;
  brief: string;
  onUpdate: (title: string, brief: string) => void;
  onContinue: () => void;
  onConfirm: () => void;
}

export function BriefCanvas({ 
  title: initialTitle, 
  brief: initialBrief, 
  onUpdate, 
  onContinue, 
  onConfirm 
}: BriefCanvasProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [brief, setBrief] = useState(initialBrief);
  const briefRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isEditing && briefRef.current) {
      // Focus at end of text
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(briefRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);
  
  const handleSave = () => {
    const newTitle = titleRef.current?.innerText || title;
    const newBrief = briefRef.current?.innerText || brief;
    setTitle(newTitle);
    setBrief(newBrief);
    onUpdate(newTitle, newBrief);
    setIsEditing(false);
  };
  
  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };
  
  const handleBlur = () => {
    if (isEditing) {
      handleSave();
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">Here's your research brief. Feel free to edit anything:</p>
      </div>
      
      <div
        className={`
          bg-white rounded-lg border-2 transition-all duration-200
          ${isEditing ? 'border-indigo-400 shadow-lg' : 'border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'}
          p-8 cursor-text relative
        `}
        onClick={handleClick}
      >
        {/* Edit indicator */}
        {!isEditing && (
          <div className="absolute top-4 right-4 opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Click to edit
            </span>
          </div>
        )}
        
        {/* Document header */}
        <div className="mb-6 pb-4 border-b border-gray-100">
          <h3 className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-3">
            PROJECT BRIEF
          </h3>
        </div>
        
        {/* Title */}
        <div className="mb-6">
          <div
            ref={titleRef}
            contentEditable={isEditing}
            suppressContentEditableWarning={true}
            className={`
              text-2xl font-lora font-bold text-gray-900
              ${isEditing ? 'outline-none focus:bg-gray-50 px-2 -mx-2 py-1 -my-1 rounded' : ''}
            `}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                briefRef.current?.focus();
              }
            }}
          >
            {title}
          </div>
        </div>
        
        {/* Brief content */}
        <div
          ref={briefRef}
          contentEditable={isEditing}
          suppressContentEditableWarning={true}
          className={`
            text-base leading-relaxed text-gray-700 whitespace-pre-wrap
            ${isEditing ? 'outline-none focus:bg-gray-50 px-2 -mx-2 py-1 -my-1 rounded' : ''}
          `}
          onBlur={handleBlur}
        >
          {brief}
        </div>
        
        {/* Editing indicator */}
        {isEditing && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Editing... Click outside to save</p>
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="flex gap-3 mt-6">
        <Button
          variant="outline"
          onClick={onContinue}
          className="flex-1"
        >
          Continue Shaping
        </Button>
        <Button
          onClick={onConfirm}
          className="flex-1 bg-gray-900 text-white hover:bg-gray-800"
        >
          Start Research →
        </Button>
      </div>
    </div>
  );
}