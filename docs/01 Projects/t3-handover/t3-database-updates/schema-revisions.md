# Schema Revisions Based on Feedback

## Key Changes to Make

### 1. User-Controlled Cadence

```typescript
// Revised Project interface - Better user control
export interface Project {
  // ... existing fields
  
  // Enhanced Schedule Control (User chooses day/time/frequency)
  scheduleConfig: {
    frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    
    // Day selection (for weekly/biweekly)
    dayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0=Sunday, 6=Saturday
    
    // Time preference (MVP: just morning/afternoon/evening)
    // Future: specific time like "09:00"
    timePreference?: 'morning' | 'afternoon' | 'evening' | null;  // null = system decides
    
    // Timezone (auto-detected from browser, overridable)
    timezone: string;  // "America/New_York", "Europe/London"
    
    // Future expansion without migration
    specificTime?: string;  // "09:00" when we add time control
    flexibleWindow?: boolean;  // Allow ±2 hours from preferred time
  };
  
  // System-managed fields
  nextScheduledAt: Date | null;  // Calculated from scheduleConfig
  lastPublishedAt: Date | null;
  isPaused: boolean;
}

// Example user selections:
// "Every Friday morning" -> { frequency: 'WEEKLY', dayOfWeek: 5, timePreference: 'morning' }
// "Twice a month, Tuesday afternoons" -> { frequency: 'BIWEEKLY', dayOfWeek: 2, timePreference: 'afternoon' }
// "Daily, whenever" -> { frequency: 'DAILY', timePreference: null }
```

### 2. Open Content Preferences (LLM-Friendly)

```typescript
// Revised Project interface - Natural language preferences
export interface Project {
  // ... existing fields
  
  // Open-ended content guidance for LLM interpretation
  contentGuidance?: {
    // Free text fields that LLMs can interpret
    toneGuidance?: string;  // "Professional but approachable, like a trusted advisor"
    depthPreference?: string;  // "Deep dives on technical topics, summaries for business"
    styleNotes?: string;  // "More data and examples, less speculation"
    
    // Specific requests
    focusAreas?: string;  // "Especially interested in regulatory changes and talent"
    avoidAreas?: string;  // "Less about marketing, more about operations"
    
    // Example preferences
    exampleGuidance?: string;  // "Love case studies from similar-sized UK firms"
    
    // This grows organically from user feedback
    additionalNotes?: string;  // Accumulated preferences over time
  } | null;
  
  // These get populated from PlanningNotes and feedback
  learnedPreferences?: {
    lastUpdated: Date;
    insights: string;  // LLM-generated summary of user preferences
  } | null;
}

// Instead of rigid enums, the LLM interprets natural language:
// User says: "Make it more provocative, I'm getting bored"
// Stored as: styleNotes: "More provocative and contrarian perspectives requested"
```

### 3. Team-First Collaboration

```typescript
// Team-oriented collaboration features
export interface TeamWorkspace {
  id: string;  // workspace_[cuid]
  organizationId: string;
  name: string;  // "Strategic Research", "Innovation Lab"
  description?: string;
  
  // Workspace contains multiple projects
  projectIds: string[];
  
  // Team member access
  memberAccess: {
    userId: string;
    role: 'OWNER' | 'EDITOR' | 'VIEWER';
    addedAt: Date;
    addedBy: string;
  }[];
  
  // Shared resources
  sharedHighlights?: string[];  // Team-curated highlights
  sharedNotes?: string[];  // Team planning notes
  discussionThreadIds?: string[];  // Team discussions on episodes
  
  createdAt: Date;
  updatedAt: Date;
}

// Instead of individual sharing, think team spaces
export interface TeamDiscussion {
  id: string;  // discussion_[cuid]
  workspaceId: string;
  episodeId: string;
  blockId?: string;  // Discussing specific block
  
  // Thread structure
  messages: {
    userId: string;
    content: string;
    timestamp: Date;
    replyToId?: string;  // Threading
  }[];
  
  // Team insights
  keyTakeaways?: string[];  // Agreed important points
  actionItems?: string[];  // Things to follow up on
  
  createdAt: Date;
  lastActivityAt: Date;
}

// Replace ShareLink with TeamShare
export interface TeamShare {
  id: string;
  workspaceId: string;
  episodeIds: string[];  // Can share collections
  
  // Internal or external sharing
  shareType: 'INTERNAL_TEAM' | 'EXTERNAL_LINK' | 'CLIENT_PORTAL';
  
  // For external shares
  externalUrl?: string;
  requiresAuth?: boolean;
  expiresAt?: Date;
  
  // What's included
  includeHighlights?: boolean;
  includeDiscussion?: boolean;
  includeNotes?: boolean;
}
```

### 4. Realistic UserJourney for MVP

```typescript
// Simplified UserJourney - Only track what we can measure
export interface UserJourney {
  id: string;
  userId: string;
  
  // --- MVP Milestones (Actually trackable) ---
  
  // Onboarding
  hasStartedOnboarding: boolean;
  hasCompletedOnboarding: boolean;
  onboardingCompletedAt?: Date;
  
  // Project creation
  hasCreatedFirstProject: boolean;
  firstProjectCreatedAt?: Date;
  totalProjectsCreated: number;
  
  // Episode engagement
  hasReceivedFirstEpisode: boolean;
  hasOpenedFirstEpisode: boolean;  // Clicked to read
  firstEpisodeOpenedAt?: Date;
  totalEpisodesOpened: number;
  
  // Feedback (MVP feature)
  hasProvidedFeedback: boolean;
  firstFeedbackAt?: Date;
  totalFeedbackCount: number;
  
  // --- Phase 2 Milestones (Structure only) ---
  
  // Text selection (when implemented)
  hasHighlightedText?: boolean;
  firstHighlightAt?: Date;
  
  // Chat (when implemented)
  hasStartedChat?: boolean;
  firstChatAt?: Date;
  
  // --- Progressive Unlocking ---
  
  // Features available to this user
  availableFeatures: string[];  // ['episodes', 'feedback']
  // Will grow to: ['episodes', 'feedback', 'highlights', 'chat', 'team']
  
  // Last activity
  lastActiveAt: Date;
  daysSinceLastActive?: number;  // For re-engagement
  
  // --- Don't track yet (too early) ---
  // ❌ engagementScore - needs more data
  // ❌ preferredReadingTime - needs pattern detection
  // ❌ activityStreak - needs daily tracking
  // ❌ tutorialsCompleted - no tutorials yet
  
  createdAt: Date;
  updatedAt: Date;
}

// Focus on what drives MVP success
export interface SimplifiedEngagement {
  userId: string;
  weekNumber: number;  // Week since user joined
  
  // Simple weekly metrics
  episodesOpened: number;
  feedbackProvided: number;
  projectsActive: number;  // Has episodes scheduled
  
  // Key indicator
  isRetained: boolean;  // Came back this week
}
```

### 5. Remove Premature Optimizations

```typescript
// REMOVE or DEFER these fields:

// Episode - Remove these for now:
// ❌ viewCount - No way to track accurately yet
// ❌ sharedCount - No sharing features
// ❌ commentCount - No comments
// ❌ citedByEpisodeIds - Too complex for MVP

// Block - Simplify:
// ❌ highlightCount - Can't track without highlight feature
// ❌ avgRating - Need more data first

// ChatMessage - Defer:
// ❌ contextSnapshot - Expensive to store initially
// ❌ isStreaming/streamCompleted - Implement when needed

// Highlight - Defer:
// ❌ similarHighlightIds - Requires embeddings
// ❌ sharedWith - No sharing yet

// Keep tables but with minimal fields initially
export interface BlockMVP {
  id: string;
  episodeId: string;
  organizationId: string;
  
  type: 'MARKDOWN';  // Start simple
  content: string;  // Full episode initially
  position: number;
  
  // Critical for Two-Loop (even if empty initially)
  groundedReasoningMetadata?: any;
  researchCitations?: any;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 6. Pragmatic Implementation Plan

```typescript
// Phase 1 (Now): Absolute essentials
const PHASE_1_TABLES = [
  'Organization',
  'User', 
  'OrganizationMember',
  'Subscription',
  'Project',  // With flexible scheduleConfig
  'Episode',
  'TokenUsage',
  'EpisodeFeedback',
  'UserJourney'  // Simplified version
];

// Phase 2 (When needed): User interaction
const PHASE_2_TABLES = [
  'Block',  // Break episodes into blocks
  'ChatSession',
  'ChatMessage',
  'Highlight',
  'PlanningNote'
];

// Phase 3 (After validation): Team features
const PHASE_3_TABLES = [
  'TeamWorkspace',
  'TeamDiscussion',
  'TeamShare'
];

// Phase 4 (Much later): Advanced features
const PHASE_4_TABLES = [
  'BlockEmbedding',
  'HighlightEmbedding',
  'AuditLog'
];
```

## Summary of Key Changes

### ✅ Do This
1. **Flexible cadence** - Let users choose day/time/frequency
2. **Open text fields** - Let LLMs interpret natural language preferences
3. **Team-first design** - Workspaces and discussions, not individual shares
4. **Realistic tracking** - Only measure what you can actually track
5. **Minimal viable fields** - Start with essentials, add as needed

### ❌ Don't Do This
1. **Rigid enums** for content preferences - Too constraining
2. **Individual sharing** - Think teams from the start
3. **Premature metrics** - viewCount, engagementScore, etc.
4. **Complex fields** - contextSnapshot, similarHighlightIds
5. **Over-engineering** - Keep Phase 3-4 tables minimal

## Revised Core Schema Fields

```typescript
// The absolutely critical fields for MVP success:

interface ProjectCore {
  // Identity
  id: string;
  organizationId: string;
  
  // Content
  title: string;
  description: string;
  onboardingBrief: any;  // Conversation history
  
  // Smart scheduling
  scheduleConfig: {
    frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    dayOfWeek?: number;
    timePreference?: string;
    timezone: string;
  };
  nextScheduledAt?: Date;
  isPaused: boolean;
  
  // Natural language guidance
  contentGuidance?: {
    toneGuidance?: string;
    depthPreference?: string;
    focusAreas?: string;
    avoidAreas?: string;
  };
}

interface EpisodeCore {
  // Identity
  id: string;
  projectId: string;
  organizationId: string;
  
  // Content
  sequence: number;
  title: string;
  content: string;  // Markdown
  sources: any[];  // Flexible structure
  
  // Status
  status: 'DRAFT' | 'PUBLISHED' | 'FAILED';
  publishedAt?: Date;
  
  // Generation tracking
  generationMetadata?: {
    models: string[];
    totalCostGBP: number;
    duration: number;
  };
}

interface UserJourneyCore {
  // Identity
  id: string;
  userId: string;
  
  // What we can actually track
  hasCompletedOnboarding: boolean;
  hasCreatedFirstProject: boolean;
  hasOpenedFirstEpisode: boolean;
  hasProvidedFeedback: boolean;
  
  // Simple metrics
  totalProjectsCreated: number;
  totalEpisodesOpened: number;
  totalFeedbackCount: number;
  
  // Features available
  availableFeatures: string[];
  
  lastActiveAt: Date;
}
```

This approach is much more pragmatic and aligned with MVP reality while still being extensible for future phases.