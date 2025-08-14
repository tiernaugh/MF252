# T3 Database Schema Future-Proofing Guide

## Executive Summary

This document analyzes the T3 database schema against Many Futures' product roadmap and identifies critical tables and fields that must be added NOW to prevent costly migrations when implementing Phase 2 (Chat/Highlighting) and Phase 3 (Memory/Embeddings).

**Key Finding:** The Two-Loop Memory Architecture and progressive user journey require foundational tables to exist from day one, even if initially unused.

---

## 🎯 Many Futures Product Vision & Technical Direction

### The Long-Term Vision
Many Futures is building an AI-powered strategic intelligence platform that evolves from simple weekly episodes into a sophisticated research partner with memory, context awareness, and collaborative features.

### Product Evolution Phases

#### Phase 1: Core Value Loop (Current/MVP)
- Weekly episode generation
- Beautiful reading experience
- Simple feedback collection
- Cost control mechanisms

#### Phase 2: Engagement + Basic Chat (Weeks 3-4)
- **Text highlighting** with selection toolbar
- **Contextual chat** triggered by highlights
- Basic conversation with episode context
- Rate limiting and streaming responses

#### Phase 3: Memory + Advanced Chat (Weeks 5-6)
- **Cross-episode memory** with pgvector
- **Full context packing** (L0-L6 layers)
- **Mem0 integration** for persistent memory
- **Planning notes** influence episodes

#### Phase 4: Monetization + Scale (Week 7+)
- Team collaboration features
- Sharing and annotations
- Advanced analytics
- Enterprise features

### The Two-Loop Memory Architecture

Many Futures operates on two interconnected memory systems:

1. **Editorial Loop (Asynchronous)**
   - Inputs: Project context, user feedback, planning notes
   - Processing: Deep research and analysis
   - Outputs: Episodes with rich metadata (grounded reasoning + citations)

2. **Conversational Loop (Real-time)**
   - Triggered by: User highlights text → opens chat
   - Context: Block metadata + conversation history
   - Memory update: Insights feed back to Editorial Loop

This architecture requires specific database structures to support the information flow between loops.

---

## 🚨 Critical Schema Gaps in Current T3 Implementation

### ✅ What T3 Got Right
- Added OrganizationMember table (critical for auth)
- Added Subscription table (required for payments)
- Added provider field to TokenUsage
- Removed dailyTotal (calculate dynamically)
- Good use of prefixed IDs

### ❌ What's Missing (Will Cause Migration Pain)

#### 1. **No Block Table**
Without blocks, you can't:
- Store grounded reasoning metadata (Two-Loop Architecture)
- Enable highlighting at block level
- Implement vector search efficiently
- Track feedback per content section

#### 2. **No Chat Tables**
Phase 2 requires chat, but without tables you'll need to:
- Migrate all existing users
- Retrofit context tracking
- Add cost tracking after the fact

#### 3. **No Highlight Table**
User journey shows highlighting as key interaction, but without it:
- Can't track what users find valuable
- Can't provide context to chat
- Can't build collaborative features

#### 4. **No PlanningNote Table**
Two-Loop Architecture requires planning notes to bridge loops:
- User feedback gets lost
- Episodes can't improve based on input
- No way to capture "research this next" requests

#### 5. **No UserJourney Table**
Progressive disclosure requires tracking milestones:
- Can't unlock features progressively
- No way to guide new users
- Missing analytics on user progression

---

## 📊 Complete Future-Proof Schema Additions

### 1. Block Table (Foundation for Everything)

```typescript
/**
 * Block
 * Represents a content section within an episode.
 * CRITICAL: Required for Two-Loop Architecture, highlighting, and chat context.
 * 
 * Even if starting with markdown-only episodes, create this table NOW.
 * Initial implementation can have type='MARKDOWN' with full episode content.
 * Later, break into semantic blocks without migration.
 */
export interface Block {
  id: string;                        // blk_[cuid]
  episodeId: string;
  organizationId: string;            // Denormalized for RLS performance
  projectId: string;                 // Denormalized for queries
  
  // Content structure (start simple, evolve complex)
  type: 'MARKDOWN' |                 // MVP: Full episode as one block
        'COLD_OPEN' |                // Future: Intro paragraph
        'EXECUTIVE_SUMMARY' |        // Future: Key points
        'SIGNAL' |                   // Future: Market signal
        'PATTERN' |                  // Future: Emerging pattern
        'POSSIBILITY' |              // Future: Future scenario
        'QUESTION' |                 // Future: Strategic question
        'TENSION';                   // Future: Trade-off or dilemma
  
  content: string | Json;            // Flexible: markdown string or structured JSON
  position: number;                  // Order within episode (10, 20, 30...)
  
  /**
   * Two-Loop Architecture Metadata
   * These fields are CRITICAL for the memory system to work
   */
  groundedReasoningMetadata?: Json;  // Editorial Loop: AI's reasoning process
  /* Example structure:
   {
     "assumptions": ["Market will continue growing", "Regulation will tighten"],
     "connections": ["Links to Episode 2 discussion on compliance"],
     "confidence": 0.7,
     "reasoning_chain": "Based on 3 signals...",
     "alternative_interpretations": ["Could also mean..."]
   }
   */
  
  researchCitations?: Json;          // Editorial Loop: Verifiable sources
  /* Example structure:
   [{
     "index": 1,
     "source_title": "McKinsey Report 2025",
     "url": "https://...",
     "excerpt": "Key finding...",
     "publication_date": "2025-01-15",
     "credibility": "high",
     "relevance_score": 0.9
   }]
   */
  
  // Text metrics for future features
  paragraphCount?: number;           // For reading progress
  wordCount?: number;               // For time estimates
  readingSeconds?: number;          // Estimated read time
  
  // Engagement metrics
  highlightCount?: number;          // Counter cache
  feedbackCount?: number;           // Counter cache
  avgRating?: number;               // Aggregated rating
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: number;                  // For edits/regeneration
  
  // Soft delete
  deletedAt?: Date | null;
  deletedBy?: string | null;
}
```

### 2. ChatSession & ChatMessage Tables

```typescript
/**
 * ChatSession
 * Represents a conversation between user and Futura.
 * Required for Phase 2 chat feature.
 */
export interface ChatSession {
  id: string;                        // chat_[cuid]
  userId: string;
  organizationId: string;
  projectId: string;
  episodeId?: string;                // Optional: Chat might be project-level
  
  // Context tracking (what's in this conversation's scope)
  highlightIds: string[];            // Array of highlight IDs in context
  blockIds: string[];               // Array of block IDs discussed
  planningNoteIds?: string[];       // Planning notes referenced
  
  // Session metadata
  title?: string;                   // Auto-generated or user-provided
  summary?: string;                 // AI-generated summary
  
  // Memory integration
  mem0SessionId?: string;           // Future: Mem0 session tracking
  contextTokenBudget?: number;      // Max tokens for context
  
  // Timing
  startedAt: Date;
  endedAt?: Date | null;
  lastMessageAt?: Date;
  
  // Metadata
  isActive: boolean;
  messageCount: number;             // Counter cache
  totalTokens: number;             // Running total
  totalCostGBP: number;            // Running cost
}

/**
 * ChatMessage
 * Individual message in a chat session.
 */
export interface ChatMessage {
  id: string;                        // msg_[cuid]
  sessionId: string;
  
  // Message content
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  
  // Cost tracking (CRITICAL for Phase 2)
  provider?: 'OPENAI' | 'ANTHROPIC' | 'GOOGLE';
  model?: string;                   // 'gpt-4', 'claude-3-sonnet'
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  costGBP?: number;
  
  // Memory extraction (for Two-Loop feedback)
  extractedInsights?: Json;         // Key points for memory system
  /* Example:
   {
     "user_preferences": ["Wants more regulatory focus"],
     "domain_insights": ["Compliance becoming competitive advantage"],
     "action_items": ["Research EU AI Act implications"],
     "sentiment": "positive",
     "intent": "clarification"
   }
   */
  
  // Context at time of message
  contextSnapshot?: Json;           // What was in context when sent
  
  // Metadata
  createdAt: Date;
  editedAt?: Date;                 // If user edits message
  
  // Streaming support
  isStreaming?: boolean;
  streamCompleted?: boolean;
}
```

### 3. Highlight Table

```typescript
/**
 * Highlight
 * User-selected text that they find valuable.
 * Core interaction pattern in the user journey.
 */
export interface Highlight {
  id: string;                        // hl_[cuid]
  userId: string;
  organizationId: string;
  projectId: string;                // Denormalized
  episodeId: string;
  
  // Selection details (block-level granularity)
  startBlockId: string;             // Which block selection starts in
  endBlockId: string;               // Which block selection ends in
  selectedText: string;             // The actual highlighted text
  startOffset: number;              // Character offset in start block
  endOffset: number;                // Character offset in end block
  
  // User annotation
  note?: string;                    // User's comment on highlight
  color?: string;                   // Visual differentiation
  tags?: string[];                  // User-defined categories
  
  // Sharing (Phase 4+)
  isPublic?: boolean;               // Can others see this?
  sharedWith?: string[];           // User IDs with access
  
  // Analytics
  addedToChat?: boolean;           // Was this discussed?
  chatSessionIds?: string[];       // Which chats referenced this
  
  // For future embeddings
  embeddingId?: string;            // Link to vector embedding
  similarHighlightIds?: string[];  // AI-found related highlights
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Soft delete
  deletedAt?: Date | null;
}
```

### 4. PlanningNote Table

```typescript
/**
 * PlanningNote
 * User guidance for future episodes.
 * Critical bridge between Conversational and Editorial loops.
 */
export interface PlanningNote {
  id: string;                        // note_[cuid]
  projectId: string;
  organizationId: string;
  userId: string;
  episodeId?: string;                // Which episode triggered this note
  
  // The note itself
  note: string;                     // Max 240 characters (Twitter-length)
  
  // Categorization
  scope: 'NEXT_EPISODE' |           // Specific to next episode
         'GENERAL_FEEDBACK' |       // Overall direction
         'TOPIC_REQUEST' |          // Specific topic to explore
         'DEPTH_ADJUSTMENT';        // More/less detail preference
  
  // Processing status
  status: 'PENDING' |               // Not yet processed
          'ACKNOWLEDGED' |          // AI has seen it
          'INCORPORATED' |          // Used in episode generation
          'DEFERRED' |             // Saved for later
          'ARCHIVED';              // No longer relevant
  
  // AI processing
  processedAt?: Date;               // When AI incorporated this
  processedByEpisodeId?: string;    // Which episode used this
  aiInterpretation?: string;        // How AI understood the note
  
  // Priority
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  userUpvoted?: boolean;            // User emphasized this
  
  // Auto-archive
  archiveAfterEpisodes?: number;    // Auto-archive after N episodes
  expiresAt?: Date;                 // Time-based expiry
  
  // Metadata
  createdAt: Date;
  consumedAt?: Date;                // When used by Editorial Loop
}
```

### 5. UserJourney Table

```typescript
/**
 * UserJourney
 * Tracks user progression and unlocks features.
 * Required for progressive disclosure UX.
 */
export interface UserJourney {
  id: string;                        // journey_[cuid]
  userId: string;                   // One journey per user
  
  // Onboarding milestones
  hasCompletedOnboarding: boolean;
  hasCreatedFirstProject: boolean;
  hasReceivedFirstEpisode: boolean;
  hasReadFirstEpisode: boolean;     // Opened and scrolled
  hasCompletedFirstEpisode: boolean; // Read >80%
  
  // Feature discovery milestones
  hasHighlightedText: boolean;
  hasAddedHighlightNote: boolean;
  hasUsedChat: boolean;
  hasHadMeaningfulChat: boolean;    // >3 messages
  hasAddedPlanningNote: boolean;
  hasSeenPlanningNoteImpact: boolean; // Note influenced episode
  
  // Advanced milestones
  hasSharedEpisode: boolean;
  hasInvitedTeammate: boolean;
  hasCustomizedPreferences: boolean;
  hasUsedSearch: boolean;
  hasExportedContent: boolean;
  
  // Timestamps for analytics
  onboardingStartedAt?: Date;
  onboardingCompletedAt?: Date;
  firstProjectCreatedAt?: Date;
  firstEpisodeReceivedAt?: Date;
  firstEpisodeReadAt?: Date;
  firstHighlightAt?: Date;
  firstChatAt?: Date;
  firstPlanningNoteAt?: Date;
  
  // Feature unlocking
  unlockedFeatures: string[];       // ['highlighting', 'chat', 'planning_notes']
  featureUnlockDates: Json;         // { "chat": "2025-01-15T10:00:00Z" }
  
  // Tutorial/spotlight tracking
  spotlightsSeen: Json;             // { "highlight_tutorial": true }
  tutorialsCompleted: string[];     // ['onboarding', 'first_highlight']
  hintsDisabled: string[];          // User disabled these hints
  
  // Engagement scoring
  engagementScore?: number;         // 0-100 calculated score
  activityStreak?: number;          // Days of consecutive activity
  totalActiveDays: number;
  lastActiveAt: Date;
  
  // Preferences learned
  preferredReadingTime?: string;    // "morning", "evening"
  averageReadingSpeed?: number;     // words per minute
  preferredContentDepth?: string;   // "summary", "detailed"
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### 6. Field Additions to Existing Tables

```typescript
// Add to User table:
export interface UserEnhancements {
  // Memory system integration
  mem0UserId?: string;              // Mem0 user identifier
  
  // Preferences
  defaultOrganizationId?: string;    // Which org to show by default
  defaultProjectId?: string;        // Quick access to main project
  
  // Analytics
  lastSeenAt?: Date;
  totalSessions?: number;
  averageSessionMinutes?: number;
}

// Add to Organization table:
export interface OrganizationEnhancements {
  // Memory system integration
  mem0OrgId?: string;               // Mem0 organization identifier
  
  // Advanced configuration
  aiModelPreferences?: {
    episodeGeneration?: string[];   // Preferred models in order
    chatModel?: string;             // Preferred chat model
    embeddingModel?: string;        // Preferred embedding model
  };
  
  // Feature flags (org-level)
  enabledFeatures?: string[];       // ['advanced_chat', 'sharing']
  experimentalFeatures?: string[];  // Beta features opted into
}

// Add to Project table:
export interface ProjectEnhancements {
  // Memory system integration
  mem0ProjectId?: string;           // Mem0 project identifier
  memoryScope?: 'EPISODE' | 'PROJECT' | 'ORGANIZATION';
  
  // Episode generation configuration
  episodeGenerationConfig?: {
    maxTokensPerEpisode?: number;   // Default 10000
    maxEmbeddingsPerEpisode?: number; // Default 50
    preferredModels?: string[];     // Override org defaults
    researchDepth?: 'SHALLOW' | 'STANDARD' | 'DEEP';
    
    // Two-Loop configuration
    memoryIntegration?: boolean;    // Use Mem0 in generation
    contextPackingStrategy?: string; // 'aggressive' | 'balanced' | 'conservative'
    includeHistoricalContext?: boolean;
    maxHistoricalEpisodes?: number; // How far back to look
  };
  
  // Content preferences
  contentPreferences?: {
    tone?: 'professional' | 'conversational' | 'academic';
    speculationLevel?: 'conservative' | 'balanced' | 'provocative';
    exampleTypes?: string[];        // ['case_studies', 'data', 'trends']
    avoidTopics?: string[];         // Topics to skip
  };
  
  // Collaboration (Phase 4+)
  sharedWith?: string[];            // User IDs with access
  publiclyVisible?: boolean;        // Can anyone see this project?
  allowComments?: boolean;          // Can others comment?
}

// Add to Episode table:
export interface EpisodeEnhancements {
  // Block relationship
  blockIds?: string[];              // Ordered array of block IDs
  primaryBlockId?: string;         // Main insight block
  
  // Memory integration
  memorySnapshot?: Json;           // What memories were used
  contextSources?: Json;           // What influenced this episode
  
  // Advanced metadata
  themes?: string[];                // AI-extracted themes
  entities?: Json;                 // Named entities mentioned
  sentiment?: number;              // Overall sentiment score
  
  // Collaboration
  sharedCount?: number;            // How many times shared
  commentCount?: number;           // Public comments
  citedByEpisodeIds?: string[];   // Other episodes referencing this
}
```

---

## 🚀 Implementation Strategy

### Phase 1: Create All Tables (Even If Empty)
1. Create all tables in initial migration
2. Mark unused fields as nullable
3. Add comments indicating which phase uses each table
4. This prevents ANY schema migrations later

### Phase 2: Implement Progressive Features
1. Start using Block table even with just markdown
2. Enable ChatSession when implementing chat
3. Activate Highlight when adding selection
4. Use PlanningNote for feedback collection

### Phase 3: Advanced Features
1. Add embedding fields when implementing vector search
2. Enable Mem0 fields when integrating memory
3. Activate sharing fields when adding collaboration

---

## 💡 Key Technical Insights

### Why Create Empty Tables?
1. **Migration Cost**: Adding tables with data is exponentially harder than creating empty tables
2. **Foreign Keys**: Relationships are easier to establish before data exists
3. **RLS Policies**: Security rules are simpler to test on empty tables
4. **Type Safety**: TypeScript types can reference all tables from day one

### The Two-Loop Architecture Requirement
The Two-Loop memory system REQUIRES these structures:
- **Blocks** with metadata (grounded reasoning + citations)
- **PlanningNotes** to bridge loops
- **ChatMessages** with extracted insights
- **Highlights** as context anchors

Without these tables, the memory system cannot function as designed.

### Progressive Disclosure Pattern
UserJourney table enables:
- Gradual feature introduction
- Personalized onboarding
- Analytics on feature adoption
- A/B testing of feature rollouts

---

## ✅ Migration Prevention Checklist

### Must Have Before Launch
- [ ] Block table with metadata fields
- [ ] ChatSession and ChatMessage tables
- [ ] Highlight table
- [ ] PlanningNote table
- [ ] UserJourney table
- [ ] OrganizationMember table (already identified)
- [ ] Subscription table (already added)

### Must Have Fields
- [ ] `groundedReasoningMetadata` on Block
- [ ] `researchCitations` on Block
- [ ] `extractedInsights` on ChatMessage
- [ ] `mem0UserId`, `mem0OrgId`, `mem0ProjectId` fields
- [ ] Soft delete fields (`deletedAt`, `deletedBy`)
- [ ] Version fields for optimistic locking

### Security Patterns
- [ ] `organizationId` on every table
- [ ] RLS policies reference organizationId
- [ ] Audit fields on sensitive tables
- [ ] Token/cost tracking on all AI operations

---

## 📈 Business Impact

### Without These Changes
- **Migration downtime** when adding chat (Phase 2)
- **Data loss** when adding highlights without table
- **Performance issues** retrofitting organizationId
- **Security vulnerabilities** adding RLS after data exists
- **User frustration** with breaking changes

### With These Changes
- **Zero migrations** through Phase 3
- **Progressive rollout** of features
- **Type safety** from day one
- **Performance optimization** built in
- **Security by design** not afterthought

---

## Conclusion

The T3 implementation has made good progress on critical issues like OrganizationMember and Subscription tables. However, the Two-Loop Memory Architecture and progressive user journey require additional tables that MUST be created now, even if initially unused.

Creating these tables empty is a one-time cost that prevents expensive migrations when implementing Phase 2 (Chat/Highlighting) and Phase 3 (Memory/Embeddings). The investment in proper schema design now will pay dividends in development velocity and system reliability later.