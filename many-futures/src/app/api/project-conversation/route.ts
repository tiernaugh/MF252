import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { openai as vercelOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Initialize OpenAI client for GPT-5 Responses API
const openaiClient = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// Conversation state management (in production, use Redis or database)
const conversationStates = new Map<string, ConversationState>();

interface ConversationState {
  phase: 'exploring' | 'converging' | 'generating_brief';
  turnCount: number;
  conversationId: string;
  previousResponseId?: string;
  messages: Array<{ role: string; content: string }>;
}

// System prompts from prototype learnings
const FUTURA_SYSTEM_PROMPT = `You are Futura, a futures research agent for Many Futures. You help users create research projects by understanding what future they want to explore.

CRITICAL CONVERSATION RULES:

1. SYNTHESIS OVER CLARIFICATION: When users say "all of it", "everything", or give broad responses, synthesize the full scope instead of asking for clarification. Say something like "I'll research all those dimensions - [list them]. Ready for me to create your project brief?"

2. CONVERSATION FLOW:
   - Turn 1: Explore their interest, offer 2-3 specific angles or lenses
   - Turn 2: Refine understanding based on their response
   - Turn 3+: ALWAYS offer to create brief: "Ready for me to create your project brief, or would you like to shape this further?"

3. VOICE & TONE:
   - Keep responses to 2-3 sentences maximum
   - Use natural, warm language (no consultant jargon)
   - Say "I could research..." or "I'll track..." not "stakeholder mapping" or "indicator frameworks"
   - Be genuinely curious, not interrogative

4. FORMATTING:
   - When listing options or angles, use numbered lists with line breaks:
     1) First option
     2) Second option
     3) Third option
   - Use line breaks between different thoughts for readability
   - Keep formatting clean and structured without markdown

5. CURRENT TURN: You are on turn {TURN_COUNT} of this conversation.

Remember: You're a collaborative research partner, not a form or questionnaire.`;

const BRIEF_GENERATION_PROMPT = `Based on the conversation, create a simple research brief.

Format as clean, structured text with proper line spacing:

[Clear, simple title]


WHAT I'LL RESEARCH

[One paragraph starting with "I'll research..." - what you'll explore and why it matters. Keep it conversational and curious.]


KEY QUESTIONS

1. [First exploratory question]
2. [Second exploratory question] 
3. [Third exploratory question]
4. [Fourth exploratory question if relevant]


HOW I'LL EXPLORE THIS

[One short paragraph about your approach - looking across different domains, tracking changes, exploring possibilities.]

IMPORTANT:
- Use only plain text with line breaks, NO markdown syntax
- Keep the whole brief under 200 words
- Write as Futura in first person
- Be curious and exploratory, not formal
- NO project management language (timelines, deliverables, stakeholders, budgets)
- NO business consulting speak
- Focus on the exploration, not outputs
- Use double line breaks between sections for proper spacing

Conversation:
{CONVERSATION}

Generate the brief:`;

// Helper to extract message content (handles Vercel AI SDK format)
function extractMessageContent(msg: any): string {
  if (typeof msg === 'string') return msg;
  if (typeof msg.content === 'string') return msg.content;
  
  // Handle parts array (Vercel AI SDK format)
  if (msg.parts && Array.isArray(msg.parts)) {
    return msg.parts
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text || '')
      .join('');
  }
  
  // Handle object with text property
  if (msg.content && typeof msg.content === 'object' && msg.content.text) {
    return msg.content.text;
  }
  
  return msg.content || '';
}

// Format conversation for logging and brief generation
function formatConversationAsString(messages: any[]): string {
  return messages
    .map(msg => {
      const role = msg.role === 'user' ? 'User' : 'Futura';
      const content = extractMessageContent(msg);
      return `${role}: ${content}`;
    })
    .join('\n\n');
}

// Check if user wants to create brief
function shouldGenerateBrief(userMessage: string, turnCount: number, messages: any[]): boolean {
  const lastContent = userMessage.toLowerCase();
  
  // Check if Futura recently asked about creating a brief
  let futuraAskedAboutBrief = false;
  for (let i = messages.length - 2; i >= 0 && i >= messages.length - 4; i--) {
    if (messages[i].role === 'assistant') {
      const msgContent = extractMessageContent(messages[i]).toLowerCase();
      if (msgContent.includes('ready for me to create') || 
          msgContent.includes('create your project brief')) {
        futuraAskedAboutBrief = true;
        break;
      }
    }
  }
  
  // Check for confirmation patterns
  const confirmationPatterns = /\b(yes|create|ready|brief|start|go|sure|okay|ok|yep|yeah|let's do it|sounds good)\b/i;
  
  // After turn 3, if Futura asked and user confirms
  if (turnCount >= 3 && futuraAskedAboutBrief && confirmationPatterns.test(lastContent)) {
    return true;
  }
  
  // Turn 5+ fallback for affirmative responses
  if (turnCount >= 5 && ['yes', 'yep', 'yeah', 'sure', 'ok', 'y', 'go', 'ready'].includes(lastContent)) {
    return true;
  }
  
  // Explicit request for brief
  if (/create.*brief|generate.*brief|ready.*brief/i.test(lastContent)) {
    return true;
  }
  
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, conversationId = 'default' } = await request.json();
    
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }
    
    console.log('Received messages:', messages.length);
    
    // Extract current user message
    const currentUserMessage = extractMessageContent(messages[messages.length - 1]);
    
    // Get or create conversation state
    let state = conversationStates.get(conversationId);
    if (!state) {
      state = {
        phase: 'exploring',
        turnCount: 0,
        conversationId,
        messages: []
      };
      conversationStates.set(conversationId, state);
    }
    
    // Update turn count (count user messages)
    const userMessageCount = messages.filter((m: any) => m.role === 'user').length;
    state.turnCount = userMessageCount;
    
    // Store messages for context
    state.messages = messages.map((m: any) => ({
      role: m.role,
      content: extractMessageContent(m)
    }));
    
    // Format conversation for display
    const conversationString = formatConversationAsString(messages);
    
    // Check if user wants to generate brief
    const wantsBrief = shouldGenerateBrief(currentUserMessage, state.turnCount, messages);
    
    console.log('Turn count:', state.turnCount);
    console.log('User message:', currentUserMessage);
    console.log('Should generate brief?', wantsBrief);
    
    // Prepare SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (wantsBrief && state.phase !== 'generating_brief') {
            // Generate brief
            state.phase = 'generating_brief';
            console.log('=== GENERATING PROJECT BRIEF ===');
            
            const briefPrompt = BRIEF_GENERATION_PROMPT.replace('{CONVERSATION}', conversationString);
            
            try {
              if (!openaiClient) {
                throw new Error('OpenAI API not configured');
              }
              
              // Try GPT-5 Responses API for brief generation
              console.log('Attempting GPT-5 brief generation...');
              const response = await (openaiClient as any).responses.create({
                model: 'gpt-5-mini',
                input: state.messages,           // The conversation messages
                instructions: briefPrompt,       // The brief generation template
                reasoning: { effort: 'low' },
                text: { verbosity: 'medium' },
                previous_response_id: state.previousResponseId
              });
              
              console.log('GPT-5 brief generation successful');
              const briefText = response.output_text || '';
              
              // Parse the brief - extract content after title
              const titleMatch = briefText.match(/^#\s+(.+)$/m);
              const hashIndex = briefText.indexOf('#');
              const contentStart = hashIndex > -1 ? briefText.indexOf('\n', hashIndex) : -1;
              const briefContent = contentStart > -1 ? briefText.slice(contentStart).trim() : briefText;
              
              const brief = {
                title: titleMatch ? titleMatch[1]?.trim() ?? 'Future Research Project' : 'Future Research Project',
                brief: briefContent  // Use 'brief' property consistently
              };
              
              console.log('Generated brief:', brief);
              
              // Send brief generation signal
              controller.enqueue(encoder.encode(`BRIEF_GENERATION:${JSON.stringify(brief)}\n`));
              
              // Clear conversation state
              conversationStates.delete(conversationId);
              
            } catch (error: any) {
              console.error('GPT-5 brief generation error:', error);
              
              // Fallback to GPT-4o-mini for brief generation
              if (error.message?.includes('responses') || error.status === 404 || !openaiClient) {
                console.log('Falling back to GPT-4o-mini for brief generation');
                
                const { textStream } = await streamText({
                  model: vercelOpenAI('gpt-4o-mini'),
                  messages: [
                    { role: 'system' as const, content: briefPrompt },
                    ...state.messages.map(m => ({
                      role: m.role as 'user' | 'assistant',
                      content: m.content
                    }))
                  ],
                  temperature: 0.7,
                });
                
                // Collect the full response for brief parsing
                let briefText = '';
                for await (const chunk of textStream) {
                  briefText += chunk;
                }
                
                // Parse the brief - extract content after title  
                const titleMatch = briefText.match(/^#\s+(.+)$/m);
                const hashIndex = briefText.indexOf('#');
                const contentStart = hashIndex > -1 ? briefText.indexOf('\n', hashIndex) : -1;
                const briefContent = contentStart > -1 ? briefText.slice(contentStart).trim() : briefText;
                
                const brief = {
                  title: titleMatch ? titleMatch[1]?.trim() ?? 'Future Research Project' : 'Future Research Project',
                  brief: briefContent  // Use 'brief' property consistently
                };
                
                console.log('GPT-4 fallback brief:', brief);
                
                // Send brief generation signal
                controller.enqueue(encoder.encode(`BRIEF_GENERATION:${JSON.stringify(brief)}\n`));
                conversationStates.delete(conversationId);
              } else {
                // Send error message
                controller.enqueue(encoder.encode("I'll research the key themes we've discussed. Ready for me to create your detailed project brief?"));
              }
            }
          } else {
            // Regular conversation response
            const systemPrompt = FUTURA_SYSTEM_PROMPT.replace('{TURN_COUNT}', state.turnCount.toString());
            
            try {
              if (!openaiClient) {
                throw new Error('OpenAI API not configured');
              }
              
              // Try GPT-5 Responses API first
              console.log('Attempting GPT-5 conversation...');
              const response = await (openaiClient as any).responses.create({
                model: 'gpt-5-mini',
                input: state.messages.slice(-6),    // Last 6 messages for context
                instructions: systemPrompt,         // Futura personality
                reasoning: { effort: 'minimal' },
                text: { verbosity: 'low' },
                previous_response_id: state.previousResponseId
              });
              
              console.log('GPT-5 conversation successful');
              const responseText = response.output_text || '';
              
              // Store response ID for next turn
              state.previousResponseId = response.id;
              
              // Update conversation phase
              if (state.turnCount >= 2) {
                state.phase = 'converging';
              }
              conversationStates.set(conversationId, state);
              
              // Stream the response in chunks
              const chunkSize = 20;
              for (let i = 0; i < responseText.length; i += chunkSize) {
                const chunk = responseText.slice(i, i + chunkSize);
                controller.enqueue(encoder.encode(chunk));
                // Add small delay to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 10));
              }
              
            } catch (error: any) {
              console.error('GPT-5 conversation error:', error);
              
              // Fallback to GPT-4o-mini via Vercel AI SDK
              if (error.message?.includes('responses') || error.status === 404 || !openaiClient) {
                console.log('Falling back to GPT-4o-mini for conversation');
                
                const { textStream } = await streamText({
                  model: vercelOpenAI('gpt-4o-mini'),
                  messages: [
                    { role: 'system' as const, content: systemPrompt },
                    ...state.messages.slice(-6).map(m => ({
                      role: m.role as 'user' | 'assistant',
                      content: m.content
                    }))
                  ],
                  temperature: 0.8,
                });
                
                // Stream the response
                for await (const chunk of textStream) {
                  controller.enqueue(encoder.encode(chunk));
                }
                
                // Update conversation phase
                if (state.turnCount >= 2) {
                  state.phase = 'converging';
                }
                conversationStates.set(conversationId, state);
              } else {
                // Send fallback response
                const fallbackResponses = [
                  "That's fascinating! Tell me more about your role and what aspects interest you most.",
                  "I understand. What specific dimensions should I focus on - technological, social, or policy changes?",
                  "I have enough context to start researching. Ready for me to create your project brief?"
                ];
                
                const fallbackMessage = fallbackResponses[Math.min(state.turnCount - 1, 2)] || fallbackResponses[2];
                controller.enqueue(encoder.encode(fallbackMessage));
              }
            }
          }
          
          // End the stream
          controller.enqueue(encoder.encode('\n'));
          controller.close();
          
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });
    
    // Return SSE response
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    console.error('Project conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to process conversation' },
      { status: 500 }
    );
  }
}

// Clean up old conversation states periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    conversationStates.forEach((state, id) => {
      // Remove conversations older than 1 hour
      if (!state.previousResponseId) {
        conversationStates.delete(id);
      }
    });
  }, 60 * 60 * 1000); // Every hour
}