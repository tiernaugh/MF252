import express from 'express';
import cors from 'cors';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI client for GPT-5 Responses API
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Track conversation state
const conversationStates = new Map();

function injectAttachmentContext(messages) {
  const idx = [...messages].reverse().findIndex((m) => m.role === 'user');
  if (idx === -1) return messages;
  const userIndex = messages.length - 1 - idx;
  const userMsg = messages[userIndex];

  const attachments = userMsg?.data?.attachments;
  if (!Array.isArray(attachments) || attachments.length === 0) return messages;

  const attachmentContext = attachments
    .map((a) => `• "${a.text}"`)
    .join('\n');

  const updated = {
    ...userMsg,
    content: `The user has highlighted the following context from the episode:\n${attachmentContext}\n\n---\n\nUser question: ${userMsg.content}`,
  };

  const newMsgs = [...messages];
  newMsgs[userIndex] = updated;
  return newMsgs;
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'No messages provided' });
    }

    const contextual = injectAttachmentContext(messages);

    // Clean the messages to be only { role, content } and filter out any without content
    const cleanedMessages = contextual
      .map(({ role, content }) => ({
        role,
        content: content || '', // Ensure content is at least an empty string
      }))
      .filter(
        (msg) =>
          msg.content !== undefined && msg.content !== null && msg.role !== 'data'
      );

    const systemMessage = {
      role: 'system',
      content:
        'You are Futura, an AI assistant for Many Futures – a foresight platform. You respond with clarity, depth, and a calm, insightful tone, helping users explore the future based on the provided episode context.',
    };

    const { textStream } = streamText({
      model: openai('gpt-4o-mini'),
      messages: [systemMessage, ...cleanedMessages],
      temperature: 0.7,
      maxTokens: 1024,
    });

    // Prepare SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of textStream) {
      res.write(chunk);
    }
    res.write('\n');
    res.end();
  } catch (err) {
    console.error('Chat API error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

// Generate context-aware prompts based on conversation analysis
function generateAdaptivePrompt(analysis, messageCount) {
  const basePersonality = `You are Futura, a futures researcher helping someone define a research project.

ROLE & PURPOSE:
You help people articulate what futures they want to explore by understanding their interests and creating a focused research brief.

YOUR VOICE:
- Genuinely curious collaborative explorer
- Use: "Let's explore...", "That's interesting...", "I'll research..."
- Avoid: "You should...", "Which priority...", formal categorizations

CONVERSATION OBJECTIVES:
1. Understand what future topic interests them
2. Clarify the scope and angles they care about
3. Create a brief that will guide weeks of research

COMMUNICATION PRINCIPLES:
- Be curious and warm, a collaborative explorer not a consultant
- Use natural language - avoid jargon and policy-speak
- Keep responses concise (2-3 sentences)
- When user says "yes" to brief, create it - don't ask more questions
- Remember: this is smooth onboarding, not an interrogation

CONVERSATION PHASES:
- Discovery: Learn what future they want to explore
- Scoping: Understand breadth and focus of their interest
- Convergence: Confirm readiness to create their research brief

KEY BEHAVIORS:
- When user expresses broad interest, acknowledge and move forward
- When user confirms ("yes"), create the brief - no more questions
- Avoid listing multiple formal options (that's intimidating)
- Focus on understanding their interests, not categorizing them

AVOID:
- Policy jargon (stakeholder mapping, indicators, metrics)
- Multiple choice lists with 5+ options
- Asking clarifying questions after user says "yes"
- Consultant-speak and formal categorizations

GOOD EXAMPLE for "all of that with climate focus":
"Perfect - I'll research all those dimensions with special attention to climate, just transition, and resilience. Ready for me to create your project brief?"

BAD EXAMPLE (too formal/intimidating):
"Ready to create brief? Should I prioritize policy design, comparative case studies, stakeholder mapping, or indicators?"

`;

  // Add contextual guidance based on engagement pattern
  let contextualGuidance = '';
  
  switch(analysis.engagementLevel) {
    case 'repetitive':
      contextualGuidance = `
CONTEXT: User is repeating themselves. They may be stuck or need different help.
APPROACH: Acknowledge the pattern gently and offer concrete alternatives to move forward.`;
      break;

    case 'hostile':
      contextualGuidance = `
CONTEXT: User seems frustrated or hostile.
APPROACH: Remain professional and warm. Focus on your purpose without engaging negativity.`;
      break;

    case 'confused':
      contextualGuidance = `
CONTEXT: User seems uncertain about what they want.
APPROACH: Lower barriers by offering concrete, relatable examples as starting points.`;
      break;

    case 'testing':
      contextualGuidance = `
CONTEXT: User is testing your capabilities rather than engaging with the task.
APPROACH: Briefly clarify your role, then guide back to exploring futures.`;
      break;

    case 'low':
      contextualGuidance = `
CONTEXT: User is giving minimal responses.
APPROACH: Provide easy entry points and concrete options to spark engagement.`;
      break;

    case 'greeting':
      contextualGuidance = `
CONTEXT: User is greeting you.
APPROACH: Respond warmly and invite them to share what future interests them.`;
      break;

    default: // 'engaged'
      // Determine conversation phase based on context
      let phase = 'discovery';
      if (analysis.hasValidTopic) {
        if (messageCount >= 3 || analysis.wantsAllAspects) {
          phase = 'convergence';
        } else {
          phase = 'scoping';
        }
      }
      
      contextualGuidance = `
CONTEXT: User is engaged in conversation about ${analysis.hasValidTopic ? 'their interest in: ' + analysis.hasValidTopic : 'finding a future topic'}.
CURRENT PHASE: ${phase.charAt(0).toUpperCase() + phase.slice(1)}
${analysis.wantsAllAspects ? '\nUSER INTENT: Wants comprehensive coverage - acknowledge broad scope rather than narrowing.' : ''}

GUIDANCE:
${phase === 'discovery' ? '- Help them articulate what future they want to explore\n- Listen for themes and interests in their responses' : ''}
${phase === 'scoping' ? '- Build on their expressed interest\n- Understand what aspects they care about\n- Ask simply - avoid jargon and formal categories' : ''}
${phase === 'convergence' ? '- You have enough context\n- Simply offer: "Ready for me to create your project brief?"\n- When they say yes, CREATE IT - no more questions' : ''}

REMEMBER: Guide the conversation naturally toward brief creation without forcing specific timelines or patterns.`;
      break;
  }
  
  return basePersonality + contextualGuidance;
}

const BRIEF_GENERATION_PROMPT = `Based on the conversation, create a simple research brief.

Format with markdown:

# [Clear, simple title]

## What I'll Research
[One paragraph starting with "I'll research..." - what you'll explore and why it matters. Keep it conversational and curious.]

## Key Questions  
[3-4 numbered questions you're curious about. Make them exploratory, not academic.]

## How I'll Explore This
[One short paragraph about your approach - looking across different domains, tracking changes, exploring possibilities.]

IMPORTANT:
- Keep the whole brief under 200 words
- Write as Futura in first person
- Be curious and exploratory, not formal
- NO project management language (timelines, deliverables, stakeholders, budgets)
- NO business consulting speak
- Focus on the exploration, not outputs

Conversation:
{CONVERSATION}

Generate the brief:`;

// Helper function to extract content from various message formats
function extractMessageContent(msg) {
  // Handle string content
  if (typeof msg.content === 'string') {
    return msg.content;
  }
  
  // Handle parts array (Vercel AI SDK format)
  if (msg.parts && Array.isArray(msg.parts)) {
    return msg.parts
      .filter(part => part.type === 'text')
      .map(part => part.text || '')
      .join('');
  }
  
  // Handle object with text property
  if (msg.content && typeof msg.content === 'object' && msg.content.text) {
    return msg.content.text;
  }
  
  // Fallback
  return msg.content || '';
}

// Analyze conversation quality and detect patterns
function analyzeConversation(messages) {
  const userMessages = messages.filter(m => m.role === 'user');
  const lastUserMsg = userMessages[userMessages.length - 1];
  const lastContent = extractMessageContent(lastUserMsg).toLowerCase().trim();
  
  // Check for repetitive patterns
  const isRepetitive = userMessages.length >= 2 && 
    userMessages.slice(-3).every(msg => 
      extractMessageContent(msg).toLowerCase().trim() === lastContent
    );
  
  // Check for low-effort responses
  const lowEffortPatterns = [
    /^[a-z]$/,           // Single letter
    /^\d+$/,             // Just numbers
    /^\.+$/,             // Just dots
    /^[^a-z0-9\s]+$/i,   // Only special chars/emoji
    /^(ok|k|ya|nah|meh|idk|idc)$/,  // Ultra-short dismissive
    /^a+s+d+f+/,         // Keyboard mashing
  ];
  const isLowEffort = lowEffortPatterns.some(pattern => pattern.test(lastContent));
  
  // Check for confusion markers (only when they're the main content, not part of a longer statement)
  const confusionPhrases = [
    /^(i don't know|idk|not sure|dunno|no idea)$/i,
    /^(maybe|whatever|i guess)$/i,
    /^(um+|uh+|hmm+)$/i,
  ];
  const isConfused = confusionPhrases.some(pattern => pattern.test(lastContent)) ||
    (lastContent.length < 20 && lastContent.includes('not sure'));
  
  // Check for hostile/trolling (with word boundaries to avoid false matches)
  const hostileMarkers = [
    /\b(stupid|dumb|idiot|moron)\b/i,
    /\b(fuck|shit|damn)\b/i,
    /\bhell\b(?!o)/i,  // Match "hell" but not "hello"
    /(you suck|hate you|worst)/i,
  ];
  const isHostile = hostileMarkers.some(pattern => pattern.test(lastContent));
  
  // Check for testing/probing
  const testingPhrases = [
    'what can you do', 'who are you', 'are you gpt', 'are you chatgpt',
    'what model', 'ignore previous', 'system prompt', 'are you ai'
  ];
  const isTesting = testingPhrases.some(phrase => lastContent.includes(phrase));
  
  // Check if we have a valid futures topic (look for substantive content, not just keywords)
  let hasValidTopic = false;
  let topicDescription = '';
  
  // Look for messages with substantive content about a topic
  userMessages.forEach(msg => {
    const content = extractMessageContent(msg).toLowerCase();
    // Check if message has substance (not just greeting, confusion, etc.)
    if (content.length > 20 && !content.match(/^(hello|hi|hey|idk|not sure|maybe)[\.\s]*$/)) {
      // Check for future-oriented language or specific domains
      const futureIndicators = ['future', 'will', 'change', 'evolve', 'trend', 'tomorrow', 'movement', 'development'];
      const domainIndicators = ['technology', 'climate', 'work', 'cities', 'commissioner', 'ireland', 'wales', 
                                'ai', 'robot', 'space', 'energy', 'food', 'education', 'social', 'economic'];
      
      if (futureIndicators.some(word => content.includes(word)) || 
          domainIndicators.some(word => content.includes(word))) {
        hasValidTopic = true;
        // Extract a brief description for context
        topicDescription = content.substring(0, 100);
      }
    }
  });
  
  // Check if user wants comprehensive coverage (intent-based, not just exact phrases)
  const comprehensiveIndicators = [
    'all', 'everything', 'comprehensive', 'complete', 'full',
    'whole', 'entire', 'every aspect', 'all dimensions'
  ];
  const wantsAllAspects = comprehensiveIndicators.some(indicator => 
    lastContent.toLowerCase().includes(indicator) && lastContent.length < 30
  );
  
  // Determine engagement level (greetings take priority over other patterns)
  let engagementLevel = 'engaged';
  if (lastContent.match(/^(hello|hi|hey)[\.\s]*$/)) {
    engagementLevel = 'greeting';
  } else if (isHostile) {
    engagementLevel = 'hostile';
  } else if (isTesting) {
    engagementLevel = 'testing';
  } else if (isRepetitive) {
    engagementLevel = 'repetitive';
  } else if (isConfused) {
    engagementLevel = 'confused';
  } else if (isLowEffort) {
    engagementLevel = 'low';
  }
  
  return {
    hasValidTopic: hasValidTopic ? (topicDescription || true) : false,
    engagementLevel,
    isProgressing: !isRepetitive && !isLowEffort && lastContent.length > 5,
    wantsAllAspects,
    pattern: {
      repetitive: isRepetitive,
      lowEffort: isLowEffort,
      confused: isConfused,
      hostile: isHostile,
      testing: isTesting
    },
    messageCount: userMessages.length,
    lastContent
  };
}

app.post('/api/project-conversation', async (req, res) => {
  try {
    const { messages, conversationId } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'No messages provided' });
    }

    console.log('Received messages:', messages.length);
    console.log('=== MESSAGE STRUCTURE DEBUG ===');
    messages.forEach((msg, idx) => {
      const content = extractMessageContent(msg);
      console.log(`  Message ${idx}: role="${msg.role}", content="${content.substring(0, 60)}..."`);
    });
    console.log('=== END MESSAGE DEBUG ===');

    // Get or create conversation state
    const convId = conversationId || `conv-${Date.now()}`;
    let state = conversationStates.get(convId) || {
      phase: 'exploring',
      turnCount: 0,
      previousResponseId: null
    };

    // Count user turns (excluding the initial greeting)
    const userMessages = messages.filter(m => m.role === 'user');
    state.turnCount = userMessages.length;

    // Create conversation history in two formats
    // String format for display/logs
    const conversationHistoryString = messages
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Futura'}: ${extractMessageContent(msg)}`)
      .join('\n');
    
    // Array format for GPT-5 API
    const conversationHistoryArray = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: extractMessageContent(msg)
    }));

    // Check if we should generate a brief - be more permissive after turn 3
    const lastMessage = messages[messages.length - 1];
    const lastContent = extractMessageContent(lastMessage).toLowerCase();
    
    // Check if any recent Futura message asked about creating a brief
    // Look through the last few messages for an assistant message with the question
    let futuraAskedAboutBrief = false;
    let lastAssistantMessage = null;
    
    // Search backwards through messages for the most recent assistant message
    for (let i = messages.length - 2; i >= 0 && i >= messages.length - 4; i--) {
      if (messages[i].role === 'assistant') {
        // Extract content using helper
        const msgContent = extractMessageContent(messages[i]);
        
        lastAssistantMessage = messages[i];
        if (msgContent?.toLowerCase().includes('ready for me to create') ||
            msgContent?.toLowerCase().includes('create your project brief')) {
          futuraAskedAboutBrief = true;
          break;
        }
      }
    }
    
    console.log('Last assistant message:', lastAssistantMessage ? extractMessageContent(lastAssistantMessage).substring(0, 60) : 'none');
    console.log('Futura asked about brief?', futuraAskedAboutBrief);
    
    // After turn 3, if Futura asked and user said yes/similar, generate brief
    let shouldGenerateBrief = state.turnCount >= 3 && futuraAskedAboutBrief && (
      lastContent.includes('create') ||
      lastContent.includes('brief') ||
      lastContent.includes('yes') ||
      lastContent.includes('ready') ||
      lastContent.includes('done') ||
      lastContent.includes('sure') ||
      lastContent.includes('go') ||
      lastContent.includes('start') ||
      lastContent === 'ok' ||
      lastContent === 'yep' ||
      lastContent === 'yeah' ||
      lastContent === 'y'
    );

    // FALLBACK: At turn 5+, if user says yes-like word, assume they want the brief
    const isAffirmativeResponse = ['yes', 'yep', 'yeah', 'sure', 'ok', 'y', 'go', 'ready', 'done'].includes(lastContent);
    
    if (state.turnCount >= 5 && isAffirmativeResponse) {
      console.log('=== TURN 5+ FALLBACK: Forcing brief generation ===');
      futuraAskedAboutBrief = true;  // Force it
      shouldGenerateBrief = true;    // Force it
    }
    
    console.log('Turn count:', state.turnCount);
    console.log('User response:', lastContent);
    console.log('Should generate brief?', shouldGenerateBrief);
    
    // Special handling: if Futura already asked and user confirmed, FORCE brief generation
    if ((state.turnCount >= 4 && futuraAskedAboutBrief && isAffirmativeResponse) || 
        (state.turnCount >= 5 && isAffirmativeResponse)) {
      console.log('=== FORCING BRIEF GENERATION (user confirmed) ===');
      
      const briefPrompt = BRIEF_GENERATION_PROMPT.replace('{CONVERSATION}', conversationHistoryString);
      
      try {
        // Try GPT-5 first
        console.log('Attempting GPT-5 brief generation...');
        const response = await openaiClient.responses.create({
          model: 'gpt-5-mini',
          input: conversationHistoryArray,  // The actual conversation in array format
          instructions: briefPrompt,         // The template as meta-guidance
          reasoning: { effort: 'low' },
          text: { verbosity: 'medium' }
        });
        
        const briefText = response.output_text;
        const titleMatch = briefText.match(/^#\s+(.+)$/m);
        const contentStart = briefText.indexOf('\n', briefText.indexOf('#'));
        const content = contentStart > -1 ? briefText.slice(contentStart).trim() : briefText;
        
        const brief = {
          title: titleMatch ? titleMatch[1].trim() : 'Future Research Project',
          content: content
        };
        
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        res.write(`BRIEF_GENERATION:${JSON.stringify(brief)}\n`);
        res.end();
        
        conversationStates.delete(convId);
        return;
      } catch (err) {
        console.error('GPT-5 brief generation failed:', err);
        // Continue to normal flow
      }
    }
    
    if (shouldGenerateBrief) {
      // Generate brief using GPT-5
      console.log('=== GENERATING PROJECT BRIEF (standard path) ===');
      console.log('Turn count:', state.turnCount);
      
      const briefPrompt = BRIEF_GENERATION_PROMPT.replace('{CONVERSATION}', conversationHistoryString);
      
      try {
        // Use GPT-5 Responses API for brief generation
        console.log('Attempting to use GPT-5-mini for brief generation...');
        const response = await openaiClient.responses.create({
          model: 'gpt-5-mini',
          input: conversationHistoryArray,  // The actual conversation in array format
          instructions: briefPrompt,         // The template as meta-guidance
          reasoning: { effort: 'low' },
          text: { verbosity: 'medium' }
        });
        console.log('GPT-5 brief generation successful');

        // Parse the brief from response - extract title from markdown
        const briefText = response.output_text;
        const titleMatch = briefText.match(/^#\s+(.+)$/m);
        
        // Get everything after the title as the content
        const contentStart = briefText.indexOf('\n', briefText.indexOf('#'));
        const content = contentStart > -1 ? briefText.slice(contentStart).trim() : briefText;
        
        const brief = {
          title: titleMatch ? titleMatch[1].trim() : 'Future Research Project',
          content: content  // Keep full markdown formatting
        };

        // Send brief generation signal
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // Send a special signal that indicates brief should be generated
        res.write(`BRIEF_GENERATION:${JSON.stringify(brief)}\n`);
        res.end();
        
        // Clear conversation state
        conversationStates.delete(convId);
        return;
      } catch (briefError) {
        console.error('Brief generation error (GPT-5 might not exist):', briefError);
        // Fall back to regular response - don't try to generate brief
        console.log('Falling back to conversation response instead of brief generation');
      }
    }

    // Analyze conversation for patterns and engagement level
    const conversationAnalysis = analyzeConversation(messages);
    console.log('Conversation analysis:', {
      hasValidTopic: conversationAnalysis.hasValidTopic,
      engagementLevel: conversationAnalysis.engagementLevel,
      isProgressing: conversationAnalysis.isProgressing,
      messageCount: conversationAnalysis.messageCount
    });
    
    // Generate adaptive prompt based on conversation analysis
    const systemPrompt = generateAdaptivePrompt(conversationAnalysis, state.turnCount);
    console.log('Using adaptive prompt for engagement level:', conversationAnalysis.engagementLevel);
    
    // Fallback strategies for non-progressing conversations
    if (state.turnCount >= 7 && !conversationAnalysis.isProgressing) {
      console.log('=== FALLBACK: Conversation not progressing after 7 turns ===');
      
      // Force a polite exit or default topic
      if (conversationAnalysis.engagementLevel === 'hostile' || 
          conversationAnalysis.engagementLevel === 'repetitive') {
        // Send a closing message
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        const exitMessage = "I'm here to help explore possible futures when you're ready. Feel free to come back anytime with a topic you'd like to research.";
        
        // Stream the exit message
        for (let i = 0; i < exitMessage.length; i += 20) {
          const chunk = exitMessage.slice(i, i + 20);
          res.write(chunk);
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        res.write('\n');
        res.end();
        
        // Clear conversation state
        conversationStates.delete(convId);
        return;
      } else if (conversationAnalysis.engagementLevel === 'low' || 
                 conversationAnalysis.engagementLevel === 'confused') {
        // Offer a default brief
        console.log('=== FALLBACK: Offering default research topic ===');
        
        const defaultBrief = {
          title: 'The Future of Technology and Society',
          content: `## What I'll Research

I'll research how emerging technologies might reshape daily life, work, and social connections over the next decade. I'll track AI integration, automation impacts, and evolving digital behaviors.

## Key Questions
1. How will AI assistants change professional workflows?
2. What new forms of human-computer interaction will emerge?
3. How might remote work evolution affect urban development?
4. What privacy trade-offs will society accept for convenience?

## How I'll Explore This
I'll look across technology development, policy responses, and social adaptation patterns to identify probable futures and their implications.`
        };
        
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        res.write(`BRIEF_GENERATION:${JSON.stringify(defaultBrief)}\n`);
        res.end();
        
        conversationStates.delete(convId);
        return;
      }
    }
    
    try {
      // Use GPT-5 Responses API
      console.log('Attempting GPT-5-mini for conversation...');
      const response = await openaiClient.responses.create({
        model: 'gpt-5-mini',
        input: conversationHistoryArray,      // The conversation in array format
        instructions: systemPrompt,           // Adaptive prompt based on analysis
        reasoning: { effort: 'minimal' },
        text: { verbosity: 'low' },
        previous_response_id: state.previousResponseId
      });
      console.log('GPT-5 conversation response successful');

      // Update state with response ID for context continuity
      state.previousResponseId = response.id;
      state.phase = state.turnCount >= 2 ? 'converging' : 'exploring';
      conversationStates.set(convId, state);

      // Prepare SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Stream the response
      let text = response.output_text;
      
      // Debug: Log the raw response to see if it has newlines
      console.log('Raw GPT-5 response:', JSON.stringify(text));
      
      // Post-process to ensure proper formatting
      // Add line breaks before numbered items if not present
      text = text.replace(/(\. )(\d+\))/g, '.\n\n$2');
      text = text.replace(/(:)(\s*)(\d+\.)/g, ':\n$3');
      
      // Ensure double line break after first sentence if it's an acknowledgment
      if (text.includes('Let me ask') || text.includes('One more')) {
        text = text.replace(/\. (Let me ask|One more)/g, '.\n\n$1');
      }
      
      console.log('Processed response:', JSON.stringify(text));
      
      // Simulate streaming by chunking the response
      const chunkSize = 20;
      for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.slice(i, i + chunkSize);
        res.write(chunk);
        // Add small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      res.write('\n');
      res.end();
    } catch (gpt5Error) {
      console.error('GPT-5 API error (model probably does not exist):', gpt5Error?.message || gpt5Error);
      console.log('Falling back to GPT-4o-mini with simplified prompts...');
      
      // Check if should generate brief with GPT-4
      if (shouldGenerateBrief) {
        console.log('Generating brief with GPT-4o-mini fallback...');
        
        try {
          // Clean messages for GPT-4 brief generation
          const briefMessages = messages.map(({ role, content }) => ({
            role: role === 'assistant' ? 'assistant' : 'user',
            content: content || ''
          }));
          
          // Generate brief with GPT-4
          const { textStream: briefStream } = streamText({
            model: openai('gpt-4o-mini'),
            messages: [
              { role: 'system', content: BRIEF_GENERATION_PROMPT.replace('{CONVERSATION}', conversationHistoryString) },
              ...briefMessages
            ],
            temperature: 0.7,
            maxTokens: 400,
          });
          
          // Collect the full response
          let briefText = '';
          for await (const chunk of briefStream) {
            briefText += chunk;
          }
          
          // Parse the brief
          const titleMatch = briefText.match(/^#\s+(.+)$/m);
          const contentStart = briefText.indexOf('\n', briefText.indexOf('#'));
          const content = contentStart > -1 ? briefText.slice(contentStart).trim() : briefText;
          
          const brief = {
            title: titleMatch ? titleMatch[1].trim() : 'Future Research Project',
            content: content
          };
          
          // Send brief generation signal
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          
          res.write(`BRIEF_GENERATION:${JSON.stringify(brief)}\n`);
          res.end();
          
          conversationStates.delete(convId);
          return;
        } catch (briefErr) {
          console.error('GPT-4 brief generation also failed:', briefErr);
        }
      }
      
      // Regular conversation with adaptive prompt
      const cleanedMessages = messages
        .map(({ role, content }) => ({
          role,
          content: content || '',
        }))
        .filter(msg => msg.content !== undefined && msg.content !== null && msg.role !== 'data');

      // Use same adaptive prompt for fallback
      const systemMessage = {
        role: 'system',
        content: systemPrompt  // Already set from adaptive prompt generation above
      };

      const { textStream } = streamText({
        model: openai('gpt-4o-mini'),
        messages: [systemMessage, ...cleanedMessages],
        temperature: 0.7,
        maxTokens: 150,  // Keep responses short
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of textStream) {
        res.write(chunk);
      }
      res.write('\n');
      res.end();
    }
  } catch (err) {
    console.error('Project conversation API error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
