/**
 * Database Schema Documentation - PRODUCTION READY
 * 
 * STATUS: Final schema based on expert feedback
 * Last Updated: 2025-08-15
 * 
 * This file documents the PROPOSED data model for Many Futures.
 * It's based on our current mock data structure but includes
 * additional fields we may need as we build out the system.
 * 
 * PURPOSE:
 * 1. Guide database design when we implement Supabase
 * 2. Help AI agents understand what data they'll need to generate
 * 3. Document business logic and constraints
 * 
 * NOTE: This schema is aspirational. Our current implementation
 * uses mock data in /src/lib/mock-data.ts. Fields marked with
 * [FUTURE] are not yet in use but may be needed.
 * 
 * See mock-data.ts for the current working data structure.
 */

// ============================================
// CURRENT IMPLEMENTATION STATUS
// ============================================

/**
 * What's Actually Built:
 * - See /src/lib/mock-data.ts for current data structure
 * - See /src/lib/mock-episodes.ts for episode content
 * 
 * Current Mock Data Includes:
 * - Users (basic)
 * - Organizations (PERSONAL type only)
 * - Projects (with onboardingBrief)
 * - Episodes (with markdown content and sources)
 * - TokenUsage (for cost tracking)
 * - UpcomingEpisodes (preview questions)
 * 
 * Not Yet Implemented:
 * - Billing/subscription fields
 * - Team organizations
 * - Episode feedback
 * - User engagement metrics
 * - Actual database (using mock JSON)
 */

// ============================================
// CORE ENTITIES
// ============================================

/**
 * Organization
 * Every user belongs to at least one organization (personal workspace).
 * All data is scoped to organizations for future team features.
 * 
 * CURRENT: Using simplified version in mock-data.ts
 */
export interface Organization {
  id: string;                    // org_[nanoid] ✅ IN USE
  name: string;                   // "Jane's Workspace" or "Acme Corp" ✅ IN USE
  type: 'PERSONAL' | 'TEAM';     // ✅ IN USE (as OrganizationType)
  ownerId: string;                // ✅ IN USE
  clerkOrgId: string | null;      // ✅ IN USE (null for personal)
  
  // [FUTURE] Billing & Limits - Not yet implemented
  slug?: string;                   // URL-friendly: "janes-workspace"
  subscriptionStatus?: 'TRIAL' | 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
  subscriptionTier?: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  dailyCostLimit?: number;         // In USD, default: 50
  episodeCostLimit?: number;       // In USD, default: 2
  
  // Metadata
  createdAt: Date;                // ✅ IN USE
  updatedAt: Date;                // ✅ IN USE
}

/**
 * User
 * Authenticated via Clerk, minimal data stored locally.
 * CURRENT: Basic version in mock-data.ts
 */
export interface User {
  id: string;                     // user_[nanoid] ✅ IN USE
  clerkId: string;                // Clerk's user ID ✅ IN USE
  email: string;                  // ✅ IN USE
  name: string;                   // ✅ IN USE
  timezone: string;               // IANA timezone e.g., "Europe/London" ✅ IN USE
  
  // [FUTURE] Additional fields
  imageUrl?: string | null;
  defaultOrganizationId?: string;  // Which org to show by default
  lastSeenAt?: Date | null;
  
  // Metadata
  createdAt: Date;                // ✅ IN USE
  updatedAt: Date;                // ✅ IN USE
}

/**
 * OrganizationMember
 * Junction table for users <-> organizations
 * CRITICAL: Required for multi-tenancy and auth
 * ✅ MUST BE IMPLEMENTED before production
 */
export interface OrganizationMember {
  id: string;                     // mem_[cuid]
  organizationId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  
  // Metadata
  joinedAt: Date;
  invitedBy: string | null;       // userId of inviter
  
  // Audit trail
  deletedAt: Date | null;         // Soft delete
  deletedBy: string | null;       // userId who deleted
  
  // Constraints
  // @@unique([userId, organizationId]) - One membership per user per org
}

/**
 * Subscription
 * Handles billing and payment via Stripe
 * CRITICAL: Required for payments
 * [FUTURE] Not yet implemented
 */
export interface Subscription {
  id: string;                      // sub_[cuid]
  organizationId: string;          // Which org this subscription is for
  
  // Stripe Integration
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  
  // Subscription Status
  status: 'TRIAL' | 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'INCOMPLETE';
  tier: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  
  // MVP: Project limits control pricing (not frequency)
  // STARTER: 1 project, GROWTH: 3 projects, ENTERPRISE: unlimited
  maxProjects?: number;
  
  // Billing Period
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAt: Date | null;          // Scheduled cancellation
  canceledAt: Date | null;        // When it was canceled
  
  // Cost Controls (moved from Organization)
  dailyCostLimitGBP: number;      // £50 default
  episodeCostLimitGBP: number;    // £2 default
  
  // Usage This Period
  episodesGenerated: number;       // Count for current period
  totalCostGBP: number;           // Total cost for current period
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;         // Soft delete
}

/**
 * Project
 * A research project that generates weekly episodes.
 * This is the core entity users interact with.
 */
export interface Project {
  id: string;                      // proj_[nanoid]
  organizationId: string;          // REQUIRED: All projects belong to an org
  
  // Core Information
  title: string;                   // "AI Impact on UK Design Consultancy"
  description: string;             // One-line summary for list views
  
  /**
   * onboardingBrief: The full conversation from project creation.
   * AI agents use this to understand context and generate relevant episodes.
   * Structure: Array of {role: 'user'|'assistant', content: string}
   */
  onboardingBrief: Record<string, any> | null;
  
  /**
   * researchContext: Extracted key information for AI agents
   * Generated from onboardingBrief, includes:
   * - industry: "Design consultancy"
   * - geography: "UK, focus on Edinburgh"
   * - userRole: "Partner at boutique consultancy"
   * - interests: ["AI adoption", "regulatory compliance", "talent"]
   * - businessContext: "50-person firm, financial services clients"
   */
  researchContext: {
    industry?: string;
    geography?: string;
    userRole?: string;
    interests?: string[];
    businessContext?: string;
    researchFocus?: string[];      // Specific areas to track
  } | null;
  
  // Schedule & Status
  cadenceType: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'; // Legacy field, kept for migration
  
  /**
   * cadenceConfig: Flexible scheduling configuration
   * ✅ IN USE - Replaces cadenceType for future flexibility
   */
  cadenceConfig: {
    mode: 'weekly' | 'daily' | 'weekdays' | 'custom';
    days: number[];  // [0-6] where 0=Sunday, 1=Monday, etc.
    // Time is managed server-side (default 9am in user's timezone)
  };
  
  /**
   * memories: What the system has learned about user preferences
   * [FUTURE] Backend structure ready, but no UI in MVP
   * Will be used for AI context, not shown to users initially
   */
  memories?: {
    id: string;
    content: string;
    source: 'onboarding' | 'feedback' | 'interaction' | 'inferred';
    createdAt: Date;
  }[];
  
  /**
   * nextScheduledAt: When the next episode will be generated.
   * CRITICAL: Must be null if isPaused is true
   * CRITICAL: Must have value if isPaused is false
   */
  nextScheduledAt: Date | null;
  
  lastPublishedAt: Date | null;    // When was the last episode published?
  isPaused: boolean;                // User can pause/resume anytime
  
  // Episode Control
  maxEpisodes: number | null;       // Limit total episodes (null = unlimited)
  episodeCount: number;             // How many published so far
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Audit trail
  deletedAt: Date | null;          // Soft delete (renamed from archivedAt)
  deletedBy: string | null;        // userId who deleted
}

/**
 * Episode
 * A single piece of strategic intelligence delivered to the user.
 * Generated weekly by AI agents based on project context.
 */
export interface Episode {
  id: string;                       // ep_[nanoid]
  projectId: string;                // Which project this belongs to
  organizationId: string;           // Denormalized for performance
  
  /**
   * sequence: Episode number (1, 2, 3...)
   * NOTE: This is display only - episodes are always sorted by publishedAt
   * The sequence helps users understand progression but isn't used for ordering
   */
  sequence: number;
  
  // Content - What the user reads
  title: string;                    // "The Regulatory Compliance Advantage"
  summary: string;                  // 1-2 sentence description
  
  /**
   * highlightQuote: Pull quote for visual interest
   * Shows in large italic text on project page
   * Should be provocative/insightful, 10-20 words
   */
  highlightQuote: string | null;
  
  /**
   * content: Full episode in Markdown format
   * Includes inline links to sources: [McKinsey Report](url)
   * AI agents should structure with clear sections and insights
   */
  content: string;
  
  // Research & Sources
  /**
   * sources: Array of citations used in the episode
   * AI agents MUST provide real, verifiable sources
   * Each source should be cited in the content via [text](url)
   */
  sources: {
    index: number;                  // Citation order [1], [2], [3]
    source_title: string;           // "McKinsey Global Institute Report 2025"
    url: string;                    // Full URL
    publication_date?: string;      // When source was published (ISO format)
    excerpt?: string;               // Key quote or finding used
    credibility: 'high' | 'medium' | 'low'; // More explicit than score
  }[];
  
  /**
   * researchPrompt: Question that guided this episode's research
   * Used by AI to maintain narrative continuity
   * Example: "How are boutique consultancies positioning regulatory expertise?"
   */
  researchPrompt: string | null;
  
  /**
   * researchQuestions: What we're exploring in the NEXT episode
   * Shown as preview to users, helps AI maintain thread
   */
  researchQuestions: string[] | null;
  
  // Generation & Status
  status: 'DRAFT' | 'GENERATING' | 'PUBLISHED' | 'FAILED';
  
  /**
   * generationMethod: How was this created?
   * - 'automated': Cron job triggered generation
   * - 'manual': User clicked regenerate
   * - 'onboarding': First episode after project creation
   */
  generationMethod: 'automated' | 'manual' | 'onboarding' | null;
  
  /**
   * generationMetadata: Details about the generation process
   * Includes model versions, prompts used, token counts, errors
   */
  generationMetadata: {
    workflowId?: string;            // n8n workflow execution ID
    models?: string[];              // ["gpt-4", "claude-3"]
    totalTokens?: number;
    totalCost?: number;             // In USD
    duration?: number;              // Generation time in ms
    error?: string;                 // If status is FAILED
  } | null;
  
  // Publishing & Scheduling
  publishedAt: Date | null;         // When users can read it
  scheduledFor: Date | null;        // When it should be generated
  
  /**
   * readingMinutes: Estimated read time
   * Calculate: word count / 200 words per minute
   */
  readingMinutes: number;
  
  // Generation tracking (added based on expert feedback)
  generationAttempts?: number;      // Track retry count
  generationErrors?: string[];      // History of generation failures
  
  // User Engagement
  viewCount: number;                // How many times opened
  firstViewedAt: Date | null;       // When first read
  lastViewedAt: Date | null;        // Most recent view
  readCompletionRate: number | null; // 0-1, how much was read
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: number;                  // For tracking edits/regenerations
}

/**
 * EpisodeFeedback
 * User feedback on individual episodes or blocks within episodes.
 * This data trains the AI to improve future episodes.
 */
export interface EpisodeFeedback {
  id: string;                       // fb_[nanoid]
  episodeId: string;
  userId: string;
  organizationId: string;
  
  /**
   * blockId: Which part of the episode (null = overall)
   * Blocks could be sections like "signals", "implications", "scenarios"
   */
  blockId: string | null;
  
  /**
   * rating: 1-5 stars (overall) or thumbs up/down (per block)
   * AI agents should weight recent feedback more heavily
   */
  rating: number;                   // 1-5 for overall, 1 or 0 for blocks
  
  /**
   * feedbackText: Optional written feedback
   * AI should parse for specific requests or complaints
   */
  feedbackText: string | null;
  
  /**
   * feedbackType: Categorize for analysis
   * AI can use this to understand what to improve
   */
  feedbackType: 'relevance' | 'depth' | 'clarity' | 'sources' | 'other' | null;
  
  // Metadata
  createdAt: Date;
  sessionId: string | null;         // Group feedback from same session
}

/**
 * TokenUsage
 * Track every AI API call for cost control and billing.
 * CRITICAL: Every call to OpenAI/Anthropic MUST create a record here.
 * ✅ IN USE in mock data
 */
export interface TokenUsage {
  id: string;                       // usage_[cuid] 
  organizationId: string;           // Who gets billed ✅ IN USE
  
  // Context
  projectId: string | null;         // If related to a project ✅ IN USE
  episodeId: string | null;         // If generating an episode ✅ IN USE
  userId: string | null;            // Who triggered it
  
  // Provider & Model
  provider: 'OPENAI' | 'ANTHROPIC' | 'GOOGLE'; // CRITICAL: Track provider
  model: string;                    // "gpt-4", "claude-3-opus", etc. ✅ IN USE
  
  /**
   * operation: What were we doing?
   * AI agents should use consistent operation names
   */
  operation: 'episode_generation' | 'project_onboarding' | 'feedback_analysis' | 'research' | 'other';
  
  promptTokens: number;             // ✅ IN USE
  completionTokens: number;         // ✅ IN USE
  totalTokens: number;
  
  /**
   * totalCost: In GBP, calculated from model pricing
   * MUST be accurate for billing
   */
  totalCostGBP: number;             // Changed to GBP for UK market ✅ IN USE as totalCost
  
  // ❌ REMOVED dailyTotal - Calculate dynamically to prevent drift
  // Use aggregation query instead:
  // const dailyTotal = await db.tokenUsage.aggregate({
  //   where: { organizationId, createdAt: { gte: startOfDay } },
  //   _sum: { totalCostGBP: true }
  // });
  
  // Metadata
  createdAt: Date;                 // ✅ IN USE
  metadata: Record<string, any> | null; // Additional context
}

/**
 * UpcomingEpisode
 * Preview of episodes being researched/generated.
 * Shown to users so they know what's coming.
 */
export interface UpcomingEpisode {
  id: string;
  projectId: string;
  organizationId: string;
  
  sequence: number;                 // Episode number
  
  /**
   * status: Where we are in the process
   * - 'scheduled': Will be generated on scheduledAt
   * - 'researching': AI is gathering sources (show progress?)
   * - 'writing': AI is composing the episode
   * - 'reviewing': Final checks before publishing
   */
  status: 'scheduled' | 'researching' | 'writing' | 'reviewing';
  
  scheduledAt: Date;                // When it will be ready
  
  /**
   * previewTitle: Working title (may change)
   * If null, show "Episode X: Forming"
   */
  previewTitle: string | null;
  
  /**
   * previewQuestions: What we're investigating
   * Shows users the research direction
   * AI agents use this to maintain narrative thread
   */
  previewQuestions: string[];
  
  /**
   * researchProgress: For status='researching'
   * Could show "Found 12 sources, analyzing trends..."
   */
  researchProgress: string | null;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// CRITICAL PRODUCTION TABLES (Added based on expert feedback)
// ============================================

/**
 * EpisodeScheduleQueue
 * CRITICAL: Queue-based scheduling for production resilience.
 * Without this table, any failure (n8n down, rate limits) causes cascade failures.
 * This is the source of truth for scheduling, not Project.nextScheduledAt.
 */
export interface EpisodeScheduleQueue {
  id: string;                        // queue_[cuid]
  projectId: string;
  organizationId: string;
  
  // Scheduling
  scheduledFor: Date;                // When it should run (UTC)
  pickedUpAt?: Date | null;          // When worker grabbed it
  completedAt?: Date | null;          // When it finished
  
  // Failure handling
  attemptCount: number;              // For retry logic (max 3)
  lastError?: string | null;         // What went wrong
  lastAttemptAt?: Date | null;       // When last tried
  
  // Status tracking
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'blocked';
  
  // Result tracking
  episodeId?: string | null;         // If successful, which episode was created
  
  // Metadata for debugging
  metadata?: {
    userTimezone?: string;           // For debugging scheduling issues
    userLocalTime?: string;          // What time user expected
    generationMethod?: string;       // 'scheduled' | 'manual' | 'retry'
  } | null;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * TokenUsageDaily
 * CRITICAL: Aggregated token usage for performance.
 * Without this, checking daily limits requires scanning all token_usage records.
 * Updated via PostgreSQL trigger on every token_usage insert.
 */
export interface TokenUsageDaily {
  // Composite primary key: (organizationId, date)
  organizationId: string;
  date: Date;                        // Date only, no time
  
  // Aggregated metrics
  totalTokens: number;
  totalCostGBP: number;              // In GBP for UK market
  episodeCount: number;              // How many episodes generated
  
  // Breakdown by operation for cost analysis
  operationBreakdown?: {
    episode_generation: { tokens: number; cost: number; count: number };
    project_onboarding: { tokens: number; cost: number; count: number };
    chat: { tokens: number; cost: number; count: number };
    feedback_analysis: { tokens: number; cost: number; count: number };
  } | null;
  
  // Peak usage tracking (for burst detection)
  hourlyPeak?: number;               // Highest cost in single hour
  peakHour?: number;                 // Which hour (0-23)
  
  lastUpdated: Date;                 // When trigger last ran
}

/**
 * PlanningNote
 * CRITICAL: User feedback loop for Two-Loop Architecture.
 * Captures user intent/requests between episodes.
 * This is Priority 1 - core to our value proposition!
 */
export interface PlanningNote {
  id: string;                        // note_[cuid]
  projectId: string;
  organizationId: string;
  userId: string;
  episodeId?: string | null;         // Which episode triggered this note
  
  // The note itself
  note: string;                      // Max 240 chars (Twitter-length)
  
  // Categorization for AI processing
  scope: 'NEXT_EPISODE' |            // Specific to next episode
         'GENERAL_FEEDBACK' |        // Overall direction
         'TOPIC_REQUEST' |           // Specific topic to explore
         'DEPTH_ADJUSTMENT';         // More/less detail preference
  
  // Processing status
  status: 'pending' |                // Not yet processed
          'acknowledged' |           // AI has seen it
          'incorporated' |           // Used in episode generation
          'deferred' |              // Saved for later
          'archived';               // No longer relevant
  
  // AI processing metadata
  processedAt?: Date | null;         // When AI incorporated this
  processedByEpisodeId?: string | null; // Which episode used this
  aiInterpretation?: string | null;  // How AI understood the note
  
  // Priority for processing
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  userUpvoted?: boolean;             // User emphasized this
  
  // Auto-management
  archiveAfterEpisodes?: number;     // Auto-archive after N episodes
  expiresAt?: Date | null;           // Time-based expiry
  
  // Metadata
  createdAt: Date;
  consumedAt?: Date | null;           // When used by Editorial Loop
}

/**
 * AgentMemory
 * Future-proof memory system. Create now to avoid migration later.
 * Initially empty, will migrate from Project.memories when >50 memories.
 */
export interface AgentMemory {
  id: string;                        // mem_[cuid]
  projectId: string;
  organizationId: string;
  
  // Memory content
  content: string;                   // Natural language memory
  memoryType: 'preference' |        // User preferences
              'feedback' |           // Derived from feedback
              'pattern' |            // Observed patterns
              'context';            // Domain context
  
  // Retrieval and ranking
  importance: number;                // 0-1, for ranking
  confidence?: number;               // 0-1, AI's confidence
  lastAccessed?: Date | null;       // For decay/cleanup
  accessCount?: number;              // Usage tracking
  
  // Source tracking
  source?: 'onboarding' |           // From initial conversation
           'feedback' |             // From episode feedback
           'planning_note' |        // From user planning notes
           'inferred';              // AI inferred
  sourceId?: string | null;         // ID of source entity
  
  // Memory management
  expiresAt?: Date | null;          // Auto-cleanup
  isActive: boolean;                // Can be deactivated
  
  // For future vector search
  embeddingId?: string | null;      // Link to vector embedding
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * UserEvent
 * Flexible event tracking system. Replaces boolean flags.
 * Allows tracking any user behavior without schema changes.
 */
export interface UserEvent {
  id: string;                        // event_[cuid]
  userId: string;
  organizationId: string;
  
  // Flexible event system
  eventType: string;                 // 'onboarding_complete', 'first_episode_opened', etc.
  eventData?: any;                   // JSON context (OK to be flexible here)
  
  // Event metadata
  sessionId?: string | null;         // Group events by session
  deviceType?: string | null;        // 'desktop', 'mobile', 'tablet'
  
  // For funnel analysis
  sequenceNumber?: number;           // Order within session
  timeToNext?: number | null;        // Milliseconds to next event
  
  createdAt: Date;
  
  // Indexes needed: (userId, eventType), (organizationId, createdAt)
}

/**
 * AuditLog
 * Simple audit trail for compliance and debugging.
 * Track important actions and changes.
 */
export interface AuditLog {
  id: string;                        // audit_[cuid]
  userId: string;
  organizationId: string;
  
  // What happened
  action: string;                    // 'episode.generate', 'project.delete', 'settings.update'
  resourceType?: string | null;      // 'episode', 'project', 'user'
  resourceId?: string | null;        // ID of affected resource
  
  // Change tracking (simple strings, not JSON)
  oldValue?: string | null;          // Previous value (stringified)
  newValue?: string | null;          // New value (stringified)
  
  // Additional context
  ipAddress?: string | null;         // For security tracking
  userAgent?: string | null;         // Browser/client info
  
  // Result
  success: boolean;                  // Did action succeed?
  errorMessage?: string | null;      // If failed, why?
  
  createdAt: Date;
  
  // Indexes: (organizationId, action), (userId, createdAt)
}

/**
 * Block
 * Content structure within episodes. Start simple, evolve complex.
 * MVP: One markdown block per episode. Future: Semantic blocks.
 */
export interface Block {
  id: string;                        // blk_[cuid]
  episodeId: string;
  organizationId: string;            // Denormalized for performance
  projectId: string;                 // Denormalized for queries
  
  // Content structure (start simple)
  type: 'MARKDOWN' |                 // MVP: Full episode as one block
        'COLD_OPEN' |                // Future: Intro paragraph
        'SIGNAL' |                   // Future: Market signal
        'PATTERN' |                  // Future: Emerging pattern
        'SCENARIO' |                 // Future: Future scenario
        'QUESTION';                  // Future: Strategic question
  
  content: string;                   // Markdown content (not JSON!)
  position: number;                  // Order within episode (10, 20, 30...)
  
  // Structured metadata (queryable, not JSON blobs)
  reasoning?: string | null;         // AI's reasoning (plain text)
  confidence?: number | null;        // 0-1 confidence score
  
  // Citations (structured, not JSON)
  citations?: Array<{
    url: string;
    title: string;
    relevance: number;               // 0-1 relevance score
    excerpt?: string;
  }> | null;
  
  // Text metrics
  wordCount?: number;                // For reading time
  readingSeconds?: number;           // Estimated read time
  
  // Engagement tracking
  highlightCount?: number;           // How many highlights
  feedbackCount?: number;            // How many feedback items
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: number;                   // For edits/regeneration
  
  // Soft delete
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

/**
 * ChatSession
 * Container for conversations. Required for Phase 2 chat feature.
 * Create now to prevent migration later.
 */
export interface ChatSession {
  id: string;                        // chat_[cuid]
  userId: string;
  organizationId: string;
  projectId: string;
  episodeId?: string | null;         // Optional: might be project-level
  
  // Context tracking
  highlightIds: string[];            // Highlights in this conversation
  blockIds: string[];                // Blocks discussed
  planningNoteIds?: string[];        // Planning notes referenced
  
  // Session metadata
  title?: string | null;             // Auto-generated or user-provided
  summary?: string | null;           // AI-generated summary
  
  // Memory integration (future)
  mem0SessionId?: string | null;     // Mem0 session tracking
  contextTokenBudget?: number;       // Max tokens for context
  
  // Timing
  startedAt: Date;
  endedAt?: Date | null;
  lastMessageAt?: Date | null;
  
  // Counters
  isActive: boolean;
  messageCount: number;              // Counter cache
  totalTokens: number;               // Running total
  totalCostGBP: number;              // Running cost
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ChatMessage
 * Individual messages within a chat session.
 * Tracks costs and extracts insights for memory system.
 */
export interface ChatMessage {
  id: string;                        // msg_[cuid]
  sessionId: string;
  
  // Message content
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  
  // Cost tracking (critical for Phase 2)
  provider?: 'OPENAI' | 'ANTHROPIC' | 'GOOGLE' | null;
  model?: string | null;             // 'gpt-4', 'claude-3-sonnet'
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
  costGBP?: number | null;
  
  // Memory extraction
  extractedInsights?: {
    userPreferences?: string[];      // What user wants
    domainInsights?: string[];       // Domain knowledge
    actionItems?: string[];          // Follow-up tasks
    sentiment?: string;              // User sentiment
    intent?: string;                 // User intent
  } | null;
  
  // Context snapshot
  contextSnapshot?: any;             // What was in context
  
  // Metadata
  createdAt: Date;
  editedAt?: Date | null;           // If user edits
  
  // Streaming support
  isStreaming?: boolean;
  streamCompleted?: boolean;
}

/**
 * Highlight
 * User-selected text that triggers conversations.
 * Core interaction pattern for Phase 2.
 */
export interface Highlight {
  id: string;                        // hl_[cuid]
  userId: string;
  organizationId: string;
  projectId: string;
  episodeId: string;
  
  // Selection details
  blockId: string;                   // Which block contains highlight
  selectedText: string;              // The actual highlighted text
  startOffset: number;               // Character offset in block
  endOffset: number;                 // Character offset in block
  
  // User annotation
  note?: string | null;              // User's comment
  color?: string | null;             // Visual differentiation
  tags?: string[] | null;            // User categories
  
  // Analytics
  addedToChat?: boolean;             // Was discussed in chat?
  chatSessionIds?: string[];         // Which chats referenced
  
  // For future embeddings
  embeddingId?: string | null;       // Link to vector
  similarHighlightIds?: string[] | null; // Related highlights
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Soft delete
  deletedAt?: Date | null;
}

// ============================================
// 🚨 CRITICAL SECURITY: ORGANIZATION SCOPING
// ============================================

/**
 * EVERY database query MUST filter by organizationId!
 * 
 * ❌ NEVER DO THIS:
 * const episodes = await db.episode.findMany({
 *   where: { status: 'PUBLISHED' }
 * }); // Returns ALL organizations' episodes!
 * 
 * ✅ ALWAYS DO THIS:
 * const episodes = await db.episode.findMany({
 *   where: {
 *     organizationId: session.user.organizationId, // REQUIRED
 *     status: 'PUBLISHED'
 *   }
 * });
 * 
 * Consider using Row Level Security (RLS) in Supabase:
 * - Create policy: "Users can only see their org's data"
 * - Enforce at database level, not just application
 * 
 * Helper function pattern:
 * function scopeToOrg<T>(query: T, orgId: string): T {
 *   return { ...query, organizationId: orgId };
 * }
 */

// ============================================
// CONSTRAINTS & BUSINESS RULES
// ============================================

/**
 * Business Rules the AI Agent MUST Follow:
 * 
 * 1. COST CONTROL
 *    - Never exceed episodeCostLimit ($2) per episode
 *    - Never exceed dailyCostLimit ($50) per organization per day
 *    - Track EVERY token in TokenUsage table
 * 
 * 2. SCHEDULING
 *    - Episodes generate on days specified in cadenceConfig.days
 *    - Users can select any combination of days (flexible scheduling)
 *    - After generation, calculate next date based on selected days
 *    - If project isPaused, set nextScheduledAt to null
 *    - No artificial frequency restrictions (MVP uses project limits for pricing)
 * 
 * 3. CONTENT QUALITY
 *    - Episodes MUST have real, verifiable sources
 *    - Content should be 1000-2000 words (5-10 min read)
 *    - Each episode should build on previous ones
 *    - Use researchContext to maintain relevance
 * 
 * 4. STATUS FLOW
 *    Episode: DRAFT -> GENERATING -> PUBLISHED or FAILED
 *    Never skip statuses
 *    Update timestamps at each transition
 * 
 * 5. DATA INTEGRITY
 *    - All entities MUST have organizationId
 *    - Dates should be in UTC
 *    - IDs follow pattern: prefix_[nanoid]
 *    - Soft delete via archivedAt, never hard delete
 */

// ============================================
// SAMPLE DATA FOR AI CONTEXT
// ============================================

/**
 * Example Episode Content Structure:
 * 
 * # The Regulatory Compliance Advantage
 * 
 * Three key discoveries emerged from this week's research...
 * 
 * ## The Compliance Speed Paradox
 * [Content with [inline sources](url)]
 * 
 * ## Signals from the Field
 * **Edinburgh's Hidden Advantage**: [Details]
 * **The Trust Premium**: [Details]
 * 
 * ## Strategic Implications
 * 1. Position regulatory expertise as an AI enabler
 * 2. Develop "compliance-first" frameworks
 * 
 * ## The Scenario Spectrum
 * **Best case (30% probability)**: [Scenario]
 * **Most likely (50% probability)**: [Scenario]
 * **Edge case (20% probability)**: [Scenario]
 */

/**
 * Example Research Context:
 * {
 *   industry: "Design consultancy",
 *   geography: "UK, focus on Edinburgh",
 *   userRole: "Partner at boutique consultancy",
 *   interests: ["AI adoption", "regulatory compliance", "talent retention"],
 *   businessContext: "50-person firm, primarily financial services clients",
 *   researchFocus: [
 *     "How AI is changing design consultancy business models",
 *     "Regulatory advantages for boutique firms",
 *     "Talent strategies in the AI era"
 *   ]
 * }
 */

/**
 * Example Cadence Configuration (Flexible Scheduling):
 * {
 *   mode: 'custom',           // or 'weekly', 'daily', 'weekdays'
 *   days: [1, 3, 5]          // Monday, Wednesday, Friday
 * }
 * 
 * Examples:
 * - Weekly: { mode: 'weekly', days: [2] }         // Every Tuesday
 * - Weekdays: { mode: 'weekdays', days: [1,2,3,4,5] }  // Mon-Fri
 * - Daily: { mode: 'daily', days: [0,1,2,3,4,5,6] }    // Every day
 * - Custom: { mode: 'custom', days: [1,4] }       // Mon & Thu
 */