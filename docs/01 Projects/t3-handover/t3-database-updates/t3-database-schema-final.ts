/**
 * Final Database Schema for Many Futures T3 Implementation
 * 
 * STATUS: Production Ready with Future Expansions
 * Last Updated: 2025-08-14
 * 
 * PHILOSOPHY:
 * - Structure what you'll query (avoid JSON blobs)
 * - Use events for flexible tracking (not boolean flags)
 * - Create tables upfront to prevent migrations
 * - Start minimal, expand without breaking changes
 * 
 * IMPLEMENTATION PHASES:
 * - Phase 1 (MVP/Now): Core tables with minimal fields
 * - Phase 2 (Weeks 3-4): Chat and highlighting
 * - Phase 3 (Weeks 5-6): Memory and intelligence
 * - Phase 4 (Month 2+): Team collaboration
 * 
 * KEY PRINCIPLES:
 * 1. Every table has organizationId for multi-tenancy
 * 2. Use soft deletes (deletedAt) never hard delete
 * 3. Track all AI costs in TokenUsage
 * 4. Event-driven tracking for flexibility
 * 5. Structure metadata for queryability
 */

// ============================================
// PHASE 1: CORE ENTITIES (MVP - Use Immediately)
// ============================================

/**
 * Organization
 * 
 * The foundation of multi-tenancy. Every user gets a personal org
 * automatically, which can later become a team org.
 * 
 * IMPORTANT: All data must be scoped to organizations for security.
 * This enables future team features without migration.
 */
export interface Organization {
  id: string;                    // org_[cuid] - Use CUID for better indexing
  name: string;                   // "Jane's Workspace" or "Acme Corp"
  type: 'PERSONAL' | 'TEAM';     // Start with PERSONAL, upgrade to TEAM later
  ownerId: string;                // User who owns this org
  clerkOrgId: string | null;      // Integration with Clerk auth
  
  /**
   * URL slug for future public/team features
   * e.g., "janes-workspace" for many-futures.com/janes-workspace
   * Can be null initially, add when needed
   */
  slug?: string | null;
  
  /**
   * Future: Integration with external memory system
   * When implementing Mem0 or similar, store the org identifier here
   * This allows org-wide memory and intelligence
   */
  mem0OrgId?: string | null;
  
  /**
   * Future: Organization-level AI preferences
   * Teams might want consistent AI behavior across all projects
   * Start null, populate when teams need configuration
   */
  aiPreferences?: {
    defaultModels?: string[];      // Preferred AI models
    costLimits?: {
      daily: number;              // Override default £50/day
      perEpisode: number;         // Override default £2/episode
    };
    contentGuidelines?: string;   // Org-wide content preferences
  } | null;
  
  // Timestamps for audit trail
  createdAt: Date;
  updatedAt: Date;
  
  /**
   * Soft delete support
   * NEVER hard delete organizations - they contain user data
   * Set deletedAt timestamp and filter in queries
   */
  deletedAt?: Date | null;
  deletedBy?: string | null;       // userId who deleted
}

/**
 * User
 * 
 * Minimal user data - Clerk handles authentication.
 * This table links Clerk users to our application data.
 */
export interface User {
  id: string;                     // user_[cuid]
  clerkId: string;                // REQUIRED: Links to Clerk auth
  email: string;                  // For notifications and display
  name: string;                   // Display name
  
  /**
   * User preferences and settings
   * These enhance UX but aren't required initially
   */
  imageUrl?: string | null;        // Profile photo from OAuth
  defaultOrganizationId?: string;  // Which org to show on login
  defaultProjectId?: string;       // Quick access to main project
  
  /**
   * Future: Personal memory system integration
   * User-specific memories that travel across organizations
   */
  mem0UserId?: string | null;
  
  /**
   * Analytics fields for understanding user behavior
   * Populated by event tracking, not manually maintained
   */
  lastSeenAt?: Date | null;        // Last activity timestamp
  totalSessions?: number;          // Login count
  averageSessionMinutes?: number;  // Engagement depth
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Soft delete (GDPR compliance)
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

/**
 * OrganizationMember
 * 
 * CRITICAL: Junction table for user <-> organization relationships.
 * Required for multi-tenancy and future team features.
 * 
 * Even single-user orgs need this for consistent permission checking.
 */
export interface OrganizationMember {
  id: string;                     // mem_[cuid]
  organizationId: string;
  userId: string;
  
  /**
   * Role-based access control
   * - OWNER: Full control (delete org, manage billing)
   * - ADMIN: Manage projects and team members
   * - MEMBER: Create and edit content
   * - VIEWER: Read-only access
   */
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  
  // Audit trail
  joinedAt: Date;
  invitedBy?: string | null;       // userId of inviter (for teams)
  
  // Soft delete (removing team members)
  deletedAt?: Date | null;
  deletedBy?: string | null;
  
  // Constraint: @@unique([userId, organizationId])
}

/**
 * Subscription
 * 
 * Billing and payment tracking via Stripe.
 * Separate from Organization to support complex billing scenarios.
 */
export interface Subscription {
  id: string;                      // sub_[cuid]
  organizationId: string;          // Which org this bills for
  
  /**
   * Stripe integration fields
   * These are populated by Stripe webhooks
   */
  stripeCustomerId: string;        // cus_xxx from Stripe
  stripeSubscriptionId?: string | null;  // sub_xxx from Stripe
  stripePriceId?: string | null;   // price_xxx from Stripe
  
  /**
   * Subscription status and tier
   * Status changes trigger feature access changes
   */
  status: 'TRIAL' | 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'INCOMPLETE';
  tier: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  
  // Billing period tracking
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAt?: Date | null;          // Scheduled cancellation
  canceledAt?: Date | null;        // When actually canceled
  
  /**
   * Cost control limits
   * These prevent runaway AI costs
   * Check BEFORE generating content, not after
   */
  dailyCostLimitGBP: number;      // Default £50/day
  episodeCostLimitGBP: number;    // Default £2/episode
  
  /**
   * Usage tracking for current period
   * Reset when period rolls over
   */
  episodesGenerated: number;       // Count this period
  totalCostGBP: number;           // Spend this period
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Project
 * 
 * A research context that generates episodes.
 * This is the core entity users interact with.
 */
export interface Project {
  id: string;                      // proj_[cuid]
  organizationId: string;          // REQUIRED: Org scoping
  
  // Basic information
  title: string;                   // "AI Impact on UK Consultancy"
  description: string;             // One-line summary
  
  /**
   * Onboarding conversation history
   * Stores the full dialogue between user and AI during project creation
   * This provides context for all future episode generation
   */
  onboardingBrief: {
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>;
    extractedContext?: any;        // AI's understanding of the brief
    completedAt: Date;
  } | null;
  
  /**
   * User-controlled scheduling
   * Users choose when and how often they receive episodes
   */
  scheduleConfig: {
    frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    
    /**
     * Day of week preference (0=Sunday, 6=Saturday)
     * Only used for WEEKLY and BIWEEKLY frequencies
     */
    dayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | null;
    
    /**
     * Time preference for delivery
     * MVP: Just morning/afternoon/evening
     * Future: Specific time like "09:00"
     */
    timePreference?: 'morning' | 'afternoon' | 'evening' | null;
    specificTime?: string | null;  // Future: "09:00" format
    
    /**
     * User's timezone for scheduling
     * Auto-detected from browser, overridable in settings
     */
    timezone: string;              // "Europe/London", "America/New_York"
  };
  
  /**
   * Natural language content preferences
   * LLMs interpret these flexibly rather than rigid enums
   * These evolve based on user feedback
   */
  contentGuidance?: {
    /**
     * Tone and style preferences
     * e.g., "Professional but approachable, like a trusted advisor"
     */
    toneGuidance?: string | null;
    
    /**
     * Depth and detail preferences
     * e.g., "Deep technical dives, but executive summaries for business topics"
     */
    depthPreference?: string | null;
    
    /**
     * Areas of special interest
     * e.g., "Particularly interested in regulatory changes and talent dynamics"
     */
    focusAreas?: string | null;
    
    /**
     * Topics to avoid or de-emphasize
     * e.g., "Less about marketing, more about operations"
     */
    avoidAreas?: string | null;
    
    /**
     * Additional notes accumulated over time
     * Populated from feedback and planning notes
     */
    additionalNotes?: string | null;
  } | null;
  
  /**
   * AI-learned preferences from user behavior
   * System-maintained, not user-edited
   */
  learnedPreferences?: {
    lastUpdated: Date;
    insights: string;              // LLM summary of patterns
  } | null;
  
  // Scheduling state
  nextScheduledAt?: Date | null;   // When next episode generates
  lastPublishedAt?: Date | null;   // When last episode published
  isPaused: boolean;                // User can pause generation
  
  // Episode limits
  maxEpisodes?: number | null;      // Cap total episodes (null = unlimited)
  episodeCount: number;             // How many published so far
  
  /**
   * Future: Memory system integration
   * Project-specific memory scope and configuration
   */
  mem0ProjectId?: string | null;
  memoryConfig?: {
    scope?: 'EPISODE' | 'PROJECT' | 'ORGANIZATION';
    maxMemories?: number;
    retentionDays?: number;
  } | null;
  
  /**
   * Future: Team collaboration
   * When projects become shared resources
   */
  sharedWith?: string[] | null;     // User IDs with access
  visibility?: 'PRIVATE' | 'TEAM' | 'PUBLIC';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Soft delete
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

/**
 * Episode
 * 
 * A single research episode delivered to users.
 * Generated by AI based on project context and user preferences.
 */
export interface Episode {
  id: string;                       // ep_[cuid]
  projectId: string;
  organizationId: string;           // Denormalized for query performance
  
  /**
   * Episode numbering and identity
   * Sequence is for display (Episode 1, 2, 3...)
   * Episodes are ordered by publishedAt for actual chronology
   */
  sequence: number;                 // Display number
  title: string;                    // "The Compliance Advantage"
  summary: string;                  // 1-2 sentence description
  
  /**
   * Pull quote for visual interest
   * Shows in episode list and social shares
   */
  highlightQuote?: string | null;
  
  /**
   * Episode content
   * MVP: Store as markdown
   * Future: Break into blocks for granular interactions
   */
  content: string;                  // Full markdown content
  
  /**
   * Research sources and citations
   * Structured array for rendering and validation
   * AI must provide real, verifiable sources
   */
  sources: Array<{
    index: number;                  // Order in citations [1], [2]
    source_title: string;           // "McKinsey Report 2025"
    url: string;                    // Full URL
    publication_date?: string;      // ISO date
    excerpt?: string;               // Key quote used
    credibility: 'high' | 'medium' | 'low';
  }>;
  
  /**
   * Episode planning and continuity
   * These maintain narrative thread between episodes
   */
  researchPrompt?: string | null;   // What question guided this episode
  researchQuestions?: string[] | null; // What we'll explore next
  
  // Generation tracking
  status: 'DRAFT' | 'GENERATING' | 'PUBLISHED' | 'FAILED';
  generationMethod?: 'automated' | 'manual' | 'onboarding' | null;
  
  /**
   * Generation metadata for debugging and cost tracking
   * Populated by episode generation system
   */
  generationMetadata?: {
    workflowId?: string;            // External orchestration ID
    models?: string[];              // ["gpt-4", "claude-3"]
    totalTokens?: number;
    totalCostGBP?: number;
    duration?: number;              // Generation time in ms
    error?: string;                 // If status is FAILED
  } | null;
  
  // Publishing timestamps
  publishedAt?: Date | null;        // When available to user
  scheduledFor?: Date | null;       // When supposed to generate
  
  // Reading metrics
  readingMinutes: number;           // Estimated read time
  
  /**
   * User engagement tracking
   * Start simple, expand as needed
   */
  firstViewedAt?: Date | null;      // When first opened
  lastViewedAt?: Date | null;       // Most recent view
  
  /**
   * Future: Block relationship
   * When content is broken into blocks for highlighting/chat
   */
  blockIds?: string[] | null;       // Ordered array of blocks
  
  /**
   * Future: AI memory integration
   * Track what memories and context influenced this episode
   */
  memorySnapshot?: any | null;      // What memories were used
  contextSources?: any | null;      // What influenced generation
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  version: number;                  // Track regenerations
}

/**
 * TokenUsage
 * 
 * CRITICAL: Track every AI API call for cost control.
 * This table prevents bankruptcy from runaway AI costs.
 * 
 * IMPORTANT: Log BEFORE making API calls to track failures too.
 */
export interface TokenUsage {
  id: string;                       // usage_[cuid]
  organizationId: string;           // REQUIRED: Who pays
  
  // Context for the usage
  projectId?: string | null;        // Which project
  episodeId?: string | null;        // Which episode
  userId?: string | null;           // Who triggered
  
  /**
   * Provider and model tracking
   * Different providers have different costs
   * CRITICAL: Must track provider for accurate billing
   */
  provider: 'OPENAI' | 'ANTHROPIC' | 'GOOGLE';
  model: string;                    // "gpt-4", "claude-3-opus"
  
  /**
   * Operation type for cost analysis
   * Helps identify where money is being spent
   */
  operation: 'episode_generation' | 
             'project_onboarding' | 
             'feedback_analysis' | 
             'research' | 
             'chat' |               // Phase 2
             'embedding' |          // Phase 3
             'other';
  
  // Token counts from API response
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  
  /**
   * Cost calculation in GBP
   * MUST be accurate for billing
   * Calculate based on current model pricing
   */
  totalCostGBP: number;
  
  /**
   * DO NOT store dailyTotal here
   * Calculate dynamically to prevent drift:
   * 
   * const dailyTotal = await db.tokenUsage.aggregate({
   *   where: { 
   *     organizationId,
   *     createdAt: { gte: startOfDay }
   *   },
   *   _sum: { totalCostGBP: true }
   * });
   */
  
  // Timestamp for aggregation
  createdAt: Date;
  
  // Flexible metadata for debugging
  metadata?: any | null;
}

// ============================================
// PHASE 1: TRACKING & FEEDBACK
// ============================================

/**
 * UserEvent
 * 
 * Event-driven tracking system for flexible analytics.
 * This replaces rigid boolean flags with queryable events.
 * 
 * KEY INSIGHT: Every new behavior is just a new event type,
 * not a schema migration.
 */
export interface UserEvent {
  id: string;                       // event_[cuid]
  userId: string;
  organizationId: string;
  
  /**
   * Event type describes what happened
   * Examples:
   * - 'onboarding_started'
   * - 'onboarding_completed'
   * - 'project_created'
   * - 'episode_opened'
   * - 'episode_completed' (>80% read)
   * - 'feedback_provided'
   * - 'subscription_started'
   * 
   * Add new types without schema changes
   */
  eventType: string;
  
  /**
   * Flexible context for the event
   * This CAN be JSON because we won't query inside it
   * Just for additional context when reviewing specific events
   */
  eventData?: any | null;
  
  /**
   * Session tracking for funnel analysis
   * Groups events into user sessions
   */
  sessionId?: string | null;
  
  /**
   * Device and browser info for analytics
   * Helps understand usage patterns
   */
  deviceType?: string | null;       // 'desktop', 'mobile', 'tablet'
  browserInfo?: string | null;      // User agent string
  
  // Timestamp for ordering and aggregation
  createdAt: Date;
  
  // Indexes: userId, eventType, createdAt
}

/**
 * AuditLog
 * 
 * Security and compliance tracking.
 * Required for GDPR, debugging, and user trust.
 * 
 * Keep simple - this is write-only for most use cases.
 */
export interface AuditLog {
  id: string;                       // audit_[cuid]
  userId: string;                   // Who did it
  organizationId: string;           // Where it happened
  
  /**
   * Action describes what was done
   * Use dot notation for clarity:
   * - 'project.create'
   * - 'episode.generate'
   * - 'subscription.cancel'
   * - 'user.delete' (GDPR)
   */
  action: string;
  
  /**
   * Resource that was affected
   * The ID of the entity that changed
   */
  resourceType?: string | null;     // 'project', 'episode', etc.
  resourceId?: string | null;       // ID of affected entity
  
  /**
   * Simple before/after values
   * Store as strings for simplicity
   * Only for critical fields (not entire objects)
   */
  oldValue?: string | null;         // Previous value
  newValue?: string | null;         // New value
  
  /**
   * Request context for debugging
   * IP and user agent for security analysis
   */
  ipAddress?: string | null;
  userAgent?: string | null;
  
  // Timestamp for audit trail
  createdAt: Date;
  
  // Indexes: userId, action, createdAt
}

/**
 * EpisodeFeedback
 * 
 * User feedback on episodes.
 * This trains the AI to improve future content.
 */
export interface EpisodeFeedback {
  id: string;                       // fb_[cuid]
  episodeId: string;
  userId: string;
  organizationId: string;
  
  /**
   * Rating system
   * 1-5 stars for overall episode
   */
  rating: number;
  
  /**
   * Written feedback
   * Natural language that AI can learn from
   */
  feedbackText?: string | null;
  
  /**
   * Categorization for analysis
   * Helps AI understand what to improve
   */
  feedbackType?: 'relevance' | 
                 'depth' | 
                 'clarity' | 
                 'sources' | 
                 'timing' |
                 'other' | null;
  
  /**
   * Session tracking
   * Groups feedback from same reading session
   */
  sessionId?: string | null;
  
  // Timestamp
  createdAt: Date;
  
  // Constraint: @@unique([episodeId, userId])
  // One feedback per user per episode
}

// ============================================
// PHASE 2: CONTENT STRUCTURE & INTERACTION
// Create these tables NOW but use later
// ============================================

/**
 * Block
 * 
 * Structured content within episodes.
 * MVP: Single MARKDOWN block per episode.
 * Future: Multiple semantic blocks for granular interaction.
 * 
 * CRITICAL: Don't use JSON blobs for queryable data.
 */
export interface Block {
  id: string;                       // blk_[cuid]
  episodeId: string;
  organizationId: string;           // Denormalized for RLS
  projectId: string;                // Denormalized for queries
  
  /**
   * Block type determines rendering and behavior
   * Start with MARKDOWN for entire episode
   * Expand to semantic types later
   */
  type: 'MARKDOWN' |                // MVP: Full episode
        'COLD_OPEN' |               // Future: Introduction
        'EXECUTIVE_SUMMARY' |       // Future: Key points
        'SIGNAL' |                  // Future: Market signal
        'PATTERN' |                 // Future: Emerging pattern
        'POSSIBILITY' |             // Future: Scenario
        'QUESTION' |                // Future: Strategic question
        'TENSION';                  // Future: Trade-off
  
  /**
   * Block content
   * MVP: Markdown string
   * Future: Structured JSON for rich blocks
   */
  content: string;
  
  /**
   * Position for ordering
   * Use gaps (10, 20, 30) for easy reordering
   */
  position: number;
  
  /**
   * AI reasoning for this block
   * Natural language explanation of why this content matters
   * This is queryable (unlike JSON blob)
   */
  reasoning?: string | null;
  
  /**
   * Confidence score for AI-generated content
   * 0-1 scale, helps identify uncertain areas
   */
  confidence?: number | null;
  
  // Text metrics for reading progress
  wordCount?: number | null;
  readingSeconds?: number | null;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  version: number;
  
  // Soft delete
  deletedAt?: Date | null;
}

/**
 * BlockMetadata
 * 
 * Extensible metadata for blocks.
 * Separate table to avoid bloating Block table.
 * Add new metadata types without migration.
 */
export interface BlockMetadata {
  id: string;                       // meta_[cuid]
  blockId: string;
  
  /**
   * Type of metadata
   * Add new types as needed without schema change
   */
  metaType: 'reasoning' |           // Why this matters
            'source' |              // Supporting evidence
            'pattern' |             // Pattern detected
            'correction' |          // User correction
            'annotation';           // Editorial note
  
  /**
   * Natural language content
   * Queryable for "show all corrections" etc.
   */
  content: string;
  
  /**
   * Confidence or importance score
   * Interpretation depends on metaType
   */
  score?: number | null;
  
  /**
   * Who created this metadata
   * null = system generated
   */
  createdBy?: string | null;        // userId
  
  // Timestamp for versioning
  createdAt: Date;
  
  // Indexes: blockId, metaType, createdAt
}

/**
 * BlockCitation
 * 
 * Structured citations for blocks.
 * Separate table for rich citation data.
 * Enables "show all sources about X" queries.
 */
export interface BlockCitation {
  id: string;                       // cite_[cuid]
  blockId: string;
  
  // Citation details
  url: string;
  title: string;
  publicationDate?: string | null;
  author?: string | null;
  publication?: string | null;
  
  /**
   * How this source was used
   * Natural language explanation
   */
  usage?: string | null;
  
  /**
   * Relevance to the block content
   * 0-1 score for ranking
   */
  relevance: number;
  
  /**
   * Credibility assessment
   * Based on source reputation
   */
  credibility: 'high' | 'medium' | 'low' | 'unknown';
  
  // Display order
  displayIndex: number;
  
  // Timestamp
  createdAt: Date;
  
  // Indexes: blockId, credibility, relevance
}

// ============================================
// PHASE 2: CHAT & CONVERSATION
// Create structure now, implement when adding chat
// ============================================

/**
 * ChatSession
 * 
 * Container for a conversation between user and AI.
 * Tracks context and state across messages.
 */
export interface ChatSession {
  id: string;                       // chat_[cuid]
  userId: string;
  organizationId: string;
  projectId: string;
  
  /**
   * Optional episode context
   * Chat might be about a specific episode or general project
   */
  episodeId?: string | null;
  
  /**
   * Context tracking arrays
   * What's relevant to this conversation
   */
  highlightIds?: string[] | null;   // Text selections discussed
  blockIds?: string[] | null;       // Blocks referenced
  
  /**
   * Session metadata
   * Help organize and find conversations
   */
  title?: string | null;            // Auto-generated or user-set
  summary?: string | null;          // AI summary of discussion
  
  // Timing
  startedAt: Date;
  endedAt?: Date | null;
  lastMessageAt?: Date | null;
  
  // State tracking
  isActive: boolean;
  messageCount: number;             // Counter cache
  
  /**
   * Cost tracking
   * Aggregate from messages for session total
   */
  totalTokens: number;
  totalCostGBP: number;
  
  // Indexes: userId, projectId, createdAt
}

/**
 * ChatMessage
 * 
 * Individual message in a conversation.
 * Track content, cost, and extracted insights.
 */
export interface ChatMessage {
  id: string;                       // msg_[cuid]
  sessionId: string;
  
  // Message basics
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  
  /**
   * Cost tracking per message
   * Essential for understanding chat economics
   */
  provider?: 'OPENAI' | 'ANTHROPIC' | 'GOOGLE' | null;
  model?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
  costGBP?: number | null;
  
  /**
   * Future: Extracted insights for memory system
   * AI identifies key information from conversation
   */
  extractedInsights?: any | null;
  
  // Timestamps
  createdAt: Date;
  editedAt?: Date | null;          // If user edits message
  
  // Indexes: sessionId, createdAt
}

// ============================================
// PHASE 2-3: USER INTERACTION
// ============================================

/**
 * Highlight
 * 
 * User-selected text they find valuable.
 * Foundation for chat context and memory.
 */
export interface Highlight {
  id: string;                       // hl_[cuid]
  userId: string;
  organizationId: string;
  projectId: string;                // Denormalized
  episodeId: string;
  
  /**
   * Selection boundaries
   * Track exactly what was highlighted
   */
  startBlockId: string;             // Where selection starts
  endBlockId: string;               // Where selection ends
  selectedText: string;             // The actual text
  startOffset: number;              // Character position
  endOffset: number;
  
  /**
   * User annotation
   * Optional note about why this matters
   */
  note?: string | null;
  color?: string | null;            // Visual differentiation
  
  /**
   * Usage tracking
   * How has this highlight been used
   */
  addedToChat?: boolean;            // Used in conversation
  chatSessionIds?: string[] | null; // Which conversations
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Soft delete
  deletedAt?: Date | null;
  
  // Indexes: userId, episodeId, createdAt
}

/**
 * PlanningNote
 * 
 * User guidance for future episodes.
 * Bridge between user feedback and AI learning.
 */
export interface PlanningNote {
  id: string;                       // note_[cuid]
  projectId: string;
  organizationId: string;
  userId: string;
  
  /**
   * The guidance itself
   * Limited to 240 chars to keep focused
   */
  note: string;
  
  /**
   * What this note is about
   * Helps AI understand intent
   */
  scope: 'NEXT_EPISODE' |           // Specific to next
         'GENERAL_FEEDBACK' |       // Overall direction
         'TOPIC_REQUEST' |          // Specific topic
         'DEPTH_ADJUSTMENT';        // More/less detail
  
  /**
   * Processing status
   * Track how AI uses this feedback
   */
  status: 'PENDING' |                // Not processed
          'ACKNOWLEDGED' |           // AI has seen
          'INCORPORATED' |           // Used in episode
          'DEFERRED' |              // Saved for later
          'ARCHIVED';               // No longer relevant
  
  /**
   * Which episode triggered this note
   * Helps maintain context
   */
  episodeId?: string | null;
  
  /**
   * AI processing tracking
   * When and how was this used
   */
  processedAt?: Date | null;
  processedByEpisodeId?: string | null;
  
  /**
   * Future: Convert to memory
   * Strong preferences become memories
   */
  convertedToMemory?: boolean;
  memoryId?: string | null;
  
  // Timestamps
  createdAt: Date;
  consumedAt?: Date | null;         // When used by AI
  
  // Indexes: projectId, status, createdAt
}

// ============================================
// PHASE 3: AI MEMORY SYSTEM
// Start minimal, expand as needed
// ============================================

/**
 * AgentMemory
 * 
 * Long-term memory for AI agents.
 * Start simple, expand without migration.
 * 
 * KEY: Natural language storage, not complex JSON.
 */
export interface AgentMemory {
  id: string;                       // mem_[cuid]
  organizationId: string;
  projectId?: string | null;        // Project-specific or org-wide
  
  /**
   * Memory classification
   * Add new types as needed
   */
  memoryType: 'preference' |        // User preferences
              'feedback' |          // Learned from feedback
              'pattern' |           // Detected pattern
              'correction' |        // User correction
              'context';           // Background info
  
  /**
   * Natural language memory
   * AI can understand and query this
   */
  content: string;
  
  /**
   * Memory importance and usage
   * Simple scoring for retrieval
   */
  importance: number;               // 0-1 importance score
  confidence: number;               // 0-1 confidence score
  
  /**
   * Usage tracking
   * Helps with memory decay/reinforcement
   */
  lastAccessed?: Date | null;
  accessCount: number;
  
  /**
   * Memory lifecycle
   * Auto-cleanup for irrelevant memories
   */
  expiresAt?: Date | null;          // Auto-delete after
  
  /**
   * Source tracking
   * Where did this memory come from
   */
  sourceType?: 'user_input' |       // Direct from user
               'inferred' |         // AI inference
               'corrected' |        // User correction
               null;
  sourceId?: string | null;         // ID of source entity
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Indexes: projectId, memoryType, importance, createdAt
}

// ============================================
// PHASE 4: TEAM COLLABORATION
// Future team features, create structure only
// ============================================

/**
 * TeamWorkspace
 * 
 * Shared space for team collaboration.
 * Multiple projects, shared resources.
 */
export interface TeamWorkspace {
  id: string;                       // workspace_[cuid]
  organizationId: string;
  name: string;                     // "Strategic Research"
  description?: string | null;
  
  /**
   * Projects in this workspace
   * Teams can organize projects into workspaces
   */
  projectIds: string[];
  
  /**
   * Workspace-level preferences
   * Override project settings
   */
  preferences?: any | null;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Soft delete
  deletedAt?: Date | null;
}

/**
 * TeamDiscussion
 * 
 * Threaded discussions on episodes.
 * Team knowledge building.
 */
export interface TeamDiscussion {
  id: string;                       // disc_[cuid]
  workspaceId: string;
  episodeId: string;
  blockId?: string | null;          // Specific block discussed
  
  /**
   * Discussion metadata
   * Helps organize and find discussions
   */
  title?: string | null;
  status?: 'open' | 'resolved' | 'archived';
  
  /**
   * Participant tracking
   * Who's involved in this discussion
   */
  participantIds: string[];
  
  /**
   * Key outcomes
   * What the team learned/decided
   */
  keyTakeaways?: string[] | null;
  actionItems?: string[] | null;
  
  // Activity tracking
  messageCount: number;
  lastActivityAt: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// HELPER FUNCTIONS & PATTERNS
// ============================================

/**
 * Organization Scoping Helper
 * CRITICAL: Use this for all queries to ensure multi-tenancy
 */
export const scopeToOrganization = <T extends { organizationId?: string }>(
  query: T,
  orgId: string
): T & { organizationId: string } => {
  return { ...query, organizationId: orgId };
};

/**
 * Cost Control Helper
 * Check limits BEFORE making AI calls
 */
export const checkCostLimit = async (
  db: any,
  orgId: string
): Promise<boolean> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const result = await db.tokenUsage.aggregate({
    where: {
      organizationId: orgId,
      createdAt: { gte: startOfDay }
    },
    _sum: { totalCostGBP: true }
  });
  
  const dailySpend = result._sum.totalCostGBP || 0;
  
  // Get org's limit (default £50)
  const subscription = await db.subscription.findFirst({
    where: { organizationId: orgId }
  });
  
  const limit = subscription?.dailyCostLimitGBP || 50;
  
  return dailySpend < limit;
};

/**
 * Event Tracking Helper
 * Log user events flexibly
 */
export const trackEvent = async (
  db: any,
  userId: string,
  orgId: string,
  eventType: string,
  eventData?: any
): Promise<void> => {
  await db.userEvent.create({
    data: {
      userId,
      organizationId: orgId,
      eventType,
      eventData,
      createdAt: new Date()
    }
  });
};

/**
 * Audit Logging Helper
 * Track important actions for compliance
 */
export const auditLog = async (
  db: any,
  userId: string,
  orgId: string,
  action: string,
  resourceId?: string,
  oldValue?: string,
  newValue?: string
): Promise<void> => {
  await db.auditLog.create({
    data: {
      userId,
      organizationId: orgId,
      action,
      resourceId,
      oldValue,
      newValue,
      createdAt: new Date()
    }
  });
};

// ============================================
// BUSINESS RULES & CONSTRAINTS
// ============================================

/**
 * CRITICAL BUSINESS RULES:
 * 
 * 1. ORGANIZATION SCOPING
 *    - EVERY query must filter by organizationId
 *    - Use scopeToOrganization helper
 *    - Implement RLS in Supabase
 * 
 * 2. COST CONTROL
 *    - Check limits BEFORE AI calls
 *    - Track EVERY token in TokenUsage
 *    - Daily limit: £50 (configurable)
 *    - Episode limit: £2 (configurable)
 * 
 * 3. SOFT DELETES
 *    - NEVER hard delete user data
 *    - Set deletedAt timestamp
 *    - Filter in queries: WHERE deletedAt IS NULL
 * 
 * 4. EVENT TRACKING
 *    - Use events for behavior tracking
 *    - Don't add boolean flags to tables
 *    - New behaviors = new event types
 * 
 * 5. STRUCTURED DATA
 *    - Don't use JSON for queryable data
 *    - Create separate tables for metadata
 *    - Natural language > complex JSON
 * 
 * 6. AUDIT TRAIL
 *    - Log sensitive operations
 *    - Include user, action, timestamp
 *    - Required for GDPR compliance
 */

// ============================================
// MIGRATION STRATEGY
// ============================================

/**
 * IMPLEMENTATION PHASES:
 * 
 * Phase 1 (MVP - Immediate):
 * - All core tables with minimal fields
 * - UserEvent for tracking
 * - AuditLog for compliance
 * - Block with simple structure
 * 
 * Phase 2 (Weeks 3-4):
 * - Activate ChatSession/ChatMessage
 * - Implement Highlight
 * - Use BlockMetadata
 * 
 * Phase 3 (Weeks 5-6):
 * - Activate AgentMemory
 * - Implement PlanningNote processing
 * - Add memory integration
 * 
 * Phase 4 (Month 2+):
 * - TeamWorkspace
 * - TeamDiscussion
 * - Collaboration features
 * 
 * KEY: Create all tables upfront to avoid migrations.
 * Start with minimal fields, add as needed.
 * This approach prevents breaking changes.
 */