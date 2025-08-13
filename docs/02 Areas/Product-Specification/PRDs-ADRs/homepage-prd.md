# Homepage Product Requirements Document

**Status:** In Development  
**Date:** 2025-08-13  
**Owner:** Product Team  
**Related:** 
- [Homepage Architecture ADR](./18-homepage-architecture.md)
- [Projects Summary API](../05-architecture-decisions/08-home-summary-and-homepage.md)

## Executive Summary

The homepage is the primary landing experience after authentication - a command center that helps users navigate their strategic intelligence projects. It must serve both new users (clear onboarding) and returning users (quick access to content).

## User Stories

### New User
> "As someone who just signed up, I want to immediately understand what Many Futures does and how to get started, so I can create my first project without confusion."

### Returning User  
> "As someone with active projects, I want to quickly see what's new and jump into my content, so I can stay informed efficiently."

### Power User
> "As someone managing multiple projects, I want to see activity across all projects at a glance, so I can prioritize my reading."

## MVP Requirements (Phase 0)

### 1. Empty State (No Projects)
When a user has no projects, display:
- **Welcome Message**: Personalized with user's first name
- **Value Proposition**: Brief explanation (2-3 lines) of what Many Futures does
- **Primary CTA**: "Create Your First Project" button (prominent, can't miss)
- **Optional Guide**: 3 bullet points of what they'll get

Example:
```
Welcome to Many Futures, [Name]!

Your AI-powered research assistant that delivers weekly strategic intelligence 
tailored to your interests and goals.

[Create Your First Project] <- Large button

✓ Weekly research episodes on your schedule
✓ Curated insights from 100+ sources  
✓ Personalized to your industry and focus
```

### 2. Project List (Has Projects)
When a user has projects, display:
- **Section Header**: "Your Projects" with count
- **Project Cards**: Grid layout (responsive: 1 col mobile, 2-3 cols desktop)
- **Quick Actions**: "New Project" button (secondary prominence)

Each Project Card shows:
- **Title**: Project name (truncate if needed)
- **Description**: Short summary (2 lines max)
- **Status Indicator**: Active/Paused badge
- **Activity**: "X episodes" or "Last episode Y days ago"
- **Action**: Click anywhere to open project

### 3. Organization Context
- Show organization name in header or sidebar
- Format: "[User]'s Team" for personal orgs
- No org switcher in MVP (handled by sidebar)

## Future Enhancements (Post-MVP)

### Continue Reading Section
- Most recent unfinished episode
- Reading progress indicator
- One-click resume

### Recently Published
- Last 3-5 episodes across all projects
- Chronological order
- Quick open actions

### Pinned Projects
- User-selected priority projects
- Always visible at top
- Quick status updates

### Activity Feed
- New episodes published
- Feedback received
- System notifications

## Design Specifications

### Layout
- **Container**: Max-width 1200px, centered
- **Padding**: Consistent with design system (p-6 or p-8)
- **Grid**: 12-column base, responsive breakpoints

### Typography
- **Page Title**: Hidden or minimal (content speaks)
- **Section Headers**: Small, uppercase, muted color
- **Card Titles**: Medium weight, clear hierarchy
- **Body Text**: Regular weight, good contrast

### Colors
- **Background**: White or very light gray
- **Cards**: White with subtle border or shadow
- **Status Badges**: Green (active), Gray (paused), Blue (new)
- **CTAs**: Primary brand color for main action

### Interactions
- **Hover States**: Subtle elevation or border change on cards
- **Loading**: Skeleton screens for data fetching
- **Transitions**: Smooth, not distracting (200-300ms)

## Performance Requirements

### Speed Targets
- **Initial Load**: < 1 second to interactive
- **Data Fetch**: < 300ms for project list
- **Navigation**: Instant feel with optimistic updates

### Technical Approach
- Server-side rendering for initial data
- Minimal JavaScript for interactions
- Lazy load images and non-critical content
- Cache project data appropriately

## Analytics & Metrics

### Track These Events
- `homepage_viewed` - With project count
- `project_opened` - Which project, from where
- `create_project_clicked` - From empty state or list
- `session_duration` - Time on homepage

### Success Metrics
- **Activation Rate**: % of new users creating first project
- **Time to Action**: Seconds until first click
- **Return Rate**: Daily active users / monthly active
- **Project Engagement**: % of projects opened weekly

## Accessibility Requirements

- **Keyboard Navigation**: Tab through all interactive elements
- **Screen Readers**: Proper ARIA labels and landmarks
- **Focus Indicators**: Clear visual focus states
- **Color Contrast**: WCAG AA minimum
- **Responsive**: Works on all screen sizes

## Error States

### No Organization
- Should not happen with auto-creation
- Fallback: Create org in middleware
- Show friendly error if all fails

### Data Loading Failed
- "Unable to load projects"
- Retry button
- Link to support

### Partial Data
- Show what loaded successfully
- Indicate issues with specific items
- Don't block entire experience

## Implementation Notes

### Data Requirements
```typescript
// Minimum project data needed
interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused';
  episodeCount: number;
  lastActivityAt: Date | null;
  createdAt: Date;
}
```

### Component Structure
```
HomePage (Server Component)
├── PageHeader (organization name)
├── ProjectList or EmptyState
│   ├── ProjectCard (repeated)
│   └── CreateProjectButton
└── QuickActions (floating or fixed)
```

### State Management
- Server-side data fetching (no client state for MVP)
- URL state for filters/sort (future)
- Optimistic updates for actions (future)

## Out of Scope for MVP

- Search/filter functionality
- Bulk actions on projects
- Drag-and-drop reordering
- Advanced sorting options
- Export/import features
- Collaboration features
- Mobile app considerations

## Questions to Validate

1. Is "Create Project" the right terminology? Or "Start Research"?
2. Should we show a sample project for new users?
3. How much onboarding is too much?
4. Grid vs list view preference?
5. Need for project categories/tags?

## Success Definition

The homepage succeeds when:
1. New users create their first project within 2 minutes
2. Returning users reach their content in < 5 seconds
3. Zero confusion about next steps
4. Consistent daily usage patterns emerge