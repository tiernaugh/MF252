import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';
import type { CoreMessage } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: any[] } = await req.json();

    // Get the last user message to inject context
    const userMessageIndex = (messages as any[]).findLastIndex((msg: any) => msg.role === 'user');
    
    if (userMessageIndex !== -1) {
      const userMessage: any = messages[userMessageIndex];
      const attachments = (userMessage as any)?.data?.attachments;

      if (Array.isArray(attachments) && attachments.length > 0) {
        const attachmentContext = attachments
          .map((att: any) => `Attached context: "${att.text}"`)
          .join('\n\n');
        
        // Prepend the context to the user's message content
        messages[userMessageIndex] = {
          ...userMessage,
          content: `${attachmentContext}\n\n---\n\nUser's question: ${userMessage.content ?? ''}`,
        } as any;
      }
    }

    // Convert UIMessages to CoreMessages, which the AI SDK expects
    const coreMessages: CoreMessage[] = convertToCoreMessages(messages as any);

    // Add the system message
    const systemMessage: CoreMessage = {
      role: 'system',
      content: `You are Futura, an AI assistant for Many Futures - an agentic foresight platform. You help users analyze and discuss content from episodes about future trends and possibilities.

When users reference selected text from episodes, use that context to provide informed, thoughtful responses about the implications, connections, and future scenarios discussed.

Keep responses conversational but insightful, helping users think deeper about the material.`
    };

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      messages: [systemMessage, ...coreMessages],
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    // Ensure a proper JSON error response is sent
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
