# ADR-020: Episode Reader Architecture (Lean MVP)

**Status:** Accepted
**Date:** 2025-08-13
**Deciders:** Product, Engineering
**Supersedes:** Original ADR-020

## Context

The episode reader is where users validate our core hypothesis: **Will businesses pay £29/month for AI-generated strategic intelligence?** 

We have 2 weeks to ship an MVP that proves this, not 5 weeks to build every feature we imagine users might want.

## Decision

Build the simplest possible beautiful reading experience:
1. Server-side rendering for fast load
2. Basic markdown rendering (no complex blocks)
3. Simple feedback collection (1-5 stars + optional text)
4. NO chat, highlights, tracking, or other unproven features

## Consequences

### Positive
- Ship in 2 weeks, not 5
- Validate core assumption quickly
- Lower cost per episode (~$0.10 vs $0.50)
- Less code to maintain (2000 lines vs 10000)

### Negative  
- No advanced features initially
- May need to add features later based on feedback
- Less "innovative" at launch

## Implementation Details

### Core MVP Scope

```typescript
// What we're building (Week 1-2)
const MVP_EPISODE_READER = {
  // SHIP THIS
  markdownRendering: true,      // react-markdown
  typography: true,              // Charter serif, clean sans
  simpleFeedback: true,          // 1-5 rating + text
  mobileResponsive: true,        // Must work on phones
  sourceLinks: true,             // Inline hyperlinks only
  
  // DON'T BUILD (Despite being in original ADR)
  highlights: false,             // No selection UI
  chat: false,                   // No chat panel
  sourceTracking: false,         // No click analytics
  scrollTracking: false,         // No reading depth
  offlineMode: false,           // No service worker
  textSelection: false,         // No highlight toolbar
  annotations: false,           // No margin notes
};
```

### Simple Server Component

```typescript
// app/(dashboard)/episodes/[id]/page.tsx
async function EpisodePage({ params }: { params: { id: string } }) {
  const episode = await db.episode.findFirst({
    where: { 
      id: params.id,
      project: { 
        organizationId: session.user.organizationId 
      }
    },
    include: {
      project: true
    }
  });
  
  if (!episode) {
    notFound();
  }
  
  // Simple paywall check (Episode 2+)
  if (episode.sequence > 1 && !user.hasSubscription) {
    return <PaywallPage price="£29/month" />;
  }
  
  return <EpisodeReader episode={episode} />;
}
```

### Basic Client Component

```typescript
'use client';

function EpisodeReader({ episode }: { episode: Episode }) {
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const handleFeedback = async () => {
    await submitFeedback(episode.id, rating, feedback);
    setSubmitted(true);
  };
  
  return (
    <article className="min-h-screen bg-white">
      {/* Simple Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between">
          <Link href="/projects">
            <HomeIcon className="w-5 h-5" />
          </Link>
          <span className="text-sm text-stone-600">
            {episode.project.title}
          </span>
          <button onClick={() => navigator.share({ url: window.location.href })}>
            <ShareIcon className="w-5 h-5" />
          </button>
        </div>
      </nav>
      
      {/* Content */}
      <div className="max-w-3xl mx-auto px-8 py-24">
        {/* Header */}
        <header className="text-center mb-12">
          <span className="inline-block px-4 py-2 bg-stone-100 text-stone-700 text-sm rounded-full mb-6">
            Episode {episode.sequence}
          </span>
          <h1 className="text-5xl font-serif font-bold text-stone-900 mb-6 leading-tight">
            {episode.title}
          </h1>
          <p className="text-xl text-stone-600 leading-relaxed">
            {episode.summary}
          </p>
          <div className="mt-6 text-sm text-stone-500">
            {formatDate(episode.publishedAt)} • {episode.readingMinutes} min read
          </div>
        </header>
        
        {/* Markdown Content */}
        <div className="prose prose-lg prose-stone max-w-none">
          <ReactMarkdown>{episode.content}</ReactMarkdown>
        </div>
        
        {/* Simple Feedback */}
        {!submitted ? (
          <div className="mt-16 p-8 bg-stone-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              How was this episode?
            </h3>
            <div className="flex gap-2 mb-6">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`p-3 rounded ${
                    rating === n ? 'bg-stone-900 text-white' : 'bg-white'
                  }`}
                >
                  <Star className="w-5 h-5" />
                </button>
              ))}
            </div>
            <textarea
              placeholder="Any feedback? (optional)"
              className="w-full p-4 border rounded mb-4"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <Button onClick={handleFeedback} disabled={!rating}>
              Submit Feedback
            </Button>
          </div>
        ) : (
          <div className="mt-16 p-8 text-center">
            <p className="text-stone-600">Thanks for your feedback!</p>
          </div>
        )}
      </div>
    </article>
  );
}
```

### Typography (Critical for Premium Feel)

```css
/* This is non-negotiable for reading experience */
.prose {
  font-family: 'Charter', 'Georgia', serif;
  font-size: 1.125rem;  /* 18px */
  line-height: 1.75;
  color: #1a1a1a;
  max-width: 65ch;  /* Optimal reading width */
}

.prose h1, .prose h2, .prose h3 {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 600;
  text-wrap: balance;
}

.prose a {
  color: #0969da;
  text-decoration: underline;
  text-underline-offset: 2px;
}
```

### Database Schema (Simplified)

```prisma
model Episode {
  id          String   @id @default(cuid())
  projectId   String
  sequence    Int      // Episode 1, 2, 3...
  title       String
  summary     String?
  content     String   @db.Text  // Just markdown
  publishedAt DateTime?
  status      EpisodeStatus @default(DRAFT)
  
  // NO blocks, embeddings, or complex relations for MVP
}

model Feedback {
  id        String   @id @default(cuid())
  episodeId String
  userId    String
  rating    Int      // 1-5 required
  comment   String?  // Optional
  createdAt DateTime @default(now())
  
  @@unique([episodeId, userId])
}
```

## Features Explicitly Deferred

Based on lean pivot rationale, these are NOT in MVP:

| Feature | Why Deferred | When to Build |
|---------|-------------|---------------|
| **Text Highlighting** | No evidence users want it | When 3+ users request |
| **Chat Interface** | Unproven value | When users ask "can I discuss this?" |
| **Reading Progress** | Vanity metric | When we need engagement data |
| **Source Click Tracking** | Premature optimization | When measuring trust matters |
| **Offline Reading** | Over-engineered | When users complain about connectivity |
| **Scroll Analytics** | Not actionable yet | When optimizing content |
| **Annotations** | Complex for unknown value | When users want to take notes |

## Performance Requirements (Simplified)

### MVP Targets
- Page load: < 2 seconds
- Readable immediately (SSR)
- Works on mobile (16px min font)
- Feedback submits optimistically

### NOT Required for MVP
- Service workers
- Code splitting beyond Next.js defaults
- Scroll position persistence
- Reading time estimates

## Cost Control (Critical)

```typescript
// This MUST be implemented
async function generateEpisode(projectId: string) {
  // Check daily limit FIRST
  const todaysCost = await db.tokenUsage.sum({
    where: {
      organizationId: project.organizationId,
      createdAt: { gte: startOfDay }
    },
    select: { totalCost: true }
  });
  
  if (todaysCost > 50) {
    throw new Error("Daily limit exceeded");
  }
  
  // Generate with cost tracking
  const result = await generateWithClaude(project);
  
  // Track usage
  await db.tokenUsage.create({
    data: {
      organizationId: project.organizationId,
      episodeId: episode.id,
      model: 'claude-3-opus',
      promptTokens: result.usage.prompt_tokens,
      completionTokens: result.usage.completion_tokens,
      totalCost: calculateCost(result.usage)
    }
  });
}
```

## Success Metrics

### What We Measure (MVP)
1. **Episode completion** - Do they read it?
2. **Feedback rate** - Do they rate it?
3. **Payment conversion** - Do they pay after Episode 1?

### What We DON'T Measure (Yet)
- Scroll depth percentages
- Time on page
- Source link clicks
- Highlight counts
- Chat engagement (doesn't exist)

## Migration Path

When we validate core assumptions and users request features:

```typescript
// All these can be turned on later via feature flags
if (FEATURES.HIGHLIGHTS) {
  // Add highlighting UI
}

if (FEATURES.CHAT) {
  // Add chat panel
}

if (FEATURES.TRACKING) {
  // Add analytics
}
```

## Timeline

- **Days 1-2:** Basic episode page with markdown
- **Days 3-4:** Feedback form + database
- **Days 5-6:** Typography polish + mobile testing
- **Day 7:** Deploy and test with real users

## References

- [Lean Pivot Rationale](../../../01 Projects/mvp-build/lean-pivot-rationale.md)
- [Original Over-Engineered ADR](./20-episode-reader-architecture.md)
- [Episode Reader PRD](./episode-reader-prd.md)