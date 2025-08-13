# Database Schema and Security Guide

## Overview
The database schema is comprehensive and future-proof, designed to support both the lean MVP and eventual full vision. We create all tables upfront to avoid painful migrations later, but only use what's needed initially.

## Core Schema Design Principles

### 1. Organization-Based Multi-Tenancy
Every piece of data belongs to an organization. Users get a personal org by default.

```prisma
model Organization {
  id         String           @id @default(cuid())
  name       String
  clerkOrgId String?          @unique // Links to Clerk
  type       OrganizationType @default(PERSONAL)
  ownerId    String
  
  // All data hangs off organizations
  projects Project[]
  // ... other relations
}
```

### 2. Soft Deletes for Compliance
GDPR and data recovery requirements:

```prisma
model User {
  deletedAt DateTime? // Soft delete timestamp
  deletedBy String?   // Audit trail
}
```

### 3. Denormalized Performance Fields
Avoid expensive joins:

```prisma
model Episode {
  highlightCount   Int @default(0) // Counter cache
  chatMessageCount Int @default(0) // Counter cache
  readingMinutes   Int? // Pre-calculated
}
```

## Tables for MVP (Actually Used)

### 1. User & Organization
```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  clerkId   String    @unique // Auth provider ID
  
  organizationMembers OrganizationMember[]
  ownedOrganizations  Organization[]
}

model Organization {
  id         String @id @default(cuid())
  name       String
  clerkOrgId String? @unique
  type       OrganizationType @default(PERSONAL)
  ownerId    String
  
  projects Project[]
}
```

### 2. Project (Research Context)
```prisma
model Project {
  id             String @id @default(cuid())
  organizationId String // CRITICAL: Scoping
  title          String
  description    String?
  
  // From conversational UI
  onboardingBrief Json? // Stores full context
  
  // Scheduling
  cadenceType     CadenceType @default(WEEKLY)
  nextScheduledAt DateTime?
  isPaused        Boolean @default(false)
  
  episodes Episode[]
}
```

### 3. Episode (Weekly Content)
```prisma
model Episode {
  id        String @id @default(cuid())
  projectId String
  title     String
  summary   String?
  sequence  Int // Episode number (1, 2, 3...)
  
  // For MVP: Store as markdown
  content   String? @db.Text // Add this field
  
  status      EpisodeStatus @default(DRAFT)
  publishedAt DateTime?
  
  // Relations
  project Project @relation(...)
  feedback Feedback[]
}
```

### 4. TokenUsage (Cost Control) - CRITICAL
```prisma
model TokenUsage {
  id             String @id @default(cuid())
  organizationId String
  projectId      String?
  episodeId      String?
  
  provider       String // 'OPENAI' | 'ANTHROPIC'
  model          String // 'gpt-5' | 'claude-3-5-sonnet'
  
  promptTokens      Int
  completionTokens  Int
  totalTokens       Int
  estimatedCost     Float // In pounds
  
  purpose        String? // 'conversation' | 'episode_generation'
  createdAt      DateTime @default(now())
  
  @@index([organizationId, createdAt]) // For daily limits
}
```

### 5. Feedback (Simple for MVP)
```prisma
model Feedback {
  id        String @id @default(cuid())
  episodeId String
  userId    String
  
  rating    Int? // 1-5 stars
  comment   String? @db.Text
  metadata  Json? // Reading time, scroll depth, etc
  
  createdAt DateTime @default(now())
  
  @@unique([episodeId, userId]) // One per user per episode
}
```

### 6. Subscription (Payments)
```prisma
model Subscription {
  id             String @id @default(cuid())
  userId         String
  organizationId String
  
  stripeCustomerId     String?
  stripeSubscriptionId String?
  stripePriceId        String?
  
  status    SubscriptionStatus // 'TRIAL' | 'ACTIVE' | 'CANCELLED'
  currentPeriodEnd DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Tables Created but Unused (Future-Proof)

These exist in the schema but aren't used in MVP:

```prisma
// Ready for chat feature
model ChatSession {
  id        String @id @default(cuid())
  projectId String
  episodeId String?
  // ... full schema ready
}

// Ready for structured content
model Block {
  id        String @id @default(cuid())
  episodeId String
  type      BlockType
  content   Json
  // ... full schema ready
}

// Ready for vector search
model BlockEmbedding {
  id        String @id @default(cuid())
  blockId   String
  embedding Json // Will be vector(1536)
  // ... full schema ready
}
```

## Security Implementation

### 1. Row-Level Security (RLS) in Supabase

```sql
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Projects: Users see only their org's projects
CREATE POLICY "Users can view own org projects" ON projects
  FOR SELECT
  USING (organization_id = auth.jwt() ->> 'organizationId');

-- Episodes: Scoped through projects
CREATE POLICY "Users can view own org episodes" ON episodes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = episodes.project_id
      AND projects.organization_id = auth.jwt() ->> 'organizationId'
    )
  );

-- TokenUsage: Admin only
CREATE POLICY "Only admins can view token usage" ON token_usage
  FOR ALL
  USING (auth.jwt() ->> 'isAdmin' = 'true');
```

### 2. Application-Level Security

```typescript
// Every API route must check org membership
async function withOrgAuth(
  req: Request,
  handler: (session: Session) => Promise<Response>
) {
  const session = await auth();
  
  if (!session?.user?.organizationId) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  return handler(session);
}

// Usage in API routes
export async function POST(req: Request) {
  return withOrgAuth(req, async (session) => {
    // All queries automatically scoped
    const projects = await db.project.findMany({
      where: { 
        organizationId: session.user.organizationId 
      }
    });
    // ...
  });
}
```

### 3. Audit Logging

```prisma
model AuditLog {
  id        String @id @default(cuid())
  userId    String
  action    String // 'CREATE' | 'UPDATE' | 'DELETE'
  entity    String // 'project' | 'episode' | etc
  entityId  String
  metadata  Json? // Old/new values
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  
  @@index([userId, createdAt])
  @@index([entity, entityId])
}
```

## Migration Strategy for T3

### 1. Initial Setup
```bash
# Install Prisma
npm install prisma @prisma/client

# Initialize with existing schema
npx prisma init

# Copy the comprehensive schema
# (Use the full schema from many-futures/packages/database/prisma/schema.prisma)

# Generate client
npx prisma generate

# Create migration
npx prisma migrate dev --name init
```

### 2. Supabase Connection
```env
# .env
DATABASE_URL="postgresql://[user]:[password]@[host]:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://[user]:[password]@[host]:5432/postgres"
```

### 3. Essential Indexes
```sql
-- Performance critical indexes
CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_episodes_project ON episodes(project_id);
CREATE INDEX idx_token_usage_daily ON token_usage(organization_id, created_at);
CREATE INDEX idx_feedback_episode ON feedback(episode_id);
```

## Data Access Patterns

### 1. Always Scope Queries
```typescript
// ✅ CORRECT: Always include organizationId
const episodes = await db.episode.findMany({
  where: {
    project: {
      organizationId: session.user.organizationId
    },
    status: 'PUBLISHED'
  }
});

// ❌ WRONG: Never query without scoping
const episodes = await db.episode.findMany({
  where: { status: 'PUBLISHED' }
});
```

### 2. Use Transactions for Related Operations
```typescript
// Episode generation with cost tracking
const episode = await db.$transaction(async (tx) => {
  // 1. Create episode
  const episode = await tx.episode.create({
    data: { /* ... */ }
  });
  
  // 2. Track tokens
  await tx.tokenUsage.create({
    data: {
      episodeId: episode.id,
      organizationId,
      totalTokens,
      estimatedCost
    }
  });
  
  // 3. Update project schedule
  await tx.project.update({
    where: { id: projectId },
    data: { 
      nextScheduledAt: addWeeks(new Date(), 1) 
    }
  });
  
  return episode;
});
```

### 3. Implement Cost Checks
```typescript
// Before any AI API call
async function checkDailyCostLimit(orgId: string): Promise<boolean> {
  const result = await db.tokenUsage.aggregate({
    where: {
      organizationId: orgId,
      createdAt: {
        gte: startOfDay(new Date())
      }
    },
    _sum: {
      estimatedCost: true
    }
  });
  
  const dailyCost = result._sum.estimatedCost || 0;
  return dailyCost < 50; // £50 daily limit
}
```

## Common Pitfalls to Avoid

1. **Never Skip Organization Scoping** - Every query must filter by org
2. **Don't Forget Cost Tracking** - Every AI call must log tokens
3. **Avoid N+1 Queries** - Use includes for relations
4. **Check Limits Before Generation** - Not after
5. **Use Transactions for Multi-Step Operations** - Maintain consistency

## Quick Reference

### Essential Tables for MVP
- `users` - Authentication
- `organizations` - Multi-tenancy
- `projects` - Research contexts
- `episodes` - Weekly content
- `token_usage` - Cost control (CRITICAL)
- `feedback` - User ratings
- `subscriptions` - Payments

### Can Ignore Initially
- `blocks` - Complex content structure
- `block_embeddings` - Vector search
- `chat_sessions` - Chat feature
- `highlights` - Text selection
- `memories` - Advanced personalization

---

*Next Document: [05-lessons-from-next-forge.md](./05-lessons-from-next-forge.md)*