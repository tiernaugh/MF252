# n8n Integration Patterns & Episode Generation

**Created:** 2025-08-15  
**Status:** 🟢 Architecture Defined  
**Context:** Async episode generation with user feedback

## 🎯 The Challenge

Episode generation is computationally expensive and time-consuming:
- **Research Agent**: 30-60 seconds (web searches, fact gathering)
- **Writer Agent**: 60-90 seconds (content synthesis, narrative)
- **QA Agent**: 30-60 seconds (fact checking, guardrails)
- **Total Time**: 2-5 minutes typical, up to 10 minutes worst case

Users won't wait at a loading screen for 5 minutes. We need sophisticated async patterns.

## 🏗️ Architecture Overview

```
┌─────────────┐     ┌──────────┐     ┌─────────────┐
│   Next.js   │────▶│ Supabase │────▶│    n8n      │
│     App     │     │    DB    │     │  Workflow   │
└─────────────┘     └──────────┘     └─────────────┘
       │                  │                   │
       │                  │                   ▼
       │                  │            ┌─────────────┐
       │                  │            │ AI Agents   │
       │                  │            │ (Research,  │
       │                  │            │  Writer,    │
       │                  │            │  QA)        │
       │                  │            └─────────────┘
       │                  │                   │
       │                  ◀───────────────────┘
       │                       (Callback)
       ▼
┌─────────────┐
│   User UI   │
│ (Progress,  │
│  Polling)   │
└─────────────┘
```

## 📱 User Experience Patterns

### Pattern 1: Immediate Acknowledgment
```typescript
// When user triggers generation
const handleGenerateEpisode = async () => {
  // 1. Create draft immediately
  const episode = await createDraftEpisode({
    title: "Researching your strategic landscape...",
    status: 'DRAFT'
  });
  
  // 2. Show progress UI instantly
  setGenerating(true);
  setProgress({ stage: 'research', percent: 0 });
  
  // 3. Trigger async generation
  await triggerGeneration(episode.id);
  
  // 4. Start polling for updates
  startPolling(episode.id);
};
```

### Pattern 2: Progressive Status Updates
```typescript
interface GenerationProgress {
  stage: 'queued' | 'research' | 'writing' | 'review' | 'complete';
  percent: number;
  message: string;
  estimatedTimeRemaining?: number; // seconds
}

// Progress UI Component
<Card className="border-2 border-stone-200 p-6">
  <div className="flex items-center gap-4">
    <Spinner className="w-8 h-8" />
    <div className="flex-1">
      <h3 className="font-serif text-xl">
        {progress.message}
      </h3>
      <ProgressBar value={progress.percent} />
      <p className="text-sm text-stone-600 mt-2">
        {progress.stage === 'research' && 'Scanning 50+ sources...'}
        {progress.stage === 'writing' && 'Crafting your strategic narrative...'}
        {progress.stage === 'review' && 'Ensuring accuracy and relevance...'}
      </p>
      {progress.estimatedTimeRemaining && (
        <p className="text-xs text-stone-500">
          About {Math.ceil(progress.estimatedTimeRemaining / 60)} minutes remaining
        </p>
      )}
    </div>
  </div>
  
  <div className="mt-4 flex gap-2">
    <Button variant="outline" onClick={navigateAway}>
      Browse Other Episodes
    </Button>
    <Button variant="ghost" onClick={cancelGeneration}>
      Cancel
    </Button>
  </div>
</Card>
```

### Pattern 3: Smart Polling with Backoff
```typescript
// lib/polling.ts
export function useEpisodePolling(episodeId: string) {
  const [status, setStatus] = useState<EpisodeStatus>('DRAFT');
  const [progress, setProgress] = useState<GenerationProgress>();
  const intervalRef = useRef<NodeJS.Timeout>();
  const backoffRef = useRef(5000); // Start at 5 seconds
  
  useEffect(() => {
    const poll = async () => {
      try {
        const data = await fetch(`/api/episodes/${episodeId}/status`);
        const episode = await data.json();
        
        setStatus(episode.status);
        setProgress(episode.generationProgress);
        
        if (episode.status === 'PUBLISHED') {
          // Success! Stop polling
          clearInterval(intervalRef.current);
          router.push(`/episodes/${episodeId}`);
        } else if (episode.status === 'FAILED') {
          // Error! Stop polling
          clearInterval(intervalRef.current);
          showError(episode.generationErrors[0]);
        } else {
          // Still generating, increase backoff
          backoffRef.current = Math.min(backoffRef.current * 1.5, 30000);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };
    
    // Initial poll
    poll();
    
    // Set up interval with backoff
    intervalRef.current = setInterval(poll, backoffRef.current);
    
    return () => clearInterval(intervalRef.current);
  }, [episodeId]);
  
  return { status, progress };
}
```

## 🔄 n8n Webhook Implementation

### Webhook Trigger from Next.js
```typescript
// app/api/episodes/generate/route.ts
export async function POST(request: Request) {
  const { projectId } = await request.json();
  const { orgId } = await getCurrentOrg();
  
  // 1. Check cost limits first
  if (!await checkDailyLimit(orgId)) {
    return Response.json(
      { error: 'Daily generation limit reached' },
      { status: 429 }
    );
  }
  
  // 2. Create episode draft
  const episode = await supabase.from('episodes').insert({
    project_id: projectId,
    organization_id: orgId,
    status: 'DRAFT',
    title: 'Generating episode...',
    scheduled_for: new Date()
  }).select().single();
  
  // 3. Add to queue
  await supabase.from('episode_schedule_queue').insert({
    episode_id: episode.data.id,
    project_id: projectId,
    organization_id: orgId,
    status: 'pending',
    scheduled_for: new Date()
  });
  
  // 4. Get project context
  const project = await supabase.from('projects')
    .select('*, planning_notes(*)')
    .eq('id', projectId)
    .single();
  
  // 5. Trigger n8n webhook (fire and forget)
  fetch(process.env.N8N_WEBHOOK_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.N8N_API_KEY!
    },
    body: JSON.stringify({
      episodeId: episode.data.id,
      projectId,
      organizationId: orgId,
      context: {
        brief: project.data.onboarding_brief,
        memories: project.data.memories,
        planningNotes: project.data.planning_notes,
        previousEpisodeId: project.data.last_episode_id
      },
      callbacks: {
        progress: `${process.env.NEXT_PUBLIC_URL}/api/episodes/${episode.data.id}/progress`,
        complete: `${process.env.NEXT_PUBLIC_URL}/api/episodes/${episode.data.id}/complete`,
        error: `${process.env.NEXT_PUBLIC_URL}/api/episodes/${episode.data.id}/error`
      }
    })
  }).catch(error => {
    // Log but don't fail the request
    console.error('Failed to trigger n8n:', error);
    trackEvent('n8n_trigger_failed', { error: error.message });
  });
  
  return Response.json({
    episodeId: episode.data.id,
    status: 'generating',
    estimatedTime: 180 // 3 minutes
  });
}
```

### Progress Callback from n8n
```typescript
// app/api/episodes/[id]/progress/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { stage, percent, message } = await request.json();
  
  // Verify n8n API key
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey !== process.env.N8N_API_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Update episode progress (stored in JSONB field)
  await supabase.from('episodes').update({
    generation_progress: {
      stage,
      percent,
      message,
      updated_at: new Date().toISOString()
    }
  }).eq('id', params.id);
  
  // Log progress event
  await trackEvent('episode_generation_progress', {
    episodeId: params.id,
    stage,
    percent
  });
  
  return Response.json({ success: true });
}
```

### Completion Callback from n8n
```typescript
// app/api/episodes/[id]/complete/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { 
    content, 
    sources, 
    insights,
    tokenUsage,
    generationTime 
  } = await request.json();
  
  // Verify n8n API key
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey !== process.env.N8N_API_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // 1. Update episode with content
    await supabase.from('episodes').update({
      status: 'PUBLISHED',
      title: extractTitle(content),
      content,
      sources,
      insights,
      published_at: new Date(),
      reading_minutes: calculateReadingTime(content),
      generation_time_seconds: generationTime,
      generation_progress: null // Clear progress
    }).eq('id', params.id);
    
    // 2. Log token usage
    await supabase.from('token_usage').insert({
      episode_id: params.id,
      operation_type: 'episode_generation',
      model: tokenUsage.model,
      prompt_tokens: tokenUsage.promptTokens,
      completion_tokens: tokenUsage.completionTokens,
      total_cost: tokenUsage.totalCost,
      metadata: {
        generation_time: generationTime,
        agent_breakdown: tokenUsage.agentBreakdown
      }
    });
    
    // 3. Update queue status
    await supabase.from('episode_schedule_queue')
      .update({ 
        status: 'completed',
        completed_at: new Date(),
        result: { success: true }
      })
      .eq('episode_id', params.id);
    
    // 4. Update project's last episode
    const episode = await supabase.from('episodes')
      .select('project_id')
      .eq('id', params.id)
      .single();
      
    await supabase.from('projects').update({
      last_episode_id: params.id,
      last_episode_at: new Date()
    }).eq('id', episode.data.project_id);
    
    // 5. Send notification email
    await sendEpisodeReadyEmail(params.id);
    
    // 6. Track success event
    await trackEvent('episode_generation_complete', {
      episodeId: params.id,
      generationTime,
      wordCount: content.split(/\s+/).length
    });
    
    return Response.json({ success: true });
    
  } catch (error) {
    console.error('Failed to complete episode:', error);
    
    // Mark as failed
    await supabase.from('episodes').update({
      status: 'FAILED',
      generation_errors: [error.message]
    }).eq('id', params.id);
    
    return Response.json(
      { error: 'Failed to save episode' },
      { status: 500 }
    );
  }
}
```

### Error Callback from n8n
```typescript
// app/api/episodes/[id]/error/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, stage, tokenUsage } = await request.json();
  
  // Update episode as failed
  await supabase.from('episodes').update({
    status: 'FAILED',
    generation_errors: [{
      error,
      stage,
      timestamp: new Date().toISOString()
    }],
    generation_attempts: supabase.rpc('increment', { x: 1 })
  }).eq('id', params.id);
  
  // Still log token usage even on failure
  if (tokenUsage) {
    await supabase.from('token_usage').insert({
      episode_id: params.id,
      operation_type: 'episode_generation_failed',
      ...tokenUsage
    });
  }
  
  // Update queue
  await supabase.from('episode_schedule_queue')
    .update({ 
      status: 'failed',
      failed_at: new Date(),
      error_message: error
    })
    .eq('episode_id', params.id);
  
  // Determine if we should retry
  const episode = await supabase.from('episodes')
    .select('generation_attempts')
    .eq('id', params.id)
    .single();
    
  if (episode.data.generation_attempts < 3) {
    // Schedule retry
    await scheduleRetry(params.id, episode.data.generation_attempts);
  } else {
    // Max retries reached, notify user
    await sendGenerationFailedEmail(params.id, error);
  }
  
  return Response.json({ success: true });
}
```

## 🎨 UI States & Transitions

### State Machine
```typescript
type GenerationState = 
  | { type: 'idle' }
  | { type: 'triggering' }
  | { type: 'generating'; progress: GenerationProgress }
  | { type: 'completed'; episodeId: string }
  | { type: 'failed'; error: string; canRetry: boolean };

// State transitions
idle → triggering → generating → completed
                  ↘            ↗
                    → failed →
```

### UI Components for Each State

#### Idle State
```tsx
<Button onClick={generateEpisode}>
  Generate This Week's Episode
</Button>
```

#### Triggering State
```tsx
<Button disabled>
  <Spinner className="mr-2" />
  Starting generation...
</Button>
```

#### Generating State
```tsx
<GenerationProgress 
  stage={progress.stage}
  percent={progress.percent}
  message={progress.message}
  onCancel={handleCancel}
  onBackground={handleContinueInBackground}
/>
```

#### Completed State
```tsx
<Card className="bg-green-50 border-green-200">
  <CheckCircle className="text-green-600" />
  <h3>Episode Ready!</h3>
  <p>Your strategic intelligence brief is ready to read.</p>
  <Button onClick={() => router.push(`/episodes/${episodeId}`)}>
    Read Episode
  </Button>
</Card>
```

#### Failed State
```tsx
<Card className="bg-red-50 border-red-200">
  <AlertCircle className="text-red-600" />
  <h3>Generation Failed</h3>
  <p>{error}</p>
  {canRetry && (
    <Button onClick={retryGeneration}>
      Try Again
    </Button>
  )}
</Card>
```

## 🔄 Retry & Recovery Patterns

### Automatic Retry with Exponential Backoff
```typescript
async function scheduleRetry(episodeId: string, attemptNumber: number) {
  const delayMinutes = Math.pow(2, attemptNumber) * 5; // 5, 10, 20 minutes
  
  await supabase.from('episode_schedule_queue').insert({
    episode_id: episodeId,
    status: 'pending',
    scheduled_for: new Date(Date.now() + delayMinutes * 60 * 1000),
    retry_attempt: attemptNumber,
    metadata: { auto_retry: true }
  });
  
  // Notify user of retry
  await trackEvent('episode_generation_retry_scheduled', {
    episodeId,
    attemptNumber,
    delayMinutes
  });
}
```

### Manual Recovery Options
```typescript
// Admin action to force regenerate
export async function forceRegenerate(episodeId: string) {
  // Reset episode
  await supabase.from('episodes').update({
    status: 'DRAFT',
    generation_attempts: 0,
    generation_errors: [],
    content: null,
    sources: null
  }).eq('id', episodeId);
  
  // Clear old queue entries
  await supabase.from('episode_schedule_queue')
    .delete()
    .eq('episode_id', episodeId);
  
  // Trigger fresh generation
  await triggerGeneration(episodeId);
}
```

## 📊 Monitoring & Observability

### Key Metrics to Track
```typescript
interface GenerationMetrics {
  averageTime: number;        // Seconds
  successRate: number;        // Percentage
  retryRate: number;          // Percentage
  costPerEpisode: number;     // GBP
  userWaitTime: number;       // Time user stayed on page
  abandonmentRate: number;    // Users who left during generation
}

// Track in PostHog
posthog.capture('episode_generation_started', {
  projectId,
  triggeredBy: 'manual' | 'scheduled',
  dayOfWeek: new Date().getDay()
});

posthog.capture('episode_generation_completed', {
  projectId,
  duration: generationTime,
  wordCount: content.length,
  sourceCount: sources.length,
  cost: tokenUsage.totalCost
});
```

### Error Tracking
```typescript
// Sentry integration
Sentry.captureException(error, {
  tags: {
    feature: 'episode_generation',
    stage: 'n8n_callback'
  },
  extra: {
    episodeId,
    attemptNumber,
    n8nWorkflowId
  }
});
```

## 🚨 Edge Cases & Considerations

### 1. User Navigates Away
- Continue generation in background
- Send email when complete
- Show notification badge on return

### 2. n8n Webhook Timeout
- Set 10-minute timeout on n8n side
- If no callback received in 15 minutes, mark as failed
- Implement dead letter queue for investigation

### 3. Duplicate Generation Requests
- Check for existing DRAFT/GENERATING episodes
- Prevent duplicate triggers within 5 minutes
- Use idempotency keys

### 4. Cost Explosion
- Hard limit of £2 per episode
- Daily limit of £50 per organization
- Kill switch if costs spike

### 5. Partial Content Delivery
- n8n could send partial content on timeout
- Save partial content with status 'PARTIAL'
- Allow manual completion or retry

## 📚 Related Documentation

- [Implementation Plan](./implementation-plan.md)
- [Database Schema](../database-schema.ts)
- [Queue Processing](./edge-cases-to-test.md#episodeschedulequeue)
- [Cost Controls](./implementation-plan.md#cost-controls)

---

**Remember**: The async nature of episode generation is our biggest UX challenge. Set clear expectations, provide continuous feedback, and always have a recovery path.