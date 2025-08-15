/**
 * Lightweight security utilities for LLM protection
 * Following the 20% solution - minimal but effective
 */

// Common injection patterns that indicate manipulation attempts
const INJECTION_PATTERNS = [
  // Direct instruction manipulation
  /ignore.{0,20}(previous|above|prior|all).{0,20}instructions?/i,
  /disregard.{0,20}(previous|above|all).{0,20}instructions?/i,
  /forget.{0,20}(everything|all|your).{0,20}instructions?/i,
  
  // Prompt extraction attempts
  /repeat.{0,20}(your|the|all).{0,20}(instructions?|prompt|system)/i,
  /what.{0,20}(are|were).{0,20}your.{0,20}(instructions?|rules?|prompts?)/i,
  /show.{0,20}(me|us).{0,20}your.{0,20}(instructions?|prompt|system)/i,
  /output.{0,20}(everything|all|your).{0,20}(above|previous|instructions)/i,
  /reveal.{0,20}(your|the).{0,20}(prompt|instructions?|system)/i,
  /tell.{0,20}me.{0,20}(about|your).{0,20}(instructions?|system|prompt)/i,
  /give.{0,20}me.{0,20}your.{0,20}(system|prompt|instructions)/i,
  /share.{0,20}your.{0,20}(prompt|instructions|configuration)/i,
  
  // Persona/role manipulation
  /you.{0,20}are.{0,20}now.{0,20}(a|an|acting|pretending)/i,
  /act.{0,20}(as|like).{0,20}(a|an)/i,
  /pretend.{0,20}(to|you).{0,20}(be|are)/i,
  /from.{0,20}now.{0,20}on.{0,20}you/i,
  /roleplay.{0,20}as/i,
  /write.{0,20}(like|as).{0,20}(a|an).{0,20}(pirate|robot|child|expert)/i,
  /talk.{0,20}like.{0,20}(a|an).{0,20}(pirate|robot|child)/i,
  /speak.{0,20}(like|as).{0,20}(a|an)/i,
  /respond.{0,20}(as|like|in).{0,20}(pirate|shakespear|yoda|emoji)/i,
  /(pirate|robot|shakespear|yoda).{0,20}(voice|style|language)/i,
  /write.{0,20}as.{0,20}(shakespeare|shakespear).{0,20}would/i,
  
  // System role injection attempts
  /\bsystem\s*:\s*["'`]/i,
  /<\/?system>/i,
  /\[system\]/i,
  /^system:/i,
  
  // Common social engineering
  /my.{0,20}grandm(a|other).{0,20}(used to|would|always)/i,
  /debug.{0,20}mode/i,
  /developer.{0,20}mode/i,
  
  // Additional patterns
  /repeat.{0,20}(the|all).{0,20}(above|previous).{0,20}(text|word)/i,
];

// Phrases that shouldn't appear in output (indicates prompt leakage)
const SYSTEM_PHRASES = [
  'You are Futura',
  'CRITICAL CONTEXT',
  'CRITICAL RULES',
  'SECURITY NOTICE',
  'Your personality:',
  'Your approach:',
  'Key behaviors:',
  'instructions:',
  'never ask what type',
];

// Rate limiting configuration
const LIMITS = {
  MAX_MESSAGES: 20,
  MAX_BRIEF_ATTEMPTS: 3,
  WINDOW_MS: 60 * 60 * 1000, // 1 hour
};

// In-memory rate limiting store
const conversationLimits = new Map<string, {
  messageCount: number;
  briefAttempts: number;
  lastActivity: Date;
  suspiciousCount: number;
}>();

// Security event logging
interface SecurityEvent {
  type: 'injection' | 'rate_limit' | 'leakage' | 'suspicious';
  conversationId: string;
  message?: string;
  timestamp: Date;
}

const securityLog: SecurityEvent[] = [];

/**
 * Detect potential injection attempts in user input
 */
export function detectInjection(input: string): boolean {
  const normalized = input.toLowerCase().trim();
  return INJECTION_PATTERNS.some(pattern => pattern.test(normalized));
}

/**
 * Check if output contains system prompt leakage
 */
export function detectPromptLeakage(output: string): boolean {
  const normalized = output.toLowerCase();
  return SYSTEM_PHRASES.some(phrase => 
    normalized.includes(phrase.toLowerCase())
  );
}

/**
 * Sanitize output to prevent prompt leakage
 */
export function sanitizeOutput(output: string): string {
  if (detectPromptLeakage(output)) {
    console.warn('[SECURITY] Potential prompt leakage detected');
    logSecurityEvent({
      type: 'leakage',
      conversationId: 'unknown',
      message: output.substring(0, 100), // Log first 100 chars only
      timestamp: new Date(),
    });
    
    // Return generic response that maintains conversation flow
    return "Let's focus on creating your project brief. What specific future would you like to explore?";
  }
  return output;
}

/**
 * Escape special characters to prevent template injection
 */
export function escapeForTemplate(text: string): string {
  return text
    .replace(/\\/g, '\\\\')  // Do backslashes first
    .replace(/\$/g, '\\$')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/`/g, '\\`');
}

/**
 * Check rate limits for a conversation
 */
export function checkRateLimit(conversationId: string, action: 'message' | 'brief' = 'message'): {
  allowed: boolean;
  reason?: string;
} {
  const now = new Date();
  let state = conversationLimits.get(conversationId);
  
  // Initialize or reset if window expired
  if (!state || now.getTime() - state.lastActivity.getTime() > LIMITS.WINDOW_MS) {
    state = {
      messageCount: 0,
      briefAttempts: 0,
      lastActivity: now,
      suspiciousCount: 0,
    };
    conversationLimits.set(conversationId, state);
  }
  
  // Check message limit
  if (action === 'message' && state.messageCount >= LIMITS.MAX_MESSAGES) {
    logSecurityEvent({
      type: 'rate_limit',
      conversationId,
      timestamp: now,
    });
    return { 
      allowed: false, 
      reason: 'Conversation limit reached. Please create your project or start a new conversation.' 
    };
  }
  
  // Check brief generation limit
  if (action === 'brief' && state.briefAttempts >= LIMITS.MAX_BRIEF_ATTEMPTS) {
    logSecurityEvent({
      type: 'rate_limit',
      conversationId,
      timestamp: now,
    });
    return { 
      allowed: false, 
      reason: 'Maximum brief generation attempts reached. Please refine your existing brief or start over.' 
    };
  }
  
  // Update counts
  state.lastActivity = now;
  if (action === 'message') {
    state.messageCount++;
  } else if (action === 'brief') {
    state.briefAttempts++;
  }
  
  return { allowed: true };
}

/**
 * Track suspicious activity for a conversation
 */
export function trackSuspiciousActivity(conversationId: string) {
  const state = conversationLimits.get(conversationId);
  if (state) {
    state.suspiciousCount++;
    
    // If too many suspicious attempts, block entirely
    if (state.suspiciousCount >= 5) {
      state.messageCount = LIMITS.MAX_MESSAGES; // Force rate limit
    }
  }
}

/**
 * Log security events for monitoring
 */
export function logSecurityEvent(event: SecurityEvent) {
  securityLog.push(event);
  
  // Console warning for development
  console.warn('[SECURITY]', {
    type: event.type,
    conversationId: event.conversationId,
    timestamp: event.timestamp.toISOString(),
    ...(event.message && { messagePreview: event.message.substring(0, 50) }),
  });
  
  // In production, this would send to monitoring service
  // if (process.env.NODE_ENV === 'production') {
  //   sendToSentry(event);
  // }
}

/**
 * Get generic fallback response for blocked requests
 */
export function getBlockedResponse(): string {
  const responses = [
    "Let's focus on your future research interests. What specific area would you like to explore?",
    "I'm here to help you create a project brief. What future fascinates you?",
    "Tell me about the future you'd like to research - what aspects interest you most?",
  ];
  
  // Return random response to avoid predictability
  return responses[Math.floor(Math.random() * responses.length)] ?? responses[0] ?? "Let's focus on your future research interests.";
}

/**
 * Clean up old rate limit entries (call periodically)
 */
export function cleanupRateLimits() {
  const now = new Date();
  const expired: string[] = [];
  
  conversationLimits.forEach((state, id) => {
    if (now.getTime() - state.lastActivity.getTime() > LIMITS.WINDOW_MS) {
      expired.push(id);
    }
  });
  
  expired.forEach(id => conversationLimits.delete(id));
}

// Clean up every hour if in Node environment
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 60 * 60 * 1000);
}

/**
 * Get security stats for monitoring (dev only)
 */
export function getSecurityStats() {
  return {
    activeConversations: conversationLimits.size,
    securityEvents: securityLog.length,
    recentEvents: securityLog.slice(-10),
  };
}