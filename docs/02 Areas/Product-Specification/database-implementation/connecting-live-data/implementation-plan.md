# Implementation Plan: Connecting Live Data

## Executive Summary

Replace mock data with real database queries throughout the Many Futures platform, using Next.js 15 Server Actions pattern for type-safe database access.

## Goals

1. **Primary:** Connect all UI pages to real Supabase database
2. **Secondary:** Maintain type safety with Drizzle ORM
3. **Tertiary:** Prepare for Clerk authentication integration

## Technical Approach

### Architecture Pattern: Server Actions

We're using Next.js 15 Server Actions instead of API routes for database access:

```typescript
// Server Action (runs on server)
"use server";
export async function getProjects(orgId: string) {
  return await db.select().from(schema.projects)
    .where(eq(schema.projects.organizationId, orgId));
}

// Page Component (server component)
export default async function ProjectsPage() {
  const projects = await getProjects(testOrgId);
  return <ProjectsList projects={projects} />;
}
```

### Why Server Actions?

1. **Type Safety:** Full TypeScript types from database to UI
2. **Performance:** Direct database queries, no API overhead
3. **Security:** Runs only on server, no client exposure
4. **Simplicity:** No API route boilerplate

## Implementation Phases

### Phase 1: Server Actions Layer (4 hours)

#### 1.1 Create Base Structure
```
src/server/actions/
├── organizations.ts    # Organization queries
├── projects.ts         # Project CRUD operations
├── episodes.ts         # Episode queries
└── test-queries.ts     # Testing utilities
```

#### 1.2 Organization Actions
```typescript
// organizations.ts
export async function getCurrentOrganization() {
  // Hardcoded for now, will use Clerk later
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.name, "Test User's Workspace")
  });
  return org || throw new Error("Test org not found");
}
```

#### 1.3 Project Actions
```typescript
// projects.ts
export async function getProjectsByOrg(orgId: string) {
  const projects = await db.query.projects.findMany({
    where: eq(projects.organizationId, orgId),
    orderBy: [desc(projects.updatedAt)]
  });
  
  // Transform to match mock data structure
  return projects.map(transformProject);
}

export async function getProjectById(id: string) {
  return await db.query.projects.findFirst({
    where: eq(projects.id, id),
    with: {
      episodes: true,
      organization: true
    }
  });
}

export async function createProject(data: ProjectInput) {
  const [project] = await db.insert(projects)
    .values(data)
    .returning();
  return project;
}

export async function updateProjectSettings(
  id: string, 
  settings: ProjectSettings
) {
  const [updated] = await db.update(projects)
    .set(settings)
    .where(eq(projects.id, id))
    .returning();
  return updated;
}
```

#### 1.4 Episode Actions
```typescript
// episodes.ts
export async function getEpisodesByProject(projectId: string) {
  return await db.query.episodes.findMany({
    where: eq(episodes.projectId, projectId),
    orderBy: [desc(episodes.publishedAt)]
  });
}

export async function getEpisodeById(id: string) {
  const episode = await db.query.episodes.findFirst({
    where: eq(episodes.id, id),
    with: {
      project: true,
      blocks: true
    }
  });
  
  // Transform blocks to content
  if (episode?.blocks?.length) {
    episode.content = episode.blocks[0].content;
  }
  
  return episode;
}
```

### Phase 2: Update Pages (3 hours)

#### 2.1 Projects List Page

**File:** `/src/app/(dashboard)/projects/page.tsx`

Convert to server component with client-side filtering:

```typescript
// page.tsx - Server Component
import { getCurrentOrganization, getProjectsByOrg } from "~/server/actions";
import ProjectsList from "./projects-list";

export default async function ProjectsPage() {
  const org = await getCurrentOrganization();
  const projects = await getProjectsByOrg(org.id);
  
  return <ProjectsList initialProjects={projects} />;
}

// projects-list.tsx - Client Component
"use client";
export default function ProjectsList({ initialProjects }) {
  const [projects] = useState(initialProjects);
  // Existing filtering/sorting logic
}
```

#### 2.2 Project Detail Page

**File:** `/src/app/(dashboard)/projects/[id]/page.tsx`

```typescript
import { getProjectById, getEpisodesByProject } from "~/server/actions";

export default async function ProjectPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const project = await getProjectById(id);
  const episodes = await getEpisodesByProject(id);
  
  return <ProjectDetail project={project} episodes={episodes} />;
}
```

#### 2.3 Episode Reader

**File:** `/src/app/(dashboard)/episodes/[id]/page.tsx`

```typescript
import { getEpisodeById } from "~/server/actions/episodes";

export default async function EpisodePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const episode = await getEpisodeById(id);
  
  return <EpisodeReader episode={episode} />;
}
```

#### 2.4 Project Settings

**File:** `/src/app/(dashboard)/projects/[id]/settings/page.tsx`

Add server action for saving:

```typescript
// In page component
async function handleSave(settings: ProjectSettings) {
  "use server";
  await updateProjectSettings(projectId, settings);
  revalidatePath(`/projects/${projectId}`);
}
```

### Phase 3: Project Creation Flow (2 hours)

#### 3.1 Update Conversation API

**File:** `/src/app/api/project-conversation/route.ts`

Add database save on brief generation:

```typescript
// When brief is generated
if (shouldGenerateBrief) {
  const brief = generateBrief(messages);
  
  // Save to database
  const project = await createProject({
    organizationId: testOrgId,
    userId: testUserId,
    title: brief.title,
    onboardingBrief: {
      conversation: messages,
      ...brief
    },
    status: "ACTIVE",
    cadenceConfig: {
      mode: "weekly",
      days: [1, 4]
    }
  });
  
  // Return with project ID
  res.write(`BRIEF_GENERATION:${JSON.stringify({
    ...brief,
    projectId: project.id
  })}\n`);
}
```

#### 3.2 Update New Project Page

**File:** `/src/app/(dashboard)/projects/new/page.tsx`

Handle redirect to real project:

```typescript
// In useProjectConversation hook
if (chunk.startsWith('BRIEF_GENERATION:')) {
  const data = JSON.parse(chunk.substring(19));
  if (data.projectId) {
    router.push(`/projects/${data.projectId}`);
  }
}
```

### Phase 4: Testing & Validation (1 hour)

#### 4.1 Test Queries Script

Create test script to verify all queries work:

```typescript
// src/server/actions/test-queries.ts
async function testAllQueries() {
  console.log("Testing database queries...");
  
  // Test org
  const org = await getCurrentOrganization();
  console.log("✓ Organization:", org.name);
  
  // Test projects
  const projects = await getProjectsByOrg(org.id);
  console.log("✓ Projects:", projects.length);
  
  // Test episodes
  if (projects[0]) {
    const episodes = await getEpisodesByProject(projects[0].id);
    console.log("✓ Episodes:", episodes.length);
  }
}
```

#### 4.2 Manual Testing Checklist

- [ ] Projects list loads
- [ ] Project detail shows episodes
- [ ] Episode reader displays content
- [ ] Settings save and persist
- [ ] New project creates in database
- [ ] All TypeScript types work
- [ ] Build passes

## Data Transformation

### Mock Data → Database Schema Mapping

```typescript
// Transform database project to mock format
function transformProject(dbProject: DBProject): Project {
  return {
    id: dbProject.id,
    organizationId: dbProject.organizationId,
    title: dbProject.title,
    description: dbProject.onboardingBrief?.description || "",
    shortSummary: dbProject.onboardingBrief?.summary || "",
    onboardingBrief: dbProject.onboardingBrief,
    cadenceType: "WEEKLY", // Legacy field
    cadenceConfig: dbProject.cadenceConfig || {
      mode: "weekly",
      days: [1, 4]
    },
    nextScheduledAt: dbProject.nextScheduledAt,
    lastPublishedAt: dbProject.lastPublishedAt,
    isPaused: dbProject.status === "PAUSED",
    createdAt: dbProject.createdAt,
    updatedAt: dbProject.updatedAt
  };
}
```

## Risk Mitigation

### Potential Issues & Solutions

1. **Type Mismatches**
   - Solution: Transform functions for each entity
   - Fallback: Keep mock data types as intermediate

2. **Missing Data**
   - Solution: Provide sensible defaults
   - Fallback: Seed more test data

3. **Performance**
   - Solution: Use Drizzle's `with` for joins
   - Fallback: Separate queries if needed

4. **Build Errors**
   - Solution: Test incrementally
   - Fallback: Revert to mock data

## Success Metrics

- ✅ All pages load without errors
- ✅ Data persists across refreshes
- ✅ TypeScript build passes
- ✅ No console errors
- ✅ Performance comparable to mock data

## Timeline

- **Hour 1-2:** Create server actions
- **Hour 3-4:** Test server actions
- **Hour 5-6:** Update pages
- **Hour 7:** Connect project creation
- **Hour 8:** Testing & debugging
- **Hour 9-10:** Documentation & cleanup

Total: ~10 hours of focused work

## Next Steps After Completion

1. Add Clerk authentication
2. Implement RLS policies
3. Add error boundaries
4. Set up monitoring
5. Performance optimization

---

**Started:** 2025-08-15  
**Target Completion:** 2025-08-16  
**Dependencies:** Database must be seeded with test data