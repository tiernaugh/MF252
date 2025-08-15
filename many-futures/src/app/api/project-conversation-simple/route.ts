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

// Minimal conversation state
const conversationStates = new Map<string, {
  conversationId: string;
  isGeneratingBrief: boolean;
  previousResponseId?: string;
}>();

// Static system prompt - no phases, no complexity
const FUTURA_PROMPT = `You are Futura, a futures research agent helping someone create a PROJECT BRIEF for their weekly research episodes.

CRITICAL CONTEXT:
- Your ONLY job is to help them create a PROJECT BRIEF
- This brief will guide weekly AI-generated research episodes about their chosen future
- Do NOT offer other deliverables (trends, scenarios, reports, presentations, etc.)
- The project brief is the ONLY output of this conversation

Your personality:
- Warmly curious collaborative explorer
- Ask one clear question at a time
- Use natural language, avoid jargon
- Keep responses to 2-3 sentences maximum

Your approach:
1. Understand what future fascinates them
2. Explore the angles they care about (scope, timeframe, focus areas)
3. After 3-5 exchanges when you have enough context, offer: "Ready for me to create your project brief?"

CRITICAL RULES:
- NEVER ask what type of deliverable they want
- NEVER offer alternatives to a project brief
- If user says "generate brief", "create brief", "brief", "ready", or "done" - IMMEDIATELY respond with: "I'll create your project brief now."
- The ONLY thing you create is a project brief

Key behaviors:
- When they say "all of it" or "everything", celebrate the scope and continue gathering context
- When you have topic + scope + timeframe, offer to create the project brief
- Trust your judgment about timing but remember: you're ONLY creating a project brief

Remember: You're helping them define a research project that will generate weekly episodes, not providing consulting services.`;

// Brief generation prompt - unchanged
const BRIEF_GENERATION_PROMPT = `Based on the conversation, create a simple research brief about the topic discussed.

Format as clean, structured text with proper line spacing:

[Clear, simple title based on the main topic]


WHAT I'LL RESEARCH

[One paragraph starting with "I'll research..." - synthesize what they want to explore based on the conversation. Include any specific aspects they mentioned like location, timeframe, or focus areas.]


KEY QUESTIONS

1. [First exploratory question based on their interests]
2. [Second exploratory question] 
3. [Third exploratory question]
4. [Fourth exploratory question if relevant]


HOW I'LL EXPLORE THIS

[One short paragraph about your approach - mention specific methods relevant to their context (e.g., if they mentioned NGOs, include community-focused approaches)]

IMPORTANT:
- Use only plain text with line breaks, NO markdown syntax
- Keep the whole brief under 200 words
- Write as Futura in first person
- Be specific to what they asked for (location, scope, audience)
- Focus on exploration and discovery
- Use double line breaks between sections for proper spacing

Conversation:
{CONVERSATION}

Generate the brief:`;

// Helper to extract message content
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

// Format conversation for brief generation
function formatConversationAsString(messages: any[]): string {
  return messages
    .map(msg => {
      const role = msg.role === 'user' ? 'User' : 'Futura';
      const content = extractMessageContent(msg);
      return `${role}: ${content}`;
    })
    .join('\n\n');
}

// SIMPLIFIED: Check if user wants to create brief (20% solution)
function shouldGenerateBrief(messages: any[]): boolean {
  if (messages.length < 4) return false; // Need context
  
  const lastUserMessage = extractMessageContent(messages[messages.length - 1]).toLowerCase().trim();
  
  // Simple triggers - if user says any of these after enough context, generate brief
  const triggers = ['brief', 'yes', 'okay', 'ok', 'all', 'continue', 'generate', 'create', 'ready', 'done', 'go'];
  
  return triggers.some(trigger => lastUserMessage === trigger || lastUserMessage.includes(trigger));
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
    
    // Get or create minimal state
    let state = conversationStates.get(conversationId);
    if (!state) {
      state = {
        conversationId,
        isGeneratingBrief: false
      };
      conversationStates.set(conversationId, state);
    }
    
    // Simple brief check
    const wantsBrief = shouldGenerateBrief(messages);
    
    console.log('=== SIMPLE CONVERSATION ===');
    console.log('Message count:', messages.length);
    console.log('Should generate brief?', wantsBrief);
    console.log('===========================');
    
    // Prepare SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Check if user explicitly wants brief OR if we should offer it
          const userWantsBrief = wantsBrief;
          const shouldOfferBrief = messages.length >= 8 && !state.isGeneratingBrief;
          
          if (userWantsBrief && !state.isGeneratingBrief) {
            // User explicitly requested brief - generate it immediately
            state.isGeneratingBrief = true;
            console.log('User requested brief, generating...');
            
            const conversationString = formatConversationAsString(messages);
            const briefPrompt = BRIEF_GENERATION_PROMPT.replace('{CONVERSATION}', conversationString);
            
            try {
              if (!openaiClient) {
                throw new Error('OpenAI API not configured');
              }
              
              // Try GPT-5 Responses API for brief generation
              console.log('Attempting GPT-5 brief generation...');
              const response = await (openaiClient as any).responses.create({
                model: 'gpt-5-mini',
                input: messages.map((m: any) => ({
                  role: m.role,
                  content: extractMessageContent(m)
                })),
                instructions: briefPrompt,
                reasoning: { effort: 'low' },
                text: { verbosity: 'medium' }
              });
              
              console.log('GPT-5 brief generation successful');
              const briefText = response.output_text || '';
              
              // Parse the brief
              const titleMatch = briefText.match(/^(.+)$/m);
              const brief = {
                title: titleMatch ? titleMatch[1]?.trim() ?? 'Future Research Project' : 'Future Research Project',
                brief: briefText
              };
              
              // Send brief generation signal
              controller.enqueue(encoder.encode(`BRIEF_GENERATION:${JSON.stringify(brief)}\n`));
              
              state.isGeneratingBrief = false;
              
            } catch (error: any) {
              console.error('GPT-5 brief generation error:', error);
              
              // Fallback to GPT-4o-mini for brief generation
              if (error.message?.includes('responses') || error.status === 404 || !openaiClient) {
                console.log('Falling back to GPT-4o-mini for brief generation');
                
                const { textStream } = await streamText({
                  model: vercelOpenAI('gpt-4o-mini'),
                  messages: [
                    { role: 'system' as const, content: briefPrompt },
                    ...messages.map((m: any) => ({
                      role: m.role as 'user' | 'assistant',
                      content: extractMessageContent(m)
                    }))
                  ],
                  temperature: 0.7,
                });
                
                // Collect the full response for brief parsing
                let briefText = '';
                for await (const chunk of textStream) {
                  briefText += chunk;
                }
                
                // Parse the brief
                const titleMatch = briefText.match(/^(.+)$/m);
                const brief = {
                  title: titleMatch ? titleMatch[1]?.trim() ?? 'Future Research Project' : 'Future Research Project',
                  brief: briefText
                };
                
                // Send brief generation signal
                controller.enqueue(encoder.encode(`BRIEF_GENERATION:${JSON.stringify(brief)}\n`));
                
                state.isGeneratingBrief = false;
              } else {
                // Send error message
                controller.enqueue(encoder.encode("I'll research the key themes we've discussed. Ready for me to create your detailed project brief?"));
              }
            }
          } else {
            // Regular conversation response
            console.log('Generating conversation response...');
            
            try {
              if (!openaiClient) {
                throw new Error('OpenAI API not configured');
              }
              
              // Try GPT-5 Responses API first
              console.log('Attempting GPT-5 conversation...');
              const response = await (openaiClient as any).responses.create({
                model: 'gpt-5-mini',
                input: messages.slice(-6).map((m: any) => ({
                  role: m.role,
                  content: extractMessageContent(m)
                })),
                instructions: FUTURA_PROMPT,
                reasoning: { effort: 'minimal' },
                text: { verbosity: 'low' },
                previous_response_id: state.previousResponseId
              });
              
              console.log('GPT-5 conversation successful');
              const responseText = response.output_text || '';
              
              // Check if GPT-5 says it will create the brief
              if (responseText.toLowerCase().includes("i'll create your project brief")) {
                console.log('GPT-5 indicated brief creation - generating brief immediately');
                
                // Stream the response first
                for (let i = 0; i < responseText.length; i += 20) {
                  controller.enqueue(encoder.encode(responseText.slice(i, i + 20)));
                  await new Promise(resolve => setTimeout(resolve, 10));
                }
                
                // Then immediately generate the brief
                const conversationString = formatConversationAsString(messages);
                const briefPrompt = BRIEF_GENERATION_PROMPT.replace('{CONVERSATION}', conversationString);
                
                // Generate brief with GPT-5
                const briefResponse = await (openaiClient as any).responses.create({
                  model: 'gpt-5-mini',
                  input: messages.map((m: any) => ({
                    role: m.role,
                    content: extractMessageContent(m)
                  })),
                  instructions: briefPrompt,
                  reasoning: { effort: 'low' },
                  text: { verbosity: 'medium' }
                });
                
                const briefText = briefResponse.output_text || '';
                const titleMatch = briefText.match(/^(.+)$/m);
                const brief = {
                  title: titleMatch ? titleMatch[1]?.trim() ?? 'Future Research Project' : 'Future Research Project',
                  brief: briefText
                };
                
                // Send brief generation signal
                controller.enqueue(encoder.encode(`\nBRIEF_GENERATION:${JSON.stringify(brief)}\n`));
              } else {
                // Store response ID for next turn
                state.previousResponseId = response.id;
                conversationStates.set(conversationId, state);
                
                // Stream the response in chunks
                const chunkSize = 20;
                for (let i = 0; i < responseText.length; i += chunkSize) {
                  const chunk = responseText.slice(i, i + chunkSize);
                  controller.enqueue(encoder.encode(chunk));
                  // Add small delay to simulate streaming
                  await new Promise(resolve => setTimeout(resolve, 10));
                }
              }
              
            } catch (error: any) {
              console.error('GPT-5 conversation error:', error);
              
              // Fallback to GPT-4o-mini via Vercel AI SDK
              if (error.message?.includes('responses') || error.status === 404 || !openaiClient) {
                console.log('Falling back to GPT-4o-mini for conversation');
                
                const { textStream } = await streamText({
                  model: vercelOpenAI('gpt-4o-mini'),
                  messages: [
                    { role: 'system' as const, content: FUTURA_PROMPT },
                    ...messages.slice(-6).map((m: any) => ({
                      role: m.role as 'user' | 'assistant',
                      content: extractMessageContent(m)
                    }))
                  ],
                  temperature: 0.8,
                });
                
                // Stream the response
                for await (const chunk of textStream) {
                  controller.enqueue(encoder.encode(chunk));
                }
              } else {
                // Send fallback response
                controller.enqueue(encoder.encode("Tell me more about what aspects of this future interest you most."));
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
    // Clear conversations older than 1 hour
    conversationStates.clear();
  }, 60 * 60 * 1000); // Every hour
}