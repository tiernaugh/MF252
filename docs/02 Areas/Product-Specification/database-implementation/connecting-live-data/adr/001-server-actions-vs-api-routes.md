# ADR-001: Server Actions vs API Routes for Database Access

**Status:** Accepted  
**Date:** 2025-08-15  
**Decision Makers:** Development Team  

## Context

We need to connect our Next.js 15 application to the Supabase database. We have two primary patterns available:

1. **API Routes:** Traditional REST endpoints that return JSON
2. **Server Actions:** Next.js 15 feature for server-side functions

## Decision

We will use **Server Actions** for database access.

## Rationale

### Advantages of Server Actions

1. **Type Safety**
   - Full TypeScript types flow from database to UI
   - No manual type definitions for API responses
   - Drizzle ORM types automatically available

2. **Developer Experience**
   - No API route boilerplate
   - Direct function calls from components
   - Easier to refactor and maintain

3. **Performance**
   - No HTTP overhead for internal data fetching
   - Automatic request deduplication
   - Built-in caching with React

4. **Security**
   - Functions only run on server
   - No API endpoints exposed
   - Automatic CSRF protection

### Disadvantages Considered

1. **Vendor Lock-in**
   - Tied to Next.js framework
   - Mitigation: Can migrate to API routes if needed

2. **Learning Curve**
   - Newer pattern, less documentation
   - Mitigation: Well-documented in Next.js 15

3. **Testing**
   - Different testing approach needed
   - Mitigation: Can test as regular async functions

## Implementation

### Server Action Pattern
```typescript
// src/server/actions/projects.ts
"use server";

import { db } from "~/server/db";
import * as schema from "~/server/db/schema";

export async function getProjects(orgId: string) {
  return await db.select()
    .from(schema.projects)
    .where(eq(schema.projects.organizationId, orgId));
}
```

### Usage in Components
```typescript
// Server Component
import { getProjects } from "~/server/actions/projects";

export default async function ProjectsPage() {
  const projects = await getProjects(orgId);
  return <ProjectsList projects={projects} />;
}
```

### Alternative Considered (API Routes)
```typescript
// Would require:
// 1. API route file
// 2. Type definitions
// 3. Fetch logic
// 4. Error handling
// More code, more complexity
```

## Consequences

### Positive
- Faster development velocity
- Better type safety
- Simpler codebase
- Better performance

### Negative
- Next.js specific solution
- Different from traditional patterns
- Requires server components knowledge

### Neutral
- Team needs to learn Server Actions pattern
- Documentation needs to reflect this choice

## Review Date

Review this decision in 3 months (2025-05-15) after production usage.

## References

- [Next.js Server Actions Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Drizzle ORM with Server Actions](https://orm.drizzle.team/docs/rqb)
- [T3 Stack Recommendations](https://create.t3.gg/)