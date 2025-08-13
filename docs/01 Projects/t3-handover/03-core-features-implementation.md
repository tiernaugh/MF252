# Core Features Implementation Guide

## Feature 1: Conversational UI (Project Creation)

### Overview
A 3-4 turn conversation with GPT-5 that creates a research project brief. This is the user's first interaction and sets expectations.

### Implementation Details

**Frontend Component (`app/projects/new/page.tsx`):**
```typescript
export default function NewProjectPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  
  // Initial greeting
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: "Hi! I'm Futura, your futures research agent. What future are you curious about?"
    }]);
  }, []);
  
  const handleSendMessage = async (content: string) => {
    // Add user message
    const newMessages = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    
    // Get AI response
    const response = await fetch('/api/projects/conversation', {
      method: 'POST',
      body: JSON.stringify({ messages: newMessages })
    });
    
    const data = await response.json();
    setMessages([...newMessages, data.message]);
    
    // Check if brief is ready
    if (data.briefReady) {
      setIsGeneratingBrief(true);
      await createProject(data.brief);
    }
  };
}
```

**Backend API (`app/api/projects/conversation/route.ts`):**
```typescript
export async function POST(req: Request) {
  const { messages } = await req.json();
  
  // Check conversation progress
  const turnCount = messages.filter(m => m.role === 'user').length;
  
  // System instructions for GPT-5
  const instructions = `
    You are Futura, a strategic foresight research agent.
    Guide the user through project creation in 3-4 turns:
    Turn 1: Capture topic and initial context
    Turn 2: Understand role, company, industry
    Turn 3: Clarify interests, constraints, preferences
    Turn 4: Confirm and generate brief
  `;
  
  const response = await openai.chat.completions.create({
    model: "gpt-5-latest",
    messages: messages,
    instructions: instructions,
    temperature: 0.7
  });
  
  // Check if we have enough context
  const briefReady = turnCount >= 3 && 
    response.choices[0].message.content.includes("BRIEF_READY");
  
  if (briefReady) {
    const brief = await generateBrief(messages);
    return NextResponse.json({ 
      message: response.choices[0].message,
      briefReady: true,
      brief 
    });
  }
  
  return NextResponse.json({ 
    message: response.choices[0].message,
    briefReady: false 
  });
}
```

### Key Patterns from Prototype
- Use `instructions` parameter for system prompts
- Extract message content handling various formats
- Filter out system signals from user view
- Brief generation happens server-side

## Feature 2: Episode Generation

### Overview
Weekly AI-generated research episodes with strict cost controls and token tracking.

### Implementation Details

**Episode Generator (`lib/episode-generator.ts`):**
```typescript
export async function generateEpisode(project: Project) {
  // 1. Check cost limits
  if (!await canGenerate(project.organizationId)) {
    throw new Error("Cost limit exceeded");
  }
  
  // 2. Build episode prompt
  const prompt = buildEpisodePrompt(project);
  
  // 3. Generate with Claude
  const startTokens = await getCurrentTokenUsage(project.organizationId);
  
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4000,
    messages: [{
      role: "user",
      content: prompt
    }]
  });
  
  // 4. Track token usage
  const tokensUsed = response.usage.total_tokens;
  await trackTokenUsage({
    organizationId: project.organizationId,
    projectId: project.id,
    provider: 'ANTHROPIC',
    model: 'claude-3-5-sonnet',
    promptTokens: response.usage.input_tokens,
    completionTokens: response.usage.output_tokens,
    totalTokens: tokensUsed,
    estimatedCost: calculateCost(tokensUsed, 'claude-3-5-sonnet')
  });
  
  // 5. Create episode record
  const episode = await db.episode.create({
    data: {
      projectId: project.id,
      organizationId: project.organizationId,
      title: extractTitle(response.content),
      content: response.content,
      episodeNumber: await getNextEpisodeNumber(project.id),
      status: 'PUBLISHED',
      metadata: {
        generatedAt: new Date(),
        tokensUsed,
        model: 'claude-3-5-sonnet'
      }
    }
  });
  
  return episode;
}
```

**Cost Control Helpers:**
```typescript
async function canGenerate(orgId: string): Promise<boolean> {
  // Daily limit check
  const todaysCost = await db.tokenUsage.aggregate({
    where: {
      organizationId: orgId,
      createdAt: { gte: startOfDay(new Date()) }
    },
    _sum: { estimatedCost: true }
  });
  
  if (todaysCost._sum.estimatedCost > 50) {
    console.error(`Daily limit exceeded for org ${orgId}`);
    return false;
  }
  
  // Per-episode limit check (last episode)
  const lastEpisodeCost = await db.tokenUsage.aggregate({
    where: {
      organizationId: orgId,
      createdAt: { gte: subHours(new Date(), 1) }
    },
    _sum: { estimatedCost: true }
  });
  
  if (lastEpisodeCost._sum.estimatedCost > 2) {
    console.error(`Episode cost limit exceeded for org ${orgId}`);
    return false;
  }
  
  return true;
}

function calculateCost(tokens: number, model: string): number {
  const rates = {
    'claude-3-5-sonnet': 0.003 / 1000, // $3 per million tokens
    'gpt-5-latest': 0.005 / 1000,      // $5 per million tokens
  };
  
  return tokens * (rates[model] || 0.001 / 1000);
}
```

### Weekly Cron Job
```typescript
// app/api/cron/weekly-episodes/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Get projects scheduled for today
  const projects = await db.project.findMany({
    where: {
      status: 'ACTIVE',
      nextEpisodeDate: { lte: new Date() }
    }
  });
  
  const results = [];
  for (const project of projects) {
    try {
      const episode = await generateEpisode(project);
      await sendEpisodeNotification(project.userId, episode);
      
      // Update next episode date
      await db.project.update({
        where: { id: project.id },
        data: { nextEpisodeDate: addWeeks(new Date(), 1) }
      });
      
      results.push({ projectId: project.id, status: 'success' });
    } catch (error) {
      console.error(`Failed to generate episode for ${project.id}:`, error);
      results.push({ projectId: project.id, status: 'failed', error });
    }
  }
  
  return NextResponse.json({ results });
}
```

## Feature 3: Reading Experience

### Overview
Beautiful, distraction-free reading interface with typography optimized for strategic content.

### Implementation Details

**Episode Page (`app/episodes/[id]/page.tsx`):**
```typescript
export default async function EpisodePage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const session = await auth();
  
  const episode = await db.episode.findFirst({
    where: {
      id: params.id,
      organizationId: session.user.organizationId
    },
    include: {
      project: true,
      feedback: true
    }
  });
  
  if (!episode) notFound();
  
  // Track reading
  await trackEvent('episode_viewed', {
    episodeId: episode.id,
    projectId: episode.projectId
  });
  
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <header className="mb-12">
        <h1 className="text-4xl font-serif mb-4">
          {episode.title}
        </h1>
        <div className="text-sm text-muted-foreground">
          Episode {episode.episodeNumber} • 
          {format(episode.createdAt, 'MMMM d, yyyy')} • 
          {calculateReadTime(episode.content)} min read
        </div>
      </header>
      
      {/* Content */}
      <article className="prose prose-lg max-w-none">
        <EpisodeContent content={episode.content} />
      </article>
      
      {/* Feedback */}
      <FeedbackSection 
        episodeId={episode.id}
        existingFeedback={episode.feedback}
      />
      
      {/* Next Episode Preview */}
      <NextEpisodePreview projectId={episode.projectId} />
    </div>
  );
}
```

**Typography Styles:**
```css
/* Beautiful reading experience */
.prose {
  font-family: 'Charter', 'Georgia', serif;
  line-height: 1.75;
  color: #1a1a1a;
}

.prose h2 {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  margin-top: 3rem;
  margin-bottom: 1.5rem;
}

.prose blockquote {
  border-left: 3px solid #3b82f6;
  padding-left: 1.5rem;
  font-style: italic;
  color: #4b5563;
}

/* Mobile optimization */
@media (max-width: 640px) {
  .prose {
    font-size: 1rem;
    line-height: 1.65;
  }
}
```

## Feature 4: Feedback Collection

### Overview
Simple, unobtrusive feedback mechanism that improves future episodes.

### Implementation Details

**Feedback Component:**
```typescript
function FeedbackSection({ 
  episodeId, 
  existingFeedback 
}: { 
  episodeId: string;
  existingFeedback?: Feedback;
}) {
  const [rating, setRating] = useState(existingFeedback?.rating);
  const [comment, setComment] = useState('');
  
  const handleSubmit = async () => {
    await fetch('/api/feedback', {
      method: 'POST',
      body: JSON.stringify({
        episodeId,
        rating,
        comment,
        metadata: {
          readingTime: getReadingTime(), // Track engagement
          scrollDepth: getScrollDepth()
        }
      })
    });
  };
  
  return (
    <div className="mt-16 p-8 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">
        How was this episode for you?
      </h3>
      
      {/* Simple rating */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4, 5].map(value => (
          <button
            key={value}
            onClick={() => setRating(value)}
            className={`px-4 py-2 rounded ${
              rating === value ? 'bg-blue-500 text-white' : 'bg-white'
            }`}
          >
            {value}
          </button>
        ))}
      </div>
      
      {/* Optional text */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Any specific feedback? (optional)"
        className="w-full p-3 border rounded-lg"
        rows={3}
      />
      
      <button
        onClick={handleSubmit}
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg"
      >
        Submit Feedback
      </button>
    </div>
  );
}
```

## Feature 5: Payment Integration

### Overview
Simple Stripe Checkout integration with paywall after first episode.

### Implementation Details

**Paywall Logic:**
```typescript
// app/episodes/[id]/page.tsx
export default async function EpisodePage({ params }) {
  const session = await auth();
  const episode = await getEpisode(params.id);
  
  // Check if this is episode 2+ and user hasn't paid
  if (episode.episodeNumber > 1) {
    const subscription = await db.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE'
      }
    });
    
    if (!subscription) {
      return <PaywallPage episodeId={episode.id} />;
    }
  }
  
  // Show episode content...
}
```

**Checkout Flow:**
```typescript
// app/api/checkout/route.ts
export async function POST(req: Request) {
  const session = await auth();
  const { priceId } = await req.json();
  
  const checkoutSession = await stripe.checkout.sessions.create({
    customer_email: session.user.email,
    payment_method_types: ['card'],
    line_items: [{
      price: process.env.STRIPE_PRICE_ID, // £29/month
      quantity: 1
    }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_URL}/episodes/{CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/projects`,
    metadata: {
      userId: session.user.id,
      organizationId: session.user.organizationId
    }
  });
  
  return NextResponse.json({ url: checkoutSession.url });
}
```

## Admin Dashboard

### Critical Admin Functions
```typescript
// app/admin/page.tsx
export default async function AdminDashboard() {
  // Must be admin
  const session = await auth();
  if (!session.user.isAdmin) redirect('/');
  
  return (
    <div>
      {/* Daily costs monitor */}
      <CostMonitor />
      
      {/* Emergency controls */}
      <div className="flex gap-4">
        <PauseAllButton />
        <RegenerateEpisodeForm />
        <RefundUserForm />
      </div>
      
      {/* Recent episodes */}
      <RecentEpisodes />
      
      {/* Error logs */}
      <ErrorLogs />
    </div>
  );
}
```

---

*Next Document: [04-database-schema-and-security.md](./04-database-schema-and-security.md)*