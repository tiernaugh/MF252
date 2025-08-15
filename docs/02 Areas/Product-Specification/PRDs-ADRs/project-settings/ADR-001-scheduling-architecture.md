# ADR-001: Episode Scheduling Architecture

**Date:** 2025-08-15  
**Status:** Accepted  
**Context:** Project Settings Feature

## Context

We need to design a scheduling system that:
1. Allows complete flexibility - any combination of days
2. Handles timezones correctly without confusing users
3. Maintains an editorial "publication" feel rather than a transactional "appointment" feel
4. Uses project limits for pricing control, not frequency restrictions
5. Enables learning true cost-per-episode during MVP

## Decision

We will implement a **flexible cadence configuration** system that:

1. **Stores user timezone separately** from scheduling configuration
2. **Uses a mode + days pattern** for schedule definition
3. **Calculates publishing times server-side** without exposing them to users
4. **Defaults to 9 AM in the user's local timezone** for all episodes

### Data Structure

```typescript
// User-level timezone (captured during onboarding)
interface User {
  timezone: string; // IANA timezone e.g., "Europe/London"
}

// Project-level scheduling
interface Project {
  cadenceConfig: {
    mode: 'weekly' | 'daily' | 'weekdays' | 'custom';
    days: number[];     // [0-6] where 0=Sunday, 1=Monday, etc.
    // Note: No time field - managed server-side
  };
  nextScheduledAt: Date | null; // UTC timestamp
  isPaused: boolean;
}
```

### UI Pattern

```
Select days:
[M] [T] [W] [T] [F] [S] [S]
 ▲   ▲   ▲   ▲   ▲           (weekdays selected)

Quick presets: [Weekdays] [Every day]

Next episode: Monday 18 Aug (in 3 days)
Episodes per month: ~20

[Cancel] [Save Changes]
```

## Consequences

### Positive

1. **Maximum flexibility**: Users can choose any schedule they want
2. **Simple pricing**: Control via project limits, not frequency
3. **User-friendly**: No artificial restrictions or confusing rules
4. **Learning opportunity**: Understand true usage patterns and costs
5. **Editorial feel**: No times shown maintains publication aesthetic

### Negative

1. **Cost uncertainty**: Daily episodes might be expensive (learning required)
2. **Server dependency**: All date calculations must happen server-side
3. **Migration needed**: Moving from simple `cadenceType` to `cadenceConfig`
4. **Potential abuse**: Users could schedule 7 days/week immediately

## Alternatives Considered

### Alternative 1: Simple Enum-Based Scheduling
```typescript
cadenceType: 'WEEKLY' | 'BIWEEKLY' | 'DAILY'
dayOfWeek?: number; // For weekly only
```
- ✅ Simple to implement
- ❌ Requires migration for custom patterns
- ❌ Can't support MWF or other specific patterns

### Alternative 2: Cron Expression
```typescript
schedule: string; // "0 9 * * 2" for Tuesday 9 AM
```
- ✅ Infinitely flexible
- ❌ Too complex for users to understand
- ❌ Harder to build UI around
- ❌ Overkill for our use cases

### Alternative 3: Full Calendar Integration
```typescript
scheduleRules: CalendarRule[]; // Complex recurring event rules
```
- ✅ Handles every edge case
- ❌ Massive complexity overhead
- ❌ Poor UX for simple cases
- ❌ Expensive to implement

## Implementation Notes

### Phase 1 (MVP)
1. Full flexibility - any combination of days
2. Quick presets for Weekdays and Every Day
3. Backend stores full `cadenceConfig` structure
4. Publishing fixed at 9 AM user's local time
5. Single project limit for pricing control

### Phase 2 (Growth)
1. Multiple projects (3-5)
2. Project-based pricing tiers
3. Usage analytics to understand costs

### Phase 3 (Scale)
1. Unlimited projects
2. Time preference selection
3. Team projects with shared schedules
4. Advanced scheduling (pause periods, holidays)

### Critical Implementation Details

1. **Timezone Detection**
   ```typescript
   // During onboarding (client-side)
   const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
   ```

2. **Next Episode Calculation**
   ```typescript
   // Server-side only
   function calculateNextEpisode(project: Project, user: User): Date {
     const { days } = project.cadenceConfig;
     const userTime = "09:00"; // Fixed for MVP
     
     // Find the next day that matches selected days
     const today = new Date();
     for (let i = 1; i <= 7; i++) {
       const checkDate = addDays(today, i);
       if (days.includes(checkDate.getDay())) {
         return convertToUTC(checkDate, userTime, user.timezone);
       }
     }
   }
   ```

3. **Display Format**
   ```typescript
   // Never show times to user
   formatEpisodeDate(date) => "Tuesday 20 Aug" // NOT "Tuesday 20 Aug at 9:00 AM"
   ```

## Migration Strategy

From current schema:
```typescript
// Old
cadenceType: "WEEKLY"
nextScheduledAt: Date

// New
cadenceConfig: {
  mode: 'weekly',
  days: [2], // Default to Tuesday
}
nextScheduledAt: Date // Unchanged
```

Migration script:
1. Map `WEEKLY` → `{ mode: 'weekly', days: [2] }`
2. Map `BIWEEKLY` → `{ mode: 'weekly', days: [2] }` (interval support later)
3. Map `DAILY` → `{ mode: 'daily', days: [0,1,2,3,4,5,6] }`

## Security Considerations

1. **Timezone Validation**: Ensure IANA timezone format
2. **Schedule Validation**: Prevent invalid day combinations
3. **Rate Limiting**: Prevent rapid schedule changes
4. **Audit Trail**: Log all schedule modifications

## References

- [IANA Timezone Database](https://www.iana.org/time-zones)
- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [Design System Documentation](../../../Design/design-language.md)