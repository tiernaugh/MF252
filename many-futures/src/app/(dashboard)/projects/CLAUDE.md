# Projects UI Context & Troubleshooting

## Data Access Patterns

### Organization Scoping (CRITICAL)
```typescript
// ALWAYS filter by organizationId
const projects = await db.query.projects.findMany({
  where: eq(projects.organizationId, currentOrgId),
  orderBy: [desc(projects.updatedAt)]
});

// Include in all queries
const episodes = await db.query.episodes.findMany({
  where: and(
    eq(episodes.organizationId, currentOrgId),
    eq(episodes.projectId, projectId)
  )
});
```

### Project Status Logic
```typescript
// Active projects MUST have nextScheduledAt
const isActive = (project: Project) => 
  project.status === 'ACTIVE' && 
  project.nextScheduledAt && 
  project.nextScheduledAt > new Date();

// Paused projects can't generate episodes
const canGenerate = (project: Project) => 
  project.status === 'ACTIVE' && 
  !project.isPaused;
```

## Common Issues & Debug Patterns

### Brief Not Displaying After Creation

**Symptoms:**
- Conversation completes successfully
- `BRIEF_GENERATION:` signal received in network tab
- BriefCanvas component doesn't render or shows "Brief content not found"

**Debug Steps:**
1. **Check API Response Structure**
```bash
# In browser dev tools, check network tab
POST /api/project-conversation
Response: BRIEF_GENERATION:{"title":"...","brief":"..."}
```

2. **Verify Client Parsing**
```typescript
// In useProjectConversation.ts, add debug logging:
if (chunk.startsWith('BRIEF_GENERATION:')) {
  const briefData = chunk.substring('BRIEF_GENERATION:'.length).trim();
  console.log('Raw brief data:', briefData);
  
  try {
    const brief = JSON.parse(briefData);
    console.log('Parsed brief:', brief);
    console.log('Brief properties:', Object.keys(brief));
  } catch (e) {
    console.error('JSON parse error:', e);
  }
}
```

3. **Check Component Props**
```typescript
// In page.tsx, add debug logging:
{projectBrief && (
  <>
    {console.log('Rendering BriefCanvas with:', { 
      title: projectBrief.title, 
      brief: projectBrief.brief,
      fullObject: projectBrief,
      hasTitle: !!projectBrief.title,
      hasBrief: !!projectBrief.brief
    })}
    <BriefCanvas {...props} />
  </>
)}
```

**Common Causes:**
- API returns `content` instead of `brief` property
- Client expects `brief` but receives different property name
- JSON parsing fails due to malformed server response
- Component renders before state is fully updated

### Brief Click-to-Edit Not Working

**Symptoms:**
- Brief renders correctly
- Clicking on brief doesn't enable editing
- No visual feedback on hover
- Content remains read-only

**Debug Steps:**
1. **Check BriefCanvas Implementation**
```typescript
// Verify click handler is attached
<div 
  onClick={handleClick}  // Ensure this exists
  className={`cursor-pointer hover:bg-stone-50`}  // Verify hover styles
>
```

2. **Test Click Handler**
```typescript
const handleClick = () => {
  console.log('Brief clicked!'); // Debug log
  setIsEditing(true);
  // ... rest of implementation
};
```

3. **Check ContentEditable State**
```typescript
// Verify state transitions
useEffect(() => {
  console.log('Editing state changed:', isEditing);
}, [isEditing]);
```

**Common Causes:**
- Click handler not properly attached
- CSS preventing click events (`pointer-events: none`)
- Component re-rendering and losing focus
- `contentEditable` not properly toggling

### Scrolling Issues

**Symptoms:**
- New messages don't auto-scroll to bottom
- User has to manually scroll during conversation
- Input field gets cut off on mobile

**Debug Steps:**
1. **Verify Scroll Reference**
```typescript
const messagesEndRef = useRef<HTMLDivElement>(null);

// Check if ref is attached
useEffect(() => {
  console.log('Scroll ref:', messagesEndRef.current);
}, []);
```

2. **Test Scroll Trigger**
```typescript
useEffect(() => {
  console.log('Scroll triggered:', { 
    messagesCount: messages.length, 
    isLoading, 
    phase 
  });
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages, isLoading, phase]);
```

**Common Fixes:**
- Add bottom padding: `className="pb-20"`
- Ensure scroll target is after all content
- Check for CSS overflow issues

### Input Clearing Issues

**Symptoms:**
- Input doesn't clear immediately after submit
- Old text remains visible during API call
- Multiple submissions possible

**Debug Steps:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log('Submit with input:', input); // Debug current input
  
  const message = input.trim();
  console.log('Clearing input...'); // Debug clear timing
  setInput(""); // Should happen immediately
  
  console.log('Sending message:', message);
  await sendMessage(message);
};
```

**Common Causes:**
- Clearing input after async operation instead of before
- Form submit handler not preventing default
- State not updating immediately

### Focus Management Issues

**Symptoms:**
- Input doesn't auto-focus after responses
- Focus lost during conversation
- Keyboard navigation broken

**Debug Steps:**
```typescript
const inputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  console.log('Focus effect triggered:', {
    phase,
    isLoading,
    hasInput: !!inputRef.current,
    shouldFocus: phase !== 'brief_generated' && !isLoading
  });
  
  if (phase !== 'brief_generated' && !isLoading && inputRef.current) {
    inputRef.current.focus();
  }
}, [phase, isLoading, messages]);
```

## UI Patterns (Established)

### Project Cards
```typescript
// Consistent hover effects
<Card className="bg-white border border-stone-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">

// Status dots (not badges)
<div className={`w-3 h-3 rounded-full ${
  project.status === 'ACTIVE' ? 'bg-green-500' : 'bg-stone-300'
}`} />

// Typography hierarchy
<h3 className="font-serif text-2xl font-semibold text-stone-900 mb-3">
<p className="text-base text-stone-600 leading-relaxed">
```

### Navigation Context
```typescript
// Projects page uses full navigation
// Episode readers use minimal navigation
// Context determined by pathname in layout.tsx

const isFullNav = pathname === '/projects' || pathname === '/dashboard';
```

### Loading States
```typescript
// Consistent loading patterns
{isLoading ? (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-stone-200 rounded w-3/4"></div>
    <div className="h-4 bg-stone-200 rounded w-1/2"></div>
  </div>
) : (
  <ActualContent />
)}
```

## Performance Considerations

### Client-Side Caching
```typescript
// Cache project list to avoid repeated fetches
const [cachedProjects, setCachedProjects] = useState<Project[]>([]);

// Prefetch episodes with projects
const projectsWithEpisodes = await Promise.all(
  projects.map(async project => ({
    ...project,
    episodes: await getRecentEpisodes(project.id)
  }))
);
```

### Optimistic Updates
```typescript
// Update UI immediately, sync with server
const handleStatusChange = async (projectId: string, status: ProjectStatus) => {
  // Optimistic update
  setProjects(prev => prev.map(p => 
    p.id === projectId ? { ...p, status } : p
  ));
  
  try {
    await updateProjectStatus(projectId, status);
  } catch (error) {
    // Revert on failure
    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, status: originalStatus } : p
    ));
  }
};
```

## Mobile Responsiveness

### Conversation Layout
```typescript
// Responsive text sizing
className="font-serif text-xl md:text-2xl text-stone-900 leading-relaxed"

// Responsive padding
className="px-4 md:px-8"

// Bottom safe area
className="pb-safe-bottom pb-20"
```

### Touch Targets
```typescript
// Minimum 44px touch targets
className="min-h-[44px] min-w-[44px] p-3"

// Adequate spacing between interactive elements
className="space-y-4"
```

## Error Recovery

### Graceful Fallbacks
```typescript
// Handle missing project data
const project = projects.find(p => p.id === id);
if (!project) {
  return <ProjectNotFound />;
}

// Handle missing episodes
const episodes = project.episodes ?? [];
if (episodes.length === 0) {
  return <EmptyEpisodesState />;
}
```

### Retry Patterns
```typescript
const [retryCount, setRetryCount] = useState(0);
const MAX_RETRIES = 3;

const handleRetry = async () => {
  if (retryCount < MAX_RETRIES) {
    setRetryCount(prev => prev + 1);
    await refetchData();
  }
};
```

## Related Files
- `/src/app/(dashboard)/projects/page.tsx` - Projects list implementation
- `/src/app/(dashboard)/projects/new/page.tsx` - Conversation UI
- `/src/app/(dashboard)/projects/[id]/page.tsx` - Project detail
- `/src/hooks/useProjectConversation.ts` - State management
- `/src/components/project/BriefCanvas.tsx` - Brief editing