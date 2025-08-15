
# Subscription Delivery Model

**Created:** 2025-08-15  
**Status:** 🟢 Architecture Defined  
**Context:** How episodes are scheduled, generated, and delivered at scale

## 🎯 Core Concept

Many Futures is a **subscription intelligence service**, not an on-demand content generator:
- Users set their preferred delivery schedule (e.g., "Every Monday at 9am")
- Episodes are pre-generated 4 hours before delivery for reliability and freshness
- Email notifications sent at the scheduled time (like Substack)
- Failed generations don't break the subscription - we skip and continue

## ⏰ Timeline for Episode Delivery

### Example: Monday 9am Delivery

```
Sunday 11pm: Create DRAFT episode record
Monday 5:00am: Start generation (T-4:00)  # 4-hour window for reliability
Monday 5:30am: First retry if failed (T-3:30)
Monday 6:30am: Second retry (T-2:30)
Monday 7:30am: Final retry (T-1:30)
Monday 8:30am: Generation complete, final checks
Monday 9:00am: Send email if successful
Monday 9:01am: Create next week's DRAFT
```

**Rationale for 4-hour window:**
- If n8n goes down at 7am, we still have time to recover for 9am delivery
- Allows manual intervention if systematic failures occur
- Provides buffer during high load periods
- Content remains fresh (generated morning of delivery)

## 📊 Queue Distribution Strategy

### Timezone-Based Batching

```typescript
// Process episodes by timezone to distribute load
const timezoneSchedule = {
  'UTC': {
    8: '4:00',  // Generate at 4am for 8am delivery (4-hour window)
    9: '5:00',  // Generate at 5am for 9am delivery
    10: '6:00', // Generate at 6am for 10am delivery
  },
  'America/New_York': {
    8: '11:00', // Generate at 11am UTC for 8am EST
    9: '12:00', // Generate at 12pm UTC for 9am EST
    10: '13:00', // Generate at 1pm UTC for 10am EST
  },
  'America/Los_Angeles': {
    8: '14:00', // Generate at 2pm UTC for 8am PST
    9: '15:00', // Generate at 3pm UTC for 9am PST
    10: '16:00', // Generate at 4pm UTC for 10am PST
  }
};
```

### Load Distribution Benefits
1. **Predictable load**: Know exactly when surges will happen
2. **Geographic spreading**: US morning doesn't overlap with EU morning
3. **n8n scaling**: Can add workers for specific timezone windows
4. **Cost optimization**: Use cheaper compute during off-peak hours

## 🔄 Subscription Lifecycle

### 1. Project Creation
```typescript
// When project is created on Wednesday for "Every Monday"
const project = await createProject({
  cadenceConfig: {
    mode: 'weekly',
    days: [1], // Monday
    deliveryHour: 9 // 9am in user's timezone
  },
  timezone: 'America/New_York'
});

// Calculate first delivery
const firstDelivery = calculateNextDelivery(
  project.cadenceConfig,
  project.timezone
); // Returns: Next Monday 9am EST

// Create first episode draft
await createEpisode({
  project_id: project.id,
  status: 'DRAFT',
  scheduled_for: firstDelivery,
  title: 'Your first intelligence brief'
});

// Show user when to expect it
showMessage(`Your first episode arrives ${format(firstDelivery)}`);
```

### 2. Ongoing Delivery
```typescript
// Schedule specific jobs instead of 5-min polling for efficiency
// This runs once daily at midnight to schedule next day's generation jobs
export async function scheduleGenerationJobs() {
  const tomorrow = addDays(new Date(), 1);
  const episodes = await getEpisodesDueForGeneration(tomorrow);
  
  for (const episode of episodes) {
    const genTime = subHours(episode.scheduled_for, 4); // 4-hour window
    
    // Schedule precise job for this episode
    await scheduleJob({
      runAt: genTime,
      jobType: 'generate_episode',
      data: { 
        episodeId: episode.id,
        idempotencyKey: `${episode.project_id}-${episode.scheduled_for}`, // Prevent duplicates
        priority: calculatePriority(episode) // Premium users = 10, Trial = 5
      }
    });
  }
}

// Original 5-min cron kept as fallback for missed episodes
export async function processQueue() {
  const now = new Date();
  const fourHoursFromNow = addHours(now, 4); // Updated to 4 hours
  
  // Find episodes due for generation
  const dueEpisodes = await findEpisodesDueBetween(now, twoHoursFromNow);
  
  for (const episode of dueEpisodes) {
    // Check if already processing
    if (episode.status === 'GENERATING') continue;
    
    // Check cost limits
    if (!await checkDailyLimit(episode.organization_id)) {
      await markEpisodeFailed(episode.id, 'Cost limit exceeded');
      continue;
    }
    
    // Trigger generation
    await triggerN8nGeneration(episode);
  }
}
```

### 3. Delivery Notification
```typescript
// Separate cron job for sending notifications
export async function sendNotifications() {
  const now = new Date();
  const fiveMinutesAgo = subMinutes(now, 5);
  
  // Find published episodes ready for delivery
  const readyEpisodes = await findEpisodesReadyForDelivery(
    fiveMinutesAgo,
    now
  );
  
  for (const episode of readyEpisodes) {
    await sendEmailNotification(episode);
    await markEpisodeDelivered(episode.id);
    
    // Create next episode draft
    await createNextEpisode(episode.project_id);
  }
}
```

## 🚨 Edge Cases & Solutions

### User Hasn't Read Previous Episode
**Behavior**: Still deliver the next one
```typescript
// Don't check read status - maintain subscription rhythm
const shouldDeliver = true; // Always deliver on schedule
```

### Project Paused Mid-Week
**Behavior**: Cancel pending episodes, resume fresh when unpaused
```typescript
export async function pauseProject(projectId: string) {
  // Cancel scheduled episodes
  await cancelPendingEpisodes(projectId);
  
  // Clear from queue
  await removeFromQueue(projectId);
  
  // Update project
  await updateProject(projectId, {
    is_paused: true,
    paused_at: new Date(),
    next_scheduled_at: null
  });
}

export async function unpauseProject(projectId: string) {
  const project = await getProject(projectId);
  
  // Calculate fresh schedule from today
  const nextDelivery = calculateNextDelivery(
    project.cadence_config,
    project.timezone
  );
  
  // Create new episode (don't resurrect old one)
  await createEpisode({
    project_id: projectId,
    scheduled_for: nextDelivery
  });
  
  return `Episodes will resume on ${format(nextDelivery)}`;
}
```

### User Changes Schedule
**Example**: Changes from Monday to Friday on Tuesday
```typescript
export async function updateSchedule(projectId: string, newCadence: CadenceConfig) {
  // Cancel current scheduled episode
  await cancelPendingEpisodes(projectId);
  
  // Calculate next occurrence of new schedule
  const nextDelivery = calculateNextDelivery(newCadence, timezone);
  // If changed Tuesday and selected Friday, next is this Friday
  
  // Create new episode
  await createEpisode({
    project_id: projectId,
    scheduled_for: nextDelivery
  });
  
  return `Next episode: ${format(nextDelivery)}`;
}
```

### Generation Fails
**Behavior**: Try 3 times, then skip this delivery
```typescript
// Retry schedule for 9am delivery (with 4-hour window):
const retrySchedule = {
  1: '5:30am', // 30 min after initial (T-3:30)
  2: '6:30am', // 1 hour after first retry (T-2:30)
  3: '7:30am'  // 1 hour after second retry (T-1:30)
};
// Still have 90 minutes buffer before delivery if all retries fail

// After final failure:
export async function handleFinalFailure(episodeId: string) {
  // Mark as failed
  await markEpisodeFailed(episodeId);
  
  // Don't send notification to user
  // Don't break the subscription
  
  // Log for founder review
  await logFailureForReview(episodeId);
  
  // Planning notes persist for next episode
  // Next episode will arrive on schedule
}
```

### Daily Episodes
**Behavior**: Same 2-hour lead time, 7 days a week
```typescript
const dailyProject = {
  cadenceConfig: {
    mode: 'daily',
    days: [0,1,2,3,4,5,6], // Every day
    deliveryHour: 8 // 8am daily
  }
};

// Generates at 4am for 8am delivery, every day
// Weekends included
// 4-hour window ensures reliability even during peak loads
```

## 📈 Scale Considerations

### Concurrent Generation Limits
```typescript
const MAX_CONCURRENT_GENERATIONS = 20;

export async function processQueue() {
  // Get current processing count
  const processing = await countProcessingEpisodes();
  
  if (processing >= MAX_CONCURRENT_GENERATIONS) {
    console.log('Queue at capacity, waiting...');
    return;
  }
  
  const slotsAvailable = MAX_CONCURRENT_GENERATIONS - processing;
  const episodes = await getNextEpisodes(slotsAvailable);
  
  // Process available slots
  await Promise.all(episodes.map(triggerGeneration));
}
```

### Database Indexes for Performance
```sql
-- CRITICAL: Add idempotency to prevent duplicate episodes
ALTER TABLE episodes 
ADD COLUMN idempotency_key TEXT,
ADD CONSTRAINT unique_episode_schedule 
UNIQUE (project_id, idempotency_key);

-- Index for queue processing
CREATE INDEX idx_episodes_generation_queue 
ON episodes(scheduled_for, status, generation_attempts)
WHERE status = 'DRAFT';

-- Index for delivery notifications
CREATE INDEX idx_episodes_delivery_queue
ON episodes(scheduled_for, status, delivered_at)
WHERE status = 'PUBLISHED' AND delivered_at IS NULL;

-- Index for timezone batching
CREATE INDEX idx_projects_timezone_delivery
ON projects(timezone, cadence_config->>'deliveryHour');
```

### Cost Projections
```typescript
// Per episode costs (conservative estimate)
const costs = {
  research: 0.50,  // GPT-4 for research (increased)
  writing: 1.00,   // Claude for writing (increased)
  qa: 0.50,        // GPT-3.5 for QA (increased)
  total: 2.00      // £2 per episode
};
// Budget £2-3 per episode for safety margin

// At scale (1000 users)
const projections = {
  daily: 1000 * 1.00 * 7,  // £7,000/week
  weekly: 1000 * 1.00,     // £1,000/week
  mixed: 1000 * 1.00 * 3.5 // £3,500/week (average)
};
```

## 🎯 Success Metrics

1. **On-time delivery rate**: >95% delivered within 15 min of scheduled time
2. **Generation success rate**: >90% succeed on first attempt
3. **Retry success rate**: >95% succeed within 3 attempts
4. **User satisfaction**: Episodes arrive predictably, like a newsletter
5. **Cost per episode**: <£3 including retries

## 🔗 Related Documentation

- [n8n Integration Patterns](./n8n-integration-patterns.md)
- [Implementation Plan](./implementation-plan.md)
- [Edge Cases to Test](./edge-cases-to-test.md)

---

**Remember**: We're building a subscription service, not an on-demand generator. Predictability and reliability matter more than speed.