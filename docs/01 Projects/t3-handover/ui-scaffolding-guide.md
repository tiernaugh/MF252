# UI Scaffolding Guide with Mock Data

## Mock Data Structures

### 1. Mock Projects
```typescript
// lib/mock-data.ts
export const mockProjects = [
  {
    id: "proj_1",
    organizationId: "org_1",
    title: "AI Impact on UK Design Consultancy",
    description: "Exploring how AI will transform design consultancies serving financial services in the UK market",
    shortSummary: "AI transformation in design consulting",
    cadenceType: "WEEKLY",
    nextScheduledAt: new Date("2025-08-20"),
    isPaused: false,
    createdAt: new Date("2025-08-01"),
    updatedAt: new Date("2025-08-13"),
    onboardingBrief: {
      context: "15-person Edinburgh consultancy",
      focusAreas: ["Client relationships", "Regulatory compliance", "Competitive positioning"],
      preferences: { tone: "provocative", speculationLevel: "high" }
    }
  },
  {
    id: "proj_2",
    organizationId: "org_1",
    title: "Future of Remote Work Post-2025",
    description: "Weekly intelligence on emerging remote work patterns and their impact on organizational culture",
    shortSummary: "Remote work evolution tracking",
    cadenceType: "WEEKLY",
    nextScheduledAt: new Date("2025-08-21"),
    isPaused: true,
    createdAt: new Date("2025-07-15"),
    updatedAt: new Date("2025-08-10")
  }
];
```

### 2. Mock Episodes
```typescript
export const mockEpisodes = [
  {
    id: "ep_1",
    projectId: "proj_1",
    title: "The Regulatory Compliance Advantage",
    summary: "How boutique consultancies may win the AI race through regulatory expertise",
    highlightQuote: "The firms most constrained by regulation today may be best positioned for AI tomorrow",
    sequence: 1,
    readingMinutes: 7,
    highlightCount: 3,
    chatMessageCount: 0,
    status: "PUBLISHED",
    publishedAt: new Date("2025-08-06"),
    content: `
# The Regulatory Compliance Advantage

Three key discoveries emerged from this week's research into AI adoption patterns in professional services...

## The Compliance Speed Paradox

While large consultancies struggle with enterprise-wide AI governance, boutique firms are moving faster by treating compliance as a design constraint rather than a barrier...

## Signals from the Field

**Edinburgh's Hidden Advantage**: The Scottish financial services sector's conservative approach to AI adoption is creating unexpected opportunities for specialized consultancies...

## Strategic Implications

For your consultancy specifically, this suggests three immediate actions:
1. Position regulatory expertise as an AI enabler, not a brake
2. Develop "compliance-first" AI integration frameworks
3. Target firms frustrated by big consultancy AI timelines
    `
  },
  {
    id: "ep_2",
    projectId: "proj_1",
    title: "Client Expectation Shifts",
    summary: "New procurement language reveals changing client priorities",
    sequence: 2,
    readingMinutes: 8,
    status: "DRAFT",
    content: "Episode 2 content coming soon..."
  }
];
```

### 3. Mock User & Organization
```typescript
export const mockUser = {
  id: "user_1",
  email: "sarah@designconsultancy.co.uk",
  name: "Sarah Chen",
  clerkId: "clerk_user_1",
  organizationId: "org_1"
};

export const mockOrganization = {
  id: "org_1",
  name: "Sarah's Workspace",
  type: "PERSONAL",
  ownerId: "user_1"
};
```

## UI Components to Scaffold

### 1. Projects Dashboard (`app/(dashboard)/projects/page.tsx`)
```tsx
import { mockProjects } from '@/lib/mock-data';

export default function ProjectsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Projects</h1>
        <a 
          href="/projects/new" 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          New Project
        </a>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project }) {
  return (
    <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold">{project.title}</h2>
        {project.isPaused && (
          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
            Paused
          </span>
        )}
      </div>
      
      <p className="text-gray-600 mb-4 line-clamp-2">
        {project.description}
      </p>
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Next episode: {new Date(project.nextScheduledAt).toLocaleDateString()}</span>
        <a 
          href={`/projects/${project.id}/episodes`}
          className="text-blue-600 hover:underline"
        >
          View episodes →
        </a>
      </div>
    </div>
  );
}
```

### 2. Episode Reading View (`app/(dashboard)/episodes/[id]/page.tsx`)
```tsx
import { mockEpisodes } from '@/lib/mock-data';

export default function EpisodePage({ params }: { params: { id: string } }) {
  const episode = mockEpisodes.find(e => e.id === params.id);
  
  if (!episode) {
    return <div>Episode not found</div>;
  }
  
  return (
    <article className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <header className="mb-12">
        <div className="text-sm text-gray-500 mb-2">
          Episode {episode.sequence} • {episode.readingMinutes} min read
        </div>
        <h1 className="text-4xl font-serif font-bold mb-4">
          {episode.title}
        </h1>
        <p className="text-xl text-gray-600">
          {episode.summary}
        </p>
        {episode.highlightQuote && (
          <blockquote className="mt-6 pl-6 border-l-4 border-blue-500 text-lg italic text-gray-700">
            "{episode.highlightQuote}"
          </blockquote>
        )}
      </header>
      
      {/* Content */}
      <div className="prose prose-lg max-w-none">
        {/* In production, use a markdown renderer */}
        <div dangerouslySetInnerHTML={{ __html: episode.content.replace(/\n/g, '<br/>') }} />
      </div>
      
      {/* Feedback Section */}
      <FeedbackSection episodeId={episode.id} />
    </article>
  );
}

function FeedbackSection({ episodeId }: { episodeId: string }) {
  return (
    <div className="mt-16 p-8 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">
        How was this episode?
      </h3>
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            className="px-4 py-2 border rounded hover:bg-blue-50 hover:border-blue-500"
            onClick={() => console.log(`Rated ${rating}`)}
          >
            {rating}
          </button>
        ))}
      </div>
      <textarea
        placeholder="Any specific feedback? (optional)"
        className="w-full p-3 border rounded-lg"
        rows={3}
      />
      <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Submit Feedback
      </button>
    </div>
  );
}
```

### 3. Conversational UI Scaffold (`app/(dashboard)/projects/new/page.tsx`)
```tsx
'use client';

import { useState } from 'react';

export default function NewProjectPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm Futura, your futures research agent. What future are you curious about?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Mock AI response (replace with actual API call)
    setTimeout(() => {
      const aiResponse = {
        role: 'assistant',
        content: "That's fascinating! Can you tell me more about your role and what specific aspects interest you most?"
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };
  
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Create New Project</h1>
      
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Messages */}
        <div className="h-[400px] overflow-y-auto p-6 space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <span className="animate-pulse">Futura is thinking...</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 4. Layout with Navigation (`app/(dashboard)/layout.tsx`)
```tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <a href="/" className="text-xl font-bold">
                Many Futures
              </a>
              <div className="flex space-x-4">
                <a href="/projects" className="text-gray-700 hover:text-gray-900">
                  Projects
                </a>
                <a href="/episodes" className="text-gray-700 hover:text-gray-900">
                  Episodes
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">sarah@designconsultancy.co.uk</span>
              <button className="text-sm text-gray-700 hover:text-gray-900">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main content */}
      <main>{children}</main>
    </div>
  );
}
```

## Next Steps After Scaffolding

1. **Replace mock data with API calls**
   ```typescript
   // Instead of: import { mockProjects } from '@/lib/mock-data'
   const projects = await fetch('/api/projects').then(r => r.json());
   ```

2. **Add loading states**
   ```tsx
   if (isLoading) return <ProjectsSkeleton />;
   ```

3. **Add error handling**
   ```tsx
   if (error) return <ErrorMessage error={error} />;
   ```

4. **Connect to real database** (after Supabase setup)
   ```typescript
   const projects = await db.project.findMany({
     where: { organizationId: session.user.organizationId }
   });
   ```

5. **Add authentication checks**
   ```typescript
   const session = await auth();
   if (!session) redirect('/sign-in');
   ```

## Quick Start Commands

```bash
# Install dependencies for UI
npm install clsx tailwind-merge lucide-react
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu

# Create the pages
mkdir -p app/\(dashboard\)/projects/new
mkdir -p app/\(dashboard\)/episodes/\[id\]

# Copy mock data
mkdir -p lib
# Create lib/mock-data.ts with the mock data above

# Start development
npm run dev
```

This scaffolding gives you:
- Working navigation
- Project list view
- Episode reading experience  
- Conversational UI skeleton
- Feedback collection UI
- All with mock data ready to be replaced

---

*Continue with database setup once UI is working with mock data*