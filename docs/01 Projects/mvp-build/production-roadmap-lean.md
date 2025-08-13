# Many Futures LEAN Production Roadmap

**Status:** Active Development  
**Approach:** Lean MVP - Validate Core Value First  
**Started:** August 11, 2025  
**Last Updated:** 2025-08-11  
**Purpose:** Simplified roadmap focusing on core value delivery before infrastructure

> **Philosophy:** Ship in 2 weeks, not 5. Build only what users pull us toward.

---

## 🎯 Mission (Simplified)

Get 5 paying customers for AI-generated strategic intelligence episodes at £29/month.

**Core Value Prop:** Weekly episodes that provide strategic insights busy professionals actually read and value.

---

## 📍 Current State

### What We Keep From Full Vision
- ✅ Database schema (complete, no changes needed)
- ✅ Security implementation (RLS, audit logs)
- ✅ Conversational UI for project creation
- ✅ next-forge foundation

### What We Defer (Feature Flags OFF)
- ❌ Chat interface (validate need first)
- ❌ Embeddings/vector search (expensive, unproven)
- ❌ Complex memory system (over-engineered)
- ❌ 8 block types (start with 3)

### What We Simplify
- ✅ Episodes as single content blob initially
- ✅ Simple feedback vs complex ratings
- ✅ PostgreSQL full-text search vs embeddings
- ✅ Key-value memory vs Mem0

---

## 🚀 Lean Phases (Target: 2 Weeks Total)

### Phase 0: Foundation (3 days) ✅ Started Aug 11
**Goal:** Get production environment ready

#### Must Complete
- [x] Supabase project setup
- [ ] Database migration (keeping full schema)
- [ ] Environment configuration
- [ ] Conversational UI deployed
- [ ] One manual test episode

#### Validation Gate
- ✅ Can create project via conversation
- ✅ Can manually trigger episode generation
- ✅ Episode displays beautifully

### Phase 1: Core Loop (4 days)
**Goal:** Episodes generate → Users read → We learn

#### Features (Drastically Reduced)
```typescript
// Just these models matter initially
- Project (from conversation)
- Episode (simple generation with cost controls)
- Feedback (text + rating)
- Schedule (weekly only, simple cron)
```

#### Critical Additions (Missing from Original)
- [ ] **Episode Scheduling** - Simple cron job for weekly delivery
- [ ] **Cost Controls** - Max £2/episode, daily limit £50
- [ ] **User Notification** - Email or in-app "NEW" badge
- [ ] **Analytics** - Vercel Analytics from day 1
- [ ] **Admin Overrides** - Regenerate, refund, pause capabilities

#### Implementation
- [ ] Claude API direct integration (no n8n)
- [ ] Simple episode generation with cost tracking
- [ ] Beautiful reading experience
- [ ] "How was this?" feedback form
- [ ] Track: read time, completion rate, costs

#### Validation Gate
- ✅ Episode generates in <30 min
- ✅ Looks beautiful on mobile
- ✅ Users complete reading
- ✅ Feedback collected

### Phase 2: Payment Gate (2 days)
**Goal:** Validate willingness to pay

#### Implementation
- [ ] Stripe Checkout (simplest integration)
- [ ] Paywall after Episode 1
- [ ] Cancel anytime
- [ ] Email receipt

#### Validation Gate
- ✅ Payment flow works
- ✅ First paying customer
- ✅ 50% convert after Episode 1

### Phase 3: Learn & Iterate (5 days)
**Goal:** Talk to users, build what they need

#### Process
1. Call every paying user
2. Track feature requests
3. Build highest voted feature
4. Ship daily

#### Potential Additions (Based on Data)
- Highlighting (if requested)
- Email notifications (if requested)
- Episode frequency control (if requested)
- NOT building chat/embeddings unless strongly pulled

---

## 🛡️ Critical Safety Features (NOT Optional)

### Cost Controls
```typescript
// MUST HAVE from day 1 to avoid bankruptcy
const COST_LIMITS = {
  MAX_EPISODES_PER_DAY: 20,
  MAX_TOKENS_PER_EPISODE: 10_000,
  MAX_COST_PER_EPISODE: 2.00, // £2 max
  DAILY_COST_LIMIT: 50.00,    // £50 kill switch
};

// Kill switch implementation
async function checkCostLimits() {
  const todaysCost = await getTodaysTotalCost();
  if (todaysCost > COST_LIMITS.DAILY_COST_LIMIT) {
    await pauseAllGeneration();
    await alertAdmin('Daily cost limit exceeded!');
    throw new Error('Generation paused: cost limit');
  }
}
```

### Episode Scheduling (Minimum Viable)
```typescript
// Simple, not complex orchestration
interface ProjectSchedule {
  frequency: 'weekly';     // Start with one option
  dayOfWeek: number;       // 0-6 (Sunday-Saturday)
  timeUTC: string;         // "09:00"
  isPaused: boolean;
  nextScheduledAt: Date;
}

// Basic cron job (Vercel Cron or similar)
// Run every hour, check what needs generating
```

### User Notification (Pick One)
```typescript
// Option 1: Simple email via Resend (1 line)
await resend.emails.send({
  to: user.email,
  subject: 'Your Weekly Intelligence Episode is Ready',
  html: `<a href="${episodeUrl}">Read Now</a>`
});

// Option 2: In-app notification badge
await database.notification.create({
  userId,
  type: 'NEW_EPISODE',
  episodeId
});

// Option 3: Just show "NEW" on login (simplest)
```

## 🏗️ Technical Simplifications

### Database Strategy
```prisma
// We KEEP the full schema but only USE:
- User (basic)
- Organization (Clerk default)
- Project (from conversation + schedule)
- Episode (content + metadata + cost tracking)
- Feedback (new simple table)
- TokenUsage (CRITICAL for cost tracking)

// These exist but remain empty initially:
- Block (not used yet)
- Highlight (feature flag OFF)
- ChatSession (feature flag OFF)
- BlockEmbedding (feature flag OFF)
```

### Memory Simplification
```typescript
// Instead of complex Mem0 + embeddings
class SimpleFeedbackMemory {
  async save(projectId: string, feedback: any) {
    return database.projectMemory.create({
      data: {
        projectId,
        key: `feedback_${Date.now()}`,
        value: feedback,
        type: 'user_feedback'
      }
    });
  }
  
  async getRecent(projectId: string, limit = 10) {
    return database.projectMemory.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
}
```

### Episode Generation (With Safety)
```typescript
// Phase 1: Direct but SAFE
async function generateEpisode(project: Project) {
  // Cost check BEFORE generation
  await checkCostLimits();
  
  const recentFeedback = await getRecentFeedback(project.id);
  
  const prompt = `...`; // Your prompt
  
  // Track costs
  const startTime = Date.now();
  const { content, usage } = await claude.complete({ 
    prompt,
    max_tokens: COST_LIMITS.MAX_TOKENS_PER_EPISODE 
  });
  
  // Record cost
  await database.tokenUsage.create({
    data: {
      projectId: project.id,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      costUsd: calculateCost(usage),
      modelUsed: 'claude-3.5-sonnet'
    }
  });
  
  // Verify cost didn't exceed limit
  if (calculateCost(usage) > COST_LIMITS.MAX_COST_PER_EPISODE) {
    await alertAdmin('Episode cost exceeded limit!');
  }
  
  return database.episode.create({
    data: {
      projectId: project.id,
      content,
      title: extractTitle(content),
      status: 'PUBLISHED',
      generationTimeMs: Date.now() - startTime,
      tokenCount: usage.total_tokens
    }
  });
}
```

### Analytics (Zero Setup)
```typescript
// Use Vercel Analytics from day 1
import { track } from '@vercel/analytics';

// Track everything that matters
track('episode_generated', { 
  projectId, 
  tokenCount,
  costUsd,
  timeMs 
});

track('episode_opened', { episodeId });
track('episode_read_complete', { 
  episodeId,
  readTimeSeconds 
});

track('feedback_submitted', { 
  episodeId,
  sentiment: 'positive' | 'negative' 
});

track('payment_initiated', { 
  userId,
  episodeCount 
});
```

### Admin Overrides (Escape Hatches)
```typescript
// When things go wrong (they will)
const ADMIN_ACTIONS = {
  // Regenerate a bad episode
  async regenerateEpisode(episodeId: string) {
    const episode = await getEpisode(episodeId);
    await markAsRegenerated(episode);
    return generateEpisode(episode.project);
  },
  
  // Refund unhappy user
  async refundUser(userId: string, reason: string) {
    await stripe.refunds.create({ /* ... */ });
    await logAdminAction('refund', { userId, reason });
  },
  
  // Emergency pause
  async pauseProject(projectId: string, reason: string) {
    await database.project.update({
      where: { id: projectId },
      data: { isPaused: true }
    });
    await notifyUser(projectId, `Project paused: ${reason}`);
  },
  
  // Edit before it goes out
  async editEpisodeContent(episodeId: string, newContent: string) {
    await database.episode.update({
      where: { id: episodeId },
      data: { 
        content: newContent,
        editedBy: 'admin',
        editedAt: new Date()
      }
    });
  }
};
```

---

## 🎚️ Feature Flags & Progressive Enhancement

```typescript
// many-futures/config/features.ts
export const FEATURES = {
  // Phase 0-2 (ON)
  CONVERSATIONAL_UI: true,
  EPISODE_GENERATION: true,
  SIMPLE_FEEDBACK: true,
  PAYMENTS: true,
  COST_CONTROLS: true,        // CRITICAL
  ANALYTICS: true,             // CRITICAL
  ADMIN_OVERRIDES: true,       // CRITICAL
  
  // Future Phases (OFF but ready)
  CHAT: false,
  EMBEDDINGS: false,
  HIGHLIGHTS: false,
  COMPLEX_MEMORY: false,
  MULTIPLE_BLOCK_TYPES: false,
  EMAIL_NOTIFICATIONS: false,
};

// Smart Progressive Enhancement
async function checkUserBehavior(userId: string) {
  const user = await getUserMetrics(userId);
  
  // Auto-enable features based on behavior
  if (user.copyPasteCount > 3) {
    await enableFeatureForUser('HIGHLIGHTS', userId);
    await notify(userId, "✨ Highlighting enabled! Try selecting text.");
  }
  
  if (user.episodesRead > 5 && user.questionsAsked > 0) {
    await enableFeatureForUser('CHAT', userId);
    await notify(userId, "💬 Chat unlocked! Ask questions about episodes.");
  }
  
  if (user.episodesRead > 10) {
    await enableFeatureForUser('MULTIPLE_PROJECTS', userId);
    await notify(userId, "🚀 You can now create multiple projects!");
  }
}
```

---

## 📊 Success Metrics (Revised with Reality Checks)

### Day 3 Checkpoint
- [ ] First real episode generated (not test)
- [ ] One person reads to completion
- [ ] Zero security vulnerabilities
- [ ] Costs tracked and under £5 total

### Week 1 Checkpoint
- [ ] 10 episodes delivered on schedule
- [ ] 50% read completion rate
- [ ] 3 pieces of actionable feedback
- [ ] 1 user asks for paid version
- [ ] Episode cost <£1 each
- [ ] Zero crashes or data issues

### Week 2 Checkpoint  
- [ ] 5 paying customers
- [ ] Clear #1 feature request identified
- [ ] Episode generation fully automated
- [ ] Cost per episode stabilized
- [ ] Zero data breaches
- [ ] Admin controls tested and working

---

## 🚨 What We're NOT Building (Yet)

### Definitely Not in Lean MVP
- ❌ Chat interface (unproven need)
- ❌ Vector embeddings ($$ before value)
- ❌ Complex memory system (over-engineered)
- ❌ Multiple projects (one is enough)
- ❌ Team features (solopreneur focus)
- ❌ API access (no one asked)
- ❌ n8n workflows (unnecessary complexity)

### Build Only When Pulled
- 📊 "Users keep asking for chat" → Build chat
- 📊 "Users want to search old episodes" → Add search
- 📊 "Users creating multiple projects" → Add support
- 📊 "Users want daily not weekly" → Add cadence

---

## 💡 Lean Principles We Follow

1. **Validate Before Building**
   - Every feature must have user demand
   - No speculative engineering

2. **Simple > Clever**
   - PostgreSQL search > Vector embeddings
   - Markdown > Complex block types
   - Direct API > Orchestration

3. **Speed > Perfection**
   - Ship daily
   - Fix forward
   - Learn constantly

4. **Data > Opinions**
   - Track everything
   - Talk to users
   - Pivot based on evidence

---

## 🔄 Migration Path to Full Vision

When validated and ready to scale:

1. **Turn on feature flags** (no migration needed)
2. **Populate empty tables** (schema already there)
3. **Activate embeddings** (infrastructure ready)
4. **Enable chat** (streaming setup exists)

The lean approach doesn't burn bridges - it defers them.

---

## 📝 Daily Checklist

Every day ask:
- [ ] Did we ship something?
- [ ] Did we talk to a user?
- [ ] Did we learn something?
- [ ] Are we still lean?

---

## 🎯 Next Actions (Updated with Critical Pieces)

### Today (Immediate)
1. Complete Supabase setup
2. **Add TokenUsage table for cost tracking**
3. **Implement cost control checks**
4. Deploy conversational UI
5. **Set up Vercel Analytics**

### Tomorrow (Day 2)
1. **Implement episode scheduling (simple cron)**
2. **Choose notification method (email vs in-app)**
3. Generate first real episode (with cost tracking)
4. **Set up admin dashboard with overrides**
5. Send to 3 target users

### Day 3 (Validation)
1. **Verify costs are tracked correctly**
2. **Test kill switch at £50 limit**
3. Check analytics are capturing events
4. Get feedback from first users
5. **Test admin override functions**

---

*Remember: It's easier to add features than remove them. Start minimal, let users pull you forward.*

**The best startup is a lean startup.**