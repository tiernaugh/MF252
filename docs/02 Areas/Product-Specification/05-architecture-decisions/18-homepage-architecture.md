# ADR-018: Homepage Architecture

## Date
2025-08-13

## Status
Accepted

## Context

The homepage is the primary landing experience after authentication. It needs to:
1. Load quickly with server-rendered content
2. Show personalized project data
3. Handle empty states gracefully
4. Scale to handle multiple projects efficiently
5. Maintain security boundaries (organization-scoped data)

## Decision

Implement a server-first architecture using Next.js App Router's Server Components for data fetching and initial rendering, with minimal client-side JavaScript for interactions.

### Architecture Approach

```typescript
// Server Component (page.tsx)
async function HomePage() {
  // 1. Get auth context
  const { userId, orgId } = await auth();
  
  // 2. Fetch data server-side
  const projects = await getProjectsForOrganization(orgId);
  
  // 3. Render based on data
  return projects.length > 0 
    ? <ProjectList projects={projects} />
    : <EmptyState />;
}
```

### Data Fetching Strategy

1. **Server-Side Data Fetching**
   - Use Prisma client directly in Server Components
   - No API routes needed for initial load
   - Type-safe queries with full TypeScript support

2. **Query Optimization**
   ```typescript
   const projects = await database.project.findMany({
     where: {
       organizationId: orgId,
       deletedAt: null
     },
     select: {
       id: true,
       name: true,
       description: true,
       status: true,
       createdAt: true,
       _count: {
         select: { episodes: true }
       }
     },
     orderBy: { createdAt: 'desc' },
     take: 20 // Pagination for performance
   });
   ```

3. **Caching Strategy**
   - Next.js automatic request memoization
   - Database query results cached per request
   - Static generation where possible (future)

### Component Architecture

```
app/(authenticated)/
├── page.tsx                          # Server Component - data fetching
├── components/
│   └── homepage/
│       ├── project-list.tsx         # Server Component - layout
│       ├── project-card.tsx         # Server Component - display
│       ├── empty-state.tsx          # Server Component - static
│       └── create-project-button.tsx # Client Component - interaction
└── lib/
    └── data/
        └── projects.ts               # Data access layer
```

### State Management

1. **No Client State for MVP**
   - All data fetched server-side
   - Page refreshes for updates
   - URL state for future filters

2. **Future Client State**
   - Optimistic updates for actions
   - Client-side filtering/sorting
   - Real-time updates via websockets

### Performance Optimizations

1. **Initial Load Performance**
   - Target: < 100ms server processing
   - Target: < 1s Time to Interactive
   - Streaming SSR for progressive rendering

2. **Database Query Performance**
   ```sql
   -- Optimized index for homepage query
   CREATE INDEX idx_projects_homepage 
   ON projects (organization_id, deleted_at, created_at DESC)
   WHERE deleted_at IS NULL;
   ```

3. **Bundle Size**
   - Minimal JavaScript (< 50KB for homepage)
   - Code splitting for create project flow
   - Lazy load non-critical components

### Security Considerations

1. **Data Scoping**
   - All queries filtered by organizationId
   - No cross-organization data leakage
   - Auth checks at data layer

2. **Rate Limiting**
   - Homepage requests rate-limited per user
   - Database connection pooling
   - Query result caching

## Implementation Details

### Data Access Layer

```typescript
// app/lib/data/projects.ts
export async function getProjectsForOrganization(
  organizationId: string,
  limit = 20
) {
  return database.project.findMany({
    where: {
      organizationId,
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { episodes: true }
      },
      episodes: {
        select: {
          publishedAt: true
        },
        orderBy: { publishedAt: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}
```

### Error Handling

```typescript
// Graceful error handling
try {
  const projects = await getProjectsForOrganization(orgId);
  return <ProjectList projects={projects} />;
} catch (error) {
  logger.error('Failed to load projects', { error, orgId });
  return <ErrorState retry />;
}
```

### Monitoring

- Track page load times
- Monitor database query performance  
- Alert on error rates > 1%
- Track empty state conversion

## Consequences

### Positive

1. **Fast Initial Load** - Server rendering provides instant content
2. **SEO Friendly** - Full HTML on first load (if needed)
3. **Type Safety** - End-to-end TypeScript with Prisma
4. **Simple Architecture** - No complex state management
5. **Progressive Enhancement** - Works without JavaScript

### Negative

1. **Full Page Refreshes** - Updates require page reload (MVP acceptable)
2. **No Real-Time Updates** - Users must refresh for new data
3. **Limited Interactivity** - Client features require additional work

### Neutral

1. **Server Load** - Each request hits database (mitigated by caching)
2. **Development Complexity** - Server/Client component boundaries
3. **Testing Strategy** - Need both unit and integration tests

## Alternatives Considered

### 1. Client-Side SPA
- **Pros:** Rich interactivity, real-time updates
- **Cons:** Slower initial load, complex state management
- **Rejected:** Over-engineered for MVP needs

### 2. Static Generation
- **Pros:** Fastest possible load times
- **Cons:** Can't show personalized data
- **Rejected:** Homepage requires user-specific content

### 3. Hybrid (ISR)
- **Pros:** Balance of static and dynamic
- **Cons:** Complex caching logic
- **Deferred:** Consider for future optimization

## Migration Path

### Phase 1 (Current)
- Server-rendered homepage
- Basic project list
- Simple create action

### Phase 2
- Add client-side filtering
- Optimistic updates
- Inline editing

### Phase 3
- Real-time updates
- Advanced interactions
- Personalization

## References

- [Homepage PRD](../homepage-prd.md)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Database Schema ADR](./15-database-schema-final.md)
- [Projects Summary API](./08-home-summary-and-homepage.md)