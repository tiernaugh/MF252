# ADR-020: Episode Reader Architecture

**Status:** Accepted
**Date:** 2025-08-13
**Deciders:** Product, Engineering

## Context

The episode reader is the most important interface in Many Futures - users spend 5-10 minutes reading episodes weekly. It needs to deliver a premium reading experience while supporting interactive features like highlighting, feedback, and source verification.

## Decision

Implement a progressive enhancement architecture:
1. Server-side rendering for fast initial load and SEO
2. Client-side hydration for interactive features
3. Markdown processing with unified/remark pipeline
4. Progressive feature loading (highlights, chat, etc.)

## Consequences

### Positive
- Fast time to first paint (critical for reading)
- SEO-friendly episode content
- Progressive enhancement for advanced features
- Graceful degradation on slower devices

### Negative
- Complex markdown processing pipeline
- Hydration complexity for interactive features
- Need to manage multiple rendering contexts

## Implementation Details

### Markdown Processing Pipeline

```typescript
// Unified pipeline for consistent markdown rendering
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm) // Tables, strikethrough, etc.
  .use(remarkRehype)
  .use(rehypeHighlight) // Code syntax highlighting
  .use(rehypeSanitize) // Security
  .use(rehypeStringify);

// Process with source tracking
async function processEpisodeContent(markdown: string) {
  const result = await processor.process(markdown);
  return {
    html: result.toString(),
    sources: extractSources(markdown),
    readingTime: calculateReadingTime(markdown)
  };
}
```

### Component Architecture

```typescript
// Server Component (page.tsx)
async function EpisodePage({ params }) {
  const episode = await getEpisode(params.id);
  const processed = await processEpisodeContent(episode.content);
  
  return (
    <EpisodeReader
      episode={episode}
      processedContent={processed}
    />
  );
}

// Client Component (EpisodeReader.tsx)
'use client';

function EpisodeReader({ episode, processedContent }) {
  // Progressive enhancement features
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [showChat, setShowChat] = useState(false);
  
  // Scroll behavior for nav hiding
  const scrollDirection = useScrollDirection();
  
  // Text selection for highlighting
  const selection = useTextSelection();
  
  return (
    <article>
      <Navigation hideOnScroll={scrollDirection === 'down'} />
      <Content html={processedContent.html} />
      {selection && <HighlightToolbar />}
      <Feedback />
    </article>
  );
}
```

### Reading Progress Tracking

```typescript
// Track reading progress locally and sync periodically
interface ReadingSession {
  episodeId: string;
  startTime: Date;
  scrollDepth: number;
  timeSpent: number;
  highlights: string[];
  sourcesClicked: string[];
}

function useReadingProgress(episodeId: string) {
  const [session, setSession] = useState<ReadingSession>();
  
  useEffect(() => {
    // Initialize session
    const session = {
      episodeId,
      startTime: new Date(),
      scrollDepth: 0,
      timeSpent: 0,
      highlights: [],
      sourcesClicked: []
    };
    
    // Track scroll depth
    const handleScroll = throttle(() => {
      const depth = calculateScrollDepth();
      session.scrollDepth = Math.max(session.scrollDepth, depth);
    }, 1000);
    
    // Sync periodically
    const syncInterval = setInterval(() => {
      syncReadingSession(session);
    }, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(syncInterval);
      syncReadingSession(session); // Final sync
    };
  }, [episodeId]);
}
```

### Navigation Auto-Hide

```typescript
// Detect scroll direction for navigation behavior
function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [lastScrollY, setLastScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = throttle(() => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? 'down' : 'up';
      
      // Only update if significant scroll (avoid jitter)
      if (Math.abs(scrollY - lastScrollY) > 10) {
        setScrollDirection(direction);
        setLastScrollY(scrollY);
      }
    }, 100);
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  
  return scrollDirection;
}
```

### Source Link Enhancement

```typescript
// Transform markdown links to track source clicks
function enhanceSourceLinks(html: string): string {
  return html.replace(
    /<a href="(.*?)">(.*?)<\/a>/g,
    (match, href, text) => {
      // Add tracking and styling
      return `<a 
        href="${href}"
        class="source-link underline decoration-stone-400 hover:decoration-stone-600"
        data-source="${href}"
        target="_blank"
        rel="noopener noreferrer"
        onClick="trackSourceClick('${href}')"
      >${text}</a>`;
    }
  );
}
```

### Feedback Collection

```typescript
// Non-blocking feedback submission
async function submitFeedback(feedback: EpisodeFeedback) {
  // Optimistic UI update
  showThankYou();
  
  // Background submission
  try {
    await fetch('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  } catch (error) {
    // Don't block user, log for monitoring
    console.error('Feedback submission failed', error);
  }
}
```

### Performance Optimizations

1. **Critical CSS**: Inline above-the-fold styles
2. **Font Loading**: Preload serif font for title
3. **Image Optimization**: Next.js Image component
4. **Code Splitting**: Lazy load interactive features
5. **Service Worker**: Cache episodes for offline

### State Management

```typescript
// Zustand store for reader features
interface ReaderStore {
  // Highlights
  highlights: Highlight[];
  addHighlight: (text: string) => void;
  removeHighlight: (id: string) => void;
  
  // Reading state
  scrollDepth: number;
  updateScrollDepth: (depth: number) => void;
  
  // UI state
  isNavVisible: boolean;
  setNavVisible: (visible: boolean) => void;
  
  // Feedback
  feedback: { rating?: number; text?: string };
  setFeedback: (feedback: Partial<Feedback>) => void;
}
```

## Alternatives Considered

1. **Full Client-Side**: Rejected due to SEO and initial load performance
2. **Static Generation**: Rejected as episodes have dynamic elements
3. **PDF Generation**: Considered for future export feature
4. **Native App Reader**: Future consideration for mobile apps

## Security Considerations

- Sanitize all markdown content to prevent XSS
- Validate source URLs before rendering
- Rate limit feedback submissions
- Protect against content injection

## Monitoring

- Track Core Web Vitals (LCP, FID, CLS)
- Monitor reading completion rates
- Track source link clicks
- Measure feedback submission rates

## References

- Episode Reader PRD
- Many Futures Design System
- Content Security Policy requirements
- WCAG 2.1 AA compliance guidelines