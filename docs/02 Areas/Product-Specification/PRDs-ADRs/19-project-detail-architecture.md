# ADR-019: Project Detail Page Architecture

**Status:** Accepted
**Date:** 2025-08-13
**Deciders:** Product, Engineering

## Context

The project detail page is the most visited page after authentication. It needs to load quickly, handle real-time updates elegantly, and maintain state across navigation.

## Decision

Implement a hybrid SSR/client approach with:
1. Server-side data fetching for initial load
2. Client-side search and filtering
3. Optimistic UI for activity indicators
4. React Query for data synchronization

## Consequences

### Positive
- Fast initial load with SSR
- Smooth interactions without full reloads
- Real-time updates for episode status
- Offline-capable with cached data

### Negative
- More complex state management
- Need to handle SSR/client hydration
- Cache invalidation complexity

## Implementation Details

### Data Fetching Strategy

```typescript
// Server Component (page.tsx)
async function ProjectDetailPage({ params }) {
  // Parallel fetch for performance
  const [project, episodes, upcoming] = await Promise.all([
    getProject(params.id),
    getEpisodes(params.id),
    getUpcomingEpisode(params.id)
  ]);
  
  return <ProjectDetailClient {...} />;
}

// Client Component (for interactivity)
function ProjectDetailClient({ project, episodes, upcoming }) {
  // Local state for search/filter
  const [searchQuery, setSearchQuery] = useState('');
  
  // Activity indicators from localStorage
  const activityState = useActivityTracking(episodes);
  
  // Real-time updates via React Query
  const { data: liveUpcoming } = useQuery({
    queryKey: ['upcoming', project.id],
    queryFn: () => getUpcomingEpisode(project.id),
    refetchInterval: 30000, // Poll every 30s
  });
}
```

### Activity Tracking

```typescript
// Track "new" and "read" status locally
interface ActivityState {
  lastVisit: Date;
  readEpisodes: Set<string>;
  lastKnownEpisodeCount: number;
}

// Persist to localStorage
const ACTIVITY_KEY = 'episode-activity';

function useActivityTracking(episodes: Episode[]) {
  const [activity, setActivity] = useLocalStorage<ActivityState>(
    ACTIVITY_KEY,
    {
      lastVisit: new Date(),
      readEpisodes: new Set(),
      lastKnownEpisodeCount: 0
    }
  );
  
  // Calculate new episodes since last visit
  const newEpisodes = episodes.filter(
    e => new Date(e.publishedAt) > activity.lastVisit
  );
  
  // Mark episodes as new/unread
  return episodes.map(e => ({
    ...e,
    isNew: newEpisodes.includes(e),
    isRead: activity.readEpisodes.has(e.id)
  }));
}
```

### Performance Optimizations

1. **Image Loading**: Lazy load project avatars
2. **Search Debouncing**: 300ms delay on search input
3. **Virtual Scrolling**: For projects with 50+ episodes
4. **Partial Hydration**: Only hydrate interactive components

### State Management

```typescript
// Zustand store for project detail state
interface ProjectDetailStore {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  
  expandedSections: Set<string>;
  toggleSection: (section: string) => void;
  
  // Episode interaction tracking
  markEpisodeRead: (episodeId: string) => void;
  clearNewIndicators: () => void;
}
```

### Error Boundaries

```typescript
// Graceful degradation for failures
<ErrorBoundary fallback={<ProjectDetailError />}>
  <Suspense fallback={<ProjectDetailSkeleton />}>
    <ProjectDetailContent />
  </Suspense>
</ErrorBoundary>
```

## Alternatives Considered

1. **Full Client-Side**: Rejected due to SEO and initial load performance
2. **Full SSR**: Rejected due to poor search/filter UX
3. **ISR**: Considered for future when episode cadence is predictable

## References

- Homepage PRD and architecture
- Episode reader architecture
- Many Futures design system