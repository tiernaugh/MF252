# n8n Integration Patterns & Episode Generation

**Created:** 2025-08-15  
**Status:** 🟢 Architecture Defined  
**Context:** Async episode generation with user feedback

## 🎯 The Subscription Model

Many Futures operates as a **subscription intelligence service**:
- Episodes are delivered on a user-defined schedule (e.g., "Every Monday at 9am")
- Generation happens 2 hours before delivery time to ensure freshness
- Users receive email notifications when episodes are ready
- Failed generations don't delay the schedule - we skip and continue

### Generation Timeline
- **T-2:00**: Start generation (e.g., 7am for 9am delivery)
- **T-1:45**: First retry if failed (15 min after)
- **T-1:15**: Second retry if needed (30 min after)
- **T-0:30**: Final retry attempt (45 min after)
- **T-0:00**: Delivery time - send notification if successful

## 🏗️ Architecture Overview

```
┌─────────────┐     ┌──────────┐     ┌─────────────┐
│  Cron Job   │────▶│ Supabase │────▶│    n8n      │
│ (Every 5min)│     │    DB    │     │  Workflow   │
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
┌─────────────┐     ┌──────────┐
│Email Service│────▶│   User   │
│  (At Time)  │     │  Inbox   │
└─────────────┘     └──────────┘
```

## 📱 User Experience Patterns

### Pattern 1: Schedule Visibility
```typescript
// Show next delivery time on project page
const ProjectHeader = ({ project }) => {
  const nextDelivery = getNextDeliveryTime(
    project.cadenceConfig,
    project.timezone
  );
  
  return (
    <Card className="bg-stone-50 border-stone-200 p-4">
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-stone-500" />
        <div>
          <p className="text-sm text-stone-600">Next episode arrives:</p>
          <p className="font-serif text-lg text-stone-900">
            {format(nextDelivery, 'EEEE, MMMM d')} at {format(nextDelivery, 'h:mm a')}
          </p>
        </div>
      </div>
    </Card>
  );
};
```

### Pattern 2: Failed Generation Messaging
```typescript
// Show on project page when generation fails
interface FailedEpisodeAlert {
  attemptedAt: Date;
  nextScheduledAt: Date;
  retryCount: number;
}

// Alert Component for failed generation
const FailedGenerationAlert = ({ failure }: { failure: FailedEpisodeAlert }) => (
  <Alert variant="warning" className="mb-6">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Episode Generation Issue</AlertTitle>
    <AlertDescription>
      This week's episode generation encountered an issue. 
      Your next episode will arrive as scheduled on{' '}
      <span className="font-medium">
        {format(failure.nextScheduledAt, 'EEEE, MMMM d at h:mm a')}
      </span>
    </AlertDescription>
  </Alert>
);

// In episodes list, show failed attempt
<Card className="opacity-60 border-orange-200 bg-orange-50">
  <div className="flex items-start justify-between">
    <div>
      <Badge variant="destructive" className="mb-2">
        Generation Failed
      </Badge>
      <p className="text-sm text-stone-600">
        Attempted: {format(failure.attemptedAt, 'PPP')}
      </p>
      <p className="text-xs text-stone-500">
        {failure.retryCount} retries attempted
      </p>
    </div>
    <Info className="w-4 h-4 text-stone-400" />
  </div>
</Card>
```

### Pattern 3: Timezone-Aware Scheduling
```typescript
// lib/scheduling.ts
export function calculateNextDelivery(
  cadenceConfig: CadenceConfig,
  userTimezone: string
): Date {
  const now = new Date();
  const userTime = toZonedTime(now, userTimezone);
  
  // Find next matching day and time
  const deliveryHour = cadenceConfig.deliveryHour || 9; // Default 9am
  const daysToCheck = 14; // Check up to 2 weeks ahead
  
  for (let i = 0; i < daysToCheck; i++) {
    const checkDate = addDays(userTime, i);
    const dayOfWeek = getDay(checkDate);
    
    if (cadenceConfig.days.includes(dayOfWeek)) {
      const deliveryTime = setHours(setMinutes(checkDate, 0), deliveryHour);
      
      // If today and time hasn't passed, or if future day
      if (i > 0 || deliveryTime > userTime) {
        // Convert back to UTC for storage
        return fromZonedTime(deliveryTime, userTimezone);
      }
    }
  }
  
  throw new Error('No valid delivery date found');
}

// Calculate generation time (2 hours before delivery)
export function calculateGenerationTime(deliveryTime: Date): Date {
  return new Date(deliveryTime.getTime() - 2 * 60 * 60 * 1000);
}
```

## 🔄 n8n Webhook Implementation

### Cron Job Queue Processing
```typescript
// app/api/cron/process-queue/route.ts
export async function GET(request: Request) {
  // Verify cron secret (Vercel Cron or similar)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Find episodes due for generation (2 hours before delivery)
  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const twoHoursEarlier = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  
  // Get episodes that:
  // 1. Are scheduled for delivery in the next 2 hours
  // 2. Haven't been generated yet (status = DRAFT)
  // 3. Haven't failed too many times
  const { data: dueEpisodes } = await supabase
    .from('episodes')
    .select(`
      *,
      project:projects(
        *,
        planning_notes(*)
      )
    `)
    .eq('status', 'DRAFT')
    .gte('scheduled_for', now.toISOString())
    .lte('scheduled_for', twoHoursLater.toISOString())
    .lt('generation_attempts', 3)
    .order('scheduled_for', { ascending: true })
    .limit(20); // Process max 20 at a time to avoid overload
  
  const results = {
    triggered: [],
    failed: [],
    skipped: []
  };
  
  // Process each due episode
  for (const episode of dueEpisodes || []) {
    try {
      // Check organization's daily cost limit
      if (!await checkDailyLimit(episode.organization_id)) {
        await markEpisodeFailed(episode.id, 'Daily cost limit exceeded');
        results.skipped.push({ id: episode.id, reason: 'cost_limit' });
        continue;
      }
      
      // Update episode status to generating
      await supabase.from('episodes')
        .update({ 
          status: 'GENERATING',
          generation_started_at: now,
          generation_attempts: episode.generation_attempts + 1
        })
        .eq('id', episode.id);
      
      // Add to processing queue
      await supabase.from('episode_schedule_queue').insert({
        episode_id: episode.id,
        project_id: episode.project_id,
        organization_id: episode.organization_id,
        status: 'processing',
        scheduled_for: episode.scheduled_for,
        processing_started_at: now
      });
      
      // Prepare context including planning notes
      const context = {
        brief: episode.project.onboarding_brief,
        memories: episode.project.memories || [],
        planningNotes: episode.project.planning_notes
          ?.filter(note => note.status === 'pending')
          ?.map(note => note.note) || [],
        previousEpisodeId: episode.project.last_episode_id
      };
      
      // Trigger n8n webhook
      const response = await fetch(process.env.N8N_WEBHOOK_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.N8N_API_KEY!
        },
        body: JSON.stringify({
          episodeId: episode.id,
          projectId: episode.project_id,
          organizationId: episode.organization_id,
          context,
          callbacks: {
            progress: `${process.env.NEXT_PUBLIC_URL}/api/episodes/${episode.id}/progress`,
            complete: `${process.env.NEXT_PUBLIC_URL}/api/episodes/${episode.id}/complete`,
            error: `${process.env.NEXT_PUBLIC_URL}/api/episodes/${episode.id}/error`
          },
          metadata: {
            scheduledFor: episode.scheduled_for,
            attemptNumber: episode.generation_attempts + 1,
            timezone: episode.project.timezone
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`n8n returned ${response.status}`);
      }
      
      results.triggered.push(episode.id);
      
      // Mark planning notes as acknowledged
      if (episode.project.planning_notes?.length) {
        await supabase.from('planning_notes')
          .update({ 
            status: 'acknowledged',
            acknowledged_at: now
          })
          .in('id', episode.project.planning_notes.map(n => n.id));
      }
      
    } catch (error) {
      console.error(`Failed to trigger generation for ${episode.id}:`, error);
      results.failed.push({ id: episode.id, error: error.message });
      
      // Update episode status
      await supabase.from('episodes')
        .update({ 
          status: 'DRAFT', // Reset to draft for retry
          generation_errors: [
            ...(episode.generation_errors || []),
            {
              timestamp: now.toISOString(),
              error: error.message,
              attempt: episode.generation_attempts + 1
            }
          ]
        })
        .eq('id', episode.id);
      
      // Log failure event
      await trackEvent('generation_trigger_failed', { 
        episodeId: episode.id, 
        error: error.message,
        attempt: episode.generation_attempts + 1
      });
    }
  }
  
  // Log cron execution
  await trackEvent('cron_queue_processed', results);
  
  return Response.json({ 
    success: true,
    timestamp: now.toISOString(),
    results
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

### Automatic Retry Strategy
```typescript
// Retry timing for 9am delivery:
// 7:00am - Initial attempt (2 hours before)
// 7:15am - First retry (15 min after)
// 7:45am - Second retry (30 min after first)
// 8:30am - Final retry (45 min after second)
// 9:00am - Delivery time (skip if still failed)

async function scheduleRetry(episodeId: string, attemptNumber: number) {
  const episode = await getEpisode(episodeId);
  const deliveryTime = new Date(episode.scheduled_for);
  const now = new Date();
  
  // Calculate retry times based on delivery schedule
  const retrySchedule = [
    new Date(deliveryTime.getTime() - 105 * 60 * 1000), // 1:45 before
    new Date(deliveryTime.getTime() - 75 * 60 * 1000),  // 1:15 before
    new Date(deliveryTime.getTime() - 30 * 60 * 1000),  // 0:30 before
  ];
  
  const nextRetryTime = retrySchedule[attemptNumber - 1];
  
  if (!nextRetryTime || nextRetryTime < now) {
    // No more retries or past retry window
    await markEpisodeFailed(episodeId, 'Max retries exceeded');
    return;
  }
  
  // Schedule retry
  await supabase.from('episode_schedule_queue').insert({
    episode_id: episodeId,
    status: 'pending',
    scheduled_for: nextRetryTime,
    retry_attempt: attemptNumber,
    metadata: { auto_retry: true }
  });
  
  // Track retry
  await trackEvent('episode_generation_retry_scheduled', {
    episodeId,
    attemptNumber,
    retryTime: nextRetryTime,
    deliveryTime
  });
}
```

### Failed Episode Handling
```typescript
// When all retries are exhausted
export async function handleFailedEpisode(episodeId: string) {
  const episode = await getEpisode(episodeId);
  
  // Mark as failed
  await supabase.from('episodes').update({
    status: 'FAILED',
    failed_at: new Date()
  }).eq('id', episodeId);
  
  // Update queue
  await supabase.from('episode_schedule_queue')
    .update({ 
      status: 'failed',
      failed_at: new Date()
    })
    .eq('episode_id', episodeId);
  
  // Schedule next episode (don't let failure break the subscription)
  const nextDelivery = calculateNextDelivery(
    episode.project.cadence_config,
    episode.project.timezone
  );
  
  await supabase.from('episodes').insert({
    project_id: episode.project_id,
    organization_id: episode.organization_id,
    status: 'DRAFT',
    scheduled_for: nextDelivery,
    title: 'Upcoming episode'
  });
  
  // Keep planning notes for next episode
  // (User feedback persists even if generation failed)
  
  // Log for founder review
  await supabase.from('audit_log').insert({
    action: 'episode_generation_failed',
    resource_type: 'episode',
    resource_id: episodeId,
    details: {
      attempts: episode.generation_attempts,
      errors: episode.generation_errors,
      scheduled_for: episode.scheduled_for
    },
    severity: 'high'
  });
}

// Admin dashboard query for founder
export async function getFailedEpisodes() {
  const { data } = await supabase
    .from('episodes')
    .select(`
      *,
      project:projects(title, organization_id),
      queue:episode_schedule_queue(*)
    `)
    .eq('status', 'FAILED')
    .order('failed_at', { ascending: false })
    .limit(50);
    
  return data;
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

### 1. Paused Project Handling
```typescript
// When project is paused
export async function pauseProject(projectId: string) {
  // Cancel any pending episodes
  await supabase.from('episodes')
    .update({ status: 'CANCELLED' })
    .eq('project_id', projectId)
    .eq('status', 'DRAFT');
  
  // Clear from queue
  await supabase.from('episode_schedule_queue')
    .delete()
    .eq('project_id', projectId)
    .eq('status', 'pending');
  
  // Update project
  await supabase.from('projects').update({
    is_paused: true,
    paused_at: new Date(),
    next_scheduled_at: null
  }).eq('id', projectId);
}

// When project is unpaused
export async function unpauseProject(projectId: string) {
  const project = await getProject(projectId);
  
  // Calculate next delivery from today
  const nextDelivery = calculateNextDelivery(
    project.cadence_config,
    project.timezone
  );
  
  // Create fresh episode (don't use stale content)
  await supabase.from('episodes').insert({
    project_id: projectId,
    organization_id: project.organization_id,
    status: 'DRAFT',
    scheduled_for: nextDelivery,
    title: 'Upcoming episode'
  });
  
  // Update project
  await supabase.from('projects').update({
    is_paused: false,
    paused_at: null,
    next_scheduled_at: nextDelivery
  }).eq('id', projectId);
  
  return nextDelivery;
}
```

### 2. Timezone Changes
```typescript
// When user changes timezone
export async function updateUserTimezone(
  userId: string, 
  newTimezone: string
) {
  // Update user
  await supabase.from('users').update({
    timezone: newTimezone
  }).eq('id', userId);
  
  // Recalculate all project schedules
  const projects = await getUserProjects(userId);
  
  for (const project of projects) {
    // Cancel existing scheduled episodes
    await supabase.from('episodes')
      .update({ status: 'CANCELLED' })
      .eq('project_id', project.id)
      .eq('status', 'DRAFT');
    
    // Calculate new delivery time in new timezone
    const nextDelivery = calculateNextDelivery(
      project.cadence_config,
      newTimezone
    );
    
    // Create new episode with updated schedule
    await supabase.from('episodes').insert({
      project_id: project.id,
      organization_id: project.organization_id,
      status: 'DRAFT',
      scheduled_for: nextDelivery
    });
    
    // Update project
    await supabase.from('projects').update({
      next_scheduled_at: nextDelivery,
      timezone: newTimezone
    }).eq('id', project.id);
  }
}
```

### 3. Cadence Changes
```typescript
// When user changes delivery schedule
export async function updateProjectCadence(
  projectId: string,
  newCadence: CadenceConfig
) {
  const project = await getProject(projectId);
  
  // Cancel current scheduled episode
  await supabase.from('episodes')
    .update({ status: 'CANCELLED' })
    .eq('project_id', projectId)
    .eq('status', 'DRAFT');
  
  // Calculate next delivery with new cadence
  const nextDelivery = calculateNextDelivery(
    newCadence,
    project.timezone
  );
  
  // Create new episode with updated schedule
  await supabase.from('episodes').insert({
    project_id: projectId,
    organization_id: project.organization_id,
    status: 'DRAFT',
    scheduled_for: nextDelivery,
    title: 'Upcoming episode'
  });
  
  // Update project
  await supabase.from('projects').update({
    cadence_config: newCadence,
    next_scheduled_at: nextDelivery
  }).eq('id', projectId);
  
  // Log change
  await trackEvent('cadence_updated', {
    projectId,
    oldCadence: project.cadence_config,
    newCadence,
    nextDelivery
  });
  
  return nextDelivery;
}
```

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