# Dashboard Pages Context

## Navigation Rules

### Context-Aware Navigation
The dashboard layout automatically determines navigation mode based on pathname:
- **Minimal nav** (auto-hides): `/episodes/*`, `/projects/[id]`
- **Full nav** (always visible): `/projects`, `/dashboard`, other list pages

### Page Patterns

#### List Pages (Projects, Episodes Index)
```tsx
// Structure
<div className="min-h-screen bg-white">
  {/* Page header with serif title */}
  <header className="border-b border-stone-200">
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="font-serif text-3xl md:text-4xl font-bold text-stone-900">
        Your Projects
      </h1>
    </div>
  </header>
  
  {/* Content area */}
  <div className="max-w-6xl mx-auto px-6 py-8">
    {/* Grid of cards */}
  </div>
</div>
```

#### Detail Pages (Episode Reader, Project Detail)
```tsx
// Three-zone layout
// Zone 1: Editorial Hero (centered)
<section className="max-w-3xl mx-auto px-8 py-16 text-center">
  <h1 className="font-serif text-4xl md:text-5xl font-bold">
    {title}
  </h1>
</section>

// Zone 2: Functional Content
<section className="max-w-6xl mx-auto px-6 py-8">
  {/* Lists, cards, etc */}
</section>

// Zone 3: Metadata (subtle)
<footer className="text-xs uppercase tracking-wider text-stone-500">
  {/* Timestamps, counts, etc */}
</footer>
```

### Data Access Patterns
```typescript
// Always scope to organization
const projects = await getProjectsByOrg(orgId);

// Active projects MUST have nextScheduledAt
if (!project.isPaused && !project.nextScheduledAt) {
  throw new Error("Active project missing schedule");
}

// Episodes are filtered by status
const published = episodes.filter(e => e.status === "PUBLISHED");
```

### Activity Tracking
```typescript
// Mark as new if < 7 days old
const isNew = (date: Date) => {
  const days = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return days <= 7;
};

// Future: Track read status in localStorage
const isRead = localStorage.getItem(`episode-${id}-read`);
```

### Common UI Elements

#### Search Bars
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
  <Input
    placeholder="Search..."
    className="pl-10 bg-white border-stone-200"
  />
</div>
```

#### Filter Pills
```tsx
<button className={`
  px-3 py-1.5 rounded-full text-sm border transition-colors
  ${active 
    ? 'border-stone-900 text-stone-900 bg-stone-100' 
    : 'border-stone-200 text-stone-600 hover:bg-stone-50'}
`}>
```

#### Empty States
```tsx
<div className="text-center py-16">
  <p className="font-serif text-2xl text-stone-900 mb-4">
    No projects found
  </p>
  <p className="text-base text-stone-600 mb-6">
    Start exploring your strategic future
  </p>
  <Button>Create your first project</Button>
</div>
```

### Next.js 15 Patterns
```typescript
// Params are now Promises
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // ...
}
```

### Critical Rules
1. **NEVER** show paused projects above active ones
2. **ALWAYS** use serif for page titles and card headings
3. **NEVER** mix white and stone-50 backgrounds
4. **ALWAYS** include NEW badges for recent content
5. **NEVER** use fixed navigation on reading pages