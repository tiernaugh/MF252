# Many Futures Design Language

**Status:** Living Document  
**Last Updated:** 2025-08-13  
**Purpose:** Maintain consistency across the product as we iterate

## Core Principles

### 1. Editorial Intelligence
Many Futures should feel like a premium publication, not a SaaS dashboard. We're creating a reading experience for strategic thinkers, not another analytics tool.

### 2. Quiet Confidence
The interface should get out of the way. No loud CTAs, no aggressive upsells, no notification badges competing for attention. The content is the hero.

### 3. Progressive Disclosure
Show what's needed, when it's needed. Don't overwhelm new users with features they won't use for weeks. Start simple, reveal complexity.

### 4. Respect for Time
Every interaction should feel worthwhile. If something takes 7 minutes to read, it should deliver 7 minutes of value. No padding, no fluff.

## Visual Language

### Color Philosophy
We use a **restrained palette** centered on stone tones. Color is functional, not decorative.

```
Primary Palette:
- Stone-50:  Background canvas (off-white)
- Stone-100: Secondary backgrounds
- Stone-200: Borders, dividers
- Stone-600: Body text
- Stone-900: Headlines, primary text

Accent Colors (Sparingly):
- Green-500: Active status (projects running)
- Stone-300: Paused status (projects paused)
- Blue-600: Links (only when needed)
- Red-500: Errors (rare, we prevent rather than alert)
```

### Typography Hierarchy
Clear hierarchy without being heavy-handed. Let the content breathe.

```
Headings:
- H1: text-3xl font-bold (Page titles - rare)
- H2: text-xl font-semibold (Section headers)
- H3: text-lg font-medium (Card titles)

Body:
- Large: text-base leading-relaxed (Episode content)
- Regular: text-sm (Metadata, descriptions)
- Small: text-xs (Timestamps, hints)
```

### Spacing System
Generous whitespace creates premium feel. When in doubt, add more space.

```
Component Spacing:
- Cards: p-8 (Generous internal padding)
- Sections: space-y-6 or gap-8 (Clear separation)
- Inline: space-x-2 to space-x-4 (Comfortable but connected)
```

### Component Patterns

#### Cards
- White background on stone-50 canvas
- Subtle border (border-stone-200)
- Hover: shadow-lg with slight lift (-translate-y-0.5)
- Transition: 300ms for smooth interactions

#### Status Indicators
- Small colored dots, not badges (unless prominence needed)
- Position: top-right of cards
- Green = Active, Gray = Paused

#### Avatars
- Project initials in circles (2 letters max)
- Gradient background for active projects
- Flat gray for paused projects
- Size: w-12 h-12 for cards

## Interaction Patterns

### Navigation
- **Fixed top nav**: Clean, minimal, persistent
- **No sidebar**: Reduces complexity, maintains focus
- **Breadcrumbs**: Only when deep in hierarchy

### Filtering & Search
- **Search first**: Prominent search before filters
- **Pill filters**: Rounded, toggle between states
- **Sort dropdown**: Simple select, not complex controls

### Feedback
- **Optimistic updates**: Update UI immediately
- **Subtle confirmations**: Brief success states
- **Inline errors**: Fix problems where they occur

### Loading States
- **Skeleton screens**: Show structure while loading
- **Progressive enhancement**: Show what's ready
- **No spinners**: Unless absolutely necessary

## Content Guidelines

### Voice & Tone
- **Clear, not clever**: Straightforward labels
- **Professional, not corporate**: Human but serious
- **Confident, not arrogant**: Know our value

### Microcopy Examples
```
Good:
- "Next episode: 20 Aug 2025"
- "3 projects • 2 active"
- "No projects found"

Avoid:
- "Your next awesome episode drops on..."
- "You have 3 amazing projects!"
- "Oops! Nothing here yet! 🎉"
```

### Empty States
- State the fact clearly
- Offer the next action
- No apologizing or excessive friendliness

## Motion & Animation

### Principles
- **Purposeful**: Motion should clarify, not decorate
- **Subtle**: 200-300ms transitions
- **Natural**: Ease functions, not linear
- **Consistent**: Same timings across similar actions

### Common Animations
```css
/* Hover states */
transition: all 300ms ease;
transform: translateY(-2px);

/* Focus states */
transition: box-shadow 200ms ease;

/* Page transitions */
Instant navigation (no fade between pages)
```

## Responsive Behavior

### Breakpoints
- **Mobile**: Full width cards, stack everything
- **Tablet** (md): 2-column grids appear
- **Desktop** (lg): Full layout, optimal reading width

### Content Priority
1. Mobile: Only essential info in cards
2. Tablet: Add metadata
3. Desktop: Full experience with all details

## What We're NOT Doing

### Avoid These Patterns
- ❌ Dark mode (not MVP priority)
- ❌ Animated illustrations
- ❌ Gradient backgrounds
- ❌ Multiple font families
- ❌ Icon-heavy interfaces
- ❌ Notification dots/badges
- ❌ Slide-out panels
- ❌ Modal dialogs (prefer inline)
- ❌ Toast notifications (prefer inline)

### Design Debt to Address Later
- Enhanced mobile experience
- Keyboard shortcuts
- Advanced filtering
- Data visualizations
- Rich text formatting in episodes

## Component Inventory

### Current Components (Keep Consistent)
1. **Project Card**: Avatar, title, description, metadata
2. **Episode Reader**: Typography-focused, feedback stars
3. **Navigation**: Logo, nav links, org/user context
4. **Search Bar**: Icon, input, subtle border
5. **Filter Pills**: Rounded, toggle states
6. **Buttons**: Primary (dark), Secondary (outline)

### Planned Components (Future)
- Payment forms
- Settings panels
- Admin dashboards
- Email templates

## Decision Log

### Why Stone Colors?
- Premium without being cold
- Professional without being boring
- Distinctive from typical blue SaaS
- Lets content stand out

### Why No Sidebar?
- Most users have 1-5 projects (not 50)
- Reduces cognitive load
- More space for content
- Cleaner mobile experience

### Why 2-Column Grid?
- Optimal for 3-6 projects (our sweet spot)
- Better than 3 columns on most screens
- Each card gets breathing room
- Natural reading flow

### Why Off-Gray Background?
- Creates depth without shadows
- Defines content areas clearly
- Reduces eye strain
- Premium publication feel

## Usage Examples

### Creating a New Page
```tsx
// Start with the container
<div className="min-h-screen bg-stone-50">
  {/* Sticky header if needed */}
  <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-stone-200">
    ...
  </header>
  
  {/* Content wrapper */}
  <div className="max-w-6xl mx-auto px-6 py-6">
    {/* Your content */}
  </div>
</div>
```

### Creating a Card
```tsx
<Card className="bg-white border-stone-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
  <CardContent className="p-8">
    {/* Generous padding, clear hierarchy */}
  </CardContent>
</Card>
```

## Maintenance Notes

This document should evolve as we:
1. User test and get feedback
2. Add new features
3. Discover what resonates
4. Learn what confuses

Regular reviews: After each major feature or user feedback session.

---

*Remember: Design serves the mission. We're helping people think better about the future, not impressing them with our interface.*