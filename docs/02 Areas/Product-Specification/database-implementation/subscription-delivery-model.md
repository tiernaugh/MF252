# Subscription Delivery Model

**Created:** 2025-08-15  
**Status:** 🟢 Architecture Defined  
**Context:** How episodes are scheduled, generated, and delivered at scale

## 🎯 Core Concept

Many Futures is a **subscription intelligence service**, not an on-demand content generator:
- Users set their preferred delivery schedule (e.g., "Every Monday at 9am")
- Episodes are pre-generated 2 hours before delivery for freshness
- Email notifications sent at the scheduled time (like Substack)
- Failed generations don't break the subscription - we skip and continue

## ⏰ Timeline for Episode Delivery

### Example: Monday 9am Delivery

```
Sunday 11pm: Create DRAFT episode record
Monday 7:00am: Start generation (T-2:00)
Monday 7:15am: First retry if failed (T-1:45)
Monday 7:45am: Second retry (T-1:15)
Monday 8:30am: Final retry (T-0:30)
Monday 9:00am: Send email if successful
Monday 9:01am: Create next week's DRAFT
```

## 📊 Queue Distribution Strategy

### Timezone-Based Batching

```typescript
// Process episodes by timezone to distribute load
const timezoneSchedule = {
  'UTC': {
    8: '6:00',  // Generate at 6am for 8am delivery
    9: '7:00',  // Generate at 7am for 9am delivery
    10: '8:00', // Generate at 8am for 10am delivery
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
// Cron job runs every 5 minutes
export async function processQueue() {
  const now = new Date();
  const twoHoursFromNow = addHours(now, 2);
  
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
// Retry schedule for 9am delivery:
const retrySchedule = {
  1: '7:15am', // 15 min after initial
  2: '7:45am', // 30 min after first retry
  3: '8:30am'  // 45 min after second retry
};

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

// Generates at 6am for 8am delivery, every day
// Weekends included
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
// Per episode costs (estimated)
const costs = {
  research: 0.30,  // GPT-4 for research
  writing: 0.50,   // Claude for writing
  qa: 0.20,        // GPT-3.5 for QA
  total: 1.00      // £1 per episode
};

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
5. **Cost per episode**: <£2 including retries

## 🔗 Related Documentation

- [n8n Integration Patterns](./n8n-integration-patterns.md)
- [Implementation Plan](./implementation-plan.md)
- [Edge Cases to Test](./edge-cases-to-test.md)

---

**Remember**: We're building a subscription service, not an on-demand generator. Predictability and reliability matter more than speed.