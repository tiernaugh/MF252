# Dynamic Rendering Strategy

**Created:** 2025-01-16  
**Status:** Current implementation uses `force-dynamic` for simplicity  
**Future:** Revisit after user growth beyond 100 users  

## Current Situation

### The Build Error We Faced
When deploying to Vercel, Next.js attempts to pre-render pages at build time. Since the database isn't available during the build process on Vercel's servers, pages that fetch data fail with:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

### Our Current Solution
Added `export const dynamic = 'force-dynamic'` to all dashboard pages that fetch data:
- `/projects/page.tsx`
- `/projects/[id]/page.tsx`
- `/episodes/[id]/page.tsx`
- `/projects/[id]/settings/page.tsx`

This forces Next.js to render these pages at request time instead of build time.

## Why Clerk Won't Fix This

**Common misconception:** Adding authentication will solve the build error.

**Reality:** 
- Clerk handles authentication, not database connections
- The build process still tries to pre-render pages before Clerk is even involved
- Even with Clerk, if a page fetches from the database during build, it will fail

## Trade-offs of Current Approach

### Pros ✅
- **Simple**: One line of code per page
- **Works immediately**: No complex setup
- **Reliable**: Never fails during build
- **Good enough for MVP**: Performance impact negligible for <100 users

### Cons ❌
- **No CDN caching**: Every request hits the origin server
- **Slightly slower**: ~200-300ms vs ~50ms for cached pages
- **Higher database load**: Every page view = database query
- **Not optimal for scale**: Would struggle with 1000+ concurrent users

## When to Revisit This

Consider optimization when:
- [ ] User base exceeds 100 active users
- [ ] Page load times become noticeably slow
- [ ] Database costs become significant
- [ ] You need to handle traffic spikes

## Future Optimization Options

### Option 1: Incremental Static Regeneration (ISR)
```typescript
// Instead of force-dynamic
export const revalidate = 60; // Revalidate every 60 seconds
```
- Pages cached for 60 seconds
- Background regeneration after expiry
- Best balance of performance and freshness

### Option 2: Partial Prerendering (Experimental)
```typescript
// Static shell with dynamic islands
export const experimental_ppr = true;
```
- Static layout with dynamic content areas
- Best of both worlds
- Requires React Suspense boundaries

### Option 3: Build-Time Resilience
```typescript
// Handle missing database gracefully
export async function getCurrentOrganization() {
  if (!process.env.DATABASE_URL) {
    return null; // Return null during build
  }
  // Normal query
}
```
- Allows static generation where possible
- Requires null handling in components

## Recommended Implementation Order (When Ready)

1. **Start with ISR on low-stakes pages**
   - Episode reader (content rarely changes)
   - Test with 5-minute cache

2. **Add build-time resilience**
   - Update server actions to handle missing DB
   - Add skeleton states for null data

3. **Implement smart caching**
   - Projects list: 60-second cache
   - Episodes: 5-minute cache
   - Settings: Always dynamic

4. **Add cache invalidation**
   - Use `revalidatePath()` after mutations
   - Clear specific caches on updates

## Current Implementation Files

All these files currently use `force-dynamic`:
```
src/app/(dashboard)/
├── projects/
│   ├── page.tsx                    # Projects list
│   ├── [id]/
│   │   ├── page.tsx                # Project detail
│   │   └── settings/
│   │       └── page.tsx            # Project settings
└── episodes/
    └── [id]/
        └── page.tsx                # Episode reader
```

## Decision Record

**Date:** 2025-01-16  
**Decision:** Keep `force-dynamic` for MVP  
**Rationale:** 
- Simplicity over premature optimization
- <100 users don't need CDN caching
- Can optimize when we have real usage data
- Development velocity is priority

**Review Date:** After reaching 50 active users or 3 months, whichever comes first.

---

## Quick Reference

### Current (Simple)
```typescript
export const dynamic = 'force-dynamic';
```

### Future (Optimized)
```typescript
export const revalidate = 60; // ISR with 60s cache
```

### Settings (Always Fresh)
```typescript
export const dynamic = 'force-dynamic'; // Keep this one
```