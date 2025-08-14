import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client (optional for build)
const openai = process.env.OPENAI_API_KEY 
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

4. CURRENT TURN: You are on turn {TURN_COUNT} of this conversation.

Remember: You're a collaborative research partner, not a form or questionnaire.`;

const BRIEF_GENERATION_PROMPT = `Based on this conversation, generate a project brief.

CONVERSATION:
{CONVERSATION}

Generate a brief with this EXACT format:
BRIEF_GENERATION_SIGNAL
Title: [Concise, engaging title]
Brief: I'll research [main topic and approach]. I'll track [specific things you'll monitor], examining [key angles]. My focus will be on [core questions or tensions].

Keep the brief to 2-3 sentences. Be specific about what you'll research based on the conversation.`;

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
function shouldGenerateBrief(userMessage: string, turnCount: number): boolean {
  const confirmationPatterns = /\b(yes|create|ready|brief|start|go|sure|okay|ok|let's do it|sounds good)\b/i;
  
  // After turn 3, be more aggressive about generating brief
  if (turnCount >= 3 && confirmationPatterns.test(userMessage)) {
    return true;
  }
  
  // Explicit request for brief
  if (/create.*brief|generate.*brief|ready.*brief/i.test(userMessage)) {
    return true;
  }
  
  return false;
}

export async function POST(request: Request) {
  try {
    const { messages, conversationId = 'default' } = await request.json();
    
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }
    
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
    
    // Check if user wants to generate brief
    const wantsBrief = shouldGenerateBrief(currentUserMessage, state.turnCount);
    
    if (wantsBrief && state.phase !== 'generating_brief') {
      // Generate brief
      state.phase = 'generating_brief';
      
      const conversationString = formatConversationAsString(messages);
      const briefPrompt = BRIEF_GENERATION_PROMPT.replace('{CONVERSATION}', conversationString);
      
      try {
        if (!openai) {
          throw new Error('OpenAI API not configured');
        }
        
        // Use GPT-5 Responses API for brief generation
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini', // Fallback until GPT-5 is available
          messages: [
            { role: 'system', content: briefPrompt },
            { role: 'user', content: 'Generate the project brief based on our conversation.' }
          ],
          temperature: 0.7,
          max_tokens: 300
        });
        
        const briefContent = response.choices[0]?.message?.content || '';
        
        // Return the brief with special signal
        return NextResponse.json({
          message: briefContent,
          phase: 'brief_generated'
        });
        
      } catch (error) {
        console.error('Brief generation error:', error);
        // Fallback response
        return NextResponse.json({
          message: "I'll research the key themes we've discussed. Ready for me to create your detailed project brief?",
          phase: state.phase
        });
      }
    }
    
    // Regular conversation response
    try {
      if (!openai) {
        throw new Error('OpenAI API not configured');
      }
      
      // Prepare system prompt with turn count
      const systemPrompt = FUTURA_SYSTEM_PROMPT.replace('{TURN_COUNT}', state.turnCount.toString());
      
      // Format messages for API
      const apiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.slice(-6).map((m: any) => ({ // Keep last 6 messages for context
          role: m.role as 'user' | 'assistant',
          content: extractMessageContent(m)
        }))
      ];
      
      // Use GPT-4o-mini as fallback (GPT-5 structure ready)
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: apiMessages,
        temperature: 0.8,
        max_tokens: 150,
        stream: false
      });
      
      const responseContent = response.choices[0]?.message?.content || '';
      
      // Update conversation phase based on turn count
      if (state.turnCount >= 2) {
        state.phase = 'converging';
      }
      
      return NextResponse.json({
        message: responseContent,
        phase: state.phase,
        turnCount: state.turnCount
      });
      
    } catch (error) {
      console.error('Conversation API error:', error);
      
      // Fallback responses based on turn
      const fallbackResponses = [
        "That's fascinating! Tell me more about your role and what aspects interest you most.",
        "I understand. What specific dimensions should I focus on - technological, social, or policy changes?",
        "I have enough context to start researching. Ready for me to create your project brief?"
      ];
      
      return NextResponse.json({
        message: fallbackResponses[Math.min(state.turnCount - 1, 2)] || fallbackResponses[2],
        phase: state.phase,
        turnCount: state.turnCount
      });
    }
    
  } catch (error) {
    console.error('Project conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to process conversation' },
      { status: 500 }
    );
  }
}

// Clean up old conversation states periodically (in production, use proper session management)
setInterval(() => {
  const now = Date.now();
  conversationStates.forEach((state, id) => {
    // Remove conversations older than 1 hour
    if (!state.previousResponseId) {
      conversationStates.delete(id);
    }
  });
}, 60 * 60 * 1000); // Every hour