# Feedback on ADR-020: Episode Reader Architecture

## To: T3 Implementation Team
## From: Many Futures Product Team
## Date: August 13, 2025
## Re: Episode Reader Architecture Alignment with Lean MVP

---

## Summary

Thanks for the comprehensive ADR-020 on the episode reader architecture. The technical approach is solid, but it needs alignment with our **lean MVP pivot** - we're shipping in 2 weeks to validate core assumptions, not building the full vision upfront.

## Critical Context You Need

### 1. We Pivoted to Lean (August 11)
- **Timeline:** 2 weeks, not 5 weeks
- **Goal:** 5 paying customers at £29/month
- **Philosophy:** "Build YouTube comments, not YouTube"
- **Rationale:** [See lean-pivot-rationale.md](./lean-pivot-rationale.md)

### 2. Core Value Loop Only
```
User reads episode → Rates it → Pays (or doesn't)
```
Everything else is speculation until proven.

## What Needs to Change in ADR-020

### ❌ Features to REMOVE from MVP

Your ADR includes several features we explicitly deferred:

| Feature | Your ADR | Our MVP | Why Deferred |
|---------|----------|---------|--------------|
| **Highlights** | Full implementation | None | No evidence users want it |
| **Chat Panel** | Progressive loading | None | Unproven value |
| **Source Tracking** | Click analytics | None | Premature optimization |
| **Scroll Tracking** | Reading depth | None | Vanity metric for MVP |
| **Service Worker** | Offline reading | None | Over-engineered |
| **Text Selection** | Toolbar UI | None | Complex for unclear value |

### ✅ What to BUILD Instead

```typescript
// MVP Scope (Week 1-2)
const MVP_EPISODE_READER = {
  // Core (Ship This)
  markdownRendering: true,      // Simple react-markdown
  typography: true,              // Charter serif, Inter headings
  simpleFeedback: true,          // 1-5 rating + optional text
  mobileResponsive: true,        // Must work on phones
  
  // Defer (Don't Build)
  highlights: false,             // No selection UI
  chat: false,                   // No sidebar
  sourceTracking: false,         // No analytics
  scrollTracking: false,         // No progress
  offlineMode: false,           // No service worker
  blockTypes: false,            // Just markdown
};
```

### Simplified Architecture

Instead of your complex pipeline, start with:

```typescript
// 1. Simple Server Component
async function EpisodePage({ params }) {
  const episode = await db.episode.findFirst({
    where: { 
      id: params.id,
      project: { organizationId: session.user.organizationId }
    }
  });
  
  // Check paywall (Episode 2+)
  if (episode.sequence > 1 && !hasSubscription) {
    return <PaywallPage />;
  }
  
  return <EpisodeReader episode={episode} />;
}

// 2. Basic Client Component
function EpisodeReader({ episode }) {
  const [rating, setRating] = useState(null);
  const [feedback, setFeedback] = useState('');
  
  return (
    <article className="max-w-3xl mx-auto px-8 py-16">
      <EpisodeHeader {...episode} />
      <div className="prose prose-lg">
        <ReactMarkdown>{episode.content}</ReactMarkdown>
      </div>
      <FeedbackForm 
        onSubmit={(rating, feedback) => {
          submitFeedback(episode.id, rating, feedback);
        }}
      />
    </article>
  );
}
```

### Database Schema (Simplified)

```prisma
model Episode {
  id        String @id @default(cuid())
  projectId String
  title     String
  subtitle  String?
  content   String @db.Text  // Just markdown, not JSON blocks
  sequence  Int              // Episode 1, 2, 3...
  status    EpisodeStatus @default(DRAFT)
  
  // No block relations, no embeddings, no complex metadata
}

model Feedback {
  id        String @id @default(cuid())
  episodeId String
  userId    String
  rating    Int     // 1-5, required
  comment   String? // Optional text
  createdAt DateTime @default(now())
  
  @@unique([episodeId, userId])
}
```

## Typography Requirements (Missing from ADR)

This is critical for the reading experience:

```css
/* Core Typography - Non-negotiable */
.prose {
  font-family: 'Charter', 'Georgia', serif;
  font-size: 1.125rem;
  line-height: 1.75;
  max-width: 65ch;  /* Optimal reading length */
  color: #1a1a1a;
}

.prose h2 {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 600;
  margin-top: 3rem;
  text-wrap: balance;  /* Prevent orphan words */
}
```

## Cost Control Context (Critical)

Your ADR doesn't mention cost controls, but this is existential:

```typescript
// Before EVERY episode generation
async function generateEpisode(project: Project) {
  // MUST CHECK COSTS FIRST
  const todaysCost = await getTodaysCost(project.organizationId);
  if (todaysCost > 50) throw new Error("Daily limit exceeded");
  
  // Generate with Claude
  const episode = await generateWithTracking(project);
  
  // Track in TokenUsage table
  await trackTokens(episode.tokensUsed, episode.cost);
}
```

## Progressive Enhancement Strategy

Your ADR assumes we build everything with flags. Instead:

```typescript
// Phase 1: Ship MVP (Week 1-2)
- Markdown rendering
- Simple feedback
- Basic typography

// Phase 2: Validate with Users (Week 3-4)
- Get 5 paying customers
- Ask what they want most

// Phase 3: Build What Users Request (Month 2+)
if (users.request('highlights') > 3) {
  FEATURES.HIGHLIGHTS = true;  // Now build it
}
```

## Performance Targets (Simpler)

Instead of complex optimizations:

### MVP Requirements
- Page load: <2 seconds
- Markdown render: <500ms  
- Feedback submit: Optimistic UI
- Mobile: 16px minimum font

### Defer These
- Service workers
- Code splitting for features we're not building
- Source link tracking
- Scroll depth analytics

## What We're Asking

1. **Revise ADR-020** to reflect lean MVP scope
2. **Move complex features** to "Future Enhancements" section
3. **Focus on shipping** beautiful reading + simple feedback
4. **Don't over-engineer** - we need to validate, not scale

## Timeline Reality Check

- **Days 1-2:** Basic episode page with markdown
- **Days 3-4:** Feedback form + database
- **Days 5-6:** Polish + mobile testing
- **NOT** 2 weeks building highlights, chat, and tracking

## Questions to Consider

1. Can users read episodes beautifully? ✅ Focus here
2. Can they give feedback simply? ✅ Focus here
3. Will they pay after Episode 1? ✅ Focus here
4. Do they want highlights? ❓ Ask after they pay
5. Do they want chat? ❓ Ask after they pay

## References

- [Lean Pivot Rationale](./lean-pivot-rationale.md) - Why we changed approach
- [Episode Reading PRD Lean](./episode-reading-prd-lean.md) - Simplified requirements
- [MVP Build Plan](./mvp-build-plan.md) - 2-week timeline
- [Original Prototype](../../many-futures-prototype-v4/) - What we're NOT building yet

## Bottom Line

The architecture in ADR-020 is good for the **future vision**, but wrong for the **MVP**. Please revise to match our lean approach - ship simple, enhance based on user feedback, not assumptions.

Remember: **We're building YouTube comments, not YouTube.**

---

*Happy to discuss on a call if this helps clarify the pivot. The technical approach is solid, we just need to dramatically reduce scope for the next 2 weeks.*