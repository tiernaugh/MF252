# Episode Reader Product Requirements Document

**Status:** In Development
**Date:** 2025-08-13
**Owner:** Product Team
**Related:** 
- [Episode Reader Architecture ADR](./20-episode-reader-architecture.md)
- [Project Detail PRD](./project-detail-prd.md)

## Executive Summary

The episode reader is the core consumption experience - where users spend most of their time engaging with AI-generated strategic intelligence. It must deliver a premium, focused reading experience that feels more like a high-end publication than a productivity app.

## User Stories

### Focused Reader
> "As someone consuming weekly intelligence, I want a distraction-free, beautiful reading experience that respects my attention."

### Active Learner  
> "As someone who takes notes and shares insights, I want to easily highlight, annotate, and reference specific passages."

### Skeptical Executive
> "As someone evaluating AI-generated content, I want to see sources and understand the research basis for claims."

## MVP Requirements

### 1. Minimal Navigation
Icon-based navigation that stays out of the way:
- **Home Icon**: Return to projects (left position)
- **Project Name**: Centered, subtle link back to project
- **Share Icon**: Access sharing options (right position)
- **Auto-Hide**: Navigation hides on scroll down, reappears on scroll up
- **No Breadcrumbs**: Avoid cluttering the reading experience

### 2. Hero Header
Centered, editorial treatment:
- **Episode Badge**: Single "Episode X" pill, centered
- **Title**: 5xl serif font (Lora or similar), centered, balanced wrapping
- **Subtitle**: 1-2 line summary, light weight, generous line height
- **Publication Date**: Single timestamp, subtle presentation
- **Reading Time**: Integrated naturally, not as a badge

### 3. Content Layout
Optimized for reading:
- **Max Width**: 3xl (768px) for optimal reading length
- **Generous Padding**: px-8 minimum, py-16 for breathing room
- **Typography**: 
  - Headers: Serif or strong sans-serif
  - Body: Clean sans-serif, 16-18px base size
  - Line Height: 1.6-1.8 for comfort
- **Markdown Rendering**: Full support with proper styling
- **Inline Sources**: Hyperlinked citations within text

### 4. Visual Elements
Support understanding without distraction:
- **Pull Quotes**: Large italic serif, left border accent
- **Section Breaks**: Subtle dividers or spacing
- **Blockquotes**: Distinguished styling with border
- **Code Blocks**: If needed, with syntax highlighting
- **Images**: Full-width within content column

### 5. Source Attribution
Build trust through transparency:
- **Inline Links**: Sources as hyperlinks in context
- **Source List**: Optional expandable list at end
- **Publication Dates**: Show recency of sources
- **Credibility Indicators**: Future enhancement

### 6. Feedback Collection
Subtle, non-intrusive:
- **Position**: After content, before footer
- **Design**: Card with soft background
- **Rating**: 1-5 stars or satisfaction scale
- **Optional Text**: Expandable text area
- **Thank You State**: Graceful post-submission

### 7. Interactive Features (Future)
Progressive enhancement:
- **Text Selection**: Highlight to annotate/share
- **Margin Notes**: Personal annotations
- **Share Snippets**: Share specific passages
- **Export Options**: PDF, Markdown, Notion

## Design Specifications

### Colors & Theme
- **Background**: Pure white or off-white (#FAFAFA)
- **Text**: High contrast black (#111111)
- **Accents**: Subtle grays, occasional brand color
- **Links**: Underlined or distinct color

### Typography Scale
```css
.episode-title { 
  font-size: 3rem; /* 48px */
  line-height: 1.2;
  font-family: 'Lora', 'Georgia', serif;
}

.section-header {
  font-size: 1.875rem; /* 30px */
  line-height: 1.3;
  font-weight: 600;
}

.body-text {
  font-size: 1.125rem; /* 18px */
  line-height: 1.7;
  color: #374151;
}

.caption {
  font-size: 0.875rem; /* 14px */
  color: #6B7280;
}
```

### Responsive Behavior
- **Mobile**: Full width with px-4 padding
- **Tablet**: Centered with moderate padding
- **Desktop**: Max-width 3xl, generous margins

### Animation & Transitions
- **Scroll Behaviors**: Smooth, not jarring
- **Navigation Hide**: 300ms ease-in-out
- **Hover States**: Subtle, 200ms transitions
- **Page Load**: Progressive, avoid layout shift

## Data Requirements

```typescript
interface EpisodeReader {
  episode: Episode;
  project: Project;
  readingProgress?: number; // 0-100 percentage
  highlights?: Highlight[]; // User annotations
  feedback?: {
    rating: number;
    comment?: string;
    submittedAt: Date;
  };
}

interface Highlight {
  id: string;
  text: string;
  position: { start: number; end: number };
  note?: string;
  createdAt: Date;
}
```

## Performance Requirements

### Speed Targets
- **Initial Paint**: < 1 second
- **Interactive**: < 2 seconds
- **Smooth Scroll**: 60fps throughout
- **Image Loading**: Progressive/lazy

### Reading Metrics
- **Time on Page**: Track engagement
- **Scroll Depth**: Measure completion
- **Highlight Count**: Engagement indicator
- **Source Clicks**: Trust verification

## Accessibility Requirements

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Semantic HTML, ARIA labels
- **Font Scaling**: Responds to user preferences
- **High Contrast**: Maintains readability
- **Focus Indicators**: Clear but not intrusive

## Success Metrics

1. **Read Completion**: >70% scroll depth average
2. **Time on Page**: 5-10 minutes average
3. **Feedback Rate**: >30% provide ratings
4. **Source Clicks**: >20% click at least one source
5. **Return Rate**: >60% read next episode

## Out of Scope for MVP

- Real-time collaboration
- Audio narration
- Translation features
- Complex annotations system
- Social highlighting
- Reading position sync across devices
- Offline reading mode

## Competitive Inspiration

- **Medium**: Clean reading experience
- **Substack**: Newsletter aesthetics
- **Stratechery**: Premium newsletter feel
- **The Information**: High-end publication
- **Monocle**: Editorial sophistication

## Key Differentiators

1. **AI Transparency**: Sources always visible
2. **Research Depth**: Not just summary but synthesis
3. **Personal Context**: Tailored to user's project
4. **Feedback Loop**: Shapes future episodes
5. **Premium Feel**: Worth paying for