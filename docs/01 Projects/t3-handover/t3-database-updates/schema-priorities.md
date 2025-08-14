# Schema Priorities - Advisory Panel Review

## 🎯 Critical Analysis: What Actually Matters for MVP

After the advisory panel review, here's a pragmatic prioritization that balances preventing future pain with keeping the MVP lean.

---

## Priority 1: Must Have Before Launch
*These prevent major refactoring or data loss*

### 1A. Fix JSON Blob Anti-Pattern for Block Metadata
**Why Critical:** You'll query this data from day one for the Two-Loop Architecture.

```typescript
// ❌ CURRENT (will cause pain)
export interface Block {
  groundedReasoningMetadata?: any;  // Black hole
  researchCitations?: any;          // Unsearchable
}

// ✅ REVISED (queryable, extensible)
export interface Block {
  id: string;
  episodeId: string;
  content: string;  // Keep simple for MVP
  
  // Structured metadata (not JSON)
  reasoning?: string;  // Plain text reasoning
  confidence?: number;  // 0-1 confidence score
  
  // Structured citations
  citations?: {
    url: string;
    title: string;
    relevance: number;
  }[];
}

// Separate table for richer metadata (add fields as needed)
export interface BlockMetadata {
  id: string;
  blockId: string;
  metaType: 'reasoning' | 'source' | 'pattern' | 'correction';
  content: string;  // Natural language
  confidence?: number;
  createdAt: Date;
}
```

**Impact:** Allows querying "show me all high-confidence reasoning" without JSON parsing.

### 1B. Simple Event Tracking (Replace UserJourney Booleans)
**Why Critical:** Every boolean flag is a future migration. Events are infinitely flexible.

```typescript
// ✅ SIMPLE EVENT TABLE (replaces UserJourney)
export interface UserEvent {
  id: string;
  userId: string;
  organizationId: string;
  
  eventType: string;  // 'onboarding_complete', 'first_episode_opened'
  eventData?: any;    // Flexible context (OK to be JSON here)
  
  createdAt: Date;
  
  // Indexes: userId, eventType, createdAt
}

// Now you can derive ANY metric:
// - Has user completed onboarding? 
//   SELECT EXISTS(WHERE eventType = 'onboarding_complete')
// - How many episodes opened?
//   SELECT COUNT(WHERE eventType = 'episode_opened')
// - User journey funnel?
//   SELECT eventType, COUNT(*) GROUP BY eventType
```

**Impact:** No schema changes when tracking new behaviors. Just add new event types.

### 1C. Simple Audit Log (Compliance & Debugging)
**Why Critical:** You'll need this for GDPR, debugging, and user trust.

```typescript
// ✅ MINIMAL AUDIT LOG
export interface AuditLog {
  id: string;
  userId: string;
  organizationId: string;
  
  action: string;  // 'episode.generate', 'project.delete', 'payment.charge'
  resourceId?: string;  // What was affected
  
  // Just enough for debugging
  oldValue?: string;  // Simple string, not JSON
  newValue?: string;
  
  createdAt: Date;
  
  // Indexes: userId, action, createdAt
}
```

**Impact:** Can answer "what happened?" without complex logging infrastructure.

---

## Priority 2: Important But Can Start Minimal
*Create table structure now, add fields later*

### 2A. Basic Memory Table (Foundation Only)
**Why Important:** Harrison is right - memory as JSON won't scale. But you don't need sophisticated memory yet.

```typescript
// ✅ MINIMAL MEMORY TABLE (expand later)
export interface AgentMemory {
  id: string;
  projectId: string;  // What project this relates to
  organizationId: string;
  
  memoryType: 'preference' | 'feedback' | 'pattern';
  content: string;  // Natural language memory
  
  // Just enough for retrieval
  importance: number;  // 0-1, simple scoring
  lastAccessed?: Date;
  
  createdAt: Date;
  expiresAt?: Date;  // Auto-cleanup
}
```

**Start with:** Just storing user preferences from feedback
**Expand later:** Entities, relationships, decay, sophisticated retrieval

### 2B. Token Usage Enhancement (Provider Tracking)
**Why Important:** Different providers have different costs.

```typescript
// Already in your schema, just ensure:
provider: 'OPENAI' | 'ANTHROPIC' | 'GOOGLE';  // ✅ Good
// Remove: dailyTotal (calculate dynamically)  // ✅ Good
```

---

## Priority 3: Valuable But Not MVP Critical
*Nice to have, implement after launch*

### 3A. Memory Governance
**Why Defer:** No memory system yet, users aren't worried about this until you have memory.

```typescript
// 🔮 FUTURE: Add when implementing memory features
interface MemoryPolicy {
  // User control over what's remembered
  // Add in Phase 3 when memory becomes important
}
```

### 3B. Activation Tracking
**Why Defer:** Need users first before optimizing activation.

```typescript
// 🔮 FUTURE: Add after you have 100+ users
interface UserActivation {
  // Track magic moments and activation funnel
  // Derive from events initially
}
```

### 3C. Experiment Framework
**Why Defer:** Need stable product before A/B testing.

```typescript
// 🔮 FUTURE: Add when you have enough users for statistical significance
interface FeatureExperiment {
  // A/B testing infrastructure
}
```

---

## Priority 4: Definitely Not Now
*Would add complexity without value*

### ❌ Skip These:
- **Memory decay/scoring** - Too sophisticated
- **Chain-of-thought tracking** - Debugging tool, not critical
- **Permission system** - Over-engineering for single-user MVP
- **Memory lineage** - Academic, not practical
- **Detailed usage metrics** - Derive from events
- **Memory priority scoring** - Premature optimization

---

## 📋 Recommended Implementation Order

### Before Launch (Week 1)
```typescript
// 1. Create these tables
- Block (with structured fields, not JSON)
- BlockMetadata (for extensible metadata)
- UserEvent (replaces UserJourney)
- AuditLog (simple version)

// 2. Update existing
- TokenUsage (ensure provider field)
- Remove UserJourney table (use events instead)
```

### After Launch (Week 2-3)
```typescript
// Add when implementing features
- AgentMemory (basic version)
- ChatSession/ChatMessage (when adding chat)
```

### Much Later (Month 2+)
```typescript
// Add based on real user needs
- Memory governance (if users ask)
- Activation tracking (after 100+ users)
- Experiments (when optimizing)
```

---

## 🎯 Key Principle: Progressive Enhancement

Start with simple structures that can grow:

```typescript
// Day 1: Simple
interface UserEvent {
  eventType: string;
  eventData?: any;
}

// Month 3: Enhanced (no migration needed)
interface UserEvent {
  eventType: string;
  eventData?: any;
  sessionId?: string;  // Added for session tracking
  deviceType?: string;  // Added for device analytics
  // Original data still works
}
```

---

## Summary for T3 Team

### Do Now (Prevents Pain):
1. **Structure Block metadata** - Don't use JSON blobs
2. **Use event tracking** - Not boolean flags  
3. **Add simple audit log** - For compliance/debugging

### Create Table, Use Later:
1. **AgentMemory** - Minimal structure
2. **BlockMetadata** - For rich metadata

### Definitely Skip:
1. Memory governance - No memory system yet
2. Activation tracking - No users yet
3. Experiment framework - No need to optimize yet
4. Permission systems - Single user focus

This keeps you lean while preventing the painful migrations the advisors warned about. The key insight: **structure what you'll query, defer what you won't**.