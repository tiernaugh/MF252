# Technical Architecture for T3 Implementation

## Core Architecture Principles

### 1. Organization-Based Multi-Tenancy
Every user gets a personal organization by default. All data is scoped to organizations for privacy and future team features.

```typescript
// Every query includes org scoping
const projects = await db.project.findMany({
  where: { 
    organizationId: session.user.organizationId,
    deletedAt: null 
  }
});
```

### 2. Feature Flags from Day One
Progressive enhancement without code changes:

```typescript
// config/features.ts
export const FEATURES = {
  // Core MVP - ON
  CONVERSATIONAL_UI: true,
  EPISODE_GENERATION: true,
  SIMPLE_FEEDBACK: true,
  PAYMENTS: true,
  
  // Future - OFF until validated
  CHAT: false,
  EMBEDDINGS: false,
  COMPLEX_MEMORY: false,
  HIGHLIGHTS: false
};
```

### 3. Cost Control Architecture
Never generate content without checking limits:

```typescript
// Before EVERY API call
async function canGenerate(orgId: string): Promise<boolean> {
  const todaysCost = await getTodaysCost(orgId);
  if (todaysCost > 50) return false; // £50 daily kill switch
  
  const episodeCost = await getLastEpisodeCost(orgId);
  if (episodeCost > 2) return false; // £2 per episode max
  
  return true;
}
```

## System Components

### 1. Database Layer (PostgreSQL + Prisma)

**Core Tables for MVP:**
- `Organization` - Multi-tenancy root
- `User` - Authenticated users
- `Project` - Research projects (one per user initially)
- `Episode` - Weekly generated content
- `TokenUsage` - Critical cost tracking
- `Feedback` - Simple ratings and text

**Ready but Unused (for future):**
- `Block` - Structured content blocks
- `BlockEmbedding` - Vector search ready
- `ChatSession` - Chat interface ready
- `Memory` - Personalization system

### 2. AI Integration Layer

**Two AI Services:**

1. **GPT-5 for Conversational UI**
   ```typescript
   // Project creation conversation
   const response = await openai.chat.completions.create({
     model: "gpt-5-latest",
     messages: conversation,
     instructions: systemPrompt, // Meta-guidance
     input: userMessages        // Actual conversation
   });
   ```

2. **Claude for Episode Generation**
   ```typescript
   // Episode content generation with cost tracking
   const episode = await generateWithCostTracking({
     model: "claude-3-5-sonnet",
     prompt: episodePrompt,
     maxTokens: 4000,
     organizationId: project.organizationId
   });
   ```

### 3. Application Layer (T3 Stack)

**Route Structure:**
```
app/
├── (auth)/
│   ├── sign-in/
│   └── sign-up/
├── (dashboard)/
│   ├── projects/
│   │   ├── page.tsx          # Project list
│   │   └── new/
│   │       └── page.tsx       # Conversational UI
│   └── episodes/
│       └── [id]/
│           └── page.tsx       # Reading experience
├── api/
│   ├── projects/
│   │   └── create/           # Project creation
│   ├── episodes/
│   │   └── generate/         # Episode generation
│   └── cron/
│       └── weekly-episodes/  # Scheduled generation
└── admin/
    └── page.tsx              # Admin dashboard
```

### 4. Background Jobs

**Weekly Episode Generation (Vercel Cron):**
```typescript
// app/api/cron/weekly-episodes/route.ts
export async function GET() {
  const projects = await getActiveProjects();
  
  for (const project of projects) {
    if (await canGenerate(project.organizationId)) {
      await generateEpisode(project);
      await notifyUser(project.userId);
    }
  }
}
```

## Data Flow

### Project Creation Flow
```
User → Conversational UI → GPT-5 → Project Brief → Database
```

### Episode Generation Flow  
```
Cron Job → Check Limits → Claude API → Track Tokens → Save Episode → Email User
```

### Feedback Flow
```
User Rates Block → Store Feedback → Influence Next Episode
```

## Security & Privacy

### Row-Level Security (RLS)
```sql
-- Every table has org-based RLS
CREATE POLICY "Users can only see their org's data"
ON projects FOR ALL
USING (organization_id = current_user_organization_id());
```

### API Security
```typescript
// Every API route checks org membership
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  // Proceed with org-scoped operations
}
```

## Performance Considerations

### For MVP (Simple is Fast)
- No vector embeddings (expensive, slow)
- PostgreSQL full-text search if needed
- Markdown storage instead of complex blocks
- Server-side rendering for episodes

### Future Optimizations (When Validated)
- Add Redis for session caching
- Implement vector search with pgvector
- Stream episode content for faster perceived load
- Edge caching for read-heavy content

## External Services

### Required for MVP
1. **Supabase** - PostgreSQL database
2. **Clerk** - Authentication (with organizations)
3. **OpenAI** - GPT-5 for conversations
4. **Anthropic** - Claude for episodes
5. **Stripe** - Payments
6. **Resend** - Email notifications
7. **Vercel** - Hosting and cron jobs

### Optional Enhancements
- Sentry - Error tracking
- Vercel Analytics - Usage metrics
- PostHog - Product analytics (if not problematic)

## Migration Notes from next-forge

### What to Keep
1. Database schema (complete, well-designed)
2. Conversational UI logic (working GPT-5 flow)
3. Security patterns (RLS, org scoping)
4. Cost tracking approach

### What to Simplify
1. Remove monorepo complexity → single Next.js app
2. Remove unused packages → only what's needed
3. Simplify build pipeline → standard T3 approach
4. Direct implementations → no abstraction layers

### What to Avoid
1. Complex caching strategies (until needed)
2. Microservices architecture (monolith first)
3. Real-time features (polling is fine)
4. Advanced personalization (simple feedback first)

## Critical Implementation Order

1. **Day 1-2: Foundation**
   - T3 setup with Clerk auth
   - Database connection and schema
   - Basic project CRUD

2. **Day 3-4: Core Loop**
   - Port conversational UI
   - Implement episode generation
   - Add cost tracking

3. **Day 5-6: User Experience**
   - Episode reading interface
   - Feedback collection
   - Email notifications

4. **Day 7-8: Monetization**
   - Stripe integration
   - Paywall after episode 1
   - Admin dashboard

5. **Day 9-10: Polish & Launch**
   - Error handling
   - Performance optimization
   - Deploy to production

---

*Next Document: [03-core-features-implementation.md](./03-core-features-implementation.md)*