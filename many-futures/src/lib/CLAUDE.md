# Library Functions Context

## Mock Data Rules

### Organization Structure
```typescript
// Every entity MUST have organizationId
interface Project {
  organizationId: string; // Required
  // ...
}

// Personal orgs created on signup
const personalOrg = {
  id: `org_${userId}`,
  name: `${userName}'s Workspace`,
  slug: userName.toLowerCase(),
  isPersonal: true
};
```

### Project Status Logic
```typescript
// Active projects MUST have nextScheduledAt
if (!project.isPaused && !project.nextScheduledAt) {
  throw new Error("Invalid state: active project without schedule");
}

// Paused projects CAN'T generate episodes
if (project.isPaused) {
  return { canGenerate: false };
}
```

### Episode States
```typescript
type EpisodeStatus = 
  | "DRAFT"      // Created, awaiting generation
  | "GENERATING" // n8n workflow running
  | "PUBLISHED"  // Successfully generated
  | "FAILED";    // Generation failed

// Only PUBLISHED episodes count toward limits
const publishedCount = episodes.filter(e => e.status === "PUBLISHED").length;
```

### Content Storage
```typescript
// Episodes use Markdown with inline sources
const content = `
## The Future of Work

According to [McKinsey's latest report](https://example.com), 
automation will affect 30% of activities...

**Key insight**: The shift is happening faster than expected.
`;

// Sources tracked separately for analytics
const sources = [
  {
    title: "McKinsey Global Institute Report",
    url: "https://example.com",
    credibilityScore: 0.9
  }
];
```

### Token Usage Tracking
```typescript
// EVERY AI call must track usage
interface TokenUsage {
  organizationId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalCost: number; // In dollars
  timestamp: Date;
}

// Enforce limits
const dailyUsage = await getTodayUsage(orgId);
if (dailyUsage > 50) {
  throw new Error("Daily limit exceeded");
}
```

### Date Helpers
```typescript
// Format dates consistently
export const formatDate = (date: Date | null) => {
  if (!date) return "Not scheduled";
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short',
    year: 'numeric'
  });
};

// Check if content is new
export const isNew = (date: Date) => {
  const days = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return days <= 7;
};
```

### Mock Data Patterns
```typescript
// Use realistic data that tests edge cases
const mockProjects = [
  activeProjectWithEpisodes,    // Happy path
  pausedProjectNoSchedule,      // Paused state
  newProjectNoEpisodes,         // Empty state
  projectWithFailedGeneration,  // Error state
];

// Include upcoming episodes for preview
const upcomingEpisode = {
  scheduledAt: addDays(new Date(), 3),
  previewQuestions: [
    "How will quantum computing affect encryption?",
    "What new security paradigms are emerging?"
  ],
  influenceDeadline: addDays(new Date(), 2)
};
```

### Utility Functions
```typescript
// Project initials for avatars
export const getProjectInitials = (title: string) => {
  return title
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

// Reading time calculation
export const calculateReadingTime = (content: string) => {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};
```

### Common Mistakes
1. Creating active projects without nextScheduledAt
2. Forgetting organizationId on new entities
3. Not tracking token usage for AI calls
4. Using complex block storage instead of Markdown
5. Showing draft episodes as published

### Testing Checklist
- [ ] All projects have organizationId
- [ ] Active projects have nextScheduledAt
- [ ] Paused projects have no nextScheduledAt
- [ ] Episodes have proper status flow
- [ ] Token usage is tracked
- [ ] Dates format consistently