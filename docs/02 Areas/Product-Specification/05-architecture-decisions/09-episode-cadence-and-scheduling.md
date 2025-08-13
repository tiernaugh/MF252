# 09. Episode Cadence and Scheduling Architecture

## Context

Many Futures requires a robust cadence system that manages when episodes are generated and delivered to users. This system must balance three critical constraints:

1. **User Control Desires**: Users want predictable scheduling and some control over timing
2. **Business Requirements**: System must be scalable, cost-efficient, and support high daily volume
3. **Technical Feasibility**: Implementation must be reliable, maintainable, and future-extensible

The cadence system is foundational to the platform's value proposition of consistent, scheduled research delivery.

## Decision

**MVP Strategy: Daily-First with System-Controlled Timing**

### Core Architecture Principles

#### 1. **Progressive User Control**
- **MVP Phase**: Minimal user control (**Pause/Resume**) with daily default; "Skip Next" is intentionally excluded due to ambiguous expectations
- **Fast-Follow**: Graduated control (weekly/biweekly, day-of-week selection)
- **Future**: Full scheduling control (exact times, custom windows)

**Rationale**: Allows rapid MVP launch while providing clear upgrade path for user sophistication.

#### 2. **System Authority Over Exact Timing**
- **User Communication**: "Estimated next episode: Tuesday (local)" — date only, no time commitment
- **System Reality**: Scheduler chooses exact time within 3-4 hour windows
- **Business Benefit**: Load balancing, queue management, cost optimization

**Rationale**: Prevents over-promising while enabling backend optimization and capacity planning.

#### 3. **Future-Proof Data Model**
- **Schema Design**: All future features supported without database migrations
- **Extensibility**: JSONB configuration fields allow new capabilities
- **Audit Trail**: Complete change history for debugging and analytics

**Rationale**: Reduces technical debt and enables rapid feature iteration.

### Technical Architecture

#### Database Schema Design

```sql
-- Projects table cadence configuration
CREATE TABLE projects (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  name text NOT NULL,
  
  -- Core cadence control
  cadence_type text NOT NULL DEFAULT 'daily' 
    CHECK (cadence_type IN ('daily', 'weekly', 'biweekly')),
  
  cadence_config jsonb NOT NULL DEFAULT '{
    "tz": "UTC",
    "windowStartHour": 9,
    "windowEndHour": 12
  }'::jsonb,
  
  -- Scheduler state (system-maintained)
  next_scheduled_at timestamptz,
  last_published_at timestamptz,
  
  -- User controls
  is_paused boolean NOT NULL DEFAULT false,
  -- Note: retained for future use; not exposed in MVP UI
  skip_next boolean NOT NULL DEFAULT false,
  
  -- Business controls
  daily_cap_reached boolean NOT NULL DEFAULT false,
  queue_priority integer NOT NULL DEFAULT 5,
  
  -- Planning notes (hidden in MVP UI)
  planning_notes text,
  
  -- Audit trail
  cadence_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Episode scheduling queue
CREATE TABLE scheduled_episodes (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id),
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'assembling', 'completed', 'failed', 'skipped')),
  
  -- Scheduling metadata
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  chosen_by_scheduler_at timestamptz NOT NULL DEFAULT now(),
  
  -- Queue management
  queue_position integer NOT NULL,
  estimated_duration_minutes integer NOT NULL DEFAULT 15,
  assigned_worker text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

#### Timezone Handling Strategy

```typescript
// Frontend: Auto-detect user timezone
const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// Result: "America/New_York", "Europe/London", etc.

// Backend: Store as IANA timezone string
interface CadenceConfig {
  tz: string; // "America/New_York"
  windowStartHour: number; // 9 (9:00 AM local)
  windowEndHour: number; // 12 (12:00 PM local)
  
  // Fast-follow fields
  preferredDow?: 1 | 2 | 3 | 4 | 5 | 6 | 7; // Monday=1, Sunday=7
  
  // Future expansion
  exactTime?: string; // "14:30"
  customWindows?: Array<{
    start: number;
    end: number;
    weight: number;
  }>;
}
```

#### Scheduling Algorithm

```typescript
function scheduleNextEpisode(project: Project): Date | null {
  const { tz, windowStartHour, windowEndHour } = project.cadence_config;
  
  // Respect user controls
  if (project.is_paused) return null;
  
  // Calculate next occurrence in user's timezone
  const nextDate = calculateNextCadenceDate(project.cadence_type, tz);
  
  // System chooses random time within window (load balancing)
  const randomHour = randomBetween(windowStartHour, windowEndHour);
  const randomMinute = randomBetween(0, 59);
  
  // Combine date and time in user timezone, convert to UTC
  return toUTC(setTime(nextDate, randomHour, randomMinute), tz);
}

function calculateNextCadenceDate(cadenceType: string, timezone: string): Date {
  const now = toTimezone(new Date(), timezone);
  
  switch (cadenceType) {
    case 'daily':
      return addDays(now, 1);
    case 'weekly':
      return addWeeks(now, 1);
    case 'biweekly':
      return addWeeks(now, 2);
    default:
      throw new Error(`Unsupported cadence type: ${cadenceType}`);
  }
}
```

### User Experience Contract

#### MVP User Interface
```
┌─ Project Settings ─────────────────────────────┐
│                                                │
│ Episode Cadence: Daily                         │
│ Status: Active                                 │
│ Estimated next episode: Tuesday (local)        │
│                                                │
│ [ Pause Episodes ]                             │
│                                                │
└────────────────────────────────────────────────┘
```

#### UX Messaging Strategy
- **Clear System Authority**: "Estimated" emphasizes scheduler control
- **Local Context**: Show local DATE only (no time commitment)
- **Upgrade Path**: Daily now; weekly/biweekly with day-of-week picker later
- **Simple Actions**: Pause/Resume only in MVP; "Skip Next" intentionally excluded (may return as a clearly defined fast-follow)

### Business Risk Mitigation

#### Cost Management
```typescript
// Org-level daily caps
interface Organization {
  daily_episode_cap: number; // Default: 50 episodes/day
  current_daily_count: number;
  cap_reset_at: Date; // UTC midnight
}

// Queue depth monitoring
interface QueueMetrics {
  current_depth: number;
  average_processing_time: number;
  estimated_backlog_hours: number;
}
```

#### Load Balancing
- **Time Window Distribution**: Spread episodes across 3-4 hour windows
- **Queue Priority System**: 1-10 scale for subscriber tiers
- **Capacity Planning**: Estimated duration tracking for resource allocation
- **Graceful Degradation**: Automatic fallback to longer cadences under load

### Fast-Follow Roadmap

The architecture supports these features without schema changes:

1. **Weekly/Bi-weekly Cadence** (3 months)
2. **Day-of-Week Picker** with clear UX copy (no time selection)
3. **User Timezone Override** in Account Settings
4. **Narrower publishing windows** by subscription tier
5. **Optional "Skip Next"** with explicit copy describing behavior (delay vs. reshuffle)
6. **Multiple cadence profiles** per project
