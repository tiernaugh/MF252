import { memo } from 'react';
import type { UIMessage } from 'ai';
import { cn } from '@/lib/utils';
import { Message, MessageContent } from '@/components/prompt-kit/message';

interface MessageComponentProps {
  message: UIMessage;
}

export const MessageComponent = memo(({ message }: MessageComponentProps) => {
  // Explicitly check for attachments in the message's data
  const attachments = (message as any)?.data?.attachments;
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

  return (
    <Message
      key={message.id}
      className={cn(
        'flex flex-col',
        message.role === 'user' ? 'items-end' : 'items-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2',
          message.role === 'user'
            ? 'bg-indigo-500 text-white'
            : 'bg-gray-100 text-gray-900'
        )}
      >
        {/* Render attachments if they exist for user messages */}
        {message.role === 'user' && hasAttachments && (
          <div className="mb-2 space-y-1 border-b border-white/20 pb-2">
            <p className="text-xs font-medium opacity-80">Attached Context:</p>
            {attachments.map((att: any) => (
              <div
                key={att.id}
                className="text-xs opacity-75 italic bg-white/10 rounded p-1"
              >
                📎 "{att.preview}"
              </div>
            ))}
          </div>
        )}

        {/* Render the main message content */}
        <MessageContent
          markdown={message.role === 'assistant'}
          className={cn(
            message.role === 'user'
              ? 'text-white prose-invert'
              : 'text-gray-900'
          )}
        >
          {Array.isArray((message as any).parts)
            ? (message as any).parts.map((part: any) => part.type === 'text' ? part.text : null).join('')
            : (message as any).content}
        </MessageContent>
      </div>
    </Message>
  );
});

MessageComponent.displayName = 'MessageComponent';

