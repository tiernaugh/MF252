# Product Requirements Document: Project Settings

**Feature:** Project Settings Page  
**Version:** 1.0  
**Date:** 2025-08-15  
**Author:** Product Team  
**Status:** In Development

## Executive Summary

The Project Settings page provides users with centralized control over their research project configuration, including episode scheduling, project memories, and administrative actions. This feature balances immediate MVP functionality with a clear path toward future enhancements, particularly around flexible scheduling and tiered pricing.

## Problem Statement

Users need a way to:
1. View and understand their project configuration
2. Control when episodes are delivered
3. Manage what the AI remembers about their preferences
4. Pause or delete projects as needed

Currently, these controls don't exist, limiting user agency and potentially causing episodes to be delivered at inconvenient times or with misaligned focus.

## Goals & Success Metrics

### Goals
- **User Control**: Give users complete flexibility over their research schedule
- **Simplicity**: No artificial restrictions on frequency
- **Future-Proof**: Design for expansion without major rework
- **Editorial Feel**: Maintain magazine-like quality, not SaaS dashboard

### Success Metrics
- **Engagement**: >50% of users customize their delivery schedule within first week
- **Retention**: Track correlation between schedule customization and retention
- **Cost Learning**: Understand true cost-per-episode at different frequencies
- **Performance**: Settings page loads in <1 second

## User Stories

### As a busy executive
I want to **choose which day my episodes arrive**  
So that **I can read them during my dedicated research time**

### As a strategic planner
I want to **see what the AI has learned about my interests**  
So that **I can correct any misunderstandings and improve relevance**

### As a project owner
I want to **pause episode generation during busy periods**  
So that **I don't accumulate unread content**

### As a user exploring options
I want to **understand what scheduling features are available at higher tiers**  
So that **I can decide if upgrading is worthwhile**

## Requirements

### Functional Requirements

#### Project Overview Section
- **P0**: Display project title (read-only)
- **P0**: Show full project brief in scrollable container
- **P0**: Include disclaimer that briefs cannot be edited
- **P2**: Future: Link to brief versioning/history

#### Episode Schedule Section
- **P0**: Day-of-week selector (Mon-Sun) as square buttons
- **P0**: Multiple day selection (any combination)
- **P0**: Quick presets: "Weekdays", "Every day"
- **P0**: Display next episode date (e.g., "Next episode: Tuesday 20 Aug")
- **P0**: Save/Cancel buttons for schedule changes
- **P0**: Real-time preview of next episode date
- **P1**: Show number of episodes per month based on selection
- **P2**: Future: Time preference selection

#### Memories Section (Post-MVP)
- **Future**: List of learned insights/preferences
- **Future**: Individual delete buttons per memory
- **Future**: "Clear all memories" action with confirmation
- **Future**: Toggle for allowing new memory creation
- **Future**: Edit memories inline
- **Future**: Memory importance/weight adjustment

#### Project Actions Section
- **P0**: Pause project button (stops episode generation)
- **P0**: Delete project button (with confirmation dialog)
- **P1**: Visual distinction between pause (reversible) and delete (permanent)
- **P2**: Future: Export project data
- **P2**: Future: Archive project (hidden but not deleted)

### Non-Functional Requirements

#### Design & UX
- **Editorial aesthetic**: Magazine-like, not dashboard
- **No explicit times shown**: Maintain "publication" feel vs "appointment"
- **Responsive design**: Full mobile support
- **Accessibility**: WCAG 2.1 AA compliance
- **Loading states**: Skeleton screens while data loads

#### Performance
- **Page load**: <1 second on 3G connection
- **Interactions**: <100ms response time
- **Optimistic updates**: Immediate UI feedback

#### Technical
- **Timezone handling**: Store user timezone, calculate server-side
- **State management**: Local state with mock data (MVP)
- **Type safety**: Full TypeScript coverage
- **Future-proof schema**: Support for complex scheduling patterns

## User Experience

### Navigation Flow
1. User clicks settings icon on Project Detail page
2. Navigates to `/projects/[id]/settings`
3. Page uses minimal navigation (auto-hides on scroll)
4. Back button returns to Project Detail

### Visual Design
- **Typography**: Serif headings following design system
- **Color palette**: Stone colors with white backgrounds
- **Interactive elements**: 300ms transitions, shadow-xl on hover
- **Layout**: Centered content, max-width constrained

### Interaction Patterns
- **Day selection**: Click to toggle selection (multiple allowed)
- **Presets**: Quick buttons for common patterns (Weekdays, Every day)
- **Save required**: Explicit save action to commit schedule changes
- **Preview**: Shows next episode date before saving
- **Confirmations**: Inline for destructive actions (delete)
- **Feedback**: Success message after save

## Technical Specifications

### Data Model
```typescript
interface User {
  timezone: string; // "Europe/London"
}

interface Project {
  cadenceConfig: {
    mode: 'weekly' | 'daily' | 'weekdays' | 'custom';
    days: number[]; // [0-6] where 0=Sunday
  };
  memories?: string[];
  isPaused: boolean;
}
```

### API Endpoints (Future)
- `PATCH /api/projects/[id]/schedule` - Update cadence configuration
- `PATCH /api/projects/[id]/pause` - Toggle pause state
- `DELETE /api/projects/[id]` - Delete project
- `DELETE /api/projects/[id]/memories/[memoryId]` - Remove memory

### Security Considerations
- Organization-scoped queries only
- User must own project to access settings
- Audit trail for deletions
- Rate limiting on updates

## Constraints & Limitations

### MVP Limitations
- No memories UI (backend only)
- No time preference selection (default 9am)
- Mock data only (no database persistence)
- No team/collaboration features
- Single project limit (pricing control)

### Technical Constraints
- Must work with existing mock data structure
- Cannot break existing pages
- Must pass TypeScript strict mode
- Limited to client-side state management

## Future Enhancements

### Phase 2 (Post-MVP)
- Database persistence
- Multiple day selection for Growth tier
- Custom scheduling patterns
- Time preference selection
- Email notification preferences

### Phase 3 (Scale)
- Team shared projects
- Bulk project management
- Schedule templates
- API access for settings
- Advanced memory management

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users confused by locked features | Medium | Clear upgrade prompts and benefits |
| Timezone bugs affect delivery | High | Thorough testing, server-side calculation |
| Accidental project deletion | High | Confirmation dialog, future: soft delete |
| Memory management complexity | Medium | Start simple, iterate based on usage |

## Dependencies

- Mock data structure update
- Design system components (Card, Button, Badge)
- Navigation routing setup
- Timezone detection library

## Timeline

- **Week 1**: Build UI with mock data
- **Week 1**: Update data schema
- **Week 2**: Add interactivity and state management
- **Week 2**: Testing and refinement
- **Future**: Database integration

## Open Questions

1. Should deleted projects be soft-deleted (recoverable) or hard-deleted?
2. How long should paused projects remain paused before auto-archiving?
3. Should schedule changes take effect immediately or next cycle?
4. What's the default publishing time in user's timezone? (Currently 9 AM)
5. Should we track and display when settings were last modified?

## Acceptance Criteria

- [ ] Settings page accessible from Project Detail
- [ ] All sections render with mock data
- [ ] Day selection updates mock data
- [ ] Pause/resume toggles project state
- [ ] Delete shows confirmation and removes project
- [ ] Memories can be individually deleted
- [ ] Page responsive on mobile
- [ ] No TypeScript errors
- [ ] Passes build process