// Smoke & mirrors conversation engine for prototyping

interface ConversationContext {
  turnCount: number;
  previousMessages: Array<{ role: string; content: string }>;
  detectedTopic?: string;
}

const OPENING_MESSAGE = "I research possible futures and their implications. What future would you like to explore?";

// Topic detection patterns
const topicPatterns = {
  ai_design: /\b(ai|artificial intelligence|machine learning|automation|design|creative|consultancy)\b/i,
  urban: /\b(city|cities|urban|remote work|office|downtown|metropolitan)\b/i,
  wildlife: /\b(wolf|wolves|wildlife|ecosystem|rewilding|predator|nature|animal)\b/i,
  environment: /\b(turf|peat|bog|ireland|climate|carbon|environmental)\b/i,
  tech: /\b(quantum|blockchain|crypto|web3|metaverse|vr|ar|computing)\b/i,
  health: /\b(health|medical|pharma|drug|disease|therapy|wellness)\b/i,
  finance: /\b(finance|banking|fintech|payment|investment|trading)\b/i,
};

// Response templates by topic and turn
const responses = {
  ai_design: {
    explore: "AI in design and creative work raises fascinating questions. I could research how generative tools reshape creative workflows, the evolution of human-AI collaboration in design teams, or new business models emerging from AI-augmented services. What aspect interests you most?",
    refine: "That's a key tension - whether AI enhances or replaces creative expertise. I could focus on how design consultancies are positioning for this shift, tracking both the tools being adopted and the new value propositions emerging.",
    converge: "I have enough to start researching this area. Ready for me to create your project brief, or would you like to shape this further?",
  },
  urban: {
    explore: "Cities and urban life are transforming in interesting ways. I could research how remote work reshapes urban economics, the evolution of public spaces, infrastructure adaptations, or demographic shifts. What dimension feels most relevant to you?",
    refine: "That's the central question - whether cities hollow out or transform into something new. I'll track both exodus patterns and adaptive strategies, looking at policy responses and emerging urban models.",
    converge: "I can research these urban dynamics for you. Ready for me to create your project brief, or would you like to shape this further?",
  },
  wildlife: {
    explore: "Wildlife restoration and ecosystem dynamics involve complex interactions. Are you more interested in the ecological impacts, policy frameworks, social acceptance, or the practical challenges of reintroduction?",
    refine: "I'll research the full picture - ecological readiness, habitat corridors, regulatory frameworks, and community responses. I'll also track similar rewilding efforts globally for patterns.",
    converge: "I have a good sense of what to research here. Ready for me to create your project brief, or would you like to shape this further?",
  },
  environment: {
    explore: "Environmental and cultural traditions often create interesting tensions. I could explore regulatory pressures, community responses, technological alternatives, or the balance between preservation and transition. What angle resonates with you?",
    refine: "I'll track how traditional practices adapt to environmental policies, looking at both resistance and innovation, community impacts, and potential compromises emerging.",
    converge: "I can research these environmental and cultural dynamics. Ready for me to create your project brief, or would you like to shape this further?",
  },
  generic: {
    explore: "That's an interesting area to explore. Could you tell me more about what aspects interest you? Are you thinking about technological changes, social dynamics, policy implications, or something else?",
    refine: "I'm starting to see the shape of what you're interested in. Let me understand - are you more focused on near-term changes or longer-term transformations?",
    converge: "Based on what you've shared, I can start researching this area. Ready for me to create your project brief, or would you like to shape this further?",
  },
};

// Brief generation templates
const briefTemplates = {
  ai_design: {
    title: "AI Transformation in Creative Industries",
    brief: "I'll research how artificial intelligence is reshaping creative and design work. I'll track the adoption of generative tools, evolving collaboration models between humans and AI, new service offerings emerging from consultancies, and client expectations in an AI-augmented world. My focus will be on identifying both the opportunities and tensions as creative industries navigate this technological shift.",
  },
  urban: {
    title: "The Future of Urban Work Patterns",
    brief: "I'll research how remote work is reshaping city economics and urban life. I'll track office space transformations, policy responses to population shifts, and emerging hybrid lifestyle patterns. My focus will be on whether cities hollow out or transform into something new, examining both exodus patterns and adaptive strategies that major metropolitan areas are developing.",
  },
  wildlife: {
    title: "Wildlife Restoration Possibilities",
    brief: "I'll research the potential for large predator reestablishment, tracking both natural migration patterns and policy discussions around active reintroduction. I'll examine ecological readiness, prey populations, habitat corridors, public sentiment in surrounding communities, and regulatory frameworks. I'll also monitor similar rewilding efforts globally for patterns that might predict success or failure.",
  },
  environment: {
    title: "Traditional Practices in Environmental Transition",
    brief: "I'll research how traditional land use practices evolve under environmental pressures. I'll track regulatory changes, community responses, technological alternatives, and the tension between cultural preservation and climate goals. My focus will be on finding potential pathways that balance heritage with sustainability, examining both resistance points and innovative adaptations.",
  },
  generic: {
    title: "Exploring Future Possibilities",
    brief: "I'll research the key dynamics and emerging patterns in this area. I'll track relevant developments, policy changes, technological shifts, and social responses. My focus will be on identifying signals of change and understanding their potential implications for different stakeholders.",
  },
};

export function getFuturaResponse(userInput: string, context: ConversationContext): string {
  // Opening message
  if (context.turnCount === 0) {
    return OPENING_MESSAGE;
  }
  
  // Detect topic if not already detected
  let topic = context.detectedTopic || 'generic';
  if (!context.detectedTopic) {
    for (const [key, pattern] of Object.entries(topicPatterns)) {
      if (pattern.test(userInput)) {
        topic = key;
        break;
      }
    }
  }
  
  // Get appropriate response based on turn count
  const topicResponses = responses[topic as keyof typeof responses] || responses.generic;
  
  if (context.turnCount === 1) {
    return topicResponses.explore;
  } else if (context.turnCount === 2) {
    return topicResponses.refine;
  } else {
    return topicResponses.converge;
  }
}

export function generateProjectBrief(context: ConversationContext): { title: string; brief: string } {
  // Detect topic from conversation history
  let topic = 'generic';
  const fullConversation = context.previousMessages.map(m => m.content).join(' ');
  
  for (const [key, pattern] of Object.entries(topicPatterns)) {
    if (pattern.test(fullConversation)) {
      topic = key;
      break;
    }
  }
  
  // Return appropriate brief template
  const template = briefTemplates[topic as keyof typeof briefTemplates] || briefTemplates.generic;
  
  // Could enhance this to be more dynamic based on specific conversation content
  // For prototype, using templates is sufficient
  return template;
}

// Handle edge cases
export function isOutOfScope(userInput: string): boolean {
  const outOfScopePatterns = [
    /\b(porn|sex|adult|nsfw)\b/i,
    /\b(elon|musk|trump|biden|celebrity)\b/i,
    /\b(stock|price|bitcoin|investment advice)\b/i,
    /\b(illegal|hack|exploit)\b/i,
  ];
  
  return outOfScopePatterns.some(pattern => pattern.test(userInput));
}

export function getOutOfScopeResponse(): string {
  return "I focus on strategic futures that affect organizations and communities, not individual predictions or specific market forecasts. Could we explore a different angle that looks at broader patterns and possibilities?";
}