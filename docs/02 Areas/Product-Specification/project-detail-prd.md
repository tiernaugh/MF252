# Project Detail Page Product Requirements Document

**Status:** In Development
**Date:** 2025-08-13
**Owner:** Product Team
**Related:** 
- [Project Detail Architecture ADR](./05-architecture-decisions/19-project-detail-architecture.md)
- [Homepage PRD](./homepage-prd.md)

## Executive Summary

The project detail page is the primary content hub for each research project - where users consume episodes, track upcoming content, and manage project settings. It must balance editorial elegance with functional clarity.

## User Stories

### Regular Reader
> "As someone checking my weekly episodes, I want to immediately see what's new and start reading without friction."

### Engaged User  
> "As someone who provides feedback, I want to see what's coming next and understand how I can influence it."

### Power User
> "As someone with multiple projects, I want to quickly assess project health and find specific past episodes."

## MVP Requirements

### 1. Page Header
Minimal, functional header with:
- **Project Avatar**: Initials in circular badge (consistent with projects list)
- **Project Title**: Clear, prominent
- **Project Description**: One-line context
- **Metadata Bar**: "WEEKLY INTELLIGENCE • X EPISODES • ACTIVE"
- **Settings Icon**: Access to pause/resume, edit brief, danger zone

### 2. Hero Episode (Latest Published)
Editorial treatment for the most recent episode:
- **Episode Number & Reading Time**: "EPISODE 4 • 15 MIN READ" 
- **Large Title**: 2.5-3rem font size, serif typeface
- **Pull Quote**: Highlighted key insight in larger italic text
- **Summary**: 1-2 line description of episode focus
- **Activity Indicators**: 
  - "NEW" badge if published < 7 days
  - "UNREAD" indicator if not opened
- **Sources Count**: Subtle "5 sources cited" with icon
- **CTA**: Prominent "Read episode" button

### 3. Next Episode Preview
When episode is scheduled:
- **Section Header**: "COMING THURSDAY" (dynamic day)
- **Preview Questions**: 2-3 research questions being explored
- **Influence Timer**: "You can influence this episode for another 6 hours"
- **Status Indicator**: Dot showing scheduled/generating/ready

### 4. Previous Episodes
Searchable archive:
- **Section Header**: "PREVIOUS EPISODES"
- **Search Bar**: Filter by title/content
- **Episode Cards**: 
  - Title, summary, publish date
  - Activity indicators (NEW/UNREAD)
  - Hover state with subtle lift
  - Click anywhere to open

### 5. Project Info Sidebar
Contextual information:
- **Project Status**: Active/Paused with indicator
- **Cadence**: Weekly/Biweekly/Monthly
- **Next Episode Date**: Or "Paused" if inactive
- **Last Published**: Date of most recent episode
- **Total Episodes**: Count of published episodes
- **Project Brief**: Expandable context from onboarding

## Design Specifications

### Layout
- **Background**: `stone-50` (off-gray for premium feel)
- **Container**: Max-width 6xl, responsive grid
- **Main Content**: 2/3 width on desktop
- **Sidebar**: 1/3 width on desktop, below on mobile

### Typography
- **Hero Title**: `text-4xl md:text-5xl font-serif`
- **Pull Quotes**: `text-xl md:text-2xl font-serif italic`
- **Body Text**: `text-base` with good line height
- **Metadata**: `text-xs uppercase tracking-wider`

### Visual Elements
- **Cards**: White background, `border-stone-200`, hover shadow
- **Activity Badges**: 
  - NEW: `bg-blue-100 text-blue-700`
  - UNREAD: `bg-amber-100 text-amber-700`
- **Dividers**: Gradient lines between sections
- **Status Dots**: Green (active), Gray (paused), Amber (generating)

### Interactions
- **Hover States**: Cards lift with shadow, color transitions
- **Search**: Instant filter with smooth animations
- **Loading**: Skeleton screens for async data
- **Transitions**: 200-300ms for all animations

## Data Requirements

```typescript
// Episode with activity tracking
interface Episode {
  id: string;
  sequence: number;
  title: string;
  summary: string;
  content: string; // Markdown with inline sources
  sources: Source[];
  highlightQuote?: string;
  publishedAt: Date;
  readingMinutes: number;
  
  // Activity tracking (future)
  isNew: boolean; // Published < 7 days
  isRead: boolean; // User has opened
  readProgress?: number; // 0-100 percentage
}

// Next episode preview
interface UpcomingEpisode {
  scheduledAt: Date;
  status: 'scheduled' | 'generating' | 'ready';
  previewQuestions?: string[]; // Research questions
  influenceDeadline?: Date; // When feedback window closes
}
```

## Future Enhancements

### Reading Progress
- Progress bar on episode cards
- "Continue reading" quick action
- Time spent tracking

### Engagement Metrics
- View count per episode
- Average read percentage
- Feedback sentiment visualization

### Social Features
- Share episode snippets
- Export to Notion/Obsidian
- Team highlights (post-MVP)

## Success Metrics

1. **Episode Open Rate**: >80% within 7 days
2. **Search Usage**: Track to understand navigation patterns
3. **Preview Engagement**: % who view upcoming questions
4. **Settings Access**: Monitor pause/resume patterns

## Out of Scope for MVP

- Episode bookmarking
- Custom sorting/filtering
- Bulk episode actions
- Episode version history
- Citation credibility scores
- Reading time estimates per user