# Editorial Hero Design System

**Status:** Active • **Version:** 1.0 • **Last Updated:** 2025-01-09

This document codifies the Editorial Hero design pattern and supporting systems established through the Project Page redesign. These patterns create magazine-quality presentation that elevates content over interface chrome.

---

## 1. Design Philosophy

### Core Tenets
- **Content Dominance**: Content becomes the hero, not the interface wrapper
- **Editorial Confidence**: Magazine-quality presentation with premium typography
- **Calm Sophistication**: Visual interest through typography and space, not chrome
- **Purposeful Motion**: Subtle animation enhances without disrupting reading flow

### Apple News DNA
Inspired by Apple News's approach to content presentation:
- Large, confident typography for article titles
- Pull quotes as immediate value hooks
- Minimized interface chrome in service of content
- Premium spatial design with generous white space

---

## 2. Typography System

### Font Strategy
Strategic mixing of serif and sans-serif creates editorial sophistication while maintaining functional clarity.

#### Font Assignments
- **Serif (Lora/Georgia)**: Episode titles, pull quotes, article headers, editorial content
- **Sans-Serif (Inter/System)**: UI elements, metadata, navigation, form labels, body text

### Typography Scale
```
Editorial Content (Serif):
- Episode/Content Titles: text-4xl md:text-5xl font-serif font-bold
- Section Headers: text-2xl md:text-3xl font-serif font-semibold  
- Pull Quotes: text-xl md:text-2xl font-serif italic
- Emphasis Content: font-serif when highlighting key concepts

Interface Content (Sans-Serif):
- Navigation: text-sm md:text-base font-sans
- Metadata: text-xs uppercase tracking-wider font-sans
- Body Text: text-base md:text-lg font-sans leading-relaxed
- Form Elements: text-sm font-sans
- Captions: text-sm text-gray-600 font-sans
```

### Text Balancing
Apply `[text-wrap:balance] max-w-[20ch]` to large headings to prevent widow words and create visually pleasing line breaks.

---

## 3. Visual Hierarchy Rules

### Editorial Hero Structure
1. **Minimized Header** (40px avatar, inline metadata, single line)
2. **Content Hero** (Large serif title, pull quote, description)
3. **Supporting Content** (Secondary information, muted treatment)
4. **Tertiary Elements** (Previous content, navigation aids)

### Header Minimization Pattern
```typescript
<header className="flex items-center justify-between mb-12">
  <div className="flex items-center gap-3">
    <AvatarOrb size={40} />
    <div>
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="text-xs uppercase tracking-wider text-gray-500">
        {metadata}
      </p>
    </div>
  </div>
  <Actions />
</header>
```

### Content Hero Pattern
```typescript
<article className="animate-fade-in-up">
  {/* Metadata line */}
  <div className="flex items-center gap-4 mb-8">
    <span className="text-xs uppercase tracking-wider text-gray-500">
      Episode 4
    </span>
    <span className="w-1 h-1 bg-gray-300 rounded-full" />
    <span className="text-xs uppercase tracking-wider text-gray-500">
      15 min read
    </span>
  </div>
  
  {/* Hero title */}
  <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 leading-tight mb-6 [text-wrap:balance] max-w-[20ch]">
    {title}
  </h2>
  
  {/* Pull quote as value hook */}
  <blockquote className="border-l-4 border-gray-900 pl-6 py-4 mb-8">
    <p className="text-xl md:text-2xl font-serif italic text-gray-800 leading-relaxed">
      {pullQuote}
    </p>
  </blockquote>
  
  {/* Description */}
  <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-3xl">
    {description}
  </p>
  
  {/* CTA */}
  <button className="group inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
    Read episode
    <span className="group-hover:translate-x-1 transition-transform">→</span>
  </button>
</article>
```

---

## 4. Spatial Design System

### Layout Constraints
- **Content Width**: `max-w-4xl` for editorial content (optimal reading experience)
- **Dashboard Width**: `max-w-5xl` or `max-w-6xl` for functional interfaces
- **Section Spacing**: 16-unit vertical margins (`my-16`) between major content areas
- **Content Padding**: Generous internal spacing (`p-8` to `p-12` for major elements)

### Section Dividers
Use gradient lines for elegant content separation:
```css
.section-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, theme(colors.gray.200), transparent);
  margin: 4rem 0; /* my-16 */
}
```

### Breathing Room Guidelines
- **Primary Content**: Generous spacing, minimal density
- **Secondary Content**: Reduced spacing but still comfortable
- **Tertiary Content**: Compact but not cramped
- **White Space**: Use absence of content as design element

---

## 5. Animation & Motion Standards

### Animation Philosophy
Motion should feel purposeful, not decorative—reinforcing content hierarchy and user intent while never disrupting reading flow.

### CSS Keyframes
```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in { 
  animation: fade-in 0.5s ease-out both; 
}

.animate-fade-in-up { 
  animation: fade-in-up 0.6s ease-out both; 
}
```

### Timing Standards
- **Page Load**: 0.5-0.6s duration with ease-out curves
- **Staggered Content**: 0.2s increments for logical content flow
- **Microinteractions**: 300ms transitions for hover states
- **Number Animations**: 1.5s duration for count-up effects

### Staggered Reveal Pattern
```typescript
<header className="animate-fade-in">
<main className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
<aside className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
<footer className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
```

### Microinteraction Patterns
```css
/* Button lift effect */
.editorial-button {
  transition: all 300ms ease;
}
.editorial-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}

/* Arrow translation */
.arrow-icon {
  transition: transform 300ms ease;
}
.group:hover .arrow-icon {
  transform: translateX(4px);
}
```

### Accessibility
```css
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in,
  .animate-fade-in-up {
    animation: none;
  }
  
  * {
    transition-duration: 0.01ms !important;
  }
}
```

---

## 6. Color & Visual Treatment

### Background Strategy
- **Editorial Pages**: Subtle gradient `bg-gradient-to-b from-gray-50 to-white`
- **Functional Pages**: Clean white or light gray backgrounds
- **Content Highlight**: Very subtle gradients for visual depth without distraction

### Border & Shadow Treatment
- **Cards**: Flat by default (`border border-gray-200`), shadow on hover only
- **Editorial Elements**: Minimal borders, focus on typography and space
- **Interactive Feedback**: Subtle shadow appearance on hover (`hover:shadow-sm`)

### Status & Semantic Colors
- **Active States**: Green accents (`bg-green-400`, `text-green-700`)
- **Paused/Muted**: Gray treatment throughout
- **Editorial Accent**: Thin black border for pull quotes (`border-l-4 border-gray-900`)

---

## 7. Component Patterns

### Number Animation Component
```typescript
function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [target, duration]);
  
  return <span>{count}</span>;
}
```

### Metadata Separator Pattern
```typescript
<div className="flex items-center gap-4">
  <span className="text-xs uppercase tracking-wider text-gray-500">
    Episode 4
  </span>
  <span className="w-1 h-1 bg-gray-300 rounded-full" />
  <span className="text-xs uppercase tracking-wider text-gray-500">
    15 min read
  </span>
</div>
```

### Section Header Pattern
```typescript
<h3 className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-6">
  Coming Sunday
</h3>
```

---

## 8. Usage Guidelines

### When to Use Editorial Hero
- **Content-Heavy Pages**: Project overview, episode details, article presentation
- **Primary Content**: When content should dominate over navigation/UI
- **Premium Positioning**: Surfaces requiring editorial credibility and sophistication
- **Reading Experiences**: Long-form content that benefits from magazine treatment

### When NOT to Use
- **Dense Dashboards**: Complex data tables, multi-column layouts
- **Quick Navigation**: Index pages, search results, administrative interfaces
- **Functional Tools**: Settings, configuration, utility pages
- **High-Frequency Interactions**: Interfaces used repeatedly throughout the day

### Responsive Considerations
- **Mobile Adaptation**: Reduce type scales appropriately but maintain hierarchy
- **Touch Targets**: Ensure interactive elements meet 44px minimum touch target
- **Content Flow**: Maintain logical reading order across screen sizes
- **Performance**: Consider reduced motion and lighter animations on mobile

---

## 9. Implementation Checklist

### Typography
- [ ] Serif fonts loaded for editorial content
- [ ] Sans-serif fonts for UI elements
- [ ] Text balancing applied to large headings
- [ ] Proper scale hierarchy implemented

### Layout
- [ ] Content width constrained appropriately
- [ ] Generous section spacing (my-16)
- [ ] Gradient dividers between major sections
- [ ] Header minimized relative to content

### Animation
- [ ] Staggered fade-in animations implemented
- [ ] Microinteractions on interactive elements
- [ ] Number counting animations where appropriate
- [ ] Reduced motion support included

### Accessibility
- [ ] WCAG AA color contrast maintained
- [ ] Proper heading hierarchy
- [ ] Focus states clearly visible
- [ ] Screen reader considerations
- [ ] Keyboard navigation support

---

## 10. Evolution & Maintenance

### Pattern Extensions
This system can be extended to:
- Episode detail pages
- Article reading experiences
- Any content-first interface requiring editorial treatment
- Future premium surfaces

### Performance Monitoring
- Monitor animation performance across devices
- Track Time to Interactive (TTI) metrics
- Ensure 60fps animation targets met
- Consider battery impact on mobile devices

### User Testing Focus Areas
- Content hierarchy clarity
- Reading flow and comprehension
- Animation preference and accessibility
- Premium brand perception validation

---

**References:**
- Project Overview Prototype: `many-futures-prototype-v4/src/views/ProjectOverview.tsx`
- Animation Styles: `many-futures-prototype-v4/src/index.css`
- Decisions Log: `docs/01 Projects/prototype-mature-experience/decisions.md` (Section 24)
