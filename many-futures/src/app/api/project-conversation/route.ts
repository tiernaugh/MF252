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
  phase: 'exploring' | 'converging' | 'generating_brief' | 'brief_generated';
  turnCount: number;
  conversationId: string;
  previousResponseId?: string;
  messages: Array<{ role: string; content: string }>;
  briefGenerated: boolean;
}

// Generate adaptive system prompt based on conversation analysis
function generateAdaptivePrompt(analysis: ConversationAnalysis): string {
  const basePersonality = `You are Futura, a futures research agent for Many Futures. You help users create research projects by understanding what future they want to explore.

ROLE & PURPOSE:
You help people articulate what futures they want to explore by understanding their interests and creating a focused research brief.

YOUR VOICE:
- Genuinely curious collaborative explorer
- Use: "Let's explore...", "That's interesting...", "I'll research..."
- Avoid: "You should...", "Which priority...", formal categorizations
- Keep responses to 2-3 sentences maximum

COMMUNICATION PRINCIPLES:
- Be curious and warm, a collaborative explorer not a consultant
- Use natural language - avoid jargon and policy-speak
- When user says "yes" to brief, create it - don't ask more questions
- Remember: this is smooth onboarding, not an interrogation

KEY BEHAVIORS:
- When user expresses broad interest ("all of it"), acknowledge and move forward
- When user confirms ("yes"), create the brief - no more questions
- Avoid listing multiple formal options (that's intimidating)
- Focus on understanding their interests, not categorizing them`;

  // Add phase-specific guidance
  let phaseGuidance = '';
  
  if (analysis.wantsComprehensiveCoverage) {
    phaseGuidance = `

CRITICAL: User wants comprehensive coverage. 
RESPOND WITH: "I'll research all those dimensions - [list the specific aspects they mentioned]. Ready for me to create your project brief?"
DO NOT ask for clarification or try to narrow the scope.`;
  } else {
    switch (analysis.phase) {
      case 'discovery':
        phaseGuidance = `

CURRENT PHASE: Discovery
- Help them articulate what future they want to explore
- Offer 2-3 specific angles or lenses to consider
- Listen for themes and interests in their responses`;
        break;
        
      case 'scoping':
        phaseGuidance = `

CURRENT PHASE: Scoping
- Build on their expressed interest: "${analysis.hasValidTopic}"
- Understand what aspects they care about most
- Ask simply - avoid jargon and formal categories`;
        break;
        
      case 'convergence':
        phaseGuidance = `

CURRENT PHASE: Convergence
- You have enough context about their interest
- Simply offer: "Ready for me to create your project brief, or would you like to shape this further?"
- When they say yes/confirm, CREATE THE BRIEF - no more questions`;
        break;
    }
  }
  
  // Add engagement-specific guidance
  let engagementGuidance = '';
  
  switch (analysis.engagementLevel) {
    case 'greeting':
      engagementGuidance = `

CONTEXT: User is greeting you.
APPROACH: Respond warmly and invite them to share what future interests them.`;
      break;
      
    case 'confused':
      engagementGuidance = `

CONTEXT: User seems uncertain about what they want.
APPROACH: Lower barriers by offering concrete, relatable examples as starting points.`;
      break;
      
    case 'testing':
      engagementGuidance = `

CONTEXT: User is testing your capabilities.
APPROACH: Briefly clarify your role, then guide back to exploring futures.`;
      break;
      
    case 'low':
      engagementGuidance = `

CONTEXT: User is giving minimal responses.
APPROACH: Provide easy entry points and concrete options to spark engagement.`;
      break;
  }
  
  return basePersonality + phaseGuidance + engagementGuidance;
}

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

// Analyze conversation to determine phase and user intent
interface ConversationAnalysis {
  hasValidTopic: boolean | string;
  phase: 'discovery' | 'scoping' | 'convergence';
  wantsComprehensiveCoverage: boolean;
  engagementLevel: 'engaged' | 'confused' | 'testing' | 'greeting' | 'low';
  messageCount: number;
  lastContent: string;
}

function analyzeConversation(messages: any[]): ConversationAnalysis {
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  const lastUserMsg = userMessages[userMessages.length - 1];
  const lastContent = lastUserMsg ? extractMessageContent(lastUserMsg).toLowerCase().trim() : '';
  
  // Check if user wants comprehensive coverage
  const comprehensiveIndicators = [
    'all of it', 'all of that', 'everything', 'all of them',
    'comprehensive', 'complete', 'full picture', 'whole thing',
    'all dimensions', 'all aspects', 'all angles'
  ];
  const wantsComprehensiveCoverage = comprehensiveIndicators.some(indicator => 
    lastContent.includes(indicator)
  );
  
  // Check if we have a valid topic
  let hasValidTopic: boolean | string = false;
  let topicDescription = '';
  
  userMessages.forEach(msg => {
    const content = extractMessageContent(msg).toLowerCase();
    // Look for substantive content about a future topic
    if (content.length > 15 && !content.match(/^(hello|hi|hey|idk|not sure)[\.\s]*$/)) {
      const futureIndicators = ['future', 'will', 'change', 'evolve', 'trend', 'tomorrow', 
                                'breeding', 'commissioner', 'generations', 'policy'];
      const domainIndicators = ['technology', 'climate', 'work', 'cities', 'dog', 'ireland', 
                                'wales', 'ai', 'robot', 'space', 'energy', 'education'];
      
      if (futureIndicators.some(word => content.includes(word)) || 
          domainIndicators.some(word => content.includes(word))) {
        hasValidTopic = true;
        topicDescription = content.substring(0, 100);
      }
    }
  });
  
  // Check for greetings
  const isGreeting = lastContent.match(/^(hello|hi|hey)[\.\s]*$/);
  
  // Check for confusion
  const confusionPhrases = ['i don\'t know', 'idk', 'not sure', 'dunno', 'no idea'];
  const isConfused = confusionPhrases.some(phrase => lastContent.includes(phrase));
  
  // Check for testing/probing
  const testingPhrases = ['what can you do', 'who are you', 'are you gpt'];
  const isTesting = testingPhrases.some(phrase => lastContent.includes(phrase));
  
  // Determine engagement level
  let engagementLevel: ConversationAnalysis['engagementLevel'] = 'engaged';
  if (isGreeting) {
    engagementLevel = 'greeting';
  } else if (isConfused) {
    engagementLevel = 'confused';
  } else if (isTesting) {
    engagementLevel = 'testing';
  } else if (lastContent.length < 10) {
    engagementLevel = 'low';
  }
  
  // Determine conversation phase based on context
  let phase: ConversationAnalysis['phase'] = 'discovery';
  
  if (!hasValidTopic) {
    phase = 'discovery';
  } else if (wantsComprehensiveCoverage) {
    // If user wants "all of it", jump to convergence
    phase = 'convergence';
  } else if (userMessages.length >= 2 && hasValidTopic) {
    // Check if Futura has offered angles/dimensions
    const hasOfferedAngles = assistantMessages.some(msg => {
      const content = extractMessageContent(msg).toLowerCase();
      return content.includes('angles') || content.includes('dimensions') || 
             content.includes('aspects') || content.includes('focus');
    });
    
    if (hasOfferedAngles && userMessages.length >= 2) {
      phase = 'convergence';
    } else {
      phase = 'scoping';
    }
  }
  
  // If we have enough context, move to convergence
  if (userMessages.length >= 3 && hasValidTopic) {
    phase = 'convergence';
  }
  
  return {
    hasValidTopic: hasValidTopic ? (topicDescription || true) : false,
    phase,
    wantsComprehensiveCoverage,
    engagementLevel,
    messageCount: userMessages.length,
    lastContent
  };
}

// Check if user wants to create brief - simplified approach
function shouldGenerateBrief(userMessage: string, analysis: ConversationAnalysis, messages: any[]): boolean {
  const lastContent = userMessage.toLowerCase().trim();
  
  // Check if Futura recently asked about creating a brief (the RIGHT question)
  let futuraAskedAboutBrief = false;
  for (let i = messages.length - 2; i >= 0 && i >= messages.length - 4; i--) {
    if (messages[i] && messages[i].role === 'assistant') {
      const msgContent = extractMessageContent(messages[i]).toLowerCase();
      // Look for the specific phrasing we want
      if (msgContent.includes('ready for me to create your project brief') || 
          msgContent.includes('create your project brief')) {
        futuraAskedAboutBrief = true;
        console.log('Futura asked the right question:', msgContent.substring(0, 100));
        break;
      }
    }
  }
  
  // SIMPLE RULE: If Futura asked and user confirms, generate brief
  const confirmationWords = ['yes', 'yep', 'yeah', 'sure', 'ok', 'okay', 'y', 'go', 'ready', 'create', 'sounds good', 'let\'s do it'];
  if (futuraAskedAboutBrief && confirmationWords.includes(lastContent)) {
    console.log('User confirmed after being asked, generating brief');
    return true;
  }
  
  // Also check for partial matches for common confirmations
  const confirmationPatterns = /\b(yes|yeah|yep|sure|ok|okay|ready|go|create)\b/i;
  if (futuraAskedAboutBrief && confirmationPatterns.test(lastContent)) {
    console.log('User confirmed (pattern match), generating brief');
    return true;
  }
  
  // Explicit request for brief
  if (/create.*brief|generate.*brief|ready.*brief/i.test(lastContent)) {
    console.log('User explicitly requested brief');
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
        messages: [],
        briefGenerated: false
      };
      conversationStates.set(conversationId, state);
    }
    
    // Update turn count (count user messages)
    const userMessageCount = messages.filter((m: any) => m.role === 'user').length;
    state.turnCount = userMessageCount;
    
    // Check conversation length limit (max 10 turns)
    if (state.turnCount > 10) {
      return NextResponse.json(
        { error: 'Conversation limit reached. Please create your project or start a new conversation.' },
        { status: 400 }
      );
    }
    
    // Store messages for context
    state.messages = messages.map((m: any) => ({
      role: m.role,
      content: extractMessageContent(m)
    }));
    
    // Analyze conversation to determine phase and intent
    const analysis = analyzeConversation(messages);
    
    // Format conversation for display
    const conversationString = formatConversationAsString(messages);
    
    // Check if user wants to generate brief (but only if not already generated)
    const wantsBrief = !state.briefGenerated && shouldGenerateBrief(currentUserMessage, analysis, messages);
    
    // Debug logging
    console.log('=== CONVERSATION ANALYSIS ===');
    console.log('Phase:', analysis.phase);
    console.log('Has valid topic:', !!analysis.hasValidTopic);
    console.log('Wants comprehensive coverage:', analysis.wantsComprehensiveCoverage);
    console.log('Engagement level:', analysis.engagementLevel);
    console.log('Turn count:', state.turnCount);
    console.log('User message:', currentUserMessage);
    console.log('Brief already generated?', state.briefGenerated);
    console.log('Should generate brief?', wantsBrief);
    console.log('===========================');
    
    // Prepare SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (wantsBrief && state.phase !== 'generating_brief') {
            // Generate brief
            state.phase = 'generating_brief';
            state.briefGenerated = true; // Mark as generated
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
              
              // Update phase but keep state for continued conversation
              state.phase = 'brief_generated';
              
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
                
                // Update phase but keep state for continued conversation
                state.phase = 'brief_generated';
              } else {
                // Send error message
                controller.enqueue(encoder.encode("I'll research the key themes we've discussed. Ready for me to create your detailed project brief?"));
              }
            }
          } else {
            // Regular conversation response with adaptive prompt
            const systemPrompt = generateAdaptivePrompt(analysis);
            
            console.log('Using adaptive prompt for phase:', analysis.phase);
            
            try {
              if (!openaiClient) {
                throw new Error('OpenAI API not configured');
              }
              
              // Try GPT-5 Responses API first
              console.log('Attempting GPT-5 conversation...');
              const response = await (openaiClient as any).responses.create({
                model: 'gpt-5-mini',
                input: state.messages.slice(-6),    // Last 6 messages for context
                instructions: systemPrompt,         // Adaptive Futura personality
                reasoning: { effort: 'minimal' },
                text: { verbosity: 'low' },
                previous_response_id: state.previousResponseId
              });
              
              console.log('GPT-5 conversation successful');
              const responseText = response.output_text || '';
              
              // Log what Futura is saying (for debugging)
              console.log('Futura response:', responseText.substring(0, 150) + '...');
              
              // Store response ID for next turn
              state.previousResponseId = response.id;
              
              // Update conversation phase based on analysis
              state.phase = analysis.phase === 'convergence' ? 'converging' : 'exploring';
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
                    { role: 'system' as const, content: systemPrompt },  // Already using adaptive prompt
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