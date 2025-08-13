# Episode Reading Experience PRD (Lean MVP)

## Overview
The episode reading experience is the core value delivery moment of Many Futures. For the MVP, we're stripping this down to its essence: beautiful, focused reading with simple feedback collection.

## Philosophy: Radical Simplification
**From:** Complex block types, highlight system, chat sidebar, multiple interaction patterns  
**To:** Clean markdown rendering, simple rating, one clear action

## Core Requirements

### 1. Navigation (Minimal Chrome)
```
┌────────────────────────────────────────┐
│  ← Back to Projects    Many Futures    │
└────────────────────────────────────────┘
```
- Fixed header with project context
- Simple back navigation
- Auto-hide on scroll down (optional enhancement)

### 2. Episode Header (Editorial Impact)
```
┌────────────────────────────────────────┐
│         Episode 1 • Aug 13, 2025       │
│                                        │
│     The Regulatory Compliance          │
│            Advantage                   │
│                                        │
│  How boutique consultancies may win    │
│  the AI race through regulation        │
│                                        │
│         7 min read                     │
└────────────────────────────────────────┘
```
- Episode number and date
- Large serif title (balanced text wrapping)
- Subtitle for context
- Reading time estimate

### 3. Content Display (Markdown Only)
For MVP, store episodes as **markdown** in the database:
```markdown
## The Compliance Speed Paradox

While large consultancies struggle with enterprise-wide AI governance, 
boutique firms are moving faster by treating compliance as a design 
constraint rather than a barrier...

### Signals from the Field

**Edinburgh's Hidden Advantage**: The Scottish financial services 
sector's conservative approach...
```

**Rendering Requirements:**
- Use `react-markdown` or similar
- Support headings, bold, italic, lists, blockquotes
- Clean typography (Charter/Georgia for body, Inter for headings)
- Optimal line length (65-70 characters)
- NO custom block types initially

### 4. Typography Specifications
```css
/* Body text */
.prose {
  font-family: 'Charter', 'Georgia', serif;
  font-size: 1.125rem; /* 18px */
  line-height: 1.75;
  color: #1a1a1a;
  max-width: 65ch;
}

/* Headings */
.prose h2 {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 600;
  margin-top: 3rem;
  margin-bottom: 1.5rem;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .prose { font-size: 1rem; line-height: 1.65; }
}
```

### 5. Feedback Collection (Simple)
```
┌────────────────────────────────────────┐
│  How was this episode?                 │
│                                        │
│  [1] [2] [3] [4] [5]                  │
│                                        │
│  [Any specific feedback?_______]       │
│                                        │
│  [Submit]                              │
└────────────────────────────────────────┘
```
- 1-5 star rating (required)
- Optional text feedback
- Store in Feedback table
- Show success message after submission

### 6. Next Episode Teaser (Optional for MVP)
```
┌────────────────────────────────────────┐
│  Next Week: Client Expectation Shifts  │
│                                        │
│  I'll explore how procurement language │
│  is evolving faster than most firms    │
│  realize...                           │
│                                        │
│  Arrives: Tuesday, Aug 20              │
└────────────────────────────────────────┘
```

## What We're NOT Building (Yet)

### Deferred Features
1. **Text Selection/Highlighting** - No highlight toolbar, no persistent highlights
2. **Chat Sidebar** - No chat integration in episode view
3. **Block Types** - No Signal/Framework/Strategic blocks, just markdown
4. **Share Menu** - No social sharing features
5. **Planning Notes** - No "What I'm researching next" section
6. **Citations** - No formal citation system (can use markdown links)
7. **Reading Progress** - No scroll tracking or bookmarks

## Technical Implementation

### Database Schema (Simplified)
```typescript
// Episode table
{
  id: string,
  projectId: string,
  title: string,
  subtitle: string,
  content: string, // Markdown text
  sequence: number, // Episode 1, 2, 3...
  readingMinutes: number,
  publishedAt: Date,
  status: 'DRAFT' | 'PUBLISHED'
}

// Feedback table  
{
  id: string,
  episodeId: string,
  userId: string,
  rating: number, // 1-5
  comment?: string,
  createdAt: Date
}
```

### React Component Structure
```tsx
// app/episodes/[id]/page.tsx
export default async function EpisodePage({ params }) {
  const episode = await getEpisode(params.id);
  
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <article className="max-w-3xl mx-auto px-8 py-16">
        <EpisodeHeader 
          number={episode.sequence}
          title={episode.title}
          subtitle={episode.subtitle}
          date={episode.publishedAt}
          readingTime={episode.readingMinutes}
        />
        <EpisodeContent markdown={episode.content} />
        <FeedbackForm episodeId={episode.id} />
      </article>
    </div>
  );
}
```

### Markdown Rendering
```tsx
// components/EpisodeContent.tsx
import ReactMarkdown from 'react-markdown';

export function EpisodeContent({ markdown }) {
  return (
    <div className="prose prose-lg max-w-none">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
```

## Success Metrics

### Must Have (Launch Blockers)
- [ ] Episodes render cleanly on mobile and desktop
- [ ] Markdown formatting works (headings, bold, lists)
- [ ] Feedback submission works
- [ ] Typography is readable and professional
- [ ] Page loads in <2 seconds

### Nice to Have (Post-Launch)
- [ ] Auto-hide navigation on scroll
- [ ] Reading time tracking
- [ ] Social sharing
- [ ] Print stylesheet

## User Journey

1. **Email Notification** → User clicks "Read Episode"
2. **Episode Page Loads** → Clean, focused reading experience
3. **User Reads** → No distractions, beautiful typography
4. **User Rates** → Simple 1-5 rating
5. **Optional Feedback** → Text input for additional thoughts
6. **Confirmation** → Success message, preview of next episode

## Mobile Considerations

### Required
- Responsive typography (16px minimum on mobile)
- Touch-friendly feedback buttons (44x44px minimum)
- Readable line length (no full-width text)
- Fast load time (<3 seconds on 3G)

### Deferred
- Swipe gestures
- Offline reading
- Native app features

## Content Strategy for MVP

### Episode Structure (Markdown)
```markdown
# Episode Title

Introductory paragraph setting context...

## Section 1: The Main Insight

Content explaining the key discovery...

### Supporting Evidence

Details and examples...

## Section 2: What This Means

Implications for your business...

## Looking Ahead

What I'll explore next week...
```

### Writing Guidelines
- 7-10 minute read (1000-1500 words)
- Clear section breaks
- Use **bold** for emphasis, not italics
- Include 2-3 main sections
- End with forward-looking statement

## Implementation Priority

### Phase 1 (Days 1-2)
1. Basic episode page with markdown rendering
2. Typography CSS setup
3. Mobile responsive layout

### Phase 2 (Days 3-4)
4. Feedback form with database storage
5. Episode header with metadata
6. Success/error states

### Phase 3 (Days 5-6)
7. Navigation header
8. Next episode preview
9. Polish and testing

## Risk Mitigation

### Performance Risks
- **Risk:** Large markdown files slow to render
- **Mitigation:** Limit episodes to 2000 words initially

### User Experience Risks
- **Risk:** Plain markdown feels too basic
- **Mitigation:** Focus on exceptional typography and spacing

### Technical Risks
- **Risk:** Markdown parser inconsistencies
- **Mitigation:** Test with various content patterns early

## Definition of Done

An episode reading experience is complete when:
1. User can read a full episode without errors
2. Typography is professional and readable
3. Feedback can be submitted and stored
4. Mobile experience is as good as desktop
5. Page loads quickly (<2 seconds)

---

*Remember: We're building YouTube comments, not YouTube. Ship the simple version first, enhance based on user feedback.*