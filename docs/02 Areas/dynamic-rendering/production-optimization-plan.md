# Production Optimization Plan

**Status:** Future consideration  
**Prerequisites:** Clerk authentication implemented, 50+ active users  

## Comprehensive ISR Implementation Strategy

### Understanding the Cache Layers

```
User Request → CDN Cache → Next.js Cache → Database
                ↑             ↑              ↑
             (instant)    (60 seconds)   (on mutation)
```

### Page-by-Page Optimization Guide

#### 1. Projects List Page
**Current:** `force-dynamic`  
**Optimal:** ISR with 60-second revalidation  
**Why:** Balance between fresh project list and performance

```typescript
// src/app/(dashboard)/projects/page.tsx
export const revalidate = 60;

// Add stale data indicator
const { data, isStale } = await safeGetProjects();
```

#### 2. Project Detail Page  
**Current:** `force-dynamic`  
**Optimal:** ISR with 60-second revalidation  
**Why:** Project details change infrequently

```typescript
// src/app/(dashboard)/projects/[id]/page.tsx
export const revalidate = 60;

// Invalidate on settings change
await updateProjectSettings(id, settings);
revalidatePath(`/projects/${id}`);
```

#### 3. Episode Reader
**Current:** `force-dynamic`  
**Optimal:** ISR with 5-minute revalidation  
**Why:** Published episodes are immutable

```typescript
// src/app/(dashboard)/episodes/[id]/page.tsx
export const revalidate = 300; // 5 minutes

// Could even be static after publish
export const dynamicParams = true; // Generate on-demand
```

#### 4. Settings Page
**Current:** `force-dynamic`  
**Keep as:** `force-dynamic`  
**Why:** Users expect immediate feedback

```typescript
// src/app/(dashboard)/projects/[id]/settings/page.tsx
export const dynamic = 'force-dynamic'; // Keep real-time
```

### Database Failure Resilience

#### Pattern 1: Safe Query Wrapper
```typescript
// src/server/db/safe-query.ts
import { cache } from 'react';

export const safeDbQuery = cache(async function<T>(
  queryFn: () => Promise<T>,
  fallback: T,
  cacheKey: string
): Promise<{ data: T; isStale: boolean }> {
  try {
    const data = await queryFn();
    // Store in cache for fallback
    await kv.set(cacheKey, data, { ex: 3600 });
    return { data, isStale: false };
  } catch (error) {
    console.error(`DB query failed for ${cacheKey}:`, error);
    
    // Try to get cached version
    const cached = await kv.get<T>(cacheKey);
    if (cached) {
      return { data: cached, isStale: true };
    }
    
    // Last resort: return fallback
    return { data: fallback, isStale: true };
  }
});
```

#### Pattern 2: Build-Time Detection
```typescript
// src/server/actions/base.ts
export function isBuildTime(): boolean {
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    !process.env.DATABASE_URL ||
    process.env.NODE_ENV === 'production' && !globalThis.window
  );
}

export async function buildSafeQuery<T>(
  queryFn: () => Promise<T>,
  buildDefault: T
): Promise<T> {
  if (isBuildTime()) {
    return buildDefault;
  }
  return queryFn();
}
```

### Progressive Enhancement with Suspense

#### Loading States
```typescript
// src/app/(dashboard)/projects/loading.tsx
export default function ProjectsLoading() {
  return (
    <div className="animate-pulse space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-stone-200 rounded-lg" />
      ))}
    </div>
  );
}
```

#### Streaming with Suspense
```typescript
// src/app/(dashboard)/projects/page.tsx
import { Suspense } from 'react';

export default function ProjectsPage() {
  return (
    <>
      {/* Static shell renders immediately */}
      <PageHeader title="Your Projects" />
      
      {/* Dynamic content streams in */}
      <Suspense fallback={<ProjectsLoading />}>
        <ProjectsList />
      </Suspense>
    </>
  );
}
```

### Cache Invalidation Strategy

#### After Mutations
```typescript
// src/server/actions/projects.ts
export async function createProject(data: CreateProjectInput) {
  const project = await db.insert(projects).values(data);
  
  // Invalidate related caches
  revalidatePath('/projects'); // List page
  revalidateTag('projects'); // All project-related caches
  
  return project;
}
```

#### Tag-Based Invalidation
```typescript
// When fetching
export async function getProjects() {
  const { data } = await fetch(url, {
    next: { 
      revalidate: 60,
      tags: ['projects'] 
    }
  });
  return data;
}

// When mutating
revalidateTag('projects'); // Clears all tagged caches
```

### Monitoring & Metrics

#### Track Cache Performance
```typescript
// src/lib/metrics.ts
export async function trackCacheHit(
  page: string, 
  isHit: boolean, 
  isStale: boolean
) {
  await analytics.track({
    event: 'cache_performance',
    properties: {
      page,
      cache_hit: isHit,
      serving_stale: isStale,
      timestamp: new Date().toISOString()
    }
  });
}
```

#### Key Metrics to Monitor
- Cache hit rate (target: >80%)
- Stale data served (should be rare)
- Database connection failures
- Page load times (p50, p95, p99)
- Build times

### Implementation Checklist

#### Phase 1: Foundation (2 hours)
- [ ] Create safe query wrapper
- [ ] Add build-time detection
- [ ] Set up KV store for fallback cache
- [ ] Add error boundary components

#### Phase 2: Page Updates (1 hour)
- [ ] Update projects list with ISR
- [ ] Update project detail with ISR
- [ ] Update episode reader with longer cache
- [ ] Keep settings dynamic

#### Phase 3: Enhancement (1 hour)
- [ ] Add loading skeletons
- [ ] Implement Suspense boundaries
- [ ] Add stale data indicators
- [ ] Set up cache invalidation

#### Phase 4: Monitoring (30 mins)
- [ ] Add performance tracking
- [ ] Set up error alerting
- [ ] Create cache hit dashboard
- [ ] Document cache strategy

### Testing Strategy

#### Local Testing
```bash
# Test build without database
unset DATABASE_URL && pnpm build

# Test with slow database
DATABASE_URL="postgresql://slow..." pnpm build

# Test cache invalidation
pnpm dev
# Create project → Check if list updates
```

#### Production Testing
1. Deploy with one page using ISR
2. Monitor metrics for 24 hours
3. Gradually roll out to other pages
4. A/B test cache times

### Rollback Plan

If issues arise:
```typescript
// Quick rollback: add to all pages
export const dynamic = 'force-dynamic';
```

Then investigate and fix issues before re-enabling ISR.

## Cost-Benefit Analysis

### Current (force-dynamic)
- **Database queries/day**: 1000 users × 10 pages = 10,000
- **Avg response time**: 200-300ms
- **Database cost**: ~$50/month at scale

### Optimized (ISR)
- **Database queries/day**: 10,000 / 60 = ~167 
- **Avg response time**: 50ms (cached)
- **Database cost**: ~$5/month at scale
- **Additional cost**: KV store ~$5/month

### ROI
- 60x reduction in database queries
- 4-6x faster page loads
- $40/month cost savings at scale
- Better user experience

## Decision Matrix

| Factor | Current | ISR | Winner |
|--------|---------|-----|--------|
| Simplicity | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Current |
| Performance | ⭐⭐ | ⭐⭐⭐⭐⭐ | ISR |
| Cost at Scale | ⭐⭐ | ⭐⭐⭐⭐⭐ | ISR |
| Resilience | ⭐⭐ | ⭐⭐⭐⭐ | ISR |
| Dev Time | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Current |

**Recommendation**: Stick with current approach until you have 50+ active users or performance becomes an issue.

---

**Last Updated:** 2025-01-16  
**Review Date:** When reaching 50 users or in 3 months